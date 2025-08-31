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
  ListPromptsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ResourceManager } from './ResourceManager.js';
import { ToolManager } from './ToolManager.js';
import { PatternProvider } from './PatternProvider.js';

const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename); // Unused variable

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
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
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
      return await this.resourceManager.listResources();
    });

    // Read Context7 resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return await this.resourceManager.readResource(request.params.uri);
    });
  }

  setupToolHandlers() {
    // List available Context7 tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return await this.toolManager.listTools();
    });

    // Handle Context7 tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.toolManager.executeTool(request.params.name, request.params.arguments);
    });
  }

  setupPromptHandlers() {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'context7_code_review',
            description: 'Generate Context7-compliant code review',
            arguments: [
              {
                name: 'code',
                description: 'Code to review',
                required: true,
              },
              {
                name: 'file_type',
                description: 'Type of file being reviewed',
                required: false,
              },
            ],
          },
          {
            name: 'context7_component_scaffold',
            description: 'Generate Context7-compliant component scaffold',
            arguments: [
              {
                name: 'component_name',
                description: 'Name of component to scaffold',
                required: true,
              },
              {
                name: 'component_type',
                description: 'Type of component (page, ui, chart, etc.)',
                required: true,
              },
            ],
          },
        ],
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Context7 MCP Server running for ${this.config.projectName}`);
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
      agentOsPath: '.agent-os',
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