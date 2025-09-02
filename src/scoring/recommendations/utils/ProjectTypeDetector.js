/**
 * Project Type Detector
 * Detects project type based on analysis results
 */

export class ProjectTypeDetector {
  /**
   * Detect project type from analysis results
   * @param {Object} results - Analysis results
   * @returns {string} Project type
   */
  static detect(results) {
    // Check if project type is already provided in config
    if (results.projectType) {
      return results.projectType;
    }

    // Analyze categories and details for project type clues
    const categories = results.categories || {};

    // Check for React indicators
    if (this.hasReactIndicators(categories)) {
      return 'react-webapp';
    }

    // Check for Vue indicators
    if (this.hasVueIndicators(categories)) {
      return 'vue-webapp';
    }

    // Check for Node.js API indicators
    if (this.hasNodeApiIndicators(categories)) {
      return 'node-api';
    }

    // Default to JavaScript
    return 'javascript';
  }

  /**
   * Check for React project indicators
   */
  static hasReactIndicators(categories) {
    const structure = categories.structure;
    if (!structure) {return false;}

    const details = structure.details || {};
    const issues = structure.issues || [];

    // Look for React-specific patterns
    return (
      details.hasReactComponents ||
      issues.some(issue => issue.includes('React') || issue.includes('JSX')) ||
      details.frameworks?.includes('react')
    );
  }

  /**
   * Check for Vue project indicators
   */
  static hasVueIndicators(categories) {
    const structure = categories.structure;
    if (!structure) {return false;}

    const details = structure.details || {};
    const issues = structure.issues || [];

    return (
      details.hasVueComponents ||
      issues.some(issue => issue.includes('Vue') || issue.includes('.vue')) ||
      details.frameworks?.includes('vue')
    );
  }

  /**
   * Check for Node.js API indicators
   */
  static hasNodeApiIndicators(categories) {
    const structure = categories.structure;
    if (!structure) {return false;}

    const details = structure.details || {};
    const issues = structure.issues || [];

    return (
      details.hasApiRoutes ||
      details.hasExpressServer ||
      issues.some(issue => issue.includes('Express') || issue.includes('API')) ||
      details.frameworks?.includes('express')
    );
  }
}