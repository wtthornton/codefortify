/**
 * CustomStrategy - Routing strategy for user-defined custom paths
 *
 * Routes reports according to user-defined configuration:
 * - Uses customPaths configuration for format-specific routing
 * - Falls back to basePath for unspecified formats
 * - Supports organization structure
 */

import path from 'path';
import { BaseStrategy } from './BaseStrategy.js';

export class CustomStrategy extends BaseStrategy {
  constructor(config) {
    super(config);
    this.strategyName = 'custom';
  }

  /**
   * Get the base path for custom reports
   *
   * @param {string} format - Report format
   * @returns {Promise<string>} Base directory path
   */
  async getBasePath(format) {
    const routingConfig = this.routingConfig;
    
    // Check for format-specific custom path
    const customPath = this.getCustomPath(format);
    if (customPath) {
      return path.resolve(this.projectRoot, customPath);
    }

    // Check for base path configuration
    const basePath = routingConfig.basePath;
    if (basePath) {
      const resolvedBasePath = path.resolve(this.projectRoot, basePath);
      return this.buildOrganizedPath(resolvedBasePath, format);
    }

    // Fallback to default structure if no custom configuration
    const defaultBasePath = path.join(this.projectRoot, 'reports');
    return this.buildOrganizedPath(defaultBasePath, format);
  }

  /**
   * Validate custom configuration
   *
   * @returns {Object} Validation result
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];
    const routingConfig = this.routingConfig;

    // Check base path
    if (routingConfig.basePath) {
      try {
        path.resolve(this.projectRoot, routingConfig.basePath);
      } catch (error) {
        errors.push(`Invalid basePath: ${error.message}`);
      }
    }

    // Check custom paths
    if (routingConfig.customPaths) {
      for (const [format, customPath] of Object.entries(routingConfig.customPaths)) {
        try {
          path.resolve(this.projectRoot, customPath);
        } catch (error) {
          errors.push(`Invalid custom path for ${format}: ${error.message}`);
        }
      }
    }

    // Check organization configuration
    if (routingConfig.organization) {
      const org = routingConfig.organization;
      
      if (org.dateFormat && typeof org.dateFormat !== 'string') {
        errors.push('dateFormat must be a string');
      }
      
      if (org.maxHistory && (typeof org.maxHistory !== 'number' || org.maxHistory < 1)) {
        errors.push('maxHistory must be a positive number');
      }
      
      if (org.byDate !== undefined && typeof org.byDate !== 'boolean') {
        errors.push('byDate must be a boolean');
      }
      
      if (org.byProject !== undefined && typeof org.byProject !== 'boolean') {
        errors.push('byProject must be a boolean');
      }
    }

    // Check for deprecated or unknown configuration
    const knownKeys = ['basePath', 'customPaths', 'organization'];
    for (const key of Object.keys(routingConfig)) {
      if (!knownKeys.includes(key)) {
        warnings.push(`Unknown configuration key: ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration summary for debugging
   *
   * @returns {Object} Configuration summary
   */
  getConfigurationSummary() {
    const routingConfig = this.routingConfig;
    
    return {
      strategy: 'custom',
      basePath: routingConfig.basePath || 'default (./reports)',
      customPaths: routingConfig.customPaths || {},
      organization: this.getOrganization(),
      validation: this.validateConfiguration()
    };
  }
}
