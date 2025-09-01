/**
 * Code Style Analyzer for Context7
 * Analyzes code style, formatting, and conventions
 * 
 * Features:
 * - Code formatting analysis
 * - Naming convention detection
 * - Code structure analysis
 * - Comment style analysis
 * - Configuration file detection
 */

import { fileUtils } from '../utils/fileUtils.js';
import path from 'path';

export class CodeStyleAnalyzer {
  constructor(config = {}) {
    this.config = config;
    this.styleConfigs = {
      prettier: '.prettierrc',
      eslint: '.eslintrc',
      stylelint: '.stylelintrc',
      editorconfig: '.editorconfig'
    };
  }

  /**
   * Analyze code style across the project
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} Comprehensive code style analysis
   */
  async analyzeCodeStyle(projectRoot) {
    try {
      console.log(`🎨 Analyzing code style in: ${projectRoot}`);
      
      const styleConfig = await this.detectStyleConfiguration(projectRoot);
      const codeSamples = await this.extractCodeSamples(projectRoot);
      
      const analysis = {
        formatting: await this.analyzeFormatting(codeSamples, styleConfig),
        naming: await this.analyzeNamingConventions(codeSamples),
        structure: await this.analyzeCodeStructure(codeSamples),
        comments: await this.analyzeCommentStyle(codeSamples),
        config: styleConfig,
        consistency: await this.analyzeConsistency(codeSamples),
        recommendations: []
      };

      analysis.recommendations = await this.generateStyleRecommendations(analysis);
      
      console.log(`✅ Code style analysis completed for: ${projectRoot}`);
      return analysis;
      
    } catch (error) {
      console.error(`❌ Error analyzing code style: ${error.message}`);
      return {
        formatting: {},
        naming: {},
        structure: {},
        comments: {},
        config: {},
        consistency: {},
        recommendations: []
      };
    }
  }

  /**
   * Detect style configuration files
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Style configuration analysis
   */
  async detectStyleConfiguration(projectRoot) {
    const configs = {};
    
    for (const [tool, configFile] of Object.entries(this.styleConfigs)) {
      const configPath = path.join(projectRoot, configFile);
      
      if (await fileUtils.fileExists(configPath)) {
        try {
          const content = await fileUtils.readFile(configPath);
          configs[tool] = {
            exists: true,
            path: configPath,
            content: this.parseConfigContent(content, tool)
          };
        } catch (error) {
          configs[tool] = {
            exists: true,
            path: configPath,
            error: error.message
          };
        }
      } else {
        configs[tool] = { exists: false };
      }
    }

    // Check package.json for style configurations
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (await fileUtils.fileExists(packageJsonPath)) {
        const packageContent = await fileUtils.readFile(packageJsonPath);
        const packageData = JSON.parse(packageContent);
        
        if (packageData.prettier) {
          configs.prettier = {
            exists: true,
            path: 'package.json',
            content: packageData.prettier
          };
        }
        
        if (packageData.eslintConfig) {
          configs.eslint = {
            exists: true,
            path: 'package.json',
            content: packageData.eslintConfig
          };
        }
      }
    } catch (error) {
      console.error(`Error reading package.json: ${error.message}`);
    }

    return configs;
  }

  /**
   * Extract code samples for analysis
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Array>} Code samples with metadata
   */
  async extractCodeSamples(projectRoot) {
    const samples = [];
    
    try {
      const jsFiles = await fileUtils.getFilesByExtension(projectRoot, ['.js', '.jsx', '.ts', '.tsx']);
      
      // Limit to first 20 files for performance
      const filesToAnalyze = jsFiles.slice(0, 20);
      
      for (const file of filesToAnalyze) {
        try {
          const content = await fileUtils.readFile(file);
          const stats = await fileUtils.getFileStats(file);
          
          samples.push({
            file,
            content,
            size: content.length,
            lines: content.split('\n').length,
            extension: path.extname(file),
            lastModified: stats.mtime
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

  /**
   * Analyze code formatting
   * @param {Array} codeSamples - Code samples to analyze
   * @param {Object} styleConfig - Style configuration
   * @returns {Promise<Object>} Formatting analysis
   */
  async analyzeFormatting(codeSamples, styleConfig) {
    const analysis = {
      indentation: this.analyzeIndentation(codeSamples),
      lineLength: this.analyzeLineLength(codeSamples),
      spacing: this.analyzeSpacing(codeSamples),
      quotes: this.analyzeQuotes(codeSamples),
      semicolons: this.analyzeSemicolons(codeSamples),
      trailingCommas: this.analyzeTrailingCommas(codeSamples),
      config: styleConfig
    };

    return analysis;
  }

  /**
   * Analyze naming conventions
   * @param {Array} codeSamples - Code samples to analyze
   * @returns {Promise<Object>} Naming convention analysis
   */
  async analyzeNamingConventions(codeSamples) {
    const analysis = {
      variables: this.analyzeVariableNaming(codeSamples),
      functions: this.analyzeFunctionNaming(codeSamples),
      classes: this.analyzeClassNaming(codeSamples),
      constants: this.analyzeConstantNaming(codeSamples),
      files: this.analyzeFileNaming(codeSamples),
      consistency: this.analyzeNamingConsistency(codeSamples)
    };

    return analysis;
  }

  /**
   * Analyze code structure
   * @param {Array} codeSamples - Code samples to analyze
   * @returns {Promise<Object>} Code structure analysis
   */
  async analyzeCodeStructure(codeSamples) {
    const analysis = {
      imports: this.analyzeImportStructure(codeSamples),
      exports: this.analyzeExportStructure(codeSamples),
      functions: this.analyzeFunctionStructure(codeSamples),
      classes: this.analyzeClassStructure(codeSamples),
      organization: this.analyzeCodeOrganization(codeSamples)
    };

    return analysis;
  }

  /**
   * Analyze comment style
   * @param {Array} codeSamples - Code samples to analyze
   * @returns {Promise<Object>} Comment style analysis
   */
  async analyzeCommentStyle(codeSamples) {
    const analysis = {
      frequency: this.analyzeCommentFrequency(codeSamples),
      style: this.analyzeCommentStyle(codeSamples),
      documentation: this.analyzeDocumentationComments(codeSamples),
      quality: this.analyzeCommentQuality(codeSamples)
    };

    return analysis;
  }

  /**
   * Analyze code consistency
   * @param {Array} codeSamples - Code samples to analyze
   * @returns {Promise<Object>} Consistency analysis
   */
  async analyzeConsistency(codeSamples) {
    const analysis = {
      formatting: this.analyzeFormattingConsistency(codeSamples),
      naming: this.analyzeNamingConsistency(codeSamples),
      structure: this.analyzeStructureConsistency(codeSamples),
      overall: this.calculateOverallConsistency(codeSamples)
    };

    return analysis;
  }

  // Private methods for formatting analysis

  analyzeIndentation(codeSamples) {
    const indentations = { tabs: 0, spaces: 0, mixed: 0 };
    const spaceCounts = { 2: 0, 4: 0, 8: 0, other: 0 };
    
    for (const sample of codeSamples) {
      const lines = sample.content.split('\n');
      let hasTabs = false;
      let hasSpaces = false;
      const spaceCountsInFile = {};
      
      for (const line of lines) {
        if (line.startsWith('\t')) {
          hasTabs = true;
        } else if (line.startsWith(' ')) {
          hasSpaces = true;
          const spaceCount = line.match(/^ +/)?.[0].length || 0;
          spaceCountsInFile[spaceCount] = (spaceCountsInFile[spaceCount] || 0) + 1;
        }
      }
      
      if (hasTabs && hasSpaces) {
        indentations.mixed++;
      } else if (hasTabs) {
        indentations.tabs++;
      } else if (hasSpaces) {
        indentations.spaces++;
        const mostCommon = Object.entries(spaceCountsInFile)
          .sort(([,a], [,b]) => b - a)[0]?.[0];
        if (mostCommon) {
          spaceCounts[mostCommon] = (spaceCounts[mostCommon] || 0) + 1;
        }
      }
    }
    
    return { type: indentations, spaceCounts };
  }

  analyzeLineLength(codeSamples) {
    const lengths = [];
    
    for (const sample of codeSamples) {
      const lines = sample.content.split('\n');
      for (const line of lines) {
        lengths.push(line.length);
      }
    }
    
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const maxLength = Math.max(...lengths);
    const longLines = lengths.filter(l => l > 100).length;
    
    return {
      average: Math.round(avgLength),
      maximum: maxLength,
      longLines: longLines,
      longLinePercentage: Math.round((longLines / lengths.length) * 100)
    };
  }

  analyzeSpacing(codeSamples) {
    const spacing = {
      operators: { with: 0, without: 0 },
      commas: { with: 0, without: 0 },
      brackets: { with: 0, without: 0 }
    };
    
    for (const sample of codeSamples) {
      const content = sample.content;
      
      // Operator spacing
      if (content.includes('a + b') || content.includes('a - b')) {
        spacing.operators.with++;
      }
      if (content.includes('a+b') || content.includes('a-b')) {
        spacing.operators.without++;
      }
      
      // Comma spacing
      if (content.includes('a, b') || content.includes('a , b')) {
        spacing.commas.with++;
      }
      if (content.includes('a,b')) {
        spacing.commas.without++;
      }
      
      // Bracket spacing
      if (content.includes('{ }') || content.includes('{  }')) {
        spacing.brackets.with++;
      }
      if (content.includes('{}')) {
        spacing.brackets.without++;
      }
    }
    
    return spacing;
  }

  analyzeQuotes(codeSamples) {
    const quotes = { single: 0, double: 0, backtick: 0 };
    
    for (const sample of codeSamples) {
      const content = sample.content;
      quotes.single += (content.match(/'/g) || []).length;
      quotes.double += (content.match(/"/g) || []).length;
      quotes.backtick += (content.match(/`/g) || []).length;
    }
    
    return quotes;
  }

  analyzeSemicolons(codeSamples) {
    const semicolons = { with: 0, without: 0 };
    
    for (const sample of codeSamples) {
      const lines = sample.content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
          if (trimmed.endsWith(';')) {
            semicolons.with++;
          } else if (trimmed.endsWith('}') || trimmed.endsWith('{') || trimmed.endsWith(')')) {
            semicolons.without++;
          }
        }
      }
    }
    
    return semicolons;
  }

  analyzeTrailingCommas(codeSamples) {
    const trailingCommas = { with: 0, without: 0 };
    
    for (const sample of codeSamples) {
      const lines = sample.content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes(',') && (trimmed.includes('[') || trimmed.includes('{'))) {
          if (trimmed.endsWith(',')) {
            trailingCommas.with++;
          } else {
            trailingCommas.without++;
          }
        }
      }
    }
    
    return trailingCommas;
  }

  // Private methods for naming analysis

  analyzeVariableNaming(codeSamples) {
    const patterns = {
      camelCase: 0,
      snake_case: 0,
      PascalCase: 0,
      kebab-case: 0,
      other: 0
    };
    
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
        } else if (variable.includes('-')) {
          patterns['kebab-case']++;
        } else {
          patterns.other++;
        }
      }
    }
    
    return patterns;
  }

  analyzeFunctionNaming(codeSamples) {
    const patterns = {
      camelCase: 0,
      snake_case: 0,
      PascalCase: 0,
      other: 0
    };
    
    for (const sample of codeSamples) {
      const functionMatches = sample.content.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
      
      for (const match of functionMatches) {
        const funcName = match.split(/\s+/)[1];
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
    const patterns = {
      PascalCase: 0,
      camelCase: 0,
      other: 0
    };
    
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
    const patterns = {
      UPPER_SNAKE_CASE: 0,
      camelCase: 0,
      other: 0
    };
    
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
    const patterns = {
      camelCase: 0,
      PascalCase: 0,
      kebab-case: 0,
      snake_case: 0,
      other: 0
    };
    
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

  analyzeNamingConsistency(codeSamples) {
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

  // Additional analysis methods would be implemented here...

  parseConfigContent(content, tool) {
    try {
      if (tool === 'prettier' || tool === 'eslint' || tool === 'stylelint') {
        return JSON.parse(content);
      }
      return content;
    } catch (error) {
      return { error: error.message };
    }
  }

  async generateStyleRecommendations(analysis) {
    const recommendations = [];
    
    // Formatting recommendations
    if (analysis.formatting.indentation.type.mixed > 0) {
      recommendations.push({
        type: 'formatting',
        priority: 'high',
        message: 'Mixed indentation detected',
        suggestion: 'Use consistent indentation (spaces or tabs) throughout the project'
      });
    }
    
    if (analysis.formatting.lineLength.longLinePercentage > 20) {
      recommendations.push({
        type: 'formatting',
        priority: 'medium',
        message: 'Many long lines detected',
        suggestion: 'Consider breaking long lines for better readability'
      });
    }
    
    // Naming recommendations
    if (analysis.naming.consistency.overall < 0.8) {
      recommendations.push({
        type: 'naming',
        priority: 'medium',
        message: 'Inconsistent naming conventions',
        suggestion: 'Establish and follow consistent naming conventions'
      });
    }
    
    return recommendations;
  }

  // Placeholder methods for additional analysis
  analyzeImportStructure(codeSamples) { return {}; }
  analyzeExportStructure(codeSamples) { return {}; }
  analyzeFunctionStructure(codeSamples) { return {}; }
  analyzeClassStructure(codeSamples) { return {}; }
  analyzeCodeOrganization(codeSamples) { return {}; }
  analyzeCommentFrequency(codeSamples) { return {}; }
  analyzeCommentStyle(codeSamples) { return {}; }
  analyzeDocumentationComments(codeSamples) { return {}; }
  analyzeCommentQuality(codeSamples) { return {}; }
  analyzeFormattingConsistency(codeSamples) { return {}; }
  analyzeStructureConsistency(codeSamples) { return {}; }
  calculateOverallConsistency(codeSamples) { return 0; }
}
