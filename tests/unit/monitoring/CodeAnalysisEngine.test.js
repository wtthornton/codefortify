/**
 * Tests for CodeAnalysisEngine
 * Refactored for better testability and parsing compatibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeAnalysisEngine } from '../../../src/monitoring/CodeAnalysisEngine.js';

describe('CodeAnalysisEngine', () => {
  let engine;

  beforeEach(() => {
    const config = {
      analysisDepth: 'shallow',
      enableSecurityAnalysis: true,
      enablePerformanceAnalysis: true
    };
    engine = new CodeAnalysisEngine(config);
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new CodeAnalysisEngine();
      expect(defaultEngine.config).toBeDefined();
      expect(defaultEngine.analysisCache).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customConfig = { analysisDepth: 'deep' };
      const customEngine = new CodeAnalysisEngine(customConfig);
      expect(customEngine.config).toEqual(customConfig);
    });
  });

  describe('analyzeCode', () => {
    it('should analyze simple JavaScript code', async () => {
      const simpleCode = 'const x = 1; console.log(x);';
      const result = await engine.analyzeCode(simpleCode);

      expect(result).toBeDefined();
      expect(result.complexity).toBeDefined();
      expect(result.maintainability).toBeDefined();
    });

    it('should cache analysis results', async () => {
      const code = 'const y = 2;';

      // First analysis
      const result1 = await engine.analyzeCode(code);

      // Second analysis should return cached result
      const result2 = await engine.analyzeCode(code);

      expect(result1).toEqual(result2);
    });

    it('should handle empty code input', async () => {
      const result = await engine.analyzeCode('');
      expect(result).toBeDefined();
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const code = 'const test = "hello";';
      const key1 = engine.generateCacheKey(code);
      const key2 = engine.generateCacheKey(code);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different code', () => {
      const code1 = 'const a = 1;';
      const code2 = 'const b = 2;';

      const key1 = engine.generateCacheKey(code1);
      const key2 = engine.generateCacheKey(code2);

      expect(key1).not.toBe(key2);
    });
  });
});