/**
 * Command Output Formatter
 * Handles consistent formatting for CLI command outputs
 */

import chalk from 'chalk';
import ora from 'ora';

export class CommandFormatter {
  constructor(config = {}) {
    this.verbose = config.verbose || false;
    this.quiet = config.quiet || false;
  }

  /**
   * Create a spinner for long-running operations
   * @param {string} message - Spinner message
   * @returns {Object} Spinner instance
   */
  createSpinner(message) {
    return this.quiet ? { succeed: () => {}, fail: () => {}, warn: () => {} } : ora(message).start();
  }

  /**
   * Format success message
   * @param {string} message - Success message
   * @param {Object} data - Optional data
   */
  success(message, data = null) {
    if (!this.quiet) {
      console.log(chalk.green('✅'), message);
      if (data && this.verbose) {
        this.formatData(data);
      }
    }
  }

  /**
   * Format error message
   * @param {string|Error} error - Error message or object
   * @param {boolean} includeStack - Include stack trace
   */
  error(error, includeStack = false) {
    const message = error instanceof Error ? error.message : error;
    console.error(chalk.red('❌ Error:'), message);
    
    if (includeStack && error instanceof Error && error.stack && this.verbose) {
      console.error(chalk.gray(error.stack));
    }
  }

  /**
   * Format warning message
   * @param {string} message - Warning message
   */
  warning(message) {
    if (!this.quiet) {
      console.log(chalk.yellow('⚠️'), message);
    }
  }

  /**
   * Format info message
   * @param {string} message - Info message
   */
  info(message) {
    if (!this.quiet) {
      console.log(chalk.blue('ℹ️'), message);
    }
  }

  /**
   * Format section header
   * @param {string} title - Section title
   */
  section(title) {
    if (!this.quiet) {
      console.log(`\n${chalk.blue(title)}`);
      console.log(chalk.gray('='.repeat(title.length)));
    }
  }

  /**
   * Format data object for display
   * @param {Object} data - Data to format
   */
  formatData(data) {
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }

  /**
   * Format command result consistently
   * @param {Object} result - Command execution result
   */
  formatResult(result) {
    if (!result) return;

    if (result.success) {
      this.success(result.message || 'Command completed successfully', result.data);
    } else {
      this.error(result.error || result.message || 'Command failed');
    }

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => this.warning(warning));
    }
  }

  /**
   * Format cross-platform file operations
   * @param {string} action - Action being performed
   * @param {string} path - File path
   */
  fileOperation(action, path) {
    if (!this.quiet) {
      console.log(`${action} ${chalk.cyan(path)}`);
    }
  }

  /**
   * Format server information display
   * @param {Object} serverInfo - Server information
   */
  serverInfo(serverInfo) {
    if (!this.quiet) {
      this.section('Server Information');
      Object.entries(serverInfo).forEach(([key, value]) => {
        console.log(`${key}: ${chalk.cyan(value)}`);
      });
    }
  }

  /**
   * Format score information display
   * @param {Object} scoreInfo - Score information
   */
  scoreInfo(scoreInfo) {
    if (!this.quiet) {
      this.section('Score Information');
      console.log(`Overall Score: ${chalk.cyan(scoreInfo.overall || 'N/A')}`);
      console.log(`Grade: ${chalk.cyan(scoreInfo.grade || 'N/A')}`);
      
      if (scoreInfo.categories && this.verbose) {
        console.log('\nCategory Breakdown:');
        Object.entries(scoreInfo.categories).forEach(([category, score]) => {
          console.log(`  ${category}: ${chalk.cyan(score)}`);
        });
      }
    }
  }
}