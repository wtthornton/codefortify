/**
 * AgentOrchestrator - Parallel Analysis Engine Core
 *
 * Coordinates parallel execution of analysis agents with:
 * - Resource contention management
 * - Agent communication bus
 * - Health monitoring and recovery
 * - Load balancing and optimization
 * - Result aggregation
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

export class AgentOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxConcurrentAgents: config.maxConcurrentAgents || 4,
      defaultTimeout: config.defaultTimeout || 30000,
      healthCheckInterval: config.healthCheckInterval || 10000,
      maxRetries: config.maxRetries || 2,
      retryDelay: config.retryDelay || 1000,
      verbose: config.verbose || false,
      ...config
    };

    // Agent registry and management
    this.agents = new Map(); // agentId -> agent instance
    this.agentTypes = new Map(); // agentType -> Set of agent instances
    this.runningAgents = new Set();
    this.queuedTasks = [];
    this.completedTasks = new Map();
    this.failedTasks = new Map();

    // Resource management
    this.resourceManager = new ResourceManager(this.config);

    // Communication system
    this.messageBus = new MessageBus();

    // Health monitoring
    this.healthMonitor = new HealthMonitor(this, this.config);

    // Performance metrics
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageExecutionTime: 0,
      concurrentExecutions: 0,
      resourceWaitTime: 0,
      startTime: Date.now()
    };

    // Task execution state
    this.isRunning = false;
    this.shutdownRequested = false;
  }

  /**
   * Register an agent with the orchestrator
   */
  async registerAgent(agent) {
    if (this.agents.has(agent.agentId)) {
      throw new Error(`Agent ${agent.agentId} is already registered`);
    }

    // Initialize the agent
    await agent.initialize();

    // Store agent references
    this.agents.set(agent.agentId, agent);

    if (!this.agentTypes.has(agent.agentType)) {
      this.agentTypes.set(agent.agentType, new Set());
    }
    this.agentTypes.get(agent.agentType).add(agent);

    // Wire up event handlers
    this.wireAgentEvents(agent);

    this.emit('agent:registered', {
      agentId: agent.agentId,
      type: agent.agentType,
      totalAgents: this.agents.size
    });

    if (this.config.verbose) {
      console.log(`   Registered agent: ${agent.agentId} (${agent.agentType})`);
    }
  }

  /**
   * Wire up event handlers for an agent
   */
  wireAgentEvents(agent) {
    // Resource management events
    agent.on('resource:request', (data) => {
      this.resourceManager.handleResourceRequest(data);
    });

    agent.on('resource:release', (data) => {
      this.resourceManager.handleResourceRelease(data);
    });

    // Agent lifecycle events
    agent.on('agent:started', (data) => {
      this.runningAgents.add(agent);
      this.metrics.concurrentExecutions = this.runningAgents.size;
      this.emit('execution:started', data);
    });

    agent.on('agent:completed', (data) => {
      this.runningAgents.delete(agent);
      this.metrics.concurrentExecutions = this.runningAgents.size;
      this.metrics.completedTasks++;
      this.updateAverageExecutionTime(data.duration);
      this.emit('execution:completed', data);

      // Process next queued task
      this.processNextQueuedTask();
    });

    agent.on('agent:failed', (data) => {
      this.runningAgents.delete(agent);
      this.metrics.concurrentExecutions = this.runningAgents.size;
      this.metrics.failedTasks++;
      this.emit('execution:failed', data);

      // Handle retry logic
      this.handleAgentFailure(agent, data);

      // Process next queued task
      this.processNextQueuedTask();
    });

    // Communication events
    agent.on('message:send', (data) => {
      this.messageBus.routeMessage(data);
    });

    // Health monitoring events
    agent.on('health:warning', (data) => {
      this.healthMonitor.handleHealthWarning(data);
    });
  }

  /**
   * Execute tasks in parallel across available agents
   */
  async executeParallel(tasks, options = {}) {
    if (this.isRunning) {
      throw new Error('Orchestrator is already running tasks');
    }

    this.isRunning = true;
    this.emit('orchestration:started', {
      taskCount: tasks.length,
      maxConcurrency: this.config.maxConcurrentAgents
    });

    try {
      const startTime = performance.now();
      this.metrics.totalTasks += tasks.length;

      // Queue all tasks
      const taskPromises = tasks.map(task => this.queueTask(task, options));

      // Wait for all tasks to complete
      const results = await Promise.allSettled(taskPromises);

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Process results
      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected');

      const summary = {
        totalTasks: tasks.length,
        successful: successful.length,
        failed: failed.length,
        duration: totalDuration,
        averageDuration: totalDuration / tasks.length,
        concurrencyAchieved: this.metrics.concurrentExecutions,
        resourceWaitTime: this.metrics.resourceWaitTime
      };

      this.emit('orchestration:completed', summary);

      if (this.config.verbose) {
        console.log(`   Parallel execution completed: ${successful.length}/${tasks.length} successful in ${Math.round(totalDuration)}ms`);
      }

      return {
        results: successful,
        failures: failed,
        summary: summary
      };

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Queue a task for execution
   */
  async queueTask(task, options = {}) {
    return new Promise((resolve, reject) => {
      const queuedTask = {
        id: task.id || this.generateTaskId(),
        task: task,
        options: options,
        resolve: resolve,
        reject: reject,
        queuedAt: Date.now(),
        retries: 0,
        maxRetries: options.maxRetries || this.config.maxRetries
      };

      this.queuedTasks.push(queuedTask);
      this.processNextQueuedTask();
    });
  }

  /**
   * Process the next task in the queue
   */
  async processNextQueuedTask() {
    if (this.shutdownRequested || this.queuedTasks.length === 0) {
      return;
    }

    if (this.runningAgents.size >= this.config.maxConcurrentAgents) {
      return; // Wait for running agents to complete
    }

    const queuedTask = this.queuedTasks.shift();
    if (!queuedTask) {return;}

    try {
      const agent = await this.selectOptimalAgent(queuedTask.task);
      if (!agent) {
        // No available agent, requeue the task
        this.queuedTasks.unshift(queuedTask);
        return;
      }

      // Execute the task asynchronously (don't await here!)
      this.executeTaskAsync(agent, queuedTask);

      // Continue processing more tasks immediately
      setTimeout(() => this.processNextQueuedTask(), 0);

    } catch (error) {
      // Handle task failure
      if (queuedTask.retries < queuedTask.maxRetries) {
        queuedTask.retries++;

        // Add delay before retry
        setTimeout(() => {
          this.queuedTasks.push(queuedTask);
          this.processNextQueuedTask();
        }, this.config.retryDelay * queuedTask.retries);

      } else {
        this.failedTasks.set(queuedTask.id, error);
        queuedTask.reject(error);
      }
    }
  }

  /**
   * Execute a task asynchronously without blocking the orchestrator
   */
  async executeTaskAsync(agent, queuedTask) {
    // Mark agent as running immediately
    this.runningAgents.add(agent);
    this.metrics.concurrentExecutions = Math.max(this.metrics.concurrentExecutions, this.runningAgents.size);

    try {
      const result = await agent.execute(queuedTask.task);
      this.completedTasks.set(queuedTask.id, result);
      queuedTask.resolve(result);

      // Mark task as completed
      this.metrics.completedTasks++;
    } catch (error) {
      if (queuedTask.retries < queuedTask.maxRetries) {
        queuedTask.retries++;
        setTimeout(() => {
          this.queuedTasks.push(queuedTask);
          this.processNextQueuedTask();
        }, this.config.retryDelay * queuedTask.retries);
      } else {
        this.failedTasks.set(queuedTask.id, error);
        queuedTask.reject(error);
        this.metrics.failedTasks++;
      }
    } finally {
      // Remove agent from running set
      this.runningAgents.delete(agent);
      this.metrics.concurrentExecutions = this.runningAgents.size;

      // Continue processing more tasks
      setTimeout(() => this.processNextQueuedTask(), 0);
    }
  }

  /**
   * Select the optimal agent for a task
   */
  async selectOptimalAgent(task) {
    const requiredType = task.agentType || 'analysis';
    const candidateAgents = this.agentTypes.get(requiredType);

    if (!candidateAgents || candidateAgents.size === 0) {
      throw new Error(`No agents available for type: ${requiredType}`);
    }

    // Filter available agents
    const availableAgents = Array.from(candidateAgents)
      .filter(agent => agent.state === 'idle');

    if (availableAgents.length === 0) {
      return null; // No available agents
    }

    // Select agent based on health and load
    return this.selectBestAgent(availableAgents, task);
  }

  /**
   * Select the best agent based on performance metrics
   */
  selectBestAgent(agents, task) {
    if (agents.length === 1) {
      return agents[0];
    }

    // Score agents based on multiple factors
    const scoredAgents = agents.map(agent => {
      const metrics = agent.getMetrics();
      let score = 0;

      // Health score (0-1)
      score += metrics.successRate * 0.4;

      // Speed score (inverse of average execution time)
      const speedScore = metrics.averageExecutionTime > 0
        ? Math.max(0, 1 - (metrics.averageExecutionTime / 30000))
        : 1;
      score += speedScore * 0.3;

      // Load score (prefer less loaded agents)
      const loadScore = 1 - (agent.resourcesHeld.size * 0.1);
      score += loadScore * 0.2;

      // Priority score
      score += (agent.priority || 1) * 0.1;

      return { agent, score };
    });

    // Return agent with highest score
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0].agent;
  }

  /**
   * Handle agent failure with recovery strategies
   */
  async handleAgentFailure(agent, failureData) {
    this.emit('agent:failure', failureData);

    // Check if agent needs recovery
    const metrics = agent.getMetrics();
    if (metrics.successRate < 0.7) {
      this.emit('agent:unhealthy', {
        agentId: agent.agentId,
        successRate: metrics.successRate,
        action: 'monitoring'
      });
    }

    if (metrics.successRate < 0.3) {
      // Agent is critically unhealthy
      await this.quarantineAgent(agent);
    }
  }

  /**
   * Quarantine an unhealthy agent
   */
  async quarantineAgent(agent) {
    this.emit('agent:quarantined', { agentId: agent.agentId });

    // Remove from active agent pools
    this.agentTypes.get(agent.agentType)?.delete(agent);

    // Try to restart the agent
    try {
      await agent.shutdown();
      await agent.initialize();

      // Re-add to agent pool if successful
      this.agentTypes.get(agent.agentType)?.add(agent);

      this.emit('agent:recovered', { agentId: agent.agentId });
    } catch (error) {
      this.emit('agent:permanent_failure', {
        agentId: agent.agentId,
        error: error.message
      });
    }
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update average execution time metric
   */
  updateAverageExecutionTime(duration) {
    const completed = this.metrics.completedTasks;
    this.metrics.averageExecutionTime =
      (this.metrics.averageExecutionTime * (completed - 1) + duration) / completed;
  }

  /**
   * Get orchestrator status and metrics
   */
  getStatus() {
    const uptime = Date.now() - this.metrics.startTime;

    return {
      isRunning: this.isRunning,
      agents: {
        total: this.agents.size,
        running: this.runningAgents.size,
        idle: this.agents.size - this.runningAgents.size,
        byType: Object.fromEntries(
          Array.from(this.agentTypes.entries()).map(([type, agents]) => [
            type,
            {
              total: agents.size,
              running: Array.from(agents).filter(a => a.state === 'running').length
            }
          ])
        )
      },
      tasks: {
        total: this.metrics.totalTasks,
        completed: this.metrics.completedTasks,
        failed: this.metrics.failedTasks,
        queued: this.queuedTasks.length,
        running: this.runningAgents.size
      },
      performance: {
        averageExecutionTime: Math.round(this.metrics.averageExecutionTime),
        concurrentExecutions: this.metrics.concurrentExecutions,
        uptime: uptime,
        successRate: this.metrics.totalTasks > 0
          ? this.metrics.completedTasks / this.metrics.totalTasks
          : 0
      },
      resources: this.resourceManager.getStatus()
    };
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown() {
    this.shutdownRequested = true;
    this.emit('orchestrator:shutdown_requested');

    // Cancel all running agents
    const shutdownPromises = Array.from(this.runningAgents).map(agent =>
      agent.shutdown().catch(error =>
        this.emit('agent:shutdown_error', { agentId: agent.agentId, error: error.message })
      )
    );

    await Promise.allSettled(shutdownPromises);

    // Shutdown resource manager
    await this.resourceManager.shutdown();

    // Stop health monitoring
    this.healthMonitor.stop();

    this.emit('orchestrator:shutdown_completed');
  }
}

/**
 * Resource Manager - Handles resource allocation and contention
 */
class ResourceManager {
  constructor(config) {
    this.config = config;
    this.allocatedResources = new Map(); // resource -> agentId
    this.resourceQueue = []; // Agents waiting for resources
    this.resourceUsage = new Map(); // Track usage statistics
  }

  async handleResourceRequest(data) {
    const { agentId, requirements } = data;

    // Check if resources are available
    const available = await this.checkResourceAvailability(requirements);
    if (available) {
      await this.allocateResources(agentId, requirements);
    } else {
      // Queue the request
      this.resourceQueue.push({ agentId, requirements, timestamp: Date.now() });
    }
  }

  async handleResourceRelease(data) {
    const { agentId, resources } = data;

    // Release resources
    for (const resource of resources) {
      this.allocatedResources.delete(resource);
    }

    // Process queued requests
    await this.processResourceQueue();
  }

  async checkResourceAvailability(requirements) {
    // Check file locks
    for (const file of requirements.files || []) {
      if (this.allocatedResources.has(`file:${file}`)) {
        return false;
      }
    }

    // Additional resource checks (memory, CPU, etc.) would go here
    return true;
  }

  async allocateResources(agentId, requirements) {
    // Allocate file locks
    for (const file of requirements.files || []) {
      this.allocatedResources.set(`file:${file}`, agentId);
    }

    // Record usage
    this.recordResourceUsage(agentId, requirements);
  }

  async processResourceQueue() {
    const processed = [];

    for (let i = this.resourceQueue.length - 1; i >= 0; i--) {
      const request = this.resourceQueue[i];
      const available = await this.checkResourceAvailability(request.requirements);

      if (available) {
        await this.allocateResources(request.agentId, request.requirements);
        processed.push(request);
        this.resourceQueue.splice(i, 1);
      }
    }

    // Notify agents that resources are available
    processed.forEach(request => {
      const agent = this.getAgentById(request.agentId);
      if (agent) {
        agent.eventBus.emit('resources:allocated');
      }
    });
  }

  recordResourceUsage(agentId, requirements) {
    if (!this.resourceUsage.has(agentId)) {
      this.resourceUsage.set(agentId, { allocations: 0, totalFiles: 0 });
    }

    const usage = this.resourceUsage.get(agentId);
    usage.allocations++;
    usage.totalFiles += (requirements.files || []).length;
  }

  getStatus() {
    return {
      allocatedResources: this.allocatedResources.size,
      queuedRequests: this.resourceQueue.length,
      resourceTypes: {
        files: Array.from(this.allocatedResources.keys()).filter(k => k.startsWith('file:')).length
      }
    };
  }

  async shutdown() {
    this.allocatedResources.clear();
    this.resourceQueue.length = 0;
  }
}

/**
 * Message Bus - Handles inter-agent communication
 */
class MessageBus {
  constructor() {
    this.routes = new Map();
    this.messageQueue = [];
  }

  routeMessage(data) {
    const { from, to, message } = data;

    // For now, just emit to all agents
    // In a more complex system, this would handle targeted routing
    this.messageQueue.push(data);
  }
}

/**
 * Health Monitor - Monitors agent health and performance
 */
class HealthMonitor {
  constructor(orchestrator, config) {
    this.orchestrator = orchestrator;
    this.config = config;
    this.healthChecks = new Map();
    this.interval = null;
  }

  start() {
    if (this.interval) {return;}

    this.interval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async performHealthChecks() {
    for (const [agentId, agent] of this.orchestrator.agents) {
      try {
        const isHealthy = await agent.performHealthCheck();
        this.healthChecks.set(agentId, {
          healthy: isHealthy,
          lastCheck: Date.now(),
          metrics: agent.getMetrics()
        });
      } catch (error) {
        this.handleHealthWarning({
          agentId: agentId,
          error: error.message,
          metrics: agent.getMetrics()
        });
      }
    }
  }

  handleHealthWarning(data) {
    this.orchestrator.emit('health:warning', data);
  }
}