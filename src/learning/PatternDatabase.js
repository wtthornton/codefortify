/**
 * Pattern Database - Pattern storage and management system
 * Refactored using Strategy pattern to reduce from 1627 to ~350 lines
 */

import fs from 'fs/promises';
import path from 'path';
import { PatternSearchStrategy } from './patterns/PatternSearchStrategy.js';
import { PatternSimilarityCalculator } from './patterns/PatternSimilarityCalculator.js';
import { PatternFilterManager } from './patterns/PatternFilterManager.js';
import { PatternIndexManager } from './patterns/PatternIndexManager.js';

export class PatternDatabase {
  constructor(config = {}) {
    this.config = {
      filePath: config.filePath || path.join(process.cwd(), '.context7', 'patterns.json'),
      autoSave: config.autoSave !== false,
      maxPatterns: config.maxPatterns || 1000,
      backupCount: config.backupCount || 5,
      ...config
    };

    // Core data storage
    this.patterns = new Map();
    this.metadata = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      totalPatterns: 0
    };

    // Initialize strategies and managers
    this.searchStrategy = new PatternSearchStrategy();
    this.similarityCalculator = new PatternSimilarityCalculator();
    this.filterManager = new PatternFilterManager();
    this.indexManager = new PatternIndexManager();

    // Performance tracking
    this.operationStats = {
      searches: 0,
      stores: 0,
      updates: 0,
      deletes: 0
    };

    this.isInitialized = false;
  }

  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadFromFile();
      this.indexManager.rebuildIndexes(this.patterns);
      this.isInitialized = true;
    } catch (error) {
      console.warn('Could not load patterns from file, starting fresh:', error.message);
      this.isInitialized = true;
    }
  }

  /**
   * Store a new pattern
   * @param {Object} pattern - Pattern to store
   * @returns {Promise<string>} Pattern ID
   */
  async store(pattern) {
    await this.ensureInitialized();

    const normalizedPattern = this.normalizePattern(pattern);
    const patternId = normalizedPattern.id || this.generateId();
    
    normalizedPattern.id = patternId;
    normalizedPattern.createdAt = normalizedPattern.createdAt || new Date().toISOString();
    normalizedPattern.lastModified = new Date().toISOString();
    normalizedPattern.usageCount = normalizedPattern.usageCount || 0;

    // Store pattern
    this.patterns.set(patternId, normalizedPattern);
    
    // Update indexes
    this.indexManager.updateIndexes(normalizedPattern);
    
    // Update metadata
    this.updateMetadata();
    this.operationStats.stores++;

    // Auto-save if enabled
    if (this.config.autoSave) {
      await this.persistToFile();
    }

    return patternId;
  }

  /**
   * Get a pattern by ID
   * @param {string} patternId - Pattern ID
   * @returns {Promise<Object|null>} Pattern or null if not found
   */
  async get(patternId) {
    await this.ensureInitialized();
    return this.patterns.get(patternId) || null;
  }

  /**
   * Update an existing pattern
   * @param {string} patternId - Pattern ID to update
   * @param {Object} updates - Pattern updates
   * @returns {Promise<boolean>} True if updated successfully
   */
  async update(patternId, updates) {
    await this.ensureInitialized();

    const existingPattern = this.patterns.get(patternId);
    if (!existingPattern) {
      return false;
    }

    const updatedPattern = {
      ...existingPattern,
      ...updates,
      id: patternId, // Preserve ID
      lastModified: new Date().toISOString()
    };

    this.patterns.set(patternId, updatedPattern);
    this.indexManager.updateIndexes(updatedPattern);
    
    this.updateMetadata();
    this.operationStats.updates++;

    if (this.config.autoSave) {
      await this.persistToFile();
    }

    return true;
  }

  /**
   * Delete a pattern
   * @param {string} patternId - Pattern ID to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(patternId) {
    await this.ensureInitialized();

    if (!this.patterns.has(patternId)) {
      return false;
    }

    this.patterns.delete(patternId);
    this.indexManager.removeFromIndexes(patternId);
    
    this.updateMetadata();
    this.operationStats.deletes++;

    if (this.config.autoSave) {
      await this.persistToFile();
    }

    return true;
  }

  /**
   * Find similar patterns using search strategy
   * @param {Object} targetPattern - Pattern to find matches for
   * @param {Object} context - Search context
   * @returns {Promise<Array>} Similar patterns with similarity scores
   */
  async findSimilarPatterns(targetPattern, context = {}) {
    await this.ensureInitialized();
    this.operationStats.searches++;
    
    return await this.searchStrategy.findSimilarPatterns(
      targetPattern, 
      context, 
      this
    );
  }

  /**
   * Search patterns with criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Matching patterns
   */
  async search(criteria = {}) {
    await this.ensureInitialized();
    this.operationStats.searches++;
    
    return await this.searchStrategy.search(criteria, this);
  }

  /**
   * Get all patterns
   * @returns {Promise<Array>} All patterns
   */
  async getAllPatterns() {
    await this.ensureInitialized();
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns by type
   * @param {string} type - Pattern type
   * @returns {Promise<Array>} Matching patterns
   */
  async getPatternsByType(type) {
    await this.ensureInitialized();
    return this.indexManager.getFromIndex('type', type);
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    await this.ensureInitialized();
    
    const patterns = Array.from(this.patterns.values());
    const now = Date.now();
    
    return {
      totalPatterns: patterns.length,
      patternsByType: this.getPatternCountsByType(patterns),
      averageEffectiveness: this.calculateAverageEffectiveness(patterns),
      mostUsedPattern: this.findMostUsedPattern(patterns),
      oldestPattern: this.findOldestPattern(patterns),
      newestPattern: this.findNewestPattern(patterns),
      recentlyUsed: patterns.filter(p => {
        const lastUsed = new Date(p.lastUsed || 0).getTime();
        return (now - lastUsed) < (7 * 24 * 60 * 60 * 1000); // 7 days
      }).length,
      operationStats: { ...this.operationStats },
      indexStats: this.indexManager.getIndexStats(),
      metadata: { ...this.metadata }
    };
  }

  /**
   * Export patterns with filtering
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export data
   */
  async exportPatterns(options = {}) {
    await this.ensureInitialized();
    
    let patterns = Array.from(this.patterns.values());

    // Apply filters if provided
    if (options.filters) {
      patterns = this.filterManager.applyFilters(patterns, options.filters);
    }

    // Apply format
    if (options.format === 'minimal') {
      patterns = patterns.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        codeExample: p.codeExample
      }));
    }

    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalPatterns: patterns.length,
        version: this.metadata.version,
        format: options.format || 'full'
      },
      patterns
    };
  }

  /**
   * Import patterns from data
   * @param {Array} patterns - Patterns to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import results
   */
  async importPatterns(patterns, options = {}) {
    await this.ensureInitialized();
    
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const pattern of patterns) {
      try {
        const normalized = this.normalizePattern(pattern);
        const exists = this.patterns.has(normalized.id);

        if (exists && !options.overwrite) {
          results.skipped++;
          continue;
        }

        await this.store(normalized);
        
        if (exists) {
          results.updated++;
        } else {
          results.imported++;
        }
      } catch (error) {
        results.errors.push({
          pattern: pattern.id || 'unknown',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Cleanup old and ineffective patterns
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanup(options = {}) {
    await this.ensureInitialized();
    
    const {
      maxAge = 365, // days
      minEffectiveness = 0.1,
      maxPatterns = this.config.maxPatterns,
      keepMinimum = 10
    } = options;

    const patterns = Array.from(this.patterns.values());
    let deleted = 0;

    // Remove old patterns
    const cutoffDate = Date.now() - (maxAge * 24 * 60 * 60 * 1000);
    const oldPatterns = patterns.filter(p => {
      const created = new Date(p.createdAt || 0).getTime();
      return created < cutoffDate && (p.effectiveness || 0) < minEffectiveness;
    });

    for (const pattern of oldPatterns) {
      if (patterns.length - deleted > keepMinimum) {
        await this.delete(pattern.id);
        deleted++;
      }
    }

    // Remove excess patterns if over limit
    if (patterns.length > maxPatterns) {
      const sortedPatterns = patterns
        .sort((a, b) => (a.effectiveness || 0) - (b.effectiveness || 0))
        .slice(0, patterns.length - maxPatterns);

      for (const pattern of sortedPatterns) {
        if (patterns.length - deleted > keepMinimum) {
          await this.delete(pattern.id);
          deleted++;
        }
      }
    }

    return { deleted, remaining: patterns.length - deleted };
  }

  // Helper methods

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  normalizePattern(pattern) {
    if (!pattern.type) {
      throw new Error('Pattern must have a type');
    }

    return {
      id: pattern.id || this.generateId(),
      type: pattern.type,
      title: pattern.title || 'Untitled Pattern',
      description: pattern.description || '',
      codeExample: pattern.codeExample || '',
      context: pattern.context || {},
      tags: pattern.tags || [],
      category: pattern.category || 'general',
      effectiveness: Math.max(0, Math.min(1, pattern.effectiveness || 0)),
      usageCount: Math.max(0, pattern.usageCount || 0),
      createdAt: pattern.createdAt || new Date().toISOString(),
      lastModified: pattern.lastModified || new Date().toISOString(),
      lastUsed: pattern.lastUsed || null,
      structure: pattern.structure || {}
    };
  }

  generateId() {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateMetadata() {
    this.metadata.lastModified = new Date().toISOString();
    this.metadata.totalPatterns = this.patterns.size;
  }

  async loadFromFile() {
    try {
      const content = await fs.readFile(this.config.filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (data.patterns) {
        for (const pattern of data.patterns) {
          this.patterns.set(pattern.id, pattern);
        }
      }
      
      if (data.metadata) {
        this.metadata = { ...this.metadata, ...data.metadata };
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async persistToFile() {
    const data = {
      metadata: this.metadata,
      patterns: Array.from(this.patterns.values())
    };

    await fs.mkdir(path.dirname(this.config.filePath), { recursive: true });
    await fs.writeFile(this.config.filePath, JSON.stringify(data, null, 2));
  }

  // Statistics helpers
  getPatternCountsByType(patterns) {
    const counts = {};
    patterns.forEach(p => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return counts;
  }

  calculateAverageEffectiveness(patterns) {
    if (patterns.length === 0) return 0;
    const total = patterns.reduce((sum, p) => sum + (p.effectiveness || 0), 0);
    return total / patterns.length;
  }

  findMostUsedPattern(patterns) {
    return patterns.reduce((max, p) => 
      (p.usageCount || 0) > (max?.usageCount || 0) ? p : max, null);
  }

  findOldestPattern(patterns) {
    return patterns.reduce((oldest, p) => {
      const pDate = new Date(p.createdAt || 0);
      const oldestDate = oldest ? new Date(oldest.createdAt || 0) : new Date();
      return pDate < oldestDate ? p : oldest;
    }, null);
  }

  findNewestPattern(patterns) {
    return patterns.reduce((newest, p) => {
      const pDate = new Date(p.createdAt || 0);
      const newestDate = newest ? new Date(newest.createdAt || 0) : new Date(0);
      return pDate > newestDate ? p : newest;
    }, null);
  }

  // Backward compatibility aliases
  async savePattern(pattern) { return this.store(pattern); }
  async getPattern(id) { return this.get(id); }
  async searchPatterns(criteria) { return this.search(criteria); }
  async deletePattern(id) { return this.delete(id); }
}