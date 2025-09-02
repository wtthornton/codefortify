/**
 * File Size Analyzer - Prevents large file anti-patterns
 * 
 * Analyzes file sizes and complexity to prevent maintenance issues
 * Key thresholds based on industry best practices:
 * - 300+ lines: Warning (should consider splitting)
 * - 500+ lines: Major issue (requires refactoring)  
 * - 1000+ lines: Critical issue (immediate attention)
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';
import fs from 'fs/promises';
import path from 'path';

export class FileSizeAnalyzer extends BaseAnalyzer {
  constructor(config = {}) {
    super(config);
    this.categoryName = 'File Size & Complexity';
    this.maxScore = 5; // Part of Structure score
    
    // Configurable thresholds
    this.thresholds = {
      warning: config.fileSizeWarning || 300,    // Lines
      major: config.fileSizeMajor || 500,        // Lines  
      critical: config.fileSizeCritical || 1000, // Lines
      methodLimit: config.methodLimit || 15,     // Methods per class
      classLimit: config.classLimit || 3        // Classes per file
    };
  }

  async analyze(projectRoot) {
    try {
      this.projectRoot = projectRoot;
      const files = await this.getSourceFiles(projectRoot);
      const sizeAnalysis = await this.analyzeSizes(files);
      const complexityAnalysis = await this.analyzeComplexity(files);
      
      this.scoreFileSize(sizeAnalysis);
      this.scoreFileComplexity(complexityAnalysis);
      this.generateRefactoringRecommendations(sizeAnalysis, complexityAnalysis);
      
      return this.getResults();
    } catch (error) {
      this.addIssue(`File size analysis failed: ${error.message}`);
      return this.getResults();
    }
  }

  async getSourceFiles(projectRoot) {
    const extensions = ['.js', '.ts', '.jsx', '.tsx'];
    const files = [];
    
    const scanDirectory = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };
    
    await scanDirectory(projectRoot);
    return files;
  }

  shouldSkipDirectory(dirName) {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  async analyzeSizes(files) {
    const analysis = {
      totalFiles: files.length,
      warningFiles: [],
      majorFiles: [],
      criticalFiles: [],
      averageSize: 0,
      largestFiles: []
    };

    const fileSizes = [];

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const size = { path: filePath, lines, content };
        
        fileSizes.push(size);

        // Categorize by severity
        if (lines >= this.thresholds.critical) {
          analysis.criticalFiles.push(size);
        } else if (lines >= this.thresholds.major) {
          analysis.majorFiles.push(size);
        } else if (lines >= this.thresholds.warning) {
          analysis.warningFiles.push(size);
        }
      } catch (error) {
        // Skip unreadable files
      }
    }

    // Calculate statistics
    analysis.averageSize = fileSizes.reduce((sum, f) => sum + f.lines, 0) / fileSizes.length;
    analysis.largestFiles = fileSizes
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10)
      .map(f => ({ path: path.basename(f.path), lines: f.lines }));

    return analysis;
  }

  async analyzeComplexity(files) {
    const analysis = {
      highMethodCountFiles: [],
      multiClassFiles: [],
      complexPatterns: []
    };

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const complexity = this.analyzeFileComplexity(content, filePath);
        
        if (complexity.methodCount > this.thresholds.methodLimit) {
          analysis.highMethodCountFiles.push({
            path: path.basename(filePath),
            methods: complexity.methodCount,
            lines: content.split('\n').length
          });
        }

        if (complexity.classCount > this.thresholds.classLimit) {
          analysis.multiClassFiles.push({
            path: path.basename(filePath), 
            classes: complexity.classCount,
            lines: content.split('\n').length
          });
        }

        // Detect specific anti-patterns
        analysis.complexPatterns.push(...complexity.patterns);

      } catch (error) {
        // Skip unreadable files
      }
    }

    return analysis;
  }

  analyzeFileComplexity(content, filePath) {
    const complexity = {
      methodCount: 0,
      classCount: 0,
      patterns: []
    };

    // Count methods (functions and class methods)
    const methodMatches = content.match(/(?:async\s+)?(?:function\s+\w+|\w+\s*\([^)]*\)\s*\{|(?:async\s+)?\w+\s*\([^)]*\)\s*(?:=>|{))/g);
    complexity.methodCount = methodMatches ? methodMatches.length : 0;

    // Count classes
    const classMatches = content.match(/class\s+\w+/g);
    complexity.classCount = classMatches ? classMatches.length : 0;

    // Detect specific anti-patterns
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Command Coordinator anti-pattern
    if (fileName.includes('Coordinator') || fileName.includes('Manager')) {
      const executeMatches = content.match(/execute\w+\s*\(/g);
      if (executeMatches && executeMatches.length > 10) {
        complexity.patterns.push({
          type: 'command-coordinator-antipattern',
          file: path.basename(filePath),
          severity: 'major',
          description: `File has ${executeMatches.length} execute methods - consider command pattern refactoring`,
          suggestion: 'Split into separate command classes using proper Command pattern'
        });
      }
    }

    // Large class anti-pattern
    if (complexity.classCount === 1 && complexity.methodCount > 20) {
      complexity.patterns.push({
        type: 'god-class-antipattern',
        file: path.basename(filePath),
        severity: 'major', 
        description: `Single class with ${complexity.methodCount} methods`,
        suggestion: 'Extract related methods into separate classes or mixins'
      });
    }

    // Duplicate comment patterns
    const duplicateComments = content.match(/\/\*\*[\s\*]*\w+\s+class\s+implementation[\s\*]*\*\//g);
    if (duplicateComments && duplicateComments.length > 2) {
      complexity.patterns.push({
        type: 'duplicate-documentation',
        file: path.basename(filePath),
        severity: 'minor',
        description: `${duplicateComments.length} duplicate JSDoc comment blocks`,
        suggestion: 'Remove duplicate documentation and use proper JSDoc standards'
      });
    }

    return complexity;
  }

  scoreFileSize(analysis) {
    let sizeScore = 5;
    
    // Deduct points based on problem files
    const totalProblems = analysis.criticalFiles.length + analysis.majorFiles.length;
    const problemRatio = totalProblems / analysis.totalFiles;
    
    if (analysis.criticalFiles.length > 0) {
      sizeScore -= 3; // Major penalty for critical files
      this.addIssue(`${analysis.criticalFiles.length} files exceed ${this.thresholds.critical} lines`);
    }
    
    if (analysis.majorFiles.length > 0) {
      sizeScore -= Math.min(2, analysis.majorFiles.length * 0.5);
      this.addIssue(`${analysis.majorFiles.length} files exceed ${this.thresholds.major} lines`);
    }

    if (analysis.warningFiles.length > 0) {
      sizeScore -= Math.min(1, analysis.warningFiles.length * 0.1);
      this.addIssue(`${analysis.warningFiles.length} files exceed ${this.thresholds.warning} lines`);
    }

    this.addScore(Math.max(0, sizeScore), 5, 'File Size Management');
    this.setDetail('averageFileSize', Math.round(analysis.averageSize));
    this.setDetail('largestFiles', analysis.largestFiles);
  }

  scoreFileComplexity(analysis) {
    let complexityScore = 0; // This adds to the structure score
    
    // Penalty for high method count files
    if (analysis.highMethodCountFiles.length > 0) {
      this.addIssue(`${analysis.highMethodCountFiles.length} files have excessive methods (>${this.thresholds.methodLimit})`);
    }

    // Penalty for multiple class files  
    if (analysis.multiClassFiles.length > 0) {
      this.addIssue(`${analysis.multiClassFiles.length} files contain multiple classes`);
    }

    // Handle detected anti-patterns
    for (const pattern of analysis.complexPatterns) {
      this.addIssue(pattern.description, pattern.suggestion);
    }

    this.setDetail('highMethodCountFiles', analysis.highMethodCountFiles.length);
    this.setDetail('complexityPatterns', analysis.complexPatterns.length);
  }

  generateRefactoringRecommendations(sizeAnalysis, complexityAnalysis) {
    const recommendations = [];

    // Size-based recommendations
    for (const file of sizeAnalysis.criticalFiles) {
      recommendations.push({
        type: 'file-splitting',
        priority: 'high',
        file: path.basename(file.path),
        lines: file.lines,
        suggestion: `Split ${path.basename(file.path)} (${file.lines} lines) into smaller modules`,
        estimatedEffort: 'high'
      });
    }

    // Pattern-based recommendations
    for (const pattern of complexityAnalysis.complexPatterns) {
      if (pattern.type === 'command-coordinator-antipattern') {
        recommendations.push({
          type: 'command-pattern-refactor',
          priority: 'high',
          file: pattern.file,
          suggestion: pattern.suggestion,
          estimatedEffort: 'medium'
        });
      }
    }

    this.addSuggestion({
      category: 'File Size Management',
      recommendations: recommendations.slice(0, 5) // Limit to top 5
    });
  }
}