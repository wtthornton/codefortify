/**
 * QualityAnalyzer - Analyzes code quality and maintainability
 * 
 * Evaluates:
 * - Code formatting and linting (6pts)
 * - Documentation quality (5pts)
 * - Code complexity and maintainability (4pts)
 * - TypeScript usage and type safety (3pts)
 * - Code consistency (2pts)
 * Total: 20pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';
import path from 'path';

export class QualityAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Code Quality & Maintainability';
    this.description = 'Code formatting, documentation, complexity, type safety, and consistency';
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];
    
    await this.analyzeLinting(); // 6pts
    await this.analyzeDocumentation(); // 5pts
    await this.analyzeComplexity(); // 4pts
    await this.analyzeTypeScript(); // 3pts
    await this.analyzeConsistency(); // 2pts
  }

  async analyzeLinting() {
    let score = 0;
    const maxScore = 6;
    
    // PHASE 1 UPGRADE: Use ESLint API for real code quality analysis
    const eslintResult = await this.runESLintAnalysis();
    
    if (eslintResult.success && eslintResult.hasConfig) {
      const { errorCount, warningCount, ruleViolations } = eslintResult.data;
      
      // Score based on actual ESLint results (4pts)
      if (errorCount === 0 && warningCount === 0) {
        score += 4;
        this.addScore(4, 4, 'No ESLint errors or warnings found');
      } else if (errorCount === 0) {
        score += 3;
        this.addScore(3, 4, `Only ${warningCount} ESLint warnings found`);
        this.addIssue(`${warningCount} ESLint warnings`, 'Fix ESLint warnings to improve code quality');
      } else if (errorCount < 10) {
        score += 2;
        this.addScore(2, 4, `${errorCount} ESLint errors, ${warningCount} warnings`);
        this.addIssue(`${errorCount} ESLint errors`, 'Fix ESLint errors for better code quality');
      } else {
        score += 1;
        this.addScore(1, 4, `Many ESLint issues (${errorCount} errors, ${warningCount} warnings)`);
        this.addIssue('High ESLint error count', 'Significant code quality issues detected');
      }

      this.setDetail('eslintAnalysis', {
        errorCount,
        warningCount,
        topRuleViolations: ruleViolations.slice(0, 5)
      });
    } else if (eslintResult.hasConfig) {
      // ESLint config exists but API failed - graceful degradation with helpful guidance
      score += 2;
      this.addScore(2, 4, 'ESLint configured but analysis failed - using config detection');
      this.addIssue('ESLint analysis failed', `${eslintResult.error || 'Unable to run ESLint analysis'}. Try running: npx eslint --fix src/`);
    } else {
      // No ESLint configuration found - provide setup guidance
      this.addIssue('No ESLint configuration found', 'Add ESLint: npx eslint --init');
    }
    
    // Check for Prettier configuration (2pts)
    const hasPrettier = await this.fileExists('.prettierrc') ||
                       await this.fileExists('.prettierrc.json') ||
                       await this.fileExists('prettier.config.js') ||
                       await this.fileExists('.prettierrc.js');
    
    if (hasPrettier) {
      score += 2;
      this.addScore(2, 2, 'Prettier configuration found');
    } else {
      this.addIssue('No Prettier configuration found', 'Add Prettier for consistent code formatting');
    }
    
    this.setDetail('hasPrettier', hasPrettier);
    this.setDetail('hasEslintConfig', eslintResult.hasConfig);
  }

  /**
   * Run ESLint analysis using the Node.js API
   * @returns {Promise<{success: boolean, hasConfig: boolean, data?: any, error?: string}>}
   */
  async runESLintAnalysis() {
    try {
      // First check if ESLint config exists
      const hasConfig = await this.fileExists('.eslintrc.js') || 
                       await this.fileExists('.eslintrc.json') || 
                       await this.fileExists('.eslintrc.yaml') ||
                       await this.fileExists('eslint.config.js') ||
                       await this.fileExists('.eslintrc.yml');

      if (!hasConfig) {
        return { success: false, hasConfig: false };
      }

      // Dynamic import ESLint to avoid requiring it as a dependency
      const { ESLint } = await import('eslint').catch(() => ({ ESLint: null }));
      
      if (!ESLint) {
        return { 
          success: false, 
          hasConfig: true, 
          error: 'ESLint not installed. Run: npm install --save-dev eslint' 
        };
      }

      // Create ESLint instance
      const eslint = new ESLint({ 
        cwd: this.config.projectRoot || process.cwd(),
        useEslintrc: true
      });

      // Get files to lint
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
      
      if (files.length === 0) {
        return { 
          success: true, 
          hasConfig: true, 
          data: { errorCount: 0, warningCount: 0, ruleViolations: [] } 
        };
      }

      // Lint files (limit to first 10 for performance)
      const filesToLint = files.slice(0, 10).map(f => 
        path.resolve(this.config.projectRoot || process.cwd(), f)
      );
      
      const results = await eslint.lintFiles(filesToLint);
      
      // Aggregate results
      let errorCount = 0;
      let warningCount = 0;
      const ruleViolations = {};

      for (const result of results) {
        errorCount += result.errorCount;
        warningCount += result.warningCount;
        
        for (const message of result.messages) {
          const rule = message.ruleId || 'unknown';
          ruleViolations[rule] = (ruleViolations[rule] || 0) + 1;
        }
      }

      // Sort rule violations by frequency
      const sortedViolations = Object.entries(ruleViolations)
        .map(([rule, count]) => ({ rule, count }))
        .sort((a, b) => b.count - a.count);

      return {
        success: true,
        hasConfig: true,
        data: {
          errorCount,
          warningCount,
          ruleViolations: sortedViolations
        }
      };

    } catch (error) {
      return { 
        success: false, 
        hasConfig: true, 
        error: error.message 
      };
    }
  }

  async analyzeDocumentation() {
    let score = 0;
    const maxScore = 5;
    
    // Check for README
    const hasReadme = await this.fileExists('README.md');
    if (hasReadme) {
      const readmeContent = await this.readFile('README.md');
      if (readmeContent.length > 500) {
        score += 2;
        this.addScore(2, 2, 'Comprehensive README found');
      } else {
        score += 1;
        this.addScore(1, 2, 'Basic README found');
        this.addIssue('README is quite short', 'Expand README with setup instructions and project details');
      }
    } else {
      this.addIssue('No README.md found', 'Add a README.md with project documentation');
    }
    
    // Check for API documentation or JSDoc comments
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let documentedFiles = 0;
    
    for (const file of files.slice(0, 10)) { // Sample files
      try {
        const content = await this.readFile(file);
        if (content.includes('/**') || content.includes('//')) {
          documentedFiles++;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    const docRatio = files.length > 0 ? documentedFiles / Math.min(files.length, 10) : 0;
    const docScore = docRatio * 3;
    score += docScore;
    this.addScore(docScore, 3, `${Math.round(docRatio * 100)}% of sampled files have documentation`);
    
    if (docRatio < 0.5) {
      this.addIssue('Low documentation coverage', 'Add JSDoc comments to functions and classes');
    }
    
    this.setDetail('documentationRatio', docRatio);
  }

  async analyzeComplexity() {
    let score = 0;
    const maxScore = 4;
    
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let totalComplexity = 0;
    let analyzedFiles = 0;
    
    for (const file of files.slice(0, 20)) { // Sample files for performance
      try {
        const content = await this.readFile(file);
        const complexity = this.calculateCyclomaticComplexity(content);
        totalComplexity += complexity;
        analyzedFiles++;
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    const avgComplexity = analyzedFiles > 0 ? totalComplexity / analyzedFiles : 0;
    
    if (avgComplexity < 5) {
      score += 4;
      this.addScore(4, 4, `Low complexity (avg: ${avgComplexity.toFixed(1)})`);
    } else if (avgComplexity < 10) {
      score += 3;
      this.addScore(3, 4, `Moderate complexity (avg: ${avgComplexity.toFixed(1)})`);
    } else if (avgComplexity < 15) {
      score += 2;
      this.addScore(2, 4, `High complexity (avg: ${avgComplexity.toFixed(1)})`);
      this.addIssue('High code complexity detected', 'Consider breaking down complex functions');
    } else {
      score += 1;
      this.addScore(1, 4, `Very high complexity (avg: ${avgComplexity.toFixed(1)})`);
      this.addIssue('Very high code complexity', 'Refactor complex functions into smaller, focused units');
    }
    
    this.setDetail('averageComplexity', avgComplexity);
  }

  async analyzeTypeScript() {
    let score = 0;
    const maxScore = 3;
    
    const hasTypeScript = await this.fileExists('tsconfig.json');
    const tsFiles = await this.getAllFiles('', ['.ts', '.tsx']);
    const jsFiles = await this.getAllFiles('', ['.js', '.jsx']);
    
    if (hasTypeScript) {
      score += 2;
      this.addScore(2, 2, 'TypeScript configuration found');
      
      // Check TypeScript adoption
      const totalFiles = tsFiles.length + jsFiles.length;
      if (totalFiles > 0) {
        const tsRatio = tsFiles.length / totalFiles;
        if (tsRatio > 0.8) {
          score += 1;
          this.addScore(1, 1, `High TypeScript adoption (${Math.round(tsRatio * 100)}%)`);
        } else if (tsRatio > 0.5) {
          score += 0.5;
          this.addScore(0.5, 1, `Moderate TypeScript adoption (${Math.round(tsRatio * 100)}%)`);
        } else {
          this.addIssue('Low TypeScript adoption', 'Consider migrating more files to TypeScript');
        }
      }
    } else if (tsFiles.length > 0) {
      score += 1;
      this.addScore(1, 3, 'TypeScript files found but no tsconfig.json');
      this.addIssue('TypeScript files without configuration', 'Add tsconfig.json for proper TypeScript support');
    } else {
      this.addIssue('No TypeScript usage detected', 'Consider adopting TypeScript for better type safety');
    }
    
    this.setDetail('hasTypeScript', hasTypeScript);
    this.setDetail('typeScriptFiles', tsFiles.length);
    this.setDetail('javaScriptFiles', jsFiles.length);
  }

  async analyzeConsistency() {
    let score = 0;
    const maxScore = 2;
    
    // Check for consistent import patterns
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let esModuleCount = 0;
    let commonjsCount = 0;
    
    for (const file of files.slice(0, 20)) {
      try {
        const content = await this.readFile(file);
        if (content.includes('import ') || content.includes('export ')) {
          esModuleCount++;
        }
        if (content.includes('require(') || content.includes('module.exports')) {
          commonjsCount++;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    const totalModules = esModuleCount + commonjsCount;
    if (totalModules > 0) {
      const consistency = Math.max(esModuleCount, commonjsCount) / totalModules;
      if (consistency > 0.9) {
        score += 2;
        this.addScore(2, 2, `Consistent module patterns (${Math.round(consistency * 100)}%)`);
      } else if (consistency > 0.7) {
        score += 1;
        this.addScore(1, 2, `Mostly consistent module patterns (${Math.round(consistency * 100)}%)`);
      } else {
        this.addIssue('Mixed module patterns', 'Use consistent import/export patterns (ES modules vs CommonJS)');
      }
    } else {
      score += 1; // Default if no modules detected
      this.addScore(1, 2, 'Module consistency analysis inconclusive');
    }
    
    this.setDetail('esModuleCount', esModuleCount);
    this.setDetail('commonjsCount', commonjsCount);
  }

  calculateCyclomaticComplexity(content) {
    // Simple approximation of cyclomatic complexity
    const complexityKeywords = [
      'if', 'else', 'while', 'for', 'foreach', 'switch', 'case',
      'catch', 'finally', '&&', '||', '?'
    ];
    
    let complexity = 1; // Base complexity
    
    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    // Account for ternary operators
    const ternaryMatches = content.match(/\?/g);
    if (ternaryMatches) {
      complexity += ternaryMatches.length;
    }
    
    return complexity;
  }
}