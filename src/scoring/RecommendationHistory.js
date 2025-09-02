/**
 * RecommendationHistory - Tracks recommendation progress across runs
 *
 * Maintains history of recommendations and their completion status
 */

import { promises as fs } from 'fs';
import path from 'path';

/**


 * RecommendationHistory class implementation


 *


 * Provides functionality for recommendationhistory operations


 */


/**


 * RecommendationHistory class implementation


 *


 * Provides functionality for recommendationhistory operations


 */


export class RecommendationHistory {
  constructor(config = {}) {
    this.config = config;
    this.historyDir = config.historyDir || '.context7';
    this.historyFile = path.join(this.historyDir, 'recommendations.json');
    this.history = null;
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async ensureHistoryDir() {
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }  /**
   * Loads data from source
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Loads data from source
   * @returns {Promise} Promise that resolves with the result
   */


  async loadHistory() {  /**
   * Performs the specified operation
   * @param {boolean} this.history
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.history
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.history) {return this.history;}

    try {
      const historyData = await fs.readFile(this.historyFile, 'utf-8');
      this.history = JSON.parse(historyData);
    } catch (error) {
      // No history file exists yet
      this.history = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        recommendations: {},
        completedActions: new Set(),
        stats: {
          totalRecommendations: 0,
          completedRecommendations: 0,
          executedActions: 0,
          lastScoreImprovement: 0
        }
      };
    }

    // Convert completedActions back to Set
    if (Array.isArray(this.history.completedActions)) {
      this.history.completedActions = new Set(this.history.completedActions);
    } else {
      this.history.completedActions = new Set();
    }

    return this.history;
  }  /**
   * Saves data to storage
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Saves data to storage
   * @returns {Promise} Promise that resolves with the result
   */


  async saveHistory() {
    await this.ensureHistoryDir();

    // Convert Set to Array for JSON serialization
    const historyToSave = {
      ...this.history,
      completedActions: Array.from(this.history.completedActions),
      lastUpdated: new Date().toISOString()
    };

    await fs.writeFile(this.historyFile, JSON.stringify(historyToSave, null, 2));
  }  /**
   * Performs the specified operation
   * @param {any} recommendations
   * @param {any} currentScore - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} recommendations
   * @param {any} currentScore - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async trackRecommendations(recommendations, currentScore = 0) {
    await this.loadHistory();

    const timestamp = new Date().toISOString();
    const runId = this.generateRunId();

    // Track this run
    this.history.recommendations[runId] = {
      timestamp,
      score: currentScore,
      recommendations: recommendations.map(rec => ({
        id: this.generateRecommendationId(rec),
        category: rec.category,
        priority: rec.priority,
        impact: rec.impact,
        suggestion: rec.suggestion,
        action: rec.action,
        executable: !!rec.executable,
        status: this.getRecommendationStatus(rec)
      }))
    };

    // Update stats
    this.history.stats.totalRecommendations = recommendations.length;
    this.history.stats.lastScoreImprovement = this.calculateScoreImprovement(currentScore);

    await this.saveHistory();
    return runId;
  }  /**
   * Runs the specified task
   * @returns {any} The created resource
   */
  /**
   * Runs the specified task
   * @returns {any} The created resource
   */


  generateRunId() {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }  /**
   * Generates new data
   * @param {any} recommendation
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @param {any} recommendation
   * @returns {any} The created resource
   */


  generateRecommendationId(recommendation) {
    // Create a stable ID based on the recommendation content
    const content = `${recommendation.category}-${recommendation.suggestion}-${recommendation.action}`;
    return content.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substr(0, 50);
  }  /**
   * Retrieves data
   * @param {any} recommendation
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} recommendation
   * @returns {string} The retrieved data
   */


  getRecommendationStatus(recommendation) {
    const id = this.generateRecommendationId(recommendation);

    if (this.history.completedActions.has(id)) {
      return 'completed';
    }

    if (this.history.completedActions.has(`${id}_attempted`)) {
      return 'attempted';
    }

    return 'pending';
  }  /**
   * Performs the specified operation
   * @param {any} recommendation
   * @param {any} success - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} recommendation
   * @param {any} success - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async markRecommendationCompleted(recommendation, success = true) {
    await this.loadHistory();

    const id = this.generateRecommendationId(recommendation);    /**
   * Performs the specified operation
   * @param {any} success
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} success
   * @returns {any} The operation result
   */


    if (success) {
      this.history.completedActions.add(id);
      this.history.stats.completedRecommendations++;
    } else {
      this.history.completedActions.add(`${id}_attempted`);
    }

    this.history.stats.executedActions++;
    await this.saveHistory();
  }  /**
   * Performs the specified operation
   * @param {number} actionId
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {number} actionId
   * @returns {Promise} Promise that resolves with the result
   */


  async markActionCompleted(actionId) {
    await this.loadHistory();
    this.history.completedActions.add(actionId);
    await this.saveHistory();
  }  /**
   * Retrieves data
   * @param {any} recommendations
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {any} recommendations
   * @returns {Promise} Promise that resolves with the result
   */


  async getRecommendationsWithProgress(recommendations) {
    await this.loadHistory();

    return recommendations.map(rec => ({
      ...rec,
      progress: {
        status: this.getRecommendationStatus(rec),
        id: this.generateRecommendationId(rec),
        lastSeen: this.getLastSeenDate(rec),
        timesRecommended: this.getTimesRecommended(rec)
      }
    }));
  }  /**
   * Retrieves data
   * @param {any} recommendation
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} recommendation
   * @returns {string} The retrieved data
   */


  getLastSeenDate(recommendation) {
    const id = this.generateRecommendationId(recommendation);

    for (const [runId, run] of Object.entries(this.history.recommendations)) {
      const found = run.recommendations.find(r => r.id === id);      /**
   * Performs the specified operation
   * @param {any} found
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} found
   * @returns {any} The operation result
   */

      if (found) {
        return run.timestamp;
      }
    }

    return null;
  }  /**
   * Retrieves data
   * @param {any} recommendation
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} recommendation
   * @returns {string} The retrieved data
   */


  getTimesRecommended(recommendation) {
    const id = this.generateRecommendationId(recommendation);
    let count = 0;

    for (const run of Object.values(this.history.recommendations)) {
      if (run.recommendations.some(r => r.id === id)) {
        count++;
      }
    }

    return count;
  }  /**
   * Calculates the result
   * @param {any} currentScore
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} currentScore
   * @returns {number} The calculated result
   */


  calculateScoreImprovement(currentScore) {
    const runs = Object.values(this.history.recommendations)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));    /**
   * Performs the specified operation
   * @param {any} runs.length < 2
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} runs.length < 2
   * @returns {any} The operation result
   */


    if (runs.length < 2) {return 0;}

    const previousScore = runs[runs.length - 2]?.score || 0;
    return currentScore - previousScore;
  }  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */


  async getStats() {
    await this.loadHistory();

    const recentRuns = Object.values(this.history.recommendations)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    return {
      ...this.history.stats,
      recentScores: recentRuns.map(run => ({
        score: run.score,
        timestamp: run.timestamp,
        recommendationCount: run.recommendations.length
      })),
      completionRate: this.history.stats.totalRecommendations > 0
        ? (this.history.stats.completedRecommendations / this.history.stats.totalRecommendations) * 100
        : 0
    };
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async clearHistory() {
    this.history = null;
    try {
      await fs.unlink(this.historyFile);
    } catch (error) {
      // File might not exist
    }
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async exportHistory() {
    await this.loadHistory();
    return {
      ...this.history,
      completedActions: Array.from(this.history.completedActions)
    };
  }
}