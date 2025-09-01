/**
 * Integration tests for the CodeFortify Enhancement System
 *
 * Tests the complete continuous improvement workflow including:
 * - Continuous Loop Controller orchestration
 * - Agent coordination and communication
 * - Pattern learning and application
 * - Self-measurement and metrics tracking
 * - Context7 integration and prompt enhancement
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ContinuousLoopController } from '../../src/core/ContinuousLoopController.js';
import { PatternLearningSystem } from '../../src/learning/PatternLearningSystem.js';
import { PromptEnhancer } from '../../src/enhancement/PromptEnhancer.js';
import { EnhanceCommand } from '../../src/cli/commands/EnhanceCommand.js';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testProjectRoot = path.join(__dirname, 'temp-test-project');

describe('Enhancement System Integration', () => {
  beforeEach(() => {
    // Create temporary test project
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
    mkdirSync(testProjectRoot, { recursive: true });
    mkdirSync(path.join(testProjectRoot, 'src'), { recursive: true });
  });

  afterEach(() => {
    // Cleanup test project
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('ContinuousLoopController', () => {
    it('should orchestrate complete enhancement workflow', async () => {
      const config = {
        projectRoot: testProjectRoot,
        maxIterations: 3,
        targetScore: 85,
        verbose: false
      };

      const controller = new ContinuousLoopController(config);

      // Test code with known issues
      const testCode = `
var x = 5;
function test() {
  document.getElementById("myDiv");
  for (var i = 0; i < arr.length; i++) {
    console.log(i);
  }
  eval("alert('test')");
}
      `.trim();

      const result = await controller.processCode(testCode);

      // Verify results structure
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('progression');
      expect(result).toHaveProperty('finalCode');

      // Verify improvement occurred
      expect(result.summary.iterations).toBeGreaterThan(0);
      expect(result.summary.iterations).toBeLessThanOrEqual(3);
      expect(result.summary.finalScore).toBeGreaterThan(0);

      // Verify progression tracking
      expect(result.progression).toBeInstanceOf(Array);
      expect(result.progression.length).toEqual(result.summary.iterations);

      // Verify final code is different from original
      expect(result.finalCode).not.toEqual(testCode);
    }, 30000);

    it('should stop when target score is reached', async () => {
      const config = {
        projectRoot: testProjectRoot,
        maxIterations: 10,
        targetScore: 70, // Lower target for faster completion
        verbose: false
      };

      const controller = new ContinuousLoopController(config);

      const testCode = `
const x = 5;
function test() {
  return x;
}
      `.trim();

      const result = await controller.processCode(testCode);

      expect(result.summary.targetAchieved).toBe(true);
      expect(result.summary.finalScore).toBeGreaterThanOrEqual(70);
    }, 20000);

    it('should handle event emissions correctly', async () => {
      const config = {
        projectRoot: testProjectRoot,
        maxIterations: 2,
        targetScore: 95,
        verbose: true
      };

      const controller = new ContinuousLoopController(config);
      const events = [];

      // Track all events
      controller.on('loop:start', (data) => events.push({ type: 'loop:start', data }));
      controller.on('iteration:start', (data) => events.push({ type: 'iteration:start', data }));
      controller.on('iteration:complete', (data) => events.push({ type: 'iteration:complete', data }));
      controller.on('loop:complete', (data) => events.push({ type: 'loop:complete', data }));

      const testCode = 'const test = "hello";';
      await controller.processCode(testCode);

      // Verify events were emitted
      expect(events.some(e => e.type === 'loop:start')).toBe(true);
      expect(events.some(e => e.type === 'loop:complete')).toBe(true);
      expect(events.filter(e => e.type === 'iteration:start').length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Pattern Learning System', () => {
    it('should learn patterns from successful improvements', async () => {
      const config = { projectRoot: testProjectRoot };
      const learner = new PatternLearningSystem(config);

      const originalCode = 'var x = 5;';
      const improvedCode = 'let x = 5;';
      const improvement = {
        type: 'syntax',
        category: 'modernization',
        description: 'Replace var with let',
        impact: 3
      };

      const patterns = await learner.learnFromImprovement(originalCode, improvedCode, improvement);

      expect(patterns).toBeInstanceOf(Array);
      expect(patterns.length).toBeGreaterThan(0);

      // Verify pattern structure
      const pattern = patterns[0];
      expect(pattern).toHaveProperty('type');
      expect(pattern).toHaveProperty('effectiveness');
      expect(pattern).toHaveProperty('learned');
    });

    it('should apply learned patterns to new code', async () => {
      const config = { projectRoot: testProjectRoot };
      const learner = new PatternLearningSystem(config);

      // First, learn a pattern
      await learner.learnFromImprovement(
        'var x = 5;',
        'let x = 5;',
        { type: 'syntax', category: 'modernization', description: 'var to let', impact: 3 }
      );

      // Then apply to similar code
      const newCode = 'var y = 10; var z = 15;';
      const result = await learner.applyLearnedPatterns(newCode);

      expect(result).toHaveProperty('improvedCode');
      expect(result).toHaveProperty('patternsApplied');
      expect(result.patternsApplied).toBeInstanceOf(Array);
    });

    it('should track pattern effectiveness', async () => {
      const config = { projectRoot: testProjectRoot };
      const learner = new PatternLearningSystem(config);

      const stats = learner.getLearningStats();

      expect(stats).toHaveProperty('totalPatterns');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('topPatterns');
    });
  });

  describe('Prompt Enhancement', () => {
    it('should enhance prompts with relevant context', async () => {
      const config = { projectRoot: testProjectRoot };
      const enhancer = new PromptEnhancer(config);

      const prompt = 'Create a React component for user profile';
      const result = await enhancer.enhance(prompt);

      expect(result).toHaveProperty('originalPrompt');
      expect(result).toHaveProperty('enhancedPrompt');
      expect(result).toHaveProperty('metrics');
      expect(result.originalPrompt).toBe(prompt);
      expect(result.enhancedPrompt.length).toBeGreaterThanOrEqual(prompt.length);
    });

    it('should track token usage and reduction', async () => {
      const config = { projectRoot: testProjectRoot, enableTokenTracking: true };
      const enhancer = new PromptEnhancer(config);

      const prompt = 'Fix this JavaScript function';
      const result = await enhancer.enhance(prompt);

      expect(result.metrics).toHaveProperty('originalTokens');
      expect(result.metrics).toHaveProperty('enhancedTokens');
      expect(result.metrics).toHaveProperty('tokenReduction');
      expect(result.metrics.originalTokens).toBeGreaterThan(0);
    });

    it('should provide enhancement statistics', async () => {
      const config = { projectRoot: testProjectRoot };
      const enhancer = new PromptEnhancer(config);

      // Perform some enhancements
      await enhancer.enhance('Create a component');
      await enhancer.enhance('Fix this bug');

      const stats = enhancer.getEnhancementStats();

      expect(stats).toHaveProperty('totalEnhancements');
      expect(stats).toHaveProperty('averageReduction');
      expect(stats).toHaveProperty('projectedSavings');
      expect(stats.totalEnhancements).toBe(2);
    });
  });

  describe('CLI Integration', () => {
    it('should execute enhance command successfully', async () => {
      const globalConfig = {
        projectRoot: testProjectRoot,
        verbose: false
      };

      const command = new EnhanceCommand(globalConfig);

      // Create a test file
      const testFile = path.join(testProjectRoot, 'src', 'test.js');
      writeFileSync(testFile, `
var x = 5;
function test() {
  console.log('hello');
}
      `.trim());

      const result = await command.execute(testFile, {
        iterations: 2,
        target: 80,
        format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('finalScore');
      expect(result).toHaveProperty('iterations');
    }, 25000);

    it('should handle missing input gracefully', async () => {
      const globalConfig = {
        projectRoot: testProjectRoot,
        verbose: false
      };

      const command = new EnhanceCommand(globalConfig);

      const result = await command.execute(null, { iterations: 1 });

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });

    it('should auto-detect project files when no input provided', async () => {
      const globalConfig = {
        projectRoot: testProjectRoot,
        verbose: false
      };

      // Create a main file that should be auto-detected
      writeFileSync(path.join(testProjectRoot, 'src', 'index.js'), `
const app = {
  start: function() {
    console.log('App started');
  }
};
      `.trim());

      const command = new EnhanceCommand(globalConfig);
      const result = await command.execute(undefined, { iterations: 1, target: 70 });

      expect(result.success).toBe(true);
    }, 20000);
  });

  describe('End-to-End Enhancement Workflow', () => {
    it('should complete full enhancement cycle with all components', async () => {
      const config = {
        projectRoot: testProjectRoot,
        maxIterations: 3,
        targetScore: 80,
        verbose: false
      };

      // Initialize all components
      const controller = new ContinuousLoopController(config);
      const learner = new PatternLearningSystem(config);
      const enhancer = new PromptEnhancer(config);

      // Test code with multiple improvement opportunities
      const testCode = `
var userName = 'test';
function getUserInfo() {
  document.getElementById('user-info');
  for (var i = 0; i < users.length; i++) {
    if (users[i] == userName) {
      console.log('Found user');
      eval('alert("User found: ' + userName + '")');
      return users[i];
    }
  }
}
      `.trim();

      // Run enhancement
      const result = await controller.processCode(testCode);

      // Verify comprehensive improvement
      expect(result.summary.finalScore).toBeGreaterThan(60);
      expect(result.finalCode).not.toBe(testCode);
      expect(result.progression.length).toBeGreaterThan(0);

      // Check if patterns were learned
      const stats = learner.getLearningStats();
      const enhancementStats = enhancer.getEnhancementStats();

      // Verify systems are tracking metrics
      expect(typeof stats.totalPatterns).toBe('number');
      expect(typeof enhancementStats.totalEnhancements).toBe('number');
    }, 35000);

    it('should demonstrate measurable improvement over iterations', async () => {
      const config = {
        projectRoot: testProjectRoot,
        maxIterations: 4,
        targetScore: 90,
        verbose: false
      };

      const controller = new ContinuousLoopController(config);

      const poorQualityCode = `
var data;
function process() {
  data = eval('(' + input + ')');
  for (var i = 0; i < data.length; i++) {
    document.getElementById('item').innerHTML = data[i];
  }
}
      `.trim();

      const result = await controller.processCode(poorQualityCode);

      // Verify progressive improvement
      expect(result.progression.length).toBeGreaterThan(1);

      // Check that scores generally improve (allowing for some variation)
      const scores = result.progression.map(p => p.score);
      const firstScore = scores[0];
      const lastScore = scores[scores.length - 1];

      expect(lastScore).toBeGreaterThanOrEqual(firstScore);
    }, 30000);
  });
});

describe('Performance and Reliability', () => {
  beforeEach(() => {
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
    mkdirSync(testProjectRoot, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
  });

  it('should handle large code inputs efficiently', async () => {
    const config = {
      projectRoot: testProjectRoot,
      maxIterations: 2,
      targetScore: 80,
      verbose: false
    };

    const controller = new ContinuousLoopController(config);

    // Generate larger code sample
    const largeCode = Array.from({ length: 50 }, (_, i) =>
      `var variable${i} = 'value${i}';\nfunction func${i}() { console.log(variable${i}); }`
    ).join('\n');

    const startTime = Date.now();
    const result = await controller.processCode(largeCode);
    const duration = Date.now() - startTime;

    expect(result.summary.finalScore).toBeGreaterThan(0);
    expect(duration).toBeLessThan(45000); // Should complete within 45 seconds
  }, 50000);

  it('should gracefully handle edge cases and errors', async () => {
    const config = {
      projectRoot: testProjectRoot,
      maxIterations: 2,
      targetScore: 90,
      verbose: false
    };

    const controller = new ContinuousLoopController(config);

    // Test with potentially problematic code
    const edgeCaseCode = `
// Empty function
function empty() {}

// Minimal code
const x = 1;

// Unicode characters
const ☃️ = 'snowman';
      `.trim();

    const result = await controller.processCode(edgeCaseCode);

    expect(result).toHaveProperty('summary');
    expect(result.summary.finalScore).toBeGreaterThanOrEqual(0);
  }, 20000);

  it('should respect iteration limits', async () => {
    const config = {
      projectRoot: testProjectRoot,
      maxIterations: 2,
      targetScore: 100, // Unrealistic target to test limit
      verbose: false
    };

    const controller = new ContinuousLoopController(config);

    const result = await controller.processCode('const test = "hello";');

    expect(result.summary.iterations).toBeLessThanOrEqual(2);
  }, 15000);
});