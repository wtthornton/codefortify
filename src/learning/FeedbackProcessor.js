/**
 * Feedback Processor for Context7
 * Processes user feedback and updates pattern effectiveness
 *
 * Features:
 * - User feedback processing
 * - Pattern effectiveness updates
 * - Feedback analytics
 * - Learning from modifications
 */

export class FeedbackProcessor {
  constructor(config = {}) {
    this.config = {
      feedbackWeight: config.feedbackWeight || 0.3,
      modificationWeight: config.modificationWeight || 0.2,
      acceptanceThreshold: config.acceptanceThreshold || 0.7,
      ...config
    };

    this.feedbackHistory = new Map();
    this.patternDatabase = null; // Will be injected
  }

  /**
   * Set pattern database reference
   * @param {PatternDatabase} database - Pattern database instance
   */
  setPatternDatabase(database) {
    this.patternDatabase = database;
  }

  /**
   * Process user feedback for a pattern
   * @param {string} patternId - Pattern ID
   * @param {Object} feedback - User feedback
   * @returns {Promise<Object>} Processing result
   */
  async processFeedback(patternId, feedback) {
    try {
      console.log(`📝 Processing feedback for pattern: ${patternId}`);

      // Validate feedback
      if (!this.validateFeedback(feedback)) {
        throw new Error('Invalid feedback data');
      }

      // Get pattern from database
      const pattern = await this.patternDatabase.get(patternId);
      if (!pattern) {
        throw new Error(`Pattern ${patternId} not found`);
      }

      // Process feedback based on action
      let result;
      switch (feedback.action) {
      case 'accepted':
        result = await this.processAcceptance(pattern, feedback);
        break;
      case 'rejected':
        result = await this.processRejection(pattern, feedback);
        break;
      case 'modified':
        result = await this.processModification(pattern, feedback);
        break;
      case 'rated':
        result = await this.processRating(pattern, feedback);
        break;
      default:
        throw new Error(`Unknown feedback action: ${feedback.action}`);
      }

      // Store feedback history
      this.storeFeedbackHistory(patternId, feedback, result);

      console.log(`✅ Feedback processed successfully for pattern: ${patternId}`);
      return {
        success: true,
        patternId,
        action: feedback.action,
        result
      };

    } catch (error) {
      console.error(`❌ Error processing feedback: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process pattern acceptance
   * @param {Object} pattern - Pattern object
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Processing result
   */
  async processAcceptance(pattern, feedback) {
    try {
      // Increase effectiveness
      const effectivenessIncrease = this.config.feedbackWeight * 0.1;
      pattern.effectiveness = Math.min(1.0, pattern.effectiveness + effectivenessIncrease);

      // Update success rate
      pattern.usageCount = (pattern.usageCount || 0) + 1;
      pattern.successRate = ((pattern.successRate || 0) * (pattern.usageCount - 1) + 1) / pattern.usageCount;

      // Update last used timestamp
      pattern.lastUsed = new Date();
      pattern.updatedAt = new Date();

      // Save updated pattern
      await this.patternDatabase.update(pattern.id, pattern);

      return {
        action: 'accepted',
        effectivenessIncrease,
        newEffectiveness: pattern.effectiveness,
        newSuccessRate: pattern.successRate
      };

    } catch (error) {
      console.error(`❌ Error processing acceptance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process pattern rejection
   * @param {Object} pattern - Pattern object
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Processing result
   */
  async processRejection(pattern, feedback) {
    try {
      // Decrease effectiveness
      const effectivenessDecrease = this.config.feedbackWeight * 0.1;
      pattern.effectiveness = Math.max(0.0, pattern.effectiveness - effectivenessDecrease);

      // Update success rate
      pattern.usageCount = (pattern.usageCount || 0) + 1;
      pattern.successRate = ((pattern.successRate || 0) * (pattern.usageCount - 1) + 0) / pattern.usageCount;

      // Update last used timestamp
      pattern.lastUsed = new Date();
      pattern.updatedAt = new Date();

      // Save updated pattern
      await this.patternDatabase.update(pattern.id, pattern);

      return {
        action: 'rejected',
        effectivenessDecrease,
        newEffectiveness: pattern.effectiveness,
        newSuccessRate: pattern.successRate
      };

    } catch (error) {
      console.error(`❌ Error processing rejection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process pattern modification
   * @param {Object} pattern - Pattern object
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Processing result
   */
  async processModification(pattern, feedback) {
    try {
      // Create new pattern from modification
      const newPattern = {
        id: this.generatePatternId(),
        type: pattern.type,
        category: pattern.category,
        context: pattern.context,
        effectiveness: pattern.effectiveness + this.config.modificationWeight * 0.05,
        usageCount: 1,
        lastUsed: new Date(),
        successRate: 1.0,
        codeExample: {
          before: pattern.codeExample.before,
          after: feedback.modification.result
        },
        metadata: {
          ...pattern.metadata,
          parentId: pattern.id,
          modificationReason: feedback.modification.reason
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store new pattern
      await this.patternDatabase.store(newPattern);

      // Update original pattern
      pattern.usageCount = (pattern.usageCount || 0) + 1;
      pattern.successRate = ((pattern.successRate || 0) * (pattern.usageCount - 1) + 0.5) / pattern.usageCount;
      pattern.lastUsed = new Date();
      pattern.updatedAt = new Date();

      await this.patternDatabase.update(pattern.id, pattern);

      return {
        action: 'modified',
        newPatternId: newPattern.id,
        originalPatternUpdated: true
      };

    } catch (error) {
      console.error(`❌ Error processing modification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process pattern rating
   * @param {Object} pattern - Pattern object
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Processing result
   */
  async processRating(pattern, feedback) {
    try {
      const rating = feedback.rating;

      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Convert rating to effectiveness (1-5 scale to 0-1 scale)
      const ratingEffectiveness = (rating - 1) / 4;

      // Update effectiveness with weighted average
      const weight = this.config.feedbackWeight;
      pattern.effectiveness = (1 - weight) * pattern.effectiveness + weight * ratingEffectiveness;

      // Update success rate based on rating
      pattern.usageCount = (pattern.usageCount || 0) + 1;
      const ratingSuccess = rating >= 3 ? 1 : 0;
      pattern.successRate = ((pattern.successRate || 0) * (pattern.usageCount - 1) + ratingSuccess) / pattern.usageCount;

      // Update last used timestamp
      pattern.lastUsed = new Date();
      pattern.updatedAt = new Date();

      // Save updated pattern
      await this.patternDatabase.update(pattern.id, pattern);

      return {
        action: 'rated',
        rating,
        ratingEffectiveness,
        newEffectiveness: pattern.effectiveness,
        newSuccessRate: pattern.successRate
      };

    } catch (error) {
      console.error(`❌ Error processing rating: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   * @returns {Promise<Object>} Feedback statistics
   */
  async getFeedbackStats() {
    try {
      const stats = {
        totalFeedback: 0,
        byAction: {
          accepted: 0,
          rejected: 0,
          modified: 0,
          rated: 0
        },
        averageRating: 0,
        feedbackTrend: 'stable'
      };

      let totalRating = 0;
      let ratingCount = 0;

      for (const [patternId, history] of this.feedbackHistory) {
        stats.totalFeedback += history.length;

        for (const feedback of history) {
          stats.byAction[feedback.action] = (stats.byAction[feedback.action] || 0) + 1;

          if (feedback.action === 'rated' && feedback.rating) {
            totalRating += feedback.rating;
            ratingCount++;
          }
        }
      }

      stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      // Analyze feedback trend
      stats.feedbackTrend = this.analyzeFeedbackTrend();

      return stats;

    } catch (error) {
      console.error(`❌ Error getting feedback stats: ${error.message}`);
      return {
        error: error.message
      };
    }
  }

  /**
   * Get feedback history for a pattern
   * @param {string} patternId - Pattern ID
   * @returns {Promise<Array>} Feedback history
   */
  async getFeedbackHistory(patternId) {
    try {
      return this.feedbackHistory.get(patternId) || [];
    } catch (error) {
      console.error(`❌ Error getting feedback history: ${error.message}`);
      return [];
    }
  }

  /**
   * Clean up old feedback
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldFeedback(maxAge = 30 * 24 * 60 * 60 * 1000) {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      let cleaned = 0;

      for (const [patternId, history] of this.feedbackHistory) {
        const filteredHistory = history.filter(feedback =>
          new Date(feedback.timestamp) > cutoffDate
        );

        if (filteredHistory.length !== history.length) {
          this.feedbackHistory.set(patternId, filteredHistory);
          cleaned += history.length - filteredHistory.length;
        }
      }

      return {
        success: true,
        cleanedEntries: cleaned
      };

    } catch (error) {
      console.error(`❌ Error cleaning up old feedback: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private methods

  validateFeedback(feedback) {
    if (!feedback || typeof feedback !== 'object') {
      return false;
    }

    if (!feedback.action || typeof feedback.action !== 'string') {
      return false;
    }

    const validActions = ['accepted', 'rejected', 'modified', 'rated'];
    if (!validActions.includes(feedback.action)) {
      return false;
    }

    // Validate rating if provided
    if (feedback.action === 'rated') {
      if (typeof feedback.rating !== 'number' || feedback.rating < 1 || feedback.rating > 5) {
        return false;
      }
    }

    // Validate modification if provided
    if (feedback.action === 'modified') {
      if (!feedback.modification || !feedback.modification.result) {
        return false;
      }
    }

    return true;
  }

  storeFeedbackHistory(patternId, feedback, result) {
    if (!this.feedbackHistory.has(patternId)) {
      this.feedbackHistory.set(patternId, []);
    }

    const history = this.feedbackHistory.get(patternId);
    history.push({
      ...feedback,
      result,
      timestamp: new Date()
    });

    // Keep only recent history to prevent memory issues
    const maxHistorySize = 100;
    if (history.length > maxHistorySize) {
      history.splice(0, history.length - maxHistorySize);
    }
  }

  analyzeFeedbackTrend() {
    // Simple trend analysis based on recent feedback
    const recentFeedback = [];
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const [patternId, history] of this.feedbackHistory) {
      const recent = history.filter(feedback =>
        new Date(feedback.timestamp) > oneWeekAgo
      );
      recentFeedback.push(...recent);
    }

    if (recentFeedback.length < 5) {
      return 'insufficient_data';
    }

    // Count positive vs negative feedback
    const positive = recentFeedback.filter(f =>
      f.action === 'accepted' || (f.action === 'rated' && f.rating >= 3)
    ).length;

    const negative = recentFeedback.filter(f =>
      f.action === 'rejected' || (f.action === 'rated' && f.rating < 3)
    ).length;

    const ratio = positive / (positive + negative);

    if (ratio > 0.6) {
      return 'positive';
    } else if (ratio < 0.4) {
      return 'negative';
    } else {
      return 'stable';
    }
  }

  generatePatternId() {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
