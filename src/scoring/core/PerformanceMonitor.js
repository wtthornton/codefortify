/**
 * Performance Monitor
 * 
 * Comprehensive performance monitoring for the Context7 scoring system
 * including bundle analysis, memory usage, timing metrics, and bottleneck detection.
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Performance metrics collection and analysis
 */
export class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      enableBundleAnalysis: config.enableBundleAnalysis !== false,
      enableMemoryTracking: config.enableMemoryTracking !== false,
      verbose: config.verbose || false,
      ...config
    };

    this.metrics = {
      timing: new Map(),
      memory: [],
      bundleInfo: {},
      dependencies: {},
      performance: {
        startTime: performance.now(),
        operations: []
      }
    };

    this.startMemoryTracking();
  }

  /**
   * Start tracking memory usage
   */
  startMemoryTracking() {
    if (!this.config.enableMemoryTracking) return;

    const initialMemory = process.memoryUsage();
    this.metrics.memory.push({
      timestamp: Date.now(),
      type: 'initial',
      ...initialMemory
    });

    // Track memory every 5 seconds during analysis
    this.memoryInterval = setInterval(() => {
      this.recordMemoryUsage('periodic');
    }, 5000);
  }

  /**
   * Record current memory usage
   */
  recordMemoryUsage(type = 'checkpoint') {
    if (!this.config.enableMemoryTracking) return;

    const memory = process.memoryUsage();
    this.metrics.memory.push({
      timestamp: Date.now(),
      type,
      ...memory
    });

    if (this.config.verbose) {
      const heapMB = Math.round(memory.heapUsed / 1024 / 1024);
      console.log(`Memory [${type}]: ${heapMB}MB heap used`);
    }
  }

  /**
   * Start timing an operation
   */
  startTiming(operationName) {
    const startTime = performance.now();
    this.metrics.timing.set(operationName, {
      startTime,
      status: 'running'
    });

    return {
      name: operationName,
      startTime
    };
  }

  /**
   * End timing an operation
   */
  endTiming(operationName, metadata = {}) {
    const endTime = performance.now();
    const timing = this.metrics.timing.get(operationName);

    if (!timing) {
      console.warn(`Timing for operation '${operationName}' was not started`);
      return null;
    }

    const duration = endTime - timing.startTime;
    timing.endTime = endTime;
    timing.duration = duration;
    timing.status = 'completed';
    timing.metadata = metadata;

    this.metrics.performance.operations.push({
      name: operationName,
      duration,
      timestamp: endTime,
      ...metadata
    });

    if (this.config.verbose) {
      console.log(`⏱️  ${operationName}: ${Math.round(duration)}ms`);
    }

    return timing;
  }

  /**
   * Analyze bundle size and composition
   */
  async analyzeBundleSize() {
    if (!this.config.enableBundleAnalysis) {
      return { available: false, reason: 'Bundle analysis disabled' };
    }

    try {
      const bundleInfo = {
        packageJson: await this.analyzePackageJson(),
        nodeModules: await this.analyzeNodeModules(),
        sourceFiles: await this.analyzeSourceFiles(),
        buildOutput: await this.analyzeBuildOutput()
      };

      // Calculate total project size
      bundleInfo.totalSize = this.calculateTotalSize(bundleInfo);
      bundleInfo.analysis = this.generateBundleAnalysis(bundleInfo);

      this.metrics.bundleInfo = bundleInfo;
      return bundleInfo;

    } catch (error) {
      return {
        available: false,
        error: error.message,
        reason: 'Bundle analysis failed'
      };
    }
  }

  /**
   * Analyze package.json dependencies
   */
  async analyzePackageJson() {
    const packagePath = path.join(this.config.projectRoot, 'package.json');
    
    if (!existsSync(packagePath)) {
      return { exists: false };
    }

    try {
      const content = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(content);

      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      const peerDeps = packageJson.peerDependencies || {};

      return {
        exists: true,
        dependencies: {
          production: Object.keys(deps).length,
          development: Object.keys(devDeps).length,
          peer: Object.keys(peerDeps).length,
          total: Object.keys(deps).length + Object.keys(devDeps).length + Object.keys(peerDeps).length
        },
        details: {
          deps,
          devDeps,
          peerDeps
        },
        heavyDependencies: this.identifyHeavyDependencies(deps, devDeps)
      };

    } catch (error) {
      return {
        exists: true,
        error: error.message,
        parseable: false
      };
    }
  }

  /**
   * Analyze node_modules size and structure
   */
  async analyzeNodeModules() {
    const nodeModulesPath = path.join(this.config.projectRoot, 'node_modules');
    
    if (!existsSync(nodeModulesPath)) {
      return { exists: false, size: 0 };
    }

    try {
      // Use du command to get directory size (cross-platform alternative)
      const sizeInfo = await this.getDirectorySize(nodeModulesPath);
      const topLevelPackages = await this.getTopLevelPackages(nodeModulesPath);

      return {
        exists: true,
        size: sizeInfo,
        packages: topLevelPackages,
        heaviestPackages: await this.findHeaviestPackages(nodeModulesPath, 5)
      };

    } catch (error) {
      return {
        exists: true,
        error: error.message,
        accessible: false
      };
    }
  }

  /**
   * Analyze source code files
   */
  async analyzeSourceFiles() {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];

    try {
      const files = await this.findFiles(this.config.projectRoot, extensions, excludeDirs);
      const analysis = {
        count: files.length,
        totalSize: 0,
        breakdown: {},
        largestFiles: []
      };

      // Analyze each file
      for (const file of files.slice(0, 100)) { // Limit to prevent performance issues
        try {
          const stats = await fs.stat(file);
          const ext = path.extname(file);
          
          analysis.totalSize += stats.size;
          analysis.breakdown[ext] = analysis.breakdown[ext] || { count: 0, size: 0 };
          analysis.breakdown[ext].count++;
          analysis.breakdown[ext].size += stats.size;

          analysis.largestFiles.push({
            path: path.relative(this.config.projectRoot, file),
            size: stats.size,
            ext
          });

        } catch (error) {
          // Skip files that can't be accessed
          continue;
        }
      }

      // Sort largest files
      analysis.largestFiles = analysis.largestFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);

      return analysis;

    } catch (error) {
      return {
        error: error.message,
        accessible: false
      };
    }
  }

  /**
   * Analyze build output if available
   */
  async analyzeBuildOutput() {
    const buildDirs = ['dist', 'build', 'out', '.next', 'public'];
    const analysis = {
      available: false,
      directories: []
    };

    for (const dir of buildDirs) {
      const buildPath = path.join(this.config.projectRoot, dir);
      
      if (existsSync(buildPath)) {
        try {
          const size = await this.getDirectorySize(buildPath);
          const files = await this.findFiles(buildPath, ['.js', '.css', '.html', '.map']);
          
          analysis.directories.push({
            name: dir,
            size,
            fileCount: files.length,
            types: await this.analyzeFileTypes(files)
          });
          
          analysis.available = true;

        } catch (error) {
          analysis.directories.push({
            name: dir,
            error: error.message
          });
        }
      }
    }

    return analysis;
  }

  /**
   * Identify heavy dependencies that impact bundle size
   */
  identifyHeavyDependencies(deps, devDeps) {
    const knownHeavy = [
      // Frontend frameworks and libraries
      'react', 'vue', 'angular', '@angular/core', 'rxjs',
      // Build tools
      'webpack', 'rollup', 'parcel', 'vite',
      // UI libraries  
      '@mui/material', 'antd', 'bootstrap', 'semantic-ui-react',
      // Utility libraries
      'lodash', 'moment', 'date-fns', 'axios', 'request',
      // Development tools
      'typescript', 'babel', '@babel/core', 'jest', 'cypress'
    ];

    const allDeps = { ...deps, ...devDeps };
    const heavy = [];

    for (const dep of Object.keys(allDeps)) {
      if (knownHeavy.some(heavy => dep.includes(heavy))) {
        heavy.push({
          name: dep,
          version: allDeps[dep],
          category: this.categorizeDependency(dep)
        });
      }
    }

    return heavy;
  }

  /**
   * Categorize dependency by type
   */
  categorizeDependency(depName) {
    const categories = {
      'framework': ['react', 'vue', 'angular', 'svelte'],
      'build': ['webpack', 'rollup', 'parcel', 'vite', 'babel'],
      'ui': ['mui', 'antd', 'bootstrap', 'semantic'],
      'utility': ['lodash', 'moment', 'axios', 'request'],
      'testing': ['jest', 'cypress', 'vitest', 'testing-library'],
      'typescript': ['typescript', '@types'],
      'other': []
    };

    for (const [category, patterns] of Object.entries(categories)) {
      if (patterns.some(pattern => depName.toLowerCase().includes(pattern))) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Get top-level packages in node_modules
   */
  async getTopLevelPackages(nodeModulesPath) {
    try {
      const items = await fs.readdir(nodeModulesPath, { withFileTypes: true });
      return items
        .filter(item => item.isDirectory() && !item.name.startsWith('.'))
        .map(item => item.name)
        .slice(0, 50); // Limit for performance
    } catch (error) {
      return [];
    }
  }

  /**
   * Find heaviest packages in node_modules
   */
  async findHeaviestPackages(nodeModulesPath, limit = 5) {
    const packages = [];
    
    try {
      const items = await fs.readdir(nodeModulesPath, { withFileTypes: true });
      
      for (const item of items.slice(0, 20)) { // Limit for performance
        if (item.isDirectory() && !item.name.startsWith('.')) {
          const packagePath = path.join(nodeModulesPath, item.name);
          const size = await this.calculateDirectorySizeManually(packagePath);
          packages.push({ name: item.name, size });
        }
      }
    } catch (error) {
      // Return empty array on error
    }
    
    return packages
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  /**
   * Analyze file types in a list of files
   */
  async analyzeFileTypes(files) {
    const types = {};
    
    for (const file of files) {
      const ext = path.extname(file);
      types[ext] = types[ext] || { count: 0, totalSize: 0 };
      types[ext].count++;
      
      try {
        const stats = await fs.stat(file);
        types[ext].totalSize += stats.size;
      } catch (error) {
        // Skip files that can't be accessed
      }
    }
    
    return types;
  }

  /**
   * Calculate total size from bundle info
   */
  calculateTotalSize(bundleInfo) {
    let total = 0;
    
    if (bundleInfo.sourceFiles?.totalSize) {
      total += bundleInfo.sourceFiles.totalSize;
    }
    
    if (bundleInfo.nodeModules?.size) {
      total += bundleInfo.nodeModules.size;
    }
    
    return total;
  }

  /**
   * Generate bundle analysis insights
   */
  generateBundleAnalysis(bundleInfo) {
    const analysis = {
      recommendations: [],
      warnings: [],
      insights: []
    };

    // Check for heavy dependencies
    if (bundleInfo.packageJson?.heavyDependencies?.length > 0) {
      analysis.warnings.push('Heavy dependencies detected that may impact bundle size');
      analysis.recommendations.push('Consider lighter alternatives for heavy dependencies');
    }

    // Check node_modules size
    if (bundleInfo.nodeModules?.size > 500 * 1024 * 1024) { // 500MB
      analysis.warnings.push('Very large node_modules directory detected');
      analysis.recommendations.push('Review and remove unused dependencies');
    }

    // Check for large source files
    if (bundleInfo.sourceFiles?.largestFiles?.some(f => f.size > 100 * 1024)) { // 100KB
      analysis.warnings.push('Large source files detected');
      analysis.recommendations.push('Consider code splitting for large files');
    }

    return analysis;
  }

  /**
   * Get directory size (cross-platform)
   */
  async getDirectorySize(dirPath) {
    try {
      // Try different approaches based on platform
      let command;
      
      if (process.platform === 'win32') {
        command = `powershell -command "Get-ChildItem -Recurse '${dirPath}' | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum"`;
      } else {
        command = `du -sb "${dirPath}" | cut -f1`;
      }

      const { stdout } = await execAsync(command, { timeout: 30000 });
      return parseInt(stdout.trim()) || 0;

    } catch (error) {
      // Fallback: manual calculation (slower but works everywhere)
      return await this.calculateDirectorySizeManually(dirPath);
    }
  }

  /**
   * Manual directory size calculation (fallback)
   */
  async calculateDirectorySizeManually(dirPath) {
    let totalSize = 0;
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          totalSize += await this.calculateDirectorySizeManually(fullPath);
        } else if (item.isFile()) {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
    
    return totalSize;
  }

  /**
   * Find files with specific extensions
   */
  async findFiles(dirPath, extensions, excludeDirs = []) {
    const files = [];
    
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory() && !excludeDirs.includes(item.name)) {
          const subFiles = await this.findFiles(fullPath, extensions, excludeDirs);
          files.push(...subFiles);
        } else if (item.isFile()) {
          const ext = path.extname(item.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
    
    return files;
  }

  /**
   * Generate performance summary
   */
  generatePerformanceSummary() {
    const now = performance.now();
    const totalDuration = now - this.metrics.performance.startTime;
    
    // Stop memory tracking
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.recordMemoryUsage('final');
    }

    const operations = this.metrics.performance.operations;
    const slowestOperations = [...operations]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const memoryPeak = this.metrics.memory.length > 0
      ? Math.max(...this.metrics.memory.map(m => m.heapUsed))
      : 0;

    const summary = {
      totalDuration: Math.round(totalDuration),
      operationCount: operations.length,
      slowestOperations: slowestOperations.map(op => ({
        name: op.name,
        duration: Math.round(op.duration),
        percentage: Math.round((op.duration / totalDuration) * 100)
      })),
      memory: {
        peak: Math.round(memoryPeak / 1024 / 1024), // MB
        samples: this.metrics.memory.length
      },
      bundle: this.metrics.bundleInfo.totalSize ? {
        sourceSize: this.formatBytes(this.metrics.bundleInfo.sourceFiles?.totalSize || 0),
        nodeModulesSize: this.formatBytes(this.metrics.bundleInfo.nodeModules?.size || 0),
        totalPackages: this.metrics.bundleInfo.packageJson?.dependencies?.total || 0
      } : null
    };

    return summary;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
  }
}