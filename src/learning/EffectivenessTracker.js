/**
 * Effectiveness Tracker for Context7
 * Tracks and analyzes pattern effectiveness over time
 *
 * Features:
 * - Pattern effectiveness tracking
 * - Usage analytics
 * - Performance metrics
 * - Trend analysis
 */

export class EffectivenessTracker {
  constructor(config = {}) {
    this.config = {
      trackingWindow: config.trackingWindow || 7 * 24 * 60 * 60 * 1000, // 7 days
      minUsageForReliability: config.minUsageForReliability || 5,
      decayFactor: config.decayFactor || 0.95,
      ...config
    };

    this.metrics = new Map();
    this.usageHistory = new Map();
    this.effectivenessHistory = new Map();
  }

  /**
   * Update pattern effectiveness metrics
   * @param {Object} pattern - Pattern to update
   * @returns {Promise<void>}
   */
  async updatePattern(pattern) {
    try {
      const patternId = pattern.id;
      const now = new Date();

      // Initialize metrics if not exists
      if (!this.metrics.has(patternId)) {
        this.metrics.set(patternId, {
          totalUsage: 0,
          successfulUsage: 0,
          averageEffectiveness: 0,
          lastUpdated: now,
          reliability: 0
        });
      }

      const metrics = this.metrics.get(patternId);

      // Update usage statistics
      metrics.totalUsage++;
      if (pattern.effectiveness > 0.5) {
        metrics.successfulUsage++;
      }

      // Update average effectiveness with exponential moving average
      const alpha = 0.1; // Learning rate
      metrics.averageEffectiveness =
        (1 - alpha) * metrics.averageEffectiveness + alpha * pattern.effectiveness;

      // Update reliability based on usage count
      metrics.reliability = Math.min(1.0, metrics.totalUsage / this.config.minUsageForReliability);

      metrics.lastUpdated = now;

      // Store usage history
      this.recordUsage(patternId, pattern.effectiveness, now);

      // Store effectiveness history
      this.recordEffectiveness(patternId, pattern.effectiveness, now);

    } catch (error) {
      console.error(`❌ Error updating pattern metrics: ${error.message}`);
    }
  }

  /**
   * Get effectiveness statistics
   * @returns {Promise<Object>} Effectiveness statistics
   */
  async getStats() {
    try {
      const stats = {
        totalPatterns: this.metrics.size,
        averageEffectiveness: 0,
        highEffectivenessPatterns: 0,
        reliablePatterns: 0,
        trendingUp: 0,
        trendingDown: 0,
        byType: {},
        byTimeframe: {
          last24h: 0,
          last7d: 0,
          last30d: 0
        }
      };

      let totalEffectiveness = 0;
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (const [patternId, metrics] of this.metrics) {
        // Calculate average effectiveness
        totalEffectiveness += metrics.averageEffectiveness;

        // Count high effectiveness patterns
        if (metrics.averageEffectiveness > 0.8) {
          stats.highEffectivenessPatterns++;
        }

        // Count reliable patterns
        if (metrics.reliability > 0.8) {
          stats.reliablePatterns++;
        }

        // Analyze trends
        const trend = this.analyzeTrend(patternId);
        if (trend === 'up') {
          stats.trendingUp++;
        } else if (trend === 'down') {
          stats.trendingDown++;
        }

        // Count by timeframe
        if (metrics.lastUpdated > oneDayAgo) {
          stats.byTimeframe.last24h++;
        }
        if (metrics.lastUpdated > sevenDaysAgo) {
          stats.byTimeframe.last7d++;
        }
        if (metrics.lastUpdated > thirtyDaysAgo) {
          stats.byTimeframe.last30d++;
        }
      }

      stats.averageEffectiveness = this.metrics.size > 0 ?
        totalEffectiveness / this.metrics.size : 0;

      return stats;

    } catch (error) {
      console.error(`❌ Error getting effectiveness stats: ${error.message}`);
      return {
        error: error.message
      };
    }
  }

  /**
   * Get pattern effectiveness over time
   * @param {string} patternId - Pattern ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Array>} Effectiveness over time
   */
  async getEffectivenessOverTime(patternId, days = 30) {
    try {
      const history = this.effectivenessHistory.get(patternId) || [];
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      return history
        .filter(entry => entry.timestamp > cutoffDate)
        .sort((a, b) => a.timestamp - b.timestamp);

    } catch (error) {
      console.error(`❌ Error getting effectiveness over time: ${error.message}`);
      return [];
    }
  }

  /**
   * Get most effective patterns
   * @param {number} limit - Maximum number of patterns to return
   * @returns {Promise<Array>} Most effective patterns
   */
  async getMostEffectivePatterns(limit = 10) {
    try {
      const patterns = Array.from(this.metrics.entries())
        .map(([patternId, metrics]) => ({
          patternId,
          ...metrics
        }))
        .sort((a, b) => b.averageEffectiveness - a.averageEffectiveness)
        .slice(0, limit);

      return patterns;

    } catch (error) {
      console.error(`❌ Error getting most effective patterns: ${error.message}`);
      return [];
    }
  }

  /**
   * Get least effective patterns
   * @param {number} limit - Maximum number of patterns to return
   * @returns {Promise<Array>} Least effective patterns
   */
  async getLeastEffectivePatterns(limit = 10) {
    try {
      const patterns = Array.from(this.metrics.entries())
        .map(([patternId, metrics]) => ({
          patternId,
          ...metrics
        }))
        .sort((a, b) => a.averageEffectiveness - b.averageEffectiveness)
        .slice(0, limit);

      return patterns;

    } catch (error) {
      console.error(`❌ Error getting least effective patterns: ${error.message}`);
      return [];
    }
  }

  /**
   * Get usage statistics
   * @param {string} patternId - Pattern ID
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats(patternId) {
    try {
      const metrics = this.metrics.get(patternId);
      const history = this.usageHistory.get(patternId) || [];

      if (!metrics) {
        return {
          error: 'Pattern not found'
        };
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const usageByTimeframe = {
        last24h: history.filter(entry => entry.timestamp > oneDayAgo).length,
        last7d: history.filter(entry => entry.timestamp > sevenDaysAgo).length,
        last30d: history.filter(entry => entry.timestamp > thirtyDaysAgo).length
      };

      return {
        ...metrics,
        usageByTimeframe,
        totalHistoryEntries: history.length
      };

    } catch (error) {
      console.error(`❌ Error getting usage stats: ${error.message}`);
      return {
        error: error.message
      };
    }
  }

  /**
   * Clean up old metrics
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldMetrics(maxAge = 30 * 24 * 60 * 60 * 1000) {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      let cleaned = 0;

      // Clean up usage history
      for (const [patternId, history] of this.usageHistory) {
        const filteredHistory = history.filter(entry => entry.timestamp > cutoffDate);
        if (filteredHistory.length !== history.length) {
          this.usageHistory.set(patternId, filteredHistory);
          cleaned += history.length - filteredHistory.length;
        }
      }

      // Clean up effectiveness history
      for (const [patternId, history] of this.effectivenessHistory) {
        const filteredHistory = history.filter(entry => entry.timestamp > cutoffDate);
        if (filteredHistory.length !== history.length) {
          this.effectivenessHistory.set(patternId, filteredHistory);
          cleaned += history.length - filteredHistory.length;
        }
      }

      return {
        success: true,
        cleanedEntries: cleaned
      };

    } catch (error) {
      console.error(`❌ Error cleaning up old metrics: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private methods

  recordUsage(patternId, effectiveness, timestamp) {
    if (!this.usageHistory.has(patternId)) {
      this.usageHistory.set(patternId, []);
    }

    const history = this.usageHistory.get(patternId);
    history.push({
      effectiveness,
      timestamp
    });

    // Keep only recent history to prevent memory issues
    const maxHistorySize = 1000;
    if (history.length > maxHistorySize) {
      history.splice(0, history.length - maxHistorySize);
    }
  }

  recordEffectiveness(patternId, effectiveness, timestamp) {
    if (!this.effectivenessHistory.has(patternId)) {
      this.effectivenessHistory.set(patternId, []);
    }

    const history = this.effectivenessHistory.get(patternId);
    history.push({
      effectiveness,
      timestamp
    });

    // Keep only recent history to prevent memory issues
    const maxHistorySize = 1000;
    if (history.length > maxHistorySize) {
      history.splice(0, history.length - maxHistorySize);
    }
  }

  analyzeTrend(patternId) {
    const history = this.effectivenessHistory.get(patternId) || [];

    if (history.length < 5) {
      return 'insufficient_data';
    }

    // Get recent and older effectiveness values
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    if (older.length === 0) {
      return 'insufficient_data';
    }

    const recentAvg = recent.reduce((sum, entry) => sum + entry.effectiveness, 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry.effectiveness, 0) / older.length;

    const change = recentAvg - olderAvg;
    const threshold = 0.05; // 5% change threshold

    if (change > threshold) {
      return 'up';
    } else if (change < -threshold) {
      return 'down';
    } else {
      return 'stable';
    }
  }
}
