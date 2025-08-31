/**
 * Init Command Handler
 * 
 * Handles project initialization with Context7 MCP setup
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';

export class InitCommand {
  constructor(globalConfig, packageRoot) {
    this.globalConfig = globalConfig;
    this.packageRoot = packageRoot;
  }

  async execute(options) {
    console.log(chalk.bold.blue('🚀 Initializing Context7 MCP Project'));
    console.log(chalk.gray('Setting up AI-assisted development environment\n'));

    try {
      // Detect or prompt for project type
      const projectType = await this.determineProjectType(options.type);
      
      // Get project metadata
      const metadata = await this.gatherProjectMetadata();
      
      // Create configuration and files
      await this.createProjectFiles(projectType, metadata, options);
      
      console.log(chalk.green.bold('\n✅ Context7 MCP initialization complete!'));
      this.displayNextSteps(projectType);

    } catch (error) {
      console.error(chalk.red('\n❌ Initialization failed:'), error.message);
      if (this.globalConfig.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async determineProjectType(specifiedType) {
    if (specifiedType) {
      return this.validateProjectType(specifiedType);
    }

    // Auto-detect based on existing files
    const detected = await this.detectProjectType();
    
    if (detected) {
      const { confirmType } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmType',
        message: `Detected ${chalk.cyan(detected)} project. Is this correct?`,
        default: true
      }]);
      
      if (confirmType) {
        return detected;
      }
    }

    // Manual selection
    const { projectType } = await inquirer.prompt([{
      type: 'list',
      name: 'projectType',
      message: 'Select your project type:',
      choices: [
        { name: '⚛️  React Web Application', value: 'react-webapp' },
        { name: '💚 Vue.js Web Application', value: 'vue-webapp' },
        { name: '🚀 Node.js API Server', value: 'node-api' },
        { name: '📦 JavaScript/TypeScript Library', value: 'javascript' },
        { name: '🤖 MCP Server Package', value: 'mcp-server' },
        { name: '⚡ CLI Tool/Utility', value: 'cli-tool' }
      ]
    }]);

    return projectType;
  }

  validateProjectType(type) {
    const validTypes = ['react-webapp', 'vue-webapp', 'node-api', 'javascript', 'mcp-server', 'cli-tool'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid project type: ${type}. Valid options: ${validTypes.join(', ')}`);
    }
    return type;
  }

  async detectProjectType() {
    const packageJsonPath = path.join(this.globalConfig.projectRoot, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps.react || deps['react-dom']) return 'react-webapp';
      if (deps.vue || deps['@vue/cli-service']) return 'vue-webapp';
      if (deps.express || deps.fastify || deps.koa) return 'node-api';
      if (deps['@modelcontextprotocol/sdk']) return 'mcp-server';
      if (packageJson.bin) return 'cli-tool';
    }

    // Check for other indicators
    if (await fs.pathExists(path.join(this.globalConfig.projectRoot, 'src', 'App.jsx'))) return 'react-webapp';
    if (await fs.pathExists(path.join(this.globalConfig.projectRoot, 'src', 'App.vue'))) return 'vue-webapp';

    return null;
  }

  async gatherProjectMetadata() {
    const packageJsonPath = path.join(this.globalConfig.projectRoot, 'package.json');
    let existingPackage = {};

    if (await fs.pathExists(packageJsonPath)) {
      existingPackage = await fs.readJSON(packageJsonPath);
    }

    const questions = [];

    if (!existingPackage.name) {
      questions.push({
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: path.basename(this.globalConfig.projectRoot),
        validate: input => input.length > 0 ? true : 'Project name is required'
      });
    }

    if (!existingPackage.description) {
      questions.push({
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'AI-assisted development project with Context7 MCP integration'
      });
    }

    const answers = await inquirer.prompt(questions);

    return {
      name: existingPackage.name || answers.projectName,
      description: existingPackage.description || answers.description,
      version: existingPackage.version || '1.0.0'
    };
  }

  async createProjectFiles(projectType, metadata, options) {
    const spinner = ora('Creating project files...').start();

    try {
      // Create context7.config.js
      await this.createConfig(projectType, metadata);
      
      if (!options.noMcp) {
        // Create MCP server
        await this.createMCPServer(projectType);
      }
      
      if (!options.noAgentOs) {
        // Create AGENTS.md
        await this.createAgentsFile(projectType, metadata);
      }
      
      // Create/update CLAUDE.md
      await this.createClaudeFile(projectType, metadata, options.force);
      
      // Update package.json with Context7 scripts
      await this.updatePackageJson(metadata);

      spinner.succeed('Project files created successfully');

    } catch (error) {
      spinner.fail('Failed to create project files');
      throw error;
    }
  }

  async createConfig(projectType, metadata) {
    const configPath = path.join(this.globalConfig.projectRoot, 'context7.config.js');
    
    if (await fs.pathExists(configPath)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'context7.config.js already exists. Overwrite?',
        default: false
      }]);
      
      if (!overwrite) return;
    }

    const config = this.generateConfig(projectType, metadata);
    await fs.writeFile(configPath, config);
    console.log(chalk.green('✓ Created context7.config.js'));
  }

  generateConfig(projectType, metadata) {
    return `/**
 * Context7 MCP Configuration
 * 
 * Configuration for AI-assisted development with Context7 patterns
 */

export default {
  // Project metadata
  name: '${metadata.name}',
  type: '${projectType}',
  description: '${metadata.description}',
  
  // MCP Server configuration
  mcp: {
    enabled: true,
    server: './src/mcp-server.js',
    port: 3001,
    
    // Available resources
    resources: {
      standards: true,        // Context7 coding standards
      patterns: true,         // Framework-specific patterns
      documentation: true     // Project documentation
    },
    
    // Available tools
    tools: {
      validate: true,         // Context7 compliance validation
      generate: true,         // Pattern generation
      analyze: true          // Project analysis
    }
  },
  
  // Agent OS integration
  agentOS: {
    enabled: true,
    configFile: './AGENTS.md'
  },
  
  // Quality scoring configuration
  scoring: {
    categories: [
      'structure',           // Code Structure & Architecture (20pts)
      'quality',            // Code Quality & Maintainability (20pts)  
      'performance',        // Performance & Optimization (15pts)
      'testing',           // Testing & Documentation (15pts)
      'security',          // Security & Error Handling (15pts)
      'developerExperience', // Developer Experience (10pts)
      'completeness'       // Completeness & Production Readiness (5pts)
    ],
    
    // Scoring thresholds
    thresholds: {
      excellent: 90,
      good: 75,
      warning: 60,
      poor: 40
    }
  }
};
`;
  }

  async createMCPServer(projectType) {
    const serverPath = path.join(this.globalConfig.projectRoot, 'src', 'mcp-server.js');
    
    // Ensure src directory exists
    await fs.ensureDir(path.dirname(serverPath));
    
    if (await fs.pathExists(serverPath)) return;

    const serverCode = this.generateMCPServer(projectType);
    await fs.writeFile(serverPath, serverCode);
    console.log(chalk.green('✓ Created src/mcp-server.js'));
  }

  generateMCPServer(projectType) {
    return `/**
 * Context7 MCP Server
 * 
 * Model Context Protocol server for ${projectType} projects
 */

import { Context7MCPServer } from 'context7-mcp';

const server = new Context7MCPServer({
  projectType: '${projectType}',
  projectRoot: process.cwd()
});

// Start the server
server.start();

export default server;
`;
  }

  async createAgentsFile(projectType, metadata) {
    const agentsPath = path.join(this.globalConfig.projectRoot, 'AGENTS.md');
    
    if (await fs.pathExists(agentsPath)) return;

    const agentsContent = this.generateAgentsFile(projectType, metadata);
    await fs.writeFile(agentsPath, agentsContent);
    console.log(chalk.green('✓ Created AGENTS.md'));
  }

  generateAgentsFile(projectType, metadata) {
    return `# Agent Configuration

This file configures AI agents for the ${metadata.name} project.

## Project Information

- **Name**: ${metadata.name}
- **Type**: ${projectType}
- **Description**: ${metadata.description}

## Development Agents

### Primary Developer Agent
- **Role**: Lead development assistant
- **Capabilities**: Code generation, debugging, architecture guidance
- **Context**: Full project context with Context7 standards

### Code Review Agent  
- **Role**: Code quality and standards enforcement
- **Capabilities**: Code review, best practices, security analysis
- **Focus**: Context7 compliance, performance optimization

### Testing Agent
- **Role**: Test development and quality assurance  
- **Capabilities**: Test generation, coverage analysis, debugging
- **Framework**: Project-specific testing tools

## Agent Instructions

1. Follow Context7 coding standards and patterns
2. Maintain high code quality and documentation standards
3. Prioritize security and performance in all implementations
4. Use project-specific frameworks and conventions
5. Generate comprehensive tests for all new functionality

## MCP Integration

This project uses Context7 MCP for real-time access to:
- Coding standards and best practices
- Framework-specific patterns and examples
- Project structure and documentation
- Validation and analysis tools

Agents should leverage MCP resources for consistent, high-quality development.
`;
  }

  async createClaudeFile(projectType, metadata, force) {
    const claudePath = path.join(this.globalConfig.projectRoot, 'CLAUDE.md');
    
    if (await fs.pathExists(claudePath) && !force) {
      console.log(chalk.yellow('⚠ CLAUDE.md already exists, skipping...'));
      return;
    }

    const templatePath = path.join(this.packageRoot, 'templates', projectType, 'CLAUDE.md');
    let claudeContent;

    if (await fs.pathExists(templatePath)) {
      claudeContent = await fs.readFile(templatePath, 'utf8');
      // Replace template variables
      claudeContent = claudeContent
        .replace(/\{\{projectName\}\}/g, metadata.name)
        .replace(/\{\{projectType\}\}/g, projectType)
        .replace(/\{\{description\}\}/g, metadata.description);
    } else {
      claudeContent = this.generateGenericClaudeFile(projectType, metadata);
    }

    await fs.writeFile(claudePath, claudeContent);
    console.log(chalk.green('✓ Created/updated CLAUDE.md'));
  }

  generateGenericClaudeFile(projectType, metadata) {
    return `# CLAUDE.md

Project instructions for AI assistants working with ${metadata.name}.

## Project Overview

**Type**: ${projectType}
**Description**: ${metadata.description}

## Development Guidelines

### Code Standards
- Follow Context7 coding patterns and conventions
- Maintain consistent code style and formatting
- Write comprehensive documentation and comments
- Implement proper error handling and validation

### Architecture
- Use modular, maintainable code structure
- Follow framework-specific best practices
- Implement proper separation of concerns
- Prioritize code reusability and testability

### Testing
- Write unit tests for all new functionality
- Maintain high test coverage (>80%)
- Use appropriate testing frameworks and tools
- Include integration and end-to-end tests where needed

### Security
- Follow security best practices
- Validate all inputs and sanitize outputs  
- Implement proper authentication and authorization
- Regular security audits and dependency updates

## Context7 MCP Integration

This project uses Context7 MCP for real-time access to coding standards and patterns.
Leverage MCP resources for:
- Framework-specific code patterns
- Best practice implementations
- Project structure guidance
- Validation and quality checks

## Commands

\`\`\`bash
# Development
npm run dev          # Start development server
npm run test         # Run test suite
npm run lint         # Code quality checks

# Context7 MCP
context7 validate    # Validate project compliance
context7 score       # Analyze project quality
context7 test-mcp    # Test MCP server functionality
\`\`\`
`;
  }

  async updatePackageJson(metadata) {
    const packageJsonPath = path.join(this.globalConfig.projectRoot, 'package.json');
    let packageJson = {};

    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJSON(packageJsonPath);
    }

    // Add Context7 scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['context7:validate'] = 'context7 validate';
    packageJson.scripts['context7:score'] = 'context7 score';
    packageJson.scripts['context7:test-mcp'] = 'context7 test-mcp';

    // Ensure basic metadata
    packageJson.name = packageJson.name || metadata.name;
    packageJson.version = packageJson.version || metadata.version;
    packageJson.description = packageJson.description || metadata.description;

    await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
    console.log(chalk.green('✓ Updated package.json with Context7 scripts'));
  }

  displayNextSteps(projectType) {
    console.log(chalk.bold('\n🎯 Next Steps:'));
    console.log(chalk.gray('─'.repeat(40)));
    
    console.log(`\n1. ${chalk.cyan('Review generated files:')}`);
    console.log(`   • context7.config.js - Project configuration`);
    console.log(`   • src/mcp-server.js - MCP server setup`);
    console.log(`   • AGENTS.md - AI agent configuration`);
    console.log(`   • CLAUDE.md - Development guidelines`);
    
    console.log(`\n2. ${chalk.cyan('Test your setup:')}`);
    console.log(`   ${chalk.gray('$')} context7 validate`);
    console.log(`   ${chalk.gray('$')} context7 test-mcp`);
    
    console.log(`\n3. ${chalk.cyan('Analyze project quality:')}`);
    console.log(`   ${chalk.gray('$')} context7 score --detailed`);
    console.log(`   ${chalk.gray('$')} context7 score --format html --open`);
    
    console.log(`\n4. ${chalk.cyan('Start developing:')}`);
    if (projectType === 'react-webapp') {
      console.log(`   ${chalk.gray('$')} npm start`);
    } else if (projectType === 'vue-webapp') {
      console.log(`   ${chalk.gray('$')} npm run serve`);
    } else if (projectType === 'node-api') {
      console.log(`   ${chalk.gray('$')} npm run dev`);
    }
    
    console.log(`\n5. ${chalk.cyan('Connect with AI assistants:')}`);
    console.log(`   • Configure Claude Desktop or your preferred AI client`);
    console.log(`   • Point to your MCP server: src/mcp-server.js`);
    console.log(`   • Start building with AI assistance!`);
  }
}