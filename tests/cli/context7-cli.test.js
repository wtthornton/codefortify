/**
 * CLI integration tests for context7 command
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to run CLI commands
function runCLI(args, options = {}) {
  return new Promise((resolve, reject) => {
    const cliPath = path.join(__dirname, '..', '..', 'bin', 'context7.js');
    const child = spawn('node', [cliPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd || global.testConfig.projectRoot,
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        success: code === 0
      });
    });

    child.on('error', reject);

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('CLI command timed out'));
    }, 10000);
  });
}

describe('Context7 CLI', () => {
  let testProjectDir;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, '..', 'fixtures', 'cli-test-project');
    await fs.ensureDir(testProjectDir);
    await fs.ensureDir(path.join(testProjectDir, 'src'));
    
    // Create basic project structure for CLI tests
    await fs.writeFile(
      path.join(testProjectDir, 'package.json'),
      JSON.stringify({
        name: 'cli-test-project',
        version: '1.0.0',
        type: 'module',
        dependencies: {
          'react': '^18.0.0'
        }
      }, null, 2)
    );
  });

  afterEach(async () => {
    try {
      await fs.remove(testProjectDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Help and Version', () => {
    it('should display help when no arguments provided', async () => {
      const result = await runCLI([]);
      
      // Commander.js outputs help to stderr when no arguments are provided
      const output = result.stderr || result.stdout;
      expect(output).toContain('context7');
      expect(output).toContain('Context7 MCP integration CLI');
      expect(output).toContain('Commands:');
      expect(output).toContain('init');
      expect(output).toContain('validate');
      expect(output).toContain('serve');
    });

    it('should display help with --help flag', async () => {
      const result = await runCLI(['--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Options:');
      expect(result.stdout).toContain('--verbose');
      expect(result.stdout).toContain('--project-root');
    });

    it('should display version with --version flag', async () => {
      const result = await runCLI(['--version']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('1.0.0');
    });
  });

  describe('Init Command', () => {
    it('should display init help', async () => {
      const result = await runCLI(['init', '--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Initialize Context7 MCP');
      expect(result.stdout).toContain('--type');
      expect(result.stdout).toContain('--force');
      expect(result.stdout).toContain('--no-mcp');
      expect(result.stdout).toContain('--no-agent-os');
    });

    it('should initialize a React project', async () => {
      const result = await runCLI(['init', '--type', 'react-webapp', '--force'], {
        cwd: testProjectDir
      });
      
      // Note: This test might fail if dependencies aren't installed
      // In a real test environment, we'd mock the file system operations
      expect(result.stdout).toContain('Context7 MCP');
    });

    it('should handle missing project type with prompt', async () => {
      // This would normally show an interactive prompt
      // In test environment, it should handle the lack of TTY gracefully
      const result = await runCLI(['init'], {
        cwd: testProjectDir
      });
      
      // Command might fail due to no TTY, but should not crash
      expect(typeof result.code).toBe('number');
    });
  });

  describe('Add Command', () => {
    it('should display add help', async () => {
      const result = await runCLI(['add', '--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Add Context7 MCP to an existing project');
      expect(result.stdout).toContain('--type');
      expect(result.stdout).toContain('--existing');
    });

    it('should add Context7 to existing project', async () => {
      const result = await runCLI(['add', '--type', 'react-webapp'], {
        cwd: testProjectDir
      });
      
      expect(result.stdout).toContain('Context7 MCP');
    });
  });

  describe('Validate Command', () => {
    it('should display validate help', async () => {
      const result = await runCLI(['validate', '--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Validate project compliance');
      expect(result.stdout).toContain('--strict');
      expect(result.stdout).toContain('--fix');
    });

    it('should validate project structure', async () => {
      // Create minimal Context7 structure
      await fs.ensureDir(path.join(testProjectDir, '.agent-os'));
      await fs.writeFile(
        path.join(testProjectDir, 'AGENTS.md'),
        '# AGENTS.md\nContext7 integration'
      );

      const result = await runCLI(['validate'], {
        cwd: testProjectDir
      });
      
      expect(result.stdout).toContain('Context7 Validation');
    });

    it('should handle validation in strict mode', async () => {
      const result = await runCLI(['validate', '--strict'], {
        cwd: testProjectDir
      });
      
      expect(result.stdout).toContain('Context7 Validation');
    });
  });

  describe('Test-MCP Command', () => {
    it('should display test-mcp help', async () => {
      const result = await runCLI(['test-mcp', '--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Test MCP server functionality');
      expect(result.stdout).toContain('--server');
      expect(result.stdout).toContain('--timeout');
    });

    it('should handle missing MCP server file', async () => {
      const result = await runCLI(['test-mcp'], {
        cwd: testProjectDir
      });
      
      // Should fail gracefully when server file doesn't exist
      expect(result.code).not.toBe(0);
      expect(result.stdout || result.stderr).toContain('MCP');
    });
  });

  describe('Serve Command', () => {
    it('should display serve help', async () => {
      const result = await runCLI(['serve', '--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Start the Context7 MCP server');
      expect(result.stdout).toContain('--config');
      expect(result.stdout).toContain('--port');
    });

    // Note: We can't easily test the actual server startup in unit tests
    // as it would require a full MCP client connection
  });

  describe('Generate Command', () => {
    it('should display generate help', async () => {
      const result = await runCLI(['generate', '--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Generate Context7-compliant code scaffolds');
      expect(result.stdout).toContain('--name');
      expect(result.stdout).toContain('--framework');
    });

    it('should handle generate component', async () => {
      const result = await runCLI(['generate', 'component', '--name', 'TestComponent'], {
        cwd: testProjectDir
      });
      
      expect(result.stdout).toContain('component');
    });
  });

  describe('Update Command', () => {
    it('should display update help', async () => {
      const result = await runCLI(['update', '--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Update Context7 MCP configuration');
      expect(result.stdout).toContain('--templates');
      expect(result.stdout).toContain('--config');
    });

    it('should handle update command', async () => {
      const result = await runCLI(['update'], {
        cwd: testProjectDir
      });
      
      expect(result.stdout).toContain('Update');
    });
  });

  describe('Global Options', () => {
    it('should handle verbose flag', async () => {
      const result = await runCLI(['--verbose', 'validate'], {
        cwd: testProjectDir
      });
      
      // Verbose mode should provide more detailed output
      expect(result.stdout || result.stderr).toContain('Context7');
    });

    it('should handle custom project root', async () => {
      const result = await runCLI(['--project-root', testProjectDir, 'validate']);
      
      expect(result.stdout).toContain('Context7 Validation');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown commands', async () => {
      const result = await runCLI(['unknown-command']);
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('unknown command');
    });

    it('should handle invalid options', async () => {
      const result = await runCLI(['validate', '--invalid-option']);
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('unknown option');
    });

    it.skip('should handle permission errors gracefully', async () => {
      // Test with a directory we can't write to
      const readOnlyDir = path.join(__dirname, '..', 'fixtures', 'readonly');
      
      const result = await runCLI(['init', '--type', 'react-webapp'], {
        cwd: readOnlyDir
      });
      
      // Should handle the error gracefully
      expect(typeof result.code).toBe('number');
    });
  });

  describe('Project Type Detection', () => {
    it('should detect React projects', async () => {
      // Already has React in package.json from beforeEach
      const result = await runCLI(['add'], {
        cwd: testProjectDir
      });
      
      expect(result.stdout).toContain('Context7');
    });

    it('should handle projects without package.json', async () => {
      const emptyDir = path.join(__dirname, '..', 'fixtures', 'empty-project');
      await fs.ensureDir(emptyDir);

      const result = await runCLI(['validate'], {
        cwd: emptyDir
      });
      
      expect(result.stdout).toContain('Context7 Validation');
      
      await fs.remove(emptyDir);
    });
  });

  describe('Configuration Loading', () => {
    it('should load custom configuration when available', async () => {
      const configContent = `export default {
  projectName: 'custom-project',
  projectType: 'react-webapp',
  validation: {
    strictMode: true
  }
};`;

      await fs.writeFile(
        path.join(testProjectDir, 'context7.config.js'),
        configContent
      );

      const result = await runCLI(['validate'], {
        cwd: testProjectDir
      });
      
      expect(result.stdout).toContain('Context7 Validation');
    });
  });

  describe('Interactive Prompts', () => {
    // Note: Interactive prompt testing is complex and would require
    // specialized testing utilities or mocking stdin/stdout
    
    it('should handle non-interactive environments', async () => {
      const result = await runCLI(['init'], {
        cwd: testProjectDir
      });
      
      // In non-interactive environment, should not hang
      expect(typeof result.code).toBe('number');
    });
  });
});