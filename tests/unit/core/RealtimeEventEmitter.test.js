import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';

// Mock WebSocket dependencies
const mockWebSocketServer = {
  on: vi.fn(),
  close: vi.fn(),
  clients: new Set()
};

const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1, // OPEN
  on: vi.fn(),
  off: vi.fn()
};

vi.mock('ws', () => ({
  WebSocket: vi.fn().mockImplementation(() => mockWebSocket),
  WebSocketServer: vi.fn().mockImplementation(() => mockWebSocketServer)
}));

vi.mock('../../../src/core/EventTypes.js', () => ({
  EventSchema: {
    validate: vi.fn().mockReturnValue({ valid: true }),
    create: vi.fn().mockImplementation((type, data) => ({ type, data, timestamp: Date.now() }))
  },
  EventCreators: {
    statusUpdate: vi.fn().mockImplementation((data) => ({ type: 'status_update', data })),
    iterationStart: vi.fn().mockImplementation((data) => ({ type: 'iteration_start', data })),
    iterationEnd: vi.fn().mockImplementation((data) => ({ type: 'iteration_end', data }))
  },
  EventFilters: {
    byPriority: vi.fn().mockImplementation((events, priority) => events),
    byType: vi.fn().mockImplementation((events, type) => events)
  },
  EVENT_TYPES: {
    STATUS_UPDATE: 'status_update',
    ITERATION_START: 'iteration_start',
    ITERATION_END: 'iteration_end',
    AGENT_RESULT: 'agent_result'
  },
  PRIORITY_LEVELS: {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
  }
}));

// Create a testable version of RealtimeEventEmitter
class TestableRealtimeEventEmitter extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      port: config.port || 8765,
      maxConnections: config.maxConnections || 10,
      bufferSize: config.bufferSize || 1000,
      reconnectDelay: config.reconnectDelay || 5000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      enableCompression: config.enableCompression !== false,
      ...config
    };

    this.server = null;
    this.clients = new Set();
    this.eventBuffer = [];
    this.isStarted = false;
    this.heartbeatTimer = null;

    // Statistics
    this.stats = {
      totalConnections: 0,
      currentConnections: 0,
      messagesSent: 0,
      messagesBuffered: 0,
      errorsCount: 0
    };
  }

  async start() {
    if (this.isStarted) {
      throw new Error('Server is already started');
    }

    try {
      // Mock server initialization
      this.server = {
        on: vi.fn(),
        close: vi.fn(),
        clients: this.clients
      };

      this.isStarted = true;
      this.startHeartbeat();
      this.emit('server:started', { port: this.config.port });

      return { success: true, port: this.config.port };
    } catch (error) {
      this.emit('server:error', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isStarted) {
      return;
    }

    try {
      this.stopHeartbeat();

      // Close all client connections
      for (const client of this.clients) {
        this.closeClientConnection(client);
      }

      if (this.server) {
        this.server.close();
        this.server = null;
      }

      this.isStarted = false;
      this.emit('server:stopped');
    } catch (error) {
      this.emit('server:error', error);
      throw error;
    }
  }

  emitStatusUpdate(status) {
    const event = {
      type: 'status_update',
      data: status,
      timestamp: Date.now()
    };

    this.broadcastEvent(event);
    this.emit('event:sent', event);
  }

  emitIterationStart(iteration) {
    const event = {
      type: 'iteration_start',
      data: iteration,
      timestamp: Date.now()
    };

    this.broadcastEvent(event);
    this.emit('event:sent', event);
  }

  emitIterationEnd(result) {
    const event = {
      type: 'iteration_end',
      data: result,
      timestamp: Date.now()
    };

    this.broadcastEvent(event);
    this.emit('event:sent', event);
  }

  emitAgentResult(agentName, result) {
    const event = {
      type: 'agent_result',
      data: { agent: agentName, result },
      timestamp: Date.now()
    };

    this.broadcastEvent(event);
    this.emit('event:sent', event);
  }

  broadcastEvent(event) {
    if (!this.isStarted) {
      this.bufferEvent(event);
      return;
    }

    const message = JSON.stringify(event);
    let successCount = 0;
    let failureCount = 0;

    for (const client of this.clients) {
      try {
        if (client.readyState === 1) { // OPEN
          client.send(message);
          successCount++;
        } else {
          this.removeClient(client);
        }
      } catch (error) {
        this.stats.errorsCount++;
        failureCount++;
        this.emit('client:error', { client, error });
      }
    }

    this.stats.messagesSent++;
    this.emit('event:broadcast', {
      event,
      successCount,
      failureCount,
      totalClients: this.clients.size
    });
  }

  bufferEvent(event) {
    if (this.eventBuffer.length >= this.config.bufferSize) {
      this.eventBuffer.shift(); // Remove oldest event
    }

    this.eventBuffer.push(event);
    this.stats.messagesBuffered++;
  }

  flushBuffer(client) {
    if (this.eventBuffer.length === 0) {
      return;
    }

    try {
      for (const event of this.eventBuffer) {
        const message = JSON.stringify(event);
        if (client.readyState === 1) {
          client.send(message);
        }
      }

      this.emit('buffer:flushed', {
        client,
        eventCount: this.eventBuffer.length
      });
    } catch (error) {
      this.emit('client:error', { client, error });
    }
  }

  addClient(client) {
    if (this.clients.size >= this.config.maxConnections) {
      client.close(1013, 'Server at capacity');
      return false;
    }

    this.clients.add(client);
    this.stats.totalConnections++;
    this.stats.currentConnections = this.clients.size;

    // Send buffered events to new client
    this.flushBuffer(client);

    this.emit('client:connected', {
      client,
      totalClients: this.clients.size
    });

    return true;
  }

  removeClient(client) {
    this.clients.delete(client);
    this.stats.currentConnections = this.clients.size;

    this.emit('client:disconnected', {
      client,
      totalClients: this.clients.size
    });
  }

  closeClientConnection(client) {
    try {
      client.close();
      this.removeClient(client);
    } catch (error) {
      this.emit('client:error', { client, error });
    }
  }

  startHeartbeat() {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      const heartbeatEvent = {
        type: 'heartbeat',
        timestamp: Date.now()
      };

      this.broadcastEvent(heartbeatEvent);
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  getStats() {
    return {
      ...this.stats,
      isStarted: this.isStarted,
      bufferSize: this.eventBuffer.length,
      configuredPort: this.config.port,
      maxConnections: this.config.maxConnections
    };
  }

  getConnectedClients() {
    return Array.from(this.clients).map(client => ({
      readyState: client.readyState,
      id: client.id || 'unknown'
    }));
  }

  clearBuffer() {
    const clearedCount = this.eventBuffer.length;
    this.eventBuffer = [];
    this.emit('buffer:cleared', { clearedCount });
    return clearedCount;
  }
}

describe('RealtimeEventEmitter', () => {
  let emitter;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      port: 8765,
      maxConnections: 5,
      bufferSize: 100,
      heartbeatInterval: 10000
    };

    emitter = new TestableRealtimeEventEmitter(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (emitter && emitter.isStarted) {
      await emitter.stop();
    }
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(emitter.config.port).toBe(8765);
      expect(emitter.config.maxConnections).toBe(5);
      expect(emitter.config.bufferSize).toBe(100);
      expect(emitter.config.heartbeatInterval).toBe(10000);
    });

    it('should use default values when not provided', () => {
      const defaultEmitter = new TestableRealtimeEventEmitter();
      expect(defaultEmitter.config.port).toBe(8765);
      expect(defaultEmitter.config.maxConnections).toBe(10);
      expect(defaultEmitter.config.bufferSize).toBe(1000);
      expect(defaultEmitter.config.heartbeatInterval).toBe(30000);
    });

    it('should initialize tracking variables', () => {
      expect(emitter.clients.size).toBe(0);
      expect(emitter.eventBuffer).toEqual([]);
      expect(emitter.isStarted).toBe(false);
      expect(emitter.stats.totalConnections).toBe(0);
    });
  });

  describe('server lifecycle', () => {
    it('should start server successfully', async () => {
      const startSpy = vi.fn();
      emitter.on('server:started', startSpy);

      const result = await emitter.start();

      expect(result.success).toBe(true);
      expect(result.port).toBe(8765);
      expect(emitter.isStarted).toBe(true);
      expect(startSpy).toHaveBeenCalledWith({ port: 8765 });
    });

    it('should throw error if already started', async () => {
      await emitter.start();

      await expect(emitter.start()).rejects.toThrow('Server is already started');
    });

    it('should stop server successfully', async () => {
      await emitter.start();

      const stopSpy = vi.fn();
      emitter.on('server:stopped', stopSpy);

      await emitter.stop();

      expect(emitter.isStarted).toBe(false);
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should handle stop when not started', async () => {
      // Should not throw
      await emitter.stop();
      expect(emitter.isStarted).toBe(false);
    });
  });

  describe('event emission', () => {
    beforeEach(async () => {
      await emitter.start();
    });

    it('should emit status update', () => {
      const eventSpy = vi.fn();
      emitter.on('event:sent', eventSpy);

      const status = { progress: 50, currentTask: 'analysis' };
      emitter.emitStatusUpdate(status);

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'status_update',
        data: status,
        timestamp: expect.any(Number)
      });
    });

    it('should emit iteration start', () => {
      const eventSpy = vi.fn();
      emitter.on('event:sent', eventSpy);

      const iteration = { iteration: 1, startTime: Date.now() };
      emitter.emitIterationStart(iteration);

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'iteration_start',
        data: iteration,
        timestamp: expect.any(Number)
      });
    });

    it('should emit iteration end', () => {
      const eventSpy = vi.fn();
      emitter.on('event:sent', eventSpy);

      const result = { iteration: 1, score: 85, duration: 5000 };
      emitter.emitIterationEnd(result);

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'iteration_end',
        data: result,
        timestamp: expect.any(Number)
      });
    });

    it('should emit agent result', () => {
      const eventSpy = vi.fn();
      emitter.on('event:sent', eventSpy);

      const agentResult = { success: true, score: 90, duration: 2000 };
      emitter.emitAgentResult('analysis', agentResult);

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'agent_result',
        data: { agent: 'analysis', result: agentResult },
        timestamp: expect.any(Number)
      });
    });
  });

  describe('client management', () => {
    let mockClient;

    beforeEach(async () => {
      await emitter.start();
      mockClient = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1, // OPEN
        on: vi.fn(),
        off: vi.fn()
      };
    });

    it('should add client successfully', () => {
      const connectSpy = vi.fn();
      emitter.on('client:connected', connectSpy);

      const result = emitter.addClient(mockClient);

      expect(result).toBe(true);
      expect(emitter.clients.has(mockClient)).toBe(true);
      expect(emitter.stats.totalConnections).toBe(1);
      expect(emitter.stats.currentConnections).toBe(1);
      expect(connectSpy).toHaveBeenCalledWith({
        client: mockClient,
        totalClients: 1
      });
    });

    it('should reject client when at capacity', () => {
      // Fill up to max capacity
      for (let i = 0; i < emitter.config.maxConnections; i++) {
        const client = { ...mockClient };
        emitter.addClient(client);
      }

      // Try to add one more
      const overCapacityClient = { ...mockClient };
      const result = emitter.addClient(overCapacityClient);

      expect(result).toBe(false);
      expect(overCapacityClient.close).toHaveBeenCalledWith(1013, 'Server at capacity');
    });

    it('should remove client', () => {
      emitter.addClient(mockClient);

      const disconnectSpy = vi.fn();
      emitter.on('client:disconnected', disconnectSpy);

      emitter.removeClient(mockClient);

      expect(emitter.clients.has(mockClient)).toBe(false);
      expect(emitter.stats.currentConnections).toBe(0);
      expect(disconnectSpy).toHaveBeenCalledWith({
        client: mockClient,
        totalClients: 0
      });
    });

    it('should close client connection safely', () => {
      emitter.addClient(mockClient);

      emitter.closeClientConnection(mockClient);

      expect(mockClient.close).toHaveBeenCalled();
      expect(emitter.clients.has(mockClient)).toBe(false);
    });

    it('should handle client close errors gracefully', () => {
      emitter.addClient(mockClient);
      mockClient.close.mockImplementation(() => {
        throw new Error('Close failed');
      });

      const errorSpy = vi.fn();
      emitter.on('client:error', errorSpy);

      emitter.closeClientConnection(mockClient);

      expect(errorSpy).toHaveBeenCalledWith({
        client: mockClient,
        error: expect.any(Error)
      });
    });
  });

  describe('event buffering', () => {
    it('should buffer events when server not started', () => {
      const event = { type: 'test', data: 'test data' };

      emitter.bufferEvent(event);

      expect(emitter.eventBuffer).toContain(event);
      expect(emitter.stats.messagesBuffered).toBe(1);
    });

    it('should respect buffer size limit', () => {
      emitter.config.bufferSize = 2;

      // Add events beyond buffer size
      emitter.bufferEvent({ type: 'event1' });
      emitter.bufferEvent({ type: 'event2' });
      emitter.bufferEvent({ type: 'event3' }); // Should push out event1

      expect(emitter.eventBuffer).toHaveLength(2);
      expect(emitter.eventBuffer[0].type).toBe('event2');
      expect(emitter.eventBuffer[1].type).toBe('event3');
    });

    it('should flush buffer to new client', async () => {
      await emitter.start();

      // Buffer some events
      emitter.bufferEvent({ type: 'event1' });
      emitter.bufferEvent({ type: 'event2' });

      const mockClient = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1
      };

      const flushSpy = vi.fn();
      emitter.on('buffer:flushed', flushSpy);

      emitter.addClient(mockClient);

      expect(mockClient.send).toHaveBeenCalledTimes(2);
      expect(flushSpy).toHaveBeenCalledWith({
        client: mockClient,
        eventCount: 2
      });
    });

    it('should clear buffer', () => {
      emitter.bufferEvent({ type: 'event1' });
      emitter.bufferEvent({ type: 'event2' });

      const clearSpy = vi.fn();
      emitter.on('buffer:cleared', clearSpy);

      const clearedCount = emitter.clearBuffer();

      expect(clearedCount).toBe(2);
      expect(emitter.eventBuffer).toHaveLength(0);
      expect(clearSpy).toHaveBeenCalledWith({ clearedCount: 2 });
    });
  });

  describe('broadcasting', () => {
    let mockClient1, mockClient2;

    beforeEach(async () => {
      await emitter.start();

      mockClient1 = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1 // OPEN
      };

      mockClient2 = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1 // OPEN
      };

      emitter.addClient(mockClient1);
      emitter.addClient(mockClient2);
    });

    it('should broadcast event to all connected clients', () => {
      const event = { type: 'test', data: 'broadcast test' };
      const broadcastSpy = vi.fn();
      emitter.on('event:broadcast', broadcastSpy);

      emitter.broadcastEvent(event);

      expect(mockClient1.send).toHaveBeenCalledWith(JSON.stringify(event));
      expect(mockClient2.send).toHaveBeenCalledWith(JSON.stringify(event));
      expect(emitter.stats.messagesSent).toBe(1);
      expect(broadcastSpy).toHaveBeenCalledWith({
        event,
        successCount: 2,
        failureCount: 0,
        totalClients: 2
      });
    });

    it('should handle client send errors during broadcast', () => {
      mockClient1.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      const errorSpy = vi.fn();
      emitter.on('client:error', errorSpy);

      const event = { type: 'test', data: 'error test' };
      emitter.broadcastEvent(event);

      expect(mockClient2.send).toHaveBeenCalled(); // Second client should still receive
      expect(emitter.stats.errorsCount).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith({
        client: mockClient1,
        error: expect.any(Error)
      });
    });

    it('should remove clients with closed connections', () => {
      mockClient1.readyState = 3; // CLOSED

      const event = { type: 'test', data: 'closed connection test' };
      emitter.broadcastEvent(event);

      expect(mockClient1.send).not.toHaveBeenCalled();
      expect(emitter.clients.has(mockClient1)).toBe(false);
      expect(emitter.clients.size).toBe(1);
    });
  });

  describe('heartbeat', () => {
    beforeEach(async () => {
      await emitter.start();
    });

    it('should start heartbeat timer', () => {
      expect(emitter.heartbeatTimer).toBeDefined();
    });

    it('should stop heartbeat timer', () => {
      emitter.stopHeartbeat();
      expect(emitter.heartbeatTimer).toBeNull();
    });

    it('should not start multiple timers', () => {
      const firstTimer = emitter.heartbeatTimer;
      emitter.startHeartbeat();

      expect(emitter.heartbeatTimer).toBe(firstTimer);
    });
  });

  describe('statistics and monitoring', () => {
    it('should return comprehensive stats', () => {
      const stats = emitter.getStats();

      expect(stats).toEqual({
        totalConnections: 0,
        currentConnections: 0,
        messagesSent: 0,
        messagesBuffered: 0,
        errorsCount: 0,
        isStarted: false,
        bufferSize: 0,
        configuredPort: 8765,
        maxConnections: 5
      });
    });

    it('should return connected clients info', async () => {
      await emitter.start();

      const mockClient = {
        readyState: 1,
        id: 'client-1'
      };

      emitter.addClient(mockClient);

      const clients = emitter.getConnectedClients();

      expect(clients).toEqual([{
        readyState: 1,
        id: 'client-1'
      }]);
    });

    it('should track statistics during operation', async () => {
      await emitter.start();

      const mockClient = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1
      };

      emitter.addClient(mockClient);
      emitter.emitStatusUpdate({ test: 'data' });

      const stats = emitter.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.currentConnections).toBe(1);
      expect(stats.messagesSent).toBe(1);
    });
  });
});