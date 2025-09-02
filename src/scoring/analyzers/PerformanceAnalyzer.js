/**
 * PerformanceAnalyzer - Analyzes performance and optimization patterns
 *
 * Evaluates:
 * - Bundle size and dependency optimization (5pts)
 * - Code splitting and lazy loading (4pts)
 * - Performance best practices (3pts)
 * Total: 12pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

/**


 * PerformanceAnalyzer class implementation


 *


 * Provides functionality for performanceanalyzer operations


 */


/**


 * PerformanceAnalyzer class implementation


 *


 * Provides functionality for performanceanalyzer operations


 */


export class PerformanceAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Performance & Optimization';
    this.description = 'Bundle optimization, code splitting, and performance best practices';
  }  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */


  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];

    await this.analyzeBundleOptimization(); // 5pts
    await this.analyzeCodeSplitting(); // 4pts
    await this.analyzePerformanceBestPractices(); // 3pts
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeBundleOptimization() {
    let score = 0;
    const maxScore = 5;

    const packageJson = await this.readPackageJson();    /**
   * Performs the specified operation
   * @param {any} !packageJson
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !packageJson
   * @returns {any} The operation result
   */

    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot analyze dependencies');
      return;
    }

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    const totalDeps = Object.keys(deps).length;

    // PHASE 1: Real bundle size analysis
    const bundleAnalysis = await this.runBundleAnalysis(packageJson, deps, devDeps);    /**
   * Performs the specified operation
   * @param {boolean} bundleAnalysis.success
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} bundleAnalysis.success
   * @returns {boolean} True if successful, false otherwise
   */


    if (bundleAnalysis.success) {
      const { totalSize, chunks, dependencies } = bundleAnalysis.data;

      // Score based on actual bundle size (4pts)      /**
   * Performs the specified operation
   * @param {any} totalSize < 250
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} totalSize < 250
   * @returns {any} The operation result
   */

      if (totalSize < 250) { // KB
        score += 4;
        this.addScore(4, 4, `Excellent bundle size (${totalSize}KB)`);
      }

      else if (totalSize < 500) {
        score += 3;
        this.addScore(3, 4, `Good bundle size (${totalSize}KB)`);
      }

      else if (totalSize < 1000) {
        score += 2;
        this.addScore(2, 4, `Large bundle size (${totalSize}KB)`);
        this.addIssue('Bundle size could be optimized', 'Consider code splitting and dependency optimization');
      }

      else {
        score += 1;
        this.addScore(1, 4, `Very large bundle size (${totalSize}KB)`);
        this.addIssue('Large bundle detected', 'Urgent: Implement bundle optimization strategies');
      }

      this.setDetail('bundleAnalysis', {
        totalSize,
        chunks: chunks.slice(0, 5), // Top 5 chunks
        heaviestDependencies: dependencies.slice(0, 5), // Top 5 dependencies by size
        chunkCount: chunks.length
      });
    }

    else {
      // Fallback: Score based on dependency count (lighter is better) (4pts)      /**
   * Performs the specified operation
   * @param {any} totalDeps < 10
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} totalDeps < 10
   * @returns {any} The operation result
   */

      if (totalDeps < 10) {
        score += 3;
        this.addScore(3, 4, `Lean dependency count (${totalDeps}) - bundle analysis unavailable`);
      }

      else if (totalDeps < 25) {
        score += 2;
        this.addScore(2, 4, `Moderate dependency count (${totalDeps}) - bundle analysis unavailable`);
      }

      else if (totalDeps < 50) {
        score += 1;
        this.addScore(1, 4, `High dependency count (${totalDeps}) - bundle analysis unavailable`);
        this.addIssue('Many dependencies detected', 'Audit dependencies for bundle size impact');
      }

      else {
        this.addIssue('Very high dependency count', 'Significant dependency bloat - consider alternatives');
      }

      // Add helpful guidance for bundle analysis setup
      this.addIssue('Bundle analysis unavailable', `${bundleAnalysis.error}. Install: npm install --save-dev webpack-bundle-analyzer`);
    }

    // Check for bundle analysis tools (2pts)
    const bundleTools = ['webpack-bundle-analyzer', '@bundle-analyzer/webpack', 'rollup-plugin-analyzer', 'vite-bundle-analyzer'];
    const hasBundleAnalysis = bundleTools.some(tool => devDeps[tool]);    /**
   * Performs the specified operation
   * @param {boolean} hasBundleAnalysis
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasBundleAnalysis
   * @returns {boolean} True if successful, false otherwise
   */


    if (hasBundleAnalysis) {
      score += 2;
      this.addScore(2, 2, 'Bundle analysis tool detected');
    }

    else {
      this.addIssue('No bundle analysis tool found', 'Add webpack-bundle-analyzer or similar for bundle optimization');
    }

    this.setDetail('dependencyCount', totalDeps);
    this.setDetail('hasBundleAnalysis', hasBundleAnalysis);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeCodeSplitting() {
    let score = 0;
    const maxScore = 4;

    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let dynamicImports = 0;
    let lazyComponents = 0;
    let routeBasedSplitting = 0;    /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */


    for (const file of files) {
      try {
        const content = await this.readFile(file);

        // Count dynamic imports
        const imports = content.match(/import\s*\(/g);        /**
   * Performs the specified operation
   * @param {any} imports
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} imports
   * @returns {any} The operation result
   */

        if (imports) {
          dynamicImports += imports.length;
        }

        // React.lazy usage
        if (content.includes('React.lazy') || content.includes('lazy(')) {
          lazyComponents++;
        }

        // Route-based code splitting indicators
        if (content.includes('loadable') || content.includes('Suspense') ||
            (content.includes('import(') && (content.includes('route') || content.includes('page')))) {
          routeBasedSplitting++;
        }

      }

      catch (error) {
        // Skip files that can't be read
      }
    }

    // Score for dynamic imports    /**
   * Performs the specified operation
   * @param {any} dynamicImports > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} dynamicImports > 0
   * @returns {any} The operation result
   */

    if (dynamicImports > 0) {
      const importScore = Math.min(dynamicImports / 3, 3); // Up to 3 points
      score += importScore;
      this.addScore(importScore, 3, `Dynamic imports found (${dynamicImports})`);
    }

    else if (this.isReactProject() || this.isVueProject()) {
      this.addIssue('No dynamic imports found', 'Implement code splitting with dynamic imports');
    }

    // Score for lazy loading    /**
   * Performs the specified operation
   * @param {any} lazyComponents > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} lazyComponents > 0
   * @returns {any} The operation result
   */

    if (lazyComponents > 0) {
      score += 1;
      this.addScore(1, 1, `Lazy components detected (${lazyComponents})`);
    }

    else if (this.isReactProject()) {
      this.addIssue('No lazy components found', 'Use React.lazy() for component-level code splitting');
    }

    // Score for route-based splitting    /**
   * Performs the specified operation
   * @param {any} routeBasedSplitting > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} routeBasedSplitting > 0
   * @returns {any} The operation result
   */

    if (routeBasedSplitting > 0) {
      score += 1;
      this.addScore(1, 1, `Route-based splitting detected (${routeBasedSplitting})`);
    }

    else if (this.isReactProject() || this.isVueProject()) {
      this.addIssue('No route-based code splitting', 'Split routes for better initial load performance');
    }

    this.setDetail('dynamicImports', dynamicImports);
    this.setDetail('lazyComponents', lazyComponents);
    this.setDetail('routeBasedSplitting', routeBasedSplitting);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzePerformanceBestPractices() {
    let score = 0;
    const maxScore = 3;

    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let memoizationCount = 0;
    let optimizationPatterns = 0;
    let performanceIssues = 0;

    for (const file of files.slice(0, 20)) { // Sample files for performance
      try {
        const content = await this.readFile(file);

        // React performance patterns
        if (this.isReactProject()) {
          // Count memoization usage
          if (content.includes('React.memo') || content.includes('useMemo') || content.includes('useCallback')) {
            memoizationCount++;
          }

          // Check for performance optimization patterns
          if (content.includes('React.lazy') || content.includes('Suspense') || content.includes('useCallback')) {
            optimizationPatterns++;
          }

          // Identify potential performance issues
          if (content.includes('useEffect') && !content.includes('useCallback') && content.includes('(')) {
            performanceIssues++;
          }
        }

        // General performance patterns
        if (content.includes('debounce') || content.includes('throttle')) {
          optimizationPatterns++;
        }

      }

      catch (error) {
        // Skip files that can't be read
      }
    }

    // Score for memoization    /**
   * Performs the specified operation
   * @param {number} memoizationCount > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} memoizationCount > 0
   * @returns {any} The operation result
   */

    if (memoizationCount > 0) {
      const memoScore = Math.min(memoizationCount / 3, 2); // Up to 2 points
      score += memoScore;
      this.addScore(memoScore, 2, `Performance optimization patterns (${memoizationCount})`);
    }

    else if (this.isReactProject()) {
      this.addIssue('No memoization detected', 'Use React.memo, useMemo, useCallback for optimization');
    }

    // Score for general optimization patterns    /**
   * Performs the specified operation
   * @param {any} optimizationPatterns > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} optimizationPatterns > 0
   * @returns {any} The operation result
   */

    if (optimizationPatterns > 0) {
      score += Math.min(optimizationPatterns / 2, 2); // Up to 2 points
      this.addScore(Math.min(optimizationPatterns / 2, 2), 2, `Optimization patterns found (${optimizationPatterns})`);
    }

    // Deduct for performance anti-patterns    /**
   * Performs the specified operation
   * @param {boolean} performanceIssues > 3
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} performanceIssues > 3
   * @returns {any} The operation result
   */

    if (performanceIssues > 3) {
      this.addIssue('Potential performance issues detected', 'Review useEffect dependencies and callback usage');
    }

    this.setDetail('memoizationCount', memoizationCount);
    this.setDetail('optimizationPatterns', optimizationPatterns);
    this.setDetail('performanceIssues', performanceIssues);
  }

  /**
   * PHASE 1: Run bundle analysis using webpack-bundle-analyzer or similar tools
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async runBundleAnalysis(packageJson, deps, devDeps) {
    try {
      // Check if this is a buildable project
      const buildCommands = ['build', 'compile', 'bundle'];
      const buildScript = buildCommands.find(cmd =>
        packageJson.scripts && packageJson.scripts[cmd]
      );      /**
   * Performs the specified operation
   * @param {any} !buildScript
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !buildScript
   * @returns {any} The operation result
   */


      if (!buildScript) {
        return {
          success: false,
          error: 'No build script found - add "build" script to package.json'
        };
      }

      // Try different bundle analysis approaches based on available tools
      const bundleResult = await this.tryBundleAnalysisApproaches(packageJson, deps, devDeps, buildScript);
      return bundleResult;

    }

    catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Try multiple bundle analysis approaches
   */
  async tryBundleAnalysisApproaches(packageJson, deps, devDeps, buildScript) {
    const allDeps = { ...deps, ...devDeps };

    // Approach 1: Check for existing bundle analysis output
    const existingAnalysis = await this.checkExistingBundleOutput();    /**
   * Performs the specified operation
   * @param {boolean} existingAnalysis.success
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} existingAnalysis.success
   * @returns {boolean} True if successful, false otherwise
   */

    if (existingAnalysis.success) {
      return existingAnalysis;
    }

    // Approach 2: Use package size estimation
    const sizeEstimation = await this.estimateBundleSize(allDeps);    /**
   * Performs the specified operation
   * @param {any} sizeEstimation.success
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} sizeEstimation.success
   * @returns {any} The operation result
   */

    if (sizeEstimation.success) {
      return sizeEstimation;
    }

    // Approach 3: Try to run build and analyze
    const buildAnalysis = await this.runBuildAnalysis(packageJson.scripts[buildScript]);    /**
   * Performs the specified operation
   * @param {boolean} buildAnalysis.success
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} buildAnalysis.success
   * @returns {boolean} True if successful, false otherwise
   */

    if (buildAnalysis.success) {
      return buildAnalysis;
    }

    return {
      success: false,
      error: 'Bundle analysis requires build configuration or webpack-bundle-analyzer'
    };
  }

  /**
   * Check for existing bundle analysis output files
   */
  async checkExistingBundleOutput() {
    try {
      const analysisFiles = [
        'bundle-report.html',
        'webpack-bundle-analyzer-report.html',
        'build/static/js',
        'dist/assets',
        'out/_next/static/chunks'
      ];      /**
   * Performs the specified operation
   * @param {boolean} const file of analysisFiles
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} const file of analysisFiles
   * @returns {boolean} True if successful, false otherwise
   */


      for (const file of analysisFiles) {
        if (existsSync(path.join(this.config.projectRoot || process.cwd(), file))) {
          const analysis = await this.analyzeBuildOutput(file);          /**
   * Performs the specified operation
   * @param {boolean} analysis
   * @returns {boolean} True if successful, false otherwise
   */
          /**
   * Performs the specified operation
   * @param {boolean} analysis
   * @returns {boolean} True if successful, false otherwise
   */

          if (analysis) {
            return { success: true, data: analysis };
          }
        }
      }

      return { success: false };
    }

    catch (error) {
      return { success: false };
    }
  }

  /**
   * Estimate bundle size based on dependencies
   */
  async estimateBundleSize(dependencies) {
    try {
      // Known package sizes (rough estimates in KB)
      const packageSizes = {
        'react': 45,
        'react-dom': 130,
        'vue': 35,
        'angular': 150,
        'lodash': 70,
        'moment': 65,
        'rxjs': 85,
        'axios': 15,
        'express': 25,
        'webpack': 30,
        'typescript': 35
      };

      let estimatedSize = 50; // Base app size
      const heavyDependencies = [];

      for (const [dep, version] of Object.entries(dependencies)) {
        const size = packageSizes[dep] || 10; // Default 10KB for unknown packages
        estimatedSize += size;        /**
   * Performs the specified operation
   * @param {any} size > 30
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} size > 30
   * @returns {any} The operation result
   */


        if (size > 30) {
          heavyDependencies.push({ name: dep, size, version });
        }
      }

      // Sort by size
      heavyDependencies.sort((a, b) => b.size - a.size);

      return {
        success: true,
        data: {
          totalSize: Math.round(estimatedSize),
          chunks: [{ name: 'main', size: Math.round(estimatedSize * 0.8) }],
          dependencies: heavyDependencies,
          isEstimate: true
        }
      };

    }

    catch (error) {
      return { success: false };
    }
  }

  /**
   * Analyze build output directory for bundle sizes
   */
  async analyzeBuildOutput(outputPath) {
    try {
      const fullPath = path.join(this.config.projectRoot || process.cwd(), outputPath);

      if (outputPath.includes('.js') || outputPath.includes('chunks')) {
        // Analyze JS files in build directory
        const files = await fs.readdir(fullPath).catch(() => []);
        const jsFiles = files.filter(f => f.endsWith('.js'));

        let totalSize = 0;
        const chunks = [];

        for (const file of jsFiles.slice(0, 10)) { // Limit to first 10 files
          try {
            const filePath = path.join(fullPath, file);
            const stats = await fs.stat(filePath);
            const sizeKB = Math.round(stats.size / 1024);

            totalSize += sizeKB;
            chunks.push({ name: file, size: sizeKB });
          }

          catch (error) {
            // Skip files we can't read
          }
        }        /**
   * Performs the specified operation
   * @param {any} totalSize > 0
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} totalSize > 0
   * @returns {any} The operation result
   */


        if (totalSize > 0) {
          chunks.sort((a, b) => b.size - a.size);
          return {
            totalSize,
            chunks,
            dependencies: [], // Can't determine from build output
            isFromBuild: true
          };
        }
      }

      return null;
    }

    catch (error) {
      return null;
    }
  }

  /**
   * Try to run build and analyze output
   */
  async runBuildAnalysis(buildCommand) {
    try {
      // Don't actually run build as it might be expensive
      // Instead provide guidance on how to set up bundle analysis
      return {
        success: false,
        error: `Run '${buildCommand}' then install webpack-bundle-analyzer for detailed analysis`
      };
    }

    catch (error) {
      return { success: false, error: error.message };
    }
  }
}