/**
 * ConvergenceDetector - Detects when the improvement loop has converged
 */

export class ConvergenceDetector {
  constructor(config) {
    this.config = {
      convergenceThreshold: config.convergenceThreshold || 2,
      minImprovement: config.minImprovement || 0.1,
      ...config
    };
  }

  /**
   * Check if the loop has converged based on score history
   * @param {Array} scoreHistory - History of scores from iterations
   * @returns {boolean} True if converged
   */
  hasConverged(scoreHistory) {
    if (scoreHistory.length < this.config.convergenceThreshold) {
      return false;
    }

    // Get the last N scores
    const recentScores = scoreHistory.slice(-this.config.convergenceThreshold);
    
    // Check if all recent scores are within minImprovement of each other
    const maxScore = Math.max(...recentScores);
    const minScore = Math.min(...recentScores);
    const improvement = maxScore - minScore;
    
    return improvement < this.config.minImprovement;
  }

  /**
   * Get convergence analysis
   * @param {Array} scoreHistory - History of scores from iterations
   * @returns {Object} Convergence analysis
   */
  getConvergenceAnalysis(scoreHistory) {
    if (scoreHistory.length < 2) {
      return {
        converged: false,
        reason: 'Insufficient data',
        improvement: 0,
        trend: 'unknown'
      };
    }

    const recentScores = scoreHistory.slice(-this.config.convergenceThreshold);
    const maxScore = Math.max(...recentScores);
    const minScore = Math.min(...recentScores);
    const improvement = maxScore - minScore;
    
    // Calculate trend
    const firstHalf = scoreHistory.slice(0, Math.floor(scoreHistory.length / 2));
    const secondHalf = scoreHistory.slice(Math.floor(scoreHistory.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (secondAvg > firstAvg + this.config.minImprovement) {
      trend = 'improving';
    } else if (secondAvg < firstAvg - this.config.minImprovement) {
      trend = 'declining';
    }

    return {
      converged: this.hasConverged(scoreHistory),
      reason: this.hasConverged(scoreHistory) ? 'Score improvement below threshold' : 'Still improving',
      improvement: improvement,
      trend: trend,
      recentScores: recentScores,
      averageImprovement: this.calculateAverageImprovement(scoreHistory)
    };
  }

  /**
   * Calculate average improvement per iteration
   * @param {Array} scoreHistory - History of scores from iterations
   * @returns {number} Average improvement per iteration
   */
  calculateAverageImprovement(scoreHistory) {
    if (scoreHistory.length < 2) {
      return 0;
    }

    let totalImprovement = 0;
    for (let i = 1; i < scoreHistory.length; i++) {
      totalImprovement += scoreHistory[i] - scoreHistory[i - 1];
    }

    return totalImprovement / (scoreHistory.length - 1);
  }
}
