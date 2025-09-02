/**
 * Pattern Similarity Calculator Tests
 * Tests for similarity algorithms and calculations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PatternSimilarityCalculator } from '../../../../src/learning/patterns/PatternSimilarityCalculator.js';

describe('PatternSimilarityCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new PatternSimilarityCalculator();
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical patterns', () => {
      const pattern1 = {
        id: 'test1',
        codeExample: 'const test = () => {}',
        context: { fileType: 'js' },
        type: 'function'
      };

      const pattern2 = { ...pattern1, id: 'test2' };

      const similarity = calculator.calculateSimilarity(pattern1, pattern2);

      expect(similarity).toBeCloseTo(1.0, 1);
    });

    it('should return 1.0 for same pattern (same ID)', () => {
      const pattern = {
        id: 'test1',
        codeExample: 'const test = () => {}'
      };

      const similarity = calculator.calculateSimilarity(pattern, pattern);

      expect(similarity).toBe(1);
    });

    it('should return 0 for null patterns', () => {
      const pattern = { id: 'test', codeExample: 'test' };

      expect(calculator.calculateSimilarity(null, pattern)).toBe(0);
      expect(calculator.calculateSimilarity(pattern, null)).toBe(0);
      expect(calculator.calculateSimilarity(null, null)).toBe(0);
    });

    it('should calculate similarity for different patterns', () => {
      const pattern1 = {
        id: 'test1',
        codeExample: 'const button = () => <button>Click</button>',
        context: { fileType: 'jsx', framework: 'react' },
        type: 'component',
        category: 'ui'
      };

      const pattern2 = {
        id: 'test2',
        codeExample: 'const input = () => <input />',
        context: { fileType: 'jsx', framework: 'react' },
        type: 'component',
        category: 'ui'
      };

      const similarity = calculator.calculateSimilarity(pattern1, pattern2);

      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should weight different similarity aspects correctly', () => {
      const pattern1 = {
        id: 'test1',
        codeExample: 'const test = () => {}',
        context: { fileType: 'js' },
        type: 'function'
      };

      const pattern2 = {
        id: 'test2',
        codeExample: 'const different = () => { return "very different"; }',
        context: { fileType: 'js' },
        type: 'function'
      };

      const similarity = calculator.calculateSimilarity(pattern1, pattern2);

      // Should be somewhat similar due to context and type matching
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(0.8);
    });
  });

  describe('calculateCodeSimilarity', () => {
    it('should return 1.0 for identical code', () => {
      const pattern1 = { codeExample: 'const test = () => {}' };
      const pattern2 = { codeExample: 'const test = () => {}' };

      const similarity = calculator.calculateCodeSimilarity(pattern1, pattern2);

      expect(similarity).toBeCloseTo(1.0, 2);
    });

    it('should return 0 for missing code', () => {
      const pattern1 = { codeExample: 'const test = () => {}' };
      const pattern2 = { codeExample: '' };

      const similarity = calculator.calculateCodeSimilarity(pattern1, pattern2);

      expect(similarity).toBe(0);
    });

    it('should normalize code before comparison', () => {
      const pattern1 = { codeExample: 'const  test = () => {}' }; // Extra spaces
      const pattern2 = { codeExample: 'const test=()=>{}' }; // No spaces

      const similarity = calculator.calculateCodeSimilarity(pattern1, pattern2);

      expect(similarity).toBeGreaterThan(0.8); // Should be very similar after normalization
    });

    it('should handle case differences', () => {
      const pattern1 = { codeExample: 'const TEST = () => {}' };
      const pattern2 = { codeExample: 'const test = () => {}' };

      const similarity = calculator.calculateCodeSimilarity(pattern1, pattern2);

      expect(similarity).toBeGreaterThan(0.8); // Should be similar (normalized to lowercase)
    });
  });

  describe('calculateContextSimilarity', () => {
    it('should return 1.0 for identical contexts', () => {
      const context1 = {
        fileType: 'js',
        projectType: 'react',
        framework: 'react',
        directory: 'src/components',
        dependencies: ['react', 'lodash']
      };

      const context2 = { ...context1 };

      const similarity = calculator.calculateContextSimilarity(context1, context2);

      expect(similarity).toBe(1.0);
    });

    it('should return 1.0 for empty contexts', () => {
      const similarity = calculator.calculateContextSimilarity({}, {});

      expect(similarity).toBe(1.0);
    });

    it('should calculate partial matches correctly', () => {
      const context1 = {
        fileType: 'js',
        projectType: 'react',
        framework: 'react'
      };

      const context2 = {
        fileType: 'js', // Match
        projectType: 'vue', // No match
        framework: 'react' // Match
      };

      const similarity = calculator.calculateContextSimilarity(context1, context2);

      expect(similarity).toBeCloseTo(2/3, 1); // 2 out of 3 fields match
    });

    it('should handle directory similarity', () => {
      const context1 = { directory: 'src/components/buttons' };
      const context2 = { directory: 'src/components/inputs' };

      const similarity = calculator.calculateContextSimilarity(context1, context2);

      expect(similarity).toBeGreaterThan(0); // Should have some similarity (shared path)
      expect(similarity).toBeLessThan(1);
    });

    it('should handle dependency overlap', () => {
      const context1 = { dependencies: ['react', 'lodash', 'axios'] };
      const context2 = { dependencies: ['react', 'moment', 'axios'] };

      const similarity = calculator.calculateContextSimilarity(context1, context2);

      expect(similarity).toBeGreaterThan(0.5); // 2/4 dependencies overlap (Jaccard similarity)
    });
  });

  describe('calculateMetadataSimilarity', () => {
    it('should calculate type similarity', () => {
      const pattern1 = { type: 'component', category: 'ui' };
      const pattern2 = { type: 'component', category: 'form' };

      const similarity = calculator.calculateMetadataSimilarity(pattern1, pattern2);

      expect(similarity).toBe(0.5); // Type matches, category doesn't
    });

    it('should handle tag similarities', () => {
      const pattern1 = {
        type: 'component',
        tags: ['react', 'ui', 'button']
      };
      const pattern2 = {
        type: 'component',
        tags: ['react', 'form', 'input']
      };

      const similarity = calculator.calculateMetadataSimilarity(pattern1, pattern2);

      expect(similarity).toBeGreaterThan(0.5); // Type + some tag overlap
    });

    it('should handle missing metadata', () => {
      const pattern1 = { type: 'component' };
      const pattern2 = {}; // No metadata

      const similarity = calculator.calculateMetadataSimilarity(pattern1, pattern2);

      expect(similarity).toBe(0);
    });
  });

  describe('calculateLevenshteinSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      const similarity = calculator.calculateLevenshteinSimilarity('test', 'test');
      expect(similarity).toBe(1.0);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = calculator.calculateLevenshteinSimilarity('', 'different');
      expect(similarity).toBe(0);
    });

    it('should calculate edit distance correctly', () => {
      const similarity = calculator.calculateLevenshteinSimilarity('kitten', 'sitting');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should handle empty strings', () => {
      expect(calculator.calculateLevenshteinSimilarity('', '')).toBe(1.0);
      expect(calculator.calculateLevenshteinSimilarity('test', '')).toBe(0);
      expect(calculator.calculateLevenshteinSimilarity('', 'test')).toBe(0);
    });
  });

  describe('calculateDirectorySimilarity', () => {
    it('should return 1.0 for identical directories', () => {
      const similarity = calculator.calculateDirectorySimilarity(
        'src/components/buttons',
        'src/components/buttons'
      );
      expect(similarity).toBe(1.0);
    });

    it('should calculate path overlap correctly', () => {
      const similarity = calculator.calculateDirectorySimilarity(
        'src/components/buttons',
        'src/components/inputs'
      );
      expect(similarity).toBeCloseTo(2/3, 1); // 2 common parts out of 3 total parts
    });

    it('should handle completely different paths', () => {
      const similarity = calculator.calculateDirectorySimilarity(
        'src/components',
        'tests/unit'
      );
      expect(similarity).toBe(0);
    });

    it('should handle empty or null paths', () => {
      expect(calculator.calculateDirectorySimilarity('', 'test')).toBe(0);
      expect(calculator.calculateDirectorySimilarity('test', '')).toBe(0);
      expect(calculator.calculateDirectorySimilarity(null, 'test')).toBe(0);
    });
  });

  describe('calculateDependencySimilarity', () => {
    it('should return 1.0 for identical dependency lists', () => {
      const deps1 = ['react', 'lodash', 'axios'];
      const deps2 = ['react', 'lodash', 'axios'];

      const similarity = calculator.calculateDependencySimilarity(deps1, deps2);
      expect(similarity).toBe(1.0);
    });

    it('should return 1.0 for empty lists', () => {
      const similarity = calculator.calculateDependencySimilarity([], []);
      expect(similarity).toBe(1.0);
    });

    it('should return 0 for one empty list', () => {
      const similarity = calculator.calculateDependencySimilarity(['react'], []);
      expect(similarity).toBe(0);
    });

    it('should calculate Jaccard similarity correctly', () => {
      const deps1 = ['react', 'lodash', 'axios'];
      const deps2 = ['react', 'moment', 'axios'];

      const similarity = calculator.calculateDependencySimilarity(deps1, deps2);
      // Intersection: 2 (react, axios), Union: 4 (react, lodash, axios, moment)
      expect(similarity).toBeCloseTo(0.5, 2);
    });
  });

  describe('normalizeCode', () => {
    it('should normalize whitespace', () => {
      const normalized = calculator.normalizeCode('const  test  =  () =>  {}');
      expect(normalized).toBe('const test = () => {}');
    });

    it('should convert to lowercase', () => {
      const normalized = calculator.normalizeCode('const TEST = () => {}');
      expect(normalized).toBe('const test = () => {}');
    });

    it('should normalize quotes', () => {
      const normalized = calculator.normalizeCode("const test = 'hello'");
      expect(normalized).toBe('const test = "hello"');
    });

    it('should trim whitespace', () => {
      const normalized = calculator.normalizeCode('  const test = () => {}  ');
      expect(normalized).toBe('const test = () => {}');
    });
  });
});