/**
 * ResourceManager - Handles Context7 resource operations
 *
 * Manages access to project standards, documentation, and patterns
 * for AI assistants through the MCP protocol.
 */

import fs from 'fs/promises';
import path from 'path';

export class ResourceManager {
  constructor(config) {
    this.config = config;
    this.projectRoot = config.projectRoot;
    this.agentOsPath = config.agentOsPath;
  }

  async listResources() {
    try {
      console.error('ResourceManager: Listing resources...');
      const resources = [
        {
          uri: 'context7://standards/tech-stack',
          name: 'Technology Stack Standards',
          description: 'Project technology stack and standards',
          mimeType: 'text/markdown'
        },
        {
          uri: 'context7://standards/code-style',
          name: 'Code Style Guidelines',
          description: 'Code style and formatting standards',
          mimeType: 'text/markdown'
        },
        {
          uri: 'context7://standards/context7-standards',
          name: 'Context7 Implementation Standards',
          description: 'Context7 specific patterns and standards',
          mimeType: 'text/markdown'
        },
        {
          uri: 'context7://product/mission',
          name: 'Product Mission',
          description: 'Project mission and objectives',
          mimeType: 'text/markdown'
        },
        {
          uri: 'context7://product/roadmap',
          name: 'Product Roadmap',
          description: 'Development roadmap and priorities',
          mimeType: 'text/markdown'
        },
        {
          uri: 'context7://instructions/ai-development',
          name: 'AI Development Guide',
          description: 'Instructions for AI-assisted development',
          mimeType: 'text/markdown'
        },
        {
          uri: 'context7://patterns/component-patterns',
          name: 'Component Patterns',
          description: 'Established component patterns for the project type',
          mimeType: 'text/typescript'
        }
      ];

      // Add project-specific resources if they exist
      try {
        const customResourcesPath = path.join(this.projectRoot, this.agentOsPath, 'resources');
        const customResources = await fs.readdir(customResourcesPath);

        for (const resource of customResources) {
          if (resource.endsWith('.md')) {
            const resourceName = resource.replace('.md', '');
            resources.push({
              uri: `context7://custom/${resourceName}`,
              name: `Custom: ${resourceName}`,
              description: `Project-specific ${resourceName} documentation`,
              mimeType: 'text/markdown'
            });
          }
        }
      } catch (error) {
      // No custom resources directory
      }

      console.error('ResourceManager: Resources listed successfully');
      return { resources };
    } catch (error) {
      console.error('ResourceManager: Resource listing failed:', error.message);
      throw new Error(`Resource listing failed: ${error.message}`);
    }
  }

  async readResource(uri) {
    try {
      console.error(`ResourceManager: Reading resource ${uri}`);
      let filePath;
      let mimeType = 'text/markdown';

      switch (uri) {
      case 'context7://standards/tech-stack':
        filePath = path.join(this.projectRoot, this.agentOsPath, 'standards', 'tech-stack.md');
        break;
      case 'context7://standards/code-style':
        filePath = path.join(this.projectRoot, this.agentOsPath, 'standards', 'code-style.md');
        break;
      case 'context7://standards/context7-standards':
        filePath = path.join(this.projectRoot, this.agentOsPath, 'standards', 'context7-standards.md');
        break;
      case 'context7://product/mission':
        filePath = path.join(this.projectRoot, this.agentOsPath, 'product', 'mission.md');
        break;
      case 'context7://product/roadmap':
        filePath = path.join(this.projectRoot, this.agentOsPath, 'product', 'roadmap.md');
        break;
      case 'context7://instructions/ai-development':
        filePath = path.join(this.projectRoot, this.agentOsPath, 'instructions', 'ai-development.md');
        break;
      case 'context7://patterns/component-patterns':
        filePath = await this.findPatternFile();
        mimeType = 'text/typescript';
        break;
      default:
        // Handle custom resources
        if (uri.startsWith('context7://custom/')) {
          const resourceName = uri.replace('context7://custom/', '');
          filePath = path.join(this.projectRoot, this.agentOsPath, 'resources', `${resourceName}.md`);
        } else {
          throw new Error(`Unknown resource: ${uri}`);
        }
      }

      let content;

      if (uri === 'context7://patterns/component-patterns') {
        // Generate patterns dynamically based on project type
        content = await this.generatePatternsContent();
      } else {
        content = await fs.readFile(filePath, 'utf-8');
      }

      console.error('ResourceManager: Resource read successfully');
      return {
        contents: [
          {
            uri,
            mimeType,
            text: content
          }
        ]
      };
    } catch (error) {
      console.error(`ResourceManager: Resource read failed for ${uri}:`, error.message);
      throw new Error(`Failed to read resource ${uri}: ${error.message}`);
    }
  }

  async findPatternFile() {
    // Look for pattern files in common locations
    const possiblePaths = [
      path.join(this.projectRoot, 'examples', 'component_patterns_demo.tsx'),
      path.join(this.projectRoot, 'examples', 'patterns.tsx'),
      path.join(this.projectRoot, 'patterns', 'components.tsx'),
      path.join(this.projectRoot, this.agentOsPath, 'patterns', 'components.tsx')
    ];

    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath);
        return filePath;
      } catch (error) {
        // File doesn't exist, try next
      }
    }

    // If no pattern file found, we'll generate one
    return null;
  }

  async generatePatternsContent() {
    try {
      console.error('ResourceManager: Generating patterns content...');

      // Try to read existing pattern file first
      const patternFile = await this.findPatternFile();

      if (patternFile) {
        try {
          const content = await fs.readFile(patternFile, 'utf-8');
          console.error('ResourceManager: Using existing pattern file');
          return content;
        } catch (error) {
          console.error('ResourceManager: Failed to read existing pattern file, generating new patterns');
        }
      }

      // Generate patterns based on project type
      const { PatternProvider } = await import('./PatternProvider.js');
      const provider = new PatternProvider(this.config);
      const patterns = await provider.generatePatterns();
      console.error('ResourceManager: Patterns generated successfully');
      return patterns;
    } catch (error) {
      console.error('ResourceManager: Pattern content generation failed:', error.message);
      throw new Error(`Pattern content generation failed: ${error.message}`);
    }
  }
}