/**
 * Context-Aware Recommendations Engine (Refactored)
 * Clean implementation using proper separation of concerns
 * Reduced from 1735 lines to ~200 lines using extracted classes
 */

import { EventEmitter } from 'events';
import path from 'path';
import { CodeContextAnalyzer } from './CodeContextAnalyzer.js';
import { RecommendationRanker } from './RecommendationRanker.js';
import { RecommendationEngineFactory } from './engines/RecommendationEngineFactory.js';

export class ContextAwareRecommendations extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      maxRecommendations: options.maxRecommendations || 10,
      minConfidence: options.minConfidence || 0.3,
      contextWindow: options.contextWindow || 50,
      learningEnabled: options.learningEnabled !== false,
      ...options
    };

    // Initialize components using dependency injection
    this.contextAnalyzer = new CodeContextAnalyzer();
    this.ranker = new RecommendationRanker();
    this.engineFactory = new RecommendationEngineFactory();

    // State
    this.isInitialized = false;
    this.projectContext = null;
    this.userPreferences = {};
    this.successfulRecommendations = [];
  }

  /**
   * Initialize the recommendation system
   * @param {string} projectRoot - Project root directory
   * @param {Object} projectContext - Project context information
   * @returns {Promise<void>}
   */
  async initialize(projectRoot, projectContext = {}) {
    try {
      this.projectRoot = projectRoot;
      this.projectContext = {
        projectType: 'javascript',
        framework: { name: 'generic' },
        ...projectContext
      };

      this.emit('initialized', { projectRoot, projectContext: this.projectContext });
      this.isInitialized = true;

    } catch (error) {
      this.emit('error', { phase: 'initialization', error });
      throw error;
    }
  }

  /**
   * Generate recommendations for a specific file
   * @param {string} filePath - Path to the file
   * @param {string} fileContent - Content of the file
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Generated recommendations
   */
  async generateRecommendations(filePath, fileContent, options = {}) {
    if (!this.isInitialized) {
      throw new Error('ContextAwareRecommendations must be initialized before use');
    }

    try {
      const startTime = Date.now();
      this.emit('generation_started', { filePath });

      // Step 1: Analyze code context
      const codeContext = await this.contextAnalyzer.analyze(filePath, fileContent, {
        framework: this.projectContext.framework,
        contextWindow: this.options.contextWindow,
        ...options
      });

      // Step 2: Generate recommendations from all relevant engines
      const allRecommendations = await this.generateFromEngines(codeContext, options);

      // Step 3: Rank and filter recommendations
      const rankedRecommendations = await this.ranker.rank(
        allRecommendations,
        codeContext,
        this.userPreferences,
        this.successfulRecommendations
      );

      // Step 4: Apply final filtering
      const finalRecommendations = this.ranker.filterRecommendations(
        rankedRecommendations,
        {
          maxCount: this.options.maxRecommendations,
          minConfidence: this.options.minConfidence,
          ...options.filters
        }
      );

      const duration = Date.now() - startTime;
      this.emit('generation_completed', {
        filePath,
        recommendationCount: finalRecommendations.length,
        duration
      });

      return finalRecommendations;

    } catch (error) {
      this.emit('error', { phase: 'generation', filePath, error });
      throw error;
    }
  }

  /**
   * Generate recommendations from all relevant engines
   * @param {Object} codeContext - Analyzed code context
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Combined recommendations
   */
  async generateFromEngines(codeContext, options) {
    // Get contextually relevant engines
    const engines = this.engineFactory.createContextualEngines(
      codeContext,
      options.engineTypes || []
    );

    // Generate recommendations from each engine
    const enginePromises = engines.map(async ({ type, engine }) => {
      try {
        const recommendations = await engine.generateRecommendations(codeContext);
        return recommendations.map(rec => ({ ...rec, engineType: type }));
      } catch (error) {
        this.emit('engine_error', { engineType: type, error });
        return [];
      }
    });

    // Combine all recommendations
    const engineResults = await Promise.all(enginePromises);
    return engineResults.flat();
  }

  /**
   * Record successful recommendation for learning
   * @param {Object} recommendation - Successfully applied recommendation
   * @param {Object} context - Context in which it was applied
   */
  recordSuccess(recommendation, context = {}) {
    if (!this.options.learningEnabled) return;

    this.successfulRecommendations.push({
      ...recommendation,
      appliedAt: new Date().toISOString(),
      context: {
        filePath: context.filePath,
        projectType: this.projectContext.projectType,
        framework: this.projectContext.framework?.name
      }
    });

    // Keep only recent successful recommendations (last 100)
    if (this.successfulRecommendations.length > 100) {
      this.successfulRecommendations = this.successfulRecommendations.slice(-100);
    }

    this.emit('success_recorded', { recommendation, context });
  }

  /**
   * Update user preferences
   * @param {Object} preferences - User preference updates
   */
  updateUserPreferences(preferences = {}) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    this.emit('preferences_updated', this.userPreferences);
  }

  /**
   * Get recommendation statistics
   * @returns {Object} Statistics about recommendations
   */
  getStatistics() {
    return {
      totalSuccessfulRecommendations: this.successfulRecommendations.length,
      uniqueEngineTypes: [...new Set(this.successfulRecommendations.map(r => r.engineType))],
      averageConfidence: this.calculateAverageConfidence(),
      topCategories: this.getTopCategories(),
      isLearningEnabled: this.options.learningEnabled,
      projectContext: this.projectContext
    };
  }

  /**
   * Calculate average confidence of successful recommendations
   * @returns {number} Average confidence score
   */
  calculateAverageConfidence() {
    if (this.successfulRecommendations.length === 0) return 0;

    const totalConfidence = this.successfulRecommendations.reduce(
      (sum, rec) => sum + (rec.confidence || 0.5),
      0
    );

    return totalConfidence / this.successfulRecommendations.length;
  }

  /**
   * Get top recommendation categories
   * @returns {Array} Top categories by frequency
   */
  getTopCategories() {
    const categoryCount = this.successfulRecommendations.reduce((acc, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  /**
   * Clear learning data
   */
  clearLearningData() {
    this.successfulRecommendations = [];
    this.userPreferences = {};
    this.emit('learning_data_cleared');
  }

  /**
   * Export configuration and learning data
   * @returns {Object} Exportable configuration
   */
  exportConfiguration() {
    return {
      options: this.options,
      userPreferences: this.userPreferences,
      successfulRecommendations: this.successfulRecommendations,
      projectContext: this.projectContext,
      statistics: this.getStatistics()
    };
  }

  /**
   * Import configuration and learning data
   * @param {Object} config - Configuration to import
   */
  importConfiguration(config) {
    if (config.userPreferences) {
      this.userPreferences = config.userPreferences;
    }
    if (config.successfulRecommendations) {
      this.successfulRecommendations = config.successfulRecommendations;
    }
    if (config.options) {
      this.options = { ...this.options, ...config.options };
    }

    this.emit('configuration_imported', config);
  }
}