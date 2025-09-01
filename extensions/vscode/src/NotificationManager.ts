/**
 * CodeFortify Notification Manager
 * 
 * Manages smart notifications with filtering, deduplication, and priority handling
 */

import * as vscode from 'vscode';

export interface NotificationConfiguration {
    enabled: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    frequency: 'immediate' | 'batched' | 'smart';
    sound: boolean;
}

export interface NotificationData {
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actions?: NotificationAction[];
    data?: any;
    timestamp: Date;
}

export interface NotificationAction {
    title: string;
    action: string;
    isCloseAffordance?: boolean;
}

export interface ScoreUpdateData {
    score: number;
    previousScore: number;
    changes: string[];
    improvement: boolean;
    category?: string;
}

export class NotificationManager {
    private context: vscode.ExtensionContext;
    private config: NotificationConfiguration;
    private notificationHistory: NotificationData[] = [];
    private recentNotifications: Map<string, Date> = new Map();
    private batchTimer: NodeJS.Timeout | null = null;
    private pendingBatch: NotificationData[] = [];
    
    // Smart filtering settings
    private readonly DEDUPE_WINDOW = 30000; // 30 seconds
    private readonly BATCH_DELAY = 5000; // 5 seconds
    private readonly MAX_HISTORY = 100;
    private readonly SCORE_CHANGE_THRESHOLD = 1.0; // Only notify for changes >= 1.0

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = this.loadConfiguration();
    }

    initialize(): void {
        // Clean up notification history on startup
        this.cleanupHistory();
        
        // Load any persisted settings
        this.loadNotificationPreferences();
    }

    dispose(): void {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.processPendingBatch();
        }
        
        this.saveNotificationPreferences();
    }

    updateConfiguration(config: vscode.WorkspaceConfiguration): void {
        this.config = {
            enabled: config.get('notifications.enabled', true),
            priority: config.get('notifications.priority', 'medium'),
            frequency: config.get('notifications.frequency', 'smart'),
            sound: config.get('notifications.sound', false)
        };
    }

    showInfo(message: string, actions?: NotificationAction[]): void {
        this.showNotification({
            type: 'info',
            priority: 'low',
            title: 'CodeFortify',
            message,
            actions,
            timestamp: new Date()
        });
    }

    showWarning(message: string, actions?: NotificationAction[]): void {
        this.showNotification({
            type: 'warning',
            priority: 'medium',
            title: 'CodeFortify Warning',
            message,
            actions,
            timestamp: new Date()
        });
    }

    showError(message: string, actions?: NotificationAction[]): void {
        this.showNotification({
            type: 'error',
            priority: 'high',
            title: 'CodeFortify Error',
            message,
            actions,
            timestamp: new Date()
        });
    }

    handleNotification(data: any): void {
        if (!this.shouldShowNotification(data)) {
            return;
        }

        const notification: NotificationData = {
            type: data.type || 'info',
            priority: data.priority || 'medium',
            title: data.title || 'CodeFortify',
            message: data.message || data.data?.message || '',
            actions: this.createActionsFromData(data),
            data,
            timestamp: new Date()
        };

        this.showNotification(notification);
    }

    handleScoreUpdate(scoreData: ScoreUpdateData): void {
        if (!this.config.enabled) {
            return;
        }

        const change = Math.abs(scoreData.score - scoreData.previousScore);
        
        // Only show significant score changes
        if (change < this.SCORE_CHANGE_THRESHOLD) {
            return;
        }

        const isImprovement = scoreData.improvement;
        const changeText = `${isImprovement ? '+' : ''}${(scoreData.score - scoreData.previousScore).toFixed(1)}`;
        
        let message = `Score ${isImprovement ? 'improved' : 'decreased'} to ${scoreData.score.toFixed(1)} (${changeText})`;
        
        if (scoreData.changes && scoreData.changes.length > 0) {
            message += `\nChanges: ${scoreData.changes.join(', ')}`;
        }

        const priority = this.getScorePriority(scoreData.score, change, isImprovement);
        
        const actions: NotificationAction[] = [
            {
                title: 'View Details',
                action: 'viewScoreDetails'
            }
        ];

        if (!isImprovement && priority === 'high') {
            actions.unshift({
                title: 'Show Recommendations',
                action: 'showRecommendations'
            });
        }

        this.showNotification({
            type: isImprovement ? 'info' : 'warning',
            priority,
            title: isImprovement ? 'Score Improved!' : 'Score Decreased',
            message,
            actions,
            data: scoreData,
            timestamp: new Date()
        });
    }

    showAnalysisComplete(data: any): void {
        if (!this.config.enabled) {
            return;
        }

        const issues = data.issues || [];
        const criticalIssues = issues.filter((i: any) => i.severity === 'critical').length;
        const highIssues = issues.filter((i: any) => i.severity === 'high').length;
        
        let message = 'Code analysis completed';
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
        let type = 'info';

        if (criticalIssues > 0) {
            message += ` - ${criticalIssues} critical issue${criticalIssues > 1 ? 's' : ''} found`;
            priority = 'critical';
            type = 'error';
        } else if (highIssues > 0) {
            message += ` - ${highIssues} high priority issue${highIssues > 1 ? 's' : ''} found`;
            priority = 'high';
            type = 'warning';
        } else {
            message += ' - No critical issues found';
        }

        const actions: NotificationAction[] = [
            {
                title: 'View Results',
                action: 'viewAnalysisResults'
            }
        ];

        if (issues.length > 0) {
            actions.unshift({
                title: 'Show Recommendations',
                action: 'showRecommendations'
            });
        }

        this.showNotification({
            type,
            priority,
            title: 'Analysis Complete',
            message,
            actions,
            data,
            timestamp: new Date()
        });
    }

    private showNotification(notification: NotificationData): void {
        if (!this.config.enabled || !this.shouldShowNotification(notification)) {
            return;
        }

        // Add to history
        this.addToHistory(notification);

        // Handle based on frequency setting
        switch (this.config.frequency) {
            case 'immediate':
                this.displayNotification(notification);
                break;
                
            case 'batched':
                this.addToBatch(notification);
                break;
                
            case 'smart':
                if (this.shouldShowImmediately(notification)) {
                    this.displayNotification(notification);
                } else {
                    this.addToBatch(notification);
                }
                break;
        }
    }

    private shouldShowNotification(notification: NotificationData | any): boolean {
        // Check if notifications are enabled
        if (!this.config.enabled) {
            return false;
        }

        // Check priority threshold
        const priorityLevels = ['low', 'medium', 'high', 'critical'];
        const notificationLevel = priorityLevels.indexOf(notification.priority || 'medium');
        const configLevel = priorityLevels.indexOf(this.config.priority);
        
        if (notificationLevel < configLevel) {
            return false;
        }

        // Check for recent duplicates
        const key = this.getNotificationKey(notification);
        const recent = this.recentNotifications.get(key);
        
        if (recent && (Date.now() - recent.getTime()) < this.DEDUPE_WINDOW) {
            return false;
        }

        this.recentNotifications.set(key, new Date());
        return true;
    }

    private shouldShowImmediately(notification: NotificationData): boolean {
        // Always show critical and high priority immediately
        if (notification.priority === 'critical' || notification.priority === 'high') {
            return true;
        }

        // Show errors immediately
        if (notification.type === 'error') {
            return true;
        }

        // Show score improvements immediately
        if (notification.type === 'info' && notification.message.includes('improved')) {
            return true;
        }

        return false;
    }

    private displayNotification(notification: NotificationData): void {
        const options: vscode.MessageOptions = {};

        // Add modal option for critical notifications
        if (notification.priority === 'critical') {
            options.modal = true;
        }

        // Prepare action buttons
        const actions = notification.actions?.map(action => action.title) || [];
        
        let notificationPromise: Thenable<string | undefined>;

        switch (notification.type) {
            case 'error':
                notificationPromise = vscode.window.showErrorMessage(
                    notification.message,
                    options,
                    ...actions
                );
                break;
                
            case 'warning':
                notificationPromise = vscode.window.showWarningMessage(
                    notification.message,
                    options,
                    ...actions
                );
                break;
                
            default:
                notificationPromise = vscode.window.showInformationMessage(
                    notification.message,
                    options,
                    ...actions
                );
                break;
        }

        // Handle action selection
        if (notification.actions && notification.actions.length > 0) {
            notificationPromise.then(selectedAction => {
                if (selectedAction) {
                    const action = notification.actions?.find(a => a.title === selectedAction);
                    if (action) {
                        this.executeAction(action, notification);
                    }
                }
            });
        }
    }

    private addToBatch(notification: NotificationData): void {
        this.pendingBatch.push(notification);

        // Start or reset batch timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }

        this.batchTimer = setTimeout(() => {
            this.processPendingBatch();
        }, this.BATCH_DELAY);
    }

    private processPendingBatch(): void {
        if (this.pendingBatch.length === 0) {
            return;
        }

        // Group notifications by priority
        const critical = this.pendingBatch.filter(n => n.priority === 'critical');
        const high = this.pendingBatch.filter(n => n.priority === 'high');
        const medium = this.pendingBatch.filter(n => n.priority === 'medium');
        const low = this.pendingBatch.filter(n => n.priority === 'low');

        // Show highest priority notifications first
        [...critical, ...high].forEach(n => this.displayNotification(n));

        // Batch medium and low priority notifications
        if (medium.length + low.length > 0) {
            this.showBatchedNotification([...medium, ...low]);
        }

        // Clear batch
        this.pendingBatch = [];
        this.batchTimer = null;
    }

    private showBatchedNotification(notifications: NotificationData[]): void {
        if (notifications.length === 1) {
            this.displayNotification(notifications[0]);
            return;
        }

        const count = notifications.length;
        const message = `${count} CodeFortify updates available`;
        
        vscode.window.showInformationMessage(
            message,
            'View Updates',
            'Dismiss'
        ).then(selection => {
            if (selection === 'View Updates') {
                this.showNotificationHistory();
            }
        });
    }

    private executeAction(action: NotificationAction, notification: NotificationData): void {
        switch (action.action) {
            case 'viewScoreDetails':
                vscode.commands.executeCommand('codefortify.showStatus');
                break;
                
            case 'showRecommendations':
                vscode.commands.executeCommand('codefortify.showRecommendations');
                break;
                
            case 'viewAnalysisResults':
                vscode.commands.executeCommand('codefortify.showStatus');
                break;
                
            case 'runAnalysis':
                vscode.commands.executeCommand('codefortify.runAnalysis');
                break;
                
            case 'openSettings':
                vscode.commands.executeCommand('codefortify.openSettings');
                break;
                
            default:
                console.log(`Unknown action: ${action.action}`);
        }
    }

    private createActionsFromData(data: any): NotificationAction[] {
        const actions: NotificationAction[] = [];
        
        // Add context-specific actions based on notification type
        switch (data.type) {
            case 'score_improvement':
            case 'score_degradation':
                actions.push({
                    title: 'View Details',
                    action: 'viewScoreDetails'
                });
                break;
                
            case 'analysis_complete':
                actions.push({
                    title: 'View Results',
                    action: 'viewAnalysisResults'
                });
                if (data.data?.issues?.length > 0) {
                    actions.push({
                        title: 'Show Recommendations',
                        action: 'showRecommendations'
                    });
                }
                break;
                
            case 'error_occurred':
                actions.push({
                    title: 'View Logs',
                    action: 'viewLogs'
                });
                actions.push({
                    title: 'Settings',
                    action: 'openSettings'
                });
                break;
        }

        return actions;
    }

    private getScorePriority(score: number, change: number, isImprovement: boolean): 'low' | 'medium' | 'high' | 'critical' {
        // Critical: Major degradation (>5 points) or score drops below 50
        if (!isImprovement && (change > 5 || score < 50)) {
            return 'critical';
        }
        
        // High: Significant change (>3 points) or major improvement
        if (change > 3 || (isImprovement && score > 90)) {
            return 'high';
        }
        
        // Medium: Moderate change (>1 point)
        if (change > 1) {
            return 'medium';
        }
        
        return 'low';
    }

    private getNotificationKey(notification: NotificationData | any): string {
        // Create a key for deduplication
        return `${notification.type}_${notification.title}_${notification.message}`.toLowerCase();
    }

    private addToHistory(notification: NotificationData): void {
        this.notificationHistory.unshift(notification);
        
        // Keep history size manageable
        if (this.notificationHistory.length > this.MAX_HISTORY) {
            this.notificationHistory = this.notificationHistory.slice(0, this.MAX_HISTORY);
        }
    }

    private cleanupHistory(): void {
        // Remove old notifications (older than 24 hours)
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.notificationHistory = this.notificationHistory.filter(
            n => n.timestamp > cutoff
        );
        
        // Clean up recent notifications map
        for (const [key, timestamp] of this.recentNotifications.entries()) {
            if (Date.now() - timestamp.getTime() > this.DEDUPE_WINDOW) {
                this.recentNotifications.delete(key);
            }
        }
    }

    private showNotificationHistory(): void {
        // Create quick pick with recent notifications
        const items = this.notificationHistory.slice(0, 20).map(n => ({
            label: n.title,
            description: n.message,
            detail: n.timestamp.toLocaleString(),
            notification: n
        }));

        if (items.length === 0) {
            vscode.window.showInformationMessage('No recent notifications');
            return;
        }

        vscode.window.showQuickPick(items, {
            placeHolder: 'Select notification to view details'
        }).then(selected => {
            if (selected) {
                // Show selected notification details
                this.displayNotification(selected.notification);
            }
        });
    }

    private loadConfiguration(): NotificationConfiguration {
        const config = vscode.workspace.getConfiguration('codefortify');
        return {
            enabled: config.get('notifications.enabled', true),
            priority: config.get('notifications.priority', 'medium'),
            frequency: config.get('notifications.frequency', 'smart'),
            sound: config.get('notifications.sound', false)
        };
    }

    private loadNotificationPreferences(): void {
        // Load any persisted user preferences
        // This could include dismissed notification types, etc.
    }

    private saveNotificationPreferences(): void {
        // Save user preferences for next session
    }

    // Public methods for testing/debugging
    public getNotificationHistory(): NotificationData[] {
        return [...this.notificationHistory];
    }

    public clearHistory(): void {
        this.notificationHistory = [];
        this.recentNotifications.clear();
    }
}