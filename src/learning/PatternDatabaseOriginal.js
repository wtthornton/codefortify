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

import * as fileUtils from '../utils/fileUtils.js';
import path from 'path';

/**


 * PatternDatabase class implementation


 *


 * Provides functionality for patterndatabase operations


 */


/**


 * PatternDatabase class implementation


 *


 * Provides functionality for patterndatabase operations


 */


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
      // Normalize pattern first
      const normalizedPattern = this.normalizePattern(pattern);

      // Validate normalized pattern
      if (!this.validatePattern(normalizedPattern)) {
        throw new Error('Invalid pattern data');
      }

      // Check if pattern already exists
      if (this.patterns.has(normalizedPattern.id)) {
        throw new Error(`Pattern with ID ${normalizedPattern.id} already exists`);
      }

      // Store normalized pattern
      this.patterns.set(normalizedPattern.id, normalizedPattern);

      // Update indexes
      this.updateIndexes(normalizedPattern);

      // Persist to file system
      await this.persistToFile();

      // LOG: `✅ Pattern stored: ${normalizedPattern.id}`
      return true;

    } catch (error) {
      // ERROR: `❌ Error storing pattern: ${error.message}`
      throw error;
    }
  }

  /**
   * Retrieve a pattern by ID
   * @param {string} patternId - Pattern ID
   * @returns {Promise<Object|null>} Pattern or null if not found
   */
  async get(patternId) {
    try {
      const pattern = this.patterns.get(patternId);      /**
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
        // Update lastUsed timestamp
        pattern.lastUsed = new Date().toISOString();
        this.patterns.set(patternId, pattern);
        await this.persistToFile();
      }
      return pattern || null;
    } catch (error) {
      // ERROR: `❌ Error retrieving pattern: ${error.message}`
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

      // LOG: `✅ Pattern updated: ${patternId}`
      return true;

    } catch (error) {
      // ERROR: `❌ Error updating pattern: ${error.message}`
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

      // LOG: `✅ Pattern deleted: ${patternId}`
      return true;

    } catch (error) {
      // ERROR: `❌ Error deleting pattern: ${error.message}`
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
      const similarPatterns = [];      /**
   * Performs the specified operation
   * @param {number} const pattern of candidates
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {number} const pattern of candidates
   * @returns {any} The operation result
   */


      for (const pattern of candidates) {
        const similarity = this.calculateSimilarity(pattern, targetPattern, context);        /**
   * Performs the specified operation
   * @param {any} similarity > 0.3
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} similarity > 0.3
   * @returns {any} The operation result
   */

        if (similarity > 0.3) {
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
      // ERROR: `❌ Error finding similar patterns: ${error.message}`
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
      const results = [];      /**
   * Performs the specified operation
   * @param {number} const [id
   * @param {boolean} pattern] of this.patterns
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {number} const [id
   * @param {boolean} pattern] of this.patterns
   * @returns {boolean} True if successful, false otherwise
   */


      for (const [id, pattern] of this.patterns) {
        if (this.matchesCriteria(pattern, criteria)) {
          results.push(pattern);
        }
      }

      // Sort by effectiveness by default
      results.sort((a, b) => b.effectiveness - a.effectiveness);

      // Apply limit if specified      /**
   * Performs the specified operation
   * @param {any} criteria.limit && criteria.limit > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} criteria.limit && criteria.limit > 0
   * @returns {any} The operation result
   */

      if (criteria.limit && criteria.limit > 0) {
        return results.slice(0, criteria.limit);
      }

      return results;

    } catch (error) {
      // ERROR: `❌ Error searching patterns: ${error.message}`
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
      const patternsToRemove = [];      /**
   * Performs the specified operation
   * @param {number} const [id
   * @param {boolean} pattern] of this.patterns
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {number} const [id
   * @param {boolean} pattern] of this.patterns
   * @returns {boolean} True if successful, false otherwise
   */


      for (const [id, pattern] of this.patterns) {
        const shouldRemove =
          pattern.effectiveness < minEffectiveness ||
          new Date(pattern.createdAt) < cutoffDate ||
          this.patterns.size > maxPatterns;        /**
   * Performs the specified operation
   * @param {boolean} shouldRemove
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {boolean} shouldRemove
   * @returns {any} The operation result
   */


        if (shouldRemove) {
          patternsToRemove.push(id);
        }
      }

      // Remove patterns      /**
   * Performs the specified operation
   * @param {number} const id of patternsToRemove
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {number} const id of patternsToRemove
   * @returns {any} The operation result
   */

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
      // ERROR: `❌ Error cleaning up patterns: ${error.message}`
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

      // Apply filters      /**
   * Performs the specified operation
   * @param {any} filter.type
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} filter.type
   * @returns {any} The operation result
   */

      if (filter.type) {
        patterns = patterns.filter(p => p.type === filter.type);
      }      /**
   * Performs the specified operation
   * @param {any} filter.minEffectiveness
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} filter.minEffectiveness
   * @returns {any} The operation result
   */

      if (filter.minEffectiveness) {
        patterns = patterns.filter(p => p.effectiveness >= filter.minEffectiveness);
      }      /**
   * Performs the specified operation
   * @param {any} filter.language
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} filter.language
   * @returns {any} The operation result
   */

      if (filter.language) {
        patterns = patterns.filter(p => p.metadata?.language === filter.language);
      }      /**
   * Performs the specified operation
   * @param {any} filter.framework
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} filter.framework
   * @returns {any} The operation result
   */

      if (filter.framework) {
        patterns = patterns.filter(p => p.metadata?.framework === filter.framework);
      }

      // Sort and limit
      patterns = patterns
        .sort((a, b) => b.effectiveness - a.effectiveness)
        .slice(0, limit);

      return patterns;

    } catch (error) {
      // ERROR: `❌ Error exporting patterns: ${error.message}`
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
      let errors = 0;      /**
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
          // ERROR: `Error importing pattern ${pattern.id}: ${error.message}`
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
      // ERROR: `❌ Error importing patterns: ${error.message}`
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save a pattern (alias for store method for backward compatibility)
   * @param {Object} pattern - Pattern to save
   * @returns {Promise<Object>} Save result with pattern info
   */
  async savePattern(pattern) {
    try {
      // Normalize pattern format for backward compatibility
      const normalizedPattern = this.normalizePattern(pattern);

      const success = await this.store(normalizedPattern);

      return {
        success,
        patternId: normalizedPattern.id,
        pattern: normalizedPattern
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search patterns (alias for search method for backward compatibility)
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Matching patterns
   */
  async searchPatterns(criteria) {
    return await this.search(criteria);
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
        languages: {},
        frameworks: {},
        types: {},
        averageEffectiveness: 0,
        oldestPattern: null,
        newestPattern: null
      };

      let totalEffectiveness = 0;
      let totalUsageCount = 0;
      let oldestDate = null;
      let newestDate = null;      /**
   * Performs the specified operation
   * @param {number} const [id
   * @param {boolean} pattern] of this.patterns
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {number} const [id
   * @param {boolean} pattern] of this.patterns
   * @returns {boolean} True if successful, false otherwise
   */


      for (const [id, pattern] of this.patterns) {
        // Count by type
        stats.byType[pattern.type] = (stats.byType[pattern.type] || 0) + 1;
        stats.types[pattern.type] = (stats.types[pattern.type] || 0) + 1;

        // Count by language
        const language = pattern.metadata?.language || pattern.context?.language || 'unknown';
        stats.byLanguage[language] = (stats.byLanguage[language] || 0) + 1;
        stats.languages[language] = (stats.languages[language] || 0) + 1;

        // Count by framework
        const framework = pattern.metadata?.framework || 'unknown';
        stats.byFramework[framework] = (stats.byFramework[framework] || 0) + 1;
        stats.frameworks[framework] = (stats.frameworks[framework] || 0) + 1;

        // Calculate average effectiveness
        totalEffectiveness += pattern.effectiveness;

        // Calculate total usage count
        totalUsageCount += pattern.usageCount || 0;

        // Find oldest and newest patterns
        const createdAt = new Date(pattern.createdAt);        /**
   * Performs the specified operation
   * @param {any} !oldestDate || createdAt < oldestDate
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} !oldestDate || createdAt < oldestDate
   * @returns {any} The operation result
   */

        if (!oldestDate || createdAt < oldestDate) {
          oldestDate = createdAt;
          stats.oldestPattern = pattern.id;
        }        /**
   * Performs the specified operation
   * @param {any} !newestDate || createdAt > newestDate
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} !newestDate || createdAt > newestDate
   * @returns {any} The operation result
   */

        if (!newestDate || createdAt > newestDate) {
          newestDate = createdAt;
          stats.newestPattern = pattern.id;
        }
      }

      stats.averageEffectiveness = this.patterns.size > 0 ?
        totalEffectiveness / this.patterns.size : 0;
      stats.totalUsageCount = totalUsageCount;

      return stats;

    } catch (error) {
      // ERROR: `❌ Error getting database stats: ${error.message}`
      return {
        error: error.message
      };
    }
  }

  /**
   * Get all patterns (alias for getAllPatterns)
   * @returns {Promise<Array>} All patterns
   */
  async getAllPatterns() {
    return Array.from(this.patterns.values());
  }

  /**
   * Delete a pattern (alias for deletePattern)
   * @param {string} patternId - Pattern ID
   * @returns {Promise<Object>} Result object
   */
  async deletePattern(patternId) {
    try {
      const success = await this.delete(patternId);
      return { success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create backup of patterns
   * @param {string} backupPath - Path to save backup
   * @returns {Promise<Object>} Result object
   */
  async createBackup(backupPath) {
    try {
      const patterns = Array.from(this.patterns.values());
      const backupData = {
        patterns,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      await fileUtils.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      return { success: true, backupPath, patternCount: patterns.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore patterns from backup
   * @param {string} backupPath - Path to backup file
   * @returns {Promise<Object>} Result object
   */
  async restoreFromBackup(backupPath) {
    try {
      const backupContent = await fileUtils.readFile(backupPath);
      const backupData = JSON.parse(backupContent);

      if (!backupData.patterns || !Array.isArray(backupData.patterns)) {
        throw new Error('Invalid backup format');
      }

      // Clear existing patterns
      this.patterns.clear();
      this.indexes = {
        byType: new Map(),
        byEffectiveness: new Map(),
        byContext: new Map(),
        byLanguage: new Map(),
        byFramework: new Map()
      };

      // Restore patterns
      let restoredCount = 0;      /**
   * Performs the specified operation
   * @param {any} const pattern of backupData.patterns
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const pattern of backupData.patterns
   * @returns {any} The operation result
   */

      for (const pattern of backupData.patterns) {
        const normalizedPattern = this.normalizePattern(pattern);
        if (this.validatePattern(normalizedPattern)) {
          this.patterns.set(normalizedPattern.id, normalizedPattern);
          this.updateIndexes(normalizedPattern);
          restoredCount++;
        }
      }

      // Persist to file
      await this.persistToFile();

      return { success: true, restoredCount, totalInBackup: backupData.patterns.length };
    } catch (error) {
      throw error;
    }
  }

  // Private methods

  /**
   * Normalize pattern format for backward compatibility
   * @param {Object} pattern - Pattern to normalize
   * @returns {Object} Normalized pattern
   */
  normalizePattern(pattern) {
    const normalized = { ...pattern };

    // Generate ID if not provided    /**
   * Performs the specified operation
   * @param {number} !normalized.id
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} !normalized.id
   * @returns {any} The operation result
   */

    if (!normalized.id) {
      normalized.id = `pattern-${Date.now()}`;
    }

    // Generate type if not provided    /**
   * Performs the specified operation
   * @param {any} !normalized.type
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !normalized.type
   * @returns {any} The operation result
   */

    if (!normalized.type) {
      normalized.type = 'general';
    }

    // Ensure effectiveness is valid    /**
   * Performs the specified operation
   * @param {any} normalized.effectiveness - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} normalized.effectiveness - Optional parameter
   * @returns {any} The operation result
   */

    if (normalized.effectiveness === undefined) {
      normalized.effectiveness = 0.5;
    }

    // Convert legacy code format to codeExample    /**
   * Performs the specified operation
   * @param {any} normalized.code && !normalized.codeExample
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} normalized.code && !normalized.codeExample
   * @returns {any} The operation result
   */

    if (normalized.code && !normalized.codeExample) {
      normalized.codeExample = {
        before: normalized.code,
        after: normalized.code // For backward compatibility
      };
      // Keep the code property for backward compatibility
    }

    // Ensure codeExample exists    /**
   * Performs the specified operation
   * @param {any} !normalized.codeExample
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !normalized.codeExample
   * @returns {any} The operation result
   */

    if (!normalized.codeExample) {
      normalized.codeExample = {
        before: '// No code example provided',
        after: '// No code example provided'
      };
    }

    // Add default timestamps
    const now = new Date();    /**
   * Performs the specified operation
   * @param {any} !normalized.createdAt
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !normalized.createdAt
   * @returns {any} The operation result
   */

    if (!normalized.createdAt) {
      normalized.createdAt = now;
    }    /**
   * Performs the specified operation
   * @param {any} !normalized.updatedAt
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !normalized.updatedAt
   * @returns {any} The operation result
   */

    if (!normalized.updatedAt) {
      normalized.updatedAt = now;
    }    /**
   * Performs the specified operation
   * @param {any} !normalized.lastUsed
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !normalized.lastUsed
   * @returns {any} The operation result
   */

    if (!normalized.lastUsed) {
      normalized.lastUsed = now;
    }

    // Add default usage tracking    /**
   * Performs the specified operation
   * @param {number} normalized.usageCount - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} normalized.usageCount - Optional parameter
   * @returns {any} The operation result
   */

    if (normalized.usageCount === undefined) {
      normalized.usageCount = 1;
    }

    return normalized;
  }  /**
   * Initialize the component
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Initialize the component
   * @returns {Promise} Promise that resolves with the result
   */


  async initializeDatabase() {
    try {
      // Create storage directory if it doesn't exist
      if (!await fileUtils.directoryExists(this.config.storagePath)) {
        await fileUtils.createDirectory(this.config.storagePath);
      }

      // Load existing patterns
      await this.loadFromFile();

      // LOG: `✅ Pattern database initialized with ${this.patterns.size} patterns`
    } catch (error) {
      // ERROR: `❌ Error initializing database: ${error.message}`
    }
  }  /**
   * Loads data from source
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Loads data from source
   * @returns {Promise} Promise that resolves with the result
   */


  async loadFromFile() {
    try {
      const filePath = path.join(this.config.storagePath, 'patterns.json');

      if (await fileUtils.fileExists(filePath)) {
        const content = await fileUtils.readFile(filePath);
        const data = JSON.parse(content);

        // Load patterns        /**
   * Performs the specified operation
   * @param {any} const pattern of data.patterns || []
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const pattern of data.patterns || []
   * @returns {any} The operation result
   */

        for (const pattern of data.patterns || []) {
          this.patterns.set(pattern.id, pattern);
        }

        // Rebuild indexes
        this.rebuildIndexes();

        // LOG: `📁 Loaded ${this.patterns.size} patterns from file`
      }

    } catch (error) {
      // ERROR: `❌ Error loading patterns from file: ${error.message}`
    }
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async persistToFile() {
    try {
      // Ensure storage directory exists
      if (!await fileUtils.directoryExists(this.config.storagePath)) {
        await fileUtils.createDirectory(this.config.storagePath);
      }

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
      // ERROR: `❌ Error persisting patterns to file: ${error.message}`
    }
  }  /**
   * Validates input data
   * @param {any} pattern
   * @returns {any} The operation result
   */
  /**
   * Validates input data
   * @param {any} pattern
   * @returns {any} The operation result
   */


  validatePattern(pattern) {
    return pattern &&
           pattern.id &&
           pattern.type &&
           pattern.effectiveness >= 0 &&
           pattern.effectiveness <= 1 &&
           pattern.codeExample &&
           pattern.codeExample.before &&
           pattern.codeExample.after &&
           pattern.codeExample.before !== '// No code example provided' &&
           pattern.codeExample.after !== '// No code example provided';
  }  /**
   * Updates existing data
   * @param {any} pattern
   * @returns {any} The operation result
   */
  /**
   * Updates existing data
   * @param {any} pattern
   * @returns {any} The operation result
   */


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
  }  /**
   * Removes an item
   * @param {number} patternId
   * @returns {any} The operation result
   */
  /**
   * Removes an item
   * @param {number} patternId
   * @returns {any} The operation result
   */


  removeFromIndexes(patternId) {
    // Remove from all indexes  /**
   * Performs the specified operation
   * @param {any} const [key
   * @param {number} patterns] of this.indexes.byType
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {any} const [key
   * @param {number} patterns] of this.indexes.byType
   * @returns {boolean} True if successful, false otherwise
   */

    for (const [key, patterns] of this.indexes.byType) {
      const index = patterns.indexOf(patternId);      /**
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
        patterns.splice(index, 1);
      }
    }    /**
   * Performs the specified operation
   * @param {any} const [key
   * @param {number} patterns] of this.indexes.byEffectiveness
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {any} const [key
   * @param {number} patterns] of this.indexes.byEffectiveness
   * @returns {boolean} True if successful, false otherwise
   */


    for (const [key, patterns] of this.indexes.byEffectiveness) {
      const index = patterns.indexOf(patternId);      /**
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
        patterns.splice(index, 1);
      }
    }    /**
   * Performs the specified operation
   * @param {any} const [key
   * @param {number} patterns] of this.indexes.byLanguage
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {any} const [key
   * @param {number} patterns] of this.indexes.byLanguage
   * @returns {boolean} True if successful, false otherwise
   */


    for (const [key, patterns] of this.indexes.byLanguage) {
      const index = patterns.indexOf(patternId);      /**
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
        patterns.splice(index, 1);
      }
    }    /**
   * Performs the specified operation
   * @param {any} const [key
   * @param {number} patterns] of this.indexes.byFramework
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {any} const [key
   * @param {number} patterns] of this.indexes.byFramework
   * @returns {boolean} True if successful, false otherwise
   */


    for (const [key, patterns] of this.indexes.byFramework) {
      const index = patterns.indexOf(patternId);      /**
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
        patterns.splice(index, 1);
      }
    }
  }  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */


  rebuildIndexes() {
    // Clear existing indexes
    this.indexes.byType.clear();
    this.indexes.byEffectiveness.clear();
    this.indexes.byLanguage.clear();
    this.indexes.byFramework.clear();

    // Rebuild indexes    /**
   * Performs the specified operation
   * @param {number} const [id
   * @param {boolean} pattern] of this.patterns
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {number} const [id
   * @param {boolean} pattern] of this.patterns
   * @returns {boolean} True if successful, false otherwise
   */

    for (const [id, pattern] of this.patterns) {
      this.updateIndexes(pattern);
    }
  }  /**
   * Updates existing data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Updates existing data
   * @returns {Promise} Promise that resolves with the result
   */


  async updateIndexesIfNeeded() {
    const now = Date.now();    /**
   * Performs the specified operation
   * @param {Object} now - this.lastIndexUpdate > this.config.indexUpdateInterval
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} now - this.lastIndexUpdate > this.config.indexUpdateInterval
   * @returns {boolean} True if successful, false otherwise
   */

    if (now - this.lastIndexUpdate > this.config.indexUpdateInterval) {
      this.rebuildIndexes();
      this.lastIndexUpdate = now;
    }
  }  /**
   * Retrieves data
   * @param {any} type
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} type
   * @returns {string} The retrieved data
   */


  getCandidatesByType(type) {
    const candidateIds = this.indexes.byType.get(type) || [];
    return candidateIds.map(id => this.patterns.get(id)).filter(Boolean);
  }  /**
   * Calculates the result
   * @param {any} pattern
   * @param {any} targetPattern
   * @param {any} context
   * @returns {string} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} pattern
   * @param {any} targetPattern
   * @param {any} context
   * @returns {string} The calculated result
   */


  calculateSimilarity(pattern, targetPattern, context) {
    let similarity = 0;

    // Type similarity (40% weight)    /**
   * Performs the specified operation
   * @param {any} pattern.type - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} pattern.type - Optional parameter
   * @returns {string} The operation result
   */

    if (pattern.type === targetPattern.type) {
      similarity += 0.4;
    }

    // Language similarity (20% weight)
    const patternLanguage = pattern.metadata?.language || pattern.context?.language;
    const targetLanguage = targetPattern.metadata?.language || targetPattern.context?.language;    /**
   * Performs the specified operation
   * @param {any} patternLanguage - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patternLanguage - Optional parameter
   * @returns {string} The operation result
   */

    if (patternLanguage === targetLanguage) {
      similarity += 0.2;
    }

    // Framework similarity (20% weight)
    const patternFramework = pattern.metadata?.framework || pattern.context?.framework;
    const targetFramework = targetPattern.metadata?.framework || targetPattern.context?.framework;    /**
   * Performs the specified operation
   * @param {any} patternFramework - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patternFramework - Optional parameter
   * @returns {string} The operation result
   */

    if (patternFramework === targetFramework) {
      similarity += 0.2;
    }

    // Context similarity (20% weight)
    const contextSimilarity = this.calculateContextSimilarity(pattern.context, context);
    similarity += contextSimilarity * 0.2;

    return similarity;
  }  /**
   * Calculates the result
   * @param {any} patternContext
   * @param {any} targetContext
   * @returns {string} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} patternContext
   * @param {any} targetContext
   * @returns {string} The calculated result
   */


  calculateContextSimilarity(patternContext, targetContext) {  /**
   * Performs the specified operation
   * @param {any} !patternContext || !targetContext
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !patternContext || !targetContext
   * @returns {string} The operation result
   */

    if (!patternContext || !targetContext) {return 0;}

    let similarity = 0;
    let comparisons = 0;

    // Compare project types    /**
   * Performs the specified operation
   * @param {any} patternContext.project?.type && targetContext.project?.type
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patternContext.project?.type && targetContext.project?.type
   * @returns {string} The operation result
   */

    if (patternContext.project?.type && targetContext.project?.type) {      /**
   * Performs the specified operation
   * @param {any} patternContext.project.type - Optional parameter
   * @returns {string} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} patternContext.project.type - Optional parameter
   * @returns {string} The operation result
   */

      if (patternContext.project.type === targetContext.project.type) {
        similarity += 0.3;
      }
      comparisons++;
    }

    // Compare frameworks    /**
   * Performs the specified operation
   * @param {any} patternContext.project?.framework && targetContext.project?.framework
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patternContext.project?.framework && targetContext.project?.framework
   * @returns {string} The operation result
   */

    if (patternContext.project?.framework && targetContext.project?.framework) {
      const patternFrameworks = patternContext.project.framework;
      const targetFrameworks = targetContext.project.framework;

      if (Array.isArray(patternFrameworks) && Array.isArray(targetFrameworks)) {
        const commonFrameworks = patternFrameworks.filter(f => targetFrameworks.includes(f));        /**
   * Performs the specified operation
   * @param {any} commonFrameworks.length > 0
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} commonFrameworks.length > 0
   * @returns {any} The operation result
   */

        if (commonFrameworks.length > 0) {
          similarity += 0.3;
        }
      }
      comparisons++;
    }

    // Compare architecture patterns    /**
   * Performs the specified operation
   * @param {any} patternContext.architecture && targetContext.architecture
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patternContext.architecture && targetContext.architecture
   * @returns {string} The operation result
   */

    if (patternContext.architecture && targetContext.architecture) {
      const patternArch = patternContext.architecture.primary?.name;
      const targetArch = targetContext.architecture.primary?.name;      /**
   * Performs the specified operation
   * @param {any} patternArch && targetArch && patternArch - Optional parameter
   * @returns {string} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} patternArch && targetArch && patternArch - Optional parameter
   * @returns {string} The operation result
   */


      if (patternArch && targetArch && patternArch === targetArch) {
        similarity += 0.4;
      }
      comparisons++;
    }

    return comparisons > 0 ? similarity / comparisons : 0;
  }  /**
   * Performs the specified operation
   * @param {any} pattern
   * @param {any} criteria
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} pattern
   * @param {any} criteria
   * @returns {any} The operation result
   */


  matchesCriteria(pattern, criteria) {  /**
   * Performs the specified operation
   * @param {any} criteria.type && pattern.type ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} criteria.type && pattern.type ! - Optional parameter
   * @returns {any} The operation result
   */

    if (criteria.type && pattern.type !== criteria.type) {
      return false;
    }    /**
   * Performs the specified operation
   * @param {any} criteria.minEffectiveness && pattern.effectiveness < criteria.minEffectiveness
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} criteria.minEffectiveness && pattern.effectiveness < criteria.minEffectiveness
   * @returns {any} The operation result
   */


    if (criteria.minEffectiveness && pattern.effectiveness < criteria.minEffectiveness) {
      return false;
    }    /**
   * Performs the specified operation
   * @param {any} criteria.language && pattern.metadata?.language ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} criteria.language && pattern.metadata?.language ! - Optional parameter
   * @returns {any} The operation result
   */


    if (criteria.language && pattern.metadata?.language !== criteria.language && pattern.context?.language !== criteria.language) {
      return false;
    }    /**
   * Performs the specified operation
   * @param {any} criteria.framework && pattern.metadata?.framework ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} criteria.framework && pattern.metadata?.framework ! - Optional parameter
   * @returns {any} The operation result
   */


    if (criteria.framework && pattern.metadata?.framework !== criteria.framework) {
      return false;
    }    /**
   * Performs the specified operation
   * @param {any} criteria.category && pattern.category ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} criteria.category && pattern.category ! - Optional parameter
   * @returns {any} The operation result
   */


    if (criteria.category && pattern.category !== criteria.category) {
      return false;
    }    /**
   * Performs the specified operation
   * @param {number} criteria.minUsageCount && pattern.usageCount < criteria.minUsageCount
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} criteria.minUsageCount && pattern.usageCount < criteria.minUsageCount
   * @returns {any} The operation result
   */


    if (criteria.minUsageCount && pattern.usageCount < criteria.minUsageCount) {
      return false;
    }    /**
   * Performs the specified operation
   * @param {any} criteria.context?.language && pattern.context?.language ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} criteria.context?.language && pattern.context?.language ! - Optional parameter
   * @returns {any} The operation result
   */


    if (criteria.context?.language && pattern.context?.language !== criteria.context.language) {
      return false;
    }    /**
   * Performs the specified operation
   * @param {any} criteria.pattern && pattern.context?.pattern ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} criteria.pattern && pattern.context?.pattern ! - Optional parameter
   * @returns {any} The operation result
   */


    if (criteria.pattern && pattern.context?.pattern !== criteria.pattern) {
      return false;
    }    /**
   * Performs the specified operation
   * @param {any} criteria.context?.pattern && pattern.context?.pattern ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} criteria.context?.pattern && pattern.context?.pattern ! - Optional parameter
   * @returns {any} The operation result
   */


    if (criteria.context?.pattern && pattern.context?.pattern !== criteria.context.pattern) {
      return false;
    }

    return true;
  }
}
