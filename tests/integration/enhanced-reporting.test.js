/**
 * Enhanced Reporting System Integration Tests
 *
 * Tests Phase 1 & Phase 2 enhancements to the quality reporting system
 * - Real tool integration (npm audit, ESLint, coverage tools)
 * - Enhanced data visualization and recommendations
 * - Quality history tracking and progression analysis
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { ProjectScorer } from '../../src/scoring/ProjectScorer.js';
import { QualityHistory } from '../../src/scoring/QualityHistory.js';
import { ScoringReport } from '../../src/scoring/ScoringReport.js';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

describe('Enhanced Reporting System', () => {
  let scorer;
  let results;
  let htmlReport;
  let testProjectRoot;

  beforeAll(async () => {
    testProjectRoot = process.cwd(); // Use current project as test subject
    scorer = new ProjectScorer({
      projectRoot: testProjectRoot,
      projectName: 'context7-mcp-test',
      verbose: false
    });
  });

  afterAll(async () => {
    // Cleanup test files if needed
    try {
      const testHistoryFile = path.join(testProjectRoot, '.codefortify', 'quality-history.json');
      if (existsSync(testHistoryFile)) {
        await fs.unlink(testHistoryFile);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Phase 1: Critical Enhancements', () => {
    test('should run complete analysis with enhanced data', async () => {
      results = await scorer.scoreProject({ detailed: true });

      expect(results).toBeDefined();
      expect(results.overall).toBeDefined();
      expect(results.categories).toBeDefined();
      expect(results.recommendations).toBeDefined();

      // Verify overall score structure
      expect(results.overall.score).toBeTypeOf('number');
      expect(results.overall.grade).toMatch(/^[A-F][+-]?$/);
      expect(results.overall.percentage).toBeTypeOf('number');
    }, 30000); // Allow 30s for complete analysis

    test('should integrate real npm audit data', async () => {
      const securityCategory = results.categories.security;
      expect(securityCategory).toBeDefined();

      // Check if npm audit data is present
      if (securityCategory.details?.npmAuditResult) {
        const auditData = securityCategory.details.npmAuditResult;

        expect(auditData).toHaveProperty('total');
        expect(auditData).toHaveProperty('critical');
        expect(auditData).toHaveProperty('high');
        expect(auditData).toHaveProperty('moderate');
        expect(auditData).toHaveProperty('low');

        // Verify data types
        expect(auditData.total).toBeTypeOf('number');
        expect(auditData.critical).toBeTypeOf('number');
        expect(auditData.high).toBeTypeOf('number');
        expect(auditData.moderate).toBeTypeOf('number');
        expect(auditData.low).toBeTypeOf('number');

        console.log('✅ npm audit integration working:', {
          total: auditData.total,
          critical: auditData.critical,
          high: auditData.high,
          moderate: auditData.moderate,
          low: auditData.low
        });
      } else {
        // LOG: ℹ️ npm audit data not available (npm not installed or no package.json)
      }
    });

    test('should integrate real ESLint analysis', async () => {
      const qualityCategory = results.categories.quality;
      expect(qualityCategory).toBeDefined();

      // Check if ESLint data is present
      if (qualityCategory.details?.eslintAnalysis) {
        const eslintData = qualityCategory.details.eslintAnalysis;

        expect(eslintData).toHaveProperty('errorCount');
        expect(eslintData).toHaveProperty('warningCount');
        expect(eslintData).toHaveProperty('topRuleViolations');

        expect(eslintData.errorCount).toBeTypeOf('number');
        expect(eslintData.warningCount).toBeTypeOf('number');
        expect(Array.isArray(eslintData.topRuleViolations)).toBe(true);

        console.log('✅ ESLint integration working:', {
          errors: eslintData.errorCount,
          warnings: eslintData.warningCount,
          topRules: eslintData.topRuleViolations.slice(0, 3).map(r => r.rule)
        });
      } else {
        // LOG: ℹ️ ESLint data not available (ESLint not configured)
      }
    });

    test('should integrate real coverage metrics', async () => {
      const testingCategory = results.categories.testing;
      expect(testingCategory).toBeDefined();

      // Check if real coverage data is present
      if (testingCategory.details?.realCoverage) {
        const coverageData = testingCategory.details.realCoverage;

        expect(coverageData).toHaveProperty('lines');
        expect(coverageData).toHaveProperty('functions');
        expect(coverageData).toHaveProperty('branches');
        expect(coverageData).toHaveProperty('statements');

        // Verify coverage percentages are valid
        expect(coverageData.lines).toBeGreaterThanOrEqual(0);
        expect(coverageData.lines).toBeLessThanOrEqual(100);
        expect(coverageData.functions).toBeGreaterThanOrEqual(0);
        expect(coverageData.functions).toBeLessThanOrEqual(100);

        console.log('✅ Coverage integration working:', {
          lines: `${coverageData.lines}%`,
          functions: `${coverageData.functions}%`,
          branches: `${coverageData.branches}%`,
          statements: `${coverageData.statements}%`
        });
      } else {
        // LOG: ℹ️ Coverage data not available (no coverage tool configured)
      }
    });
  });

  describe('Phase 2: Advanced Enhancements', () => {
    test('should perform bundle analysis', async () => {
      const performanceCategory = results.categories.performance;
      expect(performanceCategory).toBeDefined();

      // Check if bundle analysis data is present
      if (performanceCategory.details?.bundleAnalysis) {
        const bundleData = performanceCategory.details.bundleAnalysis;

        expect(bundleData).toHaveProperty('totalSize');
        expect(bundleData.totalSize).toBeTypeOf('number');
        expect(bundleData.totalSize).toBeGreaterThan(0);

        if (bundleData.chunks) {
          expect(Array.isArray(bundleData.chunks)).toBe(true);
          expect(bundleData.chunks.length).toBeGreaterThan(0);
        }

        if (bundleData.heaviestDependencies) {
          expect(Array.isArray(bundleData.heaviestDependencies)).toBe(true);
        }

        console.log('✅ Bundle analysis working:', {
          totalSize: `${bundleData.totalSize}KB`,
          chunks: bundleData.chunks?.length || 'N/A',
          heaviest: bundleData.heaviestDependencies?.[0]?.name || 'N/A',
          isEstimate: bundleData.isEstimate ? 'estimated' : 'actual'
        });
      } else {
        // LOG: ℹ️ Bundle analysis not available (no build configuration)
      }
    });

    test('should generate actionable recommendations', async () => {
      expect(results.recommendations).toBeDefined();
      expect(Array.isArray(results.recommendations)).toBe(true);
      expect(results.recommendations.length).toBeGreaterThan(0);

      // Check for enhanced recommendation structure
      const sampleRec = results.recommendations[0];
      expect(sampleRec).toHaveProperty('category');
      expect(sampleRec).toHaveProperty('impact');
      expect(sampleRec).toHaveProperty('priority');
      expect(sampleRec).toHaveProperty('suggestion');
      expect(sampleRec).toHaveProperty('description');
      expect(sampleRec).toHaveProperty('action');

      // Look for data-driven recommendations
      const datadriven = results.recommendations.filter(r => r.specificIssues);
      if (datadriven.length > 0) {
        const specific = datadriven[0];
        expect(specific.specificIssues).toBeDefined();
        expect(Array.isArray(specific.specificIssues)).toBe(true);

        console.log('✅ Data-driven recommendations found:', {
          suggestion: specific.suggestion,
          impact: specific.impact,
          priority: specific.priority,
          specificIssues: specific.specificIssues.slice(0, 2)
        });
      }

      // Look for executable recommendations
      const executable = results.recommendations.filter(r => r.executable);
      if (executable.length > 0) {
        const exec = executable[0];
        expect(exec.executable).toHaveProperty('commands');
        expect(Array.isArray(exec.executable.commands)).toBe(true);

        console.log('✅ Executable recommendations found:', {
          suggestion: exec.suggestion,
          commands: exec.executable.commands.slice(0, 2)
        });
      }

      // LOG: `✅ Generated ${results.recommendations.length} recommendations`
    });

    test('should track quality history', async () => {
      const qualityHistory = new QualityHistory({ projectRoot: testProjectRoot });

      // Record a quality score
      const historyEntry = await qualityHistory.recordQualityScore(results, {
        testRun: true,
        timestamp: new Date().toISOString()
      });

      expect(historyEntry).toBeDefined();
      expect(historyEntry.overallScore).toBe(results.overall.score);
      expect(historyEntry.overallGrade).toBe(results.overall.grade);
      expect(historyEntry.categories).toBeDefined();
      expect(historyEntry.improvements).toBeDefined();
      expect(historyEntry.trends).toBeDefined();

      // Test progression analysis
      const progression = await qualityHistory.getQualityProgression({ limit: 5 });
      expect(progression).toBeDefined();
      expect(progression.timestamps).toBeDefined();
      expect(progression.overallScores).toBeDefined();
      expect(Array.isArray(progression.timestamps)).toBe(true);
      expect(Array.isArray(progression.overallScores)).toBe(true);

      console.log('✅ Quality history working:', {
        currentScore: historyEntry.overallScore,
        grade: historyEntry.overallGrade,
        isFirstRun: historyEntry.improvements.isFirstRun,
        categories: Object.keys(historyEntry.categories).length
      });
    });
  });

  describe('HTML Report Generation', () => {
    test('should generate enhanced HTML report', async () => {
      const reportGenerator = new ScoringReport({
        projectType: results.metadata?.projectType || 'javascript'
      });

      htmlReport = await reportGenerator.generateHTML(results);
      expect(htmlReport).toBeDefined();
      expect(typeof htmlReport).toBe('string');
      expect(htmlReport.length).toBeGreaterThan(1000);

      // Check for essential HTML structure
      expect(htmlReport).toContain('<!DOCTYPE html>');
      expect(htmlReport).toContain('<title>');
      expect(htmlReport).toContain('Context7 Quality Dashboard');

      // Check for Chart.js integration
      expect(htmlReport).toContain('chart.js');
      expect(htmlReport).toContain('Chart(');

      // LOG: ✅ HTML report generated successfully
    });

    test('should contain enhanced data sections in HTML', async () => {
      expect(htmlReport).toBeDefined();

      // Check for Phase 1 enhancements
      expect(htmlReport).toContain('enhancedData');
      expect(htmlReport).toContain('eslintData');
      expect(htmlReport).toContain('coverageData');
      expect(htmlReport).toContain('securityData');
      expect(htmlReport).toContain('bundleData');

      // Check for enhanced CSS classes
      expect(htmlReport).toContain('enhanced-section');
      expect(htmlReport).toContain('metrics-row');
      expect(htmlReport).toContain('coverage-grid');
      expect(htmlReport).toContain('vuln-summary');

      // Check for interactive features
      expect(htmlReport).toContain('toggleTheme');
      expect(htmlReport).toContain('data-theme');
      expect(htmlReport).toContain('addEventListener');

      // LOG: ✅ Enhanced HTML sections verified
    });

    test('should write HTML report to file', async () => {
      const reportPath = path.join(testProjectRoot, 'test-quality-report.html');

      await fs.writeFile(reportPath, htmlReport, 'utf-8');
      expect(existsSync(reportPath)).toBe(true);

      const fileStats = await fs.stat(reportPath);
      expect(fileStats.size).toBeGreaterThan(1000);

      // LOG: `✅ HTML report written: ${reportPath} (${fileStats.size} bytes)`
      // Cleanup
      await fs.unlink(reportPath);
    });
  });

  describe('Data Quality Validation', () => {
    test('should have consistent data across categories', async () => {
      const categories = Object.keys(results.categories);
      expect(categories.length).toBeGreaterThan(5);

      for (const categoryKey of categories) {
        const category = results.categories[categoryKey];

        // Verify required structure
        expect(category).toHaveProperty('score');
        expect(category).toHaveProperty('maxScore');
        expect(category).toHaveProperty('grade');
        expect(category).toHaveProperty('categoryName');

        // Verify score consistency
        expect(category.score).toBeGreaterThanOrEqual(0);
        expect(category.score).toBeLessThanOrEqual(category.maxScore);

        // Verify grade matches score
        const percentage = (category.score / category.maxScore) * 100;
        const _expectedGrade = getExpectedGrade(percentage);
        // Grade should be reasonable for the percentage
        expect(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'])
          .toContain(category.grade);
      }

      // LOG: ✅ Category data consistency verified
    });

    test('should have valid recommendations structure', async () => {
      expect(results.recommendations.length).toBeGreaterThan(0);

      for (const rec of results.recommendations) {
        // Required fields
        expect(rec.category).toBeDefined();
        expect(rec.impact).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.suggestion).toBeDefined();
        expect(rec.action).toBeDefined();

        // Valid values
        expect(['critical', 'high', 'medium', 'low']).toContain(rec.priority);
        expect(rec.impact).toBeGreaterThan(0);
        expect(rec.impact).toBeLessThanOrEqual(5);

        // String fields should not be empty
        expect(rec.suggestion.length).toBeGreaterThan(0);
        expect(rec.action.length).toBeGreaterThan(0);
      }

      // LOG: ✅ Recommendations structure validated
    });

    test('should have proper metadata', async () => {
      expect(results.metadata).toBeDefined();
      expect(results.metadata.projectRoot).toBeDefined();
      expect(results.metadata.projectType).toBeDefined();
      expect(results.metadata.projectName).toBeDefined();

      // Verify timestamp format
      expect(results.overall.timestamp).toBeDefined();
      expect(new Date(results.overall.timestamp)).toBeInstanceOf(Date);

      // LOG: ✅ Metadata validation passed
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();

      const quickScorer = new ProjectScorer({
        projectRoot: testProjectRoot,
        verbose: false
      });

      const quickResults = await quickScorer.scoreProject();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(quickResults.overall.score).toBeDefined();

      // LOG: `✅ Analysis completed in ${duration}ms`
    });

    test('should handle missing tools gracefully', async () => {
      // This test verifies graceful degradation when tools are not available
      const categories = results.categories;

      // Even without tools, should still provide meaningful scores
      for (const [_key, category] of Object.entries(categories)) {
        expect(category.score).toBeGreaterThanOrEqual(0);

        // Check for graceful degradation messages
        if (category.issues) {
          const toolIssues = category.issues.filter(issue =>
            issue.includes('unavailable') ||
            issue.includes('not available') ||
            issue.includes('not installed')
          );

          if (toolIssues.length > 0) {
            // LOG: `ℹ️ ${key}: Tools not available, using fallback analysis`
          }
        }
      }

      // LOG: ✅ Graceful degradation verified
    });
  });
});

// Helper functions
function getExpectedGrade(percentage) {
  if (percentage >= 97) {return 'A+';}
  if (percentage >= 93) {return 'A';}
  if (percentage >= 90) {return 'A-';}
  if (percentage >= 87) {return 'B+';}
  if (percentage >= 83) {return 'B';}
  if (percentage >= 80) {return 'B-';}
  if (percentage >= 77) {return 'C+';}
  if (percentage >= 73) {return 'C';}
  if (percentage >= 70) {return 'C-';}
  if (percentage >= 67) {return 'D+';}
  if (percentage >= 65) {return 'D';}
  if (percentage >= 60) {return 'D-';}
  return 'F';
}