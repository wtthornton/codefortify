/**
 * CodeFortify Real-Time WebSocket Server
 * Provides real-time communication for IDE integration
 */

import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import crypto from 'crypto';

/**


 * CodeFortifyWebSocketServer class implementation


 *


 * Provides functionality for codefortifywebsocketserver operations


 */


/**


 * CodeFortifyWebSocketServer class implementation


 *


 * Provides functionality for codefortifywebsocketserver operations


 */


export class CodeFortifyWebSocketServer extends EventEmitter {
  constructor(options = {}) {
    super();

    this.port = options.port || 8765;
    this.host = options.host || 'localhost';
    this.server = null;
    this.clients = new Map();
    this.sessions = new Map();
    this.messageQueue = [];
    this.maxQueueSize = options.maxQueueSize || 1000;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.clientTimeout = options.clientTimeout || 60000;

    this.isRunning = false;
    this.statusManager = null;
    this.analysisEngine = null;
    this.startTime = null;

    // Enhanced logging
    this.logLevel = options.logLevel || 'info';
    this.logPrefix = '[CodeFortify WebSocket]';

    this.setupSignalHandlers();
    this.log('info', `WebSocket server initialized on ${this.host}:${this.port}`);
  }
  /**
   * Performs the specified operation
   * @param {any} statusManager - Optional parameter
   * @param {boolean} analysisEngine - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} statusManager - Optional parameter
   * @param {boolean} analysisEngine - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async start(statusManager = null, analysisEngine = null) {
    this.log('info', 'Starting WebSocket server...');
    
    if (this.isRunning) {
      this.log('warn', 'WebSocket server is already running');
      return;
    }

    this.statusManager = statusManager;
    this.analysisEngine = analysisEngine;
    this.log('info', `Status manager: ${statusManager ? 'provided' : 'none'}`);
    this.log('info', `Analysis engine: ${analysisEngine ? 'provided' : 'none'}`);

    return new Promise((resolve, reject) => {
      try {
        this.log('info', `Creating WebSocket server on ${this.host}:${this.port}`);
        
        this.server = new WebSocketServer({
          port: this.port,
          host: this.host,
          perMessageDeflate: false
        });

        this.server.on('connection', (ws, request) => {
          this.log('info', `New connection attempt from ${request.socket.remoteAddress}`);
          this.handleConnection(ws, request);
        });

        this.server.on('listening', () => {
          this.isRunning = true;
          this.startTime = Date.now();
          this.log('info', `✅ WebSocket server successfully started on ws://${this.host}:${this.port}`);
          this.log('info', `Server ready to accept connections`);
          this.emit('server_started', { host: this.host, port: this.port });
          resolve();
        });

        this.server.on('error', (error) => {
          this.log('error', `WebSocket server error: ${error.message}`, error);
          this.emit('server_error', error);
          
          if (error.code === 'EADDRINUSE') {
            const errorMsg = `Port ${this.port} is already in use. Try a different port or stop existing server.`;
            this.log('error', errorMsg);
            reject(new Error(errorMsg));
          } else {
            this.log('error', `Unexpected server error: ${error.code || 'unknown'}`, error);
            reject(error);
          }
        });

        this.log('info', 'Setting up heartbeat mechanism...');
        this.setupHeartbeat();

      } catch (error) {
        this.log('error', `Failed to create WebSocket server: ${error.message}`, error);
        reject(error);
      }
    });
  }
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async stop() {
  /**
   * Performs the specified operation
   * @param {boolean} !this.isRunning
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.isRunning
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.isRunning) {
      return;
    }

    // LOG: Stopping CodeFortify WebSocket server...
    // Close all client connections
    this.clients.forEach((client, ws) => {
      /**
   * Performs the specified operation
   * @param {any} ws.readyState - Optional parameter
   * @returns {string} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} ws.readyState - Optional parameter
   * @returns {string} The operation result
   */

      if (ws.readyState === 1) { // OPEN
        ws.close(1001, 'Server shutting down');
      }
    });

    this.clients.clear();
    this.sessions.clear();

    // Clear heartbeat
    /**
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

    return new Promise((resolve) => {
      /**
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
          // LOG: WebSocket server stopped
          this.emit('server_stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} request
   * @returns {any} The operation result
   */
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} request
   * @returns {any} The operation result
   */


  handleConnection(ws, request) {
    const sessionId = this.generateSessionId();
    const clientInfo = {
      sessionId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(),
      filters: {},
      userAgent: request.headers['user-agent'] || 'Unknown',
      ip: request.socket.remoteAddress || 'Unknown'
    };

    this.clients.set(ws, clientInfo);
    this.sessions.set(sessionId, ws);

    this.log('info', `📱 New client connected: ${sessionId} (${clientInfo.ip})`);
    this.log('info', `User-Agent: ${clientInfo.userAgent}`);
    this.log('info', `Total connected clients: ${this.clients.size}`);

    // Send welcome message
    const welcomeMessage = {
      type: 'connection_established',
      session_id: sessionId,
      server_info: {
        version: '1.1.0',
        capabilities: ['real-time-analysis', 'file-watching', 'notifications']
      }
    };
    
    this.log('debug', `Sending welcome message to ${sessionId}:`, welcomeMessage);
    this.sendToClient(ws, welcomeMessage);

    // Setup client event handlers
    ws.on('message', (data) => {
      this.log('debug', `Received message from ${sessionId}:`, data.toString());
      this.handleClientMessage(ws, data);
    });

    ws.on('close', (code, reason) => {
      this.log('info', `Client ${sessionId} disconnected (Code: ${code}, Reason: ${reason})`);
      this.handleClientDisconnect(ws, code, reason);
    });

    ws.on('error', (error) => {
      this.log('error', `Client error (${sessionId}): ${error.message}`, error);
    });

    ws.on('pong', () => {
      if (this.clients.has(ws)) {
        this.clients.get(ws).lastActivity = new Date();
        this.log('debug', `Received pong from ${sessionId}`);
      }
    });

    // Send initial status if available
    if (this.statusManager) {
      this.log('info', `Sending initial status to ${sessionId}`);
      setTimeout(() => {
        this.sendCurrentStatus(ws);
      }, 100);
    } else {
      this.log('info', `No status manager available, sending default status to ${sessionId}`);
      setTimeout(() => {
        this.sendCurrentStatus(ws);
      }, 100);
    }

    this.emit('client_connected', { sessionId, clientInfo });
  }
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} data
   * @returns {any} The operation result
   */
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} data
   * @returns {any} The operation result
   */


  handleClientMessage(ws, data) {
    const clientInfo = this.clients.get(ws);
    
    if (!clientInfo) {
      this.log('warn', 'Received message from unknown client');
      return;
    }

    clientInfo.lastActivity = new Date();
    this.log('debug', `Processing message from ${clientInfo.sessionId}`);

    try {
      const message = JSON.parse(data.toString());
      this.log('debug', `Parsed message type: ${message.type}`, message);

      // Handle different message types
      switch (message.type) {
      case 'subscribe':
        this.log('info', `Client ${clientInfo.sessionId} subscribing to:`, message.data?.types);
        this.handleSubscription(ws, message);
        break;

      case 'unsubscribe':
        this.log('info', `Client ${clientInfo.sessionId} unsubscribing from:`, message.data?.types);
        this.handleUnsubscription(ws, message);
        break;

      case 'set_filters':
        this.log('info', `Client ${clientInfo.sessionId} setting filters:`, message.data);
        this.handleSetFilters(ws, message);
        break;

      case 'get_status':
        this.log('info', `Client ${clientInfo.sessionId} requesting status`);
        this.sendCurrentStatus(ws);
        break;

      case 'run_analysis':
        this.log('info', `Client ${clientInfo.sessionId} requesting analysis`);
        this.handleAnalysisRequest(ws, message);
        break;

      case 'ping':
        this.log('debug', `Client ${clientInfo.sessionId} sent ping`);
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      case 'connection_established':
        this.log('info', `Client ${clientInfo.sessionId} confirmed connection`);
        this.sendToClient(ws, {
          type: 'connection_acknowledged',
          server: 'CodeFortify WebSocket Server',
          version: '1.0.0'
        });
        break;

      default:
        this.log('warn', `Unknown message type from ${clientInfo.sessionId}: ${message.type}`);
        this.sendToClient(ws, {
          type: 'error',
          message: `Unknown message type: ${message.type}`
        });
        break;
      }

    } catch (error) {
      this.log('error', `Failed to parse message from ${clientInfo.sessionId}: ${error.message}`, error);
      this.log('error', `Raw message data: ${data.toString()}`);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Invalid JSON message'
      });
    }
  }
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} code
   * @param {any} reason
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} code
   * @param {any} reason
   * @returns {boolean} True if successful, false otherwise
   */


  handleClientDisconnect(ws, code, reason) {
    const clientInfo = this.clients.get(ws);
    /**
   * Performs the specified operation
   * @param {any} clientInfo
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} clientInfo
   * @returns {any} The operation result
   */

    if (clientInfo) {
      // LOG: `📱 Client disconnected: ${clientInfo.sessionId} (Code: ${code}, Reason: ${reason})`
      this.sessions.delete(clientInfo.sessionId);
      this.clients.delete(ws);
      this.emit('client_disconnected', { sessionId: clientInfo.sessionId, code, reason });
    }
  }
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} message
   * @returns {any} The operation result
   */
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} message
   * @returns {any} The operation result
   */


  handleSubscription(ws, message) {
    const clientInfo = this.clients.get(ws);
    /**
   * Performs the specified operation
   * @param {any} !clientInfo || !message.data?.types
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !clientInfo || !message.data?.types
   * @returns {any} The operation result
   */

    if (!clientInfo || !message.data?.types) {return;}

    message.data.types.forEach(type => {
      clientInfo.subscriptions.add(type);
    });

    this.sendToClient(ws, {
      type: 'subscription_confirmed',
      data: { types: message.data.types }
    });

    // LOG: `Client ${clientInfo.sessionId} subscribed to:`, message.data.types
  }
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} message
   * @returns {any} The operation result
   */
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} message
   * @returns {any} The operation result
   */


  handleUnsubscription(ws, message) {
    const clientInfo = this.clients.get(ws);
    /**
   * Performs the specified operation
   * @param {any} !clientInfo || !message.data?.types
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !clientInfo || !message.data?.types
   * @returns {any} The operation result
   */

    if (!clientInfo || !message.data?.types) {return;}

    message.data.types.forEach(type => {
      clientInfo.subscriptions.delete(type);
    });

    this.sendToClient(ws, {
      type: 'unsubscription_confirmed',
      data: { types: message.data.types }
    });

    // LOG: `Client ${clientInfo.sessionId} unsubscribed from:`, message.data.types
  }
  /**
   * Sets configuration
   * @param {any} ws
   * @param {any} message
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @param {any} ws
   * @param {any} message
   * @returns {any} The operation result
   */


  handleSetFilters(ws, message) {
    const clientInfo = this.clients.get(ws);
    /**
   * Performs the specified operation
   * @param {any} !clientInfo
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !clientInfo
   * @returns {any} The operation result
   */

    if (!clientInfo) {return;}

    clientInfo.filters = { ...clientInfo.filters, ...message.data };

    this.sendToClient(ws, {
      type: 'filters_updated',
      data: clientInfo.filters
    });
  }
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} message
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Handles the specified event
   * @param {any} ws
   * @param {any} message
   * @returns {Promise} Promise that resolves with the result
   */


  async handleAnalysisRequest(ws, message) {
    const clientInfo = this.clients.get(ws);
    /**
   * Performs the specified operation
   * @param {any} !clientInfo
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !clientInfo
   * @returns {any} The operation result
   */

    if (!clientInfo) {return;}

    // LOG: `Analysis requested by client: ${clientInfo.sessionId}`
    // Send analysis started notification
    this.sendToClient(ws, {
      type: 'analysis_start',
      data: {
        status: 'Analysis starting...',
        timestamp: new Date().toISOString()
      }
    });

    try {
      // Trigger analysis if analysis engine is available
      /**
   * Performs the specified operation
   * @param {boolean} this.analysisEngine
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} this.analysisEngine
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.analysisEngine) {
        await this.analysisEngine.runAnalysis();
      } else {
        // Simulate analysis for testing
        this.simulateAnalysis(ws);
      }

    } catch (error) {
      // ERROR: Analysis failed:, error
      this.sendToClient(ws, {
        type: 'error_occurred',
        data: {
          error: 'Analysis failed',
          details: error.message
        }
      });
    }
  }
  /**
   * Performs the specified operation
   * @param {any} ws
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} ws
   * @returns {Promise} Promise that resolves with the result
   */


  async sendCurrentStatus(ws) {
    try {
      let statusData;
      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */


      if (this.statusManager) {
        statusData = await this.statusManager.getCurrentStatus();
      } else {
        // Default status for testing
        statusData = {
          score: {
            currentScore: 74,
            targetScore: 95,
            grade: 'C'
          },
          globalStatus: {
            phase: 'idle',
            progress: 0,
            elapsedTime: 0
          },
          categories: {
            structure: { score: 88, percentage: 93 },
            quality: { score: 57, percentage: 57 },
            security: { score: 81, percentage: 81 },
            testing: { score: 60, percentage: 60 },
            performance: { score: 63, percentage: 63 },
            devexp: { score: 85, percentage: 85 }
          },
          recommendations: []
        };
      }

      this.sendToClient(ws, {
        type: 'current_status',
        data: statusData
      });

    } catch (error) {
      // ERROR: Failed to get current status:, error
      this.sendToClient(ws, {
        type: 'error',
        message: 'Failed to retrieve current status'
      });
    }
  }
  /**
   * Performs the specified operation
   * @param {any} ws
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} ws
   * @returns {boolean} True if successful, false otherwise
   */


  simulateAnalysis(ws) {
    let progress = 0;

    const progressTimer = setInterval(() => {
      progress += Math.random() * 20;
      /**
   * Performs the specified operation
   * @param {any} progress > - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} progress > - Optional parameter
   * @returns {any} The operation result
   */


      if (progress >= 100) {
        progress = 100;
        clearInterval(progressTimer);

        // Send completion
        this.sendToClient(ws, {
          type: 'analysis_complete',
          data: {
            score: 78,
            improvements: ['Fixed 3 ESLint issues', 'Improved test coverage by 5%'],
            recommendations: [
              'Add more unit tests',
              'Implement error boundaries',
              'Optimize bundle size'
            ]
          }
        });
      } else {
        // Send progress update
        this.sendToClient(ws, {
          type: 'analysis_progress',
          data: {
            progress: Math.round(progress),
            phase: progress < 30 ? 'analyzing' : progress < 70 ? 'enhancing' : 'finalizing',
            message: `Analysis ${Math.round(progress)}% complete`
          }
        });
      }
    }, 500);
  }

  // Broadcast methods for external use
  /**
   * Performs the specified operation
   * @param {any} message
   * @param {any} filter - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} message
   * @param {any} filter - Optional parameter
   * @returns {any} The operation result
   */

  broadcast(message, filter = null) {
    this.clients.forEach((clientInfo, ws) => {
      /**
   * Performs the specified operation
   * @param {any} ws.readyState - Optional parameter
   * @returns {string} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} ws.readyState - Optional parameter
   * @returns {string} The operation result
   */

      if (ws.readyState === 1) { // OPEN
        // Apply filters if specified
        if (filter && !this.clientMatchesFilter(clientInfo, filter)) {
          return;
        }

        this.sendToClient(ws, message);
      }
    });
  }
  /**
   * Updates existing data
   * @param {any} statusData
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @param {any} statusData
   * @returns {any} The operation result
   */


  broadcastStatusUpdate(statusData) {
    this.broadcast({
      type: 'status_update',
      data: statusData,
      timestamp: new Date().toISOString()
    });
  }
  /**
   * Updates existing data
   * @param {any} scoreData
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @param {any} scoreData
   * @returns {any} The operation result
   */


  broadcastScoreUpdate(scoreData) {
    this.broadcast({
      type: 'score_update',
      data: scoreData,
      timestamp: new Date().toISOString()
    });
  }
  /**
   * Performs the specified operation
   * @param {any} notification
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} notification
   * @returns {any} The operation result
   */


  broadcastNotification(notification) {
    this.broadcast({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
      priority: notification.priority || 'medium'
    });
  }
  /**
   * Performs the specified operation
   * @param {any} ws
   * @param {any} message
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} ws
   * @param {any} message
   * @returns {any} The operation result
   */


  sendToClient(ws, message) {
    const clientInfo = this.clients.get(ws);
    const sessionId = clientInfo?.sessionId || 'unknown';
    
    if (ws.readyState === 1) { // OPEN
      const fullMessage = {
        ...message,
        session_id: sessionId,
        timestamp: message.timestamp || new Date().toISOString()
      };

      try {
        const messageStr = JSON.stringify(fullMessage);
        this.log('debug', `Sending message to ${sessionId}:`, fullMessage);
        ws.send(messageStr);
      } catch (error) {
        this.log('error', `Failed to send message to client ${sessionId}: ${error.message}`, error);
      }
    } else {
      this.log('warn', `Cannot send message to ${sessionId}: WebSocket not open (state: ${ws.readyState})`);
    }
  }
  /**
   * Performs the specified operation
   * @param {any} clientInfo
   * @param {any} filter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} clientInfo
   * @param {any} filter
   * @returns {any} The operation result
   */


  clientMatchesFilter(clientInfo, filter) {
    // Implement filtering logic
  /**
   * Performs the specified operation
   * @param {any} filter.subscriptions
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} filter.subscriptions
   * @returns {any} The operation result
   */

    if (filter.subscriptions) {
      const hasSubscription = filter.subscriptions.some(sub =>
        clientInfo.subscriptions.has(sub)
      );
      /**
   * Performs the specified operation
   * @param {boolean} !hasSubscription
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {boolean} !hasSubscription
   * @returns {any} The operation result
   */

      if (!hasSubscription) {return false;}
    }

    return true;
  }
  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      const now = new Date();

      this.clients.forEach((clientInfo, ws) => {
        /**
   * Performs the specified operation
   * @param {any} ws.readyState - Optional parameter
   * @returns {string} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} ws.readyState - Optional parameter
   * @returns {string} The operation result
   */

        if (ws.readyState === 1) { // OPEN
          const timeSinceActivity = now - clientInfo.lastActivity;
          /**
   * Performs the specified operation
   * @param {boolean} timeSinceActivity > this.clientTimeout
   * @returns {boolean} True if successful, false otherwise
   */
          /**
   * Performs the specified operation
   * @param {boolean} timeSinceActivity > this.clientTimeout
   * @returns {boolean} True if successful, false otherwise
   */


          if (timeSinceActivity > this.clientTimeout) {
            // LOG: `Client ${clientInfo.sessionId} timed out`
            ws.terminate();
          } else if (timeSinceActivity > this.heartbeatInterval / 2) {
            // Send ping
            ws.ping();
          }
        }
      });
    }, this.heartbeatInterval);
  }
  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupSignalHandlers() {
    const cleanup = async () => {
      // LOG: Received shutdown signal, stopping WebSocket server...
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
  /**
   * Generates new data
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @returns {any} The created resource
   */


  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Status methods
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */

  getServerInfo() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      host: this.host,
      clientCount: this.clients.size,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getClientInfo() {
    const clients = [];
    this.clients.forEach((clientInfo, ws) => {
      clients.push({
        sessionId: clientInfo.sessionId,
        connectedAt: clientInfo.connectedAt,
        lastActivity: clientInfo.lastActivity,
        subscriptions: Array.from(clientInfo.subscriptions),
        userAgent: clientInfo.userAgent,
        ip: clientInfo.ip,
        readyState: ws.readyState
      });
    });
    return clients;
  }

  // Enhanced logging method
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = logLevels[this.logLevel] || 2;
    const messageLevel = logLevels[level] || 2;

    if (messageLevel <= currentLevel) {
      const prefix = `${this.logPrefix} [${level.toUpperCase()}] ${timestamp}`;
      
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }
}

export default CodeFortifyWebSocketServer;