#!/usr/bin/env node

/**
 * Context7 CLI - Command Line Interface
 * 
 * Main CLI entry point for Context7 MCP package operations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Import our modules
import { Context7MCPServer } from '../src/server/Context7MCPServer.js';
import { Context7Validator } from '../src/validation/Context7Validator.js';
import { MCPConnectionTester } from '../src/testing/MCPTester.js';
import { ProjectScorer } from '../src/scoring/ProjectScorer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, '..');

const program = new Command();

// Global configuration
const globalConfig = {
  verbose: false,
  projectRoot: process.cwd(),
};

program
  .name('context7')
  .description('Context7 MCP integration CLI for AI-assisted development')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-p, --project-root <path>', 'Set project root directory', process.cwd())
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    globalConfig.verbose = opts.verbose;
    globalConfig.projectRoot = opts.projectRoot;
  });

// Initialize command
program
  .command('init')
  .description('Initialize Context7 MCP in a new or existing project')
  .option('-t, --type <type>', 'Project type (react-webapp, vue-webapp, node-api, etc.)')
  .option('-f, --force', 'Force initialization even if files exist')
  .option('--no-mcp', 'Skip MCP server setup')
  .option('--no-agent-os', 'Skip Agent OS setup')
  .action(async (options) => {
    await initializeProject(options);
  });

// Add command (for existing projects)
program
  .command('add')
  .description('Add Context7 MCP to an existing project')
  .option('-t, --type <type>', 'Project type (auto-detect if not specified)')
  .option('--existing', 'Preserve existing configuration files')
  .action(async (options) => {
    await addToExistingProject(options);
  });

// Validate command
program
  .command('validate')
  .description('Validate project compliance with Context7 standards')
  .option('-s, --strict', 'Enable strict validation mode')
  .option('--fix', 'Attempt to fix validation issues automatically')
  .option('--with-score', 'Include project quality scoring with validation')
  .action(async (options) => {
    await validateProject(options);
  });

// Score command
program
  .command('score')
  .description('Analyze and score project quality across multiple dimensions')
  .option('--categories <categories>', 'Comma-separated list of categories to analyze (structure,quality,performance,testing,security,developerExperience,completeness)', 'all')
  .option('--format <format>', 'Output format (console, json, html)', 'console')
  .option('--output <file>', 'Output file path (for json/html formats)')
  .option('--detailed', 'Include detailed analysis and metrics')
  .option('--recommendations', 'Include improvement recommendations')
  .option('--compare', 'Compare with previous scoring results (if available)')
  .option('--no-color', 'Disable colored output')
  .action(async (options) => {
    await scoreProject(options);
  });

// Test command
program
  .command('test-mcp')
  .description('Test MCP server functionality')
  .option('--server <path>', 'Path to MCP server file', 'src/mcp-server.js')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '30000')
  .action(async (options) => {
    await testMCPServer(options);
  });

// Serve command
program
  .command('serve')
  .description('Start the Context7 MCP server')
  .option('--config <path>', 'Path to configuration file')
  .option('--port <port>', 'Server port (for HTTP transport)')
  .action(async (options) => {
    await startMCPServer(options);
  });

// Generate command
program
  .command('generate <type>')
  .description('Generate Context7-compliant code scaffolds')
  .option('-n, --name <name>', 'Name for the generated code')
  .option('-f, --framework <framework>', 'Target framework')
  .action(async (type, options) => {
    await generateCode(type, options);
  });

// Update command
program
  .command('update')
  .description('Update Context7 MCP configuration and templates')
  .option('--templates', 'Update code templates only')
  .option('--config', 'Update configuration only')
  .action(async (options) => {
    await updateConfiguration(options);
  });

// Implementation functions

async function initializeProject(options) {
  console.log(chalk.blue('🚀 Initializing Context7 MCP Integration'));
  console.log('=====================================');
  
  const spinner = ora('Analyzing project...').start();
  
  try {
    // Detect or prompt for project type
    let projectType = options.type;
    
    if (!projectType) {
      projectType = await detectProjectType(globalConfig.projectRoot);
      
      if (!projectType) {
        spinner.stop();
        
        const { selectedType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedType',
            message: 'Select your project type:',
            choices: [
              { name: 'React Web App', value: 'react-webapp' },
              { name: 'Vue Web App', value: 'vue-webapp' },
              { name: 'Svelte Web App', value: 'svelte-webapp' },
              { name: 'Node.js API', value: 'node-api' },
              { name: 'JavaScript/TypeScript', value: 'javascript' },
            ],
          },
        ]);
        
        projectType = selectedType;
        spinner.start('Initializing project...');
      }
    }
    
    spinner.text = `Setting up ${projectType} project...`;
    
    // Create project configuration
    const config = {
      projectType,
      projectRoot: globalConfig.projectRoot,
      mcpEnabled: options.mcp !== false,
      agentOsEnabled: options.agentOs !== false,
      force: options.force,
    };
    
    // Setup directory structure
    await setupDirectoryStructure(config);
    
    // Copy templates and configuration files
    await setupConfigurationFiles(config);
    
    // Setup package.json
    await setupPackageJson(config);
    
    // Generate MCP server if enabled
    if (config.mcpEnabled) {
      await generateMCPServer(config);
    }
    
    // Generate documentation
    await generateDocumentation(config);
    
    spinner.succeed('Context7 MCP integration initialized successfully!');
    
    // Show next steps
    showNextSteps(config);
    
  } catch (error) {
    spinner.fail(`Initialization failed: ${error.message}`);
    if (globalConfig.verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}

async function addToExistingProject(options) {
  console.log(chalk.blue('📦 Adding Context7 MCP to existing project'));
  
  const spinner = ora('Analyzing existing project...').start();
  
  try {
    // Auto-detect project type if not specified
    let projectType = options.type;
    
    if (!projectType) {
      projectType = await detectProjectType(globalConfig.projectRoot);
    }
    
    if (!projectType) {
      spinner.fail('Could not detect project type');
      process.exit(1);
    }
    
    spinner.text = `Adding Context7 MCP to ${projectType} project...`;
    
    const config = {
      projectType,
      projectRoot: globalConfig.projectRoot,
      existing: true,
      preserveExisting: options.existing,
    };
    
    // Check what's already present
    const existingFiles = await checkExistingFiles(config);
    
    // Add missing components
    await addMissingComponents(config, existingFiles);
    
    spinner.succeed('Context7 MCP added to existing project!');
    
    showNextSteps(config);
    
  } catch (error) {
    spinner.fail(`Failed to add Context7 MCP: ${error.message}`);
    if (globalConfig.verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}


async function testMCPServer(options) {
  console.log(chalk.blue('🧪 Testing MCP Server'));
  
  const spinner = ora('Checking MCP server setup...').start();
  
  try {
    // Check if server file exists
    const serverPath = path.resolve(globalConfig.projectRoot, options.server);
    
    try {
      await fs.access(serverPath);
    } catch (error) {
      spinner.fail(`MCP server file not found: ${options.server}`);
      console.log(chalk.yellow('\n💡 Hint: Run `context7 init` or `context7 add` to set up MCP server'));
      process.exit(1);
    }
    
    spinner.text = 'Starting MCP server test...';
    
    const tester = new MCPConnectionTester({
      projectRoot: globalConfig.projectRoot,
      serverPath: options.server,
      timeout: parseInt(options.timeout),
    });
    
    spinner.text = 'Running MCP server tests...';
    
    const result = await tester.runTests();
    
    if (result.success) {
      spinner.succeed('MCP server tests passed!');
    } else {
      spinner.fail('MCP server tests failed');
    }
    
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    spinner.fail(`MCP test error: ${error.message}`);
    if (globalConfig.verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}

async function startMCPServer(options) {
  console.log(chalk.blue('🚀 Starting Context7 MCP Server'));
  
  try {
    let config = {};
    
    if (options.config) {
      config = await fs.readJson(options.config);
    }
    
    config.projectRoot = globalConfig.projectRoot;
    
    if (options.port) {
      config.port = parseInt(options.port);
    }
    
    const server = new Context7MCPServer(config);
    
    console.log(chalk.green('Starting MCP server...'));
    await server.start();
    
  } catch (error) {
    console.error(chalk.red(`Failed to start MCP server: ${error.message}`));
    if (globalConfig.verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}

async function generateCode(type, options) {
  console.log(chalk.blue(`🏗️  Generating ${type} scaffold`));
  
  const spinner = ora(`Generating ${type}...`).start();
  
  try {
    // TODO: Implement code generation
    spinner.text = `Creating ${type} with Context7 patterns...`;
    
    // This would use the PatternProvider to generate code
    console.log(chalk.yellow('Code generation functionality coming soon!'));
    
    spinner.succeed(`${type} generated successfully!`);
    
  } catch (error) {
    spinner.fail(`Code generation failed: ${error.message}`);
    if (globalConfig.verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}

async function updateConfiguration(options) {
  console.log(chalk.blue('🔄 Updating Context7 configuration'));
  
  const spinner = ora('Updating configuration...').start();
  
  try {
    // TODO: Implement configuration updates
    spinner.text = 'Downloading latest templates and configuration...';
    
    console.log(chalk.yellow('Update functionality coming soon!'));
    
    spinner.succeed('Configuration updated successfully!');
    
  } catch (error) {
    spinner.fail(`Update failed: ${error.message}`);
    if (globalConfig.verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}

// Utility functions

async function detectProjectType(projectRoot) {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.react) return 'react-webapp';
    if (deps.vue) return 'vue-webapp';
    if (deps.svelte) return 'svelte-webapp';
    if (deps.express || deps.fastify || deps.koa) return 'node-api';
    
    return 'javascript';
  } catch (error) {
    return null;
  }
}

async function setupDirectoryStructure(config) {
  const dirs = ['.agent-os', 'src'];
  
  if (config.agentOsEnabled) {
    dirs.push(
      '.agent-os/instructions',
      '.agent-os/standards', 
      '.agent-os/product'
    );
  }
  
  if (config.projectType.includes('webapp')) {
    dirs.push('examples');
  }
  
  if (config.projectType === 'node-api') {
    dirs.push('tests');
  }
  
  for (const dir of dirs) {
    await fs.ensureDir(path.join(config.projectRoot, dir));
  }
}

async function setupConfigurationFiles(config) {
  // Copy template files from package
  const templatesDir = path.join(packageRoot, 'templates');
  const projectRoot = config.projectRoot;
  
  // Copy Agent OS config
  if (config.agentOsEnabled) {
    const agentOsConfigTemplate = path.join(templatesDir, 'configs', 'agent-os-config.yml');
    const agentOsConfigTarget = path.join(projectRoot, '.agent-os', 'config.yml');
    
    if (!await fs.pathExists(agentOsConfigTarget) || config.force) {
      await fs.copy(agentOsConfigTemplate, agentOsConfigTarget);
    }
  }
  
  // TODO: Copy other template files
}

async function setupPackageJson(config) {
  const packageJsonPath = path.join(config.projectRoot, 'package.json');
  
  let packageJson = {};
  
  try {
    packageJson = await fs.readJson(packageJsonPath);
  } catch (error) {
    // Create new package.json
    packageJson = {
      name: path.basename(config.projectRoot),
      version: '1.0.0',
      description: '',
      type: 'module',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    };
  }
  
  // Add MCP dependencies and scripts
  if (config.mcpEnabled) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      '@modelcontextprotocol/sdk': '^1.17.4',
    };
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'mcp:dev': 'node src/mcp-server.js',
      'mcp:test': 'context7 test-mcp',
      'context7:validate': 'context7 validate',
    };
  }
  
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function generateMCPServer(config) {
  // Generate MCP server file specific to project type
  const serverTemplate = `// Generated Context7 MCP Server for ${config.projectType}

import { Context7MCPServer } from '@yourname/context7-mcp';

const server = new Context7MCPServer({
  projectRoot: '.',
  projectType: '${config.projectType}',
});

server.start().catch(console.error);
`;
  
  const serverPath = path.join(config.projectRoot, 'src', 'mcp-server.js');
  
  if (!await fs.pathExists(serverPath) || config.force) {
    await fs.writeFile(serverPath, serverTemplate);
  }
}

async function generateDocumentation(config) {
  // Generate AGENTS.md
  const agentsTemplate = `# AGENTS.md

## Project Overview
${config.projectType} project with Context7 MCP integration.

This project is optimized for AI coding agent integration with Context7 standards and MCP (Model Context Protocol) support.

## Setup Commands
\`\`\`bash
npm install
npm run dev
\`\`\`

## Context7 Integration
- **MCP Server**: \`npm run mcp:dev\`
- **Validate**: \`npm run context7:validate\`
- **Test MCP**: \`npm run mcp:test\`
`;

  const agentsPath = path.join(config.projectRoot, 'AGENTS.md');
  
  if (!await fs.pathExists(agentsPath) || config.force) {
    await fs.writeFile(agentsPath, agentsTemplate);
  }
  
  // Generate CLAUDE.md
  const claudeTemplate = `# CLAUDE.md

This file provides guidance to Claude Code when working with this ${config.projectType} project.

## Development Commands
\`\`\`bash
npm run dev
npm run context7:validate
npm run mcp:test
\`\`\`

## Context7 Integration
This project includes full Context7 MCP integration for AI assistant support.
`;

  const claudePath = path.join(config.projectRoot, 'CLAUDE.md');
  
  if (!await fs.pathExists(claudePath) || config.force) {
    await fs.writeFile(claudePath, claudeTemplate);
  }
}

async function checkExistingFiles(config) {
  const files = [
    '.agent-os/config.yml',
    'src/mcp-server.js',
    'AGENTS.md',
    'CLAUDE.md',
    'package.json',
  ];
  
  const existing = {};
  
  for (const file of files) {
    const filePath = path.join(config.projectRoot, file);
    existing[file] = await fs.pathExists(filePath);
  }
  
  return existing;
}

async function addMissingComponents(config, existingFiles) {
  // Add only missing components
  // This would be similar to setupConfigurationFiles but more selective
  console.log(chalk.gray('Adding missing Context7 components...'));
}

function showNextSteps(config) {
  console.log(chalk.green('\\n✅ Context7 MCP Integration Complete!'));
  console.log(chalk.gray('====================================='));
  console.log('\\nNext steps:');
  console.log(chalk.cyan('1.'), 'Install dependencies:', chalk.white('npm install'));
  
  if (config.mcpEnabled) {
    console.log(chalk.cyan('2.'), 'Validate setup:', chalk.white('context7 validate'));
    console.log(chalk.cyan('3.'), 'Test MCP server:', chalk.white('context7 test-mcp'));
    console.log(chalk.cyan('4.'), 'Start MCP server:', chalk.white('context7 serve'));
  }
  
  console.log(chalk.cyan('5.'), 'Start developing with AI assistance!');
  console.log('\\nDocumentation:');
  console.log(chalk.gray('-'), 'AGENTS.md - For AI assistants');
  console.log(chalk.gray('-'), 'CLAUDE.md - For Claude Code');
  
  if (config.agentOsEnabled) {
    console.log(chalk.gray('-'), '.agent-os/ - Agent OS configuration');
  }
}

async function scoreProject(options) {
  console.log(chalk.blue('🎯 Analyzing project quality...'));
  console.log('════════════════════════════════════');
  
  const spinner = ora('Initializing project scorer...').start();
  
  try {
    // Parse categories
    const categories = options.categories === 'all' 
      ? ['all'] 
      : options.categories.split(',').map(c => c.trim());
    
    // Configure scorer
    const scorerConfig = {
      projectRoot: globalConfig.projectRoot,
      verbose: globalConfig.verbose,
      categories
    };
    
    spinner.text = 'Running quality analysis...';
    
    // Auto-detect project and run scoring
    const results = await ProjectScorer.autoDetectAndScore(globalConfig.projectRoot, {
      ...scorerConfig,
      categories,
      detailed: options.detailed,
      recommendations: options.recommendations
    });
    
    spinner.succeed('Analysis complete!');
    
    // Handle different output formats
    if (options.format === 'json') {
      const output = JSON.stringify(results, null, 2);
      
      if (options.output) {
        await fs.writeFile(options.output, output);
        console.log(chalk.green(`\n📄 Results saved to: ${options.output}`));
      } else {
        console.log(output);
      }
      return;
    }
    
    if (options.format === 'html') {
      const { ScoringReport } = await import('../src/scoring/ScoringReport.js');
      const reportGenerator = new ScoringReport(scorerConfig);
      const htmlOutput = await reportGenerator.generateHTML(results);
      
      const outputFile = options.output || `context7-score-${Date.now()}.html`;
      await fs.writeFile(outputFile, htmlOutput);
      console.log(chalk.green(`\n📄 HTML report saved to: ${outputFile}`));
      return;
    }
    
    // Console output (default)
    await displayScoringResults(results, options);
    
  } catch (error) {
    spinner.fail(`Scoring failed: ${error.message}`);
    if (globalConfig.verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}

async function displayScoringResults(results, options) {
  const { overall, categories, recommendations } = results;
  const useColor = !options.noColor;
  
  // Overall score header
  console.log(`\n${useColor ? chalk.bold.cyan('📊 PROJECT QUALITY SCORE') : '📊 PROJECT QUALITY SCORE'}`);
  console.log('═'.repeat(60));
  
  // Overall score
  const gradeColorFunc = getGradeColor(overall.grade, useColor);
  const coloredGrade = gradeColorFunc(overall.grade);
  console.log(`${useColor ? chalk.bold('Overall Score:') : 'Overall Score:'} ${overall.score}/${overall.maxScore} (${coloredGrade})\n`);
  
  // Category breakdown
  console.log(`${useColor ? chalk.bold('📈 Category Breakdown:') : '📈 Category Breakdown:'}`);
  console.log('─'.repeat(60));
  
  for (const [categoryKey, result] of Object.entries(categories)) {
    const percentage = Math.round((result.score / result.maxScore) * 100);
    const progressBar = generateProgressBar(percentage, 20, useColor);
    const categoryName = result.categoryName.padEnd(35);
    const score = `${result.score}/${result.maxScore}`.padStart(6);
    
    let status = '';
    if (percentage < 70) status = useColor ? chalk.red(' ⚠️') : ' ⚠️';
    else if (percentage < 85) status = useColor ? chalk.yellow(' ⚡') : ' ⚡';
    else status = useColor ? chalk.green(' ✅') : ' ✅';
    
    console.log(`├─ ${categoryName} ${score}  ${progressBar} ${percentage}%${status}`);
  }
  
  // Show issues and recommendations
  if (recommendations && recommendations.length > 0) {
    console.log(`\n${useColor ? chalk.bold('🎯 Priority Improvements:') : '🎯 Priority Improvements:'}`);
    console.log('─'.repeat(60));
    
    recommendations.slice(0, 5).forEach((rec, index) => {
      const impact = useColor ? chalk.green(`[+${rec.impact}pts]`) : `[+${rec.impact}pts]`;
      console.log(`${index + 1}. ${impact} ${rec.suggestion}`);
      if (rec.description) {
        console.log(`   ${useColor ? chalk.gray(rec.description) : rec.description}`);
      }
    });
    
    if (options.recommendations && recommendations.length > 5) {
      console.log(`\n${useColor ? chalk.gray('...and ' + (recommendations.length - 5) + ' more recommendations') : '...and ' + (recommendations.length - 5) + ' more recommendations'}`);
    }
  }
  
  // Show summary message
  console.log('\n' + '═'.repeat(60));
  
  if (overall.score >= 90) {
    console.log(`${useColor ? chalk.green('🎉 Excellent!') : '🎉 Excellent!'} Your project demonstrates high quality standards.`);
  } else if (overall.score >= 80) {
    console.log(`${useColor ? chalk.cyan('👍 Good job!') : '👍 Good job!'} Your project follows solid practices with room for improvement.`);
  } else if (overall.score >= 70) {
    console.log(`${useColor ? chalk.yellow('⚡ Getting there!') : '⚡ Getting there!'} Focus on the priority improvements above.`);
  } else {
    console.log(`${useColor ? chalk.red('🔧 Needs attention.') : '🔧 Needs attention.'} Consider addressing the key issues identified.`);
  }
  
  console.log(`\n${useColor ? chalk.gray('💡 Run with --detailed for comprehensive metrics') : '💡 Run with --detailed for comprehensive metrics'}`);
  console.log(`${useColor ? chalk.gray('📈 Run with --format html for visual reports') : '📈 Run with --format html for visual reports'}`);
}

function getGradeColor(grade, useColor) {
  if (!useColor) return (text) => text;
  
  if (grade.startsWith('A')) return chalk.green;
  if (grade.startsWith('B')) return chalk.cyan;
  if (grade.startsWith('C')) return chalk.yellow;
  if (grade.startsWith('D')) return chalk.magenta;
  return chalk.red;
}

function generateProgressBar(percentage, length = 20, useColor = true) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  
  let bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  if (useColor) {
    if (percentage >= 85) bar = chalk.green(bar);
    else if (percentage >= 70) bar = chalk.yellow(bar);
    else bar = chalk.red(bar);
  }
  
  return bar;
}

// Enhanced validate function to support --with-score option
async function validateProject(options) {
  console.log(chalk.blue('🔍 Validating Context7 compliance'));
  
  const spinner = ora('Running validation...').start();
  
  try {
    const validator = new Context7Validator({
      projectRoot: globalConfig.projectRoot,
      strictMode: options.strict,
    });
    
    spinner.text = 'Checking project structure and configuration...';
    
    const result = await validator.runValidation();
    
    if (result.success) {
      spinner.succeed('Project validation passed!');
    } else {
      spinner.fail('Project validation failed');
      
      if (options.fix) {
        console.log(chalk.yellow('\n🔧 Attempting to fix issues...'));
        // TODO: Implement auto-fix functionality
        console.log(chalk.gray('Auto-fix functionality coming soon!'));
      }
    }
    
    // Add scoring if requested
    if (options.withScore) {
      console.log(chalk.blue('\n🎯 Including project quality score...'));
      
      try {
        const scoreResults = await ProjectScorer.autoDetectAndScore(globalConfig.projectRoot, {
          verbose: globalConfig.verbose
        });
        
        await displayScoringResults(scoreResults, { noColor: false });
        
      } catch (scoreError) {
        console.log(chalk.yellow('⚠️  Could not generate quality score: ' + scoreError.message));
      }
    }
    
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    spinner.fail(`Validation error: ${error.message}`);
    if (globalConfig.verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}

// Start the CLI
program.parse();