/**
 * Enhancement Agent - Automatically improves code quality
 *
 * Applies intelligent enhancements to code including:
 * - Security vulnerability fixes
 * - Performance optimizations
 * - Code quality improvements
 * - Pattern recognition and application
 * - Best practice enforcement
 */

import { ProjectScorer } from '../scoring/ProjectScorer.js';
import { PatternProvider } from '../server/PatternProvider.js';
import { PerformanceMonitor } from '../scoring/core/PerformanceMonitor.js';

export class EnhancementAgent {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      maxEnhancements: config.maxEnhancements || 10,
      aggressiveness: config.aggressiveness || 'moderate', // conservative, moderate, aggressive
      ...config
    };

    this.scorer = new ProjectScorer(this.config);
    this.patternProvider = new PatternProvider(this.config);
    this.performanceMonitor = new PerformanceMonitor();

    this.enhancementRules = this.initializeEnhancementRules();
  }

  /**
   * Main enhancement method - analyzes and improves code
   */
  async enhance(code) {
    const startTime = Date.now();

    try {
      // Initial analysis to understand current state
      const initialAnalysis = await this.analyzeCode(code);

      // Identify enhancement opportunities
      const opportunities = await this.identifyEnhancements(code, initialAnalysis);

      // Apply enhancements in priority order
      const enhancements = await this.applyEnhancements(code, opportunities);

      // Track patterns learned
      const patterns = await this.extractPatterns(enhancements);

      const result = {
        code: enhancements.code,
        improvements: enhancements.improvements,
        patterns: patterns,
        analysis: initialAnalysis,
        opportunities: opportunities.filter(o => !o.applied), // Remaining opportunities
        duration: Date.now() - startTime,
        tokenUsage: enhancements.tokenUsage || {},
        metadata: {
          aggressiveness: this.config.aggressiveness,
          enhancementsApplied: enhancements.improvements.length,
          patternsLearned: patterns.length
        }
      };

      return result;

    } catch (error) {
      throw new Error(`Enhancement failed: ${error.message}`);
    }
  }

  /**
   * Analyze code to understand current quality and structure
   */
  async analyzeCode(code) {
    // Use existing scoring system for initial analysis
    const analysis = {
      type: await this.detectCodeType(code),
      structure: await this.analyzeStructure(code),
      quality: await this.analyzeQuality(code),
      security: await this.analyzeSecurity(code),
      performance: await this.analyzePerformance(code),
      patterns: await this.identifyExistingPatterns(code)
    };

    return analysis;
  }

  /**
   * Identify specific enhancement opportunities
   */
  async identifyEnhancements(code, analysis) {
    const opportunities = [];

    // Security enhancements
    opportunities.push(...await this.identifySecurityEnhancements(code, analysis));

    // Performance enhancements
    opportunities.push(...await this.identifyPerformanceEnhancements(code, analysis));

    // Quality enhancements
    opportunities.push(...await this.identifyQualityEnhancements(code, analysis));

    // Pattern-based enhancements
    opportunities.push(...await this.identifyPatternEnhancements(code, analysis));

    // Sort by priority (impact vs effort)
    return opportunities.sort((a, b) => {
      const scoreA = (a.impact || 1) / Math.max(a.effort || 1, 0.1);
      const scoreB = (b.impact || 1) / Math.max(b.effort || 1, 0.1);
      return scoreB - scoreA;
    }).slice(0, this.config.maxEnhancements);
  }

  /**
   * Apply enhancements to code
   */
  async applyEnhancements(code, opportunities) {
    let enhancedCode = code;
    const improvements = [];
    const tokenUsage = { input: 0, output: 0, total: 0 };

    for (const opportunity of opportunities) {
      try {
        const enhancement = await this.applyEnhancement(enhancedCode, opportunity);

        if (enhancement.success) {
          enhancedCode = enhancement.code;
          improvements.push({
            type: opportunity.type,
            category: opportunity.category,
            description: opportunity.description,
            impact: opportunity.impact,
            applied: true,
            changes: enhancement.changes || []
          });

          // Track token usage if available
          if (enhancement.tokenUsage) {
            tokenUsage.input += enhancement.tokenUsage.input || 0;
            tokenUsage.output += enhancement.tokenUsage.output || 0;
          }

          opportunity.applied = true;
        }
      } catch (error) {
        // Log error but continue with other enhancements
        improvements.push({
          type: opportunity.type,
          category: opportunity.category,
          description: opportunity.description,
          applied: false,
          error: error.message
        });
      }
    }

    tokenUsage.total = tokenUsage.input + tokenUsage.output;

    return {
      code: enhancedCode,
      improvements,
      tokenUsage
    };
  }

  /**
   * Apply a single enhancement
   */
  async applyEnhancement(code, opportunity) {
    const enhancementMethod = this.enhancementRules[opportunity.type];

    if (!enhancementMethod) {
      throw new Error(`No enhancement method for type: ${opportunity.type}`);
    }

    return await enhancementMethod.call(this, code, opportunity);
  }

  /**
   * Initialize enhancement rule methods
   */
  initializeEnhancementRules() {
    return {
      'security-fix': this.applySecurityFix.bind(this),
      'performance-optimization': this.applyPerformanceOptimization.bind(this),
      'code-quality': this.applyQualityImprovement.bind(this),
      'pattern-application': this.applyPatternImprovement.bind(this),
      'error-handling': this.applyErrorHandling.bind(this),
      'type-safety': this.applyTypeSafety.bind(this),
      'modern-syntax': this.applyModernSyntax.bind(this),
      'accessibility': this.applyAccessibilityFix.bind(this)
    };
  }

  /**
   * Security enhancement implementations
   */
  async identifySecurityEnhancements(code, analysis) {
    const enhancements = [];

    // Check for common security issues
    const securityChecks = [
      {
        pattern: /eval\s*\(/g,
        type: 'security-fix',
        category: 'security',
        description: 'Remove dangerous eval() usage',
        impact: 5,
        effort: 2
      },
      {
        pattern: /innerHTML\s*=/g,
        type: 'security-fix',
        category: 'security',
        description: 'Replace innerHTML with safer alternatives',
        impact: 4,
        effort: 2
      },
      {
        pattern: /document\.write\s*\(/g,
        type: 'security-fix',
        category: 'security',
        description: 'Replace document.write with safer methods',
        impact: 4,
        effort: 2
      },
      {
        pattern: /(?:password|token|key|secret)\s*[:=]\s*["'][\w\-\.]+["']/gi,
        type: 'security-fix',
        category: 'security',
        description: 'Remove hardcoded secrets and credentials',
        impact: 5,
        effort: 3
      }
    ];

    for (const check of securityChecks) {
      if (check.pattern.test(code)) {
        enhancements.push({
          ...check,
          matches: code.match(check.pattern) || []
        });
      }
    }

    return enhancements;
  }

  /**
   * Performance enhancement implementations
   */
  async identifyPerformanceEnhancements(code, analysis) {
    const enhancements = [];

    const performanceChecks = [
      {
        pattern: /document\.getElementById\([^)]+\)/g,
        type: 'performance-optimization',
        category: 'performance',
        description: 'Cache DOM queries to avoid repeated lookups',
        impact: 3,
        effort: 1
      },
      {
        pattern: /for\s*\([^)]*\.length[^)]*\)/g,
        type: 'performance-optimization',
        category: 'performance',
        description: 'Cache array length in loops',
        impact: 2,
        effort: 1
      },
      {
        pattern: /(?:useEffect|componentDidUpdate)[\s\S]*?(?:setState|set\w+)\(/g,
        type: 'performance-optimization',
        category: 'performance',
        description: 'Optimize React re-renders with proper dependencies',
        impact: 4,
        effort: 3
      }
    ];

    for (const check of performanceChecks) {
      if (check.pattern.test(code)) {
        enhancements.push(check);
      }
    }

    return enhancements;
  }

  /**
   * Code quality enhancement implementations
   */
  async identifyQualityEnhancements(code, analysis) {
    const enhancements = [];

    const qualityChecks = [
      {
        pattern: /var\s+\w+/g,
        type: 'modern-syntax',
        category: 'quality',
        description: 'Replace var with let/const for better scoping',
        impact: 2,
        effort: 1
      },
      {
        pattern: /function\s*\([^)]*\)\s*\{[\s\S]*?(?:return[\s\S]*?)?\}/g,
        type: 'modern-syntax',
        category: 'quality',
        description: 'Convert to arrow functions where appropriate',
        impact: 2,
        effort: 2
      },
      {
        pattern: /console\.(log|error|warn|info)\(/g,
        type: 'code-quality',
        category: 'quality',
        description: 'Replace console statements with proper logging',
        impact: 3,
        effort: 2
      },
      {
        pattern: /==\s*(?:true|false|null|undefined)/g,
        type: 'code-quality',
        category: 'quality',
        description: 'Use strict equality (===) for better type safety',
        impact: 2,
        effort: 1
      }
    ];

    for (const check of qualityChecks) {
      if (check.pattern.test(code)) {
        enhancements.push(check);
      }
    }

    return enhancements;
  }

  /**
   * Pattern-based enhancement implementations
   */
  async identifyPatternEnhancements(code, analysis) {
    const enhancements = [];

    try {
      // Get patterns from the pattern provider based on project type
      const availablePatterns = await this.patternProvider.generatePattern(
        this.config.projectType,
        'component'
      );

      // Check if code could benefit from known patterns
      if (this.config.projectType === 'react-webapp') {
        // Check for React-specific patterns
        if (!/import.*useState.*from\s+['"]react['"]/.test(code) && /function\s+\w+.*\{/.test(code)) {
          enhancements.push({
            type: 'pattern-application',
            category: 'patterns',
            description: 'Apply React hooks pattern for state management',
            impact: 4,
            effort: 3
          });
        }

        if (!/useEffect/.test(code) && /(componentDidMount|componentDidUpdate)/.test(code)) {
          enhancements.push({
            type: 'pattern-application',
            category: 'patterns',
            description: 'Convert class component lifecycle to hooks',
            impact: 4,
            effort: 4
          });
        }
      }

    } catch (error) {
      // Pattern analysis failed, continue without pattern enhancements
    }

    return enhancements;
  }

  /**
   * Apply security fix enhancement
   */
  async applySecurityFix(code, opportunity) {
    let enhancedCode = code;
    const changes = [];

    if (opportunity.description.includes('eval()')) {
      // Replace eval with safer alternatives
      enhancedCode = enhancedCode.replace(/eval\s*\(/g, '// SECURITY FIX: eval replaced\n// JSON.parse(');
      changes.push('Replaced dangerous eval() calls');
    }

    if (opportunity.description.includes('innerHTML')) {
      // Replace innerHTML with textContent where possible
      enhancedCode = enhancedCode.replace(
        /(\w+)\.innerHTML\s*=\s*([^;]+);/g,
        '$1.textContent = $2; // SECURITY FIX: Changed from innerHTML'
      );
      changes.push('Replaced innerHTML with textContent for XSS protection');
    }

    if (opportunity.description.includes('hardcoded secrets')) {
      // Replace hardcoded secrets with environment variables
      enhancedCode = enhancedCode.replace(
        /(?:password|token|key|secret)\s*[:=]\s*["']([\w\-\.]+)["']/gi,
        (match, value) => {
          changes.push(`Replaced hardcoded secret: ${value.slice(0, 4)}...`);
          return match.replace(value, 'process.env.SECRET_VALUE // SECURITY FIX: Use environment variable');
        }
      );
    }

    return {
      success: true,
      code: enhancedCode,
      changes
    };
  }

  /**
   * Apply performance optimization enhancement
   */
  async applyPerformanceOptimization(code, opportunity) {
    let enhancedCode = code;
    const changes = [];

    if (opportunity.description.includes('Cache DOM queries')) {
      // Add caching for DOM queries
      enhancedCode = enhancedCode.replace(
        /(document\.getElementById\([^)]+\))/g,
        '// PERFORMANCE: Consider caching this DOM query\nconst cachedElement = $1'
      );
      changes.push('Added DOM query caching suggestions');
    }

    if (opportunity.description.includes('Cache array length')) {
      // Cache array length in loops
      enhancedCode = enhancedCode.replace(
        /for\s*\(([^;]*);([^;]*\.length[^;]*);([^)]*)\)/g,
        'for (let i = 0, len = arr.length; i < len; i++) // PERFORMANCE: Cached length'
      );
      changes.push('Optimized loop by caching array length');
    }

    return {
      success: true,
      code: enhancedCode,
      changes
    };
  }

  /**
   * Apply code quality improvement
   */
  async applyQualityImprovement(code, opportunity) {
    let enhancedCode = code;
    const changes = [];

    if (opportunity.description.includes('strict equality')) {
      enhancedCode = enhancedCode.replace(/==\s*(?=true|false|null|undefined)/g, '===');
      changes.push('Replaced loose equality with strict equality');
    }

    if (opportunity.description.includes('console statements')) {
      enhancedCode = enhancedCode.replace(
        /console\.(log|error|warn|info)\(/g,
        '// TODO: Replace with proper logging\n// logger.$1('
      );
      changes.push('Marked console statements for proper logging replacement');
    }

    return {
      success: true,
      code: enhancedCode,
      changes
    };
  }

  /**
   * Apply pattern improvement
   */
  async applyPatternImprovement(code, opportunity) {
    let enhancedCode = code;
    const changes = [];

    // Pattern applications would be more complex - this is a simplified version
    if (opportunity.description.includes('React hooks')) {
      enhancedCode = `// PATTERN: React hooks pattern applied\nimport React, { useState, useEffect } from 'react';\n\n${enhancedCode}`;
      changes.push('Applied React hooks pattern');
    }

    return {
      success: true,
      code: enhancedCode,
      changes
    };
  }

  /**
   * Apply error handling enhancement
   */
  async applyErrorHandling(code, opportunity) {
    let enhancedCode = code;
    const changes = [];

    // Add basic try-catch patterns where missing
    if (!/try\s*\{/.test(code) && /(async|await|fetch|\.then)/.test(code)) {
      enhancedCode = `try {\n${code}\n} catch (error) {\n  console.error('Error:', error);\n  throw error;\n}`;
      changes.push('Added error handling wrapper');
    }

    return {
      success: true,
      code: enhancedCode,
      changes
    };
  }

  /**
   * Apply type safety enhancement
   */
  async applyTypeSafety(code, opportunity) {
    // Simplified type safety improvements
    return {
      success: true,
      code: code,
      changes: ['Type safety improvements would be applied here']
    };
  }

  /**
   * Apply modern syntax enhancement
   */
  async applyModernSyntax(code, opportunity) {
    let enhancedCode = code;
    const changes = [];

    if (opportunity.description.includes('var with let/const')) {
      enhancedCode = enhancedCode.replace(/var\s+(\w+)/g, 'let $1');
      changes.push('Replaced var with let for better scoping');
    }

    return {
      success: true,
      code: enhancedCode,
      changes
    };
  }

  /**
   * Apply accessibility fix
   */
  async applyAccessibilityFix(code, opportunity) {
    let enhancedCode = code;
    const changes = [];

    // Add basic accessibility improvements for React/HTML
    if (/<img\s[^>]*(?!alt=)[^>]*>/g.test(code)) {
      enhancedCode = enhancedCode.replace(/<img\s([^>]*)>/g, '<img $1 alt="Descriptive alt text" />');
      changes.push('Added missing alt attributes to images');
    }

    return {
      success: true,
      code: enhancedCode,
      changes
    };
  }

  /**
   * Helper methods for code analysis
   */
  async detectCodeType(code) {
    if (code.includes('import React') || code.includes('from \'react\'')) {return 'react';}
    if (code.includes('Vue.') || code.includes('export default {')) {return 'vue';}
    if (code.includes('express') || code.includes('app.get')) {return 'node';}
    return 'javascript';
  }

  async analyzeStructure(code) {
    return {
      lines: code.split('\n').length,
      functions: (code.match(/function\s+\w+/g) || []).length + (code.match(/\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length,
      classes: (code.match(/class\s+\w+/g) || []).length,
      imports: (code.match(/import\s+.*from/g) || []).length
    };
  }

  async analyzeQuality(code) {
    return {
      complexity: this.calculateComplexity(code),
      maintainability: this.calculateMaintainability(code),
      readability: this.calculateReadability(code)
    };
  }

  async analyzeSecurity(code) {
    const issues = [];
    if (/eval\s*\(/.test(code)) {issues.push('eval-usage');}
    if (/innerHTML\s*=/.test(code)) {issues.push('innerHTML-xss');}
    if (/(?:password|token|key)\s*[:=]\s*["']/.test(code)) {issues.push('hardcoded-secrets');}
    return { issues, count: issues.length };
  }

  async analyzePerformance(code) {
    const issues = [];
    if (/(document\.getElementById|querySelector).*\)/g.test(code)) {issues.push('uncached-dom-queries');}
    if (/for\s*\([^)]*\.length[^)]*\)/.test(code)) {issues.push('uncached-array-length');}
    return { issues, count: issues.length };
  }

  async identifyExistingPatterns(code) {
    const patterns = [];
    if (/useState|useEffect/.test(code)) {patterns.push('react-hooks');}
    if (/class\s+\w+\s+extends\s+Component/.test(code)) {patterns.push('react-class-component');}
    if (/export\s+default\s+\{/.test(code)) {patterns.push('vue-options-api');}
    return patterns;
  }

  async extractPatterns(enhancements) {
    return enhancements.improvements
      .filter(imp => imp.type === 'pattern-application' && imp.applied)
      .map(imp => ({
        type: 'enhancement-pattern',
        description: imp.description,
        effectiveness: 1.0, // Will be updated based on success
        context: { category: imp.category }
      }));
  }

  calculateComplexity(code) {
    // Simplified cyclomatic complexity
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
    return complexityKeywords.reduce((count, keyword) => {
      const matches = code.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      return count + (matches ? matches.length : 0);
    }, 1);
  }

  calculateMaintainability(code) {
    const lines = code.split('\n').length;
    const complexity = this.calculateComplexity(code);
    return Math.max(0, 100 - (complexity * 2) - (lines / 10));
  }

  calculateReadability(code) {
    const avgLineLength = code.split('\n').reduce((sum, line) => sum + line.length, 0) / code.split('\n').length;
    const commentRatio = (code.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || []).length / code.split('\n').length;
    return Math.max(0, 100 - (avgLineLength / 2) + (commentRatio * 20));
  }
}