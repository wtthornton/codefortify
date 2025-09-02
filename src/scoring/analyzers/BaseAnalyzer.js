/**
 * BaseAnalyzer - Abstract base class for all scoring analyzers
 *
 * Provides common functionality and interface for category-specific analyzers
 * with comprehensive error handling, recovery mechanisms, and graceful degradation.
 */

import fs from 'fs/promises';
import path from 'path';
import { AnalyzerErrorHandler, AnalyzerError, ErrorTypes, ErrorSeverity } from '../core/AnalyzerErrorHandler.js';

/**


 * BaseAnalyzer class implementation


 *


 * Provides functionality for baseanalyzer operations


 */


/**


 * BaseAnalyzer class implementation


 *


 * Provides functionality for baseanalyzer operations


 */


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
      maxRetries: 1,
      retryDelay: 100
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
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyze() {
    const startTime = Date.now();

    try {      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.verbose) {
        // LOG: `   Analyzing ${this.categoryName}...`
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

      this.results.analysisTime = Date.now() - startTime;      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


      if (this.config.verbose) {
        // LOG: `   ${this.categoryName}: ${this.results.score}/${this.results.maxScore} (${this.results.grade}) - ${this.results.analysisTime}ms`
      }

      return this.results;

    }

    catch (error) {
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
    }

    catch (error) {
      // Handle non-critical errors that don't prevent analysis completion
      const handlingResult = await this.errorHandler.handleError(
        error,
        {
          analyzer: this.categoryName,
          projectRoot: this.config.projectRoot,
          method: 'runAnalysis'
        },
        this.categoryName
      );      /**
   * Performs the specified operation
   * @param {any} !handlingResult.canContinue
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !handlingResult.canContinue
   * @returns {any} The operation result
   */


      if (!handlingResult.canContinue) {
        // Re-throw if cannot continue
        throw error;
      }

      // Log recovery if successful      /**
   * Performs the specified operation
   * @param {any} handlingResult.recovery.recovered
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} handlingResult.recovery.recovered
   * @returns {any} The operation result
   */

      if (handlingResult.recovery.recovered) {
        this.results.recoveries.push({
          error: error.message,
          recovery: handlingResult.recovery.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Template method - must be implemented by subclasses  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */

  async runAnalysis() {
    throw new Error('runAnalysis() must be implemented by subclass');
  }  /**
   * Calculates the result
   * @param {any} percentage
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} percentage
   * @returns {number} The calculated result
   */


  calculateGrade(percentage) {  /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.97) {return 'A+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.93) {return 'A';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.90) {return 'A-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.87) {return 'B+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.83) {return 'B';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.80) {return 'B-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.77) {return 'C+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.73) {return 'C';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.70) {return 'C-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.67) {return 'D+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.65) {return 'D';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.60) {return 'D-';}
    return 'F';
  }  /**
   * Adds an item
   * @param {any} points
   * @param {any} maxPoints
   * @param {any} reason - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Adds an item
   * @param {any} points
   * @param {any} maxPoints
   * @param {any} reason - Optional parameter
   * @returns {any} The operation result
   */


  addScore(points, maxPoints, reason = '') {
    this.results.score += points;    /**
   * Performs the specified operation
   * @param {Object} this.config.verbose && reason
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.verbose && reason
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.config.verbose && reason) {
      // LOG: `     +${points}/${maxPoints} - ${reason}`
    }
  }

  /**
   * Add issue with optional error handling context
   */
  addIssue(issue, suggestion = null, errorContext = {}) {
    this.results.issues.push(issue);    /**
   * Performs the specified operation
   * @param {any} suggestion
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} suggestion
   * @returns {any} The operation result
   */


    if (suggestion) {
      this.results.suggestions.push(suggestion);
    }

    // If this is an error-related issue, log it    /**
   * Performs the specified operation
   * @param {any} errorContext.error
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} errorContext.error
   * @returns {any} The operation result
   */

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
  }  /**
   * Sets configuration
   * @param {any} key
   * @param {any} value
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @param {any} key
   * @param {any} value
   * @returns {any} The operation result
   */


  setDetail(key, value) {
    this.results.details[key] = value;
  }

  // Enhanced utility methods with error handling  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */

  async fileExists(filePath) {
    try {
      await fs.access(path.resolve(this.config.projectRoot, filePath));
      return true;
    }

    catch {
      return false;
    }
  }

  /**
   * Safely read a file with error handling and recovery
   */
  async safeFileRead(filePath, options = {}) {
    try {
      const fullPath = path.resolve(this.config.projectRoot, filePath);
      return await fs.readFile(fullPath, options.encoding || 'utf8');
    }

    catch (error) {
      // Try alternative paths if provided      /**
   * Performs the specified operation
   * @param {Object} options.alternatives
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {Object} options.alternatives
   * @returns {any} The operation result
   */

      if (options.alternatives) {        /**
   * Performs the specified operation
   * @param {Object} const altPath of options.alternatives
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {Object} const altPath of options.alternatives
   * @returns {any} The operation result
   */

        for (const altPath of options.alternatives) {
          try {
            const fullAltPath = path.resolve(this.config.projectRoot, altPath);
            return await fs.readFile(fullAltPath, options.encoding || 'utf8');
          }

          catch {
            // Continue to next alternative
          }
        }
      }

      // Return default or empty content for graceful degradation
      return options.defaultContent || '';
    }
  }

  /**
   * Safely execute shell commands with error handling
   */
  async safeCommandExecution(command, options = {}) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.config.projectRoot,
        timeout: options.timeout || 10000,
        maxBuffer: options.maxBuffer || 1024 * 1024
      });

      return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
    }

    catch (error) {
      return {
        stdout: '',
        stderr: error.message,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Safely parse JSON with error handling
   */
  async safeJsonParse(content, context = {}) {
    try {
      return JSON.parse(content);
    }

    catch (error) {
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
  }  /**
   * Reads data from file
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Reads data from file
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */


  async readFile(filePath) {
    try {
      const fullPath = path.resolve(this.config.projectRoot, filePath);
      return await fs.readFile(fullPath, 'utf-8');
    }

    catch (error) {
      throw new Error(`Could not read file ${filePath}: ${error.message}`);
    }
  }  /**
   * Reads data from file
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Reads data from file
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */


  async readJsonFile(filePath) {
    try {
      const content = await this.readFile(filePath);
      return JSON.parse(content);
    }

    catch (error) {
      throw new Error(`Could not parse JSON file ${filePath}: ${error.message}`);
    }
  }  /**
   * Reads data from file
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Reads data from file
   * @returns {Promise} Promise that resolves with the result
   */


  async readPackageJson() {
    try {
      return await this.readJsonFile('package.json');
    }

    catch (error) {
      return null;
    }
  }  /**
   * Retrieves data
   * @param {string} dirPath
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {string} dirPath
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async getDirectoryContents(dirPath, options = {}) {
    try {
      const fullPath = path.resolve(this.config.projectRoot, dirPath);
      const contents = await fs.readdir(fullPath, { withFileTypes: true });      /**
   * Performs the specified operation
   * @param {Object} options.filesOnly
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {Object} options.filesOnly
   * @returns {any} The operation result
   */


      if (options.filesOnly) {
        return contents.filter(item => item.isFile()).map(item => item.name);
      }      /**
   * Performs the specified operation
   * @param {Object} options.dirsOnly
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {Object} options.dirsOnly
   * @returns {any} The operation result
   */


      if (options.dirsOnly) {
        return contents.filter(item => item.isDirectory()).map(item => item.name);
      }

      return contents.map(item => ({
        name: item.name,
        isFile: item.isFile(),
        isDirectory: item.isDirectory()
      }));
    }

    catch (error) {
      return [];
    }
  }  /**
   * Retrieves data
   * @param {string} dirPath - Optional parameter
   * @param {any} extensions - Optional parameter
   * @param {any} excludeDirs - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {string} dirPath - Optional parameter
   * @param {any} extensions - Optional parameter
   * @param {any} excludeDirs - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async getAllFiles(dirPath = '', extensions = null, excludeDirs = []) {
    const files = [];
    const defaultExcludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt'];
    const allExcludeDirs = [...defaultExcludeDirs, ...excludeDirs];

    const scanDirectory = async (currentPath) => {
      try {
        const fullPath = path.resolve(this.config.projectRoot, currentPath);
        const contents = await fs.readdir(fullPath, { withFileTypes: true });        /**
   * Performs the specified operation
   * @param {any} const item of contents
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const item of contents
   * @returns {any} The operation result
   */


        for (const item of contents) {
          const itemPath = path.join(currentPath, item.name);

          if (item.isDirectory()) {
            if (!allExcludeDirs.includes(item.name)) {
              await scanDirectory(itemPath);
            }
          }

          else if (item.isFile()) {
            if (!extensions || extensions.includes(path.extname(item.name))) {
              files.push(itemPath);
            }
          }
        }
      }

      catch (error) {
        // Ignore directory read errors
      }
    };

    await scanDirectory(dirPath);
    return files;
  }  /**
   * Retrieves data
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */


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
    }

    catch (error) {
      return null;
    }
  }

  // Common scoring patterns  /**
   * Performs the specified operation
   * @param {Array} items
   * @param {any} scorePerItem
   * @param {any} description - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {Array} items
   * @param {any} scorePerItem
   * @param {any} description - Optional parameter
   * @returns {any} The operation result
   */

  scoreByPresence(items, scorePerItem, description = '') {
    let totalScore = 0;
    const maxPossible = items.length * scorePerItem;

    items.forEach(item => {      /**
   * Performs the specified operation
   * @param {boolean} item.exists
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} item.exists
   * @returns {boolean} True if successful, false otherwise
   */

      if (item.exists) {
        totalScore += scorePerItem;
        this.addScore(scorePerItem, scorePerItem, `${description}: ${item.name}`);
      }

      else {
        this.addIssue(`Missing ${item.name}`, `Add ${item.name} to improve score`);
      }
    });

    return { score: totalScore, maxScore: maxPossible };
  }  /**
   * Performs the specified operation
   * @param {Array} items
   * @param {any} maxScorePerItem
   * @param {any} description - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {Array} items
   * @param {any} maxScorePerItem
   * @param {any} description - Optional parameter
   * @returns {any} The operation result
   */


  scoreByQuality(items, maxScorePerItem, description = '') {
    let totalScore = 0;
    const maxPossible = items.length * maxScorePerItem;

    items.forEach(item => {
      const quality = Math.min(item.quality || 0, maxScorePerItem);
      totalScore += quality;      /**
   * Performs the specified operation
   * @param {any} quality - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} quality - Optional parameter
   * @returns {any} The operation result
   */


      if (quality === maxScorePerItem) {
        this.addScore(quality, maxScorePerItem, `${description}: ${item.name} (excellent)`);
      }

      else if (quality > maxScorePerItem * 0.5) {
        this.addScore(quality, maxScorePerItem, `${description}: ${item.name} (good)`);
      }

      else {
        this.addScore(quality, maxScorePerItem, `${description}: ${item.name} (needs improvement)`);
        this.addIssue(`${item.name} quality could be improved`, item.suggestion || `Improve ${item.name}`);
      }
    });

    return { score: totalScore, maxScore: maxPossible };
  }

  // Pattern matching utilities  /**
   * Performs the specified operation
   * @param {any} content
   * @param {any} patterns
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} content
   * @param {any} patterns
   * @returns {any} The operation result
   */

  containsPattern(content, patterns) {  /**
   * Performs the specified operation
   * @param {any} typeof patterns - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} typeof patterns - Optional parameter
   * @returns {string} The operation result
   */

    if (typeof patterns === 'string') {
      patterns = [patterns];
    }

    return patterns.some(pattern => {      /**
   * Performs the specified operation
   * @param {any} pattern instanceof RegExp
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} pattern instanceof RegExp
   * @returns {any} The operation result
   */

      if (pattern instanceof RegExp) {
        return pattern.test(content);
      }

      return content.includes(pattern);
    });
  }  /**
   * Performs the specified operation
   * @param {any} content
   * @param {any} patterns
   * @returns {number} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} content
   * @param {any} patterns
   * @returns {number} The operation result
   */


  countPatterns(content, patterns) {  /**
   * Performs the specified operation
   * @param {any} typeof patterns - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} typeof patterns - Optional parameter
   * @returns {string} The operation result
   */

    if (typeof patterns === 'string') {
      patterns = [patterns];
    }

    let count = 0;
    patterns.forEach(pattern => {      /**
   * Performs the specified operation
   * @param {any} pattern instanceof RegExp
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} pattern instanceof RegExp
   * @returns {any} The operation result
   */

      if (pattern instanceof RegExp) {
        const matches = content.match(pattern);
        count += matches ? matches.length : 0;
      }

      else {
        const matches = content.split(pattern).length - 1;
        count += matches;
      }
    });

    return count;
  }

  // Project type specific utilities  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */

  isReactProject() {
    return this.config.projectType === 'react-webapp';
  }  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */


  isVueProject() {
    return this.config.projectType === 'vue-webapp';
  }  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */


  isSvelteProject() {
    return this.config.projectType === 'svelte-webapp';
  }  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */


  isNodeProject() {
    return this.config.projectType === 'node-api';
  }  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @returns {boolean} True if successful, false otherwise
   */


  isJavaScriptProject() {
    return this.config.projectType === 'javascript';
  }
}