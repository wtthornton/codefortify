/**
 * ProjectTypeDetector - Detects project type from configuration files
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export class ProjectTypeDetector {
  constructor(config) {
    this.config = config;
  }

  /**
   * Detect project type from package.json and other config files
   * @returns {string} Detected project type
   */
  detect() {
    const projectRoot = this.config.projectRoot;
    
    // Check for React projects
    if (this.isReactProject(projectRoot)) {
      return 'react';
    }
    
    // Check for Vue projects
    if (this.isVueProject(projectRoot)) {
      return 'vue';
    }
    
    // Check for Node.js projects
    if (this.isNodeProject(projectRoot)) {
      return 'node';
    }
    
    // Check for TypeScript projects
    if (this.isTypeScriptProject(projectRoot)) {
      return 'typescript';
    }
    
    // Default to JavaScript
    return 'javascript';
  }

  /**
   * Check if project is a React project
   * @param {string} projectRoot - Project root directory
   * @returns {boolean} True if React project
   */
  isReactProject(projectRoot) {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      return false;
    }
    
    try {
      const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
      
      // Check for React dependencies
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      return dependencies.react || dependencies['react-dom'] || dependencies['@types/react'];
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if project is a Vue project
   * @param {string} projectRoot - Project root directory
   * @returns {boolean} True if Vue project
   */
  isVueProject(projectRoot) {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      return false;
    }
    
    try {
      const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
      
      // Check for Vue dependencies
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      return dependencies.vue || dependencies['@vue/cli-service'] || dependencies['nuxt'];
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if project is a Node.js project
   * @param {string} projectRoot - Project root directory
   * @returns {boolean} True if Node.js project
   */
  isNodeProject(projectRoot) {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    return existsSync(packageJsonPath);
  }

  /**
   * Check if project is a TypeScript project
   * @param {string} projectRoot - Project root directory
   * @returns {boolean} True if TypeScript project
   */
  isTypeScriptProject(projectRoot) {
    const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (existsSync(tsConfigPath)) {
      return true;
    }
    
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        return dependencies.typescript || dependencies['@types/node'];
      } catch (error) {
        return false;
      }
    }
    
    return false;
  }
}