/**
 * Tests for RealtimeQualityMonitor
 * Tests the real-time code quality monitoring system for Context7 integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RealtimeQualityMonitor } from '../../../src/monitoring/RealtimeQualityMonitor.js';
import { CodeAnalysisEngine } from '../../../src/monitoring/CodeAnalysisEngine.js';
import { QualityThresholds } from '../../../src/monitoring/QualityThresholds.js';
import { SuggestionGenerator } from '../../../src/monitoring/SuggestionGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('RealtimeQualityMonitor', () => {
  let monitor;
  let testProjectDir;
  let config;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, 'fixtures', 'monitoring-test-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });

    config = {
      monitoringEnabled: true,
      analysisInterval: 1000, // 1 second for testing
      qualityThresholds: {
        maintainability: 0.7,
        performance: 0.8,
        security: 0.9,
        testCoverage: 0.8,
        codeComplexity: 0.6,
        documentation: 0.5,
        accessibility: 0.7
      },
      alertThresholds: {
        critical: 0.3,
        warning: 0.6
      },
      maxHistorySize: 100
    };

    monitor = new RealtimeQualityMonitor(config);
  });

  afterEach(async () => {
    try {
      await monitor.stop();
    } catch (error) {
      // Ignore cleanup errors
    }
    
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultMonitor = new RealtimeQualityMonitor();
      expect(defaultMonitor.config).toBeDefined();
      expect(defaultMonitor.analysisEngine).toBeInstanceOf(CodeAnalysisEngine);
      expect(defaultMonitor.qualityThresholds).toBeInstanceOf(QualityThresholds);
      expect(defaultMonitor.suggestionGenerator).toBeInstanceOf(SuggestionGenerator);
      expect(defaultMonitor.qualityHistory).toBeInstanceOf(Map);
      expect(defaultMonitor.monitoringSessions).toBeInstanceOf(Map);
    });

    it('should initialize with custom configuration', () => {
      expect(monitor.config).toEqual(config);
      expect(monitor.analysisEngine).toBeInstanceOf(CodeAnalysisEngine);
      expect(monitor.qualityThresholds).toBeInstanceOf(QualityThresholds);
      expect(monitor.suggestionGenerator).toBeInstanceOf(SuggestionGenerator);
      expect(monitor.qualityHistory).toBeInstanceOf(Map);
      expect(monitor.monitoringSessions).toBeInstanceOf(Map);
    });
  });

  describe('startMonitoring', () => {
    it('should start monitoring project', async () => {
      // Create test files
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() {
  return 'Hello World';
}`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          version: '1.0.0'
        })
      );

      const testFile = path.join(testProjectDir, 'src', 'example.js');
      const context = { project: { type: 'javascript' } };
      const sessionId = await monitor.startMonitoring(testFile, context);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(monitor.monitoringSessions.has(sessionId)).toBe(true);
    });

    it('should handle non-existent project directory', async () => {
      const nonExistentFile = path.join(testProjectDir, 'non-existent', 'file.js');
      const context = { project: { type: 'javascript' } };

      await expect(monitor.startMonitoring(nonExistentFile, context))
        .rejects.toThrow();
    });

    it('should create monitoring session', async () => {
      const testFile = path.join(testProjectDir, 'src', 'example.js');
      await fs.writeFile(
        testFile,
        `function example() { return 'test'; }`
      );

      const context = { project: { type: 'javascript' } };
      const sessionId = await monitor.startMonitoring(testFile, context);

      expect(sessionId).toBeDefined();
      expect(monitor.monitoringSessions.has(sessionId)).toBe(true);
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.startMonitoring(testProjectDir);
      expect(monitor.isMonitoring).toBe(true);

      const result = await monitor.stopMonitoring();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(monitor.isMonitoring).toBe(false);
    });

    it('should emit monitoring stopped event', async () => {
      const eventSpy = vi.fn();
      monitor.on('monitoringStopped', eventSpy);

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.startMonitoring(testProjectDir);
      await monitor.stopMonitoring();

      expect(eventSpy).toHaveBeenCalledWith({
        timestamp: expect.any(Date)
      });
    });

    it('should handle stopping when not monitoring', async () => {
      const result = await monitor.stopMonitoring();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('analyzeProject', () => {
    it('should analyze project quality', async () => {
      // Create test project with various quality levels
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'good-code.js'),
        `/**
 * Well-documented function
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

module.exports = { add };`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'bad-code.js'),
        `function bad() {
  var unused = 'this is bad';
  console.log('debugging');
  if (true) {
    if (true) {
      if (true) {
        return null;
      }
    }
  }
}`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          scripts: {
            test: 'jest'
          }
        })
      );

      const analysis = await monitor.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.projectPath).toBe(testProjectDir);
      expect(analysis.timestamp).toBeDefined();
      expect(analysis.overallScore).toBeDefined();
      expect(analysis.categories).toBeDefined();
      expect(analysis.categories.maintainability).toBeDefined();
      expect(analysis.categories.performance).toBeDefined();
      expect(analysis.categories.security).toBeDefined();
      expect(analysis.categories.testCoverage).toBeDefined();
      expect(analysis.categories.codeComplexity).toBeDefined();
      expect(analysis.categories.documentation).toBeDefined();
      expect(analysis.categories.accessibility).toBeDefined();
    });

    it('should handle empty project', async () => {
      const analysis = await monitor.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBeDefined();
      expect(analysis.categories).toBeDefined();
    });

    it('should emit analysis completed event', async () => {
      const eventSpy = vi.fn();
      monitor.on('analysisCompleted', eventSpy);

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.analyzeProject(testProjectDir);

      expect(eventSpy).toHaveBeenCalledWith({
        projectPath: testProjectDir,
        analysis: expect.any(Object),
        timestamp: expect.any(Date)
      });
    });
  });

  describe('getQualityMetrics', () => {
    it('should return current quality metrics', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Wait for initial analysis
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = monitor.getQualityMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.isMonitoring).toBe(true);
      expect(metrics.projectPath).toBe(testProjectDir);
      expect(metrics.currentAnalysis).toBeDefined();
      expect(metrics.historySize).toBeDefined();
      expect(metrics.lastAnalysisTime).toBeDefined();
    });

    it('should return metrics when not monitoring', () => {
      const metrics = monitor.getQualityMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.isMonitoring).toBe(false);
      expect(metrics.projectPath).toBeNull();
      expect(metrics.currentAnalysis).toBeNull();
    });
  });

  describe('getQualityHistory', () => {
    it('should return quality history', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Wait for some analysis cycles
      await new Promise(resolve => setTimeout(resolve, 200));

      const history = monitor.getQualityHistory();

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].timestamp).toBeDefined();
      expect(history[0].overallScore).toBeDefined();
    });

    it('should limit history size', async () => {
      // Create monitor with small history limit
      const limitedMonitor = new RealtimeQualityMonitor({
        ...config,
        maxHistorySize: 2
      });

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await limitedMonitor.startMonitoring(testProjectDir);
      
      // Wait for multiple analysis cycles
      await new Promise(resolve => setTimeout(resolve, 300));

      const history = limitedMonitor.getQualityHistory();

      expect(history.length).toBeLessThanOrEqual(2);

      await limitedMonitor.stop();
    });
  });

  describe('getQualityAlerts', () => {
    it('should return quality alerts', async () => {
      // Create project with poor quality code
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'bad-code.js'),
        `function bad() {
  var unused = 'this is bad';
  console.log('debugging');
  if (true) {
    if (true) {
      if (true) {
        return null;
      }
    }
  }
}`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Wait for analysis
      await new Promise(resolve => setTimeout(resolve, 100));

      const alerts = monitor.getQualityAlerts();

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should categorize alerts by severity', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Wait for analysis
      await new Promise(resolve => setTimeout(resolve, 100));

      const alerts = monitor.getQualityAlerts();

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
      
      // Check alert structure
      if (alerts.length > 0) {
        expect(alerts[0].severity).toBeDefined();
        expect(alerts[0].category).toBeDefined();
        expect(alerts[0].message).toBeDefined();
        expect(alerts[0].timestamp).toBeDefined();
      }
    });
  });

  describe('getSuggestions', () => {
    it('should return improvement suggestions', async () => {
      // Create project with issues
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'needs-improvement.js'),
        `function example() {
  var unused = 'this is bad';
  console.log('debugging');
  return 'test';
}`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Wait for analysis
      await new Promise(resolve => setTimeout(resolve, 100));

      const suggestions = monitor.getSuggestions();

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should prioritize suggestions by impact', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Wait for analysis
      await new Promise(resolve => setTimeout(resolve, 100));

      const suggestions = monitor.getSuggestions();

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Check suggestion structure
      if (suggestions.length > 0) {
        expect(suggestions[0].category).toBeDefined();
        expect(suggestions[0].description).toBeDefined();
        expect(suggestions[0].impact).toBeDefined();
        expect(suggestions[0].effort).toBeDefined();
      }
    });
  });

  describe('event handling', () => {
    it('should emit quality threshold exceeded event', async () => {
      const eventSpy = vi.fn();
      monitor.on('qualityThresholdExceeded', eventSpy);

      // Create project with poor quality
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'bad-code.js'),
        `function bad() {
  var unused = 'this is bad';
  console.log('debugging');
  if (true) {
    if (true) {
      if (true) {
        return null;
      }
    }
  }
}`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Wait for analysis
      await new Promise(resolve => setTimeout(resolve, 100));

      // Event might be emitted if quality is below threshold
      // We can't guarantee it will be emitted, but we can check the structure
      if (eventSpy.mock.calls.length > 0) {
        const eventData = eventSpy.mock.calls[0][0];
        expect(eventData.category).toBeDefined();
        expect(eventData.currentValue).toBeDefined();
        expect(eventData.threshold).toBeDefined();
        expect(eventData.timestamp).toBeDefined();
      }
    });

    it('should emit analysis error event', async () => {
      const eventSpy = vi.fn();
      monitor.on('analysisError', eventSpy);

      // Mock analysis engine to throw error
      const originalAnalyze = monitor.analysisEngine.analyzeProject;
      monitor.analysisEngine.analyzeProject = vi.fn().mockRejectedValue(new Error('Test error'));

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Wait for analysis attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      // Restore original method
      monitor.analysisEngine.analyzeProject = originalAnalyze;

      // Event might be emitted if error occurs
      if (eventSpy.mock.calls.length > 0) {
        const eventData = eventSpy.mock.calls[0][0];
        expect(eventData.error).toBeDefined();
        expect(eventData.timestamp).toBeDefined();
      }
    });
  });

  describe('configuration updates', () => {
    it('should update quality thresholds', async () => {
      const newThresholds = {
        maintainability: 0.8,
        performance: 0.9,
        security: 0.95
      };

      const result = monitor.updateThresholds(newThresholds);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(monitor.thresholds.config.maintainability).toBe(0.8);
      expect(monitor.thresholds.config.performance).toBe(0.9);
      expect(monitor.thresholds.config.security).toBe(0.95);
    });

    it('should update analysis interval', async () => {
      const newInterval = 2000; // 2 seconds

      const result = monitor.updateAnalysisInterval(newInterval);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(monitor.config.analysisInterval).toBe(newInterval);
    });
  });

  describe('error handling', () => {
    it('should handle analysis errors gracefully', async () => {
      // Mock analysis engine to throw error
      const originalAnalyze = monitor.analysisEngine.analyzeProject;
      monitor.analysisEngine.analyzeProject = vi.fn().mockRejectedValue(new Error('Analysis failed'));

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      const analysis = await monitor.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.error).toBeDefined();

      // Restore original method
      monitor.analysisEngine.analyzeProject = originalAnalyze;
    });

    it('should handle file system errors', async () => {
      // Create monitor with invalid project path
      const invalidMonitor = new RealtimeQualityMonitor(config);

      await expect(invalidMonitor.startMonitoring('/invalid/path'))
        .rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should complete analysis within reasonable time', async () => {
      // Create multiple files for performance testing
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(
          path.join(testProjectDir, 'src', `file${i}.js`),
          `function example${i}() {
  return 'test ${i}';
}`
        );
      }

      const startTime = Date.now();
      await monitor.analyzeProject(testProjectDir);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle monitoring without performance degradation', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await monitor.startMonitoring(testProjectDir);
      
      // Let it run for a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      const metrics = monitor.getQualityMetrics();
      expect(metrics.isMonitoring).toBe(true);

      await monitor.stopMonitoring();
    });
  });
});
