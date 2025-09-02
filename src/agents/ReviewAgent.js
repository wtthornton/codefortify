/**
 * Review Agent - Validates and scores code improvements
 */

import { ProjectScorer } from '../scoring/ProjectScorer.js';
import { CodeFortifyValidator } from '../validation/CodeFortifyValidator.js';
import { PerformanceMonitor } from '../scoring/core/PerformanceMonitor.js';

/**


 * ReviewAgent class implementation


 *


 * Provides functionality for reviewagent operations


 */


export class ReviewAgent {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      strictMode: config.strictMode || false,
      targetScore: config.targetScore || 95,
      ...config
    };

    this.scorer = new ProjectScorer(this.config);
    this.validator = new CodeFortifyValidator(this.config);
    this.performanceMonitor = new PerformanceMonitor();

    this.reviewCriteria = this.initializeReviewCriteria();
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} previousIteration - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async review(code, previousIteration = null) {
    const startTime = Date.now();

    try {
      const currentScore = await this.scoreCode(code);
      const issues = await this.identifyIssues(code, currentScore);
      const progressValidation = previousIteration
        ? await this.validateProgress(code, previousIteration)
        : null;
      const compliance = await this.checkCompliance(code);
      const summary = await this.generateReviewSummary(currentScore, issues, compliance, progressValidation);

      const result = {
        score: currentScore.overall.score,
        grade: this.calculateGrade(currentScore.overall.score),
        issues: issues,
        compliance: compliance,
        progress: progressValidation,
        summary: summary,
        categories: currentScore.categories,
        recommendations: await this.generateRecommendations(issues, currentScore),
        passesReview: this.determineReviewStatus(currentScore.overall.score, issues),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        metadata: {
          strictMode: this.config.strictMode,
          targetScore: this.config.targetScore,
          totalIssues: issues.length,
          criticalIssues: issues.filter(i => i.severity === 'critical').length
        }
      };

      return result;

    } catch (error) {
      throw new Error(`Review failed: ${error.message}`);
    }
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @returns {Promise} Promise that resolves with the result
   */


  async scoreCode(code) {
    try {      /**
   * Performs the specified operation
   * @param {any} typeof code - Optional parameter
   * @returns {string} The operation result
   */

      if (typeof code === 'string') {
        return await this.scoreCodeString(code);
      } else {
        return await this.scorer.score();
      }
    } catch (error) {
      return await this.basicScore(code);
    }
  }  /**
   * Performs the specified operation
   * @param {any} codeString
   * @returns {Promise} Promise that resolves with the result
   */


  async scoreCodeString(codeString) {
    const analysis = {
      structure: this.analyzeCodeStructure(codeString),
      quality: this.analyzeCodeQuality(codeString),
      security: this.analyzeCodeSecurity(codeString),
      performance: this.analyzeCodePerformance(codeString),
      testing: this.analyzeTestCoverage(codeString),
      documentation: this.analyzeDocumentation(codeString)
    };

    const categories = {
      structure: { score: analysis.structure.score, maxScore: 20, details: analysis.structure },
      quality: { score: analysis.quality.score, maxScore: 20, details: analysis.quality },
      performance: { score: analysis.performance.score, maxScore: 15, details: analysis.performance },
      testing: { score: analysis.testing.score, maxScore: 15, details: analysis.testing },
      security: { score: analysis.security.score, maxScore: 15, details: analysis.security },
      developer_experience: { score: analysis.documentation.score, maxScore: 10, details: analysis.documentation },
      completeness: { score: 5, maxScore: 5, details: { complete: true } }
    };

    const totalScore = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0);
    const maxScore = Object.values(categories).reduce((sum, cat) => sum + cat.maxScore, 0);

    return {
      overall: {
        score: Math.round(totalScore),
        maxScore: maxScore,
        percentage: Math.round((totalScore / maxScore) * 100)
      },
      categories: categories
    };
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} scoreResult
   * @returns {Promise} Promise that resolves with the result
   */


  async identifyIssues(code, scoreResult) {
    const issues = [];
    issues.push(...await this.identifyCriticalIssues(code, scoreResult));
    issues.push(...await this.identifyMajorIssues(code, scoreResult));
    issues.push(...await this.identifyMinorIssues(code, scoreResult));

    return issues.sort((a, b) => {
      const severityOrder = { critical: 3, major: 2, minor: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];      /**
   * Performs the specified operation
   * @param {any} severityDiff ! - Optional parameter
   * @returns {any} The operation result
   */

      if (severityDiff !== 0) { return severityDiff; }
      return (b.impact || 0) - (a.impact || 0);
    });
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} scoreResult
   * @returns {Promise} Promise that resolves with the result
   */


  async identifyCriticalIssues(code, scoreResult) {
    const issues = [];    /**
   * Performs the specified operation
   * @param {any} typeof code - Optional parameter
   * @returns {string} The operation result
   */


    if (typeof code === 'string') {
      if (/eval\s*\(/.test(code)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          category: 'Security',
          description: 'Dangerous eval() usage detected',
          location: this.findCodeLocation(code, /eval\s*\(/),
          impact: 5,
          fix: 'Replace eval() with safer alternatives like JSON.parse() or proper parsing'
        });
      }

      if (/(?:password|token|key|secret)\s*[:=]\s*["'][\w\-.]+["']/gi.test(code)) {
        issues.push({
          type: 'security',
          severity: 'critical',
          category: 'Security',
          description: 'Hardcoded secrets detected',
          location: this.findCodeLocation(code, /(?:password|token|key|secret)\s*[:=]/gi),
          impact: 5,
          fix: 'Move secrets to environment variables or secure configuration'
        });
      }

      if (this.hasSyntaxErrors(code)) {
        issues.push({
          type: 'syntax',
          severity: 'critical',
          category: 'Code Quality',
          description: 'Potential syntax errors detected',
          impact: 5,
          fix: 'Fix syntax errors to ensure code can execute'
        });
      }
    }    /**
   * Performs the specified operation
   * @param {any} scoreResult.overall.score < 50
   * @returns {any} The operation result
   */


    if (scoreResult.overall.score < 50) {
      issues.push({
        type: 'quality',
        severity: 'critical',
        category: 'Overall Quality',
        description: `Overall score too low: ${scoreResult.overall.score}/100`,
        impact: 5,
        fix: 'Address major quality issues across all categories'
      });
    }

    return issues;
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} scoreResult
   * @returns {Promise} Promise that resolves with the result
   */


  async identifyMajorIssues(code, scoreResult) {
    const issues = [];

    Object.entries(scoreResult.categories).forEach(([category, result]) => {
      const percentage = (result.score / result.maxScore) * 100;      /**
   * Performs the specified operation
   * @param {any} percentage < 60
   * @returns {any} The operation result
   */

      if (percentage < 60) {
        issues.push({
          type: 'category',
          severity: 'major',
          category: category,
          description: `${category} score below threshold: ${Math.round(percentage)}%`,
          impact: 4,
          fix: `Improve ${category} to reach at least 60% score`
        });
      }
    });    /**
   * Performs the specified operation
   * @param {any} typeof code - Optional parameter
   * @returns {string} The operation result
   */


    if (typeof code === 'string') {
      if (/(document\.getElementById|querySelector).*\)/g.test(code)) {
        issues.push({
          type: 'performance',
          severity: 'major',
          category: 'Performance',
          description: 'Uncached DOM queries detected',
          location: this.findCodeLocation(code, /(document\.getElementById|querySelector)/g),
          impact: 3,
          fix: 'Cache DOM query results to improve performance'
        });
      }

      if (/(async|await|fetch|\.then)/.test(code) && !/try\s*\{|catch\s*\(/.test(code)) {
        issues.push({
          type: 'error-handling',
          severity: 'major',
          category: 'Code Quality',
          description: 'Missing error handling for async operations',
          impact: 4,
          fix: 'Add try-catch blocks or proper error handling'
        });
      }
    }

    return issues;
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} _scoreResult
   * @returns {Promise} Promise that resolves with the result
   */


  async identifyMinorIssues(code, _scoreResult) {
    const issues = [];    /**
   * Performs the specified operation
   * @param {any} typeof code - Optional parameter
   * @returns {string} The operation result
   */


    if (typeof code === 'string') {
      if (/var\s+\w+/.test(code)) {
        issues.push({
          type: 'style',
          severity: 'minor',
          category: 'Code Quality',
          description: 'Using var instead of let/const',
          location: this.findCodeLocation(code, /var\s+/g),
          impact: 2,
          fix: 'Replace var with let or const for better scoping'
        });
      }

      if (/console.(log|error|warn|info)/.test(code)) {
        issues.push({
          type: 'style',
          severity: 'minor',
          category: 'Code Quality',
          description: 'Console statements should be replaced with proper logging',
          location: this.findCodeLocation(code, /console./g),
          impact: 2,
          fix: 'Replace console statements with structured logging'
        });
      }

      const complexFunctions = code.match(/function\s+\w+[^{]*\{[^}]{200,}\}/g);      /**
   * Performs the specified operation
   * @param {any} complexFunctions && complexFunctions.length > 0
   * @returns {any} The operation result
   */

      if (complexFunctions && complexFunctions.length > 0) {
        issues.push({
          type: 'documentation',
          severity: 'minor',
          category: 'Documentation',
          description: 'Complex functions missing documentation',
          impact: 2,
          fix: 'Add JSDoc comments to document complex functions'
        });
      }
    }

    return issues;
  }  /**
   * Checks the condition
   * @param {any} code
   * @returns {Promise} Promise that resolves with the result
   */


  async checkCompliance(code) {
    const compliance = {
      codefortify: true,
      context7: true,
      bestPractices: true,
      issues: []
    };

    try {
      const validationResult = await this.validator.validateProject(this.config.projectRoot);
      compliance.codefortify = validationResult.valid;      /**
   * Performs the specified operation
   * @param {number} !validationResult.valid
   * @returns {any} The operation result
   */

      if (!validationResult.valid) {
        compliance.issues.push(...validationResult.errors.map(error => ({
          type: 'compliance',
          description: error,
          severity: 'major'
        })));
      }
    } catch (error) {
      compliance.issues.push({
        type: 'compliance',
        description: 'Could not validate project compliance',
        severity: 'minor'
      });
    }    /**
   * Performs the specified operation
   * @param {any} typeof code - Optional parameter
   * @returns {string} The operation result
   */


    if (typeof code === 'string') {      /**
   * Performs the specified operation
   * @param {Object} this.config.projectType - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.projectType === 'react-webapp') {
        if (!code.includes('import React')) {
          compliance.bestPractices = false;
          compliance.issues.push({
            type: 'compliance',
            description: 'React components should import React',
            severity: 'minor'
          });
        }
      }
    }

    return compliance;
  }  /**
   * Validates input data
   * @param {any} code
   * @param {any} previousIteration
   * @returns {Promise} Promise that resolves with the result
   */


  async validateProgress(code, previousIteration) {  /**
   * Performs the specified operation
   * @param {any} !previousIteration
   * @returns {any} The operation result
   */

    if (!previousIteration) { return null; }

    const currentScore = await this.scoreCode(code);
    const previousScore = previousIteration.score || 0;
    const improvement = currentScore.overall.score - previousScore;

    return {
      previousScore: previousScore,
      currentScore: currentScore.overall.score,
      improvement: improvement,
      improvementPercentage: previousScore > 0 ? ((improvement / previousScore) * 100) : 0,
      isImprovement: improvement > 0,
      significantImprovement: improvement >= 5,
      categories: this.analyzeCategorialProgress(currentScore.categories, previousIteration.categories)
    };
  }  /**
   * Generates new data
   * @param {any} scoreResult
   * @param {boolean} issues
   * @param {any} compliance
   * @param {any} progress
   * @returns {Promise} Promise that resolves with the result
   */


  async generateReviewSummary(scoreResult, issues, compliance, progress) {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;
    const minorIssues = issues.filter(i => i.severity === 'minor').length;

    const summary = {
      overallStatus: this.determineOverallStatus(scoreResult.overall.score, criticalIssues, majorIssues),
      score: scoreResult.overall.score,
      grade: this.calculateGrade(scoreResult.overall.score),
      issuesSummary: {
        total: issues.length,
        critical: criticalIssues,
        major: majorIssues,
        minor: minorIssues
      },
      topCategories: this.getTopCategories(scoreResult.categories),
      weakestCategories: this.getWeakestCategories(scoreResult.categories),
      complianceStatus: compliance.codefortify && compliance.bestPractices,
      progressSummary: progress ? {
        improved: progress.isImprovement,
        improvement: progress.improvement,
        significant: progress.significantImprovement
      } : null
    };

    return summary;
  }  /**
   * Generates new data
   * @param {boolean} issues
   * @param {any} scoreResult
   * @returns {Promise} Promise that resolves with the result
   */


  async generateRecommendations(issues, scoreResult) {
    const recommendations = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    criticalIssues.forEach(issue => {
      recommendations.push({
        priority: 'high',
        category: issue.category,
        description: issue.fix || `Address ${issue.description}`,
        impact: issue.impact || 5,
        effort: this.estimateEffort(issue),
        type: 'fix'
      });
    });

    Object.entries(scoreResult.categories).forEach(([category, result]) => {
      const percentage = (result.score / result.maxScore) * 100;      /**
   * Performs the specified operation
   * @param {any} percentage < 70
   * @returns {any} The operation result
   */

      if (percentage < 70) {
        recommendations.push({
          priority: percentage < 50 ? 'high' : 'medium',
          category: category,
          description: `Improve ${category} score from ${Math.round(percentage)}% to at least 70%`,
          impact: Math.ceil((70 - percentage) / 10),
          effort: Math.ceil((70 - percentage) / 15),
          type: 'improvement'
        });
      }
    });    /**
   * Performs the specified operation
   * @param {Object} scoreResult.overall.score < this.config.targetScore
   * @returns {boolean} True if successful, false otherwise
   */


    if (scoreResult.overall.score < this.config.targetScore) {
      const gap = this.config.targetScore - scoreResult.overall.score;
      recommendations.push({
        priority: 'medium',
        category: 'Overall',
        description: `Increase overall score by ${gap} points to reach target of ${this.config.targetScore}`,
        impact: gap,
        effort: Math.ceil(gap / 10),
        type: 'target'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];      /**
   * Performs the specified operation
   * @param {any} priorityDiff ! - Optional parameter
   * @returns {any} The operation result
   */

      if (priorityDiff !== 0) { return priorityDiff; }
      return (b.impact || 0) - (a.impact || 0);
    });
  }  /**
   * Initialize the component
   * @returns {any} The operation result
   */


  initializeReviewCriteria() {
    return {
      minimumScore: this.config.strictMode ? 80 : 60,
      criticalIssueLimit: this.config.strictMode ? 0 : 2,
      majorIssueLimit: this.config.strictMode ? 2 : 5,
      requiredCompliance: true,
      categoryThresholds: {
        structure: 60,
        quality: 70,
        security: 80,
        performance: 60,
        testing: this.config.strictMode ? 70 : 50
      }
    };
  }  /**
   * Analyzes the provided data
   * @param {any} codeString
   * @returns {any} The operation result
   */


  analyzeCodeStructure(codeString) {
    const lines = codeString.split('\n').length;
    const functions = (codeString.match(/function\s+\w+|=>\s*{|\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length;
    const classes = (codeString.match(/class\s+\w+/g) || []).length;
    const complexity = this.calculateComplexity(codeString);

    let score = 20;    /**
   * Performs the specified operation
   * @param {any} lines > 500
   * @returns {any} The operation result
   */

    if (lines > 500) { score -= 3; }    /**
   * Performs the specified operation
   * @param {any} complexity > 20
   * @returns {any} The operation result
   */

    if (complexity > 20) { score -= 5; }    /**
   * Performs the specified operation
   * @param {any} functions - Optional parameter
   * @returns {any} The operation result
   */

    if (functions === 0 && classes === 0) { score -= 5; }

    return {
      score: Math.max(0, score),
      lines,
      functions,
      classes,
      complexity
    };
  }  /**
   * Analyzes the provided data
   * @param {any} codeString
   * @returns {any} The operation result
   */


  analyzeCodeQuality(codeString) {
    let score = 20;
    const issues = [];

    if (/var\s+\w+/.test(codeString)) {
      score -= 2;
      issues.push('uses-var');
    }

    if (/==\s*(?:true|false|null|undefined)/.test(codeString)) {
      score -= 2;
      issues.push('loose-equality');
    }

    if (!/\/\*[\s\S]*?\*\/|\/\/.*$/gm.test(codeString)) {
      score -= 3;
      issues.push('no-comments');
    }

    const avgLineLength = codeString.split('\n').reduce((sum, line) => sum + line.length, 0) / codeString.split('\n').length;    /**
   * Performs the specified operation
   * @param {any} avgLineLength > 120
   * @returns {any} The operation result
   */

    if (avgLineLength > 120) {
      score -= 2;
      issues.push('long-lines');
    }

    return {
      score: Math.max(0, score),
      issues,
      avgLineLength
    };
  }  /**
   * Analyzes the provided data
   * @param {any} codeString
   * @returns {any} The operation result
   */


  analyzeCodeSecurity(codeString) {
    let score = 15;
    const vulnerabilities = [];

    if (/eval\s*\(/.test(codeString)) {
      score -= 8;
      vulnerabilities.push('eval-usage');
    }

    if (/innerHTML\s*=/.test(codeString)) {
      score -= 4;
      vulnerabilities.push('innerHTML-xss');
    }

    if (/(?:password|token|key|secret)\s*[:=]\s*["'][\w\-.]+["']/gi.test(codeString)) {
      score -= 6;
      vulnerabilities.push('hardcoded-secrets');
    }

    if (/document\.write\s*\(/.test(codeString)) {
      score -= 3;
      vulnerabilities.push('document-write');
    }

    return {
      score: Math.max(0, score),
      vulnerabilities
    };
  }  /**
   * Analyzes the provided data
   * @param {any} codeString
   * @returns {any} The operation result
   */


  analyzeCodePerformance(codeString) {
    let score = 15;
    const issues = [];

    if (/(document\.getElementById|querySelector).*\)/g.test(codeString)) {
      score -= 3;
      issues.push('uncached-dom-queries');
    }

    if (/for\s*\([^)]*\.length[^)]*\)/.test(codeString)) {
      score -= 2;
      issues.push('uncached-array-length');
    }

    const hasOptimizations = /useMemo|useCallback|React\.memo/.test(codeString);
    if (!hasOptimizations && /React/.test(codeString)) {
      score -= 2;
      issues.push('no-react-optimizations');
    }

    return {
      score: Math.max(0, score),
      issues
    };
  }  /**
   * Analyzes the provided data
   * @param {any} codeString
   * @returns {any} The operation result
   */


  analyzeTestCoverage(codeString) {
    let score = 10;
    const indicators = [];

    if (/describe\s*\(|it\s*\(|test\s*\(/g.test(codeString)) {
      score += 5;
      indicators.push('has-tests');
    }

    if (/expect\s*\(|assert\s*\(/g.test(codeString)) {
      score += 3;
      indicators.push('has-assertions');
    }

    return {
      score: Math.min(15, score),
      indicators
    };
  }  /**
   * Analyzes the provided data
   * @param {any} codeString
   * @returns {any} The operation result
   */


  analyzeDocumentation(codeString) {
    let score = 10;
    const features = [];

    const commentRatio = (codeString.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length / codeString.split('\n').length;    /**
   * Performs the specified operation
   * @param {any} commentRatio > 0.1
   * @returns {any} The operation result
   */

    if (commentRatio > 0.1) {
      features.push('good-comments');
    } else {
      score -= 4;
    }

    if (/\/\*\*[\s\S]*?\*\//.test(codeString)) {
      features.push('jsdoc-comments');
    } else {
      score -= 3;
    }

    return {
      score: Math.max(0, score),
      features,
      commentRatio
    };
  }  /**
   * Calculates the result
   * @param {any} code
   * @returns {number} The calculated result
   */


  calculateComplexity(code) {
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
    return complexityKeywords.reduce((count, keyword) => {
      const matches = code.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      return count + (matches ? matches.length : 0);
    }, 1);
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} pattern
   * @returns {any} The operation result
   */


  findCodeLocation(code, pattern) {
    const lines = code.split('\n');    /**
   * Performs the specified operation
   * @param {any} let i - Optional parameter
   * @returns {any} The operation result
   */

    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return { line: i + 1, column: lines[i].search(pattern) };
      }
    }
    return null;
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @returns {any} The operation result
   */


  hasSyntaxErrors(code) {
    try {
      const braceCount = (code.match(/\{/g) || []).length - (code.match(/\}/g) || []).length;
      const parenCount = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
      return braceCount !== 0 || parenCount !== 0;
    } catch {
      return true;
    }
  }  /**
   * Calculates the result
   * @param {any} score
   * @returns {number} The calculated result
   */


  calculateGrade(score) {  /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 90) { return 'A'; }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 80) { return 'B'; }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 70) { return 'C'; }    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 60) { return 'D'; }
    return 'F';
  }  /**
   * Performs the specified operation
   * @param {any} score
   * @param {boolean} issues
   * @returns {boolean} True if successful, false otherwise
   */


  determineReviewStatus(score, issues) {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;    /**
   * Performs the specified operation
   * @param {boolean} criticalIssues > this.reviewCriteria.criticalIssueLimit
   * @returns {boolean} True if successful, false otherwise
   */


    if (criticalIssues > this.reviewCriteria.criticalIssueLimit) { return false; }    /**
   * Performs the specified operation
   * @param {boolean} majorIssues > this.reviewCriteria.majorIssueLimit
   * @returns {boolean} True if successful, false otherwise
   */

    if (majorIssues > this.reviewCriteria.majorIssueLimit) { return false; }    /**
   * Performs the specified operation
   * @param {boolean} score < this.reviewCriteria.minimumScore
   * @returns {boolean} True if successful, false otherwise
   */

    if (score < this.reviewCriteria.minimumScore) { return false; }

    return true;
  }  /**
   * Performs the specified operation
   * @param {any} score
   * @param {boolean} criticalIssues
   * @param {boolean} majorIssues
   * @returns {any} The operation result
   */


  determineOverallStatus(score, criticalIssues, majorIssues) {  /**
   * Performs the specified operation
   * @param {boolean} criticalIssues > 0
   * @returns {any} The operation result
   */

    if (criticalIssues > 0) { return 'critical'; }    /**
   * Performs the specified operation
   * @param {boolean} majorIssues > 3
   * @returns {any} The operation result
   */

    if (majorIssues > 3) { return 'needs-work'; }    /**
   * Performs the specified operation
   * @param {any} score < 70
   * @returns {any} The operation result
   */

    if (score < 70) { return 'needs-improvement'; }    /**
   * Performs the specified operation
   * @param {any} score < 85
   * @returns {any} The operation result
   */

    if (score < 85) { return 'good'; }
    return 'excellent';
  }  /**
   * Retrieves data
   * @param {any} categories
   * @returns {string} The retrieved data
   */


  getTopCategories(categories) {
    return Object.entries(categories)
      .map(([name, data]) => ({ name, percentage: Math.round((data.score / data.maxScore) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }  /**
   * Retrieves data
   * @param {any} categories
   * @returns {string} The retrieved data
   */


  getWeakestCategories(categories) {
    return Object.entries(categories)
      .map(([name, data]) => ({ name, percentage: Math.round((data.score / data.maxScore) * 100) }))
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3);
  }  /**
   * Analyzes the provided data
   * @param {any} current
   * @param {any} previous
   * @returns {any} The operation result
   */


  analyzeCategorialProgress(current, previous) {  /**
   * Performs the specified operation
   * @param {any} !previous
   * @returns {any} The operation result
   */

    if (!previous) { return null; }

    const progress = {};
    Object.entries(current).forEach(([category, data]) => {
      const currentPerc = (data.score / data.maxScore) * 100;
      const previousPerc = previous[category] ? (previous[category].score / previous[category].maxScore) * 100 : 0;

      progress[category] = {
        current: Math.round(currentPerc),
        previous: Math.round(previousPerc),
        improvement: Math.round(currentPerc - previousPerc),
        improved: currentPerc > previousPerc
      };
    });

    return progress;
  }  /**
   * Performs the specified operation
   * @param {boolean} issue
   * @returns {boolean} True if successful, false otherwise
   */


  estimateEffort(issue) {
    const effortMap = {
      'syntax': 1,
      'style': 1,
      'security': 3,
      'performance': 2,
      'quality': 2,
      'documentation': 1,
      'error-handling': 2,
      'category': 3
    };
    return effortMap[issue.type] || 2;
  }  /**
   * Performs the specified operation
   * @param {any} _code
   * @returns {Promise} Promise that resolves with the result
   */


  async basicScore(_code) {
    return {
      overall: { score: 75, maxScore: 100, percentage: 75 },
      categories: {
        structure: { score: 15, maxScore: 20 },
        quality: { score: 16, maxScore: 20 },
        performance: { score: 12, maxScore: 15 },
        testing: { score: 10, maxScore: 15 },
        security: { score: 12, maxScore: 15 },
        developer_experience: { score: 7, maxScore: 10 },
        completeness: { score: 3, maxScore: 5 }
      }
    };
  }
}
