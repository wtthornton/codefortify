/**
 * Scoring Calculator
 * Handles all scoring calculations and grade computations
 * Extracted from ProjectScorer to follow Single Responsibility Principle
 */

export class ScoringCalculator {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Calculate overall project score from category results
   * @param {Object} results - Analysis results object
   */
  calculateOverallScore(results) {
    let totalScore = 0;
    let maxTotalScore = 0;
    let hasErrors = false;

    // Sum scores from all categories
    for (const [category, result] of Object.entries(results.categories)) {
      if (result.error) {
        hasErrors = true;
        continue;
      }

      totalScore += result.score || 0;
      maxTotalScore += result.maxScore || 0;
    }

    // Calculate percentage and grade
    const percentage = maxTotalScore > 0 ? totalScore / maxTotalScore : 0;

    results.overall = {
      score: Math.round(totalScore),
      maxScore: maxTotalScore,
      percentage: Math.round(percentage * 100),
      grade: this.calculateGrade(percentage),
      hasErrors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate letter grade based on percentage score
   * Enhanced rigorous grading for true excellence
   * @param {number} percentage - Score percentage (0-1)
   * @returns {string} Letter grade (A+ to F)
   */
  calculateGrade(percentage) {
    if (percentage >= 0.98) {return 'A+';} // 98%+ for A+ - near perfect
    if (percentage >= 0.95) {return 'A';}  // 95%+ for A - excellent
    if (percentage >= 0.90) {return 'A-';} // 90%+ for A- - very good
    if (percentage >= 0.85) {return 'B+';} // 85%+ for B+ - good
    if (percentage >= 0.80) {return 'B';}  // 80%+ for B - above average
    if (percentage >= 0.75) {return 'B-';} // 75%+ for B- - satisfactory
    if (percentage >= 0.70) {return 'C+';} // 70%+ for C+ - acceptable
    if (percentage >= 0.65) {return 'C';}  // 65%+ for C - needs improvement
    if (percentage >= 0.60) {return 'C-';} // 60%+ for C- - significant issues
    if (percentage >= 0.50) {return 'D';}  // 50%+ for D - major problems
    return 'F'; // <50% - failing, needs major work
  }

  /**
   * Calculate grade color for display
   * @param {string} grade - Letter grade
   * @returns {string} Color name or code
   */
  getGradeColor(grade) {
    const colorMap = {
      'A+': '#00C851', // Green
      'A': '#00C851',
      'A-': '#2BBBAD',  // Teal
      'B+': '#4285F4', // Blue
      'B': '#4285F4',
      'B-': '#FF6F00', // Orange
      'C+': '#FF8A00', // Orange
      'C': '#FF8A00',
      'C-': '#FF4444', // Red
      'D': '#CC0000',  // Dark Red
      'F': '#CC0000'
    };

    return colorMap[grade] || '#757575'; // Gray for unknown
  }

  /**
   * Calculate improvement percentage from previous score
   * @param {number} currentScore - Current score
   * @param {number} previousScore - Previous score
   * @returns {Object} Improvement metrics
   */
  calculateImprovement(currentScore, previousScore) {
    if (!previousScore || previousScore === 0) {
      return {
        change: 0,
        percentage: 0,
        isImprovement: false,
        isSignificant: false
      };
    }

    const change = currentScore - previousScore;
    const percentage = Math.round((change / previousScore) * 100);
    const isImprovement = change > 0;
    const isSignificant = Math.abs(percentage) >= 5; // 5% threshold

    return {
      change: Math.round(change),
      percentage,
      isImprovement,
      isSignificant,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }

  /**
   * Calculate category weight distribution
   * @param {Object} categories - Category results
   * @returns {Object} Weight distribution
   */
  calculateCategoryWeights(categories) {
    const weights = {};
    let totalMaxScore = 0;

    // Calculate total possible score
    for (const [category, result] of Object.entries(categories)) {
      totalMaxScore += result.maxScore || 0;
    }

    // Calculate weight percentages
    for (const [category, result] of Object.entries(categories)) {
      const maxScore = result.maxScore || 0;
      weights[category] = {
        points: maxScore,
        percentage: totalMaxScore > 0 ? Math.round((maxScore / totalMaxScore) * 100) : 0
      };
    }

    return weights;
  }

  /**
   * Calculate score statistics
   * @param {Object} results - Analysis results
   * @returns {Object} Statistical information
   */
  calculateStatistics(results) {
    const categoryScores = Object.values(results.categories)
      .filter(r => !r.error)
      .map(r => ({
        score: r.score || 0,
        maxScore: r.maxScore || 0,
        percentage: r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0
      }));

    if (categoryScores.length === 0) {
      return {
        mean: 0,
        median: 0,
        standardDeviation: 0,
        range: { min: 0, max: 0 }
      };
    }

    // Calculate statistics
    const percentages = categoryScores.map(c => c.percentage);
    const mean = percentages.reduce((a, b) => a + b, 0) / percentages.length;

    const sortedPercentages = [...percentages].sort((a, b) => a - b);
    const median = sortedPercentages.length % 2 === 0
      ? (sortedPercentages[sortedPercentages.length / 2 - 1] + sortedPercentages[sortedPercentages.length / 2]) / 2
      : sortedPercentages[Math.floor(sortedPercentages.length / 2)];

    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / percentages.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      mean: Math.round(mean),
      median: Math.round(median),
      standardDeviation: Math.round(standardDeviation),
      range: {
        min: Math.round(Math.min(...percentages)),
        max: Math.round(Math.max(...percentages))
      }
    };
  }

  /**
   * Determine if score meets quality threshold
   * @param {number} score - Score to check
   * @param {string} threshold - Threshold level (strict, moderate, lenient)
   * @returns {boolean} True if meets threshold
   */
  meetsQualityThreshold(score, threshold = 'moderate') {
    const thresholds = {
      strict: 90,   // A- or better
      moderate: 80, // B or better
      lenient: 70   // C+ or better
    };

    return score >= (thresholds[threshold] || thresholds.moderate);
  }

  /**
   * Generate score summary text
   * @param {Object} results - Analysis results
   * @returns {string} Human-readable summary
   */
  generateScoreSummary(results) {
    if (!results.overall) {
      return 'Analysis incomplete';
    }

    const { percentage, grade } = results.overall;
    const categoryCount = Object.keys(results.categories).length;

    let summary = `Overall score: ${percentage}% (${grade} grade)`;

    if (percentage >= 90) {
      summary += ' - Excellent code quality!';
    } else if (percentage >= 80) {
      summary += ' - Good code quality with room for improvement';
    } else if (percentage >= 70) {
      summary += ' - Acceptable quality, several improvements needed';
    } else if (percentage >= 60) {
      summary += ' - Below average quality, significant issues detected';
    } else {
      summary += ' - Poor quality, major improvements required';
    }

    summary += ` (${categoryCount} categories analyzed)`;

    return summary;
  }
}