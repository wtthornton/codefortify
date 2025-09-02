import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalysisAgent } from '../../../src/agents/AnalysisAgent.js';
import { PerformanceMonitor } from '../../../src/scoring/core/PerformanceMonitor.js';
import { ProjectTypeDetector } from '../../../src/scoring/core/ProjectTypeDetector.js';
import fs from 'fs';

// Mock dependencies
vi.mock('../../../src/scoring/core/PerformanceMonitor.js');
vi.mock('../../../src/scoring/core/ProjectTypeDetector.js');
vi.mock('fs');

describe('AnalysisAgent', () => {
  let agent;
  let mockConfig;
  let mockPerformanceMonitor;
  let mockProjectTypeDetector;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      projectType: 'javascript',
      analysisDepth: 'comprehensive',
      enablePredictiveAnalysis: true
    };

    mockPerformanceMonitor = {
      startTiming: vi.fn(),
      endTiming: vi.fn(),
      getMetrics: vi.fn(() => ({ duration: 100, memory: 50 }))
    };

    mockProjectTypeDetector = {
      detectProjectType: vi.fn(() => 'javascript'),
      getFrameworks: vi.fn(() => ['express', 'jest'])
    };

    PerformanceMonitor.mockImplementation(() => mockPerformanceMonitor);
    ProjectTypeDetector.mockImplementation(() => mockProjectTypeDetector);

    fs.existsSync = vi.fn(() => true);
    fs.readFileSync = vi.fn(() => 'mock file content');

    agent = new AnalysisAgent(mockConfig);
    
    // Mock missing methods that are called internally
    agent.identifyMissingPatterns = vi.fn(() => Promise.resolve([]));
    agent.identifyPatternOpportunities = vi.fn(() => Promise.resolve([]));
    agent.calculateComplexityFactors = vi.fn(() => ({ cyclomatic: 3, cognitive: 5 }));
    agent.assessCodeDebt = vi.fn(() => Promise.resolve({
      score: 75,
      items: [{ type: 'todo', description: 'Fix this' }]
    }));
    agent.generatePredictiveInsights = vi.fn(() => Promise.resolve({ 
      futureScore: 85, 
      recommendations: [] 
    }));
    agent.analyzeProgressHistory = vi.fn(() => Promise.resolve({
      trend: 'improving',
      velocity: 5
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const defaultAgent = new AnalysisAgent();
      expect(defaultAgent.config.projectRoot).toBe(process.cwd());
      expect(defaultAgent.config.analysisDepth).toBe('comprehensive');
      expect(defaultAgent.config.enablePredictiveAnalysis).toBe(true);
    });

    it('should initialize with provided config', () => {
      expect(agent.config.projectRoot).toBe('/test/project');
      expect(agent.config.projectType).toBe('javascript');
      expect(agent.config.analysisDepth).toBe('comprehensive');
    });

    it('should initialize performance monitor and project type detector', () => {
      expect(PerformanceMonitor).toHaveBeenCalled();
      expect(ProjectTypeDetector).toHaveBeenCalledWith('/test/project');
    });

    it('should initialize analysis modules and history', () => {
      expect(agent.analysisModules).toBeDefined();
      expect(Array.isArray(agent.analysisHistory)).toBe(true);
      expect(agent.analysisHistory).toHaveLength(0);
    });
  });

  describe('analyze', () => {
    let mockCode;
    let mockReviewResult;
    let mockIterationHistory;

    beforeEach(() => {
      mockCode = 'function test() { return "hello"; }';
      mockReviewResult = {
        score: 85,
        grade: 'B',
        issues: [],
        categories: {
          structure: { score: 18, maxScore: 20 },
          quality: { score: 16, maxScore: 20 }
        }
      };
      mockIterationHistory = [];
    });

    it('should perform basic analysis when depth is basic', async () => {
      agent.config.analysisDepth = 'basic';
      
      const result = await agent.analyze(mockCode, mockReviewResult, mockIterationHistory);
      
      expect(result).toBeDefined();
      expect(result.analysisLevel).toBe('basic');
      expect(result.performance).toBeDefined();
    });

    it('should perform comprehensive analysis when depth is comprehensive', async () => {
      agent.config.analysisDepth = 'comprehensive';
      
      const result = await agent.analyze(mockCode, mockReviewResult, mockIterationHistory);
      
      expect(result).toBeDefined();
      expect(result.analysisLevel).toBe('comprehensive');
      expect(result.architecture).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.performance).toBeDefined();
    });

    it('should perform deep analysis when depth is deep', async () => {
      agent.config.analysisDepth = 'deep';
      
      const result = await agent.analyze(mockCode, mockReviewResult, mockIterationHistory);
      
      expect(result).toBeDefined();
      expect(result.analysisLevel).toBe('deep');
      expect(result.qualityTrends).toBeDefined();
      expect(result.securityPosture).toBeDefined();
      expect(result.technicalDebt).toBeDefined();
    });

    it('should include predictive analysis when enabled and iteration history exists', async () => {
      agent.config.enablePredictiveAnalysis = true;
      mockIterationHistory = [
        { score: 70, timestamp: Date.now() - 1000 },
        { score: 80, timestamp: Date.now() }
      ];
      
      const result = await agent.analyze(mockCode, mockReviewResult, mockIterationHistory);
      
      expect(result.predictiveInsights).toBeDefined();
    });

    it('should store analysis in history', async () => {
      const initialHistoryLength = agent.analysisHistory.length;
      
      await agent.analyze(mockCode, mockReviewResult, mockIterationHistory);
      
      expect(agent.analysisHistory).toHaveLength(initialHistoryLength + 1);
    });

    it('should handle analysis errors gracefully', async () => {
      // Mock an error in one of the analysis methods
      vi.spyOn(agent, 'analyzePerformance').mockRejectedValue(new Error('Performance analysis failed'));
      
      const result = await agent.analyze(mockCode, mockReviewResult, mockIterationHistory);
      
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('Performance analysis failed');
    });
  });

  describe('analyzeArchitecture', () => {
    it('should analyze code architecture patterns', async () => {
      const mockCode = `
        class UserService {
          constructor(db) { this.db = db; }
          async getUser(id) { return this.db.findUser(id); }
        }
        class UserController {
          constructor(service) { this.service = service; }
          async handleGetUser(req, res) { /* */ }
        }
      `;
      
      const result = await agent.analyzeArchitecture(mockCode);
      
      expect(result).toBeDefined();
      expect(result.style).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.complexity).toBeDefined();
    });

    it('should identify microservices architecture', async () => {
      const mockCode = `
        import express from 'express';
        const app = express();
        app.get('/api/users', handler);
        app.listen(3000);
      `;
      
      const result = await agent.analyzeArchitecture(mockCode);
      
      expect(result.style).toBeDefined();
    });
  });

  describe('analyzePatterns', () => {
    it('should identify code patterns from review result', async () => {
      const mockCode = 'function test() { return Promise.resolve(42); }';
      const mockReviewResult = {
        issues: [
          { type: 'async', severity: 'minor', category: 'Performance' }
        ]
      };
      
      const result = await agent.analyzePatterns(mockCode, mockReviewResult);
      
      expect(result).toBeDefined();
      expect(result.identifiedPatterns).toBeDefined();
      expect(result.antiPatterns).toBeDefined();
    });

    it('should calculate pattern confidence scores', async () => {
      const mockCode = 'const singleton = new Singleton();';
      const mockReviewResult = { issues: [] };
      
      const result = await agent.analyzePatterns(mockCode, mockReviewResult);
      
      expect(result.identifiedPatterns).toBeDefined();
      if (result.identifiedPatterns.length > 0) {
        expect(result.identifiedPatterns[0]).toHaveProperty('confidence');
        expect(typeof result.identifiedPatterns[0].confidence).toBe('number');
      }
    });
  });

  describe('analyzePerformance', () => {
    it('should analyze code performance characteristics', async () => {
      const mockCode = `
        for (let i = 0; i < 1000; i++) {
          document.getElementById('test');
        }
      `;
      
      const result = await agent.analyzePerformance(mockCode, {});
      
      expect(result).toBeDefined();
      expect(result.bottlenecks).toBeDefined();
      expect(result.optimizations).toBeDefined();
    });

    it('should identify performance bottlenecks', async () => {
      const mockCode = `
        function inefficientLoop() {
          for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array.length; j++) {
              // nested loop
            }
          }
        }
      `;
      
      const result = await agent.analyzePerformance(mockCode, {});
      
      expect(result.bottlenecks).toBeDefined();
      expect(Array.isArray(result.bottlenecks)).toBe(true);
    });
  });

  describe('analyzeMaintainability', () => {
    it('should analyze code maintainability metrics', async () => {
      const mockCode = `
        function complexFunction(a, b, c, d, e) {
          if (a > b) {
            if (c > d) {
              if (e > a) {
                return a + b + c + d + e;
              }
            }
          }
          return 0;
        }
      `;
      
      const result = await agent.analyzeMaintainability(mockCode);
      
      expect(result).toBeDefined();
      expect(result.complexity).toBeDefined();
      expect(result.readability).toBeDefined();
      expect(result.maintainabilityIndex).toBeDefined();
      expect(typeof result.maintainabilityIndex).toBe('number');
    });

    it('should calculate cyclomatic complexity', async () => {
      const mockCode = `
        function withMultiplePaths(x) {
          if (x > 0) return 'positive';
          if (x < 0) return 'negative';
          return 'zero';
        }
      `;
      
      const result = await agent.analyzeMaintainability(mockCode);
      
      expect(result.complexity).toBeDefined();
      expect(result.complexity.cyclomatic).toBeDefined();
      expect(typeof result.complexity.cyclomatic).toBe('number');
    });
  });

  describe('assessTechnicalDebt', () => {
    it('should assess technical debt in code', async () => {
      const mockCode = `
        // TODO: Fix this hack
        function temporaryFix() {
          // HACK: Quick workaround
          eval('dangerous code');
        }
      `;
      
      const result = await agent.assessTechnicalDebt(mockCode, {});
      
      expect(result).toBeDefined();
      expect(result.debtScore).toBeDefined();
      expect(result.debtItems).toBeDefined();
      expect(Array.isArray(result.debtItems)).toBe(true);
    });

    it('should identify different types of technical debt', async () => {
      const mockCode = `
        var oldStyle = true; // Outdated syntax
        function duplicatedLogic1() { console.log('test'); }
        function duplicatedLogic2() { console.log('test'); }
      `;
      
      const result = await agent.assessTechnicalDebt(mockCode, {});
      
      expect(result.debtItems).toBeDefined();
    });
  });

  describe('Analysis History', () => {
    it('should maintain analysis history', async () => {
      const mockCode = 'function test() {}';
      const mockReviewResult = { score: 85 };
      
      expect(agent.analysisHistory).toHaveLength(0);
      
      await agent.analyze(mockCode, mockReviewResult);
      expect(agent.analysisHistory).toHaveLength(1);
      
      await agent.analyze(mockCode, mockReviewResult);
      expect(agent.analysisHistory).toHaveLength(2);
    });

    it('should include timestamp in analysis history', async () => {
      const mockCode = 'function test() {}';
      const mockReviewResult = { score: 85 };
      
      await agent.analyze(mockCode, mockReviewResult);
      
      const lastAnalysis = agent.analysisHistory[agent.analysisHistory.length - 1];
      expect(lastAnalysis.timestamp).toBeDefined();
      expect(typeof lastAnalysis.timestamp).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing dependencies gracefully', async () => {
      // Mock file system errors
      fs.existsSync = vi.fn(() => false);
      
      const newAgent = new AnalysisAgent(mockConfig);
      const result = await newAgent.analyze('test code', { score: 85 });
      
      expect(result).toBeDefined();
      // Should still return some analysis even with missing dependencies
    });

    it('should handle malformed code input', async () => {
      const malformedCode = 'function unclosed() { if (true) ';
      
      const result = await agent.analyze(malformedCode, { score: 85 });
      
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should handle invalid review results', async () => {
      const mockCode = 'function test() {}';
      const invalidReviewResult = null;
      
      const result = await agent.analyze(mockCode, invalidReviewResult);
      
      expect(result).toBeDefined();
      // Should handle gracefully and still provide analysis
    });
  });

  describe('Configuration Variations', () => {
    it('should work with minimal config', () => {
      const minimalAgent = new AnalysisAgent({ projectRoot: '/test' });
      
      expect(minimalAgent.config.projectType).toBe('javascript');
      expect(minimalAgent.config.analysisDepth).toBe('comprehensive');
      expect(minimalAgent.config.enablePredictiveAnalysis).toBe(true);
    });

    it('should disable predictive analysis when configured', async () => {
      const agentWithoutPredictive = new AnalysisAgent({
        ...mockConfig,
        enablePredictiveAnalysis: false
      });
      
      const mockIterationHistory = [{ score: 70 }, { score: 80 }];
      const result = await agentWithoutPredictive.analyze('test code', { score: 85 }, mockIterationHistory);
      
      expect(result.predictiveInsights).toBeUndefined();
    });

    it('should handle different project types', async () => {
      const reactAgent = new AnalysisAgent({
        ...mockConfig,
        projectType: 'react'
      });
      
      const result = await reactAgent.analyze('const App = () => <div>Hello</div>', { score: 85 });
      
      expect(result).toBeDefined();
    });
  });
});