/**
 * HTML Report Generator
 *
 * Generates interactive HTML dashboard reports with charts and theme support
 */

export class HTMLReportGenerator {
  constructor() {
    this.chartColors = {
      excellent: '#10b981',
      good: '#3b82f6',
      warning: '#f59e0b',
      poor: '#ef4444'
    };
  }

  /**
   * Generate complete HTML report
   * @param {Object} results - Scoring results
   * @returns {Promise<string>} HTML content
   */
  async generate(results) {
    const { overall, categories, recommendations, metadata } = results;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context7 Quality Dashboard - ${metadata.projectName}</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    ${this.generateStyles()}
</head>
<body data-theme="dark">
    <div class="dashboard">
        ${this.generateHeader(metadata)}
        ${this.generateMainContent(overall, categories, recommendations)}
    </div>
    ${this.generateScripts(categories)}
</body>
</html>`;
  }

  generateStyles() {
    return `<style>
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-tertiary: #334155;
            --text-primary: #f1f5f9;
            --text-secondary: #cbd5e1;
            --text-tertiary: #94a3b8;
            --accent: #3b82f6;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --border: #334155;
            --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            --radius: 12px;
            --transition: all 0.3s ease;
        }

        [data-theme="light"] {
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --bg-tertiary: #f1f5f9;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --text-tertiary: #64748b;
            --border: #e2e8f0;
            --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            transition: var(--transition);
        }

        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: var(--bg-secondary);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
        }

        .header-content h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--accent), var(--success));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header-content p {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        .header-actions {
            display: flex;
            gap: 1rem;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: none;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            cursor: pointer;
            transition: var(--transition);
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn:hover {
            background: var(--accent);
            transform: translateY(-2px);
            box-shadow: var(--shadow);
        }

        .search-container {
            position: relative;
        }

        .search-container input {
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--bg-tertiary);
            color: var(--text-primary);
            min-width: 300px;
            transition: var(--transition);
        }

        .search-container i {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-tertiary);
        }

        .overview-section {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .score-card {
            background: var(--bg-secondary);
            border-radius: var(--radius);
            padding: 2rem;
            text-align: center;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
        }

        .score-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--accent), var(--success));
        }

        .overall-score {
            font-size: 4rem;
            font-weight: 700;
            margin: 1rem 0;
            position: relative;
        }

        .score-max {
            font-size: 2rem;
            color: var(--text-tertiary);
        }

        .score-grade {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 1rem;
        }

        .charts-container {
            background: var(--bg-secondary);
            border-radius: var(--radius);
            padding: 2rem;
            box-shadow: var(--shadow);
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        .chart-wrapper {
            position: relative;
            height: 300px;
        }

        .categories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .category-card {
            background: var(--bg-secondary);
            border-radius: var(--radius);
            padding: 1.5rem;
            box-shadow: var(--shadow);
            transition: var(--transition);
            cursor: pointer;
        }

        .category-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .category-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .category-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }

        .score-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .score-number {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .score-max {
            font-size: 1rem;
            color: var(--text-tertiary);
        }

        .progress-bar {
            height: 8px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            overflow: hidden;
            margin: 1rem 0;
        }

        .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 1s ease;
        }

        .category-details {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }

        .category-card.expanded .category-details {
            max-height: 500px;
        }

        .issues-list {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
        }

        .issue-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0;
            color: var(--text-secondary);
        }

        .issue-item i {
            color: var(--warning);
            font-size: 0.9rem;
        }

        .recommendations-section {
            background: var(--bg-secondary);
            border-radius: var(--radius);
            padding: 2rem;
            box-shadow: var(--shadow);
        }

        .recommendations-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .recommendations-header h2 {
            font-size: 1.8rem;
            font-weight: 600;
        }

        .recommendations-grid {
            display: grid;
            gap: 1rem;
        }

        .recommendation-card {
            background: var(--bg-tertiary);
            border-radius: 10px;
            padding: 1.5rem;
            display: flex;
            align-items: start;
            gap: 1rem;
            transition: var(--transition);
        }

        .recommendation-card:hover {
            transform: translateX(4px);
        }

        .recommendation-impact {
            min-width: 60px;
            padding: 0.5rem;
            border-radius: 8px;
            text-align: center;
            font-weight: 700;
            font-size: 0.9rem;
        }

        .recommendation-content h3 {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }

        .recommendation-content p {
            color: var(--text-secondary);
            line-height: 1.5;
        }

        .grade-excellent { background: var(--success); color: white; }
        .grade-good { background: var(--accent); color: white; }
        .grade-warning { background: var(--warning); color: white; }
        .grade-poor { background: var(--error); color: white; }

        @media (max-width: 768px) {
            .overview-section {
                grid-template-columns: 1fr;
            }
            .charts-container {
                grid-template-columns: 1fr;
            }
            .categories-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>`;
  }

  generateHeader(metadata) {
    return `
    <header>
        <div class="header-content">
            <h1>Context7 Quality Dashboard</h1>
            <p>Project: ${metadata.projectName} | Type: ${metadata.projectType} | Version: ${metadata.version || '1.0.0'}</p>
        </div>
        <div class="header-actions">
            <div class="search-container">
                <i class="fas fa-search"></i>
                <input type="text" id="searchInput" placeholder="Search report content...">
            </div>
            <button class="btn" id="theme-toggle">
                <i class="fas fa-moon"></i>
                <span>Theme</span>
            </button>
            <button class="btn" onclick="window.print()">
                <i class="fas fa-print"></i>
                <span>Print</span>
            </button>
        </div>
    </header>`;
  }

  generateMainContent(overall, categories, recommendations) {
    return `
    <div class="overview-section" id="overview">
        ${this.generateScoreCard(overall)}
        ${this.generateCharts()}
    </div>
    
    <div class="categories-grid" id="categories">
        ${Object.entries(categories).map(([key, category]) =>
    this.generateCategoryCard(category)
  ).join('')}
    </div>
    
    ${recommendations ? this.generateRecommendations(recommendations) : ''}`;
  }

  generateScoreCard(overall) {
    const gradeClass = this.getGradeClass(overall.percentage);

    return `
    <div class="score-card">
        <h2>Overall Score</h2>
        <div class="overall-score">
            ${Math.round(overall.score)}
            <span class="score-max">/${overall.maxScore}</span>
        </div>
        <div class="score-grade ${gradeClass}">${overall.grade}</div>
        <p style="margin-top: 1rem; color: var(--text-secondary);">
            ${this.getScoreDescription(overall.percentage)}
        </p>
    </div>`;
  }

  generateCharts() {
    return `
    <div class="charts-container">
        <div class="chart-wrapper">
            <canvas id="categoryChart"></canvas>
        </div>
        <div class="chart-wrapper">
            <canvas id="radarChart"></canvas>
        </div>
    </div>`;
  }

  generateCategoryCard(category) {
    const percentage = Math.round((category.score / category.maxScore) * 100);
    const gradeClass = this.getGradeClass(percentage);
    const icon = this.getCategoryIcon(category.categoryName);
    const issues = category.issues || [];

    return `
    <div class="category-card" onclick="toggleCategory(this)">
        <div class="category-header">
            <div class="category-title">
                <div class="category-icon ${gradeClass}">
                    <i class="${icon}"></i>
                </div>
                <span>${category.categoryName}</span>
            </div>
            <div class="score-badge">
                <div class="score-number">${category.score.toFixed(1)}<span class="score-max">/${category.maxScore}</span></div>
            </div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill ${gradeClass}" style="width: ${percentage}%"></div>
        </div>
        <div class="grade-badge" style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.9rem; margin-top: 0.5rem;" class="${gradeClass}">
            ${category.grade} (${percentage}%)
        </div>
        ${issues.length > 0 ? `
        <div class="category-details">
            <div class="issues-list">
                <strong style="color: var(--text-secondary);">Issues Found (${issues.length})</strong>
                ${issues.map(issue => `
                    <div class="issue-item">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>${issue}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>`;
  }

  generateRecommendations(recommendations) {
    const priorityRecs = recommendations
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 10);

    return `
    <div class="recommendations-section">
        <div class="recommendations-header">
            <i class="fas fa-lightbulb" style="font-size: 2rem; color: var(--warning);"></i>
            <h2>Priority Recommendations</h2>
        </div>
        <div class="recommendations-grid">
            ${priorityRecs.map((rec, index) => `
                <div class="recommendation-card">
                    <div class="recommendation-impact ${this.getImpactClass(rec.impact)}">
                        +${rec.impact}pts
                    </div>
                    <div class="recommendation-content">
                        <h3>${index + 1}. ${rec.suggestion}</h3>
                        <p>${rec.description}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
  }

  generateScripts(categories) {
    const categoryData = Object.entries(categories).map(([key, cat]) => ({
      name: cat.categoryName,
      score: cat.score,
      maxScore: cat.maxScore,
      percentage: Math.round((cat.score / cat.maxScore) * 100)
    }));

    return `
    <script>
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            const icon = themeToggle.querySelector('i');
            icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        body.setAttribute('data-theme', savedTheme);
        const icon = themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.category-card, .recommendation-card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
        
        // Toggle category details
        function toggleCategory(card) {
            card.classList.toggle('expanded');
        }
        
        // Charts
        const categoryData = ${JSON.stringify(categoryData)};
        
        // Doughnut Chart
        const ctx1 = document.getElementById('categoryChart').getContext('2d');
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(c => c.name),
                datasets: [{
                    data: categoryData.map(c => c.score),
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#ec4899', '#14b8a6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
                            padding: 15
                        }
                    }
                }
            }
        });
        
        // Radar Chart
        const ctx2 = document.getElementById('radarChart').getContext('2d');
        new Chart(ctx2, {
            type: 'radar',
            data: {
                labels: categoryData.map(c => c.name.split(' ')[0]),
                datasets: [{
                    label: 'Score %',
                    data: categoryData.map(c => c.percentage),
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-tertiary')
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border')
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    </script>`;
  }

  getGradeClass(percentage) {
    if (percentage >= 90) {return 'grade-excellent';}
    if (percentage >= 70) {return 'grade-good';}
    if (percentage >= 50) {return 'grade-warning';}
    return 'grade-poor';
  }

  getImpactClass(impact) {
    if (impact >= 5) {return 'grade-excellent';}
    if (impact >= 3) {return 'grade-good';}
    if (impact >= 2) {return 'grade-warning';}
    return 'grade-poor';
  }

  getCategoryIcon(categoryName) {
    const icons = {
      'Code Structure & Architecture': 'fas fa-project-diagram',
      'Code Quality & Maintainability': 'fas fa-code',
      'Performance & Optimization': 'fas fa-tachometer-alt',
      'Testing & Documentation': 'fas fa-vial',
      'Security & Error Handling': 'fas fa-shield-alt',
      'Developer Experience': 'fas fa-laptop-code',
      'Completeness & Production Readiness': 'fas fa-rocket'
    };
    return icons[categoryName] || 'fas fa-chart-bar';
  }

  getScoreDescription(percentage) {
    if (percentage >= 95) {return 'Outstanding project quality! This codebase demonstrates excellence across all categories.';}
    if (percentage >= 85) {return 'Very good project quality with strong fundamentals and minor areas for improvement.';}
    if (percentage >= 70) {return 'Good quality with solid foundation. Some improvements recommended for production readiness.';}
    if (percentage >= 60) {return 'Acceptable quality but significant improvements needed in several areas.';}
    if (percentage >= 50) {return 'Below average quality. Major improvements required across multiple categories.';}
    return 'Poor quality. Significant refactoring and improvements needed before production use.';
  }
}