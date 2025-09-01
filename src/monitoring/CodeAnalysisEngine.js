/**
 * Code Analysis Engine for Context7
 * Analyzes code for quality metrics
 *
 * Features:
 * - Complexity analysis
 * - Maintainability analysis
 * - Security analysis
 * - Performance analysis
 * - Readability analysis
 * - Testability analysis
 */

export class CodeAnalysisEngine {
  constructor(config = {}) {
    this.config = config;
    this.analysisCache = new Map();
  }

  /**
   * Analyze code for quality metrics
   * @param {string} code - Code to analyze
   * @returns {Promise<Object>} Quality metrics
   */
  async analyzeCode(code) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(code);
      if (this.analysisCache.has(cacheKey)) {
        return this.analysisCache.get(cacheKey);
      }

      const metrics = {
        complexity: await this.calculateComplexity(code),
        maintainability: await this.calculateMaintainability(code),
        security: await this.analyzeSecurity(code),
        performance: await this.analyzePerformance(code),
        readability: await this.analyzeReadability(code),
        testability: await this.analyzeTestability(code)
      };

      // Cache the result
      this.analysisCache.set(cacheKey, metrics);

      return metrics;

    } catch (error) {
      console.error(`❌ Error analyzing code: ${error.message}`);
      return {
        complexity: 0,
        maintainability: 0,
        security: 0,
        performance: 0,
        readability: 0,
        testability: 0
      };
    }
  }

  /**
   * Calculate code complexity
   * @param {string} code - Code to analyze
   * @returns {Promise<number>} Complexity score
   */
  async calculateComplexity(code) {
    try {
      const lines = code.split('\n');
      let complexity = 1; // Base complexity

      // Count control flow statements
      const controlFlowPatterns = [
        /if\s*\(/g,
        /else\s+if\s*\(/g,
        /for\s*\(/g,
        /while\s*\(/g,
        /switch\s*\(/g,
        /case\s+/g,
        /catch\s*\(/g,
        /&&/g,
        /\|\|/g,
        /\?/g
      ];

      for (const pattern of controlFlowPatterns) {
        const matches = code.match(pattern);
        if (matches) {
          complexity += matches.length;
        }
      }

      // Count nested structures
      const nestedPatterns = [
        /\{/g,
        /\(/g
      ];

      for (const pattern of nestedPatterns) {
        const matches = code.match(pattern);
        if (matches) {
          complexity += matches.length * 0.5;
        }
      }

      return Math.round(complexity);

    } catch (error) {
      console.error(`❌ Error calculating complexity: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate maintainability score
   * @param {string} code - Code to analyze
   * @returns {Promise<number>} Maintainability score (0-100)
   */
  async calculateMaintainability(code) {
    try {
      const lines = code.split('\n');
      let score = 100;

      // Penalize long functions
      const functionMatches = code.match(/function\s+\w+\s*\(/g) || [];
      const longFunctions = functionMatches.length;
      score -= longFunctions * 5;

      // Penalize long lines
      const longLines = lines.filter(line => line.length > 100).length;
      score -= longLines * 2;

      // Penalize deep nesting
      const maxNesting = this.calculateMaxNesting(code);
      score -= maxNesting * 10;

      // Reward comments
      const commentLines = lines.filter(line =>
        line.trim().startsWith('//') || line.trim().startsWith('/*')
      ).length;
      score += Math.min(commentLines * 2, 20);

      // Reward meaningful variable names
      const meaningfulVars = this.countMeaningfulVariables(code);
      score += Math.min(meaningfulVars * 1, 15);

      return Math.max(0, Math.min(100, Math.round(score)));

    } catch (error) {
      console.error(`❌ Error calculating maintainability: ${error.message}`);
      return 0;
    }
  }

  /**
   * Analyze security issues
   * @param {string} code - Code to analyze
   * @returns {Promise<number>} Security score (0-100)
   */
  async analyzeSecurity(code) {
    try {
      let score = 100;

      // Check for dangerous patterns
      const securityIssues = [
        { pattern: /eval\s*\(/, severity: 20, message: 'Dangerous eval() usage' },
        { pattern: /innerHTML\s*=/, severity: 10, message: 'Potential XSS with innerHTML' },
        { pattern: /document\.write/, severity: 15, message: 'Potential XSS with document.write' },
        { pattern: /setTimeout\s*\(\s*["']/, severity: 10, message: 'Potential code injection' },
        { pattern: /new\s+Function\s*\(/, severity: 15, message: 'Potential code injection' },
        { pattern: /\.innerHTML\s*=\s*[^;]*\+/, severity: 8, message: 'Potential XSS with string concatenation' },
        { pattern: /localStorage\.setItem\s*\(\s*[^,]*,\s*[^)]*\)/, severity: 5, message: 'Potential data exposure' },
        { pattern: /sessionStorage\.setItem\s*\(\s*[^,]*,\s*[^)]*\)/, severity: 5, message: 'Potential data exposure' }
      ];

      for (const issue of securityIssues) {
        const matches = code.match(issue.pattern);
        if (matches) {
          score -= matches.length * issue.severity;
        }
      }

      // Check for good security practices
      const securityGood = [
        { pattern: /crypto\.randomBytes/, bonus: 5, message: 'Good use of crypto.randomBytes' },
        { pattern: /bcrypt/, bonus: 10, message: 'Good use of bcrypt' },
        { pattern: /helmet/, bonus: 8, message: 'Good use of helmet' },
        { pattern: /cors/, bonus: 5, message: 'Good use of CORS' },
        { pattern: /rate-limit/, bonus: 5, message: 'Good use of rate limiting' }
      ];

      for (const good of securityGood) {
        const matches = code.match(good.pattern);
        if (matches) {
          score += matches.length * good.bonus;
        }
      }

      return Math.max(0, Math.min(100, Math.round(score)));

    } catch (error) {
      console.error(`❌ Error analyzing security: ${error.message}`);
      return 0;
    }
  }

  /**
   * Analyze performance issues
   * @param {string} code - Code to analyze
   * @returns {Promise<number>} Performance score (0-100)
   */
  async analyzePerformance(code) {
    try {
      let score = 100;

      // Check for performance anti-patterns
      const performanceIssues = [
        { pattern: /for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*array\.length\s*;\s*i\+\+\)/, severity: 5, message: 'Use forEach or map instead' },
        { pattern: /document\.getElementById/, severity: 3, message: 'Consider querySelector for better performance' },
        { pattern: /innerHTML\s*=/, severity: 4, message: 'Consider textContent for better performance' },
        { pattern: /setTimeout\s*\(\s*function/, severity: 2, message: 'Consider arrow functions' },
        { pattern: /import\s+\*\s+as/, severity: 8, message: 'Consider specific imports to reduce bundle size' },
        { pattern: /console\.log/, severity: 1, message: 'Remove console.log in production' }
      ];

      for (const issue of performanceIssues) {
        const matches = code.match(issue.pattern);
        if (matches) {
          score -= matches.length * issue.severity;
        }
      }

      // Check for performance optimizations
      const performanceGood = [
        { pattern: /React\.memo/, bonus: 8, message: 'Good use of React.memo' },
        { pattern: /useMemo/, bonus: 10, message: 'Good use of useMemo' },
        { pattern: /useCallback/, bonus: 10, message: 'Good use of useCallback' },
        { pattern: /lazy\s*\(\s*\(\)\s*=>\s*import/, bonus: 15, message: 'Good use of lazy loading' },
        { pattern: /requestAnimationFrame/, bonus: 8, message: 'Good use of requestAnimationFrame' }
      ];

      for (const good of performanceGood) {
        const matches = code.match(good.pattern);
        if (matches) {
          score += matches.length * good.bonus;
        }
      }

      return Math.max(0, Math.min(100, Math.round(score)));

    } catch (error) {
      console.error(`❌ Error analyzing performance: ${error.message}`);
      return 0;
    }
  }

  /**
   * Analyze readability
   * @param {string} code - Code to analyze
   * @returns {Promise<number>} Readability score (0-100)
   */
  async analyzeReadability(code) {
    try {
      const lines = code.split('\n');
      let score = 100;

      // Penalize very long lines
      const veryLongLines = lines.filter(line => line.length > 120).length;
      score -= veryLongLines * 3;

      // Penalize very short variable names
      const shortVars = (code.match(/\b[a-z]{1,2}\b/g) || []).length;
      score -= Math.min(shortVars * 0.5, 20);

      // Reward meaningful variable names
      const meaningfulVars = this.countMeaningfulVariables(code);
      score += Math.min(meaningfulVars * 2, 25);

      // Reward comments
      const commentLines = lines.filter(line =>
        line.trim().startsWith('//') || line.trim().startsWith('/*')
      ).length;
      score += Math.min(commentLines * 3, 30);

      // Penalize deep nesting
      const maxNesting = this.calculateMaxNesting(code);
      score -= maxNesting * 8;

      // Reward consistent indentation
      const indentationConsistency = this.checkIndentationConsistency(lines);
      score += indentationConsistency * 10;

      return Math.max(0, Math.min(100, Math.round(score)));

    } catch (error) {
      console.error(`❌ Error analyzing readability: ${error.message}`);
      return 0;
    }
  }

  /**
   * Analyze testability
   * @param {string} code - Code to analyze
   * @returns {Promise<number>} Testability score (0-100)
   */
  async analyzeTestability(code) {
    try {
      let score = 100;

      // Check for testable patterns
      const testablePatterns = [
        { pattern: /export\s+(?:const|function|class)/, bonus: 10, message: 'Good export pattern' },
        { pattern: /describe\s*\(/, bonus: 15, message: 'Test structure present' },
        { pattern: /it\s*\(/, bonus: 10, message: 'Test cases present' },
        { pattern: /expect\s*\(/, bonus: 8, message: 'Assertions present' },
        { pattern: /jest\./, bonus: 5, message: 'Jest testing framework' },
        { pattern: /vitest\./, bonus: 5, message: 'Vitest testing framework' }
      ];

      for (const pattern of testablePatterns) {
        const matches = code.match(pattern.pattern);
        if (matches) {
          score += matches.length * pattern.bonus;
        }
      }

      // Check for hard-to-test patterns
      const hardToTestPatterns = [
        { pattern: /global\./, severity: 5, message: 'Global variable usage' },
        { pattern: /window\./, severity: 5, message: 'Window object usage' },
        { pattern: /document\./, severity: 3, message: 'DOM manipulation' },
        { pattern: /localStorage\./, severity: 3, message: 'Local storage usage' },
        { pattern: /sessionStorage\./, severity: 3, message: 'Session storage usage' }
      ];

      for (const pattern of hardToTestPatterns) {
        const matches = code.match(pattern.pattern);
        if (matches) {
          score -= matches.length * pattern.severity;
        }
      }

      return Math.max(0, Math.min(100, Math.round(score)));

    } catch (error) {
      console.error(`❌ Error analyzing testability: ${error.message}`);
      return 0;
    }
  }

  // Private methods

  calculateMaxNesting(code) {
    let maxNesting = 0;
    let currentNesting = 0;

    for (const char of code) {
      if (char === '{' || char === '(') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}' || char === ')') {
        currentNesting--;
      }
    }

    return maxNesting;
  }

  countMeaningfulVariables(code) {
    const variablePatterns = [
      /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    ];

    let meaningfulCount = 0;

    for (const pattern of variablePatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        const name = match[1];
        if (name.length > 2 && this.isMeaningfulName(name)) {
          meaningfulCount++;
        }
      }
    }

    return meaningfulCount;
  }

  isMeaningfulName(name) {
    // Check if the name is meaningful (not just abbreviations)
    const meaningfulPatterns = [
      /^[a-z][a-z0-9]*[A-Z]/, // camelCase
      /^[A-Z][a-z0-9]*[A-Z]/, // PascalCase
      /^[a-z][a-z0-9]*_[a-z0-9]*/, // snake_case
      /^[A-Z][A-Z0-9]*_[A-Z0-9]*/ // UPPER_SNAKE_CASE
    ];

    return meaningfulPatterns.some(pattern => pattern.test(name));
  }

  checkIndentationConsistency(lines) {
    const indentations = [];

    for (const line of lines) {
      if (line.trim()) {
        const leadingSpaces = line.match(/^ */)?.[0].length || 0;
        indentations.push(leadingSpaces);
      }
    }

    if (indentations.length === 0) {return 1;}

    // Check if all indentations are multiples of a common base
    const base = Math.min(...indentations.filter(i => i > 0));
    if (base === 0) {return 1;}

    const consistent = indentations.every(i => i % base === 0);
    return consistent ? 1 : 0.5;
  }

  generateCacheKey(code) {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}
