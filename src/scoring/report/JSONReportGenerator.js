/**
 * JSON Report Generator
 *
 * Generates structured JSON reports for programmatic analysis and CI/CD integration
 */

export class JSONReportGenerator {
  /**
   * Generate JSON report
   * @param {Object} results - Scoring results
   * @returns {Promise<string>} JSON string
   */
  async generate(results) {
    // Create a clean copy without circular references
    const cleanResults = {
      metadata: results.metadata || {},
      overall: results.overall || {},
      categories: {},
      recommendations: results.recommendations || [],
      timestamp: new Date().toISOString()
    };

    // Clean category data
    if (results.categories) {
      for (const [key, category] of Object.entries(results.categories)) {
        cleanResults.categories[key] = {
          categoryName: category.categoryName,
          score: category.score,
          maxScore: category.maxScore,
          percentage: Math.round((category.score / category.maxScore) * 100),
          grade: category.grade,
          issues: category.issues || [],
          details: category.details || {}
        };
      }
    }

    // Add summary statistics
    cleanResults.summary = {
      totalScore: cleanResults.overall.score,
      totalMaxScore: cleanResults.overall.maxScore,
      percentage: cleanResults.overall.percentage,
      grade: cleanResults.overall.grade,
      categoryCount: Object.keys(cleanResults.categories).length,
      totalIssues: Object.values(cleanResults.categories)
        .reduce((sum, cat) => sum + (cat.issues?.length || 0), 0),
      recommendationCount: cleanResults.recommendations.length
    };

    return JSON.stringify(cleanResults, null, 2);
  }
}