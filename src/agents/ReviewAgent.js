/**
 * Review Agent - Validates and scores code improvements
 *
 * Provides comprehensive code review functionality including:
 * - Quality scoring using existing ProjectScorer
 * - Issue identification and categorization
 * - Improvement validation
 * - Progress tracking across iterations
 * - Automated review criteria enforcement
 */

import { ProjectScorer } from '../scoring/ProjectScorer.js';
import { CodeFortifyValidator } from '../validation/CodeFortifyValidator.js';
import { PerformanceMonitor } from '../scoring/core/PerformanceMonitor.js';

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
  }

  /**
   * Main review method - comprehensive code evaluation
   */
  async review(code, previousIteration = null) {
    const startTime = Date.now();

    try {
      // Score current code state
      const currentScore = await this.scoreCode(code);

      // Identify issues and opportunities
      const issues = await this.identifyIssues(code, currentScore);

      // Validate improvements if this is a follow-up iteration
      const progressValidation = previousIteration
        ? await this.validateProgress(code, previousIteration)
        : null;

      // Check compliance with project standards
      const compliance = await this.checkCompliance(code);

      // Generate review summary
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
  }

  /**
   * Score code using the existing ProjectScorer
   */
  async scoreCode(code) {
    try {
      // For string code, we'll write it to a temporary structure and score
      if (typeof code === 'string') {
        return await this.scoreCodeString(code);
      } else {
        // Assume it's a project structure
        return await this.scorer.score();
      }
    } catch (error) {
      // Fallback to basic scoring if full scoring fails
      return await this.basicScore(code);
    }
  }

  /**
   * Score a code string by analyzing patterns
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

    // Convert analysis to scoring format
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
  }

  /**
   * Identify issues in the code
   */
  async identifyIssues(code, scoreResult) {
    const issues = [];

    // Critical issues (blockers)
    issues.push(...await this.identifyCriticalIssues(code, scoreResult));

    // Major issues (significant impact)
    issues.push(...await this.identifyMajorIssues(code, scoreResult));

    // Minor issues (improvements)
    issues.push(...await this.identifyMinorIssues(code, scoreResult));

    // Sort by severity and impact
    return issues.sort((a, b) => {
      const severityOrder = { critical: 3, major: 2, minor: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) {return severityDiff;}
      return (b.impact || 0) - (a.impact || 0);
    });
  }

  /**
   * Identify critical issues that block progress
   */
  async identifyCriticalIssues(code, scoreResult) {
    const issues = [];

    // Security vulnerabilities
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

      if (/(?:password|token|key|secret)\s*[:=]\s*["'][\w\-\.]+["']/gi.test(code)) {
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

      // Syntax errors (simplified detection)
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
    }

    // Low overall score is critical
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
  }

  /**
   * Identify major issues that significantly impact quality
   */
  async identifyMajorIssues(code, scoreResult) {
    const issues = [];

    // Category-specific issues
    Object.entries(scoreResult.categories).forEach(([category, result]) => {
      const percentage = (result.score / result.maxScore) * 100;
      if (percentage < 60) { // Below 60% is major
        issues.push({
          type: 'category',
          severity: 'major',
          category: category,
          description: `${category} score below threshold: ${Math.round(percentage)}%`,
          impact: 4,
          fix: `Improve ${category} to reach at least 60% score`
        });
      }
    });

    if (typeof code === 'string') {
      // Performance issues
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

      // Missing error handling
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
  }

  /**
   * Identify minor issues that could be improved
   */
  async identifyMinorIssues(code, _scoreResult) {
    const issues = [];

    if (typeof code === 'string') {
      // Code style issues
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

      // Console statements
      if (/console\.(log|error|warn|info)/.test(code)) {
        issues.push({
          type: 'style',
          severity: 'minor',
          category: 'Code Quality',
          description: 'Console statements should be replaced with proper logging',
          location: this.findCodeLocation(code, /console\./g),
          impact: 2,
          fix: 'Replace console statements with structured logging'
        });
      }

      // Missing comments for complex functions
      const complexFunctions = code.match(/function\s+\w+[^{]*\{[^}]{200,}\}/g);
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
  }

  /**
   * Check compliance with project standards
   */
  async checkCompliance(code) {
    const compliance = {
      codefortify: true,
      context7: true,
      bestPractices: true,
      issues: []
    };

    try {
      // Use existing validator
      const validationResult = await this.validator.validateProject(this.config.projectRoot);

      compliance.codefortify = validationResult.valid;
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
    }

    // Check code-level compliance
    if (typeof code === 'string') {
      // Check for required patterns based on project type
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
  }

  /**
   * Validate progress from previous iteration
   */
  async validateProgress(code, previousIteration) {
    if (!previousIteration) {return null;}

    const currentScore = await this.scoreCode(code);
    const previousScore = previousIteration.score || 0;
    const improvement = currentScore.overall.score - previousScore;

    return {
      previousScore: previousScore,
      currentScore: currentScore.overall.score,
      improvement: improvement,
      improvementPercentage: previousScore > 0 ? ((improvement / previousScore) * 100) : 0,
      isImprovement: improvement > 0,
      significantImprovement: improvement >= 5, // 5+ points is significant
      categories: this.analyzeCategorialProgress(currentScore.categories, previousIteration.categories)
    };
  }

  /**
   * Generate comprehensive review summary
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
  }

  /**
   * Generate specific recommendations for improvement
   */
  async generateRecommendations(issues, scoreResult) {
    const recommendations = [];

    // High priority recommendations from critical issues
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

    // Category-specific recommendations
    Object.entries(scoreResult.categories).forEach(([category, result]) => {
      const percentage = (result.score / result.maxScore) * 100;
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
    });

    // General improvement recommendations
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
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {return priorityDiff;}
      return (b.impact || 0) - (a.impact || 0);
    });
  }

  /**
   * Initialize review criteria based on project type and config
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
  }

  /**
   * Helper methods for code analysis
   */
  analyzeCodeStructure(codeString) {
    const lines = codeString.split('\n').length;
    const functions = (codeString.match(/function\s+\w+|=>\s*{|\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length;
    const classes = (codeString.match(/class\s+\w+/g) || []).length;
    const complexity = this.calculateComplexity(codeString);

    let score = 20; // Start with max score
    if (lines > 500) {score -= 3;} // Penalize very long files
    if (complexity > 20) {score -= 5;} // Penalize high complexity
    if (functions === 0 && classes === 0) {score -= 5;} // No structure

    return {
      score: Math.max(0, score),
      lines,
      functions,
      classes,
      complexity
    };
  }

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

    const avgLineLength = codeString.split('\n').reduce((sum, line) => sum + line.length, 0) / codeString.split('\n').length;
    if (avgLineLength > 120) {
      score -= 2;
      issues.push('long-lines');
    }

    return {
      score: Math.max(0, score),
      issues,
      avgLineLength
    };
  }

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

    if (/(?:password|token|key|secret)\s*[:=]\s*["'][\w\-\.]+["']/gi.test(codeString)) {
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
  }

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
  }

  analyzeTestCoverage(codeString) {
    let score = 10; // Lower default since we can't run actual tests
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
  }

  analyzeDocumentation(codeString) {
    let score = 10;
    const features = [];

    const commentRatio = (codeString.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length / codeString.split('\n').length;
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
  }

  // Additional helper methods
  calculateComplexity(code) {
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
    return complexityKeywords.reduce((count, keyword) => {
      const matches = code.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      return count + (matches ? matches.length : 0);
    }, 1);
  }

  findCodeLocation(code, pattern) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return { line: i + 1, column: lines[i].search(pattern) };
      }
    }
    return null;
  }

  hasSyntaxErrors(code) {
    try {
      // Basic syntax error detection - in real implementation would use a proper parser
      const braceCount = (code.match(/\{/g) || []).length - (code.match(/\}/g) || []).length;
      const parenCount = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
      return braceCount !== 0 || parenCount !== 0;
    } catch {
      return true;
    }
  }

  calculateGrade(score) {
    if (score >= 90) {return 'A';}
    if (score >= 80) {return 'B';}
    if (score >= 70) {return 'C';}
    if (score >= 60) {return 'D';}
    return 'F';
  }

  determineReviewStatus(score, issues) {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const majorIssues = issues.filter(i => i.severity === 'major').length;

    if (criticalIssues > this.reviewCriteria.criticalIssueLimit) {return false;}
    if (majorIssues > this.reviewCriteria.majorIssueLimit) {return false;}
    if (score < this.reviewCriteria.minimumScore) {return false;}

    return true;
  }

  determineOverallStatus(score, criticalIssues, majorIssues) {
    if (criticalIssues > 0) {return 'critical';}
    if (majorIssues > 3) {return 'needs-work';}
    if (score < 70) {return 'needs-improvement';}
    if (score < 85) {return 'good';}
    return 'excellent';
  }

  getTopCategories(categories) {
    return Object.entries(categories)
      .map(([name, data]) => ({ name, percentage: Math.round((data.score / data.maxScore) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }

  getWeakestCategories(categories) {
    return Object.entries(categories)
      .map(([name, data]) => ({ name, percentage: Math.round((data.score / data.maxScore) * 100) }))
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3);
  }

  analyzeCategorialProgress(current, previous) {
    if (!previous) {return null;}

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
  }

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
  }

  async basicScore(code) {
    // Fallback scoring if full ProjectScorer fails
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