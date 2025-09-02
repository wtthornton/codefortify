/**
 * ScoreCalculator - Calculates final scores from analysis results
 */

export class ScoreCalculator {
  constructor(config) {
    this.config = config;

    // Category weights (total: 100 points)
    this.categoryWeights = {
      structure: 20,      // Code Structure & Architecture
      quality: 20,        // Code Quality & Maintainability
      performance: 15,    // Performance & Optimization
      testing: 15,        // Testing & Documentation
      security: 15,       // Error Handling & Security
      developerExperience: 10, // Developer Experience & Tooling
      completeness: 5     // Completeness & Production Readiness
    };
  }

  /**
   * Calculate final scores from analysis results
   * @param {Object} analysisResults - Results from analyzers
   * @returns {Object} Calculated scores and summary
   */
  calculate(analysisResults) {
    const scores = {};
    let totalScore = 0;
    let totalWeight = 0;

    // Calculate scores for each category
    for (const [category, weight] of Object.entries(this.categoryWeights)) {
      const result = analysisResults[category];      /**
   * Performs the specified operation
   * @param {any} result && !result.error
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} result && !result.error
   * @returns {any} The operation result
   */


      if (result && !result.error) {
        scores[category] = {
          score: result.score || 0,
          weight: weight,
          weightedScore: (result.score || 0) * (weight / 100),
          details: result.details || {},
          issues: result.issues || [],
          recommendations: result.recommendations || []
        };

        totalScore += scores[category].weightedScore;
        totalWeight += weight;
      } else {
        scores[category] = {
          score: 0,
          weight: weight,
          weightedScore: 0,
          details: {},
          issues: result?.error ? [result.error] : [],
          recommendations: []
        };
      }
    }

    // Calculate overall score
    const overallScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

    return {
      overall: {
        score: Math.round(overallScore * 100) / 100,
        grade: this.getGrade(overallScore),
        level: this.getPerformanceLevel(overallScore)
      },
      categories: scores,
      summary: this.generateSummary(scores, overallScore)
    };
  }

  /**
   * Get letter grade based on score
   * @param {number} score - Score (0-100)
   * @returns {string} Letter grade
   */
  getGrade(score) {  /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 90) {
      return 'A';
    }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 80) {
      return 'B';
    }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 70) {
      return 'C';
    }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 60) {
      return 'D';
    }
    return 'F';
  }

  /**
   * Get performance level based on score
   * @param {number} score - Score (0-100)
   * @returns {string} Performance level
   */
  getPerformanceLevel(score) {  /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 90) {
      return 'Excellent';
    }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 80) {
      return 'Good';
    }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 70) {
      return 'Fair';
    }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 60) {
      return 'Poor';
    }
    return 'Critical';
  }

  /**
   * Generate summary of scores
   * @param {Object} scores - Category scores
   * @param {number} overallScore - Overall score
   * @returns {Object} Summary information
   */
  generateSummary(scores, _overallScore) {
    const totalIssues = Object.values(scores).reduce((sum, category) => sum + category.issues.length, 0);
    const totalRecommendations = Object.values(scores).reduce((sum, category) => sum + category.recommendations.length, 0);

    const worstCategory = Object.entries(scores).reduce((worst, [name, data]) => {
      return data.score < worst.score ? { name, score: data.score } : worst;
    }, { name: 'none', score: 100 });

    const bestCategory = Object.entries(scores).reduce((best, [name, data]) => {
      return data.score > best.score ? { name, score: data.score } : best;
    }, { name: 'none', score: 0 });

    return {
      totalIssues,
      totalRecommendations,
      worstCategory: worstCategory.name,
      bestCategory: bestCategory.name,
      needsAttention: Object.entries(scores).filter(([_, data]) => data.score < 70).map(([name]) => name)
    };
  }
}
