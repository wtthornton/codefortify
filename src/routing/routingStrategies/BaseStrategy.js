/**
 * BaseStrategy - Abstract base class for routing strategies
 *
 * Provides common functionality and interface for all routing strategies
 * with consistent behavior and error handling.
 */

import path from 'path';
import fs from 'fs/promises';

export class BaseStrategy {
  constructor(config) {
    this.config = config;
    this.projectRoot = config.projectRoot;
    this.routingConfig = config.routing || {};
  }

  /**
   * Get the base path for reports in this strategy
   *
   * @param {string} format - Report format
   * @returns {Promise<string>} Base directory path
   */
  async getBasePath(format) {
    throw new Error('getBasePath() must be implemented by subclass');
  }

  /**
   * Get the organization structure for this strategy
   *
   * @returns {Object} Organization configuration
   */
  getOrganization() {
    return {
      byDate: this.routingConfig.organization?.byDate ?? true,
      byProject: this.routingConfig.organization?.byProject ?? false,
      dateFormat: this.routingConfig.organization?.dateFormat ?? 'YYYY-MM-DD',
      maxHistory: this.routingConfig.organization?.maxHistory ?? 30
    };
  }

  /**
   * Get custom path for specific format if configured
   *
   * @param {string} format - Report format
   * @returns {string|null} Custom path or null
   */
  getCustomPath(format) {
    const customPaths = this.routingConfig.customPaths || {};
    return customPaths[format] || null;
  }

  /**
   * Build the full path with organization structure
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

    // Add project organization (if applicable)
    if (organization.byProject) {
      const projectName = this.getProjectName();
      parts.push(projectName);
    }

    return path.join(...parts);
  }

  /**
   * Format date according to the specified format
   *
   * @param {Date} date - Date to format
   * @param {string} format - Date format string
   * @returns {string} Formatted date
   */
  formatDate(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute);
  }

  /**
   * Get project name for organization
   *
   * @returns {string} Project name
   */
  getProjectName() {
    try {
      const packageJson = require(path.join(this.projectRoot, 'package.json'));
      return packageJson.name || path.basename(this.projectRoot);
    } catch {
      return path.basename(this.projectRoot);
    }
  }

  /**
   * Ensure directory exists
   *
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}
