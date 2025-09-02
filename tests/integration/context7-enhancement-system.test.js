/**
 * Integration tests for the complete Context7 enhancement system
 * Tests the integration between all three enhancement tasks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AdvancedContextAnalyzer } from '../../src/context/AdvancedContextAnalyzer.js';
import { DynamicPatternLearner } from '../../src/learning/DynamicPatternLearner.js';
import { RealtimeQualityMonitor } from '../../src/monitoring/RealtimeQualityMonitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Context7 Enhancement System Integration', () => {
  let testProjectDir;
  let contextAnalyzer;
  let patternLearner;
  let qualityMonitor;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, 'fixtures', 'integration-test-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'tests'), { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'docs'), { recursive: true });

    // Initialize all three enhancement systems
    contextAnalyzer = new AdvancedContextAnalyzer({
      cacheEnabled: true,
      analysisDepth: 'deep'
    });

    patternLearner = new DynamicPatternLearner({
      learningEnabled: true,
      patternStoragePath: path.join(testProjectDir, '.context7', 'patterns'),
      effectivenessThreshold: 0.7
    });

    qualityMonitor = new RealtimeQualityMonitor({
      monitoringEnabled: true,
      analysisInterval: 1000,
      qualityThresholds: {
        maintainability: 0.7,
        performance: 0.8,
        security: 0.9,
        testCoverage: 0.8,
        codeComplexity: 0.6,
        documentation: 0.5,
        accessibility: 0.7
      }
    });
  });

  afterEach(async () => {
    try {
      await qualityMonitor.stop();
    } catch (error) {
      // Ignore cleanup errors
    }

    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Complete Enhancement Workflow', () => {
    it('should perform complete enhancement workflow', async () => {
      // Step 1: Create a realistic project structure
      await createRealisticProject();

      // Step 2: Analyze project context
      const projectContext = await contextAnalyzer.analyzeProjectContext(testProjectDir);
      expect(projectContext).toBeDefined();
      expect(projectContext.architecture).toBeDefined();
      expect(projectContext.style).toBeDefined();
      expect(projectContext.conventions).toBeDefined();

      // Step 3: Learn patterns from existing code
      const codeFiles = await getCodeFiles(testProjectDir);
      for (const file of codeFiles) {
        const codeContext = {
          filePath: file.path,
          code: file.content,
          context: {
            language: file.language,
            framework: projectContext.architecture.frameworks[0] || 'vanilla',
            pattern: 'existing-code'
          },
          outcome: 'success',
          metrics: {
            performance: 0.8,
            maintainability: 0.7,
            readability: 0.8
          }
        };

        await patternLearner.learnFromCode(codeContext);
      }

      // Step 4: Start quality monitoring
      await qualityMonitor.startMonitoring(testProjectDir);
      expect(qualityMonitor.isMonitoring).toBe(true);

      // Step 5: Get pattern suggestions based on context
      const suggestions = await patternLearner.getPatternSuggestions({
        language: 'javascript',
        task: 'component-creation',
        framework: 'react'
      });

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);

      // Step 6: Get quality metrics
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for analysis
      const qualityMetrics = qualityMonitor.getQualityMetrics();
      expect(qualityMetrics.isMonitoring).toBe(true);
      expect(qualityMetrics.currentAnalysis).toBeDefined();

      // Step 7: Get improvement suggestions
      const qualitySuggestions = qualityMonitor.getSuggestions();
      expect(qualitySuggestions).toBeDefined();
      expect(Array.isArray(qualitySuggestions)).toBe(true);

      // Step 8: Stop monitoring
      await qualityMonitor.stopMonitoring();
      expect(qualityMonitor.isMonitoring).toBe(false);
    });

    it('should integrate context analysis with pattern learning', async () => {
      await createRealisticProject();

      // Analyze project context
      const projectContext = await contextAnalyzer.analyzeProjectContext(testProjectDir);

      // Use context information to learn patterns
      const contextForFile = await contextAnalyzer.getContextForFile(
        path.join(testProjectDir, 'src', 'components', 'Button.jsx')
      );

      const codeContext = {
        filePath: contextForFile.filePath,
        code: contextForFile.fileContext.content,
        context: {
          ...contextForFile.projectContext.architecture,
          ...contextForFile.projectContext.style,
          language: 'jsx',
          framework: 'react'
        },
        outcome: 'success',
        metrics: {
          performance: 0.9,
          maintainability: 0.8,
          readability: 0.9
        }
      };

      const learnResult = await patternLearner.learnFromCode(codeContext);
      expect(learnResult.success).toBe(true);

      // Get suggestions using the learned context
      const suggestions = await patternLearner.getPatternSuggestions({
        language: 'jsx',
        framework: 'react',
        architecture: projectContext.architecture.patterns[0]
      });

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should integrate pattern learning with quality monitoring', async () => {
      await createRealisticProject();

      // Learn patterns from code
      const codeFiles = await getCodeFiles(testProjectDir);
      for (const file of codeFiles) {
        const codeContext = {
          filePath: file.path,
          code: file.content,
          context: {
            language: file.language,
            pattern: 'existing-code'
          },
          outcome: 'success',
          metrics: {
            performance: 0.8,
            maintainability: 0.7,
            readability: 0.8
          }
        };

        await patternLearner.learnFromCode(codeContext);
      }

      // Start quality monitoring
      await qualityMonitor.startMonitoring(testProjectDir);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get quality analysis
      const qualityAnalysis = qualityMonitor.getQualityMetrics();
      expect(qualityAnalysis.currentAnalysis).toBeDefined();

      // Update pattern effectiveness based on quality metrics
      const learnedPatterns = await patternLearner.getLearnedPatterns();
      if (learnedPatterns.length > 0) {
        const pattern = learnedPatterns[0];
        const feedback = {
          patternId: pattern.id,
          outcome: qualityAnalysis.currentAnalysis.overallScore > 0.7 ? 'success' : 'failure',
          metrics: {
            performance: qualityAnalysis.currentAnalysis.categories.performance.score,
            maintainability: qualityAnalysis.currentAnalysis.categories.maintainability.score,
            readability: qualityAnalysis.currentAnalysis.categories.documentation.score
          },
          userRating: Math.round(qualityAnalysis.currentAnalysis.overallScore * 5)
        };

        const updateResult = await patternLearner.updatePatternEffectiveness(feedback);
        expect(updateResult.success).toBe(true);
      }
    });

    it('should integrate all three systems for continuous improvement', async () => {
      await createRealisticProject();

      // Phase 1: Initial analysis and learning
      const initialContext = await contextAnalyzer.analyzeProjectContext(testProjectDir);
      const codeFiles = await getCodeFiles(testProjectDir);

      for (const file of codeFiles) {
        const codeContext = {
          filePath: file.path,
          code: file.content,
          context: {
            language: file.language,
            framework: initialContext.architecture.frameworks[0] || 'vanilla',
            pattern: 'existing-code'
          },
          outcome: 'success',
          metrics: {
            performance: 0.8,
            maintainability: 0.7,
            readability: 0.8
          }
        };

        await patternLearner.learnFromCode(codeContext);
      }

      // Phase 2: Start monitoring
      await qualityMonitor.startMonitoring(testProjectDir);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Phase 3: Get initial quality baseline
      const initialQuality = qualityMonitor.getQualityMetrics();
      expect(initialQuality.currentAnalysis).toBeDefined();

      // Phase 4: Apply pattern suggestions to improve code
      const suggestions = await patternLearner.getPatternSuggestions({
        language: 'javascript',
        task: 'code-improvement'
      });

      if (suggestions.length > 0) {
        // Simulate applying a suggestion by creating improved code
        const improvedCode = `/**
 * Improved version based on learned patterns
 * @param {string} message - Message to display
 * @returns {string} Formatted message
 */
function improvedFunction(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message provided');
  }
  
  return \`Enhanced: \${message.trim()}\`;
}

module.exports = { improvedFunction };`;

        await fs.writeFile(
          path.join(testProjectDir, 'src', 'improved.js'),
          improvedCode
        );

        // Learn from the improved code
        const improvedContext = {
          filePath: path.join(testProjectDir, 'src', 'improved.js'),
          code: improvedCode,
          context: {
            language: 'javascript',
            pattern: 'improved-code',
            basedOnSuggestion: suggestions[0].patternId
          },
          outcome: 'success',
          metrics: {
            performance: 0.9,
            maintainability: 0.9,
            readability: 0.9
          }
        };

        await patternLearner.learnFromCode(improvedContext);
      }

      // Phase 5: Wait for quality monitoring to detect improvements
      await new Promise(resolve => setTimeout(resolve, 200));

      // Phase 6: Verify improvement
      const finalQuality = qualityMonitor.getQualityMetrics();
      expect(finalQuality.currentAnalysis).toBeDefined();

      // Phase 7: Get updated suggestions
      const updatedSuggestions = qualityMonitor.getSuggestions();
      expect(updatedSuggestions).toBeDefined();

      // Phase 8: Export learned patterns for future use
      const exportPath = path.join(testProjectDir, 'learned-patterns.json');
      const exportResult = await patternLearner.exportPatterns(exportPath);
      expect(exportResult.success).toBe(true);

      // Verify export file exists
      const exportExists = await fs.access(exportPath).then(() => true).catch(() => false);
      expect(exportExists).toBe(true);

      await qualityMonitor.stopMonitoring();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle errors gracefully across all systems', async () => {
      await createRealisticProject();

      // Test context analyzer error handling
      const invalidContext = await contextAnalyzer.analyzeProjectContext('/invalid/path');
      expect(invalidContext).toBeDefined(); // Should return error context

      // Test pattern learner error handling
      const invalidCodeContext = {
        // Missing required fields
        code: 'function test() { return "test"; }'
      };

      await expect(patternLearner.learnFromCode(invalidCodeContext))
        .rejects.toThrow();

      // Test quality monitor error handling
      await expect(qualityMonitor.startMonitoring('/invalid/path'))
        .rejects.toThrow();
    });

    it('should recover from partial failures', async () => {
      await createRealisticProject();

      // Simulate partial failure in context analysis
      const originalDetect = contextAnalyzer.architectureDetector.detectPatterns;
      contextAnalyzer.architectureDetector.detectPatterns = vi.fn()
        .mockRejectedValue(new Error('Architecture detection failed'));

      const context = await contextAnalyzer.analyzeProjectContext(testProjectDir);
      expect(context).toBeDefined();
      expect(context.architecture.error).toBeDefined();

      // Restore original method
      contextAnalyzer.architectureDetector.detectPatterns = originalDetect;

      // System should still work with other components
      const codeFiles = await getCodeFiles(testProjectDir);
      if (codeFiles.length > 0) {
        const codeContext = {
          filePath: codeFiles[0].path,
          code: codeFiles[0].content,
          context: { language: codeFiles[0].language },
          outcome: 'success',
          metrics: { performance: 0.8, maintainability: 0.7 }
        };

        const learnResult = await patternLearner.learnFromCode(codeContext);
        expect(learnResult.success).toBe(true);
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large projects efficiently', async () => {
      // Create a larger project structure
      await createLargeProject();

      const startTime = Date.now();

      // Test all three systems with larger project
      const context = await contextAnalyzer.analyzeProjectContext(testProjectDir);
      expect(context).toBeDefined();

      const codeFiles = await getCodeFiles(testProjectDir);
      for (const file of codeFiles.slice(0, 10)) { // Limit to first 10 files for performance
        const codeContext = {
          filePath: file.path,
          code: file.content,
          context: { language: file.language },
          outcome: 'success',
          metrics: { performance: 0.8, maintainability: 0.7 }
        };

        await patternLearner.learnFromCode(codeContext);
      }

      await qualityMonitor.startMonitoring(testProjectDir);
      await new Promise(resolve => setTimeout(resolve, 100));
      await qualityMonitor.stopMonitoring();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should maintain performance with caching', async () => {
      await createRealisticProject();

      // First run
      const startTime1 = Date.now();
      const context1 = await contextAnalyzer.analyzeProjectContext(testProjectDir);
      const endTime1 = Date.now();

      // Second run (should use cache)
      const startTime2 = Date.now();
      const context2 = await contextAnalyzer.analyzeProjectContext(testProjectDir);
      const endTime2 = Date.now();

      expect(context1).toBe(context2); // Should return same object from cache
      expect(endTime2 - startTime2).toBeLessThan(endTime1 - startTime1); // Cached should be faster
    });
  });

  describe('Data Persistence and State Management', () => {
    it('should persist learned patterns across sessions', async () => {
      await createRealisticProject();

      // Learn patterns in first session
      const codeFiles = await getCodeFiles(testProjectDir);
      for (const file of codeFiles) {
        const codeContext = {
          filePath: file.path,
          code: file.content,
          context: { language: file.language },
          outcome: 'success',
          metrics: { performance: 0.8, maintainability: 0.7 }
        };

        await patternLearner.learnFromCode(codeContext);
      }

      const patterns1 = await patternLearner.getLearnedPatterns();
      expect(patterns1.length).toBeGreaterThan(0);

      // Create new learner instance (simulating new session)
      const newPatternLearner = new DynamicPatternLearner({
        learningEnabled: true,
        patternStoragePath: path.join(testProjectDir, '.context7', 'patterns'),
        effectivenessThreshold: 0.7
      });

      // Patterns should be loaded from storage
      const patterns2 = await newPatternLearner.getLearnedPatterns();
      expect(patterns2.length).toBe(patterns1.length);
    });

    it('should maintain quality monitoring state', async () => {
      await createRealisticProject();

      await qualityMonitor.startMonitoring(testProjectDir);
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics1 = qualityMonitor.getQualityMetrics();
      expect(metrics1.isMonitoring).toBe(true);

      // Simulate monitoring for a while
      await new Promise(resolve => setTimeout(resolve, 200));

      const metrics2 = qualityMonitor.getQualityMetrics();
      expect(metrics2.isMonitoring).toBe(true);
      expect(metrics2.historySize).toBeGreaterThanOrEqual(metrics1.historySize);

      await qualityMonitor.stopMonitoring();
    });
  });

  // Helper functions
  async function createRealisticProject() {
    // Create package.json
    await fs.writeFile(
      path.join(testProjectDir, 'package.json'),
      JSON.stringify({
        name: 'integration-test-project',
        version: '1.0.0',
        type: 'module',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'express': '^4.18.0'
        },
        devDependencies: {
          'jest': '^29.0.0',
          'eslint': '^8.57.1',
          'prettier': '^3.6.2'
        },
        scripts: {
          'test': 'jest',
          'lint': 'eslint src/',
          'format': 'prettier --write src/'
        }
      }, null, 2)
    );

    // Create React components
    await fs.mkdir(path.join(testProjectDir, 'src', 'components'), { recursive: true });
    await fs.writeFile(
      path.join(testProjectDir, 'src', 'components', 'Button.jsx'),
      `import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable button component
 * @param {Object} props - Component props
 * @param {string} props.children - Button text
 * @param {Function} props.onClick - Click handler
 * @param {string} props.variant - Button variant
 * @returns {JSX.Element} Button component
 */
export function Button({ children, onClick, variant = 'primary' }) {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
      aria-label={children}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger'])
};`
    );

    // Create utility functions
    await fs.mkdir(path.join(testProjectDir, 'src', 'utils'), { recursive: true });
    await fs.writeFile(
      path.join(testProjectDir, 'src', 'utils', 'helpers.js'),
      `/**
 * Utility functions for the application
 */

/**
 * Formats a date string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) {
    throw new Error('Date is required');
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString();
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}`
    );

    // Create tests
    await fs.writeFile(
      path.join(testProjectDir, 'tests', 'Button.test.jsx'),
      `import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Button } from '../src/components/Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});`
    );

    // Create documentation
    await fs.writeFile(
      path.join(testProjectDir, 'README.md'),
      `# Integration Test Project

This is a test project for Context7 enhancement system integration.

## Features

- React components with proper TypeScript support
- Utility functions with JSDoc documentation
- Comprehensive test coverage
- ESLint and Prettier configuration

## Development

\`\`\`bash
npm install
npm test
npm run lint
npm run format
\`\`\`
`
    );
  }

  async function createLargeProject() {
    await createRealisticProject();

    // Add more files to make it larger
    for (let i = 0; i < 20; i++) {
      await fs.writeFile(
        path.join(testProjectDir, 'src', `module${i}.js`),
        `/**
 * Module ${i} - Generated for testing
 */

export function module${i}Function() {
  return 'Module ${i} result';
}

export class Module${i}Class {
  constructor() {
    this.id = ${i};
  }
  
  getValue() {
    return this.id * 2;
  }
}`
      );
    }
  }

  async function getCodeFiles(projectDir) {
    const files = [];
    const srcDir = path.join(projectDir, 'src');

    try {
      const entries = await fs.readdir(srcDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(srcDir, entry.name);
          const content = await fs.readFile(filePath, 'utf8');
          const extension = path.extname(entry.name);

          let language = 'javascript';
          if (extension === '.jsx') {language = 'jsx';}
          else if (extension === '.ts') {language = 'typescript';}
          else if (extension === '.tsx') {language = 'tsx';}

          files.push({
            path: filePath,
            content,
            language
          });
        }
      }
    } catch (error) {
      // Handle directory read errors
    }

    return files;
  }
});
