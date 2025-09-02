/**
 * Recommendation Filter and Deduplication
 * Filters and processes recommendations based on various criteria
 */

export class RecommendationFilter {
  constructor(config = {}) {
    this.config = config;
    this.maxRecommendations = config.maxRecommendations || 20;
  }

  /**
   * Process recommendations with filtering and deduplication
   * @param {Array} recommendations - Raw recommendations
   * @param {string} projectType - Project type for filtering
   * @returns {Array} Filtered and prioritized recommendations
   */
  process(recommendations, projectType) {
    // Remove duplicates
    const deduplicated = this.deduplicateRecommendations(recommendations);
    
    // Filter by project type
    const filtered = this.filterByProjectType(deduplicated, projectType);
    
    // Sort by priority and impact
    const sorted = this.sortRecommendations(filtered);
    
    // Limit results
    return sorted.slice(0, this.maxRecommendations);
  }

  /**
   * Remove duplicate recommendations
   */
  deduplicateRecommendations(recommendations) {
    const seen = new Set();
    const unique = [];

    for (const rec of recommendations) {
      const key = this.getDeduplicationKey(rec);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    }

    return unique;
  }

  /**
   * Generate deduplication key for a recommendation
   */
  getDeduplicationKey(recommendation) {
    return `${recommendation.category}:${recommendation.title}`;
  }

  /**
   * Filter recommendations by project type
   */
  filterByProjectType(recommendations, projectType) {
    if (!projectType) return recommendations;
    
    return recommendations.filter(rec => 
      !rec.excludeProjectTypes?.includes(projectType) &&
      (!rec.includeProjectTypes || rec.includeProjectTypes.includes(projectType))
    );
  }

  /**
   * Sort recommendations by priority and impact
   */
  sortRecommendations(recommendations) {
    return recommendations.sort((a, b) => {
      // First by impact (highest first)
      if (a.impact !== b.impact) {
        return b.impact - a.impact;
      }
      
      // Then by priority (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      return bPriority - aPriority;
    });
  }

  /**
   * Group recommendations by category
   */
  groupByCategory(recommendations) {
    const groups = {};
    
    for (const rec of recommendations) {
      if (!groups[rec.category]) {
        groups[rec.category] = [];
      }
      groups[rec.category].push(rec);
    }
    
    return groups;
  }
}