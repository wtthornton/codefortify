#!/usr/bin/env node

/**
 * Context7 MCP Server - Reusable Package
 *
 * This server provides Model Context Protocol integration for Context7 standards,
 * enabling AI assistants to access project patterns, standards, and configurations
 * in real-time for any project.
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

const __filename = fileURLToPath(import.meta.url);
// const _dirname = path.dirname(__filename); // Unused variable - commented out

export class Context7MCPServer {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.env.PROJECT_ROOT || process.cwd(),
      agentOsPath: config.agentOsPath || process.env.AGENT_OS_PATH || '.agent-os',
      projectName: config.projectName || 'project',
      projectType: config.projectType || 'react-webapp',
      ...config
    };

    this.server = new Server(
      {
        name: `context7-${this.config.projectName}`,
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

    this.setupHandlers();
  }

  setupHandlers() {
    this.setupResourceHandlers();
    this.setupToolHandlers();
    this.setupPromptHandlers();
  }

  setupResourceHandlers() {
    // List available Context7 resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        console.error('MCP: ✅ Received resource list request');
        const result = await this.resourceManager.listResources();
        console.error('MCP: ✅ Resources listed successfully');
        return result;
      } catch (error) {
        console.error('MCP: ❌ Resource listing failed:', error.message);
        console.error('MCP: Stack:', error.stack);
        throw error;
      }
    });

    // Read Context7 resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        console.error(`MCP: ✅ Received resource read request: ${request.params.uri}`);
        const result = await this.resourceManager.readResource(request.params.uri);
        console.error('MCP: ✅ Resource read successfully');
        return result;
      } catch (error) {
        console.error('MCP: ❌ Resource read failed:', error.message);
        console.error('MCP: Stack:', error.stack);
        throw error;
      }
    });
  }

  setupToolHandlers() {
    // List available Context7 tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        console.error('MCP: ✅ Received tool list request');
        const result = await this.toolManager.listTools();
        console.error('MCP: ✅ Tools listed successfully');
        return result;
      } catch (error) {
        console.error('MCP: ❌ Tool listing failed:', error.message);
        console.error('MCP: Stack:', error.stack);
        throw error;
      }
    });

    // Handle Context7 tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        console.error(`MCP: ✅ Received tool execution request: ${request.params.name}`);
        const result = await this.toolManager.executeTool(request.params.name, request.params.arguments);
        console.error('MCP: ✅ Tool executed successfully');
        return result;
      } catch (error) {
        console.error('MCP: ❌ Tool execution failed:', error.message);
        console.error('MCP: Stack:', error.stack);
        throw error;
      }
    });
  }

  setupPromptHandlers() {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      try {
        console.error('MCP: Listing prompts...');
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
        console.error('MCP: Prompts listed successfully');
        return result;
      } catch (error) {
        console.error('MCP: Prompt listing failed:', error.message);
        throw error;
      }
    });

    // Handle prompt execution (missing handler)
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        console.error(`MCP: Executing prompt: ${request.params.name}`);
        const result = await Promise.race([
          this.executePrompt(request.params.name, request.params.arguments),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Prompt execution timeout')), 10000))
        ]);
        console.error('MCP: Prompt executed successfully');
        return result;
      } catch (error) {
        console.error('MCP: Prompt execution failed:', error.message);
        throw error;
      }
    });
  }

  async executePrompt(name, args) {
    switch (name) {
    case 'context7_code_review':
      return await this.generateCodeReview(args);
    case 'context7_component_scaffold':
      return await this.generateComponentScaffold(args);
    default:
      throw new Error(`Unknown prompt: ${name}`);
    }
  }

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
  }

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
  }

  async start() {
    try {
      console.error('MCP: Starting Context7 MCP Server...');
      console.error(`MCP: Project root: ${this.config.projectRoot}`);
      console.error(`MCP: Project type: ${this.config.projectType}`);
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error(`Context7 MCP Server running for ${this.config.projectName}`);
      console.error('MCP: Server started successfully');
      console.error('MCP: Waiting for requests...');
    } catch (error) {
      console.error('MCP: Failed to start server:', error.message);
      console.error('MCP: Stack trace:', error.stack);
      throw error;
    }
  }

  static async createFromConfig(configPath) {
    try {
      const configFile = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configFile);
      return new Context7MCPServer(config);
    } catch (error) {
      console.error(`Failed to load config from ${configPath}:`, error.message);
      return new Context7MCPServer();
    }
  }

  static async autoDetectAndStart(projectRoot = process.cwd()) {
    // Auto-detect project type and configuration
    const config = await Context7MCPServer.detectProjectConfig(projectRoot);
    const server = new Context7MCPServer(config);
    await server.start();
  }

  static async detectProjectConfig(projectRoot) {
    const config = {
      projectRoot,
      agentOsPath: '.agent-os'
    };

    try {
      // Try to read package.json to determine project type and name
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      config.projectName = packageJson.name || 'project';

      // Detect project type based on dependencies
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

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
  Context7MCPServer.autoDetectAndStart().catch((error) => {
    console.error('Failed to start Context7 MCP server:', error);
    process.exit(1);
  });
}