/**
 * Pattern Database for Context7
 * Manages storage and retrieval of learned patterns
 *
 * Features:
 * - Pattern storage and retrieval
 * - Similarity search
 * - Pattern indexing
 * - Data persistence
 */

import { fileUtils } from '../utils/fileUtils.js';
import path from 'path';

export class PatternDatabase {
  constructor(config = {}) {
    this.config = {
      storagePath: config.storagePath || './data/patterns',
      maxPatterns: config.maxPatterns || 1000,
      indexUpdateInterval: config.indexUpdateInterval || 60000, // 1 minute
      ...config
    };

    this.patterns = new Map();
    this.indexes = {
      byType: new Map(),
      byEffectiveness: new Map(),
      byContext: new Map(),
      byLanguage: new Map(),
      byFramework: new Map()
    };

    this.lastIndexUpdate = 0;
    this.initializeDatabase();
  }

  /**
   * Store a new pattern
   * @param {Object} pattern - Pattern to store
   * @returns {Promise<boolean>} Success status
   */
  async store(pattern) {
    try {
      // Validate pattern
      if (!this.validatePattern(pattern)) {
        throw new Error('Invalid pattern data');
      }

      // Check if pattern already exists
      if (this.patterns.has(pattern.id)) {
        throw new Error(`Pattern with ID ${pattern.id} already exists`);
      }

      // Store pattern
      this.patterns.set(pattern.id, pattern);

      // Update indexes
      this.updateIndexes(pattern);

      // Persist to file system
      await this.persistToFile();

      console.log(`✅ Pattern stored: ${pattern.id}`);
      return true;

    } catch (error) {
      console.error(`❌ Error storing pattern: ${error.message}`);
      return false;
    }
  }

  /**
   * Retrieve a pattern by ID
   * @param {string} patternId - Pattern ID
   * @returns {Promise<Object|null>} Pattern or null if not found
   */
  async get(patternId) {
    try {
      return this.patterns.get(patternId) || null;
    } catch (error) {
      console.error(`❌ Error retrieving pattern: ${error.message}`);
      return null;
    }
  }

  /**
   * Update an existing pattern
   * @param {string} patternId - Pattern ID
   * @param {Object} updatedPattern - Updated pattern data
   * @returns {Promise<boolean>} Success status
   */
  async update(patternId, updatedPattern) {
    try {
      if (!this.patterns.has(patternId)) {
        throw new Error(`Pattern with ID ${patternId} not found`);
      }

      // Update pattern
      this.patterns.set(patternId, updatedPattern);

      // Update indexes
      this.updateIndexes(updatedPattern);

      // Persist to file system
      await this.persistToFile();

      console.log(`✅ Pattern updated: ${patternId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error updating pattern: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete a pattern
   * @param {string} patternId - Pattern ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(patternId) {
    try {
      if (!this.patterns.has(patternId)) {
        throw new Error(`Pattern with ID ${patternId} not found`);
      }

      // Remove from patterns
      this.patterns.delete(patternId);

      // Remove from indexes
      this.removeFromIndexes(patternId);

      // Persist to file system
      await this.persistToFile();

      console.log(`✅ Pattern deleted: ${patternId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error deleting pattern: ${error.message}`);
      return false;
    }
  }

  /**
   * Find similar patterns
   * @param {Object} targetPattern - Pattern to find similarities for
   * @param {Object} context - Project context
   * @returns {Promise<Array>} Similar patterns
   */
  async findSimilarPatterns(targetPattern, context) {
    try {
      // Update indexes if needed
      await this.updateIndexesIfNeeded();

      const candidates = this.getCandidatesByType(targetPattern.type);
      const similarPatterns = [];

      for (const pattern of candidates) {
        const similarity = this.calculateSimilarity(pattern, targetPattern, context);
        if (similarity > 0.7) {
          similarPatterns.push({
            ...pattern,
            similarity
          });
        }
      }

      // Sort by similarity and effectiveness
      return similarPatterns
        .sort((a, b) => {
          const similarityScore = b.similarity - a.similarity;
          const effectivenessScore = b.effectiveness - a.effectiveness;
          return similarityScore + (effectivenessScore * 0.3);
        })
        .slice(0, 10);

    } catch (error) {
      console.error(`❌ Error finding similar patterns: ${error.message}`);
      return [];
    }
  }

  /**
   * Search patterns by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Matching patterns
   */
  async search(criteria) {
    try {
      const results = [];

      for (const [id, pattern] of this.patterns) {
        if (this.matchesCriteria(pattern, criteria)) {
          results.push(pattern);
        }
      }

      return results.sort((a, b) => b.effectiveness - a.effectiveness);

    } catch (error) {
      console.error(`❌ Error searching patterns: ${error.message}`);
      return [];
    }
  }

  /**
   * Clean up old or ineffective patterns
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanup(options = {}) {
    try {
      const {
        maxAge = 30 * 24 * 60 * 60 * 1000, // 30 days
        minEffectiveness = 0.3,
        maxPatterns = this.config.maxPatterns
      } = options;

      const cutoffDate = new Date(Date.now() - maxAge);
      const patternsToRemove = [];

      for (const [id, pattern] of this.patterns) {
        const shouldRemove =
          pattern.effectiveness < minEffectiveness ||
          new Date(pattern.createdAt) < cutoffDate ||
          this.patterns.size > maxPatterns;

        if (shouldRemove) {
          patternsToRemove.push(id);
        }
      }

      // Remove patterns
      for (const id of patternsToRemove) {
        this.patterns.delete(id);
        this.removeFromIndexes(id);
      }

      // Persist changes
      await this.persistToFile();

      return {
        success: true,
        removed: patternsToRemove.length,
        remaining: this.patterns.size
      };

    } catch (error) {
      console.error(`❌ Error cleaning up patterns: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export patterns
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Exported patterns
   */
  async exportPatterns(options = {}) {
    try {
      const {
        format = 'json',
        filter = {},
        limit = 100
      } = options;

      let patterns = Array.from(this.patterns.values());

      // Apply filters
      if (filter.type) {
        patterns = patterns.filter(p => p.type === filter.type);
      }
      if (filter.minEffectiveness) {
        patterns = patterns.filter(p => p.effectiveness >= filter.minEffectiveness);
      }
      if (filter.language) {
        patterns = patterns.filter(p => p.metadata?.language === filter.language);
      }
      if (filter.framework) {
        patterns = patterns.filter(p => p.metadata?.framework === filter.framework);
      }

      // Sort and limit
      patterns = patterns
        .sort((a, b) => b.effectiveness - a.effectiveness)
        .slice(0, limit);

      return patterns;

    } catch (error) {
      console.error(`❌ Error exporting patterns: ${error.message}`);
      return [];
    }
  }

  /**
   * Import patterns
   * @param {Array} patterns - Patterns to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async importPatterns(patterns, options = {}) {
    try {
      const {
        overwrite = false,
        validate = true
      } = options;

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const pattern of patterns) {
        try {
          // Validate pattern if required
          if (validate && !this.validatePattern(pattern)) {
            errors++;
            continue;
          }

          // Check if pattern already exists
          if (this.patterns.has(pattern.id) && !overwrite) {
            skipped++;
            continue;
          }

          // Store pattern
          this.patterns.set(pattern.id, pattern);
          this.updateIndexes(pattern);
          imported++;

        } catch (error) {
          console.error(`Error importing pattern ${pattern.id}: ${error.message}`);
          errors++;
        }
      }

      // Persist changes
      await this.persistToFile();

      return {
        success: true,
        imported,
        skipped,
        errors,
        total: patterns.length
      };

    } catch (error) {
      console.error(`❌ Error importing patterns: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    try {
      const stats = {
        totalPatterns: this.patterns.size,
        byType: {},
        byLanguage: {},
        byFramework: {},
        averageEffectiveness: 0,
        oldestPattern: null,
        newestPattern: null
      };

      let totalEffectiveness = 0;
      let oldestDate = null;
      let newestDate = null;

      for (const [id, pattern] of this.patterns) {
        // Count by type
        stats.byType[pattern.type] = (stats.byType[pattern.type] || 0) + 1;

        // Count by language
        const language = pattern.metadata?.language || 'unknown';
        stats.byLanguage[language] = (stats.byLanguage[language] || 0) + 1;

        // Count by framework
        const framework = pattern.metadata?.framework || 'unknown';
        stats.byFramework[framework] = (stats.byFramework[framework] || 0) + 1;

        // Calculate average effectiveness
        totalEffectiveness += pattern.effectiveness;

        // Find oldest and newest patterns
        const createdAt = new Date(pattern.createdAt);
        if (!oldestDate || createdAt < oldestDate) {
          oldestDate = createdAt;
          stats.oldestPattern = pattern.id;
        }
        if (!newestDate || createdAt > newestDate) {
          newestDate = createdAt;
          stats.newestPattern = pattern.id;
        }
      }

      stats.averageEffectiveness = this.patterns.size > 0 ?
        totalEffectiveness / this.patterns.size : 0;

      return stats;

    } catch (error) {
      console.error(`❌ Error getting database stats: ${error.message}`);
      return {
        error: error.message
      };
    }
  }

  // Private methods

  async initializeDatabase() {
    try {
      // Create storage directory if it doesn't exist
      if (!await fileUtils.directoryExists(this.config.storagePath)) {
        await fileUtils.createDirectory(this.config.storagePath);
      }

      // Load existing patterns
      await this.loadFromFile();

      console.log(`✅ Pattern database initialized with ${this.patterns.size} patterns`);

    } catch (error) {
      console.error(`❌ Error initializing database: ${error.message}`);
    }
  }

  async loadFromFile() {
    try {
      const filePath = path.join(this.config.storagePath, 'patterns.json');

      if (await fileUtils.fileExists(filePath)) {
        const content = await fileUtils.readFile(filePath);
        const data = JSON.parse(content);

        // Load patterns
        for (const pattern of data.patterns || []) {
          this.patterns.set(pattern.id, pattern);
        }

        // Rebuild indexes
        this.rebuildIndexes();

        console.log(`📁 Loaded ${this.patterns.size} patterns from file`);
      }

    } catch (error) {
      console.error(`❌ Error loading patterns from file: ${error.message}`);
    }
  }

  async persistToFile() {
    try {
      const filePath = path.join(this.config.storagePath, 'patterns.json');
      const data = {
        patterns: Array.from(this.patterns.values()),
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      await fileUtils.writeFile(filePath, JSON.stringify(data, null, 2));

    } catch (error) {
      console.error(`❌ Error persisting patterns to file: ${error.message}`);
    }
  }

  validatePattern(pattern) {
    return pattern &&
           pattern.id &&
           pattern.type &&
           pattern.effectiveness >= 0 &&
           pattern.effectiveness <= 1 &&
           pattern.codeExample &&
           pattern.codeExample.before &&
           pattern.codeExample.after;
  }

  updateIndexes(pattern) {
    // Index by type
    if (!this.indexes.byType.has(pattern.type)) {
      this.indexes.byType.set(pattern.type, []);
    }
    this.indexes.byType.get(pattern.type).push(pattern.id);

    // Index by effectiveness (rounded to nearest 0.1)
    const effectivenessKey = Math.round(pattern.effectiveness * 10) / 10;
    if (!this.indexes.byEffectiveness.has(effectivenessKey)) {
      this.indexes.byEffectiveness.set(effectivenessKey, []);
    }
    this.indexes.byEffectiveness.get(effectivenessKey).push(pattern.id);

    // Index by language
    const language = pattern.metadata?.language || 'unknown';
    if (!this.indexes.byLanguage.has(language)) {
      this.indexes.byLanguage.set(language, []);
    }
    this.indexes.byLanguage.get(language).push(pattern.id);

    // Index by framework
    const framework = pattern.metadata?.framework || 'unknown';
    if (!this.indexes.byFramework.has(framework)) {
      this.indexes.byFramework.set(framework, []);
    }
    this.indexes.byFramework.get(framework).push(pattern.id);
  }

  removeFromIndexes(patternId) {
    // Remove from all indexes
    for (const [key, patterns] of this.indexes.byType) {
      const index = patterns.indexOf(patternId);
      if (index > -1) {
        patterns.splice(index, 1);
      }
    }

    for (const [key, patterns] of this.indexes.byEffectiveness) {
      const index = patterns.indexOf(patternId);
      if (index > -1) {
        patterns.splice(index, 1);
      }
    }

    for (const [key, patterns] of this.indexes.byLanguage) {
      const index = patterns.indexOf(patternId);
      if (index > -1) {
        patterns.splice(index, 1);
      }
    }

    for (const [key, patterns] of this.indexes.byFramework) {
      const index = patterns.indexOf(patternId);
      if (index > -1) {
        patterns.splice(index, 1);
      }
    }
  }

  rebuildIndexes() {
    // Clear existing indexes
    this.indexes.byType.clear();
    this.indexes.byEffectiveness.clear();
    this.indexes.byLanguage.clear();
    this.indexes.byFramework.clear();

    // Rebuild indexes
    for (const [id, pattern] of this.patterns) {
      this.updateIndexes(pattern);
    }
  }

  async updateIndexesIfNeeded() {
    const now = Date.now();
    if (now - this.lastIndexUpdate > this.config.indexUpdateInterval) {
      this.rebuildIndexes();
      this.lastIndexUpdate = now;
    }
  }

  getCandidatesByType(type) {
    const candidateIds = this.indexes.byType.get(type) || [];
    return candidateIds.map(id => this.patterns.get(id)).filter(Boolean);
  }

  calculateSimilarity(pattern, targetPattern, context) {
    let similarity = 0;

    // Type similarity (40% weight)
    if (pattern.type === targetPattern.type) {
      similarity += 0.4;
    }

    // Language similarity (20% weight)
    if (pattern.metadata?.language === targetPattern.metadata?.language) {
      similarity += 0.2;
    }

    // Framework similarity (20% weight)
    if (pattern.metadata?.framework === targetPattern.metadata?.framework) {
      similarity += 0.2;
    }

    // Context similarity (20% weight)
    const contextSimilarity = this.calculateContextSimilarity(pattern.context, context);
    similarity += contextSimilarity * 0.2;

    return similarity;
  }

  calculateContextSimilarity(patternContext, targetContext) {
    if (!patternContext || !targetContext) {return 0;}

    let similarity = 0;
    let comparisons = 0;

    // Compare project types
    if (patternContext.project?.type && targetContext.project?.type) {
      if (patternContext.project.type === targetContext.project.type) {
        similarity += 0.3;
      }
      comparisons++;
    }

    // Compare frameworks
    if (patternContext.project?.framework && targetContext.project?.framework) {
      const patternFrameworks = patternContext.project.framework;
      const targetFrameworks = targetContext.project.framework;

      if (Array.isArray(patternFrameworks) && Array.isArray(targetFrameworks)) {
        const commonFrameworks = patternFrameworks.filter(f => targetFrameworks.includes(f));
        if (commonFrameworks.length > 0) {
          similarity += 0.3;
        }
      }
      comparisons++;
    }

    // Compare architecture patterns
    if (patternContext.architecture && targetContext.architecture) {
      const patternArch = patternContext.architecture.primary?.name;
      const targetArch = targetContext.architecture.primary?.name;

      if (patternArch && targetArch && patternArch === targetArch) {
        similarity += 0.4;
      }
      comparisons++;
    }

    return comparisons > 0 ? similarity / comparisons : 0;
  }

  matchesCriteria(pattern, criteria) {
    if (criteria.type && pattern.type !== criteria.type) {
      return false;
    }

    if (criteria.minEffectiveness && pattern.effectiveness < criteria.minEffectiveness) {
      return false;
    }

    if (criteria.language && pattern.metadata?.language !== criteria.language) {
      return false;
    }

    if (criteria.framework && pattern.metadata?.framework !== criteria.framework) {
      return false;
    }

    if (criteria.category && pattern.category !== criteria.category) {
      return false;
    }

    return true;
  }
}
