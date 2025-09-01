/**
 * Tests for CodeAnalysisEngine
 * Tests the code analysis engine for real-time quality monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CodeAnalysisEngine } from '../../../src/monitoring/CodeAnalysisEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CodeAnalysisEngine', () => {
  let engine;
  let testProjectDir;
  let config;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, 'fixtures', 'analysis-test-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'tests'), { recursive: true });

    config = {
      analysisDepth: 'deep',
      includePatterns: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
      excludePatterns: ['node_modules/**', 'dist/**', 'coverage/**'],
      enableSecurityAnalysis: true,
      enablePerformanceAnalysis: true,
      enableAccessibilityAnalysis: true
    };

    engine = new CodeAnalysisEngine(config);
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
      const defaultEngine = new CodeAnalysisEngine();
      expect(defaultEngine.config).toBeDefined();
      expect(defaultEngine.analyzers).toBeDefined();
      expect(defaultEngine.cache).toBeInstanceOf(Map);
    });

    it('should initialize with custom configuration', () => {
      expect(engine.config).toEqual(config);
      expect(engine.analyzers).toBeDefined();
      expect(engine.cache).toBeInstanceOf(Map);
    });
  });

  describe('analyzeProject', () => {
    it('should analyze project with good quality code', async () => {
      // Create well-structured project
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'utils.js'),
        `/**
 * Utility functions for the application
 */

/**
 * Adds two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * Multiplies two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Product of a and b
 */
function multiply(a, b) {
  return a * b;
}

module.exports = { add, multiply };`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'tests', 'utils.test.js'),
        `const { add, multiply } = require('../src/utils');

describe('Utils', () => {
  test('add function', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('multiply function', () => {
    expect(multiply(2, 3)).toBe(6);
  });
});`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          scripts: {
            test: 'jest',
            lint: 'eslint src/',
            format: 'prettier --write src/'
          },
          dependencies: {
            'express': '^4.18.0'
          },
          devDependencies: {
            'jest': '^29.0.0',
            'eslint': '^8.57.1',
            'prettier': '^3.6.2'
          }
        })
      );

      const analysis = await engine.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.projectPath).toBe(testProjectDir);
      expect(analysis.timestamp).toBeDefined();
      expect(analysis.overallScore).toBeDefined();
      expect(analysis.categories).toBeDefined();
      expect(analysis.categories.maintainability).toBeDefined();
      expect(analysis.categories.performance).toBeDefined();
      expect(analysis.categories.security).toBeDefined();
      expect(analysis.categories.testCoverage).toBeDefined();
      expect(analysis.categories.codeComplexity).toBeDefined();
      expect(analysis.categories.documentation).toBeDefined();
      expect(analysis.categories.accessibility).toBeDefined();
    });

    it('should analyze project with poor quality code', async () => {
      // Create poorly structured project
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'bad-code.js'),
        `function bad() {
  var unused = 'this is bad';
  console.log('debugging');
  if (true) {
    if (true) {
      if (true) {
        if (true) {
          if (true) {
            return null;
          }
        }
      }
    }
  }
}

function anotherBad() {
  eval('console.log("bad")');
  setTimeout(function() {
    // Nested callback hell
    setTimeout(function() {
      setTimeout(function() {
        return 'deep nesting';
      }, 100);
    }, 100);
  }, 100);
}`

      await fs.writeFile(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'bad-project',
          version: '1.0.0'
        })
      );

      const analysis = await engine.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBeDefined();
      expect(analysis.categories.codeComplexity.score).toBeLessThan(0.5);
      expect(analysis.categories.maintainability.score).toBeLessThan(0.5);
    });

    it('should handle empty project', async () => {
      const analysis = await engine.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBeDefined();
      expect(analysis.categories).toBeDefined();
    });

    it('should handle TypeScript project', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.ts'),
        `interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUser(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
}

export default UserService;`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs',
            strict: true
          }
        })
      );

      const analysis = await engine.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.categories.maintainability).toBeDefined();
    });

    it('should handle React project', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'Component.jsx'),
        `import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Counter component with increment functionality
 */
export function Counter({ initialValue = 0, step = 1 }) {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  const handleIncrement = () => {
    setCount(prevCount => prevCount + step);
  };

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={handleIncrement} aria-label="Increment counter">
        Increment by {step}
      </button>
    </div>
  );
}

Counter.propTypes = {
  initialValue: PropTypes.number,
  step: PropTypes.number
};`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({
          name: 'react-project',
          version: '1.0.0',
          dependencies: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0'
          }
        })
      );

      const analysis = await engine.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.categories.accessibility).toBeDefined();
      expect(analysis.categories.maintainability).toBeDefined();
    });
  });

  describe('analyzeFile', () => {
    it('should analyze individual file', async () => {
      const filePath = path.join(testProjectDir, 'src', 'example.js');
      await fs.writeFile(
        filePath,
        `/**
 * Example function with good documentation
 * @param {string} name - User name
 * @returns {string} Greeting message
 */
function greet(name) {
  if (!name) {
    throw new Error('Name is required');
  }
  return \`Hello, \${name}!\`;
}

module.exports = { greet };`
      );

      const analysis = await engine.analyzeFile(filePath);

      expect(analysis).toBeDefined();
      expect(analysis.filePath).toBe(filePath);
      expect(analysis.language).toBe('javascript');
      expect(analysis.metrics).toBeDefined();
      expect(analysis.issues).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
    });

    it('should handle non-existent file', async () => {
      const nonExistentFile = path.join(testProjectDir, 'non-existent.js');

      await expect(engine.analyzeFile(nonExistentFile))
        .rejects.toThrow();
    });

    it('should analyze TypeScript file', async () => {
      const filePath = path.join(testProjectDir, 'src', 'example.ts');
      await fs.writeFile(
        filePath,
        `interface Config {
  apiUrl: string;
  timeout: number;
}

class ApiClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async fetchData(): Promise<any> {
    const response = await fetch(this.config.apiUrl, {
      signal: AbortSignal.timeout(this.config.timeout)
    });
    return response.json();
  }
}

export default ApiClient;`
      );

      const analysis = await engine.analyzeFile(filePath);

      expect(analysis).toBeDefined();
      expect(analysis.language).toBe('typescript');
      expect(analysis.metrics).toBeDefined();
    });
  });

  describe('getProjectMetrics', () => {
    it('should return project-level metrics', async () => {
      // Create project with multiple files
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'file1.js'),
        `function example1() { return 'test1'; }`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'file2.js'),
        `function example2() { return 'test2'; }`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'tests', 'file1.test.js'),
        `const { example1 } = require('../src/file1');
test('example1', () => {
  expect(example1()).toBe('test1');
});`
      );

      const metrics = await engine.getProjectMetrics(testProjectDir);

      expect(metrics).toBeDefined();
      expect(metrics.totalFiles).toBeDefined();
      expect(metrics.totalLines).toBeDefined();
      expect(metrics.languages).toBeDefined();
      expect(metrics.testCoverage).toBeDefined();
      expect(metrics.complexity).toBeDefined();
    });

    it('should handle empty project', async () => {
      const metrics = await engine.getProjectMetrics(testProjectDir);

      expect(metrics).toBeDefined();
      expect(metrics.totalFiles).toBe(0);
      expect(metrics.totalLines).toBe(0);
    });
  });

  describe('getSecurityIssues', () => {
    it('should detect security issues', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'insecure.js'),
        `// Insecure code examples
function badFunction() {
  eval('console.log("bad")');
  setTimeout('console.log("bad")', 100);
  
  // SQL injection vulnerability
  const query = 'SELECT * FROM users WHERE id = ' + userId;
  
  // XSS vulnerability
  document.innerHTML = userInput;
  
  // Hardcoded secrets
  const apiKey = 'sk-1234567890abcdef';
  const password = 'admin123';
}`

      const issues = await engine.getSecurityIssues(testProjectDir);

      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBeDefined();
      expect(issues[0].severity).toBeDefined();
      expect(issues[0].file).toBeDefined();
      expect(issues[0].line).toBeDefined();
      expect(issues[0].description).toBeDefined();
    });

    it('should return empty array for secure code', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'secure.js'),
        `// Secure code examples
function secureFunction(input) {
  // Proper input validation
  if (typeof input !== 'string') {
    throw new Error('Invalid input type');
  }
  
  // Sanitized output
  const sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  return sanitized;
}

// Environment variables for secrets
const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;`
      );

      const issues = await engine.getSecurityIssues(testProjectDir);

      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBe(0);
    });
  });

  describe('getPerformanceIssues', () => {
    it('should detect performance issues', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'slow.js'),
        `// Performance issues
function slowFunction() {
  // Inefficient loop
  for (let i = 0; i < 1000000; i++) {
    for (let j = 0; j < 1000000; j++) {
      // Nested loops
    }
  }
  
  // Synchronous file operations
  const fs = require('fs');
  const data = fs.readFileSync('large-file.txt');
  
  // Memory leaks
  const cache = {};
  setInterval(() => {
    cache[Date.now()] = new Array(10000).fill('data');
  }, 100);
}`

      const issues = await engine.getPerformanceIssues(testProjectDir);

      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBeDefined();
      expect(issues[0].severity).toBeDefined();
      expect(issues[0].file).toBeDefined();
      expect(issues[0].line).toBeDefined();
      expect(issues[0].description).toBeDefined();
    });
  });

  describe('getAccessibilityIssues', () => {
    it('should detect accessibility issues in HTML/JSX', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'Component.jsx'),
        `import React from 'react';

export function BadComponent() {
  return (
    <div>
      {/* Missing alt text */}
      <img src="image.jpg" />
      
      {/* Missing label */}
      <input type="text" />
      
      {/* Poor color contrast */}
      <button style={{ color: '#ccc', backgroundColor: '#ddd' }}>
        Click me
      </button>
      
      {/* Missing heading structure */}
      <h3>Subheading</h3>
      <h1>Main heading</h1>
    </div>
  );
}`
      );

      const issues = await engine.getAccessibilityIssues(testProjectDir);

      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBeDefined();
      expect(issues[0].severity).toBeDefined();
      expect(issues[0].file).toBeDefined();
      expect(issues[0].line).toBeDefined();
      expect(issues[0].description).toBeDefined();
    });
  });

  describe('caching', () => {
    it('should cache analysis results', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      const analysis1 = await engine.analyzeProject(testProjectDir);
      const analysis2 = await engine.analyzeProject(testProjectDir);

      expect(analysis1).toBe(analysis2); // Should return same object from cache
      expect(engine.cache.size).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      await engine.analyzeProject(testProjectDir);
      expect(engine.cache.size).toBeGreaterThan(0);

      engine.clearCache();
      expect(engine.cache.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent project directory', async () => {
      const nonExistentDir = path.join(testProjectDir, 'non-existent');

      await expect(engine.analyzeProject(nonExistentDir))
        .rejects.toThrow();
    });

    it('should handle unreadable files gracefully', async () => {
      // Create a file that can't be read (simulate permission error)
      const unreadableFile = path.join(testProjectDir, 'src', 'unreadable.js');
      await fs.writeFile(unreadableFile, 'content');

      // Mock fs.readFile to throw an error
      const originalReadFile = fs.readFile;
      fs.readFile = vi.fn().mockRejectedValue(new Error('Permission denied'));

      const analysis = await engine.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.error).toBeDefined();

      // Restore original function
      fs.readFile = originalReadFile;
    });

    it('should handle invalid configuration', async () => {
      const invalidEngine = new CodeAnalysisEngine({
        analysisDepth: 'invalid-depth'
      });

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      const analysis = await invalidEngine.analyzeProject(testProjectDir);

      expect(analysis).toBeDefined();
      expect(analysis.error).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should complete analysis within reasonable time', async () => {
      // Create multiple files for performance testing
      for (let i = 0; i < 20; i++) {
        await fs.writeFile(
          path.join(testProjectDir, 'src', `file${i}.js`),
          `function example${i}() {
  return 'test ${i}';
}`
        );
      }

      const startTime = Date.now();
      await engine.analyzeProject(testProjectDir);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should use cache for repeated analysis', async () => {
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'example.js'),
        `function example() { return 'test'; }`
      );

      const startTime1 = Date.now();
      await engine.analyzeProject(testProjectDir);
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      await engine.analyzeProject(testProjectDir);
      const endTime2 = Date.now();

      const firstRun = endTime1 - startTime1;
      const secondRun = endTime2 - startTime2;

      expect(secondRun).toBeLessThan(firstRun); // Cached run should be faster
    });
  });
});
