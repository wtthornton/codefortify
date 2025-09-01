/**
 * CodeFortify WebSocket Client for VS Code Extension
 * 
 * Handles real-time communication with CodeFortify server
 */

import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import WebSocket from 'ws';

export interface WebSocketConfiguration {
    serverPort: number;
    autoConnect: boolean;
    reconnectDelay: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
    connectionTimeout: number;
}

export interface ServerMessage {
    type: string;
    timestamp: string;
    session_id: string;
    data: any;
    priority?: string;
    source?: string;
    target?: string;
}

export class WebSocketClient extends EventEmitter {
    private config: WebSocketConfiguration;
    private ws: WebSocket | null = null;
    private connectionUrl: string | null = null;
    private isConnecting = false;
    private isConnected = false;
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private connectionTimer: NodeJS.Timeout | null = null;
    private subscriptions: Set<string> = new Set();
    private filters: any = {};

    constructor(config: vscode.WorkspaceConfiguration) {
        super();
        this.config = this.loadConfiguration(config);
    }

    async connect(url?: string): Promise<void> {
        if (this.isConnecting || this.isConnected) {
            return;
        }

        this.connectionUrl = url || `ws://localhost:${this.config.serverPort}`;
        this.isConnecting = true;
        this.reconnectAttempts = 0;

        return this.attemptConnection();
    }

    async disconnect(): Promise<void> {
        this.cleanup();
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close(1000, 'Client disconnecting');
        }

        this.isConnected = false;
        this.isConnecting = false;
        this.connectionUrl = null;
        
        this.emit('disconnected');
    }

    updateConfiguration(config: vscode.WorkspaceConfiguration): void {
        const newConfig = this.loadConfiguration(config);
        
        // Reconnect if server port changed
        if (this.isConnected && newConfig.serverPort !== this.config.serverPort) {
            this.config = newConfig;
            this.reconnect();
        } else {
            this.config = newConfig;
        }
    }

    subscribe(eventTypes: string[]): void {
        eventTypes.forEach(type => this.subscriptions.add(type));
        
        if (this.isConnected) {
            this.sendMessage({
                type: 'subscribe',
                data: { types: eventTypes }
            });
        }
    }

    unsubscribe(eventTypes: string[]): void {
        eventTypes.forEach(type => this.subscriptions.delete(type));
        
        if (this.isConnected) {
            this.sendMessage({
                type: 'unsubscribe',
                data: { types: eventTypes }
            });
        }
    }

    setFilters(filters: any): void {
        this.filters = { ...this.filters, ...filters };
        
        if (this.isConnected) {
            this.sendMessage({
                type: 'set_filters',
                data: filters
            });
        }
    }

    requestStatus(): void {
        if (this.isConnected) {
            this.sendMessage({
                type: 'get_status'
            });
        }
    }

    requestAnalysis(): void {
        if (this.isConnected) {
            this.sendMessage({
                type: 'run_analysis'
            });
        }
    }

    ping(): void {
        if (this.isConnected) {
            this.sendMessage({
                type: 'ping',
                timestamp: new Date().toISOString()
            });
        }
    }

    private async attemptConnection(): Promise<void> {
        if (!this.connectionUrl) {
            throw new Error('No connection URL specified');
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.connectionUrl!);

                // Set connection timeout
                this.connectionTimer = setTimeout(() => {
                    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                        this.ws.terminate();
                        this.handleConnectionError(new Error('Connection timeout'));
                        reject(new Error('Connection timeout'));
                    }
                }, this.config.connectionTimeout);

                this.ws.on('open', () => {
                    this.clearConnectionTimer();
                    this.isConnecting = false;
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    this.setupHeartbeat();
                    this.restoreSubscriptions();
                    this.restoreFilters();
                    
                    this.emit('connected');
                    resolve();
                });

                this.ws.on('close', (code: number, reason: Buffer) => {
                    this.clearConnectionTimer();
                    this.cleanup();
                    
                    const reasonStr = reason.toString();
                    console.log(`WebSocket closed: ${code} - ${reasonStr}`);
                    
                    if (this.isConnected) {
                        this.isConnected = false;
                        this.emit('disconnected', { code, reason: reasonStr });
                        
                        // Attempt reconnection if not intentional disconnect
                        if (code !== 1000) {
                            this.scheduleReconnect();
                        }
                    }
                });

                this.ws.on('error', (error: Error) => {
                    this.clearConnectionTimer();
                    console.error('WebSocket error:', error);
                    
                    if (this.isConnecting) {
                        this.handleConnectionError(error);
                        reject(error);
                    } else {
                        this.emit('error', error);
                    }
                });

                this.ws.on('message', (data: WebSocket.Data) => {
                    this.handleMessage(data);
                });

                this.ws.on('ping', () => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.pong();
                    }
                });

            } catch (error) {
                this.clearConnectionTimer();
                this.isConnecting = false;
                this.handleConnectionError(error as Error);
                reject(error);
            }
        });
    }

    private handleConnectionError(error: Error): void {
        this.isConnecting = false;
        this.isConnected = false;
        
        this.emit('error', error);
        
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
        } else {
            this.emit('maxReconnectAttemptsReached');
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer || !this.connectionUrl) {
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            30000 // Max 30 seconds
        );

        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.emit('reconnecting', { attempt: this.reconnectAttempts });
            this.attemptConnection().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }

    private async reconnect(): Promise<void> {
        await this.disconnect();
        setTimeout(() => {
            if (this.connectionUrl) {
                this.connect(this.connectionUrl);
            }
        }, 1000);
    }

    private handleMessage(data: WebSocket.Data): void {
        try {
            const message: ServerMessage = JSON.parse(data.toString());
            
            // Handle different message types
            switch (message.type) {
                case 'status_update':
                    this.emit('statusUpdate', message.data);
                    break;
                    
                case 'score_update':
                case 'score_improvement':
                case 'score_degradation':
                    this.emit('scoreUpdate', message.data);
                    break;
                    
                case 'analysis_start':
                    this.emit('analysisStart', message.data);
                    break;
                    
                case 'analysis_progress':
                    this.emit('analysisProgress', message.data);
                    break;
                    
                case 'analysis_complete':
                    this.emit('analysisComplete', message.data);
                    break;
                    
                case 'recommendation_generated':
                    this.emit('recommendationGenerated', message.data);
                    break;
                    
                case 'error_occurred':
                    this.emit('serverError', message.data);
                    break;
                    
                case 'agent_status':
                    this.emit('agentStatus', message.data);
                    break;
                    
                case 'pong':
                    // Handle pong response
                    break;
                    
                case 'current_status':
                    this.emit('currentStatus', message.data);
                    break;
                    
                case 'subscription_confirmed':
                    this.emit('subscriptionConfirmed', message.data);
                    break;
                    
                default:
                    // Generic notification handling
                    this.emit('notification', {
                        type: message.type,
                        data: message.data,
                        priority: message.priority,
                        timestamp: message.timestamp
                    });
                    break;
            }
            
            // Emit raw message for debugging
            this.emit('message', message);
            
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.emit('parseError', { error, data: data.toString() });
        }
    }

    private sendMessage(message: any): void {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('Cannot send message: WebSocket not connected');
            return;
        }

        try {
            const messageStr = JSON.stringify({
                ...message,
                timestamp: new Date().toISOString()
            });
            
            this.ws.send(messageStr);
        } catch (error) {
            console.error('Failed to send WebSocket message:', error);
            this.emit('sendError', error);
        }
    }

    private setupHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }

        this.heartbeatTimer = setInterval(() => {
            this.ping();
        }, this.config.heartbeatInterval);
    }

    private restoreSubscriptions(): void {
        if (this.subscriptions.size > 0) {
            this.subscribe(Array.from(this.subscriptions));
        }
    }

    private restoreFilters(): void {
        if (Object.keys(this.filters).length > 0) {
            this.setFilters(this.filters);
        }
    }

    private clearConnectionTimer(): void {
        if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
        }
    }

    private cleanup(): void {
        this.clearConnectionTimer();
        
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private loadConfiguration(config: vscode.WorkspaceConfiguration): WebSocketConfiguration {
        return {
            serverPort: config.get('realtime.serverPort', 8765),
            autoConnect: config.get('realtime.autoConnect', true),
            reconnectDelay: config.get('realtime.reconnectDelay', 1000),
            maxReconnectAttempts: config.get('realtime.maxReconnectAttempts', 10),
            heartbeatInterval: config.get('realtime.heartbeatInterval', 30000),
            connectionTimeout: config.get('realtime.connectionTimeout', 10000)
        };
    }

    // Public getters for status
    public get connected(): boolean {
        return this.isConnected;
    }

    public get connecting(): boolean {
        return this.isConnecting;
    }

    public get reconnectAttempt(): number {
        return this.reconnectAttempts;
    }

    public getConnectionInfo() {
        return {
            url: this.connectionUrl,
            connected: this.isConnected,
            connecting: this.isConnecting,
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: Array.from(this.subscriptions),
            filters: this.filters
        };
    }
}