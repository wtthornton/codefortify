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

/**


 * IAnalysisAgent class implementation


 *


 * Provides functionality for ianalysisagent operations


 */


/**


 * IAnalysisAgent class implementation


 *


 * Provides functionality for ianalysisagent operations


 */


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
  }  /**
   * Executes the operation
   * @param {any} task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Executes the operation
   * @param {any} task
   * @returns {Promise} Promise that resolves with the result
   */


  async execute(task) {  /**
   * Performs the specified operation
   * @param {boolean} this.state ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.state ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

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
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async cancel() {  /**
   * Performs the specified operation
   * @param {boolean} this.state - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.state - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.state === 'running') {
      this.state = 'cancelled';
      this.endTime = Date.now();

      this.emit('agent:cancelled', {
        agentId: this.agentId,
        task: this.currentTask?.id
      });

      await this.releaseResources();
    }
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


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
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


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
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async releaseResources() {  /**
   * Performs the specified operation
   * @param {boolean} this.resourcesHeld.size > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.resourcesHeld.size > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.resourcesHeld.size > 0) {
      this.emit('resource:release', {
        agentId: this.agentId,
        resources: Array.from(this.resourcesHeld)
      });

      this.resourcesHeld.clear();
    }
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


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
  async validateDependencies() {  /**
   * Performs the specified operation
   * @param {boolean} const dep of this.dependencies
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} const dep of this.dependencies
   * @returns {boolean} True if successful, false otherwise
   */

    for (const dep of this.dependencies) {
      const isAvailable = await this.checkDependencyAvailable(dep);      /**
   * Performs the specified operation
   * @param {boolean} !isAvailable
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} !isAvailable
   * @returns {boolean} True if successful, false otherwise
   */

      if (!isAvailable) {
        throw new Error(`Dependency ${dep} is not available for agent ${this.agentId}`);
      }
    }
  }  /**
   * Checks the condition
   * @param {any} dependency
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @param {any} dependency
   * @returns {Promise} Promise that resolves with the result
   */


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
  }  /**
   * Checks the condition
   * @param {any} tool
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @param {any} tool
   * @returns {Promise} Promise that resolves with the result
   */


  async checkToolAvailable(tool) {
    try {
      const result = await this.safeCommandExecution(`${tool} --version`);
      return result.success;
    } catch {
      return false;
    }
  }  /**
   * Performs the specified operation
   * @param {any} agentType
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} agentType
   * @returns {boolean} True if successful, false otherwise
   */


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
  }  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */


  async checkSystemResources() {
    // Check available memory, disk space, etc.
    const used = process.memoryUsage();    /**
   * Performs the specified operation
   * @param {any} used.heapUsed > 500 * 1024 * 1024
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} used.heapUsed > 500 * 1024 * 1024
   * @returns {any} The operation result
   */

    if (used.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
      throw new Error('High memory usage detected');
    }
  }  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */


  async validateConfiguration() {  /**
   * Performs the specified operation
   * @param {Object} !this.config.projectRoot
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} !this.config.projectRoot
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.config.projectRoot) {
      throw new Error('Missing project root configuration');
    }

    const exists = await this.fileExists('');    /**
   * Performs the specified operation
   * @param {boolean} !exists
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !exists
   * @returns {boolean} True if successful, false otherwise
   */

    if (!exists) {
      throw new Error('Project root directory does not exist');
    }
  }  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */


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
  }  /**
   * Performs the specified operation
   * @param {any} _error
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} _error
   * @returns {any} The operation result
   */


  recordFailure(_error) {
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
  }  /**
   * Performs the specified operation
   * @param {any} fromAgent
   * @param {any} message
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} fromAgent
   * @param {any} message
   * @returns {any} The operation result
   */


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


  emit(event, data) {
    this.eventBus.emit(event, data);
  }  /**
   * Performs the specified operation
   * @param {any} event
   * @param {boolean} listener
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} event
   * @param {boolean} listener
   * @returns {boolean} True if successful, false otherwise
   */


  on(event, listener) {
    this.eventBus.on(event, listener);
  }  /**
   * Performs the specified operation
   * @param {any} event
   * @param {boolean} listener
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} event
   * @param {boolean} listener
   * @returns {boolean} True if successful, false otherwise
   */


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
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


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
    // If called directly (non-agent mode), use parent implementation  /**
   * Performs the specified operation
   * @param {boolean} !this.currentTask
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.currentTask
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.currentTask) {
      return await super.analyze();
    }

    // In agent mode, the analysis is part of the execute workflow
    return await super.analyze();
  }

  /**
   * Handle execution errors gracefully
   */
  handleExecutionError(error) {
    return {
      agent: this.agentType,
      error: {
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      },
      result: this.results || {},
      executionTime: 0
    };
  }
}