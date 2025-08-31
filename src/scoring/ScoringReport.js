/**
 * ScoringReport - Generates formatted reports from scoring results
 * 
 * Supports multiple output formats: console, JSON, HTML
 */

import fs from 'fs/promises';
// import path from 'path'; // Unused import

export class ScoringReport {
  constructor(config = {}) {
    this.config = config;
  }

  async generateHTML(results) {
    const { overall, categories, recommendations, metadata } = results;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context7 Quality Score - ${metadata.projectName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .score-display {
            font-size: 4rem;
            font-weight: bold;
            margin: 20px 0;
        }
        
        .grade {
            font-size: 2rem;
            opacity: 0.9;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .category-card {
            border-left: 4px solid #e2e8f0;
        }
        
        .category-card.excellent { border-left-color: #10b981; }
        .category-card.good { border-left-color: #3b82f6; }
        .category-card.warning { border-left-color: #f59e0b; }
        .category-card.poor { border-left-color: #ef4444; }
        
        .category-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .category-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
        }
        
        .category-score {
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        
        .progress-excellent { background: #10b981; }
        .progress-good { background: #3b82f6; }
        .progress-warning { background: #f59e0b; }
        .progress-poor { background: #ef4444; }
        
        .issues-list {
            margin-top: 15px;
        }
        
        .issue {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 4px;
            padding: 8px 12px;
            margin: 5px 0;
            font-size: 0.9rem;
            color: #991b1b;
        }
        
        .recommendations {
            background: white;
            border-radius: 8px;
            padding: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .recommendation {
            display: flex;
            align-items: flex-start;
            margin: 15px 0;
            padding: 15px;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
        }
        
        .rec-impact {
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-right: 12px;
            min-width: fit-content;
        }
        
        .rec-content {
            flex: 1;
        }
        
        .rec-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .rec-desc {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .metadata {
            margin-top: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            font-size: 0.9rem;
            color: #6b7280;
        }
        
        .timestamp {
            text-align: center;
            margin-top: 15px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Context7 Quality Score</h1>
            <h2>${metadata.projectName}</h2>
            <div class="score-display">${overall.score}/${overall.maxScore}</div>
            <div class="grade">${overall.grade}</div>
            <p>${overall.percentage}% - ${this.getScoreDescription(overall.percentage)}</p>
        </div>
        
        <div class="grid">
            ${Object.entries(categories).map(([_key, category]) => {
    const percentage = Math.round((category.score / category.maxScore) * 100);
    const level = this.getPerformanceLevel(percentage);
              
    return `
                <div class="card category-card ${level}">
                    <div class="category-header">
                        <div class="category-name">${category.categoryName}</div>
                        <div class="category-score">${category.score}/${category.maxScore}</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill progress-${level}" style="width: ${percentage}%"></div>
                    </div>
                    <div style="text-align: center; margin-top: 8px; font-weight: 600;">${percentage}%</div>
                    ${category.issues && category.issues.length > 0 ? `
                        <div class="issues-list">
                            ${category.issues.slice(0, 3).map(issue => `<div class="issue">${issue}</div>`).join('')}
                            ${category.issues.length > 3 ? `<div class="issue">...and ${category.issues.length - 3} more issues</div>` : ''}
                        </div>
                    ` : ''}
                </div>
              `;
  }).join('')}
        </div>
        
        ${recommendations && recommendations.length > 0 ? `
            <div class="recommendations">
                <h2 style="margin-bottom: 20px;">🎯 Improvement Recommendations</h2>
                ${recommendations.slice(0, 10).map(rec => `
                    <div class="recommendation">
                        <div class="rec-impact">+${rec.impact}pts</div>
                        <div class="rec-content">
                            <div class="rec-title">${rec.suggestion}</div>
                            ${rec.description ? `<div class="rec-desc">${rec.description}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="metadata">
            <p><strong>Project Type:</strong> ${metadata.projectType}</p>
            <p><strong>Analysis Date:</strong> ${new Date(overall.timestamp).toLocaleString()}</p>
            <p><strong>Context7 MCP Version:</strong> ${metadata.version}</p>
            ${overall.hasErrors ? '<p style="color: #ef4444;"><strong>⚠️ Some analysis components had errors</strong></p>' : ''}
            <div class="timestamp">
                Generated by Context7 MCP Quality Scorer
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  getPerformanceLevel(percentage) {
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 55) return 'warning';
    return 'poor';
  }

  getScoreDescription(percentage) {
    if (percentage >= 95) return 'Outstanding quality! 🎉';
    if (percentage >= 90) return 'Excellent project quality';
    if (percentage >= 85) return 'Very good with minor improvements needed';
    if (percentage >= 80) return 'Good quality with room for enhancement';
    if (percentage >= 70) return 'Acceptable quality, focus on key improvements';
    if (percentage >= 60) return 'Needs improvement in several areas';
    return 'Requires significant attention to meet quality standards';
  }

  async generateJSON(results) {
    return JSON.stringify(results, null, 2);
  }

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
    
    for (const [_key, category] of Object.entries(categories)) {
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

  async saveReport(results, format = 'html', filename = null) {
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
    return outputFile;
  }
}