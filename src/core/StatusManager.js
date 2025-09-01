/**
 * CodeFortify Status Manager
 *
 * Centralized status tracking for all CodeFortify operations with persistence
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import {
  StatusData,
  AgentStatus,
  ScoreStatus,
  STATUS_PHASES,
  ANALYSIS_CATEGORIES,
  AGENT_STATUS,
  OPERATION_TYPES
} from './StatusTypes.js';

export class StatusManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      persistenceEnabled: config.persistenceEnabled !== false,
      statusFile: config.statusFile || '.codefortify/status.json',
      historySize: config.historySize || 1000,
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 30000, // 30 seconds
      ...config
    };

    this.globalStatus = new StatusData();
    this.agentStatuses = new Map();
    this.scoreStatus = new ScoreStatus();
    this.operationHistory = [];
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.saveTimer = null;

    // Initialize persistence
    if (this.config.persistenceEnabled) {
      this.initializePersistence();
    }
  }

  /**
   * Initialize persistence system
   */
  async initializePersistence() {
    try {
      // Ensure status directory exists
      const statusDir = path.dirname(this.config.statusFile);
      await fs.mkdir(statusDir, { recursive: true });

      // Load existing status if available
      await this.loadStatus();

      // Start auto-save timer
      if (this.config.autoSave) {
        this.startAutoSave();
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to initialize persistence: ${error.message}`));
    }
  }

  /**
   * Update global status
   */
  updateStatus(updates) {
    const previousPhase = this.globalStatus.phase;
    const previousProgress = this.globalStatus.progress;

    this.globalStatus.update(updates);

    // Emit status change event
    this.emit('status:updated', {
      sessionId: this.sessionId,
      status: this.globalStatus.toJSON(),
      changes: {
        phase: previousPhase !== this.globalStatus.phase,
        progress: previousProgress !== this.globalStatus.progress
      }
    });

    // Save if persistence is enabled
    if (this.config.persistenceEnabled && !this.config.autoSave) {
      this.saveStatus();
    }
  }

  /**
   * Set operation status
   */
  setOperation(operationType, category = null, message = '', metadata = {}) {
    this.updateStatus({
      phase: STATUS_PHASES.ANALYZING,
      operation: operationType,
      category,
      message,
      progress: 0,
      metadata: { ...this.globalStatus.metadata, ...metadata }
    });

    this.addToHistory({
      type: 'operation_start',
      operation: operationType,
      category,
      message,
      timestamp: new Date()
    });
  }

  /**
   * Update operation progress
   */
  updateProgress(progress, message = '', stage = null) {
    this.updateStatus({
      progress: Math.min(100, Math.max(0, progress)),
      message,
      stage
    });
  }

  /**
   * Complete current operation
   */
  completeOperation(results = null, message = 'Operation completed') {
    this.updateStatus({
      phase: STATUS_PHASES.COMPLETE,
      progress: 100,
      message
    });

    this.addToHistory({
      type: 'operation_complete',
      operation: this.globalStatus.operation,
      category: this.globalStatus.category,
      results,
      duration: this.globalStatus.getElapsedTime(),
      timestamp: new Date()
    });
  }

  /**
   * Set error status
   */
  setError(error, context = {}) {
    this.globalStatus.addError(error);
    this.updateStatus({
      phase: STATUS_PHASES.ERROR,
      message: `Error: ${error.message}`
    });

    this.addToHistory({
      type: 'error',
      error: error.message,
      context,
      timestamp: new Date()
    });

    this.emit('status:error', { error, context, sessionId: this.sessionId });
  }

  /**
   * Add warning
   */
  addWarning(message, context = {}) {
    this.globalStatus.addWarning(message);

    this.emit('status:warning', { message, context, sessionId: this.sessionId });
  }

  /**
   * Register agent
   */
  registerAgent(agentId, agentType) {
    const agentStatus = new AgentStatus(agentId, agentType);
    this.agentStatuses.set(agentId, agentStatus);

    this.emit('agent:registered', {
      agentId,
      agentType,
      sessionId: this.sessionId
    });

    return agentStatus;
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId, updates) {
    const agent = this.agentStatuses.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const previousStatus = agent.status;
    Object.assign(agent, updates);

    this.emit('agent:updated', {
      agentId,
      status: agent.toJSON(),
      previousStatus,
      sessionId: this.sessionId
    });
  }

  /**
   * Start agent
   */
  startAgent(agentId, message = '') {
    const agent = this.agentStatuses.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.start(message);

    this.emit('agent:started', {
      agentId,
      status: agent.toJSON(),
      sessionId: this.sessionId
    });
  }

  /**
   * Update agent progress
   */
  updateAgentProgress(agentId, progress, message = '') {
    const agent = this.agentStatuses.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.updateProgress(progress, message);

    this.emit('agent:progress', {
      agentId,
      progress,
      message,
      sessionId: this.sessionId
    });
  }

  /**
   * Complete agent
   */
  completeAgent(agentId, results = null, message = '') {
    const agent = this.agentStatuses.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.complete(results, message);

    this.emit('agent:completed', {
      agentId,
      status: agent.toJSON(),
      sessionId: this.sessionId
    });
  }

  /**
   * Fail agent
   */
  failAgent(agentId, error, message = '') {
    const agent = this.agentStatuses.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.fail(error, message);

    this.emit('agent:failed', {
      agentId,
      error: error.message,
      status: agent.toJSON(),
      sessionId: this.sessionId
    });
  }

  /**
   * Update score
   */
  updateScore(newScore, categoryScores = {}) {
    const previousScore = this.scoreStatus.currentScore;
    this.scoreStatus.updateScore(newScore, categoryScores);

    this.emit('score:updated', {
      score: this.scoreStatus.toJSON(),
      previousScore,
      sessionId: this.sessionId
    });

    // Update global status if score changed significantly
    const scoreChange = Math.abs(newScore - previousScore);
    if (scoreChange > 1) {
      this.updateStatus({
        message: `Score ${newScore > previousScore ? 'improved' : 'decreased'}: ${newScore.toFixed(1)}`
      });
    }
  }

  /**
   * Get current status summary
   */
  getStatusSummary() {
    const runningAgents = Array.from(this.agentStatuses.values())
      .filter(agent => agent.status === AGENT_STATUS.RUNNING);

    const completedAgents = Array.from(this.agentStatuses.values())
      .filter(agent => agent.status === AGENT_STATUS.COMPLETED);

    const failedAgents = Array.from(this.agentStatuses.values())
      .filter(agent => agent.status === AGENT_STATUS.FAILED);

    return {
      sessionId: this.sessionId,
      uptime: Date.now() - this.startTime.getTime(),
      globalStatus: this.globalStatus.toJSON(),
      score: this.scoreStatus.toJSON(),
      agents: {
        total: this.agentStatuses.size,
        running: runningAgents.length,
        completed: completedAgents.length,
        failed: failedAgents.length,
        details: Array.from(this.agentStatuses.values()).map(agent => agent.toJSON())
      },
      recentHistory: this.operationHistory.slice(-10)
    };
  }

  /**
   * Get agent statuses
   */
  getAgentStatuses() {
    const statuses = {};
    for (const [agentId, agent] of this.agentStatuses) {
      statuses[agentId] = agent.toJSON();
    }
    return statuses;
  }

  /**
   * Reset status
   */
  reset() {
    this.globalStatus = new StatusData();
    this.agentStatuses.clear();
    this.scoreStatus = new ScoreStatus();
    this.sessionId = this.generateSessionId();

    this.emit('status:reset', { sessionId: this.sessionId });
  }

  /**
   * Add entry to operation history
   */
  addToHistory(entry) {
    this.operationHistory.push(entry);

    // Maintain history size limit
    if (this.operationHistory.length > this.config.historySize) {
      this.operationHistory = this.operationHistory.slice(-this.config.historySize);
    }
  }

  /**
   * Load status from file
   */
  async loadStatus() {
    try {
      const statusPath = path.resolve(this.config.statusFile);
      const data = await fs.readFile(statusPath, 'utf-8');
      const savedStatus = JSON.parse(data);

      // Restore score status
      if (savedStatus.score) {
        Object.assign(this.scoreStatus, savedStatus.score);
      }

      // Restore operation history
      if (savedStatus.operationHistory) {
        this.operationHistory = savedStatus.operationHistory;
      }

      this.emit('status:loaded', { file: statusPath });
    } catch (error) {
      // File doesn't exist or is corrupted - not an error for new installations
      if (error.code !== 'ENOENT') {
        this.emit('error', new Error(`Failed to load status: ${error.message}`));
      }
    }
  }

  /**
   * Save status to file
   */
  async saveStatus() {
    if (!this.config.persistenceEnabled) {return;}

    try {
      const statusData = {
        sessionId: this.sessionId,
        lastSaved: new Date().toISOString(),
        globalStatus: this.globalStatus.toJSON(),
        score: this.scoreStatus.toJSON(),
        agents: this.getAgentStatuses(),
        operationHistory: this.operationHistory.slice(-100) // Save last 100 entries
      };

      const statusPath = path.resolve(this.config.statusFile);
      await fs.writeFile(statusPath, JSON.stringify(statusData, null, 2));

      this.emit('status:saved', { file: statusPath });
    } catch (error) {
      this.emit('error', new Error(`Failed to save status: ${error.message}`));
    }
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }

    this.saveTimer = setInterval(() => {
      this.saveStatus();
    }, this.config.saveInterval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * Cleanup and save before shutdown
   */
  async shutdown() {
    this.stopAutoSave();

    if (this.config.persistenceEnabled) {
      await this.saveStatus();
    }

    this.emit('status:shutdown', { sessionId: this.sessionId });
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    return {
      sessionId: this.sessionId,
      uptime: Date.now() - this.startTime.getTime(),
      totalAgents: this.agentStatuses.size,
      historyEntries: this.operationHistory.length,
      currentPhase: this.globalStatus.phase,
      currentScore: this.scoreStatus.currentScore,
      memoryUsage: process.memoryUsage()
    };
  }
}

export default StatusManager;