/**
 * Performance Recommendation Strategy
 */

import { RecommendationStrategy } from './RecommendationStrategy.js';

export class PerformanceStrategy extends RecommendationStrategy {
  async generateRecommendations(result, projectType) {
    const recommendations = [];
    const percentage = this.calculatePercentage(result);

    if (percentage < 0.8) {
      recommendations.push(...this.getBundleRecommendations(result));
      recommendations.push(...this.getOptimizationRecommendations(result));
    }

    return this.filterByProjectType(recommendations, projectType);
  }

  getBundleRecommendations(result) {
    const recommendations = [];
    const bundleIssues = result.issues?.filter(issue =>
      issue.includes('bundle') || issue.includes('size')
    ) || [];

    if (bundleIssues.length > 0) {
      recommendations.push(this.createRecommendation({
        category: 'performance',
        priority: 'high',
        impact: 7,
        title: 'Optimize Bundle Size',
        description: 'Reduce bundle size through code splitting and tree shaking',
        commands: ['npm run analyze', 'npm install webpack-bundle-analyzer'],
        benefits: ['Faster load times', 'Better user experience'],
        effort: 'medium',
        tags: ['bundle', 'optimization']
      }));
    }

    return recommendations;
  }

  getOptimizationRecommendations(result) {
    const recommendations = [];
    const perfIssues = result.issues?.filter(issue =>
      issue.includes('performance') || issue.includes('slow')
    ) || [];

    if (perfIssues.length > 0) {
      recommendations.push(this.createRecommendation({
        category: 'performance',
        priority: 'medium',
        impact: 6,
        title: 'Implement Performance Optimizations',
        description: 'Add memoization, lazy loading, and other performance improvements',
        benefits: ['Better runtime performance', 'Improved user experience'],
        effort: 'high',
        tags: ['performance', 'optimization']
      }));
    }

    return recommendations;
  }
}