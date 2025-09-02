/**
 * AnalyzerOrchestrator - Orchestrates all analyzers for project analysis
 */

import { StructureAnalyzer } from '../analyzers/StructureAnalyzer.js';
import { QualityAnalyzer } from '../analyzers/QualityAnalyzer.js';
import { PerformanceAnalyzer } from '../analyzers/PerformanceAnalyzer.js';
import { TestingAnalyzer } from '../analyzers/TestingAnalyzer.js';
import { SecurityAnalyzer } from '../analyzers/SecurityAnalyzer.js';
import { DeveloperExperienceAnalyzer } from '../analyzers/DeveloperExperienceAnalyzer.js';
import { CompletenessAnalyzer } from '../analyzers/CompletenessAnalyzer.js';

export class AnalyzerOrchestrator {
  constructor(config) {
    this.config = config;
    this.analyzers = this.initializeAnalyzers();
  }

  /**
   * Initialize all analyzers
   * @returns {Object} Map of analyzers
   */
  initializeAnalyzers() {
    return {
      structure: new StructureAnalyzer(this.config),
      quality: new QualityAnalyzer(this.config),
      performance: new PerformanceAnalyzer(this.config),
      testing: new TestingAnalyzer(this.config),
      security: new SecurityAnalyzer(this.config),
      developerExperience: new DeveloperExperienceAnalyzer(this.config),
      completeness: new CompletenessAnalyzer(this.config)
    };
  }

  /**
   * Run all analyzers
   * @returns {Promise<Object>} Analysis results from all analyzers
   */
  async runAll() {
    const results = {};
    
    for (const [name, analyzer] of Object.entries(this.analyzers)) {
      try {
        if (this.config.verbose) {
          console.log(`🔍 Running ${name} analysis...`);
        }
        
        results[name] = await analyzer.analyze();
        
        if (this.config.verbose) {
          console.log(`✅ ${name} analysis completed`);
        }
      } catch (error) {
        console.error(`❌ Error in ${name} analysis:`, error.message);
        results[name] = { error: error.message, score: 0 };
      }
    }
    
    return results;
  }

  /**
   * Run specific analyzer
   * @param {string} analyzerName - Name of analyzer to run
   * @returns {Promise<Object>} Analysis result
   */
  async runAnalyzer(analyzerName) {
    const analyzer = this.analyzers[analyzerName];
    
    if (!analyzer) {
      throw new Error(`Unknown analyzer: ${analyzerName}`);
    }
    
    return await analyzer.analyze();
  }

  /**
   * Get available analyzers
   * @returns {Array<string>} List of analyzer names
   */
  getAvailableAnalyzers() {
    return Object.keys(this.analyzers);
  }
}
