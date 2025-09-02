/**
 * QualityAgent - Code Quality and Maintainability Analysis
 * Focused on ESLint integration, documentation analysis, and code complexity
 */

import { IAnalysisAgent } from './IAnalysisAgent.js';
import { performance } from 'perf_hooks';
import path from 'path';

export class QualityAgent extends IAnalysisAgent {
  constructor(config = {}) {
    super(config);
    this.agentType = 'quality';
    this.categoryName = 'Code Quality & Maintainability';
    this.maxScore = 20;
    this.weight = 0.25;

    this.config = {
      enableESLint: true,
      enableComplexityAnalysis: true,
      enableDocumentationCheck: true,
      enableTypeScriptAnalysis: true,
      ...config
    };

    this.results = {
      score: 0,
      maxScore: this.maxScore,
      issues: [],
      suggestions: [],
      details: {},
      analysisTime: 0
    };
  }

  async execute(context) {
    const startTime = performance.now();

    try {
      await this.analyzeCodeQuality(context.projectRoot);
      await this.analyzeDocumentation(context.projectRoot);
      await this.analyzeComplexity(context.projectRoot);

      if (this.config.enableTypeScriptAnalysis) {
        await this.analyzeTypeScriptAdoption(context.projectRoot);
      }

      this.calculateFinalScore();
      this.results.analysisTime = performance.now() - startTime;

      return {
        agent: this.agentType,
        result: this.results,
        executionTime: this.results.analysisTime
      };

    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  async analyzeCodeQuality(projectRoot) {
    const analysis = {
      eslintScore: 0,
      issueCount: 0,
      codeStyleScore: 0
    };

    if (this.config.enableESLint) {
      try {
        const eslintResults = await this.runESLintAnalysis(projectRoot);
        analysis.eslintScore = this.calculateESLintScore(eslintResults);
        analysis.issueCount = eslintResults.totalIssues || 0;
      } catch (error) {
        this.results.issues.push({
          type: 'eslint-error',
          message: `ESLint analysis failed: ${error.message}`,
          severity: 'warning'
        });
      }
    }

    this.results.details.codeQuality = analysis;
    this.addScore(Math.min(analysis.eslintScore, 8), 8, 'ESLint Compliance');
  }

  async analyzeDocumentation(projectRoot) {
    const documentation = {
      jsDocCoverage: 0,
      readmeQuality: 0,
      commentQuality: 0
    };

    try {
      const jsFiles = await this.getJavaScriptFiles(projectRoot);
      documentation.jsDocCoverage = this.calculateJSDocCoverage(jsFiles);
      documentation.commentQuality = this.analyzeCommentQuality(jsFiles);

      const readmeExists = await this.checkFileExists(path.join(projectRoot, 'README.md'));
      documentation.readmeQuality = readmeExists ? 2 : 0;

    } catch (error) {
      this.results.issues.push({
        type: 'documentation-error',
        message: `Documentation analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.documentation = documentation;
    const docScore = Math.min(
      documentation.jsDocCoverage * 0.6 +
      documentation.commentQuality * 0.3 +
      documentation.readmeQuality * 0.1,
      6
    );
    this.addScore(docScore, 6, 'Documentation Quality');
  }

  async analyzeComplexity(projectRoot) {
    const complexity = {
      averageComplexity: 0,
      highComplexityFiles: 0,
      maintainabilityIndex: 0
    };

    try {
      const jsFiles = await this.getJavaScriptFiles(projectRoot);
      const complexityResults = await this.calculateComplexity(jsFiles);

      complexity.averageComplexity = complexityResults.average || 0;
      complexity.highComplexityFiles = complexityResults.highComplexity || 0;
      complexity.maintainabilityIndex = this.calculateMaintainabilityIndex(complexityResults);

    } catch (error) {
      this.results.issues.push({
        type: 'complexity-error',
        message: `Complexity analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.complexity = complexity;
    const complexityScore = Math.max(0, 4 - (complexity.averageComplexity / 3));
    this.addScore(complexityScore, 4, 'Code Complexity');
  }

  async analyzeTypeScriptAdoption(projectRoot) {
    const typescript = {
      adoption: 0,
      configurationQuality: 0,
      typesCoverage: 0
    };

    try {
      const tsConfigExists = await this.checkFileExists(path.join(projectRoot, 'tsconfig.json'));
      const tsFiles = await this.getTypeScriptFiles(projectRoot);
      const jsFiles = await this.getJavaScriptFiles(projectRoot);

      if (tsConfigExists) {
        typescript.configurationQuality = 1;
      }

      if (tsFiles.length > 0) {
        typescript.adoption = tsFiles.length / (tsFiles.length + jsFiles.length);
        typescript.typesCoverage = await this.analyzeTypesCoverage(tsFiles);
      }

    } catch (error) {
      this.results.issues.push({
        type: 'typescript-error',
        message: `TypeScript analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.typescript = typescript;
    const tsScore = typescript.adoption * 2;
    this.addScore(tsScore, 2, 'TypeScript Adoption');
  }

  calculateFinalScore() {
    this.results.score = Math.min(this.score, this.maxScore);
    this.results.percentage = Math.round((this.results.score / this.maxScore) * 100);
    this.results.grade = this.calculateGrade(this.results.percentage / 100);

    // Add suggestions based on analysis
    if (this.results.details.codeQuality?.eslintScore < 6) {
      this.results.suggestions.push({
        type: 'eslint',
        message: 'Consider addressing ESLint warnings and errors to improve code quality',
        priority: 'high'
      });
    }

    if (this.results.details.documentation?.jsDocCoverage < 0.5) {
      this.results.suggestions.push({
        type: 'documentation',
        message: 'Add JSDoc comments to improve code documentation',
        priority: 'medium'
      });
    }
  }

  async runESLintAnalysis(_projectRoot) {
    // Simplified ESLint integration - would integrate with actual ESLint in production
    return {
      totalIssues: 0,
      errorCount: 0,
      warningCount: 0,
      fixableIssues: 0
    };
  }

  calculateESLintScore(results) {
    if (!results || results.totalIssues === 0) {return 8;}

    // Score based on issue count (fewer issues = higher score)
    const issueScore = Math.max(0, 8 - (results.totalIssues / 100));
    return Math.min(issueScore, 8);
  }

  calculateJSDocCoverage(files) {
    // Simplified JSDoc coverage calculation
    return 0.5; // 50% default for now
  }

  analyzeCommentQuality(_files) {
    // Simplified comment quality analysis
    return 0.7; // 70% default quality
  }

  calculateComplexity(_files) {
    // Simplified complexity calculation
    return {
      average: 2.5,
      highComplexity: 0
    };
  }

  calculateMaintainabilityIndex(_results) {
    return 75; // Default maintainability index
  }

  async analyzeTypesCoverage(_files) {
    return 0.8; // 80% types coverage
  }

  async getJavaScriptFiles(projectRoot) {
    // Simplified file discovery
    return [`${projectRoot}/src/example.js`];
  }

  async getTypeScriptFiles(projectRoot) {
    // Simplified TS file discovery
    return [`${projectRoot}/src/example.ts`];
  }

  async checkFileExists(_filePath) {
    // Simplified file existence check
    return true;
  }
}