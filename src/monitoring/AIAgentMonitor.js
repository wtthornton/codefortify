/**
 * AI Agent Monitor - Tracks and estimates AI coding agent effectiveness
 *
 * This module monitors how external AI agents (Claude, Copilot, etc.)
 * improve code quality without making autonomous changes.
 */

import { EventEmitter } from 'events';
import { ProjectScorer } from '../scoring/ProjectScorer.js';
import { CodeAnalysisEngine } from './CodeAnalysisEngine.js';
import { SuggestionGenerator } from './SuggestionGenerator.js';
import fs from 'fs-extra';
import path from 'path';

/**


 * AIAgentMonitor class implementation


 *


 * Provides functionality for aiagentmonitor operations


 */


/**


 * AIAgentMonitor class implementation


 *


 * Provides functionality for aiagentmonitor operations


 */


export class AIAgentMonitor extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      monitoringInterval: config.monitoringInterval || 5000, // 5 seconds
      enableRealtime: config.enableRealtime !== false,
      trackChanges: config.trackChanges !== false,
      ...config
    };

    // Initialize components
    this.scorer = new ProjectScorer(this.config);
    this.analysisEngine = new CodeAnalysisEngine(this.config);
    this.suggestionGenerator = new SuggestionGenerator(this.config);

    // Tracking state
    this.baselineScore = null;
    this.currentScore = null;
    this.sessionStartTime = null;
    this.changeHistory = [];
    this.aiAgentActivity = [];
    this.monitoringTimer = null;
    this.fileWatchers = new Map();
  }

  /**
   * Start monitoring AI agent effectiveness
   */
  async startMonitoring() {
    // LOG: 🔍 Starting AI Agent Monitoring (no autonomous changes)...
    // Establish baseline
    this.sessionStartTime = Date.now();
    this.baselineScore = await this.scorer.scoreProject();
    this.currentScore = this.baselineScore;

    this.emit('monitoring:started', {
      baseline: this.baselineScore,
      timestamp: this.sessionStartTime
    });

    // Start periodic monitoring
    this.monitoringTimer = setInterval(async () => {
      await this.checkForChanges();
    }, this.config.monitoringInterval);

    // Watch for file changes    /**
   * Performs the specified operation
   * @param {Object} this.config.trackChanges
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.trackChanges
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.trackChanges) {
      await this.setupFileWatchers();
    }

    return {
      status: 'monitoring',
      baseline: this.baselineScore,
      message: 'Monitoring AI agent code improvements (no autonomous changes)'
    };
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring() {  /**
   * Performs the specified operation
   * @param {boolean} this.monitoringTimer
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.monitoringTimer
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    // Clear file watchers
    this.fileWatchers.forEach(watcher => watcher.close());
    this.fileWatchers.clear();

    const sessionDuration = Date.now() - this.sessionStartTime;
    const finalScore = await this.scorer.scoreProject();

    const summary = {
      duration: sessionDuration,
      baseline: this.baselineScore,
      final: finalScore,
      improvement: finalScore.totalScore - this.baselineScore.totalScore,
      changeCount: this.changeHistory.length,
      aiAgentEvents: this.aiAgentActivity.length
    };

    this.emit('monitoring:stopped', summary);

    return summary;
  }

  /**
   * Check for code changes and analyze impact
   */
  async checkForChanges() {
    try {
      const newScore = await this.scorer.scoreProject();
      const scoreDelta = newScore.totalScore - this.currentScore.totalScore;

      if (Math.abs(scoreDelta) > 0.1) {
        // Significant change detected
        const changeEvent = {
          timestamp: Date.now(),
          previousScore: this.currentScore.totalScore,
          newScore: newScore.totalScore,
          delta: scoreDelta,
          categories: this.analyzeCategoryChanges(this.currentScore, newScore),
          source: 'external', // Assume external AI agent
          recommendations: await this.generateRecommendations(newScore)
        };

        this.changeHistory.push(changeEvent);
        this.currentScore = newScore;

        this.emit('score:changed', changeEvent);

        // Track as AI agent activity
        this.trackAIAgentActivity({
          type: 'code_improvement',
          impact: scoreDelta,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      // ERROR: Error checking for changes:, error
    }
  }

  /**
   * Analyze category-level changes
   */
  analyzeCategoryChanges(oldScore, newScore) {
    const changes = {};

    Object.keys(newScore.categoryScores).forEach(category => {
      const oldValue = oldScore.categoryScores[category] || 0;
      const newValue = newScore.categoryScores[category] || 0;
      const delta = newValue - oldValue;

      if (Math.abs(delta) > 0.1) {
        changes[category] = {
          old: oldValue,
          new: newValue,
          delta: delta,
          trend: delta > 0 ? 'improving' : 'declining'
        };
      }
    });

    return changes;
  }

  /**
   * Generate recommendations without executing them
   */
  async generateRecommendations(scoreData) {
    const suggestions = await this.suggestionGenerator.generateSuggestions(scoreData);

    // Transform suggestions to be informational only
    return suggestions.map(suggestion => ({
      ...suggestion,
      type: 'recommendation',
      autoExecute: false,
      estimatedImpact: this.estimateImpact(suggestion)
    }));
  }

  /**
   * Estimate the potential impact of a suggestion
   */
  estimateImpact(suggestion) {
    const impactMap = {
      'critical': 5,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return {
      scoreImprovement: impactMap[suggestion.priority] || 1,
      confidence: suggestion.confidence || 0.7,
      category: suggestion.category
    };
  }

  /**
   * Track AI agent activity
   */
  trackAIAgentActivity(event) {
    this.aiAgentActivity.push({
      ...event,
      sessionTime: Date.now() - this.sessionStartTime
    });

    this.emit('aiagent:activity', event);
  }

  /**
   * Setup file watchers for change detection
   */
  async setupFileWatchers() {
    const watchPaths = [
      path.join(this.config.projectRoot, 'src'),
      path.join(this.config.projectRoot, 'lib'),
      path.join(this.config.projectRoot, 'components')
    ];    /**
   * Performs the specified operation
   * @param {string} const watchPath of watchPaths
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} const watchPath of watchPaths
   * @returns {any} The operation result
   */


    for (const watchPath of watchPaths) {
      if (await fs.pathExists(watchPath)) {
        const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && !filename.includes('node_modules')) {
            this.emit('file:changed', { eventType, filename });
            // Trigger analysis on next interval
          }
        });

        this.fileWatchers.set(watchPath, watcher);
      }
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus() {  /**
   * Performs the specified operation
   * @param {boolean} !this.sessionStartTime
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.sessionStartTime
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.sessionStartTime) {
      return { status: 'idle' };
    }

    return {
      status: 'monitoring',
      sessionDuration: Date.now() - this.sessionStartTime,
      baseline: this.baselineScore,
      current: this.currentScore,
      improvement: this.currentScore ?
        this.currentScore.totalScore - this.baselineScore.totalScore : 0,
      changeCount: this.changeHistory.length,
      lastChange: this.changeHistory[this.changeHistory.length - 1] || null,
      aiAgentEvents: this.aiAgentActivity.length,
      recommendations: this.currentScore ?
        this.generateRecommendations(this.currentScore) : []
    };
  }

  /**
   * Get effectiveness report
   */
  getEffectivenessReport() {  /**
   * Performs the specified operation
   * @param {boolean} !this.sessionStartTime || this.changeHistory.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.sessionStartTime || this.changeHistory.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.sessionStartTime || this.changeHistory.length === 0) {
      return { message: 'No data available yet' };
    }

    const totalImprovement = this.currentScore.totalScore - this.baselineScore.totalScore;
    const timeElapsed = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
    const improvementRate = totalImprovement / timeElapsed;

    return {
      sessionDuration: timeElapsed,
      totalImprovement,
      improvementRate,
      changeCount: this.changeHistory.length,
      averageChangeImpact: totalImprovement / this.changeHistory.length,
      categoryImprovements: this.analyzeCategoryChanges(this.baselineScore, this.currentScore),
      aiAgentEffectiveness: this.calculateAIEffectiveness(),
      topRecommendations: this.getTopRecommendations()
    };
  }

  /**
   * Calculate AI agent effectiveness score
   */
  calculateAIEffectiveness() {  /**
   * Performs the specified operation
   * @param {boolean} this.aiAgentActivity.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.aiAgentActivity.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.aiAgentActivity.length === 0) {
      return { score: 0, rating: 'No activity' };
    }

    const positiveChanges = this.changeHistory.filter(c => c.delta > 0).length;
    const totalChanges = this.changeHistory.length;
    const successRate = totalChanges > 0 ? positiveChanges / totalChanges : 0;

    const totalImprovement = this.currentScore.totalScore - this.baselineScore.totalScore;

    let rating = 'Poor';    /**
   * Performs the specified operation
   * @param {any} successRate > 0.8 && totalImprovement > 10
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} successRate > 0.8 && totalImprovement > 10
   * @returns {any} The operation result
   */

    if (successRate > 0.8 && totalImprovement > 10) {rating = 'Excellent';}
    else if (successRate > 0.6 && totalImprovement > 5) {rating = 'Good';}
    else if (successRate > 0.4 && totalImprovement > 0) {rating = 'Fair';}

    return {
      score: Math.round(successRate * 100),
      rating,
      successRate,
      totalImprovement,
      improvementPerChange: totalChanges > 0 ? totalImprovement / totalChanges : 0
    };
  }

  /**
   * Get top recommendations
   */
  async getTopRecommendations() {  /**
   * Performs the specified operation
   * @param {boolean} !this.currentScore
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.currentScore
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.currentScore) {return [];}

    const recommendations = await this.generateRecommendations(this.currentScore);
    return recommendations
      .sort((a, b) => b.estimatedImpact.scoreImprovement - a.estimatedImpact.scoreImprovement)
      .slice(0, 5);
  }
}

export default AIAgentMonitor;