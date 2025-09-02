/**
 * QualityGates - Quality threshold evaluation and CI/CD integration
 *
 * Evaluates scoring results against configurable quality thresholds and generates
 * reports suitable for CI/CD pipeline consumption with pass/fail status.
 *
 * @class QualityGates
 * @example
 * const gates = new QualityGates({ thresholds: { overall: { min: 70 } } });
 * const result = await gates.evaluateResults(scoringResults);
 * if (!result.passed) {
 *   process.exit(1); // Fail CI/CD pipeline
 * }
 */

import fs from 'fs/promises';
import path from 'path';
import { GitHubActionsFormat } from './formats/GitHubActionsFormat.js';
import { GitLabCIFormat } from './formats/GitLabCIFormat.js';
import { JenkinsFormat } from './formats/JenkinsFormat.js';
import { GenericFormat } from './formats/GenericFormat.js';

/**


 * QualityGates class implementation


 *


 * Provides functionality for qualitygates operations


 */


/**


 * QualityGates class implementation


 *


 * Provides functionality for qualitygates operations


 */


export class QualityGates {
  /**
   * Create a new QualityGates instance
   *
   * @param {Object} config - Gates configuration
   * @param {Object} [config.thresholds] - Quality thresholds
   * @param {Object} [config.ci] - CI/CD integration configuration
   * @param {boolean} [config.enabled=true] - Enable quality gates
   * @param {boolean} [config.verbose=false] - Enable verbose logging
   */
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      thresholds: config.thresholds || this.getDefaultThresholds(),
      ci: config.ci || this.getDefaultCIConfig(),
      verbose: config.verbose || false,
      ...config
    };

    this.formatters = {
      'github-actions': new GitHubActionsFormat(),
      'gitlab-ci': new GitLabCIFormat(),
      'jenkins': new JenkinsFormat(),
      'generic': new GenericFormat()
    };

    this.evaluationResults = null;
  }

  /**
   * Evaluate scoring results against quality gates
   *
   * @param {Object} results - Complete scoring results
   * @param {Object} [options={}] - Evaluation options
   * @param {boolean} [options.strict=false] - Use strict evaluation (all gates must pass)
   * @returns {Promise<Object>} Evaluation result with pass/fail status
   *
   * @example
   * const result = await gates.evaluateResults(scoringResults);
   * console.log(`Quality gates: ${result.passed ? 'PASSED' : 'FAILED'}`);
   */
  async evaluateResults(results, options = {}) {  /**
   * Performs the specified operation
   * @param {Object} !this.config.enabled
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} !this.config.enabled
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.config.enabled) {
      return {
        passed: true,
        message: 'Quality gates disabled',
        gates: [],
        summary: { passed: 0, failed: 0, total: 0 }
      };
    }

    const { strict = false } = options;
    const gates = [];
    const overall = results.overall || {};
    const categories = results.categories || {};

    // Evaluate overall score gate
    const overallGate = this.evaluateOverallGate(overall);
    gates.push(overallGate);

    // Evaluate category-specific gates
    for (const [categoryKey, categoryResult] of Object.entries(categories)) {
      const categoryGate = this.evaluateCategoryGate(categoryKey, categoryResult);
      gates.push(categoryGate);
    }

    // Calculate summary
    const summary = this.calculateSummary(gates);

    // Determine overall pass/fail
    const passed = strict ?
      gates.every(gate => gate.passed) :
      summary.passed > 0 && summary.failed === 0;

    this.evaluationResults = {
      passed,
      message: this.generateMessage(summary, passed),
      gates,
      summary,
      timestamp: new Date().toISOString(),
      config: this.config,
      results: {
        overall: overall.score,
        categories: Object.fromEntries(
          Object.entries(categories).map(([key, cat]) => [key, cat.score])
        )
      }
    };    /**
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
      this.logEvaluationResults();
    }

    return this.evaluationResults;
  }

  /**
   * Evaluate overall score gate
   *
   * @param {Object} overall - Overall scoring results
   * @returns {Object} Gate evaluation result
   */
  evaluateOverallGate(overall) {
    const threshold = this.config.thresholds.overall;
    const score = overall.score || 0;
    const percentage = overall.percentage || 0;

    const passed = score >= (threshold.min || 0);
    const warning = threshold.warning && score < threshold.warning;

    return {
      name: 'Overall Quality Score',
      type: 'overall',
      passed,
      warning,
      score,
      threshold: threshold.min,
      message: this.generateGateMessage('overall', score, threshold, passed, warning),
      details: {
        percentage,
        grade: overall.grade,
        maxScore: overall.maxScore
      }
    };
  }

  /**
   * Evaluate category-specific gate
   *
   * @param {string} categoryKey - Category key
   * @param {Object} categoryResult - Category scoring results
   * @returns {Object} Gate evaluation result
   */
  evaluateCategoryGate(categoryKey, categoryResult) {
    const threshold = this.config.thresholds.categories?.[categoryKey];    /**
   * Performs the specified operation
   * @param {any} !threshold
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !threshold
   * @returns {any} The operation result
   */


    if (!threshold) {
      return {
        name: this.getCategoryDisplayName(categoryKey),
        type: 'category',
        passed: true,
        warning: false,
        score: categoryResult.score,
        threshold: null,
        message: 'No threshold configured',
        details: {
          categoryKey,
          maxScore: categoryResult.maxScore,
          grade: categoryResult.grade
        }
      };
    }

    const score = categoryResult.score || 0;
    const passed = score >= (threshold.min || 0);
    const warning = threshold.warning && score < threshold.warning;

    return {
      name: this.getCategoryDisplayName(categoryKey),
      type: 'category',
      passed,
      warning,
      score,
      threshold: threshold.min,
      message: this.generateGateMessage(categoryKey, score, threshold, passed, warning),
      details: {
        categoryKey,
        maxScore: categoryResult.maxScore,
        grade: categoryResult.grade,
        issues: categoryResult.issues || [],
        suggestions: categoryResult.suggestions || []
      }
    };
  }

  /**
   * Generate CI/CD compatible output
   *
   * @param {Object} [evaluationResults=null] - Evaluation results (uses last evaluation if null)
   * @param {Object} [options={}] - Output options
   * @param {string} [options.format='auto'] - Output format ('auto', 'github-actions', 'gitlab-ci', 'jenkins', 'generic')
   * @param {string} [options.outputPath=null] - Output file path
   * @returns {Promise<Object>} CI/CD output result
   */
  async generateCIOutput(evaluationResults = null, options = {}) {
    const results = evaluationResults || this.evaluationResults;    /**
   * Performs the specified operation
   * @param {any} !results
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !results
   * @returns {any} The operation result
   */


    if (!results) {
      throw new Error('No evaluation results available. Run evaluateResults() first.');
    }

    const {
      format = 'auto',
      outputPath = null
    } = options;

    // Determine output format
    const outputFormat = format === 'auto' ? this.detectCIFormat() : format;
    const formatter = this.formatters[outputFormat];    /**
   * Performs the specified operation
   * @param {any} !formatter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !formatter
   * @returns {any} The operation result
   */


    if (!formatter) {
      throw new Error(`Unsupported CI format: ${outputFormat}`);
    }

    // Generate formatted output
    const output = await formatter.format(results, this.config);

    // Write to file if output path specified    /**
   * Performs the specified operation
   * @param {string} outputPath
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} outputPath
   * @returns {any} The operation result
   */

    if (outputPath) {
      await this.writeCIOutput(output, outputPath, outputFormat);
    }

    // Set CI environment variables if configured    /**
   * Performs the specified operation
   * @param {Object} this.config.ci.setEnvironment
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.ci.setEnvironment
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.ci.setEnvironment) {
      this.setCIEnvironmentVariables(results);
    }

    return {
      format: outputFormat,
      output,
      outputPath,
      passed: results.passed,
      summary: results.summary
    };
  }

  /**
   * Write CI output to file
   *
   * @param {string} output - Formatted output
   * @param {string} outputPath - Output file path
   * @param {string} format - Output format
   * @returns {Promise<void>}
   */
  async writeCIOutput(output, outputPath, format) {
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, output);      /**
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
        // LOG: `📄 CI output written to: ${outputPath}`
      }
    } catch (error) {
      throw new Error(`Failed to write CI output: ${error.message}`);
    }
  }

  /**
   * Set CI environment variables
   *
   * @param {Object} results - Evaluation results
   * @returns {void}
   */
  setCIEnvironmentVariables(results) {
    const prefix = this.config.ci.environmentPrefix || 'QUALITY_GATES_';

    process.env[`${prefix}PASSED`] = results.passed.toString();
    process.env[`${prefix}SCORE`] = results.results.overall.toString();
    process.env[`${prefix}FAILED_GATES`] = results.summary.failed.toString();
    process.env[`${prefix}TOTAL_GATES`] = results.summary.total.toString();    /**
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
      // LOG: `🔧 Set CI environment variables with prefix: ${prefix}`
    }
  }

  /**
   * Detect CI environment and return appropriate format
   *
   * @returns {string} Detected CI format
   */
  detectCIFormat() {
    // Check environment variables for CI detection  /**
   * Performs the specified operation
   * @param {any} process.env.GITHUB_ACTIONS - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} process.env.GITHUB_ACTIONS - Optional parameter
   * @returns {any} The operation result
   */

    if (process.env.GITHUB_ACTIONS === 'true') {
      return 'github-actions';
    }    /**
   * Performs the specified operation
   * @param {any} process.env.GITLAB_CI - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} process.env.GITLAB_CI - Optional parameter
   * @returns {any} The operation result
   */


    if (process.env.GITLAB_CI === 'true') {
      return 'gitlab-ci';
    }    /**
   * Performs the specified operation
   * @param {string} process.env.JENKINS_URL
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} process.env.JENKINS_URL
   * @returns {any} The operation result
   */


    if (process.env.JENKINS_URL) {
      return 'jenkins';
    }

    // Check for configured format    /**
   * Performs the specified operation
   * @param {Object} this.config.ci.format
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.ci.format
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.ci.format) {
      return this.config.ci.format;
    }

    // Default to generic
    return 'generic';
  }

  /**
   * Get default quality thresholds
   *
   * @returns {Object} Default thresholds
   */
  getDefaultThresholds() {
    return {
      overall: { min: 70, warning: 80 },
      categories: {
        quality: { min: 15, warning: 18 },
        testing: { min: 10, warning: 12 },
        security: { min: 12, warning: 14 },
        structure: { min: 15, warning: 18 },
        performance: { min: 10, warning: 12 },
        developerExperience: { min: 7, warning: 9 },
        completeness: { min: 3, warning: 4 }
      }
    };
  }

  /**
   * Get default CI configuration
   *
   * @returns {Object} Default CI configuration
   */
  getDefaultCIConfig() {
    return {
      format: 'auto',
      output: {
        summary: true,
        detailed: false,
        trend: false
      },
      blocking: {
        enabled: true,
        onFailure: 'error',
        onWarning: 'warning'
      },
      setEnvironment: true,
      environmentPrefix: 'QUALITY_GATES_'
    };
  }

  /**
   * Calculate gate summary statistics
   *
   * @param {Array} gates - Array of gate results
   * @returns {Object} Summary statistics
   */
  calculateSummary(gates) {
    const passed = gates.filter(gate => gate.passed).length;
    const failed = gates.filter(gate => !gate.passed).length;
    const warnings = gates.filter(gate => gate.warning).length;

    return {
      passed,
      failed,
      warnings,
      total: gates.length,
      passRate: gates.length > 0 ? (passed / gates.length) * 100 : 0
    };
  }

  /**
   * Generate gate evaluation message
   *
   * @param {string} gateName - Gate name
   * @param {number} score - Actual score
   * @param {Object} threshold - Threshold configuration
   * @param {boolean} passed - Whether gate passed
   * @param {boolean} warning - Whether gate has warning
   * @returns {string} Evaluation message
   */
  generateGateMessage(gateName, score, threshold, passed, warning) {
    const thresholdText = threshold.min ? ` (threshold: ${threshold.min})` : '';    /**
   * Performs the specified operation
   * @param {any} passed && !warning
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} passed && !warning
   * @returns {any} The operation result
   */


    if (passed && !warning) {
      return `✅ ${gateName}: ${score}${thresholdText} - PASSED`;
    } else if (passed && warning) {
      return `⚠️  ${gateName}: ${score}${thresholdText} - PASSED (warning: below ${threshold.warning})`;
    } else {
      return `❌ ${gateName}: ${score}${thresholdText} - FAILED`;
    }
  }

  /**
   * Generate overall evaluation message
   *
   * @param {Object} summary - Summary statistics
   * @param {boolean} passed - Overall pass status
   * @returns {string} Overall message
   */
  generateMessage(summary, passed) {  /**
   * Performs the specified operation
   * @param {any} passed
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} passed
   * @returns {any} The operation result
   */

    if (passed) {
      return `✅ Quality gates PASSED (${summary.passed}/${summary.total} gates passed)`;
    } else {
      return `❌ Quality gates FAILED (${summary.failed}/${summary.total} gates failed)`;
    }
  }

  /**
   * Get category display name
   *
   * @param {string} categoryKey - Category key
   * @returns {string} Display name
   */
  getCategoryDisplayName(categoryKey) {
    const displayNames = {
      structure: 'Code Structure & Architecture',
      quality: 'Code Quality & Maintainability',
      performance: 'Performance & Optimization',
      testing: 'Testing & Documentation',
      security: 'Security & Error Handling',
      developerExperience: 'Developer Experience',
      completeness: 'Completeness & Production Readiness'
    };

    return displayNames[categoryKey] || categoryKey;
  }

  /**
   * Log evaluation results to console
   *
   * @returns {void}
   */
  logEvaluationResults() {
    const results = this.evaluationResults;

    // LOG: \n🎯 Quality Gates Evaluation Results
    // LOG: ═.repeat(50)
    // LOG: `Overall: ${results.passed ? ✅ PASSED : ❌ FAILED}`
    // LOG: `Message: ${results.message}`
    // LOG: `Summary: ${results.summary.passed}/${results.summary.total} gates passed`
    /**
   * Performs the specified operation
   * @param {any} results.summary.warnings > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} results.summary.warnings > 0
   * @returns {any} The operation result
   */
    if (results.summary.warnings > 0) {
      // LOG: `Warnings: ${results.summary.warnings}`
    }

    // LOG: \nGate Details:
    results.gates.forEach(gate => {
      const status = gate.passed ? '✅' : '❌';
      const warning = gate.warning ? ' ⚠️' : '';
      // LOG: `  ${status}${warning} ${gate.name}: ${gate.score}${gate.threshold ? `/${gate.threshold}` : }`
    });
  }

  /**
   * Get configuration for debugging
   *
   * @returns {Object} Configuration summary
   */
  getConfiguration() {
    return {
      enabled: this.config.enabled,
      thresholds: this.config.thresholds,
      ci: this.config.ci,
      formatters: Object.keys(this.formatters)
    };
  }
}
