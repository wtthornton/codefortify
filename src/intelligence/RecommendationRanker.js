/**
 * Recommendation Ranking System
 * Ranks and prioritizes recommendations based on context and user preferences
 */

export class RecommendationRanker {
  /**
   * Rank recommendations based on context and preferences
   * @param {Array} recommendations - Recommendations to rank
   * @param {Object} codeContext - Code context information
   * @param {Object} userPreferences - User preferences
   * @param {Array} successfulRecommendations - Previously successful recommendations
   * @returns {Promise<Array>} Ranked recommendations
   */
  async rank(recommendations, codeContext, userPreferences = {}, successfulRecommendations = []) {
    // Calculate scores for each recommendation
    const scoredRecommendations = recommendations.map(rec => {
      const score = this.calculateRecommendationScore(rec, codeContext, userPreferences, successfulRecommendations);
      return { ...rec, score };
    });

    // Sort by score (descending) and return
    return scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...rec }) => rec); // Remove score from final output
  }

  /**
   * Calculate score for a recommendation
   * @param {Object} recommendation - Recommendation to score
   * @param {Object} context - Code context
   * @param {Object} preferences - User preferences
   * @param {Array} successful - Successful recommendations
   * @returns {number} Recommendation score
   */
  calculateRecommendationScore(recommendation, context, preferences, successful) {
    let score = 0;

    // Base confidence score
    score += (recommendation.confidence || 0.5) * 40;

    // Context relevance
    score += this.calculateContextRelevance(recommendation, context) * 25;

    // User preference alignment
    score += this.calculatePreferenceAlignment(recommendation, preferences) * 20;

    // Historical success factor
    score += this.calculateHistoricalSuccess(recommendation, successful) * 15;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate context relevance score
   * @param {Object} recommendation - Recommendation
   * @param {Object} context - Code context
   * @returns {number} Relevance score (0-1)
   */
  calculateContextRelevance(recommendation, context) {
    let relevance = 0;

    // File type relevance
    if (recommendation.fileTypes && recommendation.fileTypes.includes(context.fileType)) {
      relevance += 0.3;
    }

    // Pattern relevance
    if (recommendation.patterns && context.detectedPatterns) {
      const commonPatterns = recommendation.patterns.filter(p => 
        context.detectedPatterns.includes(p)
      );
      relevance += (commonPatterns.length / recommendation.patterns.length) * 0.4;
    }

    // Complexity relevance
    if (recommendation.complexityRange) {
      const complexityScore = context.complexity?.score || 0;
      const [min, max] = recommendation.complexityRange;
      if (complexityScore >= min && complexityScore <= max) {
        relevance += 0.3;
      }
    }

    return Math.min(relevance, 1);
  }

  /**
   * Calculate user preference alignment
   * @param {Object} recommendation - Recommendation
   * @param {Object} preferences - User preferences
   * @returns {number} Alignment score (0-1)
   */
  calculatePreferenceAlignment(recommendation, preferences) {
    if (!preferences || Object.keys(preferences).length === 0) {
      return 0.5; // Neutral score when no preferences
    }

    let alignment = 0;
    let totalChecks = 0;

    // Check category preferences
    if (preferences.categories && recommendation.category) {
      const categoryPref = preferences.categories[recommendation.category];
      if (categoryPref !== undefined) {
        alignment += categoryPref ? 0.4 : 0;
        totalChecks += 0.4;
      }
    }

    // Check framework preferences
    if (preferences.frameworks && recommendation.framework) {
      const frameworkPref = preferences.frameworks[recommendation.framework];
      if (frameworkPref !== undefined) {
        alignment += frameworkPref ? 0.3 : 0;
        totalChecks += 0.3;
      }
    }

    // Check difficulty preferences
    if (preferences.difficulty && recommendation.difficulty) {
      const difficultyMatch = preferences.difficulty === recommendation.difficulty;
      alignment += difficultyMatch ? 0.3 : 0;
      totalChecks += 0.3;
    }

    return totalChecks > 0 ? alignment / totalChecks : 0.5;
  }

  /**
   * Calculate historical success factor
   * @param {Object} recommendation - Recommendation
   * @param {Array} successful - Previously successful recommendations
   * @returns {number} Success factor (0-1)
   */
  calculateHistoricalSuccess(recommendation, successful) {
    if (!successful || successful.length === 0) {
      return 0.5; // Neutral score when no history
    }

    // Look for similar recommendations in successful history
    const similarCount = successful.filter(succ => 
      this.areSimilarRecommendations(recommendation, succ)
    ).length;

    return Math.min(similarCount / Math.max(successful.length, 10), 1);
  }

  /**
   * Check if two recommendations are similar
   * @param {Object} rec1 - First recommendation
   * @param {Object} rec2 - Second recommendation
   * @returns {boolean} True if similar
   */
  areSimilarRecommendations(rec1, rec2) {
    // Check category similarity
    if (rec1.category === rec2.category) return true;

    // Check type similarity
    if (rec1.type === rec2.type) return true;

    // Check pattern similarity
    if (rec1.patterns && rec2.patterns) {
      const commonPatterns = rec1.patterns.filter(p => rec2.patterns.includes(p));
      return commonPatterns.length > 0;
    }

    return false;
  }

  /**
   * Filter recommendations based on constraints
   * @param {Array} recommendations - Recommendations to filter
   * @param {Object} constraints - Filtering constraints
   * @returns {Array} Filtered recommendations
   */
  filterRecommendations(recommendations, constraints = {}) {
    return recommendations.filter(rec => {
      // Minimum confidence filter
      if (constraints.minConfidence && rec.confidence < constraints.minConfidence) {
        return false;
      }

      // Maximum count filter
      if (constraints.maxCount && recommendations.indexOf(rec) >= constraints.maxCount) {
        return false;
      }

      // Category filter
      if (constraints.categories && !constraints.categories.includes(rec.category)) {
        return false;
      }

      // Framework filter
      if (constraints.frameworks && !constraints.frameworks.includes(rec.framework)) {
        return false;
      }

      return true;
    });
  }
}