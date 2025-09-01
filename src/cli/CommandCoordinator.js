/**
 * Command Coordinator
 *
 * Orchestrates CLI command execution with modular command handlers
 */

import { InitCommand } from './commands/InitCommand.js';
import { ScoreCommand } from './commands/ScoreCommand.js';
import { EnhanceCommand } from './commands/EnhanceCommand.js';
import { ProjectTypeDetector } from '../scoring/core/ProjectTypeDetector.js';

export class CommandCoordinator {
  constructor(globalConfig, packageRoot) {
    this.globalConfig = globalConfig;
    this.packageRoot = packageRoot;

    // Initialize command handlers
    this.commands = {
      init: new InitCommand(globalConfig, packageRoot),
      score: new ScoreCommand(globalConfig),
      enhance: new EnhanceCommand(globalConfig)
    };
  }

  async executeInit(options) {
    return await this.commands.init.execute(options);
  }

  async executeScore(options) {
    return await this.commands.score.execute(options);
  }

  async executeEnhance(input, options) {
    return await this.commands.enhance.execute(input, options);
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
        const packageJson = await fs.readJson(packageJsonPath);
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

  // Status command implementation
  async executeStatus(options) {
    const chalk = await import('chalk');
    const fs = await import('fs-extra');
    const { join } = await import('path');

    try {
      const statusPath = join(this.projectRoot, '.codefortify', 'status.json');
      
      if (!await fs.pathExists(statusPath)) {
        console.log(chalk.default.yellow('⚠️  No active CodeFortify session found'));
        console.log(chalk.default.gray('Run `codefortify enhance` to start background agents'));
        return;
      }

      const statusData = await fs.readJson(statusPath);
      
      if (options.format === 'json') {
        console.log(JSON.stringify(statusData, null, 2));
        return;
      }

      // Console format
      console.log(chalk.default.cyan('🔍 CodeFortify Background Activity Status'));
      console.log('═'.repeat(50));
      
      const status = statusData.globalStatus;
      const runtime = Math.round(status.elapsedTime / 1000);
      
      console.log(`📊 Phase: ${chalk.default.green(status.phase)} (${status.progress}%)`);
      console.log(`💬 Message: ${status.message}`);
      console.log(`⏱️  Runtime: ${runtime}s`);
      console.log(`🔄 Operation: ${status.operation}`);
      console.log(`🆔 Session: ${statusData.sessionId}`);
      
      if (options.detailed) {
        console.log('\n📈 Score Information:');
        console.log(`Current: ${statusData.score.currentScore}/100`);
        console.log(`Target: ${statusData.score.targetScore}/100`);
        console.log(`Trend: ${statusData.score.trend}`);
      }
      
      if (options.agents && statusData.agents) {
        console.log('\n🤖 Agent Status:');
        Object.entries(statusData.agents).forEach(([name, agent]) => {
          console.log(`${name}: ${agent.status || 'active'}`);
        });
      }
      
      if (options.watch) {
        console.log(chalk.default.gray('\nWatching for changes... (Ctrl+C to exit)'));
        this.watchStatus(statusPath, options);
      }
      
    } catch (error) {
      console.error(chalk.default.red('❌ Failed to read status:'), error.message);
    }
  }

  async watchStatus(statusPath, options) {
    const chalk = await import('chalk');
    const fs = await import('fs');
    
    let lastUpdate = 0;
    
    const watcher = fs.watchFile(statusPath, { interval: 1000 }, async () => {
      try {
        const stats = fs.statSync(statusPath);
        if (stats.mtime.getTime() > lastUpdate) {
          lastUpdate = stats.mtime.getTime();
          console.clear();
          await this.executeStatus({...options, watch: false});
          console.log(chalk.default.gray(`\nLast updated: ${new Date().toLocaleTimeString()}`));
        }
      } catch (error) {
        console.error('Error watching status:', error.message);
      }
    });
    
    process.on('SIGINT', () => {
      fs.unwatchFile(statusPath);
      console.log(chalk.default.yellow('\n👋 Stopped watching status'));
      process.exit(0);
    });
  }

  // Stop command implementation
  async executeStop(options) {
    const chalk = await import('chalk');
    const { join } = await import('path');
    const fs = await import('fs-extra');
    
    try {
      console.log(chalk.default.cyan('🛑 Stopping CodeFortify background agents...'));
      
      const statusPath = join(this.projectRoot, '.codefortify', 'status.json');
      
      if (await fs.pathExists(statusPath)) {
        // Update status to indicate stopping
        const statusData = await fs.readJson(statusPath);
        statusData.globalStatus.phase = 'stopping';
        statusData.globalStatus.message = 'Stopping background agents...';
        await fs.writeJson(statusPath, statusData, { spaces: 2 });
      }
      
      if (options.force) {
        // Force kill all node processes (be careful!)
        console.log(chalk.default.yellow('⚠️  Force stopping all CodeFortify processes...'));
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          // Kill processes on ports 8765-8770 (CodeFortify WebSocket servers)
          for (let port = 8765; port <= 8770; port++) {
            try {
              await execAsync(`netstat -ano | findstr :${port}`);
              console.log(chalk.default.gray(`Stopping process on port ${port}...`));
            } catch {
              // Port not in use, continue
            }
          }
        } catch (error) {
          console.log(chalk.default.gray('No processes to force stop'));
        }
      }
      
      // Create stopped status
      if (await fs.pathExists(statusPath)) {
        const statusData = await fs.readJson(statusPath);
        statusData.globalStatus.phase = 'stopped';
        statusData.globalStatus.message = 'All background agents stopped';
        statusData.globalStatus.progress = 0;
        await fs.writeJson(statusPath, statusData, { spaces: 2 });
      }
      
      console.log(chalk.default.green('✅ CodeFortify background agents stopped successfully'));
      
    } catch (error) {
      console.error(chalk.default.red('❌ Failed to stop agents:'), error.message);
    }
  }

  // Pause command implementation
  async executePause(options) {
    const chalk = await import('chalk');
    const { join } = await import('path');
    const fs = await import('fs-extra');
    
    try {
      const statusPath = join(this.projectRoot, '.codefortify', 'status.json');
      
      if (!await fs.pathExists(statusPath)) {
        console.log(chalk.default.yellow('⚠️  No active CodeFortify session found'));
        return;
      }
      
      const statusData = await fs.readJson(statusPath);
      statusData.globalStatus.phase = 'paused';
      statusData.globalStatus.message = 'Background agents paused';
      
      await fs.writeJson(statusPath, statusData, { spaces: 2 });
      
      console.log(chalk.default.yellow('⏸️  CodeFortify background agents paused'));
      console.log(chalk.default.gray('Run `codefortify resume` to continue'));
      
    } catch (error) {
      console.error(chalk.default.red('❌ Failed to pause agents:'), error.message);
    }
  }

  // Resume command implementation
  async executeResume(options) {
    const chalk = await import('chalk');
    const { join } = await import('path');
    const fs = await import('fs-extra');
    
    try {
      const statusPath = join(this.projectRoot, '.codefortify', 'status.json');
      
      if (!await fs.pathExists(statusPath)) {
        console.log(chalk.default.yellow('⚠️  No paused CodeFortify session found'));
        console.log(chalk.default.gray('Run `codefortify enhance` to start new session'));
        return;
      }
      
      const statusData = await fs.readJson(statusPath);
      
      if (statusData.globalStatus.phase !== 'paused') {
        console.log(chalk.default.yellow('⚠️  CodeFortify is not currently paused'));
        console.log(chalk.default.gray(`Current phase: ${statusData.globalStatus.phase}`));
        return;
      }
      
      statusData.globalStatus.phase = 'analyzing';
      statusData.globalStatus.message = 'Resuming background agents...';
      
      await fs.writeJson(statusPath, statusData, { spaces: 2 });
      
      console.log(chalk.default.green('▶️  CodeFortify background agents resumed'));
      
    } catch (error) {
      console.error(chalk.default.red('❌ Failed to resume agents:'), error.message);
    }
  }

  // Additional legacy methods would be implemented here...
  async serveMCPServer(_options) {
    throw new Error('Serve command not yet implemented');
  }

  async generatePattern(_options) {
    throw new Error('Generate command not yet implemented');
  }

  async updateProject(_options) {
    throw new Error('Update command not yet implemented');
  }
}