/**
 * Tool Checker
 *
 * Checks for availability of external tools and provides installation guidance
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

/**


 * ToolChecker class implementation


 *


 * Provides functionality for toolchecker operations


 */


/**


 * ToolChecker class implementation


 *


 * Provides functionality for toolchecker operations


 */


export class ToolChecker {
  constructor(verbose = false) {
    this.verbose = verbose;
    this.toolStatus = {};
  }  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */


  async checkToolAvailability() {  /**
   * Performs the specified operation
   * @param {boolean} this.verbose
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.verbose
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.verbose) {
      // LOG: chalk.gray(\n🔧 Checking external tool availability...)
    }

    const tools = [
      { name: 'npm audit', command: 'npm --version', type: 'security' },
      { name: 'ESLint', command: 'npx eslint --version', type: 'quality' },
      { name: 'c8 coverage', command: 'npx c8 --version', type: 'testing' },
      { name: 'TypeScript', command: 'npx tsc --version', type: 'quality' }
    ];

    const results = await Promise.all(
      tools.map(async (tool) => {
        try {
          await execAsync(tool.command, { timeout: 5000 });
          this.toolStatus[tool.type] = this.toolStatus[tool.type] || [];
          this.toolStatus[tool.type].push({ name: tool.name, available: true });          /**
   * Performs the specified operation
   * @param {boolean} this.verbose
   * @returns {boolean} True if successful, false otherwise
   */
          /**
   * Performs the specified operation
   * @param {boolean} this.verbose
   * @returns {boolean} True if successful, false otherwise
   */


          if (this.verbose) {
            // LOG: chalk.green(`  ✓ ${tool.name} available`)
          }

          return { tool: tool.name, available: true };
        } catch (error) {
          this.toolStatus[tool.type] = this.toolStatus[tool.type] || [];
          this.toolStatus[tool.type].push({ name: tool.name, available: false });          /**
   * Performs the specified operation
   * @param {boolean} this.verbose
   * @returns {boolean} True if successful, false otherwise
   */
          /**
   * Performs the specified operation
   * @param {boolean} this.verbose
   * @returns {boolean} True if successful, false otherwise
   */


          if (this.verbose) {
            // LOG: chalk.yellow(`  ⚠ ${tool.name} not available`)
          }

          return { tool: tool.name, available: false };
        }
      })
    );

    const unavailable = results.filter(r => !r.available);    /**
   * Performs the specified operation
   * @param {boolean} unavailable.length > 0 && this.verbose
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} unavailable.length > 0 && this.verbose
   * @returns {boolean} True if successful, false otherwise
   */


    if (unavailable.length > 0 && this.verbose) {
      // LOG: chalk.yellow(\n📋 Tool Installation Recommendations:)
      unavailable.forEach(tool => {
        const guidance = this.getInstallationGuidance(tool.tool);
        // LOG: chalk.gray(`  • ${tool.tool}: ${guidance}`)
      });
    }

    return this.toolStatus;
  }  /**
   * Retrieves data
   * @param {any} toolName
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} toolName
   * @returns {string} The retrieved data
   */


  getInstallationGuidance(toolName) {
    const guidance = {
      'npm audit': 'npm is required for vulnerability scanning',
      'ESLint': 'npm install --save-dev eslint',
      'c8 coverage': 'npm install --save-dev c8',
      'TypeScript': 'npm install --save-dev typescript'
    };

    return guidance[toolName] || 'Check official documentation for installation';
  }  /**
   * Performs the specified operation
   * @param {any} category
   * @param {any} toolName
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} category
   * @param {any} toolName
   * @returns {boolean} True if successful, false otherwise
   */


  isToolAvailable(category, toolName) {
    return this.toolStatus[category]?.find(tool =>
      tool.name === toolName && tool.available
    ) || false;
  }  /**
   * Retrieves data
   * @param {any} category
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @param {any} category
   * @returns {string} The retrieved data
   */


  getAvailableTools(category) {
    return this.toolStatus[category]?.filter(tool => tool.available) || [];
  }  /**
   * Performs the specified operation
   * @param {any} category
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} category
   * @returns {any} The operation result
   */


  hasAnyTools(category) {
    return this.getAvailableTools(category).length > 0;
  }  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */


  async checkNpmAuditAvailability() {
    try {
      await execAsync('npm audit --version', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */


  async checkESLintAvailability() {
    try {
      await execAsync('npx eslint --version', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */


  async checkCoverageToolAvailability() {
    const tools = ['c8', 'nyc', 'jest'];    /**
   * Performs the specified operation
   * @param {any} const tool of tools
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const tool of tools
   * @returns {any} The operation result
   */


    for (const tool of tools) {
      try {
        await execAsync(`npx ${tool} --version`, { timeout: 3000 });
        return tool;
      } catch {
        continue;
      }
    }

    return null;
  }  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @returns {Promise} Promise that resolves with the result
   */


  async checkTypeScriptAvailability() {
    try {
      await execAsync('npx tsc --version', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }  /**
   * Runs the specified task
   * @param {any} command
   * @param {any} timeout - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @param {any} command
   * @param {any} timeout - Optional parameter
   * @returns {Promise} Promise that resolves with the result
   */


  async runToolCommand(command, timeout = 10000) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || ''
      };
    }
  }  /**
   * Formats the data
   * @param {any} output
   * @param {any} maxLines - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Formats the data
   * @param {any} output
   * @param {any} maxLines - Optional parameter
   * @returns {any} The operation result
   */


  formatToolOutput(output, maxLines = 20) {  /**
   * Performs the specified operation
   * @param {any} !output
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !output
   * @returns {any} The operation result
   */

    if (!output) {return '';}

    const lines = output.split('\n');    /**
   * Performs the specified operation
   * @param {any} lines.length < - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} lines.length < - Optional parameter
   * @returns {any} The operation result
   */

    if (lines.length <= maxLines) {
      return output;
    }

    return lines.slice(0, maxLines).join('\n') +
           `\n... (${lines.length - maxLines} more lines)`;
  }  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */


  async getSystemInfo() {
    const info = {
      platform: process.platform,
      nodeVersion: process.version,
      npmVersion: null,
      availableTools: {}
    };

    try {
      const npmResult = await execAsync('npm --version', { timeout: 3000 });
      info.npmVersion = npmResult.stdout.trim();
    } catch {
      info.npmVersion = 'Not available';
    }

    info.availableTools = this.toolStatus;

    return info;
  }
}