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
  async discoverTemplates() {
    const templates = [];
    
    // Discover core templates
    if (await fs.pathExists(this.corePath)) {
      const coreManifest = await this.loadTemplateManifest(this.corePath);
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
      
      for (const dir of projectDirs) {
        const templatePath = path.join(this.projectsPath, dir);
        const manifest = await this.loadTemplateManifest(templatePath);
        
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
  async loadTemplateManifest(templatePath) {
    const manifestPath = path.join(templatePath, 'template.yml');
    
    if (await fs.pathExists(manifestPath)) {
      try {
        const content = await fs.readFile(manifestPath, 'utf8');
        return yaml.load(content);
      } catch (error) {
        console.warn(`Failed to load manifest for ${templatePath}:`, error.message);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Resolve template inheritance
   */
  async resolveTemplate(templateName) {
    const templates = await this.discoverTemplates();
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    // Load core standards if this is a project template
    let coreStandards = {};
    if (template.type === 'project') {
      const coreTemplate = templates.find(t => t.type === 'core');
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
  async loadTemplateStandards(templatePath) {
    const standards = {};
    const standardsPath = path.join(templatePath, '.codefortify', 'standards');
    
    if (await fs.pathExists(standardsPath)) {
      const files = await fs.readdir(standardsPath);
      
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
  async getTemplateResources(templateName) {
    const resolvedTemplate = await this.resolveTemplate(templateName);
    const resources = [];
    
    // Add core resources
    Object.keys(resolvedTemplate).forEach(key => {
      if (key !== 'template' && typeof resolvedTemplate[key] === 'string') {
        resources.push(`context7://standards/${key}`);
      }
    });
    
    return resources;
  }

  /**
   * Read template resource
   */
  async readTemplateResource(templateName, resourceUri) {
    const resolvedTemplate = await this.resolveTemplate(templateName);
    
    // Extract standard name from URI
    const standardName = resourceUri.replace('context7://standards/', '');
    
    if (resolvedTemplate[standardName]) {
      return resolvedTemplate[standardName];
    }
    
    throw new Error(`Resource '${resourceUri}' not found in template '${templateName}'`);
  }
}

export default TemplateManager;
