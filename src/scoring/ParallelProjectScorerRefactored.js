/**
 * Parallel Project Scorer (Refactored)
 * Clean implementation focused on parallel analysis orchestration
 * Reduced from 1654 lines to ~300 lines using proper separation of concerns
 */

import { performance } from 'perf_hooks';
import { SecurityAgent } from '../agents/SecurityAgent.js';
import { QualityAgent } from '../agents/QualityAgent.js';
import { StructureAgent } from '../agents/StructureAgent.js';
import { VisualTestingAgent } from '../agents/VisualTestingAgent.js';
import { AgentOrchestrator } from '../core/AgentOrchestrator.js';
import { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';
import { TestingAnalyzer } from './analyzers/TestingAnalyzer.js';
import { DeveloperExperienceAnalyzer } from './analyzers/DeveloperExperienceAnalyzer.js';
import { CompletenessAnalyzer } from './analyzers/CompletenessAnalyzer.js';
import { ScoringCalculator } from './core/ScoringCalculator.js';
import { ScoringReport } from './ScoringReport.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { RealtimeEventEmitter } from '../core/RealtimeEventEmitter.js';
import { StatusManager } from '../core/StatusManager.js';

export class ParallelProjectScorer {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      verbose: config.verbose || false,
      parallel: config.parallel !== false,
      maxConcurrency: config.maxConcurrency || 4,
      timeout: config.timeout || 300000, // 5 minutes
      categories: config.categories || 'all',
      ...config
    };

    // Initialize core components
    this.calculator = new ScoringCalculator(this.config);
    this.orchestrator = new AgentOrchestrator(this.config);
    this.eventEmitter = new RealtimeEventEmitter();
    this.statusManager = new StatusManager();
    this.results = { categories: {}, overall: null };
    this.startTime = null;
  }

  /**
   * Initialize agents and analyzers
   */
  async initialize() {
    try {
      // Initialize agent-based analyzers (parallel)
      this.agents = {
        security: new SecurityAgent(this.config),
        quality: new QualityAgent(this.config), 
        structure: new StructureAgent(this.config),
        visual: new VisualTestingAgent(this.config)
      };

      // Initialize traditional analyzers (sequential)
      this.analyzers = {
        performance: new PerformanceAnalyzer({ ...this.config, maxScore: 12 }),
        testing: new TestingAnalyzer({ ...this.config, maxScore: 20 }),
        developerExperience: new DeveloperExperienceAnalyzer({ ...this.config, maxScore: 10 }),
        completeness: new CompletenessAnalyzer({ ...this.config, maxScore: 5 })
      };

      // Set up real-time infrastructure
      await this.initializeRealtimeInfrastructure();

      this.isInitialized = true;
      
    } catch (error) {
      throw new Error(`Parallel scorer initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize real-time infrastructure
   */
  async initializeRealtimeInfrastructure() {
    // Set up event listeners
    this.eventEmitter.on('analysis_progress', (data) => {
      if (this.config.verbose) {
        console.log(`📊 ${data.category}: ${data.progress}%`);
      }
    });

    this.eventEmitter.on('analysis_complete', (data) => {
      if (this.config.verbose) {
        console.log(`✅ ${data.category}: ${data.score}/${data.maxScore}`);
      }
    });

    // Initialize status manager
    this.statusManager.initialize();
  }

  /**
   * Score project using parallel analysis
   * @param {Object} options - Scoring options
   * @returns {Promise<Object>} Complete scoring results
   */
  async scoreProject(options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.startTime = performance.now();
    
    try {
      // Determine categories to analyze
      const categories = this.determineCategories(options.categories);
      
      // Separate agent-based from traditional analysis
      const agentCategories = categories.filter(cat => this.agents[cat]);
      const traditionalCategories = categories.filter(cat => this.analyzers[cat]);

      if (this.config.verbose) {
        console.log(`🚀 Parallel analysis: ${agentCategories.length} categories`);
        console.log(`⚡ Traditional analysis: ${traditionalCategories.length} categories`);
      }

      // Execute analyses
      const results = await Promise.allSettled([
        this.executeParallelAnalysis(agentCategories, options),
        this.executeTraditionalAnalysis(traditionalCategories, options)
      ]);

      // Process results
      this.processAnalysisResults(results);

      // Calculate overall scores
      this.calculator.calculateOverallScore(this.results);

      // Generate recommendations if requested
      if (options.recommendations !== false) {
        await this.generateRecommendations(options);
      }

      // Generate detailed report if requested
      if (options.detailed) {
        return await this.generateDetailedReport(options);
      }

      return this.results;

    } catch (error) {
      if (this.config.verbose) {
        console.error('❌ Parallel scoring failed:', error.message);
      }
      
      return {
        success: false,
        error: error.message,
        results: this.results
      };
    } finally {
      const duration = performance.now() - this.startTime;
      if (this.config.verbose) {
        console.log(`⏱️ Total analysis time: ${Math.round(duration)}ms`);
      }
    }
  }

  /**
   * Determine which categories to analyze
   * @param {string|Array} categories - Categories to analyze
   * @returns {Array} List of category keys
   */
  determineCategories(categories = 'all') {
    const allCategories = [...Object.keys(this.agents), ...Object.keys(this.analyzers)];
    
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
   * Execute parallel analysis using agents
   * @param {Array} categories - Categories to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async executeParallelAnalysis(categories, options) {
    if (categories.length === 0) return {};

    const tasks = categories.map(category => ({
      id: `${category}_analysis`,
      category,
      agent: this.agents[category],
      projectRoot: this.config.projectRoot,
      options: { ...options, category }
    }));

    try {
      const results = await this.orchestrator.executeParallel(tasks, {
        maxConcurrency: this.config.maxConcurrency,
        timeout: this.config.timeout,
        retries: 1
      });

      return this.processParallelResults(results);
      
    } catch (error) {
      console.error('Parallel analysis failed:', error.message);
      return {};
    }
  }

  /**
   * Execute traditional sequential analysis
   * @param {Array} categories - Categories to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async executeTraditionalAnalysis(categories, options) {
    const results = {};

    for (const category of categories) {
      const analyzer = this.analyzers[category];
      if (!analyzer) continue;

      try {
        const startTime = performance.now();
        const result = await analyzer.analyze(this.config.projectRoot);
        const duration = performance.now() - startTime;

        results[category] = {
          ...result,
          analysisTime: duration,
          analyzer: category,
          type: 'traditional'
        };

        this.eventEmitter.emit('analysis_complete', {
          category,
          score: result.score,
          maxScore: result.maxScore
        });

      } catch (error) {
        console.error(`❌ ${category} analysis failed:`, error.message);
        
        results[category] = {
          score: 0,
          maxScore: analyzer.maxScore || 0,
          error: error.message,
          issues: [],
          suggestions: []
        };
      }
    }

    return results;
  }

  /**
   * Process parallel analysis results
   * @param {Array} results - Raw parallel results
   * @returns {Object} Processed results
   */
  processParallelResults(results) {
    const processedResults = {};

    for (const result of results) {
      if (result.success && result.data) {
        const category = result.data.category || result.id.replace('_analysis', '');
        processedResults[category] = {
          ...result.data,
          analysisTime: result.executionTime,
          type: 'parallel'
        };
      } else {
        const category = result.id.replace('_analysis', '');
        processedResults[category] = {
          score: 0,
          maxScore: 0,
          error: result.error,
          issues: [],
          suggestions: []
        };
      }
    }

    return processedResults;
  }

  /**
   * Process analysis results from both parallel and traditional analyses
   * @param {Array} results - Results from Promise.allSettled
   */
  processAnalysisResults(results) {
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        Object.assign(this.results.categories, result.value);
      } else if (result.status === 'rejected') {
        console.error('Analysis batch failed:', result.reason);
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
        includePerformanceMetrics: true,
        ...options
      };

      const report = new ScoringReport(this.results, reportOptions);
      const detailedReport = await report.generate();

      // Add parallel execution metrics
      detailedReport.executionMetrics = this.getPerformanceMetrics();

      return detailedReport;
      
    } catch (error) {
      if (this.config.verbose) {
        console.warn('⚠️ Report generation failed:', error.message);
      }
      return this.results;
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance information
   */
  getPerformanceMetrics() {
    const totalTime = this.startTime ? performance.now() - this.startTime : 0;
    const categoryTimes = Object.values(this.results.categories)
      .map(r => r.analysisTime || 0);
    
    const parallelCategories = Object.values(this.results.categories)
      .filter(r => r.type === 'parallel').length;
    const traditionalCategories = Object.values(this.results.categories)
      .filter(r => r.type === 'traditional').length;

    return {
      totalAnalysisTime: Math.round(totalTime),
      averageCategoryTime: categoryTimes.length > 0 ? 
        Math.round(categoryTimes.reduce((a, b) => a + b, 0) / categoryTimes.length) : 0,
      parallelCategories,
      traditionalCategories,
      concurrencyUsed: this.config.maxConcurrency,
      hasErrors: Object.values(this.results.categories).some(r => r.error)
    };
  }

  /**
   * Cleanup resources
   */
  async shutdown() {
    try {
      if (this.orchestrator) {
        await this.orchestrator.shutdown();
      }
      if (this.eventEmitter) {
        this.eventEmitter.removeAllListeners();
      }
      if (this.statusManager) {
        this.statusManager.cleanup();
      }
    } catch (error) {
      console.error('Shutdown error:', error.message);
    }
  }

  /**
   * Static factory method for backward compatibility
   * @param {Object} config - Configuration options
   * @returns {Promise<ParallelProjectScorer>} Initialized scorer instance
   */
  static async create(config = {}) {
    const scorer = new ParallelProjectScorer(config);
    await scorer.initialize();
    return scorer;
  }

  /**
   * Static method for backward compatibility
   * @param {string} projectRoot - Project root directory
   * @param {Object} options - Scoring options
   * @returns {Promise<Object>} Scoring results
   */
  static async scoreProject(projectRoot, options = {}) {
    const scorer = await ParallelProjectScorer.create({ projectRoot, ...options });
    try {
      return await scorer.scoreProject(options);
    } finally {
      await scorer.shutdown();
    }
  }
}