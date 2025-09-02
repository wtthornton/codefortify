/**
 * CodeFortifyError - Standardized error class for CodeFortify
 */

export class CodeFortifyError extends Error {
  constructor(message, code = 'CODEFORTIFY_ERROR', context = {}, originalError = null) {
    super(message);
    
    this.name = 'CodeFortifyError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodeFortifyError);
    }
  }

  /**
   * Convert error to JSON object
   * @returns {Object} JSON representation of error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }

  /**
   * Get user-friendly error message
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage() {
    const friendlyMessages = {
      'PROJECT_NOT_FOUND': 'The specified project could not be found.',
      'INVALID_PROJECT_TYPE': 'The project type is not supported.',
      'ANALYSIS_FAILED': 'Project analysis failed. Please check your project structure.',
      'ENHANCEMENT_FAILED': 'Code enhancement failed. Please try again.',
      'VALIDATION_FAILED': 'Project validation failed. Please check your configuration.',
      'AGENT_ERROR': 'An agent encountered an error. Please check the logs.',
      'LOOP_TIMEOUT': 'The improvement loop timed out.',
      'CONVERGENCE_FAILED': 'The improvement loop failed to converge.',
      'CODEFORTIFY_ERROR': 'An unexpected error occurred in CodeFortify.'
    };

    return friendlyMessages[this.code] || friendlyMessages['CODEFORTIFY_ERROR'];
  }

  /**
   * Check if error is retryable
   * @returns {boolean} True if error is retryable
   */
  isRetryable() {
    const retryableCodes = [
      'ANALYSIS_FAILED',
      'ENHANCEMENT_FAILED',
      'AGENT_ERROR',
      'LOOP_TIMEOUT'
    ];

    return retryableCodes.includes(this.code);
  }

  /**
   * Create a CodeFortifyError from a regular Error
   * @param {Error} error - Original error
   * @param {string} code - Error code
   * @param {Object} context - Additional context
   * @returns {CodeFortifyError} New CodeFortifyError instance
   */
  static fromError(error, code = 'CODEFORTIFY_ERROR', context = {}) {
    return new CodeFortifyError(error.message, code, context, error);
  }

  /**
   * Create a validation error
   * @param {string} message - Error message
   * @param {Object} validationErrors - Validation errors
   * @returns {CodeFortifyError} Validation error
   */
  static validationError(message, validationErrors = {}) {
    return new CodeFortifyError(message, 'VALIDATION_FAILED', { validationErrors });
  }

  /**
   * Create a project error
   * @param {string} message - Error message
   * @param {string} projectPath - Project path
   * @returns {CodeFortifyError} Project error
   */
  static projectError(message, projectPath) {
    return new CodeFortifyError(message, 'PROJECT_ERROR', { projectPath });
  }

  /**
   * Create an agent error
   * @param {string} message - Error message
   * @param {string} agentName - Agent name
   * @returns {CodeFortifyError} Agent error
   */
  static agentError(message, agentName) {
    return new CodeFortifyError(message, 'AGENT_ERROR', { agentName });
  }
}
