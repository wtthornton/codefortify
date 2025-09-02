/**
 * Analyze Command
 * Composite command that runs score and status
 */

import { BaseCommand } from './BaseCommand.js';

export class AnalyzeCommand extends BaseCommand {
  constructor(config) {
    super(config);
  }

  async execute(options = {}) {
    try {
      const results = [];

      // Execute score command
      const { ScoreCommand } = await import('./ScoreCommand.js');
      const scoreCommand = new ScoreCommand(this.config);
      const scoreResult = await scoreCommand.execute(options);
      results.push({ command: 'score', result: scoreResult });

      // If score succeeded, get status information
      if (scoreResult.success && options.includeStatus !== false) {
        const { MonitorCommand } = await import('./MonitorCommand.js');
        const monitorCommand = new MonitorCommand(this.config);
        const statusResult = await monitorCommand.execute({ 
          action: 'status', 
          format: 'json' 
        });
        results.push({ command: 'status', result: statusResult });
      }

      return {
        success: scoreResult.success,
        message: scoreResult.success ? 'Analysis completed successfully' : 'Analysis failed',
        data: {
          score: scoreResult.data,
          analysis: results
        },
        results
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Analysis failed'
      };
    }
  }

  getHelp() {
    return {
      description: 'Perform comprehensive project analysis',
      usage: 'codefortify analyze [options]',
      options: [
        '--detailed: Include detailed analysis results',
        '--format: Output format (console, json, html)',
        '--categories: Specific categories to analyze',
        '--no-status: Skip status information'
      ]
    };
  }
}