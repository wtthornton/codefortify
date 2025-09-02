/**
 * Project Scorer Core (Refactored)
 * Clean implementation focused on orchestrating analyzers
 * Reduced from 1557 lines to ~200 lines using proper separation of concerns
 */

import { StructureAnalyzer } from './analyzers/StructureAnalyzer.js';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer.js';
import { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';
import { TestingAnalyzer } from './analyzers/TestingAnalyzer.js';
import { SecurityAnalyzer } from './analyzers/SecurityAnalyzer.js';
import { DeveloperExperienceAnalyzer } from './analyzers/DeveloperExperienceAnalyzer.js';
import { CompletenessAnalyzer } from './analyzers/CompletenessAnalyzer.js';
import { ScoringCalculator } from './core/ScoringCalculator.js';
import { ScoringReport } from './ScoringReport.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { QualityHistory } from './QualityHistory.js';
import { QualityGates } from '../gates/QualityGates.js';

export class ProjectScorer {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      verbose: config.verbose || false,
      parallel: config.parallel !== false,
      categories: config.categories || 'all',
      ...config
    };

    // Initialize core components
    this.calculator = new ScoringCalculator(this.config);
    this.analyzers = this.initializeAnalyzers();
    this.results = { categories: {}, overall: null };
    this.startTime = null;
  }

  /**
   * Initialize all category analyzers
   * @returns {Object} Map of analyzer instances
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
  }

  /**
   * Score the entire project
   * @param {Object} options - Scoring options
   * @returns {Promise<Object>} Complete scoring results
   */
  async scoreProject(options = {}) {
    this.startTime = Date.now();
    
    try {
      // Determine which categories to analyze
      const categoriesToAnalyze = this.determineCategories(options.categories);
      
      if (this.config.verbose) {
        console.log(`📊 Analyzing ${categoriesToAnalyze.length} categories...`);
      }

      // Run analysis for each category
      await this.runCategoryAnalysis(categoriesToAnalyze, options);

      // Calculate overall scores
      this.calculator.calculateOverallScore(this.results);

      // Generate recommendations if requested
      if (options.recommendations !== false) {
        await this.generateRecommendations(options);
      }

      // Check quality gates
      if (this.config.gates?.enabled !== false) {
        await this.checkQualityGates();
      }

      // Record in quality history
      if (options.recordHistory !== false) {
        await this.recordQualityHistory();
      }

      // Generate detailed report if requested
      if (options.detailed) {
        return await this.generateDetailedReport(options);
      }

      return this.results;

    } catch (error) {
      if (this.config.verbose) {
        console.error('❌ Scoring failed:', error.message);
      }
      
      return {
        success: false,
        error: error.message,
        results: this.results
      };
    }
  }

  /**
   * Determine which categories to analyze
   * @param {string|Array} categories - Categories to analyze
   * @returns {Array} List of category keys
   */
  determineCategories(categories = 'all') {
    const allCategories = Object.keys(this.analyzers);
    
    if (categories === 'all' || !categories) {
      return allCategories;
    }
    
    if (Array.isArray(categories)) {
      return categories.filter(cat => allCategories.includes(cat));
    }
    
    if (typeof categories === 'string') {
      return categories.split(',').map(c => c.trim()).filter(cat => allCategories.includes(cat));
    }
    
    return allCategories;
  }

  /**
   * Run analysis for specified categories
   * @param {Array} categoriesToAnalyze - Categories to analyze
   * @param {Object} options - Analysis options
   */
  async runCategoryAnalysis(categoriesToAnalyze, options) {
    for (const categoryKey of categoriesToAnalyze) {
      const analyzer = this.analyzers[categoryKey];
      
      if (!analyzer) {
        console.warn(`⚠️ Unknown analyzer: ${categoryKey}`);
        continue;
      }

      try {
        if (this.config.verbose) {
          console.log(`🔍 Running ${categoryKey} analysis...`);
        }

        const startTime = Date.now();
        const result = await analyzer.analyze(this.config.projectRoot);
        const duration = Date.now() - startTime;

        this.results.categories[categoryKey] = {
          ...result,
          analysisTime: duration,
          analyzer: categoryKey
        };

        if (this.config.verbose) {
          console.log(`✅ ${categoryKey}: ${result.score}/${result.maxScore} (${Math.round((result.score/result.maxScore)*100)}%)`);
        }

      } catch (error) {
        console.error(`❌ ${categoryKey} analysis failed:`, error.message);
        
        this.results.categories[categoryKey] = {
          score: 0,
          maxScore: analyzer.maxScore || 0,
          error: error.message,
          issues: [],
          suggestions: []
        };
      }
    }
  }

  /**
   * Generate recommendations using the recommendation engine
   * @param {Object} options - Generation options
   */
  async generateRecommendations(options) {
    try {
      const engine = new RecommendationEngine(this.config);
      const recommendations = await engine.generateRecommendations(this.results, {
        maxRecommendations: options.maxRecommendations || 10,
        ...options
      });

      this.results.recommendations = recommendations;
      
    } catch (error) {
      if (this.config.verbose) {
        console.warn('⚠️ Recommendation generation failed:', error.message);
      }
    }
  }

  /**
   * Check quality gates and add results
   */
  async checkQualityGates() {
    try {
      const gates = new QualityGates(this.config.gates || {});
      const gateResults = await gates.checkGates(this.results);
      
      this.results.qualityGates = gateResults;
      
      if (this.config.verbose && gateResults.failed > 0) {
        console.log(`⚠️ ${gateResults.failed} quality gate(s) failed`);
      }
      
    } catch (error) {
      if (this.config.verbose) {
        console.warn('⚠️ Quality gates check failed:', error.message);
      }
    }
  }

  /**
   * Record results in quality history
   */
  async recordQualityHistory() {
    try {
      const history = new QualityHistory(this.config.projectRoot);
      await history.recordScore(this.results);
      
    } catch (error) {
      if (this.config.verbose) {
        console.warn('⚠️ History recording failed:', error.message);
      }
    }
  }

  /**
   * Generate detailed report
   * @param {Object} options - Report options
   * @returns {Object} Detailed report
   */
  async generateDetailedReport(options) {
    try {
      const reportOptions = {
        format: options.format || 'object',
        includeRecommendations: options.recommendations !== false,
        includeDetails: true,
        ...options
      };

      const report = new ScoringReport(this.results, reportOptions);
      return await report.generate();
      
    } catch (error) {
      if (this.config.verbose) {
        console.warn('⚠️ Report generation failed:', error.message);
      }
      return this.results;
    }
  }

  /**
   * Get available analyzer categories
   * @returns {Array<string>} Available category names
   */
  getAvailableCategories() {
    return Object.keys(this.analyzers);
  }

  /**
   * Get analysis results for a specific category
   * @param {string} category - Category name
   * @returns {Object|null} Category results
   */
  getCategoryResults(category) {
    return this.results.categories[category] || null;
  }

  /**
   * Get overall project score
   * @returns {Object|null} Overall score information
   */
  getOverallScore() {
    return this.results.overall;
  }

  /**
   * Check if analysis is complete
   * @returns {boolean} True if analysis completed
   */
  isAnalysisComplete() {
    return this.results.overall !== null;
  }

  /**
   * Get analysis performance metrics
   * @returns {Object} Performance information
   */
  getPerformanceMetrics() {
    const totalTime = this.startTime ? Date.now() - this.startTime : 0;
    const categoryTimes = Object.values(this.results.categories)
      .map(r => r.analysisTime || 0);
    
    return {
      totalAnalysisTime: totalTime,
      averageCategoryTime: categoryTimes.length > 0 ? 
        categoryTimes.reduce((a, b) => a + b, 0) / categoryTimes.length : 0,
      categoriesAnalyzed: Object.keys(this.results.categories).length,
      hasErrors: Object.values(this.results.categories).some(r => r.error)
    };
  }
}