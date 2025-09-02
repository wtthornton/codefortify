/**
 * Real-time Quality Monitor for Context7
 * Monitors code quality in real-time and provides immediate feedback
 *
 * Features:
 * - Real-time code quality monitoring
 * - Immediate feedback on code changes
 * - Comprehensive quality metrics
 * - Proactive quality suggestions
 */

import { CodeAnalysisEngine } from './CodeAnalysisEngine.js';
import { QualityThresholds } from './QualityThresholds.js';
import { SuggestionGenerator } from './SuggestionGenerator.js';
import { fileUtils } from '../utils/fileUtils.js';
import path from 'path';

/**


 * RealtimeQualityMonitor class implementation


 *


 * Provides functionality for realtimequalitymonitor operations


 */


/**


 * RealtimeQualityMonitor class implementation


 *


 * Provides functionality for realtimequalitymonitor operations


 */


export class RealtimeQualityMonitor {
  constructor(config = {}) {
    this.config = {
      monitoringEnabled: config.monitoringEnabled !== false,
      analysisInterval: config.analysisInterval || 1000, // 1 second
      maxHistorySize: config.maxHistorySize || 100,
      alertThresholds: config.alertThresholds || {
        critical: 0.3,
        warning: 0.6
      },
      qualityThresholds: config.qualityThresholds || {
        accessibility: 0.7,
        codeComplexity: 0.6,
        documentation: 0.5,
        maintainability: 0.7,
        performance: 0.8,
        security: 0.9,
        testCoverage: 0.8
      },
      ...config
    };

    this.qualityThresholds = new QualityThresholds(this.config.qualityThresholds);
    this.analysisEngine = new CodeAnalysisEngine(this.config);
    this.suggestionGenerator = new SuggestionGenerator(this.config);
    this.monitoringSessions = new Map();
    this.qualityHistory = new Map();
    this.eventListeners = new Map();
  }

  /**
   * Start monitoring a file
   * @param {string} filePath - File path to monitor
   * @param {Object} context - Project context
   * @returns {Promise<string>} Session ID
   */
  async startMonitoring(filePath, context) {
    try {
      const sessionId = this.generateSessionId();
      const session = {
        id: sessionId,
        filePath,
        context,
        startTime: new Date(),
        metrics: {},
        issues: [],
        suggestions: [],
        lastAnalysis: null,
        isActive: true
      };

      this.monitoringSessions.set(sessionId, session);

      // LOG: `🔍 Started monitoring: ${filePath} (Session: ${sessionId})`
      return sessionId;

    } catch (error) {
      // ERROR: `❌ Error starting monitoring: ${error.message}`
      throw error;
    }
  }

  /**
   * Stop monitoring a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async stopMonitoring(sessionId) {
    try {
      const session = this.monitoringSessions.get(sessionId);      /**
   * Performs the specified operation
   * @param {any} !session
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !session
   * @returns {any} The operation result
   */

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      session.isActive = false;
      session.endTime = new Date();

      // LOG: `⏹️ Stopped monitoring session: ${sessionId}`
      return true;

    } catch (error) {
      // ERROR: `❌ Error stopping monitoring: ${error.message}`
      return false;
    }
  }

  /**
   * Monitor code quality for a session
   * @param {string} code - Code to analyze
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Quality analysis result
   */
  async monitorCodeQuality(code, sessionId) {
    try {
      const session = this.monitoringSessions.get(sessionId);      /**
   * Performs the specified operation
   * @param {any} !session
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !session
   * @returns {any} The operation result
   */

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }      /**
   * Performs the specified operation
   * @param {boolean} !session.isActive
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} !session.isActive
   * @returns {boolean} True if successful, false otherwise
   */


      if (!session.isActive) {
        throw new Error(`Session ${sessionId} is not active`);
      }

      // Analyze code quality
      const metrics = await this.analysisEngine.analyzeCode(code);
      const issues = await this.identifyQualityIssues(metrics, session.context);
      const suggestions = await this.suggestionGenerator.generateSuggestions(issues, code, session.context);
      const overall = this.calculateOverallScore(metrics);

      // Update session
      session.metrics = metrics;
      session.issues = issues;
      session.suggestions = suggestions;
      session.lastAnalysis = new Date();

      // Store quality history
      this.storeQualityHistory(sessionId, metrics, issues, suggestions);

      // Emit quality update event
      this.emitQualityUpdate(sessionId, {
        metrics,
        issues,
        suggestions,
        overall
      });

      return {
        sessionId,
        metrics,
        issues,
        suggestions,
        overall,
        timestamp: new Date()
      };

    } catch (error) {
      // ERROR: `❌ Error monitoring code quality: ${error.message}`
      throw error;
    }
  }

  /**
   * Get current quality status for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Current quality status
   */
  async getQualityStatus(sessionId) {
    try {
      const session = this.monitoringSessions.get(sessionId);      /**
   * Performs the specified operation
   * @param {any} !session
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !session
   * @returns {any} The operation result
   */

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      return {
        sessionId,
        filePath: session.filePath,
        isActive: session.isActive,
        startTime: session.startTime,
        lastAnalysis: session.lastAnalysis,
        metrics: session.metrics,
        issues: session.issues,
        suggestions: session.suggestions,
        overall: this.calculateOverallScore(session.metrics)
      };

    } catch (error) {
      // ERROR: `❌ Error getting quality status: ${error.message}`
      throw error;
    }
  }

  /**
   * Get quality history for a session
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of history entries
   * @returns {Promise<Array>} Quality history
   */
  async getQualityHistory(sessionId, limit = 50) {
    try {
      const history = this.qualityHistory.get(sessionId) || [];
      return history.slice(-limit);

    } catch (error) {
      // ERROR: `❌ Error getting quality history: ${error.message}`
      return [];
    }
  }

  /**
   * Get all active monitoring sessions
   * @returns {Promise<Array>} Active sessions
   */
  async getActiveSessions() {
    try {
      const activeSessions = [];      /**
   * Performs the specified operation
   * @param {number} const [sessionId
   * @param {boolean} session] of this.monitoringSessions
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {number} const [sessionId
   * @param {boolean} session] of this.monitoringSessions
   * @returns {boolean} True if successful, false otherwise
   */


      for (const [sessionId, session] of this.monitoringSessions) {        /**
   * Performs the specified operation
   * @param {boolean} session.isActive
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} session.isActive
   * @returns {boolean} True if successful, false otherwise
   */

        if (session.isActive) {
          activeSessions.push({
            sessionId,
            filePath: session.filePath,
            startTime: session.startTime,
            lastAnalysis: session.lastAnalysis,
            overall: this.calculateOverallScore(session.metrics)
          });
        }
      }

      return activeSessions;

    } catch (error) {
      // ERROR: `❌ Error getting active sessions: ${error.message}`
      return [];
    }
  }

  /**
   * Add event listener for quality updates
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   */
  addEventListener(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event).push(listener);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   */
  removeEventListener(event, listener) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(listener);      /**
   * Performs the specified operation
   * @param {number} index > -1
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {number} index > -1
   * @returns {any} The operation result
   */

      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get monitoring statistics
   * @returns {Promise<Object>} Monitoring statistics
   */
  async getMonitoringStats() {
    try {
      const stats = {
        totalSessions: this.monitoringSessions.size,
        activeSessions: 0,
        totalAnalyses: 0,
        averageQuality: 0,
        qualityDistribution: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0
        },
        commonIssues: {},
        topSuggestions: {}
      };

      let totalQuality = 0;
      let analysisCount = 0;      /**
   * Performs the specified operation
   * @param {number} const [sessionId
   * @param {boolean} session] of this.monitoringSessions
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {number} const [sessionId
   * @param {boolean} session] of this.monitoringSessions
   * @returns {boolean} True if successful, false otherwise
   */


      for (const [sessionId, session] of this.monitoringSessions) {        /**
   * Performs the specified operation
   * @param {boolean} session.isActive
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} session.isActive
   * @returns {boolean} True if successful, false otherwise
   */

        if (session.isActive) {
          stats.activeSessions++;
        }

        if (session.metrics && Object.keys(session.metrics).length > 0) {
          const overall = this.calculateOverallScore(session.metrics);
          totalQuality += overall;
          analysisCount++;

          // Categorize quality          /**
   * Performs the specified operation
   * @param {any} overall > - Optional parameter
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} overall > - Optional parameter
   * @returns {any} The operation result
   */

          if (overall >= 90) {
            stats.qualityDistribution.excellent++;
          } else if (overall >= 75) {
            stats.qualityDistribution.good++;
          } else if (overall >= 60) {
            stats.qualityDistribution.fair++;
          } else {
            stats.qualityDistribution.poor++;
          }

          // Count common issues          /**
   * Performs the specified operation
   * @param {boolean} const issue of session.issues
   * @returns {boolean} True if successful, false otherwise
   */
          /**
   * Performs the specified operation
   * @param {boolean} const issue of session.issues
   * @returns {boolean} True if successful, false otherwise
   */

          for (const issue of session.issues) {
            stats.commonIssues[issue.type] = (stats.commonIssues[issue.type] || 0) + 1;
          }

          // Count top suggestions          /**
   * Performs the specified operation
   * @param {any} const suggestion of session.suggestions
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} const suggestion of session.suggestions
   * @returns {any} The operation result
   */

          for (const suggestion of session.suggestions) {
            stats.topSuggestions[suggestion.type] = (stats.topSuggestions[suggestion.type] || 0) + 1;
          }
        }
      }

      stats.totalAnalyses = analysisCount;
      stats.averageQuality = analysisCount > 0 ? totalQuality / analysisCount : 0;

      return stats;

    } catch (error) {
      // ERROR: `❌ Error getting monitoring stats: ${error.message}`
      return {
        error: error.message
      };
    }
  }

  /**
   * Clean up old sessions and history
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldData(maxAge = 24 * 60 * 60 * 1000) {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      let cleanedSessions = 0;
      let cleanedHistory = 0;

      // Clean up old sessions      /**
   * Performs the specified operation
   * @param {number} const [sessionId
   * @param {boolean} session] of this.monitoringSessions
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {number} const [sessionId
   * @param {boolean} session] of this.monitoringSessions
   * @returns {boolean} True if successful, false otherwise
   */

      for (const [sessionId, session] of this.monitoringSessions) {        /**
   * Performs the specified operation
   * @param {boolean} !session.isActive && session.endTime && session.endTime < cutoffDate
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} !session.isActive && session.endTime && session.endTime < cutoffDate
   * @returns {boolean} True if successful, false otherwise
   */

        if (!session.isActive && session.endTime && session.endTime < cutoffDate) {
          this.monitoringSessions.delete(sessionId);
          cleanedSessions++;
        }
      }

      // Clean up old history      /**
   * Performs the specified operation
   * @param {number} const [sessionId
   * @param {boolean} history] of this.qualityHistory
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {number} const [sessionId
   * @param {boolean} history] of this.qualityHistory
   * @returns {boolean} True if successful, false otherwise
   */

      for (const [sessionId, history] of this.qualityHistory) {
        const filteredHistory = history.filter(entry =>
          new Date(entry.timestamp) > cutoffDate
        );        /**
   * Performs the specified operation
   * @param {boolean} filteredHistory.length ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} filteredHistory.length ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */


        if (filteredHistory.length !== history.length) {
          this.qualityHistory.set(sessionId, filteredHistory);
          cleanedHistory += history.length - filteredHistory.length;
        }
      }

      return {
        success: true,
        cleanedSessions,
        cleanedHistory
      };

    } catch (error) {
      // ERROR: `❌ Error cleaning up old data: ${error.message}`
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private methods  /**
   * Performs the specified operation
   * @param {any} metrics
   * @param {any} context
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} metrics
   * @param {any} context
   * @returns {Promise} Promise that resolves with the result
   */


  async identifyQualityIssues(metrics, context) {
    const issues = [];

    // Check complexity    /**
   * Performs the specified operation
   * @param {boolean} metrics.complexity > this.qualityThresholds.complexity
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} metrics.complexity > this.qualityThresholds.complexity
   * @returns {boolean} True if successful, false otherwise
   */

    if (metrics.complexity > this.qualityThresholds.complexity) {
      issues.push({
        type: 'complexity',
        severity: 'high',
        message: `High complexity detected: ${metrics.complexity}`,
        threshold: this.qualityThresholds.complexity,
        value: metrics.complexity
      });
    }

    // Check maintainability    /**
   * Performs the specified operation
   * @param {boolean} metrics.maintainability < this.qualityThresholds.maintainability
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} metrics.maintainability < this.qualityThresholds.maintainability
   * @returns {boolean} True if successful, false otherwise
   */

    if (metrics.maintainability < this.qualityThresholds.maintainability) {
      issues.push({
        type: 'maintainability',
        severity: 'medium',
        message: `Low maintainability: ${metrics.maintainability}%`,
        threshold: this.qualityThresholds.maintainability,
        value: metrics.maintainability
      });
    }

    // Check security    /**
   * Performs the specified operation
   * @param {boolean} metrics.security < this.qualityThresholds.security
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} metrics.security < this.qualityThresholds.security
   * @returns {boolean} True if successful, false otherwise
   */

    if (metrics.security < this.qualityThresholds.security) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: `Security issues detected: ${metrics.security}%`,
        threshold: this.qualityThresholds.security,
        value: metrics.security
      });
    }

    // Check performance    /**
   * Performs the specified operation
   * @param {boolean} metrics.performance < this.qualityThresholds.performance
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} metrics.performance < this.qualityThresholds.performance
   * @returns {boolean} True if successful, false otherwise
   */

    if (metrics.performance < this.qualityThresholds.performance) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: `Performance issues detected: ${metrics.performance}%`,
        threshold: this.qualityThresholds.performance,
        value: metrics.performance
      });
    }

    // Check readability    /**
   * Performs the specified operation
   * @param {boolean} metrics.readability < this.qualityThresholds.readability
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} metrics.readability < this.qualityThresholds.readability
   * @returns {boolean} True if successful, false otherwise
   */

    if (metrics.readability < this.qualityThresholds.readability) {
      issues.push({
        type: 'readability',
        severity: 'low',
        message: `Low readability: ${metrics.readability}%`,
        threshold: this.qualityThresholds.readability,
        value: metrics.readability
      });
    }

    // Check testability    /**
   * Performs the specified operation
   * @param {boolean} metrics.testability < this.qualityThresholds.testability
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} metrics.testability < this.qualityThresholds.testability
   * @returns {boolean} True if successful, false otherwise
   */

    if (metrics.testability < this.qualityThresholds.testability) {
      issues.push({
        type: 'testability',
        severity: 'medium',
        message: `Low testability: ${metrics.testability}%`,
        threshold: this.qualityThresholds.testability,
        value: metrics.testability
      });
    }

    return issues;
  }  /**
   * Calculates the result
   * @param {any} metrics
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} metrics
   * @returns {number} The calculated result
   */


  calculateOverallScore(metrics) {
    if (!metrics || Object.keys(metrics).length === 0) {
      return 0;
    }

    const weights = {
      complexity: 0.2,
      maintainability: 0.2,
      security: 0.25,
      performance: 0.15,
      readability: 0.1,
      testability: 0.1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [metric, value] of Object.entries(metrics)) {      /**
   * Performs the specified operation
   * @param {any} weights[metric] && typeof value - Optional parameter
   * @returns {number} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} weights[metric] && typeof value - Optional parameter
   * @returns {number} The operation result
   */

      if (weights[metric] && typeof value === 'number') {
        // Normalize complexity (lower is better)
        const normalizedValue = metric === 'complexity' ?
          Math.max(0, 100 - (value * 10)) : value;

        weightedSum += normalizedValue * weights[metric];
        totalWeight += weights[metric];
      }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }  /**
   * Performs the specified operation
   * @param {number} sessionId
   * @param {any} metrics
   * @param {boolean} issues
   * @param {any} suggestions
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {number} sessionId
   * @param {any} metrics
   * @param {boolean} issues
   * @param {any} suggestions
   * @returns {boolean} True if successful, false otherwise
   */


  storeQualityHistory(sessionId, metrics, issues, suggestions) {
    if (!this.qualityHistory.has(sessionId)) {
      this.qualityHistory.set(sessionId, []);
    }

    const history = this.qualityHistory.get(sessionId);
    history.push({
      timestamp: new Date(),
      metrics,
      issues,
      suggestions,
      overall: this.calculateOverallScore(metrics)
    });

    // Keep only recent history to prevent memory issues
    const maxHistorySize = 100;    /**
   * Performs the specified operation
   * @param {boolean} history.length > maxHistorySize
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} history.length > maxHistorySize
   * @returns {boolean} True if successful, false otherwise
   */

    if (history.length > maxHistorySize) {
      history.splice(0, history.length - maxHistorySize);
    }
  }  /**
   * Updates existing data
   * @param {number} sessionId
   * @param {any} data
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @param {number} sessionId
   * @param {any} data
   * @returns {any} The operation result
   */


  emitQualityUpdate(sessionId, data) {
    const listeners = this.eventListeners.get('quality:update') || [];    /**
   * Performs the specified operation
   * @param {boolean} const listener of listeners
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} const listener of listeners
   * @returns {boolean} True if successful, false otherwise
   */


    for (const listener of listeners) {
      try {
        listener({
          sessionId,
          ...data
        });
      } catch (error) {
        // ERROR: `❌ Error in quality update listener: ${error.message}`
      }
    }
  }  /**
   * Generates new data
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @returns {any} The created resource
   */


  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
