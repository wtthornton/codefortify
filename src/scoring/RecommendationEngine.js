/**
 * RecommendationEngine - Generates improvement recommendations based on scoring results
 *
 * Analyzes scoring results and provides prioritized, actionable recommendations
 */

import { RecommendationHistory } from './RecommendationHistory.js';

export class RecommendationEngine {
  constructor(config = {}) {
    this.config = config;
    this.projectType = null;
    this.seenRecommendations = new Set();
    this.history = new RecommendationHistory(config);
  }

  async generateRecommendations(results) {
    const recommendations = [];
    const { categories } = results;

    // Detect project type for filtering
    this.projectType = this.detectProjectType(results);
    this.seenRecommendations.clear();

    // Generate recommendations for each category
    for (const [categoryKey, categoryResult] of Object.entries(categories)) {
      const categoryRecs = await this.getRecommendationsForCategory(categoryKey, categoryResult);
      recommendations.push(...categoryRecs);
    }

    // Add general recommendations based on overall score
    const generalRecs = this.getGeneralRecommendations(results);
    recommendations.push(...generalRecs);

    // Apply smart filtering and deduplication
    const filteredRecs = this.filterAndDeduplicateRecommendations(recommendations);

    // Sort by impact (highest first) and priority
    filteredRecs.sort((a, b) => {
      if (a.impact !== b.impact) {
        return b.impact - a.impact;
      }
      return this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority);
    });

    // Add progress tracking
    const recsWithProgress = await this.history.getRecommendationsWithProgress(filteredRecs);

    // Track these recommendations
    await this.history.trackRecommendations(recsWithProgress, results.overall?.score || 0);

    // Limit to most impactful recommendations
    return recsWithProgress.slice(0, 20);
  }

  async getRecommendationsForCategory(categoryKey, categoryResult) {
    const recommendations = [];
    const percentage = (categoryResult.score / categoryResult.maxScore) * 100;

    switch (categoryKey) {
    case 'structure':
      recommendations.push(...this.getStructureRecommendations(categoryResult, percentage));
      break;
    case 'quality':
      recommendations.push(...this.getQualityRecommendations(categoryResult, percentage));
      break;
    case 'performance':
      recommendations.push(...this.getPerformanceRecommendations(categoryResult, percentage));
      break;
    case 'testing':
      recommendations.push(...this.getTestingRecommendations(categoryResult, percentage));
      break;
    case 'security':
      recommendations.push(...this.getSecurityRecommendations(categoryResult, percentage));
      break;
    case 'developerExperience':
      recommendations.push(...this.getDeveloperExperienceRecommendations(categoryResult, percentage));
      break;
    case 'completeness':
      recommendations.push(...this.getCompletenessRecommendations(categoryResult, percentage));
      break;
    }

    return recommendations;
  }

  getStructureRecommendations(result, percentage) {
    const recs = [];

    if (percentage < 80) {
      recs.push({
        category: 'structure',
        impact: 3,
        priority: 'high',
        suggestion: 'Improve project organization and file structure',
        description: 'Create clear module boundaries, organize files by feature, and establish consistent naming conventions.',
        action: 'Reorganize files into logical directories (components, services, utils, etc.)'
      });
    }

    if (result.issues.some(issue => issue.includes('circular'))) {
      recs.push({
        category: 'structure',
        impact: 2,
        priority: 'high',
        suggestion: 'Resolve circular dependencies',
        description: 'Circular dependencies make code harder to test and understand.',
        action: 'Use dependency analysis tools to identify and break circular references'
      });
    }

    if (result.issues.some(issue => issue.includes('coupling'))) {
      recs.push({
        category: 'structure',
        impact: 2,
        priority: 'medium',
        suggestion: 'Reduce module coupling',
        description: 'High coupling makes the codebase harder to maintain and test.',
        action: 'Extract interfaces, use dependency injection, and apply SOLID principles'
      });
    }

    return recs;
  }

  getQualityRecommendations(result, percentage) {
    const recs = [];

    if (percentage < 75) {
      recs.push({
        category: 'quality',
        impact: 3,
        priority: 'high',
        suggestion: 'Configure ESLint and Prettier for code quality',
        description: 'Automated code formatting and linting prevents bugs and improves consistency.',
        action: 'Run: npm install --save-dev eslint prettier && npx eslint --init',
        executable: {
          commands: [
            'npm install --save-dev eslint prettier',
            'npx eslint --init'
          ],
          confirmationMessage: 'Install ESLint and Prettier development tools?',
          requiresInteraction: true
        }
      });
    }

    if (result.issues.some(issue => issue.includes('documentation'))) {
      recs.push({
        category: 'quality',
        impact: 2,
        priority: 'medium',
        suggestion: 'Improve code documentation',
        description: 'Well-documented code is easier for AI assistants and developers to understand.',
        action: 'Add JSDoc comments to functions and classes, create README sections'
      });
    }

    if (result.issues.some(issue => issue.includes('complexity'))) {
      recs.push({
        category: 'quality',
        impact: 2,
        priority: 'medium',
        suggestion: 'Reduce code complexity',
        description: 'Complex functions are harder to test and maintain.',
        action: 'Break down large functions, extract utilities, use early returns'
      });
    }

    return recs;
  }

  getPerformanceRecommendations(result, percentage) {
    const recs = [];

    if (percentage < 70) {
      recs.push({
        category: 'performance',
        impact: 2,
        priority: 'medium',
        suggestion: 'Add bundle analysis and optimization',
        description: 'Monitor bundle size and implement code splitting for better performance.',
        action: 'Install webpack-bundle-analyzer or similar tool for your build system'
      });
    }

    if (result.issues.some(issue => issue.includes('lazy loading'))) {
      recs.push({
        category: 'performance',
        impact: 2,
        priority: 'medium',
        suggestion: 'Implement lazy loading for routes and components',
        description: 'Lazy loading reduces initial bundle size and improves load times.',
        action: 'Use React.lazy(), Vue async components, or dynamic imports'
      });
    }

    if (result.issues.some(issue => issue.includes('dependencies'))) {
      recs.push({
        category: 'performance',
        impact: 1,
        priority: 'low',
        suggestion: 'Audit and optimize dependencies',
        description: 'Remove unused dependencies and consider lighter alternatives.',
        action: 'Run npm audit, use depcheck, consider bundle size impact'
      });
    }

    return recs;
  }

  getTestingRecommendations(result, percentage) {
    const recs = [];

    if (percentage < 70) {
      recs.push({
        category: 'testing',
        impact: 4,
        priority: 'high',
        suggestion: 'Increase test coverage to 80%+',
        description: 'Comprehensive testing prevents regressions and improves code quality.',
        action: 'Focus on unit tests for business logic and integration tests for user flows'
      });
    }

    if (result.issues.some(issue => issue.includes('unit tests'))) {
      recs.push({
        category: 'testing',
        impact: 3,
        priority: 'high',
        suggestion: 'Add unit tests for core functionality',
        description: 'Unit tests provide fast feedback and catch issues early.',
        action: 'Start with testing utility functions and business logic'
      });
    }

    if (result.issues.some(issue => issue.includes('integration'))) {
      recs.push({
        category: 'testing',
        impact: 2,
        priority: 'medium',
        suggestion: 'Add integration and E2E tests',
        description: 'Integration tests verify that components work together correctly.',
        action: 'Use tools like Cypress, Playwright, or React Testing Library'
      });
    }

    return recs;
  }

  getSecurityRecommendations(result, percentage) {
    const recs = [];

    if (result.issues.some(issue => issue.includes('vulnerabilities'))) {
      recs.push({
        category: 'security',
        impact: 4,
        priority: 'critical',
        suggestion: 'Fix security vulnerabilities in dependencies',
        description: 'Security vulnerabilities can expose your application to attacks.',
        action: 'Run npm audit --fix and update vulnerable packages',
        executable: {
          commands: ['npm audit --fix'],
          confirmationMessage: 'Automatically fix security vulnerabilities?',
          requiresInteraction: false
        }
      });
    }

    if (result.issues.some(issue => issue.includes('secrets'))) {
      recs.push({
        category: 'security',
        impact: 3,
        priority: 'high',
        suggestion: 'Remove hardcoded secrets and API keys',
        description: 'Hardcoded secrets in code can be exposed in version control.',
        action: 'Use environment variables and secrets management systems'
      });
    }

    if (percentage < 80) {
      recs.push({
        category: 'security',
        impact: 2,
        priority: 'medium',
        suggestion: 'Improve error handling patterns',
        description: 'Proper error handling prevents information leakage and crashes.',
        action: 'Add try-catch blocks, validate inputs, handle edge cases gracefully'
      });
    }

    return recs;
  }

  getDeveloperExperienceRecommendations(result, percentage) {
    const recs = [];

    if (percentage < 70) {
      recs.push({
        category: 'developerExperience',
        impact: 2,
        priority: 'medium',
        suggestion: 'Set up development tooling (ESLint, Prettier, pre-commit hooks)',
        description: 'Good tooling improves code quality and developer productivity.',
        action: 'Configure linting, formatting, and Git hooks for consistency'
      });
    }

    if (result.issues.some(issue => issue.includes('documentation'))) {
      recs.push({
        category: 'developerExperience',
        impact: 1,
        priority: 'medium',
        suggestion: 'Improve project documentation',
        description: 'Clear documentation helps team members and AI assistants.',
        action: 'Update README, add API documentation, create contribution guidelines'
      });
    }

    if (result.issues.some(issue => issue.includes('scripts'))) {
      recs.push({
        category: 'developerExperience',
        impact: 1,
        priority: 'low',
        suggestion: 'Add useful package.json scripts',
        description: 'Scripts automate common tasks and improve workflow.',
        action: 'Add scripts for testing, linting, building, and development'
      });
    }

    return recs;
  }

  getCompletenessRecommendations(result, percentage) {
    const recs = [];

    if (percentage < 80) {
      recs.push({
        category: 'completeness',
        impact: 1,
        priority: 'low',
        suggestion: 'Complete remaining TODOs and placeholder code',
        description: 'Unfinished code can cause issues in production.',
        action: 'Review and implement TODO comments, replace placeholder code'
      });
    }

    if (result.issues.some(issue => issue.includes('production'))) {
      recs.push({
        category: 'completeness',
        impact: 2,
        priority: 'medium',
        suggestion: 'Add production deployment configuration',
        description: 'Production readiness includes proper configuration and monitoring.',
        action: 'Add CI/CD pipeline, environment configuration, monitoring'
      });
    }

    return recs;
  }

  getGeneralRecommendations(results) {
    const recs = [];
    const { overall, categories } = results;

    // Overall score-based recommendations
    if (overall.score < 60) {
      recs.push({
        category: 'general',
        impact: 5,
        priority: 'critical',
        suggestion: 'Focus on fundamental quality improvements',
        description: 'Your project needs attention in multiple areas. Start with the highest impact items.',
        action: 'Address critical issues first: testing, security, and code quality'
      });
    } else if (overall.score < 80) {
      recs.push({
        category: 'general',
        impact: 3,
        priority: 'high',
        suggestion: 'Work on remaining quality gaps',
        description: 'You\'re on the right track! Focus on the areas with the lowest scores.',
        action: 'Prioritize categories scoring below 70%'
      });
    } else if (overall.score < 90) {
      recs.push({
        category: 'general',
        impact: 2,
        priority: 'medium',
        suggestion: 'Polish remaining details for excellence',
        description: 'Your project is in good shape. Focus on the finishing touches.',
        action: 'Add comprehensive documentation, increase test coverage, optimize performance'
      });
    }

    // Context7 specific recommendations
    if (!categories.quality || categories.quality.score < 15) {
      recs.push({
        category: 'context7',
        impact: 3,
        priority: 'high',
        suggestion: 'Implement Context7 standards for AI integration',
        description: 'Context7 patterns help AI assistants understand and work with your code better.',
        action: 'Run: context7 init to set up Context7 integration'
      });
    }

    return recs;
  }

  getPriorityWeight(priority) {
    switch (priority) {
    case 'critical': return 1;
    case 'high': return 2;
    case 'medium': return 3;
    case 'low': return 4;
    default: return 5;
    }
  }

  detectProjectType(results) {
    // Simple project type detection based on patterns and files
    const patterns = results.detectedPatterns || [];
    const files = results.files || [];

    if (patterns.some(p => p.includes('React')) || files.some(f => f.includes('jsx'))) {
      return 'react';
    }
    if (patterns.some(p => p.includes('Vue')) || files.some(f => f.includes('.vue'))) {
      return 'vue';
    }
    if (patterns.some(p => p.includes('Express')) || files.some(f => f.includes('server'))) {
      return 'node-api';
    }
    if (files.some(f => f.includes('bin/') || f.includes('cli'))) {
      return 'cli';
    }
    return 'javascript';
  }

  filterAndDeduplicateRecommendations(recommendations) {
    const filtered = [];
    const categoryConflicts = new Map();

    for (const rec of recommendations) {
      // Generate a key for similarity detection
      const similarityKey = this.generateSimilarityKey(rec);

      // Skip if we've seen this recommendation before
      if (this.seenRecommendations.has(similarityKey)) {
        continue;
      }

      // Filter by project type relevance
      if (!this.isRelevantForProjectType(rec)) {
        continue;
      }

      // Handle category conflicts (choose highest impact)
      const conflictKey = `${rec.category}-${rec.suggestion.substring(0, 20)}`;
      const existing = categoryConflicts.get(conflictKey);

      if (existing && existing.impact >= rec.impact) {
        continue;
      }

      if (existing) {
        // Replace lower impact recommendation
        const index = filtered.indexOf(existing);
        filtered.splice(index, 1);
        this.seenRecommendations.delete(this.generateSimilarityKey(existing));
      }

      categoryConflicts.set(conflictKey, rec);
      this.seenRecommendations.add(similarityKey);
      filtered.push(rec);
    }

    return filtered;
  }

  generateSimilarityKey(recommendation) {
    // Create a key based on the core action/suggestion
    const key = `${recommendation.category}-${recommendation.action}`.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    return key;
  }

  isRelevantForProjectType(recommendation) {
    if (!this.projectType) {return true;}

    const action = recommendation.action.toLowerCase();
    const suggestion = recommendation.suggestion.toLowerCase();

    // Filter out irrelevant recommendations based on project type
    switch (this.projectType) {
    case 'react':
      if (action.includes('vue') && !action.includes('react')) {return false;}
      if (suggestion.includes('express routes') && !suggestion.includes('api')) {return false;}
      break;
    case 'vue':
      if (action.includes('react') && !action.includes('vue')) {return false;}
      if (action.includes('jsx') && !action.includes('vue')) {return false;}
      break;
    case 'node-api':
      if (action.includes('react.lazy') || action.includes('vue async')) {return false;}
      if (suggestion.includes('component') && !suggestion.includes('api')) {return false;}
      break;
    case 'cli':
      if (action.includes('webpack-bundle-analyzer')) {return false;}
      if (suggestion.includes('lazy loading') && suggestion.includes('routes')) {return false;}
      break;
    }

    return true;
  }

  // Generate specific action plans
  generateActionPlan(recommendations) {
    const phases = {
      immediate: recommendations.filter(r => r.priority === 'critical'),
      shortTerm: recommendations.filter(r => r.priority === 'high'),
      mediumTerm: recommendations.filter(r => r.priority === 'medium'),
      longTerm: recommendations.filter(r => r.priority === 'low')
    };

    return {
      phases,
      estimatedImpact: recommendations.reduce((sum, rec) => sum + rec.impact, 0),
      timeline: {
        immediate: '0-1 days',
        shortTerm: '1-7 days',
        mediumTerm: '1-4 weeks',
        longTerm: '1-3 months'
      }
    };
  }

  // Execute a specific recommendation
  async executeRecommendation(recommendation, options = {}) {
    if (!recommendation.executable) {
      throw new Error('This recommendation is not executable');
    }

    const { commands, requiresInteraction } = recommendation.executable;
    const results = [];

    for (const command of commands) {
      try {
        const result = await this.executeCommand(command, {
          interactive: requiresInteraction,
          ...options
        });
        results.push({ command, success: true, output: result });
      } catch (error) {
        results.push({ command, success: false, error: error.message });
        if (options.stopOnError !== false) {
          break;
        }
      }
    }

    const success = results.every(r => r.success);

    // Track completion in history
    await this.history.markRecommendationCompleted(recommendation, success);

    return {
      recommendation: recommendation.suggestion,
      results,
      success
    };
  }

  async executeCommand(command, options = {}) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    return new Promise((resolve, reject) => {
      const childProcess = exec(command, {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 30000,
        maxBuffer: options.maxBuffer || 1024 * 1024
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        stdout += data;
        if (options.onOutput) {options.onOutput(data.toString());}
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data;
        if (options.onError) {options.onError(data.toString());}
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code });
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  // Get all executable recommendations
  getExecutableRecommendations(recommendations) {
    return recommendations.filter(rec => rec.executable);
  }

  // Batch execute multiple recommendations
  async executeBatch(recommendations, options = {}) {
    const executableRecs = this.getExecutableRecommendations(recommendations);
    const results = [];

    for (const rec of executableRecs) {
      try {
        const result = await this.executeRecommendation(rec, options);
        results.push(result);
      } catch (error) {
        results.push({
          recommendation: rec.suggestion,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Progress tracking helpers
  async getRecommendationHistory() {
    return await this.history.getStats();
  }

  async clearRecommendationHistory() {
    return await this.history.clearHistory();
  }

  async exportRecommendationHistory() {
    return await this.history.exportHistory();
  }

  async markManualCompletion(recommendation) {
    await this.history.markRecommendationCompleted(recommendation, true);
  }
}