/**
 * CodeFortify Real-Time Event Emitter
 *
 * WebSocket-based event emitter for real-time status updates to IDE extensions
 */

import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import { EventSchema, EventCreators, EventFilters, EVENT_TYPES, PRIORITY_LEVELS } from './EventTypes.js';

/**


 * RealtimeEventEmitter class implementation


 *


 * Provides functionality for realtimeeventemitter operations


 */


/**


 * RealtimeEventEmitter class implementation


 *


 * Provides functionality for realtimeeventemitter operations


 */


export class RealtimeEventEmitter extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      port: config.port || 8765,
      maxConnections: config.maxConnections || 10,
      bufferSize: config.bufferSize || 1000,
      reconnectDelay: config.reconnectDelay || 5000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageTimeout: config.messageTimeout || 10000,
      ...config
    };

    this.server = null;
    this.clients = new Map();
    this.eventBuffer = [];
    this.sessionId = this.generateSessionId();
    this.isRunning = false;
    this.heartbeatTimer = null;

    // Rate limiting
    this.rateLimitMap = new Map();
    this.rateLimitWindow = 1000; // 1 second
    this.rateLimitMax = 50; // Max 50 events per second per client
  }

  /**
   * Initialize the event emitter (alias for start)
   */
  async initialize() {
    return this.start();
  }

  /**
   * Start the WebSocket server
   */
  async start() {  /**
   * Performs the specified operation
   * @param {boolean} this.isRunning
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.isRunning
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.isRunning) {
      throw new Error('RealtimeEventEmitter is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = new WebSocketServer({
          port: this.config.port,
          maxPayload: 16 * 1024 * 1024 // 16MB max payload
        });

        this.server.on('connection', this.handleConnection.bind(this));
        this.server.on('error', (error) => {          /**
   * Performs the specified operation
   * @param {any} error.code - Optional parameter
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} error.code - Optional parameter
   * @returns {any} The operation result
   */

          if (error.code === 'EADDRINUSE') {
            // Try next available port
            this.config.port = this.config.port + 1;
            // LOG: `Port ${this.config.port - 1} in use, trying port ${this.config.port}...`
            this.server = new WebSocketServer({
              port: this.config.port,
              maxPayload: 16 * 1024 * 1024
            });
            this.server.on('connection', this.handleConnection.bind(this));
            this.server.on('error', reject);
            this.server.on('listening', () => {
              // LOG: `✅ WebSocket server started on port ${this.config.port}`
              this.isRunning = true;
              resolve();
            });
            return;
          }
          this.emit('error', error);
          reject(error);
        });

        this.server.on('listening', () => {
          this.isRunning = true;
          this.startHeartbeat();

          // Send startup event
          this.broadcastEvent(
            EventCreators.statusUpdate(
              'idle',
              0,
              'CodeFortify real-time system started',
              this.sessionId
            )
          );

          resolve();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  async stop() {  /**
   * Performs the specified operation
   * @param {boolean} !this.isRunning
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.isRunning
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.isRunning) {return;}

    // Send shutdown event
    this.broadcastEvent(
      EventCreators.statusUpdate(
        'idle',
        0,
        'CodeFortify real-time system stopping',
        this.sessionId
      )
    );

    // Clean up heartbeat    /**
   * Performs the specified operation
   * @param {boolean} this.heartbeatTimer
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.heartbeatTimer
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Close all client connections    /**
   * Performs the specified operation
   * @param {number} const [clientId
   * @param {boolean} client] of this.clients
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {number} const [clientId
   * @param {boolean} client] of this.clients
   * @returns {boolean} True if successful, false otherwise
   */

    for (const [clientId, client] of this.clients) {      /**
   * Performs the specified operation
   * @param {any} client.ws.readyState - Optional parameter
   * @returns {string} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} client.ws.readyState - Optional parameter
   * @returns {string} The operation result
   */

      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1000, 'Server shutdown');
      }
    }

    // Close server
    return new Promise((resolve) => {      /**
   * Performs the specified operation
   * @param {boolean} this.server
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} this.server
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          this.clients.clear();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle new WebSocket connections
   */
  handleConnection(ws, request) {
    const clientId = this.generateClientId();
    const clientInfo = {
      ws,
      id: clientId,
      connectedAt: new Date(),
      lastPing: new Date(),
      subscriptions: new Set(),
      filters: {},
      isAlive: true
    };

    // Check connection limits    /**
   * Performs the specified operation
   * @param {boolean} this.clients.size > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.clients.size > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.clients.size >= this.config.maxConnections) {
      ws.close(1008, 'Too many connections');
      return;
    }

    this.clients.set(clientId, clientInfo);

    // Set up WebSocket handlers
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnect(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));
    ws.on('pong', () => this.handlePong(clientId));

    // Send welcome message with buffered events
    this.sendToClient(clientId, EventCreators.statusUpdate(
      'idle',
      0,
      `Connected to CodeFortify (Client: ${clientId})`,
      this.sessionId
    ));

    // Send recent buffered events
    this.sendBufferedEvents(clientId);

    this.emit('client:connected', { clientId, clientInfo });
  }

  /**
   * Handle client messages
   */
  handleMessage(clientId, data) {
    try {
      const client = this.clients.get(clientId);      /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */

      if (!client) {return;}

      // Apply rate limiting
      if (!this.checkRateLimit(clientId)) {
        this.sendToClient(clientId, EventCreators.errorOccurred(
          new Error('Rate limit exceeded'),
          { clientId },
          this.sessionId
        ));
        return;
      }

      const message = JSON.parse(data.toString());      /**
   * Performs the specified operation
   * @param {any} message.type
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} message.type
   * @returns {any} The operation result
   */


      switch (message.type) {
      case 'subscribe':
        this.handleSubscription(clientId, message.data);
        break;
      case 'unsubscribe':
        this.handleUnsubscription(clientId, message.data);
        break;
      case 'set_filters':
        this.handleFilterUpdate(clientId, message.data);
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      case 'get_status':
        this.sendCurrentStatus(clientId);
        break;
      default:
        this.emit('client:message', { clientId, message });
      }

    } catch (error) {
      this.sendToClient(clientId, EventCreators.errorOccurred(
        error,
        { clientId, action: 'message_parsing' },
        this.sessionId
      ));
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);    /**
   * Performs the specified operation
   * @param {any} client
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} client
   * @returns {any} The operation result
   */

    if (client) {
      this.clients.delete(clientId);
      this.rateLimitMap.delete(clientId);
      this.emit('client:disconnected', { clientId });
    }
  }

  /**
   * Handle WebSocket errors
   */
  handleError(clientId, error) {
    this.emit('client:error', { clientId, error });
    this.handleDisconnect(clientId);
  }

  /**
   * Handle pong responses for heartbeat
   */
  handlePong(clientId) {
    const client = this.clients.get(clientId);    /**
   * Performs the specified operation
   * @param {any} client
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} client
   * @returns {any} The operation result
   */

    if (client) {
      client.isAlive = true;
      client.lastPing = new Date();
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcastEvent(event, options = {}) {
    // Validate event
    try {
      EventSchema.validate(event);
    } catch (error) {
      this.emit('error', new Error(`Invalid event: ${error.message}`));
      return;
    }

    // Add to buffer
    this.addToBuffer(event);

    // Send to all clients    /**
   * Performs the specified operation
   * @param {number} const [clientId
   * @param {boolean} client] of this.clients
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {number} const [clientId
   * @param {boolean} client] of this.clients
   * @returns {boolean} True if successful, false otherwise
   */

    for (const [clientId, client] of this.clients) {
      if (this.shouldSendToClient(clientId, event)) {
        this.sendToClient(clientId, event);
      }
    }

    // Emit locally for internal listeners
    this.emit('event:broadcast', event);
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId, event) {
    const client = this.clients.get(clientId);    /**
   * Performs the specified operation
   * @param {any} !client || client.ws.readyState ! - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !client || client.ws.readyState ! - Optional parameter
   * @returns {string} The operation result
   */

    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const message = JSON.stringify(event);
      client.ws.send(message);
      return true;
    } catch (error) {
      this.handleError(clientId, error);
      return false;
    }
  }

  /**
   * Check if event should be sent to client based on subscriptions and filters
   */
  shouldSendToClient(clientId, event) {
    const client = this.clients.get(clientId);    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */

    if (!client) {return false;}

    // Check subscriptions
    if (client.subscriptions.size > 0 && !client.subscriptions.has(event.type)) {
      return false;
    }

    // Apply filters
    const filters = client.filters;    /**
   * Performs the specified operation
   * @param {any} filters.minPriority
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} filters.minPriority
   * @returns {any} The operation result
   */


    if (filters.minPriority) {
      const filtered = EventFilters.byPriority([event], filters.minPriority);      /**
   * Performs the specified operation
   * @param {any} filtered.length - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} filtered.length - Optional parameter
   * @returns {any} The operation result
   */

      if (filtered.length === 0) {return false;}
    }    /**
   * Performs the specified operation
   * @param {any} filters.types && filters.types.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} filters.types && filters.types.length > 0
   * @returns {any} The operation result
   */


    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(event.type)) {return false;}
    }

    return true;
  }

  /**
   * Add event to buffer for new clients
   */
  addToBuffer(event) {
    this.eventBuffer.push(event);

    // Maintain buffer size    /**
   * Performs the specified operation
   * @param {Object} this.eventBuffer.length > this.config.bufferSize
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.eventBuffer.length > this.config.bufferSize
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.eventBuffer.length > this.config.bufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.config.bufferSize);
    }
  }

  /**
   * Send buffered events to newly connected client
   */
  sendBufferedEvents(clientId) {
    const client = this.clients.get(clientId);    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */

    if (!client) {return;}

    // Send last 10 important events
    const recentEvents = this.eventBuffer
      .slice(-50) // Last 50 events
      .filter(event =>
        event.priority === PRIORITY_LEVELS.HIGH ||
        event.priority === PRIORITY_LEVELS.CRITICAL ||
        event.type === EVENT_TYPES.SCORE_UPDATE
      )
      .slice(-10); // Last 10 important events    /**
   * Performs the specified operation
   * @param {any} const event of recentEvents
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const event of recentEvents
   * @returns {any} The operation result
   */


    for (const event of recentEvents) {
      if (this.shouldSendToClient(clientId, event)) {
        this.sendToClient(clientId, event);
      }
    }
  }

  /**
   * Handle client subscription
   */
  handleSubscription(clientId, data) {
    const client = this.clients.get(clientId);    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */

    if (!client) {return;}    /**
   * Performs the specified operation
   * @param {any} data.types
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} data.types
   * @returns {any} The operation result
   */


    if (data.types) {
      data.types.forEach(type => client.subscriptions.add(type));
    }

    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      data: { types: Array.from(client.subscriptions) }
    });
  }

  /**
   * Handle client unsubscription
   */
  handleUnsubscription(clientId, data) {
    const client = this.clients.get(clientId);    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */

    if (!client) {return;}    /**
   * Performs the specified operation
   * @param {any} data.types
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} data.types
   * @returns {any} The operation result
   */


    if (data.types) {
      data.types.forEach(type => client.subscriptions.delete(type));
    }
  }

  /**
   * Handle client filter updates
   */
  handleFilterUpdate(clientId, filters) {
    const client = this.clients.get(clientId);    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !client
   * @returns {any} The operation result
   */

    if (!client) {return;}

    client.filters = { ...client.filters, ...filters };
  }

  /**
   * Send current system status to client
   */
  sendCurrentStatus(clientId) {
    const status = {
      type: 'current_status',
      data: {
        sessionId: this.sessionId,
        connectedClients: this.clients.size,
        bufferSize: this.eventBuffer.length,
        uptime: Date.now() - this.startTime,
        lastEvents: this.eventBuffer.slice(-5)
      }
    };

    this.sendToClient(clientId, status);
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(clientId) {
    const now = Date.now();
    const windowStart = now - this.rateLimitWindow;

    if (!this.rateLimitMap.has(clientId)) {
      this.rateLimitMap.set(clientId, []);
    }

    const requests = this.rateLimitMap.get(clientId);

    // Remove old requests
    const recentRequests = requests.filter(time => time > windowStart);    /**
   * Performs the specified operation
   * @param {any} recentRequests.length > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {any} recentRequests.length > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */


    if (recentRequests.length >= this.rateLimitMax) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimitMap.set(clientId, recentRequests);

    return true;
  }

  /**
   * Start heartbeat to keep connections alive
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {      /**
   * Performs the specified operation
   * @param {number} const [clientId
   * @param {boolean} client] of this.clients
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {number} const [clientId
   * @param {boolean} client] of this.clients
   * @returns {boolean} True if successful, false otherwise
   */

      for (const [clientId, client] of this.clients) {        /**
   * Performs the specified operation
   * @param {boolean} !client.isAlive
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} !client.isAlive
   * @returns {boolean} True if successful, false otherwise
   */

        if (!client.isAlive) {
          client.ws.terminate();
          this.handleDisconnect(clientId);
          continue;
        }

        client.isAlive = false;        /**
   * Performs the specified operation
   * @param {any} client.ws.readyState - Optional parameter
   * @returns {string} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} client.ws.readyState - Optional parameter
   * @returns {string} The operation result
   */

        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      connectedClients: this.clients.size,
      bufferSize: this.eventBuffer.length,
      sessionId: this.sessionId,
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        connectedAt: client.connectedAt,
        subscriptions: Array.from(client.subscriptions),
        filters: client.filters,
        isAlive: client.isAlive
      }))
    };
  }

  /**
   * Convenience methods for common events
   */
  emitAnalysisStart(step) {
    this.broadcastEvent(EventCreators.analysisStart(step, this.sessionId));
  }  /**
   * Performs the specified operation
   * @param {any} step
   * @param {any} progress
   * @param {any} message
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} step
   * @param {any} progress
   * @param {any} message
   * @returns {boolean} True if successful, false otherwise
   */


  emitAnalysisProgress(step, progress, message) {
    this.broadcastEvent(EventCreators.analysisProgress(step, progress, message, this.sessionId));
  }  /**
   * Performs the specified operation
   * @param {any} step
   * @param {any} results
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} step
   * @param {any} results
   * @returns {boolean} True if successful, false otherwise
   */


  emitAnalysisComplete(step, results) {
    this.broadcastEvent(EventCreators.analysisComplete(step, results, this.sessionId));
  }  /**
   * Updates existing data
   * @param {any} newScore
   * @param {any} previousScore
   * @param {any} changes
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @param {any} newScore
   * @param {any} previousScore
   * @param {any} changes
   * @returns {any} The operation result
   */


  emitScoreUpdate(newScore, previousScore, changes) {
    this.broadcastEvent(EventCreators.scoreUpdate(newScore, previousScore, changes, this.sessionId));
  }  /**
   * Updates existing data
   * @param {boolean} phase
   * @param {any} progress
   * @param {any} message
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @param {boolean} phase
   * @param {any} progress
   * @param {any} message
   * @returns {any} The operation result
   */


  emitStatusUpdate(phase, progress, message) {
    this.broadcastEvent(EventCreators.statusUpdate(phase, progress, message, this.sessionId));
  }  /**
   * Performs the specified operation
   * @param {any} error
   * @param {any} context
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} error
   * @param {any} context
   * @returns {any} The operation result
   */


  emitError(error, context) {
    this.broadcastEvent(EventCreators.errorOccurred(error, context, this.sessionId));
  }
}

export default RealtimeEventEmitter;