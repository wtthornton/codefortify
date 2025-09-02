/**
 * File Size Monitor - Real-time prevention of large files
 *
 * Monitors file changes and provides immediate feedback when files
 * are growing too large, helping prevent technical debt accumulation.
 */

import { EventEmitter } from 'events';
import { watch } from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export class FileSizeMonitor extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      watchPatterns: config.watchPatterns || ['**/*.{js,ts,jsx,tsx}'],
      ignorePatterns: config.ignorePatterns || [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        'coverage/**'
      ],
      thresholds: {
        warning: config.warningThreshold || 300,
        major: config.majorThreshold || 500,
        critical: config.criticalThreshold || 1000,
        methods: config.methodThreshold || 15
      },
      enableRealTimeAlerts: config.enableRealTimeAlerts !== false,
      alertCooldown: config.alertCooldown || 30000, // 30 seconds between alerts
      ...config
    };

    this.watcher = null;
    this.lastAlerts = new Map(); // Track alert cooldowns
    this.isMonitoring = false;
  }

  /**
   * Start monitoring file sizes in the project
   */
  async startMonitoring(projectRoot) {
    if (this.isMonitoring) {
      return;
    }

    try {
      this.projectRoot = projectRoot;

      // Initialize watcher
      this.watcher = watch(this.config.watchPatterns, {
        cwd: projectRoot,
        ignored: this.config.ignorePatterns,
        ignoreInitial: false,
        persistent: true
      });

      // Set up event handlers
      this.watcher
        .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
        .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
        .on('error', (error) => this.emit('error', error));

      this.isMonitoring = true;
      this.emit('monitoring-started', { projectRoot, config: this.config });

      if (this.config.enableRealTimeAlerts) {
        console.log(chalk.blue('📏 File size monitoring active - watching for large files...'));
      }

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.isMonitoring = false;
    this.lastAlerts.clear();
    this.emit('monitoring-stopped');
  }

  /**
   * Handle file changes
   */
  async handleFileChange(relativePath, changeType) {
    try {
      const fullPath = path.join(this.projectRoot, relativePath);
      const analysis = await this.analyzeFile(fullPath);

      if (analysis.needsAlert) {
        await this.handleSizeAlert(relativePath, analysis, changeType);
      }

      this.emit('file-analyzed', {
        path: relativePath,
        analysis,
        changeType
      });

    } catch (error) {
      // Skip files that can't be read
    }
  }

  /**
   * Analyze a single file for size and complexity issues
   */
  async analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const fileName = path.basename(filePath);

    const analysis = {
      lines,
      fileName,
      filePath,
      needsAlert: false,
      severity: 'info',
      issues: [],
      suggestions: []
    };

    // Check size thresholds
    if (lines >= this.config.thresholds.critical) {
      analysis.severity = 'critical';
      analysis.needsAlert = true;
      analysis.issues.push(`File has ${lines} lines (critical threshold: ${this.config.thresholds.critical})`);
      analysis.suggestions.push('IMMEDIATE ACTION: Split this file into smaller modules');
    } else if (lines >= this.config.thresholds.major) {
      analysis.severity = 'major';
      analysis.needsAlert = true;
      analysis.issues.push(`File has ${lines} lines (major threshold: ${this.config.thresholds.major})`);
      analysis.suggestions.push('Consider splitting this file into logical modules');
    } else if (lines >= this.config.thresholds.warning) {
      analysis.severity = 'warning';
      analysis.needsAlert = true;
      analysis.issues.push(`File has ${lines} lines (warning threshold: ${this.config.thresholds.warning})`);
      analysis.suggestions.push('Monitor this file - it may need splitting soon');
    }

    // Analyze complexity patterns
    const complexity = this.analyzeComplexity(content, fileName);
    if (complexity.issues.length > 0) {
      analysis.issues.push(...complexity.issues);
      analysis.suggestions.push(...complexity.suggestions);
      if (complexity.severity === 'major' || complexity.severity === 'critical') {
        analysis.needsAlert = true;
        analysis.severity = complexity.severity;
      }
    }

    return analysis;
  }

  /**
   * Analyze file complexity patterns
   */
  analyzeComplexity(content, fileName) {
    const complexity = {
      issues: [],
      suggestions: [],
      severity: 'info'
    };

    // Count methods
    const methodMatches = content.match(/(?:async\s+)?(?:function\s+\w+|\w+\s*\([^)]*\)\s*\{|(?:async\s+)?\w+\s*\([^)]*\)\s*(?:=>|{))/g);
    const methodCount = methodMatches ? methodMatches.length : 0;

    if (methodCount > this.config.thresholds.methods) {
      complexity.severity = 'major';
      complexity.issues.push(`File has ${methodCount} methods (threshold: ${this.config.thresholds.methods})`);
      complexity.suggestions.push('Extract related methods into separate classes or modules');
    }

    // Detect command coordinator anti-pattern
    if (fileName.includes('Coordinator') || fileName.includes('Manager')) {
      const executeMatches = content.match(/execute\w+\s*\(/g);
      if (executeMatches && executeMatches.length > 10) {
        complexity.severity = 'major';
        complexity.issues.push(`Command anti-pattern: ${executeMatches.length} execute methods`);
        complexity.suggestions.push('Refactor using proper Command pattern with separate command classes');
      }
    }

    // Detect duplicate documentation
    const duplicateComments = content.match(/\/\*\*[\s\*]*\w+\s+class\s+implementation[\s\*]*\*\//g);
    if (duplicateComments && duplicateComments.length > 2) {
      complexity.issues.push(`${duplicateComments.length} duplicate JSDoc blocks detected`);
      complexity.suggestions.push('Remove duplicate documentation blocks');
    }

    return complexity;
  }

  /**
   * Handle size alerts with cooldown
   */
  async handleSizeAlert(filePath, analysis, changeType) {
    const alertKey = `${filePath}-${analysis.severity}`;
    const now = Date.now();

    // Check cooldown
    if (this.lastAlerts.has(alertKey)) {
      const lastAlert = this.lastAlerts.get(alertKey);
      if (now - lastAlert < this.config.alertCooldown) {
        return; // Skip alert due to cooldown
      }
    }

    this.lastAlerts.set(alertKey, now);

    if (this.config.enableRealTimeAlerts) {
      this.displayAlert(filePath, analysis, changeType);
    }

    this.emit('size-alert', {
      filePath,
      analysis,
      changeType,
      timestamp: now
    });
  }

  /**
   * Display colored alert to console
   */
  displayAlert(filePath, analysis, changeType) {
    const { severity, lines, issues, suggestions } = analysis;

    // Choose colors based on severity
    const colors = {
      warning: chalk.yellow,
      major: chalk.orange || chalk.yellow,
      critical: chalk.red
    };

    const icons = {
      warning: '⚠️',
      major: '🚨',
      critical: '🔥'
    };

    const color = colors[severity] || chalk.white;
    const icon = icons[severity] || '📏';

    console.log('\n' + '─'.repeat(60));
    console.log(color.bold(`${icon} FILE SIZE ALERT (${severity.toUpperCase()})`));
    console.log(color(`File: ${filePath} (${changeType})`));
    console.log(color(`Lines: ${lines}`));

    if (issues.length > 0) {
      console.log(color('\nIssues:'));
      issues.forEach(issue => console.log(color(`  • ${issue}`)));
    }

    if (suggestions.length > 0) {
      console.log(chalk.cyan('\nSuggestions:'));
      suggestions.forEach(suggestion => console.log(chalk.cyan(`  💡 ${suggestion}`)));
    }

    console.log('─'.repeat(60) + '\n');
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      projectRoot: this.projectRoot,
      config: this.config,
      activeAlerts: this.lastAlerts.size
    };
  }

  /**
   * Update monitoring thresholds
   */
  updateThresholds(newThresholds) {
    this.config.thresholds = { ...this.config.thresholds, ...newThresholds };
    this.emit('thresholds-updated', this.config.thresholds);
  }

  /**
   * Generate monitoring report
   */
  async generateReport(projectRoot = this.projectRoot) {
    if (!projectRoot) {
      throw new Error('No project root specified for monitoring report');
    }

    const report = {
      timestamp: new Date().toISOString(),
      projectRoot,
      thresholds: this.config.thresholds,
      files: []
    };

    // Scan all files for current status
    const { FileSizeAnalyzer } = await import('../scoring/analyzers/FileSizeAnalyzer.js');
    const analyzer = new FileSizeAnalyzer(this.config.thresholds);
    const analysis = await analyzer.analyze(projectRoot);

    report.summary = {
      totalFiles: analysis.results?.details?.totalFiles || 0,
      warningFiles: analysis.results?.details?.warningFiles || 0,
      majorFiles: analysis.results?.details?.majorFiles || 0,
      criticalFiles: analysis.results?.details?.criticalFiles || 0,
      averageSize: analysis.results?.details?.averageFileSize || 0
    };

    return report;
  }
}