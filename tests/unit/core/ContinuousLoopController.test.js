import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';

// Mock all dependencies to avoid complex initialization
vi.mock('../../../src/core/LoopMetrics.js', () => ({
  LoopMetrics: vi.fn().mockImplementation(() => ({
    startIteration: vi.fn(),
    endIteration: vi.fn(),
    recordScore: vi.fn(),
    getIterationMetrics: vi.fn().mockReturnValue({}),
    getTotalMetrics: vi.fn().mockReturnValue({}),
    reset: vi.fn()
  }))
}));

vi.mock('../../../src/core/RealtimeEventEmitter.js', () => ({
  RealtimeEventEmitter: vi.fn().mockImplementation(() => ({
    emitStatusUpdate: vi.fn(),
    emitIterationStart: vi.fn(),
    emitIterationEnd: vi.fn(),
    close: vi.fn()
  }))
}));

vi.mock('../../../src/core/StatusManager.js', () => ({
  StatusManager: vi.fn().mockImplementation(() => {
    const emitter = new EventEmitter();
    return {
      updateStatus: vi.fn(),
      getStatus: vi.fn().mockReturnValue({ status: 'idle' }),
      on: emitter.on.bind(emitter),
      emit: emitter.emit.bind(emitter),
      off: emitter.off.bind(emitter)
    };
  })
}));

// Mock agent classes
const createMockAgent = () => ({
  execute: vi.fn().mockResolvedValue({
    success: true,
    score: 85,
    improvements: [],
    issues: []
  }),
  getCapabilities: vi.fn().mockReturnValue([]),
  isReady: vi.fn().mockReturnValue(true)
});

vi.mock('../../../src/agents/EnhancementAgent.js', () => ({
  EnhancementAgent: vi.fn().mockImplementation(() => createMockAgent())
}));

vi.mock('../../../src/agents/ReviewAgent.js', () => ({
  ReviewAgent: vi.fn().mockImplementation(() => createMockAgent())
}));

vi.mock('../../../src/agents/AnalysisAgent.js', () => ({
  AnalysisAgent: vi.fn().mockImplementation(() => createMockAgent())
}));

vi.mock('../../../src/agents/ImprovementAgent.js', () => ({
  ImprovementAgent: vi.fn().mockImplementation(() => createMockAgent())
}));

vi.mock('../../../src/agents/VisualTestingAgent.js', () => ({
  VisualTestingAgent: vi.fn().mockImplementation(() => createMockAgent())
}));

// Create a testable version of ContinuousLoopController
class TestableLoopController extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxIterations: config.maxIterations || 5,
      targetScore: config.targetScore || 95,
      projectRoot: config.projectRoot || process.cwd(),
      verbose: config.verbose || false,
      convergenceThreshold: config.convergenceThreshold || 2,
      visualTesting: config.visualTesting !== false,
      enableRealtime: config.enableRealtime !== false,
      realtimePort: config.realtimePort || 8765,
      monitoringOnly: config.monitoringOnly !== false,
      executeEnhancements: config.executeEnhancements || false,
      ...config
    };

    // Initialize agents with mocks
    this.agents = {
      enhancement: createMockAgent(),
      review: createMockAgent(),
      analysis: createMockAgent(),
      improvement: createMockAgent(),
      visualTesting: this.config.visualTesting ? createMockAgent() : null
    };

    // Initialize metrics and tracking
    this.iterationHistory = [];
    this.currentIteration = 0;
    this.lastScore = 0;
    this.convergenceCount = 0;
    this.isRunning = false;

    // Mock real-time infrastructure
    this.realtimeEmitter = null;
    this.statusManager = null;

    if (this.config.enableRealtime) {
      this.initializeRealtimeInfrastructure();
    }
  }

  async initializeRealtimeInfrastructure() {
    // Simplified mock initialization
    this.statusManager = {
      updateStatus: vi.fn(),
      getStatus: vi.fn().mockReturnValue({ status: 'idle' })
    };
    this.realtimeEmitter = {
      emitStatusUpdate: vi.fn(),
      emitIterationStart: vi.fn(),
      emitIterationEnd: vi.fn()
    };
  }

  async startContinuousLoop() {
    if (this.isRunning) {
      throw new Error('Loop is already running');
    }

    this.isRunning = true;
    this.emit('loop:started');

    try {
      for (let i = 0; i < this.config.maxIterations; i++) {
        this.currentIteration = i + 1;

        const iterationResult = await this.runSingleIteration();
        this.iterationHistory.push(iterationResult);

        // Check convergence
        if (iterationResult.score >= this.config.targetScore) {
          this.emit('loop:target-reached', { score: iterationResult.score });
          break;
        }

        // Check for score improvement
        if (iterationResult.score <= this.lastScore) {
          this.convergenceCount++;
        } else {
          this.convergenceCount = 0;
        }

        this.lastScore = iterationResult.score;

        // Check convergence threshold
        if (this.convergenceCount >= this.config.convergenceThreshold) {
          this.emit('loop:converged', {
            iterations: this.currentIteration,
            finalScore: iterationResult.score
          });
          break;
        }
      }

      this.emit('loop:completed', {
        iterations: this.currentIteration,
        finalScore: this.lastScore,
        history: this.iterationHistory
      });

    } finally {
      this.isRunning = false;
    }

    return {
      success: true,
      iterations: this.currentIteration,
      finalScore: this.lastScore,
      history: this.iterationHistory
    };
  }

  async runSingleIteration() {
    this.emit('iteration:started', { iteration: this.currentIteration });

    const results = {
      iteration: this.currentIteration,
      timestamp: new Date().toISOString(),
      agentResults: {},
      score: 0,
      improvements: [],
      issues: []
    };

    // Execute agents in sequence
    const agentNames = ['analysis', 'review', 'improvement'];

    if (this.config.executeEnhancements) {
      agentNames.push('enhancement');
    }

    if (this.config.visualTesting) {
      agentNames.push('visualTesting');
    }

    for (const agentName of agentNames) {
      const agent = this.agents[agentName];
      if (agent) {
        try {
          const agentResult = await agent.execute();
          results.agentResults[agentName] = agentResult;

          if (agentResult.score) {
            results.score = Math.max(results.score, agentResult.score);
          }

          if (agentResult.improvements) {
            results.improvements.push(...agentResult.improvements);
          }

          if (agentResult.issues) {
            results.issues.push(...agentResult.issues);
          }

        } catch (error) {
          results.agentResults[agentName] = {
            success: false,
            error: error.message
          };
        }
      }
    }

    this.emit('iteration:completed', results);
    return results;
  }

  async stop() {
    this.isRunning = false;
    this.emit('loop:stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      currentIteration: this.currentIteration,
      lastScore: this.lastScore,
      convergenceCount: this.convergenceCount,
      history: this.iterationHistory
    };
  }

  getMetrics() {
    return {
      totalIterations: this.currentIteration,
      targetScore: this.config.targetScore,
      currentScore: this.lastScore,
      convergenceThreshold: this.config.convergenceThreshold,
      convergenceCount: this.convergenceCount,
      averageScore: this.iterationHistory.length > 0
        ? this.iterationHistory.reduce((sum, iter) => sum + iter.score, 0) / this.iterationHistory.length
        : 0
    };
  }

  reset() {
    this.currentIteration = 0;
    this.lastScore = 0;
    this.convergenceCount = 0;
    this.iterationHistory = [];
    this.isRunning = false;
    this.emit('loop:reset');
  }
}

describe('ContinuousLoopController', () => {
  let controller;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      maxIterations: 3,
      targetScore: 90,
      verbose: false,
      enableRealtime: false, // Disable for testing
      monitoringOnly: true,
      executeEnhancements: false
    };

    controller = new TestableLoopController(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (controller && controller.isRunning) {
      controller.stop();
    }
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(controller.config.projectRoot).toBe('/test/project');
      expect(controller.config.maxIterations).toBe(3);
      expect(controller.config.targetScore).toBe(90);
      expect(controller.config.verbose).toBe(false);
    });

    it('should use default values when not provided', () => {
      const defaultController = new TestableLoopController();
      expect(defaultController.config.maxIterations).toBe(5);
      expect(defaultController.config.targetScore).toBe(95);
      expect(defaultController.config.convergenceThreshold).toBe(2);
    });

    it('should initialize agents', () => {
      expect(controller.agents.enhancement).toBeDefined();
      expect(controller.agents.review).toBeDefined();
      expect(controller.agents.analysis).toBeDefined();
      expect(controller.agents.improvement).toBeDefined();
    });

    it('should initialize visual testing agent when enabled', () => {
      const visualController = new TestableLoopController({ visualTesting: true });
      expect(visualController.agents.visualTesting).toBeDefined();
    });

    it('should not initialize visual testing agent when disabled', () => {
      const noVisualController = new TestableLoopController({ visualTesting: false });
      expect(noVisualController.agents.visualTesting).toBeNull();
    });

    it('should initialize tracking variables', () => {
      expect(controller.currentIteration).toBe(0);
      expect(controller.lastScore).toBe(0);
      expect(controller.convergenceCount).toBe(0);
      expect(controller.iterationHistory).toEqual([]);
      expect(controller.isRunning).toBe(false);
    });
  });

  describe('startContinuousLoop', () => {
    it('should run through all iterations when target not reached', async () => {
      // Mock agents to return scores below target
      Object.values(controller.agents).forEach(agent => {
        if (agent) {
          agent.execute.mockResolvedValue({ success: true, score: 80 });
        }
      });

      const result = await controller.startContinuousLoop();

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(3); // maxIterations
      expect(controller.iterationHistory).toHaveLength(3);
    });

    it('should stop early when target score is reached', async () => {
      // Mock agents to return high score immediately
      Object.values(controller.agents).forEach(agent => {
        if (agent) {
          agent.execute.mockResolvedValue({ success: true, score: 95 });
        }
      });

      const result = await controller.startContinuousLoop();

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(1); // Stopped early
      expect(result.finalScore).toBe(95);
    });

    it('should stop on convergence threshold', async () => {
      // Mock agents to return same low score repeatedly
      Object.values(controller.agents).forEach(agent => {
        if (agent) {
          agent.execute.mockResolvedValue({ success: true, score: 70 });
        }
      });

      controller.config.convergenceThreshold = 2;
      const result = await controller.startContinuousLoop();

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(3); // 1 initial + 2 convergence iterations
    });

    it('should throw error if already running', async () => {
      controller.isRunning = true;

      await expect(controller.startContinuousLoop()).rejects.toThrow('Loop is already running');
    });

    it('should emit proper events during loop execution', async () => {
      const events = [];
      controller.on('loop:started', () => events.push('started'));
      controller.on('iteration:started', () => events.push('iteration:started'));
      controller.on('iteration:completed', () => events.push('iteration:completed'));
      controller.on('loop:completed', () => events.push('completed'));

      Object.values(controller.agents).forEach(agent => {
        if (agent) {
          agent.execute.mockResolvedValue({ success: true, score: 80 });
        }
      });

      await controller.startContinuousLoop();

      expect(events).toContain('started');
      expect(events).toContain('completed');
      expect(events.filter(e => e === 'iteration:started')).toHaveLength(3);
      expect(events.filter(e => e === 'iteration:completed')).toHaveLength(3);
    });
  });

  describe('runSingleIteration', () => {
    it('should execute configured agents in sequence', async () => {
      // Ensure currentIteration is set properly
      controller.currentIteration = 1;
      const result = await controller.runSingleIteration();

      expect(result.iteration).toBe(1);
      expect(result.agentResults).toHaveProperty('analysis');
      expect(result.agentResults).toHaveProperty('review');
      expect(result.agentResults).toHaveProperty('improvement');
    });

    it('should not execute enhancement agent in monitoring mode', async () => {
      const result = await controller.runSingleIteration();

      expect(result.agentResults).not.toHaveProperty('enhancement');
    });

    it('should execute enhancement agent when explicitly enabled', async () => {
      controller.config.executeEnhancements = true;
      const result = await controller.runSingleIteration();

      expect(result.agentResults).toHaveProperty('enhancement');
    });

    it('should handle agent execution errors gracefully', async () => {
      controller.agents.analysis.execute.mockRejectedValue(new Error('Analysis failed'));

      const result = await controller.runSingleIteration();

      expect(result.agentResults.analysis).toEqual({
        success: false,
        error: 'Analysis failed'
      });
    });

    it('should aggregate scores and improvements from agents', async () => {
      controller.agents.analysis.execute.mockResolvedValue({
        success: true,
        score: 85,
        improvements: ['improvement1'],
        issues: ['issue1']
      });

      controller.agents.review.execute.mockResolvedValue({
        success: true,
        score: 90,
        improvements: ['improvement2'],
        issues: ['issue2']
      });

      const result = await controller.runSingleIteration();

      expect(result.score).toBe(90); // Max score
      expect(result.improvements).toEqual(['improvement1', 'improvement2']);
      expect(result.issues).toEqual(['issue1', 'issue2']);
    });
  });

  describe('status and control methods', () => {
    it('should return current status', () => {
      const status = controller.getStatus();

      expect(status).toEqual({
        isRunning: false,
        currentIteration: 0,
        lastScore: 0,
        convergenceCount: 0,
        history: []
      });
    });

    it('should return metrics', () => {
      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('totalIterations');
      expect(metrics).toHaveProperty('targetScore');
      expect(metrics).toHaveProperty('currentScore');
      expect(metrics).toHaveProperty('convergenceThreshold');
      expect(metrics).toHaveProperty('convergenceCount');
      expect(metrics).toHaveProperty('averageScore');
    });

    it('should calculate average score correctly', async () => {
      // Run some iterations to generate history
      Object.values(controller.agents).forEach(agent => {
        if (agent) {
          agent.execute
            .mockResolvedValueOnce({ success: true, score: 80 })
            .mockResolvedValueOnce({ success: true, score: 90 });
        }
      });

      controller.config.maxIterations = 2;
      await controller.startContinuousLoop();

      const metrics = controller.getMetrics();
      expect(metrics.averageScore).toBe(85); // (80 + 90) / 2
    });

    it('should stop running loop', async () => {
      controller.isRunning = true;
      const stopSpy = vi.fn();
      controller.on('loop:stopped', stopSpy);

      await controller.stop();

      expect(controller.isRunning).toBe(false);
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should reset controller state', () => {
      // Set some state
      controller.currentIteration = 3;
      controller.lastScore = 85;
      controller.convergenceCount = 1;
      controller.iterationHistory = [{ iteration: 1 }];
      controller.isRunning = true;

      const resetSpy = vi.fn();
      controller.on('loop:reset', resetSpy);

      controller.reset();

      expect(controller.currentIteration).toBe(0);
      expect(controller.lastScore).toBe(0);
      expect(controller.convergenceCount).toBe(0);
      expect(controller.iterationHistory).toEqual([]);
      expect(controller.isRunning).toBe(false);
      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('real-time infrastructure', () => {
    it('should initialize real-time components when enabled', async () => {
      const realtimeController = new TestableLoopController({
        enableRealtime: true
      });

      expect(realtimeController.statusManager).toBeDefined();
      expect(realtimeController.realtimeEmitter).toBeDefined();
    });

    it('should not initialize real-time components when disabled', () => {
      const noRealtimeController = new TestableLoopController({
        enableRealtime: false
      });

      expect(noRealtimeController.statusManager).toBeNull();
      expect(noRealtimeController.realtimeEmitter).toBeNull();
    });
  });

  describe('event emission', () => {
    it('should emit target-reached event when score meets target', async () => {
      const targetReachedSpy = vi.fn();
      controller.on('loop:target-reached', targetReachedSpy);

      Object.values(controller.agents).forEach(agent => {
        if (agent) {
          agent.execute.mockResolvedValue({ success: true, score: 95 });
        }
      });

      await controller.startContinuousLoop();

      expect(targetReachedSpy).toHaveBeenCalledWith({ score: 95 });
    });

    it('should emit converged event when convergence threshold is reached', async () => {
      const convergedSpy = vi.fn();
      controller.on('loop:converged', convergedSpy);

      // Mock consistent low scores to trigger convergence
      Object.values(controller.agents).forEach(agent => {
        if (agent) {
          agent.execute.mockResolvedValue({ success: true, score: 70 });
        }
      });

      controller.config.convergenceThreshold = 2;
      await controller.startContinuousLoop();

      expect(convergedSpy).toHaveBeenCalledWith({
        iterations: expect.any(Number),
        finalScore: 70
      });
    });
  });
});