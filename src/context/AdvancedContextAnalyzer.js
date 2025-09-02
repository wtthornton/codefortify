/**
 * Advanced Context Analyzer for Context7
 * Provides deep context analysis for AI assistant code generation
 *
 * Features:
 * - Multi-dimensional context analysis
 * - Architecture pattern detection
 * - Team convention recognition
 * - Performance and security requirement awareness
 * - Intelligent caching for performance
 */

import { ArchitectureDetector } from './ArchitectureDetector.js';
import { CodeStyleAnalyzer } from './CodeStyleAnalyzer.js';
import { TeamConventionDetector } from './TeamConventionDetector.js';
import { PerformanceAnalyzer } from './PerformanceAnalyzer.js';
import { SecurityAnalyzer } from './SecurityAnalyzer.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
import { fileUtils } from '../utils/fileUtils.js';

/**


 * AdvancedContextAnalyzer class implementation


 *


 * Provides functionality for advancedcontextanalyzer operations


 */


/**


 * AdvancedContextAnalyzer class implementation


 *


 * Provides functionality for advancedcontextanalyzer operations


 */


export class AdvancedContextAnalyzer {
  constructor(config = {}) {
    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
      enableCaching: config.enableCaching !== false,
      ...config
    };

    this.analyzerCache = new Map();
    this.contextPatterns = new Map();
    this.lastAnalysisTime = new Map();

    // Initialize analyzers
    this.architectureDetector = new ArchitectureDetector(this.config);
    this.codeStyleAnalyzer = new CodeStyleAnalyzer(this.config);
    this.teamConventionDetector = new TeamConventionDetector(this.config);
    this.performanceAnalyzer = new PerformanceAnalyzer(this.config);
    this.securityAnalyzer = new SecurityAnalyzer(this.config);
    this.dependencyAnalyzer = new DependencyAnalyzer(this.config);
  }

  /**
   * Analyze project context with comprehensive multi-dimensional analysis
   * @param {string} projectRoot - Root directory of the project
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Comprehensive context analysis
   */
  async analyzeProjectContext(projectRoot, options = {}) {
    const cacheKey = `context-${projectRoot}-${JSON.stringify(options)}`;

    // Check cache if enabled
    if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
      return this.analyzerCache.get(cacheKey);
    }

    try {
      // LOG: `🔍 Analyzing project context for: ${projectRoot}`
      const context = {
        project: await this.analyzeProjectMetadata(projectRoot),
        architecture: await this.architectureDetector.detectArchitecturePatterns(projectRoot),
        style: await this.codeStyleAnalyzer.analyzeCodeStyle(projectRoot),
        conventions: await this.teamConventionDetector.detectTeamConventions(projectRoot),
        performance: await this.performanceAnalyzer.analyzePerformanceNeeds(projectRoot),
        security: await this.securityAnalyzer.analyzeSecurityNeeds(projectRoot),
        dependencies: await this.dependencyAnalyzer.analyzeDependencyContext(projectRoot),
        timestamp: new Date().toISOString(),
        analysisId: this.generateAnalysisId()
      };

      // Cache the result      /**
   * Performs the specified operation
   * @param {Object} this.config.enableCaching
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.enableCaching
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.enableCaching) {
        this.analyzerCache.set(cacheKey, context);
        this.lastAnalysisTime.set(cacheKey, Date.now());
      }

      // LOG: `✅ Context analysis completed for: ${projectRoot}`
      return context;

    } catch (error) {
      // ERROR: `❌ Error analyzing project context: ${error.message}`
      throw new Error(`Context analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze specific file context within project
   * @param {string} filePath - Path to the file
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} File-specific context
   */
  async analyzeFileContext(filePath, projectRoot) {
    const cacheKey = `file-${filePath}-${projectRoot}`;

    if (this.config.enableCaching && this.isCacheValid(cacheKey)) {
      return this.analyzerCache.get(cacheKey);
    }

    try {
      const projectContext = await this.analyzeProjectContext(projectRoot);
      const fileContent = await fileUtils.readFile(filePath);

      const fileContext = {
        ...projectContext,
        file: {
          path: filePath,
          type: this.detectFileType(filePath),
          size: fileContent.length,
          language: this.detectLanguage(filePath),
          complexity: await this.analyzeFileComplexity(fileContent),
          dependencies: await this.extractFileDependencies(fileContent),
          patterns: await this.detectFilePatterns(fileContent, projectContext)
        }
      };      /**
   * Performs the specified operation
   * @param {Object} this.config.enableCaching
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.enableCaching
   * @returns {boolean} True if successful, false otherwise
   */


      if (this.config.enableCaching) {
        this.analyzerCache.set(cacheKey, fileContext);
        this.lastAnalysisTime.set(cacheKey, Date.now());
      }

      return fileContext;

    } catch (error) {
      // ERROR: `❌ Error analyzing file context: ${error.message}`
      throw new Error(`File context analysis failed: ${error.message}`);
    }
  }

  /**
   * Get context-aware suggestions for code improvement
   * @param {string} code - Code to analyze
   * @param {Object} context - Project context
   * @returns {Promise<Array>} Context-aware suggestions
   */
  async getContextAwareSuggestions(code, context) {
    const suggestions = [];

    // Architecture-aware suggestions    /**
   * Performs the specified operation
   * @param {any} context.architecture
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} context.architecture
   * @returns {any} The operation result
   */

    if (context.architecture) {
      suggestions.push(...await this.getArchitectureSuggestions(code, context.architecture));
    }

    // Style-aware suggestions    /**
   * Performs the specified operation
   * @param {any} context.style
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} context.style
   * @returns {any} The operation result
   */

    if (context.style) {
      suggestions.push(...await this.getStyleSuggestions(code, context.style));
    }

    // Performance-aware suggestions    /**
   * Performs the specified operation
   * @param {any} context.performance
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} context.performance
   * @returns {any} The operation result
   */

    if (context.performance) {
      suggestions.push(...await this.getPerformanceSuggestions(code, context.performance));
    }

    // Security-aware suggestions    /**
   * Performs the specified operation
   * @param {any} context.security
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} context.security
   * @returns {any} The operation result
   */

    if (context.security) {
      suggestions.push(...await this.getSecuritySuggestions(code, context.security));
    }

    return this.rankSuggestions(suggestions, context);
  }

  /**
   * Clear analysis cache
   * @param {string} projectRoot - Optional project root to clear specific cache
   */
  clearCache(projectRoot = null) {  /**
   * Performs the specified operation
   * @param {any} projectRoot
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} projectRoot
   * @returns {any} The operation result
   */

    if (projectRoot) {
      const keysToDelete = Array.from(this.analyzerCache.keys())
        .filter(key => key.includes(projectRoot));
      keysToDelete.forEach(key => {
        this.analyzerCache.delete(key);
        this.lastAnalysisTime.delete(key);
      });
    } else {
      this.analyzerCache.clear();
      this.lastAnalysisTime.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.analyzerCache.size,
      keys: Array.from(this.analyzerCache.keys()),
      lastAnalysisTimes: Object.fromEntries(this.lastAnalysisTime)
    };
  }

  // Private methods  /**
   * Analyzes the provided data
   * @param {any} projectRoot
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @param {any} projectRoot
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeProjectMetadata(projectRoot) {
    try {
      const packageJson = await fileUtils.readFile(`${projectRoot}/package.json`);
      const packageData = JSON.parse(packageJson);

      return {
        name: packageData.name,
        version: packageData.version,
        type: this.detectProjectType(packageData),
        framework: this.detectFramework(packageData),
        buildTool: this.detectBuildTool(projectRoot),
        testFramework: this.detectTestFramework(packageData),
        linting: this.detectLintingTools(packageData),
        dependencies: {
          production: Object.keys(packageData.dependencies || {}),
          development: Object.keys(packageData.devDependencies || {})
        }
      };
    } catch (error) {
      return {
        type: 'unknown',
        framework: 'unknown',
        buildTool: 'unknown',
        testFramework: 'unknown',
        linting: 'unknown',
        dependencies: { production: [], development: [] }
      };
    }
  }  /**
   * Performs the specified operation
   * @param {any} packageData
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} packageData
   * @returns {any} The operation result
   */


  detectProjectType(packageData) {  /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.react
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.react
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.react) { return 'react'; }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.vue
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.vue
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.vue) { return 'vue'; }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.angular
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.angular
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.angular) { return 'angular'; }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.express
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.express
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.express) { return 'nodejs'; }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.next
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.next
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.next) { return 'nextjs'; }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.nuxt
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.nuxt
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.nuxt) { return 'nuxt'; }
    return 'javascript';
  }  /**
   * Performs the specified operation
   * @param {any} packageData
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} packageData
   * @returns {any} The operation result
   */


  detectFramework(packageData) {
    const frameworks = [];    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.react
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.react
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.react) { frameworks.push('React'); }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.vue
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.vue
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.vue) { frameworks.push('Vue'); }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.angular
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.angular
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.angular) { frameworks.push('Angular'); }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.express
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.express
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.express) { frameworks.push('Express'); }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.next
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.next
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.next) { frameworks.push('Next.js'); }    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.nuxt
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.dependencies?.nuxt
   * @returns {any} The operation result
   */

    if (packageData.dependencies?.nuxt) { frameworks.push('Nuxt.js'); }
    return frameworks.length > 0 ? frameworks : ['Vanilla JS'];
  }  /**
   * Performs the specified operation
   * @param {any} projectRoot
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} projectRoot
   * @returns {any} The operation result
   */


  detectBuildTool(projectRoot) {
    if (fileUtils.fileExists(`${projectRoot}/vite.config.js`)) { return 'Vite'; }
    if (fileUtils.fileExists(`${projectRoot}/webpack.config.js`)) { return 'Webpack'; }
    if (fileUtils.fileExists(`${projectRoot}/rollup.config.js`)) { return 'Rollup'; }
    if (fileUtils.fileExists(`${projectRoot}/parcel.config.js`)) { return 'Parcel'; }
    return 'Unknown';
  }  /**
   * Tests the functionality
   * @param {any} packageData
   * @returns {any} The operation result
   */
  /**
   * Tests the functionality
   * @param {any} packageData
   * @returns {any} The operation result
   */


  detectTestFramework(packageData) {
    const testFrameworks = [];    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.jest
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.jest
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.jest) { testFrameworks.push('Jest'); }    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.vitest
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.vitest
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.vitest) { testFrameworks.push('Vitest'); }    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.mocha
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.mocha
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.mocha) { testFrameworks.push('Mocha'); }    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.cypress
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.cypress
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.cypress) { testFrameworks.push('Cypress'); }    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.['@testing-library/react']
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.['@testing-library/react']
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.['@testing-library/react']) { testFrameworks.push('Testing Library'); }
    return testFrameworks.length > 0 ? testFrameworks : ['Unknown'];
  }  /**
   * Performs the specified operation
   * @param {any} packageData
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} packageData
   * @returns {any} The operation result
   */


  detectLintingTools(packageData) {
    const lintingTools = [];    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.eslint
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.eslint
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.eslint) { lintingTools.push('ESLint'); }    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.prettier
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.prettier
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.prettier) { lintingTools.push('Prettier'); }    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.stylelint
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.stylelint
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.stylelint) { lintingTools.push('Stylelint'); }    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.tslint
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageData.devDependencies?.tslint
   * @returns {any} The operation result
   */

    if (packageData.devDependencies?.tslint) { lintingTools.push('TSLint'); }
    return lintingTools.length > 0 ? lintingTools : ['Unknown'];
  }  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {any} The operation result
   */


  detectFileType(filePath) {
    const ext = fileUtils.getFileExtension(filePath);
    const typeMap = {
      '.js': 'javascript',
      '.jsx': 'react',
      '.ts': 'typescript',
      '.tsx': 'react-typescript',
      '.vue': 'vue',
      '.css': 'stylesheet',
      '.scss': 'stylesheet',
      '.sass': 'stylesheet',
      '.less': 'stylesheet',
      '.html': 'markup',
      '.json': 'data',
      '.md': 'documentation'
    };
    return typeMap[ext] || 'unknown';
  }  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {string} filePath
   * @returns {any} The operation result
   */


  detectLanguage(filePath) {
    const ext = fileUtils.getFileExtension(filePath);
    const languageMap = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.vue': 'Vue',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.html': 'HTML',
      '.json': 'JSON',
      '.md': 'Markdown'
    };
    return languageMap[ext] || 'Unknown';
  }  /**
   * Analyzes the provided data
   * @param {any} code
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @param {any} code
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeFileComplexity(code) {
    // Simple complexity analysis
    const lines = code.split('\n').length;
    const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const classes = (code.match(/class\s+\w+/g) || []).length;
    const imports = (code.match(/import\s+.*from/g) || []).length;

    return {
      lines,
      functions,
      classes,
      imports,
      complexity: Math.round((functions + classes * 2 + imports * 0.5) / lines * 100) / 100
    };
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} code
   * @returns {Promise} Promise that resolves with the result
   */


  async extractFileDependencies(code) {
    const dependencies = [];

    // Extract import statements
    const importMatches = code.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];
    importMatches.forEach(match => {
      const dep = match.match(/from\s+['"]([^'"]+)['"]/);      /**
   * Performs the specified operation
   * @param {any} dep
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} dep
   * @returns {any} The operation result
   */

      if (dep) { dependencies.push(dep[1]); }
    });

    // Extract require statements
    const requireMatches = code.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
    requireMatches.forEach(match => {
      const dep = match.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);      /**
   * Performs the specified operation
   * @param {any} dep
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} dep
   * @returns {any} The operation result
   */

      if (dep) { dependencies.push(dep[1]); }
    });

    return [...new Set(dependencies)];
  }  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} context
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @param {any} code
   * @param {any} context
   * @returns {Promise} Promise that resolves with the result
   */


  async detectFilePatterns(code, context) {
    const patterns = [];

    // Detect common patterns
    if (code.includes('useState') || code.includes('useEffect')) {
      patterns.push('React Hooks');
    }
    if (code.includes('async') && code.includes('await')) {
      patterns.push('Async/Await');
    }
    if (code.includes('Promise')) {
      patterns.push('Promises');
    }
    if (code.includes('class') && code.includes('extends')) {
      patterns.push('Class Inheritance');
    }
    if (code.includes('export default')) {
      patterns.push('ES6 Modules');
    }

    return patterns;
  }  /**
   * Retrieves data
   * @param {any} code
   * @param {any} architecture
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {any} code
   * @param {any} architecture
   * @returns {Promise} Promise that resolves with the result
   */


  async getArchitectureSuggestions(code, architecture) {
    const suggestions = [];    /**
   * Performs the specified operation
   * @param {number} architecture.patterns?.mvc?.confidence > 0.7
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} architecture.patterns?.mvc?.confidence > 0.7
   * @returns {any} The operation result
   */


    if (architecture.patterns?.mvc?.confidence > 0.7) {
      suggestions.push({
        type: 'architecture',
        priority: 'high',
        message: 'Consider following MVC separation patterns',
        suggestion: 'Separate business logic from presentation logic'
      });
    }

    return suggestions;
  }  /**
   * Retrieves data
   * @param {any} code
   * @param {any} style
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {any} code
   * @param {any} style
   * @returns {Promise} Promise that resolves with the result
   */


  async getStyleSuggestions(code, style) {
    const suggestions = [];    /**
   * Performs the specified operation
   * @param {any} style.formatting?.indentation - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} style.formatting?.indentation - Optional parameter
   * @returns {any} The operation result
   */


    if (style.formatting?.indentation === 'tabs') {
      suggestions.push({
        type: 'style',
        priority: 'medium',
        message: 'Use consistent indentation',
        suggestion: 'Convert tabs to spaces for consistency'
      });
    }

    return suggestions;
  }  /**
   * Retrieves data
   * @param {any} code
   * @param {any} performance
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {any} code
   * @param {any} performance
   * @returns {Promise} Promise that resolves with the result
   */


  async getPerformanceSuggestions(code, performance) {
    const suggestions = [];

    if (code.includes('for (let i = 0; i < array.length; i++)')) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        message: 'Consider using forEach or map for better performance',
        suggestion: 'Replace traditional for loop with array methods'
      });
    }

    return suggestions;
  }  /**
   * Retrieves data
   * @param {any} code
   * @param {any} security
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @param {any} code
   * @param {any} security
   * @returns {Promise} Promise that resolves with the result
   */


  async getSecuritySuggestions(code, security) {
    const suggestions = [];

    if (code.includes('eval(')) {
      suggestions.push({
        type: 'security',
        priority: 'critical',
        message: 'Avoid using eval() for security reasons',
        suggestion: 'Use safer alternatives like JSON.parse() or Function constructor'
      });
    }

    return suggestions;
  }  /**
   * Performs the specified operation
   * @param {any} suggestions
   * @param {any} context
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} suggestions
   * @param {any} context
   * @returns {any} The operation result
   */


  rankSuggestions(suggestions, context) {
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }  /**
   * Performs the specified operation
   * @param {any} cacheKey
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Performs the specified operation
   * @param {any} cacheKey
   * @returns {boolean} True if successful, false otherwise
   */


  isCacheValid(cacheKey) {
    if (!this.analyzerCache.has(cacheKey)) { return false; }

    const lastTime = this.lastAnalysisTime.get(cacheKey);
    return (Date.now() - lastTime) < this.config.cacheTimeout;
  }  /**
   * Generates new data
   * @returns {boolean} True if successful, false otherwise
   */
  /**
   * Generates new data
   * @returns {boolean} True if successful, false otherwise
   */


  generateAnalysisId() {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
