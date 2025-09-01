/**
 * ScoringReport Unit Tests
 *
 * Tests the report generation functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringReport } from '../../src/scoring/ScoringReport.js';

describe('ScoringReport', () => {
  let report;
  let mockResults;

  beforeEach(() => {
    report = new ScoringReport();

    mockResults = {
      overall: {
        score: 75,
        maxScore: 100,
        percentage: 75,
        grade: 'C+',
        timestamp: new Date().toISOString()
      },
      categories: {
        structure: {
          categoryName: 'Code Structure & Architecture',
          score: 15,
          maxScore: 20,
          grade: 'B',
          issues: ['Large modules detected', 'Inconsistent naming']
        },
        quality: {
          categoryName: 'Code Quality & Maintainability',
          score: 18,
          maxScore: 20,
          grade: 'A-',
          issues: []
        }
      },
      recommendations: [
        {
          suggestion: 'Improve test coverage',
          description: 'Add more unit tests',
          impact: 5,
          category: 'testing'
        },
        {
          suggestion: 'Refactor large modules',
          description: 'Break down modules over 300 lines',
          impact: 3,
          category: 'structure'
        }
      ],
      metadata: {
        projectName: 'test-project',
        projectType: 'javascript',
        version: '1.0.0'
      }
    };
  });

  describe('Performance Level Classification', () => {
    it('should classify performance levels correctly', () => {
      expect(report.getPerformanceLevel(90)).toBe('excellent');
      expect(report.getPerformanceLevel(75)).toBe('good');
      expect(report.getPerformanceLevel(60)).toBe('warning');
      expect(report.getPerformanceLevel(40)).toBe('poor');
    });
  });

  describe('Score Descriptions', () => {
    it('should provide appropriate score descriptions', () => {
      expect(report.getScoreDescription(96)).toContain('Outstanding');
      expect(report.getScoreDescription(88)).toContain('Very good');
      expect(report.getScoreDescription(82)).toContain('Good quality');
      expect(report.getScoreDescription(75)).toContain('Acceptable');
      expect(report.getScoreDescription(65)).toContain('improvement');
      expect(report.getScoreDescription(45)).toContain('attention');
    });
  });

  describe('Category Descriptions', () => {
    it('should provide descriptions for all categories', () => {
      const categories = [
        'Code Structure & Architecture',
        'Code Quality & Maintainability',
        'Performance & Optimization',
        'Testing & Documentation',
        'Security & Error Handling',
        'Developer Experience',
        'Completeness & Production Readiness'
      ];

      categories.forEach(category => {
        const description = report.getCategoryDescription(category);
        expect(description).toBeDefined();
        expect(description.length).toBeGreaterThan(0);
        expect(description).not.toBe('Category analysis and recommendations');
      });
    });

    it('should provide default description for unknown categories', () => {
      const description = report.getCategoryDescription('Unknown Category');
      expect(description).toBe('Category analysis and recommendations');
    });
  });

  describe('HTML Report Generation', () => {
    it('should generate valid HTML structure', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<head>');
      expect(html).toContain('<body');
      expect(html).toContain('</html>');
    });

    it('should include project information', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('test-project');
      expect(html).toContain('75'); // score
      expect(html).toContain('C+'); // grade
    });

    it('should include Chart.js integration', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('chart.js');
      expect(html).toContain('Chart(');
      expect(html).toContain('doughnut');
      expect(html).toContain('radar');
    });

    it('should include FontAwesome icons', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('font-awesome');
      expect(html).toContain('fas fa-');
    });

    it('should include all categories', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('Code Structure & Architecture');
      expect(html).toContain('Code Quality & Maintainability');
    });

    it('should display issues correctly', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('Large modules detected');
      expect(html).toContain('Inconsistent naming');
      expect(html).toContain('Issues Found (2)');
    });

    it('should display recommendations', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('Priority Recommendations');
      expect(html).toContain('Improve test coverage');
      expect(html).toContain('+5pts');
      expect(html).toContain('Refactor large modules');
    });

    it('should include theme toggle functionality', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('toggleTheme');
      expect(html).toContain('data-theme="dark"');
      expect(html).toContain('theme-toggle');
    });

    it('should include search functionality', async () => {
      const html = await report.generateHTML(mockResults);

      expect(html).toContain('searchInput');
      expect(html).toContain('Search report content');
    });

    it('should handle missing recommendations', async () => {
      const resultsWithoutRecs = { ...mockResults };
      delete resultsWithoutRecs.recommendations;

      const html = await report.generateHTML(resultsWithoutRecs);
      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should format scores with proper precision', async () => {
      const resultsWithDecimals = {
        ...mockResults,
        overall: { ...mockResults.overall, score: 75.6666666666 },
        categories: {
          structure: {
            ...mockResults.categories.structure,
            score: 15.333333333
          }
        }
      };

      const html = await report.generateHTML(resultsWithDecimals);
      expect(html).toContain('76'); // Rounded overall score
      expect(html).toContain('15.3'); // Category score with 1 decimal
    });
  });

  describe('JSON Report Generation', () => {
    it('should generate valid JSON', async () => {
      const json = await report.generateJSON(mockResults);

      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.overall).toEqual(mockResults.overall);
      expect(parsed.categories).toEqual(mockResults.categories);
    });

    it('should format JSON with proper indentation', async () => {
      const json = await report.generateJSON(mockResults);

      expect(json).toContain('  '); // Should have 2-space indentation
      expect(json.split('\n').length).toBeGreaterThan(10); // Should be multi-line
    });
  });

  describe('Markdown Report Generation', () => {
    it('should generate valid markdown', async () => {
      const markdown = await report.generateMarkdown(mockResults);

      expect(markdown).toContain('# Context7 Quality Score Report');
      expect(markdown).toContain('## Overall Results');
      expect(markdown).toContain('## Category Breakdown');
    });

    it('should include project metadata', async () => {
      const markdown = await report.generateMarkdown(mockResults);

      expect(markdown).toContain('**Project:** test-project');
      expect(markdown).toContain('**Type:** javascript');
      expect(markdown).toContain('**Score:** 75/100 (C+)');
    });

    it('should include category information', async () => {
      const markdown = await report.generateMarkdown(mockResults);

      expect(markdown).toContain('### ⚡ Code Structure & Architecture');
      expect(markdown).toContain('- **Score:** 15/20 (75%)');
      expect(markdown).toContain('- Large modules detected');
    });

    it('should include recommendations when present', async () => {
      const markdown = await report.generateMarkdown(mockResults);

      expect(markdown).toContain('## 🎯 Priority Recommendations');
      expect(markdown).toContain('1. **[+5pts]** Improve test coverage');
      expect(markdown).toContain('2. **[+3pts]** Refactor large modules');
    });

    it('should use appropriate emojis based on scores', async () => {
      const highScoreResults = {
        ...mockResults,
        categories: {
          structure: { ...mockResults.categories.structure, score: 18 }
        }
      };

      const markdown = await report.generateMarkdown(highScoreResults);
      expect(markdown).toContain('### ✅'); // Should use checkmark for high scores
    });
  });

  describe('Browser Opening', () => {
    it('should handle browser opening on different platforms', () => {
      // Test the platform detection logic
      // We can't easily test actual browser opening without mocking exec
      // But we can test that the method exists and handles errors gracefully
      expect(typeof report.openInBrowser).toBe('function');
    });
  });
});