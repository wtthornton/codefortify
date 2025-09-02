/**
 * Recommendation Engine Factory
 * Creates appropriate recommendation engines based on context
 */

import { SecurityRecommendationEngine } from './SecurityRecommendationEngine.js';
import { PerformanceRecommendationEngine } from './PerformanceRecommendationEngine.js';
import { QualityRecommendationEngine } from './QualityRecommendationEngine.js';
import { TestingRecommendationEngine } from './TestingRecommendationEngine.js';
import { AccessibilityRecommendationEngine } from './AccessibilityRecommendationEngine.js';
import { FrameworkSpecificEngine } from './FrameworkSpecificEngine.js';

export class RecommendationEngineFactory {
  constructor() {
    this.engines = new Map();
    this.initializeEngines();
  }

  /**
   * Initialize all recommendation engines
   */
  initializeEngines() {
    this.engines.set('security', SecurityRecommendationEngine);
    this.engines.set('performance', PerformanceRecommendationEngine);
    this.engines.set('quality', QualityRecommendationEngine);
    this.engines.set('testing', TestingRecommendationEngine);
    this.engines.set('accessibility', AccessibilityRecommendationEngine);
    this.engines.set('framework', FrameworkSpecificEngine);
  }

  /**
   * Create recommendation engine by type
   * @param {string} engineType - Type of engine to create
   * @param {Object} options - Engine configuration options
   * @returns {Object} Recommendation engine instance
   */
  createEngine(engineType, options = {}) {
    const EngineClass = this.engines.get(engineType);
    if (!EngineClass) {
      throw new Error(`Unknown engine type: ${engineType}`);
    }

    return new EngineClass(options);
  }

  /**
   * Create all engines for comprehensive analysis
   * @param {Object} options - Configuration options
   * @returns {Array} Array of engine instances
   */
  createAllEngines(options = {}) {
    return Array.from(this.engines.keys()).map(type => ({
      type,
      engine: this.createEngine(type, options)
    }));
  }

  /**
   * Create engines based on context requirements
   * @param {Object} context - Code context
   * @param {Array} requestedTypes - Specific engine types to create
   * @returns {Array} Relevant engine instances
   */
  createContextualEngines(context, requestedTypes = []) {
    const engines = [];

    // Always include quality engine
    engines.push({
      type: 'quality',
      engine: this.createEngine('quality', context)
    });

    // Add security engine for sensitive files
    if (this.needsSecurityAnalysis(context)) {
      engines.push({
        type: 'security',
        engine: this.createEngine('security', context)
      });
    }

    // Add performance engine for complex files
    if (this.needsPerformanceAnalysis(context)) {
      engines.push({
        type: 'performance',
        engine: this.createEngine('performance', context)
      });
    }

    // Add testing engine for non-test files
    if (this.needsTestingAnalysis(context)) {
      engines.push({
        type: 'testing',
        engine: this.createEngine('testing', context)
      });
    }

    // Add accessibility engine for UI components
    if (this.needsAccessibilityAnalysis(context)) {
      engines.push({
        type: 'accessibility',
        engine: this.createEngine('accessibility', context)
      });
    }

    // Add framework-specific engine
    if (context.framework && context.framework.name) {
      engines.push({
        type: 'framework',
        engine: this.createEngine('framework', {
          framework: context.framework,
          ...context
        })
      });
    }

    // Add any specifically requested engines
    requestedTypes.forEach(type => {
      if (!engines.find(e => e.type === type)) {
        try {
          engines.push({
            type,
            engine: this.createEngine(type, context)
          });
        } catch (error) {
          console.warn(`Could not create requested engine: ${type}`);
        }
      }
    });

    return engines;
  }

  /**
   * Check if security analysis is needed
   * @param {Object} context - Code context
   * @returns {boolean} True if security analysis needed
   */
  needsSecurityAnalysis(context) {
    // Check for security-sensitive patterns
    const securityPatterns = ['auth', 'password', 'token', 'api', 'database'];
    const hasSecurityConcerns = securityPatterns.some(pattern =>
      context.filePath.toLowerCase().includes(pattern) ||
      context.detectedPatterns?.includes(pattern)
    );

    return hasSecurityConcerns || context.dependencies?.some(dep =>
      ['express', 'passport', 'jwt', 'bcrypt', 'crypto'].includes(dep)
    );
  }

  /**
   * Check if performance analysis is needed
   * @param {Object} context - Code context
   * @returns {boolean} True if performance analysis needed
   */
  needsPerformanceAnalysis(context) {
    const complexityThreshold = 5;
    const lineThreshold = 200;

    return context.complexity?.score > complexityThreshold ||
           context.lines?.length > lineThreshold ||
           context.detectedPatterns?.includes('async-await') ||
           context.detectedPatterns?.includes('promises');
  }

  /**
   * Check if testing analysis is needed
   * @param {Object} context - Code context
   * @returns {boolean} True if testing analysis needed
   */
  needsTestingAnalysis(context) {
    // Don't analyze test files themselves
    return context.fileType !== 'test' &&
           context.fileType !== 'config' &&
           context.functions?.length > 0;
  }

  /**
   * Check if accessibility analysis is needed
   * @param {Object} context - Code context
   * @returns {boolean} True if accessibility analysis needed
   */
  needsAccessibilityAnalysis(context) {
    return context.fileType === 'component' ||
           context.detectedPatterns?.includes('jsx') ||
           context.detectedPatterns?.includes('react-hooks');
  }

  /**
   * Get available engine types
   * @returns {Array<string>} Available engine type names
   */
  getAvailableEngineTypes() {
    return Array.from(this.engines.keys());
  }

  /**
   * Register a custom engine
   * @param {string} type - Engine type name
   * @param {Function} EngineClass - Engine class constructor
   */
  registerEngine(type, EngineClass) {
    this.engines.set(type, EngineClass);
  }
}