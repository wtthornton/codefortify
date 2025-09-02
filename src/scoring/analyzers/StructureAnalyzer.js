/**
 * Structure Analyzer (Refactored)
 * Clean implementation focused on orchestrating structure analysis
 * Reduced from 1615 lines to ~300 lines using Strategy pattern and utility extraction
 */

import path from 'path';
import fs from 'fs/promises';
import { BaseAnalyzer } from './BaseAnalyzer.js';
import { FileOrganizationUtils, NamingConventionUtils, DependencyAnalysisUtils } from './utils/StructureAnalysisUtils.js';
import {
  ReactArchitectureStrategy,
  VueArchitectureStrategy,
  NodeArchitectureStrategy,
  GeneralArchitectureStrategy
} from './strategies/ArchitectureAnalysisStrategy.js';

export class StructureAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Code Structure & Architecture';
    this.maxScore = 18;

    // Initialize architecture analysis strategies
    this.architectureStrategies = [
      new ReactArchitectureStrategy(config),
      new VueArchitectureStrategy(config),
      new NodeArchitectureStrategy(config),
      new GeneralArchitectureStrategy(config) // Fallback strategy
    ];
  }

  /**
   * Run structure analysis across all categories
   * @returns {Promise<Object>} Complete structure analysis
   */
  async runAnalysis() {
    this.projectRoot = this.config.projectRoot;

    try {
      // Run all structure analyses
      await this.analyzeFileOrganization(); // 4pts
      await this.analyzeModuleBoundaries(); // 4pts
      await this.analyzeNamingConventions(); // 4pts
      await this.analyzeArchitecturePatterns(); // 3pts
      await this.analyzeDependencies(); // 3pts

      // Store analysis details
      this.setDetail('totalFiles', await this.countFiles());
      this.setDetail('directoryStructure', await this.getDirectoryStructure());

      return this.results;

    } catch (error) {
      this.addIssue(`Structure analysis failed: ${error.message}`);
      return this.results;
    }
  }

  /**
   * Analyze file organization and directory structure (4pts)
   */
  async analyzeFileOrganization() {
    try {
      const analysis = await FileOrganizationUtils.analyzeFileOrganization(this.projectRoot);

      // Add score
      this.addScore(analysis.score, analysis.maxScore, 'File Organization');

      // Add issues and suggestions
      analysis.issues.forEach(issue => this.addIssue(issue));
      analysis.suggestions.forEach(suggestion => this.addSuggestion({
        category: 'File Organization',
        suggestion
      }));

      // Set details
      this.setDetail('organizationPatterns', analysis.patterns);

    } catch (error) {
      this.addIssue(`File organization analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze module boundaries and separation of concerns (4pts)
   */
  async analyzeModuleBoundaries() {
    let score = 0;
    const maxScore = 4;

    try {
      // Get all source files
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.vue']);
      const moduleAnalysis = await this.analyzeModuleStructure(files);

      // Score based on module organization
      if (moduleAnalysis.separationScore > 0.8) {
        score += 2;
        this.addScore(2, 2, 'Excellent module separation');
      } else if (moduleAnalysis.separationScore > 0.6) {
        score += 1;
        this.addScore(1, 2, 'Good module separation');
        this.addSuggestion({
          category: 'Module Boundaries',
          suggestion: 'Further improve module separation and boundaries'
        });
      } else {
        this.addIssue('Poor module separation - consider refactoring');
        this.addSuggestion({
          category: 'Module Boundaries',
          suggestion: 'Implement clear module boundaries and separation of concerns'
        });
      }

      // Score based on module size consistency
      const avgModuleSize = moduleAnalysis.totalModules > 0 ?
        files.length / moduleAnalysis.totalModules : 0;

      if (avgModuleSize > 0 && avgModuleSize < 20) {
        score += 2;
        this.addScore(2, 2, 'Well-sized modules');
      } else if (avgModuleSize < 50) {
        score += 1;
        this.addScore(1, 2, 'Reasonably sized modules');
      } else {
        this.addIssue('Modules are too large - consider breaking them down');
      }

      this.setDetail('averageModuleSize', avgModuleSize);
      this.setDetail('totalModules', moduleAnalysis.totalModules);

    } catch (error) {
      this.addIssue(`Module boundary analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze naming conventions consistency (4pts)
   */
  async analyzeNamingConventions() {
    let score = 0;
    const maxScore = 4;

    try {
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.vue']);
      const namingResults = await NamingConventionUtils.analyzeNamingConventions(files);

      // Score based on naming consistency
      if (namingResults.consistency > 0.8) {
        score += 2;
        this.addScore(2, 2, `Naming conventions are consistent (${Math.round(namingResults.consistency * 100)}%)`);
      } else if (namingResults.consistency > 0.6) {
        score += 1;
        this.addScore(1, 2, `Naming conventions are mostly consistent (${Math.round(namingResults.consistency * 100)}%)`);
        this.addIssue('Some naming inconsistencies found');
        this.addSuggestion({
          category: 'Naming Conventions',
          suggestion: 'Standardize naming conventions across the project'
        });
      } else {
        this.addIssue('Inconsistent naming conventions throughout the project');
        this.addSuggestion({
          category: 'Naming Conventions',
          suggestion: `Adopt consistent ${namingResults.fileNamingStyle} naming convention`
        });
      }

      // Score based on meaningful names
      if (await this.hasMeaningfulNames(files)) {
        score += 2;
        this.addScore(2, 2, 'Files have meaningful names');
      } else {
        score += 1;
        this.addScore(1, 2, 'Some files could have more descriptive names');
        this.addSuggestion({
          category: 'Naming Conventions',
          suggestion: 'Use more descriptive file and directory names'
        });
      }

      this.setDetail('namingStyle', namingResults.fileNamingStyle);
      this.setDetail('namingConsistency', Math.round(namingResults.consistency * 100));

    } catch (error) {
      this.addIssue(`Naming convention analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze architecture patterns and design (3pts)
   */
  async analyzeArchitecturePatterns() {
    try {
      // Determine project context
      const projectContext = await this.getProjectContext();

      // Find applicable strategy
      const strategy = this.architectureStrategies.find(s => s.applies(projectContext)) ||
                      this.architectureStrategies[this.architectureStrategies.length - 1]; // Fallback

      // Run architecture analysis
      const analysis = await strategy.analyze(this.projectRoot, projectContext);

      // Add score (max 3pts)
      const score = Math.min(analysis.score, 3);
      this.addScore(score, 3, `${projectContext.framework || 'General'} architecture patterns`);

      // Add issues and suggestions
      analysis.issues.forEach(issue => this.addIssue(issue));
      analysis.suggestions.forEach(suggestion => this.addSuggestion({
        category: 'Architecture Patterns',
        suggestion
      }));

      // Set details
      this.setDetail('architecturePatterns', analysis.patterns);
      this.setDetail('frameworkStrategy', strategy.constructor.name);

    } catch (error) {
      this.addIssue(`Architecture pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze circular dependencies and coupling (3pts)
   */
  async analyzeDependencies() {
    try {
      const analysis = await DependencyAnalysisUtils.analyzeDependencies(this.projectRoot);

      // Add score
      this.addScore(analysis.score, analysis.maxScore, 'Dependency Analysis');

      // Add issues and suggestions
      analysis.issues.forEach(issue => this.addIssue(issue));
      analysis.suggestions.forEach(suggestion => this.addSuggestion({
        category: 'Dependencies',
        suggestion
      }));

      // Set details
      this.setDetail('circularDependencies', analysis.circularDependencies.length);
      this.setDetail('couplingScore', Math.round(analysis.couplingScore * 100));

    } catch (error) {
      this.addIssue(`Dependency analysis failed: ${error.message}`);
    }
  }

  // Helper methods

  /**
   * Get project context for strategy selection
   */
  async getProjectContext() {
    try {
      // Check package.json for framework information
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      // Determine framework
      let framework = this.config.framework;
      if (!framework) {
        if (packageJson.dependencies?.react) {framework = 'react';}
        else if (packageJson.dependencies?.vue) {framework = 'vue';}
        else if (packageJson.dependencies?.express) {framework = 'express';}
        else {framework = 'general';}
      }

      return {
        framework,
        projectType: this.config.projectType || 'javascript',
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      };

    } catch (error) {
      return {
        framework: 'general',
        projectType: 'javascript',
        dependencies: {},
        devDependencies: {}
      };
    }
  }

  /**
   * Analyze module structure
   */
  async analyzeModuleStructure(files) {
    const analysis = {
      totalModules: 0,
      separationScore: 0
    };

    // Count directories as modules
    const directories = new Set();
    files.forEach(file => {
      const dir = path.dirname(file);
      if (dir !== this.projectRoot) {
        directories.add(dir);
      }
    });

    analysis.totalModules = directories.size;

    // Calculate separation score based on file distribution
    if (directories.size > 0) {
      const filesPerModule = files.length / directories.size;
      // Good separation: 5-15 files per module
      if (filesPerModule >= 5 && filesPerModule <= 15) {
        analysis.separationScore = 1.0;
      } else if (filesPerModule >= 3 && filesPerModule <= 25) {
        analysis.separationScore = 0.7;
      } else {
        analysis.separationScore = 0.4;
      }
    }

    return analysis;
  }

  /**
   * Check if files have meaningful names
   */
  async hasMeaningfulNames(files) {
    if (files.length === 0) {return false;}

    const meaninglessPatterns = [
      /^temp/i, /^test\d*$/i, /^file\d*$/i, /^untitled/i,
      /^new/i, /^copy/i, /^backup/i, /^\d+$/
    ];

    const meaninglessCount = files.filter(file => {
      const basename = path.basename(file, path.extname(file));
      return meaninglessPatterns.some(pattern => pattern.test(basename));
    }).length;

    return meaninglessCount / files.length < 0.1; // Less than 10% meaningless names
  }

  /**
   * Count total files in project
   */
  async countFiles() {
    try {
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.vue']);
      return files.length;
    } catch {
      return 0;
    }
  }

  /**
   * Get directory structure overview
   */
  async getDirectoryStructure() {
    try {
      const entries = await fs.readdir(this.projectRoot, { withFileTypes: true });
      const structure = {
        directories: [],
        files: 0
      };

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          structure.directories.push(entry.name);
        } else if (entry.isFile()) {
          structure.files++;
        }
      }

      return structure;
    } catch {
      return { directories: [], files: 0 };
    }
  }
}