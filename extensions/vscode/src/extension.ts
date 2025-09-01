/**
 * CodeFortify Real-Time VS Code Extension
 * 
 * Provides real-time code quality monitoring and enhancement feedback
 */

import * as vscode from 'vscode';
import { StatusBarManager } from './StatusBarManager';
import { NotificationManager } from './NotificationManager';
import { WebSocketClient } from './WebSocketClient';
import { StatusTreeProvider } from './StatusTreeProvider';

export class CodeFortifyExtension {
    private context: vscode.ExtensionContext;
    private statusBarManager: StatusBarManager;
    private notificationManager: NotificationManager;
    private webSocketClient: WebSocketClient;
    private statusTreeProvider: StatusTreeProvider;
    private isActive = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.statusBarManager = new StatusBarManager(context);
        this.notificationManager = new NotificationManager(context);
        this.webSocketClient = new WebSocketClient(this.getConfiguration());
        this.statusTreeProvider = new StatusTreeProvider();
        
        this.setupEventHandlers();
        this.registerCommands();
        this.registerViews();
    }

    async activate(): Promise<void> {
        console.log('CodeFortify Real-Time extension is activating...');

        try {
            // Initialize components
            this.statusBarManager.initialize();
            this.notificationManager.initialize();
            
            // Auto-connect if enabled
            const config = this.getConfiguration();
            if (config.get('realtime.autoConnect', true)) {
                await this.startRealTimeMonitoring();
            }

            // Set context for conditional command visibility
            vscode.commands.executeCommand('setContext', 'codefortify.realtimeActive', this.isActive);

            console.log('CodeFortify Real-Time extension activated successfully');
        } catch (error) {
            console.error('Failed to activate CodeFortify extension:', error);
            vscode.window.showErrorMessage(`Failed to activate CodeFortify: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async deactivate(): Promise<void> {
        console.log('CodeFortify Real-Time extension is deactivating...');
        
        if (this.isActive) {
            await this.stopRealTimeMonitoring();
        }
        
        this.statusBarManager.dispose();
        this.notificationManager.dispose();
        
        console.log('CodeFortify Real-Time extension deactivated');
    }

    private setupEventHandlers(): void {
        // WebSocket event handlers
        this.webSocketClient.on('connected', () => {
            this.isActive = true;
            vscode.commands.executeCommand('setContext', 'codefortify.realtimeActive', true);
            this.statusBarManager.setConnectionStatus('connected');
            this.notificationManager.showInfo('CodeFortify real-time monitoring started');
        });

        this.webSocketClient.on('disconnected', () => {
            this.isActive = false;
            vscode.commands.executeCommand('setContext', 'codefortify.realtimeActive', false);
            this.statusBarManager.setConnectionStatus('disconnected');
        });

        this.webSocketClient.on('error', (error: Error) => {
            this.statusBarManager.setError(error.message);
            this.notificationManager.showError(`Connection error: ${error.message}`);
        });

        this.webSocketClient.on('statusUpdate', (data: any) => {
            this.statusBarManager.updateStatus(data);
            this.statusTreeProvider.updateStatus(data);
        });

        this.webSocketClient.on('scoreUpdate', (data: any) => {
            this.statusBarManager.updateScore(data);
            this.notificationManager.handleScoreUpdate(data);
        });

        this.webSocketClient.on('notification', (data: any) => {
            this.notificationManager.handleNotification(data);
        });

        this.webSocketClient.on('analysisComplete', (data: any) => {
            this.notificationManager.showAnalysisComplete(data);
            this.statusTreeProvider.updateAnalysisResults(data);
        });

        // Configuration change handler
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('codefortify')) {
                this.handleConfigurationChange();
            }
        });

        // File change handlers for auto-analysis
        const config = this.getConfiguration();
        if (config.get('analysis.autoTrigger', true)) {
            this.setupFileWatchers();
        }
    }

    private registerCommands(): void {
        const commands = [
            {
                command: 'codefortify.startRealtime',
                handler: () => this.startRealTimeMonitoring()
            },
            {
                command: 'codefortify.stopRealtime',
                handler: () => this.stopRealTimeMonitoring()
            },
            {
                command: 'codefortify.showStatus',
                handler: () => this.showStatusDashboard()
            },
            {
                command: 'codefortify.runAnalysis',
                handler: () => this.runAnalysis()
            },
            {
                command: 'codefortify.showRecommendations',
                handler: () => this.showRecommendations()
            },
            {
                command: 'codefortify.openSettings',
                handler: () => this.openSettings()
            }
        ];

        commands.forEach(({ command, handler }) => {
            const disposable = vscode.commands.registerCommand(command, handler);
            this.context.subscriptions.push(disposable);
        });
    }

    private registerViews(): void {
        // Register tree view provider
        const treeView = vscode.window.createTreeView('codefortifyStatus', {
            treeDataProvider: this.statusTreeProvider,
            showCollapseAll: true
        });

        this.context.subscriptions.push(treeView);
    }

    private async startRealTimeMonitoring(): Promise<void> {
        try {
            this.statusBarManager.setConnectionStatus('connecting');
            
            const config = this.getConfiguration();
            const port = config.get('realtime.serverPort', 8765);
            
            await this.webSocketClient.connect(`ws://localhost:${port}`);
            
        } catch (error) {
            console.error('Failed to start real-time monitoring:', error);
            this.statusBarManager.setError('Connection failed');
            throw error;
        }
    }

    private async stopRealTimeMonitoring(): Promise<void> {
        try {
            this.statusBarManager.setConnectionStatus('disconnected');
            await this.webSocketClient.disconnect();
            this.notificationManager.showInfo('CodeFortify real-time monitoring stopped');
        } catch (error) {
            console.error('Error stopping real-time monitoring:', error);
        }
    }

    private async showStatusDashboard(): Promise<void> {
        // Create webview panel for detailed status
        const panel = vscode.window.createWebviewPanel(
            'codefortifyStatus',
            'CodeFortify Status Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getStatusDashboardHtml();
        
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case 'requestStatus':
                        this.webSocketClient.requestStatus();
                        break;
                    case 'runAnalysis':
                        this.runAnalysis();
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private async runAnalysis(): Promise<void> {
        try {
            this.notificationManager.showInfo('Starting code analysis...');
            
            // Send analysis request to WebSocket server
            this.webSocketClient.requestAnalysis();
            
        } catch (error) {
            console.error('Failed to run analysis:', error);
            this.notificationManager.showError(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async showRecommendations(): Promise<void> {
        // Create webview for recommendations
        const panel = vscode.window.createWebviewPanel(
            'codefortifyRecommendations',
            'CodeFortify Recommendations',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        panel.webview.html = this.getRecommendationsHtml();
    }

    private openSettings(): void {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:codefortify.codefortify-realtime');
    }

    private setupFileWatchers(): void {
        const config = this.getConfiguration();
        const debounceDelay = config.get('analysis.debounceDelay', 2000);
        
        let debounceTimer: NodeJS.Timeout | undefined;

        const triggerAnalysis = () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            debounceTimer = setTimeout(() => {
                if (this.isActive) {
                    this.runAnalysis();
                }
            }, debounceDelay);
        };

        // Watch for file changes
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,jsx,tsx,py,go,java,cs,rb,php}');
        
        watcher.onDidChange(triggerAnalysis);
        watcher.onDidCreate(triggerAnalysis);
        watcher.onDidDelete(triggerAnalysis);

        this.context.subscriptions.push(watcher);
    }

    private handleConfigurationChange(): void {
        const config = this.getConfiguration();
        
        // Update WebSocket client configuration
        this.webSocketClient.updateConfiguration(config);
        
        // Update status bar configuration
        this.statusBarManager.updateConfiguration(config);
        
        // Update notification configuration
        this.notificationManager.updateConfiguration(config);
    }

    private getConfiguration(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration('codefortify');
    }

    private getStatusDashboardHtml(): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeFortify Status Dashboard</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                .status-card {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    padding: 16px;
                    margin: 10px 0;
                }
                .score {
                    font-size: 2em;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                }
                .progress-bar {
                    background: var(--vscode-progressBar-background);
                    height: 8px;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: var(--vscode-progressBar-background);
                    transition: width 0.3s ease;
                }
            </style>
        </head>
        <body>
            <h1>CodeFortify Real-Time Dashboard</h1>
            <div class="status-card">
                <h2>Current Status</h2>
                <div id="status">Loading...</div>
            </div>
            <div class="status-card">
                <h2>Score</h2>
                <div class="score" id="score">--</div>
            </div>
            <div class="status-card">
                <h2>Progress</h2>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress" style="width: 0%"></div>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                
                // Request initial status
                vscode.postMessage({ command: 'requestStatus' });
                
                // Handle status updates
                window.addEventListener('message', event => {
                    const message = event.data;
                    // Handle status updates from extension
                });
            </script>
        </body>
        </html>
        `;
    }

    private getRecommendationsHtml(): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeFortify Recommendations</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                .recommendation {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    padding: 16px;
                    margin: 10px 0;
                }
                .priority-high { border-left: 4px solid #ff6b6b; }
                .priority-medium { border-left: 4px solid #ffd93d; }
                .priority-low { border-left: 4px solid #6bcf7f; }
            </style>
        </head>
        <body>
            <h1>CodeFortify Recommendations</h1>
            <div id="recommendations">Loading recommendations...</div>
        </body>
        </html>
        `;
    }
}

// Extension activation point
export function activate(context: vscode.ExtensionContext) {
    const extension = new CodeFortifyExtension(context);
    return extension.activate();
}

export function deactivate() {
    // Cleanup will be handled by the extension instance
}