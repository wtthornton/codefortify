/**
 * Command Registry
 * Implements proper Command pattern to replace CommandCoordinator anti-pattern
 */

import { InitCommand } from './commands/InitCommand.js';
import { ScoreCommand } from './commands/ScoreCommand.js';
import { EnhanceCommand } from './commands/EnhanceCommand.js';
import { TemplateCommand } from './commands/TemplateCommand.js';
import { PromptCommand } from './commands/PromptCommand.js';
import { AgentInitCommand } from './commands/AgentInitCommand.js';
import { MonitorCommand } from './commands/MonitorCommand.js';
import { RefactorCommand } from './commands/RefactorCommand.js';
import { CommandFormatter } from './utils/CommandFormatter.js';

// Import additional command implementations
import { SetupCommand } from './commands/SetupCommand.js';
import { AnalyzeCommand } from './commands/AnalyzeCommand.js';
import { ToolsCommand } from './commands/ToolsCommand.js';
import { ValidateCommand } from './commands/ValidateCommand.js';
import { ServeCommand } from './commands/ServeCommand.js';

export class CommandRegistry {
  constructor(globalConfig, packageRoot) {
    this.globalConfig = globalConfig;
    this.packageRoot = packageRoot;
    this.formatter = new CommandFormatter(globalConfig);
    
    // Register all commands
    this.commands = new Map();
    this.registerCommands();
  }

  /**
   * Register all available commands
   */
  registerCommands() {
    // Core commands
    this.register('init', InitCommand);
    this.register('score', ScoreCommand);
    this.register('enhance', EnhanceCommand);
    this.register('template', TemplateCommand);
    this.register('prompt', PromptCommand);
    this.register('agent-init', AgentInitCommand);
    this.register('monitor', MonitorCommand);
    this.register('refactor', RefactorCommand);

    // Composite commands (combinations of other commands)
    this.register('setup', SetupCommand);
    this.register('analyze', AnalyzeCommand);
    this.register('tools', ToolsCommand);
    this.register('validate', ValidateCommand);
    this.register('serve', ServeCommand);

    // Monitoring commands
    this.register('status', 'MonitorCommand', { action: 'status' });
    this.register('pause', 'MonitorCommand', { action: 'pause' });
    this.register('resume', 'MonitorCommand', { action: 'resume' });
    this.register('stop', 'MonitorCommand', { action: 'stop' });
    this.register('dashboard', 'MonitorCommand', { action: 'dashboard' });

    // Additional utility commands
    this.register('add', 'ToolsCommand', { action: 'add' });
    this.register('test-mcp', 'ToolsCommand', { action: 'test-mcp' });
    this.register('generate', 'ToolsCommand', { action: 'generate' });
    this.register('update', 'ToolsCommand', { action: 'update' });
    this.register('cursor', 'ToolsCommand', { action: 'cursor' });
  }

  /**
   * Register a command with the registry
   * @param {string} name - Command name
   * @param {Function|string} commandClass - Command class or reference
   * @param {Object} defaultOptions - Default options for the command
   */
  register(name, commandClass, defaultOptions = {}) {
    this.commands.set(name, {
      commandClass,
      defaultOptions,
      instance: null // Lazy initialization
    });
  }

  /**
   * Get command instance (lazy initialization)
   * @param {string} name - Command name
   * @returns {Object|null} Command instance
   */
  getCommand(name) {
    const commandInfo = this.commands.get(name);
    if (!commandInfo) {
      return null;
    }

    // Lazy initialization
    if (!commandInfo.instance) {
      let CommandClass;

      if (typeof commandInfo.commandClass === 'string') {
        // Handle string references (for shared commands with different actions)
        CommandClass = this.getCommandClass(commandInfo.commandClass);
      } else {
        CommandClass = commandInfo.commandClass;
      }

      if (CommandClass) {
        commandInfo.instance = new CommandClass(this.globalConfig, this.packageRoot);
      }
    }

    return commandInfo.instance;
  }

  /**
   * Get command class by name
   * @param {string} className - Command class name
   * @returns {Function|null} Command class
   */
  getCommandClass(className) {
    const classMap = {
      'MonitorCommand': MonitorCommand,
      'ToolsCommand': ToolsCommand,
      'ValidateCommand': ValidateCommand,
      'ServeCommand': ServeCommand
    };

    return classMap[className] || null;
  }

  /**
   * Execute a command by name
   * @param {string} commandName - Name of command to execute
   * @param {Object} options - Command options
   * @returns {Promise<Object>} Execution result
   */
  async execute(commandName, options = {}) {
    try {
      const command = this.getCommand(commandName);
      if (!command) {
        throw new Error(`Unknown command: ${commandName}`);
      }

      // Merge default options with provided options
      const commandInfo = this.commands.get(commandName);
      const finalOptions = { ...commandInfo.defaultOptions, ...options };

      // Validate options if command supports it
      if (command.validateOptions && !command.validateOptions(finalOptions)) {
        throw new Error(`Invalid options for command: ${commandName}`);
      }

      // Execute the command
      const result = await command.execute(finalOptions);

      // Format result consistently
      if (result && !options.raw) {
        this.formatter.formatResult(result);
      }

      return result;

    } catch (error) {
      const result = {
        success: false,
        error: error.message,
        command: commandName
      };

      if (!options.raw) {
        this.formatter.error(error, this.globalConfig.verbose);
      }

      return result;
    }
  }

  /**
   * List all available commands
   * @returns {Array<string>} Command names
   */
  listCommands() {
    return Array.from(this.commands.keys()).sort();
  }

  /**
   * Check if command exists
   * @param {string} commandName - Command name to check
   * @returns {boolean} True if command exists
   */
  hasCommand(commandName) {
    return this.commands.has(commandName);
  }

  /**
   * Get command help information
   * @param {string} commandName - Command name
   * @returns {Object|null} Command help info
   */
  getCommandHelp(commandName) {
    const command = this.getCommand(commandName);
    if (!command || !command.getHelp) {
      return null;
    }

    return command.getHelp();
  }
}