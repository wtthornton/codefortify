/**
 * Enhance Command - CLI interface for the continuous loop enhancement system
 *
 * Provides command-line access to the revolutionary continuous improvement system
 * with self-measurement, pattern learning, and Context7 integration.
 */

import chalk from 'chalk';
import ora from 'ora';
import { ContinuousLoopController } from '../../core/ContinuousLoopController.js';
import { PatternLearningSystem } from '../../learning/PatternLearningSystem.js';
import { PromptEnhancer } from '../../enhancement/PromptEnhancer.js';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

export class EnhanceCommand {
  constructor(globalConfig) {
    this.globalConfig = globalConfig;
    this.config = {
      projectRoot: globalConfig.projectRoot || process.cwd(),
      verbose: globalConfig.verbose || false,
      maxIterations: 5,
      targetScore: 95,
      outputFormat: 'console'
    };
  }

  /**
   * Execute the enhance command
   */
  async execute(input, options = {}) {
    // Merge options with config
    const enhanceConfig = {
      ...this.config,
      ...options,
      maxIterations: options.iterations || this.config.maxIterations,
      targetScore: options.target || this.config.targetScore,
      outputFormat: options.format || this.config.outputFormat
    };

    console.log(chalk.cyan('🔄 CodeFortify Continuous Enhancement System'));
    console.log(chalk.gray(`Target Score: ${enhanceConfig.targetScore}, Max Iterations: ${enhanceConfig.maxIterations}`));

    try {
      // Initialize the enhancement system
      const spinner = ora('Initializing enhancement system...').start();

      const loopController = new ContinuousLoopController(enhanceConfig);
      const patternLearner = new PatternLearningSystem(enhanceConfig);
      const promptEnhancer = new PromptEnhancer(enhanceConfig);

      spinner.succeed('Enhancement system initialized');

      // Set up event handlers for real-time feedback
      if (enhanceConfig.verbose) {
        this.setupEventHandlers(loopController, patternLearner, promptEnhancer);
      }

      // Process the input
      let processingInput;
      if (input) {
        processingInput = await this.prepareInput(input, enhanceConfig);
      } else {
        processingInput = await this.detectProjectInput(enhanceConfig);
      }

      if (!processingInput) {
        console.log(chalk.red('❌ No code to enhance. Provide a file path, directory, or code string.'));
        return { success: false, error: 'No input provided' };
      }

      // Run the continuous enhancement loop
      console.log(chalk.yellow('\n🚀 Starting continuous enhancement loop...\n'));

      const result = await loopController.processCode(processingInput, enhanceConfig);

      // Display results
      await this.displayResults(result, enhanceConfig);

      // Save results if requested
      if (enhanceConfig.output) {
        await this.saveResults(result, enhanceConfig.output, enhanceConfig.outputFormat);
      }

      // Display learning statistics
      if (enhanceConfig.verbose) {
        await this.displayLearningStats(patternLearner, promptEnhancer);
      }

      return {
        success: true,
        result: result,
        finalScore: result.summary.finalScore,
        iterations: result.summary.iterations,
        improvement: result.summary.finalScore - (result.progression[0]?.score || 0)
      };

    } catch (error) {
      console.log(chalk.red(`❌ Enhancement failed: ${error.message}`));

      if (enhanceConfig.verbose) {
        console.log(chalk.gray(error.stack));
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare input for processing
   */
  async prepareInput(input, config) {
    // If input is a file path
    if (typeof input === 'string' && existsSync(input)) {
      const stat = await import('fs').then(fs => fs.promises.stat(input));

      if (stat.isFile()) {
        return {
          type: 'file',
          filePath: input,
          content: readFileSync(input, 'utf-8')
        };
      } else if (stat.isDirectory()) {
        // For directory input, convert to files format expected by ContinuousLoopController
        const jsFiles = this.findJavaScriptFiles(input);
        return {
          files: jsFiles.map(file => ({
            path: file,
            content: readFileSync(file, 'utf-8')
          }))
        };
      }
    }

    // If input is raw code
    if (typeof input === 'string' && input.length > 0) {
      return {
        type: 'code',
        content: input
      };
    }

    return null;
  }

  /**
   * Detect input from project automatically
   */
  async detectProjectInput(config) {
    // Look for main files to enhance
    const candidateFiles = [
      'src/index.js',
      'src/index.ts',
      'src/main.js',
      'src/main.ts',
      'src/app.js',
      'src/App.js',
      'src/App.tsx',
      'index.js',
      'app.js'
    ];

    for (const candidate of candidateFiles) {
      const filePath = path.join(config.projectRoot, candidate);
      if (existsSync(filePath)) {
        return {
          type: 'file',
          filePath: filePath,
          content: readFileSync(filePath, 'utf-8')
        };
      }
    }

    // Fallback to src directory
    const srcDir = path.join(config.projectRoot, 'src');
    if (existsSync(srcDir)) {
      return {
        type: 'directory',
        directoryPath: srcDir
      };
    }

    return null;
  }

  /**
   * Setup event handlers for real-time feedback
   */
  setupEventHandlers(loopController, patternLearner, promptEnhancer) {
    // Loop events
    loopController.on('loop:start', () => {
      console.log(chalk.blue('🔄 Starting enhancement loop...'));
    });

    loopController.on('iteration:start', (data) => {
      console.log(chalk.yellow(`\n📍 Iteration ${data.iteration} (Current: ${data.currentScore}/${data.targetScore})`));
    });

    loopController.on('step:start', (data) => {
      const spinner = ora(`${this.getStepIcon(data.step)} ${data.step}...`).start();
      // Store spinner reference for completion
      loopController._currentSpinner = spinner;
    });

    loopController.on('step:complete', (data) => {
      if (loopController._currentSpinner) {
        const extra = data.score ? ` (Score: ${data.score})` :
          data.insights ? ` (${data.insights} insights)` :
            data.fixes ? ` (${data.fixes} fixes)` : '';
        loopController._currentSpinner.succeed(`${this.getStepIcon(data.step)} ${data.step} complete${extra}`);
      }
    });

    loopController.on('improvement:found', (data) => {
      console.log(chalk.green(`🎯 Score improved: ${data.previousScore} → ${data.newScore} (+${data.improvement})`));
    });

    loopController.on('iteration:complete', (data) => {
      console.log(chalk.cyan(`✨ Iteration ${data.iteration} complete - Score: ${data.score} (${data.duration}ms)`));
    });

    loopController.on('loop:complete', (data) => {
      console.log(chalk.green(`\n🏁 Enhancement complete! Final score: ${data.summary.finalScore}/${data.summary.targetScore}`));
    });

    // Pattern learning events
    patternLearner.on('patterns:learned', (data) => {
      if (data.count > 0) {
        console.log(chalk.magenta(`🧠 Learned ${data.count} new patterns from ${data.improvement}`));
      }
    });

    patternLearner.on('patterns:applied', (data) => {
      if (data.count > 0) {
        console.log(chalk.blue(`🔧 Applied ${data.count} learned patterns (${Math.round(data.effectiveness * 100)}% effective)`));
      }
    });

    // Error handlers
    loopController.on('iteration:error', (data) => {
      console.log(chalk.red(`❌ Error in iteration ${data.iteration}: ${data.error}`));
    });

    patternLearner.on('learning:error', (data) => {
      console.log(chalk.yellow(`⚠️  Pattern learning error: ${data.error}`));
    });
  }

  /**
   * Get appropriate icon for each step
   */
  getStepIcon(step) {
    const icons = {
      enhance: '⚡',
      review: '🔍',
      analysis: '📊',
      improve: '🔧'
    };
    return icons[step] || '🔄';
  }

  /**
   * Display enhancement results
   */
  async displayResults(result, config) {
    console.log(chalk.cyan('\n📊 Enhancement Results'));
    console.log(chalk.gray('=' .repeat(50)));

    // Summary
    console.log(`${chalk.bold('Final Score:')} ${chalk.green(result.summary.finalScore)}/100`);
    console.log(`${chalk.bold('Iterations:')} ${result.summary.iterations}`);
    console.log(`${chalk.bold('Total Duration:')} ${result.summary.totalDuration}ms`);
    console.log(`${chalk.bold('Average/Iteration:')} ${Math.round(result.summary.averageIterationTime)}ms`);
    console.log(`${chalk.bold('Target Achieved:')} ${result.summary.targetAchieved ? chalk.green('✅ Yes') : chalk.yellow('⚠️  No')}`);

    // Progression
    if (result.progression && result.progression.length > 1) {
      console.log(chalk.cyan('\n📈 Score Progression'));
      result.progression.forEach((iteration, index) => {
        const improvement = index > 0 ? iteration.score - result.progression[index - 1].score : 0;
        const improvementText = improvement > 0 ? chalk.green(`+${improvement}`) : improvement < 0 ? chalk.red(improvement) : '';
        console.log(`  Iteration ${iteration.iteration}: ${iteration.score} ${improvementText}`);
      });
    }

    // Patterns learned
    if (result.patterns && result.patterns.length > 0) {
      console.log(chalk.cyan('\n🧠 Patterns Learned'));
      result.patterns.slice(0, 5).forEach(pattern => {
        console.log(`  • ${pattern.description} (${Math.round(pattern.effectiveness * 100)}% effective)`);
      });

      if (result.patterns.length > 5) {
        console.log(chalk.gray(`  ... and ${result.patterns.length - 5} more patterns`));
      }
    }

    // Recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      console.log(chalk.cyan('\n💡 Recommendations'));
      result.recommendations.slice(0, 3).forEach(rec => {
        const priority = rec.priority === 'high' ? chalk.red('🔴') :
          rec.priority === 'medium' ? chalk.yellow('🟡') : chalk.gray('⚪');
        console.log(`  ${priority} ${rec.description}`);
      });
    }

    // Metrics
    if (result.metrics && config.verbose) {
      console.log(chalk.cyan('\n📊 Detailed Metrics'));
      if (result.metrics.tokens) {
        console.log(`  Token Reduction: ${Math.round(result.metrics.tokens.reduction)}%`);
        console.log(`  Tokens Saved: ${result.metrics.tokens.saved}`);
      }
      if (result.metrics.roi) {
        console.log(`  Time Saved: ${result.metrics.roi.timeSaved} hours`);
        console.log(`  Cost Saved: $${result.metrics.roi.costSaved.toFixed(2)}`);
      }
    }
  }

  /**
   * Save results to file
   */
  async saveResults(result, outputPath, format) {
    const spinner = ora(`Saving results to ${outputPath}...`).start();

    try {
      let output;

      switch (format) {
      case 'json':
        output = JSON.stringify(result, null, 2);
        break;
      case 'html':
        output = await this.generateHtmlReport(result);
        break;
      case 'markdown':
        output = await this.generateMarkdownReport(result);
        break;
      default:
        output = JSON.stringify(result, null, 2);
      }

      writeFileSync(outputPath, output, 'utf-8');
      spinner.succeed(`Results saved to ${outputPath}`);

    } catch (error) {
      spinner.fail(`Failed to save results: ${error.message}`);
    }
  }

  /**
   * Display learning statistics
   */
  async displayLearningStats(patternLearner, promptEnhancer) {
    console.log(chalk.cyan('\n🧠 Learning System Statistics'));
    console.log(chalk.gray('=' .repeat(40)));

    const patternStats = patternLearner.getLearningStats();
    const enhancementStats = promptEnhancer.getEnhancementStats();

    console.log(`${chalk.bold('Patterns Learned:')} ${patternStats.totalPatterns}`);
    console.log(`${chalk.bold('Success Rate:')} ${Math.round(patternStats.successRate * 100)}%`);
    console.log(`${chalk.bold('Prompt Enhancements:')} ${enhancementStats.totalEnhancements}`);
    console.log(`${chalk.bold('Avg Token Reduction:')} ${Math.round(enhancementStats.averageReduction)}%`);

    if (enhancementStats.projectedSavings) {
      console.log(chalk.cyan('\n💰 Projected Monthly Savings'));
      console.log(`  Tokens: ${enhancementStats.projectedSavings.tokensPerMonth}`);
      console.log(`  Cost: $${enhancementStats.projectedSavings.costPerMonth.toFixed(2)}`);
      console.log(`  Time: ${enhancementStats.projectedSavings.timePerMonth.toFixed(1)} hours`);
    }

    if (patternStats.topPatterns && patternStats.topPatterns.length > 0) {
      console.log(chalk.cyan('\n🏆 Top Performing Patterns'));
      patternStats.topPatterns.slice(0, 3).forEach((pattern, index) => {
        console.log(`  ${index + 1}. ${pattern.name} (${Math.round(pattern.effectiveness * 100)}% effective, used ${pattern.timesUsed}x)`);
      });
    }
  }

  /**
   * Generate HTML report
   */
  async generateHtmlReport(result) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>CodeFortify Enhancement Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 10px; margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #2196F3; }
        .score { font-size: 2em; font-weight: bold; color: #4CAF50; }
        .progression { margin: 20px 0; }
        .iteration { padding: 8px 0; border-bottom: 1px solid #eee; }
        .patterns { margin: 20px 0; }
        .pattern { background: #e3f2fd; padding: 10px; margin: 5px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">🚀 CodeFortify Enhancement Report</h1>
        
        <div class="metrics">
            <div class="metric">
                <div>Final Score</div>
                <div class="score">${result.summary.finalScore}/100</div>
            </div>
            <div class="metric">
                <div>Iterations</div>
                <div class="score">${result.summary.iterations}</div>
            </div>
            <div class="metric">
                <div>Duration</div>
                <div class="score">${result.summary.totalDuration}ms</div>
            </div>
            <div class="metric">
                <div>Target Achieved</div>
                <div class="score">${result.summary.targetAchieved ? '✅' : '⚠️'}</div>
            </div>
        </div>

        ${result.progression ? `
        <h2>📈 Score Progression</h2>
        <div class="progression">
            ${result.progression.map(iter => `
                <div class="iteration">
                    Iteration ${iter.iteration}: Score ${iter.score}
                    ${iter.improvements?.length ? `(${iter.improvements.length} improvements)` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${result.patterns?.length ? `
        <h2>🧠 Patterns Learned</h2>
        <div class="patterns">
            ${result.patterns.slice(0, 10).map(pattern => `
                <div class="pattern">
                    <strong>${pattern.description}</strong>
                    <span style="color: #666;">(${Math.round(pattern.effectiveness * 100)}% effective)</span>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; text-align: center;">
            Generated by CodeFortify Continuous Enhancement System
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate Markdown report
   */
  async generateMarkdownReport(result) {
    let markdown = `# 🚀 CodeFortify Enhancement Report

## Summary
- **Final Score:** ${result.summary.finalScore}/100
- **Iterations:** ${result.summary.iterations}
- **Duration:** ${result.summary.totalDuration}ms
- **Target Achieved:** ${result.summary.targetAchieved ? '✅ Yes' : '⚠️ No'}

`;

    if (result.progression) {
      markdown += `## 📈 Score Progression

| Iteration | Score | Improvements |
|-----------|-------|-------------|
`;
      result.progression.forEach(iter => {
        markdown += `| ${iter.iteration} | ${iter.score} | ${iter.improvements?.length || 0} |\n`;
      });
      markdown += '\n';
    }

    if (result.patterns?.length) {
      markdown += `## 🧠 Patterns Learned

`;
      result.patterns.slice(0, 10).forEach(pattern => {
        markdown += `- **${pattern.description}** (${Math.round(pattern.effectiveness * 100)}% effective)\n`;
      });
      markdown += '\n';
    }

    markdown += `---
*Generated by CodeFortify Continuous Enhancement System*
`;

    return markdown;
  }

  /**
   * Recursively find all JavaScript files in a directory
   */
  findJavaScriptFiles(dir) {
    const files = [];

    try {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other common ignore patterns
          if (!['node_modules', '.git', '.vscode', 'dist', 'build'].includes(item)) {
            files.push(...this.findJavaScriptFiles(fullPath));
          }
        } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.mjs'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not read directory ${dir}: ${error.message}`));
    }

    return files;
  }
}