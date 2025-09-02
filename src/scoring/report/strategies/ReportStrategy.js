/**
 * Base Report Generation Strategy
 * Abstract base class for different report output formats
 */

export class ReportStrategy {
  constructor() {
    this.format = 'base';
  }

  /**
   * Generate report in specific format
   * @param {Object} results - Analysis results
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated report content
   */
  async generate(results, options = {}) {
    throw new Error('generate() method must be implemented by strategy subclasses');
  }

  /**
   * Get file extension for this format
   */
  getFileExtension() {
    throw new Error('getFileExtension() method must be implemented by strategy subclasses');
  }

  /**
   * Get MIME type for this format
   */
  getMimeType() {
    throw new Error('getMimeType() method must be implemented by strategy subclasses');
  }

  /**
   * Validate results structure
   */
  validateResults(results) {
    if (!results || typeof results !== 'object') {
      throw new Error('Results must be a valid object');
    }

    if (!results.categories || typeof results.categories !== 'object') {
      throw new Error('Results must contain categories object');
    }

    if (!results.overall) {
      throw new Error('Results must contain overall score information');
    }

    return true;
  }

  /**
   * Extract metadata from results
   */
  extractMetadata(results, options = {}) {
    return {
      projectName: options.projectName || results.projectName || 'Unknown Project',
      timestamp: options.timestamp || new Date().toISOString(),
      analysisTime: results.analysisTime || 0,
      version: options.version || '1.1.0'
    };
  }

  /**
   * Format categories for display
   */
  formatCategories(categories) {
    const formatted = {};

    for (const [key, category] of Object.entries(categories)) {
      formatted[key] = {
        name: category.categoryName || key,
        score: category.score || 0,
        maxScore: category.maxScore || 10,
        grade: category.grade || 'F',
        percentage: category.percentage || 0,
        issues: category.issues || [],
        suggestions: category.suggestions || []
      };
    }

    return formatted;
  }
}