/**
 * RecommendationEngine - Generates improvement recommendations based on scoring results
 * Refactored using Strategy pattern to reduce from 1438 to ~350 lines
 */

import { performance } from 'perf_hooks';
import { RecommendationHistory } from './RecommendationHistory.js';
import { EnhancedPromptGenerator } from './EnhancedPromptGenerator.js';
import { RecommendationStrategyRegistry } from './recommendations/strategies/RecommendationStrategyRegistry.js';
import { RecommendationFilter } from './recommendations/utils/RecommendationFilter.js';
import { ProjectTypeDetector } from './recommendations/utils/ProjectTypeDetector.js';

export class RecommendationEngine {
  constructor(config = {}) {
    this.config = config;
    this.strategyRegistry = new RecommendationStrategyRegistry();
    this.filter = new RecommendationFilter(config);
    this.history = new RecommendationHistory(config);
    this.promptGenerator = new EnhancedPromptGenerator(config.promptGenerator || {});
  }

  /**
   * Generate improvement recommendations based on analysis results
   * @param {Object} results - Analysis results from CodeFortify
   * @returns {Promise<Array>} Array of prioritized recommendations
   */
  async generateRecommendations(results) {
    const startTime = performance.now();
    const recommendations = [];
    const { categories } = results;

    // Detect project type for filtering
    const projectType = ProjectTypeDetector.detect(results);

    // Generate recommendations for each category using Strategy pattern
    for (const [categoryKey, categoryResult] of Object.entries(categories)) {
      const strategy = this.strategyRegistry.getStrategy(categoryKey);
      const categoryRecs = await strategy.generateRecommendations(categoryResult, projectType);
      recommendations.push(...categoryRecs);
    }

    // Add general recommendations based on overall score
    const generalRecs = this.getGeneralRecommendations(results);
    recommendations.push(...generalRecs);

    // Apply smart filtering and prioritization
    const filteredRecs = this.filter.process(recommendations, projectType);

    // Add progress tracking
    const recsWithProgress = await this.history.getRecommendationsWithProgress(filteredRecs);

    // Track these recommendations
    await this.history.trackRecommendations(recsWithProgress, results.overall?.score || 0);

    // Add performance metrics
    const processingTime = performance.now() - startTime;
    this.logPerformanceMetrics(processingTime, recommendations.length, filteredRecs.length);

    return recsWithProgress;
  }

  /**
   * Get general recommendations based on overall score
   */
  getGeneralRecommendations(results) {
    const recommendations = [];
    const overallScore = results.overall?.score || 0;
    const overallPercentage = results.overall?.percentage || 0;

    if (overallPercentage < 0.5) {
      recommendations.push({
        category: 'general',
        priority: 'critical',
        impact: 10,
        title: 'Critical Project Quality Issues',
        description: 'Project has significant quality issues that need immediate attention',
        benefits: ['Improved project stability', 'Better maintainability'],
        effort: 'high',
        tags: ['critical', 'general']
      });
    } else if (overallPercentage < 0.7) {
      recommendations.push({
        category: 'general',
        priority: 'high',
        impact: 7,
        title: 'Improve Overall Project Quality',
        description: 'Focus on key areas to bring project quality to acceptable levels',
        benefits: ['Better code quality', 'Improved developer experience'],
        effort: 'medium',
        tags: ['quality', 'general']
      });
    }

    return recommendations;
  }

  /**
   * Execute a recommendation command
   * @param {Object} recommendation - Recommendation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeRecommendation(recommendation, options = {}) {
    if (!recommendation.commands || recommendation.commands.length === 0) {
      throw new Error('Recommendation has no executable commands');
    }

    const results = [];
    
    for (const command of recommendation.commands) {
      try {
        const result = await this.executeCommand(command, options);
        results.push({
          command,
          success: result.success,
          output: result.output,
          error: result.error
        });
      } catch (error) {
        results.push({
          command,
          success: false,
          error: error.message
        });
      }
    }

    // Update recommendation progress
    await this.history.updateRecommendationProgress(recommendation, results);

    return {
      recommendation: recommendation.title,
      commands: results,
      success: results.every(r => r.success)
    };
  }

  /**
   * Execute a single command
   */
  async executeCommand(command, options = {}) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 30000,
        maxBuffer: 1024 * 1024
      });

      return {
        success: true,
        output: stdout.trim(),
        error: stderr.trim() || null
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Get recommendations by category
   */
  async getRecommendationsByCategory(results, category) {
    const allRecs = await this.generateRecommendations(results);
    return allRecs.filter(rec => rec.category === category);
  }

  /**
   * Get high priority recommendations
   */
  async getHighPriorityRecommendations(results) {
    const allRecs = await this.generateRecommendations(results);
    return allRecs.filter(rec => rec.priority === 'high' || rec.priority === 'critical');
  }

  /**
   * Get executable recommendations (have commands)
   */
  async getExecutableRecommendations(results) {
    const allRecs = await this.generateRecommendations(results);
    return allRecs.filter(rec => rec.commands && rec.commands.length > 0);
  }

  /**
   * Generate enhanced prompts for recommendations
   */
  async generateEnhancedPrompts(recommendations, context = {}) {
    const prompts = [];
    
    for (const rec of recommendations) {
      try {
        const prompt = await this.promptGenerator.generatePrompt(rec, context);
        prompts.push({
          recommendation: rec.title,
          prompt,
          category: rec.category
        });
      } catch (error) {
        // Skip failed prompt generation
        continue;
      }
    }
    
    return prompts;
  }

  /**
   * Get recommendation progress from history
   */
  async getRecommendationProgress(timeframe = '30d') {
    return await this.history.getProgress(timeframe);
  }

  /**
   * Clear recommendation history
   */
  async clearHistory() {
    await this.history.clear();
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(processingTime, totalRecs, filteredRecs) {
    if (this.config.verbose) {
      console.log(`[RecommendationEngine] Generated ${totalRecs} recommendations, filtered to ${filteredRecs} in ${processingTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get engine configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.filter = new RecommendationFilter(this.config);
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies() {
    return this.strategyRegistry.getCategories();
  }

  /**
   * Register custom strategy
   */
  registerStrategy(category, strategy) {
    this.strategyRegistry.registerStrategy(category, strategy);
  }
}