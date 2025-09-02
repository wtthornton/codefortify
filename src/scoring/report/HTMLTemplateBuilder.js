/**
 * HTML Template Builder
 * Generates HTML structure for scoring reports without embedded CSS/JS
 */

export class HTMLTemplateBuilder {
  constructor() {
    this.components = {
      header: this.renderHeader.bind(this),
      scoreOverview: this.renderScoreOverview.bind(this),
      categoryGrid: this.renderCategoryGrid.bind(this),
      recommendations: this.renderRecommendations.bind(this),
      charts: this.renderCharts.bind(this),
      footer: this.renderFooter.bind(this)
    };
  }

  /**
   * Generate complete HTML template
   */
  generateTemplate(data, cssContent, jsContent) {
    const { projectName, overall, categories, recommendations, metadata } = data;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Report - ${projectName}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>${cssContent}</style>
</head>
<body>
    <div class="container">
        ${this.renderHeader(metadata)}
        ${this.renderScoreOverview(overall)}
        ${this.renderCategoryGrid(categories)}
        ${this.renderRecommendations(recommendations)}
        ${this.renderCharts(categories)}
        ${this.renderFooter()}
    </div>
    <script>${jsContent}</script>
</body>
</html>`;
  }

  renderHeader(metadata) {
    return `
        <header>
            <h1><span class="icon">🎯</span> CodeFortify Quality Report</h1>
            <div class="metadata">
                <p><strong>Project:</strong> ${metadata.projectName}</p>
                <p><strong>Generated:</strong> ${new Date(metadata.timestamp).toLocaleString()}</p>
                <p><strong>Analysis Time:</strong> ${metadata.analysisTime}ms</p>
            </div>
        </header>`;
  }

  renderScoreOverview(overall) {
    return `
        <section class="score-overview">
            <div class="overall-score">
                <div class="score-circle ${overall.grade.toLowerCase()}">
                    <span class="score">${overall.score}</span>
                    <span class="max-score">/${overall.maxScore}</span>
                    <span class="grade">${overall.grade}</span>
                </div>
                <div class="score-details">
                    <h2>Overall Quality Score</h2>
                    <p class="percentage">${Math.round(overall.percentage * 100)}%</p>
                    <p class="description">${this.getScoreDescription(overall.percentage)}</p>
                </div>
            </div>
        </section>`;
  }

  renderCategoryGrid(categories) {
    const categoryCards = Object.entries(categories).map(([key, category]) => `
        <div class="category-card ${category.grade.toLowerCase()}">
            <h3>${category.name}</h3>
            <div class="category-score">
                <span class="score">${category.score}/${category.maxScore}</span>
                <span class="grade">${category.grade}</span>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(category.score/category.maxScore)*100}%"></div>
                </div>
            </div>
            <div class="category-issues">
                ${category.issues.slice(0, 3).map(issue => `<span class="issue">⚠️ ${issue}</span>`).join('')}
                ${category.issues.length > 3 ? `<span class="more">+${category.issues.length - 3} more</span>` : ''}
            </div>
        </div>
    `).join('');

    return `
        <section class="categories">
            <h2>Category Breakdown</h2>
            <div class="category-grid">
                ${categoryCards}
            </div>
        </section>`;
  }

  renderRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return '<section class="recommendations"><h2>Recommendations</h2><p>No specific recommendations available.</p></section>';
    }

    const recList = recommendations.slice(0, 10).map(rec => `
        <div class="recommendation ${rec.priority}">
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
            <div class="recommendation-meta">
                <span class="priority">${rec.priority}</span>
                <span class="impact">Impact: ${rec.impact}/10</span>
                <span class="effort">Effort: ${rec.effort}</span>
            </div>
        </div>
    `).join('');

    return `
        <section class="recommendations">
            <h2>Top Recommendations</h2>
            <div class="recommendation-list">
                ${recList}
            </div>
        </section>`;
  }

  renderCharts(categories) {
    return `
        <section class="charts">
            <h2>Visual Analysis</h2>
            <div class="chart-grid">
                <div class="chart-container">
                    <canvas id="categoryChart"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>
        </section>`;
  }

  renderFooter() {
    return `
        <footer>
            <p>Generated by <strong>CodeFortify</strong> v1.1.0 | 
               <a href="https://github.com/context7-mcp/codefortify">GitHub</a></p>
            <p><em>Continuous code quality improvement through AI-powered analysis</em></p>
        </footer>`;
  }

  getScoreDescription(percentage) {
    if (percentage >= 0.9) {return 'Excellent code quality! 🎉';}
    if (percentage >= 0.8) {return 'Good quality with room for improvement';}
    if (percentage >= 0.7) {return 'Acceptable quality, focus on key areas';}
    if (percentage >= 0.6) {return 'Needs improvement in multiple areas';}
    return 'Significant quality issues require attention';
  }
}