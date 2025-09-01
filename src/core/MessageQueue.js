/**
 * CodeFortify Message Queue
 *
 * Priority-based message queuing system for IDE notifications with deduplication and throttling
 */

import { EventEmitter } from 'events';
import { EventSchema, PRIORITY_LEVELS } from './EventTypes.js';

export class MessageQueue extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxSize: config.maxSize || 1000,
      processInterval: config.processInterval || 100, // ms
      throttleWindow: config.throttleWindow || 1000, // ms
      maxMessagesPerWindow: config.maxMessagesPerWindow || 10,
      deduplicationEnabled: config.deduplicationEnabled !== false,
      deduplicationWindow: config.deduplicationWindow || 5000, // ms
      priorityWeights: {
        [PRIORITY_LEVELS.CRITICAL]: 100,
        [PRIORITY_LEVELS.HIGH]: 75,
        [PRIORITY_LEVELS.MEDIUM]: 50,
        [PRIORITY_LEVELS.LOW]: 25
      },
      ...config
    };

    this.queue = [];
    this.processing = false;
    this.processTimer = null;
    this.throttleMap = new Map(); // clientId -> timestamps
    this.deduplicationCache = new Map(); // hash -> timestamp
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalDropped: 0,
      totalDeduplicated: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Add message to queue
   */
  enqueue(message, clientId = 'default', options = {}) {
    try {
      // Validate message
      EventSchema.validate(message);

      // Check queue size limit
      if (this.queue.length >= this.config.maxSize) {
        this.dropOldestLowPriorityMessage();
      }

      // Apply deduplication
      if (this.config.deduplicationEnabled && this.isDuplicate(message)) {
        this.stats.totalDeduplicated++;
        this.emit('message:deduplicated', { message, clientId });
        return false;
      }

      // Apply throttling
      if (this.isThrottled(clientId)) {
        this.stats.totalDropped++;
        this.emit('message:throttled', { message, clientId });
        return false;
      }

      // Create queue entry
      const queueEntry = {
        id: this.generateMessageId(),
        message,
        clientId,
        priority: message.priority || PRIORITY_LEVELS.LOW,
        timestamp: new Date(),
        retries: 0,
        maxRetries: options.maxRetries || 3,
        metadata: options.metadata || {}
      };

      // Insert based on priority
      this.insertByPriority(queueEntry);

      // Update stats
      this.stats.totalQueued++;

      // Update deduplication cache
      if (this.config.deduplicationEnabled) {
        this.updateDeduplicationCache(message);
      }

      // Start processing if not already running
      this.startProcessing();

      this.emit('message:enqueued', { entry: queueEntry });
      return true;

    } catch (error) {
      this.emit('error', new Error(`Failed to enqueue message: ${error.message}`));
      return false;
    }
  }

  /**
   * Process messages from queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const startTime = Date.now();

    try {
      const batch = this.getBatchForProcessing();

      if (batch.length === 0) {
        this.processing = false;
        return;
      }

      // Process batch concurrently
      const promises = batch.map(entry => this.processMessage(entry));
      const results = await Promise.allSettled(promises);

      // Handle results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const entry = batch[i];

        if (result.status === 'fulfilled' && result.value) {
          // Message processed successfully
          this.removeFromQueue(entry.id);
          this.stats.totalProcessed++;
          this.emit('message:processed', { entry });
        } else {
          // Message failed to process
          this.handleProcessingFailure(entry, result.reason);
        }
      }

      // Update processing time stats
      const processingTime = Date.now() - startTime;
      this.updateProcessingTimeStats(processingTime);

    } catch (error) {
      this.emit('error', new Error(`Queue processing error: ${error.message}`));
    } finally {
      this.processing = false;

      // Continue processing if there are more messages
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), this.config.processInterval);
      }
    }
  }

  /**
   * Process individual message
   */
  async processMessage(entry) {
    try {
      // Emit processing event
      this.emit('message:processing', { entry });

      // Simulate processing (in real implementation, this would send to clients)
      await new Promise(resolve => setTimeout(resolve, 10));

      return true;
    } catch (error) {
      throw new Error(`Failed to process message ${entry.id}: ${error.message}`);
    }
  }

  /**
   * Get batch of messages for processing
   */
  getBatchForProcessing() {
    const batchSize = Math.min(10, this.queue.length);
    return this.queue.slice(0, batchSize);
  }

  /**
   * Insert message by priority
   */
  insertByPriority(entry) {
    const weight = this.config.priorityWeights[entry.priority] || 0;

    // Find insertion point
    let insertIndex = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const existingWeight = this.config.priorityWeights[this.queue[i].priority] || 0;
      if (weight > existingWeight) {
        break;
      }
      insertIndex++;
    }

    this.queue.splice(insertIndex, 0, entry);
  }

  /**
   * Check if message is duplicate
   */
  isDuplicate(message) {
    const hash = this.getMessageHash(message);
    const cached = this.deduplicationCache.get(hash);

    if (!cached) {
      return false;
    }

    const age = Date.now() - cached;
    if (age > this.config.deduplicationWindow) {
      this.deduplicationCache.delete(hash);
      return false;
    }

    return true;
  }

  /**
   * Update deduplication cache
   */
  updateDeduplicationCache(message) {
    const hash = this.getMessageHash(message);
    this.deduplicationCache.set(hash, Date.now());

    // Clean up old entries
    this.cleanupDeduplicationCache();
  }

  /**
   * Generate message hash for deduplication
   */
  getMessageHash(message) {
    // Create hash based on message type, content, and context
    const content = {
      type: message.type,
      message: message.data?.message,
      phase: message.data?.phase,
      category: message.data?.category
    };

    return JSON.stringify(content);
  }

  /**
   * Check if client is throttled
   */
  isThrottled(clientId) {
    const now = Date.now();
    const windowStart = now - this.config.throttleWindow;

    if (!this.throttleMap.has(clientId)) {
      this.throttleMap.set(clientId, []);
    }

    const timestamps = this.throttleMap.get(clientId);

    // Remove old timestamps
    const recentTimestamps = timestamps.filter(ts => ts > windowStart);

    if (recentTimestamps.length >= this.config.maxMessagesPerWindow) {
      return true;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.throttleMap.set(clientId, recentTimestamps);

    return false;
  }

  /**
   * Handle processing failure
   */
  handleProcessingFailure(entry, error) {
    entry.retries++;

    if (entry.retries >= entry.maxRetries) {
      // Max retries reached, drop message
      this.removeFromQueue(entry.id);
      this.stats.totalDropped++;
      this.emit('message:dropped', { entry, error });
    } else {
      // Retry later - move to end of queue
      this.removeFromQueue(entry.id);
      this.queue.push(entry);
      this.emit('message:retry', { entry, error, attempt: entry.retries });
    }
  }

  /**
   * Drop oldest low priority message to make space
   */
  dropOldestLowPriorityMessage() {
    // Find oldest low priority message
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const entry = this.queue[i];
      if (entry.priority === PRIORITY_LEVELS.LOW) {
        this.queue.splice(i, 1);
        this.stats.totalDropped++;
        this.emit('message:dropped', { entry, reason: 'queue_full' });
        return;
      }
    }

    // If no low priority messages, drop oldest message
    if (this.queue.length > 0) {
      const entry = this.queue.pop();
      this.stats.totalDropped++;
      this.emit('message:dropped', { entry, reason: 'queue_full' });
    }
  }

  /**
   * Remove message from queue by ID
   */
  removeFromQueue(messageId) {
    const index = this.queue.findIndex(entry => entry.id === messageId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Start processing timer
   */
  startProcessing() {
    if (this.processTimer) {
      return;
    }

    this.processTimer = setInterval(() => {
      this.processQueue();
    }, this.config.processInterval);
  }

  /**
   * Stop processing timer
   */
  stopProcessing() {
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }
  }

  /**
   * Clean up old deduplication cache entries
   */
  cleanupDeduplicationCache() {
    const cutoff = Date.now() - this.config.deduplicationWindow;

    for (const [hash, timestamp] of this.deduplicationCache.entries()) {
      if (timestamp < cutoff) {
        this.deduplicationCache.delete(hash);
      }
    }
  }

  /**
   * Update processing time statistics
   */
  updateProcessingTimeStats(processingTime) {
    // Simple moving average
    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * 0.9) + (processingTime * 0.1);
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentQueueSize: this.queue.length,
      processing: this.processing,
      deduplicationCacheSize: this.deduplicationCache.size,
      throttleMapSize: this.throttleMap.size
    };
  }

  /**
   * Get queue contents (for debugging)
   */
  getQueueContents() {
    return this.queue.map(entry => ({
      id: entry.id,
      type: entry.message.type,
      priority: entry.priority,
      clientId: entry.clientId,
      timestamp: entry.timestamp.toISOString(),
      retries: entry.retries
    }));
  }

  /**
   * Clear queue
   */
  clear() {
    const clearedCount = this.queue.length;
    this.queue = [];
    this.emit('queue:cleared', { clearedCount });
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.stopProcessing();
    this.emit('queue:paused');
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.startProcessing();
    this.emit('queue:resumed');
  }

  /**
   * Shutdown queue gracefully
   */
  async shutdown() {
    this.stopProcessing();

    // Process remaining messages
    if (this.queue.length > 0) {
      await this.processQueue();
    }

    this.clear();
    this.deduplicationCache.clear();
    this.throttleMap.clear();

    this.emit('queue:shutdown');
  }
}

export default MessageQueue;