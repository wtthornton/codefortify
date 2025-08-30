/**
 * Integration tests for MCP Server functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Context7MCPServer } from '../../src/server/Context7MCPServer.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Context7MCPServer Integration', () => {
  let server;
  let serverProcess;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      projectRoot: global.testConfig.projectRoot,
      agentOsPath: '.agent-os',
      projectType: 'react-webapp',
      projectName: 'test-project'
    };
  });

  afterEach(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (server) {
      // Server cleanup if needed
    }
  });

  describe('Server Initialization', () => {
    it('should create server with default config', () => {
      server = new Context7MCPServer();
      
      expect(server.config.projectRoot).toBeDefined();
      expect(server.config.projectName).toBeDefined();
      expect(server.server).toBeDefined();
      expect(server.resourceManager).toBeDefined();
      expect(server.toolManager).toBeDefined();
      expect(server.patternProvider).toBeDefined();
    });

    it('should create server with custom config', () => {
      server = new Context7MCPServer(mockConfig);
      
      expect(server.config.projectRoot).toBe(mockConfig.projectRoot);
      expect(server.config.projectType).toBe(mockConfig.projectType);
      expect(server.config.projectName).toBe(mockConfig.projectName);
    });

    it('should setup request handlers', () => {
      server = new Context7MCPServer(mockConfig);
      
      // Verify handlers are set up (indirect test via server structure)
      expect(server.server).toBeDefined();
      expect(typeof server.setupResourceHandlers).toBe('function');
      expect(typeof server.setupToolHandlers).toBe('function');
      expect(typeof server.setupPromptHandlers).toBe('function');
    });
  });

  describe('Static Methods', () => {
    it('should detect React project config', async () => {
      const config = await Context7MCPServer.detectProjectConfig(global.testConfig.projectRoot);
      
      expect(config.projectRoot).toBe(global.testConfig.projectRoot);
      expect(config.projectType).toBe('react-webapp');
      expect(config.projectName).toBe('test-project');
    });

    it('should use defaults for missing package.json', async () => {
      const nonExistentPath = path.join(__dirname, 'non-existent');
      const config = await Context7MCPServer.detectProjectConfig(nonExistentPath);
      
      expect(config.projectRoot).toBe(nonExistentPath);
      expect(config.projectType).toBe('javascript');
      expect(config.agentOsPath).toBe('.agent-os');
    });
  });

  describe('MCP Protocol Communication', () => {
    // Note: These tests would ideally use a real MCP client, but we'll simulate the protocol

    it('should handle resource list requests', async () => {
      server = new Context7MCPServer(mockConfig);
      
      // Simulate MCP resource list request
      const mockRequest = {
        method: 'resources/list',
        params: {}
      };

      // Test the resource manager directly since we can't easily test the full MCP stack
      const result = await server.resourceManager.listResources();
      
      expect(result).toHaveProperty('resources');
      expect(result.resources).toBeInstanceOf(Array);
      expect(result.resources.length).toBeGreaterThan(0);
      
      const resourceNames = result.resources.map(r => r.name);
      expect(resourceNames).toContain('Technology Stack Standards');
      expect(resourceNames).toContain('Context7 Implementation Standards');
    });

    it('should handle tool list requests', async () => {
      server = new Context7MCPServer(mockConfig);
      
      const result = await server.toolManager.listTools();
      
      expect(result).toHaveProperty('tools');
      expect(result.tools).toBeInstanceOf(Array);
      expect(result.tools.length).toBeGreaterThan(0);
      
      const toolNames = result.tools.map(t => t.name);
      expect(toolNames).toContain('validate_context7_compliance');
      expect(toolNames).toContain('get_pattern_examples');
      expect(toolNames).toContain('check_naming_conventions');
    });

    it('should handle tool execution requests', async () => {
      server = new Context7MCPServer(mockConfig);
      
      const result = await server.toolManager.executeTool('validate_context7_compliance', {
        code: 'export const TestComponent: React.FC = () => <div>Test</div>;',
        language: 'typescript',
        component_type: 'react'
      });
      
      expect(result).toHaveProperty('content');
      expect(result.content[0]).toHaveProperty('type', 'text');
      
      const response = JSON.parse(result.content[0].text);
      expect(response).toHaveProperty('compliance_score');
      expect(response).toHaveProperty('issues');
      expect(response).toHaveProperty('suggestions');
    });
  });

  describe('Resource Access', () => {
    it('should read existing resources', async () => {
      server = new Context7MCPServer(mockConfig);
      
      // Test pattern generation (which doesn't require file system access)
      const result = await server.resourceManager.readResource('context7://patterns/component-patterns');
      
      expect(result).toHaveProperty('contents');
      expect(result.contents[0]).toHaveProperty('uri', 'context7://patterns/component-patterns');
      expect(result.contents[0]).toHaveProperty('mimeType', 'text/typescript');
      expect(result.contents[0].text).toContain('React.FC');
    });

    it('should handle resource read errors', async () => {
      server = new Context7MCPServer(mockConfig);
      
      await expect(
        server.resourceManager.readResource('context7://unknown/resource')
      ).rejects.toThrow('Unknown resource URI');
    });
  });

  describe('Context7 Tool Integration', () => {
    it('should validate React code compliance', async () => {
      server = new Context7MCPServer(mockConfig);
      
      const reactCode = `
import React from 'react';

/** AI ASSISTANT CONTEXT: Test component for validation */
export const TestComponent: React.FC = () => {
  return <div className="p-4">Hello World</div>;
};
`;

      const result = await server.toolManager.executeTool('validate_context7_compliance', {
        code: reactCode,
        language: 'typescript',
        component_type: 'react'
      });
      
      const response = JSON.parse(result.content[0].text);
      
      // Should have fewer issues since it includes AI ASSISTANT CONTEXT and React.FC
      expect(response.compliance_score).toBeGreaterThan(50);
      expect(response.project_type).toBe('react-webapp');
    });

    it('should provide pattern examples', async () => {
      server = new Context7MCPServer(mockConfig);
      
      const result = await server.toolManager.executeTool('get_pattern_examples', {
        pattern_type: 'component',
        framework: 'react'
      });
      
      const pattern = result.content[0].text;
      
      expect(pattern).toContain('React.FC');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
      expect(pattern).toContain('useQuery');
      expect(pattern).toContain('isLoading');
      expect(pattern).toContain('error');
    });

    it('should check naming conventions', async () => {
      server = new Context7MCPServer(mockConfig);
      
      const result = await server.toolManager.executeTool('check_naming_conventions', {
        names: ['GoodComponent', 'badComponent', 'useGoodHook', 'badHook'],
        context: 'component'
      });
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.results).toHaveLength(4);
      expect(response.results[0].isValid).toBe(true);  // GoodComponent
      expect(response.results[1].isValid).toBe(false); // badComponent
    });

    it('should suggest improvements', async () => {
      server = new Context7MCPServer(mockConfig);
      
      const codeWithIssues = `
const items = data.map(item => <div>{item.name}</div>);
return (
  <div>
    <button onClick={handleClick}>Click</button>
    <img src="image.jpg" />
    {items}
  </div>
);
`;

      const result = await server.toolManager.executeTool('suggest_improvements', {
        code: codeWithIssues,
        focus_area: 'accessibility'
      });
      
      const response = JSON.parse(result.content[0].text);
      
      expect(response.suggestions.length).toBeGreaterThan(0);
      
      const categories = response.suggestions.map(s => s.category);
      expect(categories).toContain('Accessibility');
      expect(categories).toContain('Performance');
    });
  });

  describe('Project Type Detection', () => {
    it('should detect Vue projects', async () => {
      // This would require setting up a Vue project fixture
      const vueConfig = {
        ...mockConfig,
        projectType: 'vue-webapp'
      };
      
      server = new Context7MCPServer(vueConfig);
      
      const result = await server.toolManager.executeTool('get_pattern_examples', {
        pattern_type: 'component',
        framework: 'vue'
      });
      
      const pattern = result.content[0].text;
      expect(pattern).toContain('<template>');
      expect(pattern).toContain('<script setup>');
    });

    it('should detect Node.js projects', async () => {
      const nodeConfig = {
        ...mockConfig,
        projectType: 'node-api'
      };
      
      server = new Context7MCPServer(nodeConfig);
      
      const result = await server.toolManager.executeTool('get_pattern_examples', {
        pattern_type: 'service',
        framework: 'node'
      });
      
      const pattern = result.content[0].text;
      expect(pattern).toContain('ExampleService');
      expect(pattern).toContain('dependency injection');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool arguments', async () => {
      server = new Context7MCPServer(mockConfig);
      
      await expect(
        server.toolManager.executeTool('validate_context7_compliance', {
          // Missing required 'code' parameter
          language: 'typescript'
        })
      ).rejects.toThrow();
    });

    it('should handle invalid resource URIs gracefully', async () => {
      server = new Context7MCPServer(mockConfig);
      
      await expect(
        server.resourceManager.readResource('invalid://uri/format')
      ).rejects.toThrow();
    });
  });
});