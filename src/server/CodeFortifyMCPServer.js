/**
 * CodeFortify MCP Server - AI-Powered Code Strengthening
 *
 * This server provides Model Context Protocol integration for CodeFortify,
 * enabling AI assistants to access security patterns, quality standards, and
 * fortification configurations in real-time for any project.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ResourceManager } from './ResourceManager.js';
import { ToolManager } from './ToolManager.js';
import { PatternProvider } from './PatternProvider.js';
import { TemplateManager } from '../TemplateManager.js';

const __filename = fileURLToPath(import.meta.url);
// const _dirname = path.dirname(__filename); // Unused variable - commented out

/**


 * CodeFortifyMCPServer class implementation


 *


 * Provides functionality for codefortifymcpserver operations


 */


/**


 * CodeFortifyMCPServer class implementation


 *


 * Provides functionality for codefortifymcpserver operations


 */


export class CodeFortifyMCPServer {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.env.PROJECT_ROOT || process.cwd(),
      codefortifyPath: config.codefortifyPath || process.env.CODEFORTIFY_PATH || '.codefortify',
      projectName: config.projectName || 'project',
      projectType: config.projectType || 'react-webapp',
      ...config
    };

    this.server = new Server(
      {
        name: `codefortify-${this.config.projectName}`,
        version: '1.0.0'
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {}
        }
      }
    );

    this.resourceManager = new ResourceManager(this.config);
    this.toolManager = new ToolManager(this.config);
    this.patternProvider = new PatternProvider(this.config);

    // Initialize template manager
    this.templateManager = new TemplateManager({
      projectRoot: this.config.projectRoot,
      templatesPath: path.join(path.dirname(__filename), '..', '..', 'templates')
    });

    // Detect project template
    this.detectProjectTemplate();

    this.setupHandlers();
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async detectProjectTemplate() {
    try {
      const templates = await this.templateManager.discoverTemplates();
      const projectTemplates = templates.filter(t => t.type === 'project');

      // Try to detect which template this project uses
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
      if (await fs.access(packageJsonPath).then(() => true).catch(() => false)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Detect based on dependencies        /**
   * Performs the specified operation
   * @param {any} dependencies.react && dependencies['react-dom']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} dependencies.react && dependencies['react-dom']
   * @returns {any} The operation result
   */

        if (dependencies.react && dependencies['react-dom']) {
          this.config.projectTemplate = 'react-webapp';
        } else if (dependencies.vue) {
          this.config.projectTemplate = 'vue-webapp';
        } else if (dependencies.express || dependencies.fastify) {
          this.config.projectTemplate = 'node-api';
        }
      }

      // Check for existing .codefortify directory
      const codefortifyPath = path.join(this.config.projectRoot, this.config.codefortifyPath);
      if (await fs.access(codefortifyPath).then(() => true).catch(() => false)) {
        // Project already has standards, use them
        this.config.projectTemplate = 'existing';
      }

    } catch (error) {
      // WARN: Could not detect project template:, error.message
      this.config.projectTemplate = 'default';
    }
  }  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupHandlers() {
    this.setupResourceHandlers();
    this.setupToolHandlers();
    this.setupPromptHandlers();
  }  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupResourceHandlers() {
    // List available Context7 resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        // ERROR: MCP: ✅ Received resource list request
        const result = await this.resourceManager.listResources();

        // Add template-specific resources if available        /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

        if (this.config.projectTemplate && this.config.projectTemplate !== 'existing') {
          try {
            const templateResources = await this.templateManager.getTemplateResources(this.config.projectTemplate);
            result.resources.push(...templateResources);
          } catch (error) {
            // WARN: Could not load template resources:, error.message
          }
        }

        // ERROR: MCP: ✅ Resources listed successfully
        return result;
      } catch (error) {
        // ERROR: MCP: ❌ Resource listing failed:, error.message
        // ERROR: MCP: Stack:, error.stack
        throw error;
      }
    });

    // Read Context7 resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        // ERROR: `MCP: ✅ Received resource read request: ${request.params.uri}`
        // Try template-specific resource first        /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

        if (this.config.projectTemplate && this.config.projectTemplate !== 'existing') {
          try {
            const templateContent = await this.templateManager.readTemplateResource(this.config.projectTemplate, request.params.uri);
            // ERROR: MCP: ✅ Template resource read successfully
            return { contents: [{ uri: request.params.uri, text: templateContent }] };
          } catch (error) {
            // Fall back to default resource loading
          }
        }

        const result = await this.resourceManager.readResource(request.params.uri);
        // ERROR: MCP: ✅ Resource read successfully
        return result;
      } catch (error) {
        // ERROR: MCP: ❌ Resource read failed:, error.message
        // ERROR: MCP: Stack:, error.stack
        throw error;
      }
    });
  }  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupToolHandlers() {
    // List available Context7 tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        // ERROR: MCP: ✅ Received tool list request
        const result = await this.toolManager.listTools();
        // ERROR: MCP: ✅ Tools listed successfully
        return result;
      } catch (error) {
        // ERROR: MCP: ❌ Tool listing failed:, error.message
        // ERROR: MCP: Stack:, error.stack
        throw error;
      }
    });

    // Handle Context7 tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // ERROR: `MCP: ✅ Received tool execution request: ${request.params.name}`
        const result = await this.toolManager.executeTool(request.params.name, request.params.arguments);
        // ERROR: MCP: ✅ Tool executed successfully
        return result;
      } catch (error) {
        // ERROR: MCP: ❌ Tool execution failed:, error.message
        // ERROR: MCP: Stack:, error.stack
        throw error;
      }
    });
  }  /**
   * Sets configuration
   * @returns {any} The operation result
   */
  /**
   * Sets configuration
   * @returns {any} The operation result
   */


  setupPromptHandlers() {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      try {
        // ERROR: MCP: Listing prompts...
        const result = {
          prompts: [
            {
              name: 'context7_code_review',
              description: 'Generate Context7-compliant code review',
              arguments: [
                {
                  name: 'code',
                  description: 'Code to review',
                  required: true
                },
                {
                  name: 'file_type',
                  description: 'Type of file being reviewed',
                  required: false
                }
              ]
            },
            {
              name: 'context7_component_scaffold',
              description: 'Generate Context7-compliant component scaffold',
              arguments: [
                {
                  name: 'component_name',
                  description: 'Name of component to scaffold',
                  required: true
                },
                {
                  name: 'component_type',
                  description: 'Type of component (page, ui, chart, etc.)',
                  required: true
                }
              ]
            }
          ]
        };
        // ERROR: MCP: Prompts listed successfully
        return result;
      } catch (error) {
        // ERROR: MCP: Prompt listing failed:, error.message
        throw error;
      }
    });

    // Handle prompt execution (missing handler)
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        // ERROR: `MCP: Executing prompt: ${request.params.name}`
        const result = await Promise.race([
          this.executePrompt(request.params.name, request.params.arguments),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Prompt execution timeout')), 10000))
        ]);
        // ERROR: MCP: Prompt executed successfully
        return result;
      } catch (error) {
        // ERROR: MCP: Prompt execution failed:, error.message
        throw error;
      }
    });
  }  /**
   * Executes the operation
   * @param {any} name
   * @param {any} args
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Executes the operation
   * @param {any} name
   * @param {any} args
   * @returns {Promise} Promise that resolves with the result
   */


  async executePrompt(name, args) {  /**
   * Performs the specified operation
   * @param {any} name
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} name
   * @returns {any} The operation result
   */

    switch (name) {
    case 'context7_code_review':
      return await this.generateCodeReview(args);
    case 'context7_component_scaffold':
      return await this.generateComponentScaffold(args);
    default:
      throw new Error(`Unknown prompt: ${name}`);
    }
  }  /**
   * Generates new data
   * @param {any} args
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Generates new data
   * @param {any} args
   * @returns {Promise} Promise that resolves with the result
   */


  async generateCodeReview(args) {
    const { code, file_type = 'javascript' } = args;

    try {
      // Use validation tools to generate review
      const validation = await this.toolManager.executeTool('validate_context7_compliance', {
        code,
        language: file_type,
        component_type: 'general'
      });

      const suggestions = await this.toolManager.executeTool('suggest_improvements', {
        code,
        focus_area: 'all'
      });

      const review = `# Context7 Code Review

## Code Quality Assessment
${validation.content[0].text}

## Improvement Suggestions
${suggestions.content[0].text}

## Next Steps
1. Address any compliance issues identified above
2. Implement suggested improvements
3. Add missing documentation or error handling
4. Ensure proper testing coverage`;

      return {
        messages: [
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: review
            }
          }
        ]
      };
    } catch (error) {
      throw new Error(`Code review generation failed: ${error.message}`);
    }
  }  /**
   * Generates new data
   * @param {any} args
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Generates new data
   * @param {any} args
   * @returns {Promise} Promise that resolves with the result
   */


  async generateComponentScaffold(args) {
    const { component_name, component_type } = args;

    try {
      const scaffold = await this.toolManager.executeTool('generate_component_scaffold', {
        component_name,
        component_type,
        framework: this.config.projectType,
        props: ['className', 'children']
      });

      const instructions = `# ${component_name} Component Scaffold

Generated scaffold for ${component_type} component in ${this.config.projectType} project.

## Implementation Notes
- Follow Context7 standards for component structure
- Add proper TypeScript interfaces
- Include loading and error states
- Add AI ASSISTANT CONTEXT comments
- Ensure accessibility compliance

## Generated Code
\`\`\`typescript
${scaffold.content[0].text}
\`\`\``;

      return {
        messages: [
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: instructions
            }
          }
        ]
      };
    } catch (error) {
      throw new Error(`Component scaffold generation failed: ${error.message}`);
    }
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async start() {
    try {
      // ERROR: MCP: Starting Context7 MCP Server...
      // ERROR: `MCP: Project root: ${this.config.projectRoot}`
      // ERROR: `MCP: Project type: ${this.config.projectType}`
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      // ERROR: `Context7 MCP Server running for ${this.config.projectName}`
      // ERROR: MCP: Server started successfully
      // ERROR: MCP: Waiting for requests...
    } catch (error) {
      // ERROR: MCP: Failed to start server:, error.message
      // ERROR: MCP: Stack trace:, error.stack
      throw error;
    }
  }

  static async createFromConfig(configPath) {
    try {
      const configFile = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configFile);
      return new CodeFortifyMCPServer(config);
    } catch (error) {
      // ERROR: `Failed to load config from ${configPath}:`, error.message
      return new CodeFortifyMCPServer();
    }
  }

  static async autoDetectAndStart(projectRoot = process.cwd()) {
    // Auto-detect project type and configuration
    const config = await CodeFortifyMCPServer.detectProjectConfig(projectRoot);
    const server = new CodeFortifyMCPServer(config);
    await server.start();
  }

  static async detectProjectConfig(projectRoot) {
    const config = {
      projectRoot,
      codefortifyPath: '.codefortify'
    };

    try {
      // Try to read package.json to determine project type and name
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      config.projectName = packageJson.name || 'project';

      // Detect project type based on dependencies
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


      if (deps.react) {
        config.projectType = 'react-webapp';
      } else if (deps.express || deps.fastify || deps.koa) {
        config.projectType = 'node-api';
      } else if (deps.vue) {
        config.projectType = 'vue-webapp';
      } else if (deps.svelte) {
        config.projectType = 'svelte-webapp';
      } else {
        config.projectType = 'javascript';
      }

    } catch (error) {
      // Use defaults if package.json not found
      config.projectName = path.basename(projectRoot);
      config.projectType = 'javascript';
    }

    try {
      // Try to read context7 config if it exists
      const context7ConfigPath = path.join(projectRoot, 'context7.config.js');
      await fs.access(context7ConfigPath);

      // If config exists, import it
      const configModule = await import(`file://${context7ConfigPath}`);
      Object.assign(config, configModule.default || configModule);

    } catch (error) {
      // No context7 config found, use detected values
    }

    return config;
  }
}

// Start server if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  CodeFortifyMCPServer.autoDetectAndStart().catch((error) => {
    // ERROR: Failed to start Context7 MCP server:, error
    process.exit(1);
  });
}