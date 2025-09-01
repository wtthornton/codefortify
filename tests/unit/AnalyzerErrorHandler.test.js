/**
 * Tests for AnalyzerErrorHandler - focusing on error handling and recovery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AnalyzerErrorHandler,
  AnalyzerError,
  ErrorTypes,
  ErrorSeverity
} from '../../src/scoring/core/AnalyzerErrorHandler.js';

describe('AnalyzerErrorHandler', () => {
  let errorHandler;
  const mockConfig = {
    verbose: false,
    failFast: false,
    logErrors: true,
    maxRetries: 3,
    retryDelay: 100
  };

  beforeEach(() => {
    errorHandler = new AnalyzerErrorHandler(mockConfig);
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with provided configuration', () => {
      expect(errorHandler.config.verbose).toBe(false);
      expect(errorHandler.config.failFast).toBe(false);
      expect(errorHandler.config.logErrors).toBe(true);
      expect(errorHandler.config.maxRetries).toBe(3);
      expect(errorHandler.config.retryDelay).toBe(100);
    });

    it('should initialize with default configuration', () => {
      const defaultHandler = new AnalyzerErrorHandler();

      expect(defaultHandler.config.verbose).toBe(false);
      expect(defaultHandler.config.failFast).toBe(false);
      expect(defaultHandler.config.logErrors).toBe(true);
      expect(defaultHandler.config.maxRetries).toBe(3);
      expect(defaultHandler.config.retryDelay).toBe(1000);
    });

    it('should initialize empty error collections', () => {
      expect(errorHandler.errors).toEqual([]);
      expect(errorHandler.warnings).toEqual([]);
      expect(errorHandler.errorCounts).toBeInstanceOf(Map);
      expect(errorHandler.recoveryStrategies).toBeInstanceOf(Map);
    });
  });

  describe('AnalyzerError Class', () => {
    it('should create error with all parameters', () => {
      const originalError = new Error('Original error');
      const context = { file: 'test.js', line: 42 };

      const error = new AnalyzerError(
        'Test error message',
        ErrorTypes.PARSE_ERROR,
        ErrorSeverity.HIGH,
        context,
        originalError
      );

      expect(error.message).toBe('Test error message');
      expect(error.type).toBe(ErrorTypes.PARSE_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context).toEqual(context);
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('AnalyzerError');
      expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should use default values for optional parameters', () => {
      const error = new AnalyzerError('Simple error');

      expect(error.type).toBe(ErrorTypes.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context).toEqual({});
      expect(error.originalError).toBe(null);
    });

    it('should convert to object correctly', () => {
      const originalError = new Error('Original error');
      const context = { test: 'value' };
      const error = new AnalyzerError('Test', ErrorTypes.FILE_ACCESS, ErrorSeverity.LOW, context, originalError);

      const obj = error.toObject();

      expect(obj.message).toBe('Test');
      expect(obj.type).toBe(ErrorTypes.FILE_ACCESS);
      expect(obj.severity).toBe(ErrorSeverity.LOW);
      expect(obj.context).toEqual(context);
      expect(obj.timestamp).toBeDefined();
      expect(obj.stack).toBeDefined();
      expect(obj.originalError).toEqual({
        message: 'Original error',
        name: 'Error',
        stack: originalError.stack
      });
    });

    it('should handle null original error in toObject', () => {
      const error = new AnalyzerError('Test');
      const obj = error.toObject();

      expect(obj.originalError).toBe(null);
    });
  });

  describe('Error Classification', () => {
    it('should classify file access errors', () => {
      const error = new Error('ENOENT: no such file or directory');
      const classified = errorHandler.classifyError(error);

      expect(classified.type).toBe(ErrorTypes.FILE_ACCESS);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should classify permission errors', () => {
      const error = new Error('EACCES: permission denied');
      const classified = errorHandler.classifyError(error);

      expect(classified.type).toBe(ErrorTypes.INSUFFICIENT_PERMISSIONS);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should classify timeout errors', () => {
      const error = new Error('Operation timeout after 5000ms');
      const classified = errorHandler.classifyError(error);

      expect(classified.type).toBe(ErrorTypes.TIMEOUT);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should classify parse errors', () => {
      const error = new Error('Parse error: Unexpected token');
      const classified = errorHandler.classifyError(error);

      expect(classified.type).toBe(ErrorTypes.PARSE_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.LOW);
    });

    it('should classify tool unavailable errors', () => {
      const error = new Error('eslint: command not found');
      const classified = errorHandler.classifyError(error);

      expect(classified.type).toBe(ErrorTypes.TOOL_UNAVAILABLE);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should classify network errors', () => {
      const error = new Error('Network error: getaddrinfo failed');
      const classified = errorHandler.classifyError(error);

      expect(classified.type).toBe(ErrorTypes.NETWORK_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.LOW);
    });

    it('should default to unknown for unrecognized errors', () => {
      const error = new Error('Some unknown error');
      const classified = errorHandler.classifyError(error);

      expect(classified.type).toBe(ErrorTypes.UNKNOWN);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should handle errors without messages', () => {
      const error = new Error();
      const classified = errorHandler.classifyError(error);

      expect(classified.type).toBe(ErrorTypes.UNKNOWN);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Error Handling', () => {
    it('should handle AnalyzerError instances', async () => {
      const analyzerError = new AnalyzerError('Test error', ErrorTypes.PARSE_ERROR, ErrorSeverity.LOW);

      const result = await errorHandler.handleError(analyzerError, {}, 'TestAnalyzer');

      expect(result.error).toBe(analyzerError);
      expect(result.canContinue).toBe(true);
      expect(errorHandler.warnings).toContain(analyzerError);
    });

    it('should handle regular Error instances', async () => {
      const error = new Error('ENOENT: no such file');

      const result = await errorHandler.handleError(error, {}, 'TestAnalyzer');

      expect(result.error).toBeInstanceOf(AnalyzerError);
      expect(result.error.type).toBe(ErrorTypes.FILE_ACCESS);
      expect(result.canContinue).toBe(true);
    });

    it('should track error counts', async () => {
      const error = new Error('Test error');

      await errorHandler.handleError(error, {}, 'TestAnalyzer');
      await errorHandler.handleError(error, {}, 'TestAnalyzer');

      expect(errorHandler.errorCounts.get('TestAnalyzer:unknown')).toBe(2);
    });

    it('should store critical errors in errors array', async () => {
      const error = new AnalyzerError('Critical error', ErrorTypes.TOOL_UNAVAILABLE, ErrorSeverity.CRITICAL);

      await errorHandler.handleError(error, {}, 'TestAnalyzer');

      expect(errorHandler.errors).toContain(error);
      expect(errorHandler.warnings).not.toContain(error);
    });

    it('should store low severity errors in warnings array', async () => {
      const error = new AnalyzerError('Warning error', ErrorTypes.PARSE_ERROR, ErrorSeverity.LOW);

      await errorHandler.handleError(error, {}, 'TestAnalyzer');

      expect(errorHandler.warnings).toContain(error);
      expect(errorHandler.errors).not.toContain(error);
    });

    it('should throw critical errors in fail fast mode', async () => {
      const fastFailHandler = new AnalyzerErrorHandler({ failFast: true });
      const criticalError = new AnalyzerError('Critical', ErrorTypes.FILE_ACCESS, ErrorSeverity.CRITICAL);

      await expect(fastFailHandler.handleError(criticalError, {}, 'TestAnalyzer'))
        .rejects.toThrow(criticalError);
    });
  });

  describe('Recovery Strategies', () => {
    it('should attempt recovery for file access errors', async () => {
      const error = new AnalyzerError('File not found', ErrorTypes.FILE_ACCESS, ErrorSeverity.MEDIUM);
      const context = { alternativePaths: ['/fake/path1', '/fake/path2'] };

      const result = await errorHandler.attemptRecovery(error, context, 'TestAnalyzer');

      expect(result.recovered).toBe(false);
      expect(result.fallback).toBe('skip');
    });

    it('should attempt recovery for tool unavailable errors', async () => {
      const error = new AnalyzerError('Tool not found', ErrorTypes.TOOL_UNAVAILABLE, ErrorSeverity.MEDIUM);
      const context = { tool: 'eslint' };

      const result = await errorHandler.attemptRecovery(error, context, 'TestAnalyzer');

      expect(result.recovered).toBe(true);
      expect(result.fallback).toBe('pattern-analysis');
      expect(result.message).toContain('eslint');
    });

    it('should attempt recovery for parse errors', async () => {
      const error = new AnalyzerError('Parse failed', ErrorTypes.PARSE_ERROR, ErrorSeverity.LOW);
      const context = { file: 'broken.js' };

      const result = await errorHandler.attemptRecovery(error, context, 'TestAnalyzer');

      expect(result.recovered).toBe(false);
      expect(result.fallback).toBe('skip-file');
      expect(result.message).toContain('broken.js');
    });

    it('should handle recovery for dependency missing errors', async () => {
      const error = new AnalyzerError('Missing dep', ErrorTypes.DEPENDENCY_MISSING, ErrorSeverity.MEDIUM);
      const context = { dependency: 'eslint', installCommand: 'npm install eslint' };

      const result = await errorHandler.attemptRecovery(error, context, 'TestAnalyzer');

      expect(result.recovered).toBe(false);
      expect(result.fallback).toBe('guidance');
      expect(result.message).toContain('eslint');
      expect(result.message).toContain('npm install eslint');
    });

    it('should handle unknown error types in recovery', async () => {
      const error = new AnalyzerError('Unknown error', ErrorTypes.UNKNOWN, ErrorSeverity.MEDIUM);

      const result = await errorHandler.attemptRecovery(error, {}, 'TestAnalyzer');

      expect(result.recovered).toBe(false);
      expect(result.message).toContain('No recovery strategy');
    });
  });

  describe('Execute With Retry', () => {
    it('should execute function successfully on first try', async () => {
      const mockFunction = vi.fn().mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(mockFunction);

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFunction = vi.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(mockFunction);

      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(2);
    });

    it('should exhaust retries and throw last error', async () => {
      const mockFunction = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(errorHandler.executeWithRetry(mockFunction))
        .rejects.toThrow('Persistent failure');

      expect(mockFunction).toHaveBeenCalledTimes(3); // Default maxRetries
    });

    it('should not retry permission errors', async () => {
      const mockFunction = vi.fn().mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(errorHandler.executeWithRetry(mockFunction))
        .rejects.toThrow('EACCES: permission denied');

      expect(mockFunction).toHaveBeenCalledTimes(1); // No retries
    });

    it('should use custom retry count', async () => {
      const mockFunction = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(errorHandler.executeWithRetry(mockFunction, {}, 5))
        .rejects.toThrow('Always fails');

      expect(mockFunction).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Summary Generation', () => {
    beforeEach(async () => {
      // Add some test errors
      await errorHandler.handleError(
        new AnalyzerError('Critical error', ErrorTypes.FILE_ACCESS, ErrorSeverity.CRITICAL),
        {},
        'StructureAnalyzer'
      );
      await errorHandler.handleError(
        new AnalyzerError('Warning', ErrorTypes.PARSE_ERROR, ErrorSeverity.LOW),
        {},
        'QualityAnalyzer'
      );
      await errorHandler.handleError(
        new AnalyzerError('Another error', ErrorTypes.TOOL_UNAVAILABLE, ErrorSeverity.MEDIUM),
        {},
        'StructureAnalyzer'
      );
    });

    it('should generate complete error summary', () => {
      const summary = errorHandler.generateErrorSummary();

      expect(summary.totalErrors).toBe(2); // Critical + Medium
      expect(summary.totalWarnings).toBe(1); // Low severity
      expect(summary.errorsByType[ErrorTypes.FILE_ACCESS]).toBe(1);
      expect(summary.errorsByType[ErrorTypes.PARSE_ERROR]).toBe(1);
      expect(summary.errorsByType[ErrorTypes.TOOL_UNAVAILABLE]).toBe(1);
      expect(summary.errorsByAnalyzer['StructureAnalyzer']).toBe(2);
      expect(summary.errorsByAnalyzer['QualityAnalyzer']).toBe(1);
      expect(summary.criticalErrors).toHaveLength(1);
      expect(summary.recoveryAttempts).toBeGreaterThan(0);
    });
  });

  describe('Error State Management', () => {
    it('should reset all error state', async () => {
      await errorHandler.handleError(new Error('Test error'), {}, 'TestAnalyzer');

      expect(errorHandler.errors.length + errorHandler.warnings.length).toBeGreaterThan(0);
      expect(errorHandler.errorCounts.size).toBeGreaterThan(0);

      errorHandler.reset();

      expect(errorHandler.errors).toEqual([]);
      expect(errorHandler.warnings).toEqual([]);
      expect(errorHandler.errorCounts.size).toBe(0);
    });

    it('should return all issues in structured format', async () => {
      const error = new AnalyzerError('Test error', ErrorTypes.FILE_ACCESS, ErrorSeverity.HIGH);
      const warning = new AnalyzerError('Test warning', ErrorTypes.PARSE_ERROR, ErrorSeverity.LOW);

      await errorHandler.handleError(error, {}, 'TestAnalyzer');
      await errorHandler.handleError(warning, {}, 'TestAnalyzer');

      const issues = errorHandler.getAllIssues();

      expect(issues.errors).toHaveLength(1);
      expect(issues.warnings).toHaveLength(1);
      expect(issues.errors[0]).toHaveProperty('message', 'Test error');
      expect(issues.warnings[0]).toHaveProperty('message', 'Test warning');
    });
  });

  describe('Error Types and Severity Constants', () => {
    it('should export all error types', () => {
      expect(ErrorTypes.FILE_ACCESS).toBe('file_access');
      expect(ErrorTypes.DEPENDENCY_MISSING).toBe('dependency_missing');
      expect(ErrorTypes.TOOL_UNAVAILABLE).toBe('tool_unavailable');
      expect(ErrorTypes.PARSE_ERROR).toBe('parse_error');
      expect(ErrorTypes.NETWORK_ERROR).toBe('network_error');
      expect(ErrorTypes.TIMEOUT).toBe('timeout');
      expect(ErrorTypes.INSUFFICIENT_PERMISSIONS).toBe('permissions');
      expect(ErrorTypes.INVALID_CONFIG).toBe('config');
      expect(ErrorTypes.UNKNOWN).toBe('unknown');
    });

    it('should export all severity levels', () => {
      expect(ErrorSeverity.CRITICAL).toBe('critical');
      expect(ErrorSeverity.HIGH).toBe('high');
      expect(ErrorSeverity.MEDIUM).toBe('medium');
      expect(ErrorSeverity.LOW).toBe('low');
      expect(ErrorSeverity.INFO).toBe('info');
    });
  });
});