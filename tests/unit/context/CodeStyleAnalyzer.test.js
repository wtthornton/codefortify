/**
 * Tests for CodeStyleAnalyzer
 * Tests code style analysis for Context7 integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CodeStyleAnalyzer } from '../../../src/context/CodeStyleAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CodeStyleAnalyzer', () => {
  let analyzer;
  let testProjectDir;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, 'fixtures', 'style-test-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });

    analyzer = new CodeStyleAnalyzer();
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
      expect(analyzer.config).toBeDefined();
      expect(analyzer.styleCache).toBeInstanceOf(Map);
      expect(analyzer.supportedFormatters).toBeDefined();
      expect(analyzer.supportedLinters).toBeDefined();
    });
  });

  describe('analyzeCodeStyle', () => {
    it('should detect Prettier configuration', async () => {
      await fs.writeFile(
        path.join(testProjectDir, '.prettierrc'),
        JSON.stringify({
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5'
        })
      );

      const style = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style).toBeDefined();
      expect(style.formatter).toBe('prettier');
      expect(style.formatterConfig).toBeDefined();
      expect(style.formatterConfig.semi).toBe(true);
      expect(style.formatterConfig.singleQuote).toBe(true);
    });

    it('should detect ESLint configuration', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'eslint.config.js'),
        `export default [
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'warn',
      'semi': ['error', 'always']
    }
  }
];`
      );

      const style = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style).toBeDefined();
      expect(style.linter).toBe('eslint');
      expect(style.linterConfig).toBeDefined();
      expect(style.linterConfig.rules).toBeDefined();
    });

    it('should detect multiple style tools', async () => {
      // Create both Prettier and ESLint configs
      await fs.writeFile(
        path.join(testProjectDir, '.prettierrc'),
        JSON.stringify({
          semi: true,
          singleQuote: true
        })
      );

      await fs.writeFile(
        path.join(testProjectDir, 'eslint.config.js'),
        `export default [
  {
    files: ['**/*.js'],
    rules: {
      'no-unused-vars': 'error'
    }
  }
];`
      );

      const style = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style).toBeDefined();
      expect(style.formatter).toBe('prettier');
      expect(style.linter).toBe('eslint');
    });

    it('should analyze code patterns from source files', async () => {
      // Create source files with different styles
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'file1.js'),
        `function example() {
  const message = "Hello World";
  console.log(message);
}`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'file2.js'),
        `function anotherExample() {
  const message = 'Hello World';
  console.log(message);
}`
      );

      const style = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style).toBeDefined();
      expect(style.patterns).toBeDefined();
      expect(style.patterns.quotes).toBeDefined();
      expect(style.patterns.semicolons).toBeDefined();
    });

    it('should handle TypeScript files', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.ts'),
        `interface User {
  id: number;
  name: string;
}

function getUser(id: number): User {
  return { id, name: 'John' };
}`
      );

      const style = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style).toBeDefined();
      expect(style.languages).toContain('typescript');
    });

    it('should handle React/JSX files', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'Component.jsx'),
        `import React from 'react';

export function MyComponent({ title }) {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}`
      );

      const style = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style).toBeDefined();
      expect(style.languages).toContain('jsx');
    });
  });

  describe('detectFormatter', () => {
    it('should detect Prettier from .prettierrc', async () => {
      await fs.writeFile(
        path.join(testProjectDir, '.prettierrc'),
        JSON.stringify({ semi: true })
      );

      const formatter = await analyzer.detectFormatter(testProjectDir);

      expect(formatter).toBe('prettier');
    });

    it('should detect Prettier from package.json', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          prettier: {
            semi: true,
            singleQuote: true
          }
        })
      );

      const formatter = await analyzer.detectFormatter(testProjectDir);

      expect(formatter).toBe('prettier');
    });

    it('should return null when no formatter detected', async () => {
      const formatter = await analyzer.detectFormatter(testProjectDir);

      expect(formatter).toBeNull();
    });
  });

  describe('detectLinter', () => {
    it('should detect ESLint from eslint.config.js', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'eslint.config.js'),
        `export default [
  {
    files: ['**/*.js'],
    rules: {}
  }
];`
      );

      const linter = await analyzer.detectLinter(testProjectDir);

      expect(linter).toBe('eslint');
    });

    it('should detect ESLint from .eslintrc.json', async () => {
      await fs.writeFile(
        path.join(testProjectDir, '.eslintrc.json'),
        JSON.stringify({
          extends: ['eslint:recommended'],
          rules: {}
        })
      );

      const linter = await analyzer.detectLinter(testProjectDir);

      expect(linter).toBe('eslint');
    });

    it('should return null when no linter detected', async () => {
      const linter = await analyzer.detectLinter(testProjectDir);

      expect(linter).toBeNull();
    });
  });

  describe('analyzeCodePatterns', () => {
    it('should analyze quote usage patterns', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'test.js'),
        `const single = 'single quotes';
const double = "double quotes";
const template = \`template literals\`;`
      );

      const patterns = await analyzer.analyzeCodePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.quotes).toBeDefined();
      expect(patterns.quotes.single).toBeGreaterThan(0);
      expect(patterns.quotes.double).toBeGreaterThan(0);
      expect(patterns.quotes.template).toBeGreaterThan(0);
    });

    it('should analyze semicolon usage', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'test.js'),
        `const withSemicolon = 'test';
const withoutSemicolon = 'test'
function example() {
  return 'test';
}`
      );

      const patterns = await analyzer.analyzeCodePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.semicolons).toBeDefined();
      expect(patterns.semicolons.withSemicolon).toBeGreaterThan(0);
      expect(patterns.semicolons.withoutSemicolon).toBeGreaterThan(0);
    });

    it('should analyze indentation patterns', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'test.js'),
        `function example() {
  if (true) {
    console.log('indented');
  }
}`
      );

      const patterns = await analyzer.analyzeCodePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.indentation).toBeDefined();
      expect(patterns.indentation.type).toBeDefined();
      expect(patterns.indentation.size).toBeDefined();
    });

    it('should analyze import/export patterns', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'test.js'),
        `import { useState } from 'react';
import * as utils from './utils';
const { default: Component } = await import('./Component');

export function example() {}
export default class MyClass {}`
      );

      const patterns = await analyzer.analyzeCodePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.imports).toBeDefined();
      expect(patterns.exports).toBeDefined();
    });
  });

  describe('getStyleRecommendations', () => {
    it('should provide style recommendations', async () => {
      // Create inconsistent code style
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'inconsistent.js'),
        `const single = 'single';
const double = "double";
function example() {
  console.log('mixed quotes');
}`
      );

      const recommendations = await analyzer.getStyleRecommendations(testProjectDir);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend formatter when none detected', async () => {
      const recommendations = await analyzer.getStyleRecommendations(testProjectDir);

      expect(recommendations).toBeDefined();
      expect(recommendations.some(r => r.type === 'formatter')).toBe(true);
    });

    it('should recommend linter when none detected', async () => {
      const recommendations = await analyzer.getStyleRecommendations(testProjectDir);

      expect(recommendations).toBeDefined();
      expect(recommendations.some(r => r.type === 'linter')).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache analysis results', async () => {
      await fs.writeFile(
        path.join(testProjectDir, '.prettierrc'),
        JSON.stringify({ semi: true })
      );

      const style1 = await analyzer.analyzeCodeStyle(testProjectDir);
      const style2 = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style1).toBe(style2); // Should return same object from cache
      expect(analyzer.styleCache.size).toBe(1);
    });

    it('should clear cache', async () => {
      await analyzer.analyzeCodeStyle(testProjectDir);
      expect(analyzer.styleCache.size).toBeGreaterThan(0);

      analyzer.clearCache();
      expect(analyzer.styleCache.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent directory', async () => {
      const nonExistentDir = path.join(testProjectDir, 'non-existent');

      await expect(analyzer.analyzeCodeStyle(nonExistentDir))
        .rejects.toThrow();
    });

    it('should handle invalid configuration files', async () => {
      await fs.writeFile(
        path.join(testProjectDir, '.prettierrc'),
        'invalid json content'
      );

      const style = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style).toBeDefined();
      expect(style.formatter).toBeNull();
    });

    it('should handle unreadable files gracefully', async () => {
      // Create a file that can't be read (simulate permission error)
      const unreadableFile = path.join(testProjectDir, 'src', 'unreadable.js');
      await fs.writeFile(unreadableFile, 'content');

      // Mock fs.readFile to throw an error
      const originalReadFile = fs.readFile;
      fs.readFile = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const style = await analyzer.analyzeCodeStyle(testProjectDir);

      expect(style).toBeDefined();
      expect(style.patterns).toBeDefined();

      // Restore original function
      fs.readFile = originalReadFile;
    });
  });

  describe('performance', () => {
    it('should complete analysis within reasonable time', async () => {
      // Create multiple files for performance testing
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(
          path.join(testProjectDir, 'src', `file${i}.js`),
          `function example${i}() {
  console.log('test ${i}');
}`
        );
      }

      const startTime = Date.now();
      await analyzer.analyzeCodeStyle(testProjectDir);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});
