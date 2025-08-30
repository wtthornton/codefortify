/**
 * ProjectScorer - Main scoring orchestrator for Context7 projects
 * 
 * Evaluates project quality across 7 categories with weighted scoring:
 * - Code Structure & Architecture (20pts)
 * - Code Quality & Maintainability (20pts) 
 * - Performance & Optimization (15pts)
 * - Testing & Documentation (15pts)
 * - Error Handling & Security (15pts)
 * - Developer Experience & Tooling (10pts)
 * - Completeness & Production Readiness (5pts)
 * Total: 100pts
 */

import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { StructureAnalyzer } from './analyzers/StructureAnalyzer.js';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer.js';
import { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer.js';
import { TestingAnalyzer } from './analyzers/TestingAnalyzer.js';
import { SecurityAnalyzer } from './analyzers/SecurityAnalyzer.js';
import { DeveloperExperienceAnalyzer } from './analyzers/DeveloperExperienceAnalyzer.js';
import { CompletenessAnalyzer } from './analyzers/CompletenessAnalyzer.js';
import { ScoringReport } from './ScoringReport.js';
import { RecommendationEngine } from './RecommendationEngine.js';

export class ProjectScorer {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      projectType: config.projectType || 'javascript',
      projectName: config.projectName || path.basename(config.projectRoot || process.cwd()),
      verbose: config.verbose || false,
      categories: config.categories || ['all'],
      ...config
    };

    // QUICK WIN: Smart project type detection if not specified
    if (!config.projectType || config.projectType === 'javascript') {
      this.config.projectType = this.detectProjectType();
    }

    this.analyzers = this.initializeAnalyzers();
    this.reportGenerator = new ScoringReport(this.config);
    this.recommendationEngine = new RecommendationEngine(this.config);
    
    this.results = {
      categories: {},
      overall: {
        score: 0,
        maxScore: 100,
        grade: 'F',
        timestamp: new Date().toISOString()
      },
      metadata: {
        projectRoot: this.config.projectRoot,
        projectType: this.config.projectType,
        projectName: this.config.projectName,
        version: '1.0.0'
      }
    };
  }

  initializeAnalyzers() {
    const baseConfig = {
      projectRoot: this.config.projectRoot,
      projectType: this.config.projectType,
      verbose: this.config.verbose
    };

    return {
      structure: new StructureAnalyzer({ ...baseConfig, maxScore: 20 }),
      quality: new QualityAnalyzer({ ...baseConfig, maxScore: 20 }),
      performance: new PerformanceAnalyzer({ ...baseConfig, maxScore: 15 }),
      testing: new TestingAnalyzer({ ...baseConfig, maxScore: 15 }),
      security: new SecurityAnalyzer({ ...baseConfig, maxScore: 15 }),
      developerExperience: new DeveloperExperienceAnalyzer({ ...baseConfig, maxScore: 10 }),
      completeness: new CompletenessAnalyzer({ ...baseConfig, maxScore: 5 })
    };
  }

  async scoreProject(options = {}) {
    const {
      categories = ['all'],
      skipCache = false,
      detailed = false
    } = options;

    try {
      console.log(`🎯 Analyzing ${this.config.projectName} project quality...`);
      console.log('══════════════════════════════════════════════════════════');

      // Check tool availability and provide guidance
      await this.checkToolAvailability();

      // Determine which categories to analyze
      const categoriesToAnalyze = categories.includes('all') 
        ? Object.keys(this.analyzers)
        : categories.filter(cat => this.analyzers[cat]);

      if (categoriesToAnalyze.length === 0) {
        throw new Error(`No valid categories specified. Available: ${Object.keys(this.analyzers).join(', ')}`);
      }

      // Run analysis for each category
      for (const categoryKey of categoriesToAnalyze) {
        const analyzer = this.analyzers[categoryKey];
        
        if (this.config.verbose) {
          console.log(`\n🔍 Analyzing ${analyzer.categoryName}...`);
        }

        try {
          const result = await analyzer.analyze();
          this.results.categories[categoryKey] = {
            ...result,
            weight: analyzer.maxScore,
            categoryName: analyzer.categoryName
          };

          if (this.config.verbose) {
            console.log(`   Score: ${result.score}/${analyzer.maxScore}`);
          }
        } catch (error) {
          console.error(`❌ Failed to analyze ${analyzer.categoryName}: ${error.message}`);
          
          // Add failed category with 0 score
          this.results.categories[categoryKey] = {
            score: 0,
            maxScore: analyzer.maxScore,
            grade: 'F',
            issues: [`Analysis failed: ${error.message}`],
            suggestions: ['Fix analysis errors to get proper scoring'],
            details: {},
            weight: analyzer.maxScore,
            categoryName: analyzer.categoryName,
            error: error.message
          };
        }
      }

      // Calculate overall score
      this.calculateOverallScore();

      // Generate recommendations
      const recommendations = await this.recommendationEngine.generateRecommendations(this.results);
      this.results.recommendations = recommendations;

      // Add detailed analysis if requested
      if (detailed) {
        this.results.detailed = await this.generateDetailedAnalysis();
      }

      console.log('\n✅ Analysis complete!');
      
      return this.results;

    } catch (error) {
      console.error(`💥 Project scoring failed: ${error.message}`);
      throw error;
    }
  }

  calculateOverallScore() {
    let totalScore = 0;
    let maxTotalScore = 0;
    let hasErrors = false;

    for (const [categoryKey, result] of Object.entries(this.results.categories)) {
      totalScore += result.score;
      maxTotalScore += result.maxScore;
      
      if (result.error) {
        hasErrors = true;
      }
    }

    this.results.overall = {
      score: Math.round(totalScore),
      maxScore: maxTotalScore,
      percentage: Math.round((totalScore / maxTotalScore) * 100),
      grade: this.calculateGrade(totalScore / maxTotalScore),
      hasErrors,
      timestamp: new Date().toISOString()
    };
  }

  calculateGrade(percentage) {
    if (percentage >= 0.97) return 'A+';
    if (percentage >= 0.93) return 'A';
    if (percentage >= 0.90) return 'A-';
    if (percentage >= 0.87) return 'B+';
    if (percentage >= 0.83) return 'B';
    if (percentage >= 0.80) return 'B-';
    if (percentage >= 0.77) return 'C+';
    if (percentage >= 0.73) return 'C';
    if (percentage >= 0.70) return 'C-';
    if (percentage >= 0.67) return 'D+';
    if (percentage >= 0.65) return 'D';
    if (percentage >= 0.60) return 'D-';
    return 'F';
  }

  async generateDetailedAnalysis() {
    return {
      fileStats: await this.getFileStatistics(),
      dependencyAnalysis: await this.analyzeDependencies(),
      projectMetrics: await this.calculateProjectMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  async getFileStatistics() {
    try {
      const stats = {
        totalFiles: 0,
        codeFiles: 0,
        testFiles: 0,
        configFiles: 0,
        totalLines: 0,
        languages: {}
      };

      const countFiles = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            // Skip node_modules, .git, etc.
            if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(file.name)) {
              continue;
            }
            await countFiles(fullPath);
          } else {
            stats.totalFiles++;
            
            const ext = path.extname(file.name);
            stats.languages[ext] = (stats.languages[ext] || 0) + 1;
            
            if (['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte'].includes(ext)) {
              stats.codeFiles++;
            } else if (['.test.js', '.spec.js', '.test.ts', '.spec.ts'].includes(ext) || file.name.includes('.test.') || file.name.includes('.spec.')) {
              stats.testFiles++;
            } else if (['.json', '.yml', '.yaml', '.config.js', '.config.ts'].includes(ext) || file.name.includes('config')) {
              stats.configFiles++;
            }
          }
        }
      };

      await countFiles(this.config.projectRoot);
      return stats;
      
    } catch (error) {
      return { error: error.message };
    }
  }

  async analyzeDependencies() {
    try {
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;
      
      return {
        production: Object.keys(deps).length,
        development: Object.keys(devDeps).length,
        total: totalDeps,
        hasLockfile: await this.checkLockfileExists(),
        frameworks: this.identifyFrameworks(deps, devDeps),
        testingTools: this.identifyTestingTools(deps, devDeps),
        buildTools: this.identifyBuildTools(deps, devDeps)
      };
      
    } catch (error) {
      return { error: error.message };
    }
  }

  async checkLockfileExists() {
    const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    
    for (const lockfile of lockfiles) {
      try {
        await fs.access(path.join(this.config.projectRoot, lockfile));
        return lockfile;
      } catch {
        continue;
      }
    }
    return false;
  }

  identifyFrameworks(deps, devDeps) {
    const allDeps = { ...deps, ...devDeps };
    const frameworks = [];
    
    if (allDeps.react) frameworks.push('React');
    if (allDeps.vue) frameworks.push('Vue');
    if (allDeps.svelte) frameworks.push('Svelte');
    if (allDeps.angular || allDeps['@angular/core']) frameworks.push('Angular');
    if (allDeps.next) frameworks.push('Next.js');
    if (allDeps.nuxt) frameworks.push('Nuxt.js');
    if (allDeps.express) frameworks.push('Express');
    if (allDeps.fastify) frameworks.push('Fastify');
    
    return frameworks;
  }

  identifyTestingTools(deps, devDeps) {
    const allDeps = { ...deps, ...devDeps };
    const tools = [];
    
    if (allDeps.vitest) tools.push('Vitest');
    if (allDeps.jest) tools.push('Jest');
    if (allDeps.mocha) tools.push('Mocha');
    if (allDeps.cypress) tools.push('Cypress');
    if (allDeps.playwright) tools.push('Playwright');
    if (allDeps['@testing-library/react']) tools.push('React Testing Library');
    
    return tools;
  }

  identifyBuildTools(deps, devDeps) {
    const allDeps = { ...deps, ...devDeps };
    const tools = [];
    
    if (allDeps.webpack) tools.push('Webpack');
    if (allDeps.vite) tools.push('Vite');
    if (allDeps.rollup) tools.push('Rollup');
    if (allDeps.parcel) tools.push('Parcel');
    if (allDeps.esbuild) tools.push('ESBuild');
    if (allDeps.typescript) tools.push('TypeScript');
    
    return tools;
  }

  async calculateProjectMetrics() {
    return {
      complexity: await this.calculateComplexity(),
      maintainability: await this.calculateMaintainability(),
      technical_debt: await this.calculateTechnicalDebt()
    };
  }

  async calculateComplexity() {
    // Basic complexity metrics - could be enhanced with AST analysis
    const stats = await this.getFileStatistics();
    
    return {
      file_count_complexity: this.getComplexityScore(stats.codeFiles, [
        { threshold: 10, score: 'low' },
        { threshold: 50, score: 'medium' },
        { threshold: 100, score: 'high' }
      ]),
      dependency_complexity: this.results.categories.structure?.details?.dependencyCount ? 
        this.getComplexityScore(this.results.categories.structure.details.dependencyCount, [
          { threshold: 20, score: 'low' },
          { threshold: 50, score: 'medium' },  
          { threshold: 100, score: 'high' }
        ]) : 'unknown'
    };
  }

  getComplexityScore(value, thresholds) {
    for (const { threshold, score } of thresholds) {
      if (value <= threshold) return score;
    }
    return 'very_high';
  }

  async calculateMaintainability() {
    const categories = this.results.categories;
    const factors = [];
    
    if (categories.quality) factors.push(categories.quality.score / categories.quality.maxScore);
    if (categories.structure) factors.push(categories.structure.score / categories.structure.maxScore);
    if (categories.testing) factors.push(categories.testing.score / categories.testing.maxScore);
    
    const avgScore = factors.length > 0 ? factors.reduce((a, b) => a + b, 0) / factors.length : 0;
    
    return {
      score: Math.round(avgScore * 100),
      level: avgScore > 0.8 ? 'high' : avgScore > 0.6 ? 'medium' : 'low',
      factors: {
        code_quality: categories.quality?.score || 0,
        architecture: categories.structure?.score || 0,
        test_coverage: categories.testing?.score || 0
      }
    };
  }

  async calculateTechnicalDebt() {
    const issues = [];
    let debtScore = 0;
    
    for (const [categoryKey, result] of Object.entries(this.results.categories)) {
      if (result.issues && result.issues.length > 0) {
        issues.push(...result.issues.map(issue => ({ category: categoryKey, issue })));
        debtScore += result.issues.length;
      }
    }
    
    return {
      total_issues: issues.length,
      debt_score: Math.min(debtScore, 100), // Cap at 100
      level: debtScore < 5 ? 'low' : debtScore < 15 ? 'medium' : 'high',
      top_issues: issues.slice(0, 5) // Top 5 most critical issues
    };
  }

  /**
   * Check availability of key analysis tools and provide user guidance
   */
  async checkToolAvailability() {
    const availabilityStatus = {
      npm: false,
      eslint: false,
      coverage: false,
      suggestions: []
    };

    try {
      // Check npm availability
      try {
        const { execSync } = await import('child_process');
        execSync('npm --version', { stdio: 'ignore' });
        availabilityStatus.npm = true;
      } catch (error) {
        availabilityStatus.suggestions.push('🔧 Install npm for dependency vulnerability scanning');
      }

      // Check ESLint availability
      if (existsSync(path.join(this.config.projectRoot, 'package.json'))) {
        const packageJson = JSON.parse(readFileSync(path.join(this.config.projectRoot, 'package.json'), 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.eslint) {
          availabilityStatus.eslint = true;
        } else {
          const hasEslintConfig = existsSync(path.join(this.config.projectRoot, '.eslintrc.js')) ||
                                existsSync(path.join(this.config.projectRoot, '.eslintrc.json')) ||
                                existsSync(path.join(this.config.projectRoot, 'eslint.config.js'));
          
          if (hasEslintConfig) {
            availabilityStatus.suggestions.push('🔧 Install ESLint: npm install --save-dev eslint');
          }
        }

        // Check coverage tools
        if (deps.c8 || deps.nyc || deps.jest) {
          availabilityStatus.coverage = true;
        } else if (packageJson.scripts && packageJson.scripts.test) {
          availabilityStatus.suggestions.push('🔧 Add coverage: npm install --save-dev c8 (for vitest) or jest --coverage');
        }
      }

      // Display suggestions if any tools are missing
      if (availabilityStatus.suggestions.length > 0) {
        console.log('\n💡 Tool Availability Recommendations:');
        console.log('────────────────────────────────────────────────────────────');
        availabilityStatus.suggestions.forEach(suggestion => console.log(suggestion));
        console.log('');
      }

      return availabilityStatus;
    } catch (error) {
      // Silently continue if availability check fails
      return availabilityStatus;
    }
  }

  /**
   * QUICK WIN: Smart project type detection based on dependencies and file structure
   * @returns {string} Detected project type
   */
  detectProjectType() {
    try {
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
      
      // Check if package.json exists
      if (!existsSync(packageJsonPath)) {
        return 'javascript'; // Default fallback
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Enhanced detection logic with more specificity
      // Frontend frameworks (check in priority order)
      if (deps.react || deps['react-dom']) {
        if (deps['next'] || deps['gatsby']) return 'react-webapp';
        if (deps['react-native']) return 'react-native';
        return 'react-webapp';
      }
      
      if (deps.vue || deps['@vue/core']) {
        if (deps.nuxt) return 'vue-webapp';
        return 'vue-webapp';
      }
      
      if (deps.svelte || deps['svelte-check']) {
        if (deps['@sveltejs/kit']) return 'svelte-webapp';
        return 'svelte-webapp';
      }
      
      if (deps.angular || deps['@angular/core']) {
        return 'angular-webapp';
      }
      
      // Backend frameworks
      if (deps.express || deps.fastify || deps.koa || deps.hapi) {
        return 'node-api';
      }
      
      // Context7/MCP specific detection
      if (deps['@modelcontextprotocol/sdk'] || 
          packageJson.name?.includes('mcp') || 
          packageJson.name?.includes('context7')) {
        return 'mcp-server';
      }
      
      // CLI tools
      if (deps.commander || deps.yargs || packageJson.bin) {
        return 'cli-tool';
      }
      
      // Check file structure for additional clues
      const hasPublicDir = existsSync(path.join(this.config.projectRoot, 'public'));
      const hasSrcDir = existsSync(path.join(this.config.projectRoot, 'src'));
      const hasIndexHtml = existsSync(path.join(this.config.projectRoot, 'index.html')) ||
                          existsSync(path.join(this.config.projectRoot, 'public/index.html'));
      
      if (hasPublicDir && hasIndexHtml) {
        return 'webapp'; // Generic web application
      }
      
      if (hasSrcDir && !hasIndexHtml) {
        return 'node-api'; // Likely server-side
      }
      
      // TypeScript project detection
      if (existsSync(path.join(this.config.projectRoot, 'tsconfig.json'))) {
        return deps.express ? 'node-api' : 'typescript';
      }
      
      return 'javascript'; // Default fallback
      
    } catch (error) {
      console.warn(`Project type detection failed: ${error.message}`);
      return 'javascript';
    }
  }

  // Static factory methods
  static async scoreProject(projectRoot, options = {}) {
    const scorer = new ProjectScorer({
      projectRoot,
      ...options
    });
    
    return await scorer.scoreProject(options);
  }

  static async autoDetectAndScore(projectRoot = process.cwd(), options = {}) {
    // Auto-detect project configuration like Context7MCPServer does
    let projectType = 'javascript';
    let projectName = path.basename(projectRoot);
    
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      projectName = packageJson.name || projectName;
      
      if (deps.react) projectType = 'react-webapp';
      else if (deps.vue) projectType = 'vue-webapp'; 
      else if (deps.svelte) projectType = 'svelte-webapp';
      else if (deps.express || deps.fastify || deps.koa) projectType = 'node-api';
      
    } catch (error) {
      // Use defaults
    }
    
    const scorer = new ProjectScorer({
      projectRoot,
      projectType,
      projectName,
      ...options
    });
    
    return await scorer.scoreProject(options);
  }
}