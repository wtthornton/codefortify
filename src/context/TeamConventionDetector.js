/**
 * Team Convention Detector for Context7
 * Detects team-specific coding conventions and patterns
 * 
 * Features:
 * - Team naming conventions
 * - Code organization patterns
 * - Documentation standards
 * - Testing conventions
 * - Git workflow patterns
 */

import { fileUtils } from '../utils/fileUtils.js';
import path from 'path';

export class TeamConventionDetector {
  constructor(config = {}) {
    this.config = config;
    this.conventionPatterns = {
      naming: {
        variables: ['camelCase', 'snake_case', 'PascalCase'],
        functions: ['camelCase', 'snake_case', 'PascalCase'],
        classes: ['PascalCase', 'camelCase'],
        constants: ['UPPER_SNAKE_CASE', 'camelCase'],
        files: ['camelCase', 'PascalCase', 'kebab-case', 'snake_case']
      },
      organization: {
        folderStructure: ['feature-based', 'layer-based', 'type-based'],
        importOrder: ['external-first', 'internal-first', 'alphabetical'],
        exportStyle: ['named-exports', 'default-exports', 'mixed']
      },
      documentation: {
        commentStyle: ['JSDoc', 'inline', 'block', 'minimal'],
        readmeStyle: ['comprehensive', 'minimal', 'structured'],
        apiDocs: ['present', 'absent', 'partial']
      }
    };
  }

  /**
   * Detect team conventions across the project
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} Team convention analysis
   */
  async detectTeamConventions(projectRoot) {
    try {
      console.log(`👥 Detecting team conventions in: ${projectRoot}`);
      
      const conventions = {
        naming: await this.detectNamingConventions(projectRoot),
        organization: await this.detectOrganizationPatterns(projectRoot),
        documentation: await this.detectDocumentationStandards(projectRoot),
        testing: await this.detectTestingConventions(projectRoot),
        git: await this.detectGitConventions(projectRoot),
        codeQuality: await this.detectCodeQualityStandards(projectRoot),
        consistency: await this.analyzeConventionConsistency(projectRoot)
      };

      const recommendations = await this.generateConventionRecommendations(conventions);
      
      console.log(`✅ Team convention detection completed for: ${projectRoot}`);
      return {
        ...conventions,
        recommendations,
        overallScore: this.calculateOverallConventionScore(conventions)
      };
      
    } catch (error) {
      console.error(`❌ Error detecting team conventions: ${error.message}`);
      return {
        naming: {},
        organization: {},
        documentation: {},
        testing: {},
        git: {},
        codeQuality: {},
        consistency: {},
        recommendations: [],
        overallScore: 0
      };
    }
  }

  /**
   * Detect naming conventions
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Naming convention analysis
   */
  async detectNamingConventions(projectRoot) {
    const codeSamples = await this.extractCodeSamples(projectRoot);
    
    return {
      variables: this.analyzeVariableNaming(codeSamples),
      functions: this.analyzeFunctionNaming(codeSamples),
      classes: this.analyzeClassNaming(codeSamples),
      constants: this.analyzeConstantNaming(codeSamples),
      files: this.analyzeFileNaming(codeSamples),
      directories: this.analyzeDirectoryNaming(codeSamples),
      consistency: this.calculateNamingConsistency(codeSamples)
    };
  }

  /**
   * Detect organization patterns
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Organization pattern analysis
   */
  async detectOrganizationPatterns(projectRoot) {
    return {
      folderStructure: await this.analyzeFolderStructure(projectRoot),
      importOrder: await this.analyzeImportOrder(projectRoot),
      exportStyle: await this.analyzeExportStyle(projectRoot),
      fileGrouping: await this.analyzeFileGrouping(projectRoot),
      moduleOrganization: await this.analyzeModuleOrganization(projectRoot)
    };
  }

  /**
   * Detect documentation standards
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Documentation standard analysis
   */
  async detectDocumentationStandards(projectRoot) {
    return {
      readme: await this.analyzeReadmeQuality(projectRoot),
      codeComments: await this.analyzeCodeComments(projectRoot),
      apiDocumentation: await this.analyzeApiDocumentation(projectRoot),
      inlineDocumentation: await this.analyzeInlineDocumentation(projectRoot),
      changelog: await this.analyzeChangelog(projectRoot)
    };
  }

  /**
   * Detect testing conventions
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Testing convention analysis
   */
  async detectTestingConventions(projectRoot) {
    return {
      testStructure: await this.analyzeTestStructure(projectRoot),
      testNaming: await this.analyzeTestNaming(projectRoot),
      testCoverage: await this.analyzeTestCoverage(projectRoot),
      testTypes: await this.analyzeTestTypes(projectRoot),
      mocking: await this.analyzeMockingConventions(projectRoot)
    };
  }

  /**
   * Detect Git conventions
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Git convention analysis
   */
  async detectGitConventions(projectRoot) {
    return {
      commitMessages: await this.analyzeCommitMessages(projectRoot),
      branching: await this.analyzeBranchingStrategy(projectRoot),
      gitignore: await this.analyzeGitignore(projectRoot),
      hooks: await this.analyzeGitHooks(projectRoot)
    };
  }

  /**
   * Detect code quality standards
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Code quality standard analysis
   */
  async detectCodeQualityStandards(projectRoot) {
    return {
      linting: await this.analyzeLintingSetup(projectRoot),
      formatting: await this.analyzeFormattingSetup(projectRoot),
      typeChecking: await this.analyzeTypeChecking(projectRoot),
      security: await this.analyzeSecurityStandards(projectRoot),
      performance: await this.analyzePerformanceStandards(projectRoot)
    };
  }

  // Private methods

  async extractCodeSamples(projectRoot) {
    const samples = [];
    
    try {
      const jsFiles = await fileUtils.getFilesByExtension(projectRoot, ['.js', '.jsx', '.ts', '.tsx']);
      const filesToAnalyze = jsFiles.slice(0, 15); // Limit for performance
      
      for (const file of filesToAnalyze) {
        try {
          const content = await fileUtils.readFile(file);
          samples.push({
            file,
            content,
            extension: path.extname(file),
            directory: path.dirname(file)
          });
        } catch (error) {
          console.error(`Error reading file ${file}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Error extracting code samples: ${error.message}`);
    }

    return samples;
  }

  analyzeVariableNaming(codeSamples) {
    const patterns = { camelCase: 0, snake_case: 0, PascalCase: 0, other: 0 };
    
    for (const sample of codeSamples) {
      const variableMatches = sample.content.match(/(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
      
      for (const match of variableMatches) {
        const variable = match.split(/\s+/)[1];
        if (/^[a-z][a-zA-Z0-9]*$/.test(variable)) {
          patterns.camelCase++;
        } else if (/^[a-z][a-z0-9_]*$/.test(variable)) {
          patterns.snake_case++;
        } else if (/^[A-Z][a-zA-Z0-9]*$/.test(variable)) {
          patterns.PascalCase++;
        } else {
          patterns.other++;
        }
      }
    }
    
    return patterns;
  }

  analyzeFunctionNaming(codeSamples) {
    const patterns = { camelCase: 0, snake_case: 0, PascalCase: 0, other: 0 };
    
    for (const sample of codeSamples) {
      const functionMatches = sample.content.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
      const arrowFunctionMatches = sample.content.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(/g) || [];
      
      const allMatches = [...functionMatches, ...arrowFunctionMatches];
      
      for (const match of allMatches) {
        const funcName = match.split(/\s+/)[1] || match.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)/)?.[1];
        if (!funcName) continue;
        
        if (/^[a-z][a-zA-Z0-9]*$/.test(funcName)) {
          patterns.camelCase++;
        } else if (/^[a-z][a-z0-9_]*$/.test(funcName)) {
          patterns.snake_case++;
        } else if (/^[A-Z][a-zA-Z0-9]*$/.test(funcName)) {
          patterns.PascalCase++;
        } else {
          patterns.other++;
        }
      }
    }
    
    return patterns;
  }

  analyzeClassNaming(codeSamples) {
    const patterns = { PascalCase: 0, camelCase: 0, other: 0 };
    
    for (const sample of codeSamples) {
      const classMatches = sample.content.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
      
      for (const match of classMatches) {
        const className = match.split(/\s+/)[1];
        if (/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
          patterns.PascalCase++;
        } else if (/^[a-z][a-zA-Z0-9]*$/.test(className)) {
          patterns.camelCase++;
        } else {
          patterns.other++;
        }
      }
    }
    
    return patterns;
  }

  analyzeConstantNaming(codeSamples) {
    const patterns = { UPPER_SNAKE_CASE: 0, camelCase: 0, other: 0 };
    
    for (const sample of codeSamples) {
      const constMatches = sample.content.match(/const\s+([A-Z_][A-Z0-9_]*)/g) || [];
      
      for (const match of constMatches) {
        const constName = match.split(/\s+/)[1];
        if (/^[A-Z][A-Z0-9_]*$/.test(constName)) {
          patterns.UPPER_SNAKE_CASE++;
        } else if (/^[a-z][a-zA-Z0-9]*$/.test(constName)) {
          patterns.camelCase++;
        } else {
          patterns.other++;
        }
      }
    }
    
    return patterns;
  }

  analyzeFileNaming(codeSamples) {
    const patterns = { camelCase: 0, PascalCase: 0, kebab-case: 0, snake_case: 0, other: 0 };
    
    for (const sample of codeSamples) {
      const fileName = path.basename(sample.file, path.extname(sample.file));
      
      if (/^[a-z][a-zA-Z0-9]*$/.test(fileName)) {
        patterns.camelCase++;
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(fileName)) {
        patterns.PascalCase++;
      } else if (fileName.includes('-')) {
        patterns['kebab-case']++;
      } else if (fileName.includes('_')) {
        patterns.snake_case++;
      } else {
        patterns.other++;
      }
    }
    
    return patterns;
  }

  analyzeDirectoryNaming(codeSamples) {
    const patterns = { camelCase: 0, kebab-case: 0, snake_case: 0, other: 0 };
    const directories = new Set();
    
    for (const sample of codeSamples) {
      const dirName = path.basename(sample.directory);
      if (dirName && !directories.has(dirName)) {
        directories.add(dirName);
        
        if (/^[a-z][a-zA-Z0-9]*$/.test(dirName)) {
          patterns.camelCase++;
        } else if (dirName.includes('-')) {
          patterns['kebab-case']++;
        } else if (dirName.includes('_')) {
          patterns.snake_case++;
        } else {
          patterns.other++;
        }
      }
    }
    
    return patterns;
  }

  calculateNamingConsistency(codeSamples) {
    const variablePatterns = this.analyzeVariableNaming(codeSamples);
    const functionPatterns = this.analyzeFunctionNaming(codeSamples);
    const classPatterns = this.analyzeClassNaming(codeSamples);
    
    const totalVariables = Object.values(variablePatterns).reduce((a, b) => a + b, 0);
    const totalFunctions = Object.values(functionPatterns).reduce((a, b) => a + b, 0);
    const totalClasses = Object.values(classPatterns).reduce((a, b) => a + b, 0);
    
    const variableConsistency = totalVariables > 0 ? 
      Math.max(...Object.values(variablePatterns)) / totalVariables : 0;
    const functionConsistency = totalFunctions > 0 ? 
      Math.max(...Object.values(functionPatterns)) / totalFunctions : 0;
    const classConsistency = totalClasses > 0 ? 
      Math.max(...Object.values(classPatterns)) / totalClasses : 0;
    
    return {
      variables: variableConsistency,
      functions: functionConsistency,
      classes: classConsistency,
      overall: (variableConsistency + functionConsistency + classConsistency) / 3
    };
  }

  async analyzeFolderStructure(projectRoot) {
    try {
      const structure = await fileUtils.getDirectoryTree(projectRoot);
      const patterns = {
        featureBased: 0,
        layerBased: 0,
        typeBased: 0,
        mixed: 0
      };
      
      // Analyze folder structure patterns
      const folders = this.extractFolderNames(structure);
      
      // Check for feature-based structure
      if (folders.some(f => f.includes('feature') || f.includes('component'))) {
        patterns.featureBased++;
      }
      
      // Check for layer-based structure
      if (folders.some(f => f.includes('layer') || f.includes('service'))) {
        patterns.layerBased++;
      }
      
      // Check for type-based structure
      if (folders.some(f => f.includes('type') || f.includes('model'))) {
        patterns.typeBased++;
      }
      
      return patterns;
    } catch (error) {
      return { featureBased: 0, layerBased: 0, typeBased: 0, mixed: 0 };
    }
  }

  async analyzeImportOrder(projectRoot) {
    const codeSamples = await this.extractCodeSamples(projectRoot);
    const importPatterns = { externalFirst: 0, internalFirst: 0, alphabetical: 0, mixed: 0 };
    
    for (const sample of codeSamples) {
      const imports = sample.content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];
      
      if (imports.length > 1) {
        const externalImports = imports.filter(imp => 
          !imp.includes('./') && !imp.includes('../')
        );
        const internalImports = imports.filter(imp => 
          imp.includes('./') || imp.includes('../')
        );
        
        if (externalImports.length > 0 && internalImports.length > 0) {
          const firstImport = imports[0];
          if (firstImport.includes('./') || firstImport.includes('../')) {
            importPatterns.internalFirst++;
          } else {
            importPatterns.externalFirst++;
          }
        }
      }
    }
    
    return importPatterns;
  }

  async analyzeExportStyle(projectRoot) {
    const codeSamples = await this.extractCodeSamples(projectRoot);
    const exportPatterns = { namedExports: 0, defaultExports: 0, mixed: 0 };
    
    for (const sample of codeSamples) {
      const namedExports = (sample.content.match(/export\s+(?:const|let|var|function|class)/g) || []).length;
      const defaultExports = (sample.content.match(/export\s+default/g) || []).length;
      
      if (namedExports > 0 && defaultExports > 0) {
        exportPatterns.mixed++;
      } else if (namedExports > 0) {
        exportPatterns.namedExports++;
      } else if (defaultExports > 0) {
        exportPatterns.defaultExports++;
      }
    }
    
    return exportPatterns;
  }

  async analyzeFileGrouping(projectRoot) {
    // Analyze how files are grouped in directories
    return {
      byFeature: 0,
      byType: 0,
      byLayer: 0,
      mixed: 0
    };
  }

  async analyzeModuleOrganization(projectRoot) {
    // Analyze module organization patterns
    return {
      singleResponsibility: 0,
      featureModules: 0,
      sharedModules: 0,
      mixed: 0
    };
  }

  async analyzeReadmeQuality(projectRoot) {
    try {
      const readmePath = path.join(projectRoot, 'README.md');
      if (await fileUtils.fileExists(readmePath)) {
        const content = await fileUtils.readFile(readmePath);
        return {
          exists: true,
          length: content.length,
          hasInstallation: content.includes('install') || content.includes('setup'),
          hasUsage: content.includes('usage') || content.includes('example'),
          hasApiDocs: content.includes('api') || content.includes('endpoint'),
          hasContributing: content.includes('contributing') || content.includes('contribute'),
          quality: this.assessReadmeQuality(content)
        };
      }
    } catch (error) {
      console.error(`Error analyzing README: ${error.message}`);
    }
    
    return { exists: false, quality: 0 };
  }

  async analyzeCodeComments(projectRoot) {
    const codeSamples = await this.extractCodeSamples(projectRoot);
    const commentStats = {
      totalLines: 0,
      commentLines: 0,
      jsdocComments: 0,
      inlineComments: 0,
      blockComments: 0
    };
    
    for (const sample of codeSamples) {
      const lines = sample.content.split('\n');
      commentStats.totalLines += lines.length;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//')) {
          commentStats.inlineComments++;
          commentStats.commentLines++;
        } else if (trimmed.startsWith('/*')) {
          commentStats.blockComments++;
          commentStats.commentLines++;
        } else if (trimmed.startsWith('/**')) {
          commentStats.jsdocComments++;
          commentStats.commentLines++;
        }
      }
    }
    
    return {
      ...commentStats,
      commentRatio: commentStats.totalLines > 0 ? 
        commentStats.commentLines / commentStats.totalLines : 0
    };
  }

  async analyzeApiDocumentation(projectRoot) {
    // Check for API documentation files
    const apiDocs = {
      exists: false,
      format: 'none',
      coverage: 0
    };
    
    try {
      const docsPath = path.join(projectRoot, 'docs');
      if (await fileUtils.directoryExists(docsPath)) {
        apiDocs.exists = true;
        apiDocs.format = 'docs';
      }
    } catch (error) {
      // Ignore errors
    }
    
    return apiDocs;
  }

  async analyzeInlineDocumentation(projectRoot) {
    const codeSamples = await this.extractCodeSamples(projectRoot);
    const docStats = {
      functionsWithDocs: 0,
      totalFunctions: 0,
      classesWithDocs: 0,
      totalClasses: 0
    };
    
    for (const sample of codeSamples) {
      const functions = sample.content.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
      const classes = sample.content.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
      
      docStats.totalFunctions += functions.length;
      docStats.totalClasses += classes.length;
      
      // Check for JSDoc comments before functions/classes
      const lines = sample.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('function') && i > 0 && lines[i-1].trim().startsWith('/**')) {
          docStats.functionsWithDocs++;
        }
        if (lines[i].includes('class') && i > 0 && lines[i-1].trim().startsWith('/**')) {
          docStats.classesWithDocs++;
        }
      }
    }
    
    return {
      ...docStats,
      functionDocRatio: docStats.totalFunctions > 0 ? 
        docStats.functionsWithDocs / docStats.totalFunctions : 0,
      classDocRatio: docStats.totalClasses > 0 ? 
        docStats.classesWithDocs / docStats.totalClasses : 0
    };
  }

  async analyzeChangelog(projectRoot) {
    try {
      const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
      if (await fileUtils.fileExists(changelogPath)) {
        const content = await fileUtils.readFile(changelogPath);
        return {
          exists: true,
          length: content.length,
          hasVersioning: content.includes('## [') || content.includes('### ['),
          hasDates: content.includes('20') && content.includes('-'),
          quality: this.assessChangelogQuality(content)
        };
      }
    } catch (error) {
      console.error(`Error analyzing CHANGELOG: ${error.message}`);
    }
    
    return { exists: false, quality: 0 };
  }

  // Placeholder methods for additional analysis
  async analyzeTestStructure(projectRoot) { return {}; }
  async analyzeTestNaming(projectRoot) { return {}; }
  async analyzeTestCoverage(projectRoot) { return {}; }
  async analyzeTestTypes(projectRoot) { return {}; }
  async analyzeMockingConventions(projectRoot) { return {}; }
  async analyzeCommitMessages(projectRoot) { return {}; }
  async analyzeBranchingStrategy(projectRoot) { return {}; }
  async analyzeGitignore(projectRoot) { return {}; }
  async analyzeGitHooks(projectRoot) { return {}; }
  async analyzeLintingSetup(projectRoot) { return {}; }
  async analyzeFormattingSetup(projectRoot) { return {}; }
  async analyzeTypeChecking(projectRoot) { return {}; }
  async analyzeSecurityStandards(projectRoot) { return {}; }
  async analyzePerformanceStandards(projectRoot) { return {}; }
  async analyzeConventionConsistency(projectRoot) { return {}; }

  extractFolderNames(structure) {
    const folders = [];
    const extract = (node, path = '') => {
      if (node.type === 'directory') {
        folders.push(path + node.name);
        if (node.children) {
          node.children.forEach(child => extract(child, path + node.name + '/'));
        }
      }
    };
    extract(structure);
    return folders;
  }

  assessReadmeQuality(content) {
    let score = 0;
    if (content.length > 500) score += 1;
    if (content.includes('##')) score += 1;
    if (content.includes('```')) score += 1;
    if (content.includes('install')) score += 1;
    if (content.includes('usage')) score += 1;
    return score / 5;
  }

  assessChangelogQuality(content) {
    let score = 0;
    if (content.length > 200) score += 1;
    if (content.includes('## [') || content.includes('### [')) score += 1;
    if (content.includes('Added') || content.includes('Changed')) score += 1;
    if (content.includes('Fixed') || content.includes('Removed')) score += 1;
    return score / 4;
  }

  async generateConventionRecommendations(conventions) {
    const recommendations = [];
    
    // Naming convention recommendations
    if (conventions.naming.consistency.overall < 0.8) {
      recommendations.push({
        type: 'naming',
        priority: 'high',
        message: 'Inconsistent naming conventions detected',
        suggestion: 'Establish and document consistent naming conventions for the team'
      });
    }
    
    // Documentation recommendations
    if (conventions.documentation.readme.quality < 0.6) {
      recommendations.push({
        type: 'documentation',
        priority: 'medium',
        message: 'README quality could be improved',
        suggestion: 'Enhance README with installation, usage, and API documentation'
      });
    }
    
    return recommendations;
  }

  calculateOverallConventionScore(conventions) {
    const scores = [];
    
    if (conventions.naming.consistency.overall) {
      scores.push(conventions.naming.consistency.overall);
    }
    
    if (conventions.documentation.readme.quality) {
      scores.push(conventions.documentation.readme.quality);
    }
    
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }
}
