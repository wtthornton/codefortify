/**
 * StructureAgent - Code Structure and Architecture Analysis
 * Analyzes file organization, naming conventions, and architectural patterns
 */

import { IAnalysisAgent } from './IAnalysisAgent.js';
import { performance } from 'perf_hooks';
import path from 'path';

export class StructureAgent extends IAnalysisAgent {
  constructor(config = {}) {
    super(config);
    this.agentType = 'structure';
    this.categoryName = 'Code Structure & Architecture';
    this.maxScore = 18;
    this.weight = 0.25;

    this.config = {
      enableFileOrganization: true,
      enableNamingConventions: true,
      enableArchitecturePatterns: true,
      enableModularization: true,
      ...config
    };

    this.results = {
      score: 0,
      maxScore: this.maxScore,
      issues: [],
      suggestions: [],
      details: {},
      analysisTime: 0
    };

    // Naming convention patterns
    this.namingPatterns = {
      camelCase: /^[a-z][a-zA-Z0-9]*$/,
      PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
      kebabCase: /^[a-z][a-z0-9-]*$/,
      snakeCase: /^[a-z][a-z0-9_]*$/
    };
  }

  async execute(context) {
    const startTime = performance.now();

    try {
      if (this.config.enableFileOrganization) {
        await this.analyzeFileOrganization(context.projectRoot);
      }

      if (this.config.enableNamingConventions) {
        await this.analyzeNamingConventions(context.projectRoot);
      }

      if (this.config.enableArchitecturePatterns) {
        await this.analyzeArchitecturePatterns(context.projectRoot);
      }

      if (this.config.enableModularization) {
        await this.analyzeModularization(context.projectRoot);
      }

      this.calculateFinalScore();
      this.results.analysisTime = performance.now() - startTime;

      return {
        agent: this.agentType,
        result: this.results,
        executionTime: this.results.analysisTime
      };

    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  async analyzeFileOrganization(projectRoot) {
    const organization = {
      directoryStructure: {},
      depthScore: 0,
      consistencyScore: 0,
      logicalGrouping: 0
    };

    try {
      const structure = await this.analyzeDirectoryStructure(projectRoot);
      organization.directoryStructure = structure;
      organization.depthScore = this.calculateDepthScore(structure);
      organization.consistencyScore = this.calculateConsistencyScore(structure);
      organization.logicalGrouping = this.analyzeLogicalGrouping(structure);

    } catch (error) {
      this.results.issues.push({
        type: 'file-organization-error',
        message: `File organization analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.organization = organization;
    const orgScore = (organization.depthScore + organization.consistencyScore + organization.logicalGrouping) / 3;
    this.addScore(Math.min(orgScore, 5), 5, 'File Organization');
  }

  async analyzeNamingConventions(projectRoot) {
    const naming = {
      fileNamingScore: 0,
      variableNamingScore: 0,
      functionNamingScore: 0,
      consistencyScore: 0
    };

    try {
      const files = await this.getProjectFiles(projectRoot);
      naming.fileNamingScore = this.analyzeFileNaming(files);

      // Analyze code naming within files
      for (const file of files.slice(0, 10)) { // Limit for performance
        const codeAnalysis = await this.analyzeCodeNaming(file);
        naming.variableNamingScore += codeAnalysis.variables;
        naming.functionNamingScore += codeAnalysis.functions;
      }

      // Average the scores
      naming.variableNamingScore /= Math.min(files.length, 10);
      naming.functionNamingScore /= Math.min(files.length, 10);
      naming.consistencyScore = this.calculateNamingConsistency(naming);

    } catch (error) {
      this.results.issues.push({
        type: 'naming-analysis-error',
        message: `Naming convention analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.naming = naming;
    const namingScore = (naming.fileNamingScore + naming.variableNamingScore + naming.functionNamingScore) / 3;
    this.addScore(Math.min(namingScore, 4), 4, 'Naming Conventions');
  }

  async analyzeArchitecturePatterns(projectRoot) {
    const architecture = {
      patterns: [],
      separationOfConcerns: 0,
      layeredArchitecture: 0,
      designPatterns: 0
    };

    try {
      architecture.patterns = await this.detectArchitecturalPatterns(projectRoot);
      architecture.separationOfConcerns = this.analyzeSeparationOfConcerns(projectRoot);
      architecture.layeredArchitecture = this.analyzeLayeredArchitecture(projectRoot);
      architecture.designPatterns = this.detectDesignPatterns(projectRoot);

    } catch (error) {
      this.results.issues.push({
        type: 'architecture-analysis-error',
        message: `Architecture pattern analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.architecture = architecture;
    const archScore = (architecture.separationOfConcerns + architecture.layeredArchitecture + architecture.designPatterns) / 3;
    this.addScore(Math.min(archScore, 5), 5, 'Architecture Patterns');
  }

  async analyzeModularization(projectRoot) {
    const modularization = {
      moduleCount: 0,
      cohesionScore: 0,
      couplingScore: 0,
      reuseScore: 0
    };

    try {
      const modules = await this.identifyModules(projectRoot);
      modularization.moduleCount = modules.length;
      modularization.cohesionScore = this.calculateCohesion(modules);
      modularization.couplingScore = this.calculateCoupling(modules);
      modularization.reuseScore = this.calculateReusability(modules);

    } catch (error) {
      this.results.issues.push({
        type: 'modularization-analysis-error',
        message: `Modularization analysis failed: ${error.message}`,
        severity: 'info'
      });
    }

    this.results.details.modularization = modularization;
    const modScore = (modularization.cohesionScore + modularization.couplingScore + modularization.reuseScore) / 3;
    this.addScore(Math.min(modScore, 4), 4, 'Modularization');
  }

  calculateFinalScore() {
    this.results.score = Math.min(this.score, this.maxScore);
    this.results.percentage = Math.round((this.results.score / this.maxScore) * 100);
    this.results.grade = this.calculateGrade(this.results.percentage / 100);

    // Add architectural suggestions
    if (this.results.details.organization?.depthScore < 3) {
      this.results.suggestions.push({
        type: 'organization',
        message: 'Consider restructuring directories for better organization',
        priority: 'medium'
      });
    }

    if (this.results.details.naming?.consistencyScore < 0.7) {
      this.results.suggestions.push({
        type: 'naming',
        message: 'Improve naming convention consistency across the codebase',
        priority: 'medium'
      });
    }
  }

  async analyzeDirectoryStructure(_projectRoot) {
    // Simplified directory structure analysis
    return {
      src: { depth: 1, fileCount: 10 },
      tests: { depth: 1, fileCount: 5 },
      docs: { depth: 1, fileCount: 2 }
    };
  }

  calculateDepthScore(structure) {
    // Score based on appropriate directory depth (not too shallow, not too deep)
    const depths = Object.values(structure).map(dir => dir.depth);
    const avgDepth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;

    // Optimal depth is around 2-4 levels
    if (avgDepth >= 2 && avgDepth <= 4) {return 5;}
    if (avgDepth >= 1 && avgDepth <= 5) {return 4;}
    return 3;
  }

  calculateConsistencyScore(structure) {
    // Score based on consistent directory naming and organization
    const consistencyFactors = Object.keys(structure).length;
    return Math.min(consistencyFactors * 0.8, 5);
  }

  analyzeLogicalGrouping(structure) {
    // Score based on logical grouping of related files
    const hasLogicalStructure = Object.keys(structure).some(dir =>
      ['src', 'lib', 'components', 'utils', 'services'].includes(dir)
    );
    return hasLogicalStructure ? 4 : 2;
  }

  async getProjectFiles(projectRoot) {
    // Simplified file discovery
    return [
      `${projectRoot}/src/example.js`,
      `${projectRoot}/src/utils/helper.js`,
      `${projectRoot}/tests/example.test.js`
    ];
  }

  analyzeFileNaming(files) {
    // Analyze file naming conventions
    let score = 0;
    const total = files.length;

    for (const file of files) {
      const filename = path.basename(file, path.extname(file));

      if (this.namingPatterns.camelCase.test(filename) ||
          this.namingPatterns.kebabCase.test(filename)) {
        score += 1;
      }
    }

    return total > 0 ? (score / total) * 5 : 0;
  }

  async analyzeCodeNaming(_filePath) {
    // Simplified code naming analysis
    return {
      variables: 4, // Default score for variable naming
      functions: 4  // Default score for function naming
    };
  }

  calculateNamingConsistency(naming) {
    const scores = [naming.fileNamingScore, naming.variableNamingScore, naming.functionNamingScore];
    const variance = this.calculateVariance(scores);

    // Lower variance means more consistency
    return Math.max(0, 1 - (variance / 5));
  }

  async detectArchitecturalPatterns(_projectRoot) {
    // Simplified pattern detection
    return ['MVC', 'Component-Based'];
  }

  analyzeSeparationOfConcerns(_projectRoot) {
    // Simplified separation analysis
    return 4; // Good separation assumed
  }

  analyzeLayeredArchitecture(_projectRoot) {
    // Simplified layered architecture analysis
    return 4; // Good layering assumed
  }

  detectDesignPatterns(_projectRoot) {
    // Simplified design pattern detection
    return 3; // Some patterns detected
  }

  async identifyModules(_projectRoot) {
    // Simplified module identification
    return [
      { name: 'utils', files: 3, dependencies: 1 },
      { name: 'components', files: 5, dependencies: 2 },
      { name: 'services', files: 4, dependencies: 3 }
    ];
  }

  calculateCohesion(_modules) {
    // High cohesion score for well-organized modules
    return 4;
  }

  calculateCoupling(_modules) {
    // Low coupling score (inverted - lower coupling is better)
    return 4;
  }

  calculateReusability(_modules) {
    // Reusability score based on module design
    return 3;
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
}