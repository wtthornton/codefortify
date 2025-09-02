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

/**


 * QualityAnalyzer class implementation


 *


 * Provides functionality for qualityanalyzer operations


 */


/**


 * QualityAnalyzer class implementation


 *


 * Provides functionality for qualityanalyzer operations


 */


export class QualityAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Code Quality & Maintainability';
    this.description = 'Code formatting, documentation, complexity, type safety, and consistency';
  }  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */


  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];

    await this.analyzeLinting(); // 6pts
    await this.analyzeDocumentation(); // 5pts
    await this.analyzeComplexity(); // 4pts
    await this.analyzeTypeScript(); // 3pts
    await this.analyzeConsistency(); // 2pts
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeLinting() {
    let score = 0;
    const maxScore = 6;

    // PHASE 1 UPGRADE: Use ESLint API for real code quality analysis
    const eslintResult = await this.runESLintAnalysis();    /**
   * Performs the specified operation
   * @param {Object} eslintResult.success && eslintResult.hasConfig
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} eslintResult.success && eslintResult.hasConfig
   * @returns {any} The operation result
   */


    if (eslintResult.success && eslintResult.hasConfig) {
      const { errorCount, warningCount, ruleViolations } = eslintResult.data;

      // ENHANCED: Much stricter ESLint scoring for rigorous quality standards
      const totalIssues = errorCount + warningCount;
      const filesAnalyzed = eslintResult.data.filesAnalyzed || 1;
      const issuesPerFile = totalIssues / filesAnalyzed;

      // MUCH MORE RIGOROUS: Only perfect code gets full points      /**
   * Performs the specified operation
   * @param {number} errorCount - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {number} errorCount - Optional parameter
   * @returns {any} The operation result
   */

      if (errorCount === 0 && warningCount === 0) {
        score += 4;
        this.addScore(4, 4, 'Perfect: No ESLint errors or warnings found');
      }

      else if (errorCount === 0 && warningCount <= 5) {
        score += 3.5;
        this.addScore(3.5, 4, `Excellent: Only ${warningCount} ESLint warnings (${issuesPerFile.toFixed(1)} per file)`);
        this.addIssue(`${warningCount} ESLint warnings`, 'Fix remaining ESLint warnings for perfect score');
      }

      else if (errorCount === 0 && warningCount <= 15) {
        score += 3;
        this.addScore(3, 4, `Good: ${warningCount} ESLint warnings (${issuesPerFile.toFixed(1)} per file)`);
        this.addIssue(`${warningCount} ESLint warnings`, 'Fix ESLint warnings to improve code quality');
      }

      else if (errorCount <= 2 && totalIssues <= 20) {
        score += 2.5;
        this.addScore(2.5, 4, `${errorCount} ESLint errors, ${warningCount} warnings (${issuesPerFile.toFixed(1)} per file)`);
        this.addIssue(`${errorCount} ESLint errors`, 'Fix ESLint errors for better code quality');
      }

      else if (errorCount <= 5 && totalIssues <= 50) {
        score += 2;
        this.addScore(2, 4, `${errorCount} ESLint errors, ${warningCount} warnings (${issuesPerFile.toFixed(1)} per file)`);
        this.addIssue(`${errorCount} ESLint errors`, 'Fix ESLint errors for better code quality');
      }

      else if (errorCount <= 15 && totalIssues <= 150) {
        score += 1.5;
        this.addScore(1.5, 4, `${errorCount} ESLint errors, ${warningCount} warnings (${issuesPerFile.toFixed(1)} per file)`);
        this.addIssue(`${errorCount} ESLint errors`, 'Significant ESLint issues need attention');
      }

      else {
        score += 0.5;
        this.addScore(0.5, 4, `Critical: ${errorCount} ESLint errors, ${warningCount} warnings (${issuesPerFile.toFixed(1)} per file)`);
        this.addIssue('Critical ESLint issues', 'Major code quality problems detected - immediate attention required');
      }

      this.setDetail('eslintAnalysis', {
        errorCount,
        warningCount,
        totalIssues,
        issuesPerFile: issuesPerFile.toFixed(2),
        filesAnalyzed: eslintResult.data.filesAnalyzed,
        totalFiles: eslintResult.data.totalFiles,
        topRuleViolations: ruleViolations.slice(0, 5)
      });
    }

    else if (eslintResult.hasConfig) {
      // ESLint config exists but API failed - graceful degradation with helpful guidance
      score += 2;
      this.addScore(2, 4, 'ESLint configured but analysis failed - using config detection');
      this.addIssue('ESLint analysis failed', `${eslintResult.error || 'Unable to run ESLint analysis'}. Try running: npx eslint --fix src/`);
    }

    else {
      // No ESLint configuration found - provide setup guidance
      this.addIssue('No ESLint configuration found', 'Add ESLint: npx eslint --init');
    }

    // Check for Prettier configuration (2pts)
    const hasPrettier = await this.fileExists('.prettierrc') ||
                       await this.fileExists('.prettierrc.json') ||
                       await this.fileExists('prettier.config.js') ||
                       await this.fileExists('.prettierrc.js');    /**
   * Performs the specified operation
   * @param {boolean} hasPrettier
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasPrettier
   * @returns {any} The operation result
   */


    if (hasPrettier) {
      score += 2;
      this.addScore(2, 2, 'Prettier configuration found');
    }

    else {
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
                       await this.fileExists('.eslintrc.yml');      /**
   * Performs the specified operation
   * @param {Object} !hasConfig
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {Object} !hasConfig
   * @returns {any} The operation result
   */


      if (!hasConfig) {
        return { success: false, hasConfig: false };
      }

      // Dynamic import ESLint to avoid requiring it as a dependency
      const { ESLint } = await import('eslint').catch(() => ({ ESLint: null }));      /**
   * Performs the specified operation
   * @param {any} !ESLint
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !ESLint
   * @returns {any} The operation result
   */


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
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);      /**
   * Performs the specified operation
   * @param {any} files.length - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} files.length - Optional parameter
   * @returns {any} The operation result
   */


      if (files.length === 0) {
        return {
          success: true,
          hasConfig: true,
          data: { errorCount: 0, warningCount: 0, ruleViolations: [] }
        };
      }

      // Lint files - analyze up to 50 files for better coverage
      const filesToLint = files.slice(0, 50).map(f =>
        path.resolve(this.config.projectRoot || process.cwd(), f)
      );

      const results = await eslint.lintFiles(filesToLint);

      // Aggregate results
      let errorCount = 0;
      let warningCount = 0;
      const ruleViolations = {};      /**
   * Performs the specified operation
   * @param {any} const result of results
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const result of results
   * @returns {any} The operation result
   */


      for (const result of results) {
        errorCount += result.errorCount;
        warningCount += result.warningCount;        /**
   * Performs the specified operation
   * @param {any} const message of result.messages
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const message of result.messages
   * @returns {any} The operation result
   */


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
          ruleViolations: sortedViolations,
          filesAnalyzed: filesToLint.length,
          totalFiles: files.length
        }
      };

    }

    catch (error) {
      return {
        success: false,
        hasConfig: true,
        error: error.message
      };
    }
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeDocumentation() {
    let score = 0;
    const maxScore = 5;

    // Check for README (1.5pts)
    const hasReadme = await this.fileExists('README.md');    /**
   * Performs the specified operation
   * @param {boolean} hasReadme
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasReadme
   * @returns {any} The operation result
   */

    if (hasReadme) {
      const readmeContent = await this.readFile('README.md');      /**
   * Performs the specified operation
   * @param {any} readmeContent.length > 500
   * @returns {string} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} readmeContent.length > 500
   * @returns {string} The operation result
   */

      if (readmeContent.length > 500) {
        score += 1.5;
        this.addScore(1.5, 1.5, 'Comprehensive README found');
      }

      else {
        score += 1;
        this.addScore(1, 1.5, 'Basic README found');
        this.addIssue('README is quite short', 'Expand README with setup instructions and project details');
      }
    }

    else {
      this.addIssue('No README.md found', 'Add a README.md with project documentation');
    }

    // PHASE 1 UPGRADE: Comprehensive JSDoc analysis (3.5pts)
    const jsdocAnalysis = await this.analyzeJSDocQuality();
    score += jsdocAnalysis.score;

    // Add JSDoc analysis details
    this.setDetail('jsdocAnalysis', jsdocAnalysis.details);
    this.setDetail('documentationRatio', jsdocAnalysis.details.overallRatio);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


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
      }

      catch (error) {
        // Skip files that can't be read
      }
    }

    const avgComplexity = analyzedFiles > 0 ? totalComplexity / analyzedFiles : 0;    /**
   * Performs the specified operation
   * @param {any} avgComplexity < 5
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} avgComplexity < 5
   * @returns {any} The operation result
   */


    if (avgComplexity < 5) {
      score += 4;
      this.addScore(4, 4, `Low complexity (avg: ${avgComplexity.toFixed(1)})`);
    }

    else if (avgComplexity < 10) {
      score += 3;
      this.addScore(3, 4, `Moderate complexity (avg: ${avgComplexity.toFixed(1)})`);
    }

    else if (avgComplexity < 15) {
      score += 2;
      this.addScore(2, 4, `High complexity (avg: ${avgComplexity.toFixed(1)})`);
      this.addIssue('High code complexity detected', 'Consider breaking down complex functions');
    }

    else {
      score += 1;
      this.addScore(1, 4, `Very high complexity (avg: ${avgComplexity.toFixed(1)})`);
      this.addIssue('Very high code complexity', 'Refactor complex functions into smaller, focused units');
    }

    this.setDetail('averageComplexity', avgComplexity);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeTypeScript() {
    let score = 0;
    const maxScore = 3;

    const hasTypeScript = await this.fileExists('tsconfig.json');
    const tsFiles = await this.getAllFiles('', ['.ts', '.tsx']);
    const jsFiles = await this.getAllFiles('', ['.js', '.jsx']);    /**
   * Performs the specified operation
   * @param {boolean} hasTypeScript
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasTypeScript
   * @returns {any} The operation result
   */


    if (hasTypeScript) {
      score += 2;
      this.addScore(2, 2, 'TypeScript configuration found');

      // Check TypeScript adoption
      const totalFiles = tsFiles.length + jsFiles.length;      /**
   * Performs the specified operation
   * @param {any} totalFiles > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} totalFiles > 0
   * @returns {any} The operation result
   */

      if (totalFiles > 0) {
        const tsRatio = tsFiles.length / totalFiles;        /**
   * Performs the specified operation
   * @param {any} tsRatio > 0.8
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} tsRatio > 0.8
   * @returns {any} The operation result
   */

        if (tsRatio > 0.8) {
          score += 1;
          this.addScore(1, 1, `High TypeScript adoption (${Math.round(tsRatio * 100)}%)`);
        }

        else if (tsRatio > 0.5) {
          score += 0.5;
          this.addScore(0.5, 1, `Moderate TypeScript adoption (${Math.round(tsRatio * 100)}%)`);
        }

        else {
          this.addIssue('Low TypeScript adoption', 'Consider migrating more files to TypeScript');
        }
      }
    }

    else if (tsFiles.length > 0) {
      score += 1;
      this.addScore(1, 3, 'TypeScript files found but no tsconfig.json');
      this.addIssue('TypeScript files without configuration', 'Add tsconfig.json for proper TypeScript support');
    }

    else {
      this.addIssue('No TypeScript usage detected', 'Consider adopting TypeScript for better type safety');
    }

    this.setDetail('hasTypeScript', hasTypeScript);
    this.setDetail('typeScriptFiles', tsFiles.length);
    this.setDetail('javaScriptFiles', jsFiles.length);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


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
      }

      catch (error) {
        // Skip files that can't be read
      }
    }

    const totalModules = esModuleCount + commonjsCount;    /**
   * Performs the specified operation
   * @param {any} totalModules > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} totalModules > 0
   * @returns {any} The operation result
   */

    if (totalModules > 0) {
      const consistency = Math.max(esModuleCount, commonjsCount) / totalModules;      /**
   * Performs the specified operation
   * @param {boolean} consistency > 0.9
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} consistency > 0.9
   * @returns {boolean} True if successful, false otherwise
   */

      if (consistency > 0.9) {
        score += 2;
        this.addScore(2, 2, `Consistent module patterns (${Math.round(consistency * 100)}%)`);
      }

      else if (consistency > 0.7) {
        score += 1;
        this.addScore(1, 2, `Mostly consistent module patterns (${Math.round(consistency * 100)}%)`);
      }

      else {
        this.addIssue('Mixed module patterns', 'Use consistent import/export patterns (ES modules vs CommonJS)');
      }
    }

    else {
      score += 1; // Default if no modules detected
      this.addScore(1, 2, 'Module consistency analysis inconclusive');
    }

    this.setDetail('esModuleCount', esModuleCount);
    this.setDetail('commonjsCount', commonjsCount);
  }

  /**
   * PHASE 1: Comprehensive JSDoc quality analysis
   * Analyzes JSDoc comments for industry standards compliance
   */
  async analyzeJSDocQuality() {
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let totalScore = 0;
    const maxScore = 3.5;
    const analysis = {
      classDocumentation: { found: 0, total: 0, withExamples: 0, withMetadata: 0 },
      methodDocumentation: { found: 0, total: 0, withParams: 0, withReturns: 0, withThrows: 0 },
      aiContextAnnotations: { found: 0, intentComments: 0, algorithmComments: 0 },
      commentQuality: { total: 0, intentful: 0, outdated: 0, redundant: 0 },
      overallRatio: 0
    };

    for (const file of files.slice(0, 25)) { // Sample files for performance
      try {
        const content = await this.readFile(file);
        const fileAnalysis = this.analyzeFileJSDoc(content);

        // Aggregate results
        analysis.classDocumentation.found += fileAnalysis.classes.documented;
        analysis.classDocumentation.total += fileAnalysis.classes.total;
        analysis.classDocumentation.withExamples += fileAnalysis.classes.withExamples;
        analysis.classDocumentation.withMetadata += fileAnalysis.classes.withMetadata;

        analysis.methodDocumentation.found += fileAnalysis.methods.documented;
        analysis.methodDocumentation.total += fileAnalysis.methods.total;
        analysis.methodDocumentation.withParams += fileAnalysis.methods.withParams;
        analysis.methodDocumentation.withReturns += fileAnalysis.methods.withReturns;
        analysis.methodDocumentation.withThrows += fileAnalysis.methods.withThrows;

        analysis.aiContextAnnotations.found += fileAnalysis.aiAnnotations.found;
        analysis.aiContextAnnotations.intentComments += fileAnalysis.aiAnnotations.intentComments;
        analysis.aiContextAnnotations.algorithmComments += fileAnalysis.aiAnnotations.algorithmComments;

        analysis.commentQuality.total += fileAnalysis.comments.total;
        analysis.commentQuality.intentful += fileAnalysis.comments.intentful;
        analysis.commentQuality.outdated += fileAnalysis.comments.outdated;
        analysis.commentQuality.redundant += fileAnalysis.comments.redundant;

      }

      catch (error) {
        // Skip files that can't be read
      }
    }

    // Calculate scores based on analysis

    // 1. Class-level JSDoc quality (1pt)    /**
   * Performs the specified operation
   * @param {boolean} analysis.classDocumentation.total > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} analysis.classDocumentation.total > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (analysis.classDocumentation.total > 0) {
      const classDocRatio = analysis.classDocumentation.found / analysis.classDocumentation.total;
      const classQualityBonus = (analysis.classDocumentation.withExamples + analysis.classDocumentation.withMetadata) / (analysis.classDocumentation.total * 2);
      const classScore = Math.min(1, classDocRatio + classQualityBonus);
      totalScore += classScore;      /**
   * Performs the specified operation
   * @param {any} classScore > 0.8
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} classScore > 0.8
   * @returns {any} The operation result
   */


      if (classScore > 0.8) {
        this.addScore(classScore, 1, `Excellent class documentation (${Math.round(classDocRatio * 100)}% with quality JSDoc)`);
      }

      else if (classScore > 0.5) {
        this.addScore(classScore, 1, `Good class documentation (${Math.round(classDocRatio * 100)}% documented)`);
      }

      else {
        this.addScore(classScore, 1, `Basic class documentation (${Math.round(classDocRatio * 100)}% documented)`);
        this.addIssue('Class documentation needs improvement', 'Add comprehensive JSDoc with @example, @author, @version tags');
      }
    }

    // 2. Method-level JSDoc quality (1.5pt)    /**
   * Performs the specified operation
   * @param {boolean} analysis.methodDocumentation.total > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} analysis.methodDocumentation.total > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (analysis.methodDocumentation.total > 0) {
      const methodDocRatio = analysis.methodDocumentation.found / analysis.methodDocumentation.total;
      const methodQualityRatio = (analysis.methodDocumentation.withParams + analysis.methodDocumentation.withReturns + analysis.methodDocumentation.withThrows) / (analysis.methodDocumentation.total * 3);
      const methodScore = Math.min(1.5, (methodDocRatio * 1.0) + (methodQualityRatio * 0.5));
      totalScore += methodScore;      /**
   * Performs the specified operation
   * @param {any} methodScore > 1.2
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} methodScore > 1.2
   * @returns {any} The operation result
   */


      if (methodScore > 1.2) {
        this.addScore(methodScore, 1.5, 'Excellent method documentation with @param, @returns, @throws');
      }

      else if (methodScore > 0.8) {
        this.addScore(methodScore, 1.5, `Good method documentation (${Math.round(methodDocRatio * 100)}% documented)`);
      }

      else {
        this.addScore(methodScore, 1.5, `Basic method documentation (${Math.round(methodDocRatio * 100)}% documented)`);
        this.addIssue('Method documentation needs improvement', 'Add @param, @returns, @throws to method JSDoc');
      }
    }

    // 3. AI Context and Comment Quality (1pt)
    const aiContextScore = Math.min(0.5, analysis.aiContextAnnotations.found * 0.1);
    const commentQualityRatio = analysis.commentQuality.total > 0 ? analysis.commentQuality.intentful / analysis.commentQuality.total : 0;
    const commentQualityScore = Math.min(0.5, commentQualityRatio);
    const qualityScore = aiContextScore + commentQualityScore;
    totalScore += qualityScore;    /**
   * Performs the specified operation
   * @param {any} qualityScore > 0.8
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} qualityScore > 0.8
   * @returns {any} The operation result
   */


    if (qualityScore > 0.8) {
      this.addScore(qualityScore, 1, 'High-quality comments with AI context annotations');
    }

    else if (qualityScore > 0.5) {
      this.addScore(qualityScore, 1, 'Good comment quality with some intent documentation');
    }

    else {
      this.addScore(qualityScore, 1, 'Basic comment quality');
      this.addIssue('Comment quality needs improvement', 'Add @aiContext tags and intent-focused comments');
    }

    // Flag outdated or redundant comments    /**
   * Performs the specified operation
   * @param {boolean} analysis.commentQuality.outdated > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} analysis.commentQuality.outdated > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (analysis.commentQuality.outdated > 0) {
      this.addIssue(`${analysis.commentQuality.outdated} potentially outdated comments found`, 'Review and update outdated comments');
    }    /**
   * Performs the specified operation
   * @param {boolean} analysis.commentQuality.redundant > analysis.commentQuality.total * 0.2
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} analysis.commentQuality.redundant > analysis.commentQuality.total * 0.2
   * @returns {boolean} True if successful, false otherwise
   */

    if (analysis.commentQuality.redundant > analysis.commentQuality.total * 0.2) {
      this.addIssue('High ratio of redundant comments detected', 'Remove redundant comments, focus on intent and why');
    }

    // Calculate overall documentation ratio
    const totalDocumentable = analysis.classDocumentation.total + analysis.methodDocumentation.total;
    const totalDocumented = analysis.classDocumentation.found + analysis.methodDocumentation.found;
    analysis.overallRatio = totalDocumentable > 0 ? totalDocumented / totalDocumentable : 0;

    return {
      score: Math.min(maxScore, totalScore),
      details: analysis
    };
  }

  /**
   * Analyze JSDoc patterns in a single file
   */
  analyzeFileJSDoc(content) {
    const result = {
      classes: { total: 0, documented: 0, withExamples: 0, withMetadata: 0 },
      methods: { total: 0, documented: 0, withParams: 0, withReturns: 0, withThrows: 0 },
      aiAnnotations: { found: 0, intentComments: 0, algorithmComments: 0 },
      comments: { total: 0, intentful: 0, outdated: 0, redundant: 0 }
    };

    // Find class definitions
    const classRegex = /(?:export\s+)?class\s+\w+/g;
    const classMatches = content.match(classRegex) || [];
    result.classes.total = classMatches.length;

    // Find method/function definitions
    const methodRegex = /(?:async\s+)?(?:function\s+\w+|\w+\s*\(|\w+:\s*(?:async\s+)?(?:function|\())/g;
    const methodMatches = content.match(methodRegex) || [];
    result.methods.total = methodMatches.length;

    // Analyze JSDoc blocks
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
    let jsdocMatch;

    while ((jsdocMatch = jsdocRegex.exec(content)) !== null) {
      const jsdocContent = jsdocMatch[1];

      // Check for class-level JSDoc features
      if (this.isClassJSDoc(content, jsdocMatch.index)) {
        result.classes.documented++;
        if (jsdocContent.includes('@example')) {result.classes.withExamples++;}
        if (jsdocContent.includes('@author') || jsdocContent.includes('@version') || jsdocContent.includes('@since')) {
          result.classes.withMetadata++;
        }
      }

      // Check for method-level JSDoc features
      if (this.isMethodJSDoc(content, jsdocMatch.index)) {
        result.methods.documented++;
        if (jsdocContent.includes('@param')) {result.methods.withParams++;}
        if (jsdocContent.includes('@returns') || jsdocContent.includes('@return')) {result.methods.withReturns++;}
        if (jsdocContent.includes('@throws') || jsdocContent.includes('@exception')) {result.methods.withThrows++;}
      }

      // Check for AI context annotations
      if (jsdocContent.includes('@aiContext') || jsdocContent.includes('AI Context:') || jsdocContent.includes('AI Note:')) {
        result.aiAnnotations.found++;
      }

      if (jsdocContent.includes('@algorithm') || jsdocContent.includes('Algorithm:') || jsdocContent.includes('Decision Tree:')) {
        result.aiAnnotations.algorithmComments++;
      }
    }

    // Analyze regular comments
    const commentRegex = /\/\/\s*(.+)|\/\*\s*([\s\S]*?)\s*\*\//g;
    let commentMatch;

    while ((commentMatch = commentRegex.exec(content)) !== null) {
      const commentText = commentMatch[1] || commentMatch[2];
      if (commentText && !commentText.includes('*')) { // Skip JSDoc
        result.comments.total++;

        // Check for intent comments (AI Context, why explanations, etc.)
        if (commentText.includes('Intent:') || commentText.includes('Why:') || commentText.includes('Context:') ||
            commentText.includes('AI Context:') || commentText.includes('Note:') || commentText.includes('Important:')) {
          result.comments.intentful++;
          result.aiAnnotations.intentComments++;
        }

        // Detect potentially outdated comments
        if (commentText.includes('TODO:') || commentText.includes('FIXME:') || commentText.includes('deprecated')) {
          result.comments.outdated++;
        }

        // Detect redundant comments (very basic heuristic)
        if (commentText.toLowerCase().includes('return') && commentText.length < 30) {
          result.comments.redundant++;
        }
      }
    }

    return result;
  }

  /**
   * Check if JSDoc block precedes a class definition
   */
  isClassJSDoc(content, jsdocIndex) {
    const afterJSDoc = content.slice(jsdocIndex);
    const classMatch = afterJSDoc.match(/\*\/\s*(?:export\s+)?class\s+/);
    return classMatch && classMatch.index < 100; // JSDoc should be within 100 chars of class
  }

  /**
   * Check if JSDoc block precedes a method/function definition
   */
  isMethodJSDoc(content, jsdocIndex) {
    const afterJSDoc = content.slice(jsdocIndex);
    const methodMatch = afterJSDoc.match(/\*\/\s*(?:async\s+)?(?:function\s+\w+|\w+\s*\(|\w+:\s*(?:async\s+)?(?:function|\())/);
    return methodMatch && methodMatch.index < 100; // JSDoc should be within 100 chars of method
  }  /**
   * Calculates the result
   * @param {any} content
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} content
   * @returns {number} The calculated result
   */


  calculateCyclomaticComplexity(content) {
    // Simple approximation of cyclomatic complexity
    const complexityKeywords = [
      'if', 'else', 'while', 'for', 'foreach', 'switch', 'case',
      'catch', 'finally', '&&', '||', '?'
    ];

    let complexity = 1; // Base complexity    /**
   * Performs the specified operation
   * @param {any} const keyword of complexityKeywords
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const keyword of complexityKeywords
   * @returns {any} The operation result
   */


    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);      /**
   * Performs the specified operation
   * @param {any} matches
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} matches
   * @returns {any} The operation result
   */

      if (matches) {
        complexity += matches.length;
      }
    }

    // Account for ternary operators
    const ternaryMatches = content.match(/\?/g);    /**
   * Performs the specified operation
   * @param {any} ternaryMatches
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} ternaryMatches
   * @returns {any} The operation result
   */

    if (ternaryMatches) {
      complexity += ternaryMatches.length;
    }

    return complexity;
  }
}