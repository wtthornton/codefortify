/**
 * CodeFortify Real-Time Terminal Status Display
 *
 * Provides rich terminal status display with colors, progress bars, and live updating
 * Similar to htop/watch with real-time CodeFortify status information
 */

import chalk from 'chalk';
import ora from 'ora';
import WebSocket from 'ws';
import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

/**


 * RealtimeStatus class implementation


 *


 * Provides functionality for realtimestatus operations


 */


/**


 * RealtimeStatus class implementation


 *


 * Provides functionality for realtimestatus operations


 */


export class RealtimeStatus {
  constructor(options = {}) {
    this.options = {
      port: options.port || 8765,
      host: options.host || 'localhost',
      updateInterval: options.updateInterval || 1000,
      showDetails: options.showDetails !== false,
      colorMode: options.colorMode !== false,
      compactMode: options.compactMode || false,
      ...options
    };

    this.ws = null;
    this.currentStatus = {
      connected: false,
      score: null,
      phase: 'idle',
      progress: 0,
      message: 'Connecting...',
      lastUpdate: null,
      issues: { critical: 0, high: 0, medium: 0, low: 0 },
      trend: null,
      elapsedTime: 0,
      estimatedRemaining: null
    };

    this.spinner = null;
    this.displayInterval = null;
    this.startTime = Date.now();
  }

  /**
     * Start the real-time status monitor
     */
  async start() {
    console.clear();
    this.showHeader();

    this.spinner = ora({
      text: 'Connecting to CodeFortify server...',
      spinner: 'dots'
    }).start();

    try {
      await this.connectWebSocket();
      this.startDisplay();
    } catch (error) {
      this.spinner.fail(`Failed to connect: ${error.message}`);
      console.log(chalk.yellow('\n💡 Try: codefortify start-realtime --port 8765'));
      process.exit(1);
    }
  }

  /**
     * Stop the status monitor
     */
  stop() {  /**
   * Performs the specified operation
   * @param {boolean} this.spinner
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.spinner
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.spinner) {
      this.spinner.stop();
    }    /**
   * Performs the specified operation
   * @param {boolean} this.displayInterval
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.displayInterval
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.displayInterval) {
      clearInterval(this.displayInterval);
    }    /**
   * Performs the specified operation
   * @param {boolean} this.ws
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.ws
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.ws) {
      this.ws.close();
    }

    console.log(chalk.green('\n✅ Status monitoring stopped'));
  }

  /**
     * Connect to WebSocket server
     */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${this.options.host}:${this.options.port}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.currentStatus.connected = true;
        this.currentStatus.message = 'Connected to CodeFortify';
        this.spinner.succeed('Connected to CodeFortify server');
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        this.currentStatus.connected = false;
        this.currentStatus.message = `Connection error: ${error.message}`;
        reject(error);
      });

      this.ws.on('close', () => {
        this.currentStatus.connected = false;
        this.currentStatus.message = 'Disconnected from server';        /**
   * Performs the specified operation
   * @param {boolean} this.spinner && !this.spinner.isSpinning
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} this.spinner && !this.spinner.isSpinning
   * @returns {boolean} True if successful, false otherwise
   */

        if (this.spinner && !this.spinner.isSpinning) {
          console.log(chalk.red('\n❌ Connection lost - attempting reconnect...'));
          setTimeout(() => this.reconnect(), 3000);
        }
      });

      // Connection timeout
      setTimeout(() => {        /**
   * Performs the specified operation
   * @param {boolean} !this.currentStatus.connected
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} !this.currentStatus.connected
   * @returns {boolean} True if successful, false otherwise
   */

        if (!this.currentStatus.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  /**
     * Handle WebSocket messages
     */
  handleMessage(message) {
    try {
      const { type, data } = message;      /**
   * Performs the specified operation
   * @param {any} type
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} type
   * @returns {any} The operation result
   */


      switch (type) {
      case 'status_update':
        this.updateStatus(data);
        break;
      case 'score_update':
        this.updateScore(data);
        break;
      case 'analysis_start':
        this.currentStatus.phase = 'analyzing';
        this.currentStatus.message = `Starting ${data.category || 'analysis'}...`;
        break;
      case 'analysis_complete':
        this.currentStatus.phase = 'complete';
        this.currentStatus.progress = 100;
        this.currentStatus.message = 'Analysis complete';
        break;
      case 'error_occurred':
        this.currentStatus.message = `Error: ${data.message}`;
        break;
      }

      this.currentStatus.lastUpdate = new Date();
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
     * Update status from WebSocket data
     */
  updateStatus(data) {
    Object.assign(this.currentStatus, {
      phase: data.phase || this.currentStatus.phase,
      progress: data.progress || this.currentStatus.progress,
      message: data.message || this.currentStatus.message,
      elapsedTime: data.elapsedTime || this.currentStatus.elapsedTime,
      estimatedRemaining: data.estimatedRemainingTime
    });    /**
   * Performs the specified operation
   * @param {boolean} data.issues
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} data.issues
   * @returns {boolean} True if successful, false otherwise
   */


    if (data.issues) {
      this.currentStatus.issues = { ...data.issues };
    }
  }

  /**
     * Update score from WebSocket data
     */
  updateScore(data) {
    const previousScore = this.currentStatus.score;
    this.currentStatus.score = data.score;

    // Calculate trend    /**
   * Performs the specified operation
   * @param {any} previousScore ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} previousScore ! - Optional parameter
   * @returns {any} The operation result
   */

    if (previousScore !== null) {      /**
   * Performs the specified operation
   * @param {any} data.score > previousScore + 0.5
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} data.score > previousScore + 0.5
   * @returns {any} The operation result
   */

      if (data.score > previousScore + 0.5) {
        this.currentStatus.trend = 'up';
      } else if (data.score < previousScore - 0.5) {
        this.currentStatus.trend = 'down';
      } else {
        this.currentStatus.trend = 'stable';
      }
    }
  }

  /**
     * Start the display update loop
     */
  startDisplay() {
    this.displayInterval = setInterval(() => {
      this.render();
    }, this.options.updateInterval);

    // Initial render
    this.render();
  }

  /**
     * Show the header
     */
  showHeader() {
    const title = chalk.bold.blue('┌─ CodeFortify Real-Time Status ─────────────────────────────┐');
    console.log(title);
  }

  /**
     * Render the status display
     */
  render() {
    // Clear screen and show header
    console.clear();
    this.showHeader();    /**
   * Performs the specified operation
   * @param {Object} this.options.compactMode
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.options.compactMode
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.options.compactMode) {
      this.renderCompact();
    } else {
      this.renderDetailed();
    }

    this.showFooter();
  }

  /**
     * Render compact status view
     */
  renderCompact() {
    const status = this.currentStatus;
    const scoreColor = this.getScoreColor(status.score);
    const trendIcon = this.getTrendIcon(status.trend);

    const line1 = `${chalk.gray('│')} Status: ${this.getConnectionStatus()} ${chalk.gray('│')}`;
    const line2 = `${chalk.gray('│')} Score: ${scoreColor(status.score?.toFixed(1) || '—')} ${trendIcon} ${chalk.gray('│')}`;
    const line3 = `${chalk.gray('│')} Phase: ${this.getPhaseDisplay()} ${chalk.gray('│')}`;
    const line4 = `${chalk.gray('│')} Issues: ${this.getIssuesDisplay()} ${chalk.gray('│')}`;

    console.log(line1);
    console.log(line2);
    console.log(line3);
    console.log(line4);
  }

  /**
     * Render detailed status view
     */
  renderDetailed() {
    const status = this.currentStatus;

    // Connection Status Line
    console.log(`${chalk.gray('│')} Connection: ${this.getConnectionStatus()}`);

    // Score Line with Trend    /**
   * Performs the specified operation
   * @param {any} status.score ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} status.score ! - Optional parameter
   * @returns {any} The operation result
   */

    if (status.score !== null) {
      const scoreColor = this.getScoreColor(status.score);
      const trendIcon = this.getTrendIcon(status.trend);
      const scoreLabel = this.getScoreLabel(status.score);

      console.log(`${chalk.gray('│')} Overall Score: ${scoreColor(status.score.toFixed(1))}/100 ${trendIcon} ${scoreLabel}`);
    } else {
      console.log(`${chalk.gray('│')} Overall Score: ${chalk.gray('—/100')} (Not Available)`);
    }

    // Current Status Line
    console.log(`${chalk.gray('│')} Current Status: ${this.getPhaseDisplay()}`);

    // Progress Bar    /**
   * Performs the specified operation
   * @param {any} status.progress > 0 && status.progress < 100
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} status.progress > 0 && status.progress < 100
   * @returns {any} The operation result
   */

    if (status.progress > 0 && status.progress < 100) {
      console.log(`${chalk.gray('│')} Progress: ${this.getProgressBar()}`);
    }

    // Issues Summary
    console.log(`${chalk.gray('│')} Issues Found: ${this.getIssuesDisplay()}`);

    // Timing Information    /**
   * Performs the specified operation
   * @param {any} status.elapsedTime > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} status.elapsedTime > 0
   * @returns {any} The operation result
   */

    if (status.elapsedTime > 0) {
      const elapsed = this.formatDuration(status.elapsedTime);
      let timeLine = `${chalk.gray('│')} Time Elapsed: ${elapsed}`;      /**
   * Performs the specified operation
   * @param {any} status.estimatedRemaining
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} status.estimatedRemaining
   * @returns {any} The operation result
   */


      if (status.estimatedRemaining) {
        const remaining = this.formatDuration(status.estimatedRemaining);
        timeLine += ` | ETA: ${remaining}`;
      }

      console.log(timeLine);
    }

    // Last Update    /**
   * Performs the specified operation
   * @param {any} status.lastUpdate
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} status.lastUpdate
   * @returns {any} The operation result
   */

    if (status.lastUpdate) {
      const updateTime = this.formatRelativeTime(status.lastUpdate);
      console.log(`${chalk.gray('│')} Last Update: ${updateTime}`);
    }

    // Current Message    /**
   * Performs the specified operation
   * @param {any} status.message && status.message ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} status.message && status.message ! - Optional parameter
   * @returns {any} The operation result
   */

    if (status.message && status.message !== 'Connected to CodeFortify') {
      console.log(`${chalk.gray('│')} Status: ${chalk.cyan(status.message)}`);
    }
  }

  /**
     * Show footer with controls
     */
  showFooter() {
    console.log(chalk.gray('└────────────────────────────────────────────────────────────┘'));    /**
   * Performs the specified operation
   * @param {Object} !this.options.compactMode
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} !this.options.compactMode
   * @returns {boolean} True if successful, false otherwise
   */


    if (!this.options.compactMode) {
      console.log(chalk.gray('\nControls: Ctrl+C to exit | r to refresh | c for compact mode'));
    }
  }

  /**
     * Get connection status display
     */
  getConnectionStatus() {  /**
   * Performs the specified operation
   * @param {boolean} this.currentStatus.connected
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.currentStatus.connected
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.currentStatus.connected) {
      return chalk.green('✓ Connected');
    } else {
      return chalk.red('✗ Disconnected');
    }
  }

  /**
     * Get phase display with appropriate styling
     */
  getPhaseDisplay() {
    const phase = this.currentStatus.phase;
    const progress = this.currentStatus.progress;    /**
   * Performs the specified operation
   * @param {boolean} phase
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} phase
   * @returns {any} The operation result
   */


    switch (phase) {
    case 'idle':
      return chalk.gray('💤 Idle');
    case 'analyzing':
    case 'analysis':
      return chalk.yellow(`⚡ Analyzing... ${progress}%`);
    case 'enhancing':
      return chalk.blue(`🔧 Enhancing... ${progress}%`);
    case 'testing':
      return chalk.magenta(`🧪 Testing... ${progress}%`);
    case 'complete':
      return chalk.green('✅ Complete');
    case 'error':
      return chalk.red('❌ Error');
    default:
      return chalk.cyan(`🔄 ${phase}... ${progress}%`);
    }
  }

  /**
     * Get progress bar display
     */
  getProgressBar() {
    const progress = Math.max(0, Math.min(100, this.currentStatus.progress));
    const barLength = 20;
    const filledLength = Math.round((progress / 100) * barLength);
    const emptyLength = barLength - filledLength;

    const filled = '█'.repeat(filledLength);
    const empty = '▒'.repeat(emptyLength);
    const percentage = progress.toFixed(0).padStart(3);

    return chalk.cyan(`[${filled}${empty}] ${percentage}%`);
  }

  /**
     * Get issues display
     */
  getIssuesDisplay() {
    const issues = this.currentStatus.issues;
    const parts = [];    /**
   * Performs the specified operation
   * @param {boolean} issues.critical > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} issues.critical > 0
   * @returns {boolean} True if successful, false otherwise
   */


    if (issues.critical > 0) {parts.push(chalk.red(`${issues.critical} Critical`));}    /**
   * Performs the specified operation
   * @param {boolean} issues.high > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} issues.high > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (issues.high > 0) {parts.push(chalk.yellow(`${issues.high} High`));}    /**
   * Performs the specified operation
   * @param {boolean} issues.medium > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} issues.medium > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (issues.medium > 0) {parts.push(chalk.blue(`${issues.medium} Medium`));}    /**
   * Performs the specified operation
   * @param {boolean} issues.low > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} issues.low > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (issues.low > 0) {parts.push(chalk.gray(`${issues.low} Low`));}

    return parts.length > 0 ? parts.join(', ') : chalk.green('None');
  }

  /**
     * Get score color based on value
     */
  getScoreColor(score) {  /**
   * Performs the specified operation
   * @param {any} score - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score - Optional parameter
   * @returns {any} The operation result
   */

    if (score === null || score === undefined) {return chalk.gray;}    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 90) {return chalk.green;}    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 80) {return chalk.yellow;}    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 70) {return chalk.orange;}
    return chalk.red;
  }

  /**
     * Get score label
     */
  getScoreLabel(score) {  /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 95) {return chalk.green('Excellent');}    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 85) {return chalk.green('Good');}    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 75) {return chalk.yellow('Fair');}    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 65) {return chalk.orange('Poor');}
    return chalk.red('Critical');
  }

  /**
     * Get trend icon
     */
  getTrendIcon(trend) {  /**
   * Performs the specified operation
   * @param {any} trend
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} trend
   * @returns {any} The operation result
   */

    switch (trend) {
    case 'up': return chalk.green('↗');
    case 'down': return chalk.red('↘');
    case 'stable': return chalk.blue('→');
    default: return '';
    }
  }

  /**
     * Format duration in human-readable format
     */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);    /**
   * Performs the specified operation
   * @param {any} hours > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} hours > 0
   * @returns {any} The operation result
   */


    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
     * Format relative time
     */
  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);    /**
   * Performs the specified operation
   * @param {any} seconds < 5
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} seconds < 5
   * @returns {any} The operation result
   */


    if (seconds < 5) {return 'just now';}    /**
   * Performs the specified operation
   * @param {any} seconds < 60
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} seconds < 60
   * @returns {any} The operation result
   */

    if (seconds < 60) {return `${seconds} seconds ago`;}

    const minutes = Math.floor(seconds / 60);    /**
   * Performs the specified operation
   * @param {any} minutes < 60
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} minutes < 60
   * @returns {any} The operation result
   */

    if (minutes < 60) {return `${minutes} minutes ago`;}

    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  }

  /**
     * Attempt reconnection
     */
  async reconnect() {  /**
   * Performs the specified operation
   * @param {boolean} this.currentStatus.connected
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.currentStatus.connected
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.currentStatus.connected) {return;}

    console.log(chalk.yellow('🔄 Attempting to reconnect...'));

    try {
      await this.connectWebSocket();
      console.log(chalk.green('✅ Reconnected successfully'));
    } catch (error) {
      console.log(chalk.red('❌ Reconnection failed, retrying in 10 seconds...'));
      setTimeout(() => this.reconnect(), 10000);
    }
  }
}

/**
 * CLI interface for the status monitor
 */
export async function createStatusMonitor(options = {}) {
  const monitor = new RealtimeStatus(options);

  // Handle process signals
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    monitor.stop();
    process.exit(0);
  });

  // Handle keyboard input for interactive controls
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    const char = key.toString();    /**
   * Performs the specified operation
   * @param {any} char
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} char
   * @returns {any} The operation result
   */


    switch (char) {
    case '\u0003': // Ctrl+C
      monitor.stop();
      process.exit(0);
      break;
    case 'r':
      monitor.render();
      break;
    case 'c':
      monitor.options.compactMode = !monitor.options.compactMode;
      monitor.render();
      break;
    case 'q':
      monitor.stop();
      process.exit(0);
      break;
    }
  });

  await monitor.start();
  return monitor;
}