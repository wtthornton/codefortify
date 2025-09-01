/**
 * CodeFortify Status Bar Manager
 * 
 * Manages the VS Code status bar integration for real-time CodeFortify status display
 */

import * as vscode from 'vscode';

export interface StatusBarConfiguration {
    enabled: boolean;
    showScore: boolean;
    showProgress: boolean;
    updateInterval: number;
}

export interface StatusData {
    phase: string;
    progress: number;
    message: string;
    score?: number;
    previousScore?: number;
    category?: string;
    operation?: string;
    elapsedTime?: number;
    estimatedRemainingTime?: number;
}

export class StatusBarManager {
    private context: vscode.ExtensionContext;
    private statusBarItem: vscode.StatusBarItem;
    private config: StatusBarConfiguration;
    private currentStatus: StatusData | null = null;
    private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
    private updateTimer: NodeJS.Timeout | null = null;
    private animationFrame = 0;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = this.loadConfiguration();
        
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100 // Priority - higher numbers appear more to the left
        );
        
        this.statusBarItem.command = 'codefortify.showStatus';
        this.statusBarItem.tooltip = 'CodeFortify Real-Time Status - Click for details';
        
        context.subscriptions.push(this.statusBarItem);
    }

    initialize(): void {
        if (this.config.enabled) {
            this.show();
            this.startUpdateTimer();
        }
        
        this.updateDisplay();
    }

    dispose(): void {
        this.stopUpdateTimer();
        this.statusBarItem.dispose();
    }

    show(): void {
        this.statusBarItem.show();
    }

    hide(): void {
        this.statusBarItem.hide();
    }

    setConnectionStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error'): void {
        this.connectionStatus = status;
        this.updateDisplay();
    }

    updateStatus(statusData: StatusData): void {
        this.currentStatus = statusData;
        this.updateDisplay();
    }

    updateScore(scoreData: { score: number; previousScore?: number; trend?: string }): void {
        if (this.currentStatus) {
            this.currentStatus.score = scoreData.score;
            this.currentStatus.previousScore = scoreData.previousScore;
        } else {
            this.currentStatus = {
                phase: 'complete',
                progress: 100,
                message: 'Score updated',
                score: scoreData.score,
                previousScore: scoreData.previousScore
            };
        }
        
        this.updateDisplay();
    }

    setError(errorMessage: string): void {
        this.connectionStatus = 'error';
        this.currentStatus = {
            phase: 'error',
            progress: 0,
            message: errorMessage
        };
        this.updateDisplay();
    }

    updateConfiguration(config: vscode.WorkspaceConfiguration): void {
        this.config = {
            enabled: config.get('statusBar.enabled', true),
            showScore: config.get('statusBar.showScore', true),
            showProgress: config.get('statusBar.showProgress', true),
            updateInterval: config.get('statusBar.updateInterval', 1000)
        };

        if (this.config.enabled) {
            this.show();
            this.startUpdateTimer();
        } else {
            this.hide();
            this.stopUpdateTimer();
        }

        this.updateDisplay();
    }

    private loadConfiguration(): StatusBarConfiguration {
        const config = vscode.workspace.getConfiguration('codefortify');
        return {
            enabled: config.get('statusBar.enabled', true),
            showScore: config.get('statusBar.showScore', true),
            showProgress: config.get('statusBar.showProgress', true),
            updateInterval: config.get('statusBar.updateInterval', 1000)
        };
    }

    private updateDisplay(): void {
        if (!this.config.enabled) {
            this.hide();
            return;
        }

        const { text, color, backgroundColor } = this.getStatusBarContent();
        
        this.statusBarItem.text = text;
        this.statusBarItem.color = color;
        this.statusBarItem.backgroundColor = backgroundColor;
        this.statusBarItem.tooltip = this.getTooltipText();
        
        this.show();
    }

    private getStatusBarContent(): { text: string; color?: string; backgroundColor?: vscode.ThemeColor } {
        const icon = this.getStatusIcon();
        let text = `CodeFortify ${icon}`;
        let color: string | undefined;
        let backgroundColor: vscode.ThemeColor | undefined;

        switch (this.connectionStatus) {
            case 'disconnected':
                text += ' Offline';
                color = '#888';
                break;
                
            case 'connecting':
                text += ' Connecting...';
                color = '#ffd700';
                break;
                
            case 'connected':
                if (this.currentStatus) {
                    const statusText = this.getStatusText();
                    text = `CodeFortify ${statusText}`;
                    color = this.getStatusColor();
                } else {
                    text += ' Ready';
                    color = '#00ff00';
                }
                break;
                
            case 'error':
                text += ' Error';
                color = '#ff4444';
                backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
        }

        return { text, color, backgroundColor };
    }

    private getStatusIcon(): string {
        switch (this.connectionStatus) {
            case 'disconnected':
                return '$(circle-slash)';
            case 'connecting':
                return this.getAnimatedIcon(['$(loading~spin)']);
            case 'connected':
                if (this.currentStatus) {
                    switch (this.currentStatus.phase) {
                        case 'analyzing':
                            return this.getAnimatedIcon(['$(sync~spin)', '$(gear~spin)']);
                        case 'enhancing':
                            return '$(rocket)';
                        case 'testing':
                            return '$(beaker)';
                        case 'complete':
                            return '$(check)';
                        case 'error':
                            return '$(error)';
                        default:
                            return '$(pulse)';
                    }
                }
                return '$(check)';
            case 'error':
                return '$(error)';
            default:
                return '$(circle)';
        }
    }

    private getAnimatedIcon(icons: string[]): string {
        const index = Math.floor(this.animationFrame / 5) % icons.length;
        return icons[index];
    }

    private getStatusText(): string {
        if (!this.currentStatus) {
            return 'Ready';
        }

        const parts: string[] = [];

        // Add score if enabled and available
        if (this.config.showScore && this.currentStatus.score !== undefined) {
            const score = this.currentStatus.score.toFixed(1);
            const scoreText = `${score}`;
            
            // Add trend indicator if we have previous score
            if (this.currentStatus.previousScore !== undefined) {
                const change = this.currentStatus.score - this.currentStatus.previousScore;
                if (Math.abs(change) > 0.1) {
                    const trend = change > 0 ? '↗' : '↘';
                    parts.push(`${trend}${scoreText}`);
                } else {
                    parts.push(scoreText);
                }
            } else {
                parts.push(scoreText);
            }
        }

        // Add progress if enabled and available
        if (this.config.showProgress && this.currentStatus.progress > 0 && this.currentStatus.progress < 100) {
            const progressText = `${Math.round(this.currentStatus.progress)}%`;
            parts.push(progressText);
        }

        // Add phase-specific information
        switch (this.currentStatus.phase) {
            case 'analyzing':
                if (this.currentStatus.category) {
                    parts.push(`Analyzing ${this.currentStatus.category}`);
                } else {
                    parts.push('Analyzing...');
                }
                break;
                
            case 'enhancing':
                parts.push('Enhancing');
                break;
                
            case 'testing':
                parts.push('Testing');
                break;
                
            case 'complete':
                if (parts.length === 0 || !this.config.showScore) {
                    parts.push('Complete');
                }
                break;
                
            case 'error':
                parts.push('Error');
                break;
                
            default:
                if (parts.length === 0) {
                    parts.push('Ready');
                }
        }

        return parts.join(' ');
    }

    private getStatusColor(): string {
        if (!this.currentStatus) {
            return '#00ff00';
        }

        switch (this.currentStatus.phase) {
            case 'analyzing':
            case 'enhancing':
            case 'testing':
                return '#ffd700'; // Yellow for active operations
                
            case 'complete':
                if (this.currentStatus.score !== undefined) {
                    // Color based on score
                    if (this.currentStatus.score >= 90) {
                        return '#00ff00'; // Green for excellent
                    } else if (this.currentStatus.score >= 75) {
                        return '#90EE90'; // Light green for good
                    } else if (this.currentStatus.score >= 60) {
                        return '#ffd700'; // Yellow for fair
                    } else {
                        return '#ff8c00'; // Orange for needs improvement
                    }
                }
                return '#00ff00';
                
            case 'error':
                return '#ff4444'; // Red for errors
                
            default:
                return '#ffffff'; // Default white
        }
    }

    private getTooltipText(): string {
        const lines: string[] = ['CodeFortify Real-Time Status'];
        
        lines.push(`Connection: ${this.connectionStatus}`);
        
        if (this.currentStatus) {
            lines.push(`Phase: ${this.currentStatus.phase}`);
            
            if (this.currentStatus.score !== undefined) {
                lines.push(`Score: ${this.currentStatus.score.toFixed(1)}/100`);
                
                if (this.currentStatus.previousScore !== undefined) {
                    const change = this.currentStatus.score - this.currentStatus.previousScore;
                    const changeText = change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
                    lines.push(`Change: ${changeText}`);
                }
            }
            
            if (this.currentStatus.progress > 0 && this.currentStatus.progress < 100) {
                lines.push(`Progress: ${Math.round(this.currentStatus.progress)}%`);
            }
            
            if (this.currentStatus.message) {
                lines.push(`Status: ${this.currentStatus.message}`);
            }
            
            if (this.currentStatus.category) {
                lines.push(`Category: ${this.currentStatus.category}`);
            }
            
            if (this.currentStatus.elapsedTime) {
                const elapsed = Math.round(this.currentStatus.elapsedTime / 1000);
                lines.push(`Elapsed: ${elapsed}s`);
            }
            
            if (this.currentStatus.estimatedRemainingTime) {
                const remaining = Math.round(this.currentStatus.estimatedRemainingTime / 1000);
                lines.push(`Remaining: ~${remaining}s`);
            }
        }
        
        lines.push('');
        lines.push('Click for detailed status dashboard');
        
        return lines.join('\n');
    }

    private startUpdateTimer(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            this.animationFrame++;
            
            // Update display to refresh animations
            if (this.connectionStatus === 'connecting' || 
                (this.currentStatus?.phase === 'analyzing' || 
                 this.currentStatus?.phase === 'enhancing' || 
                 this.currentStatus?.phase === 'testing')) {
                this.updateDisplay();
            }
        }, this.config.updateInterval);
    }

    private stopUpdateTimer(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    // Public methods for testing/debugging
    public getCurrentStatus(): StatusData | null {
        return this.currentStatus;
    }

    public getConnectionStatus(): string {
        return this.connectionStatus;
    }
}