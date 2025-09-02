/**
 * Auto Refactor Suggestions - Intelligent refactoring recommendations
 *
 * Provides specific, actionable refactoring suggestions for large files
 * and complex patterns to help developers maintain healthy codebases.
 */

import fs from 'fs/promises';
import path from 'path';

export class AutoRefactorSuggestions {
  constructor(config = {}) {
    this.config = {
      targetFileSize: config.targetFileSize || 250, // Target lines per file
      maxMethodsPerClass: config.maxMethodsPerClass || 12,
      maxClassesPerFile: config.maxClassesPerFile || 2,
      suggestionsLimit: config.suggestionsLimit || 10,
      ...config
    };
  }

  /**
   * Generate comprehensive refactoring plan for a large file
   */
  async generateRefactoringPlan(filePath, options = {}) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const analysis = await this.analyzeFile(content, filePath);

      const plan = {
        filePath,
        currentSize: analysis.lines,
        targetSize: this.config.targetFileSize,
        priority: this.calculatePriority(analysis),
        refactorings: [],
        estimatedEffort: 'medium',
        benefits: []
      };

      // Generate specific refactoring strategies
      plan.refactorings.push(...this.generateSplittingStrategies(analysis));
      plan.refactorings.push(...this.generateMethodExtractions(analysis));
      plan.refactorings.push(...this.generatePatternRefactorings(analysis));
      plan.refactorings.push(...this.generateDocumentationCleanup(analysis));

      // Calculate effort and benefits
      plan.estimatedEffort = this.calculateEffort(plan.refactorings);
      plan.benefits = this.calculateBenefits(analysis, plan.refactorings);

      // Limit suggestions to most impactful
      plan.refactorings = this.prioritizeRefactorings(plan.refactorings)
        .slice(0, this.config.suggestionsLimit);

      return plan;

    } catch (error) {
      return {
        filePath,
        error: error.message,
        refactorings: []
      };
    }
  }

  /**
   * Analyze file structure and patterns
   */
  async analyzeFile(content, filePath) {
    const lines = content.split('\n');
    const analysis = {
      lines: lines.length,
      fileName: path.basename(filePath),
      classes: this.extractClasses(content),
      methods: this.extractMethods(content),
      imports: this.extractImports(content),
      exports: this.extractExports(content),
      patterns: this.detectPatterns(content, filePath),
      duplicates: this.findDuplicateCode(content),
      complexity: this.calculateComplexity(content)
    };

    return analysis;
  }

  /**
   * Extract class definitions and their methods
   */
  extractClasses(content) {
    const classes = [];
    const classMatches = content.matchAll(/class\s+(\w+)(?:\s+extends\s+\w+)?\s*{([\s\S]*?)(?=\nclass|\n\}$)/g);

    for (const match of classMatches) {
      const [, className, classBody] = match;
      const methods = this.extractMethodsFromClass(classBody);

      classes.push({
        name: className,
        methods: methods,
        methodCount: methods.length,
        startLine: this.findLineNumber(content, match.index),
        estimatedLines: classBody.split('\n').length
      });
    }

    return classes;
  }

  /**
   * Extract methods from class body
   */
  extractMethodsFromClass(classBody) {
    const methods = [];
    const methodPatterns = [
      /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g,
      /(?:get|set)\s+(\w+)\s*\([^)]*\)\s*\{/g
    ];

    for (const pattern of methodPatterns) {
      const matches = classBody.matchAll(pattern);
      for (const match of matches) {
        methods.push({
          name: match[1],
          type: this.getMethodType(match[0]),
          isAsync: match[0].includes('async')
        });
      }
    }

    return methods;
  }

  /**
   * Extract method definitions
   */
  extractMethods(content) {
    const methods = [];
    const methodPatterns = [
      /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g,  // Regular methods
      /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g,  // Function declarations
      /const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g  // Arrow functions
    ];

    for (const pattern of methodPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        methods.push({
          name: match[1],
          type: this.getMethodType(match[0]),
          startLine: this.findLineNumber(content, match.index),
          isAsync: match[0].includes('async')
        });
      }
    }

    return methods;
  }

  /**
   * Extract import statements
   */
  extractImports(content) {
    const imports = [];
    const importMatches = content.matchAll(/import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g);

    for (const match of importMatches) {
      imports.push({
        path: match[1],
        line: this.findLineNumber(content, match.index)
      });
    }

    return imports;
  }

  /**
   * Extract export statements
   */
  extractExports(content) {
    const exports = [];
    const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g);

    for (const match of exportMatches) {
      exports.push({
        name: match[1],
        isDefault: match[0].includes('default'),
        line: this.findLineNumber(content, match.index)
      });
    }

    return exports;
  }

  /**
   * Detect anti-patterns and problematic structures
   */
  detectPatterns(content, filePath) {
    const patterns = [];
    const fileName = path.basename(filePath, path.extname(filePath));

    // Command Coordinator anti-pattern
    const executeMatches = content.match(/execute\w+\s*\(/g);
    if (executeMatches && executeMatches.length > 8) {
      patterns.push({
        type: 'command-coordinator',
        severity: 'high',
        count: executeMatches.length,
        description: `File contains ${executeMatches.length} execute methods`,
        suggestion: 'Extract commands into separate classes using Command pattern'
      });
    }

    // God class pattern
    const methodCount = (content.match(/(?:async\s+)?\w+\s*\([^)]*\)\s*\{/g) || []).length;
    if (methodCount > 20) {
      patterns.push({
        type: 'god-class',
        severity: 'high',
        count: methodCount,
        description: `Single class with ${methodCount} methods`,
        suggestion: 'Split into multiple focused classes with single responsibilities'
      });
    }

    // Duplicate documentation
    const duplicateDocs = content.match(/\/\*\*[\s\*]*\w+\s+class\s+implementation[\s\*]*\*\//g);
    if (duplicateDocs && duplicateDocs.length > 2) {
      patterns.push({
        type: 'duplicate-documentation',
        severity: 'medium',
        count: duplicateDocs.length,
        description: `${duplicateDocs.length} duplicate JSDoc blocks`,
        suggestion: 'Remove duplicate documentation and standardize JSDoc format'
      });
    }

    // Monolithic utility class
    if (fileName.includes('Util') || fileName.includes('Helper')) {
      patterns.push({
        type: 'utility-class',
        severity: 'medium',
        description: 'Large utility class detected',
        suggestion: 'Split utilities by domain or functionality'
      });
    }

    return patterns;
  }

  /**
   * Generate file splitting strategies
   */
  generateSplittingStrategies(analysis) {
    const strategies = [];

    // Class-based splitting
    if (analysis.classes.length > 1) {
      for (const cls of analysis.classes) {
        if (cls.estimatedLines > 200) {
          strategies.push({
            type: 'extract-class',
            priority: 'high',
            description: `Extract ${cls.name} class into separate file`,
            targetFile: `${cls.name}.js`,
            estimatedReduction: cls.estimatedLines,
            effort: 'low'
          });
        }
      }
    }

    // Method-based splitting for large classes
    for (const cls of analysis.classes) {
      if (cls.methodCount > 15) {
        const relatedMethods = this.groupRelatedMethods(cls.methods);
        for (const group of relatedMethods) {
          if (group.methods.length > 3) {
            strategies.push({
              type: 'extract-mixin',
              priority: 'medium',
              description: `Extract ${group.category} methods from ${cls.name}`,
              targetFile: `${cls.name}${group.category}.js`,
              methods: group.methods,
              estimatedReduction: group.methods.length * 15, // Estimate lines per method
              effort: 'medium'
            });
          }
        }
      }
    }

    return strategies;
  }

  /**
   * Generate method extraction recommendations
   */
  generateMethodExtractions(analysis) {
    const extractions = [];

    // Command pattern for coordinators
    for (const pattern of analysis.patterns) {
      if (pattern.type === 'command-coordinator') {
        extractions.push({
          type: 'command-pattern-refactor',
          priority: 'high',
          description: 'Implement proper Command pattern',
          steps: [
            'Create base Command interface',
            'Extract each execute method into separate Command class',
            'Update coordinator to use command registry',
            'Add command factory for instantiation'
          ],
          estimatedReduction: pattern.count * 20, // Estimate lines per command
          effort: 'high',
          benefits: ['Better separation of concerns', 'Easier testing', 'Improved maintainability']
        });
      }
    }

    return extractions;
  }

  /**
   * Generate pattern-specific refactoring suggestions
   */
  generatePatternRefactorings(analysis) {
    const refactorings = [];

    // Strategy pattern for conditional logic
    const conditionalCount = (analysis.complexity.conditionals || []).length;
    if (conditionalCount > 10) {
      refactorings.push({
        type: 'strategy-pattern',
        priority: 'medium',
        description: 'Replace complex conditionals with Strategy pattern',
        estimatedReduction: conditionalCount * 5,
        effort: 'medium'
      });
    }

    // Factory pattern for object creation
    const newStatements = analysis.complexity.objectCreations || 0;
    if (newStatements > 5) {
      refactorings.push({
        type: 'factory-pattern',
        priority: 'low',
        description: 'Extract object creation into Factory classes',
        estimatedReduction: newStatements * 3,
        effort: 'low'
      });
    }

    return refactorings;
  }

  /**
   * Generate documentation cleanup suggestions
   */
  generateDocumentationCleanup(analysis) {
    const cleanups = [];

    for (const pattern of analysis.patterns) {
      if (pattern.type === 'duplicate-documentation') {
        cleanups.push({
          type: 'documentation-cleanup',
          priority: 'low',
          description: 'Remove duplicate JSDoc comments',
          estimatedReduction: pattern.count * 5, // Lines per duplicate block
          effort: 'low',
          automatable: true
        });
      }
    }

    return cleanups;
  }

  /**
   * Group related methods for extraction
   */
  groupRelatedMethods(methods) {
    const groups = {
      validation: { category: 'Validation', methods: [] },
      formatting: { category: 'Formatting', methods: [] },
      calculation: { category: 'Calculation', methods: [] },
      utility: { category: 'Utility', methods: [] }
    };

    for (const method of methods) {
      const name = method.name.toLowerCase();

      if (name.includes('valid') || name.includes('check') || name.includes('verify')) {
        groups.validation.methods.push(method);
      } else if (name.includes('format') || name.includes('display') || name.includes('render')) {
        groups.formatting.methods.push(method);
      } else if (name.includes('calc') || name.includes('compute') || name.includes('sum')) {
        groups.calculation.methods.push(method);
      } else {
        groups.utility.methods.push(method);
      }
    }

    return Object.values(groups).filter(group => group.methods.length > 0);
  }

  /**
   * Calculate complexity metrics
   */
  calculateComplexity(content) {
    return {
      cyclomaticComplexity: this.calculateCyclomaticComplexity(content),
      conditionals: this.extractConditionals(content),
      objectCreations: (content.match(/\bnew\s+\w+/g) || []).length,
      functionCalls: (content.match(/\w+\s*\(/g) || []).length
    };
  }

  /**
   * Calculate cyclomatic complexity
   */
  calculateCyclomaticComplexity(content) {
    const complexityNodes = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g, // Ternary operator
      /&&|\|\|/g // Logical operators
    ];

    let complexity = 1; // Base complexity

    for (const pattern of complexityNodes) {
      const matches = content.match(pattern) || [];
      complexity += matches.length;
    }

    return complexity;
  }

  /**
   * Extract conditional statements
   */
  extractConditionals(content) {
    const conditionals = [];
    const patterns = [
      { type: 'if', pattern: /\bif\s*\([^)]+\)/g },
      { type: 'switch', pattern: /\bswitch\s*\([^)]+\)/g },
      { type: 'ternary', pattern: /\?\s*.*\s*:/g }
    ];

    for (const { type, pattern } of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        conditionals.push({
          type,
          line: this.findLineNumber(content, match.index)
        });
      }
    }

    return conditionals;
  }

  /**
   * Calculate refactoring priority
   */
  calculatePriority(analysis) {
    let priority = 'low';

    if (analysis.lines > 1000) {priority = 'critical';}
    else if (analysis.lines > 500) {priority = 'high';}
    else if (analysis.lines > 300) {priority = 'medium';}

    // Boost priority for anti-patterns
    for (const pattern of analysis.patterns) {
      if (pattern.severity === 'high') {
        priority = priority === 'critical' ? 'critical' : 'high';
      }
    }

    return priority;
  }

  /**
   * Calculate estimated effort
   */
  calculateEffort(refactorings) {
    const efforts = refactorings.map(r => r.effort);

    if (efforts.includes('high')) {return 'high';}
    if (efforts.filter(e => e === 'medium').length > 2) {return 'high';}
    if (efforts.includes('medium')) {return 'medium';}
    return 'low';
  }

  /**
   * Calculate refactoring benefits
   */
  calculateBenefits(analysis, refactorings) {
    const benefits = new Set();

    const totalReduction = refactorings.reduce((sum, r) => sum + (r.estimatedReduction || 0), 0);
    const reductionPercentage = Math.round((totalReduction / analysis.lines) * 100);

    benefits.add(`${reductionPercentage}% file size reduction`);
    benefits.add('Improved maintainability');
    benefits.add('Better testability');

    if (analysis.patterns.some(p => p.type === 'command-coordinator')) {
      benefits.add('Cleaner separation of concerns');
    }

    if (analysis.classes.length > 1) {
      benefits.add('Single responsibility principle adherence');
    }

    return Array.from(benefits);
  }

  /**
   * Prioritize refactorings by impact and effort
   */
  prioritizeRefactorings(refactorings) {
    const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    const effortWeights = { low: 3, medium: 2, high: 1 };

    return refactorings
      .map(r => ({
        ...r,
        score: (priorityWeights[r.priority] || 1) * (effortWeights[r.effort] || 1)
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Utility methods
   */
  findLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getMethodType(methodSignature) {
    if (methodSignature.includes('function')) {return 'function';}
    if (methodSignature.includes('=>')) {return 'arrow';}
    return 'method';
  }

  findDuplicateCode(content) {
    // Simple duplicate detection - can be enhanced with AST analysis
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 10);
    const duplicates = [];
    const seen = new Map();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (seen.has(line)) {
        duplicates.push({ line: i + 1, content: line, originalLine: seen.get(line) });
      } else {
        seen.set(line, i + 1);
      }
    }

    return duplicates;
  }
}