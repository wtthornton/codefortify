/**
 * Continuous Loop Controller - Core orchestration system for CodeFortify
 *
 * Revolutionary system that runs agents in continuous cycles to progressively
 * improve code quality until optimal results are achieved.
 *
 * Key Features:
 * - Autonomous iteration until target score reached
 * - Pattern learning from successful improvements
 * - Complete transparency and measurement tracking
 * - Zero manual intervention between cycles
 */

import { EventEmitter } from 'events';
import { LoopMetrics } from './LoopMetrics.js';
import { RealtimeEventEmitter } from './RealtimeEventEmitter.js';
import { StatusManager } from './StatusManager.js';
import { EnhancementAgent } from '../agents/EnhancementAgent.js';
import { ReviewAgent } from '../agents/ReviewAgent.js';
import { AnalysisAgent } from '../agents/AnalysisAgent.js';
import { ImprovementAgent } from '../agents/ImprovementAgent.js';
import { VisualTestingAgent } from '../agents/VisualTestingAgent.js';

/**


 * ContinuousLoopController class implementation


 *


 * Provides functionality for continuousloopcontroller operations


 */


/**


 * ContinuousLoopController class implementation


 *


 * Provides functionality for continuousloopcontroller operations


 */


export class ContinuousLoopController extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxIterations: config.maxIterations || 5,
      targetScore: config.targetScore || 95,
      projectRoot: config.projectRoot || process.cwd(),
      verbose: config.verbose || false,
      convergenceThreshold: config.convergenceThreshold || 2, // Stop if score doesn't improve for N iterations
      visualTesting: config.visualTesting !== false, // Enable visual testing by default
      // Real-time configuration
      enableRealtime: config.enableRealtime !== false,
      realtimePort: config.realtimePort || 8765,
      // MONITORING MODE: Disable autonomous execution
      monitoringOnly: config.monitoringOnly !== false, // Default to monitoring-only mode
      executeEnhancements: config.executeEnhancements || false, // Must explicitly enable
      ...config
    };

    // Initialize agents
    this.agents = {
      enhancement: new EnhancementAgent(this.config),
      review: new ReviewAgent(this.config),
      analysis: new AnalysisAgent(this.config),
      improvement: new ImprovementAgent(this.config),
      visualTesting: this.config.visualTesting ? new VisualTestingAgent(this.config) : null
    };

    // Metrics and tracking
    this.metrics = new LoopMetrics(this.config);
    this.iterationHistory = [];
    this.currentIteration = 0;
    this.lastScore = 0;
    this.convergenceCount = 0;

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

    // Bind event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize real-time infrastructure for live status updates
   */
  async initializeRealtimeInfrastructure() {
    try {
      // Initialize status manager
      this.statusManager = new StatusManager({
        persistenceEnabled: true,
        statusFile: `${this.config.projectRoot}/.codefortify/status.json`
      });

      // Initialize real-time event emitter
      this.realtimeEmitter = new RealtimeEventEmitter({
        port: this.config.realtimePort
      });

      // Connect status manager to real-time emitter
      this.statusManager.on('status:updated', (event) => {
        this.realtimeEmitter.emitStatusUpdate(
          event.status.phase,
          event.status.progress,
          event.status.message
        );
      });

      this.statusManager.on('score:updated', (event) => {
        this.realtimeEmitter.emitScoreUpdate(
          event.score.currentScore,
          event.score.previousScore,
          this.generateScoreChanges(event.score)
        );
      });

      this.statusManager.on('agent:started', (event) => {
        this.realtimeEmitter.emitAnalysisStart(event.agentId);
      });

      this.statusManager.on('agent:progress', (event) => {
        this.realtimeEmitter.emitAnalysisProgress(
          event.agentId,
          event.progress,
          event.message
        );
      });

      this.statusManager.on('agent:completed', (event) => {
        this.realtimeEmitter.emitAnalysisComplete(event.agentId, event.status.results);
      });

      // Start real-time server      /**
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
        await this.realtimeEmitter.start();
        // LOG: `🔴 CodeFortify real-time server started on port ${this.config.realtimePort}`
      }

    } catch (error) {
      // WARN: ⚠️  Failed to initialize real-time infrastructure:, error.message
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
  }

  /**
   * Main processing method - runs continuous improvement cycles
   * @param {string|Object} input - Code string or file path to process
   * @param {Object} options - Processing options
   * @returns {Object} Final processing results
   */
  async processCode(input, options = {}) {
    this.emit('loop:start', { input: typeof input === 'string' ? input.length : input });

    // Update real-time status    /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.statusManager) {
      this.statusManager.setOperation('enhancement', null, 'Starting continuous improvement cycle');
    }

    try {
      // Initialize metrics session
      const sessionId = this.metrics.startSession();

      // Prepare initial code state
      let currentCode = await this.prepareInput(input);
      let bestCode = currentCode;
      let bestScore = 0;

      this.currentIteration = 0;
      this.convergenceCount = 0;

      // Main iteration loop
      while (this.shouldContinue(bestScore)) {
        this.currentIteration++;

        this.emit('iteration:start', {
          iteration: this.currentIteration,
          currentScore: bestScore,
          targetScore: this.config.targetScore
        });

        try {
          // Run the enhancement cycle
          const iterationResult = await this.runIterationCycle(currentCode);

          // Track iteration in history
          this.iterationHistory.push(iterationResult);

          // Update best result if improved          /**
   * Performs the specified operation
   * @param {any} iterationResult.score > bestScore
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} iterationResult.score > bestScore
   * @returns {any} The operation result
   */

          if (iterationResult.score > bestScore) {
            bestCode = iterationResult.code;
            bestScore = iterationResult.score;
            this.convergenceCount = 0; // Reset convergence counter

            // Update real-time score            /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
            /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

            if (this.statusManager) {
              this.statusManager.updateScore(bestScore);
            }

            this.emit('improvement:found', {
              iteration: this.currentIteration,
              previousScore: this.lastScore,
              newScore: bestScore,
              improvement: bestScore - this.lastScore
            });
          } else {
            this.convergenceCount++;
          }

          this.lastScore = iterationResult.score;
          currentCode = iterationResult.code;

          this.emit('iteration:complete', iterationResult);

        } catch (error) {
          this.emit('iteration:error', { iteration: this.currentIteration, error });

          // For now, break on errors - could implement retry logic
          break;
        }
      }

      // Generate final report
      const finalResult = await this.generateFinalReport(bestCode, bestScore, sessionId);

      this.emit('loop:complete', finalResult);
      return finalResult;

    } catch (error) {
      this.emit('loop:error', error);
      throw error;
    }
  }

  /**
   * Runs a single iteration cycle: Enhance → Review → Analyze → Improve
   */
  async runIterationCycle(code) {
    const iterationStart = Date.now();

    // MONITORING MODE: Skip enhancement if in monitoring-only mode
    let enhanced = code;    /**
   * Performs the specified operation
   * @param {Object} !this.config.monitoringOnly && this.config.executeEnhancements
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} !this.config.monitoringOnly && this.config.executeEnhancements
   * @returns {boolean} True if successful, false otherwise
   */


    if (!this.config.monitoringOnly && this.config.executeEnhancements) {
      // Step 1: Enhancement - improve code quality (DISABLED BY DEFAULT)
      this.emit('step:start', { step: 'enhance', iteration: this.currentIteration });      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.statusManager) {
        this.statusManager.updateStatus({
          phase: 'enhancing',
          progress: 10,
          message: 'Enhancing code quality...',
          category: 'enhancement'
        });
      }
      enhanced = await this.agents.enhancement.enhance(code);
    } else {
      // MONITORING ONLY: Analyze without modifying
      this.emit('step:start', { step: 'analyze', iteration: this.currentIteration });      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.statusManager) {
        this.statusManager.updateStatus({
          phase: 'analyzing',
          progress: 10,
          message: 'Analyzing code quality (monitoring mode)...',
          category: 'analysis'
        });
      }
    }
    this.emit('step:complete', { step: 'enhance', duration: Date.now() - iterationStart });

    // Step 2: Review - validate and score improvements
    this.emit('step:start', { step: 'review', iteration: this.currentIteration });    /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.statusManager) {
      this.statusManager.updateStatus({
        phase: 'analyzing',
        progress: 35,
        message: 'Reviewing and scoring improvements...',
        category: 'review'
      });
    }
    const review = await this.agents.review.review(enhanced.code);
    this.emit('step:complete', { step: 'review', score: review.score });

    // Step 3: Analysis - deep metrics and insights
    this.emit('step:start', { step: 'analysis', iteration: this.currentIteration });    /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.statusManager) {
      this.statusManager.updateStatus({
        phase: 'analyzing',
        progress: 60,
        message: 'Analyzing metrics and generating insights...',
        category: 'analysis'
      });
    }
    const analysis = await this.agents.analysis.analyze(enhanced.code, review);
    this.emit('step:complete', { step: 'analysis', insights: analysis.insights?.length || 0 });

    // Step 3.5: Visual Testing - UI/UX validation (optional)
    let visualResults = null;    /**
   * Performs the specified operation
   * @param {boolean} this.agents.visualTesting
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.agents.visualTesting
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.agents.visualTesting) {
      this.emit('step:start', { step: 'visual-testing', iteration: this.currentIteration });      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.statusManager) {
        this.statusManager.updateStatus({
          phase: 'testing',
          progress: 75,
          message: 'Running visual and accessibility tests...',
          category: 'visual'
        });
      }
      try {
        visualResults = await this.agents.visualTesting.runAnalysis();
        this.emit('step:complete', {
          step: 'visual-testing',
          regressions: visualResults.summary?.visualRegressions || 0,
          accessibility: visualResults.summary?.accessibilityViolations || 0
        });
      } catch (error) {
        this.emit('step:error', { step: 'visual-testing', error: error.message });        /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

        if (this.statusManager) {
          this.statusManager.addWarning(`Visual testing failed: ${error.message}`);
        }        /**
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
          // WARN: ⚠️  Visual testing failed:, error.message
        }
      }
    }

    // Step 4: Improvement - targeted fixes based on feedback
    let improved = enhanced;    /**
   * Performs the specified operation
   * @param {Object} review.score < this.config.targetScore && review.issues?.length > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} review.score < this.config.targetScore && review.issues?.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (review.score < this.config.targetScore && review.issues?.length > 0) {
      this.emit('step:start', { step: 'improve', iteration: this.currentIteration });      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.statusManager) {
        this.statusManager.updateStatus({
          phase: 'enhancing',
          progress: 90,
          message: 'Applying targeted improvements...',
          category: 'improvement'
        });
      }
      improved = await this.agents.improvement.improve(enhanced.code, review, analysis);
      this.emit('step:complete', { step: 'improve', fixes: improved.fixes?.length || 0 });
    }

    // Mark iteration complete    /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.statusManager
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.statusManager) {
      this.statusManager.updateStatus({
        phase: 'complete',
        progress: 100,
        message: `Iteration ${this.currentIteration} complete - Score: ${review.score}`,
        category: null
      });
    }

    // Return iteration results
    return {
      iteration: this.currentIteration,
      code: improved.code || enhanced.code,
      score: review.score,
      enhanced: enhanced,
      review: review,
      analysis: analysis,
      visualTesting: visualResults,
      improved: improved !== enhanced ? improved : null,
      duration: Date.now() - iterationStart,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Determines if the loop should continue based on score and convergence
   */
  shouldContinue(currentScore) {
    // Stop if target reached  /**
   * Performs the specified operation
   * @param {any} currentScore > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {any} currentScore > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (currentScore >= this.config.targetScore) {
      return false;
    }

    // Stop if max iterations reached    /**
   * Performs the specified operation
   * @param {boolean} this.currentIteration > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.currentIteration > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.currentIteration >= this.config.maxIterations) {
      return false;
    }

    // Stop if no improvement for several iterations (convergence)    /**
   * Performs the specified operation
   * @param {number} this.convergenceCount > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {number} this.convergenceCount > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.convergenceCount >= this.config.convergenceThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Prepares input code for processing
   */
  async prepareInput(input) {  /**
   * Performs the specified operation
   * @param {any} typeof input - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} typeof input - Optional parameter
   * @returns {string} The operation result
   */

    if (typeof input === 'string') {
      // Direct code string
      return input;
    } else if (input.filePath) {
      // File path - read content
      const fs = await import('fs/promises');
      return await fs.readFile(input.filePath, 'utf-8');
    } else if (input.files) {
      // Multiple files - combine or process separately
      return input; // Return as-is for now, let agents handle
    } else {
      throw new Error('Invalid input format. Expected string, {filePath}, or {files}');
    }
  }

  /**
   * Generates comprehensive final report
   */
  async generateFinalReport(finalCode, finalScore, sessionId) {
    const report = {
      sessionId,
      summary: {
        iterations: this.currentIteration,
        finalScore: finalScore,
        targetScore: this.config.targetScore,
        targetAchieved: finalScore >= this.config.targetScore,
        totalDuration: this.iterationHistory.reduce((sum, it) => sum + it.duration, 0),
        averageIterationTime: this.iterationHistory.length > 0
          ? this.iterationHistory.reduce((sum, it) => sum + it.duration, 0) / this.iterationHistory.length
          : 0
      },
      progression: this.iterationHistory.map(it => ({
        iteration: it.iteration,
        score: it.score,
        improvements: it.enhanced?.improvements || [],
        issues: it.review?.issues || [],
        duration: it.duration
      })),
      patterns: await this.extractLearnedPatterns(),
      metrics: await this.metrics.getSessionMetrics(sessionId),
      finalCode: finalCode,
      recommendations: this.generateRecommendations()
    };

    // Store metrics for learning
    await this.metrics.storeSession(sessionId, report);

    return report;
  }

  /**
   * Extract patterns learned during processing for future use
   */
  async extractLearnedPatterns() {
    const patterns = [];    /**
   * Performs the specified operation
   * @param {boolean} const iteration of this.iterationHistory
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} const iteration of this.iterationHistory
   * @returns {boolean} True if successful, false otherwise
   */


    for (const iteration of this.iterationHistory) {      /**
   * Performs the specified operation
   * @param {any} iteration.enhanced?.patterns
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} iteration.enhanced?.patterns
   * @returns {any} The operation result
   */

      if (iteration.enhanced?.patterns) {
        patterns.push(...iteration.enhanced.patterns);
      }      /**
   * Performs the specified operation
   * @param {any} iteration.improved?.patterns
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} iteration.improved?.patterns
   * @returns {any} The operation result
   */

      if (iteration.improved?.patterns) {
        patterns.push(...iteration.improved.patterns);
      }
    }

    // Deduplicate and rank by effectiveness
    const uniquePatterns = patterns.reduce((acc, pattern) => {
      const key = pattern.type + pattern.description;      /**
   * Performs the specified operation
   * @param {any} !acc[key] || acc[key].effectiveness < pattern.effectiveness
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !acc[key] || acc[key].effectiveness < pattern.effectiveness
   * @returns {any} The operation result
   */

      if (!acc[key] || acc[key].effectiveness < pattern.effectiveness) {
        acc[key] = pattern;
      }
      return acc;
    }, {});

    return Object.values(uniquePatterns).sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Generate recommendations for further improvement
   */
  generateRecommendations() {
    const recommendations = [];    /**
   * Performs the specified operation
   * @param {boolean} this.iterationHistory.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.iterationHistory.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.iterationHistory.length === 0) {
      return recommendations;
    }

    const finalIteration = this.iterationHistory[this.iterationHistory.length - 1];

    // Recommend areas still needing improvement    /**
   * Performs the specified operation
   * @param {boolean} finalIteration.review?.issues
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} finalIteration.review?.issues
   * @returns {boolean} True if successful, false otherwise
   */

    if (finalIteration.review?.issues) {
      finalIteration.review.issues.forEach(issue => {
        recommendations.push({
          type: 'improvement',
          category: issue.category,
          description: issue.description,
          priority: issue.severity,
          automated: false
        });
      });
    }

    // Recommend process improvements    /**
   * Performs the specified operation
   * @param {boolean} this.currentIteration > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.currentIteration > - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.currentIteration >= this.config.maxIterations) {
      recommendations.push({
        type: 'process',
        description: 'Consider increasing maxIterations for potential further improvements',
        priority: 'medium',
        automated: false
      });
    }

    return recommendations;
  }

  /**
   * Setup event handlers for logging and monitoring
   */
  setupEventHandlers() {  /**
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
      this.on('loop:start', (data) => {
        // LOG: 🔄 Starting continuous improvement loop...
      });

      this.on('iteration:start', (data) => {
        // LOG: `\n📍 Iteration ${data.iteration} (Score: ${data.currentScore}/${data.targetScore})`
      });

      this.on('step:start', (data) => {
        // LOG: `  ▶️  ${data.step}...`
      });

      this.on('step:complete', (data) => {
        const extra = data.score ? ` (Score: ${data.score})` :
          data.insights ? ` (${data.insights} insights)` :
            data.fixes ? ` (${data.fixes} fixes)` : '';
        // LOG: `  ✅ ${data.step} complete${extra}`
      });

      this.on('improvement:found', (data) => {
        // LOG: `🎯 Score improved: ${data.previousScore} → ${data.newScore} (+${data.improvement})`
      });

      this.on('iteration:complete', (data) => {
        // LOG: `✨ Iteration ${data.iteration} complete - Score: ${data.score} (${data.duration}ms)`
      });

      this.on('loop:complete', (data) => {
        // LOG: `\n🏁 Loop complete! Final score: ${data.summary.finalScore}/${this.config.targetScore}`
        // LOG: `📊 ${data.summary.iterations} iterations, ${data.summary.totalDuration}ms total`
      });
    }
  }

  /**
   * Get current processing status
   */
  getStatus() {
    return {
      iteration: this.currentIteration,
      lastScore: this.lastScore,
      convergenceCount: this.convergenceCount,
      isRunning: this.currentIteration > 0,
      history: this.iterationHistory.map(h => ({
        iteration: h.iteration,
        score: h.score,
        duration: h.duration
      }))
    };
  }

  /**
   * Stop processing gracefully
   */
  async stop() {
    this.emit('loop:stop');
    // Implementation would set flags to stop at next iteration
  }
}