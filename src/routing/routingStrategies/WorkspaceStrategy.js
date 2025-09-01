/**
 * WorkspaceStrategy - Routing strategy for workspace projects
 *
 * Routes reports to shared workspace location:
 * - Base: <workspace-root>/shared/reports/
 * - Organization: by date and project
 * - Example: /workspace/shared/reports/2024-01-15/project-name/quality-report.html
 */

import path from 'path';
import { BaseStrategy } from './BaseStrategy.js';

export class WorkspaceStrategy extends BaseStrategy {
  constructor(config) {
    super(config);
    this.strategyName = 'workspace';
  }

  /**
   * Get the base path for workspace reports
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
    
    // Default workspace structure: <workspace-root>/shared/reports/
    const basePath = path.join(workspaceRoot, 'shared', 'reports');
    
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
      'pnpm-workspace.yaml',
      'pnpm-workspace.yml',
      'yarn.lock',
      'package-lock.json'
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
   * Get project-specific subdirectory name for workspace
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
   * Override organization to include project subdirectory for workspaces
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

    // Add project subdirectory for workspaces
    if (organization.byProject) {
      const projectSubdir = this.getProjectSubdirectory();
      parts.push(projectSubdir);
    }

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
