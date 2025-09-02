/**
 * ConfigLoader - Loads and validates configuration for Context7-MCP
 *
 * Supports loading configuration from:
 * - codefortify.config.js
 * - package.json (codefortify field)
 * - Environment variables
 * - Command line options
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**


 * ConfigLoader class implementation


 *


 * Provides functionality for configloader operations


 */


/**


 * ConfigLoader class implementation


 *


 * Provides functionality for configloader operations


 */


export class ConfigLoader {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.configPaths = [
      'codefortify.config.js',
      'codefortify.config.mjs',
      'codefortify.config.json',
      'package.json'
    ];
  }

  /**
   * Load configuration from all sources
   *
   * @param {Object} [cliOptions={}] - Command line options
   * @returns {Promise<Object>} Merged configuration
   */
  async loadConfig(cliOptions = {}) {
    const configs = [];

    // Load from config files    /**
   * Performs the specified operation
   * @param {Object} const configPath of this.configPaths
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} const configPath of this.configPaths
   * @returns {boolean} True if successful, false otherwise
   */

    for (const configPath of this.configPaths) {
      try {
        const config = await this.loadConfigFile(configPath);        /**
   * Performs the specified operation
   * @param {Object} config
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {Object} config
   * @returns {any} The operation result
   */

        if (config) {
          configs.push(config);
        }
      } catch (error) {
        // Continue loading other configs
      }
    }

    // Load from environment variables
    const envConfig = this.loadEnvironmentConfig();    /**
   * Performs the specified operation
   * @param {Object} envConfig
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} envConfig
   * @returns {any} The operation result
   */

    if (envConfig) {
      configs.push(envConfig);
    }

    // Merge configurations (later configs override earlier ones)
    const mergedConfig = this.mergeConfigs(configs);

    // Apply CLI options (highest priority)
    const finalConfig = this.applyCLIOptions(mergedConfig, cliOptions);

    // Validate configuration
    this.validateConfig(finalConfig);

    return finalConfig;
  }

  /**
   * Load configuration from a specific file
   *
   * @param {string} configPath - Configuration file path
   * @returns {Promise<Object|null>} Configuration object or null
   */
  async loadConfigFile(configPath) {
    const fullPath = path.join(this.projectRoot, configPath);

    if (!existsSync(fullPath)) {
      return null;
    }

    try {
      if (configPath.endsWith('.js') || configPath.endsWith('.mjs')) {
        // Load JavaScript config
        const config = await import(fullPath);
        return config.default || config;
      } else if (configPath.endsWith('.json')) {
        // Load JSON config
        const content = await fs.readFile(fullPath, 'utf-8');
        const parsed = JSON.parse(content);        /**
   * Performs the specified operation
   * @param {Object} configPath - Optional parameter
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {Object} configPath - Optional parameter
   * @returns {any} The operation result
   */


        if (configPath === 'package.json') {
          return parsed.codefortify || null;
        }

        return parsed;
      }
    } catch (error) {
      throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
    }

    return null;
  }

  /**
   * Load configuration from environment variables
   *
   * @returns {Object} Environment-based configuration
   */
  loadEnvironmentConfig() {
    const config = {};

    // Routing configuration    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_ROUTING_STRATEGY
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_ROUTING_STRATEGY
   * @returns {any} The operation result
   */

    if (process.env.CODEFORTIFY_ROUTING_STRATEGY) {
      config.routing = config.routing || {};
      config.routing.strategy = process.env.CODEFORTIFY_ROUTING_STRATEGY;
    }    /**
   * Performs the specified operation
   * @param {string} process.env.CODEFORTIFY_ROUTING_BASE_PATH
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} process.env.CODEFORTIFY_ROUTING_BASE_PATH
   * @returns {any} The operation result
   */


    if (process.env.CODEFORTIFY_ROUTING_BASE_PATH) {
      config.routing = config.routing || {};
      config.routing.basePath = process.env.CODEFORTIFY_ROUTING_BASE_PATH;
    }

    // Quality gates configuration    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_GATES_ENABLED
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_GATES_ENABLED
   * @returns {any} The operation result
   */

    if (process.env.CODEFORTIFY_GATES_ENABLED) {
      config.gates = config.gates || {};
      config.gates.enabled = process.env.CODEFORTIFY_GATES_ENABLED === 'true';
    }    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_GATES_OVERALL_MIN
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_GATES_OVERALL_MIN
   * @returns {any} The operation result
   */


    if (process.env.CODEFORTIFY_GATES_OVERALL_MIN) {
      config.gates = config.gates || {};
      config.gates.thresholds = config.gates.thresholds || {};
      config.gates.thresholds.overall = config.gates.thresholds.overall || {};
      config.gates.thresholds.overall.min = parseInt(process.env.CODEFORTIFY_GATES_OVERALL_MIN);
    }    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_GATES_CI_FORMAT
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_GATES_CI_FORMAT
   * @returns {any} The operation result
   */


    if (process.env.CODEFORTIFY_GATES_CI_FORMAT) {
      config.gates = config.gates || {};
      config.gates.ci = config.gates.ci || {};
      config.gates.ci.format = process.env.CODEFORTIFY_GATES_CI_FORMAT;
    }

    // General configuration    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_VERBOSE
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} process.env.CODEFORTIFY_VERBOSE
   * @returns {any} The operation result
   */

    if (process.env.CODEFORTIFY_VERBOSE) {
      config.verbose = process.env.CODEFORTIFY_VERBOSE === 'true';
    }

    return Object.keys(config).length > 0 ? config : null;
  }

  /**
   * Merge multiple configuration objects
   *
   * @param {Array<Object>} configs - Array of configuration objects
   * @returns {Object} Merged configuration
   */
  mergeConfigs(configs) {
    const merged = {};    /**
   * Performs the specified operation
   * @param {Object} const config of configs
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} const config of configs
   * @returns {any} The operation result
   */


    for (const config of configs) {
      this.deepMerge(merged, config);
    }

    return merged;
  }

  /**
   * Deep merge two objects
   *
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {  /**
   * Performs the specified operation
   * @param {any} const key in source
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const key in source
   * @returns {any} The operation result
   */

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Apply CLI options to configuration
   *
   * @param {Object} config - Base configuration
   * @param {Object} cliOptions - CLI options
   * @returns {Object} Final configuration
   */
  applyCLIOptions(config, cliOptions) {
    const finalConfig = { ...config };

    // Apply CLI options    /**
   * Performs the specified operation
   * @param {Object} cliOptions.verbose ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} cliOptions.verbose ! - Optional parameter
   * @returns {any} The operation result
   */

    if (cliOptions.verbose !== undefined) {
      finalConfig.verbose = cliOptions.verbose;
    }    /**
   * Performs the specified operation
   * @param {Object} cliOptions.projectRoot
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} cliOptions.projectRoot
   * @returns {any} The operation result
   */


    if (cliOptions.projectRoot) {
      finalConfig.projectRoot = cliOptions.projectRoot;
    }

    // Routing options    /**
   * Performs the specified operation
   * @param {Object} cliOptions.routing
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} cliOptions.routing
   * @returns {any} The operation result
   */

    if (cliOptions.routing) {
      finalConfig.routing = { ...finalConfig.routing, ...cliOptions.routing };
    }

    // Quality gates options    /**
   * Performs the specified operation
   * @param {Object} cliOptions.gates
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} cliOptions.gates
   * @returns {any} The operation result
   */

    if (cliOptions.gates) {
      finalConfig.gates = { ...finalConfig.gates, ...cliOptions.gates };
    }

    return finalConfig;
  }

  /**
   * Validate configuration
   *
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  validateConfig(config) {
    const errors = [];

    // Validate routing configuration    /**
   * Performs the specified operation
   * @param {Object} config.routing
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} config.routing
   * @returns {any} The operation result
   */

    if (config.routing) {
      const routingErrors = this.validateRoutingConfig(config.routing);
      errors.push(...routingErrors);
    }

    // Validate gates configuration    /**
   * Performs the specified operation
   * @param {Object} config.gates
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} config.gates
   * @returns {any} The operation result
   */

    if (config.gates) {
      const gatesErrors = this.validateGatesConfig(config.gates);
      errors.push(...gatesErrors);
    }    /**
   * Performs the specified operation
   * @param {any} errors.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} errors.length > 0
   * @returns {any} The operation result
   */


    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Validate routing configuration
   *
   * @param {Object} routing - Routing configuration
   * @returns {Array<string>} Validation errors
   */
  validateRoutingConfig(routing) {
    const errors = [];

    if (routing.strategy && !['auto', 'monorepo', 'single', 'workspace', 'custom'].includes(routing.strategy)) {
      errors.push('routing.strategy must be one of: auto, monorepo, single, workspace, custom');
    }    /**
   * Performs the specified operation
   * @param {string} routing.basePath && typeof routing.basePath ! - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} routing.basePath && typeof routing.basePath ! - Optional parameter
   * @returns {string} The operation result
   */


    if (routing.basePath && typeof routing.basePath !== 'string') {
      errors.push('routing.basePath must be a string');
    }    /**
   * Performs the specified operation
   * @param {string} routing.customPaths && typeof routing.customPaths ! - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} routing.customPaths && typeof routing.customPaths ! - Optional parameter
   * @returns {any} The operation result
   */


    if (routing.customPaths && typeof routing.customPaths !== 'object') {
      errors.push('routing.customPaths must be an object');
    }    /**
   * Performs the specified operation
   * @param {any} routing.organization
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} routing.organization
   * @returns {any} The operation result
   */


    if (routing.organization) {
      const org = routing.organization;      /**
   * Performs the specified operation
   * @param {any} org.byDate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {any} org.byDate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (org.byDate !== undefined && typeof org.byDate !== 'boolean') {
        errors.push('routing.organization.byDate must be a boolean');
      }      /**
   * Performs the specified operation
   * @param {any} org.byProject ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {any} org.byProject ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

      if (org.byProject !== undefined && typeof org.byProject !== 'boolean') {
        errors.push('routing.organization.byProject must be a boolean');
      }
      if (org.maxHistory !== undefined && (typeof org.maxHistory !== 'number' || org.maxHistory < 1)) {
        errors.push('routing.organization.maxHistory must be a positive number');
      }
    }

    return errors;
  }

  /**
   * Validate gates configuration
   *
   * @param {Object} gates - Gates configuration
   * @returns {Array<string>} Validation errors
   */
  validateGatesConfig(gates) {
    const errors = [];    /**
   * Performs the specified operation
   * @param {any} gates.enabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {any} gates.enabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */


    if (gates.enabled !== undefined && typeof gates.enabled !== 'boolean') {
      errors.push('gates.enabled must be a boolean');
    }    /**
   * Performs the specified operation
   * @param {any} gates.thresholds
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} gates.thresholds
   * @returns {any} The operation result
   */


    if (gates.thresholds) {
      const thresholds = gates.thresholds;      /**
   * Performs the specified operation
   * @param {any} thresholds.overall
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} thresholds.overall
   * @returns {any} The operation result
   */


      if (thresholds.overall) {
        if (thresholds.overall.min !== undefined && (typeof thresholds.overall.min !== 'number' || thresholds.overall.min < 0)) {
          errors.push('gates.thresholds.overall.min must be a non-negative number');
        }
        if (thresholds.overall.warning !== undefined && (typeof thresholds.overall.warning !== 'number' || thresholds.overall.warning < 0)) {
          errors.push('gates.thresholds.overall.warning must be a non-negative number');
        }
      }      /**
   * Performs the specified operation
   * @param {any} thresholds.categories && typeof thresholds.categories ! - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} thresholds.categories && typeof thresholds.categories ! - Optional parameter
   * @returns {any} The operation result
   */


      if (thresholds.categories && typeof thresholds.categories !== 'object') {
        errors.push('gates.thresholds.categories must be an object');
      }
    }    /**
   * Performs the specified operation
   * @param {any} gates.ci
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} gates.ci
   * @returns {any} The operation result
   */


    if (gates.ci) {
      const ci = gates.ci;

      if (ci.format && !['auto', 'github-actions', 'gitlab-ci', 'jenkins', 'generic'].includes(ci.format)) {
        errors.push('gates.ci.format must be one of: auto, github-actions, gitlab-ci, jenkins, generic');
      }      /**
   * Performs the specified operation
   * @param {any} ci.blocking
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} ci.blocking
   * @returns {any} The operation result
   */


      if (ci.blocking) {        /**
   * Performs the specified operation
   * @param {any} ci.blocking.enabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
        /**
   * Performs the specified operation
   * @param {any} ci.blocking.enabled ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

        if (ci.blocking.enabled !== undefined && typeof ci.blocking.enabled !== 'boolean') {
          errors.push('gates.ci.blocking.enabled must be a boolean');
        }
        if (ci.blocking.onFailure && !['error', 'warning', 'none'].includes(ci.blocking.onFailure)) {
          errors.push('gates.ci.blocking.onFailure must be one of: error, warning, none');
        }
      }
    }

    return errors;
  }

  /**
   * Get configuration summary for debugging
   *
   * @param {Object} config - Configuration object
   * @returns {Object} Configuration summary
   */
  getConfigSummary(config) {
    return {
      projectRoot: config.projectRoot,
      verbose: config.verbose,
      routing: {
        enabled: config.routing?.enabled !== false,
        strategy: config.routing?.strategy || 'auto',
        basePath: config.routing?.basePath || 'default',
        customPaths: config.routing?.customPaths ? Object.keys(config.routing.customPaths) : []
      },
      gates: {
        enabled: config.gates?.enabled !== false,
        thresholds: config.gates?.thresholds ? 'configured' : 'default',
        ci: {
          format: config.gates?.ci?.format || 'auto',
          blocking: config.gates?.ci?.blocking?.enabled !== false
        }
      }
    };
  }
}
