/**
 * Base Command Interface
 * Provides common functionality for all command implementations
 */

export class BaseCommand {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Execute the command - to be implemented by subclasses
   * @param {Object} options - Command options
   * @returns {Promise<Object>} Execution result
   */
  async execute(options = {}) {
    throw new Error(`Command ${this.constructor.name} must implement execute() method`);
  }

  /**
   * Validate command options
   * @param {Object} options - Options to validate
   * @returns {boolean} True if valid
   */
  validateOptions(options) {
    return true; // Override in subclasses for specific validation
  }

  /**
   * Format error output consistently
   * @param {Error} error - Error to format
   * @param {boolean} verbose - Include stack trace
   */
  formatError(error, verbose = false) {
    console.error('❌ Error:', error.message);
    if (verbose && error.stack) {
      console.error(error.stack);
    }
  }

  /**
   * Format success output consistently
   * @param {string} message - Success message
   * @param {Object} data - Optional data to display
   */
  formatSuccess(message, data = null) {
    console.log('✅', message);
    if (data && this.config.verbose) {
      console.log(data);
    }
  }
}