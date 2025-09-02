/**
 * ErrorHandler - Centralized error handling utilities
 */

export class ErrorHandler {
  /**
   * Create a standardized error object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} context - Additional context
   * @param {Error} originalError - Original error if any
   * @returns {Object} Standardized error object
   */
  static createError(message, code = 'UNKNOWN_ERROR', context = {}, originalError = null) {
    return {
      message,
      code,
      context,
      originalError,
      timestamp: new Date().toISOString(),
      stack: originalError?.stack || new Error().stack
    };
  }

  /**
   * Sanitize error for safe logging (removes sensitive information)
   * @param {Error|Object} error - Error to sanitize
   * @returns {Object} Sanitized error safe for logging
   */
  static sanitizeError(error) {
    const sensitivePatterns = [
      /password/gi,
      /secret/gi,
      /token/gi,
      /key/gi,
      /credential/gi,
      /auth/gi
    ];

    const sanitizedMessage = error.message || error.toString();
    const containsSensitive = sensitivePatterns.some(pattern => pattern.test(sanitizedMessage));

    return {
      message: containsSensitive ? 'Operation failed (sensitive data redacted)' : sanitizedMessage,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      context: 'error-context-sanitized',
      // Never include full stack traces in production
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'stack-trace-redacted'
    };
  }

  /**
   * Handle and log errors consistently with security considerations
   * @param {Error|Object} error - Error to handle
   * @param {string} context - Context where error occurred
   * @param {Object} additionalInfo - Additional information
   * @returns {Object} Processed error
   */
  static handleError(error, context = 'Unknown', additionalInfo = {}) {
    const processedError = this.createError(
      error.message || 'Unknown error occurred',
      error.code || 'UNKNOWN_ERROR',
      { context, ...additionalInfo },
      error
    );

    // Log error with consistent format
    console.error(`❌ [${context}] ${processedError.message}`, {
      code: processedError.code,
      context: processedError.context,
      timestamp: processedError.timestamp
    });

    return processedError;
  }

  /**
   * Wrap async functions with error handling
   * @param {Function} asyncFn - Async function to wrap
   * @param {string} context - Context for error handling
   * @returns {Function} Wrapped function
   */
  static wrapAsync(asyncFn, context = 'AsyncOperation') {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        throw this.handleError(error, context);
      }
    };
  }

  /**
   * Handle file system errors
   * @param {Error} error - File system error
   * @param {string} operation - Operation being performed
   * @param {string} path - File path
   * @returns {Object} Processed error
   */
  static handleFileSystemError(error, operation, path) {
    let code = 'FILE_SYSTEM_ERROR';
    let message = error.message;    /**
   * Performs the specified operation
   * @param {any} error.code - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} error.code - Optional parameter
   * @returns {any} The operation result
   */


    if (error.code === 'ENOENT') {
      code = 'FILE_NOT_FOUND';
      message = `File not found: ${path}`;
    } else if (error.code === 'EACCES') {
      code = 'PERMISSION_DENIED';
      message = `Permission denied: ${path}`;
    } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
      code = 'TOO_MANY_FILES';
      message = 'Too many open files';
    }

    return this.handleError(error, `FileSystem:${operation}`, {
      path,
      operation,
      code: error.code
    });
  }

  /**
   * Handle network errors
   * @param {Error} error - Network error
   * @param {string} operation - Operation being performed
   * @param {string} url - URL being accessed
   * @returns {Object} Processed error
   */
  static handleNetworkError(error, operation, url) {
    let code = 'NETWORK_ERROR';
    let message = error.message;    /**
   * Performs the specified operation
   * @param {any} error.code - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} error.code - Optional parameter
   * @returns {any} The operation result
   */


    if (error.code === 'ECONNREFUSED') {
      code = 'CONNECTION_REFUSED';
      message = `Connection refused: ${url}`;
    } else if (error.code === 'ETIMEDOUT') {
      code = 'TIMEOUT';
      message = `Request timeout: ${url}`;
    } else if (error.code === 'ENOTFOUND') {
      code = 'DNS_ERROR';
      message = `DNS lookup failed: ${url}`;
    }

    return this.handleError(error, `Network:${operation}`, {
      url,
      operation,
      code: error.code
    });
  }

  /**
   * Handle validation errors
   * @param {Error|Array} errors - Validation errors
   * @param {string} context - Validation context
   * @returns {Object} Processed error
   */
  static handleValidationError(errors, context = 'Validation') {
    const errorList = Array.isArray(errors) ? errors : [errors];
    const message = errorList.map(e => e.message || e).join('; ');

    return this.handleError(
      new Error(message),
      context,
      { validationErrors: errorList }
    );
  }

  /**
   * Check if error is retryable
   * @param {Error|Object} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  static isRetryableError(error) {
    const retryableCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'EAGAIN',
      'ENETUNREACH'
    ];

    return retryableCodes.includes(error.code) ||
           error.message?.includes('timeout') ||
           error.message?.includes('network');
  }

  /**
   * Get user-friendly error message
   * @param {Error|Object} error - Error to process
   * @returns {string} User-friendly message
   */
  static getUserFriendlyMessage(error) {
    const code = error.code || 'UNKNOWN_ERROR';

    const friendlyMessages = {
      'FILE_NOT_FOUND': 'The requested file could not be found.',
      'PERMISSION_DENIED': 'You do not have permission to access this resource.',
      'CONNECTION_REFUSED': 'Unable to connect to the server.',
      'TIMEOUT': 'The operation timed out. Please try again.',
      'DNS_ERROR': 'Unable to resolve the server address.',
      'VALIDATION_ERROR': 'The provided data is invalid.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
    };

    return friendlyMessages[code] || friendlyMessages['UNKNOWN_ERROR'];
  }
}
