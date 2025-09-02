/**
 * Pattern Similarity Calculator
 * Calculates similarity scores between patterns using multiple algorithms
 */

export class PatternSimilarityCalculator {
  constructor() {
    this.weights = {
      code: 0.4,
      context: 0.3,
      metadata: 0.2,
      structure: 0.1
    };
  }

  /**
   * Calculate overall similarity between two patterns
   * @param {Object} pattern1 - First pattern
   * @param {Object} pattern2 - Second pattern
   * @param {Object} context - Calculation context
   * @returns {number} Similarity score 0-1
   */
  calculateSimilarity(pattern1, pattern2, context = {}) {
    if (!pattern1 || !pattern2) return 0;
    if (pattern1.id === pattern2.id) return 1;

    let totalSimilarity = 0;
    let totalWeight = 0;

    // Code similarity
    const codeSim = this.calculateCodeSimilarity(pattern1, pattern2);
    totalSimilarity += codeSim * this.weights.code;
    totalWeight += this.weights.code;

    // Context similarity
    const contextSim = this.calculateContextSimilarity(
      pattern1.context || {}, 
      pattern2.context || {}
    );
    totalSimilarity += contextSim * this.weights.context;
    totalWeight += this.weights.context;

    // Metadata similarity
    const metaSim = this.calculateMetadataSimilarity(pattern1, pattern2);
    totalSimilarity += metaSim * this.weights.metadata;
    totalWeight += this.weights.metadata;

    // Structure similarity
    const structSim = this.calculateStructureSimilarity(pattern1, pattern2);
    totalSimilarity += structSim * this.weights.structure;
    totalWeight += this.weights.structure;

    return totalWeight > 0 ? totalSimilarity / totalWeight : 0;
  }

  /**
   * Calculate code similarity using string comparison
   * @param {Object} pattern1 - First pattern
   * @param {Object} pattern2 - Second pattern
   * @returns {number} Code similarity 0-1
   */
  calculateCodeSimilarity(pattern1, pattern2) {
    const code1 = this.normalizeCode(pattern1.codeExample || '');
    const code2 = this.normalizeCode(pattern2.codeExample || '');

    if (!code1 || !code2) return 0;
    if (code1 === code2) return 1;

    // Use Levenshtein distance for string similarity
    return this.calculateLevenshteinSimilarity(code1, code2);
  }

  /**
   * Calculate context similarity
   * @param {Object} context1 - First context
   * @param {Object} context2 - Second context
   * @returns {number} Context similarity 0-1
   */
  calculateContextSimilarity(context1, context2) {
    let matches = 0;
    let total = 0;

    // File type similarity
    if (context1.fileType || context2.fileType) {
      total++;
      if (context1.fileType === context2.fileType) matches++;
    }

    // Project type similarity
    if (context1.projectType || context2.projectType) {
      total++;
      if (context1.projectType === context2.projectType) matches++;
    }

    // Framework similarity
    if (context1.framework || context2.framework) {
      total++;
      if (context1.framework === context2.framework) matches++;
    }

    // Directory similarity
    if (context1.directory || context2.directory) {
      total++;
      const dirSim = this.calculateDirectorySimilarity(
        context1.directory, 
        context2.directory
      );
      matches += dirSim;
    }

    // Dependencies similarity
    const depSim = this.calculateDependencySimilarity(
      context1.dependencies || [], 
      context2.dependencies || []
    );
    if (context1.dependencies?.length || context2.dependencies?.length) {
      total++;
      matches += depSim;
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Calculate metadata similarity
   * @param {Object} pattern1 - First pattern
   * @param {Object} pattern2 - Second pattern
   * @returns {number} Metadata similarity 0-1
   */
  calculateMetadataSimilarity(pattern1, pattern2) {
    let similarity = 0;
    let factors = 0;

    // Type similarity
    if (pattern1.type && pattern2.type) {
      factors++;
      similarity += pattern1.type === pattern2.type ? 1 : 0;
    }

    // Category similarity
    if (pattern1.category && pattern2.category) {
      factors++;
      similarity += pattern1.category === pattern2.category ? 1 : 0;
    }

    // Tags similarity
    const tagSim = this.calculateTagSimilarity(
      pattern1.tags || [], 
      pattern2.tags || []
    );
    if (pattern1.tags?.length || pattern2.tags?.length) {
      factors++;
      similarity += tagSim;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate structure similarity
   * @param {Object} pattern1 - First pattern
   * @param {Object} pattern2 - Second pattern
   * @returns {number} Structure similarity 0-1
   */
  calculateStructureSimilarity(pattern1, pattern2) {
    const struct1 = pattern1.structure || {};
    const struct2 = pattern2.structure || {};

    let similarity = 0;
    let factors = 0;

    // Complexity similarity
    if (struct1.complexity !== undefined && struct2.complexity !== undefined) {
      factors++;
      const diff = Math.abs(struct1.complexity - struct2.complexity);
      similarity += Math.max(0, 1 - diff / 10); // Normalize to 0-1
    }

    // Lines of code similarity
    if (struct1.linesOfCode && struct2.linesOfCode) {
      factors++;
      const ratio = Math.min(struct1.linesOfCode, struct2.linesOfCode) / 
                   Math.max(struct1.linesOfCode, struct2.linesOfCode);
      similarity += ratio;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate Levenshtein similarity between strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity 0-1
   */
  calculateLevenshteinSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }

  /**
   * Calculate Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Normalize code for comparison
   * @param {string} code - Code to normalize
   * @returns {string} Normalized code
   */
  normalizeCode(code) {
    return code
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/['"]/g, '"')
      .trim();
  }

  /**
   * Calculate directory path similarity
   * @param {string} dir1 - First directory
   * @param {string} dir2 - Second directory
   * @returns {number} Similarity 0-1
   */
  calculateDirectorySimilarity(dir1, dir2) {
    if (!dir1 || !dir2) return 0;
    if (dir1 === dir2) return 1;

    const parts1 = dir1.split('/').filter(p => p);
    const parts2 = dir2.split('/').filter(p => p);
    
    const commonParts = parts1.filter(part => parts2.includes(part)).length;
    const totalParts = Math.max(parts1.length, parts2.length);
    
    return totalParts > 0 ? commonParts / totalParts : 0;
  }

  /**
   * Calculate dependency similarity
   * @param {Array} deps1 - First dependency list
   * @param {Array} deps2 - Second dependency list
   * @returns {number} Similarity 0-1
   */
  calculateDependencySimilarity(deps1, deps2) {
    if (!deps1.length && !deps2.length) return 1;
    if (!deps1.length || !deps2.length) return 0;

    const set1 = new Set(deps1);
    const set2 = new Set(deps2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate tag similarity
   * @param {Array} tags1 - First tag list
   * @param {Array} tags2 - Second tag list
   * @returns {number} Similarity 0-1
   */
  calculateTagSimilarity(tags1, tags2) {
    return this.calculateDependencySimilarity(tags1, tags2);
  }
}