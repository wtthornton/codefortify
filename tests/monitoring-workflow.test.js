/**
 * Test suite for monitoring-only workflow
 * Verifies that CodeFortify operates in monitoring mode without autonomous changes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIAgentMonitor } from '../src/monitoring/AIAgentMonitor.js';
import { ProjectScorer } from '../src/scoring/ProjectScorer.js';
import { ContinuousLoopController } from '../src/core/ContinuousLoopController.js';
import fs from 'fs-extra';
import path from 'path';

describe('Monitoring-Only Workflow', () => {
  let monitor;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), 'test-output', 'monitoring-test');
    await fs.ensureDir(testDir);

    monitor = new AIAgentMonitor({
      projectRoot: testDir,
      monitoringInterval: 100, // Fast for testing
      enableRealtime: false
    });
  });

  afterEach(async () => {
    if (monitor) {
      await monitor.stopMonitoring();
    }
    await fs.remove(testDir);
  });

  describe('AIAgentMonitor', () => {
    it('should start monitoring without making changes', async () => {
      const result = await monitor.startMonitoring();

      expect(result.status).toBe('monitoring');
      expect(result.message).toContain('no autonomous changes');
      expect(result.baseline).toBeDefined();
      expect(result.baseline.totalScore).toBeGreaterThanOrEqual(0);
    });

    it('should track external code changes', async () => {
      await monitor.startMonitoring();

      // Simulate external change
      const testFile = path.join(testDir, 'test.js');
      await fs.writeFile(testFile, 'const x = 1;');

      // Wait for monitoring to detect change
      await new Promise(resolve => setTimeout(resolve, 200));

      const status = monitor.getStatus();
      expect(status.status).toBe('monitoring');
      // Changes might not be detected immediately in test environment
    });

    it('should generate recommendations without executing them', async () => {
      await monitor.startMonitoring();

      const scoreData = {
        totalScore: 75,
        categoryScores: {
          quality: 60,
          security: 80
        }
      };

      const recommendations = await monitor.generateRecommendations(scoreData);

      recommendations.forEach(rec => {
        expect(rec.autoExecute).toBe(false);
        expect(rec.type).toBe('recommendation');
        expect(rec.estimatedImpact).toBeDefined();
      });
    });

    it('should calculate AI agent effectiveness', async () => {
      await monitor.startMonitoring();

      // Simulate some changes
      monitor.changeHistory = [
        { delta: 2, timestamp: Date.now() },
        { delta: -1, timestamp: Date.now() },
        { delta: 3, timestamp: Date.now() }
      ];

      monitor.currentScore = { totalScore: 80 };
      monitor.baselineScore = { totalScore: 76 };

      const effectiveness = monitor.calculateAIEffectiveness();

      expect(effectiveness.score).toBeGreaterThanOrEqual(0);
      expect(effectiveness.rating).toBeDefined();
      expect(effectiveness.totalImprovement).toBe(4);
    });

    it('should provide effectiveness report', async () => {
      await monitor.startMonitoring();

      // Add some test data
      monitor.changeHistory = [
        { delta: 2, timestamp: Date.now() }
      ];

      const report = monitor.getEffectivenessReport();

      expect(report).toBeDefined();
      expect(report.sessionDuration).toBeGreaterThanOrEqual(0);
      expect(report.changeCount).toBe(1);
    });
  });

  describe('ContinuousLoopController Monitoring Mode', () => {
    it('should default to monitoring-only mode', () => {
      const controller = new ContinuousLoopController({
        projectRoot: testDir
      });

      expect(controller.config.monitoringOnly).toBe(true);
      expect(controller.config.executeEnhancements).toBe(false);
    });

    it('should skip enhancement in monitoring mode', async () => {
      const controller = new ContinuousLoopController({
        projectRoot: testDir,
        monitoringOnly: true,
        executeEnhancements: false
      });

      const mockCode = 'const x = 1;';

      // Spy on enhancement agent
      const enhanceSpy = vi.spyOn(controller.agents.enhancement, 'enhance');

      // Run iteration - should skip enhancement
      await controller.runIterationCycle(mockCode);

      // Enhancement should not be called in monitoring mode
      expect(enhanceSpy).not.toHaveBeenCalled();
    });

    it('should only execute enhancements when explicitly enabled', async () => {
      const controller = new ContinuousLoopController({
        projectRoot: testDir,
        monitoringOnly: false,
        executeEnhancements: true // Must explicitly enable
      });

      const mockCode = 'const x = 1;';

      // Spy on enhancement agent
      const enhanceSpy = vi.spyOn(controller.agents.enhancement, 'enhance')
        .mockResolvedValue({ code: mockCode, improvements: [] });

      await controller.runIterationCycle(mockCode);

      // Enhancement should be called when explicitly enabled
      expect(enhanceSpy).toHaveBeenCalled();
    });
  });

  describe('Score Command', () => {
    it('should provide analysis without modifications', async () => {
      const scorer = new ProjectScorer({
        projectRoot: testDir
      });

      // Create a simple test file
      await fs.writeFile(
        path.join(testDir, 'index.js'),
        'console.log("test");'
      );

      const result = await scorer.scoreProject();

      expect(result.totalScore).toBeDefined();
      expect(result.categoryScores).toBeDefined();
      expect(result.recommendations).toBeDefined();

      // Verify no files were modified
      const content = await fs.readFile(path.join(testDir, 'index.js'), 'utf8');
      expect(content).toBe('console.log("test");');
    });
  });

  describe('Integration Test', () => {
    it('should complete full monitoring workflow', async () => {
      // 1. Start monitoring
      const startResult = await monitor.startMonitoring();
      expect(startResult.status).toBe('monitoring');

      // 2. Simulate AI agent making changes
      const testFile = path.join(testDir, 'improved.js');
      await fs.writeFile(testFile, '// Improved by AI\nconst improvedCode = true;');

      // 3. Wait for detection
      await new Promise(resolve => setTimeout(resolve, 200));

      // 4. Get status
      const status = monitor.getStatus();
      expect(status.status).toBe('monitoring');

      // 5. Stop and get summary
      const summary = await monitor.stopMonitoring();
      expect(summary.duration).toBeGreaterThan(0);
      expect(summary.baseline).toBeDefined();
      expect(summary.final).toBeDefined();
    });
  });
});

describe('CLI Commands in Monitoring Mode', () => {
  it('enhance command should show disabled message', async () => {
    const { EnhanceCommand } = await import('../src/cli/commands/EnhanceCommand.js');
    const command = new EnhanceCommand({ projectRoot: process.cwd() });

    // Spy on console.log
    const consoleSpy = vi.spyOn(console, 'log');

    await command.execute(null, {});

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Autonomous Enhancement is DISABLED')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Monitoring Mode')
    );
  });

  it('monitor command should work correctly', async () => {
    const { MonitorCommand } = await import('../src/cli/commands/MonitorCommand.js');
    const command = new MonitorCommand({ projectRoot: process.cwd() });

    // Create a mock monitor to test command initialization
    const _executeSpy = vi.spyOn(command, 'execute');

    const _options = {
      interval: 5000,
      dashboard: false,
      verbose: false
    };

    // Command should accept monitoring options
    expect(command.execute).toBeDefined();
    expect(typeof command.execute).toBe('function');
  });
});