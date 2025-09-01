/**
 * CodeFortify File Status Writer
 * 
 * Writes status information to files for external tools integration
 * Supports JSON, Markdown, and plain text formats
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export class FileStatusWriter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            outputDir: options.outputDir || '.codefortify',
            formats: options.formats || ['json', 'markdown', 'text'],
            updateInterval: options.updateInterval || 5000,
            includeTimestamps: options.includeTimestamps !== false,
            includeHistory: options.includeHistory !== false,
            maxHistoryEntries: options.maxHistoryEntries || 50,
            ...options
        };

        this.currentStatus = {
            score: null,
            phase: 'idle',
            progress: 0,
            message: 'Ready',
            issues: { critical: 0, high: 0, medium: 0, low: 0 },
            trend: null,
            lastUpdate: null,
            sessionId: null,
            elapsedTime: 0,
            categories: {},
            agents: {},
            recommendations: []
        };

        this.statusHistory = [];
        this.writeTimer = null;
    }

    /**
     * Initialize the file status writer
     */
    async initialize() {
        try {
            // Ensure output directory exists
            if (!existsSync(this.options.outputDir)) {
                await mkdir(this.options.outputDir, { recursive: true });
            }

            // Start periodic writing
            this.startPeriodicWrite();
            
            this.emit('initialized');
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Update status and write to files
     */
    async updateStatus(status) {
        // Merge with current status
        Object.assign(this.currentStatus, {
            ...status,
            lastUpdate: new Date().toISOString()
        });

        // Add to history if significant change
        if (this.isSignificantChange(status)) {
            this.addToHistory(this.currentStatus);
        }

        // Write immediately for important updates
        if (this.isImportantUpdate(status)) {
            await this.writeAllFormats();
        }

        this.emit('statusUpdated', this.currentStatus);
    }

    /**
     * Start periodic file writing
     */
    startPeriodicWrite() {
        if (this.writeTimer) {
            clearInterval(this.writeTimer);
        }

        this.writeTimer = setInterval(async () => {
            try {
                await this.writeAllFormats();
            } catch (error) {
                this.emit('error', error);
            }
        }, this.options.updateInterval);
    }

    /**
     * Stop periodic writing
     */
    stop() {
        if (this.writeTimer) {
            clearInterval(this.writeTimer);
            this.writeTimer = null;
        }
    }

    /**
     * Write all configured formats
     */
    async writeAllFormats() {
        const promises = [];

        if (this.options.formats.includes('json')) {
            promises.push(this.writeJsonStatus());
        }

        if (this.options.formats.includes('markdown')) {
            promises.push(this.writeMarkdownStatus());
        }

        if (this.options.formats.includes('text')) {
            promises.push(this.writeTextStatus());
        }

        if (this.options.formats.includes('badges')) {
            promises.push(this.writeBadges());
        }

        await Promise.all(promises);
        this.emit('filesWritten', this.options.formats);
    }

    /**
     * Write JSON status file
     */
    async writeJsonStatus() {
        const jsonData = {
            timestamp: new Date().toISOString(),
            status: this.currentStatus,
            metadata: {
                version: '1.0.0',
                format: 'codefortify-status-v1'
            }
        };

        if (this.options.includeHistory) {
            jsonData.history = this.statusHistory;
        }

        const filePath = path.join(this.options.outputDir, 'status.json');
        await writeFile(filePath, JSON.stringify(jsonData, null, 2));
    }

    /**
     * Write Markdown status file
     */
    async writeMarkdownStatus() {
        const status = this.currentStatus;
        const timestamp = new Date().toLocaleString();
        
        let markdown = `# CodeFortify Status\n\n`;
        
        // Status badge
        const scoreColor = this.getScoreColor(status.score);
        const scoreBadge = status.score !== null 
            ? `![Score](https://img.shields.io/badge/Score-${status.score.toFixed(1)}-${scoreColor})`
            : `![Score](https://img.shields.io/badge/Score-Unknown-lightgrey)`;
        
        markdown += `${scoreBadge}\n\n`;
        
        // Current status
        markdown += `## Current Status\n\n`;
        markdown += `- **Overall Score**: ${status.score?.toFixed(1) || 'N/A'}/100\n`;
        markdown += `- **Phase**: ${this.formatPhase(status.phase)}\n`;
        markdown += `- **Progress**: ${status.progress}%\n`;
        markdown += `- **Status**: ${status.message}\n`;
        markdown += `- **Last Update**: ${timestamp}\n\n`;
        
        // Issues summary
        if (this.hasIssues(status.issues)) {
            markdown += `## Issues Found\n\n`;
            markdown += `| Severity | Count |\n`;
            markdown += `|----------|-------|\n`;
            markdown += `| Critical | ${status.issues.critical || 0} |\n`;
            markdown += `| High | ${status.issues.high || 0} |\n`;
            markdown += `| Medium | ${status.issues.medium || 0} |\n`;
            markdown += `| Low | ${status.issues.low || 0} |\n\n`;
        }
        
        // Categories breakdown
        if (Object.keys(status.categories).length > 0) {
            markdown += `## Category Scores\n\n`;
            markdown += `| Category | Score | Status |\n`;
            markdown += `|----------|-------|--------|\n`;
            
            Object.entries(status.categories).forEach(([category, data]) => {
                const score = data.score?.toFixed(1) || 'N/A';
                const statusIcon = this.getStatusIcon(data.status);
                markdown += `| ${category} | ${score} | ${statusIcon} |\n`;
            });
            markdown += '\n';
        }
        
        // Recommendations
        if (status.recommendations && status.recommendations.length > 0) {
            markdown += `## Top Recommendations\n\n`;
            status.recommendations.slice(0, 5).forEach((rec, index) => {
                markdown += `${index + 1}. **${rec.title}** (${rec.priority})\n`;
                markdown += `   - ${rec.description}\n`;
                if (rec.file) {
                    markdown += `   - File: \`${rec.file}:${rec.line || ''}\`\n`;
                }
                markdown += '\n';
            });
        }
        
        // Footer
        markdown += `---\n\n`;
        markdown += `*Generated by CodeFortify at ${timestamp}*\n`;
        
        const filePath = path.join(this.options.outputDir, 'STATUS.md');
        await writeFile(filePath, markdown);
    }

    /**
     * Write plain text status file
     */
    async writeTextStatus() {
        const status = this.currentStatus;
        const timestamp = new Date().toLocaleString();
        
        let text = `CodeFortify Status Report\n`;
        text += `${'='.repeat(50)}\n\n`;
        
        text += `Generated: ${timestamp}\n`;
        text += `Score: ${status.score?.toFixed(1) || 'N/A'}/100\n`;
        text += `Phase: ${this.formatPhase(status.phase)}\n`;
        text += `Progress: ${status.progress}%\n`;
        text += `Status: ${status.message}\n\n`;
        
        // Issues
        if (this.hasIssues(status.issues)) {
            text += `Issues Found:\n`;
            text += `- Critical: ${status.issues.critical || 0}\n`;
            text += `- High: ${status.issues.high || 0}\n`;
            text += `- Medium: ${status.issues.medium || 0}\n`;
            text += `- Low: ${status.issues.low || 0}\n\n`;
        }
        
        // Categories
        if (Object.keys(status.categories).length > 0) {
            text += `Category Scores:\n`;
            Object.entries(status.categories).forEach(([category, data]) => {
                const score = data.score?.toFixed(1) || 'N/A';
                text += `- ${category}: ${score}\n`;
            });
            text += '\n';
        }
        
        const filePath = path.join(this.options.outputDir, 'status.txt');
        await writeFile(filePath, text);
    }

    /**
     * Write badge files for README integration
     */
    async writeBadges() {
        const status = this.currentStatus;
        
        // Score badge data
        const scoreBadge = {
            schemaVersion: 1,
            label: 'CodeFortify Score',
            message: status.score !== null ? `${status.score.toFixed(1)}/100` : 'Unknown',
            color: this.getScoreColor(status.score),
            style: 'flat-square'
        };

        // Status badge data
        const statusBadge = {
            schemaVersion: 1,
            label: 'Status',
            message: this.formatPhase(status.phase),
            color: this.getPhaseColor(status.phase),
            style: 'flat-square'
        };

        // Issues badge data
        const totalIssues = Object.values(status.issues).reduce((sum, count) => sum + count, 0);
        const issuesBadge = {
            schemaVersion: 1,
            label: 'Issues',
            message: totalIssues > 0 ? `${totalIssues} found` : 'None',
            color: totalIssues > 0 ? 'red' : 'green',
            style: 'flat-square'
        };

        // Write badge files
        await writeFile(
            path.join(this.options.outputDir, 'score-badge.json'),
            JSON.stringify(scoreBadge, null, 2)
        );

        await writeFile(
            path.join(this.options.outputDir, 'status-badge.json'),
            JSON.stringify(statusBadge, null, 2)
        );

        await writeFile(
            path.join(this.options.outputDir, 'issues-badge.json'),
            JSON.stringify(issuesBadge, null, 2)
        );

        // Write shield URLs
        const shieldsContent = [
            '# CodeFortify Badges',
            '',
            '## Shield.io URLs',
            '',
            `Score: https://img.shields.io/badge/CodeFortify-${status.score?.toFixed(1) || 'Unknown'}-${this.getScoreColor(status.score)}`,
            `Status: https://img.shields.io/badge/Status-${this.formatPhase(status.phase).replace(/\s+/g, '%20')}-${this.getPhaseColor(status.phase)}`,
            `Issues: https://img.shields.io/badge/Issues-${totalIssues > 0 ? totalIssues + '%20found' : 'None'}-${totalIssues > 0 ? 'red' : 'green'}`,
            '',
            '## Markdown Examples',
            '',
            `\`![CodeFortify Score](https://img.shields.io/badge/CodeFortify-${status.score?.toFixed(1) || 'Unknown'}-${this.getScoreColor(status.score)})\``,
            `\`![Status](https://img.shields.io/badge/Status-${this.formatPhase(status.phase).replace(/\s+/g, '%20')}-${this.getPhaseColor(status.phase)})\``,
            `\`![Issues](https://img.shields.io/badge/Issues-${totalIssues > 0 ? totalIssues + '%20found' : 'None'}-${totalIssues > 0 ? 'red' : 'green'})\``,
        ].join('\n');

        await writeFile(
            path.join(this.options.outputDir, 'badges.md'),
            shieldsContent
        );
    }

    /**
     * Add status to history
     */
    addToHistory(status) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            score: status.score,
            phase: status.phase,
            progress: status.progress,
            issues: { ...status.issues }
        };

        this.statusHistory.push(historyEntry);
        
        // Limit history size
        if (this.statusHistory.length > this.options.maxHistoryEntries) {
            this.statusHistory = this.statusHistory.slice(-this.options.maxHistoryEntries);
        }
    }

    /**
     * Check if this is a significant change worth recording
     */
    isSignificantChange(status) {
        if (!this.statusHistory.length) return true;
        
        const lastEntry = this.statusHistory[this.statusHistory.length - 1];
        
        // Score changed by more than 0.5 points
        if (Math.abs((status.score || 0) - (lastEntry.score || 0)) > 0.5) return true;
        
        // Phase changed
        if (status.phase !== lastEntry.phase) return true;
        
        // Progress changed by more than 10%
        if (Math.abs((status.progress || 0) - (lastEntry.progress || 0)) > 10) return true;
        
        return false;
    }

    /**
     * Check if this is an important update requiring immediate write
     */
    isImportantUpdate(status) {
        return status.phase === 'complete' || 
               status.phase === 'error' ||
               (status.issues && Object.values(status.issues).some(count => count > 0));
    }

    /**
     * Check if there are any issues
     */
    hasIssues(issues) {
        return Object.values(issues).some(count => count > 0);
    }

    /**
     * Get color for score badge
     */
    getScoreColor(score) {
        if (score === null || score === undefined) return 'lightgrey';
        if (score >= 90) return 'brightgreen';
        if (score >= 80) return 'green';
        if (score >= 70) return 'yellow';
        if (score >= 60) return 'orange';
        return 'red';
    }

    /**
     * Get color for phase badge
     */
    getPhaseColor(phase) {
        switch (phase) {
            case 'idle': return 'lightgrey';
            case 'analyzing': return 'blue';
            case 'enhancing': return 'orange';
            case 'testing': return 'purple';
            case 'complete': return 'brightgreen';
            case 'error': return 'red';
            default: return 'blue';
        }
    }

    /**
     * Format phase name for display
     */
    formatPhase(phase) {
        switch (phase) {
            case 'idle': return 'Idle';
            case 'analyzing': return 'Analyzing';
            case 'enhancing': return 'Enhancing';
            case 'testing': return 'Testing';
            case 'complete': return 'Complete';
            case 'error': return 'Error';
            default: return phase.charAt(0).toUpperCase() + phase.slice(1);
        }
    }

    /**
     * Get status icon for markdown
     */
    getStatusIcon(status) {
        switch (status) {
            case 'complete': return '✅';
            case 'error': return '❌';
            case 'analyzing': return '🔍';
            case 'enhancing': return '⚡';
            default: return '⏳';
        }
    }
}

/**
 * Create and initialize a file status writer
 */
export async function createFileStatusWriter(options = {}) {
    const writer = new FileStatusWriter(options);
    await writer.initialize();
    return writer;
}