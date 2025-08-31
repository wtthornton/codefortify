/**
 * Tool Checker
 *
 * Checks for availability of external tools and provides installation guidance
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class ToolChecker {
  constructor(verbose = false) {
    this.verbose = verbose;
    this.toolStatus = {};
  }

  async checkToolAvailability() {
    if (this.verbose) {
      console.log(chalk.gray('\n🔧 Checking external tool availability...'));
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
          this.toolStatus[tool.type].push({ name: tool.name, available: true });

          if (this.verbose) {
            console.log(chalk.green(`  ✓ ${tool.name} available`));
          }

          return { tool: tool.name, available: true };
        } catch (error) {
          this.toolStatus[tool.type] = this.toolStatus[tool.type] || [];
          this.toolStatus[tool.type].push({ name: tool.name, available: false });

          if (this.verbose) {
            console.log(chalk.yellow(`  ⚠ ${tool.name} not available`));
          }

          return { tool: tool.name, available: false };
        }
      })
    );

    const unavailable = results.filter(r => !r.available);

    if (unavailable.length > 0 && this.verbose) {
      console.log(chalk.yellow('\n📋 Tool Installation Recommendations:'));
      unavailable.forEach(tool => {
        const guidance = this.getInstallationGuidance(tool.tool);
        console.log(chalk.gray(`  • ${tool.tool}: ${guidance}`));
      });
    }

    return this.toolStatus;
  }

  getInstallationGuidance(toolName) {
    const guidance = {
      'npm audit': 'npm is required for vulnerability scanning',
      'ESLint': 'npm install --save-dev eslint',
      'c8 coverage': 'npm install --save-dev c8',
      'TypeScript': 'npm install --save-dev typescript'
    };

    return guidance[toolName] || 'Check official documentation for installation';
  }

  isToolAvailable(category, toolName) {
    return this.toolStatus[category]?.find(tool =>
      tool.name === toolName && tool.available
    ) || false;
  }

  getAvailableTools(category) {
    return this.toolStatus[category]?.filter(tool => tool.available) || [];
  }

  hasAnyTools(category) {
    return this.getAvailableTools(category).length > 0;
  }

  async checkNpmAuditAvailability() {
    try {
      await execAsync('npm audit --version', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async checkESLintAvailability() {
    try {
      await execAsync('npx eslint --version', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async checkCoverageToolAvailability() {
    const tools = ['c8', 'nyc', 'jest'];

    for (const tool of tools) {
      try {
        await execAsync(`npx ${tool} --version`, { timeout: 3000 });
        return tool;
      } catch {
        continue;
      }
    }

    return null;
  }

  async checkTypeScriptAvailability() {
    try {
      await execAsync('npx tsc --version', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

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
  }

  formatToolOutput(output, maxLines = 20) {
    if (!output) {return '';}

    const lines = output.split('\n');
    if (lines.length <= maxLines) {
      return output;
    }

    return lines.slice(0, maxLines).join('\n') +
           `\n... (${lines.length - maxLines} more lines)`;
  }

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