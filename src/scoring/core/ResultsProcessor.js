/**
 * Results Processor
 *
 * Handles processing and aggregation of scoring results from multiple analyzers
 */

export class ResultsProcessor {
  constructor(config = {}) {
    this.config = config;
  }  /**
   * Initialize the component
   * @param {any} projectMetadata
   * @returns {any} The operation result
   */
  /**
   * Initialize the component
   * @param {any} projectMetadata
   * @returns {any} The operation result
   */


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
  }  /**
   * Analyzes the provided data
   * @param {any} analyzerResults
   * @param {any} results
   * @returns {any} The operation result
   */
  /**
   * Analyzes the provided data
   * @param {any} analyzerResults
   * @param {any} results
   * @returns {any} The operation result
   */


  processAnalyzerResults(analyzerResults, results) {
    // Process individual analyzer results
    for (const [category, result] of Object.entries(analyzerResults)) {
      results.categories[category] = this.processAnalyzerResult(result);
    }

    // Calculate overall score
    this.calculateOverallScore(results);

    return results;
  }  /**
   * Analyzes the provided data
   * @param {any} result
   * @returns {any} The operation result
   */
  /**
   * Analyzes the provided data
   * @param {any} result
   * @returns {any} The operation result
   */


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

    // Calculate percentage and grade    /**
   * Performs the specified operation
   * @param {any} processed.maxScore > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} processed.maxScore > 0
   * @returns {any} The operation result
   */

    if (processed.maxScore > 0) {
      processed.percentage = Math.round((processed.score / processed.maxScore) * 100);
      processed.grade = this.calculateGrade(processed.percentage / 100);
    }

    // Handle errors    /**
   * Performs the specified operation
   * @param {any} result.error
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.error
   * @returns {any} The operation result
   */

    if (result.error) {
      processed.error = result.error;
      processed.score = 0;
      processed.percentage = 0;
      processed.grade = 'F';
      processed.issues = processed.issues || [];
      processed.issues.push(`Analysis failed: ${result.error}`);
    }

    return processed;
  }  /**
   * Calculates the result
   * @param {any} results
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} results
   * @returns {number} The calculated result
   */


  calculateOverallScore(results) {
    let totalScore = 0;
    let totalMaxScore = 0;
    let hasErrors = false;

    // Sum up category scores
    for (const category of Object.values(results.categories)) {
      totalScore += category.score;
      totalMaxScore += category.maxScore;      /**
   * Performs the specified operation
   * @param {any} category.error
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} category.error
   * @returns {any} The operation result
   */


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
  }  /**
   * Calculates the result
   * @param {any} percentage
   * @returns {number} The calculated result
   */
  /**
   * Calculates the result
   * @param {any} percentage
   * @returns {number} The calculated result
   */


  calculateGrade(percentage) {  /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.98) {return 'A+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.93) {return 'A';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.90) {return 'A-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.87) {return 'B+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.83) {return 'B';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.80) {return 'B-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.77) {return 'C+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.73) {return 'C';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.70) {return 'C-';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.67) {return 'D+';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.65) {return 'D';}    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 0.60) {return 'D-';}
    return 'F';
  }  /**
   * Retrieves data
   * @param {any} score
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} score
   * @returns {string} The retrieved data
   */


  getPerformanceLevel(score) {  /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 90) {return 'excellent';}    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 75) {return 'good';}    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > - Optional parameter
   * @returns {any} The operation result
   */

    if (score >= 60) {return 'warning';}
    return 'poor';
  }  /**
   * Retrieves data
   * @param {any} value
   * @param {any} thresholds
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} value
   * @param {any} thresholds
   * @returns {string} The retrieved data
   */


  getComplexityScore(value, thresholds) {
    // Sort thresholds by threshold value (ascending)
    const sortedThresholds = [...thresholds].sort((a, b) => a.threshold - b.threshold);    /**
   * Performs the specified operation
   * @param {any} let i - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} let i - Optional parameter
   * @returns {any} The operation result
   */


    for (let i = 0; i < sortedThresholds.length; i++) {      /**
   * Performs the specified operation
   * @param {any} value < - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} value < - Optional parameter
   * @returns {any} The operation result
   */

      if (value <= sortedThresholds[i].threshold) {
        return sortedThresholds[i].score;
      }
    }

    return 'very_high'; // If above all thresholds
  }  /**
   * Performs the specified operation
   * @param {any} results
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} results
   * @returns {any} The operation result
   */


  aggregateRecommendations(results) {
    const allRecommendations = [];

    // Collect recommendations from all categories
    for (const category of Object.values(results.categories)) {      /**
   * Performs the specified operation
   * @param {any} category.recommendations
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} category.recommendations
   * @returns {any} The operation result
   */

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
  }  /**
   * Adds an item
   * @param {any} results
   * @param {any} systemInfo
   * @returns {any} The operation result
   */
  /**
   * Adds an item
   * @param {any} results
   * @param {any} systemInfo
   * @returns {any} The operation result
   */


  addSystemInfo(results, systemInfo) {
    results.systemInfo = {
      ...systemInfo,
      analyzedAt: new Date().toISOString()
    };

    return results;
  }  /**
   * Validates input data
   * @param {any} results
   * @returns {any} The operation result
   */
  /**
   * Validates input data
   * @param {any} results
   * @returns {any} The operation result
   */


  validateResults(results) {
    const errors = [];

    // Validate structure    /**
   * Performs the specified operation
   * @param {any} !results.overall
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !results.overall
   * @returns {any} The operation result
   */

    if (!results.overall) {
      errors.push('Missing overall results');
    }

    if (!results.categories || Object.keys(results.categories).length === 0) {
      errors.push('Missing category results');
    }    /**
   * Performs the specified operation
   * @param {any} !results.metadata
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !results.metadata
   * @returns {any} The operation result
   */


    if (!results.metadata) {
      errors.push('Missing metadata');
    }

    // Validate score consistency    /**
   * Performs the specified operation
   * @param {any} results.overall && results.categories
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} results.overall && results.categories
   * @returns {any} The operation result
   */

    if (results.overall && results.categories) {
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
  }  /**
   * Formats the data
   * @param {any} results
   * @param {any} format - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Formats the data
   * @param {any} results
   * @param {any} format - Optional parameter
   * @returns {any} The operation result
   */


  formatResultsForOutput(results, format = 'console') {  /**
   * Performs the specified operation
   * @param {any} format
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} format
   * @returns {any} The operation result
   */

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
  }  /**
   * Formats the data
   * @param {any} results
   * @returns {any} The operation result
   */
  /**
   * Formats the data
   * @param {any} results
   * @returns {any} The operation result
   */


  formatConsoleOutput(results) {
    const output = [];

    output.push(`\n📊 Overall Score: ${results.overall.score}/${results.overall.maxScore} (${results.overall.percentage}%) ${results.overall.grade}`);
    output.push('─'.repeat(50));

    for (const [key, category] of Object.entries(results.categories)) {
      output.push(`${category.categoryName}: ${category.score}/${category.maxScore} (${category.grade})`);      /**
   * Performs the specified operation
   * @param {boolean} category.issues?.length > 0
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} category.issues?.length > 0
   * @returns {boolean} True if successful, false otherwise
   */


      if (category.issues?.length > 0) {
        category.issues.forEach(issue => {
          output.push(`  ⚠ ${issue}`);
        });
      }
    }

    return output.join('\n');
  }  /**
   * Formats the data
   * @param {any} results
   * @returns {any} The operation result
   */
  /**
   * Formats the data
   * @param {any} results
   * @returns {any} The operation result
   */


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