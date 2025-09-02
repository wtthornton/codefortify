/**
 * Recommendation Strategy Registry
 * Manages and provides access to category-specific recommendation strategies
 */

import { QualityStrategy } from './QualityStrategy.js';
import { PerformanceStrategy } from './PerformanceStrategy.js';
import { TestingStrategy } from './TestingStrategy.js';
import { RecommendationStrategy } from './RecommendationStrategy.js';

// Fallback strategy for unknown categories
class DefaultStrategy extends RecommendationStrategy {
  async generateRecommendations(result, projectType) {
    const recommendations = [];
    const percentage = this.calculatePercentage(result);

    if (percentage < 0.7) {
      recommendations.push(this.createRecommendation({
        category: result.category || 'general',
        priority: 'medium',
        impact: 4,
        title: 'General Improvement Needed',
        description: 'This category needs attention to improve overall project quality',
        benefits: ['Better project quality'],
        effort: 'medium',
        tags: ['general']
      }));
    }

    return recommendations;
  }
}

export class RecommendationStrategyRegistry {
  constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  initializeStrategies() {
    // Register built-in strategies
    this.strategies.set('quality', new QualityStrategy());
    this.strategies.set('performance', new PerformanceStrategy());
    this.strategies.set('testing', new TestingStrategy());
    this.strategies.set('structure', new DefaultStrategy());
    this.strategies.set('security', new DefaultStrategy());
    this.strategies.set('developerExperience', new DefaultStrategy());
    this.strategies.set('completeness', new DefaultStrategy());
    
    // Fallback strategy
    this.defaultStrategy = new DefaultStrategy();
  }

  /**
   * Get strategy for a specific category
   * @param {string} category - Category name
   * @returns {RecommendationStrategy} Strategy instance
   */
  getStrategy(category) {
    return this.strategies.get(category) || this.defaultStrategy;
  }

  /**
   * Register a custom strategy
   * @param {string} category - Category name
   * @param {RecommendationStrategy} strategy - Strategy instance
   */
  registerStrategy(category, strategy) {
    if (!(strategy instanceof RecommendationStrategy)) {
      throw new Error('Strategy must extend RecommendationStrategy');
    }
    this.strategies.set(category, strategy);
  }

  /**
   * Get all registered categories
   * @returns {Array<string>} Category names
   */
  getCategories() {
    return Array.from(this.strategies.keys());
  }
}