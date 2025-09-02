/**
 * Pattern Search Strategy Tests
 * Tests for the refactored pattern search functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PatternSearchStrategy } from '../../../../src/learning/patterns/PatternSearchStrategy.js';

describe('PatternSearchStrategy', () => {
  let strategy;
  let mockDatabase;

  beforeEach(() => {
    strategy = new PatternSearchStrategy();
    
    // Mock database
    mockDatabase = {
      patterns: new Map(),
      similarityCalculator: {
        calculateSimilarity: vi.fn()
      },
      filterManager: {
        matchesCriteria: vi.fn()
      },
      indexes: {
        type: new Map()
      }
    };

    // Setup test patterns
    const testPatterns = [
      {
        id: 'pattern1',
        type: 'component',
        title: 'Button Component',
        codeExample: 'const Button = () => <button>Click</button>',
        usageCount: 5,
        effectiveness: 0.8,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'pattern2', 
        type: 'component',
        title: 'Input Component',
        codeExample: 'const Input = () => <input />',
        usageCount: 3,
        effectiveness: 0.6,
        lastUsed: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: 'pattern3',
        type: 'hook',
        title: 'useCustomHook',
        codeExample: 'const useCustomHook = () => {}',
        usageCount: 10,
        effectiveness: 0.9,
        lastUsed: new Date().toISOString()
      }
    ];

    testPatterns.forEach(pattern => {
      mockDatabase.patterns.set(pattern.id, pattern);
    });

    // Setup type index
    mockDatabase.indexes.type.set('component', [testPatterns[0], testPatterns[1]]);
    mockDatabase.indexes.type.set('hook', [testPatterns[2]]);
  });

  describe('findSimilarPatterns', () => {
    it('should find similar patterns with similarity scores', async () => {
      const targetPattern = {
        id: 'target',
        type: 'component',
        codeExample: 'const MyButton = () => <button>Test</button>'
      };

      const context = { minSimilarity: 0.3, maxResults: 5 };

      // Mock similarity calculations
      mockDatabase.similarityCalculator.calculateSimilarity
        .mockReturnValueOnce(0.8) // pattern1
        .mockReturnValueOnce(0.4); // pattern2

      const results = await strategy.findSimilarPatterns(targetPattern, context, mockDatabase);

      expect(results).toHaveLength(2);
      expect(results[0].pattern.id).toBe('pattern1');
      expect(results[0].similarity).toBe(0.8);
      expect(results[1].pattern.id).toBe('pattern2');
      expect(results[1].similarity).toBe(0.4);
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should filter by minimum similarity threshold', async () => {
      const targetPattern = {
        id: 'target',
        type: 'component',
        codeExample: 'const Test = () => <div>Test</div>'
      };

      const context = { minSimilarity: 0.7 };

      mockDatabase.similarityCalculator.calculateSimilarity
        .mockReturnValueOnce(0.8) // pattern1 - above threshold
        .mockReturnValueOnce(0.5); // pattern2 - below threshold

      const results = await strategy.findSimilarPatterns(targetPattern, context, mockDatabase);

      expect(results).toHaveLength(1);
      expect(results[0].pattern.id).toBe('pattern1');
    });

    it('should limit results to maxResults', async () => {
      const targetPattern = {
        id: 'target',
        type: 'component',
        codeExample: 'const Test = () => <div>Test</div>'
      };

      const context = { maxResults: 1 };

      mockDatabase.similarityCalculator.calculateSimilarity
        .mockReturnValue(0.8);

      const results = await strategy.findSimilarPatterns(targetPattern, context, mockDatabase);

      expect(results).toHaveLength(1);
    });

    it('should use cache for repeated searches', async () => {
      const targetPattern = {
        id: 'target',
        type: 'component',
        codeExample: 'const Test = () => <div>Test</div>'
      };

      const context = { minSimilarity: 0.3 };

      mockDatabase.similarityCalculator.calculateSimilarity
        .mockReturnValue(0.8);

      // First search
      await strategy.findSimilarPatterns(targetPattern, context, mockDatabase);
      
      // Second search with same parameters
      const results = await strategy.findSimilarPatterns(targetPattern, context, mockDatabase);

      // Should return cached results - similarity calculation called only once per pattern
      expect(mockDatabase.similarityCalculator.calculateSimilarity).toHaveBeenCalledTimes(2); // Only from first search
      expect(results).toBeDefined();
    });

    it('should handle empty database gracefully', async () => {
      mockDatabase.patterns.clear();
      mockDatabase.indexes.type.clear();

      const targetPattern = {
        id: 'target',
        type: 'component',
        codeExample: 'const Test = () => <div>Test</div>'
      };

      const results = await strategy.findSimilarPatterns(targetPattern, {}, mockDatabase);

      expect(results).toEqual([]);
    });

    it('should exclude the target pattern from results', async () => {
      const targetPattern = {
        id: 'pattern1', // Same ID as existing pattern
        type: 'component',
        codeExample: 'const Button = () => <button>Click</button>'
      };

      mockDatabase.similarityCalculator.calculateSimilarity
        .mockReturnValue(0.8);

      const results = await strategy.findSimilarPatterns(targetPattern, {}, mockDatabase);

      // Should not include the target pattern itself
      expect(results.every(r => r.pattern.id !== 'pattern1')).toBe(true);
    });
  });

  describe('search', () => {
    it('should search patterns with criteria', async () => {
      const criteria = { type: 'component' };

      mockDatabase.filterManager.matchesCriteria.mockReturnValue(true);

      const results = await strategy.search(criteria, mockDatabase);

      expect(results).toHaveLength(2); // 2 component patterns
      expect(results.every(p => p.type === 'component')).toBe(true);
    });

    it('should apply filters correctly', async () => {
      const criteria = { 
        type: 'component',
        minEffectiveness: 0.7
      };

      // Only pattern1 should match (effectiveness 0.8)
      mockDatabase.filterManager.matchesCriteria
        .mockReturnValueOnce(true) // pattern1
        .mockReturnValueOnce(false); // pattern2

      const results = await strategy.search(criteria, mockDatabase);

      expect(mockDatabase.filterManager.matchesCriteria).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(1);
    });

    it('should handle empty criteria gracefully', async () => {
      mockDatabase.filterManager.matchesCriteria.mockReturnValue(true);

      const results = await strategy.search({}, mockDatabase);

      expect(results).toHaveLength(3); // All patterns
    });

    it('should sort results correctly', async () => {
      const criteria = { 
        sort: { field: 'usageCount', direction: 'desc' }
      };

      mockDatabase.filterManager.matchesCriteria.mockReturnValue(true);

      const results = await strategy.search(criteria, mockDatabase);

      expect(results[0].usageCount).toBeGreaterThanOrEqual(results[1].usageCount);
      expect(results[1].usageCount).toBeGreaterThanOrEqual(results[2].usageCount);
    });
  });

  describe('getCandidatesByType', () => {
    it('should return patterns from type index', () => {
      const candidates = strategy.getCandidatesByType('component', mockDatabase);
      
      expect(candidates).toHaveLength(2);
      expect(candidates.every(p => p.type === 'component')).toBe(true);
    });

    it('should return all patterns when type index is missing', () => {
      mockDatabase.indexes = null;
      
      const candidates = strategy.getCandidatesByType('component', mockDatabase);
      
      expect(candidates).toHaveLength(3); // All patterns
    });

    it('should handle non-existent types', () => {
      const candidates = strategy.getCandidatesByType('nonexistent', mockDatabase);
      
      expect(candidates).toEqual([]);
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate relevance based on multiple factors', () => {
      const pattern = {
        lastUsed: new Date().toISOString(),
        effectiveness: 0.8,
        usageCount: 5
      };

      const targetPattern = { type: 'component' };
      const context = { projectType: 'react' };

      // Add projectType to pattern for context relevance
      pattern.projectTypes = ['react'];

      const score = strategy.calculateRelevanceScore(pattern, targetPattern, context);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should give higher scores to recently used patterns', () => {
      const recentPattern = {
        lastUsed: new Date().toISOString(),
        effectiveness: 0.5,
        usageCount: 1
      };

      const oldPattern = {
        lastUsed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        effectiveness: 0.5,
        usageCount: 1
      };

      const recentScore = strategy.calculateRelevanceScore(recentPattern, {}, {});
      const oldScore = strategy.calculateRelevanceScore(oldPattern, {}, {});

      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });

  describe('cache management', () => {
    it('should clear cache when requested', () => {
      // Populate cache
      const cacheKey = strategy.getCacheKey({ id: 'test', type: 'test' }, {});
      strategy.updateCache(cacheKey, [{ pattern: { id: 'cached' } }]);

      expect(strategy.searchCache.size).toBe(1);

      strategy.clearCache();

      expect(strategy.searchCache.size).toBe(0);
    });

    it('should limit cache size', () => {
      strategy.cacheSize = 2;

      // Add 3 items to exceed cache size
      for (let i = 0; i < 3; i++) {
        const key = `key${i}`;
        strategy.updateCache(key, [{ pattern: { id: `pattern${i}` } }]);
      }

      expect(strategy.searchCache.size).toBe(2); // Should be limited to 2
      expect(strategy.searchCache.has('key0')).toBe(false); // First item should be removed
      expect(strategy.searchCache.has('key2')).toBe(true); // Last item should be present
    });
  });
});