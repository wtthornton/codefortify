/**
 * Improvement Agent - Targeted fixes based on review and analysis feedback
 *
 * Applies intelligent targeted improvements based on:
 * - Review agent feedback and issues
 * - Analysis agent insights and recommendations
 * - Historical patterns of successful improvements
 * - Priority-based fix ordering for maximum impact
 */

export class ImprovementAgent {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      maxImprovements: config.maxImprovements || 15,
      priorityThreshold: config.priorityThreshold || 3, // Only apply improvements with priority >= 3
      ...config
    };

    this.improvementStrategies = this.initializeImprovementStrategies();
    this.appliedFixes = [];
  }

  /**
   * Main improvement method - applies targeted fixes based on feedback
   */
  async improve(code, reviewResult, analysisResult) {
    const startTime = Date.now();

    try {
      // Identify improvement opportunities from review and analysis
      const opportunities = await this.identifyImprovementOpportunities(reviewResult, analysisResult);

      // Prioritize and filter opportunities
      const prioritizedOpportunities = this.prioritizeImprovements(opportunities);

      // Apply improvements in priority order
      const improvements = await this.applyImprovements(code, prioritizedOpportunities);

      // Validate improvements don't break existing functionality
      const validation = await this.validateImprovements(improvements.code, code);

      const result = {
        code: improvements.code,
        fixes: improvements.fixes,
        validation: validation,
        opportunities: opportunities,
        applied: improvements.fixes.length,
        skipped: opportunities.length - improvements.fixes.length,
        duration: Date.now() - startTime,
        patterns: improvements.patterns || [],
        metadata: {
          maxImprovements: this.config.maxImprovements,
          priorityThreshold: this.config.priorityThreshold,
          successRate: improvements.fixes.filter(f => f.success).length / Math.max(improvements.fixes.length, 1)
        }
      };

      return result;

    } catch (error) {
      throw new Error(`Improvement failed: ${error.message}`);
    }
  }

  /**
   * Identify improvement opportunities from review and analysis results
   */
  async identifyImprovementOpportunities(reviewResult, analysisResult) {
    const opportunities = [];

    // From review issues
    if (reviewResult.issues) {
      reviewResult.issues.forEach(issue => {
        opportunities.push({
          source: 'review',
          type: 'issue-fix',
          category: issue.category,
          description: issue.description,
          fix: issue.fix,
          priority: this.mapSeverityToPriority(issue.severity),
          impact: issue.impact || 3,
          effort: this.estimateEffort(issue),
          location: issue.location,
          originalIssue: issue
        });
      });
    }

    // From review recommendations
    if (reviewResult.recommendations) {
      reviewResult.recommendations.forEach(rec => {
        opportunities.push({
          source: 'review-recommendation',
          type: 'enhancement',
          category: rec.category,
          description: rec.description,
          priority: this.mapPriorityToNumber(rec.priority),
          impact: rec.impact || 2,
          effort: rec.effort || 2,
          originalRecommendation: rec
        });
      });
    }

    // From analysis insights
    if (analysisResult.insights) {
      analysisResult.insights.forEach(insight => {
        if (insight.actionable) {
          opportunities.push({
            source: 'analysis-insight',
            type: 'insight-fix',
            category: insight.category,
            description: insight.description,
            priority: this.mapLevelToPriority(insight.level),
            impact: this.mapImpactToNumber(insight.impact),
            effort: 3, // Default effort for insights
            originalInsight: insight
          });
        }
      });
    }

    // From analysis recommendations
    if (analysisResult.recommendations) {
      analysisResult.recommendations.forEach(rec => {
        opportunities.push({
          source: 'analysis-recommendation',
          type: 'optimization',
          category: rec.category,
          description: rec.description,
          priority: this.mapPriorityToNumber(rec.priority),
          impact: rec.impact || 2,
          effort: rec.effort || 2,
          originalRecommendation: rec
        });
      });
    }

    // From technical debt analysis
    if (analysisResult.technicalDebt?.recommendations) {
      analysisResult.technicalDebt.recommendations.forEach(rec => {
        opportunities.push({
          source: 'debt-reduction',
          type: 'debt-fix',
          category: 'Technical Debt',
          description: rec.description,
          priority: 4, // Technical debt is generally high priority
          impact: rec.impact || 4,
          effort: rec.effort || 3,
          originalRecommendation: rec
        });
      });
    }

    return opportunities;
  }

  /**
   * Prioritize improvements based on impact, effort, and priority
   */
  prioritizeImprovements(opportunities) {
    // Calculate priority score: (impact * priority) / effort
    const scoredOpportunities = opportunities.map(opp => ({
      ...opp,
      priorityScore: (opp.impact * opp.priority) / Math.max(opp.effort, 0.5)
    }));

    // Sort by priority score (descending) and filter by threshold
    return scoredOpportunities
      .filter(opp => opp.priority >= this.config.priorityThreshold)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, this.config.maxImprovements);
  }

  /**
   * Apply improvements to code
   */
  async applyImprovements(code, opportunities) {
    let improvedCode = code;
    const fixes = [];
    const patterns = [];

    for (const opportunity of opportunities) {
      try {
        const fix = await this.applyImprovement(improvedCode, opportunity);

        if (fix.success) {
          improvedCode = fix.code;
          fixes.push({
            type: opportunity.type,
            category: opportunity.category,
            description: opportunity.description,
            applied: true,
            success: true,
            changes: fix.changes || [],
            linesAffected: fix.linesAffected || 0,
            impact: opportunity.impact,
            source: opportunity.source
          });

          // Track patterns for learning
          if (fix.pattern) {
            patterns.push({
              type: opportunity.type,
              success: true,
              effectiveness: fix.effectiveness || 0.8,
              context: opportunity.category
            });
          }
        } else {
          fixes.push({
            type: opportunity.type,
            category: opportunity.category,
            description: opportunity.description,
            applied: false,
            success: false,
            error: fix.error,
            source: opportunity.source
          });
        }
      } catch (error) {
        fixes.push({
          type: opportunity.type,
          category: opportunity.category,
          description: opportunity.description,
          applied: false,
          success: false,
          error: error.message,
          source: opportunity.source
        });
      }
    }

    return {
      code: improvedCode,
      fixes,
      patterns
    };
  }

  /**
   * Apply a single improvement
   */
  async applyImprovement(code, opportunity) {
    const strategy = this.improvementStrategies[opportunity.type];

    if (!strategy) {
      return {
        success: false,
        error: `No improvement strategy for type: ${opportunity.type}`,
        code: code
      };
    }

    return await strategy.call(this, code, opportunity);
  }

  /**
   * Initialize improvement strategies
   */
  initializeImprovementStrategies() {
    return {
      'issue-fix': this.applyIssueFix.bind(this),
      'enhancement': this.applyEnhancement.bind(this),
      'insight-fix': this.applyInsightFix.bind(this),
      'optimization': this.applyOptimization.bind(this),
      'debt-fix': this.applyDebtFix.bind(this),
      'security-fix': this.applySecurityFix.bind(this),
      'performance-fix': this.applyPerformanceFix.bind(this),
      'quality-fix': this.applyQualityFix.bind(this)
    };
  }

  /**
   * Apply issue fix based on review feedback
   */
  async applyIssueFix(code, opportunity) {
    let improvedCode = code;
    const changes = [];
    let linesAffected = 0;

    try {
      const issue = opportunity.originalIssue;

      if (issue.type === 'security') {
        return await this.applySecurityFix(code, opportunity);
      } else if (issue.type === 'performance') {
        return await this.applyPerformanceFix(code, opportunity);
      } else if (issue.type === 'quality') {
        return await this.applyQualityFix(code, opportunity);
      }

      // Generic issue fixes
      if (issue.fix && typeof code === 'string') {
        // Apply specific fix if provided
        if (issue.description.includes('syntax errors')) {
          // Basic syntax error fixes
          improvedCode = this.fixCommonSyntaxErrors(code);
          changes.push('Fixed common syntax errors');
          linesAffected = this.countChangedLines(code, improvedCode);
        } else if (issue.description.includes('missing error handling')) {
          improvedCode = this.addBasicErrorHandling(code);
          changes.push('Added error handling');
          linesAffected = this.countChangedLines(code, improvedCode);
        }
      }

      return {
        success: changes.length > 0,
        code: improvedCode,
        changes,
        linesAffected,
        effectiveness: changes.length > 0 ? 0.8 : 0,
        pattern: changes.length > 0
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: code
      };
    }
  }

  /**
   * Apply enhancement based on recommendations
   */
  async applyEnhancement(code, opportunity) {
    let improvedCode = code;
    const changes = [];
    let linesAffected = 0;

    if (typeof code !== 'string') {
      return { success: false, error: 'Cannot enhance non-string code', code };
    }

    try {
      // Apply enhancements based on category
      if (opportunity.category === 'Code Quality') {
        // Modern JavaScript improvements
        if (improvedCode.includes('var ')) {
          improvedCode = improvedCode.replace(/\bvar\s+/g, 'let ');
          changes.push('Replaced var with let');
        }

        // Strict equality
        improvedCode = improvedCode.replace(/==\s*(?=true|false|null|undefined)/g, '===');
        if (improvedCode !== code && !changes.includes('strict equality')) {
          changes.push('Applied strict equality');
        }
      }

      if (opportunity.category === 'Performance') {
        // Cache DOM queries
        improvedCode = improvedCode.replace(
          /(document\.getElementById\([^)]+\))/g,
          'const cachedElement = $1; // PERFORMANCE: Cached DOM query'
        );
        if (improvedCode !== code && !changes.includes('cached DOM')) {
          changes.push('Cached DOM queries');
        }
      }

      linesAffected = this.countChangedLines(code, improvedCode);

      return {
        success: changes.length > 0,
        code: improvedCode,
        changes,
        linesAffected,
        effectiveness: 0.7,
        pattern: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: code
      };
    }
  }

  /**
   * Apply fix based on analysis insights
   */
  async applyInsightFix(code, opportunity) {
    const insight = opportunity.originalInsight;
    let improvedCode = code;
    const changes = [];

    try {
      if (insight.type === 'patterns' && insight.title.includes('Anti-patterns')) {
        // Fix common anti-patterns
        if (typeof code === 'string') {
          // Fix callback hell with async/await
          if (code.includes('.then(') && code.match(/\.then\(/g)?.length >= 3) {
            improvedCode = `// IMPROVEMENT: Consider refactoring promise chains to async/await\n${code}`;
            changes.push('Marked promise chain for async/await refactoring');
          }

          // Fix deeply nested conditions
          if (code.match(/if\s*\([^}]*if\s*\([^}]*if\s*\(/)) {
            improvedCode = code.replace(/if\s*\(/g, '// IMPROVEMENT: Consider extracting to separate functions\nif (');
            changes.push('Marked nested conditions for extraction');
          }
        }
      }

      return {
        success: changes.length > 0,
        code: improvedCode,
        changes,
        linesAffected: this.countChangedLines(code, improvedCode),
        effectiveness: 0.6,
        pattern: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: code
      };
    }
  }

  /**
   * Apply optimization improvements
   */
  async applyOptimization(code, opportunity) {
    if (typeof code !== 'string') {
      return { success: false, error: 'Cannot optimize non-string code', code };
    }

    let improvedCode = code;
    const changes = [];

    try {
      // Performance optimizations
      if (opportunity.category === 'Performance') {
        // Optimize array operations
        if (code.includes('for') && code.includes('.length')) {
          improvedCode = improvedCode.replace(
            /for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.length/g,
            'for (let $1 = 0, len = $2.length; $1 < len'
          );
          changes.push('Optimized array loop by caching length');
        }

        // Add React optimizations
        if (code.includes('React') && !code.includes('useMemo')) {
          improvedCode = `import React, { useMemo, useCallback } from 'react';\n// OPTIMIZATION: Consider using useMemo and useCallback for performance\n${improvedCode}`;
          changes.push('Added performance optimization imports and suggestions');
        }
      }

      return {
        success: changes.length > 0,
        code: improvedCode,
        changes,
        linesAffected: this.countChangedLines(code, improvedCode),
        effectiveness: 0.8,
        pattern: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: code
      };
    }
  }

  /**
   * Apply technical debt fixes
   */
  async applyDebtFix(code, opportunity) {
    if (typeof code !== 'string') {
      return { success: false, error: 'Cannot fix debt in non-string code', code };
    }

    let improvedCode = code;
    const changes = [];

    try {
      // Code debt fixes
      if (opportunity.description.includes('complexity')) {
        improvedCode = `// DEBT FIX: High complexity detected - consider breaking into smaller functions\n${code}`;
        changes.push('Added complexity reduction suggestion');
      }

      if (opportunity.description.includes('documentation')) {
        // Add basic JSDoc structure
        improvedCode = improvedCode.replace(
          /(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>)/g,
          '/**\n * TODO: Add function documentation\n */\n$1'
        );
        changes.push('Added JSDoc templates for undocumented functions');
      }

      return {
        success: changes.length > 0,
        code: improvedCode,
        changes,
        linesAffected: this.countChangedLines(code, improvedCode),
        effectiveness: 0.7,
        pattern: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: code
      };
    }
  }

  /**
   * Apply security fixes
   */
  async applySecurityFix(code, _opportunity) {
    if (typeof code !== 'string') {
      return { success: false, error: 'Cannot fix security issues in non-string code', code };
    }

    let improvedCode = code;
    const changes = [];

    try {
      // Fix eval usage
      if (code.includes('eval(')) {
        improvedCode = improvedCode.replace(/eval\s*\(/g, '// SECURITY FIX: eval() is dangerous, use JSON.parse() or safer alternatives\n// JSON.parse(');
        changes.push('Marked dangerous eval() usage for replacement');
      }

      // Fix innerHTML usage
      if (code.includes('innerHTML')) {
        improvedCode = improvedCode.replace(
          /(\w+)\.innerHTML\s*=/g,
          '$1.textContent = // SECURITY FIX: Changed from innerHTML to prevent XSS\n// $1.innerHTML ='
        );
        changes.push('Replaced innerHTML with textContent to prevent XSS');
      }

      // Fix hardcoded secrets
      if (code.match(/(?:password|token|key|secret)\s*[:=]\s*["'][\w-.]+["']/gi)) {
        improvedCode = improvedCode.replace(
          /(?:password|token|key|secret)\s*[:=]\s*["']([\w-.]+)["']/gi,
          (match) => `${match.split('=')[0]}= process.env.SECRET_VALUE; // SECURITY FIX: Use environment variable`
        );
        changes.push('Replaced hardcoded secrets with environment variable references');
      }

      return {
        success: changes.length > 0,
        code: improvedCode,
        changes,
        linesAffected: this.countChangedLines(code, improvedCode),
        effectiveness: 0.9,
        pattern: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: code
      };
    }
  }

  /**
   * Apply performance fixes
   */
  async applyPerformanceFix(code, _opportunity) {
    if (typeof code !== 'string') {
      return { success: false, error: 'Cannot fix performance issues in non-string code', code };
    }

    let improvedCode = code;
    const changes = [];

    try {
      // Cache DOM queries
      if (code.includes('document.getElementById') || code.includes('querySelector')) {
        improvedCode = improvedCode.replace(
          /(document\.(?:getElementById|querySelector)\([^)]+\))/g,
          '// PERFORMANCE FIX: Consider caching this DOM query\nconst cachedElement = $1'
        );
        changes.push('Added DOM query caching suggestions');
      }

      // Optimize loops
      if (code.match(/for\s*\([^)]*\.length[^)]*\)/)) {
        improvedCode = improvedCode.replace(
          /for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*([^;]+)\.length/g,
          'for (let $1 = 0, len = $2.length; $1 < len'
        );
        changes.push('Cached array length in loops for performance');
      }

      return {
        success: changes.length > 0,
        code: improvedCode,
        changes,
        linesAffected: this.countChangedLines(code, improvedCode),
        effectiveness: 0.8,
        pattern: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: code
      };
    }
  }

  /**
   * Apply code quality fixes
   */
  async applyQualityFix(code, _opportunity) {
    if (typeof code !== 'string') {
      return { success: false, error: 'Cannot fix quality issues in non-string code', code };
    }

    let improvedCode = code;
    const changes = [];

    try {
      // Fix var usage
      if (code.includes('var ')) {
        improvedCode = improvedCode.replace(/\bvar\s+/g, 'let ');
        changes.push('Replaced var with let for better scoping');
      }

      // Fix loose equality
      if (code.match(/==\s*(?:true|false|null|undefined)/)) {
        improvedCode = improvedCode.replace(/==\s*(?=true|false|null|undefined)/g, '===');
        changes.push('Applied strict equality for better type safety');
      }

      // Fix console statements
      if (code.includes('console.')) {
        improvedCode = improvedCode.replace(
          /console\.(log|error|warn|info)\(/g,
          '// QUALITY FIX: Replace with proper logging\n// logger.$1('
        );
        changes.push('Marked console statements for proper logging replacement');
      }

      return {
        success: changes.length > 0,
        code: improvedCode,
        changes,
        linesAffected: this.countChangedLines(code, improvedCode),
        effectiveness: 0.7,
        pattern: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: code
      };
    }
  }

  /**
   * Validate that improvements don't break existing functionality
   */
  async validateImprovements(improvedCode, originalCode) {
    const validation = {
      passed: true,
      issues: [],
      syntaxValid: true,
      structurePreserved: true,
      regressionRisk: 'low'
    };

    try {
      // Basic syntax validation
      if (typeof improvedCode === 'string' && typeof originalCode === 'string') {
        // Check for balanced braces and parentheses
        const originalBraces = (originalCode.match(/[{}]/g) || []).length;
        const improvedBraces = (improvedCode.match(/[{}]/g) || []).length;
        const originalParens = (originalCode.match(/[()]/g) || []).length;
        const improvedParens = (improvedCode.match(/[()]/g) || []).length;

        if (Math.abs(originalBraces - improvedBraces) > 2) {
          validation.syntaxValid = false;
          validation.issues.push('Brace balance changed significantly');
        }

        if (Math.abs(originalParens - improvedParens) > 2) {
          validation.syntaxValid = false;
          validation.issues.push('Parentheses balance changed significantly');
        }

        // Check if core structure is preserved
        const originalFunctions = (originalCode.match(/function\s+\w+|=>/g) || []).length;
        const improvedFunctions = (improvedCode.match(/function\s+\w+|=>/g) || []).length;

        if (Math.abs(originalFunctions - improvedFunctions) > 1) {
          validation.structurePreserved = false;
          validation.issues.push('Function count changed significantly');
        }

        // Assess regression risk
        const changeRatio = Math.abs(improvedCode.length - originalCode.length) / originalCode.length;
        if (changeRatio > 0.5) {
          validation.regressionRisk = 'high';
        } else if (changeRatio > 0.2) {
          validation.regressionRisk = 'medium';
        }
      }

      validation.passed = validation.syntaxValid && validation.structurePreserved && validation.regressionRisk !== 'high';

    } catch (error) {
      validation.passed = false;
      validation.issues.push(`Validation error: ${error.message}`);
    }

    return validation;
  }

  /**
   * Helper methods
   */
  mapSeverityToPriority(severity) {
    const mapping = { critical: 5, major: 4, minor: 2 };
    return mapping[severity] || 3;
  }

  mapPriorityToNumber(priority) {
    const mapping = { high: 5, medium: 3, low: 1 };
    return mapping[priority] || 3;
  }

  mapLevelToPriority(level) {
    const mapping = { critical: 5, warning: 4, info: 2, success: 1 };
    return mapping[level] || 3;
  }

  mapImpactToNumber(impact) {
    if (typeof impact === 'number') {return impact;}
    const mapping = { critical: 5, high: 4, medium: 3, low: 2 };
    return mapping[impact] || 3;
  }

  estimateEffort(issue) {
    const effortMap = {
      'syntax': 1,
      'style': 1,
      'security': 4,
      'performance': 3,
      'quality': 2,
      'category': 3,
      'documentation': 2,
      'error-handling': 2
    };
    return effortMap[issue.type] || 2;
  }

  countChangedLines(original, improved) {
    if (typeof original !== 'string' || typeof improved !== 'string') {return 0;}

    const originalLines = original.split('\n');
    const improvedLines = improved.split('\n');
    const maxLines = Math.max(originalLines.length, improvedLines.length);

    let changedLines = 0;
    for (let i = 0; i < maxLines; i++) {
      if ((originalLines[i] || '') !== (improvedLines[i] || '')) {
        changedLines++;
      }
    }

    return changedLines;
  }

  fixCommonSyntaxErrors(code) {
    let fixed = code;

    // Fix missing semicolons (basic heuristic)
    fixed = fixed.replace(/(\w+\s*=\s*[^;{\n]+)(\n)/g, '$1;$2');

    // Fix common missing quotes
    fixed = fixed.replace(/=\s*([a-zA-Z_]\w*)\s*(?=[,\]};\n])/g, '="$1"');

    return fixed;
  }

  addBasicErrorHandling(code) {
    // Add try-catch around async operations
    if (code.includes('await') && !code.includes('try')) {
      return `try {\n${code}\n} catch (error) {\n  console.error('Error:', error);\n  throw error;\n}`;
    }

    if (code.includes('.then(') && !code.includes('.catch(')) {
      return `${code}\n.catch(error => {\n  console.error('Promise error:', error);\n  throw error;\n});`;
    }

    return code;
  }
}