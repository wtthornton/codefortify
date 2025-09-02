import { performance } from 'perf_hooks';
/**
 * RecommendationEngine - Generates improvement recommendations based on scoring results
 *
 * Analyzes scoring results and provides prioritized, actionable recommendations
 *
 * @class RecommendationEngine
 * @author CodeFortify
 * @version 1.0.0
 * @example
 * const engine = new RecommendationEngine({ projectType: 'react' });
 * const recommendations = await engine.generateRecommendations(analysisResults);
 */

import { RecommendationHistory } from './RecommendationHistory.js';
import { EnhancedPromptGenerator } from './EnhancedPromptGenerator.js';

/**


 * RecommendationEngine class implementation


 *


 * Provides functionality for recommendationengine operations


 */


export class RecommendationEngine {
  /**
   * Create a new RecommendationEngine instance
   * @param {Object} config - Configuration options
   * @param {string} [config.projectType] - Type of project being analyzed
   * @param {Object} [config.promptGenerator] - Prompt generator configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.projectType = null;
    this.seenRecommendations = new Set();
    this.history = new RecommendationHistory(config);
    this.promptGenerator = new EnhancedPromptGenerator(config.promptGenerator || {});
  }

  /**
   * Generate improvement recommendations based on analysis results
   * @param {Object} results - Analysis results from CodeFortify
   * @param {Object} results.categories - Category analysis results
   * @param {Object} results.overall - Overall project score
   * @returns {Promise<Array>} Array of prioritized recommendations
   */
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
    filteredRecs.sort((a, b) => {      /**
   * Performs the specified operation
   * @param {any} a.impact ! - Optional parameter
   * @returns {any} The operation result
   */

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

  /**
   * Get recommendations for a specific category
   * @param {string} categoryKey - Category key (structure, quality, performance, etc.)
   * @param {Object} categoryResult - Category analysis result
   * @returns {Promise<Array>} Array of category-specific recommendations
   */
  async getRecommendationsForCategory(categoryKey, categoryResult) {
    const recommendations = [];
    const percentage = (categoryResult.score / categoryResult.maxScore) * 100;    /**
   * Performs the specified operation
   * @param {any} categoryKey
   * @returns {any} The operation result
   */


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

  /**
   * Get structure-related recommendations
   * @param {Object} result - Structure analysis result
   * @param {number} percentage - Structure score percentage
   * @returns {Array} Array of structure recommendations
   */
  getStructureRecommendations(result, percentage) {
    const recs = [];    /**
   * Performs the specified operation
   * @param {any} percentage < 80
   * @returns {any} The operation result
   */


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

  /**
   * Get quality-related recommendations
   * @param {Object} result - Quality analysis result
   * @param {number} percentage - Quality score percentage
   * @returns {Array} Array of quality recommendations
   */
  getQualityRecommendations(result, percentage) {
    const recs = [];

    // PHASE 1: Data-driven recommendations based on actual ESLint results
    const eslintData = result.details?.eslintAnalysis;    /**
   * Performs the specified operation
   * @param {any} eslintData
   * @returns {any} The operation result
   */

    if (eslintData) {
      const { errorCount, warningCount, topRuleViolations } = eslintData;      /**
   * Performs the specified operation
   * @param {number} errorCount > 0
   * @returns {any} The operation result
   */


      if (errorCount > 0) {
        const priority = errorCount > 10 ? 'critical' : 'high';
        recs.push({
          category: 'quality',
          impact: 4,
          priority,
          suggestion: `Fix ${errorCount} ESLint errors`,
          description: `You have ${errorCount} ESLint errors that need immediate attention.`,
          action: `Run: npx eslint --fix . (fixes ${Math.round(errorCount * 0.7)} automatically)`,
          executable: {
            commands: ['npx eslint --fix .'],
            confirmationMessage: `Auto-fix ${errorCount} ESLint errors?`,
            requiresInteraction: false
          },
          specificIssues: topRuleViolations.slice(0, 3).map(v => `${v.rule}: ${v.count} violations`)
        });
      }      /**
   * Performs the specified operation
   * @param {number} warningCount > 5
   * @returns {any} The operation result
   */


      if (warningCount > 5) {
        recs.push({
          category: 'quality',
          impact: 2,
          priority: 'medium',
          suggestion: `Address ${warningCount} ESLint warnings`,
          description: 'Warnings indicate code style issues that should be resolved.',
          action: 'Review and fix ESLint warnings for better code consistency',
          specificIssues: topRuleViolations.filter(v => v.count > 2).map(v => `${v.rule}: ${v.count} violations`)
        });
      }

      // Top rule violation specific recommendations      /**
   * Performs the specified operation
   * @param {any} topRuleViolations.length > 0
   * @returns {any} The operation result
   */

      if (topRuleViolations.length > 0) {
        const topRule = topRuleViolations[0];
        const ruleAdvice = this.getESLintRuleAdvice(topRule.rule);        /**
   * Performs the specified operation
   * @param {any} ruleAdvice
   * @returns {any} The operation result
   */

        if (ruleAdvice) {
          recs.push({
            category: 'quality',
            impact: 2,
            priority: 'medium',
            suggestion: `Fix '${topRule.rule}' violations (${topRule.count} instances)`,
            description: ruleAdvice.description,
            action: ruleAdvice.action
          });
        }
      }
    } else if (percentage < 75) {
      // Fallback for when ESLint data unavailable
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

    // PHASE 1: JSDoc quality recommendations based on actual analysis
    const jsdocData = result.details?.jsdocAnalysis;    /**
   * Performs the specified operation
   * @param {any} jsdocData && jsdocData.overallRatio < 0.6
   * @returns {any} The operation result
   */

    if (jsdocData && jsdocData.overallRatio < 0.6) {
      const { methodDocumentation, classDocumentation } = jsdocData;

      if (methodDocumentation.total > 0 && (methodDocumentation.found / methodDocumentation.total) < 0.5) {
        recs.push({
          category: 'quality',
          impact: 2,
          priority: 'medium',
          suggestion: `Document ${methodDocumentation.total - methodDocumentation.found} undocumented methods`,
          description: 'Method documentation helps AI assistants understand your code better.',
          action: 'Add @param, @returns, @throws to method JSDoc comments',
          specificIssues: [`${methodDocumentation.withParams} methods missing @param`, `${methodDocumentation.total - methodDocumentation.withReturns} methods missing @returns`]
        });
      }

      if (classDocumentation.total > 0 && (classDocumentation.found / classDocumentation.total) < 0.5) {
        recs.push({
          category: 'quality',
          impact: 2,
          priority: 'medium',
          suggestion: `Document ${classDocumentation.total - classDocumentation.found} undocumented classes`,
          description: 'Class documentation provides essential context for understanding code architecture.',
          action: 'Add @example, @author, @version tags to class JSDoc'
        });
      }
    } else if (result.issues.some(issue => issue.includes('documentation'))) {
      // Fallback documentation recommendation
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
  }  /**
   * Retrieves data
   * @param {any} result
   * @param {any} percentage
   * @returns {string} The retrieved data
   */


  getPerformanceRecommendations(result, percentage) {
    const recs = [];

    // PHASE 1: Data-driven bundle recommendations
    const bundleData = result.details?.bundleAnalysis;    /**
   * Performs the specified operation
   * @param {any} bundleData
   * @returns {any} The operation result
   */

    if (bundleData) {
      const { totalSize, heaviestDependencies, chunkCount, isEstimate } = bundleData;
      const sizeLabel = isEstimate ? ' (estimated)' : '';      /**
   * Performs the specified operation
   * @param {any} totalSize > 1000
   * @returns {any} The operation result
   */


      if (totalSize > 1000) {
        recs.push({
          category: 'performance',
          impact: 4,
          priority: 'high',
          suggestion: `Urgent: Reduce bundle size from ${totalSize}KB${sizeLabel}`,
          description: 'Bundle size over 1MB significantly impacts load times and user experience.',
          action: 'Implement code splitting, remove unused dependencies, use lighter alternatives',
          specificIssues: [
            `Total bundle: ${totalSize}KB`,
            `Chunks: ${chunkCount || 1}`,
            ...(heaviestDependencies.slice(0, 3).map(dep => `Heavy: ${dep.name} (~${dep.size}KB)`))
          ]
        });

        // Specific dependency recommendations        /**
   * Performs the specified operation
   * @param {any} heaviestDependencies.length > 0
   * @returns {any} The operation result
   */

        if (heaviestDependencies.length > 0) {
          const heaviest = heaviestDependencies[0];
          const alternatives = this.getBundleAlternatives(heaviest.name);          /**
   * Performs the specified operation
   * @param {any} alternatives
   * @returns {any} The operation result
   */

          if (alternatives) {
            recs.push({
              category: 'performance',
              impact: 3,
              priority: 'medium',
              suggestion: `Replace ${heaviest.name} (${heaviest.size}KB) with lighter alternative`,
              description: alternatives.description,
              action: alternatives.action
            });
          }
        }
      } else if (totalSize > 500) {
        recs.push({
          category: 'performance',
          impact: 2,
          priority: 'medium',
          suggestion: `Optimize bundle size (${totalSize}KB${sizeLabel})`,
          description: 'Bundle size is getting large. Consider optimization strategies.',
          action: 'Add code splitting and tree shaking to reduce bundle size'
        });
      }

      // Code splitting recommendation if only 1 chunk
      if ((chunkCount || 1) === 1 && totalSize > 300) {
        recs.push({
          category: 'performance',
          impact: 2,
          priority: 'medium',
          suggestion: 'Implement code splitting (single chunk detected)',
          description: 'Code splitting improves initial load performance.',
          action: 'Split routes and heavy components into separate chunks'
        });
      }
    } else if (percentage < 70) {
      // Fallback when bundle analysis unavailable
      recs.push({
        category: 'performance',
        impact: 2,
        priority: 'medium',
        suggestion: 'Add bundle analysis and optimization',
        description: 'Monitor bundle size and implement code splitting for better performance.',
        action: 'Install webpack-bundle-analyzer or similar tool for your build system',
        executable: {
          commands: ['npm install --save-dev webpack-bundle-analyzer'],
          confirmationMessage: 'Install bundle analyzer for performance monitoring?',
          requiresInteraction: false
        }
      });
    }

    // Dynamic performance recommendations based on detected patterns    /**
   * Performs the specified operation
   * @param {any} result.details?.dynamicImports - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (result.details?.dynamicImports === 0 && this.projectType !== 'cli') {
      recs.push({
        category: 'performance',
        impact: 2,
        priority: 'medium',
        suggestion: 'Implement lazy loading for routes and components',
        description: 'No dynamic imports detected. Lazy loading reduces initial bundle size.',
        action: 'Use React.lazy(), Vue async components, or dynamic imports'
      });
    }    /**
   * Performs the specified operation
   * @param {number} result.details?.memoizationCount - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */


    if (result.details?.memoizationCount === 0 && this.projectType === 'react') {
      recs.push({
        category: 'performance',
        impact: 2,
        priority: 'medium',
        suggestion: 'Add React performance optimizations (no memoization detected)',
        description: 'React apps benefit from memoization to prevent unnecessary re-renders.',
        action: 'Use React.memo, useMemo, and useCallback for expensive operations'
      });
    }

    if (result.issues.some(issue => issue.includes('dependencies'))) {
      recs.push({
        category: 'performance',
        impact: 1,
        priority: 'low',
        suggestion: 'Audit and optimize dependencies',
        description: 'Remove unused dependencies and consider lighter alternatives.',
        action: 'Run npm audit, use depcheck, consider bundle size impact',
        executable: {
          commands: ['npx depcheck', 'npm ls --depth=0'],
          confirmationMessage: 'Check for unused dependencies?',
          requiresInteraction: false
        }
      });
    }

    return recs;
  }  /**
   * Retrieves data
   * @param {any} result
   * @param {any} percentage
   * @returns {string} The retrieved data
   */


  getTestingRecommendations(result, percentage) {
    const recs = [];

    // PHASE 1: Data-driven testing recommendations from real coverage metrics
    const realCoverage = result.details?.realCoverage;    /**
   * Performs the specified operation
   * @param {any} realCoverage
   * @returns {any} The operation result
   */

    if (realCoverage) {
      const { lines, functions, branches, statements } = realCoverage;
      const avgCoverage = (lines + functions + branches + statements) / 4;      /**
   * Performs the specified operation
   * @param {any} avgCoverage < 60
   * @returns {any} The operation result
   */


      if (avgCoverage < 60) {
        const lowestMetric = Math.min(lines, functions, branches, statements);
        const metricName = lowestMetric === lines ? 'line' :
          lowestMetric === functions ? 'function' :
            lowestMetric === branches ? 'branch' : 'statement';

        recs.push({
          category: 'testing',
          impact: 4,
          priority: 'critical',
          suggestion: `Urgent: Increase test coverage from ${avgCoverage.toFixed(1)}% to 70%+`,
          description: `Your ${metricName} coverage is critically low at ${lowestMetric}%. This poses significant risk.`,
          action: 'Focus on testing business logic and critical user flows first',
          specificIssues: [
            `Line coverage: ${lines}%`,
            `Function coverage: ${functions}%`,
            `Branch coverage: ${branches}%`,
            `Statement coverage: ${statements}%`
          ]
        });
      } else if (avgCoverage < 80) {
        recs.push({
          category: 'testing',
          impact: 3,
          priority: 'high',
          suggestion: `Increase test coverage from ${avgCoverage.toFixed(1)}% to 80%+`,
          description: 'Good progress! Push coverage to the industry standard of 80%+.',
          action: 'Add tests for uncovered branches and edge cases',
          specificIssues: [
            `Current average: ${avgCoverage.toFixed(1)}%`,
            `Target: 80%+ (need ${(80 - avgCoverage).toFixed(1)}% more)`
          ]
        });
      }

      // Specific metric recommendations      /**
   * Performs the specified operation
   * @param {any} branches < lines - 15
   * @returns {any} The operation result
   */

      if (branches < lines - 15) {
        recs.push({
          category: 'testing',
          impact: 2,
          priority: 'medium',
          suggestion: `Improve branch coverage (${branches}% vs ${lines}% line coverage)`,
          description: 'Low branch coverage suggests missing edge case testing.',
          action: 'Add tests for if-else conditions, switch cases, and error paths'
        });
      }      /**
   * Performs the specified operation
   * @param {any} functions < 70
   * @returns {any} The operation result
   */


      if (functions < 70) {
        recs.push({
          category: 'testing',
          impact: 3,
          priority: 'high',
          suggestion: `Test more functions (${functions}% function coverage)`,
          description: 'Many functions are completely untested.',
          action: 'Start with utility functions and pure functions - they\'re easiest to test'
        });
      }
    } else if (percentage < 70) {
      // Fallback when real coverage unavailable
      recs.push({
        category: 'testing',
        impact: 4,
        priority: 'high',
        suggestion: 'Increase test coverage to 80%+',
        description: 'Comprehensive testing prevents regressions and improves code quality.',
        action: 'Install coverage tool (c8, nyc, jest --coverage) and focus on business logic tests'
      });
    }

    // Test organization recommendations
    const testData = result.details;    /**
   * Performs the specified operation
   * @param {any} testData?.testFiles ! - Optional parameter
   * @returns {any} The operation result
   */

    if (testData?.testFiles !== undefined && testData.sourceFiles !== undefined) {
      const ratio = testData.testFiles / testData.sourceFiles;      /**
   * Performs the specified operation
   * @param {any} ratio < 0.3
   * @returns {any} The operation result
   */


      if (ratio < 0.3) {
        recs.push({
          category: 'testing',
          impact: 3,
          priority: 'high',
          suggestion: `Add more test files (${testData.testFiles} tests for ${testData.sourceFiles} source files)`,
          description: 'Too few test files suggests major gaps in test coverage.',
          action: 'Aim for at least 1 test file per 2-3 source files'
        });
      }
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
  }  /**
   * Retrieves data
   * @param {any} result
   * @param {any} percentage
   * @returns {string} The retrieved data
   */


  getSecurityRecommendations(result, percentage) {
    const recs = [];

    // PHASE 1: Data-driven security recommendations from npm audit
    const npmAuditData = result.details?.npmAuditResult;    /**
   * Performs the specified operation
   * @param {any} npmAuditData
   * @returns {any} The operation result
   */

    if (npmAuditData) {
      const { total, critical, high, moderate, low } = npmAuditData;      /**
   * Performs the specified operation
   * @param {any} critical > 0
   * @returns {any} The operation result
   */


      if (critical > 0) {
        recs.push({
          category: 'security',
          impact: 5,
          priority: 'critical',
          suggestion: `URGENT: Fix ${critical} critical security vulnerabilities`,
          description: 'Critical vulnerabilities pose immediate security risks and must be addressed immediately.',
          action: 'Run npm audit --fix immediately, then manually review remaining issues',
          executable: {
            commands: ['npm audit --fix', 'npm audit'],
            confirmationMessage: `Fix ${critical} critical vulnerabilities now?`,
            requiresInteraction: false
          },
          specificIssues: [`${critical} critical vulnerabilities`, `${total} total vulnerabilities`]
        });
      } else if (high > 0) {
        recs.push({
          category: 'security',
          impact: 4,
          priority: 'high',
          suggestion: `Fix ${high} high-severity security vulnerabilities`,
          description: 'High-severity vulnerabilities should be addressed within 24-48 hours.',
          action: 'Run npm audit --fix and review unfixed vulnerabilities',
          executable: {
            commands: ['npm audit --fix'],
            confirmationMessage: `Fix ${high} high-severity vulnerabilities?`,
            requiresInteraction: false
          },
          specificIssues: [`${high} high-severity issues`, `${moderate + low} lower-severity issues`]
        });
      } else if (moderate + low > 0) {
        recs.push({
          category: 'security',
          impact: 2,
          priority: 'medium',
          suggestion: `Address ${moderate + low} moderate/low security issues`,
          description: 'These vulnerabilities should be addressed in the next development cycle.',
          action: 'Review npm audit output and plan updates for affected packages'
        });
      }
    } else if (result.issues.some(issue => issue.includes('vulnerabilities'))) {
      // Fallback when npm audit data unavailable
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

    // PHASE 1: Secrets management recommendations with specifics
    const secretsData = result.details;    /**
   * Performs the specified operation
   * @param {any} secretsData?.hardcodedSecrets > 0
   * @returns {any} The operation result
   */

    if (secretsData?.hardcodedSecrets > 0) {
      recs.push({
        category: 'security',
        impact: 4,
        priority: 'high',
        suggestion: `Remove ${secretsData.hardcodedSecrets} hardcoded secrets detected`,
        description: 'Hardcoded secrets in code can be exposed in version control and pose security risks.',
        action: 'Move secrets to .env files and add .env to .gitignore',
        specificIssues: [
          `${secretsData.hardcodedSecrets} potential hardcoded secrets found`,
          `${secretsData.envUsage || 0} environment variables already in use`
        ]
      });
    } else if (result.issues.some(issue => issue.includes('secrets'))) {
      recs.push({
        category: 'security',
        impact: 3,
        priority: 'high',
        suggestion: 'Remove hardcoded secrets and API keys',
        description: 'Hardcoded secrets in code can be exposed in version control.',
        action: 'Use environment variables and secrets management systems'
      });
    }

    // PHASE 1: Error handling recommendations with metrics
    const errorData = result.details;    /**
   * Performs the specified operation
   * @param {any} errorData?.tryCatchBlocks ! - Optional parameter
   * @returns {any} The operation result
   */

    if (errorData?.tryCatchBlocks !== undefined && errorData.tryCatchBlocks < 3 && errorData.errorHandlers < 5) {
      recs.push({
        category: 'security',
        impact: 2,
        priority: 'medium',
        suggestion: `Add more error handling (${errorData.tryCatchBlocks} try-catch blocks found)`,
        description: 'Insufficient error handling can lead to information leakage and poor user experience.',
        action: 'Add try-catch blocks around error-prone operations and API calls',
        specificIssues: [
          `Only ${errorData.tryCatchBlocks} try-catch blocks found`,
          `${errorData.structuredErrors || 0} files with structured error handling`,
          `${errorData.contextualErrors || 0} files with contextual errors`
        ]
      });
    } else if (percentage < 80) {
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
  }  /**
   * Retrieves data
   * @param {any} result
   * @param {any} percentage
   * @returns {string} The retrieved data
   */


  getDeveloperExperienceRecommendations(result, percentage) {
    const recs = [];    /**
   * Performs the specified operation
   * @param {any} percentage < 70
   * @returns {any} The operation result
   */


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
  }  /**
   * Retrieves data
   * @param {any} result
   * @param {any} percentage
   * @returns {string} The retrieved data
   */


  getCompletenessRecommendations(result, percentage) {
    const recs = [];    /**
   * Performs the specified operation
   * @param {any} percentage < 80
   * @returns {any} The operation result
   */


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
  }  /**
   * Retrieves data
   * @param {any} results
   * @returns {string} The retrieved data
   */


  getGeneralRecommendations(results) {
    const recs = [];
    const { overall, categories } = results;

    // Overall score-based recommendations    /**
   * Performs the specified operation
   * @param {any} overall.score < 60
   * @returns {any} The operation result
   */

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

    // Context7 specific recommendations    /**
   * Performs the specified operation
   * @param {any} !categories.quality || categories.quality.score < 15
   * @returns {any} The operation result
   */

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
  }  /**
   * Retrieves data
   * @param {any} priority
   * @returns {string} The retrieved data
   */


  getPriorityWeight(priority) {  /**
   * Performs the specified operation
   * @param {any} priority
   * @returns {any} The operation result
   */

    switch (priority) {
    case 'critical': return 1;
    case 'high': return 2;
    case 'medium': return 3;
    case 'low': return 4;
    default: return 5;
    }
  }  /**
   * Performs the specified operation
   * @param {any} results
   * @returns {any} The operation result
   */


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
  }  /**
   * Performs the specified operation
   * @param {any} recommendations
   * @returns {any} The operation result
   */


  filterAndDeduplicateRecommendations(recommendations) {
    const filtered = [];
    const categoryConflicts = new Map();    /**
   * Performs the specified operation
   * @param {any} const rec of recommendations
   * @returns {any} The operation result
   */


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
      const existing = categoryConflicts.get(conflictKey);      /**
   * Performs the specified operation
   * @param {boolean} existing && existing.impact > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */


      if (existing && existing.impact >= rec.impact) {
        continue;
      }      /**
   * Performs the specified operation
   * @param {boolean} existing
   * @returns {boolean} True if successful, false otherwise
   */


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
  }  /**
   * Generates new data
   * @param {any} recommendation
   * @returns {any} The created resource
   */


  generateSimilarityKey(recommendation) {
    // Create a key based on the core action/suggestion
    const key = `${recommendation.category}-${recommendation.action}`.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    return key;
  }  /**
   * Performs the specified operation
   * @param {any} recommendation
   * @returns {boolean} True if successful, false otherwise
   */


  isRelevantForProjectType(recommendation) {  /**
   * Performs the specified operation
   * @param {boolean} !this.projectType
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.projectType) {return true;}

    const action = recommendation.action.toLowerCase();
    const suggestion = recommendation.suggestion.toLowerCase();

    // Filter out irrelevant recommendations based on project type    /**
   * Performs the specified operation
   * @param {boolean} this.projectType
   * @returns {boolean} True if successful, false otherwise
   */

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

  /**
   * Get specific advice for common ESLint rules
   */
  getESLintRuleAdvice(ruleName) {
    const ruleAdvice = {
      'no-unused-vars': {
        description: 'Unused variables waste memory and indicate potential issues.',
        action: 'Remove unused variables or prefix with underscore if intentional'
      },
      'no-console': {
        description: 'Console statements should not be left in production code.',
        action: 'Remove console.log statements or use proper logging library'
      },
      'prefer-const': {
        description: 'Variables that are never reassigned should use const.',
        action: 'Change let declarations to const where variables are not reassigned'
      },
      'no-var': {
        description: 'Use let/const instead of var for block scoping.',
        action: 'Replace var declarations with let or const'
      },
      'indent': {
        description: 'Consistent indentation improves code readability.',
        action: 'Configure and run Prettier for automatic indentation fixing'
      },
      'quotes': {
        description: 'Consistent quote style improves code consistency.',
        action: 'Configure ESLint/Prettier to enforce single or double quotes'
      },
      'semi': {
        description: 'Consistent semicolon usage prevents ASI issues.',
        action: 'Add or remove semicolons consistently based on your style guide'
      }
    };

    return ruleAdvice[ruleName];
  }

  /**
   * Get bundle optimization alternatives for common heavy packages
   */
  getBundleAlternatives(packageName) {
    const alternatives = {
      'lodash': {
        description: 'Lodash is heavy. Use lodash-es for tree shaking or specific imports.',
        action: 'Replace with: import { debounce } from \'lodash-es\' or native alternatives'
      },
      'moment': {
        description: 'Moment.js is heavy and deprecated. Use day.js or date-fns instead.',
        action: 'Replace with day.js (2KB) or date-fns for lighter date handling'
      },
      'react': {
        description: 'Consider React alternatives for smaller bundles if appropriate.',
        action: 'Ensure code splitting and lazy loading are implemented'
      },
      'axios': {
        description: 'Axios is feature-rich but heavy. Consider fetch API or ky.',
        action: 'Use native fetch() or ky (3KB) for simpler HTTP requests'
      }
    };

    return alternatives[packageName];
  }

  // Generate specific action plans  /**
   * Generates new data
   * @param {any} recommendations
   * @returns {any} The created resource
   */

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

  // Execute a specific recommendation  /**
   * Executes the operation
   * @param {any} recommendation
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */

  async executeRecommendation(recommendation, options = {}) {  /**
   * Performs the specified operation
   * @param {any} !recommendation.executable
   * @returns {any} The operation result
   */

    if (!recommendation.executable) {
      throw new Error('This recommendation is not executable');
    }

    const { commands, requiresInteraction } = recommendation.executable;
    const results = [];    /**
   * Performs the specified operation
   * @param {any} const command of commands
   * @returns {any} The operation result
   */


    for (const command of commands) {
      try {
        const result = await this.executeCommand(command, {
          interactive: requiresInteraction,
          ...options
        });
        results.push({ command, success: true, output: result });
      } catch (error) {
        results.push({ command, success: false, error: error.message });        /**
   * Performs the specified operation
   * @param {Object} options.stopOnError ! - Optional parameter
   * @returns {any} The operation result
   */

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
  }  /**
   * Executes the operation
   * @param {any} command
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async executeCommand(command, options = {}) {
    const { exec } = await import('child_process');

    return new Promise((resolve, reject) => {
      const childProcess = exec(command, {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 30000,
        maxBuffer: options.maxBuffer || 1024 * 1024
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout?.on('data', (data) => {
        stdout += data;        /**
   * Performs the specified operation
   * @param {Object} options.onOutput
   * @returns {any} The operation result
   */

        if (options.onOutput) {options.onOutput(data.toString());}
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data;        /**
   * Performs the specified operation
   * @param {Object} options.onError
   * @returns {any} The operation result
   */

        if (options.onError) {options.onError(data.toString());}
      });

      childProcess.on('close', (code) => {        /**
   * Performs the specified operation
   * @param {any} code - Optional parameter
   * @returns {any} The operation result
   */

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

  // Get all executable recommendations  /**
   * Retrieves data
   * @param {any} recommendations
   * @returns {string} The retrieved data
   */

  getExecutableRecommendations(recommendations) {
    return recommendations.filter(rec => rec.executable);
  }

  // Batch execute multiple recommendations  /**
   * Executes the operation
   * @param {any} recommendations
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */

  async executeBatch(recommendations, options = {}) {
    const executableRecs = this.getExecutableRecommendations(recommendations);
    const results = [];    /**
   * Performs the specified operation
   * @param {any} const rec of executableRecs
   * @returns {any} The operation result
   */


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

  // Progress tracking helpers  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */

  async getRecommendationHistory() {
    return await this.history.getStats();
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async clearRecommendationHistory() {
    return await this.history.clearHistory();
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async exportRecommendationHistory() {
    return await this.history.exportHistory();
  }  /**
   * Performs the specified operation
   * @param {any} recommendation
   * @returns {Promise} Promise that resolves with the result
   */


  async markManualCompletion(recommendation) {
    await this.history.markRecommendationCompleted(recommendation, true);
  }

  /**
   * Generate enhanced prompts for recommendations
   */
  async generateEnhancedPrompts(recommendations, projectContext = {}) {
    const projectContextWithType = {
      type: this.projectType,
      ...projectContext
    };

    return await this.promptGenerator.generateBatchPrompts(recommendations, projectContextWithType);
  }

  /**
   * Generate a single enhanced prompt for a recommendation
   */
  async generateEnhancedPrompt(recommendation, projectContext = {}) {
    const projectContextWithType = {
      type: this.projectType,
      ...projectContext
    };

    return await this.promptGenerator.generateEnhancedPrompt(recommendation, projectContextWithType);
  }

  /**
   * Get prompt generation statistics
   */
  getPromptStats() {
    return this.promptGenerator.getPromptStats();
  }
}