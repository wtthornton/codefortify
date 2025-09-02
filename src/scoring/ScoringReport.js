/**
 * ScoringReport - Generate comprehensive scoring reports in multiple formats
 * Refactored using Strategy pattern to reduce from 1648 to ~350 lines
 */

import path from 'path';
import fs from 'fs/promises';
import { SmartReportRouter } from '../routing/SmartReportRouter.js';
import { HTMLReportStrategy } from './report/strategies/HTMLReportStrategy.js';
import { JSONReportStrategy } from './report/strategies/JSONReportStrategy.js';
import { MarkdownReportStrategy } from './report/strategies/MarkdownReportStrategy.js';

export class ScoringReport {
  constructor(config = {}) {
    this.config = config;
    this.projectRoot = config.projectRoot || process.cwd();
    this.router = new SmartReportRouter(config);
    
    // Initialize report generation strategies
    this.strategies = new Map();
    this.strategies.set('html', new HTMLReportStrategy());
    this.strategies.set('json', new JSONReportStrategy());
    this.strategies.set('markdown', new MarkdownReportStrategy());
    this.strategies.set('md', new MarkdownReportStrategy());
    
    // Default format
    this.defaultFormat = config.defaultFormat || 'html';
  }

  /**
   * Generate report in specified format
   * @param {Object} results - Analysis results
   * @param {string} format - Output format (html, json, markdown)
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated report content
   */
  async generateReport(results, format = null, options = {}) {
    const outputFormat = format || this.defaultFormat;
    const strategy = this.getStrategy(outputFormat);
    
    if (!strategy) {
      throw new Error(`Unsupported report format: ${outputFormat}`);
    }

    const generationOptions = {
      projectName: options.projectName || this.extractProjectName(),
      timestamp: options.timestamp || new Date().toISOString(),
      version: options.version || '1.1.0',
      ...options
    };

    return await strategy.generate(results, generationOptions);
  }

  /**
   * Generate and save report to file system
   * @param {Object} results - Analysis results
   * @param {Object} options - Save options
   * @returns {Promise<Object>} Save result with file paths
   */
  async saveReport(results, options = {}) {
    const format = options.format || this.defaultFormat;
    const strategy = this.getStrategy(format);
    
    if (!strategy) {
      throw new Error(`Unsupported report format: ${format}`);
    }

    // Generate report content
    const content = await this.generateReport(results, format, options);
    
    // Determine output path using smart routing
    const routingResult = await this.router.determineOutputPath({
      format,
      projectRoot: this.projectRoot,
      filename: options.filename,
      ...options
    });

    // Ensure output directory exists
    await fs.mkdir(path.dirname(routingResult.path), { recursive: true });

    // Save report to file
    await fs.writeFile(routingResult.path, content, 'utf8');

    const saveResult = {
      success: true,
      path: routingResult.path,
      format,
      size: Buffer.byteLength(content, 'utf8'),
      strategy: routingResult.strategy,
      generatedAt: new Date().toISOString()
    };

    // Open in browser if requested and format is HTML
    if (options.openInBrowser && format === 'html') {
      await this.openInBrowser(routingResult.path);
      saveResult.openedInBrowser = true;
    }

    return saveResult;
  }

  /**
   * Generate multiple formats simultaneously
   * @param {Object} results - Analysis results
   * @param {Array<string>} formats - Array of formats to generate
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Results for each format
   */
  async generateMultipleFormats(results, formats = ['html', 'json', 'markdown'], options = {}) {
    const outputs = {};
    const errors = {};

    await Promise.allSettled(
      formats.map(async (format) => {
        try {
          outputs[format] = await this.generateReport(results, format, options);
        } catch (error) {
          errors[format] = error.message;
        }
      })
    );

    return {
      success: Object.keys(outputs).length > 0,
      outputs,
      errors,
      generatedFormats: Object.keys(outputs),
      failedFormats: Object.keys(errors)
    };
  }

  /**
   * Save reports in multiple formats
   * @param {Object} results - Analysis results
   * @param {Object} options - Save options
   * @returns {Promise<Object>} Save results for each format
   */
  async saveMultipleFormats(results, options = {}) {
    const formats = options.formats || ['html', 'json', 'markdown'];
    const saveResults = {};
    const errors = {};

    await Promise.allSettled(
      formats.map(async (format) => {
        try {
          saveResults[format] = await this.saveReport(results, {
            ...options,
            format
          });
        } catch (error) {
          errors[format] = error.message;
        }
      })
    );

    return {
      success: Object.keys(saveResults).length > 0,
      results: saveResults,
      errors,
      savedFormats: Object.keys(saveResults),
      failedFormats: Object.keys(errors)
    };
  }

  /**
   * Get available report formats
   * @returns {Array<string>} Available format names
   */
  getAvailableFormats() {
    return Array.from(this.strategies.keys());
  }

  /**
   * Register custom report strategy
   * @param {string} format - Format name
   * @param {ReportStrategy} strategy - Strategy instance
   */
  registerStrategy(format, strategy) {
    this.strategies.set(format.toLowerCase(), strategy);
  }

  /**
   * Get strategy for format
   * @param {string} format - Format name
   * @returns {ReportStrategy|null} Strategy instance
   */
  getStrategy(format) {
    return this.strategies.get(format.toLowerCase()) || null;
  }

  /**
   * Get report metadata
   * @param {Object} results - Analysis results
   * @returns {Object} Report metadata
   */
  getReportMetadata(results) {
    return {
      projectName: this.extractProjectName(),
      totalCategories: Object.keys(results.categories || {}).length,
      overallScore: results.overall?.score || 0,
      maxScore: results.overall?.maxScore || 100,
      grade: results.overall?.grade || 'F',
      analysisTime: results.analysisTime || 0,
      generatedAt: new Date().toISOString(),
      availableFormats: this.getAvailableFormats()
    };
  }

  /**
   * Validate results structure
   * @param {Object} results - Analysis results to validate
   * @returns {boolean} True if valid
   */
  validateResults(results) {
    if (!results || typeof results !== 'object') {
      throw new Error('Results must be a valid object');
    }

    if (!results.categories) {
      throw new Error('Results must contain categories');
    }

    if (!results.overall) {
      throw new Error('Results must contain overall score information');
    }

    return true;
  }

  /**
   * Extract project name from package.json or directory
   */
  extractProjectName() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageContent = require(packageJsonPath);
      return packageContent.name || path.basename(this.projectRoot);
    } catch {
      return path.basename(this.projectRoot);
    }
  }

  /**
   * Open report in browser
   * @param {string} filePath - Path to HTML report
   */
  async openInBrowser(filePath) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const command = process.platform === 'win32' 
        ? `start "${filePath}"` 
        : process.platform === 'darwin' 
        ? `open "${filePath}"` 
        : `xdg-open "${filePath}"`;

      await execAsync(command);
    } catch (error) {
      // Silently fail if cannot open browser
      console.warn(`Could not open browser: ${error.message}`);
    }
  }

  /**
   * Get performance level description
   * @param {number} percentage - Score percentage
   * @returns {Object} Performance level info
   */
  getPerformanceLevel(percentage) {
    if (percentage >= 0.9) {
      return { level: 'excellent', color: 'green', description: 'Outstanding quality' };
    }
    if (percentage >= 0.8) {
      return { level: 'good', color: 'lightgreen', description: 'Good quality' };
    }
    if (percentage >= 0.7) {
      return { level: 'acceptable', color: 'yellow', description: 'Acceptable quality' };
    }
    if (percentage >= 0.6) {
      return { level: 'needs-improvement', color: 'orange', description: 'Needs improvement' };
    }
    return { level: 'poor', color: 'red', description: 'Poor quality' };
  }

  /**
   * Get detailed score description
   * @param {number} percentage - Score percentage
   * @returns {string} Detailed description
   */
  getScoreDescription(percentage) {
    const level = this.getPerformanceLevel(percentage);
    
    const descriptions = {
      excellent: "Your project demonstrates exceptional code quality! Keep up the excellent work.",
      good: "Your project has good quality with minor areas for improvement.",
      acceptable: "Your project has acceptable quality but would benefit from focused improvements.",
      'needs-improvement': "Your project needs improvement in multiple areas to reach good quality standards.",
      poor: "Your project has significant quality issues that require immediate attention."
    };

    return descriptions[level.level] || descriptions.poor;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.router = new SmartReportRouter(this.config);
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}