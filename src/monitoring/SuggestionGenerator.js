/**
 * Suggestion Generator for Context7
 * Generates quality improvement suggestions
 *
 * Features:
 * - Context-aware suggestions
 * - Prioritized recommendations
 * - Actionable improvements
 * - Learning from feedback
 */

export class SuggestionGenerator {
  constructor(config = {}) {
    this.config = {
      maxSuggestions: config.maxSuggestions || 10,
      suggestionPriority: config.suggestionPriority || {
        security: 'high',
        performance: 'medium',
        maintainability: 'medium',
        readability: 'low',
        testability: 'medium',
        complexity: 'medium'
      },
      ...config
    };

    this.suggestionTemplates = this.initializeSuggestionTemplates();
    this.feedbackHistory = new Map();
  }

  /**
   * Generate suggestions based on issues and context
   * @param {Array} issues - Quality issues found
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Promise<Array>} Generated suggestions
   */
  async generateSuggestions(issues, code, context) {
    try {
      const suggestions = [];

      // Generate suggestions for each issue
      for (const issue of issues) {
        const issueSuggestions = await this.generateIssueSuggestions(issue, code, context);
        suggestions.push(...issueSuggestions);
      }

      // Generate general suggestions based on code analysis
      const generalSuggestions = await this.generateGeneralSuggestions(code, context);
      suggestions.push(...generalSuggestions);

      // Prioritize and rank suggestions
      const rankedSuggestions = this.rankSuggestions(suggestions, context);

      // Limit number of suggestions
      return rankedSuggestions.slice(0, this.config.maxSuggestions);

    } catch (error) {
      console.error(`❌ Error generating suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate suggestions for a specific issue
   * @param {Object} issue - Quality issue
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Promise<Array>} Issue-specific suggestions
   */
  async generateIssueSuggestions(issue, code, context) {
    const suggestions = [];

    switch (issue.type) {
    case 'complexity':
      suggestions.push(...this.generateComplexitySuggestions(issue, code, context));
      break;
    case 'maintainability':
      suggestions.push(...this.generateMaintainabilitySuggestions(issue, code, context));
      break;
    case 'security':
      suggestions.push(...this.generateSecuritySuggestions(issue, code, context));
      break;
    case 'performance':
      suggestions.push(...this.generatePerformanceSuggestions(issue, code, context));
      break;
    case 'readability':
      suggestions.push(...this.generateReadabilitySuggestions(issue, code, context));
      break;
    case 'testability':
      suggestions.push(...this.generateTestabilitySuggestions(issue, code, context));
      break;
    }

    return suggestions;
  }

  /**
   * Generate general suggestions based on code analysis
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Promise<Array>} General suggestions
   */
  async generateGeneralSuggestions(code, context) {
    const suggestions = [];

    // Check for common improvement opportunities
    if (code.includes('var ')) {
      suggestions.push({
        type: 'general',
        priority: 'medium',
        title: 'Use const/let instead of var',
        description: 'Consider using const or let instead of var for better block scoping',
        action: 'Replace var declarations with const or let',
        impact: 'Improved code safety and readability',
        effort: 'low'
      });
    }

    if (code.includes('function(') && !code.includes('=>')) {
      suggestions.push({
        type: 'general',
        priority: 'low',
        title: 'Consider arrow functions',
        description: 'Arrow functions can provide cleaner syntax in many cases',
        action: 'Convert function expressions to arrow functions where appropriate',
        impact: 'Improved code conciseness',
        effort: 'low'
      });
    }

    if (code.includes('==') && !code.includes('===')) {
      suggestions.push({
        type: 'general',
        priority: 'medium',
        title: 'Use strict equality',
        description: 'Use === instead of == for better type safety',
        action: 'Replace == with === for strict equality checks',
        impact: 'Improved type safety and bug prevention',
        effort: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Generate complexity reduction suggestions
   * @param {Object} issue - Complexity issue
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Array} Complexity suggestions
   */
  generateComplexitySuggestions(issue, code, context) {
    const suggestions = [];

    if (issue.value > 15) {
      suggestions.push({
        type: 'complexity',
        priority: 'high',
        title: 'Reduce function complexity',
        description: `Function complexity is ${issue.value}, consider breaking it down`,
        action: 'Split complex function into smaller, focused functions',
        impact: 'Improved maintainability and testability',
        effort: 'medium',
        examples: [
          'Extract helper functions',
          'Use early returns to reduce nesting',
          'Consider using strategy pattern for complex logic'
        ]
      });
    }

    if (code.includes('if (') && code.includes('else if')) {
      suggestions.push({
        type: 'complexity',
        priority: 'medium',
        title: 'Simplify conditional logic',
        description: 'Consider using switch statements or lookup tables for multiple conditions',
        action: 'Replace if-else chains with switch statements or object lookups',
        impact: 'Improved readability and maintainability',
        effort: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Generate maintainability suggestions
   * @param {Object} issue - Maintainability issue
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Array} Maintainability suggestions
   */
  generateMaintainabilitySuggestions(issue, code, context) {
    const suggestions = [];

    if (issue.value < 60) {
      suggestions.push({
        type: 'maintainability',
        priority: 'medium',
        title: 'Improve code maintainability',
        description: `Maintainability score is ${issue.value}%, consider improvements`,
        action: 'Add comments, improve naming, and reduce complexity',
        impact: 'Easier maintenance and debugging',
        effort: 'medium',
        examples: [
          'Add JSDoc comments to functions',
          'Use descriptive variable names',
          'Break down large functions'
        ]
      });
    }

    const longLines = code.split('\n').filter(line => line.length > 100);
    if (longLines.length > 0) {
      suggestions.push({
        type: 'maintainability',
        priority: 'low',
        title: 'Break long lines',
        description: `${longLines.length} lines exceed 100 characters`,
        action: 'Break long lines for better readability',
        impact: 'Improved code readability',
        effort: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Generate security suggestions
   * @param {Object} issue - Security issue
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Array} Security suggestions
   */
  generateSecuritySuggestions(issue, code, context) {
    const suggestions = [];

    if (code.includes('eval(')) {
      suggestions.push({
        type: 'security',
        priority: 'critical',
        title: 'Remove dangerous eval() usage',
        description: 'eval() can execute arbitrary code and is a security risk',
        action: 'Replace eval() with safer alternatives like JSON.parse() or Function constructor',
        impact: 'Eliminated code injection vulnerability',
        effort: 'medium',
        examples: [
          'Use JSON.parse() for JSON data',
          'Use Function constructor for dynamic code',
          'Use template literals for string interpolation'
        ]
      });
    }

    if (code.includes('innerHTML =')) {
      suggestions.push({
        type: 'security',
        priority: 'high',
        title: 'Avoid innerHTML for user content',
        description: 'innerHTML can lead to XSS attacks with user input',
        action: 'Use textContent or createElement for safe DOM manipulation',
        impact: 'Prevented XSS vulnerability',
        effort: 'low',
        examples: [
          'Use textContent for plain text',
          'Use createElement and appendChild for HTML',
          'Sanitize HTML content before using innerHTML'
        ]
      });
    }

    return suggestions;
  }

  /**
   * Generate performance suggestions
   * @param {Object} issue - Performance issue
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Array} Performance suggestions
   */
  generatePerformanceSuggestions(issue, code, context) {
    const suggestions = [];

    if (code.includes('for (let i = 0; i < array.length; i++)')) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        title: 'Use array methods instead of for loops',
        description: 'Array methods like forEach, map, filter are more performant and readable',
        action: 'Replace traditional for loops with array methods',
        impact: 'Improved performance and readability',
        effort: 'low',
        examples: [
          'Use forEach for iteration',
          'Use map for transformation',
          'Use filter for filtering'
        ]
      });
    }

    if (code.includes('import *')) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        title: 'Use specific imports',
        description: 'Import only what you need to reduce bundle size',
        action: 'Replace wildcard imports with specific imports',
        impact: 'Reduced bundle size and improved performance',
        effort: 'low',
        examples: [
          'import { specificFunction } from "library"',
          'import { Component1, Component2 } from "components"'
        ]
      });
    }

    return suggestions;
  }

  /**
   * Generate readability suggestions
   * @param {Object} issue - Readability issue
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Array} Readability suggestions
   */
  generateReadabilitySuggestions(issue, code, context) {
    const suggestions = [];

    if (issue.value < 70) {
      suggestions.push({
        type: 'readability',
        priority: 'low',
        title: 'Improve code readability',
        description: `Readability score is ${issue.value}%, consider improvements`,
        action: 'Add comments, improve naming, and format code consistently',
        impact: 'Easier code understanding',
        effort: 'low',
        examples: [
          'Add inline comments for complex logic',
          'Use descriptive variable and function names',
          'Ensure consistent indentation and formatting'
        ]
      });
    }

    const shortVars = (code.match(/\b[a-z]{1,2}\b/g) || []).length;
    if (shortVars > 5) {
      suggestions.push({
        type: 'readability',
        priority: 'low',
        title: 'Use descriptive variable names',
        description: `${shortVars} short variable names found`,
        action: 'Replace short variable names with descriptive ones',
        impact: 'Improved code self-documentation',
        effort: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Generate testability suggestions
   * @param {Object} issue - Testability issue
   * @param {string} code - Code being analyzed
   * @param {Object} context - Project context
   * @returns {Array} Testability suggestions
   */
  generateTestabilitySuggestions(issue, code, context) {
    const suggestions = [];

    if (issue.value < 60) {
      suggestions.push({
        type: 'testability',
        priority: 'medium',
        title: 'Improve code testability',
        description: `Testability score is ${issue.value}%, consider improvements`,
        action: 'Make code more testable by reducing dependencies and side effects',
        impact: 'Easier testing and debugging',
        effort: 'medium',
        examples: [
          'Extract pure functions',
          'Use dependency injection',
          'Avoid global state'
        ]
      });
    }

    if (code.includes('global.') || code.includes('window.')) {
      suggestions.push({
        type: 'testability',
        priority: 'medium',
        title: 'Avoid global variables',
        description: 'Global variables make testing difficult',
        action: 'Pass dependencies as parameters or use dependency injection',
        impact: 'Improved testability and modularity',
        effort: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Rank suggestions by priority and context
   * @param {Array} suggestions - Suggestions to rank
   * @param {Object} context - Project context
   * @returns {Array} Ranked suggestions
   */
  rankSuggestions(suggestions, context) {
    return suggestions.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // If same priority, consider effort (lower effort first)
      const effortOrder = { low: 1, medium: 2, high: 3 };
      return effortOrder[a.effort] - effortOrder[b.effort];
    });
  }

  /**
   * Initialize suggestion templates
   * @returns {Object} Suggestion templates
   */
  initializeSuggestionTemplates() {
    return {
      complexity: {
        high: {
          title: 'Reduce function complexity',
          description: 'Function complexity is too high, consider breaking it down',
          action: 'Split complex function into smaller, focused functions',
          impact: 'Improved maintainability and testability',
          effort: 'medium'
        }
      },
      security: {
        critical: {
          title: 'Fix security vulnerability',
          description: 'Critical security issue detected',
          action: 'Address security vulnerability immediately',
          impact: 'Eliminated security risk',
          effort: 'high'
        }
      },
      performance: {
        medium: {
          title: 'Optimize performance',
          description: 'Performance can be improved',
          action: 'Implement performance optimizations',
          impact: 'Better application performance',
          effort: 'medium'
        }
      }
    };
  }

  /**
   * Record feedback on suggestions
   * @param {string} suggestionId - Suggestion ID
   * @param {Object} feedback - User feedback
   */
  recordFeedback(suggestionId, feedback) {
    if (!this.feedbackHistory.has(suggestionId)) {
      this.feedbackHistory.set(suggestionId, []);
    }

    this.feedbackHistory.get(suggestionId).push({
      ...feedback,
      timestamp: new Date()
    });
  }

  /**
   * Get suggestion feedback statistics
   * @returns {Object} Feedback statistics
   */
  getFeedbackStats() {
    const stats = {
      totalSuggestions: 0,
      totalFeedback: 0,
      feedbackByType: {},
      averageRating: 0
    };

    let totalRating = 0;
    let ratingCount = 0;

    for (const [suggestionId, feedback] of this.feedbackHistory) {
      stats.totalSuggestions++;
      stats.totalFeedback += feedback.length;

      for (const fb of feedback) {
        if (fb.type) {
          stats.feedbackByType[fb.type] = (stats.feedbackByType[fb.type] || 0) + 1;
        }

        if (fb.rating) {
          totalRating += fb.rating;
          ratingCount++;
        }
      }
    }

    stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    return stats;
  }
}
