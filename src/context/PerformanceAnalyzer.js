import { performance } from 'perf_hooks';
/**
 * Performance Analyzer for Context7
 * Analyzes performance requirements and patterns
 *
 * Features:
 * - Performance requirement detection
 * - Performance anti-pattern identification
 * - Optimization opportunity detection
 * - Performance monitoring setup analysis
 */

import { fileUtils } from '../utils/fileUtils.js';
import path from 'path';

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


export class PerformanceAnalyzer {
  constructor(config = {}) {
    this.config = config;
    this.performancePatterns = {
      antiPatterns: [
        { pattern: /for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*array\.length\s*;\s*i\+\+\)/, severity: 'medium', message: 'Use forEach or map instead of traditional for loop' },
        { pattern: /document\.getElementById/, severity: 'low', message: 'Consider using querySelector for better performance' },
        { pattern: /innerHTML\s*=/, severity: 'medium', message: 'Consider using textContent for better performance' },
        { pattern: /eval\s*\(/, severity: 'high', message: 'Avoid eval() for security and performance reasons' },
        { pattern: /setTimeout\s*\(\s*function/, severity: 'low', message: 'Consider using arrow functions for better performance' }
      ],
      optimizationOpportunities: [
        { pattern: /import\s+\*\s+as/, severity: 'medium', message: 'Consider specific imports to reduce bundle size' },
        { pattern: /console\.log/, severity: 'low', message: 'Remove console.log statements in production' },
        { pattern: /\.map\s*\(\s*.*\s*\)\s*\.map\s*\(/, severity: 'high', message: 'Consider combining multiple map operations' },
        { pattern: /\.filter\s*\(\s*.*\s*\)\s*\.map\s*\(/, severity: 'medium', message: 'Consider using reduce for better performance' }
      ],
      performanceFeatures: [
        { pattern: /React\.memo/, severity: 'positive', message: 'Good use of React.memo for performance optimization' },
        { pattern: /useMemo/, severity: 'positive', message: 'Good use of useMemo for expensive calculations' },
        { pattern: /useCallback/, severity: 'positive', message: 'Good use of useCallback for function memoization' },
        { pattern: /lazy\s*\(\s*\(\)\s*=>\s*import/, severity: 'positive', message: 'Good use of lazy loading for code splitting' }
      ]
    };
  }

  /**
   * Analyze performance needs and patterns
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} Performance analysis
   */
  async analyzePerformanceNeeds(projectRoot) {
    try {
      // LOG: `⚡ Analyzing performance needs in: ${projectRoot}`
      const analysis = {
        requirements: await this.detectPerformanceRequirements(projectRoot),
        antiPatterns: await this.detectPerformanceAntiPatterns(projectRoot),
        optimizations: await this.detectOptimizationOpportunities(projectRoot),
        monitoring: await this.analyzePerformanceMonitoring(projectRoot),
        bundleAnalysis: await this.analyzeBundlePerformance(projectRoot),
        recommendations: []
      };

      analysis.recommendations = await this.generatePerformanceRecommendations(analysis);

      // LOG: `✅ Performance analysis completed for: ${projectRoot}`
      return analysis;

    } catch (error) {
      // ERROR: `❌ Error analyzing performance needs: ${error.message}`
      return {
        requirements: {},
        antiPatterns: [],
        optimizations: [],
        monitoring: {},
        bundleAnalysis: {},
        recommendations: []
      };
    }
  }

  /**
   * Detect performance requirements
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Performance requirements analysis
   */
  async detectPerformanceRequirements(projectRoot) {
    const requirements = {
      targetAudience: 'unknown',
      performanceBudget: 'unknown',
      criticalPath: 'unknown',
      monitoring: 'unknown'
    };

    try {
      // Check package.json for performance-related dependencies
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileUtils.fileExists(packageJsonPath)) {
        const packageContent = await fileUtils.readFile(packageJsonPath);
        const packageData = JSON.parse(packageContent);

        // Check for performance monitoring tools
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };        /**
   * Performs the specified operation
   * @param {any} deps['web-vitals']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['web-vitals']
   * @returns {any} The operation result
   */

        if (deps['web-vitals']) {requirements.monitoring = 'web-vitals';}        /**
   * Performs the specified operation
   * @param {any} deps['lighthouse']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['lighthouse']
   * @returns {any} The operation result
   */

        if (deps['lighthouse']) {requirements.monitoring = 'lighthouse';}        /**
   * Performs the specified operation
   * @param {any} deps['bundle-analyzer']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['bundle-analyzer']
   * @returns {any} The operation result
   */

        if (deps['bundle-analyzer']) {requirements.monitoring = 'bundle-analyzer';}

        // Check for performance-related scripts        /**
   * Performs the specified operation
   * @param {any} packageData.scripts
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} packageData.scripts
   * @returns {any} The operation result
   */

        if (packageData.scripts) {          /**
   * Performs the specified operation
   * @param {any} packageData.scripts.build
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} packageData.scripts.build
   * @returns {any} The operation result
   */

          if (packageData.scripts.build) {requirements.performanceBudget = 'build-optimized';}          /**
   * Performs the specified operation
   * @param {any} packageData.scripts.analyze
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} packageData.scripts.analyze
   * @returns {any} The operation result
   */

          if (packageData.scripts.analyze) {requirements.monitoring = 'bundle-analysis';}
        }
      }

      // Check for performance configuration files
      const configFiles = [
        'lighthouse.config.js',
        'webpack.config.js',
        'vite.config.js',
        'rollup.config.js'
      ];      /**
   * Performs the specified operation
   * @param {Object} const configFile of configFiles
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {Object} const configFile of configFiles
   * @returns {any} The operation result
   */


      for (const configFile of configFiles) {
        const configPath = path.join(projectRoot, configFile);
        if (await fileUtils.fileExists(configPath)) {
          requirements.performanceBudget = 'configured';
          break;
        }
      }

      // Analyze codebase for performance indicators
      const codeSamples = await this.extractCodeSamples(projectRoot);
      requirements.targetAudience = this.detectTargetAudience(codeSamples);
      requirements.criticalPath = this.detectCriticalPath(codeSamples);

    } catch (error) {
      // ERROR: `Error detecting performance requirements: ${error.message}`
    }

    return requirements;
  }

  /**
   * Detect performance anti-patterns
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Array>} Performance anti-patterns found
   */
  async detectPerformanceAntiPatterns(projectRoot) {
    const antiPatterns = [];
    const codeSamples = await this.extractCodeSamples(projectRoot);    /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */


    for (const sample of codeSamples) {      /**
   * Performs the specified operation
   * @param {boolean} const antiPattern of this.performancePatterns.antiPatterns
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} const antiPattern of this.performancePatterns.antiPatterns
   * @returns {boolean} True if successful, false otherwise
   */

      for (const antiPattern of this.performancePatterns.antiPatterns) {
        const matches = sample.content.match(antiPattern.pattern);        /**
   * Performs the specified operation
   * @param {any} matches
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} matches
   * @returns {any} The operation result
   */

        if (matches) {
          antiPatterns.push({
            file: sample.file,
            pattern: antiPattern.pattern.toString(),
            severity: antiPattern.severity,
            message: antiPattern.message,
            line: this.findLineNumber(sample.content, antiPattern.pattern),
            matches: matches.length
          });
        }
      }
    }

    return antiPatterns;
  }

  /**
   * Detect optimization opportunities
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Array>} Optimization opportunities found
   */
  async detectOptimizationOpportunities(projectRoot) {
    const optimizations = [];
    const codeSamples = await this.extractCodeSamples(projectRoot);    /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */


    for (const sample of codeSamples) {      /**
   * Performs the specified operation
   * @param {boolean} const optimization of this.performancePatterns.optimizationOpportunities
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} const optimization of this.performancePatterns.optimizationOpportunities
   * @returns {boolean} True if successful, false otherwise
   */

      for (const optimization of this.performancePatterns.optimizationOpportunities) {
        const matches = sample.content.match(optimization.pattern);        /**
   * Performs the specified operation
   * @param {any} matches
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} matches
   * @returns {any} The operation result
   */

        if (matches) {
          optimizations.push({
            file: sample.file,
            pattern: optimization.pattern.toString(),
            severity: optimization.severity,
            message: optimization.message,
            line: this.findLineNumber(sample.content, optimization.pattern),
            matches: matches.length
          });
        }
      }
    }

    return optimizations;
  }

  /**
   * Analyze performance monitoring setup
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Performance monitoring analysis
   */
  async analyzePerformanceMonitoring(projectRoot) {
    const monitoring = {
      tools: [],
      metrics: [],
      alerts: [],
      reporting: []
    };

    try {
      // Check for performance monitoring tools
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileUtils.fileExists(packageJsonPath)) {
        const packageContent = await fileUtils.readFile(packageJsonPath);
        const packageData = JSON.parse(packageContent);
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };        /**
   * Performs the specified operation
   * @param {any} deps['web-vitals']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['web-vitals']
   * @returns {any} The operation result
   */


        if (deps['web-vitals']) {monitoring.tools.push('web-vitals');}        /**
   * Performs the specified operation
   * @param {any} deps['lighthouse']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['lighthouse']
   * @returns {any} The operation result
   */

        if (deps['lighthouse']) {monitoring.tools.push('lighthouse');}        /**
   * Performs the specified operation
   * @param {any} deps['bundle-analyzer']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['bundle-analyzer']
   * @returns {any} The operation result
   */

        if (deps['bundle-analyzer']) {monitoring.tools.push('bundle-analyzer');}        /**
   * Performs the specified operation
   * @param {any} deps['performance-now']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['performance-now']
   * @returns {any} The operation result
   */

        if (deps['performance-now']) {monitoring.tools.push('performance-now');}        /**
   * Performs the specified operation
   * @param {any} deps['@sentry/performance']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['@sentry/performance']
   * @returns {any} The operation result
   */

        if (deps['@sentry/performance']) {monitoring.tools.push('sentry');}
      }

      // Check for performance monitoring code
      const codeSamples = await this.extractCodeSamples(projectRoot);      /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */

      for (const sample of codeSamples) {
        if (sample.content.includes('performance.now()')) {
          monitoring.metrics.push('timing');
        }
        if (sample.content.includes('web-vitals')) {
          monitoring.metrics.push('web-vitals');
        }
        if (sample.content.includes('lighthouse')) {
          monitoring.metrics.push('lighthouse');
        }
      }

    } catch (error) {
      // ERROR: `Error analyzing performance monitoring: ${error.message}`
    }

    return monitoring;
  }

  /**
   * Analyze bundle performance
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Bundle performance analysis
   */
  async analyzeBundlePerformance(projectRoot) {
    const bundleAnalysis = {
      size: 'unknown',
      optimization: 'unknown',
      splitting: 'unknown',
      compression: 'unknown'
    };

    try {
      // Check for bundle analysis tools
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileUtils.fileExists(packageJsonPath)) {
        const packageContent = await fileUtils.readFile(packageJsonPath);
        const packageData = JSON.parse(packageContent);
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };        /**
   * Performs the specified operation
   * @param {any} deps['webpack-bundle-analyzer']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['webpack-bundle-analyzer']
   * @returns {any} The operation result
   */


        if (deps['webpack-bundle-analyzer']) {
          bundleAnalysis.optimization = 'webpack-bundle-analyzer';
        }        /**
   * Performs the specified operation
   * @param {any} deps['rollup-plugin-analyzer']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['rollup-plugin-analyzer']
   * @returns {any} The operation result
   */

        if (deps['rollup-plugin-analyzer']) {
          bundleAnalysis.optimization = 'rollup-plugin-analyzer';
        }        /**
   * Performs the specified operation
   * @param {any} deps['vite-bundle-analyzer']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} deps['vite-bundle-analyzer']
   * @returns {any} The operation result
   */

        if (deps['vite-bundle-analyzer']) {
          bundleAnalysis.optimization = 'vite-bundle-analyzer';
        }
      }

      // Check for code splitting
      const codeSamples = await this.extractCodeSamples(projectRoot);      /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */

      for (const sample of codeSamples) {
        if (sample.content.includes('import(') || sample.content.includes('lazy(')) {
          bundleAnalysis.splitting = 'implemented';
          break;
        }
      }

      // Check for compression
      const configFiles = ['webpack.config.js', 'vite.config.js', 'rollup.config.js'];      /**
   * Performs the specified operation
   * @param {Object} const configFile of configFiles
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {Object} const configFile of configFiles
   * @returns {any} The operation result
   */

      for (const configFile of configFiles) {
        const configPath = path.join(projectRoot, configFile);
        if (await fileUtils.fileExists(configPath)) {
          try {
            const configContent = await fileUtils.readFile(configPath);
            if (configContent.includes('compression') || configContent.includes('gzip')) {
              bundleAnalysis.compression = 'configured';
              break;
            }
          } catch (error) {
            // Ignore config files that can't be read
          }
        }
      }

    } catch (error) {
      // ERROR: `Error analyzing bundle performance: ${error.message}`
    }

    return bundleAnalysis;
  }

  // Private methods  /**
   * Performs the specified operation
   * @param {any} projectRoot
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} projectRoot
   * @returns {Promise} Promise that resolves with the result
   */


  async extractCodeSamples(projectRoot) {
    const samples = [];

    try {
      const jsFiles = await fileUtils.getFilesByExtension(projectRoot, ['.js', '.jsx', '.ts', '.tsx']);
      const filesToAnalyze = jsFiles.slice(0, 20); // Limit for performance      /**
   * Performs the specified operation
   * @param {any} const file of filesToAnalyze
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const file of filesToAnalyze
   * @returns {any} The operation result
   */


      for (const file of filesToAnalyze) {
        try {
          const content = await fileUtils.readFile(file);
          samples.push({
            file,
            content,
            extension: path.extname(file)
          });
        } catch (error) {
          // ERROR: `Error reading file ${file}: ${error.message}`
        }
      }
    } catch (error) {
      // ERROR: `Error extracting code samples: ${error.message}`
    }

    return samples;
  }  /**
   * Retrieves data
   * @param {any} codeSamples
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} codeSamples
   * @returns {string} The retrieved data
   */


  detectTargetAudience(codeSamples) {
    // Analyze code for target audience indicators  /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */

    for (const sample of codeSamples) {
      if (sample.content.includes('mobile') || sample.content.includes('responsive')) {
        return 'mobile';
      }
      if (sample.content.includes('desktop') || sample.content.includes('electron')) {
        return 'desktop';
      }
      if (sample.content.includes('server') || sample.content.includes('api')) {
        return 'server';
      }
    }
    return 'web';
  }  /**
   * Performs the specified operation
   * @param {any} codeSamples
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} codeSamples
   * @returns {any} The operation result
   */


  detectCriticalPath(codeSamples) {
    // Analyze code for critical path indicators  /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const sample of codeSamples
   * @returns {any} The operation result
   */

    for (const sample of codeSamples) {
      if (sample.content.includes('critical') || sample.content.includes('above-the-fold')) {
        return 'optimized';
      }
      if (sample.content.includes('lazy') || sample.content.includes('defer')) {
        return 'lazy-loaded';
      }
    }
    return 'standard';
  }  /**
   * Performs the specified operation
   * @param {any} content
   * @param {any} pattern
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} content
   * @param {any} pattern
   * @returns {any} The operation result
   */


  findLineNumber(content, pattern) {
    const lines = content.split('\n');    /**
   * Performs the specified operation
   * @param {any} let i - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} let i - Optional parameter
   * @returns {any} The operation result
   */

    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return -1;
  }  /**
   * Generates new data
   * @param {boolean} analysis
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Generates new data
   * @param {boolean} analysis
   * @returns {Promise} Promise that resolves with the result
   */


  async generatePerformanceRecommendations(analysis) {
    const recommendations = [];

    // Anti-pattern recommendations    /**
   * Performs the specified operation
   * @param {boolean} analysis.antiPatterns.length > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} analysis.antiPatterns.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (analysis.antiPatterns.length > 0) {
      const highSeverity = analysis.antiPatterns.filter(ap => ap.severity === 'high');      /**
   * Performs the specified operation
   * @param {any} highSeverity.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} highSeverity.length > 0
   * @returns {any} The operation result
   */

      if (highSeverity.length > 0) {
        recommendations.push({
          type: 'anti-pattern',
          priority: 'high',
          message: `${highSeverity.length} high-severity performance anti-patterns found`,
          suggestion: 'Address high-severity performance issues immediately'
        });
      }
    }

    // Optimization recommendations    /**
   * Performs the specified operation
   * @param {boolean} analysis.optimizations.length > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} analysis.optimizations.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (analysis.optimizations.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `${analysis.optimizations.length} optimization opportunities found`,
        suggestion: 'Consider implementing performance optimizations'
      });
    }

    // Monitoring recommendations    /**
   * Performs the specified operation
   * @param {boolean} analysis.monitoring.tools.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} analysis.monitoring.tools.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (analysis.monitoring.tools.length === 0) {
      recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        message: 'No performance monitoring tools detected',
        suggestion: 'Consider implementing performance monitoring'
      });
    }

    // Bundle analysis recommendations    /**
   * Performs the specified operation
   * @param {boolean} analysis.bundleAnalysis.optimization - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} analysis.bundleAnalysis.optimization - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (analysis.bundleAnalysis.optimization === 'unknown') {
      recommendations.push({
        type: 'bundle',
        priority: 'low',
        message: 'No bundle analysis tools detected',
        suggestion: 'Consider implementing bundle analysis for optimization'
      });
    }

    return recommendations;
  }
}
