/**
 * ScoringReport - Orchestrates report generation using specialized generators
 *
 * Supports multiple output formats through modular generators
 *
 * @class ScoringReport
 */

import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { HTMLReportGenerator } from './report/HTMLReportGenerator.js';
import { MarkdownReportGenerator } from './report/MarkdownReportGenerator.js';
import { JSONReportGenerator } from './report/JSONReportGenerator.js';

const execAsync = promisify(exec);

export class ScoringReport {
  constructor(config = {}) {
    this.config = config;
    this.htmlGenerator = new HTMLReportGenerator();
    this.markdownGenerator = new MarkdownReportGenerator();
    this.jsonGenerator = new JSONReportGenerator();
  }

  /**
   * Generate report in specified format
   * @param {Object} results - Scoring results
   * @param {string} format - Output format (html, markdown, json)
   * @returns {Promise<string>} Generated report content
   */
  async generate(results, format = 'html') {
    switch (format.toLowerCase()) {
    case 'html':
      return await this.generateHTML(results);
    case 'markdown':
    case 'md':
      return await this.generateMarkdown(results);
    case 'json':
      return await this.generateJSON(results);
    default:
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate HTML report
   * @param {Object} results - Scoring results
   * @returns {Promise<string>} HTML content
   */
  async generateHTML(results) {
    return await this.htmlGenerator.generate(results);
  }

  /**
   * Generate Markdown report
   * @param {Object} results - Scoring results
   * @returns {Promise<string>} Markdown content
   */
  async generateMarkdown(results) {
    return await this.markdownGenerator.generate(results);
  }

  /**
   * Generate JSON report
   * @param {Object} results - Scoring results
   * @returns {Promise<string>} JSON string
   */
  async generateJSON(results) {
    return await this.jsonGenerator.generate(results);
  }

  /**
   * Save report to file
   * @param {string} content - Report content
   * @param {string} outputFile - Output file path
   * @returns {Promise<void>}
   */
  async saveToFile(content, outputFile) {
    await fs.writeFile(outputFile, content);
  }

  /**
   * Open HTML report in browser
   * @param {string} filePath - Path to HTML file
   * @returns {Promise<void>}
   */
  async openInBrowser(filePath) {
    const platform = process.platform;
    let command;

    if (platform === 'darwin') {
      command = `open "${filePath}"`;
    } else if (platform === 'win32') {
      command = `start "" "${filePath}"`;
    } else {
      command = `xdg-open "${filePath}"`;
    }

    try {
      await execAsync(command);
      console.log(`🌐 Report opened in browser: ${filePath}`);
    } catch (error) {
      console.error('Failed to open browser:', error.message);
    }
  }

  /**
   * Get performance level based on percentage
   * @param {number} percentage - Score percentage
   * @returns {string} Performance level
   */
  getPerformanceLevel(percentage) {
    if (percentage >= 90) {return 'excellent';}
    if (percentage >= 70) {return 'good';}
    if (percentage >= 50) {return 'warning';}
    return 'poor';
  }

  /**
   * Get score description based on percentage
   * @param {number} percentage - Score percentage
   * @returns {string} Description text
   */
  getScoreDescription(percentage) {
    if (percentage >= 95) {return 'Outstanding project quality! This codebase demonstrates excellence across all categories.';}
    if (percentage >= 85) {return 'Very good project quality with strong fundamentals and minor areas for improvement.';}
    if (percentage >= 70) {return 'Good quality with solid foundation. Some improvements recommended for production readiness.';}
    if (percentage >= 60) {return 'Acceptable quality but significant improvements needed in several areas.';}
    if (percentage >= 50) {return 'Below average quality. Major improvements required across multiple categories.';}
    return 'Poor quality. Significant refactoring and improvements needed before production use.';
  }

  /**
   * Get category description
   * @param {string} categoryName - Category name
   * @returns {string} Category description
   */
  getCategoryDescription(categoryName) {
    const descriptions = {
      'Code Structure & Architecture': 'Evaluates file organization, module boundaries, naming conventions, and architectural patterns',
      'Code Quality & Maintainability': 'Assesses code complexity, duplication, consistency, and adherence to best practices',
      'Performance & Optimization': 'Analyzes bundle size, lazy loading, caching strategies, and runtime performance',
      'Testing & Documentation': 'Reviews test coverage, test quality, documentation completeness, and API documentation',
      'Security & Error Handling': 'Examines security practices, vulnerability management, and error handling strategies',
      'Developer Experience': 'Evaluates tooling setup, development workflow, debugging support, and onboarding ease',
      'Completeness & Production Readiness': 'Checks for production requirements, monitoring, deployment setup, and Context7 compliance'
    };

    return descriptions[categoryName] || 'Category analysis and recommendations';
  }
}