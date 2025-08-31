#!/usr/bin/env node

/**
 * Context7 Validation System - Reusable Package
 *
 * This validates that projects comply with Context7 standards
 * and Agent OS requirements across different project types.
 */

import fs from 'fs/promises';
import path from 'path';

export class Context7Validator {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      strictMode: config.strictMode ?? true,
      agentOsEnabled: false, // Disabled for this project
      ...config
    };

    this.validationResults = [];
    this.setupValidationRules();
  }

  setupValidationRules() {
    // Base required files for all projects
    this.requiredFiles = [
      'AGENTS.md',
      'CLAUDE.md'
    ];

    // Add Agent OS files if they should exist (disabled by default)
    if (this.config.agentOsEnabled === true) {
      this.requiredFiles.push(
        '.agent-os/config.yml',
        '.agent-os/instructions/ai-development.md',
        '.agent-os/standards/context7-standards.md',
        '.agent-os/standards/tech-stack.md',
        '.agent-os/product/mission.md',
        '.agent-os/product/roadmap.md'
      );
    }

    // Add MCP server file if MCP is enabled
    if (this.config.mcpEnabled !== false) {
      this.requiredFiles.push('src/mcp-server.js');
    }

    // Base required directories
    this.requiredDirectories = [
      '.agent-os',
      'src'
    ];

    // Add project-type specific requirements
    this.addProjectTypeRequirements();
  }

  addProjectTypeRequirements() {
    switch (this.config.projectType) {
    case 'react-webapp':
    case 'vue-webapp':
    case 'svelte-webapp':
      this.requiredDirectories.push('examples');
      if (this.config.agentOsEnabled !== false) {
        this.requiredDirectories.push(
          '.agent-os/instructions',
          '.agent-os/standards',
          '.agent-os/product'
        );
      }
      break;

    case 'node-api':
      this.requiredDirectories.push('tests');
      break;

    default:
      // JavaScript project defaults
      break;
    }
  }

  async runValidation() {
    console.log('🚀 Starting Context7 Validation');
    console.log(`Project: ${this.config.projectRoot}`);
    console.log(`Type: ${this.config.projectType}`);
    console.log('=' .repeat(60));

    try {
      await this.validateFileStructure();
      await this.validateAgentOSConfig();
      await this.validateMCPServer();
      await this.validatePackageJson();
      await this.validateDocumentation();
      await this.validateProjectSpecificFiles();

      const report = this.generateReport();

      // Return success/failure
      return {
        success: report.failedTests === 0,
        report
      };

    } catch (error) {
      console.error('💥 Validation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async validateFileStructure() {
    console.log('🔍 Validating Context7 file structure...');

    // Check required directories
    for (const dir of this.requiredDirectories) {
      const dirPath = path.join(this.config.projectRoot, dir);
      try {
        const stat = await fs.stat(dirPath);
        if (stat.isDirectory()) {
          this.addResult('Directory Structure', dir, 'PASS', 'Directory exists');
        } else {
          this.addResult('Directory Structure', dir, 'FAIL', 'Path exists but is not a directory');
        }
      } catch (error) {
        this.addResult('Directory Structure', dir, 'FAIL', 'Directory does not exist');
      }
    }

    // Check required files
    for (const file of this.requiredFiles) {
      const filePath = path.join(this.config.projectRoot, file);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          const size = stat.size;
          this.addResult('Required Files', file, 'PASS', `File exists (${size} bytes)`);
        } else {
          this.addResult('Required Files', file, 'FAIL', 'Path exists but is not a file');
        }
      } catch (error) {
        this.addResult('Required Files', file, 'FAIL', 'File does not exist');
      }
    }
  }

  async validateAgentOSConfig() {
    console.log('🔍 Validating Agent OS configuration...');

    try {
      const configPath = path.join(this.config.projectRoot, '.agent-os/config.yml');
      const configContent = await fs.readFile(configPath, 'utf-8');

      // Check for required configuration sections
      const requiredSections = [
        'agent_os_version',
        'agents:'
      ];

      // Add MCP sections if MCP should be enabled
      if (this.config.mcpEnabled !== false) {
        requiredSections.push('mcp:', 'context7:');
      }

      for (const section of requiredSections) {
        if (configContent.includes(section)) {
          this.addResult('Agent OS Config', section, 'PASS', 'Section present');
        } else {
          this.addResult('Agent OS Config', section, 'FAIL', 'Section missing');
        }
      }

      // Check MCP configuration if enabled
      if (this.config.mcpEnabled !== false) {
        if (configContent.includes('mcp:') && configContent.includes('enabled: true')) {
          this.addResult('MCP Configuration', 'MCP Enabled', 'PASS', 'MCP is enabled');
        } else {
          this.addResult('MCP Configuration', 'MCP Enabled', 'FAIL', 'MCP is not enabled');
        }

        if (configContent.includes('context7:') && configContent.includes('enabled: true')) {
          this.addResult('Context7 Configuration', 'Context7 Enabled', 'PASS', 'Context7 is enabled');
        } else {
          this.addResult('Context7 Configuration', 'Context7 Enabled', 'FAIL', 'Context7 is not enabled');
        }
      }

    } catch (error) {
      this.addResult('Agent OS Config', 'Config File', 'FAIL', `Cannot read config: ${error.message}`);
    }
  }

  async validateMCPServer() {
    if (this.config.mcpEnabled === false) {return;}

    console.log('🔍 Validating MCP server implementation...');

    try {
      const serverPath = path.join(this.config.projectRoot, 'src/mcp-server.js');
      const serverContent = await fs.readFile(serverPath, 'utf-8');

      // Check for required MCP components
      const requiredComponents = [
        'Server',
        'StdioServerTransport',
        'ListResourcesRequestSchema',
        'ListToolsRequestSchema',
        'Context7MCPServer'
      ];

      for (const component of requiredComponents) {
        if (serverContent.includes(component)) {
          this.addResult('MCP Server', component, 'PASS', 'Component present');
        } else {
          this.addResult('MCP Server', component, 'FAIL', 'Component missing');
        }
      }

      // Check for Context7 tools
      const requiredTools = [
        'validate_context7_compliance',
        'get_pattern_examples',
        'check_naming_conventions',
        'suggest_improvements'
      ];

      for (const tool of requiredTools) {
        if (serverContent.includes(tool)) {
          this.addResult('MCP Tools', tool, 'PASS', 'Tool implemented');
        } else {
          this.addResult('MCP Tools', tool, 'FAIL', 'Tool missing');
        }
      }

    } catch (error) {
      this.addResult('MCP Server', 'Server File', 'FAIL', `Cannot read server: ${error.message}`);
    }
  }

  async validatePackageJson() {
    console.log('🔍 Validating package.json configuration...');

    try {
      const packagePath = path.join(this.config.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      // Check for MCP dependency if MCP is enabled
      if (this.config.mcpEnabled !== false) {
        if (packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/sdk']) {
          this.addResult('Package Dependencies', 'MCP SDK', 'PASS', 'MCP SDK dependency present');
        } else {
          this.addResult('Package Dependencies', 'MCP SDK', 'FAIL', 'MCP SDK dependency missing');
        }

        // Check for MCP scripts
        const requiredScripts = [
          'mcp:dev',
          'mcp:test',
          'context7:validate'
        ];

        for (const script of requiredScripts) {
          if (packageJson.scripts && packageJson.scripts[script]) {
            this.addResult('Package Scripts', script, 'PASS', 'Script present');
          } else {
            this.addResult('Package Scripts', script, 'FAIL', 'Script missing');
          }
        }
      }

      // Check project-type specific dependencies
      await this.validateProjectTypeDependencies(packageJson);

    } catch (error) {
      this.addResult('Package Configuration', 'package.json', 'FAIL', `Cannot read package.json: ${error.message}`);
    }
  }

  async validateProjectTypeDependencies(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    switch (this.config.projectType) {
    case 'react-webapp':
      if (deps.react) {
        this.addResult('Project Dependencies', 'React', 'PASS', 'React dependency present');
      } else {
        this.addResult('Project Dependencies', 'React', 'FAIL', 'React dependency missing');
      }
      break;

    case 'vue-webapp':
      if (deps.vue) {
        this.addResult('Project Dependencies', 'Vue', 'PASS', 'Vue dependency present');
      } else {
        this.addResult('Project Dependencies', 'Vue', 'FAIL', 'Vue dependency missing');
      }
      break;

    case 'node-api':
      if (deps.express || deps.fastify || deps.koa) {
        this.addResult('Project Dependencies', 'Web Framework', 'PASS', 'Web framework dependency present');
      } else {
        this.addResult('Project Dependencies', 'Web Framework', 'WARN', 'No web framework detected');
      }
      break;
    }
  }

  async validateDocumentation() {
    console.log('🔍 Validating Context7 documentation...');

    const docFiles = [
      {
        file: 'AGENTS.md',
        content: ['Context7', 'AI coding agent', 'MCP'],
        required: true
      },
      {
        file: 'CLAUDE.md',
        content: ['Context7', 'Agent OS'],
        required: true
      }
    ];

    // Add optional Agent OS docs if they should exist
    if (this.config.agentOsEnabled !== false) {
      docFiles.push(
        {
          file: '.agent-os/instructions/ai-development.md',
          content: ['Context7', 'AI ASSISTANT CONTEXT'],
          required: true
        },
        {
          file: '.agent-os/standards/context7-standards.md',
          content: ['Context7', 'React.FC', 'AI ASSISTANT CONTEXT'],
          required: true
        }
      );
    }

    for (const doc of docFiles) {
      try {
        const docPath = path.join(this.config.projectRoot, doc.file);
        const docContent = await fs.readFile(docPath, 'utf-8');

        const missingContent = [];
        for (const expectedContent of doc.content) {
          if (!docContent.includes(expectedContent)) {
            missingContent.push(expectedContent);
          }
        }

        if (missingContent.length === 0) {
          this.addResult('Documentation', doc.file, 'PASS', 'All required content present');
        } else {
          const status = doc.required ? 'FAIL' : 'WARN';
          this.addResult('Documentation', doc.file, status, `Missing content: ${missingContent.join(', ')}`);
        }

      } catch (error) {
        const status = doc.required ? 'FAIL' : 'WARN';
        this.addResult('Documentation', doc.file, status, `Cannot read file: ${error.message}`);
      }
    }
  }

  async validateProjectSpecificFiles() {
    // This can be overridden by specific project types
    if (this.config.projectType === 'react-webapp') {
      await this.validateReactSpecificFiles();
    }
  }

  async validateReactSpecificFiles() {
    console.log('🔍 Validating React-specific files...');

    try {
      const examplesDir = path.join(this.config.projectRoot, 'examples');
      const files = await fs.readdir(examplesDir);

      if (files.length > 0) {
        this.addResult('Example Patterns', 'Examples Directory', 'PASS', `${files.length} example files found`);

        // Check for component patterns file
        const hasPatternFile = files.some(file =>
          file.includes('pattern') || file.includes('demo') || file.includes('component')
        );

        if (hasPatternFile) {
          this.addResult('Example Patterns', 'Component Patterns', 'PASS', 'Pattern file present');
        } else {
          this.addResult('Example Patterns', 'Component Patterns', 'WARN', 'No pattern file found');
        }
      } else {
        this.addResult('Example Patterns', 'Examples Directory', 'WARN', 'No example files found');
      }

    } catch (error) {
      this.addResult('Example Patterns', 'Examples Directory', 'WARN', `Cannot read examples: ${error.message}`);
    }
  }

  addResult(category, item, status, details) {
    this.validationResults.push({
      category,
      item,
      status,
      details
    });
  }

  generateReport() {
    console.log('\\n📊 Context7 Validation Report');
    console.log('=' .repeat(60));

    const categories = [...new Set(this.validationResults.map(r => r.category))];
    const totalTests = this.validationResults.length;
    const passedTests = this.validationResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.validationResults.filter(r => r.status === 'FAIL').length;
    const warnTests = this.validationResults.filter(r => r.status === 'WARN').length;

    console.log('\\nOverall Results:');
    console.log(`Total Validations: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    if (warnTests > 0) {
      console.log(`Warnings: ${warnTests} ⚠️`);
    }
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

    // Results by category
    for (const category of categories) {
      console.log(`\\n${category}:`);
      console.log('-' .repeat(40));

      const categoryResults = this.validationResults.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
      const categoryTotal = categoryResults.length;

      console.log(`${categoryPassed}/${categoryTotal} validations passed`);

      for (const result of categoryResults) {
        const status = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
        console.log(`  ${status} ${result.item}: ${result.details}`);
      }
    }

    // Recommendations
    this.generateRecommendations(failedTests, warnTests);

    return {
      totalTests,
      passedTests,
      failedTests,
      warnTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      categories: categories.length
    };
  }

  generateRecommendations(failedTests, warnTests) {
    console.log('\\n💡 Recommendations:');
    console.log('-' .repeat(40));

    const failedResults = this.validationResults.filter(r => r.status === 'FAIL');
    const warnResults = this.validationResults.filter(r => r.status === 'WARN');

    if (failedTests === 0 && warnTests === 0) {
      console.log('🎉 Excellent! Your project fully complies with Context7 standards.');
      console.log('All AI assistants should have optimal integration capabilities.');
    } else {
      if (failedTests > 0) {
        console.log(`Found ${failedTests} critical issues that must be addressed:`);

        const priorityFixes = failedResults.filter(r =>
          r.category === 'Required Files' ||
          r.category === 'MCP Configuration' ||
          r.category === 'Agent OS Config'
        );

        if (priorityFixes.length > 0) {
          console.log('\\nHigh Priority Fixes:');
          priorityFixes.forEach((fix, index) => {
            console.log(`${index + 1}. ${fix.category} - ${fix.item}: ${fix.details}`);
          });
        }
      }

      if (warnTests > 0) {
        console.log(`\\nFound ${warnTests} warnings (recommended improvements):`);
        warnResults.slice(0, 5).forEach((warn, index) => {
          console.log(`${index + 1}. ${warn.category} - ${warn.item}: ${warn.details}`);
        });
      }
    }
  }

  // Static factory methods
  static async validateProject(projectRoot, options = {}) {
    const validator = new Context7Validator({
      projectRoot,
      ...options
    });

    return await validator.runValidation();
  }

  static async autoDetectAndValidate(projectRoot = process.cwd()) {
    // Auto-detect project configuration
    let projectType = 'javascript';

    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps.react) {projectType = 'react-webapp';}
      else if (deps.vue) {projectType = 'vue-webapp';}
      else if (deps.svelte) {projectType = 'svelte-webapp';}
      else if (deps.express || deps.fastify) {projectType = 'node-api';}
    } catch (error) {
      // Use default
    }

    return await Context7Validator.validateProject(projectRoot, { projectType });
  }
}

// Run validation if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const projectRoot = process.argv[2] || process.cwd();
  Context7Validator.autoDetectAndValidate(projectRoot)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation error:', error);
      process.exit(1);
    });
}