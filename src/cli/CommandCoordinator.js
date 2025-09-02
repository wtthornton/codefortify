/**
 * Command Coordinator (Refactored)
 *
 * Clean implementation using proper Command pattern
 * Replaces the 1881-line anti-pattern with a focused coordinator
 */

import { CommandRegistry } from './CommandRegistry.js';
import { CommandFormatter } from './utils/CommandFormatter.js';
import { LearningLoopController } from '../learning/LearningLoopController.js';

export class CommandCoordinator {
  constructor(globalConfig, packageRoot) {
    this.globalConfig = globalConfig;
    this.packageRoot = packageRoot;

    // Initialize command registry with proper Command pattern
    this.commandRegistry = new CommandRegistry(globalConfig, packageRoot);
    this.formatter = new CommandFormatter(globalConfig);

    // Initialize learning system
    this.learningController = globalConfig.enableLearning !== false ?
      new LearningLoopController({
        projectRoot: packageRoot,
        ...globalConfig
      }) : null;

    // Start learning system if enabled
    if (this.learningController) {
      this.initializeLearning();
    }
  }

  /**
   * Initialize the learning system to monitor and improve
   */
  async initializeLearning() {
    try {
      // Learning system starts automatically with the controller
      if (this.globalConfig.verbose) {
        this.formatter.info('Learning system initialized');
      }
    } catch (error) {
      if (this.globalConfig.verbose) {
        this.formatter.warning(`Learning system initialization failed: ${error.message}`);
      }
    }
  }

  /**
   * Execute any command through the registry
   * @param {string} commandName - Name of command to execute
   * @param {Object} options - Command options
   * @returns {Promise<Object>} Execution result
   */
  async execute(commandName, options = {}) {
    const startTime = Date.now();

    try {
      // Log command execution for learning
      await this.logCommandExecution(commandName, options, 'start');

      // Execute command through registry
      const result = await this.commandRegistry.execute(commandName, options);

      // Log result for learning
      await this.logCommandExecution(commandName, options, 'complete', {
        success: result ? result.success : true,
        duration: Date.now() - startTime
      });

      return result;

    } catch (error) {
      // Log error for learning
      await this.logCommandExecution(commandName, options, 'error', {
        error: error.message,
        duration: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Log command execution for learning system
   */
  async logCommandExecution(command, options, phase, metadata = {}) {
    try {
      if (this.learningController) {
        // Record command execution metrics for learning
        this.learningController.emit('command_executed', {
          command,
          options: this.sanitizeOptions(options),
          phase,
          timestamp: new Date().toISOString(),
          ...metadata
        });
      }
    } catch (error) {
      // Silent fail - don't interrupt command execution
      if (this.globalConfig.verbose) {
        console.error('Learning log error:', error.message);
      }
    }
  }

  /**
   * Sanitize options for logging (remove sensitive data)
   */
  sanitizeOptions(options) {
    const sanitized = { ...options };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];

    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Get available commands
   * @returns {Array<string>} List of command names
   */
  getAvailableCommands() {
    return this.commandRegistry.listCommands();
  }

  /**
   * Check if command exists
   * @param {string} commandName - Command name
   * @returns {boolean} True if command exists
   */
  hasCommand(commandName) {
    return this.commandRegistry.hasCommand(commandName);
  }

  /**
   * Get help for a specific command
   * @param {string} commandName - Command name
   * @returns {Object|null} Help information
   */
  getCommandHelp(commandName) {
    return this.commandRegistry.getCommandHelp(commandName);
  }

  /**
   * Get learning metrics and insights
   * @returns {Promise<Object>} Learning metrics
   */
  async getLearningMetrics() {
    try {
      if (this.learningController) {
        return {
          learning: 'active',
          status: 'monitoring commands and patterns',
          controller: 'LearningLoopController'
        };
      }
      return { learning: 'disabled' };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Stop learning system gracefully
   */
  async stopLearning() {
    try {
      if (this.learningController) {
        this.learningController.removeAllListeners();
        if (this.globalConfig.verbose) {
          this.formatter.info('Learning system stopped');
        }
      }
    } catch (error) {
      if (this.globalConfig.verbose) {
        this.formatter.warning(`Learning system stop failed: ${error.message}`);
      }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.stopLearning();
  }
}

// Legacy method mappings for backward compatibility
// These delegate to the command registry
const legacyMethods = [
  'executeInit', 'executeScore', 'executeEnhance', 'executeTemplate',
  'executePrompt', 'executeAgentInit', 'executeSetup', 'executeAnalyze',
  'executeMonitor', 'executeTools', 'executeAdd', 'executeValidate',
  'executeTestMcp', 'executeServe', 'executeGenerate', 'executeUpdate',
  'executeStatus', 'executeStop', 'executePause', 'executeResume',
  'executeDashboard', 'executeCursor'
];

// Automatically create legacy method mappings
legacyMethods.forEach(methodName => {
  const commandName = methodName.replace('execute', '').toLowerCase();
  const mappedName = commandName
    .replace('agentinit', 'agent-init')
    .replace('testmcp', 'test-mcp');

  CommandCoordinator.prototype[methodName] = function(options) {
    console.warn(`⚠️  ${methodName} is deprecated. Use execute('${mappedName}', options) instead.`);
    return this.execute(mappedName, options);
  };
});