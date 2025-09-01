/**
 * IAnalysisAgent - Agent Interface for Parallel Analysis
 *
 * Extends BaseAnalyzer with agent capabilities including:
 * - Parallel execution contracts
 * - Agent lifecycle management
 * - Resource coordination
 * - Health monitoring
 * - Inter-agent communication
 */

import { BaseAnalyzer } from '../scoring/analyzers/BaseAnalyzer.js';
import { EventEmitter } from 'events';

export class IAnalysisAgent extends BaseAnalyzer {
  constructor(config = {}) {
    super(config);

    // Agent-specific properties
    this.agentId = config.agentId || this.generateAgentId();
    this.agentType = config.agentType || 'analysis';
    this.priority = config.priority || 1;
    this.dependencies = config.dependencies || [];
    this.maxConcurrency = config.maxConcurrency || 1;
    this.timeout = config.timeout || 30000;

    // Agent state management
    this.state = 'idle'; // idle, running, completed, failed, cancelled
    this.startTime = null;
    this.endTime = null;
    this.resourcesHeld = new Set();
    this.currentTask = null;

    // Communication system
    this.eventBus = new EventEmitter();
    this.messageQueue = [];

    // Health monitoring
    this.healthMetrics = {
      successRate: 1.0,
      averageExecutionTime: 0,
      totalExecutions: 0,
      failureCount: 0,
      lastHealthCheck: Date.now()
    };

    // Resource management
    this.resourceRequirements = {
      files: [], // Files this agent needs exclusive access to
      memory: 0, // Memory requirement in MB
      cpu: 0.1,  // CPU requirement (0-1)
      network: false // Whether agent needs network access
    };
  }

  /**
   * Generate unique agent ID
   */
  generateAgentId() {
    return `${this.categoryName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Agent lifecycle methods
   */
  async initialize() {
    this.state = 'initializing';
    this.emit('agent:initializing', { agentId: this.agentId, type: this.agentType });

    try {
      await this.setupResources();
      await this.validateDependencies();
      await this.performHealthCheck();

      this.state = 'idle';
      this.emit('agent:ready', { agentId: this.agentId, type: this.agentType });
    } catch (error) {
      this.state = 'failed';
      this.emit('agent:failed', { agentId: this.agentId, error: error.message });
      throw error;
    }
  }

  async execute(task) {
    if (this.state !== 'idle') {
      throw new Error(`Agent ${this.agentId} is not available (state: ${this.state})`);
    }

    this.state = 'running';
    this.startTime = Date.now();
    this.currentTask = task;

    this.emit('agent:started', {
      agentId: this.agentId,
      task: task.id,
      timestamp: this.startTime
    });

    try {
      // Acquire required resources
      await this.acquireResources();

      // Execute the analysis with timeout
      const result = await Promise.race([
        this.runAnalysis(),
        this.createTimeoutPromise()
      ]);

      // Record success metrics
      this.recordSuccess();

      this.state = 'completed';
      this.endTime = Date.now();

      this.emit('agent:completed', {
        agentId: this.agentId,
        task: task.id,
        duration: this.endTime - this.startTime,
        result: result
      });

      return result;

    } catch (error) {
      this.recordFailure(error);
      this.state = 'failed';
      this.endTime = Date.now();

      this.emit('agent:failed', {
        agentId: this.agentId,
        task: task.id,
        error: error.message,
        duration: this.endTime - this.startTime
      });

      throw error;
    } finally {
      // Always release resources
      await this.releaseResources();
      this.currentTask = null;
    }
  }

  async cancel() {
    if (this.state === 'running') {
      this.state = 'cancelled';
      this.endTime = Date.now();

      this.emit('agent:cancelled', {
        agentId: this.agentId,
        task: this.currentTask?.id
      });

      await this.releaseResources();
    }
  }

  async shutdown() {
    await this.cancel();
    await this.releaseResources();
    this.state = 'shutdown';

    this.emit('agent:shutdown', { agentId: this.agentId });
  }

  /**
   * Resource management methods
   */
  async setupResources() {
    // Override in subclasses to setup specific resources
  }

  async acquireResources() {
    const startTime = Date.now();

    // Emit resource request
    this.emit('resource:request', {
      agentId: this.agentId,
      requirements: this.resourceRequirements
    });

    // Wait for resource allocation (handled by orchestrator)
    await this.waitForResourceAllocation();

    const duration = Date.now() - startTime;
    this.emit('resource:acquired', {
      agentId: this.agentId,
      duration: duration,
      resources: Array.from(this.resourcesHeld)
    });
  }

  async releaseResources() {
    if (this.resourcesHeld.size > 0) {
      this.emit('resource:release', {
        agentId: this.agentId,
        resources: Array.from(this.resourcesHeld)
      });

      this.resourcesHeld.clear();
    }
  }

  async waitForResourceAllocation() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Resource allocation timeout for agent ${this.agentId}`));
      }, 10000);

      this.eventBus.once('resources:allocated', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  /**
   * Dependency validation
   */
  async validateDependencies() {
    for (const dep of this.dependencies) {
      const isAvailable = await this.checkDependencyAvailable(dep);
      if (!isAvailable) {
        throw new Error(`Dependency ${dep} is not available for agent ${this.agentId}`);
      }
    }
  }

  async checkDependencyAvailable(dependency) {
    // Check if required files, tools, or other agents are available
    if (dependency.startsWith('file:')) {
      const filePath = dependency.substring(5);
      return await this.fileExists(filePath);
    }

    if (dependency.startsWith('tool:')) {
      const tool = dependency.substring(5);
      return await this.checkToolAvailable(tool);
    }

    if (dependency.startsWith('agent:')) {
      const agentType = dependency.substring(6);
      return this.isAgentTypeAvailable(agentType);
    }

    return true;
  }

  async checkToolAvailable(tool) {
    try {
      const result = await this.safeCommandExecution(`${tool} --version`);
      return result.success;
    } catch {
      return false;
    }
  }

  isAgentTypeAvailable(agentType) {
    // This would be checked by the orchestrator
    this.emit('dependency:check', { agentId: this.agentId, dependency: agentType });
    return true; // Assume available for now
  }

  /**
   * Health monitoring
   */
  async performHealthCheck() {
    const startTime = Date.now();

    try {
      // Basic health checks
      await this.checkSystemResources();
      await this.validateConfiguration();

      this.healthMetrics.lastHealthCheck = Date.now();

      this.emit('health:ok', {
        agentId: this.agentId,
        metrics: this.healthMetrics,
        duration: Date.now() - startTime
      });

      return true;
    } catch (error) {
      this.emit('health:warning', {
        agentId: this.agentId,
        error: error.message,
        metrics: this.healthMetrics
      });

      return false;
    }
  }

  async checkSystemResources() {
    // Check available memory, disk space, etc.
    const used = process.memoryUsage();
    if (used.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
      throw new Error('High memory usage detected');
    }
  }

  async validateConfiguration() {
    if (!this.config.projectRoot) {
      throw new Error('Missing project root configuration');
    }

    const exists = await this.fileExists('');
    if (!exists) {
      throw new Error('Project root directory does not exist');
    }
  }

  recordSuccess() {
    this.healthMetrics.totalExecutions++;
    const duration = Date.now() - this.startTime;

    // Update average execution time
    this.healthMetrics.averageExecutionTime =
      (this.healthMetrics.averageExecutionTime * (this.healthMetrics.totalExecutions - 1) + duration) /
      this.healthMetrics.totalExecutions;

    // Update success rate
    const successfulExecutions = this.healthMetrics.totalExecutions - this.healthMetrics.failureCount;
    this.healthMetrics.successRate = successfulExecutions / this.healthMetrics.totalExecutions;
  }

  recordFailure(error) {
    this.healthMetrics.failureCount++;
    this.healthMetrics.totalExecutions++;

    // Update success rate
    const successfulExecutions = this.healthMetrics.totalExecutions - this.healthMetrics.failureCount;
    this.healthMetrics.successRate = successfulExecutions / this.healthMetrics.totalExecutions;
  }

  /**
   * Communication methods
   */
  sendMessage(targetAgent, message) {
    this.emit('message:send', {
      from: this.agentId,
      to: targetAgent,
      message: message,
      timestamp: Date.now()
    });
  }

  receiveMessage(fromAgent, message) {
    this.messageQueue.push({
      from: fromAgent,
      message: message,
      timestamp: Date.now()
    });

    this.emit('message:received', {
      from: fromAgent,
      to: this.agentId,
      message: message
    });
  }

  /**
   * Utility methods
   */
  createTimeoutPromise() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent ${this.agentId} execution timeout after ${this.timeout}ms`));
      }, this.timeout);
    });
  }

  emit(event, data) {
    this.eventBus.emit(event, data);
  }

  on(event, listener) {
    this.eventBus.on(event, listener);
  }

  once(event, listener) {
    this.eventBus.once(event, listener);
  }

  /**
   * Status and monitoring
   */
  getStatus() {
    return {
      agentId: this.agentId,
      type: this.agentType,
      state: this.state,
      currentTask: this.currentTask?.id || null,
      resourcesHeld: Array.from(this.resourcesHeld),
      healthMetrics: this.healthMetrics,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  getMetrics() {
    return {
      ...this.healthMetrics,
      agentId: this.agentId,
      type: this.agentType,
      resourceRequirements: this.resourceRequirements,
      dependencies: this.dependencies
    };
  }

  /**
   * Override the analyze method to work with agent execution model
   */
  async analyze() {
    // If called directly (non-agent mode), use parent implementation
    if (!this.currentTask) {
      return await super.analyze();
    }

    // In agent mode, the analysis is part of the execute workflow
    return await super.analyze();
  }
}