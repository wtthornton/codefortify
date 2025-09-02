/**
 * Score Command Handler
 *
 * Handles project quality scoring and report generation across 7 categories.
 * Supports multiple output formats (console, JSON, HTML) with detailed analysis
 * and improvement recommendations.
 *
 * @class ScoreCommand
 * @example
 * const scoreCmd = new ScoreCommand(globalConfig);
 * await scoreCmd.execute({
 *   categories: ['structure', 'quality'],
 *   format: 'html',
 *   detailed: true,
 *   open: true
 * });
 */

import chalk from 'chalk';
import ora from 'ora';
import { ProjectScorer } from '../../scoring/ProjectScorer.js';

/**


 * ScoreCommand class implementation


 *


 * Provides functionality for scorecommand operations


 */


/**


 * ScoreCommand class implementation


 *


 * Provides functionality for scorecommand operations


 */


export class ScoreCommand {
  /**
   * Create a new ScoreCommand instance
   *
   * @param {Object} globalConfig - Global CLI configuration
   * @param {string} globalConfig.projectRoot - Project root directory
   * @param {boolean} globalConfig.verbose - Verbose logging flag
   */
  constructor(globalConfig) {
    this.globalConfig = globalConfig;
  }

  /**
   * Execute the score command with provided options
   *
   * @param {Object} options - Command options
   * @param {string} [options.categories='all'] - Comma-separated categories to analyze
   * @param {string} [options.format='console'] - Output format: 'console', 'json', 'html'
   * @param {string} [options.output] - Output file path (for json/html formats)
   * @param {boolean} [options.detailed=false] - Include detailed analysis
   * @param {boolean} [options.recommendations=false] - Include recommendations
   * @param {boolean} [options.open=false] - Open HTML report in browser
   * @returns {Promise<void>}
   *
   * @example
   * await scoreCmd.execute({
   *   categories: 'structure,quality,testing',
   *   format: 'html',
   *   output: 'quality-report.html',
   *   detailed: true,
   *   recommendations: true,
   *   open: true
   * });
   */
  async execute(options) {
    const spinner = ora('Analyzing project quality...').start();

    try {
      // Parse categories
      const categories = this.parseCategories(options.categories);

      // Set up scoring configuration with routing and gates
      const scoringConfig = {
        projectRoot: this.globalConfig.projectRoot,
        categories: categories,
        verbose: this.globalConfig.verbose,
        detailed: options.detailed,
        includeRecommendations: options.recommendations,
        routing: options.routing || {},
        gates: options.gates || {}
      };

      // Run the scoring analysis
      const results = await ProjectScorer.scoreProject(this.globalConfig.projectRoot, scoringConfig);

      spinner.stop();

      // Output results based on format
      await this.outputResults(results, options);

    } catch (error) {
      spinner.fail('Failed to analyze project quality');
      console.error(chalk.red('Error:'), error.message);      /**
   * Performs the specified operation
   * @param {Object} this.globalConfig.verbose
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.globalConfig.verbose
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.globalConfig.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }  /**
   * Parses the input data
   * @param {any} categoriesString
   * @returns {any} The operation result
   */
  /**
   * Parses the input data
   * @param {any} categoriesString
   * @returns {any} The operation result
   */


  parseCategories(categoriesString) {  /**
   * Performs the specified operation
   * @param {any} !categoriesString || categoriesString - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !categoriesString || categoriesString - Optional parameter
   * @returns {any} The operation result
   */

    if (!categoriesString || categoriesString === 'all') {
      return ['structure', 'quality', 'performance', 'testing', 'security', 'developerExperience', 'completeness'];
    }

    const validCategories = ['structure', 'quality', 'performance', 'testing', 'security', 'developerExperience', 'completeness'];
    const requested = categoriesString.split(',').map(cat => cat.trim());

    const invalid = requested.filter(cat => !validCategories.includes(cat));    /**
   * Performs the specified operation
   * @param {number} invalid.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} invalid.length > 0
   * @returns {any} The operation result
   */

    if (invalid.length > 0) {
      throw new Error(`Invalid categories: ${invalid.join(', ')}. Valid options: ${validCategories.join(', ')}`);
    }

    return requested;
  }  /**
   * Performs the specified operation
   * @param {any} results
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} results
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */


  async outputResults(results, options) {
    const format = options.format || 'console';
    const outputFile = options.output;    /**
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
      this.outputConsole(results, options);
      break;

    case 'json':
      await this.outputJSON(results, outputFile);
      break;

    case 'html':
      await this.outputHTML(results, outputFile, options.open);
      break;

    default:
      throw new Error(`Unsupported format: ${format}. Use console, json, or html.`);
    }
  }  /**
   * Performs the specified operation
   * @param {any} results
   * @param {Object} options
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} results
   * @param {Object} options
   * @returns {any} The operation result
   */


  outputConsole(results, options) {
    const { overall, categories, recommendations } = results;

    // Header - with CodeFortify process indicator
    const codefortifyPrefix = chalk.cyan.bold('[🚀 CodeFortify]');
    console.log('\n' + codefortifyPrefix + ' ' + chalk.bold.blue('🎯 Context7 Project Quality Score'));
    console.log(chalk.gray('═'.repeat(50)));

    // Overall score
    const gradeColor = this.getGradeColor(overall.grade);
    console.log(`\n${chalk.bold('Overall Score:')} ${chalk.bold.white(overall.score)}/${overall.maxScore} (${overall.percentage}%) ${gradeColor(overall.grade)}`);    /**
   * Performs the specified operation
   * @param {any} overall.timestamp
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} overall.timestamp
   * @returns {any} The operation result
   */


    if (overall.timestamp) {
      console.log(`${chalk.gray('Generated:')} ${new Date(overall.timestamp).toLocaleString()}`);
    }

    // Category breakdown
    console.log('\n' + chalk.bold('📊 Category Breakdown:'));
    Object.entries(categories).forEach(([_key, category]) => {
      const percentage = Math.round((category.score / category.maxScore) * 100);
      const gradeColor = this.getGradeColor(category.grade);
      const progressBar = this.createProgressBar(percentage);

      console.log(`\n  ${chalk.bold(category.categoryName || category.name || _key)}`);
      console.log(`  ${progressBar} ${percentage}% ${gradeColor(category.grade)} (${category.score}/${category.maxScore})`);      /**
   * Performs the specified operation
   * @param {Object} options.detailed && category.issues?.length > 0
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} options.detailed && category.issues?.length > 0
   * @returns {boolean} True if successful, false otherwise
   */


      if (options.detailed && category.issues?.length > 0) {
        category.issues.forEach(issue => {
          console.log(`    ${chalk.yellow('⚠')} ${issue}`);
        });
      }
    });

    // Recommendations    /**
   * Performs the specified operation
   * @param {Object} options.recommendations && recommendations?.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} options.recommendations && recommendations?.length > 0
   * @returns {any} The operation result
   */

    if (options.recommendations && recommendations?.length > 0) {
      console.log('\n' + chalk.bold('🚀 Priority Recommendations:'));
      recommendations.slice(0, 5).forEach((rec, index) => {
        const impactColor = rec.impact >= 4 ? chalk.red : rec.impact >= 2 ? chalk.yellow : chalk.green;
        console.log(`\n  ${index + 1}. ${chalk.bold(rec.suggestion)} ${impactColor(`[+${rec.impact}pts]`)}`);
        console.log(`     ${chalk.gray(rec.description)}`);
      });
    }

    console.log(''); // Final newline
  }  /**
   * Performs the specified operation
   * @param {any} results
   * @param {any} outputFile
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} results
   * @param {any} outputFile
   * @returns {Promise} Promise that resolves with the result
   */


  async outputJSON(results, outputFile) {
    const { ScoringReport } = await import('../../scoring/ScoringReportRefactored.js');
    const report = new ScoringReport();
    const json = await report.generateJSON(results);    /**
   * Performs the specified operation
   * @param {any} outputFile
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} outputFile
   * @returns {any} The operation result
   */


    if (outputFile) {
      const fs = await import('fs-extra');
      await fs.writeFile(outputFile, json);
      console.log(chalk.green(`✓ JSON report saved to: ${outputFile}`));
    } else {
      console.log(json);
    }
  }  /**
   * Performs the specified operation
   * @param {any} results
   * @param {any} outputFile
   * @param {any} openInBrowser - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} results
   * @param {any} outputFile
   * @param {any} openInBrowser - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async outputHTML(results, outputFile, openInBrowser = false) {
    const { ScoringReport } = await import('../../scoring/ScoringReport.js');
    const report = new ScoringReport({
      projectRoot: this.globalConfig.projectRoot,
      verbose: this.globalConfig.verbose
    });

    const filename = outputFile || `context7-quality-report-${Date.now()}.html`;
    const savedPath = await report.saveReport(results, 'html', filename, {
      openBrowser: openInBrowser
    });

    console.log(chalk.green(`✓ HTML report generated: ${savedPath}`));    /**
   * Performs the specified operation
   * @param {any} openInBrowser
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} openInBrowser
   * @returns {any} The operation result
   */


    if (openInBrowser) {
      console.log(chalk.blue('🌐 Opening report in browser...'));
    }
  }  /**
   * Retrieves data
   * @param {any} grade
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} grade
   * @returns {string} The retrieved data
   */


  getGradeColor(grade) {
    const gradeColors = {
      'A+': chalk.green.bold, 'A': chalk.green, 'A-': chalk.green,
      'B+': chalk.blue, 'B': chalk.blue, 'B-': chalk.blue,
      'C+': chalk.yellow, 'C': chalk.yellow, 'C-': chalk.yellow,
      'D+': chalk.red, 'D': chalk.red, 'D-': chalk.red,
      'F': chalk.red.bold
    };
    return gradeColors[grade] || chalk.white;
  }  /**
   * Creates a new resource
   * @param {any} percentage
   * @param {number} width - Optional parameter
   * @returns {any} The created resource
   */
  /**
   * Creates a new resource
   * @param {any} percentage
   * @param {number} width - Optional parameter
   * @returns {any} The created resource
   */


  createProgressBar(percentage, width = 20) {
    // Ensure percentage is within valid bounds
    const safePercentage = Math.max(0, Math.min(100, percentage));
    const filled = Math.round((safePercentage / 100) * width);
    const empty = width - filled;

    let color = chalk.red;    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentage > - Optional parameter
   * @returns {any} The operation result
   */

    if (percentage >= 80) {color = chalk.green;}
    else if (percentage >= 60) {color = chalk.yellow;}

    return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }
}