/**
 * Enhanced CodeFortify MCP Server with Template Integration
 * 
 * Provides template-aware resource management and standards inheritance
 */

import { CodeFortifyMCPServer } from './server/CodeFortifyMCPServer.js';
import { TemplateManager } from './TemplateManager.js';

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

  async detectProjectTemplate() {
    try {
      const templates = await this.templateManager.discoverTemplates();
      const projectTemplates = templates.filter(t => t.type === 'project');
      
      // Try to detect which template this project uses
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Detect based on dependencies
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
      console.warn('Could not detect project template:', error.message);
      this.config.projectTemplate = 'default';
    }
  }

  async listResources() {
    const resources = await super.listResources();
    
    // Add template-specific resources if available
    if (this.config.projectTemplate && this.config.projectTemplate !== 'existing') {
      try {
        const templateResources = await this.templateManager.getTemplateResources(this.config.projectTemplate);
        resources.push(...templateResources);
      } catch (error) {
        console.warn('Could not load template resources:', error.message);
      }
    }
    
    return resources;
  }

  async readResource(uri) {
    // Try template-specific resource first
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

  async getProjectStandards() {
    if (this.config.projectTemplate && this.config.projectTemplate !== 'existing') {
      try {
        const resolvedTemplate = await this.templateManager.resolveTemplate(this.config.projectTemplate);
        return resolvedTemplate;
      } catch (error) {
        console.warn('Could not load template standards:', error.message);
      }
    }
    
    // Fall back to default standards
    return await super.getProjectStandards();
  }
}

export default EnhancedMCPServer;
