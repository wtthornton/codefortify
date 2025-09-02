/**
 * LearningLoopController - Orchestrates the learning loop system
 *
 * This controller:
 * - Integrates with existing CodeFortify components
 * - Captures issues from analysis results
 * - Applies learned patterns to prevent issues
 * - Continuously improves CodeFortify's capabilities
 *
 * @author CodeFortify
 * @version 1.0.0
 */

import { IssueLearningSystem } from './IssueLearningSystem.js';
import { DynamicPatternLearner } from './DynamicPatternLearner.js';
import { PatternDatabase } from './PatternDatabase.js';
import { EventEmitter } from 'events';

/**


 * LearningLoopController class implementation


 *


 * Provides functionality for learningloopcontroller operations


 */


/**


 * LearningLoopController class implementation


 *


 * Provides functionality for learningloopcontroller operations


 */


export class LearningLoopController extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      learningEnabled: config.learningEnabled !== false,
      autoApplyPatterns: config.autoApplyPatterns !== false,
      ...config
    };

    this.issueLearningSystem = new IssueLearningSystem(config);
    this.patternLearner = new DynamicPatternLearner(config);
    this.patternDatabase = new PatternDatabase(config);

    this.learningMetrics = {
      issuesCaptured: 0,
      patternsGenerated: 0,
      issuesPrevented: 0,
      learningCycles: 0,
      effectiveness: 0
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the learning loop system
   */
  async initialize() {
    try {
      await this.issueLearningSystem.initializeLearningSystem();
      await this.patternLearner.initialize();
      await this.patternDatabase.initialize();

      this.emit('initialized', {
        issueSystem: true,
        patternLearner: true,
        patternDatabase: true
      });

      // LOG: 🔄 Learning Loop Controller initialized successfully
    } catch (error) {
      // ERROR: Failed to initialize learning loop:, error
      this.emit('error', error);
    }
  }

  /**
   * Process analysis results and learn from them
   * @param {Object} analysisResults - Results from CodeFortify analysis
   */
  async processAnalysisResults(analysisResults) {  /**
   * Performs the specified operation
   * @param {Object} !this.config.learningEnabled
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} !this.config.learningEnabled
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.config.learningEnabled) {return;}

    try {
      this.learningMetrics.learningCycles++;

      // Learn from the analysis results
      await this.issueLearningSystem.learnFromAnalysis(analysisResults);

      // Extract issues from analysis results
      const issues = this.extractIssuesFromAnalysis(analysisResults);

      // Record each issue      /**
   * Performs the specified operation
   * @param {boolean} const issue of issues
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} const issue of issues
   * @returns {boolean} True if successful, false otherwise
   */

      for (const issue of issues) {
        await this.issueLearningSystem.recordIssue(issue);
        this.learningMetrics.issuesCaptured++;
      }

      // Generate learning patterns
      await this.generateLearningPatterns(analysisResults);

      // Update effectiveness metrics
      this.updateEffectivenessMetrics();

      this.emit('analysisProcessed', {
        issuesCaptured: issues.length,
        learningCycle: this.learningMetrics.learningCycles
      });

    } catch (error) {
      // ERROR: Error processing analysis results:, error
      this.emit('error', error);
    }
  }

  /**
   * Apply learned patterns to prevent issues
   * @param {string} code - Code to analyze
   * @param {string} file - File path
   * @returns {Object} Prevention recommendations
   */
  async applyPreventionPatterns(code, file) {  /**
   * Performs the specified operation
   * @param {Object} !this.config.autoApplyPatterns
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} !this.config.autoApplyPatterns
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.config.autoApplyPatterns) {return { recommendations: [] };}

    try {
      // Check for known issues
      const potentialIssues = await this.issueLearningSystem.checkForKnownIssues(code, file);

      // Get prevention recommendations
      const recommendations = await this.issueLearningSystem.getPreventionRecommendations();

      // Apply learned patterns
      const appliedPatterns = await this.applyLearnedPatterns(code, file);

      this.learningMetrics.issuesPrevented += potentialIssues.length;

      return {
        potentialIssues,
        recommendations,
        appliedPatterns,
        preventionCount: potentialIssues.length
      };

    } catch (error) {
      // ERROR: Error applying prevention patterns:, error
      return { recommendations: [], error };
    }
  }

  /**
   * Record a solution that was applied
   * @param {string} issueId - ID of the issue that was solved
   * @param {Object} solution - Solution details
   */
  async recordSolution(issueId, solution) {
    try {
      const solutionId = await this.issueLearningSystem.recordSolution(issueId, solution);

      // Learn from the successful solution
      await this.patternLearner.learnFromSuccess({
        pattern: solution.code,
        context: solution.context,
        effectiveness: solution.effectiveness
      });

      this.emit('solutionRecorded', { issueId, solutionId, solution });

    } catch (error) {
      // ERROR: Error recording solution:, error
      this.emit('error', error);
    }
  }

  /**
   * Record CodeFortify improvement session results
   * @param {Object} sessionResults - Results from improvement session
   */
  async recordImprovementSession(sessionResults) {
    try {
      const sessionId = `session-${Date.now()}`;

      // Record ESLint fixes      /**
   * Performs the specified operation
   * @param {any} sessionResults.eslintFixes
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} sessionResults.eslintFixes
   * @returns {any} The operation result
   */

      if (sessionResults.eslintFixes) {
        await this.issueLearningSystem.recordESLintIssues(
          sessionResults.eslintFixes.issues,
          sessionResults.eslintFixes.strategy
        );
      }

      // Record JSDoc improvements      /**
   * Performs the specified operation
   * @param {any} sessionResults.jsdocImprovements
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} sessionResults.jsdocImprovements
   * @returns {any} The operation result
   */

      if (sessionResults.jsdocImprovements) {
        await this.issueLearningSystem.recordJSDocImprovements(
          sessionResults.jsdocImprovements
        );
      }

      // Record scoring enhancements      /**
   * Performs the specified operation
   * @param {any} sessionResults.scoringEnhancements
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} sessionResults.scoringEnhancements
   * @returns {any} The operation result
   */

      if (sessionResults.scoringEnhancements) {        /**
   * Performs the specified operation
   * @param {any} const enhancement of sessionResults.scoringEnhancements
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const enhancement of sessionResults.scoringEnhancements
   * @returns {any} The operation result
   */

        for (const enhancement of sessionResults.scoringEnhancements) {
          await this.issueLearningSystem.recordScoringEnhancement(enhancement);
        }
      }

      // Record overall session metrics
      await this.issueLearningSystem.recordCodeFortifyIssue(
        'improvement-session',
        `CodeFortify improvement session: ${sessionResults.description}`,
        'project-wide',
        `Applied ${sessionResults.totalImprovements} improvements`,
        {
          sessionId,
          totalImprovements: sessionResults.totalImprovements,
          scoreImprovement: sessionResults.scoreImprovement,
          categoriesImproved: sessionResults.categoriesImproved,
          timeSpent: sessionResults.timeSpent,
          severity: 'high',
          impact: 'overall-quality'
        }
      );

      this.emit('improvementSessionRecorded', { sessionId, sessionResults });

    } catch (error) {
      // ERROR: Error recording improvement session:, error
      this.emit('error', error);
    }
  }

  /**
   * Generate learning patterns from analysis results
   * @param {Object} analysisResults - Analysis results to learn from
   */
  async generateLearningPatterns(analysisResults) {
    try {
      const patterns = [];

      // Extract patterns from issues      /**
   * Performs the specified operation
   * @param {boolean} const issue of analysisResults.issues || []
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} const issue of analysisResults.issues || []
   * @returns {boolean} True if successful, false otherwise
   */

      for (const issue of analysisResults.issues || []) {
        const pattern = this.createPatternFromIssue(issue);        /**
   * Performs the specified operation
   * @param {any} pattern
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} pattern
   * @returns {any} The operation result
   */

        if (pattern) {
          patterns.push(pattern);
        }
      }

      // Extract patterns from improvements      /**
   * Performs the specified operation
   * @param {boolean} const improvement of analysisResults.improvements || []
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} const improvement of analysisResults.improvements || []
   * @returns {boolean} True if successful, false otherwise
   */

      for (const improvement of analysisResults.improvements || []) {
        const pattern = this.createPatternFromImprovement(improvement);        /**
   * Performs the specified operation
   * @param {any} pattern
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} pattern
   * @returns {any} The operation result
   */

        if (pattern) {
          patterns.push(pattern);
        }
      }

      // Store patterns in the database      /**
   * Performs the specified operation
   * @param {any} const pattern of patterns
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const pattern of patterns
   * @returns {any} The operation result
   */

      for (const pattern of patterns) {
        await this.patternDatabase.storePattern(pattern);
        this.learningMetrics.patternsGenerated++;
      }

      this.emit('patternsGenerated', { count: patterns.length });

    } catch (error) {
      // ERROR: Error generating learning patterns:, error
      this.emit('error', error);
    }
  }

  /**
   * Get learning insights and recommendations
   * @returns {Object} Learning insights
   */
  async getLearningInsights() {
    try {
      const learningReport = this.issueLearningSystem.generateLearningReport();
      const topPatterns = await this.patternDatabase.getTopPatterns(10);
      const effectiveness = await this.patternLearner.getEffectivenessMetrics();

      return {
        report: learningReport,
        topPatterns,
        effectiveness,
        metrics: this.learningMetrics,
        recommendations: this.generateRecommendations()
      };

    } catch (error) {
      // ERROR: Error getting learning insights:, error
      return { error };
    }
  }

  /**
   * Export learning data for use in other projects
   * @param {string} format - Export format
   * @returns {string} Exported learning data
   */
  async exportLearningData(format = 'json') {
    try {
      const issueData = await this.issueLearningSystem.exportLearningData(format);
      const patternData = await this.patternDatabase.exportPatterns(format);

      return {
        issues: issueData,
        patterns: patternData,
        metrics: this.learningMetrics,
        exportedAt: new Date().toISOString()
      };

    } catch (error) {
      // ERROR: Error exporting learning data:, error
      return { error };
    }
  }

  /**
   * Import learning data from another project
   * @param {Object} learningData - Learning data to import
   */
  async importLearningData(learningData) {
    try {      /**
   * Performs the specified operation
   * @param {boolean} learningData.issues
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} learningData.issues
   * @returns {boolean} True if successful, false otherwise
   */

      if (learningData.issues) {
        // Import issues        /**
   * Performs the specified operation
   * @param {boolean} const issue of learningData.issues
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} const issue of learningData.issues
   * @returns {boolean} True if successful, false otherwise
   */

        for (const issue of learningData.issues) {
          await this.issueLearningSystem.recordIssue(issue);
        }
      }      /**
   * Performs the specified operation
   * @param {any} learningData.patterns
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} learningData.patterns
   * @returns {any} The operation result
   */


      if (learningData.patterns) {
        // Import patterns        /**
   * Performs the specified operation
   * @param {any} const pattern of learningData.patterns
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const pattern of learningData.patterns
   * @returns {any} The operation result
   */

        for (const pattern of learningData.patterns) {
          await this.patternDatabase.storePattern(pattern);
        }
      }

      this.emit('learningDataImported', {
        issuesImported: learningData.issues?.length || 0,
        patternsImported: learningData.patterns?.length || 0
      });

    } catch (error) {
      // ERROR: Error importing learning data:, error
      this.emit('error', error);
    }
  }

  // Private helper methods  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupEventHandlers() {
    this.issueLearningSystem.on('newIssue', (data) => {
      this.emit('newIssue', data);
    });

    this.issueLearningSystem.on('recurringIssue', (data) => {
      this.emit('recurringIssue', data);
    });

    this.issueLearningSystem.on('issueResolved', (data) => {
      this.emit('issueResolved', data);
    });

    // Note: DynamicPatternLearner doesn't extend EventEmitter
    // We'll handle pattern learning events differently
  }  /**
   * Performs the specified operation
   * @param {boolean} analysisResults
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {boolean} analysisResults
   * @returns {boolean} True if successful, false otherwise
   */


  extractIssuesFromAnalysis(analysisResults) {
    const issues = [];

    // Extract issues from each category
    for (const [category, data] of Object.entries(analysisResults.categories || {})) {      /**
   * Performs the specified operation
   * @param {boolean} data.issues
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} data.issues
   * @returns {boolean} True if successful, false otherwise
   */

      if (data.issues) {        /**
   * Performs the specified operation
   * @param {boolean} const issue of data.issues
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} const issue of data.issues
   * @returns {boolean} True if successful, false otherwise
   */

        for (const issue of data.issues) {
          issues.push({
            type: category,
            category: 'analysis',
            message: issue.message || issue.description,
            file: issue.file || 'project-wide',
            line: issue.line,
            severity: issue.severity || 'medium',
            context: { category, analysisResults }
          });
        }
      }
    }

    return issues;
  }  /**
   * Creates a new resource
   * @param {boolean} issue
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Creates a new resource
   * @param {boolean} issue
   * @returns {boolean} True if successful, false otherwise
   */


  createPatternFromIssue(issue) {
    return {
      id: `issue-pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'issue-prevention',
      category: issue.category || 'general',
      pattern: issue.message,
      context: {
        file: issue.file,
        line: issue.line,
        severity: issue.severity
      },
      metadata: {
        source: 'analysis',
        createdAt: new Date().toISOString(),
        effectiveness: 0.8 // Default effectiveness
      }
    };
  }  /**
   * Creates a new resource
   * @param {any} improvement
   * @returns {any} The created resource
   */
  /**
   * Creates a new resource
   * @param {any} improvement
   * @returns {any} The created resource
   */


  createPatternFromImprovement(improvement) {
    return {
      id: `improvement-pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'improvement',
      category: improvement.category || 'general',
      pattern: improvement.description,
      context: {
        impact: improvement.impact,
        priority: improvement.priority
      },
      metadata: {
        source: 'analysis',
        createdAt: new Date().toISOString(),
        effectiveness: improvement.impact || 0.7
      }
    };
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} file
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} file
   * @returns {Promise} Promise that resolves with the result
   */


  async applyLearnedPatterns(code, file) {
    const appliedPatterns = [];

    try {
      // Get relevant patterns for this file type
      const fileType = this.getFileType(file);
      const patterns = await this.patternDatabase.searchPatterns({
        context: { fileType },
        limit: 5
      });      /**
   * Performs the specified operation
   * @param {any} const pattern of patterns
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const pattern of patterns
   * @returns {any} The operation result
   */


      for (const pattern of patterns) {
        if (this.shouldApplyPattern(code, pattern)) {
          const result = await this.applyPattern(code, pattern);          /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */

          if (result.success) {
            appliedPatterns.push({
              patternId: pattern.id,
              type: pattern.type,
              applied: true,
              result: result
            });
          }
        }
      }

    } catch (error) {
      // ERROR: Error applying learned patterns:, error
    }

    return appliedPatterns;
  }  /**
   * Retrieves data
   * @param {any} file
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} file
   * @returns {string} The retrieved data
   */


  getFileType(file) {
    const ext = file.split('.').pop();
    return ext || 'unknown';
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} pattern
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} pattern
   * @returns {any} The operation result
   */


  shouldApplyPattern(code, pattern) {
    // Determine if pattern should be applied based on code content  /**
   * Performs the specified operation
   * @param {any} pattern.type - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {any} pattern.type - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (pattern.type === 'issue-prevention') {
      return this.matchesProblematicCode(code, pattern);
    }

    return false;
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} pattern
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} pattern
   * @returns {any} The operation result
   */


  matchesProblematicCode(code, pattern) {
    // Check if code matches problematic patterns
    if (pattern.pattern.includes('unused variable') && /let\s+\w+\s*=.*?;/.test(code)) {
      return true;
    }

    if (pattern.pattern.includes('console statement') && /console.(log|warn|error)/.test(code)) {
      return true;
    }

    return false;
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} pattern
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} pattern
   * @returns {Promise} Promise that resolves with the result
   */


  async applyPattern(code, pattern) {
    // Apply the pattern to fix the code
    let modifiedCode = code;
    let success = false;

    try {      /**
   * Performs the specified operation
   * @param {any} pattern.type - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {any} pattern.type - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (pattern.type === 'issue-prevention') {
        if (pattern.pattern.includes('unused variable')) {
          // Fix unused variables by prefixing with underscore
          modifiedCode = code.replace(/let\s+(\w+)\s*=/g, 'let _$1 =');
          success = true;
        }

        if (pattern.pattern.includes('console statement')) {
          // Remove console statements
          modifiedCode = code.replace(/console.(log|warn|error)\([^)]*\);?\s*/g, '');
          success = true;
        }
      }

    } catch (error) {
      // ERROR: Error applying pattern:, error
    }

    return {
      success,
      originalCode: code,
      modifiedCode,
      patternId: pattern.id
    };
  }  /**
   * Updates existing data
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @returns {any} The operation result
   */


  updateEffectivenessMetrics() {  /**
   * Performs the specified operation
   * @param {boolean} this.learningMetrics.issuesCaptured > 0
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.learningMetrics.issuesCaptured > 0
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.learningMetrics.issuesCaptured > 0) {
      this.learningMetrics.effectiveness =
        this.learningMetrics.issuesPrevented / this.learningMetrics.issuesCaptured;
    }
  }  /**
   * Generates new data
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @returns {any} The created resource
   */


  generateRecommendations() {
    const recommendations = [];    /**
   * Performs the specified operation
   * @param {boolean} this.learningMetrics.effectiveness < 0.5
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.learningMetrics.effectiveness < 0.5
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.learningMetrics.effectiveness < 0.5) {
      recommendations.push({
        type: 'learning',
        message: 'Learning effectiveness is low. Consider reviewing and updating patterns.',
        priority: 'high'
      });
    }    /**
   * Performs the specified operation
   * @param {boolean} this.learningMetrics.issuesPrevented < this.learningMetrics.issuesCaptured * 0.3
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.learningMetrics.issuesPrevented < this.learningMetrics.issuesCaptured * 0.3
   * @returns {boolean} True if successful, false otherwise
   */


    if (this.learningMetrics.issuesPrevented < this.learningMetrics.issuesCaptured * 0.3) {
      recommendations.push({
        type: 'prevention',
        message: 'Issue prevention rate is low. Focus on applying learned patterns.',
        priority: 'medium'
      });
    }

    return recommendations;
  }
}
