/**
 * Setup Command
 * Composite command that runs init and validate
 */

import { BaseCommand } from './BaseCommand.js';

export class SetupCommand extends BaseCommand {
  constructor(config, packageRoot) {
    super(config);
    this.packageRoot = packageRoot;
  }

  async execute(options = {}) {
    try {
      const results = [];

      // Execute init command
      const { InitCommand } = await import('./InitCommand.js');
      const initCommand = new InitCommand(this.config, this.packageRoot);
      const initResult = await initCommand.execute(options);
      results.push({ command: 'init', result: initResult });

      if (!initResult.success) {
        return {
          success: false,
          message: 'Setup failed during initialization',
          results
        };
      }

      // Execute validate command
      const { ValidateCommand } = await import('./ValidateCommand.js');
      const validateCommand = new ValidateCommand(this.config);
      const validateResult = await validateCommand.execute({ strict: true });
      results.push({ command: 'validate', result: validateResult });

      return {
        success: initResult.success && validateResult.success,
        message: 'Setup completed successfully',
        results
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Setup failed'
      };
    }
  }

  getHelp() {
    return {
      description: 'Initialize project and validate configuration',
      usage: 'codefortify setup [options]',
      options: [
        '--force: Force initialization even if files exist',
        '--template: Use specific template for initialization'
      ]
    };
  }
}