/**
 * Enhanced CodeFortify MCP Server with Template Integration
 *
 * Provides template-aware resource management and standards inheritance
 */

import { CodeFortifyMCPServer } from './server/CodeFortifyMCPServer.js';
import { TemplateManager } from './TemplateManager.js';
import fs from 'fs-extra';
import path from 'path';

/**

 * EnhancedMCPServer class implementation

 *

 * Provides functionality for enhancedmcpserver operations

 */

/**

 * EnhancedMCPServer class implementation

 *

 * Provides functionality for enhancedmcpserver operations

 */

export class EnhancedMCPServer extends CodeFortifyMCPServer {
  constructor(config = {}) {
    super(config);

    // Initialize template manager
    this.templateManager = new TemplateManager({
      projectRoot: this.config.projectRoot,
      templatesPath: path.join(this.config.projectRoot, 'templates')
    });

    // Detect project template
    this.detectProjectTemplate();
  }
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */

  async detectProjectTemplate() {
    try {
      await this.templateManager.discoverTemplates();
      // const _projectTemplates = templates.filter(t => t.type === 'project'); // Not currently used

      // Try to detect which template this project uses
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Detect based on dependencies
        /**
   * Performs the specified operation
   * @param {any} dependencies.react && dependencies['react-dom']
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} dependencies.react && dependencies['react-dom']
   * @returns {any} The operation result
   */
        if (dependencies.react && dependencies['react-dom']) {
          this.config.projectTemplate = 'react-webapp';
        } else if (dependencies.vue) {
          this.config.projectTemplate = 'vue-webapp';
        } else if (dependencies.express || dependencies.fastify) {
          this.config.projectTemplate = 'node-api';
        }
      }

      // Check for existing .codefortify directory
      const codefortifyPath = path.join(this.config.projectRoot, this.config.codefortifyPath);
      if (await fs.pathExists(codefortifyPath)) {
        // Project already has standards, use them
        this.config.projectTemplate = 'existing';
      }

    } catch (error) {
      // Could not detect project template: error.message
      this.config.projectTemplate = 'default';
    }
  }
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */

  async listResources() {
    const resources = await super.listResources();

    // Add template-specific resources if available
    /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    if (this.config.projectTemplate && this.config.projectTemplate !== 'existing') {
      try {
        const templateResources = await this.templateManager.getTemplateResources(this.config.projectTemplate);
        resources.push(...templateResources);
      } catch (error) {
        // Could not load template resources: error.message
      }
    }

    return resources;
  }
  /**
   * Reads data from file
   * @param {any} uri
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Reads data from file
   * @param {any} uri
   * @returns {Promise} Promise that resolves with the result
   */

  async readResource(uri) {
    // Try template-specific resource first
  /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    if (this.config.projectTemplate && this.config.projectTemplate !== 'existing') {
      try {
        const templateContent = await this.templateManager.readTemplateResource(this.config.projectTemplate, uri);
        return templateContent;
      } catch (error) {
        // Fall back to default resource loading
      }
    }

    // Use default resource loading
    return await super.readResource(uri);
  }
  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */

  async getProjectStandards() {
  /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.projectTemplate && this.config.projectTemplate ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    if (this.config.projectTemplate && this.config.projectTemplate !== 'existing') {
      try {
        const resolvedTemplate = await this.templateManager.resolveTemplate(this.config.projectTemplate);
        return resolvedTemplate;
      } catch (error) {
        // Could not load template standards: error.message
      }
    }

    // Fall back to default standards
    return await super.getProjectStandards();
  }
}

export default EnhancedMCPServer;
