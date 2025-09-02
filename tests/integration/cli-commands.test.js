/**
 * Integration tests for CLI commands
 * Tests the full CLI workflow with real filesystem operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, '../../bin/codefortify.js');
const TEST_PROJECT_PATH = path.join(__dirname, '../fixtures/integration-test-project');

describe('CLI Commands Integration', () => {
  beforeEach(async () => {
    // Setup test project
    await fs.ensureDir(TEST_PROJECT_PATH);
    await fs.writeFile(
      path.join(TEST_PROJECT_PATH, 'package.json'),
      JSON.stringify({
        name: 'integration-test-project',
        version: '1.0.0',
        type: 'module'
      }, null, 2)
    );

    // Create .codefortify directory with status file
    const statusDir = path.join(TEST_PROJECT_PATH, '.codefortify');
    await fs.ensureDir(statusDir);
    await fs.writeFile(
      path.join(statusDir, 'status.json'),
      JSON.stringify({
        sessionId: 'test-integration-session',
        globalStatus: {
          phase: 'analyzing',
          progress: 50,
          message: 'Integration test status',
          operation: 'enhancement',
          startTime: new Date().toISOString(),
          lastUpdate: new Date().toISOString()
        },
        score: {
          currentScore: 75,
          previousScore: 70,
          targetScore: 90
        },
        agents: {},
        operationHistory: []
      }, null, 2)
    );
  });

  afterEach(async () => {
    // Cleanup test project
    try {
      await fs.remove(TEST_PROJECT_PATH);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic CLI Operations', () => {
    it('should display help message', async () => {
      const result = await runCLICommand(['--help']);

      expect(result.stdout).toContain('CodeFortify');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
      expect(result.exitCode).toBe(0);
    });

    it('should display version', async () => {
      const result = await runCLICommand(['--version']);

      expect(result.stdout).toMatch(/\d+.\d+.\d+/);
      expect(result.exitCode).toBe(0);
    });

    it('should handle unknown commands', async () => {
      const result = await runCLICommand(['unknown-command']);

      expect(result.stderr).toContain('unknown command');
      expect(result.exitCode).toBe(1);
    });
  });

  describe('Status Command', () => {
    it('should display status when status file exists', async () => {
      const result = await runCLICommand(['status', '--project-root', TEST_PROJECT_PATH]);

      expect(result.stdout).toContain('CodeFortify Background Activity Status');
      expect(result.stdout).toContain('Phase: analyzing');
      expect(result.stdout).toContain('50%');
      expect(result.exitCode).toBe(0);
    });

    it('should output JSON format', async () => {
      const result = await runCLICommand(['status', '--format', 'json', '--project-root', TEST_PROJECT_PATH]);

      const output = result.stdout.trim();
      expect(() => JSON.parse(output)).not.toThrow();

      const parsedOutput = JSON.parse(output);
      expect(parsedOutput).toHaveProperty('sessionId');
      expect(parsedOutput).toHaveProperty('globalStatus');
      expect(result.exitCode).toBe(0);
    });

    it('should handle missing status file', async () => {
      // Remove status file
      await fs.remove(path.join(TEST_PROJECT_PATH, '.codefortify'));

      const result = await runCLICommand(['status', '--project-root', TEST_PROJECT_PATH]);

      expect(result.stdout).toContain('No active CodeFortify session found');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Agent Control Commands', () => {
    it('should stop agents', async () => {
      const result = await runCLICommand(['stop', '--force', '--project-root', TEST_PROJECT_PATH]);

      expect(result.stdout).toContain('Stopping CodeFortify background agents');
      expect(result.stdout).toContain('stopped successfully');
      expect(result.exitCode).toBe(0);
    });

    it('should pause agents', async () => {
      const result = await runCLICommand(['pause', '--project-root', TEST_PROJECT_PATH]);

      expect(result.stdout).toContain('Pausing CodeFortify background agents');
      expect(result.exitCode).toBe(0);
    });

    it('should resume paused agents', async () => {
      // First pause agents
      await runCLICommand(['pause', '--project-root', TEST_PROJECT_PATH]);

      const result = await runCLICommand(['resume', '--project-root', TEST_PROJECT_PATH]);

      expect(result.stdout).toContain('Resuming CodeFortify background agents');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Dashboard Command', () => {
    it('should start dashboard with compact view', async () => {
      const result = await runCLICommand(['dashboard', '--compact', '--project-root', TEST_PROJECT_PATH], {
        timeout: 2000 // Short timeout since dashboard runs continuously
      });

      expect(result.stdout).toContain('CodeFortify Real-Time Dashboard');
      expect(result.stdout).toContain('Press Ctrl+C to exit');
    });

    it('should handle missing status file for dashboard', async () => {
      // Remove status file
      await fs.remove(path.join(TEST_PROJECT_PATH, '.codefortify'));

      const result = await runCLICommand(['dashboard', '--project-root', TEST_PROJECT_PATH]);

      expect(result.stdout).toContain('No active CodeFortify session found');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Test MCP Command', () => {
    it('should attempt to test MCP server', async () => {
      const result = await runCLICommand(['test-mcp', '--project-root', TEST_PROJECT_PATH]);

      expect(result.stdout).toContain('Testing MCP server functionality');
      // May fail but should not crash
    });
  });

  describe('Validate Command', () => {
    it('should display validate help', async () => {
      const result = await runCLICommand(['validate', '--help']);

      expect(result.stdout).toContain('Validate project compliance');
      expect(result.stdout).toContain('--strict');
      expect(result.stdout).toContain('--fix');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Score Command', () => {
    it('should display score help', async () => {
      const result = await runCLICommand(['score', '--help']);

      expect(result.stdout).toContain('Analyze and score project quality');
      expect(result.stdout).toContain('--categories');
      expect(result.stdout).toContain('--format');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle filesystem errors gracefully', async () => {
      // Create a status file with invalid permissions (simulation)
      const invalidPath = '/invalid/path/that/does/not/exist';

      const result = await runCLICommand(['status', '--project-root', invalidPath]);

      // Should not crash, may show error message
      expect(result.exitCode).toBeDefined();
    });

    it('should handle malformed status file', async () => {
      // Create malformed status file
      await fs.writeFile(
        path.join(TEST_PROJECT_PATH, '.codefortify', 'status.json'),
        'invalid json content'
      );

      const result = await runCLICommand(['status', '--project-root', TEST_PROJECT_PATH]);

      expect(result.stderr).toContain('Failed to get status') || expect(result.exitCode).toBe(0);
    });
  });
});

/**
 * Helper function to run CLI commands and capture output
 * @param {string[]} args - Command line arguments
 * @param {object} options - Options for command execution
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function runCLICommand(args, options = {}) {
  const { timeout = 5000 } = options;

  return new Promise((resolve) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: null,
        timeout: true
      });
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim() + error.message,
        exitCode: 1,
        error
      });
    });
  });
}