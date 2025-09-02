/**
 * Agent Initialization Command
 *
 * Fast initialization command for new AI agents working on the CodeFortify project.
 * Provides essential project information, current status, and quick commands.
 */

import path from 'path';
import fs from 'fs-extra';

export class AgentInitCommand {
  constructor(globalConfig, packageRoot) {
    this.globalConfig = globalConfig;
    this.packageRoot = packageRoot;
  }

  async execute(options) {
    const chalk = (await import('chalk')).default;
    const ora = (await import('ora')).default;

    const spinner = ora('🤖 Initializing agent context...').start();

    try {
      // Gather essential project information
      const projectInfo = await this.gatherProjectInfo();
      const currentStatus = await this.getCurrentStatus();
      const quickCommands = this.getQuickCommands();
      const essentialFiles = await this.getEssentialFiles();

      spinner.succeed('Agent initialization complete');

      // Format and display output based on options
      if (options.format === 'json') {
        const output = {
          projectInfo,
          currentStatus,
          quickCommands,
          essentialFiles,
          timestamp: new Date().toISOString()
        };

        if (options.output) {
          await fs.writeFile(options.output, JSON.stringify(output, null, 2));
          console.log(chalk.green(`✅ Agent initialization saved to: ${options.output}`));
        } else {
          console.log(JSON.stringify(output, null, 2));
        }
      } else if (options.format === 'markdown') {
        const markdown = this.generateMarkdown(projectInfo, currentStatus, quickCommands, essentialFiles);

        if (options.output) {
          await fs.writeFile(options.output, markdown);
          console.log(chalk.green(`✅ Agent initialization saved to: ${options.output}`));
        } else {
          console.log(markdown);
        }
      } else {
        // Console format (default)
        this.displayConsoleOutput(projectInfo, currentStatus, quickCommands, essentialFiles, options, chalk);
      }

    } catch (error) {
      spinner.fail('Failed to initialize agent context');
      console.error(chalk.red('Error:'), error.message);

      if (this.globalConfig.verbose) {
        console.error(error.stack);
      }
    }
  }

  async gatherProjectInfo() {
    const packageJsonPath = path.join(this.globalConfig.projectRoot, 'package.json');
    const configPath = path.join(this.globalConfig.projectRoot, 'codefortify.config.js');

    let projectInfo = {
      name: 'CodeFortify',
      type: 'AI-powered code enhancement tool',
      version: 'Unknown'
    };

    try {
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        projectInfo = {
          name: packageJson.name || 'CodeFortify',
          type: packageJson.description || 'AI-powered code enhancement tool',
          version: packageJson.version || 'Unknown'
        };
      }

      // Check if CodeFortify config exists
      projectInfo.hasConfig = await fs.pathExists(configPath);
      projectInfo.projectRoot = this.globalConfig.projectRoot;

    } catch (error) {
      // Use defaults if reading fails
    }

    return projectInfo;
  }

  async getCurrentStatus() {
    const statusPath = path.join(this.globalConfig.projectRoot, '.codefortify', 'status.json');

    let status = {
      active: false,
      phase: 'inactive',
      score: null,
      lastActivity: null
    };

    try {
      if (await fs.pathExists(statusPath)) {
        const statusData = JSON.parse(await fs.readFile(statusPath, 'utf8'));
        status = {
          active: true,
          phase: statusData.globalStatus?.phase || 'unknown',
          score: statusData.score?.currentScore || null,
          lastActivity: statusData.globalStatus?.lastUpdate || statusData.timestamp || null
        };
      }
    } catch (error) {
      // Use defaults if reading fails
    }

    return status;
  }

  getQuickCommands() {
    return {
      essential: [
        'npm run score',
        'npm run lint',
        'npm test'
      ],
      codefortify: [
        'npx codefortify score --detailed --recommendations',
        'npx codefortify validate --fix',
        'npx codefortify enhance --iterations 3',
        'npx codefortify dashboard'
      ],
      development: [
        'npm install',
        'npm run dev',
        'npm run build'
      ]
    };
  }

  async getEssentialFiles() {
    const files = [
      'README.md',
      'AGENTS.md',
      'CLAUDE.md',
      'package.json',
      'codefortify.config.js',
      'src/index.js',
      'src/cli/CommandCoordinator.js'
    ];

    const essentialFiles = [];

    for (const file of files) {
      const filePath = path.join(this.globalConfig.projectRoot, file);
      if (await fs.pathExists(filePath)) {
        const stats = await fs.stat(filePath);
        essentialFiles.push({
          path: file,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
    }

    return essentialFiles;
  }

  displayConsoleOutput(projectInfo, currentStatus, quickCommands, essentialFiles, options, chalk) {
    console.log(chalk.cyan('🤖 CodeFortify Agent Initialization'));
    console.log('═'.repeat(60));

    // Project Overview
    console.log(chalk.bold('\n📋 Project Overview'));
    console.log(`Name: ${chalk.green(projectInfo.name)}`);
    console.log(`Type: ${projectInfo.type}`);
    console.log(`Version: ${projectInfo.version}`);
    console.log(`Root: ${chalk.gray(projectInfo.projectRoot)}`);
    console.log(`Config: ${projectInfo.hasConfig ? chalk.green('✅ Found') : chalk.yellow('⚠️  Missing')}`);

    // Current Status
    console.log(chalk.bold('\n📊 Current Status'));
    if (currentStatus.active) {
      console.log(`Status: ${chalk.green('🟢 Active')}`);
      console.log(`Phase: ${chalk.blue(currentStatus.phase)}`);
      if (currentStatus.score) {
        const scoreColor = currentStatus.score >= 80 ? chalk.green :
          currentStatus.score >= 70 ? chalk.yellow : chalk.red;
        console.log(`Score: ${scoreColor(currentStatus.score)}/100`);
      }
      if (currentStatus.lastActivity) {
        console.log(`Last Activity: ${chalk.gray(new Date(currentStatus.lastActivity).toLocaleString())}`);
      }
    } else {
      console.log(`Status: ${chalk.gray('⚫ Inactive')}`);
    }

    // Quick Commands (always show essential, conditionally show others)
    if (options.quick) {
      console.log(chalk.bold('\n⚡ Quick Start Commands'));
      quickCommands.essential.forEach(cmd => {
        console.log(`  ${chalk.gray('$')} ${chalk.white(cmd)}`);
      });
    } else {
      console.log(chalk.bold('\n⚡ Essential Commands'));
      quickCommands.essential.forEach(cmd => {
        console.log(`  ${chalk.gray('$')} ${chalk.white(cmd)}`);
      });

      console.log(chalk.bold('\n🚀 CodeFortify Commands'));
      quickCommands.codefortify.forEach(cmd => {
        console.log(`  ${chalk.gray('$')} ${chalk.cyan(cmd)}`);
      });

      if (options.detailed) {
        console.log(chalk.bold('\n🛠️  Development Commands'));
        quickCommands.development.forEach(cmd => {
          console.log(`  ${chalk.gray('$')} ${chalk.white(cmd)}`);
        });

        console.log(chalk.bold('\n📁 Essential Files'));
        essentialFiles.forEach(file => {
          const sizeKB = Math.round(file.size / 1024);
          console.log(`  ${chalk.white(file.path)} ${chalk.gray(`(${sizeKB}KB)`)}`);
        });
      }
    }

    // Next Steps
    console.log(chalk.bold('\n🎯 Recommended Next Steps'));
    if (!currentStatus.active) {
      console.log(`  1. ${chalk.cyan('npx codefortify score')} - Get current project quality score`);
      console.log(`  2. ${chalk.cyan('npx codefortify validate')} - Check project compliance`);
      console.log(`  3. ${chalk.cyan('npx codefortify enhance')} - Start improvement cycle`);
    } else {
      console.log(`  1. ${chalk.cyan('npx codefortify status --detailed')} - Check current progress`);
      console.log(`  2. ${chalk.cyan('npx codefortify dashboard')} - Open real-time dashboard`);
      console.log('  3. Review active enhancement suggestions');
    }

    console.log(chalk.gray('\n💡 Tip: Use --detailed flag for comprehensive project analysis'));
    console.log(chalk.gray('📚 Documentation: README.md, AGENTS.md, CLAUDE.md'));
  }

  generateMarkdown(projectInfo, currentStatus, quickCommands, essentialFiles) {
    const timestamp = new Date().toISOString();

    return `# CodeFortify Agent Initialization

*Generated: ${timestamp}*

## 📋 Project Overview

- **Name**: ${projectInfo.name}
- **Type**: ${projectInfo.type}
- **Version**: ${projectInfo.version}
- **Root**: \`${projectInfo.projectRoot}\`
- **Config**: ${projectInfo.hasConfig ? '✅ Found' : '⚠️ Missing'}

## 📊 Current Status

- **Status**: ${currentStatus.active ? '🟢 Active' : '⚫ Inactive'}
- **Phase**: ${currentStatus.phase}
${currentStatus.score ? `- **Score**: ${currentStatus.score}/100` : ''}
${currentStatus.lastActivity ? `- **Last Activity**: ${new Date(currentStatus.lastActivity).toLocaleString()}` : ''}

## ⚡ Quick Commands

### Essential Commands
${quickCommands.essential.map(cmd => `- \`${cmd}\``).join('\n')}

### CodeFortify Commands  
${quickCommands.codefortify.map(cmd => `- \`${cmd}\``).join('\n')}

### Development Commands
${quickCommands.development.map(cmd => `- \`${cmd}\``).join('\n')}

## 📁 Essential Files

${essentialFiles.map(file => {
    const sizeKB = Math.round(file.size / 1024);
    return `- \`${file.path}\` (${sizeKB}KB)`;
  }).join('\n')}

## 🎯 Recommended Next Steps

${!currentStatus.active ? `
1. \`npx codefortify score\` - Get current project quality score
2. \`npx codefortify validate\` - Check project compliance  
3. \`npx codefortify enhance\` - Start improvement cycle
` : `
1. \`npx codefortify status --detailed\` - Check current progress
2. \`npx codefortify dashboard\` - Open real-time dashboard
3. Review active enhancement suggestions
`}

## 💡 Tips

- Use \`--detailed\` flag for comprehensive project analysis
- Documentation: README.md, AGENTS.md, CLAUDE.md
- For help: \`npx codefortify --help\`
`;
  }
}
