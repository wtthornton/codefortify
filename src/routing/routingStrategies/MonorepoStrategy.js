/**
 * MonorepoStrategy - Routing strategy for monorepo projects
 *
 * Routes reports to workspace root with organized subdirectories:
 * - Base: <workspace-root>/reports/
 * - Organization: by date and/or project
 * - Example: /workspace/reports/2024-01-15/project-name/quality-report.html
 */

import path from 'path';
import { BaseStrategy } from './BaseStrategy.js';

export class MonorepoStrategy extends BaseStrategy {
  constructor(config) {
    super(config);
    this.strategyName = 'monorepo';
  }

  /**
   * Get the base path for monorepo reports
   *
   * @param {string} format - Report format
   * @returns {Promise<string>} Base directory path
   */
  async getBasePath(format) {
    // Check for custom path first
    const customPath = this.getCustomPath(format);
    if (customPath) {
      return path.resolve(this.projectRoot, customPath);
    }

    // Find workspace root
    const workspaceRoot = await this.findWorkspaceRoot();
    
    // Default monorepo structure: <workspace-root>/reports/
    const basePath = path.join(workspaceRoot, 'reports');
    
    // Apply organization structure
    return this.buildOrganizedPath(basePath, format);
  }

  /**
   * Find the workspace root directory
   *
   * @returns {Promise<string>} Workspace root path
   */
  async findWorkspaceRoot() {
    let currentDir = this.projectRoot;
    
    // Walk up the directory tree to find workspace root
    while (currentDir !== path.dirname(currentDir)) {
      // Check for workspace indicators
      if (await this.isWorkspaceRoot(currentDir)) {
        return currentDir;
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback to project root if workspace root not found
    return this.projectRoot;
  }

  /**
   * Check if directory is workspace root
   *
   * @param {string} dirPath - Directory path to check
   * @returns {Promise<boolean>} True if workspace root
   */
  async isWorkspaceRoot(dirPath) {
    const indicators = [
      'lerna.json',
      'nx.json',
      'workspace.json',
      'rush.json',
      'pnpm-workspace.yaml',
      'pnpm-workspace.yml'
    ];

    for (const indicator of indicators) {
      if (await this.fileExists(path.join(dirPath, indicator))) {
        return true;
      }
    }

    // Check for workspace configuration in package.json
    try {
      const packageJsonPath = path.join(dirPath, 'package.json');
      const packageJson = JSON.parse(await this.readFile(packageJsonPath));
      
      if (packageJson.workspaces || packageJson.pnpm?.overrides) {
        return true;
      }
    } catch {
      // Continue checking other indicators
    }

    return false;
  }

  /**
   * Get project-specific subdirectory name
   *
   * @returns {string} Project subdirectory name
   */
  getProjectSubdirectory() {
    const projectName = this.getProjectName();
    const workspaceRoot = this.findWorkspaceRoot();
    
    // Get relative path from workspace root to project
    const relativePath = path.relative(workspaceRoot, this.projectRoot);
    
    // Use relative path if different from project name
    if (relativePath && relativePath !== projectName) {
      return relativePath.replace(/[\\/]/g, '-');
    }
    
    return projectName;
  }

  /**
   * Override organization to include project subdirectory for monorepos
   *
   * @param {string} basePath - Base path from strategy
   * @param {string} format - Report format
   * @returns {string} Full organized path
   */
  buildOrganizedPath(basePath, format) {
    const organization = this.getOrganization();
    const parts = [basePath];

    // Add date organization
    if (organization.byDate) {
      const dateStr = this.formatDate(new Date(), organization.dateFormat);
      parts.push(dateStr);
    }

    // Always add project subdirectory for monorepos
    const projectSubdir = this.getProjectSubdirectory();
    parts.push(projectSubdir);

    return path.join(...parts);
  }

  // Utility methods
  async fileExists(filePath) {
    try {
      const fs = await import('fs/promises');
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readFile(filePath) {
    const fs = await import('fs/promises');
    return await fs.readFile(filePath, 'utf-8');
  }
}
