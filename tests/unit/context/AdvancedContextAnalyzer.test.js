/**
 * Tests for AdvancedContextAnalyzer
 * Tests the enhanced context awareness system for Context7 integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AdvancedContextAnalyzer } from '../../../src/context/AdvancedContextAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AdvancedContextAnalyzer', () => {
  let analyzer;
  let testProjectDir;
  let config;

  beforeEach(async () => {
    // Create test project structure
    testProjectDir = path.join(__dirname, 'fixtures', 'context-test-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });

    // Create test files
    await fs.writeFile(
      path.join(testProjectDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        type: 'module',
        dependencies: {
          'react': '^18.0.0',
          '@modelcontextprotocol/sdk': '^1.17.4',
          'vitest': '^2.1.0'
        },
        devDependencies: {
          'eslint': '^8.57.1',
          'prettier': '^3.6.2'
        },
        scripts: {
          'test': 'vitest',
          'lint': 'eslint src/',
          'format': 'prettier --write src/'
        }
      }, null, 2)
    );

    await fs.writeFile(
      path.join(testProjectDir, 'src', 'index.js'),
      `import React from 'react';
import { useState, useEffect } from 'react';

export function App() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`
    );

    config = {
      cacheEnabled: true,
      cacheTimeout: 300000, // 5 minutes
      analysisDepth: 'deep',
      includePatterns: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
      excludePatterns: ['node_modules/**', 'dist/**', 'coverage/**']
    };

    analyzer = new AdvancedContextAnalyzer(config);
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultAnalyzer = new AdvancedContextAnalyzer();
      expect(defaultAnalyzer.config).toBeDefined();
      expect(defaultAnalyzer.analyzerCache).toBeInstanceOf(Map);
      expect(defaultAnalyzer.contextPatterns).toBeInstanceOf(Map);
    });

    it('should initialize with custom config', () => {
      expect(analyzer.config).toEqual(config);
      expect(analyzer.analyzerCache).toBeInstanceOf(Map);
      expect(analyzer.contextPatterns).toBeInstanceOf(Map);
    });
  });

  describe('analyzeProjectContext', () => {
    it('should analyze complete project context', async () => {
      const context = await analyzer.analyzeProjectContext(testProjectDir);

      expect(context).toBeDefined();
      expect(context.architecture).toBeDefined();
      expect(context.style).toBeDefined();
      expect(context.conventions).toBeDefined();
      expect(context.performance).toBeDefined();
      expect(context.security).toBeDefined();
      expect(context.dependencies).toBeDefined();
      expect(context.timestamp).toBeDefined();
      expect(new Date(context.timestamp)).toBeInstanceOf(Date);
    });

    it('should cache analysis results', async () => {
      const context1 = await analyzer.analyzeProjectContext(testProjectDir);
      const context2 = await analyzer.analyzeProjectContext(testProjectDir);

      expect(context1).toBe(context2); // Should return same object from cache
      expect(analyzer.analyzerCache.size).toBe(1);
    });

    it('should handle non-existent project directory', async () => {
      const nonExistentDir = path.join(testProjectDir, 'non-existent');

      await expect(analyzer.analyzeProjectContext(nonExistentDir))
        .rejects.toThrow();
    });

    it('should handle empty project directory', async () => {
      const emptyDir = path.join(testProjectDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      const context = await analyzer.analyzeProjectContext(emptyDir);

      expect(context).toBeDefined();
      expect(context.architecture).toBeDefined();
      expect(context.dependencies).toBeDefined();
    });
  });

  describe('analyzeFileContext', () => {
    it('should analyze file context', async () => {
      const filePath = path.join(testProjectDir, 'src', 'index.js');
      const context = await analyzer.analyzeFileContext(filePath, testProjectDir);

      expect(context).toBeDefined();
      expect(context.file).toBeDefined();
      expect(context.file.path).toBe(filePath);
      expect(context.file.type).toBeDefined();
      expect(context.file.language).toBeDefined();
    });

    it('should handle non-existent file', async () => {
      const nonExistentFile = path.join(testProjectDir, 'non-existent.js');

      await expect(analyzer.analyzeFileContext(nonExistentFile, testProjectDir))
        .rejects.toThrow();
    });
  });

  describe('clearCache', () => {
    it('should clear analysis cache', async () => {
      await analyzer.analyzeProjectContext(testProjectDir);
      expect(analyzer.analyzerCache.size).toBe(1);

      analyzer.clearCache();
      expect(analyzer.analyzerCache.size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      await analyzer.analyzeProjectContext(testProjectDir);

      const stats = analyzer.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.size).toBe(1);
      expect(stats.keys).toBeDefined();
      expect(stats.lastAnalysisTimes).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      await analyzer.analyzeProjectContext(testProjectDir);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should use cache for repeated analysis', async () => {
      const startTime1 = Date.now();
      await analyzer.analyzeProjectContext(testProjectDir);
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      await analyzer.analyzeProjectContext(testProjectDir);
      const endTime2 = Date.now();

      const firstRun = endTime1 - startTime1;
      const secondRun = endTime2 - startTime2;

      expect(secondRun).toBeLessThan(firstRun); // Cached run should be faster
    });
  });
});