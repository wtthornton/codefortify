/**
 * Results Processor
 *
 * Handles processing and aggregation of scoring results from multiple analyzers
 */

export class ResultsProcessor {
  constructor(config = {}) {
    this.config = config;
  }

  initializeResults(projectMetadata) {
    return {
      categories: {},
      overall: {
        score: 0,
        maxScore: 100,
        percentage: 0,
        grade: 'F',
        timestamp: new Date().toISOString(),
        hasErrors: false
      },
      metadata: {
        projectRoot: projectMetadata.projectRoot,
        projectType: projectMetadata.projectType,
        projectName: projectMetadata.projectName,
        version: projectMetadata.version || '1.0.0',
        analyzedAt: new Date().toISOString()
      },
      recommendations: [],
      systemInfo: {}
    };
  }

  processAnalyzerResults(analyzerResults, results) {
    // Process individual analyzer results
    for (const [category, result] of Object.entries(analyzerResults)) {
      results.categories[category] = this.processAnalyzerResult(result);
    }

    // Calculate overall score
    this.calculateOverallScore(results);

    return results;
  }

  processAnalyzerResult(result) {
    const processed = {
      categoryName: result.categoryName || 'Unknown Category',
      score: Math.max(0, Math.min(result.maxScore, result.score || 0)),
      maxScore: result.maxScore || 0,
      percentage: 0,
      grade: 'F',
      issues: result.issues || [],
      recommendations: result.recommendations || [],
      metrics: result.metrics || {},
      timestamp: new Date().toISOString()
    };

    // Calculate percentage and grade
    if (processed.maxScore > 0) {
      processed.percentage = Math.round((processed.score / processed.maxScore) * 100);
      processed.grade = this.calculateGrade(processed.percentage / 100);
    }

    // Handle errors
    if (result.error) {
      processed.error = result.error;
      processed.score = 0;
      processed.percentage = 0;
      processed.grade = 'F';
      processed.issues = processed.issues || [];
      processed.issues.push(`Analysis failed: ${result.error}`);
    }

    return processed;
  }

  calculateOverallScore(results) {
    let totalScore = 0;
    let totalMaxScore = 0;
    let hasErrors = false;

    // Sum up category scores
    for (const category of Object.values(results.categories)) {
      totalScore += category.score;
      totalMaxScore += category.maxScore;

      if (category.error) {
        hasErrors = true;
      }
    }

    // Update overall results
    results.overall.score = totalScore;
    results.overall.maxScore = totalMaxScore;
    results.overall.percentage = totalMaxScore > 0
      ? Math.round((totalScore / totalMaxScore) * 100)
      : 0;
    results.overall.grade = this.calculateGrade(totalScore / totalMaxScore);
    results.overall.hasErrors = hasErrors;
    results.overall.timestamp = new Date().toISOString();

    return results.overall;
  }

  calculateGrade(percentage) {
    if (percentage >= 0.98) {return 'A+';}
    if (percentage >= 0.93) {return 'A';}
    if (percentage >= 0.90) {return 'A-';}
    if (percentage >= 0.87) {return 'B+';}
    if (percentage >= 0.83) {return 'B';}
    if (percentage >= 0.80) {return 'B-';}
    if (percentage >= 0.77) {return 'C+';}
    if (percentage >= 0.73) {return 'C';}
    if (percentage >= 0.70) {return 'C-';}
    if (percentage >= 0.67) {return 'D+';}
    if (percentage >= 0.65) {return 'D';}
    if (percentage >= 0.60) {return 'D-';}
    return 'F';
  }

  getPerformanceLevel(score) {
    if (score >= 90) {return 'excellent';}
    if (score >= 75) {return 'good';}
    if (score >= 60) {return 'warning';}
    return 'poor';
  }

  getComplexityScore(value, thresholds) {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].threshold) {
        return thresholds[i].score;
      }
    }

    return 'very_high'; // If above all thresholds
  }

  aggregateRecommendations(results) {
    const allRecommendations = [];

    // Collect recommendations from all categories
    for (const category of Object.values(results.categories)) {
      if (category.recommendations) {
        allRecommendations.push(...category.recommendations);
      }
    }

    // Sort by impact (highest first)
    allRecommendations.sort((a, b) => (b.impact || 0) - (a.impact || 0));

    // Remove duplicates based on suggestion text
    const unique = allRecommendations.filter((rec, index, arr) =>
      arr.findIndex(r => r.suggestion === rec.suggestion) === index
    );

    results.recommendations = unique;
    return results.recommendations;
  }

  addSystemInfo(results, systemInfo) {
    results.systemInfo = {
      ...systemInfo,
      analyzedAt: new Date().toISOString()
    };

    return results;
  }

  validateResults(results) {
    const errors = [];

    // Validate structure
    if (!results.overall) {
      errors.push('Missing overall results');
    }

    if (!results.categories || Object.keys(results.categories).length === 0) {
      errors.push('Missing category results');
    }

    if (!results.metadata) {
      errors.push('Missing metadata');
    }

    // Validate score consistency
    if (results.overall) {
      const categorySum = Object.values(results.categories)
        .reduce((sum, cat) => sum + (cat.score || 0), 0);

      if (Math.abs(categorySum - results.overall.score) > 0.1) {
        errors.push('Score inconsistency between overall and categories');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  formatResultsForOutput(results, format = 'console') {
    switch (format) {
    case 'console':
      return this.formatConsoleOutput(results);
    case 'json':
      return JSON.stringify(results, null, 2);
    case 'summary':
      return this.formatSummaryOutput(results);
    default:
      return results;
    }
  }

  formatConsoleOutput(results) {
    const output = [];

    output.push(`\n📊 Overall Score: ${results.overall.score}/${results.overall.maxScore} (${results.overall.percentage}%) ${results.overall.grade}`);
    output.push('─'.repeat(50));

    for (const [key, category] of Object.entries(results.categories)) {
      output.push(`${category.categoryName}: ${category.score}/${category.maxScore} (${category.grade})`);

      if (category.issues?.length > 0) {
        category.issues.forEach(issue => {
          output.push(`  ⚠ ${issue}`);
        });
      }
    }

    return output.join('\n');
  }

  formatSummaryOutput(results) {
    return {
      score: results.overall.score,
      maxScore: results.overall.maxScore,
      percentage: results.overall.percentage,
      grade: results.overall.grade,
      categories: Object.keys(results.categories).length,
      hasErrors: results.overall.hasErrors,
      timestamp: results.overall.timestamp
    };
  }
}