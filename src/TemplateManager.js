/**
 * Template Manager for CodeFortify
 * Handles template discovery, loading, and inheritance resolution
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**

 * TemplateManager class implementation

 *

 * Provides functionality for templatemanager operations

 */

/**

 * TemplateManager class implementation

 *

 * Provides functionality for templatemanager operations

 */

export class TemplateManager {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      templatesPath: config.templatesPath || path.join(__dirname, '..', 'templates'),
      ...config
    };

    this.templatesPath = this.config.templatesPath;
    this.corePath = path.join(this.templatesPath, 'core');
    this.projectsPath = path.join(this.templatesPath, 'projects');
  }

  /**
   * Discover available templates
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  async discoverTemplates() {
    const templates = [];

    // Discover core templates
    if (await fs.pathExists(this.corePath)) {
      const coreManifest = await this.loadTemplateManifest(this.corePath);
      /**
   * Performs the specified operation
   * @param {any} coreManifest
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} coreManifest
   * @returns {any} The operation result
   */
      if (coreManifest) {
        templates.push({
          name: coreManifest.name,
          type: 'core',
          path: this.corePath,
          manifest: coreManifest
        });
      }
    }

    // Discover project templates
    if (await fs.pathExists(this.projectsPath)) {
      const projectDirs = await fs.readdir(this.projectsPath);
      /**
   * Performs the specified operation
   * @param {any} const dir of projectDirs
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const dir of projectDirs
   * @returns {any} The operation result
   */

      for (const dir of projectDirs) {
        const templatePath = path.join(this.projectsPath, dir);
        const manifest = await this.loadTemplateManifest(templatePath);
        /**
   * Performs the specified operation
   * @param {any} manifest
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} manifest
   * @returns {any} The operation result
   */

        if (manifest) {
          templates.push({
            name: manifest.name,
            type: 'project',
            path: templatePath,
            manifest: manifest
          });
        }
      }
    }

    return templates;
  }

  /**
   * Load template manifest
   */
  /**
   * Loads data from source
   * @param {string} templatePath
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Loads data from source
   * @param {string} templatePath
   * @returns {Promise} Promise that resolves with the result
   */
  async loadTemplateManifest(templatePath) {
    const manifestPath = path.join(templatePath, 'template.yml');

    if (await fs.pathExists(manifestPath)) {
      try {
        const content = await fs.readFile(manifestPath, 'utf8');
        return yaml.load(content);
      } catch (error) {
        // WARN: `Failed to load manifest for ${templatePath}:`, error.message
        return null;
      }
    }

    return null;
  }

  /**
   * Resolve template inheritance
   */
  /**
   * Performs the specified operation
   * @param {any} templateName
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} templateName
   * @returns {Promise} Promise that resolves with the result
   */
  async resolveTemplate(templateName) {
    const templates = await this.discoverTemplates();
    const template = templates.find(t => t.name === templateName);
    /**
   * Performs the specified operation
   * @param {any} !template
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !template
   * @returns {any} The operation result
   */

    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Load core standards if this is a project template
    let coreStandards = {};
    /**
   * Performs the specified operation
   * @param {any} template.type - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} template.type - Optional parameter
   * @returns {any} The operation result
   */
    if (template.type === 'project') {
      const coreTemplate = templates.find(t => t.type === 'core');
      /**
   * Performs the specified operation
   * @param {any} coreTemplate
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} coreTemplate
   * @returns {any} The operation result
   */
      if (coreTemplate) {
        coreStandards = await this.loadTemplateStandards(coreTemplate.path);
      }
    }

    // Load project-specific standards
    const projectStandards = await this.loadTemplateStandards(template.path);

    // Merge standards (project takes precedence)
    return {
      ...coreStandards,
      ...projectStandards,
      template: template
    };
  }

  /**
   * Load standards from template directory
   */
  /**
   * Loads data from source
   * @param {string} templatePath
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Loads data from source
   * @param {string} templatePath
   * @returns {Promise} Promise that resolves with the result
   */
  async loadTemplateStandards(templatePath) {
    const standards = {};
    const standardsPath = path.join(templatePath, '.codefortify', 'standards');

    if (await fs.pathExists(standardsPath)) {
      const files = await fs.readdir(standardsPath);
      /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(standardsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const standardName = file.replace('.md', '');
          standards[standardName] = content;
        }
      }
    }

    return standards;
  }

  /**
   * Get template resources for MCP server
   */
  /**
   * Retrieves data
   * @param {any} templateName
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {any} templateName
   * @returns {Promise} Promise that resolves with the result
   */
  async getTemplateResources(templateName) {
    const resolvedTemplate = await this.resolveTemplate(templateName);
    const resources = [];

    // Add core resources
    Object.keys(resolvedTemplate).forEach(key => {
      /**
   * Performs the specified operation
   * @param {any} key ! - Optional parameter
   * @returns {string} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} key ! - Optional parameter
   * @returns {string} The operation result
   */
      if (key !== 'template' && typeof resolvedTemplate[key] === 'string') {
        resources.push(`context7://standards/${key}`);
      }
    });

    return resources;
  }

  /**
   * Read template resource
   */
  /**
   * Reads data from file
   * @param {any} templateName
   * @param {any} resourceUri
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Reads data from file
   * @param {any} templateName
   * @param {any} resourceUri
   * @returns {Promise} Promise that resolves with the result
   */
  async readTemplateResource(templateName, resourceUri) {
    const resolvedTemplate = await this.resolveTemplate(templateName);

    // Extract standard name from URI
    const standardName = resourceUri.replace('context7://standards/', '');
    /**
   * Performs the specified operation
   * @param {any} resolvedTemplate[standardName]
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} resolvedTemplate[standardName]
   * @returns {any} The operation result
   */

    if (resolvedTemplate[standardName]) {
      return resolvedTemplate[standardName];
    }

    throw new Error(`Resource '${resourceUri}' not found in template '${templateName}'`);
  }
}

export default TemplateManager;
