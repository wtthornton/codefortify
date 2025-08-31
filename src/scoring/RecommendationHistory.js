/**
 * RecommendationHistory - Tracks recommendation progress across runs
 *
 * Maintains history of recommendations and their completion status
 */

import { promises as fs } from 'fs';
import path from 'path';

export class RecommendationHistory {
  constructor(config = {}) {
    this.config = config;
    this.historyDir = config.historyDir || '.context7';
    this.historyFile = path.join(this.historyDir, 'recommendations.json');
    this.history = null;
  }

  async ensureHistoryDir() {
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async loadHistory() {
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
  }

  async saveHistory() {
    await this.ensureHistoryDir();

    // Convert Set to Array for JSON serialization
    const historyToSave = {
      ...this.history,
      completedActions: Array.from(this.history.completedActions),
      lastUpdated: new Date().toISOString()
    };

    await fs.writeFile(this.historyFile, JSON.stringify(historyToSave, null, 2));
  }

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
  }

  generateRunId() {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRecommendationId(recommendation) {
    // Create a stable ID based on the recommendation content
    const content = `${recommendation.category}-${recommendation.suggestion}-${recommendation.action}`;
    return content.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substr(0, 50);
  }

  getRecommendationStatus(recommendation) {
    const id = this.generateRecommendationId(recommendation);

    if (this.history.completedActions.has(id)) {
      return 'completed';
    }

    if (this.history.completedActions.has(`${id}_attempted`)) {
      return 'attempted';
    }

    return 'pending';
  }

  async markRecommendationCompleted(recommendation, success = true) {
    await this.loadHistory();

    const id = this.generateRecommendationId(recommendation);

    if (success) {
      this.history.completedActions.add(id);
      this.history.stats.completedRecommendations++;
    } else {
      this.history.completedActions.add(`${id}_attempted`);
    }

    this.history.stats.executedActions++;
    await this.saveHistory();
  }

  async markActionCompleted(actionId) {
    await this.loadHistory();
    this.history.completedActions.add(actionId);
    await this.saveHistory();
  }

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
  }

  getLastSeenDate(recommendation) {
    const id = this.generateRecommendationId(recommendation);

    for (const [runId, run] of Object.entries(this.history.recommendations)) {
      const found = run.recommendations.find(r => r.id === id);
      if (found) {
        return run.timestamp;
      }
    }

    return null;
  }

  getTimesRecommended(recommendation) {
    const id = this.generateRecommendationId(recommendation);
    let count = 0;

    for (const run of Object.values(this.history.recommendations)) {
      if (run.recommendations.some(r => r.id === id)) {
        count++;
      }
    }

    return count;
  }

  calculateScoreImprovement(currentScore) {
    const runs = Object.values(this.history.recommendations)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (runs.length < 2) {return 0;}

    const previousScore = runs[runs.length - 2]?.score || 0;
    return currentScore - previousScore;
  }

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
  }

  async clearHistory() {
    this.history = null;
    try {
      await fs.unlink(this.historyFile);
    } catch (error) {
      // File might not exist
    }
  }

  async exportHistory() {
    await this.loadHistory();
    return {
      ...this.history,
      completedActions: Array.from(this.history.completedActions)
    };
  }
}