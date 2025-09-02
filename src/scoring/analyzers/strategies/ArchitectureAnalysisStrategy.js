/**
 * Architecture Analysis Strategy Interface
 * Strategy pattern for analyzing different project architectures
 */

import path from 'path';
import fs from 'fs/promises';

export class BaseArchitectureStrategy {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Analyze architecture for this specific framework/type
   * @param {string} projectRoot - Project root directory
   * @param {Object} projectContext - Project context information
   * @returns {Promise<Object>} Architecture analysis result
   */
  async analyze(projectRoot, projectContext = {}) {
    throw new Error('analyze() method must be implemented by strategy subclasses');
  }

  /**
   * Check if this strategy applies to the given project
   * @param {Object} projectContext - Project context information
   * @returns {boolean} True if strategy applies
   */
  applies(projectContext) {
    throw new Error('applies() method must be implemented by strategy subclasses');
  }
}

/**
 * React Architecture Strategy
 */
export class ReactArchitectureStrategy extends BaseArchitectureStrategy {
  applies(projectContext) {
    return projectContext.framework === 'react' || 
           projectContext.projectType === 'react-webapp';
  }

  async analyze(projectRoot, projectContext) {
    const analysis = {
      patterns: [],
      issues: [],
      suggestions: [],
      score: 0
    };

    // Check for React-specific patterns
    if (await this.hasComponentStructure(projectRoot)) {
      analysis.patterns.push('component-structure');
      analysis.score += 1;
    } else {
      analysis.issues.push('Missing organized component structure');
      analysis.suggestions.push('Organize components in src/components/ directory');
    }

    if (await this.hasHooksUsage(projectRoot)) {
      analysis.patterns.push('react-hooks');
      analysis.score += 1;
    }

    if (await this.hasProperStateManagement(projectRoot)) {
      analysis.patterns.push('state-management');
      analysis.score += 1;
    } else {
      analysis.suggestions.push('Consider implementing proper state management (Context, Redux, Zustand)');
    }

    return analysis;
  }

  async hasComponentStructure(projectRoot) {
    try {
      const componentsDir = path.join(projectRoot, 'src', 'components');
      await fs.access(componentsDir);
      return true;
    } catch {
      return false;
    }
  }

  async hasHooksUsage(projectRoot) {
    // Check for hooks usage in React files
    try {
      const srcDir = path.join(projectRoot, 'src');
      const files = await this.findFiles(srcDir, ['.jsx', '.tsx']);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('useState') || content.includes('useEffect')) {
          return true;
        }
      }
    } catch (error) {
      return false;
    }
    
    return false;
  }

  async hasProperStateManagement(projectRoot) {
    // Check for state management patterns
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const stateManagers = ['redux', '@reduxjs/toolkit', 'zustand', 'jotai', 'recoil'];
      const hasStateManager = stateManagers.some(manager => 
        packageJson.dependencies?.[manager] || packageJson.devDependencies?.[manager]
      );
      
      return hasStateManager;
    } catch {
      return false;
    }
  }

  async findFiles(dir, extensions) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...await this.findFiles(fullPath, extensions));
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore directories we can't read
    }
    return files;
  }
}

/**
 * Vue Architecture Strategy
 */
export class VueArchitectureStrategy extends BaseArchitectureStrategy {
  applies(projectContext) {
    return projectContext.framework === 'vue' || 
           projectContext.projectType === 'vue-webapp';
  }

  async analyze(projectRoot, projectContext) {
    const analysis = {
      patterns: [],
      issues: [],
      suggestions: [],
      score: 0
    };

    if (await this.hasVueStructure(projectRoot)) {
      analysis.patterns.push('vue-structure');
      analysis.score += 1;
    } else {
      analysis.issues.push('Missing Vue.js project structure');
      analysis.suggestions.push('Organize Vue components properly');
    }

    if (await this.hasCompositionAPI(projectRoot)) {
      analysis.patterns.push('composition-api');
      analysis.score += 1;
    }

    return analysis;
  }

  async hasVueStructure(projectRoot) {
    try {
      const componentsDir = path.join(projectRoot, 'src', 'components');
      await fs.access(componentsDir);
      return true;
    } catch {
      return false;
    }
  }

  async hasCompositionAPI(projectRoot) {
    // Simplified check for composition API usage
    return false;
  }
}

/**
 * Node.js Architecture Strategy
 */
export class NodeArchitectureStrategy extends BaseArchitectureStrategy {
  applies(projectContext) {
    return projectContext.projectType === 'node-api' || 
           projectContext.framework === 'express' ||
           projectContext.framework === 'fastify';
  }

  async analyze(projectRoot, projectContext) {
    const analysis = {
      patterns: [],
      issues: [],
      suggestions: [],
      score: 0
    };

    if (await this.hasAPIStructure(projectRoot)) {
      analysis.patterns.push('api-structure');
      analysis.score += 1;
    } else {
      analysis.issues.push('Missing organized API structure');
      analysis.suggestions.push('Organize routes, controllers, and middleware');
    }

    if (await this.hasMiddlewarePattern(projectRoot)) {
      analysis.patterns.push('middleware-pattern');
      analysis.score += 1;
    }

    return analysis;
  }

  async hasAPIStructure(projectRoot) {
    try {
      const routesDir = path.join(projectRoot, 'routes');
      await fs.access(routesDir);
      return true;
    } catch {
      try {
        const srcRoutesDir = path.join(projectRoot, 'src', 'routes');
        await fs.access(srcRoutesDir);
        return true;
      } catch {
        return false;
      }
    }
  }

  async hasMiddlewarePattern(projectRoot) {
    // Check for middleware directory or files
    try {
      const middlewareDir = path.join(projectRoot, 'middleware');
      await fs.access(middlewareDir);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * General Architecture Strategy (fallback)
 */
export class GeneralArchitectureStrategy extends BaseArchitectureStrategy {
  applies(projectContext) {
    return true; // Always applies as fallback
  }

  async analyze(projectRoot, projectContext) {
    const analysis = {
      patterns: [],
      issues: [],
      suggestions: [],
      score: 0
    };

    if (await this.hasOrganizedStructure(projectRoot)) {
      analysis.patterns.push('organized-structure');
      analysis.score += 1;
    } else {
      analysis.issues.push('Project structure could be better organized');
      analysis.suggestions.push('Consider organizing code into logical directories');
    }

    if (await this.hasConfigurationSeparation(projectRoot)) {
      analysis.patterns.push('config-separation');
      analysis.score += 1;
    }

    return analysis;
  }

  async hasOrganizedStructure(projectRoot) {
    try {
      const srcDir = path.join(projectRoot, 'src');
      await fs.access(srcDir);
      return true;
    } catch {
      return false;
    }
  }

  async hasConfigurationSeparation(projectRoot) {
    try {
      const configDir = path.join(projectRoot, 'config');
      await fs.access(configDir);
      return true;
    } catch {
      return false;
    }
  }
}