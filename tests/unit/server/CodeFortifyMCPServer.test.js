import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeFortifyMCPServer } from '../../../src/server/CodeFortifyMCPServer.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';

// Mock MCP SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn()
}));

// Mock dependencies
vi.mock('../../../src/server/ResourceManager.js', () => ({
  ResourceManager: vi.fn().mockImplementation(() => ({
    getSecurityPatterns: vi.fn().mockResolvedValue([]),
    getQualityStandards: vi.fn().mockResolvedValue([]),
    getConfiguration: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('../../../src/server/ToolManager.js', () => ({
  ToolManager: vi.fn().mockImplementation(() => ({
    getAvailableTools: vi.fn().mockReturnValue([]),
    executeTool: vi.fn().mockResolvedValue({ success: true })
  }))
}));

vi.mock('../../../src/server/PatternProvider.js', () => ({
  PatternProvider: vi.fn().mockImplementation(() => ({
    getPatterns: vi.fn().mockResolvedValue([]),
    searchPatterns: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('../../../src/TemplateManager.js', () => ({
  TemplateManager: vi.fn().mockImplementation(() => ({
    getTemplates: vi.fn().mockResolvedValue([]),
    generateTemplate: vi.fn().mockResolvedValue('')
  }))
}));

vi.mock('fs/promises');

describe('CodeFortifyMCPServer', () => {
  let server;
  let mockConfig;
  let mockMcpServer;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      name: 'test-codefortify',
      version: '1.0.0',
      verbose: false
    };

    mockMcpServer = {
      setRequestHandler: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined)
    };

    Server.mockImplementation(() => mockMcpServer);

    server = new CodeFortifyMCPServer(mockConfig);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(server.config.projectRoot).toBe('/test/project');
      expect(server.config.name).toBe('test-codefortify');
      expect(server.config.version).toBe('1.0.0');
      expect(server.config.verbose).toBe(false);
    });

    it('should use default config values when not provided', () => {
      const defaultServer = new CodeFortifyMCPServer();
      expect(defaultServer.config.projectRoot).toBe(process.cwd());
      expect(defaultServer.config.name).toBe('codefortify');
      expect(defaultServer.config.version).toBe('1.0.0');
    });

    it('should initialize MCP server with correct config', () => {
      expect(Server).toHaveBeenCalledWith(
        {
          name: 'test-codefortify',
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
    });

    it('should initialize managers', () => {
      expect(server.resourceManager).toBeDefined();
      expect(server.toolManager).toBeDefined();
      expect(server.patternProvider).toBeDefined();
      expect(server.templateManager).toBeDefined();
    });
  });

  describe('detectProjectTemplate', () => {
    beforeEach(() => {
      fs.readFile = vi.fn();
      fs.access = vi.fn();
    });

    it('should detect React project template', async () => {
      const mockPackageJson = {
        dependencies: { react: '18.0.0' }
      };
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      fs.access.mockResolvedValue();

      const template = await server.detectProjectTemplate();

      expect(template).toBe('react-webapp');
    });

    it('should detect Vue project template', async () => {
      const mockPackageJson = {
        dependencies: { vue: '3.0.0' }
      };
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      fs.access.mockResolvedValue();

      const template = await server.detectProjectTemplate();

      expect(template).toBe('vue-webapp');
    });

    it('should detect Node.js API template', async () => {
      const mockPackageJson = {
        dependencies: { express: '4.0.0' },
        main: 'server.js'
      };
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      fs.access.mockResolvedValue();

      const template = await server.detectProjectTemplate();

      expect(template).toBe('node-api');
    });

    it('should default to javascript template', async () => {
      const mockPackageJson = {
        dependencies: {}
      };
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      fs.access.mockResolvedValue();

      const template = await server.detectProjectTemplate();

      expect(template).toBe('javascript');
    });

    it('should handle missing package.json', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));

      const template = await server.detectProjectTemplate();

      expect(template).toBe('javascript');
    });
  });

  describe('setupHandlers', () => {
    it('should setup resource handlers', () => {
      const setupResourceHandlersSpy = vi.spyOn(server, 'setupResourceHandlers').mockImplementation(() => {});

      server.setupHandlers();

      expect(setupResourceHandlersSpy).toHaveBeenCalled();
    });

    it('should setup tool handlers', () => {
      const setupToolHandlersSpy = vi.spyOn(server, 'setupToolHandlers').mockImplementation(() => {});

      server.setupHandlers();

      expect(setupToolHandlersSpy).toHaveBeenCalled();
    });

    it('should setup prompt handlers', () => {
      const setupPromptHandlersSpy = vi.spyOn(server, 'setupPromptHandlers').mockImplementation(() => {});

      server.setupHandlers();

      expect(setupPromptHandlersSpy).toHaveBeenCalled();
    });
  });

  describe('setupResourceHandlers', () => {
    it('should register list resources handler', () => {
      server.setupResourceHandlers();

      expect(mockMcpServer.setRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'resources/list' }),
        expect.any(Function)
      );
    });

    it('should register read resource handler', () => {
      server.setupResourceHandlers();

      expect(mockMcpServer.setRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'resources/read' }),
        expect.any(Function)
      );
    });
  });

  describe('setupToolHandlers', () => {
    it('should register list tools handler', () => {
      server.setupToolHandlers();

      expect(mockMcpServer.setRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'tools/list' }),
        expect.any(Function)
      );
    });

    it('should register call tool handler', () => {
      server.setupToolHandlers();

      expect(mockMcpServer.setRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'tools/call' }),
        expect.any(Function)
      );
    });
  });

  describe('setupPromptHandlers', () => {
    it('should register list prompts handler', () => {
      server.setupPromptHandlers();

      expect(mockMcpServer.setRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'prompts/list' }),
        expect.any(Function)
      );
    });

    it('should register get prompt handler', () => {
      server.setupPromptHandlers();

      expect(mockMcpServer.setRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'prompts/get' }),
        expect.any(Function)
      );
    });
  });

  describe('executePrompt', () => {
    it('should execute code review prompt', async () => {
      const args = { file: 'test.js', context: 'security' };

      const result = await server.executePrompt('code-review', args);

      expect(result).toHaveProperty('messages');
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it('should execute component scaffold prompt', async () => {
      const args = { name: 'Button', type: 'react' };

      const result = await server.executePrompt('component-scaffold', args);

      expect(result).toHaveProperty('messages');
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it('should handle unknown prompt names', async () => {
      await expect(server.executePrompt('unknown-prompt', {})).rejects.toThrow('Unknown prompt: unknown-prompt');
    });
  });

  describe('generateCodeReview', () => {
    it('should generate code review with file content', async () => {
      const args = { file: 'test.js', context: 'security' };
      fs.readFile.mockResolvedValue('console.log("test");');

      const result = await server.generateCodeReview(args);

      expect(result).toHaveProperty('messages');
      expect(result.messages[0]).toHaveProperty('role', 'user');
      expect(result.messages[0].content.text).toContain('test.js');
    });

    it('should handle missing file', async () => {
      const args = { file: 'missing.js' };
      fs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await server.generateCodeReview(args);

      expect(result.messages[0].content.text).toContain('Error reading file');
    });
  });

  describe('generateComponentScaffold', () => {
    it('should generate React component scaffold', async () => {
      const args = { name: 'Button', type: 'react' };

      const result = await server.generateComponentScaffold(args);

      expect(result).toHaveProperty('messages');
      expect(result.messages[0].content.text).toContain('Button');
      expect(result.messages[0].content.text).toContain('React');
    });

    it('should generate Vue component scaffold', async () => {
      const args = { name: 'Card', type: 'vue' };

      const result = await server.generateComponentScaffold(args);

      expect(result.messages[0].content.text).toContain('Card');
      expect(result.messages[0].content.text).toContain('Vue');
    });

    it('should default to React for unknown types', async () => {
      const args = { name: 'Widget', type: 'unknown' };

      const result = await server.generateComponentScaffold(args);

      expect(result.messages[0].content.text).toContain('React');
    });
  });

  describe('start', () => {
    it('should setup handlers and connect to transport', async () => {
      const mockTransport = {};
      StdioServerTransport.mockReturnValue(mockTransport);

      const setupHandlersSpy = vi.spyOn(server, 'setupHandlers').mockImplementation(() => {});

      await server.start();

      expect(setupHandlersSpy).toHaveBeenCalled();
      expect(mockMcpServer.connect).toHaveBeenCalledWith(mockTransport);
    });

    it('should handle connection errors', async () => {
      mockMcpServer.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(server.start()).rejects.toThrow('Connection failed');
    });
  });

  describe('static methods', () => {
    describe('createFromConfig', () => {
      it('should create server from config file', async () => {
        const mockConfig = { projectRoot: '/custom/project' };
        fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

        const result = await CodeFortifyMCPServer.createFromConfig('/path/to/config.json');

        expect(result).toBeInstanceOf(CodeFortifyMCPServer);
        expect(fs.readFile).toHaveBeenCalledWith('/path/to/config.json', 'utf8');
      });

      it('should handle config file read errors', async () => {
        fs.readFile.mockRejectedValue(new Error('Config not found'));

        await expect(CodeFortifyMCPServer.createFromConfig('/missing/config.json'))
          .rejects.toThrow('Config not found');
      });
    });

    describe('autoDetectAndStart', () => {
      it('should auto-detect project and start server', async () => {
        const mockPackageJson = { dependencies: { react: '18.0.0' } };
        fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
        fs.access.mockResolvedValue();

        const startSpy = vi.fn().mockResolvedValue(undefined);
        CodeFortifyMCPServer.prototype.start = startSpy;

        await CodeFortifyMCPServer.autoDetectAndStart('/test/project');

        expect(startSpy).toHaveBeenCalled();
      });

      it('should handle auto-detection errors', async () => {
        fs.readFile.mockRejectedValue(new Error('Detection failed'));

        // Should not throw, should use default config
        const result = await CodeFortifyMCPServer.autoDetectAndStart();
        expect(result).toBeInstanceOf(CodeFortifyMCPServer);
      });
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', () => {
      const invalidConfig = { projectRoot: null };

      expect(() => new CodeFortifyMCPServer(invalidConfig)).not.toThrow();
    });

    it('should handle manager initialization failures', () => {
      // Test that server can still be created even if managers fail to initialize
      expect(server.resourceManager).toBeDefined();
      expect(server.toolManager).toBeDefined();
      expect(server.patternProvider).toBeDefined();
      expect(server.templateManager).toBeDefined();
    });
  });
});