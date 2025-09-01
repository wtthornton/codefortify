/**
 * Tests for ResultsProcessor - focusing on result processing and aggregation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResultsProcessor } from '../../src/scoring/core/ResultsProcessor.js';

describe('ResultsProcessor', () => {
  let processor;
  const mockConfig = { verbose: false };
  const mockProjectMetadata = {
    projectRoot: '/test/project',
    projectType: 'react-webapp',
    projectName: 'test-project',
    version: '1.0.0'
  };

  beforeEach(() => {
    processor = new ResultsProcessor(mockConfig);
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with provided configuration', () => {
      expect(processor.config).toEqual(mockConfig);
    });

    it('should initialize with empty config when none provided', () => {
      const emptyProcessor = new ResultsProcessor();
      expect(emptyProcessor.config).toEqual({});
    });
  });

  describe('initializeResults', () => {
    it('should create complete results structure', () => {
      const results = processor.initializeResults(mockProjectMetadata);

      expect(results).toHaveProperty('categories');
      expect(results).toHaveProperty('overall');
      expect(results).toHaveProperty('metadata');
      expect(results).toHaveProperty('recommendations');
      expect(results).toHaveProperty('systemInfo');

      expect(results.categories).toEqual({});
      expect(results.recommendations).toEqual([]);
      expect(results.systemInfo).toEqual({});
    });

    it('should initialize overall results correctly', () => {
      const results = processor.initializeResults(mockProjectMetadata);

      expect(results.overall.score).toBe(0);
      expect(results.overall.maxScore).toBe(100);
      expect(results.overall.percentage).toBe(0);
      expect(results.overall.grade).toBe('F');
      expect(results.overall.hasErrors).toBe(false);
      expect(results.overall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should initialize metadata correctly', () => {
      const results = processor.initializeResults(mockProjectMetadata);

      expect(results.metadata.projectRoot).toBe('/test/project');
      expect(results.metadata.projectType).toBe('react-webapp');
      expect(results.metadata.projectName).toBe('test-project');
      expect(results.metadata.version).toBe('1.0.0');
      expect(results.metadata.analyzedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should use default version when not provided', () => {
      const metadataWithoutVersion = { ...mockProjectMetadata };
      delete metadataWithoutVersion.version;

      const results = processor.initializeResults(metadataWithoutVersion);
      expect(results.metadata.version).toBe('1.0.0');
    });
  });

  describe('processAnalyzerResult', () => {
    it('should process complete analyzer result', () => {
      const mockResult = {
        categoryName: 'Test Category',
        score: 15,
        maxScore: 20,
        issues: ['Issue 1', 'Issue 2'],
        recommendations: ['Fix issue 1'],
        metrics: { count: 5 }
      };

      const processed = processor.processAnalyzerResult(mockResult);

      expect(processed.categoryName).toBe('Test Category');
      expect(processed.score).toBe(15);
      expect(processed.maxScore).toBe(20);
      expect(processed.percentage).toBe(75);
      expect(processed.grade).toBe('C');
      expect(processed.issues).toEqual(['Issue 1', 'Issue 2']);
      expect(processed.recommendations).toEqual(['Fix issue 1']);
      expect(processed.metrics).toEqual({ count: 5 });
    });

    it('should handle missing optional fields', () => {
      const minimalResult = {
        score: 8,
        maxScore: 10
      };

      const processed = processor.processAnalyzerResult(minimalResult);

      expect(processed.categoryName).toBe('Unknown Category');
      expect(processed.issues).toEqual([]);
      expect(processed.recommendations).toEqual([]);
      expect(processed.metrics).toEqual({});
    });

    it('should cap score at maxScore', () => {
      const overMaxResult = {
        score: 25,
        maxScore: 20
      };

      const processed = processor.processAnalyzerResult(overMaxResult);
      expect(processed.score).toBe(20);
    });

    it('should ensure score is not negative', () => {
      const negativeResult = {
        score: -5,
        maxScore: 20
      };

      const processed = processor.processAnalyzerResult(negativeResult);
      expect(processed.score).toBe(0);
    });

    it('should handle zero maxScore', () => {
      const zeroMaxResult = {
        score: 5,
        maxScore: 0
      };

      const processed = processor.processAnalyzerResult(zeroMaxResult);
      expect(processed.percentage).toBe(0);
      expect(processed.grade).toBe('F');
    });

    it('should handle error results', () => {
      const errorResult = {
        score: 10,
        maxScore: 20,
        error: 'Analysis failed'
      };

      const processed = processor.processAnalyzerResult(errorResult);

      expect(processed.score).toBe(0);
      expect(processed.percentage).toBe(0);
      expect(processed.grade).toBe('F');
      expect(processed.error).toBe('Analysis failed');
      expect(processed.issues).toContain('Analysis failed: Analysis failed');
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate overall score from categories', () => {
      const mockResults = {
        categories: {
          structure: { score: 15, maxScore: 20 },
          quality: { score: 12, maxScore: 15 },
          testing: { score: 8, maxScore: 10 }
        },
        overall: {}
      };

      processor.calculateOverallScore(mockResults);

      expect(mockResults.overall.score).toBe(35);
      expect(mockResults.overall.maxScore).toBe(45);
      expect(mockResults.overall.percentage).toBe(78);
      expect(mockResults.overall.grade).toBe('C+');
      expect(mockResults.overall.hasErrors).toBe(false);
    });

    it('should detect errors in categories', () => {
      const mockResults = {
        categories: {
          structure: { score: 15, maxScore: 20 },
          quality: { score: 0, maxScore: 15, error: 'Failed' }
        },
        overall: {}
      };

      processor.calculateOverallScore(mockResults);
      expect(mockResults.overall.hasErrors).toBe(true);
    });

    it('should handle empty categories', () => {
      const mockResults = {
        categories: {},
        overall: {}
      };

      processor.calculateOverallScore(mockResults);

      expect(mockResults.overall.score).toBe(0);
      expect(mockResults.overall.maxScore).toBe(0);
      expect(mockResults.overall.percentage).toBe(0);
      expect(mockResults.overall.grade).toBe('F');
    });
  });

  describe('calculateGrade', () => {
    it('should return correct grades for different percentages', () => {
      expect(processor.calculateGrade(1.00)).toBe('A+');
      expect(processor.calculateGrade(0.98)).toBe('A+');
      expect(processor.calculateGrade(0.95)).toBe('A');
      expect(processor.calculateGrade(0.91)).toBe('A-');
      expect(processor.calculateGrade(0.88)).toBe('B+');
      expect(processor.calculateGrade(0.84)).toBe('B');
      expect(processor.calculateGrade(0.81)).toBe('B-');
      expect(processor.calculateGrade(0.78)).toBe('C+');
      expect(processor.calculateGrade(0.74)).toBe('C');
      expect(processor.calculateGrade(0.71)).toBe('C-');
      expect(processor.calculateGrade(0.68)).toBe('D+');
      expect(processor.calculateGrade(0.66)).toBe('D');
      expect(processor.calculateGrade(0.61)).toBe('D-');
      expect(processor.calculateGrade(0.59)).toBe('F');
      expect(processor.calculateGrade(0.30)).toBe('F');
      expect(processor.calculateGrade(0.00)).toBe('F');
    });
  });

  describe('getPerformanceLevel', () => {
    it('should return correct performance levels', () => {
      expect(processor.getPerformanceLevel(95)).toBe('excellent');
      expect(processor.getPerformanceLevel(90)).toBe('excellent');
      expect(processor.getPerformanceLevel(85)).toBe('good');
      expect(processor.getPerformanceLevel(75)).toBe('good');
      expect(processor.getPerformanceLevel(70)).toBe('warning');
      expect(processor.getPerformanceLevel(60)).toBe('warning');
      expect(processor.getPerformanceLevel(50)).toBe('poor');
      expect(processor.getPerformanceLevel(30)).toBe('poor');
    });
  });

  describe('getComplexityScore', () => {
    it('should return correct complexity scores', () => {
      const thresholds = [
        { threshold: 10, score: 'low' },
        { threshold: 20, score: 'medium' },
        { threshold: 30, score: 'high' }
      ];

      expect(processor.getComplexityScore(5, thresholds)).toBe('low');
      expect(processor.getComplexityScore(15, thresholds)).toBe('medium');
      expect(processor.getComplexityScore(25, thresholds)).toBe('high');
      expect(processor.getComplexityScore(35, thresholds)).toBe('very_high');
    });

    it('should handle edge case at exact threshold', () => {
      const thresholds = [{ threshold: 10, score: 'low' }];
      expect(processor.getComplexityScore(10, thresholds)).toBe('low');
    });
  });

  describe('aggregateRecommendations', () => {
    it('should collect and sort recommendations', () => {
      const mockResults = {
        categories: {
          structure: {
            recommendations: [
              { suggestion: 'Fix structure', impact: 3 },
              { suggestion: 'Improve organization', impact: 5 }
            ]
          },
          quality: {
            recommendations: [
              { suggestion: 'Add linting', impact: 4 }
            ]
          }
        },
        recommendations: []
      };

      processor.aggregateRecommendations(mockResults);

      expect(mockResults.recommendations).toHaveLength(3);
      expect(mockResults.recommendations[0].suggestion).toBe('Improve organization');
      expect(mockResults.recommendations[1].suggestion).toBe('Add linting');
      expect(mockResults.recommendations[2].suggestion).toBe('Fix structure');
    });

    it('should remove duplicate recommendations', () => {
      const mockResults = {
        categories: {
          structure: {
            recommendations: [
              { suggestion: 'Fix issue', impact: 3 }
            ]
          },
          quality: {
            recommendations: [
              { suggestion: 'Fix issue', impact: 4 }
            ]
          }
        },
        recommendations: []
      };

      processor.aggregateRecommendations(mockResults);

      expect(mockResults.recommendations).toHaveLength(1);
      expect(mockResults.recommendations[0].suggestion).toBe('Fix issue');
    });
  });

  describe('addSystemInfo', () => {
    it('should add system info to results', () => {
      const mockResults = { systemInfo: {} };
      const mockSystemInfo = {
        platform: 'win32',
        nodeVersion: 'v18.0.0',
        npmVersion: '8.0.0'
      };

      processor.addSystemInfo(mockResults, mockSystemInfo);

      expect(mockResults.systemInfo.platform).toBe('win32');
      expect(mockResults.systemInfo.nodeVersion).toBe('v18.0.0');
      expect(mockResults.systemInfo.npmVersion).toBe('8.0.0');
      expect(mockResults.systemInfo.analyzedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('validateResults', () => {
    it('should validate complete results structure', () => {
      const validResults = {
        overall: { score: 75, maxScore: 100 },
        categories: {
          structure: { score: 15, maxScore: 20 },
          quality: { score: 60, maxScore: 80 }
        },
        metadata: { projectName: 'test' }
      };

      const validation = processor.validateResults(validResults);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should detect missing overall results', () => {
      const invalidResults = {
        categories: {},
        metadata: {}
      };

      const validation = processor.validateResults(invalidResults);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing overall results');
    });

    it('should detect missing categories', () => {
      const invalidResults = {
        overall: {},
        metadata: {}
      };

      const validation = processor.validateResults(invalidResults);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing category results');
    });

    it('should detect score inconsistency', () => {
      const inconsistentResults = {
        overall: { score: 100 },
        categories: {
          structure: { score: 15 },
          quality: { score: 20 }
        },
        metadata: {}
      };

      const validation = processor.validateResults(inconsistentResults);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Score inconsistency between overall and categories');
    });
  });

  describe('formatResultsForOutput', () => {
    const sampleResults = {
      overall: { score: 75, maxScore: 100, percentage: 75, grade: 'C' },
      categories: {
        structure: {
          categoryName: 'Structure',
          score: 15,
          maxScore: 20,
          grade: 'B-',
          issues: ['Missing README']
        }
      }
    };

    it('should format console output', () => {
      const output = processor.formatResultsForOutput(sampleResults, 'console');

      expect(output).toContain('📊 Overall Score: 75/100 (75%) C');
      expect(output).toContain('Structure: 15/20 (B-)');
      expect(output).toContain('⚠ Missing README');
    });

    it('should format JSON output', () => {
      const output = processor.formatResultsForOutput(sampleResults, 'json');
      const parsed = JSON.parse(output);

      expect(parsed.overall.score).toBe(75);
      expect(parsed.categories.structure.categoryName).toBe('Structure');
    });

    it('should format summary output', () => {
      const output = processor.formatResultsForOutput(sampleResults, 'summary');

      expect(output).toHaveProperty('score', 75);
      expect(output).toHaveProperty('grade', 'C');
      expect(output).toHaveProperty('categories', 1);
    });

    it('should return raw results for unknown format', () => {
      const output = processor.formatResultsForOutput(sampleResults, 'unknown');
      expect(output).toBe(sampleResults);
    });
  });
});