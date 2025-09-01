#!/usr/bin/env node

/**
 * CodeFortify CLI - Command Line Interface
 *
 * Main CLI entry point for CodeFortify AI-powered development operations
 */

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import path from 'path';

// Import our modular command coordinator
import { CommandCoordinator } from '../src/cli/CommandCoordinator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, '..');

const program = new Command();

// Global configuration
const globalConfig = {
  verbose: false,
  projectRoot: process.cwd()
};

program
  .name('codefortify')
  .description('CodeFortify - AI-powered code strengthening and security enhancement CLI')
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
  .description('Initialize CodeFortify in a new or existing project')
  .option('-t, --type <type>', 'Project type (react-webapp, vue-webapp, node-api, etc.)')
  .option('-f, --force', 'Force initialization even if files exist')
  .option('--auto', 'Auto-detect and initialize without prompts (requires high confidence)')
  .option('--no-mcp', 'Skip MCP server setup')
  .option('--no-agent-os', 'Skip Agent OS setup')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeInit(options);
  });

// Add command (for existing projects)
program
  .command('add')
  .description('Add CodeFortify to an existing project')
  .option('-t, --type <type>', 'Project type (auto-detect if not specified)')
  .option('--existing', 'Preserve existing configuration files')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeAdd(options);
  });

// Validate command
program
  .command('validate')
  .description('Validate project compliance with CodeFortify standards')
  .option('-s, --strict', 'Enable strict validation mode')
  .option('--fix', 'Attempt to fix validation issues automatically')
  .option('--with-score', 'Include project quality scoring with validation')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeValidate(options);
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
  .option('--bundle-analysis', 'Include bundle size and dependency analysis')
  .option('--performance', 'Include detailed performance monitoring')
  .option('--open', 'Automatically open HTML reports in browser')
  .option('--no-color', 'Disable colored output')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeScore(options);
  });

// Enhance command - Revolutionary continuous improvement system
program
  .command('enhance [input]')
  .description('🚀 Continuously enhance code quality with AI-powered iterative improvement')
  .option('-i, --iterations <number>', 'Maximum iterations (default: 5)', '5')
  .option('-t, --target <score>', 'Target quality score (default: 95)', '95')
  .option('-f, --format <format>', 'Output format (console, json, html, markdown)', 'console')
  .option('-o, --output <file>', 'Save results to file')
  .option('--categories <categories>', 'Focus on specific categories (security,quality,performance,testing)', 'all')
  .option('--aggressive', 'Use aggressive enhancement mode')
  .option('--learn', 'Enable pattern learning from improvements')
  .option('--context7', 'Enable Context7 prompt enhancement')
  .option('--fix-lint', 'Automatically fix ESLint issues')
  .option('--test-coverage', 'Focus on improving test coverage')
  .option('--save-metrics', 'Save enhancement metrics for analysis')
  .option('--no-self-measure', 'Disable self-measurement tracking')
  .option('--no-visual-testing', 'Disable visual testing and accessibility checks')
  .option('--browsers <browsers>', 'Comma-separated list of browsers (chromium,firefox,webkit)', 'chromium')
  .option('--visual-threshold <threshold>', 'Visual difference threshold (0.0-1.0)', '0.2')
  .action(async (input, options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeEnhance(input, options);
  });

// Status command
program
  .command('status')
  .description('Show current CodeFortify background activity status')
  .option('--detailed', 'Show detailed status information')
  .option('--agents', 'Show individual agent status')
  .option('--watch', 'Watch status updates in real-time')
  .option('-f, --format <format>', 'Output format (console, json)', 'console')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeStatus(options);
  });

// Dashboard command
program
  .command('dashboard')
  .description('🎨 Display real-time unified CodeFortify dashboard')
  .option('--refresh <ms>', 'Refresh interval in milliseconds', '2000')
  .option('--compact', 'Show compact dashboard view')
  .option('--no-activity', 'Hide activity feed')
  .option('--agents-only', 'Show only agent status')
  .option('--categories-only', 'Show only category scores')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeDashboard(options);
  });

// Stop command
program
  .command('stop')
  .description('Stop all CodeFortify background agents')
  .option('--force', 'Force stop all processes')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeStop(options);
  });

// Pause/Resume commands
program
  .command('pause')
  .description('Pause CodeFortify background agents')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executePause(options);
  });

program
  .command('resume')
  .description('Resume paused CodeFortify background agents')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeResume(options);
  });

// Test command
program
  .command('test-mcp')
  .description('Test MCP server functionality')
  .option('--server <path>', 'Path to MCP server file', 'src/mcp-server.js')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '30000')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeTestMcp(options);
  });

// Serve command
program
  .command('serve')
  .description('Start the CodeFortify MCP server')
  .option('--config <path>', 'Path to configuration file')
  .option('--port <port>', 'Server port (for HTTP transport)')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeServe(options);
  });

// Generate command
program
  .command('generate <type>')
  .description('Generate CodeFortify-compliant code scaffolds')
  .option('-n, --name <name>', 'Name for the generated code')
  .option('-f, --framework <framework>', 'Target framework')
  .action(async (type, options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeGenerate({...options, type});
  });

// Template command
program
  .command('template <action>')
  .description('Manage CodeFortify templates')
  .option('-t, --template <template>', 'Template name')
  .option('-n, --name <name>', 'Project name (for init action)')
  .action(async (action, options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeTemplate(action, options);
  });

// Prompt command - Enhanced prompt generation
program
  .command('prompt')
  .description('🤖 Generate enhanced prompts for code quality recommendations')
  .option('-p, --project <path>', 'Project path to analyze', process.cwd())
  .option('-c, --config <file>', 'Configuration file path')
  .option('-o, --output <format>', 'Output format: json, text, or html', 'text')
  .option('-f, --file <path>', 'Save output to file')
  .option('-t, --test', 'Test prompt generation with sample data')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executePrompt(options);
  });

// Update command
program
  .command('update')
  .description('Update CodeFortify configuration and templates')
  .option('--templates', 'Update code templates only')
  .option('--config', 'Update configuration only')
  .action(async (options) => {
    const coordinator = new CommandCoordinator(globalConfig, packageRoot);
    await coordinator.executeUpdate(options);
  });

// Start the CLI
program.parse();