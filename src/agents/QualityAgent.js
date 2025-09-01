/**
 * QualityAgent - Parallel-Safe Code Quality and Maintainability Analysis Agent
 *
 * Extends IAnalysisAgent with quality-specific parallel capabilities:
 * - Streaming ESLint integration with real-time results
 * - Concurrent documentation analysis
 * - Non-blocking complexity calculation
 * - Parallel TypeScript and consistency analysis
 */

import { IAnalysisAgent } from './IAnalysisAgent.js';
import path from 'path';

export class QualityAgent extends IAnalysisAgent {
  constructor(config = {}) {
    super(config);

    this.categoryName = 'Code Quality & Maintainability';
    this.description = 'Parallel code quality analysis with ESLint integration, documentation evaluation, complexity assessment, and consistency checking';
    this.agentType = 'quality';
    this.priority = 3; // Medium-high priority
    this.timeout = 60000; // Longer timeout for ESLint analysis

    // Quality-specific resource requirements
    this.resourceRequirements = {
      files: ['.eslintrc.js', '.eslintrc.json', 'tsconfig.json', 'README.md'],
      memory: 150, // MB - ESLint can be memory intensive
      cpu: 0.4, // 40% CPU for ESLint processing
      network: false // No network needed for quality analysis
    };

    // Analysis caches
    this.eslintCache = new Map();
    this.complexityCache = new Map();
    this.documentationCache = new Map();
    this.lastAnalysisRun = 0;
    this.analysisTimeout = 600000; // 10 minutes

    // Streaming results
    this.streamingResults = {
      linting: [],
      documentation: [],
      complexity: [],
      typescript: [],
      consistency: []
    };

    // Quality scoring weights
    this.scoringWeights = {
      linting: 6,
      documentation: 5,
      complexity: 4,
      typescript: 3,
      consistency: 2
    };
  }

  async setupResources() {
    await super.setupResources();

    // Initialize quality-specific resources
    this.initializeQualityModules();
  }

  initializeQualityModules() {
    // Set up complexity analysis patterns
    this.complexityPatterns = {
      keywords: [
        'if', 'else', 'while', 'for', 'foreach', 'switch', 'case',
        'catch', 'finally', '&&', '||', '?'
      ],

      documentationPatterns: {
        jsdocPattern: /\/\*\*([\s\S]*?)\*\//g,
        classPattern: /(?:export\s+)?class\s+\w+/g,
        methodPattern: /(?:async\s+)?(?:function\s+\w+|\w+\s*\(|\w+:\s*(?:async\s+)?(?:function|\())/g,
        commentPattern: /\/\/\s*(.+)|\/\*\s*([\s\S]*?)\s*\*\//g
      }
    };

    // Initialize progress tracking
    this.analysisProgress = {
      linting: { status: 'pending', progress: 0 },
      documentation: { status: 'pending', progress: 0 },
      complexity: { status: 'pending', progress: 0 },
      typescript: { status: 'pending', progress: 0 },
      consistency: { status: 'pending', progress: 0 }
    };
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];

    // Run quality analysis modules in parallel
    const analysisPromises = [
      this.analyzeLintingParallel(),
      this.analyzeDocumentationParallel(),
      this.analyzeComplexityParallel(),
      this.analyzeTypeScriptParallel(),
      this.analyzeConsistencyParallel()
    ];

    // Emit progress start
    this.emit('analysis:progress', {
      agentId: this.agentId,
      phase: 'quality_analysis',
      modules: ['linting', 'documentation', 'complexity', 'typescript', 'consistency'],
      status: 'running'
    });

    try {
      await Promise.all(analysisPromises);

      this.emit('analysis:progress', {
        agentId: this.agentId,
        phase: 'quality_analysis',
        status: 'completed',
        score: this.results.score,
        issues: this.results.issues.length
      });

    } catch (error) {
      this.emit('analysis:error', {
        agentId: this.agentId,
        phase: 'quality_analysis',
        error: error.message
      });
      throw error;
    }
  }

  async analyzeLintingParallel() {
    this.analysisProgress.linting.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.linting;

    try {
      this.emit('lint:started', { agentId: this.agentId });

      // Run ESLint analysis with caching
      const eslintResult = await this.runESLintAnalysisParallel();

      if (eslintResult.success && eslintResult.hasConfig) {
        const { errorCount, warningCount, ruleViolations } = eslintResult.data;

        // Score based on ESLint results (4pts)
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

        // Stream linting results
        this.streamingResults.linting.push({
          errorCount,
          warningCount,
          topRules: ruleViolations.slice(0, 5),
          timestamp: Date.now()
        });

        this.setDetail('eslintAnalysis', {
          errorCount,
          warningCount,
          topRuleViolations: ruleViolations.slice(0, 5)
        });

        this.emit('lint:completed', {
          agentId: this.agentId,
          errorCount,
          warningCount
        });

      } else if (eslintResult.hasConfig) {
        score += 2;
        this.addScore(2, 4, 'ESLint configured but analysis failed - using config detection');
        this.addIssue('ESLint analysis failed', `${eslintResult.error || 'Unable to run ESLint analysis'}`);

        this.emit('lint:degraded', {
          agentId: this.agentId,
          reason: eslintResult.error
        });
      } else {
        this.addIssue('No ESLint configuration found', 'Add ESLint: npx eslint --init');
        this.emit('lint:no_config', { agentId: this.agentId });
      }

      // Check for Prettier configuration in parallel (2pts)
      const hasPrettier = await this.checkPrettierConfigParallel();

      if (hasPrettier) {
        score += 2;
        this.addScore(2, 2, 'Prettier configuration found');
      } else {
        this.addIssue('No Prettier configuration found', 'Add Prettier for consistent code formatting');
      }

      this.setDetail('hasPrettier', hasPrettier);
      this.setDetail('hasEslintConfig', eslintResult.hasConfig);

    } catch (error) {
      this.addIssue('Linting analysis failed', `Error during ESLint analysis: ${error.message}`);
      this.emit('lint:failed', {
        agentId: this.agentId,
        error: error.message
      });
    }

    this.analysisProgress.linting.status = 'completed';
    this.analysisProgress.linting.progress = 100;
  }

  async runESLintAnalysisParallel() {
    const now = Date.now();

    // Check cache first
    if (this.lastAnalysisRun > 0 && (now - this.lastAnalysisRun) < this.analysisTimeout) {
      const cached = this.eslintCache.get('eslint-analysis');
      if (cached) {
        this.emit('eslint:cache_hit', { agentId: this.agentId });
        return cached;
      }
    }

    try {
      // Check if ESLint config exists
      const configChecks = [
        this.fileExists('.eslintrc.js'),
        this.fileExists('.eslintrc.json'),
        this.fileExists('.eslintrc.yaml'),
        this.fileExists('eslint.config.js'),
        this.fileExists('.eslintrc.yml')
      ];

      const configResults = await Promise.allSettled(configChecks);
      const hasConfig = configResults.some(result =>
        result.status === 'fulfilled' && result.value === true
      );

      if (!hasConfig) {
        return { success: false, hasConfig: false };
      }

      // Dynamic import ESLint
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

      // Get files to lint in parallel
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);

      if (files.length === 0) {
        const result = {
          success: true,
          hasConfig: true,
          data: { errorCount: 0, warningCount: 0, ruleViolations: [] }
        };
        this.eslintCache.set('eslint-analysis', result);
        return result;
      }

      // Process files in chunks for better performance
      const chunkSize = 5;
      const fileChunks = [];
      for (let i = 0; i < Math.min(files.length, 20); i += chunkSize) {
        fileChunks.push(files.slice(i, i + chunkSize));
      }

      // Analyze chunks in parallel
      const chunkPromises = fileChunks.map(chunk => this.lintFileChunk(eslint, chunk));
      const chunkResults = await Promise.allSettled(chunkPromises);

      // Aggregate results
      let errorCount = 0;
      let warningCount = 0;
      const ruleViolations = {};

      chunkResults.forEach(result => {
        if (result.status === 'fulfilled') {
          errorCount += result.value.errorCount;
          warningCount += result.value.warningCount;

          Object.entries(result.value.ruleViolations).forEach(([rule, count]) => {
            ruleViolations[rule] = (ruleViolations[rule] || 0) + count;
          });
        }
      });

      // Sort rule violations by frequency
      const sortedViolations = Object.entries(ruleViolations)
        .map(([rule, count]) => ({ rule, count }))
        .sort((a, b) => b.count - a.count);

      const analysisResult = {
        success: true,
        hasConfig: true,
        data: {
          errorCount,
          warningCount,
          ruleViolations: sortedViolations
        }
      };

      // Cache the result
      this.eslintCache.set('eslint-analysis', analysisResult);
      this.lastAnalysisRun = now;

      return analysisResult;

    } catch (error) {
      return {
        success: false,
        hasConfig: true,
        error: error.message
      };
    }
  }

  async lintFileChunk(eslint, files) {
    const filesToLint = files.map(f =>
      path.resolve(this.config.projectRoot || process.cwd(), f)
    );

    try {
      const results = await eslint.lintFiles(filesToLint);

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

      return { errorCount, warningCount, ruleViolations };
    } catch (error) {
      // Return empty results for failed chunks
      return { errorCount: 0, warningCount: 0, ruleViolations: {} };
    }
  }

  async checkPrettierConfigParallel() {
    const prettierChecks = [
      this.fileExists('.prettierrc'),
      this.fileExists('.prettierrc.json'),
      this.fileExists('prettier.config.js'),
      this.fileExists('.prettierrc.js')
    ];

    const results = await Promise.allSettled(prettierChecks);
    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }

  async analyzeDocumentationParallel() {
    this.analysisProgress.documentation.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.documentation;

    try {
      // Analyze README and JSDoc in parallel
      const [readmeAnalysis, jsdocAnalysis] = await Promise.all([
        this.analyzeReadmeParallel(),
        this.analyzeJSDocQualityParallel()
      ]);

      // Score README (1.5pts)
      score += readmeAnalysis.score;

      // Score JSDoc (3.5pts)
      score += jsdocAnalysis.score;

      // Stream documentation results
      this.streamingResults.documentation.push({
        readme: readmeAnalysis,
        jsdoc: jsdocAnalysis,
        timestamp: Date.now()
      });

      this.setDetail('jsdocAnalysis', jsdocAnalysis.details);
      this.setDetail('documentationRatio', jsdocAnalysis.details.overallRatio);
      this.setDetail('readmeQuality', readmeAnalysis.quality);

    } catch (error) {
      this.addIssue('Documentation analysis failed', `Error during analysis: ${error.message}`);
    }

    this.analysisProgress.documentation.status = 'completed';
    this.analysisProgress.documentation.progress = 100;
  }

  async analyzeReadmeParallel() {
    const hasReadme = await this.fileExists('README.md');
    let score = 0;
    let quality = 'none';

    if (hasReadme) {
      const readmeContent = await this.readFile('README.md');
      if (readmeContent.length > 500) {
        score += 1.5;
        quality = 'comprehensive';
        this.addScore(1.5, 1.5, 'Comprehensive README found');
      } else {
        score += 1;
        quality = 'basic';
        this.addScore(1, 1.5, 'Basic README found');
        this.addIssue('README is quite short', 'Expand README with setup instructions and project details');
      }
    } else {
      quality = 'none';
      this.addIssue('No README.md found', 'Add a README.md with project documentation');
    }

    return { score, quality, hasReadme };
  }

  async analyzeJSDocQualityParallel() {
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);

    // Process files in chunks for parallel analysis
    const chunkSize = 5;
    const fileChunks = [];
    for (let i = 0; i < Math.min(files.length, 15); i += chunkSize) {
      fileChunks.push(files.slice(i, i + chunkSize));
    }

    const chunkPromises = fileChunks.map(chunk => this.analyzeDocumentationChunk(chunk));
    const chunkResults = await Promise.allSettled(chunkResults);

    // Aggregate results
    const analysis = {
      classDocumentation: { found: 0, total: 0, withExamples: 0, withMetadata: 0 },
      methodDocumentation: { found: 0, total: 0, withParams: 0, withReturns: 0, withThrows: 0 },
      aiContextAnnotations: { found: 0, intentComments: 0, algorithmComments: 0 },
      commentQuality: { total: 0, intentful: 0, outdated: 0, redundant: 0 },
      overallRatio: 0
    };

    chunkResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const r = result.value;

        analysis.classDocumentation.found += r.classes.documented;
        analysis.classDocumentation.total += r.classes.total;
        analysis.classDocumentation.withExamples += r.classes.withExamples;
        analysis.classDocumentation.withMetadata += r.classes.withMetadata;

        analysis.methodDocumentation.found += r.methods.documented;
        analysis.methodDocumentation.total += r.methods.total;
        analysis.methodDocumentation.withParams += r.methods.withParams;
        analysis.methodDocumentation.withReturns += r.methods.withReturns;
        analysis.methodDocumentation.withThrows += r.methods.withThrows;

        analysis.aiContextAnnotations.found += r.aiAnnotations.found;
        analysis.aiContextAnnotations.intentComments += r.aiAnnotations.intentComments;
        analysis.aiContextAnnotations.algorithmComments += r.aiAnnotations.algorithmComments;

        analysis.commentQuality.total += r.comments.total;
        analysis.commentQuality.intentful += r.comments.intentful;
        analysis.commentQuality.outdated += r.comments.outdated;
        analysis.commentQuality.redundant += r.comments.redundant;
      }
    });

    // Calculate scores based on analysis
    let totalScore = 0;
    const maxScore = 3.5;

    // 1. Class-level JSDoc quality (1pt)
    if (analysis.classDocumentation.total > 0) {
      const classDocRatio = analysis.classDocumentation.found / analysis.classDocumentation.total;
      const classQualityBonus = (analysis.classDocumentation.withExamples + analysis.classDocumentation.withMetadata) / (analysis.classDocumentation.total * 2);
      const classScore = Math.min(1, classDocRatio + classQualityBonus);
      totalScore += classScore;

      if (classScore > 0.8) {
        this.addScore(classScore, 1, `Excellent class documentation (${Math.round(classDocRatio * 100)}% with quality JSDoc)`);
      } else if (classScore > 0.5) {
        this.addScore(classScore, 1, `Good class documentation (${Math.round(classDocRatio * 100)}% documented)`);
      } else {
        this.addScore(classScore, 1, `Basic class documentation (${Math.round(classDocRatio * 100)}% documented)`);
        this.addIssue('Class documentation needs improvement', 'Add comprehensive JSDoc with @example, @author, @version tags');
      }
    }

    // 2. Method-level JSDoc quality (1.5pt)
    if (analysis.methodDocumentation.total > 0) {
      const methodDocRatio = analysis.methodDocumentation.found / analysis.methodDocumentation.total;
      const methodQualityRatio = (analysis.methodDocumentation.withParams + analysis.methodDocumentation.withReturns + analysis.methodDocumentation.withThrows) / (analysis.methodDocumentation.total * 3);
      const methodScore = Math.min(1.5, (methodDocRatio * 1.0) + (methodQualityRatio * 0.5));
      totalScore += methodScore;

      if (methodScore > 1.2) {
        this.addScore(methodScore, 1.5, 'Excellent method documentation with @param, @returns, @throws');
      } else if (methodScore > 0.8) {
        this.addScore(methodScore, 1.5, `Good method documentation (${Math.round(methodDocRatio * 100)}% documented)`);
      } else {
        this.addScore(methodScore, 1.5, `Basic method documentation (${Math.round(methodDocRatio * 100)}% documented)`);
        this.addIssue('Method documentation needs improvement', 'Add @param, @returns, @throws to method JSDoc');
      }
    }

    // 3. AI Context and Comment Quality (1pt)
    const aiContextScore = Math.min(0.5, analysis.aiContextAnnotations.found * 0.1);
    const commentQualityRatio = analysis.commentQuality.total > 0 ? analysis.commentQuality.intentful / analysis.commentQuality.total : 0;
    const commentQualityScore = Math.min(0.5, commentQualityRatio);
    const qualityScore = aiContextScore + commentQualityScore;
    totalScore += qualityScore;

    if (qualityScore > 0.8) {
      this.addScore(qualityScore, 1, 'High-quality comments with AI context annotations');
    } else if (qualityScore > 0.5) {
      this.addScore(qualityScore, 1, 'Good comment quality with some intent documentation');
    } else {
      this.addScore(qualityScore, 1, 'Basic comment quality');
      this.addIssue('Comment quality needs improvement', 'Add @aiContext tags and intent-focused comments');
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

  async analyzeDocumentationChunk(files) {
    const result = {
      classes: { total: 0, documented: 0, withExamples: 0, withMetadata: 0 },
      methods: { total: 0, documented: 0, withParams: 0, withReturns: 0, withThrows: 0 },
      aiAnnotations: { found: 0, intentComments: 0, algorithmComments: 0 },
      comments: { total: 0, intentful: 0, outdated: 0, redundant: 0 }
    };

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const fileAnalysis = this.analyzeFileJSDoc(content);

        // Aggregate file results
        result.classes.total += fileAnalysis.classes.total;
        result.classes.documented += fileAnalysis.classes.documented;
        result.classes.withExamples += fileAnalysis.classes.withExamples;
        result.classes.withMetadata += fileAnalysis.classes.withMetadata;

        result.methods.total += fileAnalysis.methods.total;
        result.methods.documented += fileAnalysis.methods.documented;
        result.methods.withParams += fileAnalysis.methods.withParams;
        result.methods.withReturns += fileAnalysis.methods.withReturns;
        result.methods.withThrows += fileAnalysis.methods.withThrows;

        result.aiAnnotations.found += fileAnalysis.aiAnnotations.found;
        result.aiAnnotations.intentComments += fileAnalysis.aiAnnotations.intentComments;
        result.aiAnnotations.algorithmComments += fileAnalysis.aiAnnotations.algorithmComments;

        result.comments.total += fileAnalysis.comments.total;
        result.comments.intentful += fileAnalysis.comments.intentful;
        result.comments.outdated += fileAnalysis.comments.outdated;
        result.comments.redundant += fileAnalysis.comments.redundant;

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return result;
  }

  async analyzeComplexityParallel() {
    this.analysisProgress.complexity.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.complexity;

    try {
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);

      // Process files in parallel chunks
      const chunkSize = 5;
      const fileChunks = [];
      for (let i = 0; i < Math.min(files.length, 20); i += chunkSize) {
        fileChunks.push(files.slice(i, i + chunkSize));
      }

      const chunkPromises = fileChunks.map(chunk => this.analyzeComplexityChunk(chunk));
      const chunkResults = await Promise.allSettled(chunkPromises);

      // Aggregate complexity results
      let totalComplexity = 0;
      let analyzedFiles = 0;

      chunkResults.forEach(result => {
        if (result.status === 'fulfilled') {
          totalComplexity += result.value.totalComplexity;
          analyzedFiles += result.value.analyzedFiles;
        }
      });

      const avgComplexity = analyzedFiles > 0 ? totalComplexity / analyzedFiles : 0;

      // Score based on average complexity
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

      // Stream complexity results
      this.streamingResults.complexity.push({
        averageComplexity: avgComplexity,
        analyzedFiles,
        timestamp: Date.now()
      });

      this.setDetail('averageComplexity', avgComplexity);

    } catch (error) {
      this.addIssue('Complexity analysis failed', `Error during analysis: ${error.message}`);
    }

    this.analysisProgress.complexity.status = 'completed';
    this.analysisProgress.complexity.progress = 100;
  }

  async analyzeComplexityChunk(files) {
    let totalComplexity = 0;
    let analyzedFiles = 0;

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const complexity = this.calculateCyclomaticComplexity(content);
        totalComplexity += complexity;
        analyzedFiles++;
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return { totalComplexity, analyzedFiles };
  }

  async analyzeTypeScriptParallel() {
    this.analysisProgress.typescript.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.typescript;

    try {
      // Check TypeScript configuration and files in parallel
      const [hasTypeScript, tsFiles, jsFiles] = await Promise.all([
        this.fileExists('tsconfig.json'),
        this.getAllFiles('', ['.ts', '.tsx']),
        this.getAllFiles('', ['.js', '.jsx'])
      ]);

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

      // Stream TypeScript results
      this.streamingResults.typescript.push({
        hasTypeScript,
        tsFiles: tsFiles.length,
        jsFiles: jsFiles.length,
        adoption: tsFiles.length / (tsFiles.length + jsFiles.length || 1),
        timestamp: Date.now()
      });

      this.setDetail('hasTypeScript', hasTypeScript);
      this.setDetail('typeScriptFiles', tsFiles.length);
      this.setDetail('javaScriptFiles', jsFiles.length);

    } catch (error) {
      this.addIssue('TypeScript analysis failed', `Error during analysis: ${error.message}`);
    }

    this.analysisProgress.typescript.status = 'completed';
    this.analysisProgress.typescript.progress = 100;
  }

  async analyzeConsistencyParallel() {
    this.analysisProgress.consistency.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.consistency;

    try {
      // Analyze module patterns in parallel
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
      const chunkSize = 5;
      const fileChunks = [];

      for (let i = 0; i < Math.min(files.length, 20); i += chunkSize) {
        fileChunks.push(files.slice(i, i + chunkSize));
      }

      const chunkPromises = fileChunks.map(chunk => this.analyzeConsistencyChunk(chunk));
      const chunkResults = await Promise.allSettled(chunkPromises);

      // Aggregate consistency results
      let esModuleCount = 0;
      let commonjsCount = 0;

      chunkResults.forEach(result => {
        if (result.status === 'fulfilled') {
          esModuleCount += result.value.esModuleCount;
          commonjsCount += result.value.commonjsCount;
        }
      });

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

      // Stream consistency results
      this.streamingResults.consistency.push({
        esModuleCount,
        commonjsCount,
        consistency: consistency || 0,
        timestamp: Date.now()
      });

      this.setDetail('esModuleCount', esModuleCount);
      this.setDetail('commonjsCount', commonjsCount);

    } catch (error) {
      this.addIssue('Consistency analysis failed', `Error during analysis: ${error.message}`);
    }

    this.analysisProgress.consistency.status = 'completed';
    this.analysisProgress.consistency.progress = 100;
  }

  async analyzeConsistencyChunk(files) {
    let esModuleCount = 0;
    let commonjsCount = 0;

    for (const file of files) {
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

    return { esModuleCount, commonjsCount };
  }

  // Utility methods (reused from QualityAnalyzer)
  analyzeFileJSDoc(content) {
    const result = {
      classes: { total: 0, documented: 0, withExamples: 0, withMetadata: 0 },
      methods: { total: 0, documented: 0, withParams: 0, withReturns: 0, withThrows: 0 },
      aiAnnotations: { found: 0, intentComments: 0, algorithmComments: 0 },
      comments: { total: 0, intentful: 0, outdated: 0, redundant: 0 }
    };

    // Find class and method definitions
    const classMatches = content.match(this.complexityPatterns.documentationPatterns.classPattern) || [];
    const methodMatches = content.match(this.complexityPatterns.documentationPatterns.methodPattern) || [];

    result.classes.total = classMatches.length;
    result.methods.total = methodMatches.length;

    // Analyze JSDoc blocks
    let jsdocMatch;
    const jsdocRegex = this.complexityPatterns.documentationPatterns.jsdocPattern;
    jsdocRegex.lastIndex = 0; // Reset regex state

    while ((jsdocMatch = jsdocRegex.exec(content)) !== null) {
      const jsdocContent = jsdocMatch[1];

      if (this.isClassJSDoc(content, jsdocMatch.index)) {
        result.classes.documented++;
        if (jsdocContent.includes('@example')) {result.classes.withExamples++;}
        if (jsdocContent.includes('@author') || jsdocContent.includes('@version')) {
          result.classes.withMetadata++;
        }
      }

      if (this.isMethodJSDoc(content, jsdocMatch.index)) {
        result.methods.documented++;
        if (jsdocContent.includes('@param')) {result.methods.withParams++;}
        if (jsdocContent.includes('@returns') || jsdocContent.includes('@return')) {result.methods.withReturns++;}
        if (jsdocContent.includes('@throws') || jsdocContent.includes('@exception')) {result.methods.withThrows++;}
      }

      if (jsdocContent.includes('@aiContext') || jsdocContent.includes('AI Context:')) {
        result.aiAnnotations.found++;
      }
    }

    return result;
  }

  isClassJSDoc(content, jsdocIndex) {
    const afterJSDoc = content.slice(jsdocIndex);
    const classMatch = afterJSDoc.match(/\*\/\s*(?:export\s+)?class\s+/);
    return classMatch && classMatch.index < 100;
  }

  isMethodJSDoc(content, jsdocIndex) {
    const afterJSDoc = content.slice(jsdocIndex);
    const methodMatch = afterJSDoc.match(/\*\/\s*(?:async\s+)?(?:function\s+\w+|\w+\s*\(|\w+:\s*(?:async\s+)?(?:function|\())/);
    return methodMatch && methodMatch.index < 100;
  }

  calculateCyclomaticComplexity(content) {
    let complexity = 1; // Base complexity

    for (const keyword of this.complexityPatterns.keywords) {
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

  /**
   * Get streaming quality analysis results
   */
  getStreamingResults() {
    return this.streamingResults;
  }

  /**
   * Get analysis progress
   */
  getAnalysisProgress() {
    return this.analysisProgress;
  }

  /**
   * Clear analysis caches
   */
  clearCaches() {
    this.eslintCache.clear();
    this.complexityCache.clear();
    this.documentationCache.clear();
    this.lastAnalysisRun = 0;
  }

  /**
   * Get quality-specific metrics
   */
  getQualityMetrics() {
    return {
      ...this.getMetrics(),
      caches: {
        eslintCacheSize: this.eslintCache.size,
        complexityCacheSize: this.complexityCache.size,
        documentationCacheSize: this.documentationCache.size,
        lastAnalysisRun: this.lastAnalysisRun
      },
      progress: this.analysisProgress,
      streaming: {
        lintingResults: this.streamingResults.linting.length,
        documentationResults: this.streamingResults.documentation.length,
        complexityResults: this.streamingResults.complexity.length,
        typescriptResults: this.streamingResults.typescript.length,
        consistencyResults: this.streamingResults.consistency.length
      }
    };
  }
}