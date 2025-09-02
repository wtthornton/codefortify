/**
 * Validate Command
 * Validates project configuration and setup
 */

import { BaseCommand } from './BaseCommand.js';

export class ValidateCommand extends BaseCommand {
  constructor(config) {
    super(config);
  }

  async execute(options = {}) {
    try {
      // Use existing validator
      const { CodeFortifyValidator } = await import('../../validation/CodeFortifyValidator.js');
      const validator = new CodeFortifyValidator(this.config);
      
      const validationResult = await validator.validate({
        strict: options.strict || false,
        categories: options.categories,
        ...options
      });

      return {
        success: validationResult.success,
        message: validationResult.success ? 'Validation passed' : 'Validation failed',
        data: validationResult,
        warnings: validationResult.warnings || []
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Validation failed'
      };
    }
  }

  getHelp() {
    return {
      description: 'Validate project configuration and compliance',
      usage: 'codefortify validate [options]',
      options: [
        '--strict: Enable strict validation mode',
        '--categories: Specific categories to validate',
        '--fix: Attempt to fix validation issues automatically'
      ]
    };
  }
}