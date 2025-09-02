/**
 * LoopOrchestrator - Orchestrates the continuous improvement loop
 */

import { EventEmitter } from 'events';
import { AgentManager } from './AgentManager.js';
import { LoopMetrics } from '../LoopMetrics.js';
import { ConvergenceDetector } from './ConvergenceDetector.js';

/**


 * LoopOrchestrator class implementation


 *


 * Provides functionality for looporchestrator operations


 */


/**


 * LoopOrchestrator class implementation


 *


 * Provides functionality for looporchestrator operations


 */


export class LoopOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxIterations: config.maxIterations || 5,
      targetScore: config.targetScore || 95,
      convergenceThreshold: config.convergenceThreshold || 2,
      monitoringOnly: config.monitoringOnly !== false,
      executeEnhancements: config.executeEnhancements || false,
      ...config
    };

    this.agentManager = new AgentManager(this.config);
    this.metrics = new LoopMetrics();
    this.convergenceDetector = new ConvergenceDetector(this.config);
    this.isRunning = false;
    this.currentIteration = 0;
  }

  /**
   * Start the continuous improvement loop
   * @returns {Promise<Object>} Final results
   */
  async start() {  /**
   * Performs the specified operation
   * @param {boolean} this.isRunning
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.isRunning
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.isRunning) {
      throw new Error('Loop is already running');
    }

    this.isRunning = true;
    this.currentIteration = 0;

    try {
      this.emit('loop:started', { timestamp: new Date() });

      while (this.shouldContinue()) {
        await this.runIteration();
        this.currentIteration++;
      }

      const results = this.getFinalResults();
      this.emit('loop:completed', results);

      return results;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run a single iteration
   * @returns {Promise<Object>} Iteration results
   */
  async runIteration() {
    const iterationStart = Date.now();

    this.emit('iteration:started', {
      iteration: this.currentIteration,
      timestamp: new Date()
    });

    try {
      // Run analysis
      const analysisResult = await this.agentManager.runAnalysis();

      // Check if we should execute enhancements      /**
   * Performs the specified operation
   * @param {Object} this.config.executeEnhancements && !this.config.monitoringOnly
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.executeEnhancements && !this.config.monitoringOnly
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.executeEnhancements && !this.config.monitoringOnly) {
        const enhancementResult = await this.agentManager.runEnhancement(analysisResult);
        const reviewResult = await this.agentManager.runReview(enhancementResult);

        // Update metrics
        this.metrics.recordIteration({
          iteration: this.currentIteration,
          analysisScore: analysisResult.score,
          enhancementScore: enhancementResult.score,
          reviewScore: reviewResult.score,
          duration: Date.now() - iterationStart
        });

        return {
          iteration: this.currentIteration,
          analysis: analysisResult,
          enhancement: enhancementResult,
          review: reviewResult,
          duration: Date.now() - iterationStart
        };
      } else {
        // Monitoring mode - just analyze
        this.metrics.recordIteration({
          iteration: this.currentIteration,
          analysisScore: analysisResult.score,
          duration: Date.now() - iterationStart
        });

        return {
          iteration: this.currentIteration,
          analysis: analysisResult,
          duration: Date.now() - iterationStart
        };
      }
    } catch (error) {
      this.emit('iteration:error', {
        iteration: this.currentIteration,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if loop should continue
   * @returns {boolean} True if should continue
   */
  shouldContinue() {  /**
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

    if (this.convergenceDetector.hasConverged(this.metrics.getHistory())) {
      return false;
    }

    const currentScore = this.metrics.getCurrentScore();    /**
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

    return true;
  }

  /**
   * Get final results
   * @returns {Object} Final results
   */
  getFinalResults() {
    return {
      totalIterations: this.currentIteration,
      finalScore: this.metrics.getCurrentScore(),
      targetScore: this.config.targetScore,
      converged: this.convergenceDetector.hasConverged(this.metrics.getHistory()),
      metrics: this.metrics.getSummary(),
      success: this.metrics.getCurrentScore() >= this.config.targetScore
    };
  }

  /**
   * Stop the loop
   */
  stop() {
    this.isRunning = false;
    this.emit('loop:stopped', { timestamp: new Date() });
  }
}
