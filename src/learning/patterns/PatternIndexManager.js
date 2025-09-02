/**
 * Pattern Index Manager
 * Manages indexes for efficient pattern lookups
 */

export class PatternIndexManager {
  constructor() {
    this.indexes = {
      type: new Map(),
      category: new Map(),
      tags: new Map(),
      projectType: new Map(),
      framework: new Map()
    };
    this.indexUpdateQueue = [];
    this.batchSize = 50;
  }

  /**
   * Update indexes for a pattern
   * @param {Object} pattern - Pattern to index
   */
  updateIndexes(pattern) {
    if (!pattern || !pattern.id) return;

    this.removeFromIndexes(pattern.id);
    this.addToIndexes(pattern);
  }

  /**
   * Add pattern to indexes
   * @param {Object} pattern - Pattern to add
   */
  addToIndexes(pattern) {
    // Type index
    if (pattern.type) {
      this.addToIndex('type', pattern.type, pattern);
    }

    // Category index
    if (pattern.category) {
      this.addToIndex('category', pattern.category, pattern);
    }

    // Tags index
    if (pattern.tags && Array.isArray(pattern.tags)) {
      pattern.tags.forEach(tag => {
        this.addToIndex('tags', tag, pattern);
      });
    }

    // Context indexes
    const context = pattern.context || {};
    if (context.projectType) {
      this.addToIndex('projectType', context.projectType, pattern);
    }

    if (context.framework) {
      this.addToIndex('framework', context.framework, pattern);
    }
  }

  /**
   * Remove pattern from indexes
   * @param {string} patternId - Pattern ID to remove
   */
  removeFromIndexes(patternId) {
    for (const [indexName, index] of Object.entries(this.indexes)) {
      for (const [key, patterns] of index.entries()) {
        const filteredPatterns = patterns.filter(p => p.id !== patternId);
        if (filteredPatterns.length === 0) {
          index.delete(key);
        } else if (filteredPatterns.length !== patterns.length) {
          index.set(key, filteredPatterns);
        }
      }
    }
  }

  /**
   * Add pattern to specific index
   * @param {string} indexName - Index name
   * @param {string} key - Index key
   * @param {Object} pattern - Pattern to add
   */
  addToIndex(indexName, key, pattern) {
    const index = this.indexes[indexName];
    if (!index) return;

    if (!index.has(key)) {
      index.set(key, []);
    }
    
    const patterns = index.get(key);
    if (!patterns.some(p => p.id === pattern.id)) {
      patterns.push(pattern);
    }
  }

  /**
   * Get patterns from index
   * @param {string} indexName - Index name
   * @param {string} key - Index key
   * @returns {Array} Matching patterns
   */
  getFromIndex(indexName, key) {
    const index = this.indexes[indexName];
    return index?.get(key) || [];
  }

  /**
   * Rebuild all indexes from patterns
   * @param {Map} patterns - All patterns
   */
  rebuildIndexes(patterns) {
    // Clear existing indexes
    this.clearIndexes();

    // Rebuild from patterns
    for (const pattern of patterns.values()) {
      this.addToIndexes(pattern);
    }
  }

  /**
   * Clear all indexes
   */
  clearIndexes() {
    for (const index of Object.values(this.indexes)) {
      index.clear();
    }
  }

  /**
   * Update indexes if needed (batch processing)
   * @param {Array} patternUpdates - Array of pattern updates
   */
  updateIndexesIfNeeded(patternUpdates = []) {
    this.indexUpdateQueue.push(...patternUpdates);

    if (this.indexUpdateQueue.length >= this.batchSize) {
      this.processBatch();
    }
  }

  /**
   * Process batch of index updates
   */
  processBatch() {
    const batch = this.indexUpdateQueue.splice(0, this.batchSize);
    
    for (const update of batch) {
      if (update.action === 'add' || update.action === 'update') {
        this.updateIndexes(update.pattern);
      } else if (update.action === 'remove') {
        this.removeFromIndexes(update.patternId);
      }
    }
  }

  /**
   * Force process remaining queue
   */
  flushQueue() {
    while (this.indexUpdateQueue.length > 0) {
      this.processBatch();
    }
  }

  /**
   * Get index statistics
   * @returns {Object} Index statistics
   */
  getIndexStats() {
    const stats = {};
    
    for (const [indexName, index] of Object.entries(this.indexes)) {
      stats[indexName] = {
        keys: index.size,
        totalPatterns: Array.from(index.values()).flat().length
      };
    }

    return {
      indexes: stats,
      queueSize: this.indexUpdateQueue.length
    };
  }

  /**
   * Validate index integrity
   * @param {Map} patterns - All patterns to validate against
   * @returns {Object} Validation results
   */
  validateIndexes(patterns) {
    const issues = [];
    const patternIds = new Set(patterns.keys());

    for (const [indexName, index] of Object.entries(this.indexes)) {
      for (const [key, indexedPatterns] of index.entries()) {
        for (const pattern of indexedPatterns) {
          if (!patternIds.has(pattern.id)) {
            issues.push({
              type: 'orphaned_pattern',
              index: indexName,
              key,
              patternId: pattern.id
            });
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Optimize indexes (remove empty entries, deduplicate)
   */
  optimizeIndexes() {
    let removedEntries = 0;
    let deduplicatedPatterns = 0;

    for (const [indexName, index] of Object.entries(this.indexes)) {
      const keysToRemove = [];
      
      for (const [key, patterns] of index.entries()) {
        if (patterns.length === 0) {
          keysToRemove.push(key);
        } else {
          // Deduplicate patterns in this index entry
          const uniquePatterns = patterns.filter((pattern, index, arr) => 
            arr.findIndex(p => p.id === pattern.id) === index
          );
          
          if (uniquePatterns.length !== patterns.length) {
            deduplicatedPatterns += patterns.length - uniquePatterns.length;
            index.set(key, uniquePatterns);
          }
        }
      }

      // Remove empty entries
      keysToRemove.forEach(key => {
        index.delete(key);
        removedEntries++;
      });
    }

    return {
      removedEntries,
      deduplicatedPatterns
    };
  }
}