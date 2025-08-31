/**
 * PerformanceAnalyzer - Analyzes performance and optimization patterns
 * 
 * Evaluates:
 * - Bundle size and dependency optimization (6pts)
 * - Code splitting and lazy loading (5pts)
 * - Performance best practices (4pts)
 * Total: 15pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';

export class PerformanceAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Performance & Optimization';
    this.description = 'Bundle optimization, code splitting, and performance best practices';
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];
    
    await this.analyzeBundleOptimization(); // 6pts
    await this.analyzeCodeSplitting(); // 5pts
    await this.analyzePerformanceBestPractices(); // 4pts
  }

  async analyzeBundleOptimization() {
    let _score = 0;
    const _maxScore = 6;
    
    const packageJson = await this.readPackageJson();
    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot analyze dependencies');
      return;
    }
    
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    const totalDeps = Object.keys(deps).length;
    
    // Score based on dependency count (lighter is better)
    if (totalDeps < 10) {
      _score += 3;
      this.addScore(3, 3, `Lean dependency count (${totalDeps})`);
    } else if (totalDeps < 25) {
      _score += 2;
      this.addScore(2, 3, `Moderate dependency count (${totalDeps})`);
    } else if (totalDeps < 50) {
      _score += 1;
      this.addScore(1, 3, `High dependency count (${totalDeps})`);
      this.addIssue('Many dependencies detected', 'Audit dependencies for bundle size impact');
    } else {
      this.addIssue('Very high dependency count', 'Significant dependency bloat - consider alternatives');
    }
    
    // Check for bundle analysis tools
    const bundleTools = ['webpack-bundle-analyzer', '@bundle-analyzer/webpack', 'rollup-plugin-analyzer', 'vite-bundle-analyzer'];
    const hasBundleAnalysis = bundleTools.some(tool => devDeps[tool]);
    
    if (hasBundleAnalysis) {
      _score += 2;
      this.addScore(2, 2, 'Bundle analysis tool detected');
    } else {
      this.addIssue('No bundle analysis tool found', 'Add webpack-bundle-analyzer or similar for bundle optimization');
    }
    
    // Check for tree-shaking friendly packages
    const modernPackages = ['lodash-es', '@babel/runtime'];
    const hasModernPackages = modernPackages.some(pkg => deps[pkg]);
    
    if (hasModernPackages) {
      _score += 1;
      this.addScore(1, 1, 'Tree-shaking friendly packages detected');
    }
    
    this.setDetail('dependencyCount', totalDeps);
    this.setDetail('hasBundleAnalysis', hasBundleAnalysis);
  }

  async analyzeCodeSplitting() {
    let _score = 0;
    const _maxScore = 5;
    
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let dynamicImports = 0;
    let lazyComponents = 0;
    let routeBasedSplitting = 0;
    
    for (const file of files) {
      try {
        const content = await this.readFile(file);
        
        // Count dynamic imports
        const imports = content.match(/import\s*\(/g);
        if (imports) {
          dynamicImports += imports.length;
        }
        
        // React.lazy usage
        if (content.includes('React.lazy') || content.includes('lazy(')) {
          lazyComponents++;
        }
        
        // Route-based code splitting indicators
        if (content.includes('loadable') || content.includes('Suspense') || 
            (content.includes('import(') && (content.includes('route') || content.includes('page')))) {
          routeBasedSplitting++;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    // Score for dynamic imports
    if (dynamicImports > 0) {
      const importScore = Math.min(dynamicImports / 3, 3); // Up to 3 points
      _score += importScore;
      this.addScore(importScore, 3, `Dynamic imports found (${dynamicImports})`);
    } else if (this.isReactProject() || this.isVueProject()) {
      this.addIssue('No dynamic imports found', 'Implement code splitting with dynamic imports');
    }
    
    // Score for lazy loading
    if (lazyComponents > 0) {
      _score += 1;
      this.addScore(1, 1, `Lazy components detected (${lazyComponents})`);
    } else if (this.isReactProject()) {
      this.addIssue('No lazy components found', 'Use React.lazy() for component-level code splitting');
    }
    
    // Score for route-based splitting
    if (routeBasedSplitting > 0) {
      _score += 1;
      this.addScore(1, 1, `Route-based splitting detected (${routeBasedSplitting})`);
    } else if (this.isReactProject() || this.isVueProject()) {
      this.addIssue('No route-based code splitting', 'Split routes for better initial load performance');
    }
    
    this.setDetail('dynamicImports', dynamicImports);
    this.setDetail('lazyComponents', lazyComponents);
    this.setDetail('routeBasedSplitting', routeBasedSplitting);
  }

  async analyzePerformanceBestPractices() {
    let _score = 0;
    const _maxScore = 4;
    
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let memoizationCount = 0;
    let optimizationPatterns = 0;
    let performanceIssues = 0;
    
    for (const file of files.slice(0, 20)) { // Sample files for performance
      try {
        const content = await this.readFile(file);
        
        // React performance patterns
        if (this.isReactProject()) {
          // Count memoization usage
          if (content.includes('React.memo') || content.includes('useMemo') || content.includes('useCallback')) {
            memoizationCount++;
          }
          
          // Check for performance optimization patterns
          if (content.includes('React.lazy') || content.includes('Suspense') || content.includes('useCallback')) {
            optimizationPatterns++;
          }
          
          // Identify potential performance issues
          if (content.includes('useEffect') && !content.includes('useCallback') && content.includes('(')) {
            performanceIssues++;
          }
        }
        
        // General performance patterns
        if (content.includes('debounce') || content.includes('throttle')) {
          optimizationPatterns++;
        }
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    // Score for memoization
    if (memoizationCount > 0) {
      const memoScore = Math.min(memoizationCount / 3, 2); // Up to 2 points
      _score += memoScore;
      this.addScore(memoScore, 2, `Performance optimization patterns (${memoizationCount})`);
    } else if (this.isReactProject()) {
      this.addIssue('No memoization detected', 'Use React.memo, useMemo, useCallback for optimization');
    }
    
    // Score for general optimization patterns
    if (optimizationPatterns > 0) {
      _score += Math.min(optimizationPatterns / 2, 2); // Up to 2 points
      this.addScore(Math.min(optimizationPatterns / 2, 2), 2, `Optimization patterns found (${optimizationPatterns})`);
    }
    
    // Deduct for performance anti-patterns
    if (performanceIssues > 3) {
      this.addIssue('Potential performance issues detected', 'Review useEffect dependencies and callback usage');
    }
    
    this.setDetail('memoizationCount', memoizationCount);
    this.setDetail('optimizationPatterns', optimizationPatterns);
    this.setDetail('performanceIssues', performanceIssues);
  }
}