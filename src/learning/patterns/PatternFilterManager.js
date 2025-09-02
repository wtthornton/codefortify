/**
 * Pattern Filter Manager
 * Handles pattern filtering based on various criteria
 */

export class PatternFilterManager {
  constructor() {
    this.filters = new Map();
    this.initializeBuiltInFilters();
  }

  /**
   * Check if pattern matches given criteria
   * @param {Object} pattern - Pattern to check
   * @param {Object} criteria - Filter criteria
   * @returns {boolean} True if pattern matches
   */
  matchesCriteria(pattern, criteria) {
    if (!pattern || !criteria) return true;

    // Type filter
    if (criteria.type && pattern.type !== criteria.type) {
      return false;
    }

    // Category filter
    if (criteria.category && pattern.category !== criteria.category) {
      return false;
    }

    // Tag filters
    if (criteria.tags && criteria.tags.length > 0) {
      const patternTags = pattern.tags || [];
      const hasRequiredTags = criteria.tags.every(tag => 
        patternTags.includes(tag)
      );
      if (!hasRequiredTags) return false;
    }

    // Effectiveness threshold
    if (criteria.minEffectiveness !== undefined) {
      const effectiveness = pattern.effectiveness || 0;
      if (effectiveness < criteria.minEffectiveness) {
        return false;
      }
    }

    // Date range filters
    if (!this.matchesDateRange(pattern, criteria)) {
      return false;
    }

    // Context filters
    if (!this.matchesContext(pattern, criteria)) {
      return false;
    }

    // Text search
    if (criteria.search && !this.matchesTextSearch(pattern, criteria.search)) {
      return false;
    }

    // Custom filters
    if (criteria.customFilters) {
      for (const filterName of Object.keys(criteria.customFilters)) {
        const filter = this.filters.get(filterName);
        if (filter && !filter(pattern, criteria.customFilters[filterName])) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Apply filters to pattern array
   * @param {Array} patterns - Patterns to filter
   * @param {Object} filters - Filter configuration
   * @returns {Array} Filtered patterns
   */
  applyFilters(patterns, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return patterns;
    }

    return patterns.filter(pattern => this.matchesCriteria(pattern, filters));
  }

  /**
   * Check date range matching
   * @param {Object} pattern - Pattern to check
   * @param {Object} criteria - Filter criteria
   * @returns {boolean} True if matches date criteria
   */
  matchesDateRange(pattern, criteria) {
    const createdAt = new Date(pattern.createdAt || 0);
    const lastUsed = new Date(pattern.lastUsed || 0);

    // Created after date
    if (criteria.createdAfter) {
      const afterDate = new Date(criteria.createdAfter);
      if (createdAt < afterDate) return false;
    }

    // Created before date
    if (criteria.createdBefore) {
      const beforeDate = new Date(criteria.createdBefore);
      if (createdAt > beforeDate) return false;
    }

    // Used after date
    if (criteria.usedAfter) {
      const afterDate = new Date(criteria.usedAfter);
      if (lastUsed < afterDate) return false;
    }

    // Used before date
    if (criteria.usedBefore) {
      const beforeDate = new Date(criteria.usedBefore);
      if (lastUsed > beforeDate) return false;
    }

    // Age in days
    if (criteria.maxAgeInDays !== undefined) {
      const maxAge = new Date(Date.now() - criteria.maxAgeInDays * 24 * 60 * 60 * 1000);
      if (createdAt < maxAge) return false;
    }

    return true;
  }

  /**
   * Check context matching
   * @param {Object} pattern - Pattern to check
   * @param {Object} criteria - Filter criteria
   * @returns {boolean} True if matches context criteria
   */
  matchesContext(pattern, criteria) {
    const context = pattern.context || {};

    // Project type filter
    if (criteria.projectType && context.projectType !== criteria.projectType) {
      return false;
    }

    // Framework filter
    if (criteria.framework && context.framework !== criteria.framework) {
      return false;
    }

    // File type filter
    if (criteria.fileType && context.fileType !== criteria.fileType) {
      return false;
    }

    // Directory filter
    if (criteria.directory && !context.directory?.includes(criteria.directory)) {
      return false;
    }

    // Dependencies filter
    if (criteria.dependencies && criteria.dependencies.length > 0) {
      const patternDeps = context.dependencies || [];
      const hasRequiredDeps = criteria.dependencies.some(dep => 
        patternDeps.includes(dep)
      );
      if (!hasRequiredDeps) return false;
    }

    return true;
  }

  /**
   * Check text search matching
   * @param {Object} pattern - Pattern to check
   * @param {string} searchText - Search text
   * @returns {boolean} True if matches search
   */
  matchesTextSearch(pattern, searchText) {
    if (!searchText) return true;

    const searchLower = searchText.toLowerCase();
    const searchFields = [
      pattern.title || '',
      pattern.description || '',
      pattern.codeExample || '',
      ...(pattern.tags || [])
    ];

    return searchFields.some(field => 
      field.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Register custom filter
   * @param {string} name - Filter name
   * @param {Function} filterFn - Filter function
   */
  registerFilter(name, filterFn) {
    this.filters.set(name, filterFn);
  }

  /**
   * Initialize built-in filters
   */
  initializeBuiltInFilters() {
    // Complexity filter
    this.registerFilter('complexity', (pattern, criteria) => {
      const complexity = pattern.structure?.complexity || 0;
      return complexity >= (criteria.min || 0) && 
             complexity <= (criteria.max || 10);
    });

    // Usage count filter
    this.registerFilter('usageCount', (pattern, criteria) => {
      const usage = pattern.usageCount || 0;
      return usage >= (criteria.min || 0) && 
             usage <= (criteria.max || Infinity);
    });

    // Effectiveness range filter
    this.registerFilter('effectivenessRange', (pattern, criteria) => {
      const effectiveness = pattern.effectiveness || 0;
      return effectiveness >= (criteria.min || 0) && 
             effectiveness <= (criteria.max || 1);
    });

    // Pattern size filter
    this.registerFilter('patternSize', (pattern, criteria) => {
      const size = pattern.codeExample?.length || 0;
      return size >= (criteria.min || 0) && 
             size <= (criteria.max || Infinity);
    });

    // Recently used filter
    this.registerFilter('recentlyUsed', (pattern, criteria) => {
      const daysAgo = criteria.daysAgo || 30;
      const cutoff = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
      const lastUsed = new Date(pattern.lastUsed || 0).getTime();
      return lastUsed >= cutoff;
    });

    // Frequently used filter
    this.registerFilter('frequentlyUsed', (pattern, criteria) => {
      const minUsage = criteria.minUsage || 5;
      return (pattern.usageCount || 0) >= minUsage;
    });

    // High effectiveness filter
    this.registerFilter('highEffectiveness', (pattern, criteria) => {
      const threshold = criteria.threshold || 0.7;
      return (pattern.effectiveness || 0) >= threshold;
    });
  }

  /**
   * Get available filter names
   * @returns {Array<string>} Filter names
   */
  getAvailableFilters() {
    return Array.from(this.filters.keys());
  }

  /**
   * Create filter preset
   * @param {string} name - Preset name
   * @param {Object} filterConfig - Filter configuration
   */
  createPreset(name, filterConfig) {
    this.presets = this.presets || new Map();
    this.presets.set(name, filterConfig);
  }

  /**
   * Apply filter preset
   * @param {Array} patterns - Patterns to filter
   * @param {string} presetName - Preset name
   * @returns {Array} Filtered patterns
   */
  applyPreset(patterns, presetName) {
    const preset = this.presets?.get(presetName);
    if (!preset) {
      throw new Error(`Filter preset '${presetName}' not found`);
    }

    return this.applyFilters(patterns, preset);
  }
}