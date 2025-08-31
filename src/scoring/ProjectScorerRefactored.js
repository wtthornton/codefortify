/**
 * ProjectScorer - Refactored main scoring orchestrator
 *
 * Modular approach with separated concerns:
 * - ProjectTypeDetector: Smart project type detection
 * - ToolChecker: External tool availability checking
 * - ResultsProcessor: Results aggregation and processing
 * - Individual Analyzers: Category-specific analysis
 */

import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

// Core modules
import { ProjectTypeDetector } from './core/ProjectTypeDetector.js';
import { ToolChecker } from './core/ToolChecker.js';
import { ResultsProcessor } from './core/ResultsProcessor.js';
import { PerformanceMonitor } from './core/PerformanceMonitor.js';

// Analyzers
import { StructureAnalyzer } from './analyzers/StructureAnalyzer.js';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer.js';
import { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';
import { TestingAnalyzer } from './analyzers/TestingAnalyzer.js';
import { SecurityAnalyzer } from './analyzers/SecurityAnalyzer.js';
import { DeveloperExperienceAnalyzer } from './analyzers/DeveloperExperienceAnalyzer.js';
import { CompletenessAnalyzer } from './analyzers/CompletenessAnalyzer.js';

// Report generation
import { ScoringReport } from './ScoringReportRefactored.js';
import { RecommendationEngine } from './RecommendationEngine.js';

/**
 * ProjectScorer - Main orchestrator for project quality scoring
 *
 * Analyzes project quality across 7 categories with modular architecture:
 * - Code Structure & Architecture (20pts)
 * - Code Quality & Maintainability (20pts)
 * - Performance & Optimization (15pts)
 * - Testing & Documentation (15pts)
 * - Security & Error Handling (15pts)
 * - Developer Experience (10pts)
 * - Completeness & Production Readiness (5pts)
 *
 * @class ProjectScorer
 * @example
 * // Basic usage
 * const scorer = new ProjectScorer({
 *   projectRoot: '/path/to/project',
 *   projectType: 'react-webapp'
 * });
 * const results = await scorer.scoreProject();
 *
 * // With options
 * const results = await scorer.scoreProject({
 *   categories: ['structure', 'quality'],
 *   detailed: true
 * });
 */
export class ProjectScorer {
  /**
   * Create a new ProjectScorer instance
   *
   * @param {Object} config - Configuration options
   * @param {string} [config.projectRoot] - Project root directory path
   * @param {string} [config.projectType] - Project type (auto-detected if not specified)
   * @param {string} [config.projectName] - Project name (derived from directory if not specified)
   * @param {boolean} [config.verbose=false] - Enable verbose logging
   * @param {string[]} [config.categories=['all']] - Categories to analyze
   */
  constructor(config = {}) {
    this.config = this.initializeConfig(config);

    // Initialize core modules
    this.typeDetector = new ProjectTypeDetector(this.config.projectRoot);
    this.toolChecker = new ToolChecker(this.config.verbose);
    this.resultsProcessor = new ResultsProcessor(this.config);
    this.performanceMonitor = new PerformanceMonitor({
      projectRoot: this.config.projectRoot,
      verbose: this.config.verbose,
      enableBundleAnalysis: this.config.enableBundleAnalysis !== false
    });

    // Detect project type if not specified
    if (!config.projectType || config.projectType === 'javascript') {
      this.config.projectType = this.typeDetector.detectProjectType();
    }

    // Initialize analyzers and utilities
    this.analyzers = this.initializeAnalyzers();
    this.reportGenerator = new ScoringReport(this.config);
    this.recommendationEngine = new RecommendationEngine(this.config);
  }

  initializeConfig(config) {
    return {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      projectName: config.projectName || path.basename(config.projectRoot || process.cwd()),
      verbose: config.verbose || false,
      categories: config.categories || ['all'],
      ...config
    };
  }

  initializeAnalyzers() {
    const baseConfig = {
      projectRoot: this.config.projectRoot,
      projectType: this.config.projectType,
      verbose: this.config.verbose
    };

    return {
      structure: new StructureAnalyzer({ ...baseConfig, maxScore: 20 }),
      quality: new QualityAnalyzer({ ...baseConfig, maxScore: 20 }),
      performance: new PerformanceAnalyzer({ ...baseConfig, maxScore: 15 }),
      testing: new TestingAnalyzer({ ...baseConfig, maxScore: 15 }),
      security: new SecurityAnalyzer({ ...baseConfig, maxScore: 15 }),
      developerExperience: new DeveloperExperienceAnalyzer({ ...baseConfig, maxScore: 10 }),
      completeness: new CompletenessAnalyzer({ ...baseConfig, maxScore: 5 })
    };
  }

  /**
   * Analyze and score the project across specified categories
   *
   * @param {Object} [options={}] - Scoring options
   * @param {string[]} [options.categories=['all']] - Categories to analyze
   * @param {boolean} [options.detailed=false] - Include detailed analysis information
   * @returns {Promise<Object>} Complete scoring results with categories, overall score, and recommendations
   *
   * @example
   * // Score all categories
   * const results = await scorer.scoreProject();
   *
   * // Score specific categories with details
   * const results = await scorer.scoreProject({
   *   categories: ['structure', 'quality'],
   *   detailed: true
   * });
   *
   * console.log(`Overall score: ${results.overall.score}/${results.overall.maxScore}`);
   */
  async scoreProject(options = {}) {
    const { categories = ['all'], detailed = false } = options;

    // Start performance monitoring
    const overallTiming = this.performanceMonitor.startTiming('overall_analysis');
    this.performanceMonitor.recordMemoryUsage('start');

    try {
      console.log(`🎯 Analyzing ${this.config.projectName} project quality...`);
      console.log('══════════════════════════════════════════════════════════');

      // Check tool availability with timing
      const toolTiming = this.performanceMonitor.startTiming('tool_availability_check');
      const toolStatus = await this.toolChecker.checkToolAvailability();
      this.performanceMonitor.endTiming('tool_availability_check');

      // Determine categories to analyze
      const categoriesToAnalyze = this.determineCategoriesToAnalyze(categories);

      if (categoriesToAnalyze.length === 0) {
        throw new Error('No valid categories specified for analysis');
      }

      // Initialize results structure
      const results = this.resultsProcessor.initializeResults({
        projectRoot: this.config.projectRoot,
        projectType: this.config.projectType,
        projectName: this.config.projectName,
        version: await this.getProjectVersion()
      });

      // Run analysis for each category with performance monitoring
      const analysisTiming = this.performanceMonitor.startTiming('category_analysis');
      const analyzerResults = await this.runAnalyzers(categoriesToAnalyze, detailed);
      this.performanceMonitor.endTiming('category_analysis');
      this.performanceMonitor.recordMemoryUsage('after_analysis');

      // Process results with timing
      const processingTiming = this.performanceMonitor.startTiming('results_processing');
      this.resultsProcessor.processAnalyzerResults(analyzerResults, results);
      this.performanceMonitor.endTiming('results_processing');

      // Bundle analysis (if enabled)
      if (this.config.enableBundleAnalysis || options.bundleAnalysis) {
        const bundleTiming = this.performanceMonitor.startTiming('bundle_analysis');
        const bundleInfo = await this.performanceMonitor.analyzeBundleSize();
        this.performanceMonitor.endTiming('bundle_analysis');
        results.bundleAnalysis = bundleInfo;
      }

      // Add system information
      const systemInfo = await this.toolChecker.getSystemInfo();
      this.resultsProcessor.addSystemInfo(results, systemInfo);

      // Generate recommendations
      this.resultsProcessor.aggregateRecommendations(results);

      // Add performance metrics
      this.performanceMonitor.endTiming('overall_analysis');
      const performanceSummary = this.performanceMonitor.generatePerformanceSummary();
      results.performance = performanceSummary;

      // Validate results
      const validation = this.resultsProcessor.validateResults(results);
      if (!validation.isValid) {
        console.warn('Warning: Results validation failed:', validation.errors);
      }

      // Log performance summary if verbose
      if (this.config.verbose) {
        this.logPerformanceSummary(performanceSummary);
      }

      return results;

    } catch (error) {
      console.error(`❌ Scoring failed: ${error.message}`);
      if (this.config.verbose) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  determineCategoriesToAnalyze(categories) {
    if (categories.includes('all')) {
      return Object.keys(this.analyzers);
    }

    const validCategories = categories.filter(cat => this.analyzers[cat]);
    const invalid = categories.filter(cat => !this.analyzers[cat] && cat !== 'all');

    if (invalid.length > 0) {
      console.warn(`Warning: Invalid categories ignored: ${invalid.join(', ')}`);
    }

    return validCategories;
  }

  async runAnalyzers(categories, detailed) {
    const results = {};

    for (const category of categories) {
      const analyzer = this.analyzers[category];

      if (!analyzer) {
        console.warn(`Warning: No analyzer found for category: ${category}`);
        continue;
      }

      try {
        console.log(`📊 Analyzing ${analyzer.categoryName || category}...`);

        // Performance monitoring for individual analyzer
        const analyzerTiming = this.performanceMonitor.startTiming(`analyzer_${category}`);
        const result = await analyzer.analyze();
        this.performanceMonitor.endTiming(`analyzer_${category}`, {
          category: analyzer.categoryName || category,
          score: result.score,
          maxScore: result.maxScore
        });

        results[category] = {
          ...result,
          timestamp: new Date().toISOString()
        };

        if (detailed) {
          console.log(`✓ ${analyzer.categoryName || category} completed in ${analysisTime}ms`);
        }

      } catch (error) {
        console.error(`❌ Analysis failed for ${category}: ${error.message}`);

        results[category] = {
          categoryName: analyzer.categoryName || category,
          score: 0,
          maxScore: analyzer.maxScore,
          error: error.message,
          issues: [`Analysis failed: ${error.message}`],
          recommendations: []
        };
      }
    }

    return results;
  }

  async getProjectVersion() {
    try {
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || '1.0.0';
      }
    } catch (error) {
      // Ignore error and use default
    }

    return '1.0.0';
  }

  /**
   * Static factory method to score a project without creating an instance
   *
   * @static
   * @param {string} projectRoot - Path to the project root directory
   * @param {Object} [options={}] - Scoring configuration and options
   * @param {boolean} [options.verbose=false] - Enable verbose logging
   * @param {string[]} [options.categories] - Categories to analyze
   * @param {boolean} [options.detailed] - Include detailed analysis
   * @returns {Promise<Object>} Complete scoring results
   *
   * @example
   * const results = await ProjectScorer.scoreProject('/path/to/project', {
   *   categories: ['structure', 'quality'],
   *   verbose: true
   * });
   */
  static async scoreProject(projectRoot, options = {}) {
    const config = {
      projectRoot,
      verbose: options.verbose || false,
      ...options
    };

    const scorer = new ProjectScorer(config);
    return await scorer.scoreProject(options);
  }

  /**
   * Static method to automatically detect project type and score
   *
   * @static
   * @param {string} projectRoot - Path to the project root directory
   * @param {Object} [options={}] - Scoring options
   * @param {boolean} [options.verbose=false] - Enable verbose logging
   * @returns {Promise<Object>} Complete scoring results with auto-detected project metadata
   *
   * @example
   * // Automatically detect and score any project
   * const results = await ProjectScorer.autoDetectAndScore('/path/to/project');
   * console.log(`Detected type: ${results.metadata.projectType}`);
   */
  static async autoDetectAndScore(projectRoot, options = {}) {
    const detector = new ProjectTypeDetector(projectRoot);
    const projectType = detector.detectProjectType();

    const packageJsonPath = path.join(projectRoot, 'package.json');
    let projectName = path.basename(projectRoot);

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        projectName = packageJson.name || projectName;
      } catch {
        // Use default name
      }
    }

    const config = {
      projectRoot,
      projectType,
      projectName,
      verbose: options.verbose || false,
      ...options
    };

    const scorer = new ProjectScorer(config);
    return await scorer.scoreProject(options);
  }

  /**
   * Calculate letter grade from percentage score
   *
   * @param {number} percentage - Percentage score (0.0 to 1.0)
   * @returns {string} Letter grade (A+ to F)
   *
   * @example
   * const grade = scorer.calculateGrade(0.85); // Returns 'B+'
   */
  calculateGrade(percentage) {
    return this.resultsProcessor.calculateGrade(percentage);
  }

  /**
   * Get complexity score based on value and thresholds
   *
   * @param {number} value - Value to evaluate
   * @param {Array<{threshold: number, score: string}>} thresholds - Threshold definitions
   * @returns {string} Complexity level ('low', 'medium', 'high', 'very_high')
   *
   * @example
   * const complexity = scorer.getComplexityScore(25, [
   *   { threshold: 10, score: 'low' },
   *   { threshold: 50, score: 'medium' }
   * ]); // Returns 'medium'
   */
  getComplexityScore(value, thresholds) {
    return this.resultsProcessor.getComplexityScore(value, thresholds);
  }

  /**
   * Identify frameworks used in the project from dependencies
   *
   * @param {Object} [dependencies={}] - Production dependencies
   * @param {Object} [devDependencies={}] - Development dependencies
   * @returns {string[]} Array of identified framework names
   *
   * @example
   * const frameworks = scorer.identifyFrameworks(
   *   { react: '^18.0.0', express: '^4.18.0' },
   *   { '@testing-library/react': '^13.0.0' }
   * );
   * // Returns ['React', 'Express']
   */
  identifyFrameworks(dependencies = {}, devDependencies = {}) {
    return this.typeDetector.getProjectFrameworks(dependencies, devDependencies);
  }

  /**
   * Identify testing tools from project dependencies
   *
   * @param {Object} [dependencies={}] - Production dependencies
   * @param {Object} [devDependencies={}] - Development dependencies
   * @returns {string[]} Array of identified testing tool names
   *
   * @example
   * const tools = scorer.identifyTestingTools({}, {
   *   jest: '^29.0.0',
   *   cypress: '^12.0.0'
   * });
   * // Returns ['Jest', 'Cypress']
   */
  identifyTestingTools(dependencies = {}, devDependencies = {}) {
    const allDeps = { ...dependencies, ...devDependencies };
    const tools = [];

    if (allDeps.jest) {tools.push('Jest');}
    if (allDeps.vitest) {tools.push('Vitest');}
    if (allDeps.mocha) {tools.push('Mocha');}
    if (allDeps.jasmine) {tools.push('Jasmine');}
    if (allDeps.cypress) {tools.push('Cypress');}
    if (allDeps.playwright) {tools.push('Playwright');}
    if (allDeps['@testing-library/react']) {tools.push('React Testing Library');}
    if (allDeps['@testing-library/vue']) {tools.push('Vue Testing Library');}

    return tools;
  }

  /**
   * Identify build tools from project dependencies
   *
   * @param {Object} [dependencies={}] - Production dependencies
   * @param {Object} [devDependencies={}] - Development dependencies
   * @returns {string[]} Array of identified build tool names
   *
   * @example
   * const tools = scorer.identifyBuildTools({}, {
   *   webpack: '^5.0.0',
   *   typescript: '^5.0.0'
   * });
   * // Returns ['Webpack', 'TypeScript']
   */
  identifyBuildTools(dependencies = {}, devDependencies = {}) {
    const allDeps = { ...dependencies, ...devDependencies };
    const tools = [];

    if (allDeps.webpack) {tools.push('Webpack');}
    if (allDeps.vite) {tools.push('Vite');}
    if (allDeps.rollup) {tools.push('Rollup');}
    if (allDeps.parcel) {tools.push('Parcel');}
    if (allDeps.typescript) {tools.push('TypeScript');}
    if (allDeps.babel || allDeps['@babel/core']) {tools.push('Babel');}
    if (allDeps.esbuild) {tools.push('ESBuild');}
    if (allDeps.swc) {tools.push('SWC');}

    return tools;
  }

  /**
   * Log performance summary to console
   */
  logPerformanceSummary(summary) {
    console.log('\n📊 Performance Summary:');
    console.log(`⏱️  Total duration: ${summary.totalDuration}ms`);
    console.log(`💾 Peak memory usage: ${summary.memory.peak}MB`);
    console.log(`🔧 Operations completed: ${summary.operationCount}`);

    if (summary.slowestOperations.length > 0) {
      console.log('\n⚡ Slowest operations:');
      summary.slowestOperations.forEach((op, i) => {
        console.log(`   ${i + 1}. ${op.name}: ${op.duration}ms (${op.percentage}%)`);
      });
    }

    if (summary.bundle) {
      console.log('\n📦 Bundle analysis:');
      console.log(`   Source files: ${summary.bundle.sourceSize}`);
      console.log(`   Dependencies: ${summary.bundle.nodeModulesSize}`);
      console.log(`   Total packages: ${summary.bundle.totalPackages}`);
    }
  }

  /**
   * Cleanup performance monitor resources
   */
  cleanup() {
    if (this.performanceMonitor) {
      this.performanceMonitor.cleanup();
    }
  }
}