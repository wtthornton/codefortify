/**
 * CodeFortify Status Types and Definitions
 *
 * Centralized status management for all CodeFortify operations
 */

export const STATUS_PHASES = {
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  ENHANCING: 'enhancing',
  TESTING: 'testing',
  COMPLETE: 'complete',
  ERROR: 'error',
  PAUSED: 'paused'
};

export const ANALYSIS_CATEGORIES = {
  STRUCTURE: 'structure',
  QUALITY: 'quality',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  TESTING: 'testing',
  DOCUMENTATION: 'documentation',
  COMPLETENESS: 'completeness',
  VISUAL: 'visual'
};

export const AGENT_STATUS = {
  INACTIVE: 'inactive',
  INITIALIZING: 'initializing',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused'
};

export const OPERATION_TYPES = {
  ANALYSIS: 'analysis',
  ENHANCEMENT: 'enhancement',
  SCORING: 'scoring',
  VALIDATION: 'validation',
  TESTING: 'testing',
  REPORTING: 'reporting'
};

export const PROGRESS_STAGES = {
  PREPARATION: 'preparation',
  EXECUTION: 'execution',
  VALIDATION: 'validation',
  COMPLETION: 'completion'
};

/**
 * Status data structure
 */
export class StatusData {
  constructor(options = {}) {
    this.phase = options.phase || STATUS_PHASES.IDLE;
    this.progress = options.progress || 0;
    this.message = options.message || '';
    this.category = options.category || null;
    this.operation = options.operation || null;
    this.stage = options.stage || null;
    this.startTime = options.startTime || new Date();
    this.lastUpdate = options.lastUpdate || new Date();
    this.estimatedCompletion = options.estimatedCompletion || null;
    this.metadata = options.metadata || {};
    this.errors = options.errors || [];
    this.warnings = options.warnings || [];
  }

  /**
   * Update status with new data
   */
  update(updates) {
    Object.assign(this, updates);
    this.lastUpdate = new Date();
    return this;
  }

  /**
   * Add error to status
   */
  addError(error) {
    this.errors.push({
      message: error.message,
      timestamp: new Date(),
      stack: error.stack
    });
    return this;
  }

  /**
   * Add warning to status
   */
  addWarning(message) {
    this.warnings.push({
      message,
      timestamp: new Date()
    });
    return this;
  }

  /**
   * Calculate elapsed time
   */
  getElapsedTime() {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Get estimated remaining time
   */
  getEstimatedRemainingTime() {  /**
   * Performs the specified operation
   * @param {boolean} !this.estimatedCompletion || this.progress - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.estimatedCompletion || this.progress - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.estimatedCompletion || this.progress === 0) {
      return null;
    }

    const elapsed = this.getElapsedTime();
    const totalEstimated = (elapsed / this.progress) * 100;
    return Math.max(0, totalEstimated - elapsed);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      phase: this.phase,
      progress: this.progress,
      message: this.message,
      category: this.category,
      operation: this.operation,
      stage: this.stage,
      startTime: this.startTime.toISOString(),
      lastUpdate: this.lastUpdate.toISOString(),
      estimatedCompletion: this.estimatedCompletion?.toISOString() || null,
      elapsedTime: this.getElapsedTime(),
      estimatedRemainingTime: this.getEstimatedRemainingTime(),
      metadata: this.metadata,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

/**
 * Agent status tracking
 */
export class AgentStatus {
  constructor(agentId, agentType) {
    this.agentId = agentId;
    this.agentType = agentType;
    this.status = AGENT_STATUS.INACTIVE;
    this.progress = 0;
    this.message = '';
    this.startTime = null;
    this.endTime = null;
    this.results = null;
    this.errors = [];
    this.metrics = {};
  }  /**
   * Performs the specified operation
   * @param {any} message - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} message - Optional parameter
   * @returns {any} The operation result
   */


  start(message = '') {
    this.status = AGENT_STATUS.RUNNING;
    this.startTime = new Date();
    this.message = message || `${this.agentType} agent started`;
    this.progress = 0;
  }  /**
   * Updates existing data
   * @param {any} progress
   * @param {any} message - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @param {any} progress
   * @param {any} message - Optional parameter
   * @returns {any} The operation result
   */


  updateProgress(progress, message = '') {
    this.progress = Math.min(100, Math.max(0, progress));    /**
   * Performs the specified operation
   * @param {any} message
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} message
   * @returns {any} The operation result
   */

    if (message) {this.message = message;}
  }  /**
   * Performs the specified operation
   * @param {any} results - Optional parameter
   * @param {any} message - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} results - Optional parameter
   * @param {any} message - Optional parameter
   * @returns {any} The operation result
   */


  complete(results = null, message = '') {
    this.status = AGENT_STATUS.COMPLETED;
    this.endTime = new Date();
    this.progress = 100;
    this.results = results;
    this.message = message || `${this.agentType} agent completed`;
  }  /**
   * Performs the specified operation
   * @param {any} error
   * @param {any} message - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} error
   * @param {any} message - Optional parameter
   * @returns {any} The operation result
   */


  fail(error, message = '') {
    this.status = AGENT_STATUS.FAILED;
    this.endTime = new Date();
    this.errors.push({
      message: error.message,
      timestamp: new Date(),
      stack: error.stack
    });
    this.message = message || `${this.agentType} agent failed: ${error.message}`;
  }  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */


  toJSON() {
    return {
      agentId: this.agentId,
      agentType: this.agentType,
      status: this.status,
      progress: this.progress,
      message: this.message,
      startTime: this.startTime?.toISOString() || null,
      endTime: this.endTime?.toISOString() || null,
      duration: this.startTime && this.endTime ?
        this.endTime.getTime() - this.startTime.getTime() : null,
      results: this.results,
      errors: this.errors,
      metrics: this.metrics
    };
  }
}

/**
 * Score tracking
 */
export class ScoreStatus {
  constructor() {
    this.currentScore = 0;
    this.previousScore = 0;
    this.targetScore = 100;
    this.categoryScores = {};
    this.history = [];
    this.lastCalculation = null;
    this.trend = 'stable'; // 'improving', 'declining', 'stable'
  }  /**
   * Updates existing data
   * @param {any} newScore
   * @param {any} categoryScores - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @param {any} newScore
   * @param {any} categoryScores - Optional parameter
   * @returns {any} The operation result
   */


  updateScore(newScore, categoryScores = {}) {
    this.previousScore = this.currentScore;
    this.currentScore = newScore;
    this.categoryScores = { ...categoryScores };
    this.lastCalculation = new Date();

    // Add to history
    this.history.push({
      score: newScore,
      categoryScores: { ...categoryScores },
      timestamp: new Date()
    });

    // Keep only last 100 entries    /**
   * Performs the specified operation
   * @param {boolean} this.history.length > 100
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.history.length > 100
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }

    // Calculate trend
    this.calculateTrend();
  }  /**
   * Calculates the result
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @returns {number} The calculated result
   */


  calculateTrend() {  /**
   * Performs the specified operation
   * @param {boolean} this.history.length < 2
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.history.length < 2
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.history.length < 2) {
      this.trend = 'stable';
      return;
    }

    const recent = this.history.slice(-5); // Last 5 scores
    const changes = recent.slice(1).map((entry, index) =>
      entry.score - recent[index].score
    );

    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;    /**
   * Performs the specified operation
   * @param {any} avgChange > 0.5
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} avgChange > 0.5
   * @returns {any} The operation result
   */


    if (avgChange > 0.5) {
      this.trend = 'improving';
    } else if (avgChange < -0.5) {
      this.trend = 'declining';
    } else {
      this.trend = 'stable';
    }
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getScoreChange() {
    return this.currentScore - this.previousScore;
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getProgressToTarget() {
    return Math.min(100, (this.currentScore / this.targetScore) * 100);
  }  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */


  toJSON() {
    return {
      currentScore: this.currentScore,
      previousScore: this.previousScore,
      targetScore: this.targetScore,
      scoreChange: this.getScoreChange(),
      progressToTarget: this.getProgressToTarget(),
      categoryScores: this.categoryScores,
      trend: this.trend,
      lastCalculation: this.lastCalculation?.toISOString() || null,
      historyCount: this.history.length
    };
  }
}

export default {
  STATUS_PHASES,
  ANALYSIS_CATEGORIES,
  AGENT_STATUS,
  OPERATION_TYPES,
  PROGRESS_STAGES,
  StatusData,
  AgentStatus,
  ScoreStatus
};