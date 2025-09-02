/**
 * CodeFortify Real-Time WebSocket Server
 * Provides real-time communication for IDE integration
 */

import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import crypto from 'crypto';

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
        
        this.setupSignalHandlers();
    }
    
    async start(statusManager = null, analysisEngine = null) {
        if (this.isRunning) {
            console.log('WebSocket server is already running');
            return;
        }
        
        this.statusManager = statusManager;
        this.analysisEngine = analysisEngine;
        
        return new Promise((resolve, reject) => {
            try {
                this.server = new WebSocketServer({
                    port: this.port,
                    host: this.host,
                    perMessageDeflate: false
                });
                
                this.server.on('connection', (ws, request) => {
                    this.handleConnection(ws, request);
                });
                
                this.server.on('listening', () => {
                    this.isRunning = true;
                    console.log(`🔄 CodeFortify WebSocket server running on ws://${this.host}:${this.port}`);
                    this.emit('server_started', { host: this.host, port: this.port });
                    resolve();
                });
                
                this.server.on('error', (error) => {
                    console.error('WebSocket server error:', error);
                    this.emit('server_error', error);
                    
                    if (error.code === 'EADDRINUSE') {
                        reject(new Error(`Port ${this.port} is already in use. Try a different port or stop existing server.`));
                    } else {
                        reject(error);
                    }
                });
                
                this.setupHeartbeat();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async stop() {
        if (!this.isRunning) {
            return;
        }
        
        console.log('Stopping CodeFortify WebSocket server...');
        
        // Close all client connections
        this.clients.forEach((client, ws) => {
            if (ws.readyState === 1) { // OPEN
                ws.close(1001, 'Server shutting down');
            }
        });
        
        this.clients.clear();
        this.sessions.clear();
        
        // Clear heartbeat
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.isRunning = false;
                    console.log('WebSocket server stopped');
                    this.emit('server_stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
    
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
        
        console.log(`📱 New client connected: ${sessionId} (${clientInfo.ip})`);
        
        // Send welcome message
        this.sendToClient(ws, {
            type: 'connection_established',
            session_id: sessionId,
            server_info: {
                version: '1.1.0',
                capabilities: ['real-time-analysis', 'file-watching', 'notifications']
            }
        });
        
        // Setup client event handlers
        ws.on('message', (data) => {
            this.handleClientMessage(ws, data);
        });
        
        ws.on('close', (code, reason) => {
            this.handleClientDisconnect(ws, code, reason);
        });
        
        ws.on('error', (error) => {
            console.error(`Client error (${sessionId}):`, error);
        });
        
        ws.on('pong', () => {
            if (this.clients.has(ws)) {
                this.clients.get(ws).lastActivity = new Date();
            }
        });
        
        // Send initial status if available
        if (this.statusManager) {
            setTimeout(() => {
                this.sendCurrentStatus(ws);
            }, 100);
        }
        
        this.emit('client_connected', { sessionId, clientInfo });
    }
    
    handleClientMessage(ws, data) {
        const clientInfo = this.clients.get(ws);
        if (!clientInfo) return;
        
        clientInfo.lastActivity = new Date();
        
        try {
            const message = JSON.parse(data.toString());
            
            // Handle different message types
            switch (message.type) {
                case 'subscribe':
                    this.handleSubscription(ws, message);
                    break;
                    
                case 'unsubscribe':
                    this.handleUnsubscription(ws, message);
                    break;
                    
                case 'set_filters':
                    this.handleSetFilters(ws, message);
                    break;
                    
                case 'get_status':
                    this.sendCurrentStatus(ws);
                    break;
                    
                case 'run_analysis':
                    this.handleAnalysisRequest(ws, message);
                    break;
                    
                case 'ping':
                    this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                    
                case 'connection_established':
                    console.log(`📱 Client identified: ${message.client || 'unknown'}`);
                    this.sendToClient(ws, { 
                        type: 'connection_acknowledged',
                        server: 'CodeFortify WebSocket Server',
                        version: '1.0.0'
                    });
                    break;
                    
                default:
                    console.log(`Unknown message type: ${message.type}`);
                    this.sendToClient(ws, {
                        type: 'error',
                        message: `Unknown message type: ${message.type}`
                    });
                    break;
            }
            
        } catch (error) {
            console.error('Failed to parse client message:', error);
            this.sendToClient(ws, {
                type: 'error',
                message: 'Invalid JSON message'
            });
        }
    }
    
    handleClientDisconnect(ws, code, reason) {
        const clientInfo = this.clients.get(ws);
        if (clientInfo) {
            console.log(`📱 Client disconnected: ${clientInfo.sessionId} (Code: ${code}, Reason: ${reason})`);
            this.sessions.delete(clientInfo.sessionId);
            this.clients.delete(ws);
            this.emit('client_disconnected', { sessionId: clientInfo.sessionId, code, reason });
        }
    }
    
    handleSubscription(ws, message) {
        const clientInfo = this.clients.get(ws);
        if (!clientInfo || !message.data?.types) return;
        
        message.data.types.forEach(type => {
            clientInfo.subscriptions.add(type);
        });
        
        this.sendToClient(ws, {
            type: 'subscription_confirmed',
            data: { types: message.data.types }
        });
        
        console.log(`Client ${clientInfo.sessionId} subscribed to:`, message.data.types);
    }
    
    handleUnsubscription(ws, message) {
        const clientInfo = this.clients.get(ws);
        if (!clientInfo || !message.data?.types) return;
        
        message.data.types.forEach(type => {
            clientInfo.subscriptions.delete(type);
        });
        
        this.sendToClient(ws, {
            type: 'unsubscription_confirmed',
            data: { types: message.data.types }
        });
        
        console.log(`Client ${clientInfo.sessionId} unsubscribed from:`, message.data.types);
    }
    
    handleSetFilters(ws, message) {
        const clientInfo = this.clients.get(ws);
        if (!clientInfo) return;
        
        clientInfo.filters = { ...clientInfo.filters, ...message.data };
        
        this.sendToClient(ws, {
            type: 'filters_updated',
            data: clientInfo.filters
        });
    }
    
    async handleAnalysisRequest(ws, message) {
        const clientInfo = this.clients.get(ws);
        if (!clientInfo) return;
        
        console.log(`Analysis requested by client: ${clientInfo.sessionId}`);
        
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
            if (this.analysisEngine) {
                await this.analysisEngine.runAnalysis();
            } else {
                // Simulate analysis for testing
                this.simulateAnalysis(ws);
            }
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.sendToClient(ws, {
                type: 'error_occurred',
                data: {
                    error: 'Analysis failed',
                    details: error.message
                }
            });
        }
    }
    
    async sendCurrentStatus(ws) {
        try {
            let statusData;
            
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
            console.error('Failed to get current status:', error);
            this.sendToClient(ws, {
                type: 'error',
                message: 'Failed to retrieve current status'
            });
        }
    }
    
    simulateAnalysis(ws) {
        let progress = 0;
        
        const progressTimer = setInterval(() => {
            progress += Math.random() * 20;
            
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
    broadcast(message, filter = null) {
        this.clients.forEach((clientInfo, ws) => {
            if (ws.readyState === 1) { // OPEN
                // Apply filters if specified
                if (filter && !this.clientMatchesFilter(clientInfo, filter)) {
                    return;
                }
                
                this.sendToClient(ws, message);
            }
        });
    }
    
    broadcastStatusUpdate(statusData) {
        this.broadcast({
            type: 'status_update',
            data: statusData,
            timestamp: new Date().toISOString()
        });
    }
    
    broadcastScoreUpdate(scoreData) {
        this.broadcast({
            type: 'score_update',
            data: scoreData,
            timestamp: new Date().toISOString()
        });
    }
    
    broadcastNotification(notification) {
        this.broadcast({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString(),
            priority: notification.priority || 'medium'
        });
    }
    
    sendToClient(ws, message) {
        if (ws.readyState === 1) { // OPEN
            const clientInfo = this.clients.get(ws);
            const fullMessage = {
                ...message,
                session_id: clientInfo?.sessionId || 'unknown',
                timestamp: message.timestamp || new Date().toISOString()
            };
            
            try {
                ws.send(JSON.stringify(fullMessage));
            } catch (error) {
                console.error('Failed to send message to client:', error);
            }
        }
    }
    
    clientMatchesFilter(clientInfo, filter) {
        // Implement filtering logic
        if (filter.subscriptions) {
            const hasSubscription = filter.subscriptions.some(sub => 
                clientInfo.subscriptions.has(sub)
            );
            if (!hasSubscription) return false;
        }
        
        return true;
    }
    
    setupHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            const now = new Date();
            
            this.clients.forEach((clientInfo, ws) => {
                if (ws.readyState === 1) { // OPEN
                    const timeSinceActivity = now - clientInfo.lastActivity;
                    
                    if (timeSinceActivity > this.clientTimeout) {
                        console.log(`Client ${clientInfo.sessionId} timed out`);
                        ws.terminate();
                    } else if (timeSinceActivity > this.heartbeatInterval / 2) {
                        // Send ping
                        ws.ping();
                    }
                }
            });
        }, this.heartbeatInterval);
    }
    
    setupSignalHandlers() {
        const cleanup = async () => {
            console.log('Received shutdown signal, stopping WebSocket server...');
            await this.stop();
            process.exit(0);
        };
        
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    }
    
    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }
    
    // Status methods
    getServerInfo() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            host: this.host,
            clientCount: this.clients.size,
            uptime: this.isRunning ? Date.now() - this.startTime : 0
        };
    }
    
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
}

export default CodeFortifyWebSocketServer;