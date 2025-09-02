/**
 * Structure Analysis Utilities
 * Extracted utility methods from StructureAnalyzer to follow Single Responsibility Principle
 */

import path from 'path';
import fs from 'fs/promises';

export class FileOrganizationUtils {
  /**
   * Analyze file organization structure
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} File organization analysis
   */
  static async analyzeFileOrganization(projectRoot) {
    const analysis = {
      score: 0,
      maxScore: 4,
      issues: [],
      suggestions: [],
      patterns: []
    };

    try {
      // Check for standard directory structure
      const standardDirs = ['src', 'lib', 'components', 'utils', 'config'];
      const existingDirs = [];

      for (const dir of standardDirs) {
        try {
          await fs.access(path.join(projectRoot, dir));
          existingDirs.push(dir);
        } catch {
          // Directory doesn't exist
        }
      }

      if (existingDirs.length >= 2) {
        analysis.score += 2;
        analysis.patterns.push('organized-directories');
      } else {
        analysis.issues.push('Missing organized directory structure');
        analysis.suggestions.push('Create logical directory structure (src/, lib/, utils/)');
      }

      // Check for flat vs nested structure
      const isFlat = await this.isFlat(projectRoot);
      if (!isFlat) {
        analysis.score += 1;
        analysis.patterns.push('nested-structure');
      } else {
        analysis.suggestions.push('Consider organizing files into subdirectories');
      }

      // Check for separation of concerns
      if (await this.hasSeparationOfConcerns(projectRoot)) {
        analysis.score += 1;
        analysis.patterns.push('separation-of-concerns');
      }

    } catch (error) {
      analysis.issues.push(`File organization analysis failed: ${error.message}`);
    }

    return analysis;
  }

  /**
   * Check if project has a flat structure
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<boolean>} True if structure is flat
   */
  static async isFlat(projectRoot) {
    try {
      const entries = await fs.readdir(projectRoot, { withFileTypes: true });
      const jsFiles = entries.filter(entry => 
        entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))
      );
      const directories = entries.filter(entry => 
        entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules'
      );

      // If more than 5 JS files in root and fewer than 3 directories, consider it flat
      return jsFiles.length > 5 && directories.length < 3;
    } catch {
      return true;
    }
  }

  /**
   * Check for separation of concerns in directory structure
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<boolean>} True if has separation of concerns
   */
  static async hasSeparationOfConcerns(projectRoot) {
    const concernDirs = ['models', 'views', 'controllers', 'services', 'components', 'utils'];
    let foundConcerns = 0;

    for (const concern of concernDirs) {
      try {
        await fs.access(path.join(projectRoot, 'src', concern));
        foundConcerns++;
      } catch {
        try {
          await fs.access(path.join(projectRoot, concern));
          foundConcerns++;
        } catch {
          // Directory doesn't exist
        }
      }
    }

    return foundConcerns >= 2;
  }
}

export class NamingConventionUtils {
  /**
   * Analyze naming conventions across files
   * @param {Array} files - List of file paths
   * @returns {Promise<Object>} Naming analysis results
   */
  static async analyzeNamingConventions(files) {
    const analysis = {
      consistency: 0,
      patterns: [],
      issues: [],
      fileNamingStyle: 'mixed'
    };

    if (files.length === 0) {
      return analysis;
    }

    // Analyze file naming patterns
    const namingPatterns = this.analyzeFileNamingPatterns(files);
    analysis.fileNamingStyle = namingPatterns.dominantStyle;
    analysis.consistency = namingPatterns.consistency;

    // Check for consistent patterns
    if (namingPatterns.consistency > 0.8) {
      analysis.patterns.push('consistent-naming');
    } else {
      analysis.issues.push('Inconsistent file naming conventions');
    }

    return analysis;
  }

  /**
   * Analyze file naming patterns
   * @param {Array} files - List of file paths
   * @returns {Object} Pattern analysis
   */
  static analyzeFileNamingPatterns(files) {
    const patterns = {
      camelCase: 0,
      kebabCase: 0,
      snakeCase: 0,
      PascalCase: 0
    };

    for (const file of files) {
      const basename = path.basename(file, path.extname(file));
      
      if (this.isCamelCase(basename)) patterns.camelCase++;
      else if (this.isKebabCase(basename)) patterns.kebabCase++;
      else if (this.isSnakeCase(basename)) patterns.snakeCase++;
      else if (this.isPascalCase(basename)) patterns.PascalCase++;
    }

    const total = files.length;
    const maxCount = Math.max(...Object.values(patterns));
    const dominantStyle = Object.keys(patterns).find(key => patterns[key] === maxCount);
    const consistency = maxCount / total;

    return {
      patterns,
      dominantStyle,
      consistency
    };
  }

  static isCamelCase(str) {
    return /^[a-z][a-zA-Z0-9]*$/.test(str);
  }

  static isKebabCase(str) {
    return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
  }

  static isSnakeCase(str) {
    return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(str);
  }

  static isPascalCase(str) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
  }
}

export class DependencyAnalysisUtils {
  /**
   * Analyze project dependencies for circular references and coupling
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Dependency analysis
   */
  static async analyzeDependencies(projectRoot) {
    const analysis = {
      score: 0,
      maxScore: 3,
      issues: [],
      suggestions: [],
      circularDependencies: [],
      couplingScore: 0
    };

    try {
      // Basic dependency analysis
      const files = await this.findSourceFiles(projectRoot);
      const dependencies = await this.extractDependencies(files);
      
      // Check for circular dependencies (simplified)
      const circular = this.findCircularDependencies(dependencies);
      analysis.circularDependencies = circular;

      if (circular.length === 0) {
        analysis.score += 2;
      } else {
        analysis.issues.push(`Found ${circular.length} circular dependencies`);
        analysis.suggestions.push('Refactor to eliminate circular dependencies');
      }

      // Check coupling
      const coupling = this.calculateCoupling(dependencies);
      analysis.couplingScore = coupling;

      if (coupling < 0.3) {
        analysis.score += 1;
      } else {
        analysis.suggestions.push('Consider reducing coupling between modules');
      }

    } catch (error) {
      analysis.issues.push(`Dependency analysis failed: ${error.message}`);
    }

    return analysis;
  }

  /**
   * Find source files in project
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Array>} List of source files
   */
  static async findSourceFiles(projectRoot) {
    const files = [];
    const extensions = ['.js', '.ts', '.jsx', '.tsx'];

    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }

    await scanDirectory(projectRoot);
    return files;
  }

  /**
   * Extract dependencies from source files
   * @param {Array} files - List of file paths
   * @returns {Promise<Object>} Dependency map
   */
  static async extractDependencies(files) {
    const dependencies = {};

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const deps = this.parseDependencies(content, file);
        dependencies[file] = deps;
      } catch (error) {
        // Skip unreadable files
      }
    }

    return dependencies;
  }

  /**
   * Parse dependencies from file content
   * @param {string} content - File content
   * @param {string} filePath - File path for relative resolution
   * @returns {Array} List of dependencies
   */
  static parseDependencies(content, filePath) {
    const deps = [];
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1].startsWith('.')) {
        // Resolve relative path
        const resolvedPath = path.resolve(path.dirname(filePath), match[1]);
        deps.push(resolvedPath);
      }
    }

    while ((match = requireRegex.exec(content)) !== null) {
      if (match[1].startsWith('.')) {
        // Resolve relative path
        const resolvedPath = path.resolve(path.dirname(filePath), match[1]);
        deps.push(resolvedPath);
      }
    }

    return deps;
  }

  /**
   * Find circular dependencies (simplified implementation)
   * @param {Object} dependencies - Dependency map
   * @returns {Array} List of circular dependency chains
   */
  static findCircularDependencies(dependencies) {
    // Simplified circular dependency detection
    const circular = [];
    const visited = new Set();
    const recursionStack = new Set();

    function hasCycle(node) {
      if (recursionStack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);

      const deps = dependencies[node] || [];
      for (const dep of deps) {
        if (hasCycle(dep)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    }

    for (const file of Object.keys(dependencies)) {
      if (hasCycle(file)) {
        circular.push(file);
      }
    }

    return circular;
  }

  /**
   * Calculate coupling score
   * @param {Object} dependencies - Dependency map
   * @returns {number} Coupling score (0-1, lower is better)
   */
  static calculateCoupling(dependencies) {
    const files = Object.keys(dependencies);
    if (files.length === 0) return 0;

    const totalDependencies = Object.values(dependencies)
      .reduce((sum, deps) => sum + deps.length, 0);

    return totalDependencies / (files.length * files.length);
  }
}