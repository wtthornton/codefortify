import { performance, PerformanceObserver } from 'perf_hooks';
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

/**


 * VisualTestingAgent class implementation


 *


 * Provides functionality for visualtestingagent operations


 */


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

    // Initialize browsers based on config    /**
   * Performs the specified operation
   * @param {Object} const browserName of this.config.browsers
   * @returns {boolean} True if successful, false otherwise
   */

    for (const browserName of this.config.browsers) {      /**
   * Performs the specified operation
   * @param {any} browserName - Optional parameter
   * @returns {any} The operation result
   */

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

      // Create test targets from discovered files      /**
   * Performs the specified operation
   * @param {any} const file of componentFiles
   * @returns {any} The operation result
   */

      for (const file of componentFiles) {
        targets.push({
          type: 'component',
          file: file,
          url: await this.generateComponentUrl(file),
          name: this.extractComponentName(file)
        });
      }      /**
   * Performs the specified operation
   * @param {any} const file of htmlFiles
   * @returns {any} The operation result
   */


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
      // WARN: ⚠️  Could not discover all test targets:, error.message
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
    };    /**
   * Performs the specified operation
   * @param {any} const target of testTargets
   * @returns {string} The operation result
   */


    for (const target of testTargets) {      /**
   * Performs the specified operation
   * @param {any} const [browserName
   * @param {boolean} browser] of this.browsers
   * @returns {boolean} True if successful, false otherwise
   */

      for (const [browserName, browser] of this.browsers) {        /**
   * Performs the specified operation
   * @param {Object} const viewport of this.config.viewports
   * @returns {boolean} True if successful, false otherwise
   */

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
            const hasBaseline = await this.fileExists(baselinePath);            /**
   * Performs the specified operation
   * @param {boolean} hasBaseline
   * @returns {any} The operation result
   */


            if (hasBaseline) {
              const diffResult = await this.compareScreenshots(baselinePath, screenshotPath, testId);              /**
   * Performs the specified operation
   * @param {any} diffResult.different
   * @returns {any} The operation result
   */


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
            // WARN: `⚠️  Visual test failed for ${testId}:`, error.message
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
    };    /**
   * Performs the specified operation
   * @param {Object} !this.config.accessibility.enabled
   * @returns {boolean} True if successful, false otherwise
   */


    if (!this.config.accessibility.enabled) {
      return results;
    }    /**
   * Performs the specified operation
   * @param {any} const target of testTargets
   * @returns {string} The operation result
   */


    for (const target of testTargets) {
      try {
        const browser = this.browsers.get('chromium'); // Use Chromium for accessibility testing
        const page = await browser.newPage();

        // Navigate to target
        await page.goto(target.url, { waitUntil: 'networkidle' });

        // Run accessibility scan
        const violations = await this.runAccessibilityScan(page, target);        /**
   * Performs the specified operation
   * @param {any} violations.length - Optional parameter
   * @returns {any} The operation result
   */


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
        // WARN: `⚠️  Accessibility test failed for ${target.name}:`, error.message
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
    };    /**
   * Performs the specified operation
   * @param {Object} !this.config.performance.enabled
   * @returns {boolean} True if successful, false otherwise
   */


    if (!this.config.performance.enabled) {
      return results;
    }    /**
   * Performs the specified operation
   * @param {any} const target of testTargets
   * @returns {string} The operation result
   */


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
          return new Promise((resolve) => {            /**
   * Performs the specified operation
   * @param {any} typeof PerformanceObserver - Optional parameter
   * @returns {any} The operation result
   */

            if (typeof PerformanceObserver === 'undefined') {
              resolve({});
              return;
            }
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const vitals = {};

              entries.forEach((entry) => {                /**
   * Performs the specified operation
   * @param {any} entry.entryType - Optional parameter
   * @returns {any} The operation result
   */

                if (entry.entryType === 'largest-contentful-paint') {
                  vitals.LCP = entry.startTime;
                }                /**
   * Performs the specified operation
   * @param {any} entry.entryType - Optional parameter
   * @returns {any} The operation result
   */

                if (entry.entryType === 'first-input') {
                  vitals.FID = entry.processingStart - entry.startTime;
                }                /**
   * Performs the specified operation
   * @param {any} entry.entryType - Optional parameter
   * @returns {any} The operation result
   */

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

        // Check for performance issues        /**
   * Performs the specified operation
   * @param {any} metrics.LCP > 2500
   * @returns {any} The operation result
   */

        if (metrics.LCP > 2500) {
          results.issues.push({
            type: 'LCP',
            target: target.name,
            value: metrics.LCP,
            severity: 'high',
            message: 'Largest Contentful Paint is too slow'
          });
        }        /**
   * Performs the specified operation
   * @param {any} metrics.CLS > 0.1
   * @returns {any} The operation result
   */


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
        // WARN: `⚠️  Performance test failed for ${target.name}:`, error.message
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

    // Visual regression insights    /**
   * Performs the specified operation
   * @param {boolean} results.visual.regressions.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

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

    // Accessibility insights    /**
   * Performs the specified operation
   * @param {any} results.accessibility.violations.length > 0
   * @returns {any} The operation result
   */

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

    // Performance insights    /**
   * Performs the specified operation
   * @param {boolean} results.performance.issues.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (results.performance.issues.length > 0) {
      const highImpactIssues = results.performance.issues.filter(i => i.severity === 'high');      /**
   * Performs the specified operation
   * @param {boolean} highImpactIssues.length > 0
   * @returns {any} The operation result
   */

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

    // Visual regression recommendations    /**
   * Performs the specified operation
   * @param {boolean} results.visual.regressions.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

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

    // Accessibility recommendations    /**
   * Performs the specified operation
   * @param {any} results.accessibility.violations.length > 0
   * @returns {any} The operation result
   */

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

    // Performance recommendations    /**
   * Performs the specified operation
   * @param {boolean} results.performance.issues.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

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

  // Utility methods  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */

  async ensureDirectories() {
    const dirs = [this.screenshotsDir, this.baselineDir, this.currentDir, this.diffDir];    /**
   * Performs the specified operation
   * @param {any} const dir of dirs
   * @returns {any} The operation result
   */

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async findComponentFiles() {
    // Implementation depends on project structure
    // Look for React, Vue, Angular components
    return [];
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async findHtmlFiles() {
    // Look for HTML files in the project
    return [];
  }  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */


  async findExistingTestConfigs() {
    // Look for existing visual test configurations
    return [];
  }  /**
   * Generates new data
   * @param {any} target
   * @param {any} browser
   * @param {any} viewport
   * @returns {string} The created resource
   */


  generateTestId(target, browser, viewport) {
    const input = `${target.name}-${browser}-${viewport.width}x${viewport.height}`;
    return createHash('md5').update(input).digest('hex').substring(0, 8);
  }  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */


  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }  /**
   * Performs the specified operation
   * @param {string} baselinePath
   * @param {string} currentPath
   * @param {number} testId
   * @returns {Promise} Promise that resolves with the result
   */


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

      // Images must have same dimensions for pixel-by-pixel comparison      /**
   * Performs the specified operation
   * @param {number} baselineImg.width ! - Optional parameter
   * @returns {any} The operation result
   */

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
      const different = parseFloat(diffPercentage) > (this.config.screenshotOptions.threshold * 100);      /**
   * Performs the specified operation
   * @param {any} different
   * @returns {any} The operation result
   */


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
  }  /**
   * Runs the specified task
   * @param {any} page
   * @param {any} target
   * @returns {Promise} Promise that resolves with the result
   */


  async runAccessibilityScan(page, target) {
    const violations = [];

    try {
      // Use axe-playwright for comprehensive accessibility scanning
      const axeResults = await new AxeBuilder({ page })
        .withTags(this.config.accessibility.standards) // e.g., ['wcag2a', 'wcag2aa']
        .analyze();

      // Transform axe results to our format      /**
   * Performs the specified operation
   * @param {any} const violation of axeResults.violations
   * @returns {any} The operation result
   */

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

      // Log accessibility results if verbose      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose && violations.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.verbose && violations.length > 0) {
        // LOG: `⚠️  Found ${violations.length} accessibility violations in ${target.name}`
        violations.forEach(_v => {
          // LOG: `   - ${v.impact}: ${v.description}`
        });
      } else if (this.config.verbose) {
        // LOG: `✅ No accessibility violations found in ${target.name}`
      }

    } catch (error) {
      // WARN: Accessibility scan error:, error.message
      violations.push({
        id: 'scan-error',
        description: `Failed to scan ${target.name}: ${error.message}`,
        impact: 'serious',
        target: target.name,
        file: target.file
      });
    }

    return violations;
  }  /**
   * Calculates the result
   * @param {any} jsCoverage
   * @param {any} cssCoverage
   * @returns {number} The calculated result
   */


  calculateUnusedBytes(jsCoverage, cssCoverage) {
    let unusedJS = 0;
    let unusedCSS = 0;    /**
   * Performs the specified operation
   * @param {any} const entry of jsCoverage
   * @returns {any} The operation result
   */


    for (const entry of jsCoverage) {
      let usedBytes = 0;      /**
   * Performs the specified operation
   * @param {any} const range of entry.ranges
   * @returns {any} The operation result
   */

      for (const range of entry.ranges) {
        usedBytes += range.end - range.start - 1;
      }
      unusedJS += entry.text.length - usedBytes;
    }    /**
   * Performs the specified operation
   * @param {any} const entry of cssCoverage
   * @returns {any} The operation result
   */


    for (const entry of cssCoverage) {
      let usedBytes = 0;      /**
   * Performs the specified operation
   * @param {any} const range of entry.ranges
   * @returns {any} The operation result
   */

      for (const range of entry.ranges) {
        usedBytes += range.end - range.start - 1;
      }
      unusedCSS += entry.text.length - usedBytes;
    }

    return { js: unusedJS, css: unusedCSS };
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async startComponentServer() {
    // In production: start a server to serve individual components for testing
    // For now, this is a placeholder
    return null;
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async cleanup() {
    // Close all browsers  /**
   * Performs the specified operation
   * @param {any} const [name
   * @param {boolean} browser] of this.browsers
   * @returns {boolean} True if successful, false otherwise
   */

    for (const [name, browser] of this.browsers) {
      try {
        await browser.close();
      } catch (error) {
        // WARN: `Failed to close ${name} browser:`, error.message
      }
    }
    this.browsers.clear();

    // Stop component server if running    /**
   * Performs the specified operation
   * @param {boolean} this.componentServer
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.componentServer) {
      this.componentServer.close();
      this.componentServer = null;
    }
  }  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {any} The operation result
   */


  extractComponentName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }  /**
   * Generates new data
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */


  async generateComponentUrl(filePath) {
    // Generate URL for component preview
    // This would typically involve starting a dev server or component storybook
    return `http://localhost:${this.componentServerPort}/component/${this.extractComponentName(filePath)}`;
  }  /**
   * Performs the specified operation
   * @param {any} results
   * @returns {any} The operation result
   */


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
  }  /**
   * Calculates the result
   * @param {any} results
   * @returns {number} The calculated result
   */


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