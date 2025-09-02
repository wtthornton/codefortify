/**
 * System Utilities
 * Cross-platform system operations and utilities
 */

import { spawn } from 'child_process';
import { createServer } from 'net';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export class SystemUtils {
  /**
   * Open a file or URL using the system's default application
   * @param {string} target - File path or URL to open
   * @returns {Promise<boolean>} True if successful
   */
  static async openExternal(target) {
    try {
      const platform = process.platform;
      let command, args;

      switch (platform) {
      case 'win32':
        command = 'start';
        args = ['', target]; // Empty string needed for start command
        break;
      case 'darwin':
        command = 'open';
        args = [target];
        break;
      default: // linux and others
        command = 'xdg-open';
        args = [target];
        break;
      }

      return new Promise((resolve) => {
        const child = spawn(command, args, {
          shell: platform === 'win32',
          detached: true,
          stdio: 'ignore'
        });

        child.unref();
        child.on('error', () => resolve(false));
        child.on('spawn', () => resolve(true));
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a port is available
   * @param {number} port - Port to check
   * @returns {Promise<boolean>} True if port is available
   */
  static async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = createServer();
      server.listen(port, (err) => {
        if (err) {
          resolve(false);
        } else {
          server.once('close', () => resolve(true));
          server.close();
        }
      });
      server.on('error', () => resolve(false));
    });
  }

  /**
   * Find an available port starting from a base port
   * @param {number} basePort - Starting port number
   * @param {number} maxAttempts - Maximum attempts to find a port
   * @returns {Promise<number|null>} Available port or null
   */
  static async findAvailablePort(basePort = 3000, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const port = basePort + i;
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    return null;
  }

  /**
   * Get system information
   * @returns {Object} System information
   */
  static getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      os: os.type(),
      osVersion: os.release(),
      memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
      cpus: os.cpus().length
    };
  }

  /**
   * Check if running in development mode
   * @returns {boolean} True if in development
   */
  static isDevelopment() {
    return process.env.NODE_ENV === 'development' ||
           process.env.NODE_ENV === 'dev' ||
           !process.env.NODE_ENV;
  }

  /**
   * Get temporary directory path
   * @returns {string} Temp directory path
   */
  static getTempDir() {
    return os.tmpdir();
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  static async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Safe file write with backup
   * @param {string} filePath - File to write
   * @param {string} content - Content to write
   * @param {boolean} createBackup - Create backup before writing
   * @returns {Promise<boolean>} True if successful
   */
  static async safeWriteFile(filePath, content, createBackup = true) {
    try {
      // Create backup if file exists and backup requested
      if (createBackup) {
        try {
          await fs.access(filePath);
          const backupPath = `${filePath}.backup`;
          await fs.copyFile(filePath, backupPath);
        } catch {
          // File doesn't exist, no backup needed
        }
      }

      // Ensure directory exists
      await this.ensureDir(path.dirname(filePath));

      // Write file
      await fs.writeFile(filePath, content, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to write file:', error.message);
      return false;
    }
  }

  /**
   * Check if file exists
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} True if file exists
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute command and return result
   * @param {string} command - Command to execute
   * @param {Array} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  static async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: options.stdio || 'pipe',
        shell: options.shell || false,
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          stdout: '',
          stderr: error.message
        });
      });
    });
  }
}