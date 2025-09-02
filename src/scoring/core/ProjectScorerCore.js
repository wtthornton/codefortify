/**
 * ProjectScorerCore - Core functionality for project scoring
 * 
 * This class handles the core scoring logic and orchestrates analyzers
 */

import { ProjectTypeDetector } from './ProjectTypeDetector.js';
import { AnalyzerOrchestrator } from './AnalyzerOrchestrator.js';
import { ScoreCalculator } from './ScoreCalculator.js';

export class ProjectScorerCore {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      projectName: config.projectName || path.basename(config.projectRoot || process.cwd()),
      verbose: config.verbose || false,
      categories: config.categories || ['all'],
      ...config
    };

    this.projectTypeDetector = new ProjectTypeDetector(this.config);
    this.analyzerOrchestrator = new AnalyzerOrchestrator(this.config);
    this.scoreCalculator = new ScoreCalculator(this.config);
  }

  /**
   * Detect project type automatically
   * @returns {string} Detected project type
   */
  detectProjectType() {
    return this.projectTypeDetector.detect();
  }

  /**
   * Run analysis for all categories
   * @returns {Promise<Object>} Analysis results
   */
  async runAnalysis() {
    return await this.analyzerOrchestrator.runAll();
  }

  /**
   * Calculate final scores from analysis results
   * @param {Object} analysisResults - Results from analyzers
   * @returns {Object} Calculated scores
   */
  calculateScores(analysisResults) {
    return this.scoreCalculator.calculate(analysisResults);
  }

  /**
   * Get project metadata
   * @returns {Object} Project metadata
   */
  getProjectMetadata() {
    return {
      name: this.config.projectName,
      type: this.config.projectType,
      root: this.config.projectRoot,
      timestamp: new Date().toISOString()
    };
  }
}
