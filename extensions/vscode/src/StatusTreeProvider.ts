/**
 * CodeFortify Status Tree Provider
 * 
 * Provides detailed tree view of CodeFortify status and analysis results
 */

import * as vscode from 'vscode';

export interface StatusTreeItem {
    id: string;
    label: string;
    description?: string;
    tooltip?: string;
    iconPath?: string | vscode.ThemeIcon;
    contextValue?: string;
    collapsibleState?: vscode.TreeItemCollapsibleState;
    children?: StatusTreeItem[];
    data?: any;
}

export interface AnalysisResult {
    category: string;
    score: number;
    status: string;
    issues: Array<{
        severity: string;
        message: string;
        file?: string;
        line?: number;
        column?: number;
    }>;
    recommendations: Array<{
        priority: string;
        title: string;
        description: string;
        action?: string;
    }>;
}

export class StatusTreeProvider implements vscode.TreeDataProvider<StatusTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StatusTreeItem | undefined | null | void> = new vscode.EventEmitter<StatusTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StatusTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private statusData: any = null;
    private analysisResults: AnalysisResult[] = [];
    private agentStatuses: Map<string, any> = new Map();

    constructor() {
        // Initialize with default tree structure
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StatusTreeItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, element.collapsibleState);
        
        if (element.description) {
            item.description = element.description;
        }
        
        if (element.tooltip) {
            item.tooltip = element.tooltip;
        }
        
        if (element.iconPath) {
            item.iconPath = element.iconPath;
        }
        
        if (element.contextValue) {
            item.contextValue = element.contextValue;
        }

        // Add commands for actionable items
        if (element.contextValue === 'recommendation') {
            item.command = {
                command: 'codefortify.applyRecommendation',
                title: 'Apply Recommendation',
                arguments: [element.data]
            };
        } else if (element.contextValue === 'issue') {
            item.command = {
                command: 'codefortify.goToIssue',
                title: 'Go to Issue',
                arguments: [element.data]
            };
        } else if (element.contextValue === 'category') {
            item.command = {
                command: 'codefortify.showCategoryDetails',
                title: 'Show Category Details',
                arguments: [element.data]
            };
        }
        
        return item;
    }

    getChildren(element?: StatusTreeItem): Thenable<StatusTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        
        return Promise.resolve(element.children || []);
    }

    updateStatus(statusData: any): void {
        this.statusData = statusData;
        this.refresh();
    }

    updateAnalysisResults(results: AnalysisResult[]): void {
        this.analysisResults = results;
        this.refresh();
    }

    updateAgentStatus(agentId: string, status: any): void {
        this.agentStatuses.set(agentId, status);
        this.refresh();
    }

    private getRootItems(): StatusTreeItem[] {
        const items: StatusTreeItem[] = [];

        // Overall Status Section
        items.push(this.createOverallStatusItem());

        // Score Section (if available)
        if (this.statusData?.score !== undefined) {
            items.push(this.createScoreItem());
        }

        // Analysis Results Section
        if (this.analysisResults.length > 0) {
            items.push(this.createAnalysisResultsItem());
        }

        // Agents Status Section
        if (this.agentStatuses.size > 0) {
            items.push(this.createAgentStatusItem());
        }

        // Recommendations Section
        const recommendations = this.getAllRecommendations();
        if (recommendations.length > 0) {
            items.push(this.createRecommendationsItem(recommendations));
        }

        // Issues Section
        const issues = this.getAllIssues();
        if (issues.length > 0) {
            items.push(this.createIssuesItem(issues));
        }

        return items;
    }

    private createOverallStatusItem(): StatusTreeItem {
        let status = 'Ready';
        let icon: vscode.ThemeIcon = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.green'));
        let description = '';

        if (this.statusData) {
            status = this.statusData.phase || 'Unknown';
            description = this.statusData.message || '';

            switch (this.statusData.phase) {
                case 'analyzing':
                    icon = new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.yellow'));
                    break;
                case 'enhancing':
                    icon = new vscode.ThemeIcon('rocket', new vscode.ThemeColor('charts.blue'));
                    break;
                case 'testing':
                    icon = new vscode.ThemeIcon('beaker', new vscode.ThemeColor('charts.purple'));
                    break;
                case 'complete':
                    icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
                    break;
                case 'error':
                    icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
                    break;
                default:
                    icon = new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.blue'));
            }
        }

        const children: StatusTreeItem[] = [];

        if (this.statusData) {
            if (this.statusData.progress !== undefined && this.statusData.progress > 0 && this.statusData.progress < 100) {
                children.push({
                    id: 'progress',
                    label: `Progress: ${Math.round(this.statusData.progress)}%`,
                    iconPath: new vscode.ThemeIcon('loading~spin'),
                    collapsibleState: vscode.TreeItemCollapsibleState.None
                });
            }

            if (this.statusData.category) {
                children.push({
                    id: 'category',
                    label: `Category: ${this.statusData.category}`,
                    iconPath: new vscode.ThemeIcon('tag'),
                    collapsibleState: vscode.TreeItemCollapsibleState.None
                });
            }

            if (this.statusData.elapsedTime) {
                const elapsed = Math.round(this.statusData.elapsedTime / 1000);
                children.push({
                    id: 'elapsed',
                    label: `Elapsed: ${elapsed}s`,
                    iconPath: new vscode.ThemeIcon('clock'),
                    collapsibleState: vscode.TreeItemCollapsibleState.None
                });
            }
        }

        return {
            id: 'overall-status',
            label: `Status: ${status}`,
            description,
            iconPath: icon,
            tooltip: `Current CodeFortify status: ${status}${description ? `\n${description}` : ''}`,
            collapsibleState: children.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
            children,
            contextValue: 'status'
        };
    }

    private createScoreItem(): StatusTreeItem {
        const score = this.statusData.score;
        const previousScore = this.statusData.previousScore;
        
        let color: vscode.ThemeColor;
        let icon: vscode.ThemeIcon;
        
        if (score >= 90) {
            color = new vscode.ThemeColor('charts.green');
            icon = new vscode.ThemeIcon('star-full');
        } else if (score >= 75) {
            color = new vscode.ThemeColor('charts.blue');
            icon = new vscode.ThemeIcon('thumbsup');
        } else if (score >= 60) {
            color = new vscode.ThemeColor('charts.yellow');
            icon = new vscode.ThemeIcon('warning');
        } else {
            color = new vscode.ThemeColor('charts.red');
            icon = new vscode.ThemeIcon('thumbsdown');
        }

        icon = new vscode.ThemeIcon(icon.id, color);

        let description = '';
        let trend = '';

        if (previousScore !== undefined) {
            const change = score - previousScore;
            if (Math.abs(change) > 0.1) {
                trend = change > 0 ? ' ↗' : ' ↘';
                description = `${change >= 0 ? '+' : ''}${change.toFixed(1)}`;
            }
        }

        const children: StatusTreeItem[] = [];

        // Add category scores if available
        if (this.statusData.categoryScores) {
            Object.entries(this.statusData.categoryScores).forEach(([category, categoryScore]: [string, any]) => {
                children.push({
                    id: `score-${category}`,
                    label: `${category}: ${categoryScore.toFixed(1)}`,
                    iconPath: new vscode.ThemeIcon('tag'),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    contextValue: 'category-score',
                    data: { category, score: categoryScore }
                });
            });
        }

        return {
            id: 'score',
            label: `Score: ${score.toFixed(1)}/100${trend}`,
            description,
            iconPath: icon,
            tooltip: `Current code quality score: ${score.toFixed(1)}/100${previousScore !== undefined ? `\nPrevious: ${previousScore.toFixed(1)}` : ''}`,
            collapsibleState: children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
            children,
            contextValue: 'score'
        };
    }

    private createAnalysisResultsItem(): StatusTreeItem {
        const children = this.analysisResults.map(result => this.createAnalysisResultItem(result));
        
        return {
            id: 'analysis-results',
            label: `Analysis Results (${this.analysisResults.length})`,
            iconPath: new vscode.ThemeIcon('search-view-icon'),
            tooltip: 'Detailed analysis results by category',
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            children,
            contextValue: 'analysis-results'
        };
    }

    private createAnalysisResultItem(result: AnalysisResult): StatusTreeItem {
        let icon: vscode.ThemeIcon;
        let color: vscode.ThemeColor;

        if (result.score >= 90) {
            color = new vscode.ThemeColor('charts.green');
            icon = new vscode.ThemeIcon('pass', color);
        } else if (result.score >= 75) {
            color = new vscode.ThemeColor('charts.blue');
            icon = new vscode.ThemeIcon('info', color);
        } else if (result.score >= 60) {
            color = new vscode.ThemeColor('charts.yellow');
            icon = new vscode.ThemeIcon('warning', color);
        } else {
            color = new vscode.ThemeColor('charts.red');
            icon = new vscode.ThemeIcon('error', color);
        }

        const issuesCount = result.issues.length;
        const recommendationsCount = result.recommendations.length;

        return {
            id: `analysis-${result.category}`,
            label: result.category,
            description: `${result.score.toFixed(1)} (${issuesCount} issues, ${recommendationsCount} recommendations)`,
            iconPath: icon,
            tooltip: `${result.category}: ${result.score.toFixed(1)}/100\n${issuesCount} issues, ${recommendationsCount} recommendations`,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            children: [],
            contextValue: 'category',
            data: result
        };
    }

    private createAgentStatusItem(): StatusTreeItem {
        const children: StatusTreeItem[] = [];

        for (const [agentId, status] of this.agentStatuses) {
            let icon: vscode.ThemeIcon;
            let color: vscode.ThemeColor;

            switch (status.status) {
                case 'running':
                    icon = new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.blue'));
                    break;
                case 'completed':
                    icon = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
                    break;
                case 'failed':
                    icon = new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
                    break;
                default:
                    icon = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('charts.gray'));
            }

            children.push({
                id: `agent-${agentId}`,
                label: status.agentType,
                description: `${status.status} (${status.progress}%)`,
                iconPath: icon,
                tooltip: `${status.agentType}: ${status.status}\nProgress: ${status.progress}%\nMessage: ${status.message}`,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: 'agent',
                data: status
            });
        }

        return {
            id: 'agent-status',
            label: `Agents (${children.length})`,
            iconPath: new vscode.ThemeIcon('organization'),
            tooltip: 'Status of all analysis agents',
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            children,
            contextValue: 'agents'
        };
    }

    private createRecommendationsItem(recommendations: any[]): StatusTreeItem {
        const children = recommendations.map((rec, index) => ({
            id: `recommendation-${index}`,
            label: rec.title,
            description: rec.priority,
            iconPath: this.getRecommendationIcon(rec.priority),
            tooltip: `${rec.title}\n${rec.description}`,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'recommendation',
            data: rec
        }));

        return {
            id: 'recommendations',
            label: `Recommendations (${recommendations.length})`,
            iconPath: new vscode.ThemeIcon('lightbulb'),
            tooltip: 'AI-generated recommendations for improvement',
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            children,
            contextValue: 'recommendations'
        };
    }

    private createIssuesItem(issues: any[]): StatusTreeItem {
        const children = issues.map((issue, index) => ({
            id: `issue-${index}`,
            label: issue.message,
            description: issue.severity,
            iconPath: this.getIssueIcon(issue.severity),
            tooltip: `${issue.message}\nFile: ${issue.file || 'Unknown'}\nLine: ${issue.line || 'Unknown'}`,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'issue',
            data: issue
        }));

        // Group by severity
        const critical = children.filter(c => c.data.severity === 'critical');
        const high = children.filter(c => c.data.severity === 'high');
        const medium = children.filter(c => c.data.severity === 'medium');
        const low = children.filter(c => c.data.severity === 'low');

        const groupedChildren: StatusTreeItem[] = [];

        if (critical.length > 0) {
            groupedChildren.push({
                id: 'critical-issues',
                label: `Critical (${critical.length})`,
                iconPath: new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red')),
                collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
                children: critical,
                contextValue: 'issue-group'
            });
        }

        if (high.length > 0) {
            groupedChildren.push({
                id: 'high-issues',
                label: `High (${high.length})`,
                iconPath: new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.orange')),
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                children: high,
                contextValue: 'issue-group'
            });
        }

        if (medium.length > 0) {
            groupedChildren.push({
                id: 'medium-issues',
                label: `Medium (${medium.length})`,
                iconPath: new vscode.ThemeIcon('info', new vscode.ThemeColor('charts.yellow')),
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                children: medium,
                contextValue: 'issue-group'
            });
        }

        if (low.length > 0) {
            groupedChildren.push({
                id: 'low-issues',
                label: `Low (${low.length})`,
                iconPath: new vscode.ThemeIcon('info', new vscode.ThemeColor('charts.blue')),
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                children: low,
                contextValue: 'issue-group'
            });
        }

        return {
            id: 'issues',
            label: `Issues (${issues.length})`,
            iconPath: new vscode.ThemeIcon('issues'),
            tooltip: 'Code issues found during analysis',
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            children: groupedChildren,
            contextValue: 'issues'
        };
    }

    private getAllRecommendations(): any[] {
        const recommendations: any[] = [];
        
        this.analysisResults.forEach(result => {
            recommendations.push(...result.recommendations);
        });

        return recommendations;
    }

    private getAllIssues(): any[] {
        const issues: any[] = [];
        
        this.analysisResults.forEach(result => {
            issues.push(...result.issues);
        });

        return issues;
    }

    private getRecommendationIcon(priority: string): vscode.ThemeIcon {
        switch (priority) {
            case 'critical':
                return new vscode.ThemeIcon('flame', new vscode.ThemeColor('charts.red'));
            case 'high':
                return new vscode.ThemeIcon('arrow-up', new vscode.ThemeColor('charts.orange'));
            case 'medium':
                return new vscode.ThemeIcon('arrow-right', new vscode.ThemeColor('charts.yellow'));
            case 'low':
                return new vscode.ThemeIcon('arrow-down', new vscode.ThemeColor('charts.blue'));
            default:
                return new vscode.ThemeIcon('lightbulb');
        }
    }

    private getIssueIcon(severity: string): vscode.ThemeIcon {
        switch (severity) {
            case 'critical':
                return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
            case 'high':
                return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.orange'));
            case 'medium':
                return new vscode.ThemeIcon('info', new vscode.ThemeColor('charts.yellow'));
            case 'low':
                return new vscode.ThemeIcon('info', new vscode.ThemeColor('charts.blue'));
            default:
                return new vscode.ThemeIcon('circle-outline');
        }
    }
}