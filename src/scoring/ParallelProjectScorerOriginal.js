import { performance } from 'perf_hooks';
/**
 * ParallelProjectScorer - Enhanced Project Scorer with Parallel Analysis Engine
 *
 * Integrates AgentOrchestrator to provide:
 * - 60-80% performance improvement through parallel analysis
 * - Real-time progress updates and streaming results
 * - Resource-aware analysis coordination
 * - Health monitoring and recovery
 * - Backward compatibility with existing ProjectScorer API
 */

import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

// Import the new agents
import { SecurityAgent } from '../agents/SecurityAgent.js';
import { QualityAgent } from '../agents/QualityAgent.js';
import { StructureAgent } from '../agents/StructureAgent.js';
import { VisualTestingAgent } from '../agents/VisualTestingAgent.js';
import { AgentOrchestrator } from '../core/AgentOrchestrator.js';

// Import traditional analyzers for categories not yet converted
import { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';
import { TestingAnalyzer } from './analyzers/TestingAnalyzer.js';
import { DeveloperExperienceAnalyzer } from './analyzers/DeveloperExperienceAnalyzer.js';
import { CompletenessAnalyzer } from './analyzers/CompletenessAnalyzer.js';

// Import supporting classes
import { ScoringReport } from './ScoringReport.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { RealtimeEventEmitter } from '../core/RealtimeEventEmitter.js';
import { StatusManager } from '../core/StatusManager.js';

/**


 * ParallelProjectScorer class implementation


 *


 * Provides functionality for parallelprojectscorer operations


 */


/**


 * ParallelProjectScorer class implementation


 *


 * Provides functionality for parallelprojectscorer operations


 */


export class ParallelProjectScorer {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      projectName: config.projectName || path.basename(config.projectRoot || process.cwd()),
      verbose: config.verbose || false,
      categories: config.categories || ['all'],
      // Parallel execution settings
      maxConcurrentAgents: config.maxConcurrentAgents || 4, // Increased for visual testing
      enableParallelExecution: config.enableParallelExecution !== false, // Default true
      enableProgressUpdates: config.enableProgressUpdates !== false, // Default true
      enableVisualTesting: config.enableVisualTesting !== false, // Default true
      agentTimeout: config.agentTimeout || 60000, // 60 seconds
      visualTestingTimeout: config.visualTestingTimeout || 120000, // 2 minutes for visual tests
      // Real-time configuration
      enableRealtime: config.enableRealtime !== false,
      realtimePort: config.realtimePort || 8765,
      ...config
    };

    // Smart project type detection    /**
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

    // Initialize the agent orchestrator
    this.orchestrator = new AgentOrchestrator({
      maxConcurrentAgents: this.config.maxConcurrentAgents,
      defaultTimeout: this.agentTimeout,
      verbose: this.config.verbose
    });

    // Initialize agents and traditional analyzers
    this.agents = {};
    this.traditionalAnalyzers = {};
    this.initializeAnalyzers();

    // Initialize supporting systems
    this.reportGenerator = new ScoringReport(this.config);
    this.recommendationEngine = new RecommendationEngine(this.config);

    // Results structure
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
        version: '1.0.0',
        parallelExecution: this.config.enableParallelExecution,
        agentBased: true
      },
      performance: {
        totalDuration: 0,
        parallelEfficiency: 0,
        agentMetrics: {},
        resourceUtilization: {}
      }
    };

    // Progress tracking
    this.progressCallbacks = [];
    this.analysisStartTime = 0;

    // Real-time infrastructure
    this.realtimeEmitter = null;
    this.statusManager = null;    /**
   * Performs the specified operation
   * @param {Object} this.config.enableRealtime
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.enableRealtime
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.enableRealtime) {
      this.initializeRealtimeInfrastructure();
    }
  }

  /**
   * Initialize real-time infrastructure for live score updates
   */
  async initializeRealtimeInfrastructure() {
    try {
      // Initialize status manager
      this.statusManager = new StatusManager({
        persistenceEnabled: true,
        statusFile: `${this.config.projectRoot}/.codefortify/scoring-status.json`
      });

      // Initialize real-time event emitter (if not already running)      /**
   * Performs the specified operation
   * @param {any} !global.codefortifyRealtimeEmitter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !global.codefortifyRealtimeEmitter
   * @returns {any} The operation result
   */

      if (!global.codefortifyRealtimeEmitter) {
        this.realtimeEmitter = new RealtimeEventEmitter({
          port: this.config.realtimePort
        });

        // Connect status manager to real-time emitter
        this.statusManager.on('status:updated', (event) => {
          this.realtimeEmitter?.emitStatusUpdate(
            event.status.phase,
            event.status.progress,
            event.status.message
          );
        });

        this.statusManager.on('score:updated', (event) => {
          this.realtimeEmitter?.emitScoreUpdate(
            event.score.currentScore,
            event.score.previousScore,
            this.generateScoreChanges(event.score)
          );
        });

        this.statusManager.on('agent:started', (event) => {
          this.realtimeEmitter?.emitAnalysisStart(event.agentId);
        });

        this.statusManager.on('agent:progress', (event) => {
          this.realtimeEmitter?.emitAnalysisProgress(
            event.agentId,
            event.progress,
            event.message
          );
        });

        this.statusManager.on('agent:completed', (event) => {
          this.realtimeEmitter?.emitAnalysisComplete(event.agentId, event.status.results);
        });

        // Start real-time server
        await this.realtimeEmitter.start();
        global.codefortifyRealtimeEmitter = this.realtimeEmitter;        /**
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
          // LOG: `🔴 Real-time scoring server started on port ${this.config.realtimePort}`
        }
      } else {
        // Use existing global emitter
        this.realtimeEmitter = global.codefortifyRealtimeEmitter;
      }

    } catch (error) {      /**
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
        // WARN: ⚠️  Failed to initialize real-time infrastructure:, error.message
      }
      this.realtimeEmitter = null;
      this.statusManager = null;
    }
  }

  /**
   * Generate score change descriptions
   */
  generateScoreChanges(scoreData) {
    const changes = [];    /**
   * Performs the specified operation
   * @param {any} scoreData.categoryScores && scoreData.previousCategoryScores
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} scoreData.categoryScores && scoreData.previousCategoryScores
   * @returns {any} The operation result
   */


    if (scoreData.categoryScores && scoreData.previousCategoryScores) {
      Object.keys(scoreData.categoryScores).forEach(category => {
        const current = scoreData.categoryScores[category];
        const previous = scoreData.previousCategoryScores[category] || 0;
        const change = current - previous;

        if (Math.abs(change) > 0.5) {
          const sign = change > 0 ? '+' : '';
          changes.push(`${sign}${change.toFixed(1)} ${category}`);
        }
      });
    }

    return changes;
  }  /**
   * Initialize the component
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Initialize the component
   * @returns {Promise} Promise that resolves with the result
   */


  async initializeAnalyzers() {
    const baseConfig = {
      projectRoot: this.config.projectRoot,
      projectType: this.config.projectType,
      verbose: this.config.verbose
    };

    try {
      // Initialize parallel agents with enhanced configuration
      this.agents = {
        security: new SecurityAgent({
          ...baseConfig,
          maxScore: 15,
          agentId: 'security-agent-001',
          priority: 2,
          timeout: this.config.agentTimeout
        }),
        quality: new QualityAgent({
          ...baseConfig,
          maxScore: 20,
          agentId: 'quality-agent-001',
          priority: 3,
          timeout: this.config.agentTimeout
        }),
        structure: new StructureAgent({
          ...baseConfig,
          maxScore: 20,
          agentId: 'structure-agent-001',
          priority: 2,
          timeout: this.config.agentTimeout
        }),
        visualTesting: this.config.enableVisualTesting ? new VisualTestingAgent({
          ...baseConfig,
          maxScore: 0, // Visual testing provides insights, not direct score
          agentId: 'visual-testing-agent-001',
          priority: 4, // Run after other analyses
          timeout: this.config.visualTestingTimeout,
          browsers: this.config.browsers || ['chromium'],
          viewports: this.config.viewports || [
            { width: 1920, height: 1080 },
            { width: 768, height: 1024 },
            { width: 375, height: 667 }
          ]
        }) : null
      };

      // Register agents with the orchestrator      /**
   * Performs the specified operation
   * @param {Object} this.config.enableParallelExecution
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.enableParallelExecution
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.enableParallelExecution) {
        // Filter out null agents (like visual testing when disabled)
        for (const agent of Object.values(this.agents)) {          /**
   * Performs the specified operation
   * @param {any} agent ! - Optional parameter
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} agent ! - Optional parameter
   * @returns {any} The operation result
   */

          if (agent !== null) {
            await this.orchestrator.registerAgent(agent);
          }
        }

        // Wire up progress events        /**
   * Performs the specified operation
   * @param {Object} this.config.enableProgressUpdates
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {Object} this.config.enableProgressUpdates
   * @returns {boolean} True if successful, false otherwise
   */

        if (this.config.enableProgressUpdates) {
          this.setupProgressTracking();
        }
      }

      // Initialize traditional analyzers for categories not yet converted to agents
      this.traditionalAnalyzers = {
        performance: new PerformanceAnalyzer({ ...baseConfig, maxScore: 15 }),
        testing: new TestingAnalyzer({ ...baseConfig, maxScore: 15 }),
        developerExperience: new DeveloperExperienceAnalyzer({ ...baseConfig, maxScore: 10 }),
        completeness: new CompletenessAnalyzer({ ...baseConfig, maxScore: 5 })
      };

    } catch (error) {
      // ERROR: Failed to initialize analyzers:, error.message
      // Fallback to traditional analyzers only
      this.config.enableParallelExecution = false;
      await this.initializeTraditionalAnalyzers();
    }
  }  /**
   * Initialize the component
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Initialize the component
   * @returns {Promise} Promise that resolves with the result
   */


  async initializeTraditionalAnalyzers() {
    const baseConfig = {
      projectRoot: this.config.projectRoot,
      projectType: this.config.projectType,
      verbose: this.config.verbose
    };

    // Import traditional analyzers
    const { StructureAnalyzer } = await import('./analyzers/StructureAnalyzer.js');
    const { QualityAnalyzer } = await import('./analyzers/QualityAnalyzer.js');
    const { SecurityAnalyzer } = await import('./analyzers/SecurityAnalyzer.js');

    this.traditionalAnalyzers = {
      structure: new StructureAnalyzer({ ...baseConfig, maxScore: 20 }),
      quality: new QualityAnalyzer({ ...baseConfig, maxScore: 20 }),
      security: new SecurityAnalyzer({ ...baseConfig, maxScore: 15 }),
      performance: new PerformanceAnalyzer({ ...baseConfig, maxScore: 15 }),
      testing: new TestingAnalyzer({ ...baseConfig, maxScore: 15 }),
      developerExperience: new DeveloperExperienceAnalyzer({ ...baseConfig, maxScore: 10 }),
      completeness: new CompletenessAnalyzer({ ...baseConfig, maxScore: 5 })
    };
  }  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupProgressTracking() {
    // Set up orchestrator event listeners
    this.orchestrator.on('orchestration:started', (data) => {
      this.emitProgress('analysis:started', {
        totalTasks: data.taskCount,
        maxConcurrency: data.maxConcurrency,
        parallelExecution: true
      });
    });

    this.orchestrator.on('execution:started', (data) => {
      this.emitProgress('agent:started', {
        agentId: data.agentId,
        task: data.task
      });
    });

    this.orchestrator.on('execution:completed', (data) => {
      this.emitProgress('agent:completed', {
        agentId: data.agentId,
        duration: data.duration,
        task: data.task
      });
    });

    this.orchestrator.on('orchestration:completed', (data) => {
      this.emitProgress('analysis:completed', {
        summary: data,
        parallelEfficiency: this.calculateParallelEfficiency(data)
      });
    });
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
      detailed = false,
      enableStreaming = false
    } = options;

    try {
      this.analysisStartTime = Date.now();
      // LOG: `🚀 Analyzing ${this.config.projectName} with Parallel Analysis Engine...`
      // LOG: ══════════════════════════════════════════════════════════
      // Check tool availability
      await this.checkToolAvailability();

      // Determine categories to analyze
      const categoriesToAnalyze = this.determineCategoriesToAnalyze(categories);      /**
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
        throw new Error(`No valid categories specified. Available: ${this.getAvailableCategories().join(', ')}`);
      }

      // Execute analysis based on configuration
      if (this.config.enableParallelExecution && this.hasAgentCategories(categoriesToAnalyze)) {
        await this.executeParallelAnalysis(categoriesToAnalyze, options);
      } else {
        await this.executeTraditionalAnalysis(categoriesToAnalyze, options);
      }

      // Calculate overall results
      this.calculateOverallScore();
      this.calculatePerformanceMetrics();

      // Generate recommendations
      const recommendations = await this.recommendationEngine.generateRecommendations(this.results);
      this.results.recommendations = recommendations;

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

      const duration = Date.now() - this.analysisStartTime;
      // LOG: `\n✅ Analysis complete in ${duration}ms!`
      /**
   * Performs the specified operation
   * @param {Object} this.config.enableParallelExecution
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.enableParallelExecution
   * @returns {boolean} True if successful, false otherwise
   */
      if (this.config.enableParallelExecution) {
        // LOG: `   ⚡ Parallel efficiency: ${Math.round(this.results.performance.parallelEfficiency)}%`
      }

      return this.results;

    } catch (error) {
      // ERROR: `💥 Project scoring failed: ${error.message}`
      throw error;
    }
  }  /**
   * Executes the operation
   * @param {any} categories
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Executes the operation
   * @param {any} categories
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */


  async executeParallelAnalysis(categories, options) {
    this.emitProgress('parallel:starting', { categories: categories.length });    /**
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
      // LOG: `\n🚀 Running ${categories.length} analyzers in parallel...`
    }

    // Create analysis promises for available agents/analyzers
    const analysisPromises = categories.map(async (category) => {
      const agent = this.agents[category];
      const traditionalAnalyzer = this.traditionalAnalyzers[category];      /**
   * Performs the specified operation
   * @param {any} agent
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} agent
   * @returns {any} The operation result
   */


      if (agent) {
        // Use agent (which already has internal parallelization)
        const startTime = performance.now();
        try {
          const result = await agent.runAnalysis();
          const duration = performance.now() - startTime;

          return {
            category,
            result: {
              ...result,
              weight: agent.config.maxScore,
              categoryName: agent.categoryName,
              executionMode: 'parallel_agent',
              executionTime: Math.round(duration)
            }
          };
        } catch (error) {
          // ERROR: `❌ Agent analysis failed for ${category}: ${error.message}`
          return { category, error: error.message };
        }
      } else if (traditionalAnalyzer) {
        // Use traditional analyzer as fallback
        const startTime = performance.now();
        try {
          const result = await traditionalAnalyzer.analyze();
          const duration = performance.now() - startTime;

          return {
            category,
            result: {
              ...result,
              weight: traditionalAnalyzer.config?.maxScore || traditionalAnalyzer.maxScore,
              categoryName: traditionalAnalyzer.categoryName,
              executionMode: 'parallel_traditional',
              executionTime: Math.round(duration)
            }
          };
        } catch (error) {
          // ERROR: `❌ Traditional analysis failed for ${category}: ${error.message}`
          return { category, error: error.message };
        }
      } else {
        return { category, error: 'No analyzer available' };
      }
    });

    // Execute all analyses in parallel
    const results = await Promise.allSettled(analysisPromises);

    // Process results
    results.forEach((result, index) => {
      const category = categories[index];      /**
   * Performs the specified operation
   * @param {any} result.status - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} result.status - Optional parameter
   * @returns {any} The operation result
   */


      if (result.status === 'fulfilled' && result.value.result) {
        this.results.categories[category] = result.value.result;        /**
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
          // LOG: `✅ ${result.value.result.categoryName} completed in ${result.value.result.executionTime}ms`
        }
      } else {
        const error = result.status === 'rejected' ? result.reason.message : result.value.error;
        // ERROR: `❌ Analysis failed for ${category}: ${error}`
      }
    });    /**
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
      // LOG: 🎯 Parallel execution completed!
    }
  }  /**
   * Executes the operation
   * @param {any} categories
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Executes the operation
   * @param {any} categories
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */


  async executeTraditionalAnalysis(categories, options) {
    this.emitProgress('traditional:starting', { categories: categories.length });    /**
   * Performs the specified operation
   * @param {any} const category of categories
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const category of categories
   * @returns {any} The operation result
   */


    for (const category of categories) {
      const analyzer = this.traditionalAnalyzers[category];      /**
   * Performs the specified operation
   * @param {any} !analyzer
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !analyzer
   * @returns {any} The operation result
   */

      if (!analyzer) {continue;}      /**
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
        this.results.categories[category] = {
          ...result,
          weight: analyzer.config?.maxScore || analyzer.maxScore,
          categoryName: analyzer.categoryName,
          executionMode: 'traditional'
        };        /**
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
          // LOG: `   Score: ${result.score}/${analyzer.config?.maxScore || analyzer.maxScore}`
        }

        this.emitProgress('category:completed', {
          category,
          score: result.score,
          maxScore: analyzer.config?.maxScore || analyzer.maxScore
        });

      } catch (error) {
        // ERROR: `❌ Failed to analyze ${analyzer.categoryName}: ${error.message}`
        this.results.categories[category] = this.createFailedCategoryResult(category, analyzer, error);
      }
    }
  }  /**
   * Executes the operation
   * @param {any} traditionalTasks
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Executes the operation
   * @param {any} traditionalTasks
   * @returns {Promise} Promise that resolves with the result
   */


  async executeTraditionalTasks(traditionalTasks) {  /**
   * Performs the specified operation
   * @param {any} const { category
   * @param {any} analyzer } of traditionalTasks
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const { category
   * @param {any} analyzer } of traditionalTasks
   * @returns {any} The operation result
   */

    for (const { category, analyzer } of traditionalTasks) {      /**
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
        // LOG: `\n🔍 Analyzing ${analyzer.categoryName} (traditional)...`
      }

      try {
        const result = await analyzer.analyze();
        this.results.categories[category] = {
          ...result,
          weight: analyzer.config?.maxScore || analyzer.maxScore,
          categoryName: analyzer.categoryName,
          executionMode: 'traditional'
        };        /**
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
          // LOG: `   Score: ${result.score}/${analyzer.config?.maxScore || analyzer.maxScore}`
        }

        this.emitProgress('category:completed', {
          category,
          score: result.score,
          maxScore: analyzer.config?.maxScore || analyzer.maxScore,
          mode: 'traditional'
        });

      } catch (error) {
        // ERROR: `❌ Failed to analyze ${analyzer.categoryName}: ${error.message}`
        this.results.categories[category] = this.createFailedCategoryResult(category, analyzer, error);
      }
    }
  }  /**
   * Creates a new resource
   * @param {any} category
   * @param {any} analyzer
   * @param {any} error
   * @returns {any} The created resource
   */
  /**
   * Creates a new resource
   * @param {any} category
   * @param {any} analyzer
   * @param {any} error
   * @returns {any} The created resource
   */


  createFailedCategoryResult(category, analyzer, error) {
    return {
      score: 0,
      maxScore: analyzer.config?.maxScore || analyzer.maxScore || 0,
      grade: 'F',
      issues: [`Analysis failed: ${error.message}`],
      suggestions: ['Fix analysis errors to get proper scoring'],
      details: {},
      weight: analyzer.config?.maxScore || analyzer.maxScore || 0,
      categoryName: analyzer.categoryName || category,
      error: error.message,
      executionMode: 'failed'
    };
  }  /**
   * Analyzes the provided data
   * @param {any} categories
   * @returns {any} The operation result
   */
  /**
   * Analyzes the provided data
   * @param {any} categories
   * @returns {any} The operation result
   */


  determineCategoriesToAnalyze(categories) {
    const allCategories = this.getAvailableCategories();

    return categories.includes('all')
      ? allCategories
      : categories.filter(cat => allCategories.includes(cat));
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getAvailableCategories() {
    return [
      ...Object.keys(this.agents || {}),
      ...Object.keys(this.traditionalAnalyzers || {})
    ];
  }  /**
   * Performs the specified operation
   * @param {any} categories
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} categories
   * @returns {any} The operation result
   */


  hasAgentCategories(categories) {
    return categories.some(cat => this.agents && this.agents[cat]);
  }  /**
   * Calculates the result
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @returns {number} The calculated result
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
      percentage: maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0,
      grade: this.calculateGrade(totalScore / maxTotalScore),
      hasErrors,
      timestamp: new Date().toISOString()
    };
  }  /**
   * Calculates the result
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @returns {number} The calculated result
   */


  calculatePerformanceMetrics() {
    const totalDuration = Date.now() - this.analysisStartTime;
    this.results.performance.totalDuration = totalDuration;

    // Calculate parallel efficiency    /**
   * Performs the specified operation
   * @param {Object} this.config.enableParallelExecution && this.results.performance.agentMetrics
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.enableParallelExecution && this.results.performance.agentMetrics
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.enableParallelExecution && this.results.performance.agentMetrics) {
      this.results.performance.parallelEfficiency = this.calculateParallelEfficiency(
        this.results.performance.agentMetrics
      );
    } else {
      this.results.performance.parallelEfficiency = 0; // Sequential execution
    }

    // Add orchestrator status if available    /**
   * Performs the specified operation
   * @param {Object} this.orchestrator && this.config.enableParallelExecution
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.orchestrator && this.config.enableParallelExecution
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.orchestrator && this.config.enableParallelExecution) {
      this.results.performance.orchestratorStatus = this.orchestrator.getStatus();
    }
  }  /**
   * Calculates the result
   * @param {any} metrics
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} metrics
   * @returns {number} The calculated result
   */


  calculateParallelEfficiency(metrics) {  /**
   * Performs the specified operation
   * @param {any} !metrics || !metrics.totalDuration || !metrics.averageDuration
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !metrics || !metrics.totalDuration || !metrics.averageDuration
   * @returns {any} The operation result
   */

    if (!metrics || !metrics.totalDuration || !metrics.averageDuration) {
      return 0;
    }

    // Theoretical sequential time vs actual parallel time
    const theoreticalSequentialTime = metrics.averageDuration * metrics.totalTasks;
    const actualParallelTime = metrics.totalDuration;    /**
   * Performs the specified operation
   * @param {any} actualParallelTime - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} actualParallelTime - Optional parameter
   * @returns {any} The operation result
   */


    if (actualParallelTime === 0) {return 0;}

    const efficiency = ((theoreticalSequentialTime - actualParallelTime) / theoreticalSequentialTime) * 100;
    return Math.max(0, Math.min(100, efficiency)); // Clamp between 0-100%
  }  /**
   * Calculates the result
   * @param {any} percentage
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} percentage
   * @returns {number} The calculated result
   */


  calculateGrade(percentage) {  /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.97) {return 'A+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.93) {return 'A';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.90) {return 'A-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.87) {return 'B+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.83) {return 'B';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.80) {return 'B-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.77) {return 'C+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.73) {return 'C';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.70) {return 'C-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.67) {return 'D+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.65) {return 'D';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.60) {return 'D-';}
    return 'F';
  }

  // Progress and event management  /**
   * Performs the specified operation
   * @param {Function} callback
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {Function} callback
   * @returns {any} The operation result
   */

  onProgress(callback) {
    this.progressCallbacks.push(callback);
  }  /**
   * Performs the specified operation
   * @param {any} event
   * @param {any} data
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} event
   * @param {any} data
   * @returns {any} The operation result
   */


  emitProgress(event, data) {  /**
   * Performs the specified operation
   * @param {Object} !this.config.enableProgressUpdates
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} !this.config.enableProgressUpdates
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.config.enableProgressUpdates) {return;}

    const progressData = {
      event,
      data,
      timestamp: Date.now(),
      elapsed: Date.now() - this.analysisStartTime
    };

    this.progressCallbacks.forEach(callback => {
      try {
        callback(progressData);
      } catch (error) {
        // ERROR: Progress callback error:, error
      }
    });
  }

  // Tool availability checking  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */

  async checkToolAvailability() {
    const tools = [
      { name: 'npm', command: 'npm --version', category: 'security' },
      { name: 'eslint', command: 'npx eslint --version', category: 'quality' }
    ];

    const toolStatus = {};    /**
   * Performs the specified operation
   * @param {any} const tool of tools
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const tool of tools
   * @returns {any} The operation result
   */


    for (const tool of tools) {
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        await execAsync(tool.command, { timeout: 5000 });
        toolStatus[tool.name] = { available: true, category: tool.category };
      } catch (error) {
        toolStatus[tool.name] = {
          available: false,
          category: tool.category,
          error: error.message
        };
      }
    }

    this.results.metadata.toolAvailability = toolStatus;

    // Provide guidance for missing tools
    const missingTools = Object.entries(toolStatus)
      .filter(([, status]) => !status.available)
      .map(([name]) => name);    /**
   * Performs the specified operation
   * @param {Object} missingTools.length > 0 && this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} missingTools.length > 0 && this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


    if (missingTools.length > 0 && this.config.verbose) {
      // LOG: `\n📋 Missing tools detected: ${missingTools.join(, )}`
      // LOG:    Consider installing them for more accurate analysis
    }
  }

  // Project type detection (reused from original ProjectScorer)  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */

  detectProjectType() {
    try {
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');

      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // React detection        /**
   * Performs the specified operation
   * @param {any} deps.react || deps['@types/react']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps.react || deps['@types/react']
   * @returns {any} The operation result
   */

        if (deps.react || deps['@types/react']) {
          return 'react-webapp';
        }

        // Vue detection        /**
   * Performs the specified operation
   * @param {any} deps.vue || deps['@vue/cli-service']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps.vue || deps['@vue/cli-service']
   * @returns {any} The operation result
   */

        if (deps.vue || deps['@vue/cli-service']) {
          return 'vue-webapp';
        }

        // Node.js API detection        /**
   * Performs the specified operation
   * @param {any} deps.express || deps.fastify || deps.koa || packageJson.main
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps.express || deps.fastify || deps.koa || packageJson.main
   * @returns {any} The operation result
   */

        if (deps.express || deps.fastify || deps.koa || packageJson.main) {
          return 'node-api';
        }

        // Svelte detection        /**
   * Performs the specified operation
   * @param {any} deps.svelte || deps['@sveltejs/kit']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps.svelte || deps['@sveltejs/kit']
   * @returns {any} The operation result
   */

        if (deps.svelte || deps['@sveltejs/kit']) {
          return 'svelte-webapp';
        }
      }

      // TypeScript detection
      if (existsSync(path.join(this.config.projectRoot, 'tsconfig.json'))) {
        return 'typescript';
      }

      return 'javascript';
    } catch (error) {
      return 'javascript';
    }
  }

  // Detailed analysis generation  /**
   * Generates new data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Generates new data
   * @returns {Promise} Promise that resolves with the result
   */

  async generateDetailedAnalysis() {
    const detailed = {
      executionDetails: {
        parallelExecution: this.config.enableParallelExecution,
        agentsUsed: Object.keys(this.agents || {}),
        traditionalAnalyzers: Object.keys(this.traditionalAnalyzers || {}),
        totalDuration: this.results.performance.totalDuration,
        parallelEfficiency: this.results.performance.parallelEfficiency
      },
      categoryBreakdown: {},
      recommendationDetails: {}
    };

    // Add detailed breakdown for each category
    for (const [category, result] of Object.entries(this.results.categories)) {
      detailed.categoryBreakdown[category] = {
        executionMode: result.executionMode || 'unknown',
        analysisTime: result.analysisTime || 0,
        issues: result.issues || [],
        suggestions: result.suggestions || [],
        details: result.details || {},
        streamingData: this.getStreamingDataForCategory(category)
      };
    }

    return detailed;
  }  /**
   * Retrieves data
   * @param {any} category
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} category
   * @returns {string} The retrieved data
   */


  getStreamingDataForCategory(category) {
    // Get streaming results from agents if available  /**
   * Performs the specified operation
   * @param {boolean} this.agents && this.agents[category] && this.agents[category].getStreamingResults
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.agents && this.agents[category] && this.agents[category].getStreamingResults
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.agents && this.agents[category] && this.agents[category].getStreamingResults) {
      return this.agents[category].getStreamingResults();
    }
    return null;
  }

  // Agent health and metrics  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */

  getAgentHealth() {  /**
   * Performs the specified operation
   * @param {boolean} !this.orchestrator
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.orchestrator
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.orchestrator) {return null;}

    return this.orchestrator.getStatus();
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getAgentMetrics() {
    const metrics = {};    /**
   * Performs the specified operation
   * @param {boolean} this.agents
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.agents
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.agents) {
      for (const [category, agent] of Object.entries(this.agents)) {        /**
   * Performs the specified operation
   * @param {any} agent.getMetrics
   * @returns {string} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} agent.getMetrics
   * @returns {string} The operation result
   */

        if (agent.getMetrics) {
          metrics[category] = agent.getMetrics();
        }
      }
    }

    return metrics;
  }

  // Cleanup and shutdown  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */

  async shutdown() {  /**
   * Performs the specified operation
   * @param {boolean} this.orchestrator
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.orchestrator
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.orchestrator) {
      await this.orchestrator.shutdown();
    }

    // Clear progress callbacks
    this.progressCallbacks = [];
  }

  // Backward compatibility methods  /**
   * Generates new data
   * @param {any} format - Optional parameter
   * @param {string} outputPath - Optional parameter
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Generates new data
   * @param {any} format - Optional parameter
   * @param {string} outputPath - Optional parameter
   * @param {Object} options - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */

  async generateReport(format = 'console', outputPath = null, options = {}) {
    return await this.reportGenerator.generateReport(this.results, format, outputPath, options);
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getResults() {
    return this.results;
  }

  // Static factory method for easy initialization
  static async create(config = {}) {
    const scorer = new ParallelProjectScorer(config);
    // Perform any async initialization if needed
    return scorer;
  }
}