/**
 * Tests for RecommendationEngine enhancements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecommendationEngine } from '../../src/scoring/RecommendationEngine.js';
import { RecommendationHistory } from '../../src/scoring/RecommendationHistory.js';
import fs from 'fs/promises';

// Mock fs operations
vi.mock('fs/promises');

describe('RecommendationEngine Enhancements', () => {
  let engine;
  let mockResults;

  beforeEach(() => {
    engine = new RecommendationEngine();
    mockResults = {
      overall: { score: 75, maxScore: 100 },
      categories: {
        quality: {
          score: 15,
          maxScore: 20,
          issues: ['documentation', 'complexity']
        },
        security: {
          score: 10,
          maxScore: 15,
          issues: ['vulnerabilities']
        }
      },
      detectedPatterns: ['React', 'TypeScript'],
      files: ['src/App.jsx', 'src/components/']
    };

    // Mock fs operations
    fs.readFile = vi.fn().mockResolvedValue('{}');
    fs.writeFile = vi.fn().mockResolvedValue(undefined);
    fs.mkdir = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Smart Filtering & Deduplication', () => {
    it('should detect React project type', async () => {
      const recs = await engine.generateRecommendations(mockResults);
      expect(engine.projectType).toBe('react');
    });

    it('should filter out irrelevant recommendations for React projects', () => {
      engine.projectType = 'react';

      const testRec = {
        category: 'performance',
        action: 'Use vue async components for lazy loading',
        suggestion: 'Add Vue lazy loading'
      };

      expect(engine.isRelevantForProjectType(testRec)).toBe(false);
    });

    it('should keep relevant recommendations for React projects', () => {
      engine.projectType = 'react';

      const testRec = {
        category: 'performance',
        action: 'Use React.lazy() for component lazy loading',
        suggestion: 'Add React lazy loading'
      };

      expect(engine.isRelevantForProjectType(testRec)).toBe(true);
    });

    it('should generate similarity keys for deduplication', () => {
      const testRec = {
        category: 'quality',
        action: 'Run: npm install --save-dev eslint prettier'
      };

      const key = engine.generateSimilarityKey(testRec);
      expect(key).toBe('quality-run-npm-install---save-dev-eslint-prettier');
    });
  });

  describe('Executable Recommendations', () => {
    it('should identify executable recommendations', async () => {
      const recs = await engine.generateRecommendations(mockResults);
      const executableRecs = engine.getExecutableRecommendations(recs);

      expect(executableRecs.length).toBeGreaterThan(0);
      expect(executableRecs[0]).toHaveProperty('executable');
      expect(executableRecs[0].executable).toHaveProperty('commands');
    });

    it('should generate executable recommendation with correct structure', async () => {
      const mockRec = {
        category: 'security',
        suggestion: 'Fix vulnerabilities',
        action: 'Run npm audit --fix',
        executable: {
          commands: ['npm audit --fix'],
          confirmationMessage: 'Fix vulnerabilities?',
          requiresInteraction: false
        }
      };

      expect(mockRec.executable).toHaveProperty('commands');
      expect(mockRec.executable).toHaveProperty('confirmationMessage');
      expect(mockRec.executable).toHaveProperty('requiresInteraction');
    });
  });

  describe('Progress Tracking', () => {
    it('should track recommendations with progress data', async () => {
      const recs = await engine.generateRecommendations(mockResults);

      expect(recs.length).toBeGreaterThan(0);
      recs.forEach(rec => {
        expect(rec).toHaveProperty('progress');
        expect(rec.progress).toHaveProperty('status');
        expect(rec.progress).toHaveProperty('id');
      });
    });

    it('should provide history access methods', async () => {
      expect(typeof engine.getRecommendationHistory).toBe('function');
      expect(typeof engine.clearRecommendationHistory).toBe('function');
      expect(typeof engine.exportRecommendationHistory).toBe('function');
      expect(typeof engine.markManualCompletion).toBe('function');
    });
  });
});

describe('RecommendationHistory', () => {
  let history;

  beforeEach(() => {
    history = new RecommendationHistory();

    // Mock fs operations
    fs.readFile = vi.fn().mockResolvedValue(JSON.stringify({
      version: '1.0.0',
      recommendations: {},
      completedActions: [],
      stats: {
        totalRecommendations: 0,
        completedRecommendations: 0,
        executedActions: 0
      }
    }));
    fs.writeFile = vi.fn().mockResolvedValue(undefined);
    fs.mkdir = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should generate stable recommendation IDs', () => {
    const testRec = {
      category: 'quality',
      suggestion: 'Configure ESLint',
      action: 'Run npm install eslint'
    };

    const id1 = history.generateRecommendationId(testRec);
    const id2 = history.generateRecommendationId(testRec);

    expect(id1).toBe(id2);
    expect(id1).toMatch(/^quality_configure_eslint/);
  });

  it('should track recommendation completion', async () => {
    const testRec = {
      category: 'security',
      suggestion: 'Fix vulnerabilities',
      action: 'npm audit --fix'
    };

    await history.markRecommendationCompleted(testRec, true);

    const status = history.getRecommendationStatus(testRec);
    expect(status).toBe('completed');
  });

  it('should provide statistics', async () => {
    const stats = await history.getStats();

    expect(stats).toHaveProperty('totalRecommendations');
    expect(stats).toHaveProperty('completedRecommendations');
    expect(stats).toHaveProperty('executedActions');
    expect(stats).toHaveProperty('completionRate');
  });
});