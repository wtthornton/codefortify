/**
 * Tests for QualityAgent
 * Comprehensive test coverage for code quality analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QualityAgent } from '../../../src/agents/QualityAgent.js';

describe('QualityAgent', () => {
  let agent;
  let mockContext;

  beforeEach(() => {
    agent = new QualityAgent({
      enableESLint: true,
      enableComplexityAnalysis: true,
      enableDocumentationCheck: true,
      enableTypeScriptAnalysis: true
    });

    mockContext = {
      projectRoot: '/test/project'
    };

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(agent.agentType).toBe('quality');
      expect(agent.categoryName).toBe('Code Quality & Maintainability');
      expect(agent.maxScore).toBe(20);
      expect(agent.weight).toBe(0.25);
    });

    it('should initialize with custom config', () => {
      const customAgent = new QualityAgent({ enableESLint: false });
      expect(customAgent.config.enableESLint).toBe(false);
      expect(customAgent.config.enableComplexityAnalysis).toBe(true);
    });

    it('should initialize results structure', () => {
      expect(agent.results).toMatchObject({
        score: 0,
        maxScore: 20,
        issues: [],
        suggestions: [],
        details: {},
        analysisTime: 0
      });
    });
  });

  describe('execute', () => {
    it('should execute all analysis phases successfully', async () => {
      const result = await agent.execute(mockContext);

      expect(result).toHaveProperty('agent', 'quality');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('executionTime');
      expect(result.result.analysisTime).toBeGreaterThan(0);
    });

    it('should handle execution errors gracefully', async () => {
      vi.spyOn(agent, 'analyzeCodeQuality').mockRejectedValue(new Error('Analysis failed'));

      const result = await agent.execute(mockContext);

      expect(result).toHaveProperty('error');
    });

    it('should skip TypeScript analysis when disabled', async () => {
      agent.config.enableTypeScriptAnalysis = false;
      const spy = vi.spyOn(agent, 'analyzeTypeScriptAdoption');

      await agent.execute(mockContext);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('analyzeCodeQuality', () => {
    it('should analyze code quality with ESLint enabled', async () => {
      const mockESLintResults = {
        totalIssues: 10,
        errorCount: 5,
        warningCount: 5,
        fixableIssues: 3
      };

      vi.spyOn(agent, 'runESLintAnalysis').mockResolvedValue(mockESLintResults);

      await agent.analyzeCodeQuality(mockContext.projectRoot);

      expect(agent.results.details.codeQuality).toBeDefined();
      expect(agent.results.details.codeQuality.eslintScore).toBeGreaterThan(0);
      expect(agent.results.details.codeQuality.issueCount).toBe(10);
    });

    it('should handle ESLint analysis failures', async () => {
      vi.spyOn(agent, 'runESLintAnalysis').mockRejectedValue(new Error('ESLint failed'));

      await agent.analyzeCodeQuality(mockContext.projectRoot);

      expect(agent.results.issues).toHaveLength(1);
      expect(agent.results.issues[0].type).toBe('eslint-error');
    });

    it('should skip ESLint when disabled', async () => {
      agent.config.enableESLint = false;
      const spy = vi.spyOn(agent, 'runESLintAnalysis');

      await agent.analyzeCodeQuality(mockContext.projectRoot);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('analyzeDocumentation', () => {
    it('should analyze JSDoc coverage', async () => {
      vi.spyOn(agent, 'getJavaScriptFiles').mockResolvedValue(['/test/file.js']);
      vi.spyOn(agent, 'calculateJSDocCoverage').mockReturnValue(0.8);
      vi.spyOn(agent, 'analyzeCommentQuality').mockReturnValue(0.7);
      vi.spyOn(agent, 'checkFileExists').mockResolvedValue(true);

      await agent.analyzeDocumentation(mockContext.projectRoot);

      expect(agent.results.details.documentation).toBeDefined();
      expect(agent.results.details.documentation.jsDocCoverage).toBe(0.8);
      expect(agent.results.details.documentation.commentQuality).toBe(0.7);
      expect(agent.results.details.documentation.readmeQuality).toBe(2);
    });

    it('should handle documentation analysis failures', async () => {
      vi.spyOn(agent, 'getJavaScriptFiles').mockRejectedValue(new Error('File access failed'));

      await agent.analyzeDocumentation(mockContext.projectRoot);

      expect(agent.results.issues).toHaveLength(1);
      expect(agent.results.issues[0].type).toBe('documentation-error');
    });
  });

  describe('analyzeComplexity', () => {
    it('should analyze code complexity', async () => {
      const mockComplexityResults = {
        average: 3.5,
        highComplexity: 2
      };

      vi.spyOn(agent, 'getJavaScriptFiles').mockResolvedValue(['/test/file.js']);
      vi.spyOn(agent, 'calculateComplexity').mockResolvedValue(mockComplexityResults);

      await agent.analyzeComplexity(mockContext.projectRoot);

      expect(agent.results.details.complexity).toBeDefined();
      expect(agent.results.details.complexity.averageComplexity).toBe(3.5);
      expect(agent.results.details.complexity.highComplexityFiles).toBe(2);
    });

    it('should handle complexity analysis failures', async () => {
      vi.spyOn(agent, 'getJavaScriptFiles').mockRejectedValue(new Error('Complexity failed'));

      await agent.analyzeComplexity(mockContext.projectRoot);

      expect(agent.results.issues).toHaveLength(1);
      expect(agent.results.issues[0].type).toBe('complexity-error');
    });
  });

  describe('analyzeTypeScriptAdoption', () => {
    it('should analyze TypeScript adoption', async () => {
      vi.spyOn(agent, 'checkFileExists').mockResolvedValue(true);
      vi.spyOn(agent, 'getTypeScriptFiles').mockResolvedValue(['/test/file.ts', '/test/other.ts']);
      vi.spyOn(agent, 'getJavaScriptFiles').mockResolvedValue(['/test/file.js']);
      vi.spyOn(agent, 'analyzeTypesCoverage').mockResolvedValue(0.9);

      await agent.analyzeTypeScriptAdoption(mockContext.projectRoot);

      expect(agent.results.details.typescript).toBeDefined();
      expect(agent.results.details.typescript.configurationQuality).toBe(1);
      expect(agent.results.details.typescript.adoption).toBeCloseTo(0.67, 2);
      expect(agent.results.details.typescript.typesCoverage).toBe(0.9);
    });

    it('should handle no TypeScript files', async () => {
      vi.spyOn(agent, 'checkFileExists').mockResolvedValue(false);
      vi.spyOn(agent, 'getTypeScriptFiles').mockResolvedValue([]);
      vi.spyOn(agent, 'getJavaScriptFiles').mockResolvedValue(['/test/file.js']);

      await agent.analyzeTypeScriptAdoption(mockContext.projectRoot);

      expect(agent.results.details.typescript.adoption).toBe(0);
      expect(agent.results.details.typescript.configurationQuality).toBe(0);
    });
  });

  describe('calculateFinalScore', () => {
    it('should calculate final score and grade', () => {
      agent.score = 16; // Mock accumulated score

      agent.calculateFinalScore();

      expect(agent.results.score).toBe(16);
      expect(agent.results.percentage).toBe(80);
      expect(agent.results.grade).toBe('B-');
    });

    it('should add ESLint suggestion for low scores', () => {
      agent.results.details.codeQuality = { eslintScore: 3 };

      agent.calculateFinalScore();

      expect(agent.results.suggestions).toHaveLength(1);
      expect(agent.results.suggestions[0].type).toBe('eslint');
      expect(agent.results.suggestions[0].priority).toBe('high');
    });

    it('should add documentation suggestion for low coverage', () => {
      agent.results.details.documentation = { jsDocCoverage: 0.3 };

      agent.calculateFinalScore();

      expect(agent.results.suggestions).toHaveLength(1);
      expect(agent.results.suggestions[0].type).toBe('documentation');
      expect(agent.results.suggestions[0].priority).toBe('medium');
    });
  });

  describe('calculateESLintScore', () => {
    it('should return maximum score for no issues', () => {
      const result = agent.calculateESLintScore({ totalIssues: 0 });
      expect(result).toBe(8);
    });

    it('should calculate score based on issue count', () => {
      const result = agent.calculateESLintScore({ totalIssues: 100 });
      expect(result).toBe(7);
    });

    it('should not exceed maximum score', () => {
      const result = agent.calculateESLintScore({ totalIssues: -10 });
      expect(result).toBe(8);
    });

    it('should handle null results', () => {
      const result = agent.calculateESLintScore(null);
      expect(result).toBe(8);
    });
  });

  describe('helper methods', () => {
    it('should get JavaScript files', async () => {
      const files = await agent.getJavaScriptFiles('/test');
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should get TypeScript files', async () => {
      const files = await agent.getTypeScriptFiles('/test');
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should check file existence', async () => {
      const exists = await agent.checkFileExists('/test/file.js');
      expect(typeof exists).toBe('boolean');
    });

    it('should calculate JSDoc coverage', () => {
      const coverage = agent.calculateJSDocCoverage(['/test/file.js']);
      expect(typeof coverage).toBe('number');
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(1);
    });

    it('should analyze comment quality', () => {
      const quality = agent.analyzeCommentQuality(['/test/file.js']);
      expect(typeof quality).toBe('number');
      expect(quality).toBeGreaterThanOrEqual(0);
      expect(quality).toBeLessThanOrEqual(1);
    });
  });
});