/**
 * Quality Recommendation Strategy
 * Generates code quality improvement recommendations
 */

import { RecommendationStrategy } from './RecommendationStrategy.js';

export class QualityStrategy extends RecommendationStrategy {
  async generateRecommendations(result, projectType) {
    const recommendations = [];
    const percentage = this.calculatePercentage(result);

    if (percentage < 0.7) {
      // ESLint recommendations
      recommendations.push(...this.getESLintRecommendations(result));

      // Code complexity recommendations
      recommendations.push(...this.getComplexityRecommendations(result));

      // JSDoc recommendations
      recommendations.push(...this.getJSDocRecommendations(result));
    }

    return this.filterByProjectType(recommendations, projectType);
  }

  getESLintRecommendations(result) {
    const recommendations = [];
    const eslintIssues = result.issues?.filter(issue =>
      issue.includes('ESLint') || issue.includes('lint')
    ) || [];

    if (eslintIssues.length > 0) {
      recommendations.push(this.createRecommendation({
        category: 'quality',
        priority: 'high',
        impact: 8,
        title: 'Fix ESLint Errors and Warnings',
        description: `Resolve ${eslintIssues.length} ESLint issues to improve code quality`,
        commands: ['npm run lint -- --fix'],
        benefits: ['Consistent code style', 'Fewer bugs', 'Better maintainability'],
        effort: 'medium',
        tags: ['eslint', 'code-style']
      }));
    }

    return recommendations;
  }

  getComplexityRecommendations(result) {
    const recommendations = [];
    const complexityIssues = result.issues?.filter(issue =>
      issue.includes('complex') || issue.includes('cyclomatic')
    ) || [];

    if (complexityIssues.length > 0) {
      recommendations.push(this.createRecommendation({
        category: 'quality',
        priority: 'medium',
        impact: 6,
        title: 'Reduce Code Complexity',
        description: 'Break down complex functions into smaller, more manageable pieces',
        benefits: ['Better readability', 'Easier testing', 'Reduced bugs'],
        effort: 'high',
        tags: ['complexity', 'refactoring']
      }));
    }

    return recommendations;
  }

  getJSDocRecommendations(result) {
    const recommendations = [];
    const jsdocIssues = result.issues?.filter(issue =>
      issue.includes('JSDoc') || issue.includes('documentation')
    ) || [];

    if (jsdocIssues.length > 0) {
      recommendations.push(this.createRecommendation({
        category: 'quality',
        priority: 'medium',
        impact: 4,
        title: 'Improve Code Documentation',
        description: 'Add JSDoc comments to functions and classes',
        benefits: ['Better code understanding', 'API documentation', 'IDE support'],
        effort: 'medium',
        tags: ['jsdoc', 'documentation']
      }));
    }

    return recommendations;
  }
}