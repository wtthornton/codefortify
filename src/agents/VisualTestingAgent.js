/**
 * VisualTestingAgent - Revolutionary Visual Testing Integration
 *
 * Extends the continuous enhancement system with visual testing capabilities:
 * - Playwright integration for screenshot comparison
 * - WCAG accessibility validation
 * - UI regression detection
 * - Performance visual metrics
 * - Component preview server
 *
 * This agent works within enhancement loops to ensure visual quality
 * and accessibility compliance as code evolves.
 */

import { IAnalysisAgent } from './IAnalysisAgent.js';
import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import AxeBuilder from 'axe-playwright';

export class VisualTestingAgent extends IAnalysisAgent {
  constructor(config = {}) {
    super({
      ...config,
      agentType: 'visual_testing',
      priority: 2, // Run after structure analysis
      dependencies: ['structure'], // Needs structure analysis first
      maxConcurrency: 1 // Visual testing is resource intensive
    });

    // Visual testing configuration
    this.config = {
      browsers: config.browsers || ['chromium'], // chromium, firefox, webkit
      viewports: config.viewports || [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1366, height: 768 },  // Laptop
        { width: 768, height: 1024 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ],
      screenshotOptions: {
        threshold: config.threshold || 0.2, // Visual diff threshold
        animations: 'disabled',
        mode: 'match'
      },
      accessibility: {
        enabled: config.accessibility !== false,
        standards: config.standards || ['wcag2a', 'wcag2aa'],
        reportFormat: 'detailed'
      },
      performance: {
        enabled: config.performance !== false,
        metrics: ['CLS', 'LCP', 'FID', 'FCP']
      },
      ...config
    };

    // State management
    this.browsers = new Map();
    this.screenshotsDir = path.join(process.cwd(), '.codefortify', 'visual-tests');
    this.baselineDir = path.join(this.screenshotsDir, 'baseline');
    this.currentDir = path.join(this.screenshotsDir, 'current');
    this.diffDir = path.join(this.screenshotsDir, 'diff');

    // Component server for testing isolated components
    this.componentServer = null;
    this.componentServerPort = config.componentServerPort || 3001;

    // Metrics
    this.testMetrics = {
      totalScreenshots: 0,
      visualRegressions: 0,
      accessibilityViolations: 0,
      performanceIssues: 0,
      testDuration: 0
    };
  }

  /**
   * Main analysis method - runs visual tests as part of enhancement cycle
   */
  async runAnalysis() {
    const startTime = Date.now();

    try {
      // Initialize visual testing environment
      await this.initialize();

      // Discover testable components/pages
      const testTargets = await this.discoverTestTargets();

      // Run visual tests across different browsers and viewports
      const visualResults = await this.runVisualTests(testTargets);

      // Run accessibility tests
      const accessibilityResults = await this.runAccessibilityTests(testTargets);

      // Run performance visual metrics
      const performanceResults = await this.runPerformanceTests(testTargets);

      // Aggregate results for enhancement cycle
      const results = this.aggregateResults({
        visual: visualResults,
        accessibility: accessibilityResults,
        performance: performanceResults
      });

      // Generate insights and recommendations
      results.insights = this.generateInsights(results);
      results.recommendations = this.generateRecommendations(results);

      // Update metrics
      this.testMetrics.testDuration = Date.now() - startTime;
      results.metrics = { ...this.testMetrics };

      return results;

    } catch (error) {
      return this.handleError(error, 'Visual testing analysis failed');
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize visual testing environment
   */
  async initialize() {
    // Create screenshot directories
    await this.ensureDirectories();

    // Initialize browsers based on config
    for (const browserName of this.config.browsers) {
      if (browserName === 'chromium') {
        this.browsers.set('chromium', await chromium.launch({ headless: true }));
      } else if (browserName === 'firefox') {
        this.browsers.set('firefox', await firefox.launch({ headless: true }));
      } else if (browserName === 'webkit') {
        this.browsers.set('webkit', await webkit.launch({ headless: true }));
      }
    }

    // Start component preview server if needed
    await this.startComponentServer();
  }

  /**
   * Discover components and pages that can be visually tested
   */
  async discoverTestTargets() {
    const targets = [];

    try {
      // Look for React components
      const componentFiles = await this.findComponentFiles();

      // Look for HTML files and templates
      const htmlFiles = await this.findHtmlFiles();

      // Look for existing visual test configurations
      await this.findExistingTestConfigs();

      // Create test targets from discovered files
      for (const file of componentFiles) {
        targets.push({
          type: 'component',
          file: file,
          url: await this.generateComponentUrl(file),
          name: this.extractComponentName(file)
        });
      }

      for (const file of htmlFiles) {
        targets.push({
          type: 'page',
          file: file,
          url: `file://${path.resolve(file)}`,
          name: path.basename(file, path.extname(file))
        });
      }

      return targets;

    } catch (error) {
      console.warn('⚠️  Could not discover all test targets:', error.message);
      return targets;
    }
  }

  /**
   * Run visual regression tests
   */
  async runVisualTests(testTargets) {
    const results = {
      passed: 0,
      failed: 0,
      regressions: [],
      newScreenshots: []
    };

    for (const target of testTargets) {
      for (const [browserName, browser] of this.browsers) {
        for (const viewport of this.config.viewports) {

          const testId = this.generateTestId(target, browserName, viewport);

          try {
            const page = await browser.newPage();
            await page.setViewportSize(viewport);

            // Navigate to target
            if (target.url.startsWith('http')) {
              await page.goto(target.url, { waitUntil: 'networkidle' });
            } else {
              await page.goto(target.url);
            }

            // Wait for content to stabilize
            await page.waitForTimeout(1000);

            // Take screenshot
            const screenshotPath = path.join(this.currentDir, `${testId}.png`);
            await page.screenshot({
              path: screenshotPath,
              fullPage: true,
              animations: 'disabled'
            });

            // Compare with baseline if it exists
            const baselinePath = path.join(this.baselineDir, `${testId}.png`);
            const hasBaseline = await this.fileExists(baselinePath);

            if (hasBaseline) {
              const diffResult = await this.compareScreenshots(baselinePath, screenshotPath, testId);

              if (diffResult.different) {
                results.failed++;
                results.regressions.push({
                  testId,
                  target: target.name,
                  browser: browserName,
                  viewport,
                  diffPercentage: diffResult.percentage,
                  diffPath: diffResult.diffPath
                });
              } else {
                results.passed++;
              }
            } else {
              // First time running - create baseline
              await fs.copyFile(screenshotPath, baselinePath);
              results.newScreenshots.push({
                testId,
                target: target.name,
                browser: browserName,
                viewport,
                baselinePath
              });
            }

            await page.close();
            this.testMetrics.totalScreenshots++;

          } catch (error) {
            console.warn(`⚠️  Visual test failed for ${testId}:`, error.message);
            results.failed++;
          }
        }
      }
    }

    this.testMetrics.visualRegressions = results.regressions.length;
    return results;
  }

  /**
   * Run accessibility tests using Playwright's accessibility features
   */
  async runAccessibilityTests(testTargets) {
    const results = {
      passed: 0,
      failed: 0,
      violations: [],
      coverage: 0
    };

    if (!this.config.accessibility.enabled) {
      return results;
    }

    for (const target of testTargets) {
      try {
        const browser = this.browsers.get('chromium'); // Use Chromium for accessibility testing
        const page = await browser.newPage();

        // Navigate to target
        await page.goto(target.url, { waitUntil: 'networkidle' });

        // Run accessibility scan
        const violations = await this.runAccessibilityScan(page, target);

        if (violations.length === 0) {
          results.passed++;
        } else {
          results.failed++;
          results.violations.push(...violations.map(v => ({
            ...v,
            target: target.name,
            file: target.file
          })));
        }

        await page.close();

      } catch (error) {
        console.warn(`⚠️  Accessibility test failed for ${target.name}:`, error.message);
        results.failed++;
      }
    }

    this.testMetrics.accessibilityViolations = results.violations.length;
    results.coverage = testTargets.length > 0 ? (results.passed / testTargets.length) * 100 : 0;

    return results;
  }

  /**
   * Run performance visual metrics tests
   */
  async runPerformanceTests(testTargets) {
    const results = {
      metrics: {},
      issues: [],
      recommendations: []
    };

    if (!this.config.performance.enabled) {
      return results;
    }

    for (const target of testTargets) {
      try {
        const browser = this.browsers.get('chromium');
        const page = await browser.newPage();

        // Enable performance monitoring
        await page.coverage.startCSSCoverage();
        await page.coverage.startJSCoverage();

        // Navigate and measure
        const response = await page.goto(target.url, { waitUntil: 'networkidle' });

        // Get Core Web Vitals
        const metrics = await page.evaluate(() => {
          return new Promise((resolve) => {
            if (typeof PerformanceObserver === 'undefined') {
              resolve({});
              return;
            }
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const vitals = {};

              entries.forEach((entry) => {
                if (entry.entryType === 'largest-contentful-paint') {
                  vitals.LCP = entry.startTime;
                }
                if (entry.entryType === 'first-input') {
                  vitals.FID = entry.processingStart - entry.startTime;
                }
                if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                  vitals.CLS = (vitals.CLS || 0) + entry.value;
                }
              });

              resolve(vitals);
            });

            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

            // Fallback timeout
            setTimeout(() => resolve({}), 3000);
          });
        });

        // Stop coverage and get results
        const [jsCoverage, cssCoverage] = await Promise.all([
          page.coverage.stopJSCoverage(),
          page.coverage.stopCSSCoverage()
        ]);

        // Calculate unused CSS/JS
        const unusedBytes = this.calculateUnusedBytes(jsCoverage, cssCoverage);

        results.metrics[target.name] = {
          ...metrics,
          unusedCSS: unusedBytes.css,
          unusedJS: unusedBytes.js,
          loadTime: response ? await response.request().timing() : null
        };

        // Check for performance issues
        if (metrics.LCP > 2500) {
          results.issues.push({
            type: 'LCP',
            target: target.name,
            value: metrics.LCP,
            severity: 'high',
            message: 'Largest Contentful Paint is too slow'
          });
        }

        if (metrics.CLS > 0.1) {
          results.issues.push({
            type: 'CLS',
            target: target.name,
            value: metrics.CLS,
            severity: 'medium',
            message: 'Cumulative Layout Shift is too high'
          });
        }

        await page.close();

      } catch (error) {
        console.warn(`⚠️  Performance test failed for ${target.name}:`, error.message);
      }
    }

    this.testMetrics.performanceIssues = results.issues.length;
    return results;
  }

  /**
   * Generate comprehensive insights from visual testing results
   */
  generateInsights(results) {
    const insights = [];

    // Visual regression insights
    if (results.visual.regressions.length > 0) {
      insights.push({
        type: 'WARNING',
        category: 'visual',
        message: `${results.visual.regressions.length} visual regressions detected`,
        impact: 'high',
        details: results.visual.regressions.map(r => `${r.target} (${r.diffPercentage}% different)`)
      });
    } else if (results.visual.passed > 0) {
      insights.push({
        type: 'SUCCESS',
        category: 'visual',
        message: `All ${results.visual.passed} visual tests passed`,
        impact: 'positive'
      });
    }

    // Accessibility insights
    if (results.accessibility.violations.length > 0) {
      const criticalViolations = results.accessibility.violations.filter(v => v.impact === 'critical');
      insights.push({
        type: 'CRITICAL',
        category: 'accessibility',
        message: `${results.accessibility.violations.length} accessibility violations found (${criticalViolations.length} critical)`,
        impact: 'critical',
        details: criticalViolations.map(v => v.description)
      });
    }

    // Performance insights
    if (results.performance.issues.length > 0) {
      const highImpactIssues = results.performance.issues.filter(i => i.severity === 'high');
      if (highImpactIssues.length > 0) {
        insights.push({
          type: 'WARNING',
          category: 'performance',
          message: `${highImpactIssues.length} high-impact performance issues detected`,
          impact: 'high',
          details: highImpactIssues.map(i => i.message)
        });
      }
    }

    return insights;
  }

  /**
   * Generate actionable recommendations for improvement
   */
  generateRecommendations(results) {
    const recommendations = [];

    // Visual regression recommendations
    if (results.visual.regressions.length > 0) {
      recommendations.push({
        category: 'visual',
        priority: 'high',
        action: 'Review visual regressions',
        description: 'Check diff images and update components as needed',
        effort: 'medium',
        files: results.visual.regressions.map(r => r.diffPath)
      });
    }

    // Accessibility recommendations
    if (results.accessibility.violations.length > 0) {
      recommendations.push({
        category: 'accessibility',
        priority: 'critical',
        action: 'Fix accessibility violations',
        description: 'Address WCAG compliance issues to improve user experience',
        effort: 'high',
        violations: results.accessibility.violations.length
      });
    }

    // Performance recommendations
    if (results.performance.issues.length > 0) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        action: 'Optimize performance metrics',
        description: 'Improve Core Web Vitals for better user experience',
        effort: 'medium',
        issues: results.performance.issues.length
      });
    }

    return recommendations;
  }

  // Utility methods
  async ensureDirectories() {
    const dirs = [this.screenshotsDir, this.baselineDir, this.currentDir, this.diffDir];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async findComponentFiles() {
    // Implementation depends on project structure
    // Look for React, Vue, Angular components
    return [];
  }

  async findHtmlFiles() {
    // Look for HTML files in the project
    return [];
  }

  async findExistingTestConfigs() {
    // Look for existing visual test configurations
    return [];
  }

  generateTestId(target, browser, viewport) {
    const input = `${target.name}-${browser}-${viewport.width}x${viewport.height}`;
    return createHash('md5').update(input).digest('hex').substring(0, 8);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async compareScreenshots(baselinePath, currentPath, testId) {
    try {
      // Read baseline and current images
      const [baselineBuffer, currentBuffer] = await Promise.all([
        fs.readFile(baselinePath),
        fs.readFile(currentPath)
      ]);

      // Parse PNG images
      const baselineImg = PNG.sync.read(baselineBuffer);
      const currentImg = PNG.sync.read(currentBuffer);

      // Images must have same dimensions for pixel-by-pixel comparison
      if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
        return {
          different: true,
          percentage: 100,
          error: 'Image dimensions do not match'
        };
      }

      // Create diff image
      const diffImg = new PNG({ width: baselineImg.width, height: baselineImg.height });

      // Calculate pixel differences
      const numDiffPixels = pixelmatch(
        baselineImg.data,
        currentImg.data,
        diffImg.data,
        baselineImg.width,
        baselineImg.height,
        {
          threshold: this.config.screenshotOptions.threshold,
          alpha: 0.2,
          antialiasing: true
        }
      );

      // Calculate percentage difference
      const totalPixels = baselineImg.width * baselineImg.height;
      const diffPercentage = ((numDiffPixels / totalPixels) * 100).toFixed(2);
      const different = parseFloat(diffPercentage) > (this.config.screenshotOptions.threshold * 100);

      if (different) {
        // Save diff image
        const diffPath = path.join(this.diffDir, `${testId}-diff.png`);
        const diffBuffer = PNG.sync.write(diffImg);
        await fs.writeFile(diffPath, diffBuffer);

        return {
          different: true,
          percentage: diffPercentage,
          diffPixels: numDiffPixels,
          totalPixels: totalPixels,
          diffPath
        };
      }

      return {
        different: false,
        percentage: diffPercentage,
        diffPixels: numDiffPixels,
        totalPixels: totalPixels
      };

    } catch (error) {
      return {
        different: true,
        percentage: 100,
        error: error.message
      };
    }
  }

  async runAccessibilityScan(page, target) {
    const violations = [];

    try {
      // Use axe-playwright for comprehensive accessibility scanning
      const axeResults = await new AxeBuilder({ page })
        .withTags(this.config.accessibility.standards) // e.g., ['wcag2a', 'wcag2aa']
        .analyze();

      // Transform axe results to our format
      for (const violation of axeResults.violations) {
        violations.push({
          id: violation.id,
          description: violation.description,
          impact: violation.impact, // 'minor', 'moderate', 'serious', 'critical'
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          nodes: violation.nodes.map(node => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
            any: node.any,
            all: node.all,
            none: node.none
          })),
          target: target.name,
          file: target.file
        });
      }

      // Log accessibility results if verbose
      if (this.config.verbose && violations.length > 0) {
        console.log(`⚠️  Found ${violations.length} accessibility violations in ${target.name}`);
        violations.forEach(v => {
          console.log(`   - ${v.impact}: ${v.description}`);
        });
      } else if (this.config.verbose) {
        console.log(`✅ No accessibility violations found in ${target.name}`);
      }

    } catch (error) {
      console.warn('Accessibility scan error:', error.message);
      violations.push({
        id: 'scan-error',
        description: `Failed to scan ${target.name}: ${error.message}`,
        impact: 'serious',
        target: target.name,
        file: target.file
      });
    }

    return violations;
  }

  calculateUnusedBytes(jsCoverage, cssCoverage) {
    let unusedJS = 0;
    let unusedCSS = 0;

    for (const entry of jsCoverage) {
      let usedBytes = 0;
      for (const range of entry.ranges) {
        usedBytes += range.end - range.start - 1;
      }
      unusedJS += entry.text.length - usedBytes;
    }

    for (const entry of cssCoverage) {
      let usedBytes = 0;
      for (const range of entry.ranges) {
        usedBytes += range.end - range.start - 1;
      }
      unusedCSS += entry.text.length - usedBytes;
    }

    return { js: unusedJS, css: unusedCSS };
  }

  async startComponentServer() {
    // In production: start a server to serve individual components for testing
    // For now, this is a placeholder
    return null;
  }

  async cleanup() {
    // Close all browsers
    for (const [name, browser] of this.browsers) {
      try {
        await browser.close();
      } catch (error) {
        console.warn(`Failed to close ${name} browser:`, error.message);
      }
    }
    this.browsers.clear();

    // Stop component server if running
    if (this.componentServer) {
      this.componentServer.close();
      this.componentServer = null;
    }
  }

  extractComponentName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  async generateComponentUrl(filePath) {
    // Generate URL for component preview
    // This would typically involve starting a dev server or component storybook
    return `http://localhost:${this.componentServerPort}/component/${this.extractComponentName(filePath)}`;
  }

  aggregateResults(results) {
    return {
      visual: results.visual,
      accessibility: results.accessibility,
      performance: results.performance,
      summary: {
        totalTests: results.visual.passed + results.visual.failed,
        visualRegressions: results.visual.regressions.length,
        accessibilityViolations: results.accessibility.violations.length,
        performanceIssues: results.performance.issues.length,
        overallHealth: this.calculateOverallHealth(results)
      }
    };
  }

  calculateOverallHealth(results) {
    let score = 100;

    // Deduct for visual regressions
    score -= results.visual.regressions.length * 10;

    // Deduct for accessibility violations
    score -= results.accessibility.violations.length * 5;

    // Deduct for performance issues
    score -= results.performance.issues.length * 3;

    return Math.max(0, score);
  }
}