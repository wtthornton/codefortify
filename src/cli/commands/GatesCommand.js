/**
 * Gates Command Handler
 *
 * Handles quality gates evaluation and CI/CD integration.
 * Supports multiple output formats and can be used in CI/CD pipelines
 * to enforce quality standards.
 *
 * @class GatesCommand
 * @example
 * const gatesCmd = new GatesCommand(globalConfig);
 * await gatesCmd.execute({
 *   format: 'github-actions',
 *   output: 'quality-gates.json',
 *   blocking: true
 * });
 */

import chalk from 'chalk';
import ora from 'ora';
import { ProjectScorer } from '../../scoring/ProjectScorer.js';
import { QualityGates } from '../../gates/QualityGates.js';

/**


 * GatesCommand class implementation


 * 


 * Provides functionality for gatescommand operations


 */


/**


 * GatesCommand class implementation


 * 


 * Provides functionality for gatescommand operations


 */


export class GatesCommand {
  /**
   * Create a new GatesCommand instance
   *
   * @param {Object} globalConfig - Global CLI configuration
   * @param {string} globalConfig.projectRoot - Project root directory
   * @param {boolean} globalConfig.verbose - Verbose logging flag
   */
  constructor(globalConfig) {
    this.globalConfig = globalConfig;
  }

  /**
   * Execute the gates command with provided options
   *
   * @param {Object} options - Command options
   * @param {string} [options.format='auto'] - CI/CD format: 'auto', 'github-actions', 'gitlab-ci', 'jenkins', 'generic'
   * @param {string} [options.output] - Output file path
   * @param {boolean} [options.blocking=true] - Block on gate failure
   * @param {boolean} [options.strict=false] - Strict evaluation (all gates must pass)
   * @param {Object} [options.thresholds] - Custom quality thresholds
   * @returns {Promise<void>}
   *
   * @example
   * await gatesCmd.execute({
   *   format: 'github-actions',
   *   output: 'quality-gates.json',
   *   blocking: true,
   *   thresholds: { overall: { min: 80 } }
   * });
   */
  async execute(options) {
    const spinner = ora('Evaluating quality gates...').start();

    try {
      // Set up gates configuration
      const gatesConfig = {
        enabled: true,
        thresholds: options.thresholds || this.getDefaultThresholds(),
        ci: {
          format: options.format || 'auto',
          output: {
            summary: true,
            detailed: false
          },
          blocking: {
            enabled: options.blocking !== false,
            onFailure: 'error',
            onWarning: 'warning'
          }
        },
        verbose: this.globalConfig.verbose
      };

      // Run scoring analysis
      const scoringConfig = {
        categories: ['all'],
        verbose: this.globalConfig.verbose,
        detailed: false,
        includeRecommendations: true,
        gates: gatesConfig
      };

      const results = await ProjectScorer.scoreProject(this.globalConfig.projectRoot, scoringConfig);

      spinner.stop();

      // Extract quality gates results
      const gatesResult = results.qualityGates;  /**
   * Performs the specified operation
   * @param {any} !gatesResult
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} !gatesResult
   * @returns {any} The operation result
   */

      
      if (!gatesResult) {
        throw new Error('Quality gates evaluation failed - no results available');
      }

      // Output results
      await this.outputResults(gatesResult, options);

      // Handle blocking behavior  /**
   * Performs the specified operation
   * @param {Object} options.blocking ! - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {Object} options.blocking ! - Optional parameter
   * @returns {any} The operation result
   */

      if (options.blocking !== false && !gatesResult.passed) {
        console.error(chalk.red('\n❌ Quality gates failed - blocking deployment'));
        process.exit(1);
      }

    } catch (error) {
      spinner.fail('Failed to evaluate quality gates');
      console.error(chalk.red('Error:'), error.message);  /**
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
  }

  /**
   * Output quality gates results
   *
   * @param {Object} gatesResult - Quality gates evaluation results
   * @param {Object} options - Command options
   * @returns {Promise<void>}
   */
  async outputResults(gatesResult, options) {
    const format = options.format || 'auto';
    const outputFile = options.output;

    // Console output
    this.outputConsole(gatesResult);

    // CI/CD output if format specified  /**
   * Performs the specified operation
   * @param {any} format ! - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} format ! - Optional parameter
   * @returns {any} The operation result
   */

    if (format !== 'console') {
      await this.outputCI(gatesResult, format, outputFile);
    }
  }

  /**
   * Output results to console
   *
   * @param {Object} gatesResult - Quality gates evaluation results
   * @returns {void}
   */
  outputConsole(gatesResult) {
    const { passed, message, gates, summary } = gatesResult;

    // Header
    console.log('\n' + chalk.bold.blue('🎯 Quality Gates Evaluation'));
    console.log(chalk.gray('═'.repeat(50)));

    // Overall result
    const statusColor = passed ? chalk.green : chalk.red;
    console.log(`\n${chalk.bold('Status:')} ${statusColor(passed ? '✅ PASSED' : '❌ FAILED')}`);
    console.log(`${chalk.bold('Message:')} ${message}`);

    // Summary
    console.log(`\n${chalk.bold('Summary:')}`);
    console.log(`  Gates Passed: ${chalk.green(summary.passed)}/${summary.total}`);
    console.log(`  Gates Failed: ${chalk.red(summary.failed)}`);  /**
   * Performs the specified operation
   * @param {any} summary.warnings > 0
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} summary.warnings > 0
   * @returns {any} The operation result
   */

    if (summary.warnings > 0) {
      console.log(`  Warnings: ${chalk.yellow(summary.warnings)}`);
    }
    console.log(`  Pass Rate: ${summary.passRate.toFixed(1)}%`);

    // Gate details
    console.log('\n' + chalk.bold('Gate Details:'));
    gates.forEach(gate => {
      const status = gate.passed ? '✅' : '❌';
      const warning = gate.warning ? ' ⚠️' : '';
      const threshold = gate.threshold ? `/${gate.threshold}` : '';
      
      console.log(`  ${status}${warning} ${gate.name}: ${gate.score}${threshold}`);
    });

    // Failed gates details
    const failedGates = gates.filter(gate => !gate.passed);  /**
   * Performs the specified operation
   * @param {any} failedGates.length > 0
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} failedGates.length > 0
   * @returns {any} The operation result
   */

    if (failedGates.length > 0) {
      console.log('\n' + chalk.bold.red('Failed Gates:'));
      failedGates.forEach(gate => {
        console.log(`  ❌ ${gate.name}: ${gate.message}`);  /**
   * Performs the specified operation
   * @param {boolean} gate.details.issues && gate.details.issues.length > 0
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {boolean} gate.details.issues && gate.details.issues.length > 0
   * @returns {boolean} True if successful, false otherwise
   */

        if (gate.details.issues && gate.details.issues.length > 0) {
          gate.details.issues.slice(0, 3).forEach(issue => {
            console.log(`    - ${issue}`);
          });
        }
      });
    }

    // Warning gates details
    const warningGates = gates.filter(gate => gate.warning);  /**
   * Performs the specified operation
   * @param {any} warningGates.length > 0
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} warningGates.length > 0
   * @returns {any} The operation result
   */

    if (warningGates.length > 0) {
      console.log('\n' + chalk.bold.yellow('Warning Gates:'));
      warningGates.forEach(gate => {
        console.log(`  ⚠️  ${gate.name}: ${gate.message}`);
      });
    }

    console.log(''); // Final newline
  }

  /**
   * Output CI/CD formatted results
   *
   * @param {Object} gatesResult - Quality gates evaluation results
   * @param {string} format - CI/CD format
   * @param {string} [outputFile] - Output file path
   * @returns {Promise<void>}
   */
  async outputCI(gatesResult, format, outputFile) {
    const qualityGates = new QualityGates({
      ci: { format },
      verbose: this.globalConfig.verbose
    });

    try {
      const ciOutput = await qualityGates.generateCIOutput(gatesResult, {
        format,
        outputPath: outputFile
      });  /**
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
        console.log(chalk.green(`✓ CI output written to: ${outputFile}`));
      } else {
        console.log('\n' + chalk.bold('CI/CD Output:'));
        console.log(ciOutput.output);
      }

    } catch (error) {
      console.warn(chalk.yellow(`⚠️  CI output generation failed: ${error.message}`));
    }
  }

  /**
   * Get default quality thresholds
   *
   * @returns {Object} Default thresholds
   */
  getDefaultThresholds() {
    return {
      overall: { min: 70, warning: 80 },
      categories: {
        quality: { min: 15, warning: 18 },
        testing: { min: 10, warning: 12 },
        security: { min: 12, warning: 14 },
        structure: { min: 15, warning: 18 },
        performance: { min: 10, warning: 12 },
        developerExperience: { min: 7, warning: 9 },
        completeness: { min: 3, warning: 4 }
      }
    };
  }

  /**
   * Get CI/CD integration examples
   *
   * @returns {Object} Integration examples
   */
  getIntegrationExamples() {
    return {
      'github-actions': `
# .github/workflows/quality-gates.yml
name: Quality Gates
on: [push, pull_request]
jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npx codefortify gates --format=github-actions
      - name: Quality Gates Summary
        if: always()
        run: echo "${{ steps.quality-gates.outputs.summary }}" >> $GITHUB_STEP_SUMMARY`,

      'gitlab-ci': `
# .gitlab-ci.yml
quality-gates:
  stage: test
  image: node:18
  script:
    - npm ci
    - npx codefortify gates --format=gitlab-ci --output quality-gates.md
  artifacts:
    reports:
      markdown: quality-gates.md
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"`,

      'jenkins': `
// Jenkinsfile
pipeline {
    agent any
    stages {  /**
   * Performs the specified operation
   * @param {any} 'Quality Gates'
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} 'Quality Gates'
   * @returns {any} The operation result
   */

        stage('Quality Gates') {
            steps {
                sh 'npm ci'
                sh 'npx codefortify gates --format=jenkins --output=quality-gates.json'
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'quality-gates.json'
        }
    }
}`
    };
  }
}
