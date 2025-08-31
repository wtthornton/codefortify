/**
 * Analyzer Error Handler
 *
 * Provides comprehensive error handling for scoring analyzers with:
 * - Structured error classification
 * - Graceful degradation strategies
 * - Detailed error reporting
 * - Recovery mechanisms
 * - Performance impact tracking
 */

import chalk from 'chalk';

/**
 * Error types for scoring analysis
 */
export const ErrorTypes = {
  FILE_ACCESS: 'file_access',
  DEPENDENCY_MISSING: 'dependency_missing',
  TOOL_UNAVAILABLE: 'tool_unavailable',
  PARSE_ERROR: 'parse_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  INSUFFICIENT_PERMISSIONS: 'permissions',
  INVALID_CONFIG: 'config',
  UNKNOWN: 'unknown'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  CRITICAL: 'critical',    // Analysis cannot proceed
  HIGH: 'high',           // Major functionality impacted
  MEDIUM: 'medium',       // Some functionality impacted
  LOW: 'low',            // Minor impact, analysis continues
  INFO: 'info'           // Information only
};

export class AnalyzerError extends Error {
  /**
   * Create a structured analyzer error
   *
   * @param {string} message - Error message
   * @param {string} type - Error type from ErrorTypes
   * @param {string} severity - Error severity from ErrorSeverity
   * @param {Object} [context={}] - Additional context information
   * @param {Error} [originalError] - Original error that caused this
   */
  constructor(message, type = ErrorTypes.UNKNOWN, severity = ErrorSeverity.MEDIUM, context = {}, originalError = null) {
    super(message);
    this.name = 'AnalyzerError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AnalyzerError);
    }
  }

  /**
   * Convert error to structured object for reporting
   */
  toObject() {
    return {
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        message: this.originalError.message,
        name: this.originalError.name,
        stack: this.originalError.stack
      } : null
    };
  }
}

export class AnalyzerErrorHandler {
  constructor(config = {}) {
    this.config = {
      verbose: config.verbose || false,
      failFast: config.failFast || false,
      logErrors: config.logErrors !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    this.errors = [];
    this.warnings = [];
    this.recoveryStrategies = new Map();
    this.errorCounts = new Map();

    this.initializeRecoveryStrategies();
  }

  initializeRecoveryStrategies() {
    // File access errors
    this.recoveryStrategies.set(ErrorTypes.FILE_ACCESS, async (error, context) => {
      // Try alternative file paths or skip file-specific analysis
      if (context.alternativePaths) {
        for (const altPath of context.alternativePaths) {
          try {
            const fs = await import('fs/promises');
            await fs.access(altPath);
            return { recovered: true, result: altPath };
          } catch {
            continue;
          }
        }
      }
      return { recovered: false, fallback: 'skip' };
    });

    // Tool unavailable errors
    this.recoveryStrategies.set(ErrorTypes.TOOL_UNAVAILABLE, async (error, context) => {
      // Fall back to pattern-based analysis
      return {
        recovered: true,
        fallback: 'pattern-analysis',
        message: `Falling back to pattern-based analysis for ${context.tool}`
      };
    });

    // Parse errors
    this.recoveryStrategies.set(ErrorTypes.PARSE_ERROR, async (error, context) => {
      // Try simpler parsing or skip problematic files
      return {
        recovered: false,
        fallback: 'skip-file',
        message: `Skipping unparseable file: ${context.file}`
      };
    });

    // Dependency missing errors
    this.recoveryStrategies.set(ErrorTypes.DEPENDENCY_MISSING, async (error, context) => {
      // Provide installation guidance
      return {
        recovered: false,
        fallback: 'guidance',
        message: `Missing dependency: ${context.dependency}. Install with: ${context.installCommand || 'npm install ' + context.dependency}`
      };
    });
  }

  /**
   * Handle an error with automatic recovery attempts
   *
   * @param {Error|AnalyzerError} error - The error to handle
   * @param {Object} context - Context information for recovery
   * @param {string} analyzerName - Name of the analyzer that threw the error
   * @returns {Promise<Object>} Recovery result
   */
  async handleError(error, context = {}, analyzerName = 'unknown') {
    const analyzerError = error instanceof AnalyzerError
      ? error
      : this.classifyError(error, context);

    // Track error statistics
    const errorKey = `${analyzerName}:${analyzerError.type}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Log error if configured
    if (this.config.logErrors) {
      this.logError(analyzerError, analyzerName);
    }

    // Store error for reporting
    if (analyzerError.severity === ErrorSeverity.CRITICAL ||
        analyzerError.severity === ErrorSeverity.HIGH) {
      this.errors.push(analyzerError);
    } else {
      this.warnings.push(analyzerError);
    }

    // Attempt recovery
    const recoveryResult = await this.attemptRecovery(analyzerError, context, analyzerName);

    // Fail fast if configured and critical error
    if (this.config.failFast && analyzerError.severity === ErrorSeverity.CRITICAL) {
      throw analyzerError;
    }

    return {
      error: analyzerError,
      recovery: recoveryResult,
      canContinue: recoveryResult.recovered || analyzerError.severity !== ErrorSeverity.CRITICAL
    };
  }

  /**
   * Classify an unknown error into structured AnalyzerError
   */
  classifyError(error, context = {}) {
    let type = ErrorTypes.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    // Classify by error message patterns
    const message = error.message?.toLowerCase() || '';

    if (message.includes('enoent') || message.includes('no such file')) {
      type = ErrorTypes.FILE_ACCESS;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('permission denied') || message.includes('eacces')) {
      type = ErrorTypes.INSUFFICIENT_PERMISSIONS;
      severity = ErrorSeverity.HIGH;
    } else if (message.includes('timeout') || message.includes('etimedout')) {
      type = ErrorTypes.TIMEOUT;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('parse') || message.includes('syntax')) {
      type = ErrorTypes.PARSE_ERROR;
      severity = ErrorSeverity.LOW;
    } else if (message.includes('command not found') || message.includes('not recognized')) {
      type = ErrorTypes.TOOL_UNAVAILABLE;
      severity = ErrorSeverity.MEDIUM;
    } else if (message.includes('network') || message.includes('getaddrinfo')) {
      type = ErrorTypes.NETWORK_ERROR;
      severity = ErrorSeverity.LOW;
    }

    return new AnalyzerError(
      error.message,
      type,
      severity,
      context,
      error
    );
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(error, context, analyzerName) {
    const strategy = this.recoveryStrategies.get(error.type);

    if (!strategy) {
      return {
        recovered: false,
        message: `No recovery strategy for error type: ${error.type}`
      };
    }

    try {
      const result = await strategy(error, context);

      if (result.recovered && this.config.verbose) {
        console.log(chalk.green(`✓ Recovered from ${error.type} error in ${analyzerName}`));
      }

      return result;
    } catch (recoveryError) {
      if (this.config.verbose) {
        console.log(chalk.red(`✗ Recovery failed for ${error.type} in ${analyzerName}: ${recoveryError.message}`));
      }

      return {
        recovered: false,
        message: `Recovery attempt failed: ${recoveryError.message}`
      };
    }
  }

  /**
   * Execute analysis with error handling and retries
   */
  async executeWithRetry(analysisFunction, context = {}, maxRetries = null) {
    const retries = maxRetries || this.config.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await analysisFunction();
      } catch (error) {
        lastError = error;

        if (attempt === retries) {
          break; // Final attempt failed
        }

        const analyzerError = error instanceof AnalyzerError
          ? error
          : this.classifyError(error, context);

        // Don't retry certain error types
        if (analyzerError.type === ErrorTypes.INSUFFICIENT_PERMISSIONS ||
            analyzerError.type === ErrorTypes.INVALID_CONFIG) {
          break;
        }

        // Wait before retry
        if (this.config.retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }

        if (this.config.verbose) {
          console.log(chalk.yellow(`Retry ${attempt}/${retries} for ${analysisFunction.name || 'analysis'}`));
        }
      }
    }

    // All retries failed
    throw lastError;
  }

  /**
   * Log error with appropriate formatting
   */
  logError(error, analyzerName) {
    const severity = error.severity;
    let color = chalk.yellow;

    switch (severity) {
    case ErrorSeverity.CRITICAL:
      color = chalk.red.bold;
      break;
    case ErrorSeverity.HIGH:
      color = chalk.red;
      break;
    case ErrorSeverity.MEDIUM:
      color = chalk.yellow;
      break;
    case ErrorSeverity.LOW:
      color = chalk.blue;
      break;
    case ErrorSeverity.INFO:
      color = chalk.gray;
      break;
    }

    if (this.config.verbose || severity === ErrorSeverity.CRITICAL) {
      console.log(color(`[${severity.toUpperCase()}] ${analyzerName}: ${error.message}`));

      if (error.context && Object.keys(error.context).length > 0) {
        console.log(chalk.gray(`  Context: ${JSON.stringify(error.context)}`));
      }
    }
  }

  /**
   * Generate error summary for reports
   */
  generateErrorSummary() {
    const summary = {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errorsByType: {},
      errorsByAnalyzer: {},
      criticalErrors: this.errors.filter(e => e.severity === ErrorSeverity.CRITICAL),
      recoveryAttempts: this.recoveryStrategies.size
    };

    // Group errors by type
    this.errors.concat(this.warnings).forEach(error => {
      summary.errorsByType[error.type] = (summary.errorsByType[error.type] || 0) + 1;
    });

    // Group by analyzer (from error counts)
    this.errorCounts.forEach((count, key) => {
      const [analyzer, type] = key.split(':');
      summary.errorsByAnalyzer[analyzer] = (summary.errorsByAnalyzer[analyzer] || 0) + count;
    });

    return summary;
  }

  /**
   * Clear accumulated errors and warnings
   */
  reset() {
    this.errors = [];
    this.warnings = [];
    this.errorCounts.clear();
  }

  /**
   * Get all errors and warnings
   */
  getAllIssues() {
    return {
      errors: this.errors.map(e => e.toObject()),
      warnings: this.warnings.map(w => w.toObject())
    };
  }
}