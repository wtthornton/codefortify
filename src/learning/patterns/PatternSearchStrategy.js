/**
 * Pattern Search Strategy
 * Handles pattern finding and searching operations
 */

export class PatternSearchStrategy {
  constructor() {
    this.searchCache = new Map();
    this.cacheSize = 100;
  }

  /**
   * Find similar patterns to a target pattern
   * @param {Object} targetPattern - Pattern to find matches for
   * @param {Object} context - Search context
   * @param {PatternDatabase} database - Database instance
   * @returns {Promise<Array>} Similar patterns
   */
  async findSimilarPatterns(targetPattern, context, database) {
    if (!targetPattern || !database) {return [];}

    const cacheKey = this.getCacheKey(targetPattern, context);
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    // Get candidates by type first for efficiency
    const candidates = this.getCandidatesByType(targetPattern.type, database);
    if (candidates.length === 0) {return [];}

    // Calculate similarities
    const results = [];
    const minSimilarity = context?.minSimilarity || 0.3;

    for (const candidate of candidates) {
      if (candidate.id === targetPattern.id) {continue;}

      const similarity = database.similarityCalculator.calculateSimilarity(
        candidate,
        targetPattern,
        context
      );

      if (similarity >= minSimilarity) {
        results.push({
          pattern: candidate,
          similarity,
          score: this.calculateRelevanceScore(candidate, targetPattern, context)
        });
      }
    }

    // Sort by combined similarity and relevance
    results.sort((a, b) => {
      const aScore = a.similarity * 0.7 + a.score * 0.3;
      const bScore = b.similarity * 0.7 + b.score * 0.3;
      return bScore - aScore;
    });

    // Cache results
    const finalResults = results.slice(0, context?.maxResults || 10);
    this.updateCache(cacheKey, finalResults);

    return finalResults;
  }

  /**
   * Search patterns with criteria
   * @param {Object} criteria - Search criteria
   * @param {PatternDatabase} database - Database instance
   * @returns {Promise<Array>} Matching patterns
   */
  async search(criteria, database) {
    if (!criteria || !database) {return [];}

    let candidates = Array.from(database.patterns.values());

    // Apply type filter first for efficiency
    if (criteria.type) {
      candidates = this.getCandidatesByType(criteria.type, database);
    }

    // Apply filters
    const filtered = candidates.filter(pattern =>
      database.filterManager.matchesCriteria(pattern, criteria)
    );

    // Apply sorting
    return this.applySorting(filtered, criteria.sort);
  }

  /**
   * Get candidate patterns by type
   * @param {string} type - Pattern type
   * @param {PatternDatabase} database - Database instance
   * @returns {Array} Candidate patterns
   */
  getCandidatesByType(type, database) {
    const typeIndex = database.indexes?.type;
    if (!typeIndex || !type) {
      return Array.from(database.patterns.values());
    }

    return typeIndex.get(type) || [];
  }

  /**
   * Calculate relevance score for pattern
   * @param {Object} pattern - Candidate pattern
   * @param {Object} targetPattern - Target pattern
   * @param {Object} context - Search context
   * @returns {number} Relevance score 0-1
   */
  calculateRelevanceScore(pattern, targetPattern, context) {
    let score = 0;

    // Recency bonus (patterns used recently are more relevant)
    const daysSinceUsed = (Date.now() - (pattern.lastUsed || 0)) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - daysSinceUsed / 30) * 0.2;

    // Effectiveness bonus
    score += (pattern.effectiveness || 0) * 0.3;

    // Usage frequency bonus
    const usageCount = pattern.usageCount || 0;
    score += Math.min(usageCount / 10, 1) * 0.2;

    // Context relevance
    if (context?.projectType && pattern.projectTypes?.includes(context.projectType)) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * Apply sorting to results
   * @param {Array} patterns - Patterns to sort
   * @param {Object} sortCriteria - Sort criteria
   * @returns {Array} Sorted patterns
   */
  applySorting(patterns, sortCriteria) {
    if (!sortCriteria) {return patterns;}

    const { field = 'lastUsed', direction = 'desc' } = sortCriteria;

    return patterns.sort((a, b) => {
      let aVal = a[field] || 0;
      let bVal = b[field] || 0;

      if (field === 'createdAt' || field === 'lastUsed') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      const result = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return direction === 'desc' ? -result : result;
    });
  }

  /**
   * Generate cache key for search
   * @param {Object} targetPattern - Target pattern
   * @param {Object} context - Search context
   * @returns {string} Cache key
   */
  getCacheKey(targetPattern, context = {}) {
    const key = [
      targetPattern.type,
      targetPattern.id,
      context.minSimilarity || 0.3,
      context.maxResults || 10
    ].join(':');
    return key;
  }

  /**
   * Update search cache
   * @param {string} key - Cache key
   * @param {Array} results - Search results
   */
  updateCache(key, results) {
    if (this.searchCache.size >= this.cacheSize) {
      // Remove oldest entry
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
    this.searchCache.set(key, results);
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
  }
}