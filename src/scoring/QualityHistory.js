/**
 * QualityHistory - Tracks quality score progression over time
 * 
 * PHASE 2: Real-time quality monitoring with historical data
 * - Score trending and progression tracking  
 * - Category-specific improvement metrics
 * - Recommendation effectiveness measurement
 * - Performance benchmarking against previous runs
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export class QualityHistory {
  constructor(config = {}) {
    this.config = config;
    this.projectRoot = config.projectRoot || process.cwd();
    this.historyFile = path.join(this.projectRoot, '.codefortify', 'quality-history.json');
    this.maxEntries = config.maxHistoryEntries || 100;
  }

  /**
   * Record a quality score measurement
   * @param {Object} results - Complete scoring results 
   * @param {Object} metadata - Additional context (git hash, user, etc.)
   */
  async recordQualityScore(results, metadata = {}) {
    try {
      const history = await this.loadHistory();
      
      const entry = {
        timestamp: new Date().toISOString(),
        overallScore: results.overall?.score || 0,
        overallGrade: results.overall?.grade || 'F',
        categories: this.extractCategoryScores(results.categories || {}),
        metadata: {
          projectType: results.metadata?.projectType,
          version: results.metadata?.version,
          gitHash: await this.getCurrentGitHash(),
          ...metadata
        },
        improvements: await this.calculateImprovements(history, results),
        trends: await this.calculateTrends(history, results)
      };

      history.entries.unshift(entry);
      
      // Limit history size
      if (history.entries.length > this.maxEntries) {
        history.entries = history.entries.slice(0, this.maxEntries);
      }
      
      history.lastUpdated = entry.timestamp;
      history.totalRuns = history.entries.length;
      
      await this.saveHistory(history);
      return entry;
      
    } catch (error) {
      console.warn('Failed to record quality history:', error.message);
      return null;
    }
  }

  /**
   * Get quality progression data for charts and analysis
   */
  async getQualityProgression(options = {}) {
    try {
      const history = await this.loadHistory();
      const { 
        limit = 20, 
        category = null, 
        timeRange = null 
      } = options;

      let entries = history.entries.slice(0, limit);
      
      // Filter by time range if specified
      if (timeRange) {
        const cutoffDate = new Date(Date.now() - timeRange);
        entries = entries.filter(entry => 
          new Date(entry.timestamp) > cutoffDate
        );
      }
      
      // Reverse for chronological order
      entries = entries.reverse();
      
      const progression = {
        timestamps: entries.map(e => e.timestamp),
        overallScores: entries.map(e => e.overallScore),
        grades: entries.map(e => e.overallGrade),
        categoryData: {}
      };
      
      // Add category-specific progression
      if (entries.length > 0) {
        const categories = Object.keys(entries[0].categories || {});
        
        for (const cat of categories) {
          if (!category || category === cat) {
            progression.categoryData[cat] = {
              scores: entries.map(e => e.categories[cat]?.score || 0),
              percentages: entries.map(e => e.categories[cat]?.percentage || 0),
              grades: entries.map(e => e.categories[cat]?.grade || 'F')
            };
          }
        }
      }
      
      return progression;
      
    } catch (error) {
      return {
        timestamps: [],
        overallScores: [],
        grades: [],
        categoryData: {}
      };
    }
  }

  /**
   * Get quality improvement analytics
   */
  async getQualityAnalytics(options = {}) {
    try {
      const history = await this.loadHistory();
      const { timeRange = 30 * 24 * 60 * 60 * 1000 } = options; // 30 days default
      
      if (history.entries.length < 2) {
        return this.getEmptyAnalytics();
      }
      
      const cutoffDate = new Date(Date.now() - timeRange);
      const recentEntries = history.entries.filter(entry => 
        new Date(entry.timestamp) > cutoffDate
      );
      
      if (recentEntries.length < 2) {
        return this.getEmptyAnalytics();
      }
      
      const latest = recentEntries[0];
      const earliest = recentEntries[recentEntries.length - 1];
      
      return {
        timeRange: {
          start: earliest.timestamp,
          end: latest.timestamp,
          days: Math.ceil((new Date(latest.timestamp) - new Date(earliest.timestamp)) / (1000 * 60 * 60 * 24))
        },
        overallProgress: {
          startScore: earliest.overallScore,
          endScore: latest.overallScore,
          change: latest.overallScore - earliest.overallScore,
          percentageChange: earliest.overallScore > 0 
            ? ((latest.overallScore - earliest.overallScore) / earliest.overallScore) * 100 
            : 0,
          gradeChange: {
            from: earliest.overallGrade,
            to: latest.overallGrade,
            improved: this.getGradeNumeric(latest.overallGrade) > this.getGradeNumeric(earliest.overallGrade)
          }
        },
        categoryProgress: this.analyzeCategoryProgress(recentEntries),
        velocity: this.calculateImprovementVelocity(recentEntries),
        streaks: this.analyzeStreaks(recentEntries),
        milestones: this.identifyMilestones(history.entries),
        recommendations: this.generateHistoricalRecommendations(recentEntries)
      };
      
    } catch (error) {
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Get performance compared to similar projects  
   */
  async getBenchmarkData() {
    try {
      const history = await this.loadHistory();
      if (history.entries.length === 0) {
        return null;
      }
      
      const latest = history.entries[0];
      
      // Industry benchmarks (approximate)
      const benchmarks = {
        'react-webapp': { typical: 72, good: 82, excellent: 92 },
        'vue-webapp': { typical: 74, good: 84, excellent: 93 },
        'node-api': { typical: 70, good: 80, excellent: 90 },
        'cli-tool': { typical: 68, good: 78, excellent: 88 },
        'javascript': { typical: 66, good: 76, excellent: 86 }
      };
      
      const projectType = latest.metadata?.projectType || 'javascript';
      const benchmark = benchmarks[projectType] || benchmarks.javascript;
      const currentScore = latest.overallScore;
      
      let performance = 'below-average';
      if (currentScore >= benchmark.excellent) {
        performance = 'excellent';
      } else if (currentScore >= benchmark.good) {
        performance = 'good';
      } else if (currentScore >= benchmark.typical) {
        performance = 'typical';
      }
      
      return {
        projectType,
        currentScore,
        benchmarks: benchmark,
        performance,
        percentile: this.calculatePercentile(currentScore, benchmark),
        recommendations: this.getBenchmarkRecommendations(currentScore, benchmark, performance)
      };
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Load quality history from disk
   */
  async loadHistory() {
    try {
      if (!existsSync(this.historyFile)) {
        return this.createEmptyHistory();
      }
      
      const data = await fs.readFile(this.historyFile, 'utf-8');
      const history = JSON.parse(data);
      
      // Ensure valid structure
      if (!history.entries || !Array.isArray(history.entries)) {
        return this.createEmptyHistory();
      }
      
      return history;
      
    } catch (error) {
      return this.createEmptyHistory();
    }
  }

  /**
   * Save quality history to disk
   */
  async saveHistory(history) {
    try {
      // Ensure .codefortify directory exists
      const dirPath = path.dirname(this.historyFile);
      await fs.mkdir(dirPath, { recursive: true });
      
      await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
      return true;
      
    } catch (error) {
      console.warn('Failed to save quality history:', error.message);
      return false;
    }
  }

  /**
   * Extract category scores for storage
   */
  extractCategoryScores(categories) {
    const categoryScores = {};
    
    for (const [key, result] of Object.entries(categories)) {
      if (result && typeof result.score === 'number') {
        categoryScores[key] = {
          score: result.score,
          maxScore: result.maxScore || 20,
          percentage: Math.round((result.score / (result.maxScore || 20)) * 100),
          grade: result.grade || 'F'
        };
      }
    }
    
    return categoryScores;
  }

  /**
   * Calculate improvements since last run
   */
  async calculateImprovements(history, currentResults) {
    if (history.entries.length === 0) {
      return { isFirstRun: true };
    }
    
    const previous = history.entries[0];
    const current = currentResults.overall?.score || 0;
    const previousScore = previous.overallScore || 0;
    
    return {
      isFirstRun: false,
      scoreChange: current - previousScore,
      percentageChange: previousScore > 0 ? ((current - previousScore) / previousScore) * 100 : 0,
      gradeChange: {
        from: previous.overallGrade,
        to: currentResults.overall?.grade || 'F'
      },
      timeSinceLastRun: Date.now() - new Date(previous.timestamp).getTime(),
      isImprovement: current > previousScore,
      significantChange: Math.abs(current - previousScore) >= 5 // 5+ point change is significant
    };
  }

  /**
   * Calculate quality trends
   */
  async calculateTrends(history, currentResults) {
    if (history.entries.length < 3) {
      return { insufficient_data: true };
    }
    
    const recent = history.entries.slice(0, 5); // Last 5 runs
    const scores = [currentResults.overall?.score || 0, ...recent.map(e => e.overallScore)];
    
    // Simple linear trend calculation
    const trend = this.calculateLinearTrend(scores);
    
    return {
      direction: trend > 0.5 ? 'improving' : trend < -0.5 ? 'declining' : 'stable',
      slope: trend,
      consistency: this.calculateConsistency(scores),
      momentum: this.calculateMomentum(scores)
    };
  }

  /**
   * Analyze category-specific progress
   */
  analyzeCategoryProgress(entries) {
    const categoryProgress = {};
    const latest = entries[0];
    const earliest = entries[entries.length - 1];
    
    if (!latest.categories || !earliest.categories) {
      return categoryProgress;
    }
    
    for (const [category, latestData] of Object.entries(latest.categories)) {
      const earliestData = earliest.categories[category];
      
      if (earliestData) {
        categoryProgress[category] = {
          startScore: earliestData.score,
          endScore: latestData.score,
          change: latestData.score - earliestData.score,
          percentageChange: earliestData.score > 0 
            ? ((latestData.score - earliestData.score) / earliestData.score) * 100 
            : 0,
          gradeChange: {
            from: earliestData.grade,
            to: latestData.grade
          }
        };
      }
    }
    
    return categoryProgress;
  }

  /**
   * Calculate improvement velocity (points per day)
   */
  calculateImprovementVelocity(entries) {
    if (entries.length < 2) {
      return 0;
    }
    
    const latest = entries[0];
    const earliest = entries[entries.length - 1];
    const scoreChange = latest.overallScore - earliest.overallScore;
    const timeChange = new Date(latest.timestamp) - new Date(earliest.timestamp);
    const daysChange = timeChange / (1000 * 60 * 60 * 24);
    
    return daysChange > 0 ? scoreChange / daysChange : 0;
  }

  /**
   * Analyze quality streaks (consecutive improvements/declines)
   */
  analyzeStreaks(entries) {
    if (entries.length < 3) {
      return { improvement: 0, decline: 0 };
    }
    
    let improvementStreak = 0;
    let declineStreak = 0;
    
    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i].overallScore;
      const previous = entries[i + 1].overallScore;
      
      if (current > previous) {
        improvementStreak++;
        declineStreak = 0;
      } else if (current < previous) {
        declineStreak++;
        improvementStreak = 0;
      } else {
        break; // No change breaks streak
      }
    }
    
    return { improvement: improvementStreak, decline: declineStreak };
  }

  /**
   * Identify quality milestones reached
   */
  identifyMilestones(entries) {
    const milestones = [];
    const thresholds = [60, 70, 80, 90, 95];
    
    for (const threshold of thresholds) {
      const firstHit = entries.find(entry => entry.overallScore >= threshold);
      if (firstHit) {
        milestones.push({
          score: threshold,
          achievedAt: firstHit.timestamp,
          grade: firstHit.overallGrade
        });
      }
    }
    
    return milestones.reverse(); // Chronological order
  }

  /**
   * Generate recommendations based on historical patterns
   */
  generateHistoricalRecommendations(entries) {
    const recommendations = [];
    
    if (entries.length < 2) {
      return recommendations;
    }
    
    const latest = entries[0];
    const previous = entries[1];
    
    // Stagnation detection
    const recentScores = entries.slice(0, 3).map(e => e.overallScore);
    const isStagnant = Math.max(...recentScores) - Math.min(...recentScores) < 2;
    
    if (isStagnant) {
      recommendations.push({
        type: 'stagnation',
        priority: 'medium',
        message: 'Quality scores have plateaued. Consider focusing on a specific category for breakthrough.',
        action: 'target_lowest_category'
      });
    }
    
    // Regression detection
    if (latest.overallScore < previous.overallScore - 5) {
      recommendations.push({
        type: 'regression',
        priority: 'high',
        message: 'Significant quality regression detected. Review recent changes.',
        action: 'investigate_regression'
      });
    }
    
    // Momentum detection
    const improvementStreak = this.analyzeStreaks(entries).improvement;
    if (improvementStreak >= 3) {
      recommendations.push({
        type: 'momentum',
        priority: 'low',
        message: `Great momentum! ${improvementStreak} consecutive improvements. Keep it up!`,
        action: 'maintain_momentum'
      });
    }
    
    return recommendations;
  }

  // Helper methods
  createEmptyHistory() {
    return {
      version: '1.0.0',
      entries: [],
      lastUpdated: new Date().toISOString(),
      totalRuns: 0
    };
  }

  getEmptyAnalytics() {
    return {
      timeRange: { days: 0 },
      overallProgress: { change: 0, percentageChange: 0 },
      categoryProgress: {},
      velocity: 0,
      streaks: { improvement: 0, decline: 0 },
      milestones: [],
      recommendations: []
    };
  }

  calculateLinearTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  calculateConsistency(values) {
    if (values.length < 2) return 1;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? Math.max(0, 1 - (stdDev / mean)) : 0;
  }

  calculateMomentum(values) {
    if (values.length < 3) return 0;
    
    const recent = values.slice(0, Math.floor(values.length / 2));
    const older = values.slice(Math.floor(values.length / 2));
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  getGradeNumeric(grade) {
    const gradeMap = { 'A+': 97, 'A': 93, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80, 'C+': 77, 'C': 73, 'C-': 70, 'D+': 67, 'D': 65, 'D-': 60, 'F': 0 };
    return gradeMap[grade] || 0;
  }

  calculatePercentile(score, benchmark) {
    const { typical, good, excellent } = benchmark;
    
    if (score >= excellent) return 95;
    if (score >= good) return 75;
    if (score >= typical) return 50;
    return Math.max(10, (score / typical) * 50);
  }

  getBenchmarkRecommendations(score, benchmark, performance) {
    const recommendations = [];
    
    if (performance === 'below-average') {
      recommendations.push('Focus on fundamental improvements to reach typical industry standards');
    } else if (performance === 'typical') {
      recommendations.push('Good foundation! Target the next level with advanced practices');
    } else if (performance === 'good') {
      recommendations.push('Excellent work! Polish the details to achieve industry excellence');
    } else {
      recommendations.push('Outstanding quality! Maintain standards and share best practices');
    }
    
    return recommendations;
  }

  async getCurrentGitHash() {
    try {
      const { execSync } = await import('child_process');
      return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    } catch {
      return null;
    }
  }
}