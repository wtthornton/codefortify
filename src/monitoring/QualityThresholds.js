/**
 * Quality Thresholds for Context7
 * Manages quality thresholds and validation
 *
 * Features:
 * - Configurable quality thresholds
 * - Threshold validation
 * - Dynamic threshold adjustment
 */

export class QualityThresholds {
  constructor(thresholds = {}) {
    this.defaultThresholds = {
      complexity: 10,
      maintainability: 70,
      security: 80,
      performance: 75,
      readability: 80,
      testability: 70
    };

    this.thresholds = { ...this.defaultThresholds, ...thresholds };
    this.thresholdHistory = [];
  }

  /**
   * Get threshold for a metric
   * @param {string} metric - Metric name
   * @returns {number} Threshold value
   */
  getThreshold(metric) {
    return this.thresholds[metric] || 0;
  }

  /**
   * Set threshold for a metric
   * @param {string} metric - Metric name
   * @param {number} value - Threshold value
   * @returns {boolean} Success status
   */
  setThreshold(metric, value) {
    if (this.validateThreshold(metric, value)) {
      const oldValue = this.thresholds[metric];
      this.thresholds[metric] = value;

      // Record threshold change
      this.thresholdHistory.push({
        metric,
        oldValue,
        newValue: value,
        timestamp: new Date()
      });

      return true;
    }
    return false;
  }

  /**
   * Get all thresholds
   * @returns {Object} All thresholds
   */
  getAllThresholds() {
    return { ...this.thresholds };
  }

  /**
   * Update multiple thresholds
   * @param {Object} newThresholds - New threshold values
   * @returns {Object} Update result
   */
  updateThresholds(newThresholds) {
    const result = {
      updated: [],
      failed: [],
      errors: []
    };

    for (const [metric, value] of Object.entries(newThresholds)) {
      try {
        if (this.setThreshold(metric, value)) {
          result.updated.push({ metric, value });
        } else {
          result.failed.push({ metric, value, reason: 'Invalid value' });
        }
      } catch (error) {
        result.errors.push({ metric, value, error: error.message });
      }
    }

    return result;
  }

  /**
   * Reset thresholds to defaults
   * @returns {Object} Reset result
   */
  resetToDefaults() {
    const oldThresholds = { ...this.thresholds };
    this.thresholds = { ...this.defaultThresholds };

    // Record reset
    this.thresholdHistory.push({
      action: 'reset',
      oldThresholds,
      newThresholds: this.thresholds,
      timestamp: new Date()
    });

    return {
      success: true,
      oldThresholds,
      newThresholds: this.thresholds
    };
  }

  /**
   * Get threshold history
   * @param {number} limit - Maximum number of history entries
   * @returns {Array} Threshold history
   */
  getThresholdHistory(limit = 50) {
    return this.thresholdHistory.slice(-limit);
  }

  /**
   * Validate threshold value
   * @param {string} metric - Metric name
   * @param {number} value - Threshold value
   * @returns {boolean} Valid status
   */
  validateThreshold(metric, value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return false;
    }

    // Define validation rules for each metric
    const validationRules = {
      complexity: (v) => v >= 1 && v <= 50,
      maintainability: (v) => v >= 0 && v <= 100,
      security: (v) => v >= 0 && v <= 100,
      performance: (v) => v >= 0 && v <= 100,
      readability: (v) => v >= 0 && v <= 100,
      testability: (v) => v >= 0 && v <= 100
    };

    const rule = validationRules[metric];
    return rule ? rule(value) : false;
  }

  /**
   * Get threshold recommendations based on project context
   * @param {Object} context - Project context
   * @returns {Object} Recommended thresholds
   */
  getRecommendedThresholds(context) {
    const recommendations = { ...this.defaultThresholds };

    // Adjust based on project type
    if (context.project?.type === 'react') {
      recommendations.complexity = 12;
      recommendations.maintainability = 75;
      recommendations.testability = 80;
    } else if (context.project?.type === 'nodejs') {
      recommendations.complexity = 15;
      recommendations.security = 85;
      recommendations.performance = 80;
    } else if (context.project?.type === 'vue') {
      recommendations.complexity = 10;
      recommendations.maintainability = 70;
      recommendations.readability = 85;
    }

    // Adjust based on team size
    if (context.team?.size > 10) {
      recommendations.maintainability += 5;
      recommendations.readability += 5;
      recommendations.testability += 5;
    }

    // Adjust based on project maturity
    if (context.project?.maturity === 'production') {
      recommendations.security += 10;
      recommendations.performance += 5;
    } else if (context.project?.maturity === 'development') {
      recommendations.complexity += 5;
      recommendations.maintainability -= 5;
    }

    // Ensure values are within valid ranges
    for (const [metric, value] of Object.entries(recommendations)) {
      if (!this.validateThreshold(metric, value)) {
        recommendations[metric] = this.defaultThresholds[metric];
      }
    }

    return recommendations;
  }

  /**
   * Compare current thresholds with recommendations
   * @param {Object} context - Project context
   * @returns {Object} Comparison result
   */
  compareWithRecommendations(context) {
    const recommendations = this.getRecommendedThresholds(context);
    const comparison = {
      matches: [],
      differences: [],
      suggestions: []
    };

    for (const [metric, recommended] of Object.entries(recommendations)) {
      const current = this.thresholds[metric];

      if (current === recommended) {
        comparison.matches.push({ metric, value: current });
      } else {
        const difference = recommended - current;
        comparison.differences.push({
          metric,
          current,
          recommended,
          difference
        });

        if (Math.abs(difference) > 5) {
          comparison.suggestions.push({
            metric,
            action: difference > 0 ? 'increase' : 'decrease',
            current,
            recommended,
            reason: this.getAdjustmentReason(metric, difference)
          });
        }
      }
    }

    return comparison;
  }

  /**
   * Get adjustment reason for threshold change
   * @param {string} metric - Metric name
   * @param {number} difference - Difference from recommendation
   * @returns {string} Reason for adjustment
   */
  getAdjustmentReason(metric, difference) {
    const reasons = {
      complexity: difference > 0 ?
        'Consider increasing complexity threshold for more flexible code' :
        'Consider decreasing complexity threshold for better maintainability',
      maintainability: difference > 0 ?
        'Consider increasing maintainability threshold for better code quality' :
        'Consider decreasing maintainability threshold for faster development',
      security: difference > 0 ?
        'Consider increasing security threshold for better protection' :
        'Consider decreasing security threshold for development flexibility',
      performance: difference > 0 ?
        'Consider increasing performance threshold for better optimization' :
        'Consider decreasing performance threshold for development speed',
      readability: difference > 0 ?
        'Consider increasing readability threshold for better code clarity' :
        'Consider decreasing readability threshold for development speed',
      testability: difference > 0 ?
        'Consider increasing testability threshold for better testing' :
        'Consider decreasing testability threshold for development speed'
    };

    return reasons[metric] || 'Threshold adjustment recommended';
  }

  /**
   * Export thresholds configuration
   * @returns {Object} Exported configuration
   */
  exportConfiguration() {
    return {
      thresholds: { ...this.thresholds },
      defaultThresholds: { ...this.defaultThresholds },
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Import thresholds configuration
   * @param {Object} configuration - Configuration to import
   * @returns {Object} Import result
   */
  importConfiguration(configuration) {
    try {
      if (!configuration || !configuration.thresholds) {
        throw new Error('Invalid configuration format');
      }

      const result = this.updateThresholds(configuration.thresholds);

      return {
        success: true,
        ...result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
