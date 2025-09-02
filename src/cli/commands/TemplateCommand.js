/**
 * Template Management Command
 *
 * Handles template discovery, initialization, and management
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { TemplateManager } from '../../TemplateManager.js';

/**

 * TemplateCommand class implementation

 *

 * Provides functionality for templatecommand operations

 */

/**

 * TemplateCommand class implementation

 *

 * Provides functionality for templatecommand operations

 */

export class TemplateCommand {
  constructor(globalConfig, packageRoot) {
    this.globalConfig = globalConfig;
    this.packageRoot = packageRoot;
    this.templateManager = new TemplateManager({
      projectRoot: this.globalConfig.projectRoot,
      templatesPath: path.join(this.packageRoot, 'templates')
    });
  }
  /**
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
    const { action } = options;
    /**
   * Performs the specified operation
   * @param {any} action
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} action
   * @returns {any} The operation result
   */

    switch (action) {
    case 'list':
      await this.listTemplates();
      break;
    case 'info':
      await this.showTemplateInfo(options.template);
      break;
    case 'init':
      await this.initWithTemplate(options);
      break;
    case 'add':
      await this.addStandards(options);
      break;
    case 'update':
      await this.updateStandards(options);
      break;
    default:
      console.log(chalk.red('Unknown template action:', action));
      this.showHelp();
    }
  }
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */

  async listTemplates() {
    console.log(chalk.bold.blue(' Available CodeFortify Templates'));
    console.log(chalk.gray(''.repeat(50)));

    try {
      const templates = await this.templateManager.discoverTemplates();
      /**
   * Performs the specified operation
   * @param {any} templates.length - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} templates.length - Optional parameter
   * @returns {any} The operation result
   */

      if (templates.length === 0) {
        console.log(chalk.yellow('No templates found.'));
        return;
      }

      // Group templates by type
      const coreTemplates = templates.filter(t => t.type === 'core');
      const projectTemplates = templates.filter(t => t.type === 'project');
      /**
   * Performs the specified operation
   * @param {any} coreTemplates.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} coreTemplates.length > 0
   * @returns {any} The operation result
   */

      if (coreTemplates.length > 0) {
        console.log(chalk.bold('\n Core Templates:'));
        coreTemplates.forEach(template => {
          console.log(`  - ${template.name}`);
        });
      }
      /**
   * Performs the specified operation
   * @param {any} projectTemplates.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} projectTemplates.length > 0
   * @returns {any} The operation result
   */

      if (projectTemplates.length > 0) {
        console.log(chalk.bold('\n Project Templates:'));
        projectTemplates.forEach(template => {
          console.log(`  - ${template.name}`);
        });
      }

      console.log(chalk.gray('\nUse "codefortify template info <name>" for detailed information'));

    } catch (error) {
      console.error(chalk.red('Failed to list templates:'), error.message);
    }
  }
  /**
   * Performs the specified operation
   * @param {any} templateName
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} templateName
   * @returns {Promise} Promise that resolves with the result
   */

  async showTemplateInfo(templateName) {
  /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */
    if (!templateName) {
      console.log(chalk.red('Template name is required'));
      return;
    }

    try {
      const templates = await this.templateManager.discoverTemplates();
      const template = templates.find(t => t.name === templateName);
      /**
   * Performs the specified operation
   * @param {any} !template
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !template
   * @returns {any} The operation result
   */

      if (!template) {
        console.log(chalk.red(`Template '${templateName}' not found`));
        return;
      }

      console.log(chalk.bold.blue(` Template: ${template.name}`));
      console.log(chalk.gray(''.repeat(50)));

      console.log(`Type: ${template.type}`);
      console.log(`Version: ${template.manifest?.version || '1.0.0'}`);
      console.log(`Description: ${template.manifest?.description || 'No description available'}`);

      // Show available standards
      const resolvedTemplate = await this.templateManager.resolveTemplate(templateName);
      const standards = Object.keys(resolvedTemplate).filter(k => k !== 'template');
      /**
   * Performs the specified operation
   * @param {any} standards.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} standards.length > 0
   * @returns {any} The operation result
   */

      if (standards.length > 0) {
        console.log(chalk.bold('\n Available Standards:'));
        standards.forEach(standard => {
          console.log(`  - ${standard}.md`);
        });
      }

      // Show usage
      console.log(chalk.bold('\n Usage:'));
      /**
   * Performs the specified operation
   * @param {any} template.type - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} template.type - Optional parameter
   * @returns {any} The operation result
   */
      if (template.type === 'project') {
        console.log(`  codefortify template init <project-name> --template ${template.name}`);
      } else {
        console.log(`  codefortify template add --template ${template.name}`);
      }

    } catch (error) {
      console.error(chalk.red('Failed to get template info:'), error.message);
    }
  }
  /**
   * Initialize the component
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Initialize the component
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */

  async initWithTemplate(options) {
    const { projectName, template: templateName } = options;
    /**
   * Performs the specified operation
   * @param {any} !projectName
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !projectName
   * @returns {any} The operation result
   */

    if (!projectName) {
      console.log(chalk.red('Project name is required'));
      return;
    }
    /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */

    if (!templateName) {
      // Show template selection
      const templateName = await this.selectTemplate();
      /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */
      if (!templateName) {return;}
      options.template = templateName;
    }

    console.log(chalk.bold.blue(` Initializing ${projectName} with ${templateName} template`));

    try {
      const spinner = ora('Initializing project...').start();

      // Create project directory
      const projectPath = path.join(process.cwd(), projectName);
      await fs.ensureDir(projectPath);

      // Copy template files
      await this.copyTemplateFiles(templateName, projectPath, projectName);

      spinner.succeed('Project initialized successfully');

      console.log(chalk.green.bold('\n Project created successfully!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log(`  cd ${projectName}`);
      console.log('  npm install');
      console.log('  codefortify validate');

    } catch (error) {
      console.error(chalk.red('Failed to initialize project:'), error.message);
    }
  }
  /**
   * Adds an item
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Adds an item
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */

  async addStandards(options) {
    const { template: templateName } = options;
    /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */

    if (!templateName) {
      // Show template selection
      const templateName = await this.selectTemplate();
      /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */
      if (!templateName) {return;}
      options.template = templateName;
    }

    console.log(chalk.bold.blue(` Adding standards from ${templateName} template`));

    try {
      const spinner = ora('Adding standards...').start();

      // Get template standards
      const resolvedTemplate = await this.templateManager.resolveTemplate(templateName);

      // Create .codefortify directory
      const codefortifyPath = path.join(this.globalConfig.projectRoot, '.codefortify');
      await fs.ensureDir(codefortifyPath);
      await fs.ensureDir(path.join(codefortifyPath, 'standards'));

      // Copy standards
      for (const [standardName, content] of Object.entries(resolvedTemplate)) {
        /**
   * Performs the specified operation
   * @param {any} standardName ! - Optional parameter
   * @returns {string} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} standardName ! - Optional parameter
   * @returns {string} The operation result
   */
        if (standardName !== 'template' && typeof content === 'string') {
          const filePath = path.join(codefortifyPath, 'standards', `${standardName}.md`);
          await fs.writeFile(filePath, content);
        }
      }

      spinner.succeed('Standards added successfully');

      console.log(chalk.green.bold('\n Standards added successfully!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log('  codefortify validate');
      console.log('  codefortify score');

    } catch (error) {
      console.error(chalk.red('Failed to add standards:'), error.message);
    }
  }
  /**
   * Updates existing data
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Updates existing data
   * @param {Object} options
   * @returns {Promise} Promise that resolves with the result
   */

  async updateStandards(options) {
    const { template: templateName } = options;
    /**
   * Performs the specified operation
   * @param {any} !templateName
   * @returns {any} The operation result
   */

    if (!templateName) {
      console.log(chalk.red('Template name is required for update'));
      return;
    }

    console.log(chalk.bold.blue(` Updating standards from ${templateName} template`));

    try {
      const spinner = ora('Updating standards...').start();

      // Get template standards
      const resolvedTemplate = await this.templateManager.resolveTemplate(templateName);

      // Update standards
      const codefortifyPath = path.join(this.globalConfig.projectRoot, '.codefortify', 'standards');

      for (const [standardName, content] of Object.entries(resolvedTemplate)) {
        /**
   * Performs the specified operation
   * @param {any} standardName ! - Optional parameter
   * @returns {string} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} standardName ! - Optional parameter
   * @returns {string} The operation result
   */
        if (standardName !== 'template' && typeof content === 'string') {
          const filePath = path.join(codefortifyPath, `${standardName}.md`);
          await fs.writeFile(filePath, content);
        }
      }

      spinner.succeed('Standards updated successfully');

      console.log(chalk.green.bold('\n Standards updated successfully!'));

    } catch (error) {
      console.error(chalk.red('Failed to update standards:'), error.message);
    }
  }
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */

  async selectTemplate() {
    try {
      const templates = await this.templateManager.discoverTemplates();
      const projectTemplates = templates.filter(t => t.type === 'project');
      /**
   * Performs the specified operation
   * @param {any} projectTemplates.length - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} projectTemplates.length - Optional parameter
   * @returns {any} The operation result
   */

      if (projectTemplates.length === 0) {
        console.log(chalk.yellow('No project templates available'));
        return null;
      }

      const choices = projectTemplates.map(template => ({
        name: `${template.name} - ${template.manifest?.description || 'No description'}`,
        value: template.name
      }));

      const { template } = await inquirer.prompt([{
        type: 'list',
        name: 'template',
        message: 'Select a template:',
        choices
      }]);

      return template;
    } catch (error) {
      console.error(chalk.red('Failed to select template:'), error.message);
      return null;
    }
  }
  /**
   * Performs the specified operation
   * @param {any} templateName
   * @param {string} projectPath
   * @param {any} projectName
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} templateName
   * @param {string} projectPath
   * @param {any} projectName
   * @returns {Promise} Promise that resolves with the result
   */

  async copyTemplateFiles(templateName, projectPath, projectName) {
    const templates = await this.templateManager.discoverTemplates();
    const template = templates.find(t => t.name === templateName);
    /**
   * Performs the specified operation
   * @param {any} !template
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !template
   * @returns {any} The operation result
   */

    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Copy template files
    const templatePath = template.path;
    const files = await fs.readdir(templatePath, { withFileTypes: true });
    /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */

    for (const file of files) {
      const srcPath = path.join(templatePath, file.name);
      const destPath = path.join(projectPath, file.name);

      if (file.isDirectory()) {
        await fs.copy(srcPath, destPath);
      } else {
        let content = await fs.readFile(srcPath, 'utf8');

        // Replace template variables
        content = content.replace(/\{\{projectName\}\}/g, projectName);

        await fs.writeFile(destPath, content);
      }
    }
  }
  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @returns {any} The operation result
   */

  showHelp() {
    console.log(chalk.bold.blue('CodeFortify Template Management'));
    console.log(chalk.gray(''.repeat(40)));
    console.log('\nAvailable commands:');
    console.log('  list                    List available templates');
    console.log('  info <template>         Show template information');
    console.log('  init <name> --template <template>  Initialize project with template');
    console.log('  add --template <template>          Add standards to existing project');
    console.log('  update --template <template>       Update standards from template');
    console.log('\nExamples:');
    console.log('  codefortify template list');
    console.log('  codefortify template info react-webapp');
    console.log('  codefortify template init my-app --template react-webapp');
    console.log('  codefortify template add --template node-api');
  }
}

export default TemplateCommand;
