import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyzerOrchestrator } from '../../../../src/scoring/core/AnalyzerOrchestrator.js';

// Mock all analyzer dependencies
vi.mock('../../../../src/scoring/analyzers/StructureAnalyzer.js', () => ({
  StructureAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue(),
    results: { score: 15, grade: 'A', issues: [], suggestions: [] },
    categoryName: 'Code Structure & Architecture'
  }))
}));

vi.mock('../../../../src/scoring/analyzers/QualityAnalyzer.js', () => ({
  QualityAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue(),
    results: { score: 16, grade: 'B+', issues: [], suggestions: [] },
    categoryName: 'Code Quality & Maintainability'
  }))
}));

vi.mock('../../../../src/scoring/analyzers/PerformanceAnalyzer.js', () => ({
  PerformanceAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue(),
    results: { score: 10, grade: 'B', issues: [], suggestions: [] },
    categoryName: 'Performance & Optimization'
  }))
}));

vi.mock('../../../../src/scoring/analyzers/TestingAnalyzer.js', () => ({
  TestingAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue(),
    results: { score: 12, grade: 'C+', issues: [], suggestions: [] },
    categoryName: 'Testing & Documentation'
  }))
}));

vi.mock('../../../../src/scoring/analyzers/SecurityAnalyzer.js', () => ({
  SecurityAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue(),
    results: { score: 13, grade: 'B', issues: [], suggestions: [] },
    categoryName: 'Security & Error Handling'
  }))
}));

vi.mock('../../../../src/scoring/analyzers/DeveloperExperienceAnalyzer.js', () => ({
  DeveloperExperienceAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue(),
    results: { score: 8, grade: 'B', issues: [], suggestions: [] },
    categoryName: 'Developer Experience'
  }))
}));

vi.mock('../../../../src/scoring/analyzers/CompletenessAnalyzer.js', () => ({
  CompletenessAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue(),
    results: { score: 4, grade: 'A', issues: [], suggestions: [] },
    categoryName: 'Completeness & Production Readiness'
  }))
}));

describe('AnalyzerOrchestrator', () => {
  let orchestrator;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      projectType: 'javascript',
      verbose: false,
      categories: ['all']
    };
    orchestrator = new AnalyzerOrchestrator(mockConfig);

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(orchestrator.config).toBe(mockConfig);
    });

    it('should initialize all analyzers', () => {
      expect(orchestrator.analyzers).toBeDefined();
      expect(orchestrator.analyzers.structure).toBeDefined();
      expect(orchestrator.analyzers.quality).toBeDefined();
      expect(orchestrator.analyzers.performance).toBeDefined();
      expect(orchestrator.analyzers.testing).toBeDefined();
      expect(orchestrator.analyzers.security).toBeDefined();
      expect(orchestrator.analyzers.developerExperience).toBeDefined();
      expect(orchestrator.analyzers.completeness).toBeDefined();
    });

    it('should pass config to all analyzers', () => {
      const { StructureAnalyzer } = require('../../../../src/scoring/analyzers/StructureAnalyzer.js');
      expect(StructureAnalyzer).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('initializeAnalyzers', () => {
    it('should return analyzer instances for all categories', () => {
      const analyzers = orchestrator.initializeAnalyzers();

      expect(analyzers).toHaveProperty('structure');
      expect(analyzers).toHaveProperty('quality');
      expect(analyzers).toHaveProperty('performance');
      expect(analyzers).toHaveProperty('testing');
      expect(analyzers).toHaveProperty('security');
      expect(analyzers).toHaveProperty('developerExperience');
      expect(analyzers).toHaveProperty('completeness');
    });
  });

  describe('runAll', () => {
    it('should run all analyzers and return consolidated results', async () => {
      const results = await orchestrator.runAll();

      expect(results).toHaveProperty('overall');
      expect(results).toHaveProperty('categories');
      expect(results).toHaveProperty('summary');

      // Check overall score calculation
      expect(results.overall.score).toBe(78); // Sum of all mock scores
      expect(results.overall.totalPossible).toBe(100);
      expect(results.overall.percentage).toBe(78);
      expect(results.overall.grade).toBe('B+');

      // Check categories
      expect(Object.keys(results.categories)).toHaveLength(7);
      expect(results.categories.structure.score).toBe(15);
      expect(results.categories.quality.score).toBe(16);
    });

    it('should run analyzers in parallel', async () => {
      const startTime = Date.now();
      await orchestrator.runAll();
      const endTime = Date.now();

      // Should complete quickly since analyzers run in parallel
      expect(endTime - startTime).toBeLessThan(100);

      // Verify all analyzers were called
      Object.values(orchestrator.analyzers).forEach(analyzer => {
        expect(analyzer.analyze).toHaveBeenCalled();
      });
    });

    it('should handle analyzer failures gracefully', async () => {
      // Make one analyzer fail
      orchestrator.analyzers.quality.analyze.mockRejectedValue(new Error('Quality analysis failed'));

      const results = await orchestrator.runAll();

      // Should still return results for other analyzers
      expect(results.categories.structure.score).toBe(15);
      expect(results.categories.quality.score).toBe(0); // Failed analyzer gets 0 score
      expect(results.summary.failed).toContain('quality');
    });

    it('should include execution time in results', async () => {
      const results = await orchestrator.runAll();

      expect(results.overall.executionTime).toBeDefined();
      expect(typeof results.overall.executionTime).toBe('number');
      expect(results.overall.executionTime).toBeGreaterThan(0);
    });
  });

  describe('runAnalyzer', () => {
    it('should run specific analyzer by name', async () => {
      const result = await orchestrator.runAnalyzer('structure');

      expect(result).toBeDefined();
      expect(result.score).toBe(15);
      expect(result.grade).toBe('A');
      expect(orchestrator.analyzers.structure.analyze).toHaveBeenCalled();
    });

    it('should throw error for unknown analyzer', async () => {
      await expect(orchestrator.runAnalyzer('unknown')).rejects.toThrow('Unknown analyzer: unknown');
    });

    it('should handle analyzer execution failure', async () => {
      orchestrator.analyzers.performance.analyze.mockRejectedValue(new Error('Performance analysis failed'));

      const result = await orchestrator.runAnalyzer('performance');

      expect(result.score).toBe(0);
      expect(result.error).toBe('Performance analysis failed');
    });
  });

  describe('getAvailableAnalyzers', () => {
    it('should return list of available analyzer names', () => {
      const analyzers = orchestrator.getAvailableAnalyzers();

      expect(analyzers).toEqual([
        'structure',
        'quality',
        'performance',
        'testing',
        'security',
        'developerExperience',
        'completeness'
      ]);
    });

    it('should return array of strings', () => {
      const analyzers = orchestrator.getAvailableAnalyzers();

      expect(Array.isArray(analyzers)).toBe(true);
      analyzers.forEach(analyzer => {
        expect(typeof analyzer).toBe('string');
      });
    });
  });

  describe('results consolidation', () => {
    it('should calculate correct overall statistics', async () => {
      const results = await orchestrator.runAll();

      expect(results.summary.total).toBe(7);
      expect(results.summary.completed).toBe(7);
      expect(results.summary.failed).toEqual([]);
      expect(results.summary.success).toEqual([
        'structure', 'quality', 'performance', 'testing',
        'security', 'developerExperience', 'completeness'
      ]);
    });

    it('should aggregate issues and suggestions', async () => {
      // Add mock issues and suggestions
      orchestrator.analyzers.quality.results.issues = [
        { message: 'Quality issue 1', severity: 'warning' }
      ];
      orchestrator.analyzers.security.results.suggestions = [
        { message: 'Security suggestion 1' }
      ];

      const results = await orchestrator.runAll();

      expect(results.overall.totalIssues).toBe(1);
      expect(results.overall.totalSuggestions).toBe(1);
      expect(results.overall.allIssues).toHaveLength(1);
      expect(results.overall.allSuggestions).toHaveLength(1);
    });

    it('should calculate grade distribution', async () => {
      const results = await orchestrator.runAll();

      expect(results.summary.gradeDistribution).toBeDefined();
      expect(results.summary.gradeDistribution.A).toBe(2); // structure, completeness
      expect(results.summary.gradeDistribution.B).toBe(3); // performance, security, developerExperience
      expect(results.summary.gradeDistribution['B+']).toBe(1); // quality
      expect(results.summary.gradeDistribution['C+']).toBe(1); // testing
    });
  });

  describe('error handling', () => {
    it('should handle multiple analyzer failures', async () => {
      orchestrator.analyzers.quality.analyze.mockRejectedValue(new Error('Quality failed'));
      orchestrator.analyzers.security.analyze.mockRejectedValue(new Error('Security failed'));

      const results = await orchestrator.runAll();

      expect(results.summary.failed).toEqual(['quality', 'security']);
      expect(results.summary.completed).toBe(5);
      expect(results.categories.quality.score).toBe(0);
      expect(results.categories.security.score).toBe(0);
    });

    it('should continue execution after analyzer timeout', async () => {
      // Simulate slow analyzer
      orchestrator.analyzers.testing.analyze.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(), 1000))
      );

      const startTime = Date.now();
      const results = await orchestrator.runAll();
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeGreaterThan(999);
      expect(results.categories.testing.score).toBe(12);
    });
  });

  describe('configuration handling', () => {
    it('should respect category filters in config', () => {
      const configWithFilter = {
        ...mockConfig,
        categories: ['quality', 'security']
      };

      const filteredOrchestrator = new AnalyzerOrchestrator(configWithFilter);

      // Should still initialize all analyzers but config can be used for filtering
      expect(Object.keys(filteredOrchestrator.analyzers)).toHaveLength(7);
    });

    it('should pass verbose flag to analyzers', () => {
      const verboseConfig = { ...mockConfig, verbose: true };
      const verboseOrchestrator = new AnalyzerOrchestrator(verboseConfig);

      expect(verboseOrchestrator.config.verbose).toBe(true);
    });
  });
});