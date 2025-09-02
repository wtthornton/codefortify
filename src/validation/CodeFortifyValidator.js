/**
 * CodeFortify Validation System - AI-Powered Code Security
 *
 * This validates that projects comply with CodeFortify standards
 * for security, quality, and best practices across project types.
 */

import fs from 'fs/promises';
import path from 'path';

/**


 * CodeFortifyValidator class implementation


 *


 * Provides functionality for codefortifyvalidator operations


 */


/**


 * CodeFortifyValidator class implementation


 *


 * Provides functionality for codefortifyvalidator operations


 */


export class CodeFortifyValidator {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      strictMode: config.strictMode ?? true,
      codefortifyEnabled: false, // Disabled for this project
      ...config
    };

    this.validationResults = [];
    this.setupValidationRules();
  }  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupValidationRules() {
    // Base required files for all projects
    this.requiredFiles = [
      'AGENTS.md',
      'CLAUDE.md'
    ];

    // Add CodeFortify files if they should exist (disabled by default)    /**
   * Performs the specified operation
   * @param {Object} this.config.codefortifyEnabled - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.codefortifyEnabled - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.codefortifyEnabled === true) {
      this.requiredFiles.push(
        '.codefortify/config.yml',
        '.codefortify/instructions/ai-development.md',
        '.codefortify/standards/context7-standards.md',
        '.codefortify/standards/tech-stack.md',
        '.codefortify/product/mission.md',
        '.codefortify/product/roadmap.md'
      );
    }

    // Add MCP server file if MCP is enabled    /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.mcpEnabled !== false) {
      this.requiredFiles.push('src/mcp-server.js');
    }

    // Base required directories
    this.requiredDirectories = [
      '.codefortify',
      'src'
    ];

    // Add project-type specific requirements
    this.addProjectTypeRequirements();
  }  /**
   * Adds an item
   * @returns {any} The operation result
   */
  /**
   * Adds an item
   * @returns {any} The operation result
   */


  addProjectTypeRequirements() {  /**
   * Performs the specified operation
   * @param {Object} this.config.projectType
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.projectType
   * @returns {boolean} True if successful, false otherwise
   */

    switch (this.config.projectType) {
    case 'react-webapp':
    case 'vue-webapp':
    case 'svelte-webapp':
      this.requiredDirectories.push('examples');      /**
   * Performs the specified operation
   * @param {Object} this.config.codefortifyEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.codefortifyEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.codefortifyEnabled !== false) {
        this.requiredDirectories.push(
          '.codefortify/instructions',
          '.codefortify/standards',
          '.codefortify/product'
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
  }  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */


  async runValidation() {
    // LOG: 🚀 Starting Context7 Validation
    // LOG: `Project: ${this.config.projectRoot}`
    // LOG: `Type: ${this.config.projectType}`
    // LOG: = .repeat(60)
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
      // ERROR: 💥 Validation failed:, error.message
      return {
        success: false,
        error: error.message
      };
    }
  }  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */


  async validateFileStructure() {
    // LOG: 🔍 Validating Context7 file structure...
    // Check required directories  /**
   * Performs the specified operation
   * @param {boolean} const dir of this.requiredDirectories
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} const dir of this.requiredDirectories
   * @returns {boolean} True if successful, false otherwise
   */

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

    // Check required files    /**
   * Performs the specified operation
   * @param {boolean} const file of this.requiredFiles
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} const file of this.requiredFiles
   * @returns {boolean} True if successful, false otherwise
   */

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
  }  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */


  async validateAgentOSConfig() {
    // LOG: 🔍 Validating Agent OS configuration...
    try {
      const configPath = path.join(this.config.projectRoot, '.codefortify/config.yml');
      const configContent = await fs.readFile(configPath, 'utf-8');

      // Check for required configuration sections
      const requiredSections = [
        'agent_os_version',
        'agents:'
      ];

      // Add MCP sections if MCP should be enabled      /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.mcpEnabled !== false) {
        requiredSections.push('mcp:', 'context7:');
      }      /**
   * Performs the specified operation
   * @param {any} const section of requiredSections
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const section of requiredSections
   * @returns {any} The operation result
   */


      for (const section of requiredSections) {
        if (configContent.includes(section)) {
          this.addResult('Agent OS Config', section, 'PASS', 'Section present');
        } else {
          this.addResult('Agent OS Config', section, 'FAIL', 'Section missing');
        }
      }

      // Check MCP configuration if enabled      /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

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
  }  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */


  async validateMCPServer() {  /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.mcpEnabled === false) {return;}

    // LOG: 🔍 Validating MCP server implementation...
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
      ];      /**
   * Performs the specified operation
   * @param {any} const component of requiredComponents
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const component of requiredComponents
   * @returns {any} The operation result
   */


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
      ];      /**
   * Performs the specified operation
   * @param {any} const tool of requiredTools
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const tool of requiredTools
   * @returns {any} The operation result
   */


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
  }  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */


  async validatePackageJson() {
    // LOG: 🔍 Validating package.json configuration...
    try {
      const packagePath = path.join(this.config.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      // Check for MCP dependency if MCP is enabled      /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.mcpEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.mcpEnabled !== false) {        /**
   * Performs the specified operation
   * @param {any} packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/sdk']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/sdk']
   * @returns {any} The operation result
   */

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
        ];        /**
   * Performs the specified operation
   * @param {any} const script of requiredScripts
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const script of requiredScripts
   * @returns {any} The operation result
   */


        for (const script of requiredScripts) {          /**
   * Performs the specified operation
   * @param {any} packageJson.scripts && packageJson.scripts[script]
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} packageJson.scripts && packageJson.scripts[script]
   * @returns {any} The operation result
   */

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
  }  /**
   * Validates input data
   * @param {any} packageJson
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @param {any} packageJson
   * @returns {Promise} Promise that resolves with the result
   */


  async validateProjectTypeDependencies(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };    /**
   * Performs the specified operation
   * @param {Object} this.config.projectType
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.projectType
   * @returns {boolean} True if successful, false otherwise
   */


    switch (this.config.projectType) {
    case 'react-webapp':      /**
   * Performs the specified operation
   * @param {any} deps.react
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.react
   * @returns {any} The operation result
   */

      if (deps.react) {
        this.addResult('Project Dependencies', 'React', 'PASS', 'React dependency present');
      } else {
        this.addResult('Project Dependencies', 'React', 'FAIL', 'React dependency missing');
      }
      break;

    case 'vue-webapp':      /**
   * Performs the specified operation
   * @param {any} deps.vue
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.vue
   * @returns {any} The operation result
   */

      if (deps.vue) {
        this.addResult('Project Dependencies', 'Vue', 'PASS', 'Vue dependency present');
      } else {
        this.addResult('Project Dependencies', 'Vue', 'FAIL', 'Vue dependency missing');
      }
      break;

    case 'node-api':      /**
   * Performs the specified operation
   * @param {any} deps.express || deps.fastify || deps.koa
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.express || deps.fastify || deps.koa
   * @returns {any} The operation result
   */

      if (deps.express || deps.fastify || deps.koa) {
        this.addResult('Project Dependencies', 'Web Framework', 'PASS', 'Web framework dependency present');
      } else {
        this.addResult('Project Dependencies', 'Web Framework', 'WARN', 'No web framework detected');
      }
      break;
    }
  }  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */


  async validateDocumentation() {
    // LOG: 🔍 Validating Context7 documentation...
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

    // Add optional CodeFortify docs if they should exist    /**
   * Performs the specified operation
   * @param {Object} this.config.codefortifyEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.codefortifyEnabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.codefortifyEnabled !== false) {
      docFiles.push(
        {
          file: '.codefortify/instructions/ai-development.md',
          content: ['Context7', 'AI ASSISTANT CONTEXT'],
          required: true
        },
        {
          file: '.codefortify/standards/context7-standards.md',
          content: ['Context7', 'React.FC', 'AI ASSISTANT CONTEXT'],
          required: true
        }
      );
    }    /**
   * Performs the specified operation
   * @param {any} const doc of docFiles
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const doc of docFiles
   * @returns {any} The operation result
   */


    for (const doc of docFiles) {
      try {
        const docPath = path.join(this.config.projectRoot, doc.file);
        const docContent = await fs.readFile(docPath, 'utf-8');

        const missingContent = [];        /**
   * Performs the specified operation
   * @param {any} const expectedContent of doc.content
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const expectedContent of doc.content
   * @returns {any} The operation result
   */

        for (const expectedContent of doc.content) {
          if (!docContent.includes(expectedContent)) {
            missingContent.push(expectedContent);
          }
        }        /**
   * Performs the specified operation
   * @param {boolean} missingContent.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {boolean} missingContent.length - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */


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
  }  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */


  async validateProjectSpecificFiles() {
    // This can be overridden by specific project types  /**
   * Performs the specified operation
   * @param {Object} this.config.projectType - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.projectType - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.projectType === 'react-webapp') {
      await this.validateReactSpecificFiles();
    }
  }  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Validates input data
   * @returns {Promise} Promise that resolves with the result
   */


  async validateReactSpecificFiles() {
    // LOG: 🔍 Validating React-specific files...
    try {
      const examplesDir = path.join(this.config.projectRoot, 'examples');
      const files = await fs.readdir(examplesDir);      /**
   * Performs the specified operation
   * @param {any} files.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} files.length > 0
   * @returns {any} The operation result
   */


      if (files.length > 0) {
        this.addResult('Example Patterns', 'Examples Directory', 'PASS', `${files.length} example files found`);

        // Check for component patterns file
        const hasPatternFile = files.some(file =>
          file.includes('pattern') || file.includes('demo') || file.includes('component')
        );        /**
   * Performs the specified operation
   * @param {boolean} hasPatternFile
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {boolean} hasPatternFile
   * @returns {any} The operation result
   */


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
  }  /**
   * Adds an item
   * @param {any} category
   * @param {any} item
   * @param {any} status
   * @param {any} details
   * @returns {any} The operation result
   */
  /**
   * Adds an item
   * @param {any} category
   * @param {any} item
   * @param {any} status
   * @param {any} details
   * @returns {any} The operation result
   */


  addResult(category, item, status, details) {
    this.validationResults.push({
      category,
      item,
      status,
      details
    });
  }  /**
   * Generates new data
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @returns {any} The created resource
   */


  generateReport() {
    // LOG: \\n📊 Context7 Validation Report
    // LOG: = .repeat(60)
    const categories = [...new Set(this.validationResults.map(r => r.category))];
    const totalTests = this.validationResults.length;
    const passedTests = this.validationResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.validationResults.filter(r => r.status === 'FAIL').length;
    const warnTests = this.validationResults.filter(r => r.status === 'WARN').length;

    // LOG: \\nOverall Results:
    // LOG: `Total Validations: ${totalTests}`
    // LOG: `Passed: ${passedTests} ✅`
    /**
   * Performs the specified operation
   * @param {any} warnTests > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} warnTests > 0
   * @returns {any} The operation result
   */
    if (warnTests > 0) {
      // LOG: `Warnings: ${warnTests} ⚠️`
    }
    // LOG: `Failed: ${failedTests} ❌`
    // LOG: `Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`
    // Results by category    /**
   * Performs the specified operation
   * @param {any} const category of categories
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const category of categories
   * @returns {any} The operation result
   */

    for (const category of categories) {
      // LOG: `\\n${category}:`
      // LOG: - .repeat(40)
      const categoryResults = this.validationResults.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
      const categoryTotal = categoryResults.length;

      // LOG: `${categoryPassed}/${categoryTotal} validations passed`
      /**
   * Performs the specified operation
   * @param {any} const result of categoryResults
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const result of categoryResults
   * @returns {any} The operation result
   */
      for (const result of categoryResults) {
        const status = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
        // LOG: `  ${status} ${result.item}: ${result.details}`
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
  }  /**
   * Generates new data
   * @param {any} failedTests
   * @param {any} warnTests
   * @returns {any} The created resource
   */
  /**
   * Generates new data
   * @param {any} failedTests
   * @param {any} warnTests
   * @returns {any} The created resource
   */


  generateRecommendations(failedTests, warnTests) {
    // LOG: \\n💡 Recommendations:
    // LOG: - .repeat(40)
    const failedResults = this.validationResults.filter(r => r.status === 'FAIL');
    const warnResults = this.validationResults.filter(r => r.status === 'WARN');    /**
   * Performs the specified operation
   * @param {any} failedTests - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} failedTests - Optional parameter
   * @returns {any} The operation result
   */


    if (failedTests === 0 && warnTests === 0) {
      // LOG: 🎉 Excellent! Your project fully complies with Context7 standards.
      // LOG: All AI assistants should have optimal integration capabilities.
    } else {      /**
   * Performs the specified operation
   * @param {any} failedTests > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} failedTests > 0
   * @returns {any} The operation result
   */

      if (failedTests > 0) {
        // LOG: `Found ${failedTests} critical issues that must be addressed:`
        const priorityFixes = failedResults.filter(r =>
          r.category === 'Required Files' ||
          r.category === 'MCP Configuration' ||
          r.category === 'Agent OS Config'
        );        /**
   * Performs the specified operation
   * @param {any} priorityFixes.length > 0
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} priorityFixes.length > 0
   * @returns {any} The operation result
   */


        if (priorityFixes.length > 0) {
          // LOG: \\nHigh Priority Fixes:
          priorityFixes.forEach((fix, index) => {
            // LOG: `${index + 1}. ${fix.category} - ${fix.item}: ${fix.details}`
          });
        }
      }      /**
   * Performs the specified operation
   * @param {any} warnTests > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} warnTests > 0
   * @returns {any} The operation result
   */


      if (warnTests > 0) {
        // LOG: `\\nFound ${warnTests} warnings (recommended improvements):`
        warnResults.slice(0, 5).forEach((warn, index) => {
          // LOG: `${index + 1}. ${warn.category} - ${warn.item}: ${warn.details}`
        });
      }
    }
  }

  // Static factory methods
  static async validateProject(projectRoot, options = {}) {
    const validator = new CodeFortifyValidator({
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
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };      /**
   * Performs the specified operation
   * @param {any} deps.react
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps.react
   * @returns {any} The operation result
   */


      if (deps.react) {projectType = 'react-webapp';}
      else if (deps.vue) {projectType = 'vue-webapp';}
      else if (deps.svelte) {projectType = 'svelte-webapp';}
      else if (deps.express || deps.fastify) {projectType = 'node-api';}
    } catch (error) {
      // Use default
    }

    return await CodeFortifyValidator.validateProject(projectRoot, { projectType });
  }
}

// Run validation if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const projectRoot = process.argv[2] || process.cwd();
  CodeFortifyValidator.autoDetectAndValidate(projectRoot)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      // ERROR: Validation error:, error
      process.exit(1);
    });
}