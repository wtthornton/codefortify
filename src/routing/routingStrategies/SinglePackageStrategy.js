/**
 * SinglePackageStrategy - Routing strategy for single package projects
 *
 * Routes reports to project root with organized subdirectories:
 * - Base: <project-root>/reports/
 * - Organization: by date
 * - Example: /project/reports/2024-01-15/quality-report.html
 */

import path from 'path';
import { BaseStrategy } from './BaseStrategy.js';

/**


 * SinglePackageStrategy class implementation


 *


 * Provides functionality for singlepackagestrategy operations


 */


/**


 * SinglePackageStrategy class implementation


 *


 * Provides functionality for singlepackagestrategy operations


 */


export class SinglePackageStrategy extends BaseStrategy {
  constructor(config) {
    super(config);
    this.strategyName = 'single-package';
  }

  /**
   * Get the base path for single package reports
   *
   * @param {string} format - Report format
   * @returns {Promise<string>} Base directory path
   */
  async getBasePath(format) {
    // Check for custom path first
    const customPath = this.getCustomPath(format);    /**
   * Performs the specified operation
   * @param {string} customPath
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} customPath
   * @returns {any} The operation result
   */

    if (customPath) {
      return path.resolve(this.projectRoot, customPath);
    }

    // Default single package structure: <project-root>/reports/
    const basePath = path.join(this.projectRoot, 'reports');

    // Apply organization structure
    return this.buildOrganizedPath(basePath, format);
  }

  /**
   * Override organization to exclude project subdirectory for single packages
   *
   * @param {string} basePath - Base path from strategy
   * @param {string} format - Report format
   * @returns {string} Full organized path
   */
  buildOrganizedPath(basePath, format) {
    const organization = this.getOrganization();
    const parts = [basePath];

    // Add date organization    /**
   * Performs the specified operation
   * @param {any} organization.byDate
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} organization.byDate
   * @returns {any} The operation result
   */

    if (organization.byDate) {
      const dateStr = this.formatDate(new Date(), organization.dateFormat);
      parts.push(dateStr);
    }

    // Don't add project subdirectory for single packages
    // (organization.byProject is ignored for single packages)

    return path.join(...parts);
  }
}
