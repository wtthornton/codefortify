/**
 * Testing Recommendation Strategy
 */

import { RecommendationStrategy } from './RecommendationStrategy.js';

export class TestingStrategy extends RecommendationStrategy {
  async generateRecommendations(result, projectType) {
    const recommendations = [];
    const percentage = this.calculatePercentage(result);

    if (percentage < 0.8) {
      recommendations.push(...this.getCoverageRecommendations(result));
      recommendations.push(...this.getTestQualityRecommendations(result));
    }

    return this.filterByProjectType(recommendations, projectType);
  }

  getCoverageRecommendations(result) {
    const recommendations = [];
    const coverage = result.details?.coverage;

    if (!coverage || coverage < 80) {
      recommendations.push(this.createRecommendation({
        category: 'testing',
        priority: 'high',
        impact: 8,
        title: 'Increase Test Coverage',
        description: `Test coverage is ${coverage || 0}%. Target 80%+ for better quality`,
        commands: ['npm run test:coverage', 'npm test -- --coverage'],
        benefits: ['Catch bugs early', 'Better refactoring confidence', 'Quality assurance'],
        effort: 'high',
        tags: ['coverage', 'testing']
      }));
    }

    return recommendations;
  }

  getTestQualityRecommendations(result) {
    const recommendations = [];
    const testIssues = result.issues?.filter(issue => 
      issue.includes('test') || issue.includes('spec')
    ) || [];

    if (testIssues.length > 0) {
      recommendations.push(this.createRecommendation({
        category: 'testing',
        priority: 'medium',
        impact: 6,
        title: 'Improve Test Quality',
        description: 'Add missing tests and improve existing test assertions',
        benefits: ['Better test reliability', 'More comprehensive testing'],
        effort: 'medium',
        tags: ['test-quality', 'testing']
      }));
    }

    return recommendations;
  }
}