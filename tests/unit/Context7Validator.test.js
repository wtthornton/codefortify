/**
 * Unit tests for Context7Validator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Context7Validator } from '../../src/validation/Context7Validator.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs/promises
vi.mock('fs/promises');

describe('Context7Validator', () => {
  let validator;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      agentOsPath: '.agent-os',
      projectType: 'react-webapp',
      strictMode: false
    };
    validator = new Context7Validator(mockConfig);
    vi.clearAllMocks();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('constructor', () => {
    it('should initialize with correct config', () => {
      expect(validator.config.projectRoot).toBe('/test/project');
      expect(validator.config.projectType).toBe('react-webapp');
      expect(validator.validationResults).toEqual([]);
    });

    it('should use defaults for missing config', () => {
      const defaultValidator = new Context7Validator();
      expect(defaultValidator.config.projectRoot).toBe(process.cwd());
      expect(defaultValidator.config.strictMode).toBe(true);
    });
  });

  describe('setupValidationRules', () => {
    it('should set up required files for base project', () => {
      const baseValidator = new Context7Validator({ projectType: 'javascript' });
      
      expect(baseValidator.requiredFiles).toContain('.agent-os/config.yml');
      expect(baseValidator.requiredFiles).toContain('AGENTS.md');
      expect(baseValidator.requiredFiles).toContain('CLAUDE.md');
    });

    it('should add MCP server file when MCP enabled', () => {
      expect(validator.requiredFiles).toContain('src/mcp-server.js');
    });

    it('should add Agent OS files when enabled', () => {
      expect(validator.requiredFiles).toContain('.agent-os/instructions/ai-development.md');
      expect(validator.requiredFiles).toContain('.agent-os/standards/context7-standards.md');
      expect(validator.requiredFiles).toContain('.agent-os/product/mission.md');
    });

    it('should add project-specific directories for webapp projects', () => {
      expect(validator.requiredDirectories).toContain('examples');
      expect(validator.requiredDirectories).toContain('.agent-os/instructions');
    });

    it('should add tests directory for node-api projects', () => {
      const nodeValidator = new Context7Validator({ projectType: 'node-api' });
      expect(nodeValidator.requiredDirectories).toContain('tests');
    });
  });

  describe('validateFileStructure', () => {
    it('should pass validation when all files exist', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024
      });

      await validator.validateFileStructure();

      const passedResults = validator.validationResults.filter(r => r.status === 'PASS');
      expect(passedResults.length).toBeGreaterThan(0);
    });

    it('should fail validation when directories are missing', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await validator.validateFileStructure();

      const failedResults = validator.validationResults.filter(
        r => r.category === 'Directory Structure' && r.status === 'FAIL'
      );
      expect(failedResults.length).toBeGreaterThan(0);
      expect(failedResults[0].details).toBe('Directory does not exist');
    });

    it('should fail validation when files are missing', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await validator.validateFileStructure();

      const failedResults = validator.validationResults.filter(
        r => r.category === 'Required Files' && r.status === 'FAIL'
      );
      expect(failedResults.length).toBeGreaterThan(0);
    });
  });

  describe('validateAgentOSConfig', () => {
    it('should pass validation with correct config', async () => {
      const configContent = `agent_os_version: 1.4.0
mcp:
  enabled: true
agents:
  claude_code:
    enabled: true
context7:
  enabled: true`;

      vi.mocked(fs.readFile).mockResolvedValue(configContent);

      await validator.validateAgentOSConfig();

      const passedResults = validator.validationResults.filter(r => r.status === 'PASS');
      expect(passedResults).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Agent OS Config',
            item: 'agent_os_version',
            status: 'PASS'
          })
        ])
      );
    });

    it('should fail validation with missing config sections', async () => {
      const configContent = `agent_os_version: 1.4.0`;

      vi.mocked(fs.readFile).mockResolvedValue(configContent);

      await validator.validateAgentOSConfig();

      const failedResults = validator.validationResults.filter(r => r.status === 'FAIL');
      expect(failedResults.length).toBeGreaterThan(0);
    });

    it('should handle config read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await validator.validateAgentOSConfig();

      const failedResults = validator.validationResults.filter(
        r => r.category === 'Agent OS Config' && r.status === 'FAIL'
      );
      expect(failedResults.length).toBeGreaterThan(0);
    });
  });

  describe('validateMCPServer', () => {
    it('should pass validation with correct MCP server', async () => {
      const serverContent = `
import { Server, StdioServerTransport } from '@modelcontextprotocol/sdk';
import { ListResourcesRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Context7MCPServer } from './Context7MCPServer.js';

validate_context7_compliance
get_pattern_examples
check_naming_conventions
suggest_improvements
`;

      vi.mocked(fs.readFile).mockResolvedValue(serverContent);

      await validator.validateMCPServer();

      const passedResults = validator.validationResults.filter(r => r.status === 'PASS');
      expect(passedResults.length).toBeGreaterThan(0);
    });

    it('should skip validation when MCP is disabled', async () => {
      validator.config.mcpEnabled = false;
      const initialResultsLength = validator.validationResults.length;

      await validator.validateMCPServer();

      expect(validator.validationResults.length).toBe(initialResultsLength);
    });
  });

  describe('validatePackageJson', () => {
    it('should pass validation with correct package.json', async () => {
      const packageContent = JSON.stringify({
        name: 'test-project',
        dependencies: {
          '@modelcontextprotocol/sdk': '^1.17.4',
          'react': '^18.0.0'
        },
        scripts: {
          'mcp:dev': 'node src/mcp-server.js',
          'mcp:test': 'context7 test-mcp',
          'context7:validate': 'context7 validate'
        }
      });

      vi.mocked(fs.readFile).mockResolvedValue(packageContent);

      await validator.validatePackageJson();

      const passedResults = validator.validationResults.filter(r => r.status === 'PASS');
      expect(passedResults).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Package Dependencies',
            item: 'MCP SDK',
            status: 'PASS'
          }),
          expect.objectContaining({
            category: 'Project Dependencies',
            item: 'React',
            status: 'PASS'
          })
        ])
      );
    });

    it('should fail validation with missing MCP dependency', async () => {
      const packageContent = JSON.stringify({
        name: 'test-project',
        dependencies: {}
      });

      vi.mocked(fs.readFile).mockResolvedValue(packageContent);

      await validator.validatePackageJson();

      const failedResults = validator.validationResults.filter(
        r => r.category === 'Package Dependencies' && r.status === 'FAIL'
      );
      expect(failedResults.length).toBeGreaterThan(0);
    });
  });

  describe('validateDocumentation', () => {
    it('should pass validation with correct documentation', async () => {
      vi.mocked(fs.readFile).mockImplementation((filePath) => {
        if (filePath.includes('AGENTS.md')) {
          return Promise.resolve('# AGENTS.md\nContext7 MCP integration for AI coding agent');
        }
        if (filePath.includes('CLAUDE.md')) {
          return Promise.resolve('# CLAUDE.md\nContext7 guidance for Agent OS');
        }
        return Promise.resolve('# Documentation\nContext7 patterns and AI ASSISTANT CONTEXT');
      });

      await validator.validateDocumentation();

      const passedResults = validator.validationResults.filter(
        r => r.category === 'Documentation' && r.status === 'PASS'
      );
      expect(passedResults.length).toBeGreaterThan(0);
    });

    it('should fail validation with missing content', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('# Empty documentation');

      await validator.validateDocumentation();

      const failedResults = validator.validationResults.filter(
        r => r.category === 'Documentation' && r.status === 'FAIL'
      );
      expect(failedResults.length).toBeGreaterThan(0);
    });
  });

  describe('runValidation', () => {
    it('should return success when all validations pass', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
        isFile: () => true,
        size: 1024
      });
      vi.mocked(fs.readFile).mockResolvedValue('valid config content');

      const result = await validator.runValidation();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('report');
      expect(result.report).toHaveProperty('totalTests');
      expect(result.report).toHaveProperty('passedTests');
      expect(result.report).toHaveProperty('failedTests');
    });

    it('should return failure when validations fail', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('File not found'));
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      const result = await validator.runValidation();

      expect(result.success).toBe(false);
      expect(result.report.failedTests).toBeGreaterThan(0);
    });

    it('should handle validation errors', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('Unexpected error'));

      const result = await validator.runValidation();

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('static methods', () => {
    describe('validateProject', () => {
      it('should create validator and run validation', async () => {
        vi.mocked(fs.stat).mockResolvedValue({
          isDirectory: () => true,
          isFile: () => true,
          size: 1024
        });

        const result = await Context7Validator.validateProject('/test/project');

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('report');
      });
    });

    describe('autoDetectAndValidate', () => {
      it('should detect React project type', async () => {
        const packageContent = JSON.stringify({
          dependencies: { react: '^18.0.0' }
        });

        vi.mocked(fs.readFile).mockResolvedValue(packageContent);
        vi.mocked(fs.stat).mockResolvedValue({
          isDirectory: () => true,
          isFile: () => true,
          size: 1024
        });

        const result = await Context7Validator.autoDetectAndValidate('/test/project');

        expect(result).toHaveProperty('success');
      });

      it('should use default project type when detection fails', async () => {
        vi.mocked(fs.readFile).mockRejectedValue(new Error('No package.json'));
        vi.mocked(fs.stat).mockResolvedValue({
          isDirectory: () => true,
          isFile: () => true,
          size: 1024
        });

        const result = await Context7Validator.autoDetectAndValidate('/test/project');

        expect(result).toHaveProperty('success');
      });
    });
  });
});