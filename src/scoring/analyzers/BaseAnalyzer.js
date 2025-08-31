/**
 * BaseAnalyzer - Abstract base class for all scoring analyzers
 *
 * Provides common functionality and interface for category-specific analyzers
 * with comprehensive error handling, recovery mechanisms, and graceful degradation.
 */

import fs from 'fs/promises';
import path from 'path';
import { AnalyzerErrorHandler, AnalyzerError, ErrorTypes, ErrorSeverity } from '../core/AnalyzerErrorHandler.js';

export class BaseAnalyzer {
  constructor(config) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      maxScore: config.maxScore || 10,
      verbose: config.verbose || false,
      ...config
    };

    this.categoryName = 'Base Category';
    this.description = 'Base analyzer description';

    // Initialize error handler
    this.errorHandler = new AnalyzerErrorHandler({
      verbose: this.config.verbose,
      logErrors: true,
      maxRetries: 2,
      retryDelay: 500
    });

    // Results structure
    this.results = {
      score: 0,
      maxScore: this.config.maxScore,
      grade: 'F',
      issues: [],
      suggestions: [],
      details: {},
      analysisTime: 0,
      errors: [],
      warnings: [],
      recoveries: []
    };
  }

  async analyze() {
    const startTime = Date.now();

    try {
      if (this.config.verbose) {
        console.log(`   Analyzing ${this.categoryName}...`);
      }

      // Reset error handler for this analysis
      this.errorHandler.reset();

      // Template method - subclasses implement this with error handling
      await this.runAnalysisWithErrorHandling();

      // Calculate grade based on score
      this.results.grade = this.calculateGrade(this.results.score / this.results.maxScore);

      // Include error information in results
      const errorSummary = this.errorHandler.generateErrorSummary();
      const allIssues = this.errorHandler.getAllIssues();
      
      this.results.errors = allIssues.errors;
      this.results.warnings = allIssues.warnings;
      this.results.errorSummary = errorSummary;

      this.results.analysisTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`   ${this.categoryName}: ${this.results.score}/${this.results.maxScore} (${this.results.grade}) - ${this.results.analysisTime}ms`);
      }

      return this.results;

    } catch (error) {
      // Handle critical analysis failure
      const handlingResult = await this.errorHandler.handleError(
        error, 
        { analyzer: this.categoryName, projectRoot: this.config.projectRoot },
        this.categoryName
      );

      this.results.issues.push(`Critical analysis error: ${error.message}`);
      this.results.suggestions.push('Review error logs and ensure all dependencies are available');
      this.results.analysisTime = Date.now() - startTime;
      this.results.score = 0; // Critical failure means no score
      this.results.grade = 'F';

      // Include error details
      const errorSummary = this.errorHandler.generateErrorSummary();
      const allIssues = this.errorHandler.getAllIssues();
      this.results.errors = allIssues.errors;
      this.results.warnings = allIssues.warnings;
      this.results.errorSummary = errorSummary;

      return this.results; // Return results instead of throwing for graceful degradation
    }
  }

  /**
   * Error-wrapped analysis execution
   */
  async runAnalysisWithErrorHandling() {
    try {
      // Call the actual analysis implementation
      await this.runAnalysis();
    } catch (error) {
      // Handle non-critical errors that don't prevent analysis completion
      const handlingResult = await this.errorHandler.handleError(
        error, 
        { 
          analyzer: this.categoryName, 
          projectRoot: this.config.projectRoot,
          method: 'runAnalysis' 
        },
        this.categoryName
      );

      if (!handlingResult.canContinue) {
        // Re-throw if cannot continue
        throw error;
      }

      // Log recovery if successful
      if (handlingResult.recovery.recovered) {
        this.results.recoveries.push({
          error: error.message,
          recovery: handlingResult.recovery.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Template method - must be implemented by subclasses
  async runAnalysis() {
    throw new Error('runAnalysis() must be implemented by subclass');
  }

  calculateGrade(percentage) {
    if (percentage >= 0.97) {return 'A+';}
    if (percentage >= 0.93) {return 'A';}
    if (percentage >= 0.90) {return 'A-';}
    if (percentage >= 0.87) {return 'B+';}
    if (percentage >= 0.83) {return 'B';}
    if (percentage >= 0.80) {return 'B-';}
    if (percentage >= 0.77) {return 'C+';}
    if (percentage >= 0.73) {return 'C';}
    if (percentage >= 0.70) {return 'C-';}
    if (percentage >= 0.67) {return 'D+';}
    if (percentage >= 0.65) {return 'D';}
    if (percentage >= 0.60) {return 'D-';}
    return 'F';
  }

  addScore(points, maxPoints, reason = '') {
    this.results.score += points;

    if (this.config.verbose && reason) {
      console.log(`     +${points}/${maxPoints} - ${reason}`);
    }
  }

  /**
   * Add issue with optional error handling context
   */
  addIssue(issue, suggestion = null, errorContext = {}) {
    this.results.issues.push(issue);
    
    if (suggestion) {
      this.results.suggestions.push(suggestion);
    }

    // If this is an error-related issue, log it
    if (errorContext.error) {
      const analyzerError = new AnalyzerError(
        issue,
        errorContext.type || ErrorTypes.UNKNOWN,
        errorContext.severity || ErrorSeverity.LOW,
        errorContext,
        errorContext.error
      );
      
      this.errorHandler.handleError(analyzerError, errorContext, this.categoryName);
    }
  }

  setDetail(key, value) {
    this.results.details[key] = value;
  }

  // Enhanced utility methods with error handling
  async fileExists(filePath) {
    return await this.errorHandler.executeWithRetry(async () => {
      await fs.access(path.resolve(this.config.projectRoot, filePath));
      return true;
    }, { file: filePath, operation: 'fileExists' }).catch(() => false);
  }

  /**
   * Safely read a file with error handling and recovery
   */
  async safeFileRead(filePath, options = {}) {
    const context = { file: filePath, operation: 'readFile' };
    
    return await this.errorHandler.executeWithRetry(async () => {
      const fullPath = path.resolve(this.config.projectRoot, filePath);
      return await fs.readFile(fullPath, options.encoding || 'utf8');
    }, context).catch(async (error) => {
      // Try recovery strategies
      const handlingResult = await this.errorHandler.handleError(
        error,
        { ...context, alternativePaths: options.alternatives },
        this.categoryName
      );

      if (handlingResult.recovery.recovered && handlingResult.recovery.result) {
        // Try alternative path
        return await fs.readFile(handlingResult.recovery.result, options.encoding || 'utf8');
      }

      // Return default or empty content for graceful degradation
      return options.defaultContent || '';
    });
  }

  /**
   * Safely execute shell commands with error handling
   */
  async safeCommandExecution(command, options = {}) {
    const context = { command, operation: 'shellCommand' };
    
    return await this.errorHandler.executeWithRetry(async () => {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.config.projectRoot,
        timeout: options.timeout || 10000,
        maxBuffer: options.maxBuffer || 1024 * 1024
      });
      
      return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
    }, context).catch(async (error) => {
      const handlingResult = await this.errorHandler.handleError(
        error,
        { ...context, tool: options.tool },
        this.categoryName
      );
      
      return { 
        stdout: '', 
        stderr: error.message, 
        success: false, 
        error: error.message,
        recovery: handlingResult.recovery
      };
    });
  }

  /**
   * Safely parse JSON with error handling
   */
  async safeJsonParse(content, context = {}) {
    try {
      return JSON.parse(content);
    } catch (error) {
      const handlingResult = await this.errorHandler.handleError(
        new AnalyzerError(
          `JSON parse error: ${error.message}`,
          ErrorTypes.PARSE_ERROR,
          ErrorSeverity.MEDIUM,
          context,
          error
        ),
        context,
        this.categoryName
      );
      
      return context.defaultValue || {};
    }
  }

  async readFile(filePath) {
    try {
      const fullPath = path.resolve(this.config.projectRoot, filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Could not read file ${filePath}: ${error.message}`);
    }
  }

  async readJsonFile(filePath) {
    try {
      const content = await this.readFile(filePath);
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Could not parse JSON file ${filePath}: ${error.message}`);
    }
  }

  async readPackageJson() {
    try {
      return await this.readJsonFile('package.json');
    } catch (error) {
      return null;
    }
  }

  async getDirectoryContents(dirPath, options = {}) {
    try {
      const fullPath = path.resolve(this.config.projectRoot, dirPath);
      const contents = await fs.readdir(fullPath, { withFileTypes: true });

      if (options.filesOnly) {
        return contents.filter(item => item.isFile()).map(item => item.name);
      }

      if (options.dirsOnly) {
        return contents.filter(item => item.isDirectory()).map(item => item.name);
      }

      return contents.map(item => ({
        name: item.name,
        isFile: item.isFile(),
        isDirectory: item.isDirectory()
      }));
    } catch (error) {
      return [];
    }
  }

  async getAllFiles(dirPath = '', extensions = null, excludeDirs = []) {
    const files = [];
    const defaultExcludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt'];
    const allExcludeDirs = [...defaultExcludeDirs, ...excludeDirs];

    const scanDirectory = async (currentPath) => {
      try {
        const fullPath = path.resolve(this.config.projectRoot, currentPath);
        const contents = await fs.readdir(fullPath, { withFileTypes: true });

        for (const item of contents) {
          const itemPath = path.join(currentPath, item.name);

          if (item.isDirectory()) {
            if (!allExcludeDirs.includes(item.name)) {
              await scanDirectory(itemPath);
            }
          } else if (item.isFile()) {
            if (!extensions || extensions.includes(path.extname(item.name))) {
              files.push(itemPath);
            }
          }
        }
      } catch (error) {
        // Ignore directory read errors
      }
    };

    await scanDirectory(dirPath);
    return files;
  }

  async getFileStats(filePath) {
    try {
      const fullPath = path.resolve(this.config.projectRoot, filePath);
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');

      return {
        size: stats.size,
        lines: content.split('\n').length,
        characters: content.length,
        lastModified: stats.mtime,
        isEmpty: content.trim().length === 0
      };
    } catch (error) {
      return null;
    }
  }

  // Common scoring patterns
  scoreByPresence(items, scorePerItem, description = '') {
    let totalScore = 0;
    const maxPossible = items.length * scorePerItem;

    items.forEach(item => {
      if (item.exists) {
        totalScore += scorePerItem;
        this.addScore(scorePerItem, scorePerItem, `${description}: ${item.name}`);
      } else {
        this.addIssue(`Missing ${item.name}`, `Add ${item.name} to improve score`);
      }
    });

    return { score: totalScore, maxScore: maxPossible };
  }

  scoreByQuality(items, maxScorePerItem, description = '') {
    let totalScore = 0;
    const maxPossible = items.length * maxScorePerItem;

    items.forEach(item => {
      const quality = Math.min(item.quality || 0, maxScorePerItem);
      totalScore += quality;

      if (quality === maxScorePerItem) {
        this.addScore(quality, maxScorePerItem, `${description}: ${item.name} (excellent)`);
      } else if (quality > maxScorePerItem * 0.5) {
        this.addScore(quality, maxScorePerItem, `${description}: ${item.name} (good)`);
      } else {
        this.addScore(quality, maxScorePerItem, `${description}: ${item.name} (needs improvement)`);
        this.addIssue(`${item.name} quality could be improved`, item.suggestion || `Improve ${item.name}`);
      }
    });

    return { score: totalScore, maxScore: maxPossible };
  }

  // Pattern matching utilities
  containsPattern(content, patterns) {
    if (typeof patterns === 'string') {
      patterns = [patterns];
    }

    return patterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(content);
      }
      return content.includes(pattern);
    });
  }

  countPatterns(content, patterns) {
    if (typeof patterns === 'string') {
      patterns = [patterns];
    }

    let count = 0;
    patterns.forEach(pattern => {
      if (pattern instanceof RegExp) {
        const matches = content.match(pattern);
        count += matches ? matches.length : 0;
      } else {
        const matches = content.split(pattern).length - 1;
        count += matches;
      }
    });

    return count;
  }

  // Project type specific utilities
  isReactProject() {
    return this.config.projectType === 'react-webapp';
  }

  isVueProject() {
    return this.config.projectType === 'vue-webapp';
  }

  isSvelteProject() {
    return this.config.projectType === 'svelte-webapp';
  }

  isNodeProject() {
    return this.config.projectType === 'node-api';
  }

  isJavaScriptProject() {
    return this.config.projectType === 'javascript';
  }
}