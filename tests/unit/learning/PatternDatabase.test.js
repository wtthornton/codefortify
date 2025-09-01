/**
 * Tests for PatternDatabase
 * Tests the pattern storage and retrieval system for Context7 integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PatternDatabase } from '../../../src/learning/PatternDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PatternDatabase', () => {
  let database;
  let testProjectDir;
  let config;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, 'fixtures', 'pattern-db-test');
    await fs.mkdir(testProjectDir, { recursive: true });

    config = {
      storagePath: path.join(testProjectDir, '.context7', 'patterns'),
      maxPatterns: 1000,
      compressionEnabled: true,
      backupEnabled: true
    };

    database = new PatternDatabase(config);
  });

  afterEach(async () => {
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultDb = new PatternDatabase();
      expect(defaultDb.config).toBeDefined();
      expect(defaultDb.patterns).toBeInstanceOf(Map);
      expect(defaultDb.indexes).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      expect(database.config).toEqual({
        storagePath: config.storagePath,
        maxPatterns: 1000,
        indexUpdateInterval: 60000,
        backupEnabled: true,
        compressionEnabled: true
      });
      expect(database.patterns).toBeInstanceOf(Map);
      expect(database.indexes).toBeDefined();
    });
  });

  describe('store', () => {
    it('should save a new pattern', async () => {
      const pattern = {
        id: 'test-pattern-1',
        type: 'refactoring',
        category: 'function',
        effectiveness: 0.8,
        usageCount: 1,
        lastUsed: new Date(),
        successRate: 1.0,
        codeExample: {
          before: 'function old() { return 1; }',
          after: 'function new() { return 1; }'
        },
        metadata: {
          language: 'javascript',
          framework: 'vanilla'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await database.store(pattern);

      expect(result).toBe(true);
      expect(database.patterns.has(pattern.id)).toBe(true);
    });

    it('should update existing pattern', async () => {
      const pattern = {
        id: 'test-pattern-1',
        code: `function example() {
  return 'Hello World';
}`,
        context: { language: 'javascript' },
        effectiveness: 0.8,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      // Save initial pattern
      await database.store(pattern);

      // Update pattern
      const updatedPattern = {
        ...pattern,
        effectiveness: 0.9,
        usageCount: 2
      };

      const result = await database.update(pattern.id, updatedPattern);

      expect(result).toBe(true);
      expect(database.patterns.get(pattern.id).effectiveness).toBe(0.9);

      // Verify update
      const retrieved = await database.get(pattern.id);
      expect(retrieved.effectiveness).toBe(0.9);
      expect(retrieved.usageCount).toBe(2);
    });

    it('should generate ID if not provided', async () => {
      const pattern = {
        code: `function example() {
  return 'Hello World';
}`,
        context: { language: 'javascript' },
        effectiveness: 0.8,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      const result = await database.savePattern(pattern);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.patternId).toBeDefined();
      expect(result.patternId).toMatch(/^pattern-\d+$/);
    });

    it('should validate pattern data', async () => {
      const invalidPattern = {
        // Missing required fields
        id: 'invalid-pattern'
      };

      await expect(database.store(invalidPattern))
        .rejects.toThrow();
    });
  });

  describe('getPattern', () => {
    it('should retrieve existing pattern', async () => {
      const pattern = {
        id: 'test-pattern-1',
        code: `function example() {
  return 'Hello World';
}`,
        context: { language: 'javascript' },
        effectiveness: 0.8,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      await database.savePattern(pattern);
      const retrieved = await database.get(pattern.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(pattern.id);
      expect(retrieved.code).toBe(pattern.code);
      expect(retrieved.context).toEqual(pattern.context);
    });

    it('should return null for non-existent pattern', async () => {
      const retrieved = await database.get('non-existent-pattern');
      expect(retrieved).toBeNull();
    });

    it('should update lastUsed timestamp on retrieval', async () => {
      const pattern = {
        id: 'test-pattern-1',
        code: 'function example() { return \'test\'; }',
        context: { language: 'javascript' },
        effectiveness: 0.8,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      await database.savePattern(pattern);
      const originalLastUsed = pattern.lastUsed;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const retrieved = await database.get(pattern.id);
      expect(new Date(retrieved.lastUsed)).toBeInstanceOf(Date);
      expect(retrieved.lastUsed).not.toBe(originalLastUsed);
    });
  });

  describe('searchPatterns', () => {
    beforeEach(async () => {
      // Create test patterns
      const patterns = [
        {
          id: 'js-function-1',
          code: 'function add(a, b) { return a + b; }',
          context: { language: 'javascript', pattern: 'function' },
          effectiveness: 0.9,
          usageCount: 5,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        },
        {
          id: 'js-function-2',
          code: 'function multiply(a, b) { return a * b; }',
          context: { language: 'javascript', pattern: 'function' },
          effectiveness: 0.8,
          usageCount: 3,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        },
        {
          id: 'ts-interface-1',
          code: 'interface User { id: number; name: string; }',
          context: { language: 'typescript', pattern: 'interface' },
          effectiveness: 0.85,
          usageCount: 2,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        }
      ];

      for (const pattern of patterns) {
        await database.savePattern(pattern);
      }
    });

    it('should search by language', async () => {
      const results = await database.searchPatterns({ language: 'javascript' });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results.every(p => p.context.language === 'javascript')).toBe(true);
    });

    it('should search by pattern type', async () => {
      const results = await database.searchPatterns({ pattern: 'function' });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results.every(p => p.context.pattern === 'function')).toBe(true);
    });

    it('should search by effectiveness threshold', async () => {
      const results = await database.searchPatterns({ minEffectiveness: 0.85 });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results.every(p => p.effectiveness >= 0.85)).toBe(true);
    });

    it('should search by usage count', async () => {
      const results = await database.searchPatterns({ minUsageCount: 3 });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results.every(p => p.usageCount >= 3)).toBe(true);
    });

    it('should combine multiple search criteria', async () => {
      const results = await database.searchPatterns({
        language: 'javascript',
        minEffectiveness: 0.8
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results.every(p =>
        p.context.language === 'javascript' && p.effectiveness >= 0.8
      )).toBe(true);
    });

    it('should return empty array when no patterns match', async () => {
      const results = await database.searchPatterns({ language: 'python' });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should limit results when specified', async () => {
      const results = await database.searchPatterns({
        language: 'javascript',
        limit: 1
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
    });

    it('should sort results by effectiveness by default', async () => {
      const results = await database.searchPatterns({ language: 'javascript' });

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results[0].effectiveness).toBeGreaterThanOrEqual(results[1].effectiveness);
    });
  });

  describe('deletePattern', () => {
    it('should delete existing pattern', async () => {
      const pattern = {
        id: 'test-pattern-1',
        code: 'function example() { return \'test\'; }',
        context: { language: 'javascript' },
        effectiveness: 0.8,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      await database.savePattern(pattern);
      const result = await database.deletePattern(pattern.id);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify deletion
      const retrieved = await database.get(pattern.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent pattern', async () => {
      const result = await database.deletePattern('non-existent-pattern');
      expect(result.success).toBe(false);
    });
  });

  describe('getAllPatterns', () => {
    it('should return all patterns', async () => {
      const patterns = [
        {
          id: 'pattern-1',
          code: 'function test1() { return \'test1\'; }',
          context: { language: 'javascript' },
          effectiveness: 0.8,
          usageCount: 1,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        },
        {
          id: 'pattern-2',
          code: 'function test2() { return \'test2\'; }',
          context: { language: 'javascript' },
          effectiveness: 0.9,
          usageCount: 2,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        }
      ];

      for (const pattern of patterns) {
        await database.savePattern(pattern);
      }

      const allPatterns = await database.getAllPatterns();

      expect(allPatterns).toBeDefined();
      expect(Array.isArray(allPatterns)).toBe(true);
      expect(allPatterns.length).toBe(2);
    });

    it('should return empty array when no patterns exist', async () => {
      const allPatterns = await database.getAllPatterns();

      expect(allPatterns).toBeDefined();
      expect(Array.isArray(allPatterns)).toBe(true);
      expect(allPatterns.length).toBe(0);
    });
  });

  describe('getPatternStats', () => {
    it('should return database statistics', async () => {
      const patterns = [
        {
          id: 'pattern-1',
          code: 'function test1() { return \'test1\'; }',
          context: { language: 'javascript' },
          effectiveness: 0.8,
          usageCount: 1,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        },
        {
          id: 'pattern-2',
          code: 'function test2() { return \'test2\'; }',
          context: { language: 'typescript' },
          effectiveness: 0.9,
          usageCount: 2,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        }
      ];

      for (const pattern of patterns) {
        await database.savePattern(pattern);
      }

      const stats = await database.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalPatterns).toBe(2);
      expect(stats.languages).toBeDefined();
      expect(stats.languages.javascript).toBe(1);
      expect(stats.languages.typescript).toBe(1);
      expect(stats.averageEffectiveness).toBeDefined();
      expect(stats.totalUsageCount).toBe(3);
    });
  });

  describe('backup and restore', () => {
    it('should create backup of patterns', async () => {
      const pattern = {
        id: 'backup-test',
        code: 'function backup() { return \'backup\'; }',
        context: { language: 'javascript' },
        effectiveness: 0.8,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      await database.savePattern(pattern);
      const backupPath = path.join(testProjectDir, 'backup.json');
      const result = await database.createBackup(backupPath);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.backupPath).toBe(backupPath);

      // Verify backup file exists
      const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
      expect(backupExists).toBe(true);
    });

    it('should restore patterns from backup', async () => {
      // Create backup data
      const backupData = {
        patterns: [
          {
            id: 'restore-test',
            code: 'function restore() { return \'restore\'; }',
            context: { language: 'javascript' },
            effectiveness: 0.8,
            usageCount: 1,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
          }
        ],
        metadata: {
          version: '1.0.0',
          backedUpAt: new Date().toISOString()
        }
      };

      const backupPath = path.join(testProjectDir, 'restore-backup.json');
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

      const result = await database.restoreFromBackup(backupPath);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.restoredCount).toBe(1);

      // Verify pattern was restored
      const restored = await database.get('restore-test');
      expect(restored).toBeDefined();
      expect(restored.code).toBe(backupData.patterns[0].code);
    });
  });

  describe('error handling', () => {
    it('should handle invalid pattern data', async () => {
      const invalidPattern = {
        id: 'invalid'
        // Missing required fields
      };

      await expect(database.savePattern(invalidPattern))
        .rejects.toThrow();
    });

    it('should handle file system errors gracefully', async () => {
      // Create database with invalid storage path
      const invalidConfig = {
        storagePath: '/invalid/path/that/does/not/exist',
        maxPatterns: 1000
      };

      const invalidDb = new PatternDatabase(invalidConfig);

      const pattern = {
        id: 'test',
        code: 'function test() { return \'test\'; }',
        context: { language: 'javascript' },
        effectiveness: 0.8,
        usageCount: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      // Should not throw error, but handle gracefully
      const result = await invalidDb.savePattern(pattern);
      expect(result).toBeDefined();
    });

    it('should handle corrupted backup files', async () => {
      const corruptedBackupPath = path.join(testProjectDir, 'corrupted.json');
      await fs.writeFile(corruptedBackupPath, 'invalid json content');

      await expect(database.restoreFromBackup(corruptedBackupPath))
        .rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large numbers of patterns efficiently', async () => {
      const startTime = Date.now();

      // Save many patterns
      for (let i = 0; i < 100; i++) {
        const pattern = {
          id: `perf-pattern-${i}`,
          code: `function perf${i}() { return 'test${i}'; }`,
          context: { language: 'javascript', pattern: `pattern-${i}` },
          effectiveness: Math.random(),
          usageCount: Math.floor(Math.random() * 10) + 1,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        };

        await database.savePattern(pattern);
      }

      const saveTime = Date.now() - startTime;

      // Search should be fast
      const searchStartTime = Date.now();
      const results = await database.searchPatterns({ language: 'javascript' });
      const searchTime = Date.now() - searchStartTime;

      expect(saveTime).toBeLessThan(5000); // Should save 100 patterns within 5 seconds
      expect(searchTime).toBeLessThan(1000); // Should search within 1 second
      expect(results.length).toBe(100);
    });
  });
});
