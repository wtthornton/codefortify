/**
 * Tests for DynamicPatternLearner
 * Tests the dynamic pattern learning system for Context7 integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DynamicPatternLearner } from '../../../src/learning/DynamicPatternLearner.js';
import { PatternDatabase } from '../../../src/learning/PatternDatabase.js';
import { EffectivenessTracker } from '../../../src/learning/EffectivenessTracker.js';
import { FeedbackProcessor } from '../../../src/learning/FeedbackProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DynamicPatternLearner', () => {
  let learner;
  let testProjectDir;
  let config;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, 'fixtures', 'learning-test-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });

    config = {
      learningEnabled: true,
      patternStoragePath: path.join(testProjectDir, '.context7', 'patterns'),
      effectivenessThreshold: 0.7,
      minUsageCount: 3,
      learningRate: 0.1
    };

    learner = new DynamicPatternLearner(config);
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
      const defaultLearner = new DynamicPatternLearner();
      expect(defaultLearner.config).toBeDefined();
      expect(defaultLearner.patternDatabase).toBeInstanceOf(PatternDatabase);
      expect(defaultLearner.effectivenessTracker).toBeInstanceOf(EffectivenessTracker);
      expect(defaultLearner.feedbackProcessor).toBeInstanceOf(FeedbackProcessor);
    });

    it('should initialize with custom configuration', () => {
      expect(learner.config).toEqual({
        learningThreshold: 0.8,
        feedbackWeight: 0.3,
        patternLifetime: 2592000000,
        maxPatterns: 1000,
        minUsageCount: 3,
        patternStoragePath: config.patternStoragePath,
        effectivenessThreshold: 0.7,
        learningEnabled: true,
        learningRate: 0.1
      });
      expect(learner.patternDatabase).toBeInstanceOf(PatternDatabase);
      expect(learner.effectivenessTracker).toBeInstanceOf(EffectivenessTracker);
      expect(learner.feedbackProcessor).toBeInstanceOf(FeedbackProcessor);
    });
  });

  describe('learnFromSuccess', () => {
    it('should learn patterns from successful code', async () => {
      const originalCode = `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`;
      const improvedCode = `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`;
      const metrics = { improvement: 0.9 };
      const context = {
        project: { type: 'javascript', framework: 'vanilla' }
      };

      const result = await learner.learnFromSuccess(originalCode, improvedCode, metrics, context);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.patternId).toBeDefined();
      expect(result.effectiveness).toBeGreaterThan(0);
    });

    it('should learn from multiple code examples', async () => {
      const codeExamples = [
        {
          filePath: path.join(testProjectDir, 'src', 'example1.js'),
          code: `function add(a, b) {
  return a + b;
}`,
          context: { language: 'javascript', pattern: 'simple-function' },
          outcome: 'success',
          metrics: { performance: 0.9, maintainability: 0.8 }
        },
        {
          filePath: path.join(testProjectDir, 'src', 'example2.js'),
          code: `function multiply(a, b) {
  return a * b;
}`,
          context: { language: 'javascript', pattern: 'simple-function' },
          outcome: 'success',
          metrics: { performance: 0.9, maintainability: 0.8 }
        }
      ];

      for (const example of codeExamples) {
        await fs.writeFile(example.filePath, example.code);
        await learner.learnFromSuccess(example.code, example.code, { improvement: 0.8 }, example.context);
      }

      const patterns = await learner.patternDatabase.exportPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should handle failed code examples', async () => {
      const codeContext = {
        filePath: path.join(testProjectDir, 'src', 'bad-example.js'),
        code: `function badFunction() {
  var unused = 'this is bad';
  // LOG: debugging
  return null;
}`,
        context: { language: 'javascript', pattern: 'anti-pattern' },
        outcome: 'failure',
        metrics: {
          performance: 0.3,
          maintainability: 0.2,
          readability: 0.4
        }
      };

      await fs.writeFile(codeContext.filePath, codeContext.code);

      const result = await learner.learnFromSuccess(codeContext.code, codeContext.code, { improvement: 0.3 }, codeContext.context);

      expect(result).toBeDefined();
      expect(result.success).toBe(true); // Should still learn from failures
      expect(result.patternId).toBeDefined();
    });

    it('should extract patterns from code structure', async () => {
      const codeContext = {
        filePath: path.join(testProjectDir, 'src', 'react-component.jsx'),
        code: `import React, { useState, useEffect } from 'react';

export function Counter() {
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
}`,
        context: { language: 'jsx', framework: 'react', pattern: 'component-with-state' },
        outcome: 'success',
        metrics: { performance: 0.9, maintainability: 0.85, readability: 0.9 }
      };

      await fs.writeFile(codeContext.filePath, codeContext.code);

      const result = await learner.learnFromSuccess(codeContext.code, codeContext.code, { improvement: 0.3 }, codeContext.context);

      expect(result).toBeDefined();
      expect(result.extractedPatterns).toBeDefined();
      expect(result.extractedPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('getPatternSuggestions', () => {
    it('should suggest patterns based on context', async () => {
      // First learn some patterns
      const codeContext = {
        filePath: path.join(testProjectDir, 'src', 'example.js'),
        code: `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}`,
        context: { language: 'javascript', pattern: 'array-reduce' },
        outcome: 'success',
        metrics: { performance: 0.9, maintainability: 0.8 }
      };

      await fs.writeFile(codeContext.filePath, codeContext.code);
      await learner.learnFromSuccess(codeContext.code, codeContext.code, { improvement: 0.8 }, codeContext.context);

      // Now get suggestions for similar context
      const context = {
        language: 'javascript',
        task: 'array-processing',
        framework: 'vanilla'
      };

      const suggestions = await learner.getSimilarPatterns('general', {
        language: 'javascript'
      });

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].patternId).toBeDefined();
      expect(suggestions[0].confidence).toBeGreaterThan(0);
    });

    it('should rank suggestions by effectiveness', async () => {
      // Learn multiple patterns with different effectiveness
      const patterns = [
        {
          code: 'function highQuality() { return \'excellent\'; }',
          context: { language: 'javascript', pattern: 'high-quality' },
          outcome: 'success',
          metrics: { performance: 0.95, maintainability: 0.9, readability: 0.95 }
        },
        {
          code: 'function mediumQuality() { return \'good\'; }',
          context: { language: 'javascript', pattern: 'medium-quality' },
          outcome: 'success',
          metrics: { performance: 0.7, maintainability: 0.7, readability: 0.7 }
        }
      ];

      for (let i = 0; i < patterns.length; i++) {
        const filePath = path.join(testProjectDir, 'src', `pattern${i}.js`);
        await fs.writeFile(filePath, patterns[i].code);
        await learner.learnFromSuccess(patterns[i].code, patterns[i].code, { improvement: 0.8 }, { language: 'javascript' });
      }

      const suggestions = await learner.getPatternSuggestions({
        language: 'javascript',
        task: 'function-creation'
      });

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(1);
      // Higher quality pattern should be ranked higher
      expect(suggestions[0].confidence).toBeGreaterThanOrEqual(suggestions[1].confidence);
    });

    it('should return empty array when no patterns match', async () => {
      const suggestions = await learner.getSimilarPatterns('nonexistent-pattern', {
        project: { type: 'nonexistent-language' }
      });

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });
  });

  describe('updatePatternEffectiveness', () => {
    it('should update pattern effectiveness based on feedback', async () => {
      // First learn a pattern
      const codeContext = {
        filePath: path.join(testProjectDir, 'src', 'example.js'),
        code: 'function example() { return \'test\'; }',
        context: { language: 'javascript', pattern: 'simple-function' },
        outcome: 'success',
        metrics: { performance: 0.8, maintainability: 0.8 }
      };

      await fs.writeFile(codeContext.filePath, codeContext.code);
      const learnResult = await learner.learnFromSuccess(codeContext.code, codeContext.code, { improvement: 0.8 }, codeContext.context);

      // Update effectiveness with new feedback
      const feedback = {
        patternId: learnResult.patternId,
        outcome: 'success',
        metrics: { performance: 0.9, maintainability: 0.9, readability: 0.9 },
        userRating: 5
      };

      const updateResult = await learner.updatePatternEffectiveness(feedback);

      expect(updateResult).toBeDefined();
      expect(updateResult.success).toBe(true);
      expect(updateResult.newEffectiveness).toBeGreaterThan(0.8);
    });

    it('should handle negative feedback', async () => {
      // Learn a pattern
      const codeContext = {
        filePath: path.join(testProjectDir, 'src', 'example.js'),
        code: 'function example() { return \'test\'; }',
        context: { language: 'javascript', pattern: 'simple-function' },
        outcome: 'success',
        metrics: { performance: 0.8, maintainability: 0.8 }
      };

      await fs.writeFile(codeContext.filePath, codeContext.code);
      const learnResult = await learner.learnFromSuccess(codeContext.code, codeContext.code, { improvement: 0.8 }, codeContext.context);

      // Provide negative feedback
      const feedback = {
        patternId: learnResult.patternId,
        outcome: 'failure',
        metrics: { performance: 0.3, maintainability: 0.2 },
        userRating: 1
      };

      const updateResult = await learner.updatePatternEffectiveness(feedback);

      expect(updateResult).toBeDefined();
      expect(updateResult.success).toBe(true);
      expect(updateResult.newEffectiveness).toBeLessThan(0.8);
    });
  });

  describe('getLearnedPatterns', () => {
    it('should return all learned patterns', async () => {
      // Learn multiple patterns
      const patterns = [
        {
          code: 'function pattern1() { return \'test1\'; }',
          context: { language: 'javascript', pattern: 'pattern1' },
          outcome: 'success',
          metrics: { performance: 0.8, maintainability: 0.8 }
        },
        {
          code: 'function pattern2() { return \'test2\'; }',
          context: { language: 'javascript', pattern: 'pattern2' },
          outcome: 'success',
          metrics: { performance: 0.8, maintainability: 0.8 }
        }
      ];

      for (let i = 0; i < patterns.length; i++) {
        const filePath = path.join(testProjectDir, 'src', `pattern${i}.js`);
        await fs.writeFile(filePath, patterns[i].code);
        await learner.learnFromSuccess(patterns[i].code, patterns[i].code, { improvement: 0.8 }, { project: { type: 'javascript' } });
      }

      const learnedPatterns = await learner.getLearnedPatterns();

      expect(learnedPatterns).toBeDefined();
      expect(Array.isArray(learnedPatterns)).toBe(true);
      expect(learnedPatterns.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter patterns by criteria', async () => {
      // Learn patterns with different characteristics
      const patterns = [
        {
          code: 'function jsPattern() { return \'js\'; }',
          context: { language: 'javascript', pattern: 'js-pattern' },
          outcome: 'success',
          metrics: { performance: 0.8, maintainability: 0.8 }
        },
        {
          code: 'function tsPattern(): string { return \'ts\'; }',
          context: { language: 'typescript', pattern: 'ts-pattern' },
          outcome: 'success',
          metrics: { performance: 0.8, maintainability: 0.8 }
        }
      ];

      for (let i = 0; i < patterns.length; i++) {
        const filePath = path.join(testProjectDir, 'src', `pattern${i}.js`);
        await fs.writeFile(filePath, patterns[i].code);
        await learner.learnFromSuccess(patterns[i].code, patterns[i].code, { improvement: 0.8 }, patterns[i].context);
      }

      const jsPatterns = await learner.getLearnedPatterns({ language: 'javascript' });
      const tsPatterns = await learner.getLearnedPatterns({ language: 'typescript' });

      expect(jsPatterns.length).toBeGreaterThan(0);
      expect(tsPatterns.length).toBeGreaterThan(0);
      expect(jsPatterns.every(p => p.context.language === 'javascript')).toBe(true);
      expect(tsPatterns.every(p => p.context.language === 'typescript')).toBe(true);
    });
  });

  describe('exportPatterns', () => {
    it('should export patterns to file', async () => {
      // Learn a pattern
      const codeContext = {
        filePath: path.join(testProjectDir, 'src', 'example.js'),
        code: 'function example() { return \'test\'; }',
        context: { language: 'javascript', pattern: 'simple-function' },
        outcome: 'success',
        metrics: { performance: 0.8, maintainability: 0.8 }
      };

      await fs.writeFile(codeContext.filePath, codeContext.code);
      await learner.learnFromSuccess(codeContext.code, codeContext.code, { improvement: 0.8 }, codeContext.context);

      const exportPath = path.join(testProjectDir, 'exported-patterns.json');
      const result = await learner.exportPatterns(exportPath);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.filePath).toBe(exportPath);

      // Verify file was created and contains data
      const exportedData = await fs.readFile(exportPath, 'utf8');
      const parsed = JSON.parse(exportedData);
      expect(parsed.patterns).toBeDefined();
      expect(parsed.patterns.length).toBeGreaterThan(0);
    });
  });

  describe('importPatterns', () => {
    it('should import patterns from file', async () => {
      // Create export file
      const exportData = {
        patterns: [
          {
            id: 'test-pattern-1',
            type: 'general',
            category: 'function',
            context: { language: 'javascript', pattern: 'imported-pattern' },
            effectiveness: 0.8,
            usageCount: 1,
            lastUsed: new Date().toISOString(),
            successRate: 1.0,
            codeExample: {
              before: 'function old() { return \'old\'; }',
              after: 'function imported() { return \'imported\'; }'
            },
            metadata: {
              language: 'javascript',
              framework: 'vanilla',
              complexity: 'similar',
              linesChanged: 1
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        metadata: {
          version: '1.0.0',
          exportedAt: new Date().toISOString()
        }
      };

      const importPath = path.join(testProjectDir, 'import-patterns.json');
      await fs.writeFile(importPath, JSON.stringify(exportData, null, 2));

      const result = await learner.importPatterns(importPath);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);

      // Verify pattern was imported
      const patterns = await learner.patternDatabase.exportPatterns();
      expect(patterns.some(p => p.id === 'test-pattern-1')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid code context', async () => {
      const invalidContext = {
        // Missing required fields
        code: 'function test() { return \'test\'; }'
      };

      await expect(learner.learnFromSuccess(invalidContext.code, invalidContext.code, { improvement: 0.8 }, invalidContext.context))
        .rejects.toThrow();
    });

    it('should handle file system errors', async () => {
      const codeContext = {
        filePath: '/invalid/path/that/does/not/exist.js',
        code: 'function test() { return \'test\'; }',
        context: { language: 'javascript' },
        outcome: 'success',
        metrics: { performance: 0.8 }
      };

      await expect(learner.learnFromSuccess(codeContext.code, codeContext.code, { improvement: 0.8 }, codeContext.context))
        .rejects.toThrow();
    });

    it('should handle invalid feedback data', async () => {
      const invalidFeedback = {
        // Missing patternId
        outcome: 'success',
        metrics: { performance: 0.8 }
      };

      await expect(learner.updatePatternEffectiveness(invalidFeedback))
        .rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large numbers of patterns efficiently', async () => {
      const startTime = Date.now();

      // Learn many patterns
      for (let i = 0; i < 50; i++) {
        const codeContext = {
          filePath: path.join(testProjectDir, 'src', `pattern${i}.js`),
          code: `function pattern${i}() { return 'test${i}'; }`,
          context: { language: 'javascript', pattern: `pattern-${i}` },
          outcome: 'success',
          metrics: { performance: 0.8, maintainability: 0.8 }
        };

        await fs.writeFile(codeContext.filePath, codeContext.code);
        await learner.learnFromSuccess(codeContext.code, codeContext.code, { improvement: 0.8 }, codeContext.context);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all patterns were learned
      const patterns = await learner.patternDatabase.exportPatterns();
      expect(patterns.length).toBeGreaterThanOrEqual(50);
    });
  });
});
