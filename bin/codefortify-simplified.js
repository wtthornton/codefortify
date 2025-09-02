#!/usr/bin/env node

/**
 * CodeFortify Simplified CLI
 *
 * Consolidated CLI with 5 core commands and standardized options
 * Based on best practices from git, docker, and kubectl
 */

import { Command } from 'commander';
import { CommandCoordinator } from '../src/cli/CommandCoordinator.js';
import { ConfigLoader } from '../src/config/ConfigLoader.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');

// Load global configuration
const configLoader = new ConfigLoader(packageRoot);
const globalConfig = await configLoader.loadConfig();
globalConfig.projectRoot = packageRoot;

// Create command coordinator
const coordinator = new CommandCoordinator(globalConfig, packageRoot);

// Create CLI program
const program = new Command();

program
  .name('codefortify')
  .description('🤖 AI-powered code enhancement and quality analysis')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('-c, --config <file>', 'Use custom config file')
  .option('--no-color', 'Disable colored output')
  .option('--dry-run', 'Show what would be done without executing');

// ============================================================================
// CORE COMMAND 1: SETUP
// ============================================================================
program
  .command('setup')
  .description('🚀 Initialize and configure CodeFortify in your project')
  .option('-t, --type <type>', 'Project type (auto-detect if not specified)')
  .option('-f, --force', 'Force re-initialization')
  .option('--skip-deps', 'Skip dependency installation')
  .option('--skip-config', 'Skip configuration file creation')
  .action(async (options) => {
    const result = await coordinator.executeSetup(options);
    if (result.success) {
      console.log('✅ CodeFortify setup complete!');
    } else {
      console.error('❌ Setup failed:', result.error);
      process.exit(1);
    }
  });

// ============================================================================
// CORE COMMAND 2: ANALYZE
// ============================================================================
program
  .command('analyze')
  .description('📊 Analyze project quality and generate insights')
  .option('-f, --format <format>', 'Output format (console, json, markdown)', 'console')
  .option('-o, --output <file>', 'Save results to file')
  .option('-d, --detailed', 'Include detailed analysis')
  .option('-r, --recommendations', 'Include improvement recommendations')
  .option('--target <score>', 'Target quality score (0-100)')
  .option('--include-tests', 'Include test coverage analysis')
  .option('--include-security', 'Include security analysis')
  .action(async (options) => {
    const result = await coordinator.executeAnalyze(options);
    if (result.success) {
      console.log('✅ Analysis complete!');
    } else {
      console.error('❌ Analysis failed:', result.error);
      process.exit(1);
    }
  });

// ============================================================================
// CORE COMMAND 3: ENHANCE
// ============================================================================
program
  .command('enhance')
  .description('✨ AI-powered iterative code improvement')
  .argument('[files...]', 'Files or directories to enhance')
  .option('-t, --target <score>', 'Target quality score (0-100)', '95')
  .option('-i, --iterations <count>', 'Number of enhancement iterations', '3')
  .option('-f, --format <format>', 'Output format (console, json, markdown)', 'console')
  .option('-o, --output <file>', 'Save results to file')
  .option('--dry-run', 'Show what would be enhanced without making changes')
  .option('--backup', 'Create backup before enhancement')
  .option('--exclude <pattern>', 'Exclude files matching pattern')
  .action(async (files, options) => {
    const result = await coordinator.executeEnhance(files, options);
    if (result.success) {
      console.log('✅ Enhancement complete!');
    } else {
      console.error('❌ Enhancement failed:', result.error);
      process.exit(1);
    }
  });

// ============================================================================
// CORE COMMAND 4: MONITOR
// ============================================================================
program
  .command('monitor')
  .description('📈 Monitor and manage CodeFortify agents')
  .option('-s, --start', 'Start monitoring agents')
  .option('-p, --pause', 'Pause monitoring agents')
  .option('-r, --resume', 'Resume paused agents')
  .option('-k, --stop', 'Stop all agents')
  .option('-d, --dashboard', 'Open monitoring dashboard')
  .option('-f, --format <format>', 'Output format (console, json, markdown)', 'console')
  .option('-o, --output <file>', 'Save status to file')
  .option('--port <port>', 'Dashboard port', '8765')
  .option('--interval <seconds>', 'Status check interval', '30')
  .action(async (options) => {
    const result = await coordinator.executeMonitor(options);
    if (result.success) {
      console.log('✅ Monitor operation complete!');
    } else {
      console.error('❌ Monitor operation failed:', result.error);
      process.exit(1);
    }
  });

// ============================================================================
// CORE COMMAND 5: TOOLS
// ============================================================================
program
  .command('tools')
  .description('🛠️ Development tools and utilities')
  .option('-t, --test-mcp', 'Test MCP server functionality')
  .option('-v, --validate', 'Validate project compliance')
  .option('-i, --init-agent', 'Initialize new agent context')
  .option('-p, --prompt <type>', 'Generate prompts (enhancement, analysis, etc.)')
  .option('-f, --format <format>', 'Output format (console, json, markdown)', 'console')
  .option('-o, --output <file>', 'Save results to file')
  .option('--quick', 'Quick mode for agent initialization')
  .option('--detailed', 'Detailed mode for agent initialization')
  .action(async (options) => {
    const result = await coordinator.executeTools(options);
    if (result.success) {
      console.log('✅ Tools operation complete!');
    } else {
      console.error('❌ Tools operation failed:', result.error);
      process.exit(1);
    }
  });

// ============================================================================
// HELP AND VERSION
// ============================================================================
program
  .command('help')
  .description('Show detailed help information')
  .action(() => {
    console.log(`
🤖 CodeFortify - AI-Powered Code Enhancement

CORE COMMANDS:
  setup     🚀 Initialize and configure CodeFortify
  analyze   📊 Analyze project quality and generate insights  
  enhance   ✨ AI-powered iterative code improvement
  monitor   📈 Monitor and manage CodeFortify agents
  tools     🛠️ Development tools and utilities

GLOBAL OPTIONS:
  -v, --verbose     Enable verbose output
  -q, --quiet       Suppress non-essential output
  -c, --config      Use custom config file
  --no-color        Disable colored output
  --dry-run         Show what would be done without executing

EXAMPLES:
  codefortify setup                    # Initialize project
  codefortify analyze --detailed       # Detailed quality analysis
  codefortify enhance src/ --target 95 # Enhance code to 95% quality
  codefortify monitor --start          # Start monitoring agents
  codefortify tools --init-agent       # Initialize new agent

For more information, visit: https://github.com/your-org/codefortify
    `);
  });

// ============================================================================
// ERROR HANDLING
// ============================================================================
program.on('command:*', () => {
  console.error('❌ Invalid command. Use "codefortify help" for available commands.');
  process.exit(1);
});

// ============================================================================
// START THE CLI
// ============================================================================
program.parse();
