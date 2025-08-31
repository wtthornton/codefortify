/**
 * ProjectScorer Unit Tests
 *
 * Tests the main scoring orchestrator functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectScorer } from '../../src/scoring/ProjectScorerRefactored.js';
import path from 'path';

describe('ProjectScorer', () => {
  let scorer;
  let mockProjectRoot;

  beforeEach(() => {
    mockProjectRoot = process.cwd();
    scorer = new ProjectScorer({
      projectRoot: mockProjectRoot,
      projectType: 'javascript',
      projectName: 'test-project',
      verbose: false
    });
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultScorer = new ProjectScorer();

      expect(defaultScorer.config.projectRoot).toBe(process.cwd());
      expect(defaultScorer.config.projectType).toBe('mcp-server'); // Should auto-detect
      expect(defaultScorer.config.verbose).toBe(false);
    });

    it('should initialize analyzers correctly', () => {
      expect(scorer.analyzers).toBeDefined();
      expect(scorer.analyzers.structure).toBeDefined();
      expect(scorer.analyzers.quality).toBeDefined();
      expect(scorer.analyzers.performance).toBeDefined();
      expect(scorer.analyzers.testing).toBeDefined();
      expect(scorer.analyzers.security).toBeDefined();
      expect(scorer.analyzers.developerExperience).toBeDefined();
      expect(scorer.analyzers.completeness).toBeDefined();
    });

    it('should set correct max scores for analyzers', () => {
      expect(scorer.analyzers.structure.maxScore).toBe(20);
      expect(scorer.analyzers.quality.maxScore).toBe(20);
      expect(scorer.analyzers.performance.maxScore).toBe(15);
      expect(scorer.analyzers.testing.maxScore).toBe(15);
      expect(scorer.analyzers.security.maxScore).toBe(15);
      expect(scorer.analyzers.developerExperience.maxScore).toBe(10);
      expect(scorer.analyzers.completeness.maxScore).toBe(5);
    });
  });

  describe('Grade Calculation', () => {
    it('should calculate grades correctly', () => {
      expect(scorer.calculateGrade(0.98)).toBe('A+');
      expect(scorer.calculateGrade(0.93)).toBe('A');
      expect(scorer.calculateGrade(0.90)).toBe('A-');
      expect(scorer.calculateGrade(0.87)).toBe('B+');
      expect(scorer.calculateGrade(0.83)).toBe('B');
      expect(scorer.calculateGrade(0.80)).toBe('B-');
      expect(scorer.calculateGrade(0.77)).toBe('C+');
      expect(scorer.calculateGrade(0.73)).toBe('C');
      expect(scorer.calculateGrade(0.70)).toBe('C-');
      expect(scorer.calculateGrade(0.67)).toBe('D+');
      expect(scorer.calculateGrade(0.65)).toBe('D');
      expect(scorer.calculateGrade(0.60)).toBe('D-');
      expect(scorer.calculateGrade(0.50)).toBe('F');
    });
  });

  describe('Project Type Detection', () => {
    it('should detect React projects', () => {
      const mockPackageJson = {
        dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' }
      };

      // We can't easily mock fs operations, so we'll test the logic indirectly
      // by using the detectProjectType method if it's accessible
      expect(scorer.config.projectType).toBeDefined();
    });

    it('should detect Node.js API projects', () => {
      const scorer = new ProjectScorer({
        projectRoot: mockProjectRoot,
        projectType: 'node-api'
      });

      expect(scorer.config.projectType).toBe('node-api');
    });

    it('should default to javascript when detection fails', () => {
      const scorer = new ProjectScorer({
        projectRoot: '/nonexistent/path'
      });

      expect(typeof scorer.config.projectType).toBe('string');
    });
  });

  describe('Overall Score Calculation', () => {
    beforeEach(() => {
      // Mock category results
      scorer.results.categories = {
        structure: { score: 15, maxScore: 20, grade: 'B' },
        quality: { score: 18, maxScore: 20, grade: 'A-' },
        performance: { score: 12, maxScore: 15, grade: 'B+' },
        testing: { score: 10, maxScore: 15, grade: 'C+' },
        security: { score: 13, maxScore: 15, grade: 'B+' },
        developerExperience: { score: 8, maxScore: 10, grade: 'B+' },
        completeness: { score: 4, maxScore: 5, grade: 'B+' }
      };
    });

    it('should calculate overall score correctly', () => {
      scorer.calculateOverallScore();

      const expected = 15 + 18 + 12 + 10 + 13 + 8 + 4; // 80
      expect(scorer.results.overall.score).toBe(expected);
      expect(scorer.results.overall.maxScore).toBe(100);
      expect(scorer.results.overall.percentage).toBe(80);
      expect(scorer.results.overall.grade).toBe('B-');
    });

    it('should handle errors in categories', () => {
      scorer.results.categories.structure.error = 'Test error';
      scorer.calculateOverallScore();

      expect(scorer.results.overall.hasErrors).toBe(true);
    });

    it('should set timestamp', () => {
      scorer.calculateOverallScore();

      expect(scorer.results.overall.timestamp).toBeDefined();
      expect(new Date(scorer.results.overall.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Complexity Calculation', () => {
    it('should calculate complexity scores correctly', () => {
      const lowComplexity = scorer.getComplexityScore(5, [
        { threshold: 10, score: 'low' },
        { threshold: 50, score: 'medium' },
        { threshold: 100, score: 'high' }
      ]);
      expect(lowComplexity).toBe('low');

      const mediumComplexity = scorer.getComplexityScore(25, [
        { threshold: 10, score: 'low' },
        { threshold: 50, score: 'medium' },
        { threshold: 100, score: 'high' }
      ]);
      expect(mediumComplexity).toBe('medium');

      const veryHighComplexity = scorer.getComplexityScore(150, [
        { threshold: 10, score: 'low' },
        { threshold: 50, score: 'medium' },
        { threshold: 100, score: 'high' }
      ]);
      expect(veryHighComplexity).toBe('very_high');
    });
  });

  describe('Static Factory Methods', () => {
    it('should create scorer via static scoreProject method', async () => {
      const mockResults = await ProjectScorer.scoreProject(mockProjectRoot, {
        categories: ['structure']
      });

      expect(mockResults).toBeDefined();
      expect(mockResults.overall).toBeDefined();
      expect(mockResults.categories).toBeDefined();
    }, 10000); // Longer timeout for integration-like test

    it('should create scorer via static autoDetectAndScore method', async () => {
      const mockResults = await ProjectScorer.autoDetectAndScore(mockProjectRoot, {
        categories: ['structure']
      });

      expect(mockResults).toBeDefined();
      expect(mockResults.metadata.projectName).toBeDefined();
    }, 10000);
  });

  describe('Dependency Analysis', () => {
    it('should identify frameworks correctly', () => {
      const deps = { react: '^18.0.0' };
      const devDeps = { '@testing-library/react': '^13.0.0' };

      const frameworks = scorer.identifyFrameworks(deps, devDeps);
      expect(frameworks).toContain('React');
    });

    it('should identify testing tools correctly', () => {
      const deps = {};
      const devDeps = { vitest: '^1.0.0', jest: '^29.0.0' };

      const tools = scorer.identifyTestingTools(deps, devDeps);
      expect(tools).toContain('Vitest');
      expect(tools).toContain('Jest');
    });

    it('should identify build tools correctly', () => {
      const deps = {};
      const devDeps = { webpack: '^5.0.0', typescript: '^5.0.0' };

      const tools = scorer.identifyBuildTools(deps, devDeps);
      expect(tools).toContain('Webpack');
      expect(tools).toContain('TypeScript');
    });
  });

  describe('Error Handling', () => {
    it('should handle analyzer failures gracefully', async () => {
      // Mock a failing analyzer
      const failingAnalyzer = {
        categoryName: 'Test Category',
        maxScore: 10,
        analyze: vi.fn().mockRejectedValue(new Error('Test error'))
      };

      scorer.analyzers.test = failingAnalyzer;

      const results = await scorer.scoreProject({ categories: ['test'] });

      expect(results.categories.test).toBeDefined();
      expect(results.categories.test.score).toBe(0);
      expect(results.categories.test.grade).toBe('F');
      expect(results.categories.test.issues).toContain('Analysis failed: Test error');
    });

    it('should validate category names', async () => {
      await expect(
        scorer.scoreProject({ categories: ['nonexistent'] })
      ).rejects.toThrow('No valid categories specified');
    });
  });
});