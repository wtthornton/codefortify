/**
 * ProjectScorer - Main scoring orchestrator for Context7 projects
 *
 * Evaluates project quality across 7 categories with weighted scoring:
 * - Code Structure & Architecture (18pts)
 * - Code Quality & Maintainability (20pts)
 * - Performance & Optimization (12pts)
 * - Testing & Documentation (20pts) - Enhanced with test-first development analysis
 * - Error Handling & Security (15pts)
 * - Developer Experience & Tooling (10pts)
 * - Completeness & Production Readiness (5pts)
 * Total: 100pts
 */

import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { StructureAnalyzer } from './analyzers/StructureAnalyzer.js';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer.js';
import { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';
import { TestingAnalyzer } from './analyzers/TestingAnalyzer.js';
import { SecurityAnalyzer } from './analyzers/SecurityAnalyzer.js';
import { DeveloperExperienceAnalyzer } from './analyzers/DeveloperExperienceAnalyzer.js';
import { CompletenessAnalyzer } from './analyzers/CompletenessAnalyzer.js';
import { ScoringReport } from './ScoringReport.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { QualityHistory } from './QualityHistory.js';
import { QualityGates } from '../gates/QualityGates.js';
import { LearningLoopController } from '../learning/LearningLoopController.js';

/**


 * ProjectScorer class implementation


 *


 * Provides functionality for projectscorer operations


 */


/**


 * ProjectScorer class implementation


 *


 * Provides functionality for projectscorer operations


 */


export class ProjectScorer {
  /**
   * Create a new ProjectScorer instance
   * @param {Object} config - Configuration object
   * @param {string} [config.projectRoot] - Project root directory (default: process.cwd())
   * @param {string} [config.projectType] - Project type (default: 'javascript')
   * @param {string} [config.projectName] - Project name (default: basename of projectRoot)
   * @param {boolean} [config.verbose] - Enable verbose logging (default: false)
   * @param {Array<string>} [config.categories] - Categories to analyze (default: ['all'])
   */
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      projectName: config.projectName || path.basename(config.projectRoot || process.cwd()),
      verbose: config.verbose || false,
      categories: config.categories || ['all'],
      ...config
    };

    // QUICK WIN: Smart project type detection if not specified    /**
   * Performs the specified operation
   * @param {Object} !config.projectType || config.projectType - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} !config.projectType || config.projectType - Optional parameter
   * @returns {any} The operation result
   */

    if (!config.projectType || config.projectType === 'javascript') {
      this.config.projectType = this.detectProjectType();
    }

    this.analyzers = this.initializeAnalyzers();
    this.reportGenerator = new ScoringReport(this.config);
    this.recommendationEngine = new RecommendationEngine(this.config);
    this.qualityHistory = new QualityHistory(this.config);
    this.qualityGates = new QualityGates(this.config.gates || {});
    this.learningLoop = new LearningLoopController(this.config);

    this.results = {
      categories: {},
      overall: {
        score: 0,
        maxScore: 100,
        grade: 'F',
        timestamp: new Date().toISOString()
      },
      metadata: {
        projectRoot: this.config.projectRoot,
        projectType: this.config.projectType,
        projectName: this.config.projectName,
        version: '1.0.0'
      }
    };
  }

  /**
   * Initialize all analyzer instances with project configuration
   * @returns {Object} Map of analyzer instances by category key
   */
  initializeAnalyzers() {
    const baseConfig = {
      projectRoot: this.config.projectRoot,
      projectType: this.config.projectType,
      verbose: this.config.verbose
    };

    return {
      structure: new StructureAnalyzer({ ...baseConfig, maxScore: 18 }),
      quality: new QualityAnalyzer({ ...baseConfig, maxScore: 20 }),
      performance: new PerformanceAnalyzer({ ...baseConfig, maxScore: 12 }),
      testing: new TestingAnalyzer({ ...baseConfig, maxScore: 20 }),
      security: new SecurityAnalyzer({ ...baseConfig, maxScore: 15 }),
      developerExperience: new DeveloperExperienceAnalyzer({ ...baseConfig, maxScore: 10 }),
      completeness: new CompletenessAnalyzer({ ...baseConfig, maxScore: 5 })
    };
  }  /**
   * Performs the specified operation
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async scoreProject(options = {}) {
    const {
      categories = ['all'],
      // _skipCache = false, // Unused parameter
      detailed = false
    } = options;

    try {
      // LOG: `🎯 Analyzing ${this.config.projectName} project quality...`
      // LOG: ══════════════════════════════════════════════════════════
      // Check tool availability and provide guidance
      await this.checkToolAvailability();

      // Determine which categories to analyze
      const categoriesToAnalyze = categories.includes('all')
        ? Object.keys(this.analyzers)
        : categories.filter(cat => this.analyzers[cat]);      /**
   * Performs the specified operation
   * @param {any} categoriesToAnalyze.length - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} categoriesToAnalyze.length - Optional parameter
   * @returns {any} The operation result
   */


      if (categoriesToAnalyze.length === 0) {
        throw new Error(`No valid categories specified. Available: ${Object.keys(this.analyzers).join(', ')}`);
      }

      // Run analysis for each category      /**
   * Performs the specified operation
   * @param {any} const categoryKey of categoriesToAnalyze
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const categoryKey of categoriesToAnalyze
   * @returns {any} The operation result
   */

      for (const categoryKey of categoriesToAnalyze) {
        const analyzer = this.analyzers[categoryKey];        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


        if (this.config.verbose) {
          // LOG: `\n🔍 Analyzing ${analyzer.categoryName}...`
        }

        try {
          const result = await analyzer.analyze();
          this.results.categories[categoryKey] = {
            ...result,
            maxScore: result.maxScore || analyzer.maxScore,
            weight: analyzer.maxScore,
            categoryName: analyzer.categoryName
          };          /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
          /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


          if (this.config.verbose) {
            // LOG: `   Score: ${result.score}/${analyzer.maxScore}`
          }
        } catch (error) {
          // ERROR: `❌ Failed to analyze ${analyzer.categoryName}: ${error.message}`
          // Add failed category with 0 score
          this.results.categories[categoryKey] = {
            score: 0,
            maxScore: analyzer.maxScore,
            grade: 'F',
            issues: [`Analysis failed: ${error.message}`],
            suggestions: ['Fix analysis errors to get proper scoring'],
            details: {},
            weight: analyzer.maxScore,
            categoryName: analyzer.categoryName,
            error: error.message
          };
        }
      }

      // Calculate overall score
      this.calculateOverallScore();

      // Generate recommendations
      const recommendations = await this.recommendationEngine.generateRecommendations(this.results);
      this.results.recommendations = recommendations;

      // Generate enhanced prompts for recommendations
      try {
        const enhancedPrompts = await this.recommendationEngine.generateEnhancedPrompts(recommendations, {
          projectType: this.results.metadata.projectType,
          currentFile: null,
          recentFiles: []
        });
        this.results.enhancedPrompts = enhancedPrompts;
      } catch (error) {        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */

        if (this.config.verbose) {
          // WARN: `⚠️  Enhanced prompt generation failed: ${error.message}`
        }
        this.results.enhancedPrompts = [];
      }

      // Evaluate quality gates if enabled      /**
   * Performs the specified operation
   * @param {Object} this.config.gates?.enabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.gates?.enabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.gates?.enabled !== false) {
        const gatesResult = await this.qualityGates.evaluateResults(this.results);
        this.results.qualityGates = gatesResult;        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


        if (this.config.verbose) {
          // LOG: `🎯 Quality Gates: ${gatesResult.passed ? ✅ PASSED : ❌ FAILED}`
        }
      }

      // Add detailed analysis if requested      /**
   * Performs the specified operation
   * @param {any} detailed
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} detailed
   * @returns {any} The operation result
   */

      if (detailed) {
        this.results.detailed = await this.generateDetailedAnalysis();
      }

      // PHASE 2: Record quality history for trending
      const historyEntry = await this.qualityHistory.recordQualityScore(this.results, {
        analyzer: 'ProjectScorer',
        version: '1.1.1'
      });      /**
   * Performs the specified operation
   * @param {boolean} historyEntry
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} historyEntry
   * @returns {boolean} True if successful, false otherwise
   */


      if (historyEntry) {
        this.results.history = {
          recorded: true,
          improvements: historyEntry.improvements,
          trends: historyEntry.trends
        };

        // Add historical context to recommendations        /**
   * Performs the specified operation
   * @param {boolean} historyEntry.improvements && !historyEntry.improvements.isFirstRun
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} historyEntry.improvements && !historyEntry.improvements.isFirstRun
   * @returns {boolean} True if successful, false otherwise
   */

        if (historyEntry.improvements && !historyEntry.improvements.isFirstRun) {
          const { scoreChange, isImprovement, significantChange } = historyEntry.improvements;          /**
   * Performs the specified operation
   * @param {boolean} significantChange && isImprovement
   * @returns {boolean} True if successful, false otherwise
   */
          /**
   * Performs the specified operation
   * @param {boolean} significantChange && isImprovement
   * @returns {boolean} True if successful, false otherwise
   */


          if (significantChange && isImprovement) {
            // LOG: `🎉 Quality improved by ${scoreChange.toFixed(1)} points since last run!`
          } else if (significantChange && !isImprovement) {
            // LOG: `⚠️  Quality decreased by ${Math.abs(scoreChange).toFixed(1)} points since last run`
          }
        }
      }

      // 🔄 LEARNING LOOP: Process results for continuous improvement
      try {
        await this.learningLoop.processAnalysisResults(this.results);        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


        if (this.config.verbose) {
          // LOG: 🔄 Learning loop processed analysis results
        }
      } catch (error) {        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */

        if (this.config.verbose) {
          // WARN: `⚠️  Learning loop processing failed: ${error.message}`
        }
      }

      // LOG: \n✅ Analysis complete!
      return this.results;

    } catch (error) {
      // ERROR: `💥 Project scoring failed: ${error.message}`
      throw error;
    }
  }

  /**
   * Calculate the overall project score from all category scores
   * @returns {void}
   */
  calculateOverallScore() {
    let totalScore = 0;
    let maxTotalScore = 0;
    let hasErrors = false;

    for (const [, result] of Object.entries(this.results.categories)) {
      totalScore += result.score;
      maxTotalScore += result.maxScore;      /**
   * Performs the specified operation
   * @param {any} result.error
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} result.error
   * @returns {any} The operation result
   */


      if (result.error) {
        hasErrors = true;
      }
    }

    this.results.overall = {
      score: Math.round(totalScore),
      maxScore: maxTotalScore,
      percentage: Math.round((totalScore / maxTotalScore) * 100),
      grade: this.calculateGrade(totalScore / maxTotalScore),
      hasErrors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate letter grade based on percentage score
   * ENHANCED: Much more rigorous grading for true excellence
   * @param {number} percentage - Score percentage (0-1)
   * @returns {string} Letter grade (A+ to F)
   */
  calculateGrade(percentage) {
    // MUCH MORE RIGOROUS GRADING - A+ requires near-perfect code  /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.98) {return 'A+';}  // 98%+ for A+ (was 97%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.95) {return 'A';}   // 95%+ for A (was 93%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.92) {return 'A-';}  // 92%+ for A- (was 90%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.88) {return 'B+';}  // 88%+ for B+ (was 87%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.84) {return 'B';}   // 84%+ for B (was 83%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.80) {return 'B-';}  // 80%+ for B- (unchanged)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.76) {return 'C+';}  // 76%+ for C+ (was 77%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.72) {return 'C';}   // 72%+ for C (was 73%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.68) {return 'C-';}  // 68%+ for C- (was 70%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.64) {return 'D+';}  // 64%+ for D+ (was 67%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.60) {return 'D';}   // 60%+ for D (was 65%)    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.55) {return 'D-';}  // 55%+ for D- (was 60%)
    return 'F';
  }

  /**
   * Generate detailed analysis with file statistics and dependencies
   * @returns {Object} Detailed analysis data
   */
  async generateDetailedAnalysis() {
    return {
      fileStats: await this.getFileStatistics(),
      dependencyAnalysis: await this.analyzeDependencies(),
      projectMetrics: await this.calculateProjectMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get comprehensive file statistics for the project
   * @returns {Object} File statistics including counts by type and size
   */
  async getFileStatistics() {
    try {
      const stats = {
        totalFiles: 0,
        codeFiles: 0,
        testFiles: 0,
        configFiles: 0,
        totalLines: 0,
        languages: {}
      };

      const countFiles = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true });        /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */


        for (const file of files) {
          const fullPath = path.join(dir, file.name);

          if (file.isDirectory()) {
            // Skip node_modules, .git, etc.
            if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(file.name)) {
              continue;
            }
            await countFiles(fullPath);
          } else {
            stats.totalFiles++;

            const ext = path.extname(file.name);
            stats.languages[ext] = (stats.languages[ext] || 0) + 1;

            if (['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte'].includes(ext)) {
              stats.codeFiles++;
            } else if (['.test.js', '.spec.js', '.test.ts', '.spec.ts'].includes(ext) || file.name.includes('.test.') || file.name.includes('.spec.')) {
              stats.testFiles++;
            } else if (['.json', '.yml', '.yaml', '.config.js', '.config.ts'].includes(ext) || file.name.includes('config')) {
              stats.configFiles++;
            }
          }
        }
      };

      await countFiles(this.config.projectRoot);
      return stats;

    } catch (error) {
      return { error: error.message };
    }
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeDependencies() {
    try {
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;

      return {
        production: Object.keys(deps).length,
        development: Object.keys(devDeps).length,
        total: totalDeps,
        hasLockfile: await this.checkLockfileExists(),
        frameworks: this.identifyFrameworks(deps, devDeps),
        testingTools: this.identifyTestingTools(deps, devDeps),
        buildTools: this.identifyBuildTools(deps, devDeps)
      };

    } catch (error) {
      return { error: error.message };
    }
  }  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */


  async checkLockfileExists() {
    const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];    /**
   * Performs the specified operation
   * @param {any} const lockfile of lockfiles
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const lockfile of lockfiles
   * @returns {any} The operation result
   */


    for (const lockfile of lockfiles) {
      try {
        await fs.access(path.join(this.config.projectRoot, lockfile));
        return lockfile;
      } catch {
        continue;
      }
    }
    return false;
  }  /**
   * Performs the specified operation
   * @param {any} deps
   * @param {any} devDeps
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} deps
   * @param {any} devDeps
   * @returns {any} The operation result
   */


  identifyFrameworks(deps, devDeps) {
    const allDeps = { ...deps, ...devDeps };
    const frameworks = [];    /**
   * Performs the specified operation
   * @param {any} allDeps.react
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.react
   * @returns {any} The operation result
   */


    if (allDeps.react) {frameworks.push('React');}    /**
   * Performs the specified operation
   * @param {any} allDeps.vue
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.vue
   * @returns {any} The operation result
   */

    if (allDeps.vue) {frameworks.push('Vue');}    /**
   * Performs the specified operation
   * @param {any} allDeps.svelte
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.svelte
   * @returns {any} The operation result
   */

    if (allDeps.svelte) {frameworks.push('Svelte');}    /**
   * Performs the specified operation
   * @param {any} allDeps.angular || allDeps['@angular/core']
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.angular || allDeps['@angular/core']
   * @returns {any} The operation result
   */

    if (allDeps.angular || allDeps['@angular/core']) {frameworks.push('Angular');}    /**
   * Performs the specified operation
   * @param {any} allDeps.next
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.next
   * @returns {any} The operation result
   */

    if (allDeps.next) {frameworks.push('Next.js');}    /**
   * Performs the specified operation
   * @param {any} allDeps.nuxt
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.nuxt
   * @returns {any} The operation result
   */

    if (allDeps.nuxt) {frameworks.push('Nuxt.js');}    /**
   * Performs the specified operation
   * @param {any} allDeps.express
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.express
   * @returns {any} The operation result
   */

    if (allDeps.express) {frameworks.push('Express');}    /**
   * Performs the specified operation
   * @param {any} allDeps.fastify
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.fastify
   * @returns {any} The operation result
   */

    if (allDeps.fastify) {frameworks.push('Fastify');}

    return frameworks;
  }  /**
   * Tests the functionality
   * @param {any} deps
   * @param {any} devDeps
   * @returns {any} The operation result
   */
  /**
   * Tests the functionality
   * @param {any} deps
   * @param {any} devDeps
   * @returns {any} The operation result
   */


  identifyTestingTools(deps, devDeps) {
    const allDeps = { ...deps, ...devDeps };
    const tools = [];    /**
   * Performs the specified operation
   * @param {any} allDeps.vitest
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.vitest
   * @returns {any} The operation result
   */


    if (allDeps.vitest) {tools.push('Vitest');}    /**
   * Performs the specified operation
   * @param {any} allDeps.jest
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.jest
   * @returns {any} The operation result
   */

    if (allDeps.jest) {tools.push('Jest');}    /**
   * Performs the specified operation
   * @param {any} allDeps.mocha
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.mocha
   * @returns {any} The operation result
   */

    if (allDeps.mocha) {tools.push('Mocha');}    /**
   * Performs the specified operation
   * @param {any} allDeps.cypress
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.cypress
   * @returns {any} The operation result
   */

    if (allDeps.cypress) {tools.push('Cypress');}    /**
   * Performs the specified operation
   * @param {any} allDeps.playwright
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.playwright
   * @returns {any} The operation result
   */

    if (allDeps.playwright) {tools.push('Playwright');}    /**
   * Performs the specified operation
   * @param {any} allDeps['@testing-library/react']
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps['@testing-library/react']
   * @returns {any} The operation result
   */

    if (allDeps['@testing-library/react']) {tools.push('React Testing Library');}

    return tools;
  }  /**
   * Performs the specified operation
   * @param {any} deps
   * @param {any} devDeps
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} deps
   * @param {any} devDeps
   * @returns {any} The operation result
   */


  identifyBuildTools(deps, devDeps) {
    const allDeps = { ...deps, ...devDeps };
    const tools = [];    /**
   * Performs the specified operation
   * @param {any} allDeps.webpack
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.webpack
   * @returns {any} The operation result
   */


    if (allDeps.webpack) {tools.push('Webpack');}    /**
   * Performs the specified operation
   * @param {any} allDeps.vite
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.vite
   * @returns {any} The operation result
   */

    if (allDeps.vite) {tools.push('Vite');}    /**
   * Performs the specified operation
   * @param {any} allDeps.rollup
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.rollup
   * @returns {any} The operation result
   */

    if (allDeps.rollup) {tools.push('Rollup');}    /**
   * Performs the specified operation
   * @param {any} allDeps.parcel
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.parcel
   * @returns {any} The operation result
   */

    if (allDeps.parcel) {tools.push('Parcel');}    /**
   * Performs the specified operation
   * @param {any} allDeps.esbuild
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.esbuild
   * @returns {any} The operation result
   */

    if (allDeps.esbuild) {tools.push('ESBuild');}    /**
   * Performs the specified operation
   * @param {any} allDeps.typescript
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} allDeps.typescript
   * @returns {any} The operation result
   */

    if (allDeps.typescript) {tools.push('TypeScript');}

    return tools;
  }  /**
   * Calculates the result
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Calculates the result
   * @returns {Promise} Promise that resolves with the result
   */


  async calculateProjectMetrics() {
    return {
      complexity: await this.calculateComplexity(),
      maintainability: await this.calculateMaintainability(),
      technical_debt: await this.calculateTechnicalDebt()
    };
  }  /**
   * Calculates the result
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Calculates the result
   * @returns {Promise} Promise that resolves with the result
   */


  async calculateComplexity() {
    // Basic complexity metrics - could be enhanced with AST analysis
    const stats = await this.getFileStatistics();

    return {
      file_count_complexity: this.getComplexityScore(stats.codeFiles, [
        { threshold: 10, score: 'low' },
        { threshold: 50, score: 'medium' },
        { threshold: 100, score: 'high' }
      ]),
      dependency_complexity: this.results.categories.structure?.details?.dependencyCount ?
        this.getComplexityScore(this.results.categories.structure.details.dependencyCount, [
          { threshold: 20, score: 'low' },
          { threshold: 50, score: 'medium' },
          { threshold: 100, score: 'high' }
        ]) : 'unknown'
    };
  }  /**
   * Retrieves data
   * @param {any} value
   * @param {any} thresholds
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} value
   * @param {any} thresholds
   * @returns {string} The retrieved data
   */


  getComplexityScore(value, thresholds) {  /**
   * Performs the specified operation
   * @param {any} const { threshold
   * @param {any} score } of thresholds
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const { threshold
   * @param {any} score } of thresholds
   * @returns {any} The operation result
   */

    for (const { threshold, score } of thresholds) {      /**
   * Performs the specified operation
   * @param {any} value < - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} value < - Optional parameter
   * @returns {any} The operation result
   */

      if (value <= threshold) {return score;}
    }
    return 'very_high';
  }  /**
   * Calculates the result
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Calculates the result
   * @returns {Promise} Promise that resolves with the result
   */


  async calculateMaintainability() {
    const categories = this.results.categories;
    const factors = [];    /**
   * Performs the specified operation
   * @param {any} categories.quality
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} categories.quality
   * @returns {any} The operation result
   */


    if (categories.quality) {factors.push(categories.quality.score / categories.quality.maxScore);}    /**
   * Performs the specified operation
   * @param {any} categories.structure
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} categories.structure
   * @returns {any} The operation result
   */

    if (categories.structure) {factors.push(categories.structure.score / categories.structure.maxScore);}    /**
   * Performs the specified operation
   * @param {any} categories.testing
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} categories.testing
   * @returns {any} The operation result
   */

    if (categories.testing) {factors.push(categories.testing.score / categories.testing.maxScore);}

    const avgScore = factors.length > 0 ? factors.reduce((a, b) => a + b, 0) / factors.length : 0;

    return {
      score: Math.round(avgScore * 100),
      level: avgScore > 0.8 ? 'high' : avgScore > 0.6 ? 'medium' : 'low',
      factors: {
        code_quality: categories.quality?.score || 0,
        architecture: categories.structure?.score || 0,
        test_coverage: categories.testing?.score || 0
      }
    };
  }  /**
   * Calculates the result
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Calculates the result
   * @returns {Promise} Promise that resolves with the result
   */


  async calculateTechnicalDebt() {
    const issues = [];
    let debtScore = 0;

    for (const [categoryKey, result] of Object.entries(this.results.categories)) {      /**
   * Performs the specified operation
   * @param {boolean} result.issues && result.issues.length > 0
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} result.issues && result.issues.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

      if (result.issues && result.issues.length > 0) {
        issues.push(...result.issues.map(issue => ({ category: categoryKey, issue })));
        debtScore += result.issues.length;
      }
    }

    return {
      total_issues: issues.length,
      debt_score: Math.min(debtScore, 100), // Cap at 100
      level: debtScore < 5 ? 'low' : debtScore < 15 ? 'medium' : 'high',
      top_issues: issues.slice(0, 5) // Top 5 most critical issues
    };
  }

  /**
   * Check availability of key analysis tools and provide user guidance
   */
  async checkToolAvailability() {
    const availabilityStatus = {
      npm: false,
      eslint: false,
      coverage: false,
      suggestions: []
    };

    try {
      // Check npm availability
      try {
        const { execSync } = await import('child_process');
        execSync('npm --version', { stdio: 'ignore' });
        availabilityStatus.npm = true;
      } catch (error) {
        availabilityStatus.suggestions.push('🔧 Install npm for dependency vulnerability scanning');
      }

      // Check ESLint availability
      if (existsSync(path.join(this.config.projectRoot, 'package.json'))) {
        const packageJson = JSON.parse(readFileSync(path.join(this.config.projectRoot, 'package.json'), 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };        /**
   * Performs the specified operation
   * @param {any} deps.eslint
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps.eslint
   * @returns {any} The operation result
   */


        if (deps.eslint) {
          availabilityStatus.eslint = true;
        } else {
          const hasEslintConfig = existsSync(path.join(this.config.projectRoot, '.eslintrc.js')) ||
                                existsSync(path.join(this.config.projectRoot, '.eslintrc.json')) ||
                                existsSync(path.join(this.config.projectRoot, 'eslint.config.js'));          /**
   * Performs the specified operation
   * @param {Object} hasEslintConfig
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {Object} hasEslintConfig
   * @returns {any} The operation result
   */


          if (hasEslintConfig) {
            availabilityStatus.suggestions.push('🔧 Install ESLint: npm install --save-dev eslint');
          }
        }

        // Check coverage tools        /**
   * Performs the specified operation
   * @param {any} deps.c8 || deps.nyc || deps.jest
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps.c8 || deps.nyc || deps.jest
   * @returns {any} The operation result
   */

        if (deps.c8 || deps.nyc || deps.jest) {
          availabilityStatus.coverage = true;
        } else if (packageJson.scripts && packageJson.scripts.test) {
          availabilityStatus.suggestions.push('🔧 Add coverage: npm install --save-dev c8 (for vitest) or jest --coverage');
        }
      }

      // Display suggestions if any tools are missing      /**
   * Performs the specified operation
   * @param {any} availabilityStatus.suggestions.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} availabilityStatus.suggestions.length > 0
   * @returns {any} The operation result
   */

      if (availabilityStatus.suggestions.length > 0) {
        // LOG: \n💡 Tool Availability Recommendations:
        // LOG: ────────────────────────────────────────────────────────────
        availabilityStatus.suggestions.forEach(suggestion => console.log(suggestion));
        // LOG:
      }

      return availabilityStatus;
    } catch (error) {
      // Silently continue if availability check fails
      return availabilityStatus;
    }
  }

  /**
   * QUICK WIN: Smart project type detection based on dependencies and file structure
   * @returns {string} Detected project type
   */
  detectProjectType() {
    try {
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');

      // Check if package.json exists
      if (!existsSync(packageJsonPath)) {
        return 'javascript'; // Default fallback
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Enhanced detection logic with more specificity
      // Frontend frameworks (check in priority order)      /**
   * Performs the specified operation
   * @param {any} deps.react || deps['react-dom']
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.react || deps['react-dom']
   * @returns {any} The operation result
   */

      if (deps.react || deps['react-dom']) {        /**
   * Performs the specified operation
   * @param {any} deps['next'] || deps['gatsby']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['next'] || deps['gatsby']
   * @returns {any} The operation result
   */

        if (deps['next'] || deps['gatsby']) {return 'react-webapp';}        /**
   * Performs the specified operation
   * @param {any} deps['react-native']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['react-native']
   * @returns {any} The operation result
   */

        if (deps['react-native']) {return 'react-native';}
        return 'react-webapp';
      }      /**
   * Performs the specified operation
   * @param {any} deps.vue || deps['@vue/core']
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.vue || deps['@vue/core']
   * @returns {any} The operation result
   */


      if (deps.vue || deps['@vue/core']) {        /**
   * Performs the specified operation
   * @param {any} deps.nuxt
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps.nuxt
   * @returns {any} The operation result
   */

        if (deps.nuxt) {return 'vue-webapp';}
        return 'vue-webapp';
      }      /**
   * Performs the specified operation
   * @param {any} deps.svelte || deps['svelte-check']
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {any} deps.svelte || deps['svelte-check']
   * @returns {boolean} True if successful, false otherwise
   */


      if (deps.svelte || deps['svelte-check']) {        /**
   * Performs the specified operation
   * @param {any} deps['@sveltejs/kit']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['@sveltejs/kit']
   * @returns {any} The operation result
   */

        if (deps['@sveltejs/kit']) {return 'svelte-webapp';}
        return 'svelte-webapp';
      }      /**
   * Performs the specified operation
   * @param {any} deps.angular || deps['@angular/core']
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.angular || deps['@angular/core']
   * @returns {any} The operation result
   */


      if (deps.angular || deps['@angular/core']) {
        return 'angular-webapp';
      }

      // Backend frameworks      /**
   * Performs the specified operation
   * @param {any} deps.express || deps.fastify || deps.koa || deps.hapi
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.express || deps.fastify || deps.koa || deps.hapi
   * @returns {any} The operation result
   */

      if (deps.express || deps.fastify || deps.koa || deps.hapi) {
        return 'node-api';
      }

      // Context7/MCP specific detection
      if (deps['@modelcontextprotocol/sdk'] ||
          packageJson.name?.includes('mcp') ||
          packageJson.name?.includes('context7')) {
        return 'mcp-server';
      }

      // CLI tools      /**
   * Performs the specified operation
   * @param {any} deps.commander || deps.yargs || packageJson.bin
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.commander || deps.yargs || packageJson.bin
   * @returns {any} The operation result
   */

      if (deps.commander || deps.yargs || packageJson.bin) {
        return 'cli-tool';
      }

      // Check file structure for additional clues
      const hasPublicDir = existsSync(path.join(this.config.projectRoot, 'public'));
      const hasSrcDir = existsSync(path.join(this.config.projectRoot, 'src'));
      const hasIndexHtml = existsSync(path.join(this.config.projectRoot, 'index.html')) ||
                          existsSync(path.join(this.config.projectRoot, 'public/index.html'));      /**
   * Performs the specified operation
   * @param {number} hasPublicDir && hasIndexHtml
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {number} hasPublicDir && hasIndexHtml
   * @returns {any} The operation result
   */


      if (hasPublicDir && hasIndexHtml) {
        return 'webapp'; // Generic web application
      }      /**
   * Performs the specified operation
   * @param {number} hasSrcDir && !hasIndexHtml
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {number} hasSrcDir && !hasIndexHtml
   * @returns {any} The operation result
   */


      if (hasSrcDir && !hasIndexHtml) {
        return 'node-api'; // Likely server-side
      }

      // TypeScript project detection
      if (existsSync(path.join(this.config.projectRoot, 'tsconfig.json'))) {
        return deps.express ? 'node-api' : 'typescript';
      }

      return 'javascript'; // Default fallback

    } catch (error) {
      // WARN: `Project type detection failed: ${error.message}`
      return 'javascript';
    }
  }

  // Static factory methods
  static async scoreProject(projectRoot, options = {}) {
    const scorer = new ProjectScorer({
      projectRoot,
      ...options
    });

    return await scorer.scoreProject(options);
  }

  static async autoDetectAndScore(projectRoot = process.cwd(), options = {}) {
    // Auto-detect project configuration like Context7MCPServer does
    let projectType = 'javascript';
    let projectName = path.basename(projectRoot);

    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      projectName = packageJson.name || projectName;      /**
   * Performs the specified operation
   * @param {any} deps.react
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.react
   * @returns {any} The operation result
   */


      if (deps.react) {projectType = 'react-webapp';}
      else if (deps.vue) {projectType = 'vue-webapp';}
      else if (deps.svelte) {projectType = 'svelte-webapp';}
      else if (deps.express || deps.fastify || deps.koa) {projectType = 'node-api';}

    } catch (error) {
      // Use defaults
    }

    const scorer = new ProjectScorer({
      projectRoot,
      projectType,
      projectName,
      ...options
    });

    return await scorer.scoreProject(options);
  }
}