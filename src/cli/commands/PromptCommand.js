/**
 * Prompt Command - CLI interface for enhanced prompt generation
 *
 * Allows users to generate and test enhanced prompts for recommendations
 */

import { Command } from 'commander';
import { RecommendationEngine } from '../../scoring/RecommendationEngine.js';
import { EnhancedPromptGenerator } from '../../scoring/EnhancedPromptGenerator.js';
import { ProjectScorer } from '../../scoring/ProjectScorer.js';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**


 * PromptCommand class implementation


 *


 * Provides functionality for promptcommand operations


 */


/**


 * PromptCommand class implementation


 *


 * Provides functionality for promptcommand operations


 */


export class PromptCommand {
  constructor() {
    this.command = new Command('prompt');
    this.setupCommand();
  }  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupCommand() {
    this.command
      .description('Generate enhanced prompts for code quality recommendations')
      .option('-p, --project <path>', 'Project path to analyze', process.cwd())
      .option('-c, --config <file>', 'Configuration file path')
      .option('-o, --output <format>', 'Output format: json, text, or html', 'text')
      .option('-f, --file <path>', 'Save output to file')
      .option('-t, --test', 'Test prompt generation with sample data')
      .option('-v, --verbose', 'Enable verbose output')
      .action(async (options) => {
        try {
          await this.execute(options);
        } catch (error) {
          console.error('❌ Error:', error.message);          /**
   * Performs the specified operation
   * @param {Object} options.verbose
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {Object} options.verbose
   * @returns {any} The operation result
   */

          if (options.verbose) {
            console.error(error.stack);
          }
          process.exit(1);
        }
      });
  }  /**
   * Executes the operation
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Executes the operation
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */


  async execute(options) {
    const { project, config, output, file, test, verbose } = options;    /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */


    if (verbose) {
      console.log('🚀 Starting enhanced prompt generation...');
    }

    let results;
    let recommendations;    /**
   * Performs the specified operation
   * @param {any} test
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} test
   * @returns {any} The operation result
   */


    if (test) {
      // Use test data for demonstration
      results = this.getTestResults();
      recommendations = this.getTestRecommendations();
    } else {
      // Analyze actual project
      if (!existsSync(project)) {
        throw new Error(`Project path does not exist: ${project}`);
      }

      const scoringConfig = this.loadConfig(config, project);
      const scorer = new ProjectScorer(scoringConfig);      /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */


      if (verbose) {
        console.log('📊 Analyzing project...');
      }

      results = await scorer.scoreProject();
      recommendations = results.recommendations || [];
    }    /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */


    if (verbose) {
      console.log(`📝 Found ${recommendations.length} recommendations`);
    }

    // Generate enhanced prompts
    const promptGenerator = new EnhancedPromptGenerator({
      maxPromptTokens: 150,
      enableContextInjection: true,
      optimizeForFirstTry: true
    });

    const enhancedPrompts = await promptGenerator.generateBatchPrompts(recommendations, {
      type: results.metadata?.projectType || 'javascript',
      currentFile: null,
      recentFiles: []
    });    /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */


    if (verbose) {
      console.log(`🤖 Generated ${enhancedPrompts.length} enhanced prompts`);
    }

    // Output results
    const outputContent = this.formatOutput(enhancedPrompts, output, verbose);    /**
   * Performs the specified operation
   * @param {any} file
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} file
   * @returns {any} The operation result
   */


    if (file) {
      await this.saveToFile(outputContent, file, output);
      console.log(`💾 Enhanced prompts saved to: ${file}`);
    } else {
      console.log(outputContent);
    }

    // Show statistics    /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */

    if (verbose) {
      this.showStatistics(enhancedPrompts, promptGenerator);
    }
  }  /**
   * Formats the data
   * @param {any} enhancedPrompts
   * @param {any} format
   * @param {any} verbose
   * @returns {any} The operation result
   */
  /**
   * Formats the data
   * @param {any} enhancedPrompts
   * @param {any} format
   * @param {any} verbose
   * @returns {any} The operation result
   */


  formatOutput(enhancedPrompts, format, verbose) {
    switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(enhancedPrompts, null, 2);

    case 'html':
      return this.generateHTMLOutput(enhancedPrompts);

    case 'text':
    default:
      return this.generateTextOutput(enhancedPrompts, verbose);
    }
  }  /**
   * Generates new data
   * @param {any} enhancedPrompts
   * @param {any} verbose
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @param {any} enhancedPrompts
   * @param {any} verbose
   * @returns {any} The created resource
   */


  generateTextOutput(enhancedPrompts, verbose) {
    let output = '🤖 Enhanced Prompts for Code Quality Recommendations\n';
    output += '='.repeat(60) + '\n\n';

    enhancedPrompts.forEach((item, index) => {
      const { recommendation, enhancedPrompt } = item;

      output += `${index + 1}. ${recommendation.suggestion}\n`;
      output += `   Category: ${recommendation.category}\n`;
      output += `   Priority: ${recommendation.priority}\n`;
      output += `   Impact: +${recommendation.impact} points\n\n`;

      output += '   🤖 Auto-Execute Prompt:\n';
      output += `   ${'─'.repeat(50)}\n`;
      output += `   ${enhancedPrompt.prompt}\n`;
      output += `   ${'─'.repeat(50)}\n\n`;      /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} verbose
   * @returns {any} The operation result
   */


      if (verbose) {
        output += '   📊 Metrics:\n';
        output += `   • Tokens: ${enhancedPrompt.estimatedTokens}\n`;
        output += `   • Success Rate: ${Math.round(enhancedPrompt.successRate * 100)}%\n`;
        output += `   • Confidence: ${Math.round(enhancedPrompt.confidence * 100)}%\n`;
        output += `   • Token Reduction: ${Math.round(enhancedPrompt.tokenReduction || 0)}%\n`;
        output += `   • Auto-Executable: ${enhancedPrompt.autoExecutable ? 'Yes' : 'No'}\n\n`;
      }

      output += '\n';
    });

    return output;
  }  /**
   * Generates new data
   * @param {any} enhancedPrompts
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @param {any} enhancedPrompts
   * @returns {any} The created resource
   */


  generateHTMLOutput(enhancedPrompts) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Prompts - Context7</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 2rem; }
        .prompt { background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
        .prompt-text { font-family: 'Monaco', 'Menlo', monospace; background: #fff; padding: 1rem; border-radius: 4px; margin: 0.5rem 0; }
        .metrics { display: flex; gap: 1rem; font-size: 0.9rem; color: #666; }
        .metric { display: flex; align-items: center; gap: 0.25rem; }
    </style>
</head>
<body>
    <h1>🤖 Enhanced Prompts for Code Quality Recommendations</h1>
    
    ${enhancedPrompts.map((item, index) => {
    const { recommendation, enhancedPrompt } = item;
    return `
        <div class="prompt">
            <h3>${index + 1}. ${recommendation.suggestion}</h3>
            <p><strong>Category:</strong> ${recommendation.category} | <strong>Priority:</strong> ${recommendation.priority} | <strong>Impact:</strong> +${recommendation.impact} points</p>
            
            <div class="prompt-text">${enhancedPrompt.prompt}</div>
            
            <div class="metrics">
                <div class="metric">📊 ${enhancedPrompt.estimatedTokens} tokens</div>
                <div class="metric">✅ ${Math.round(enhancedPrompt.successRate * 100)}% success</div>
                <div class="metric">🎯 ${Math.round(enhancedPrompt.confidence * 100)}% confidence</div>
                <div class="metric">⚡ ${Math.round(enhancedPrompt.tokenReduction || 0)}% reduction</div>
            </div>
        </div>
      `;
  }).join('')}
    
    <footer style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; color: #666;">
        Generated by Context7 Enhanced Prompt Generator
    </footer>
</body>
</html>`;
  }  /**
   * Saves data to storage
   * @param {any} content
   * @param {string} filePath
   * @param {any} format
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Saves data to storage
   * @param {any} content
   * @param {string} filePath
   * @param {any} format
   * @returns {Promise} Promise that resolves with the result
   */


  async saveToFile(content, filePath, format) {
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, content);
  }  /**
   * Performs the specified operation
   * @param {any} enhancedPrompts
   * @param {any} promptGenerator
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} enhancedPrompts
   * @param {any} promptGenerator
   * @returns {boolean} True if successful, false otherwise
   */


  showStatistics(enhancedPrompts, promptGenerator) {
    const stats = promptGenerator.getPromptStats();

    console.log('\n📊 Enhanced Prompt Statistics:');
    console.log('─'.repeat(40));
    console.log(`Total Prompts Generated: ${enhancedPrompts.length}`);
    console.log(`Templates Available: ${stats.templatesAvailable}`);
    console.log(`Max Tokens per Prompt: ${stats.maxTokensPerPrompt}`);
    console.log(`Average Success Rate: ${Math.round(stats.averageSuccessRate * 100)}%`);

    const totalTokens = enhancedPrompts.reduce((sum, item) => sum + item.enhancedPrompt.estimatedTokens, 0);
    const avgTokens = Math.round(totalTokens / enhancedPrompts.length);
    console.log(`Average Tokens per Prompt: ${avgTokens}`);

    const autoExecutable = enhancedPrompts.filter(item => item.enhancedPrompt.autoExecutable).length;
    console.log(`Auto-Executable Prompts: ${autoExecutable}/${enhancedPrompts.length}`);
  }  /**
   * Loads data from source
   * @param {Object} configPath
   * @param {string} projectPath
   * @returns {any} The operation result
   */
  /**
   * Loads data from source
   * @param {Object} configPath
   * @param {string} projectPath
   * @returns {any} The operation result
   */


  loadConfig(configPath, projectPath) {
    if (configPath && existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
      } catch (error) {
        console.warn(`⚠️  Could not load config file: ${error.message}`);
      }
    }

    // Default configuration
    return {
      projectRoot: projectPath,
      verbose: false,
      promptGenerator: {
        maxPromptTokens: 150,
        enableContextInjection: true,
        optimizeForFirstTry: true
      }
    };
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getTestResults() {
    return {
      metadata: {
        projectName: 'Test Project',
        projectType: 'react'
      },
      overall: {
        score: 75,
        maxScore: 100,
        percentage: 75,
        grade: 'B'
      }
    };
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getTestRecommendations() {
    return [
      {
        category: 'quality',
        impact: 4,
        priority: 'high',
        suggestion: 'Fix 15 ESLint errors',
        description: 'You have 15 ESLint errors that need immediate attention.',
        action: 'Run: npx eslint --fix .'
      },
      {
        category: 'security',
        impact: 5,
        priority: 'critical',
        suggestion: 'Fix 3 critical security vulnerabilities',
        description: 'Critical vulnerabilities pose immediate security risks.',
        action: 'Run npm audit --fix immediately'
      },
      {
        category: 'testing',
        impact: 3,
        priority: 'high',
        suggestion: 'Increase test coverage from 45% to 80%',
        description: 'Low test coverage poses significant risk.',
        action: 'Focus on testing business logic and critical user flows'
      },
      {
        category: 'performance',
        impact: 2,
        priority: 'medium',
        suggestion: 'Reduce bundle size from 850KB',
        description: 'Bundle size is getting large. Consider optimization strategies.',
        action: 'Add code splitting and tree shaking'
      }
    ];
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  getCommand() {
    return this.command;
  }
}
