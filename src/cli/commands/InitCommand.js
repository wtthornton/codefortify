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
import { ProjectTypeDetector } from '../../scoring/core/ProjectTypeDetector.js';
import { TemplateManager } from '../../TemplateManager.js';

export class InitCommand {
  constructor(globalConfig, packageRoot) {
    this.globalConfig = globalConfig;
    this.packageRoot = packageRoot;
    
    // Initialize template manager
    this.templateManager = new TemplateManager({
      projectRoot: this.globalConfig.projectRoot,
      templatesPath: path.join(this.packageRoot, 'templates')
    });
  }

  async execute(options) {
    console.log(chalk.bold.blue('🚀 Initializing CodeFortify Project'));
    console.log(chalk.gray('Setting up AI-powered code strengthening environment\n'));

    try {
      // Detect or prompt for project type
      const projectType = await this.determineProjectType(options.type, options);

      // Get project metadata
      const metadata = await this.gatherProjectMetadata(options);

      // Create configuration and files
      await this.createProjectFiles(projectType, metadata, options);

      console.log(chalk.green.bold('\n✅ CodeFortify initialization complete!'));
      this.displayNextSteps(projectType);

    } catch (error) {
      console.error(chalk.red('\n❌ Initialization failed:'), error.message);
      if (this.globalConfig.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async determineProjectType(specifiedType, options = {}) {
    if (specifiedType) {
      return this.validateProjectType(specifiedType);
    }

    // Use enhanced auto-detection with confidence scoring
    const detected = await this.detectProjectTypeWithConfidence();

    if (options.auto) {
      // Auto mode - require high confidence or fail
      if (detected.type && detected.confidence >= 0.8) {
        console.log(chalk.green(`✓ Auto-detected: ${chalk.cyan(detected.type)} (${Math.round(detected.confidence * 100)}% confidence)`));
        return detected.type;
      } else {
        throw new Error(`Auto-detection failed. Detected: ${detected.type || 'unknown'} with ${Math.round((detected.confidence || 0) * 100)}% confidence. Use --type to specify manually or remove --auto flag.`);
      }
    }

    if (detected.type && detected.confidence >= 0.8) {
      // High confidence - auto-select with notice
      console.log(chalk.green(`✓ Auto-detected: ${chalk.cyan(detected.type)} (${Math.round(detected.confidence * 100)}% confidence)`));
      return detected.type;
    } else if (detected.type && detected.confidence >= 0.6) {
      // Medium confidence - ask for confirmation
      const { confirmType } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmType',
        message: `Detected ${chalk.cyan(detected.type)} project (${Math.round(detected.confidence * 100)}% confidence). Is this correct?`,
        default: true
      }]);

      if (confirmType) {
        return detected.type;
      }
    }

    // Low confidence or user declined - show manual selection with detected option first
    const choices = [
      // Web Development
      { name: '🔥 Next.js Full-Stack App', value: 'next-app' },
      { name: '⚛️  React Web Application', value: 'react-webapp' },
      { name: '💚 Vue.js Web Application', value: 'vue-webapp' },
      { name: '🚀 Node.js API Server', value: 'node-api' },

      // Mobile Development
      { name: '📱 React Native Mobile App', value: 'mobile-react-native' },
      { name: '🦋 Flutter Mobile App', value: 'mobile-flutter' },

      // Desktop & Games
      { name: '🖥️ Electron Desktop App', value: 'desktop-electron' },
      { name: '🎮 Unity Game Project', value: 'game-unity' },

      // Modern Architecture
      { name: '🏗️ Microservices Architecture', value: 'microservices' },
      { name: '☁️ Serverless Application', value: 'serverless' },

      // Emerging Tech
      { name: '🧠 AI/ML Project', value: 'ai-ml' },
      { name: '⛓️ Blockchain/DApp', value: 'blockchain-dapp' },

      // Languages & Tools
      { name: '🐍 Python Application/API', value: 'python' },
      { name: '📦 JavaScript/TypeScript Library', value: 'javascript' },
      { name: '🤖 MCP Server Package', value: 'mcp-server' },
      { name: '⚡ CLI Tool/Utility', value: 'cli-tool' }
    ];

    // If we have a detected type with low confidence, move it to the top
    if (detected.type && detected.confidence > 0) {
      const detectedChoice = choices.find(c => c.value === detected.type);
      if (detectedChoice) {
        choices.splice(choices.indexOf(detectedChoice), 1);
        detectedChoice.name += chalk.gray(` (detected with ${Math.round(detected.confidence * 100)}% confidence)`);
        choices.unshift(detectedChoice);
      }
    }

    const { projectType } = await inquirer.prompt([{
      type: 'list',
      name: 'projectType',
      message: 'Select your project type:',
      choices
    }]);

    return projectType;
  }

  validateProjectType(type) {
    const validTypes = [
      // Web Development
      'next-app', 'react-webapp', 'vue-webapp', 'node-api',
      // Mobile Development
      'mobile-react-native', 'mobile-flutter',
      // Desktop & Games
      'desktop-electron', 'game-unity',
      // Modern Architecture
      'microservices', 'serverless',
      // Emerging Tech
      'ai-ml', 'blockchain-dapp',
      // Languages & Tools
      'python', 'javascript', 'typescript', 'mcp-server', 'cli-tool'
    ];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid project type: ${type}. Valid options: ${validTypes.join(', ')}`);
    }
    return type;
  }

  async detectProjectTypeWithConfidence() {
    const detector = new ProjectTypeDetector(this.globalConfig.projectRoot);
    const detectedType = detector.detectProjectType();

    if (!detectedType || detectedType === 'javascript') {
      return { type: detectedType, confidence: 0.3 };
    }

    // Calculate confidence based on multiple indicators
    const confidence = await this.calculateDetectionConfidence(detectedType, detector);

    return { type: detectedType, confidence };
  }

  async calculateDetectionConfidence(type, detector) {
    let confidence = 0.5; // Base confidence
    const packageJsonPath = path.join(this.globalConfig.projectRoot, 'package.json');

    try {
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
          ...packageJson.peerDependencies
        };

        // Strong dependency indicators
        const strongIndicators = {
          // Web Development
          'next-app': ['next', '@next/core', 'next/router'],
          'react-webapp': ['react', 'react-dom', '@types/react'],
          'vue-webapp': ['vue', '@vue/cli-service', 'vue-template-compiler'],
          'node-api': ['express', 'fastify', 'koa', '@nestjs/core'],

          // Mobile Development
          'mobile-react-native': ['react-native', '@react-native-community/cli', 'metro'],
          'mobile-flutter': [], // Flutter uses pubspec.yaml, not package.json

          // Desktop & Games
          'desktop-electron': ['electron', 'electron-builder', 'electron-packager'],
          'game-unity': [], // Unity doesn't use package.json

          // Modern Architecture
          'microservices': ['docker', 'kubernetes-client', '@kubernetes/client-node'],
          'serverless': ['serverless', 'aws-lambda', '@aws-sdk/client-lambda'],

          // Emerging Tech
          'ai-ml': ['tensorflow', '@tensorflow/tfjs', 'torch', 'pytorch'],
          'blockchain-dapp': ['web3', 'ethers', '@solana/web3.js', 'hardhat'],

          // Languages & Tools
          'python': [], // Python deps are in pyproject.toml/requirements.txt, not package.json
          'mcp-server': ['@modelcontextprotocol/sdk'],
          'cli-tool': ['commander', 'yargs', 'inquirer']
        };

        const indicators = strongIndicators[type] || [];
        const matchingDeps = indicators.filter(dep => allDeps[dep]);

        if (matchingDeps.length > 0) {
          confidence += 0.3 * (matchingDeps.length / indicators.length);
        }

        // Package.json structure indicators
        if (type === 'cli-tool' && packageJson.bin) {confidence += 0.2;}
        if (type === 'node-api' && packageJson.main && packageJson.main.includes('server')) {confidence += 0.1;}
        if ((type === 'react-webapp' || type === 'vue-webapp' || type === 'next-app') && packageJson.scripts?.start) {confidence += 0.1;}
        if (type === 'next-app' && packageJson.scripts?.build && packageJson.scripts.build.includes('next')) {confidence += 0.2;}
        if (type === 'mobile-react-native' && packageJson.scripts?.android) {confidence += 0.1;}
        if (type === 'desktop-electron' && packageJson.main && packageJson.main.includes('electron')) {confidence += 0.2;}
      }

      // File structure indicators
      const fileIndicators = {
        // Web Development
        'next-app': detector.hasNextFiles(),
        'react-webapp': detector.hasReactFiles(),
        'vue-webapp': detector.hasVueFiles(),
        'node-api': detector.hasAPIFiles(),

        // Mobile Development
        'mobile-react-native': detector.hasReactNativeFiles(),
        'mobile-flutter': detector.hasFlutterFiles(),

        // Desktop & Games
        'desktop-electron': detector.hasElectronFiles(),
        'game-unity': detector.hasUnityFiles(),

        // Modern Architecture
        'microservices': detector.hasMicroservicesFiles(),
        'serverless': detector.hasServerlessFiles(),

        // Emerging Tech
        'ai-ml': detector.hasAIMLFiles(),
        'blockchain-dapp': detector.hasBlockchainFiles(),

        // Languages & Tools
        'python': detector.hasPythonFiles(),
        'mcp-server': detector.hasMCPServerFiles(),
        'cli-tool': detector.hasCLIFiles()
      };

      if (fileIndicators[type]) {
        confidence += 0.2;
      }

      // Cap confidence at 0.95 to allow for edge cases
      return Math.min(confidence, 0.95);

    } catch (error) {
      console.warn('Could not calculate detection confidence:', error.message);
      return 0.5;
    }
  }

  async detectProjectType() {
    // Legacy method - kept for backwards compatibility
    const result = await this.detectProjectTypeWithConfidence();
    return result.type;
  }

  async gatherProjectMetadata(options = {}) {
    const packageJsonPath = path.join(this.globalConfig.projectRoot, 'package.json');
    let existingPackage = {};

    if (await fs.pathExists(packageJsonPath)) {
      existingPackage = await fs.readJson(packageJsonPath);
    }

    // In auto mode, use sensible defaults without prompting
    if (options.auto) {
      return {
        name: existingPackage.name || path.basename(this.globalConfig.projectRoot),
        description: existingPackage.description || 'AI-assisted development project with Context7 MCP integration',
        version: existingPackage.version || '1.0.0'
      };
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
      await this.createConfig(projectType, metadata, options);

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

      // Add template-based standards if available
      await this.addTemplateStandards(projectType, options);

      // Update package.json with Context7 scripts
      await this.updatePackageJson(metadata);

      spinner.succeed('Project files created successfully');

    } catch (error) {
      spinner.fail('Failed to create project files');
      throw error;
    }
  }

  async createConfig(projectType, metadata, options = {}) {
    const configPath = path.join(this.globalConfig.projectRoot, 'codefortify.config.js');

    if (await fs.pathExists(configPath) && !options.force && !options.auto) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'codefortify.config.js already exists. Overwrite?',
        default: false
      }]);

      if (!overwrite) {return;}
    }

    const config = this.generateConfig(projectType, metadata);
    await fs.writeFile(configPath, config);
    console.log(chalk.green('✓ Created codefortify.config.js'));
  }

  generateConfig(projectType, metadata) {
    return `/**
 * CodeFortify Configuration
 * 
 * Configuration for AI-powered code strengthening and security enhancement
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
      standards: true,        // CodeFortify security standards
      patterns: true,         // Framework-specific patterns
      documentation: true     // Project documentation
    },
    
    // Available tools
    tools: {
      validate: true,         // CodeFortify compliance validation
      generate: true,         // Pattern generation
      analyze: true          // Security analysis
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

    if (await fs.pathExists(serverPath)) {return;}

    const serverCode = this.generateMCPServer(projectType);
    await fs.writeFile(serverPath, serverCode);
    console.log(chalk.green('✓ Created src/mcp-server.js'));
  }

  generateMCPServer(projectType) {
    return `/**
 * CodeFortify MCP Server
 * 
 * AI-powered code strengthening server for ${projectType} projects
 */

import { CodeFortifyMCPServer } from 'codefortify';

const server = new CodeFortifyMCPServer({
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

    if (await fs.pathExists(agentsPath)) {return;}

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
      packageJson = await fs.readJson(packageJsonPath);
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
    console.log(chalk.green('✓ Updated package.json with CodeFortify scripts'));
  }

  async addTemplateStandards(projectType, options) {
    try {
      // Check if template exists for this project type
      const templates = await this.templateManager.discoverTemplates();
      const template = templates.find(t => t.name === projectType);
      
      if (template) {
        console.log(chalk.green(`✓ Adding standards from ${projectType} template`));
        
        // Get template standards
        const resolvedTemplate = await this.templateManager.resolveTemplate(projectType);
        
        // Create .codefortify directory
        const codefortifyPath = path.join(this.globalConfig.projectRoot, '.codefortify');
        await fs.ensureDir(codefortifyPath);
        await fs.ensureDir(path.join(codefortifyPath, 'standards'));
        
        // Copy standards
        for (const [standardName, content] of Object.entries(resolvedTemplate)) {
          if (standardName !== 'template' && typeof content === 'string') {
            const filePath = path.join(codefortifyPath, 'standards', `${standardName}.md`);
            await fs.writeFile(filePath, content);
          }
        }
        
        console.log(chalk.green('✓ Template standards added successfully'));
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠ Could not add template standards:'), error.message);
    }
  }

  displayNextSteps(projectType) {
    console.log(chalk.bold('\n🎯 Next Steps:'));
    console.log(chalk.gray('─'.repeat(40)));

    console.log(`\n1. ${chalk.cyan('Review generated files:')}`);
    console.log('   • codefortify.config.js - Project configuration');
    console.log('   • src/mcp-server.js - MCP server setup');
    console.log('   • AGENTS.md - AI agent configuration');
    console.log('   • CLAUDE.md - Development guidelines');

    console.log(`\n2. ${chalk.cyan('Test your setup:')}`);
    console.log(`   ${chalk.gray('$')} codefortify validate`);
    console.log(`   ${chalk.gray('$')} codefortify test-mcp`);

    console.log(`\n3. ${chalk.cyan('Analyze project quality:')}`);
    console.log(`   ${chalk.gray('$')} codefortify score --detailed`);
    console.log(`   ${chalk.gray('$')} codefortify score --format html --open`);

    console.log(`\n4. ${chalk.cyan('Start developing:')}`);
    if (projectType === 'react-webapp') {
      console.log(`   ${chalk.gray('$')} npm start`);
    } else if (projectType === 'vue-webapp') {
      console.log(`   ${chalk.gray('$')} npm run serve`);
    } else if (projectType === 'node-api') {
      console.log(`   ${chalk.gray('$')} npm run dev`);
    }

    console.log(`\n5. ${chalk.cyan('Connect with AI assistants:')}`);
    console.log('   • Configure Claude Desktop or your preferred AI client');
    console.log('   • Point to your MCP server: src/mcp-server.js');
    console.log('   • Start building with AI assistance!');
  }
}