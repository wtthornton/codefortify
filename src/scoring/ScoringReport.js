/**
 * ScoringReport - Generates formatted reports from scoring results
 *
 * Supports multiple output formats: console, JSON, HTML with interactive features
 * including charts, theme switching, and detailed category analysis.
 * 
 * @class ScoringReport
 * @example
 * const report = new ScoringReport({ projectType: 'react-webapp' });
 * const html = await report.generateHTML(scoringResults);
 * await report.openInBrowser('/path/to/report.html');
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ScoringReport {
  /**
   * Create a new ScoringReport instance
   * 
   * @param {Object} [config={}] - Report configuration
   * @param {string} [config.projectType] - Project type for customized reporting
   * @param {boolean} [config.verbose] - Enable verbose output
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Generate an interactive HTML report from scoring results
   * 
   * Creates a comprehensive dashboard with:
   * - Overall score visualization with doughnut chart
   * - Category breakdown with radar chart
   * - Interactive theme switching (dark/light)
   * - Expandable category details with issues and metrics
   * - Priority recommendations with impact scoring
   * - Search functionality for filtering content
   * - Responsive design for various screen sizes
   * 
   * @param {Object} results - Complete scoring results object
   * @param {Object} results.overall - Overall score information
   * @param {Object} results.categories - Category-specific results
   * @param {Array} [results.recommendations] - Improvement recommendations
   * @param {Object} results.metadata - Project metadata
   * @returns {Promise<string>} Complete HTML document as string
   * 
   * @example
   * const html = await report.generateHTML(results);
   * await fs.writeFile('quality-report.html', html);
   */
  async generateHTML(results) {
    const { overall, categories, recommendations, metadata } = results;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context7 Quality Dashboard - ${metadata.projectName}</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --bg-tertiary: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --text-muted: #64748b;
            --accent-primary: #3b82f6;
            --accent-secondary: #8b5cf6;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --border: #475569;
            --shadow: rgba(0, 0, 0, 0.3);
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
        }
        
        [data-theme="light"] {
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --bg-tertiary: #e2e8f0;
            --text-primary: #1e293b;
            --text-secondary: #475569;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --shadow: rgba(0, 0, 0, 0.1);
            --glass-bg: rgba(255, 255, 255, 0.8);
            --glass-border: rgba(0, 0, 0, 0.1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: var(--bg-primary);
            min-height: 100vh;
            transition: all 0.3s ease;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: 280px 1fr;
            min-height: 100vh;
            gap: 0;
        }
        
        .sidebar {
            background: var(--bg-secondary);
            padding: 2rem;
            border-right: 1px solid var(--border);
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 3rem;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary);
        }
        
        .nav-menu {
            list-style: none;
        }
        
        .nav-item {
            margin-bottom: 0.5rem;
        }
        
        .nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            color: var(--text-secondary);
            text-decoration: none;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .nav-link:hover, .nav-link.active {
            background: var(--glass-bg);
            color: var(--text-primary);
            backdrop-filter: blur(10px);
        }
        
        .main-content {
            padding: 2rem;
            overflow-x: hidden;
        }
        
        .header-section {
            margin-bottom: 3rem;
        }
        
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        
        .project-title {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .controls {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .theme-toggle {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            padding: 0.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.2s ease;
        }
        
        .theme-toggle:hover {
            background: var(--bg-tertiary);
        }
        
        .search-box {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border-radius: 0.75rem;
            backdrop-filter: blur(10px);
            min-width: 300px;
            transition: all 0.2s ease;
        }
        
        .search-container {
            position: relative;
        }
        
        .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
        }
        
        .hero-stats {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 2rem;
            align-items: center;
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 1.5rem;
            padding: 3rem;
            margin-bottom: 3rem;
        }
        
        .score-visual {
            text-align: center;
        }
        
        .score-circle {
            position: relative;
            width: 160px;
            height: 160px;
            margin: 0 auto 1rem;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }
        
        .stat-item {
            text-align: center;
            padding: 1rem;
            background: var(--glass-bg);
            border-radius: 1rem;
            backdrop-filter: blur(10px);
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 800;
            color: var(--accent-primary);
        }
        
        .stat-label {
            color: var(--text-muted);
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        
        .categories-section {
            margin-bottom: 3rem;
        }
        
        .section-title {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .categories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
        }
        
        .category-card {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 1rem;
            padding: 1.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        
        .category-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px var(--shadow);
        }
        
        .category-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
        }
        
        .category-card.excellent::before { background: linear-gradient(90deg, #10b981, #059669); }
        .category-card.good::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }
        .category-card.warning::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
        .category-card.poor::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
        
        .category-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .category-info {
            flex: 1;
        }
        
        .category-name {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
        }
        
        .category-description {
            color: var(--text-muted);
            font-size: 0.875rem;
        }
        
        .category-score-display {
            text-align: right;
        }
        
        .score-number {
            font-size: 2rem;
            font-weight: 800;
            color: var(--text-primary);
        }
        
        .score-max {
            color: var(--text-muted);
            font-size: 1rem;
        }
        
        .progress-section {
            margin: 1.5rem 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 12px;
            background: var(--bg-tertiary);
            border-radius: 6px;
            overflow: hidden;
            margin: 0.75rem 0;
            position: relative;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 6px;
            background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
            transition: width 1s ease;
            position: relative;
            overflow: hidden;
        }
        
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .progress-excellent .progress-fill { background: linear-gradient(90deg, #10b981, #059669); }
        .progress-good .progress-fill { background: linear-gradient(90deg, #3b82f6, #2563eb); }
        .progress-warning .progress-fill { background: linear-gradient(90deg, #f59e0b, #d97706); }
        .progress-poor .progress-fill { background: linear-gradient(90deg, #ef4444, #dc2626); }
        
        .progress-labels {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .progress-percentage {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .expand-toggle {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 0.25rem;
            transition: all 0.2s ease;
        }
        
        .expand-toggle:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        
        .category-details {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            display: none;
        }
        
        .category-details.expanded {
            display: block;
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .issues-section {
            margin-top: 1rem;
        }
        
        .issues-header {
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .issues-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .issue-item {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            padding: 0.75rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .issue-icon {
            color: var(--error);
            margin-top: 0.125rem;
        }
        
        .recommendations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .recommendation-card {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 1rem;
            padding: 1.5rem;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .recommendation-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px var(--shadow);
        }
        
        .rec-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .rec-priority {
            background: var(--accent-primary);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 600;
        }
        
        .rec-impact {
            background: var(--success);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 600;
        }
        
        .rec-title {
            font-weight: 600;
            font-size: 1.125rem;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }
        
        .rec-desc {
            color: var(--text-secondary);
            margin-bottom: 1rem;
            line-height: 1.5;
        }
        
        .rec-category {
            color: var(--text-muted);
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                display: none;
            }
            
            .hero-stats {
                grid-template-columns: 1fr;
                gap: 1.5rem;
                text-align: center;
            }
            
            .categories-grid {
                grid-template-columns: 1fr;
            }
            
            .search-box {
                min-width: 200px;
            }
        }
        
        @media print {
            .sidebar,
            .controls,
            .nav-menu {
                display: none;
            }
            
            .dashboard {
                grid-template-columns: 1fr;
            }
            
            body {
                background: white;
                color: black;
            }
        }
    </style>
</head>
<body data-theme="dark">
    <div class="dashboard">
        <nav class="sidebar">
            <div class="logo">
                <i class="fas fa-chart-line"></i>
                <span>Context7</span>
            </div>
            
            <ul class="nav-menu">
                <li class="nav-item">
                    <a href="#overview" class="nav-link active" data-section="overview">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>Overview</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#categories" class="nav-link" data-section="categories">
                        <i class="fas fa-layer-group"></i>
                        <span>Categories</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#recommendations" class="nav-link" data-section="recommendations">
                        <i class="fas fa-lightbulb"></i>
                        <span>Recommendations</span>
                    </a>
                </li>
            </ul>
        </nav>
        
        <main class="main-content">
            <div class="header-section">
                <div class="header-top">
                    <h1 class="project-title">${metadata.projectName}</h1>
                    
                    <div class="controls">
                        <div class="search-container">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" class="search-box" placeholder="Search report content..." id="searchInput">
                        </div>
                        <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
                            <i class="fas fa-moon"></i>
                        </button>
                    </div>
                </div>
                
                <div class="hero-stats">
                    <div class="score-visual">
                        <div class="score-circle">
                            <canvas id="scoreChart" width="160" height="160"></canvas>
                        </div>
                        <div class="score-number">${Math.round(overall.score)}</div>
                        <div class="score-max">out of ${overall.maxScore}</div>
                        <div class="grade" style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; color: var(--accent-primary);">${overall.grade}</div>
                    </div>
                    
                    <div class="chart-container">
                        <canvas id="categoryChart"></canvas>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${overall.percentage}%</div>
                            <div class="stat-label">Quality Score</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${Object.keys(categories).length}</div>
                            <div class="stat-label">Categories</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${recommendations ? recommendations.length : 0}</div>
                            <div class="stat-label">Recommendations</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${metadata.projectType}</div>
                            <div class="stat-label">Project Type</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <section class="categories-section" id="categories">
                <h2 class="section-title">
                    <i class="fas fa-layer-group"></i>
                    Category Analysis
                </h2>
                
                <div class="categories-grid">
                    ${Object.entries(categories).map(([_key, category]) => {
    const percentage = Math.round((category.score / category.maxScore) * 100);
    const level = this.getPerformanceLevel(percentage);
    const categoryId = category.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    return `
                            <div class="category-card ${level}" data-category="${categoryId}">
                                <div class="category-header">
                                    <div class="category-info">
                                        <div class="category-name">${category.categoryName}</div>
                                        <div class="category-description">${this.getCategoryDescription(category.categoryName)}</div>
                                    </div>
                                    <div class="category-score-display">
                                        <div class="score-number">${category.score.toFixed(1)}<span class="score-max">/${category.maxScore}</span></div>
                                    </div>
                                </div>
                                
                                <div class="progress-section">
                                    <div class="progress-labels">
                                        <span class="progress-percentage">${percentage}%</span>
                                        <button class="expand-toggle" onclick="toggleCategoryDetails('${categoryId}')">
                                            <i class="fas fa-chevron-down"></i>
                                        </button>
                                    </div>
                                    <div class="progress-bar progress-${level}">
                                        <div class="progress-fill" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                                
                                <div class="category-details" id="details-${categoryId}">
                                    ${category.issues && category.issues.length > 0 ? `
                                        <div class="issues-section">
                                            <div class="issues-header">
                                                <i class="fas fa-exclamation-triangle issue-icon"></i>
                                                <span>Issues Found (${category.issues.length})</span>
                                            </div>
                                            <div class="issues-list">
                                                ${category.issues.map(issue => `
                                                    <div class="issue-item">
                                                        <i class="fas fa-times-circle issue-icon"></i>
                                                        <span>${issue}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : '<div class="issues-section"><div class="issues-header"><i class="fas fa-check-circle" style="color: var(--success);"></i><span>No issues found</span></div></div>'}
                                </div>
                            </div>
                        `;
  }).join('')}
                </div>
            </section>
            
            ${recommendations && recommendations.length > 0 ? `
                <section class="recommendations-section" id="recommendations">
                    <h2 class="section-title">
                        <i class="fas fa-lightbulb"></i>
                        Priority Recommendations
                    </h2>
                    
                    <div class="recommendations-grid">
                        ${recommendations.slice(0, 12).map((rec, index) => `
                            <div class="recommendation-card" data-impact="${rec.impact}">
                                <div class="rec-header">
                                    <div class="rec-priority">#${index + 1}</div>
                                    <div class="rec-impact">+${rec.impact}pts</div>
                                </div>
                                <div class="rec-content">
                                    <div class="rec-title">${rec.suggestion}</div>
                                    ${rec.description ? `<div class="rec-desc">${rec.description}</div>` : ''}
                                    <div class="rec-category">${rec.category || 'General'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            ` : ''}
            
            <footer style="margin-top: 4rem; padding: 2rem 0; border-top: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-muted);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 500;">
                        <i class="fas fa-chart-line"></i>
                        <span>Generated by Context7 MCP Quality Scorer</span>
                    </div>
                    <div style="font-size: 0.875rem;">
                        ${new Date().toLocaleString()}
                    </div>
                </div>
            </footer>
        </main>
    </div>
    
    <script>
        // Theme Management
        function toggleTheme() {
            const body = document.body;
            const icon = document.querySelector('.theme-toggle i');
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            body.setAttribute('data-theme', newTheme);
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('theme', newTheme);
        }
        
        // Load saved theme
        document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            document.body.setAttribute('data-theme', savedTheme);
            document.querySelector('.theme-toggle i').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
        
        // Category Details Toggle
        function toggleCategoryDetails(categoryId) {
            const details = document.getElementById(\`details-\${categoryId}\`);
            const toggle = details.parentElement.querySelector('.expand-toggle i');
            
            if (details.classList.contains('expanded')) {
                details.classList.remove('expanded');
                toggle.className = 'fas fa-chevron-down';
            } else {
                details.classList.add('expanded');
                toggle.className = 'fas fa-chevron-up';
            }
        }
        
        // Search Functionality
        document.getElementById('searchInput')?.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.category-card, .recommendation-card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(query) || query === '') {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
        
        // Charts Initialization
        document.addEventListener('DOMContentLoaded', function() {
            // Score Circle Chart
            const scoreCtx = document.getElementById('scoreChart');
            if (scoreCtx) {
                new Chart(scoreCtx, {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [${overall.percentage}, ${100 - overall.percentage}],
                            backgroundColor: ['#3b82f6', 'rgba(255,255,255,0.1)'],
                            borderWidth: 0,
                            cutout: '75%'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
            
            // Category Breakdown Chart
            const categoryCtx = document.getElementById('categoryChart');
            if (categoryCtx) {
                const categoryData = ${JSON.stringify(Object.entries(categories).map(([_, cat]) => ({
    name: cat.categoryName,
    score: Math.round((cat.score / cat.maxScore) * 100)
  })))};
                
                new Chart(categoryCtx, {
                    type: 'radar',
                    data: {
                        labels: categoryData.map(c => c.name.split(' ').slice(0, 2).join(' ')),
                        datasets: [{
                            label: 'Score %',
                            data: categoryData.map(c => c.score),
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                            pointBackgroundColor: '#3b82f6'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100,
                                grid: { color: 'rgba(255,255,255,0.1)' },
                                angleLines: { color: 'rgba(255,255,255,0.1)' },
                                pointLabels: { color: '#cbd5e1', font: { size: 11 } }
                            }
                        },
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Get performance level classification based on percentage score
   * 
   * @param {number} percentage - Score percentage (0-100)
   * @returns {string} Performance level: 'excellent', 'good', 'warning', or 'poor'
   * 
   * @example
   * const level = report.getPerformanceLevel(85); // Returns 'excellent'
   */
  getPerformanceLevel(percentage) {
    if (percentage >= 85) {return 'excellent';}
    if (percentage >= 70) {return 'good';}
    if (percentage >= 55) {return 'warning';}
    return 'poor';
  }

  /**
   * Get descriptive text for a score percentage
   * 
   * @param {number} percentage - Score percentage (0-100)
   * @returns {string} Human-readable description of the score level
   * 
   * @example
   * const desc = report.getScoreDescription(92); // Returns 'Excellent project quality'
   */
  getScoreDescription(percentage) {
    if (percentage >= 95) {return 'Outstanding quality! 🎉';}
    if (percentage >= 90) {return 'Excellent project quality';}
    if (percentage >= 85) {return 'Very good with minor improvements needed';}
    if (percentage >= 80) {return 'Good quality with room for enhancement';}
    if (percentage >= 70) {return 'Acceptable quality, focus on key improvements';}
    if (percentage >= 60) {return 'Needs improvement in several areas';}
    return 'Requires significant attention to meet quality standards';
  }

  /**
   * Get detailed description for a scoring category
   * 
   * @param {string} categoryName - Name of the scoring category
   * @returns {string} Detailed description of what the category evaluates
   * 
   * @example
   * const desc = report.getCategoryDescription('Code Quality & Maintainability');
   */
  getCategoryDescription(categoryName) {
    const descriptions = {
      'Code Structure & Architecture': 'File organization, module design, and architectural patterns',
      'Code Quality & Maintainability': 'Code style, complexity, and maintainability metrics',
      'Performance & Optimization': 'Bundle size, loading performance, and optimization techniques',
      'Testing & Documentation': 'Test coverage, documentation quality, and development practices',
      'Security & Error Handling': 'Security vulnerabilities, error handling, and data protection',
      'Developer Experience': 'Tooling, workflow, and development environment setup',
      'Completeness & Production Readiness': 'Project completeness and production deployment readiness'
    };
    return descriptions[categoryName] || 'Category analysis and recommendations';
  }

  /**
   * Generate a JSON report from scoring results
   * 
   * @param {Object} results - Complete scoring results object
   * @returns {Promise<string>} JSON string with formatted results
   * 
   * @example
   * const json = await report.generateJSON(results);
   * console.log(JSON.parse(json).overall.score);
   */
  async generateJSON(results) {
    return JSON.stringify(results, null, 2);
  }

  /**
   * Generate a Markdown report from scoring results
   * 
   * @param {Object} results - Complete scoring results object
   * @returns {Promise<string>} Markdown formatted report
   * 
   * @example
   * const markdown = await report.generateMarkdown(results);
   * await fs.writeFile('README.md', markdown);
   */
  async generateMarkdown(results) {
    const { overall, categories, recommendations, metadata } = results;

    let markdown = '# Context7 Quality Score Report\n\n';
    markdown += `**Project:** ${metadata.projectName}  \n`;
    markdown += `**Type:** ${metadata.projectType}  \n`;
    markdown += `**Score:** ${overall.score}/${overall.maxScore} (${overall.grade})  \n`;
    markdown += `**Date:** ${new Date(overall.timestamp).toLocaleDateString()}\n\n`;

    markdown += '## Overall Results\n\n';
    markdown += `- **Score:** ${overall.score}/${overall.maxScore}\n`;
    markdown += `- **Percentage:** ${overall.percentage}%\n`;
    markdown += `- **Grade:** ${overall.grade}\n\n`;

    markdown += '## Category Breakdown\n\n';

    for (const [, category] of Object.entries(categories)) {
      const percentage = Math.round((category.score / category.maxScore) * 100);
      const emoji = percentage >= 85 ? '✅' : percentage >= 70 ? '⚡' : '⚠️';

      markdown += `### ${emoji} ${category.categoryName}\n\n`;
      markdown += `- **Score:** ${category.score}/${category.maxScore} (${percentage}%)\n`;
      markdown += `- **Grade:** ${category.grade}\n`;

      if (category.issues && category.issues.length > 0) {
        markdown += '\n**Issues:**\n';
        category.issues.forEach(issue => {
          markdown += `- ${issue}\n`;
        });
      }

      if (category.suggestions && category.suggestions.length > 0) {
        markdown += '\n**Suggestions:**\n';
        category.suggestions.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
      }

      markdown += '\n';
    }

    if (recommendations && recommendations.length > 0) {
      markdown += '## 🎯 Priority Recommendations\n\n';

      recommendations.slice(0, 10).forEach((rec, index) => {
        markdown += `${index + 1}. **[+${rec.impact}pts]** ${rec.suggestion}\n`;
        if (rec.description) {
          markdown += `   ${rec.description}\n`;
        }
        markdown += '\n';
      });
    }

    markdown += '---\n';
    markdown += '*Generated by Context7 MCP Quality Scorer*\n';

    return markdown;
  }

  /**
   * Save a report to disk in specified format
   * 
   * @param {Object} results - Complete scoring results object
   * @param {string} [format='html'] - Output format: 'html', 'json', or 'markdown'
   * @param {string} [filename=null] - Output filename (auto-generated if null)
   * @param {Object} [options={}] - Additional options
   * @param {boolean} [options.open=false] - Open file in browser/editor after saving
   * @returns {Promise<string>} Path to saved file
   * 
   * @example
   * const filePath = await report.saveReport(results, 'html', 'quality-report.html', { open: true });
   * console.log(`Report saved to: ${filePath}`);
   */
  async saveReport(results, format = 'html', filename = null, options = {}) {
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:.]/g, '-');
    const defaultFilename = `context7-score-${timestamp}.${format}`;
    const outputFile = filename || defaultFilename;

    let content;

    switch (format.toLowerCase()) {
    case 'html':
      content = await this.generateHTML(results);
      break;
    case 'json':
      content = await this.generateJSON(results);
      break;
    case 'md':
    case 'markdown':
      content = await this.generateMarkdown(results);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
    }

    await fs.writeFile(outputFile, content);

    // Auto-open browser for HTML reports if requested
    if (format.toLowerCase() === 'html' && options.openBrowser) {
      await this.openInBrowser(outputFile);
    }

    return outputFile;
  }

  /**
   * Open a file in the default browser (cross-platform)
   * 
   * @param {string} filePath - Path to the file to open
   * @returns {Promise<void>} 
   * @throws {Error} If browser opening fails
   * 
   * @example
   * await report.openInBrowser('/path/to/report.html');
   */
  async openInBrowser(filePath) {
    try {
      const absolutePath = path.resolve(filePath);
      const fileUrl = `file://${absolutePath.replace(/\\/g, '/')}`;

      let command;
      switch (process.platform) {
      case 'win32':
        command = `start "" "${fileUrl}"`;
        break;
      case 'darwin':
        command = `open "${fileUrl}"`;
        break;
      case 'linux':
        command = `xdg-open "${fileUrl}"`;
        break;
      default:
        console.log(`📄 Report saved to: ${filePath}`);
        console.log(`🌐 Open manually: ${fileUrl}`);
        return;
      }

      await execAsync(command);
      console.log(`🌐 Report opened in browser: ${filePath}`);
    } catch (error) {
      console.log(`📄 Report saved to: ${filePath}`);
      console.log(`⚠️  Could not auto-open browser: ${error.message}`);
    }
  }
}