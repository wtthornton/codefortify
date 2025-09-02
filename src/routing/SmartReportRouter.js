/**
 * SmartReportRouter - Intelligent report path determination based on project structure
 *
 * Automatically determines optimal report locations based on project type and structure:
 * - Monorepo: Reports in workspace root with project subdirectories
 * - Single Package: Reports in project root
 * - Workspace: Reports in shared location
 * - Custom: User-defined routing rules
 *
 * @class SmartReportRouter
 * @example
 * const router = new SmartReportRouter({ projectRoot: './my-project' });
 * const reportPath = await router.getReportPath('html', 'quality-report');
 * // Returns: './my-project/reports/2024-01-15/quality-report.html'
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { MonorepoStrategy } from './routingStrategies/MonorepoStrategy.js';
import { SinglePackageStrategy } from './routingStrategies/SinglePackageStrategy.js';
import { WorkspaceStrategy } from './routingStrategies/WorkspaceStrategy.js';
import { CustomStrategy } from './routingStrategies/CustomStrategy.js';

/**


 * SmartReportRouter class implementation


 *


 * Provides functionality for smartreportrouter operations


 */


/**


 * SmartReportRouter class implementation


 *


 * Provides functionality for smartreportrouter operations


 */


export class SmartReportRouter {
  /**
   * Create a new SmartReportRouter instance
   *
   * @param {Object} config - Router configuration
   * @param {string} config.projectRoot - Project root directory
   * @param {string} [config.strategy='auto'] - Routing strategy: 'auto', 'monorepo', 'single', 'workspace', 'custom'
   * @param {Object} [config.routing] - Custom routing configuration
   * @param {boolean} [config.verbose=false] - Enable verbose logging
   */
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      strategy: config.strategy || 'auto',
      routing: config.routing || {},
      verbose: config.verbose || false,
      ...config
    };

    this.strategies = {
      monorepo: new MonorepoStrategy(this.config),
      single: new SinglePackageStrategy(this.config),
      workspace: new WorkspaceStrategy(this.config),
      custom: new CustomStrategy(this.config)
    };

    this.detectedStrategy = null;
    this.projectType = null;
  }

  /**
   * Get the optimal report path for a given format and filename
   *
   * @param {string} format - Report format ('html', 'json', 'markdown')
   * @param {string} [filename=null] - Custom filename (auto-generated if null)
   * @param {Object} [options={}] - Additional options
   * @param {boolean} [options.includeTimestamp=true] - Include timestamp in filename
   * @param {string} [options.timestamp=null] - Custom timestamp
   * @returns {Promise<string>} Full path to the report file
   *
   * @example
   * const reportPath = await router.getReportPath('html', 'quality-report');
   * // Returns: '/path/to/project/reports/2024-01-15/quality-report.html'
   */
  async getReportPath(format, filename = null, options = {}) {
    const {
      includeTimestamp = true,
      timestamp = null
    } = options;

    try {
      // Detect project structure if using auto strategy      /**
   * Performs the specified operation
   * @param {Object} this.config.strategy - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.strategy - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.strategy === 'auto') {
        await this.detectProjectStructure();
      }

      // Get the appropriate strategy
      const strategy = this.getStrategy();

      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename(format, includeTimestamp, timestamp);

      // Get the base path from strategy
      const basePath = await strategy.getBasePath(format);

      // Create directory structure if needed
      await this.ensureDirectoryExists(basePath);

      // Combine base path with filename
      const fullPath = path.join(basePath, finalFilename);      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


      if (this.config.verbose) {
        // LOG: `📁 Smart routing: ${format} report → ${fullPath}`
        // LOG: `   Strategy: ${strategy.constructor.name}`
        // LOG: `   Project type: ${this.projectType || unknown}`
      }

      return fullPath;

    } catch (error) {
      // Fallback to simple current directory routing
      const fallbackPath = this.getFallbackPath(format, filename, includeTimestamp, timestamp);      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


      if (this.config.verbose) {
        // WARN: `⚠️  Smart routing failed, using fallback: ${fallbackPath}`
        // WARN: `   Error: ${error.message}`
      }

      return fallbackPath;
    }
  }

  /**
   * Get the base directory for reports (without filename)
   *
   * @param {string} format - Report format
   * @returns {Promise<string>} Base directory path
   */
  async getBaseDirectory(format) {  /**
   * Performs the specified operation
   * @param {Object} this.config.strategy - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.strategy - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.strategy === 'auto') {
      await this.detectProjectStructure();
    }

    const strategy = this.getStrategy();
    return await strategy.getBasePath(format);
  }

  /**
   * Detect the project structure and determine optimal routing strategy
   *
   * @returns {Promise<void>}
   */
  async detectProjectStructure() {  /**
   * Performs the specified operation
   * @param {boolean} this.detectedStrategy
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} this.detectedStrategy
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.detectedStrategy) {
      return; // Already detected
    }

    try {
      // Check for monorepo indicators
      if (await this.isMonorepo()) {
        this.detectedStrategy = 'monorepo';
        this.projectType = 'monorepo';
        return;
      }

      // Check for workspace indicators
      if (await this.isWorkspace()) {
        this.detectedStrategy = 'workspace';
        this.projectType = 'workspace';
        return;
      }

      // Default to single package
      this.detectedStrategy = 'single';
      this.projectType = 'single-package';

    } catch (error) {
      // Fallback to single package on detection failure
      this.detectedStrategy = 'single';
      this.projectType = 'single-package';      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.verbose
   * @returns {boolean} True if successful, false otherwise
   */


      if (this.config.verbose) {
        // WARN: `⚠️  Project structure detection failed: ${error.message}`
      }
    }
  }

  /**
   * Check if the project is a monorepo
   *
   * @returns {Promise<boolean>}
   */
  async isMonorepo() {
    const indicators = [
      // Package manager workspaces
      () => this.hasWorkspaceConfig(),
      // Lerna
      () => this.fileExists('lerna.json'),
      // Nx
      () => this.fileExists('nx.json') || this.fileExists('workspace.json'),
      // Rush
      () => this.fileExists('rush.json'),
      // Yarn workspaces
      () => this.hasYarnWorkspaces(),
      // Multiple package.json files
      () => this.hasMultiplePackages()
    ];    /**
   * Performs the specified operation
   * @param {any} const indicator of indicators
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const indicator of indicators
   * @returns {any} The operation result
   */


    for (const indicator of indicators) {
      try {
        if (await indicator()) {
          return true;
        }
      } catch (error) {
        // Continue checking other indicators
      }
    }

    return false;
  }

  /**
   * Check if the project is a workspace
   *
   * @returns {Promise<boolean>}
   */
  async isWorkspace() {
    // Check for workspace configuration files
    const workspaceFiles = [
      'pnpm-workspace.yaml',
      'pnpm-workspace.yml',
      'yarn.lock', // Often indicates yarn workspace
      'package-lock.json' // npm workspaces
    ];    /**
   * Performs the specified operation
   * @param {any} const file of workspaceFiles
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const file of workspaceFiles
   * @returns {any} The operation result
   */


    for (const file of workspaceFiles) {
      if (await this.fileExists(file)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for workspace configuration in package.json
   *
   * @returns {Promise<boolean>}
   */
  async hasWorkspaceConfig() {
    try {
      const packageJson = await this.readPackageJson();
      return !!(packageJson?.workspaces || packageJson?.pnpm?.overrides);
    } catch {
      return false;
    }
  }

  /**
   * Check for Yarn workspaces
   *
   * @returns {Promise<boolean>}
   */
  async hasYarnWorkspaces() {
    try {
      const packageJson = await this.readPackageJson();
      return !!(packageJson?.workspaces && Array.isArray(packageJson.workspaces));
    } catch {
      return false;
    }
  }

  /**
   * Check for multiple package.json files (indicating monorepo)
   *
   * @returns {Promise<boolean>}
   */
  async hasMultiplePackages() {
    try {
      const packageJson = await this.readPackageJson();      /**
   * Performs the specified operation
   * @param {any} packageJson?.workspaces
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} packageJson?.workspaces
   * @returns {any} The operation result
   */

      if (packageJson?.workspaces) {
        // Count actual workspace packages
        const workspacePackages = await this.findWorkspacePackages(packageJson.workspaces);
        return workspacePackages.length > 1;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Find workspace packages
   *
   * @param {string[]} workspacePatterns - Workspace patterns from package.json
   * @returns {Promise<string[]>} Array of package directories
   */
  async findWorkspacePackages(workspacePatterns) {
    const packages = [];    /**
   * Performs the specified operation
   * @param {any} const pattern of workspacePatterns
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const pattern of workspacePatterns
   * @returns {any} The operation result
   */


    for (const pattern of workspacePatterns) {
      try {
        const matches = await this.glob(pattern);
        packages.push(...matches);
      } catch (error) {
        // Skip invalid patterns
      }
    }

    return packages;
  }

  /**
   * Get the appropriate routing strategy
   *
   * @returns {Object} Strategy instance
   */
  getStrategy() {
    const strategyName = this.config.strategy === 'auto' ? this.detectedStrategy : this.config.strategy;
    const strategy = this.strategies[strategyName];    /**
   * Performs the specified operation
   * @param {any} !strategy
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !strategy
   * @returns {any} The operation result
   */


    if (!strategy) {
      throw new Error(`Unknown routing strategy: ${strategyName}`);
    }

    return strategy;
  }

  /**
   * Generate filename with optional timestamp
   *
   * @param {string} format - Report format
   * @param {boolean} includeTimestamp - Include timestamp in filename
   * @param {string} [timestamp=null] - Custom timestamp
   * @returns {string} Generated filename
   */
  generateFilename(format, includeTimestamp = true, timestamp = null) {
    const baseName = 'context7-quality-report';
    const ext = format === 'markdown' ? 'md' : format;    /**
   * Performs the specified operation
   * @param {any} includeTimestamp
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} includeTimestamp
   * @returns {any} The operation result
   */


    if (includeTimestamp) {
      const ts = timestamp || new Date().toISOString().slice(0, 16).replace(/[:.]/g, '-');
      return `${baseName}-${ts}.${ext}`;
    }

    return `${baseName}.${ext}`;
  }

  /**
   * Ensure directory exists, creating it if necessary
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

  /**
   * Get fallback path when smart routing fails
   *
   * @param {string} format - Report format
   * @param {string} [filename=null] - Custom filename
   * @param {boolean} includeTimestamp - Include timestamp
   * @param {string} [timestamp=null] - Custom timestamp
   * @returns {string} Fallback path
   */
  getFallbackPath(format, filename = null, includeTimestamp = true, timestamp = null) {
    const finalFilename = filename || this.generateFilename(format, includeTimestamp, timestamp);
    return path.join(this.config.projectRoot, finalFilename);
  }

  /**
   * Get routing information for debugging
   *
   * @returns {Object} Routing information
   */
  getRoutingInfo() {
    return {
      strategy: this.config.strategy === 'auto' ? this.detectedStrategy : this.config.strategy,
      projectType: this.projectType,
      projectRoot: this.config.projectRoot,
      config: this.config.routing
    };
  }

  // Utility methods  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {Promise} Promise that resolves with the result
   */

  async fileExists(filePath) {
    try {
      await fs.access(path.resolve(this.config.projectRoot, filePath));
      return true;
    } catch {
      return false;
    }
  }  /**
   * Reads data from file
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Reads data from file
   * @returns {Promise} Promise that resolves with the result
   */


  async readPackageJson() {
    try {
      const content = await fs.readFile(path.join(this.config.projectRoot, 'package.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }  /**
   * Performs the specified operation
   * @param {any} pattern
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} pattern
   * @returns {Promise} Promise that resolves with the result
   */


  async glob(pattern) {
    // Simple glob implementation for workspace patterns
    // In a real implementation, you might want to use a proper glob library
    const { glob } = await import('glob');
    return await glob(pattern, { cwd: this.config.projectRoot });
  }
}
