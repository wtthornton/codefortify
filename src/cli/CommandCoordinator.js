/**
 * Command Coordinator
 *
 * Orchestrates CLI command execution with modular command handlers
 */

import { InitCommand } from './commands/InitCommand.js';
import { ScoreCommand } from './commands/ScoreCommand.js';
import { ProjectTypeDetector } from '../scoring/core/ProjectTypeDetector.js';

export class CommandCoordinator {
  constructor(globalConfig, packageRoot) {
    this.globalConfig = globalConfig;
    this.packageRoot = packageRoot;

    // Initialize command handlers
    this.commands = {
      init: new InitCommand(globalConfig, packageRoot),
      score: new ScoreCommand(globalConfig)
    };
  }

  async executeInit(options) {
    return await this.commands.init.execute(options);
  }

  async executeScore(options) {
    return await this.commands.score.execute(options);
  }

  async detectProjectType() {
    const detector = new ProjectTypeDetector(this.globalConfig.projectRoot);
    return detector.detectProjectType();
  }

  // Legacy command handlers (to be extracted later)
  async executeAdd(options) {
    return await this.addToExistingProject(options);
  }

  async executeValidate(options) {
    return await this.validateProject(options);
  }

  async executeTestMcp(options) {
    return await this.testMCPServer(options);
  }

  async executeServe(options) {
    return await this.serveMCPServer(options);
  }

  async executeGenerate(options) {
    return await this.generatePattern(options);
  }

  async executeUpdate(options) {
    return await this.updateProject(options);
  }

  // Legacy implementations (to be refactored)
  async addToExistingProject(options) {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;
    const inquirer = (await import('inquirer')).default;
    const fs = await import('fs-extra');
    const path = await import('path');

    console.log(chalk.bold.blue('➕ Adding Context7 MCP to existing project'));

    const spinner = ora('Analyzing existing project...').start();

    try {
      // Auto-detect project type if not specified
      let projectType = options.type;
      if (!projectType) {
        projectType = await this.detectProjectType();
        if (projectType) {
          spinner.info(`Detected project type: ${chalk.cyan(projectType)}`);
        } else {
          spinner.stop();
          const { selectedType } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedType',
            message: 'Could not auto-detect project type. Please select:',
            choices: [
              { name: 'React Web Application', value: 'react-webapp' },
              { name: 'Vue.js Web Application', value: 'vue-webapp' },
              { name: 'Node.js API Server', value: 'node-api' },
              { name: 'JavaScript/TypeScript Project', value: 'javascript' }
            ]
          }]);
          projectType = selectedType;
          spinner.start('Configuring project...');
        }
      }

      // Get project metadata from existing package.json
      const packageJsonPath = path.join(this.globalConfig.projectRoot, 'package.json');
      let metadata = {};

      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath);
        metadata = {
          name: packageJson.name || path.basename(this.globalConfig.projectRoot),
          description: packageJson.description || 'Enhanced with Context7 MCP integration',
          version: packageJson.version || '1.0.0'
        };
      } else {
        metadata = {
          name: path.basename(this.globalConfig.projectRoot),
          description: 'Enhanced with Context7 MCP integration',
          version: '1.0.0'
        };
      }

      // Create Context7 configuration
      await this.createContext7Config(projectType, metadata, options.existing);

      // Create MCP server if it doesn't exist
      const mcpServerPath = path.join(this.globalConfig.projectRoot, 'src', 'mcp-server.js');
      if (!await fs.pathExists(mcpServerPath)) {
        await this.createMCPServerFile(projectType);
      }

      // Update/create AGENTS.md
      await this.createOrUpdateAgentsFile(projectType, metadata, options.existing);

      // Update package.json with Context7 scripts
      await this.updatePackageJsonScripts();

      spinner.succeed('Context7 MCP integration added successfully!');

      console.log(chalk.green('\n✅ Integration complete! Run the following to get started:'));
      console.log(chalk.gray('  context7 validate    # Validate project setup'));
      console.log(chalk.gray('  context7 test-mcp    # Test MCP server'));
      console.log(chalk.gray('  context7 score       # Analyze project quality'));

    } catch (error) {
      spinner.fail('Failed to add Context7 MCP integration');
      console.error(chalk.red('Error:'), error.message);
      if (this.globalConfig.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async validateProject(options) {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;
    const { CodeFortifyValidator } = await import('../validation/CodeFortifyValidator.js');

    console.log(chalk.bold.blue('🔍 Validating CodeFortify Project Compliance'));

    const spinner = ora('Running validation checks...').start();

    try {
      const validator = new CodeFortifyValidator(this.globalConfig.projectRoot);
      const results = await validator.validateProject({
        strict: options.strict,
        autoFix: options.fix
      });

      spinner.stop();

      // Display results
      console.log(`\n${chalk.bold('Validation Results:')}`);

      if (results.isValid) {
        console.log(chalk.green('✅ Project is CodeFortify compliant!'));
      } else {
        console.log(chalk.red('❌ Project has compliance issues:'));
        results.errors.forEach(error => {
          console.log(`  ${chalk.red('•')} ${error}`);
        });
      }

      if (results.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        results.warnings.forEach(warning => {
          console.log(`  ${chalk.yellow('•')} ${warning}`);
        });
      }

      if (options.withScore) {
        console.log(chalk.gray('\n' + '─'.repeat(50)));
        await this.executeScore({ format: 'console', detailed: true });
      }

      if (!results.isValid) {
        process.exit(1);
      }

    } catch (error) {
      spinner.fail('Validation failed');
      console.error(chalk.red('Error:'), error.message);
      if (this.globalConfig.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async testMCPServer(options) {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;
    const { MCPConnectionTester } = await import('../testing/MCPTester.js');

    console.log(chalk.bold.blue('🧪 Testing MCP Server Functionality'));

    const spinner = ora('Starting MCP server test...').start();

    try {
      const tester = new MCPConnectionTester({
        serverPath: options.server,
        verbose: this.globalConfig.verbose
      });

      const results = await tester.runTests();

      spinner.stop();

      // Display test results
      console.log(`\n${chalk.bold('MCP Server Test Results:')}`);

      if (results.success) {
        console.log(chalk.green('✅ All tests passed!'));
      } else {
        console.log(chalk.red('❌ Some tests failed:'));
      }

      // Show detailed results
      results.tests.forEach(test => {
        const status = test.passed ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${status} ${test.name}`);

        if (!test.passed && test.error) {
          console.log(`    ${chalk.red('Error:')} ${test.error}`);
        }
      });

      if (results.server) {
        console.log(`\n${chalk.blue('Server Information:')}`);
        console.log(`  Resources: ${results.server.resources?.length || 0}`);
        console.log(`  Tools: ${results.server.tools?.length || 0}`);
        console.log(`  Prompts: ${results.server.prompts?.length || 0}`);
      }

      if (!results.success) {
        process.exit(1);
      }

    } catch (error) {
      spinner.fail('MCP server test failed');
      console.error(chalk.red('Error:'), error.message);
      if (this.globalConfig.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  // Additional legacy methods would be implemented here...
  async serveMCPServer(options) {
    throw new Error('Serve command not yet implemented');
  }

  async generatePattern(options) {
    throw new Error('Generate command not yet implemented');
  }

  async updateProject(options) {
    throw new Error('Update command not yet implemented');
  }
}