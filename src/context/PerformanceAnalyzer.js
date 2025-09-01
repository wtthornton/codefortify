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
      console.log(`⚡ Analyzing performance needs in: ${projectRoot}`);

      const analysis = {
        requirements: await this.detectPerformanceRequirements(projectRoot),
        antiPatterns: await this.detectPerformanceAntiPatterns(projectRoot),
        optimizations: await this.detectOptimizationOpportunities(projectRoot),
        monitoring: await this.analyzePerformanceMonitoring(projectRoot),
        bundleAnalysis: await this.analyzeBundlePerformance(projectRoot),
        recommendations: []
      };

      analysis.recommendations = await this.generatePerformanceRecommendations(analysis);

      console.log(`✅ Performance analysis completed for: ${projectRoot}`);
      return analysis;

    } catch (error) {
      console.error(`❌ Error analyzing performance needs: ${error.message}`);
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
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };
        if (deps['web-vitals']) {requirements.monitoring = 'web-vitals';}
        if (deps['lighthouse']) {requirements.monitoring = 'lighthouse';}
        if (deps['bundle-analyzer']) {requirements.monitoring = 'bundle-analyzer';}

        // Check for performance-related scripts
        if (packageData.scripts) {
          if (packageData.scripts.build) {requirements.performanceBudget = 'build-optimized';}
          if (packageData.scripts.analyze) {requirements.monitoring = 'bundle-analysis';}
        }
      }

      // Check for performance configuration files
      const configFiles = [
        'lighthouse.config.js',
        'webpack.config.js',
        'vite.config.js',
        'rollup.config.js'
      ];

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
      console.error(`Error detecting performance requirements: ${error.message}`);
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
    const codeSamples = await this.extractCodeSamples(projectRoot);

    for (const sample of codeSamples) {
      for (const antiPattern of this.performancePatterns.antiPatterns) {
        const matches = sample.content.match(antiPattern.pattern);
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
    const codeSamples = await this.extractCodeSamples(projectRoot);

    for (const sample of codeSamples) {
      for (const optimization of this.performancePatterns.optimizationOpportunities) {
        const matches = sample.content.match(optimization.pattern);
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
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };

        if (deps['web-vitals']) {monitoring.tools.push('web-vitals');}
        if (deps['lighthouse']) {monitoring.tools.push('lighthouse');}
        if (deps['bundle-analyzer']) {monitoring.tools.push('bundle-analyzer');}
        if (deps['performance-now']) {monitoring.tools.push('performance-now');}
        if (deps['@sentry/performance']) {monitoring.tools.push('sentry');}
      }

      // Check for performance monitoring code
      const codeSamples = await this.extractCodeSamples(projectRoot);
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
      console.error(`Error analyzing performance monitoring: ${error.message}`);
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
        const deps = { ...packageData.dependencies, ...packageData.devDependencies };

        if (deps['webpack-bundle-analyzer']) {
          bundleAnalysis.optimization = 'webpack-bundle-analyzer';
        }
        if (deps['rollup-plugin-analyzer']) {
          bundleAnalysis.optimization = 'rollup-plugin-analyzer';
        }
        if (deps['vite-bundle-analyzer']) {
          bundleAnalysis.optimization = 'vite-bundle-analyzer';
        }
      }

      // Check for code splitting
      const codeSamples = await this.extractCodeSamples(projectRoot);
      for (const sample of codeSamples) {
        if (sample.content.includes('import(') || sample.content.includes('lazy(')) {
          bundleAnalysis.splitting = 'implemented';
          break;
        }
      }

      // Check for compression
      const configFiles = ['webpack.config.js', 'vite.config.js', 'rollup.config.js'];
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
      console.error(`Error analyzing bundle performance: ${error.message}`);
    }

    return bundleAnalysis;
  }

  // Private methods

  async extractCodeSamples(projectRoot) {
    const samples = [];

    try {
      const jsFiles = await fileUtils.getFilesByExtension(projectRoot, ['.js', '.jsx', '.ts', '.tsx']);
      const filesToAnalyze = jsFiles.slice(0, 20); // Limit for performance

      for (const file of filesToAnalyze) {
        try {
          const content = await fileUtils.readFile(file);
          samples.push({
            file,
            content,
            extension: path.extname(file)
          });
        } catch (error) {
          console.error(`Error reading file ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error extracting code samples: ${error.message}`);
    }

    return samples;
  }

  detectTargetAudience(codeSamples) {
    // Analyze code for target audience indicators
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
  }

  detectCriticalPath(codeSamples) {
    // Analyze code for critical path indicators
    for (const sample of codeSamples) {
      if (sample.content.includes('critical') || sample.content.includes('above-the-fold')) {
        return 'optimized';
      }
      if (sample.content.includes('lazy') || sample.content.includes('defer')) {
        return 'lazy-loaded';
      }
    }
    return 'standard';
  }

  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return -1;
  }

  async generatePerformanceRecommendations(analysis) {
    const recommendations = [];

    // Anti-pattern recommendations
    if (analysis.antiPatterns.length > 0) {
      const highSeverity = analysis.antiPatterns.filter(ap => ap.severity === 'high');
      if (highSeverity.length > 0) {
        recommendations.push({
          type: 'anti-pattern',
          priority: 'high',
          message: `${highSeverity.length} high-severity performance anti-patterns found`,
          suggestion: 'Address high-severity performance issues immediately'
        });
      }
    }

    // Optimization recommendations
    if (analysis.optimizations.length > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `${analysis.optimizations.length} optimization opportunities found`,
        suggestion: 'Consider implementing performance optimizations'
      });
    }

    // Monitoring recommendations
    if (analysis.monitoring.tools.length === 0) {
      recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        message: 'No performance monitoring tools detected',
        suggestion: 'Consider implementing performance monitoring'
      });
    }

    // Bundle analysis recommendations
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
