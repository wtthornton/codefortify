/**
 * Base Recommendation Strategy
 * Abstract base class for category-specific recommendation strategies
 */

export class RecommendationStrategy {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Generate recommendations for this category
   * @param {Object} result - Category analysis result
   * @param {string} projectType - Project type
   * @returns {Promise<Array>} Array of recommendations
   */
  async generateRecommendations(result, projectType) {
    throw new Error('generateRecommendations must be implemented by subclasses');
  }

  /**
   * Calculate category percentage
   */
  calculatePercentage(result) {
    if (!result || result.maxScore === 0) {return 0;}
    return result.score / result.maxScore;
  }

  /**
   * Create recommendation object with standard structure
   */
  createRecommendation({
    category,
    priority,
    impact,
    title,
    description,
    commands = [],
    benefits = [],
    effort = 'medium',
    tags = []
  }) {
    return {
      category,
      priority,
      impact,
      title,
      description,
      commands,
      benefits,
      effort,
      tags,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Filter recommendations by project type
   */
  filterByProjectType(recommendations, projectType) {
    if (!projectType) {return recommendations;}

    return recommendations.filter(rec =>
      !rec.excludeProjectTypes?.includes(projectType) &&
      (!rec.includeProjectTypes || rec.includeProjectTypes.includes(projectType))
    );
  }
}