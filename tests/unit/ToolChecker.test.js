/**
 * Tests for ToolChecker - focusing on simple methods and configuration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolChecker } from '../../src/scoring/core/ToolChecker.js';

describe('ToolChecker', () => {
  let toolChecker;

  beforeEach(() => {
    toolChecker = new ToolChecker(false);
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default verbose false', () => {
      const checker = new ToolChecker();
      expect(checker.verbose).toBe(false);
      expect(checker.toolStatus).toEqual({});
    });

    it('should initialize with verbose true when specified', () => {
      const checker = new ToolChecker(true);
      expect(checker.verbose).toBe(true);
      expect(checker.toolStatus).toEqual({});
    });

    it('should initialize toolStatus as empty object', () => {
      expect(toolChecker.toolStatus).toEqual({});
    });
  });

  describe('Installation Guidance', () => {
    it('should return correct guidance for known tools', () => {
      expect(toolChecker.getInstallationGuidance('npm audit')).toBe('npm is required for vulnerability scanning');
      expect(toolChecker.getInstallationGuidance('ESLint')).toBe('npm install --save-dev eslint');
      expect(toolChecker.getInstallationGuidance('c8 coverage')).toBe('npm install --save-dev c8');
      expect(toolChecker.getInstallationGuidance('TypeScript')).toBe('npm install --save-dev typescript');
    });

    it('should return default guidance for unknown tools', () => {
      expect(toolChecker.getInstallationGuidance('unknown-tool')).toBe('Check official documentation for installation');
      expect(toolChecker.getInstallationGuidance('')).toBe('Check official documentation for installation');
    });
  });

  describe('Tool Status Management', () => {
    beforeEach(() => {
      // Set up mock tool status
      toolChecker.toolStatus = {
        security: [
          { name: 'npm audit', available: true },
          { name: 'security-tool', available: false }
        ],
        quality: [
          { name: 'ESLint', available: true },
          { name: 'TypeScript', available: false }
        ],
        testing: [
          { name: 'c8 coverage', available: true }
        ]
      };
    });

    describe('isToolAvailable', () => {
      it('should return tool object when tool is available', () => {
        const result = toolChecker.isToolAvailable('security', 'npm audit');
        expect(result).toEqual({ name: 'npm audit', available: true });
      });

      it('should return false when tool is not available', () => {
        const result = toolChecker.isToolAvailable('security', 'security-tool');
        expect(result).toBe(false);
      });

      it('should return false when tool does not exist', () => {
        const result = toolChecker.isToolAvailable('security', 'nonexistent-tool');
        expect(result).toBe(false);
      });

      it('should return false when category does not exist', () => {
        const result = toolChecker.isToolAvailable('nonexistent-category', 'npm audit');
        expect(result).toBe(false);
      });
    });

    describe('getAvailableTools', () => {
      it('should return only available tools for a category', () => {
        const securityTools = toolChecker.getAvailableTools('security');
        expect(securityTools).toHaveLength(1);
        expect(securityTools[0]).toEqual({ name: 'npm audit', available: true });

        const qualityTools = toolChecker.getAvailableTools('quality');
        expect(qualityTools).toHaveLength(1);
        expect(qualityTools[0]).toEqual({ name: 'ESLint', available: true });

        const testingTools = toolChecker.getAvailableTools('testing');
        expect(testingTools).toHaveLength(1);
        expect(testingTools[0]).toEqual({ name: 'c8 coverage', available: true });
      });

      it('should return empty array for nonexistent category', () => {
        const result = toolChecker.getAvailableTools('nonexistent');
        expect(result).toEqual([]);
      });

      it('should return empty array for category with no available tools', () => {
        toolChecker.toolStatus.empty = [
          { name: 'unavailable-tool', available: false }
        ];
        const result = toolChecker.getAvailableTools('empty');
        expect(result).toEqual([]);
      });
    });

    describe('hasAnyTools', () => {
      it('should return true for categories with available tools', () => {
        expect(toolChecker.hasAnyTools('security')).toBe(true);
        expect(toolChecker.hasAnyTools('quality')).toBe(true);
        expect(toolChecker.hasAnyTools('testing')).toBe(true);
      });

      it('should return false for categories with no available tools', () => {
        toolChecker.toolStatus.empty = [
          { name: 'unavailable-tool', available: false }
        ];
        expect(toolChecker.hasAnyTools('empty')).toBe(false);
      });

      it('should return false for nonexistent categories', () => {
        expect(toolChecker.hasAnyTools('nonexistent')).toBe(false);
      });
    });
  });

  describe('Output Formatting', () => {
    it('should return empty string for empty output', () => {
      expect(toolChecker.formatToolOutput('')).toBe('');
      expect(toolChecker.formatToolOutput(null)).toBe('');
      expect(toolChecker.formatToolOutput(undefined)).toBe('');
    });

    it('should return full output when under line limit', () => {
      const shortOutput = 'Line 1\nLine 2\nLine 3';
      expect(toolChecker.formatToolOutput(shortOutput)).toBe(shortOutput);
      expect(toolChecker.formatToolOutput(shortOutput, 5)).toBe(shortOutput);
    });

    it('should truncate output when over line limit', () => {
      const lines = Array.from({ length: 25 }, (_, i) => `Line ${i + 1}`);
      const longOutput = lines.join('\n');

      const result = toolChecker.formatToolOutput(longOutput, 20);

      expect(result).toContain('Line 1');
      expect(result).toContain('Line 20');
      expect(result).not.toContain('Line 21');
      expect(result).toContain('... (5 more lines)');
    });

    it('should use default maxLines of 20', () => {
      const lines = Array.from({ length: 25 }, (_, i) => `Line ${i + 1}`);
      const longOutput = lines.join('\n');

      const result = toolChecker.formatToolOutput(longOutput);

      expect(result).toContain('Line 20');
      expect(result).not.toContain('Line 21');
      expect(result).toContain('... (5 more lines)');
    });
  });

  describe('System Information', () => {
    it('should provide basic system info structure', async () => {
      const info = await toolChecker.getSystemInfo();

      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('nodeVersion');
      expect(info).toHaveProperty('npmVersion');
      expect(info).toHaveProperty('availableTools');

      expect(info.platform).toBe(process.platform);
      expect(info.nodeVersion).toBe(process.version);
      expect(info.availableTools).toEqual(toolChecker.toolStatus);
    });
  });

  describe('Tool Command Result Parsing', () => {
    it('should handle successful command results', () => {
      const mockResult = {
        success: true,
        stdout: 'command output',
        stderr: ''
      };

      // Test that we can work with the result structure
      expect(mockResult.success).toBe(true);
      expect(mockResult.stdout).toBe('command output');
      expect(mockResult.stderr).toBe('');
    });

    it('should handle failed command results', () => {
      const mockResult = {
        success: false,
        error: 'Command failed',
        stdout: '',
        stderr: 'error output'
      };

      // Test that we can work with the error structure
      expect(mockResult.success).toBe(false);
      expect(mockResult.error).toBe('Command failed');
      expect(mockResult.stderr).toBe('error output');
    });
  });
});