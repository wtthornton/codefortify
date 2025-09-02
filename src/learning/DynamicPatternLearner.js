/**
 * Dynamic Pattern Learner for Context7
 * Learns from successful code patterns and continuously improves effectiveness
 *
 * Features:
 * - Pattern learning from successful implementations
 * - User feedback integration
 * - Pattern effectiveness tracking
 * - Cross-project pattern sharing
 */

import { PatternDatabase } from './PatternDatabase.js';
import { EffectivenessTracker } from './EffectivenessTracker.js';
import { FeedbackProcessor } from './FeedbackProcessor.js';
import * as fileUtils from '../utils/fileUtils.js';
import path from 'path';

export class DynamicPatternLearner {
  constructor(config = {}) {
    this.config = {
      learningThreshold: config.learningThreshold || 0.8,
      feedbackWeight: config.feedbackWeight || 0.3,
      patternLifetime: config.patternLifetime || 30 * 24 * 60 * 60 * 1000, // 30 days
      maxPatterns: config.maxPatterns || 1000,
      ...config
    };

    this.patternDatabase = new PatternDatabase(this.config);
    this.effectivenessTracker = new EffectivenessTracker(this.config);
    this.feedbackProcessor = new FeedbackProcessor(this.config);
    this.learningMetrics = {
      totalPatterns: 0,
      successfulPatterns: 0,
      feedbackCount: 0,
      lastLearning: null
    };
  }

  /**
   * Learn from successful code enhancement
   * @param {string} originalCode - Original code before enhancement
   * @param {string} improvedCode - Enhanced code
   * @param {Object} metrics - Enhancement metrics
   * @param {Object} context - Project context
   * @returns {Promise<Object>} Learning result
   */
  async learnFromSuccess(originalCode, improvedCode, metrics, context) {
    try {
      console.log('🧠 Learning from successful enhancement...');

      // Validate context - should throw if invalid
      if (!context || typeof context !== 'object') {
        throw new Error('Valid context object is required for learning');
      }

      const pattern = await this.extractPattern(originalCode, improvedCode);

      // Always learn from code examples, regardless of improvement level
      // This allows the system to learn from both successful and failed patterns
      const learnedPattern = {
        id: this.generatePatternId(),
        type: pattern.type,
        category: pattern.category,
        context: context,
        effectiveness: metrics.improvement,
        usageCount: 1,
        lastUsed: new Date(),
        successRate: metrics.improvement > this.config.learningThreshold ? 1.0 : 0.5,
        codeExample: {
          before: originalCode,
          after: improvedCode
        },
        metadata: {
          language: pattern.language,
          framework: pattern.framework,
          complexity: pattern.complexity,
          linesChanged: pattern.linesChanged
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.patternDatabase.store(learnedPattern);
      await this.updateEffectivenessMetrics(learnedPattern);

      this.learningMetrics.totalPatterns++;
      if (metrics.improvement > this.config.learningThreshold) {
        this.learningMetrics.successfulPatterns++;
      }
      this.learningMetrics.lastLearning = new Date();

      if (metrics.improvement > this.config.learningThreshold) {
        console.log(`✅ Pattern learned successfully: ${learnedPattern.id}`);
      } else {
        console.log(`⚠️ Enhancement below learning threshold: ${metrics.improvement}`);
      }

      return {
        success: true,
        patternId: learnedPattern.id,
        effectiveness: learnedPattern.effectiveness,
        extractedPatterns: [pattern]
      };

    } catch (error) {
      console.error(`❌ Error learning from success: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get similar patterns for a given context
   * @param {string} patternType - Type of pattern to find
   * @param {Object} context - Project context
   * @param {number} limit - Maximum number of patterns to return
   * @returns {Promise<Array>} Similar patterns
   */
  async getSimilarPatterns(patternType, context, limit = 10) {
    try {
      const targetPattern = {
        type: patternType,
        context: context
      };

      const similarPatterns = await this.patternDatabase.findSimilarPatterns(targetPattern, context);

      // Sort by effectiveness and recency
      const rankedPatterns = similarPatterns
        .sort((a, b) => {
          const effectivenessScore = b.effectiveness - a.effectiveness;
          const recencyScore = (new Date(b.lastUsed) - new Date(a.lastUsed)) / (1000 * 60 * 60 * 24);
          return effectivenessScore + (recencyScore * 0.1);
        })
        .slice(0, limit)
        .map(pattern => ({
          patternId: pattern.id,
          confidence: pattern.effectiveness,
          pattern: pattern
        }));

      return rankedPatterns;

    } catch (error) {
      console.error(`❌ Error getting similar patterns: ${error.message}`);
      return [];
    }
  }

  /**
   * Process user feedback for a pattern
   * @param {string} patternId - Pattern ID
   * @param {Object} feedback - User feedback
   * @returns {Promise<Object>} Feedback processing result
   */
  async processFeedback(patternId, feedback) {
    try {
      console.log(`📝 Processing feedback for pattern: ${patternId}`);

      const result = await this.feedbackProcessor.processFeedback(patternId, feedback);

      if (result.success) {
        this.learningMetrics.feedbackCount++;
        await this.updatePatternFromFeedback(patternId, feedback);
      }

      return result;

    } catch (error) {
      console.error(`❌ Error processing feedback: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pattern effectiveness statistics
   * @returns {Promise<Object>} Effectiveness statistics
   */
  async getEffectivenessStats() {
    try {
      const stats = await this.effectivenessTracker.getStats();

      return {
        ...stats,
        learningMetrics: this.learningMetrics,
        databaseStats: await this.patternDatabase.getStats()
      };

    } catch (error) {
      console.error(`❌ Error getting effectiveness stats: ${error.message}`);
      return {
        error: error.message
      };
    }
  }

  /**
   * Clean up old or ineffective patterns
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupPatterns() {
    try {
      console.log('🧹 Cleaning up old patterns...');

      const cleanupResult = await this.patternDatabase.cleanup({
        maxAge: this.config.patternLifetime,
        minEffectiveness: 0.3,
        maxPatterns: this.config.maxPatterns
      });

      console.log(`✅ Cleanup completed: ${cleanupResult.removed} patterns removed`);
      return cleanupResult;

    } catch (error) {
      console.error(`❌ Error cleaning up patterns: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export patterns for sharing
   * @param {string|Object} filePathOrOptions - File path or export options
   * @returns {Promise<Object>} Export result
   */
  async exportPatterns(filePathOrOptions = {}) {
    try {
      let filePath;
      let options = {};
      
      if (typeof filePathOrOptions === 'string') {
        filePath = filePathOrOptions;
        options = {};
      } else {
        filePath = filePathOrOptions.filePath;
        options = filePathOrOptions;
      }

      const patterns = await this.patternDatabase.exportPatterns(options);
      
      if (filePath) {
        const exportData = {
          patterns: patterns,
          metadata: {
            exportedAt: new Date().toISOString(),
            count: patterns.length,
            version: '1.0.0'
          }
        };
        
        await fileUtils.writeFile(filePath, JSON.stringify(exportData, null, 2));
      }

      return {
        success: true,
        patterns: patterns,
        count: patterns.length,
        filePath: filePath,
        exportedAt: new Date()
      };

    } catch (error) {
      console.error(`❌ Error exporting patterns: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all learned patterns
   * @param {Object} criteria - Optional filtering criteria
   * @returns {Promise<Array>} All learned patterns
   */
  async getLearnedPatterns(criteria = {}) {
    try {
      const patterns = await this.patternDatabase.search(criteria);
      return patterns;
    } catch (error) {
      console.error(`❌ Error getting learned patterns: ${error.message}`);
      return [];
    }
  }

  /**
   * Get pattern suggestions based on context (alias for getSimilarPatterns)
   * @param {Object} context - Context for pattern suggestions
   * @param {number} limit - Maximum number of suggestions
   * @returns {Promise<Array>} Pattern suggestions
   */
  async getPatternSuggestions(context, limit = 10) {
    try {
      const patternType = context.type || 'general';
      return await this.getSimilarPatterns(patternType, context, limit);
    } catch (error) {
      console.error(`❌ Error getting pattern suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Update pattern effectiveness based on feedback
   * @param {Object} feedback - Feedback containing patternId and effectiveness data
   * @returns {Promise<Object>} Update result
   */
  async updatePatternEffectiveness(feedback) {
    try {
      if (!feedback.patternId) {
        throw new Error('Pattern ID is required for effectiveness update');
      }

      const pattern = await this.patternDatabase.get(feedback.patternId);
      if (!pattern) {
        throw new Error(`Pattern ${feedback.patternId} not found`);
      }

      const originalEffectiveness = pattern.effectiveness;
      
      // Update effectiveness based on feedback
      if (feedback.effectiveness !== undefined) {
        pattern.effectiveness = feedback.effectiveness;
      } else if (feedback.outcome === 'success' && feedback.userRating) {
        // Calculate new effectiveness based on user rating (1-5 scale)
        const ratingEffectiveness = feedback.userRating / 5.0;
        pattern.effectiveness = (pattern.effectiveness + ratingEffectiveness) / 2;
      } else if (feedback.outcome === 'failure') {
        // Decrease effectiveness for failures
        pattern.effectiveness = Math.max(0.1, pattern.effectiveness * 0.8);
      }
      
      if (feedback.success !== undefined) {
        pattern.usageCount = pattern.usageCount || 0;
        const newUsageCount = pattern.usageCount + 1;
        const currentSuccessCount = Math.round(pattern.successRate * pattern.usageCount);
        const newSuccessCount = feedback.success ? currentSuccessCount + 1 : currentSuccessCount;
        
        pattern.successRate = newSuccessCount / newUsageCount;
        pattern.usageCount = newUsageCount;
        pattern.lastUsed = new Date();
        pattern.updatedAt = new Date();
      }

      await this.patternDatabase.update(feedback.patternId, pattern);
      
      return {
        success: true,
        patternId: feedback.patternId,
        updatedEffectiveness: pattern.effectiveness,
        newEffectiveness: pattern.effectiveness,
        updatedSuccessRate: pattern.successRate
      };

    } catch (error) {
      console.error(`❌ Error updating pattern effectiveness: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import patterns from external source
   * @param {string|Array} filePathOrPatterns - File path to import from or patterns array
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async importPatterns(filePathOrPatterns, options = {}) {
    try {
      let patterns;
      
      if (typeof filePathOrPatterns === 'string') {
        // Import from file
        const filePath = filePathOrPatterns;
        const fileContent = await fileUtils.readFile(filePath);
        const importData = JSON.parse(fileContent);
        patterns = importData.patterns || [];
      } else {
        // Import from patterns array
        patterns = filePathOrPatterns;
      }

      console.log(`📥 Importing ${patterns.length} patterns...`);

      const importResult = await this.patternDatabase.importPatterns(patterns, options);

      console.log(`✅ Import completed: ${importResult.imported} patterns imported`);
      return {
        ...importResult,
        importedCount: importResult.imported
      };

    } catch (error) {
      console.error(`❌ Error importing patterns: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private methods

  async extractPattern(originalCode, improvedCode) {
    const pattern = {
      type: this.detectPatternType(originalCode, improvedCode),
      category: this.categorizePattern(originalCode, improvedCode),
      language: this.detectLanguage(originalCode),
      framework: this.detectFramework(originalCode),
      complexity: this.calculateComplexity(originalCode, improvedCode),
      linesChanged: this.calculateLinesChanged(originalCode, improvedCode)
    };

    return pattern;
  }

  detectPatternType(originalCode, improvedCode) {
    // Detect common pattern types
    if (this.isRefactoringPattern(originalCode, improvedCode)) {
      return 'refactoring';
    }
    if (this.isOptimizationPattern(originalCode, improvedCode)) {
      return 'optimization';
    }
    if (this.isSecurityPattern(originalCode, improvedCode)) {
      return 'security';
    }
    if (this.isPerformancePattern(originalCode, improvedCode)) {
      return 'performance';
    }
    if (this.isReadabilityPattern(originalCode, improvedCode)) {
      return 'readability';
    }

    return 'general';
  }

  categorizePattern(originalCode, improvedCode) {
    // Categorize patterns by code structure
    if (originalCode.includes('function') && improvedCode.includes('function')) {
      return 'function';
    }
    if (originalCode.includes('class') && improvedCode.includes('class')) {
      return 'class';
    }
    if (originalCode.includes('import') && improvedCode.includes('import')) {
      return 'import';
    }
    if (originalCode.includes('export') && improvedCode.includes('export')) {
      return 'export';
    }

    return 'code-block';
  }

  detectLanguage(code) {
    if (code.includes('import') && code.includes('from')) {
      return 'javascript';
    }
    if (code.includes('interface') || code.includes('type ')) {
      return 'typescript';
    }
    if (code.includes('jsx') || code.includes('React')) {
      return 'jsx';
    }
    if (code.includes('tsx') || code.includes('React.FC')) {
      return 'tsx';
    }

    return 'javascript';
  }

  detectFramework(code) {
    if (code.includes('React') || code.includes('useState') || code.includes('useEffect')) {
      return 'react';
    }
    if (code.includes('Vue') || code.includes('vue')) {
      return 'vue';
    }
    if (code.includes('Angular') || code.includes('angular')) {
      return 'angular';
    }
    if (code.includes('Express') || code.includes('express')) {
      return 'express';
    }

    return 'vanilla';
  }

  calculateComplexity(originalCode, improvedCode) {
    const originalLines = originalCode.split('\n').length;
    const improvedLines = improvedCode.split('\n').length;

    if (improvedLines < originalLines * 0.8) {
      return 'simplified';
    } else if (improvedLines > originalLines * 1.2) {
      return 'expanded';
    } else {
      return 'similar';
    }
  }

  calculateLinesChanged(originalCode, improvedCode) {
    const originalLines = originalCode.split('\n');
    const improvedLines = improvedCode.split('\n');

    let changes = 0;
    const maxLines = Math.max(originalLines.length, improvedLines.length);

    for (let i = 0; i < maxLines; i++) {
      if (originalLines[i] !== improvedLines[i]) {
        changes++;
      }
    }

    return changes;
  }

  isRefactoringPattern(originalCode, improvedCode) {
    // Check for refactoring indicators
    return originalCode.includes('function') && improvedCode.includes('const') ||
           originalCode.includes('var') && improvedCode.includes('const') ||
           originalCode.includes('class') && improvedCode.includes('function');
  }

  isOptimizationPattern(originalCode, improvedCode) {
    // Check for optimization indicators
    return originalCode.includes('for (') && improvedCode.includes('.map(') ||
           originalCode.includes('if (') && improvedCode.includes('?.') ||
           originalCode.includes('&&') && improvedCode.includes('?.');
  }

  isSecurityPattern(originalCode, improvedCode) {
    // Check for security improvement indicators
    return originalCode.includes('eval(') && !improvedCode.includes('eval(') ||
           originalCode.includes('innerHTML') && improvedCode.includes('textContent') ||
           originalCode.includes('document.write') && !improvedCode.includes('document.write');
  }

  isPerformancePattern(originalCode, improvedCode) {
    // Check for performance improvement indicators
    return originalCode.includes('setTimeout') && improvedCode.includes('requestAnimationFrame') ||
           originalCode.includes('addEventListener') && improvedCode.includes('useCallback') ||
           originalCode.includes('import *') && improvedCode.includes('import {');
  }

  isReadabilityPattern(originalCode, improvedCode) {
    // Check for readability improvement indicators
    const originalLength = originalCode.length;
    const improvedLength = improvedCode.length;

    return improvedLength < originalLength * 0.8 || // Significantly shorter
           originalCode.includes('// TODO') && !improvedCode.includes('// TODO') ||
           originalCode.includes('console.log') && !improvedCode.includes('console.log');
  }

  async updateEffectivenessMetrics(pattern) {
    await this.effectivenessTracker.updatePattern(pattern);
  }

  async updatePatternFromFeedback(patternId, feedback) {
    const pattern = await this.patternDatabase.get(patternId);
    if (pattern) {
      pattern.usageCount++;
      pattern.lastUsed = new Date();
      pattern.updatedAt = new Date();

      // Update success rate based on feedback
      if (feedback.action === 'accepted') {
        pattern.successRate = (pattern.successRate * (pattern.usageCount - 1) + 1) / pattern.usageCount;
      } else if (feedback.action === 'rejected') {
        pattern.successRate = (pattern.successRate * (pattern.usageCount - 1) + 0) / pattern.usageCount;
      }

      await this.patternDatabase.update(patternId, pattern);
    }
  }

  generatePatternId() {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
