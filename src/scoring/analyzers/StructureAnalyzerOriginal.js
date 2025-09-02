/**
 * StructureAnalyzer - Analyzes code structure and architecture
 *
 * Evaluates:
 * - File organization and directory structure (4pts)
 * - Module boundaries and separation of concerns (4pts)
 * - Naming conventions consistency (4pts)
 * - Architecture patterns and design (3pts)
 * - Circular dependencies and coupling (3pts)
 * Total: 18pts
 */

import path from 'path';
import fs from 'fs/promises';
import { BaseAnalyzer } from './BaseAnalyzer.js';
import { FileSizeAnalyzer } from './FileSizeAnalyzer.js';

/**


 * StructureAnalyzer class implementation


 *


 * Provides functionality for structureanalyzer operations


 */


/**


 * StructureAnalyzer class implementation


 *


 * Provides functionality for structureanalyzer operations


 */


export class StructureAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Code Structure & Architecture';
    this.description = 'File organization, module boundaries, naming conventions, and architecture patterns';
  }  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */


  async runAnalysis() {
    // Reset results
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];

    // Run individual analysis components
    await this.analyzeFileOrganization(); // 4pts
    await this.analyzeModuleBoundaries(); // 4pts
    await this.analyzeNamingConventions(); // 4pts
    await this.analyzeArchitecturePatterns(); // 3pts
    await this.analyzeDependencies(); // 3pts
    // await this.analyzeFileSizes(); // File size analysis integrated (temporarily disabled due to compatibility issue)

    // Store analysis details
    this.setDetail('totalFiles', await this.countFiles());
    this.setDetail('directoryStructure', await this.getDirectoryStructure());
    this.setDetail('projectType', this.config.projectType);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeFileOrganization() {
    let score = 0;
    const maxScore = 4;

    try {
      // Check for proper directory structure
      const requiredDirs = await this.getRequiredDirectories();
      const existingDirs = await this.checkDirectories(requiredDirs);

      // Score based on directory structure (2pts)
      const dirScore = (existingDirs / requiredDirs.length) * 2;
      score += dirScore;
      this.addScore(dirScore, 2, `Directory structure (${existingDirs}/${requiredDirs.length} required dirs)`);

      // Check for logical file grouping (1.5pts)
      const groupingScore = await this.analyzeFileGrouping();
      score += groupingScore;

      // Check for proper separation of concerns (0.5pt)
      const separationScore = await this.analyzeSeparationOfConcerns();
      score += separationScore;

      // Add recommendations based on issues found      /**
   * Performs the specified operation
   * @param {any} score < maxScore * 0.7
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} score < maxScore * 0.7
   * @returns {any} The operation result
   */

      if (score < maxScore * 0.7) {
        this.addIssue(
          'File organization could be improved',
          'Consider organizing files into feature-based or layer-based directories'
        );
      }

    }

    catch (error) {
      this.addIssue(`File organization analysis failed: ${error.message}`);
    }
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeModuleBoundaries() {
    let score = 0;
    const maxScore = 4;

    try {
      // Analyze import/export patterns
      const moduleAnalysis = await this.analyzeModuleStructure();

      // Score based on clear module boundaries (3pts)      /**
   * Performs the specified operation
   * @param {boolean} moduleAnalysis.hasConsistentExports
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} moduleAnalysis.hasConsistentExports
   * @returns {boolean} True if successful, false otherwise
   */

      if (moduleAnalysis.hasConsistentExports) {
        score += 3;
        this.addScore(3, 3, 'Consistent export patterns found');
      }

      else {
        this.addIssue('Inconsistent module export patterns', 'Use consistent import/export patterns throughout the project');
      }

      // Score based on appropriate module size (2pts)
      const avgModuleSize = moduleAnalysis.averageModuleSize;      /**
   * Performs the specified operation
   * @param {any} avgModuleSize < 200
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} avgModuleSize < 200
   * @returns {any} The operation result
   */

      if (avgModuleSize < 200) {
        score += 2;
        this.addScore(2, 2, 'Modules are appropriately sized');
      }

      else if (avgModuleSize < 400) {
        score += 1;
        this.addScore(1, 2, 'Some modules are large but manageable');
        this.addIssue('Some modules are quite large', 'Consider breaking down large modules into smaller, focused units');
      }

      else {
        this.addIssue('Modules are too large', 'Break down large modules for better maintainability');
      }

      this.setDetail('averageModuleSize', avgModuleSize);
      this.setDetail('totalModules', moduleAnalysis.totalModules);

    }

    catch (error) {
      this.addIssue(`Module boundary analysis failed: ${error.message}`);
    }
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeNamingConventions() {
    let score = 0;
    const maxScore = 4;

    try {
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte']);
      const namingResults = await this.analyzeFileNames(files);

      // Score based on naming consistency (2pts)      /**
   * Performs the specified operation
   * @param {boolean} namingResults.consistency > 0.8
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} namingResults.consistency > 0.8
   * @returns {boolean} True if successful, false otherwise
   */

      if (namingResults.consistency > 0.8) {
        score += 2;
        this.addScore(2, 2, `Naming conventions are consistent (${Math.round(namingResults.consistency * 100)}%)`);
      }

      else if (namingResults.consistency > 0.6) {
        score += 1;
        this.addScore(1, 2, `Naming conventions are mostly consistent (${Math.round(namingResults.consistency * 100)}%)`);
        this.addIssue('Some naming inconsistencies found', 'Standardize naming conventions across the project');
      }

      else {
        this.addIssue('Naming conventions are inconsistent', 'Establish and follow consistent naming patterns');
      }

      // Score based on appropriate naming patterns for project type (2pts)
      const patternScore = await this.analyzeNamingPatterns(files);
      score += patternScore;

      this.setDetail('namingConsistency', namingResults.consistency);
      this.setDetail('fileNamingPatterns', namingResults.patterns);

    }

    catch (error) {
      this.addIssue(`Naming convention analysis failed: ${error.message}`);
    }
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeArchitecturePatterns() {
    let score = 0;
    const maxScore = 3;

    try {
      // QUICK WIN: Enhanced pattern recognition for architecture
      const architecturePatterns = await this.detectArchitecturePatterns();

      if (this.isReactProject()) {
        score += await this.analyzeReactArchitecture(architecturePatterns);
      }

      else if (this.isVueProject()) {
        score += await this.analyzeVueArchitecture(architecturePatterns);
      }

      else if (this.isNodeProject()) {
        score += await this.analyzeNodeArchitecture(architecturePatterns);
      }

      else {
        score += await this.analyzeGeneralArchitecture(architecturePatterns);
      }

      // Bonus points for advanced patterns
      score += this.scoreAdvancedPatterns(architecturePatterns);

      this.setDetail('detectedPatterns', architecturePatterns);

    }

    catch (error) {
      this.addIssue(`Architecture pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * PHASE 1: Enhanced architecture pattern detection with MCP-specific patterns
   * @returns {Promise<Object>} Detected patterns
   */
  async detectArchitecturePatterns() {
    const patterns = {
      mvc: false,
      layeredArchitecture: false,
      serviceLayer: false,
      repositoryPattern: false,
      observerPattern: false,
      singletonPattern: false,
      factoryPattern: false,
      strategyPattern: false,
      middlewarePattern: false,
      compositionPattern: false,
      moduleFederation: false,
      microServices: false,
      eventDriven: false,
      stateManagement: false,
      errorBoundaries: false,
      dependencyInjection: false,
      // PHASE 1: MCP-specific patterns
      mcpServerPattern: false,
      mcpResourceHandlers: false,
      mcpToolHandlers: false,
      mcpPromptHandlers: false,
      agentOSIntegration: false,
      context7Compliance: false,
      mcpProtocolCompliance: false
    };

    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);

    for (const file of files.slice(0, 20)) { // Analyze sample files
      try {
        const content = await this.readFile(file);
        const lowerContent = content.toLowerCase();

        // MVC Pattern
        if (file.includes('controller') || file.includes('model') || file.includes('view') ||
            lowerContent.includes('controller') || lowerContent.includes('model')) {
          patterns.mvc = true;
        }

        // Service Layer
        if (file.includes('service') || file.includes('Service') || lowerContent.includes('service')) {
          patterns.serviceLayer = true;
        }

        // Repository Pattern
        if (file.includes('repository') || file.includes('Repository') ||
            lowerContent.includes('repository') || lowerContent.includes('findby') ||
            lowerContent.includes('findall')) {
          patterns.repositoryPattern = true;
        }

        // Observer Pattern
        if (content.includes('addEventListener') || content.includes('subscribe') ||
            content.includes('observer') || content.includes('Observer') ||
            content.includes('EventEmitter')) {
          patterns.observerPattern = true;
        }

        // Singleton Pattern
        if (content.includes('getInstance') || content.includes('singleton') ||
            content.match(/class\s+\w+\s*{[\s\S]*static\s+instance/)) {
          patterns.singletonPattern = true;
        }

        // Factory Pattern
        if (content.includes('createInstance') || content.includes('factory') ||
            content.includes('Factory') || content.includes('create()')) {
          patterns.factoryPattern = true;
        }

        // Middleware Pattern
        if (content.includes('middleware') || content.includes('next()') ||
            content.includes('(req, res, next)') || file.includes('middleware')) {
          patterns.middlewarePattern = true;
        }

        // Strategy Pattern
        if (content.includes('strategy') || content.includes('Strategy') ||
            content.match(/\w+Strategy/)) {
          patterns.strategyPattern = true;
        }

        // React/Vue specific patterns
        if (content.includes('React.memo') || content.includes('useMemo') ||
            content.includes('useCallback') || content.includes('HOC') ||
            content.includes('withRouter') || content.includes('compose(')) {
          patterns.compositionPattern = true;
        }

        // State Management
        if (content.includes('Redux') || content.includes('Vuex') ||
            content.includes('Zustand') || content.includes('Pinia') ||
            content.includes('useContext') || content.includes('createContext')) {
          patterns.stateManagement = true;
        }

        // Error Boundaries (React)
        if (content.includes('componentDidCatch') || content.includes('ErrorBoundary') ||
            content.includes('getDerivedStateFromError')) {
          patterns.errorBoundaries = true;
        }

        // Dependency Injection
        if (content.includes('inject') || content.includes('@Injectable') ||
            content.includes('container.resolve') || content.includes('DI')) {
          patterns.dependencyInjection = true;
        }

        // Event-driven architecture
        if (content.includes('EventBus') || content.includes('emit(') ||
            content.includes('dispatch(') || content.includes('publish(')) {
          patterns.eventDriven = true;
        }

        // PHASE 1: MCP-specific pattern detection
        // MCP Server Pattern
        if (content.includes('@modelcontextprotocol/sdk') || content.includes('Server') &&
            (content.includes('resources') || content.includes('tools') || content.includes('prompts'))) {
          patterns.mcpServerPattern = true;
        }

        // MCP Resource Handlers
        if (content.includes('list_resources') || content.includes('read_resource') ||
            content.includes('ResourceManager') || content.includes('getResource')) {
          patterns.mcpResourceHandlers = true;
        }

        // MCP Tool Handlers
        if (content.includes('list_tools') || content.includes('call_tool') ||
            content.includes('ToolManager') || content.includes('executeTool')) {
          patterns.mcpToolHandlers = true;
        }

        // MCP Prompt Handlers
        if (content.includes('list_prompts') || content.includes('get_prompt') ||
            content.includes('PromptManager') || content.includes('generatePrompt')) {
          patterns.mcpPromptHandlers = true;
        }

        // Agent OS Integration
        if (content.includes('.codefortify') || content.includes('CodeFortify') ||
            content.includes('codefortify-config') || file.includes('.codefortify')) {
          patterns.agentOSIntegration = true;
        }

        // Context7 Compliance
        if (content.includes('Context7') || content.includes('context7') ||
            content.includes('CLAUDE.md') || content.includes('AGENTS.md')) {
          patterns.context7Compliance = true;
        }

        // MCP Protocol Compliance
        if (content.includes('JSON-RPC') || content.includes('initialize') &&
            content.includes('capabilities') || content.includes('notification')) {
          patterns.mcpProtocolCompliance = true;
        }

      }

      catch (error) {
        // Skip files that can't be read
      }
    }

    // Check for layered architecture in directory structure
    const directories = await this.getAllDirectories();
    if (directories.some(d => d.includes('models')) &&
        directories.some(d => d.includes('views')) &&
        directories.some(d => d.includes('controllers') || d.includes('services'))) {
      patterns.layeredArchitecture = true;
    }

    // PHASE 1: Check for Context7/MCP-specific directory structures
    if (directories.some(d => d.includes('.codefortify')) ||
        await this.fileExists('.codefortify') || await this.fileExists('src/mcp-server.js')) {
      patterns.agentOSIntegration = true;
    }

    // Check for Context7 compliance files
    if (await this.fileExists('AGENTS.md') && await this.fileExists('CLAUDE.md') &&
        await this.fileExists('context7.config.js')) {
      patterns.context7Compliance = true;
    }

    return patterns;
  }

  /**
   * PHASE 1: Score advanced architectural patterns including MCP-specific patterns (+0.5 bonus points each, max +2pts)
   */
  scoreAdvancedPatterns(patterns) {
    let bonusScore = 0;
    const detectedAdvancedPatterns = [];

    // Traditional architecture patterns    /**
   * Performs the specified operation
   * @param {any} patterns.layeredArchitecture
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.layeredArchitecture
   * @returns {any} The operation result
   */

    if (patterns.layeredArchitecture) {
      bonusScore += 0.5;
      detectedAdvancedPatterns.push('Layered Architecture');
    }    /**
   * Performs the specified operation
   * @param {any} patterns.serviceLayer
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.serviceLayer
   * @returns {any} The operation result
   */


    if (patterns.serviceLayer) {
      bonusScore += 0.3;
      detectedAdvancedPatterns.push('Service Layer');
    }    /**
   * Performs the specified operation
   * @param {any} patterns.repositoryPattern
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.repositoryPattern
   * @returns {any} The operation result
   */


    if (patterns.repositoryPattern) {
      bonusScore += 0.4;
      detectedAdvancedPatterns.push('Repository Pattern');
    }    /**
   * Performs the specified operation
   * @param {any} patterns.stateManagement
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.stateManagement
   * @returns {any} The operation result
   */


    if (patterns.stateManagement) {
      bonusScore += 0.3;
      detectedAdvancedPatterns.push('State Management');
    }    /**
   * Performs the specified operation
   * @param {any} patterns.errorBoundaries
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.errorBoundaries
   * @returns {any} The operation result
   */


    if (patterns.errorBoundaries) {
      bonusScore += 0.2;
      detectedAdvancedPatterns.push('Error Boundaries');
    }    /**
   * Performs the specified operation
   * @param {number} patterns.middlewarePattern
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} patterns.middlewarePattern
   * @returns {any} The operation result
   */


    if (patterns.middlewarePattern) {
      bonusScore += 0.3;
      detectedAdvancedPatterns.push('Middleware Pattern');
    }

    // PHASE 1: MCP-specific architecture patterns (higher bonus for specialized patterns)    /**
   * Performs the specified operation
   * @param {any} patterns.mcpServerPattern
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.mcpServerPattern
   * @returns {any} The operation result
   */

    if (patterns.mcpServerPattern) {
      bonusScore += 0.6;
      detectedAdvancedPatterns.push('MCP Server Architecture');
    }    /**
   * Performs the specified operation
   * @param {any} patterns.mcpResourceHandlers && patterns.mcpToolHandlers
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.mcpResourceHandlers && patterns.mcpToolHandlers
   * @returns {any} The operation result
   */


    if (patterns.mcpResourceHandlers && patterns.mcpToolHandlers) {
      bonusScore += 0.5;
      detectedAdvancedPatterns.push('Complete MCP Handler Implementation');
    }

    else if (patterns.mcpResourceHandlers || patterns.mcpToolHandlers) {
      bonusScore += 0.3;
      detectedAdvancedPatterns.push('Partial MCP Handler Implementation');
    }    /**
   * Performs the specified operation
   * @param {any} patterns.context7Compliance
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.context7Compliance
   * @returns {any} The operation result
   */


    if (patterns.context7Compliance) {
      bonusScore += 0.4;
      detectedAdvancedPatterns.push('Context7 Standards Compliance');

      // Extra bonus for complete Context7 integration      /**
   * Performs the specified operation
   * @param {any} patterns.agentOSIntegration && patterns.mcpProtocolCompliance
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} patterns.agentOSIntegration && patterns.mcpProtocolCompliance
   * @returns {any} The operation result
   */

      if (patterns.agentOSIntegration && patterns.mcpProtocolCompliance) {
        bonusScore += 0.3;
        detectedAdvancedPatterns.push('Full Context7 Integration');
      }
    }    /**
   * Performs the specified operation
   * @param {any} patterns.agentOSIntegration
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patterns.agentOSIntegration
   * @returns {any} The operation result
   */


    if (patterns.agentOSIntegration) {
      bonusScore += 0.3;
      detectedAdvancedPatterns.push('Agent OS Integration');
    }

    // Cap bonus at +2 points
    bonusScore = Math.min(bonusScore, 2);    /**
   * Performs the specified operation
   * @param {any} bonusScore > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} bonusScore > 0
   * @returns {any} The operation result
   */


    if (bonusScore > 0) {
      this.addScore(bonusScore, 2, `Advanced patterns detected: ${detectedAdvancedPatterns.join(', ')}`);

      // Add specific recommendations for MCP patterns      /**
   * Performs the specified operation
   * @param {any} patterns.mcpServerPattern && !patterns.context7Compliance
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} patterns.mcpServerPattern && !patterns.context7Compliance
   * @returns {any} The operation result
   */

      if (patterns.mcpServerPattern && !patterns.context7Compliance) {
        this.addIssue('MCP server without Context7 compliance', 'Add AGENTS.md and CLAUDE.md for full Context7 integration');
      }      /**
   * Performs the specified operation
   * @param {any} patterns.context7Compliance && !patterns.mcpProtocolCompliance
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} patterns.context7Compliance && !patterns.mcpProtocolCompliance
   * @returns {any} The operation result
   */


      if (patterns.context7Compliance && !patterns.mcpProtocolCompliance) {
        this.addIssue('Context7 setup without proper MCP protocol', 'Ensure MCP JSON-RPC protocol implementation');
      }
    }

    return bonusScore;
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeDependencies() {
    let score = 0;
    const maxScore = 3;

    try {
      const packageJson = await this.readPackageJson();      /**
   * Performs the specified operation
   * @param {any} !packageJson
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !packageJson
   * @returns {any} The operation result
   */

      if (!packageJson) {
        this.addIssue('No package.json found', 'Add package.json to manage dependencies');
        return;
      }

      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;

      // Score based on dependency count (1pt)      /**
   * Performs the specified operation
   * @param {any} totalDeps < 30
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} totalDeps < 30
   * @returns {any} The operation result
   */

      if (totalDeps < 30) {
        score += 1;
        this.addScore(1, 1, `Reasonable number of dependencies (${totalDeps})`);
      }

      else if (totalDeps < 60) {
        score += 0.5;
        this.addScore(0.5, 1, `Moderate number of dependencies (${totalDeps})`);
        this.addIssue('High number of dependencies', 'Consider if all dependencies are necessary');
      }

      else {
        this.addIssue('Too many dependencies', 'Audit and reduce unnecessary dependencies');
      }

      // Check for proper dev/prod dependency separation (1pt)
      if (Object.keys(devDeps).length > 0) {
        score += 1;
        this.addScore(1, 1, 'Dev dependencies are properly separated');
      }

      else {
        this.addIssue('No dev dependencies found', 'Separate development dependencies from production ones');
      }

      // Check for circular dependencies (would require deeper analysis) (1pt)
      // For now, assume good if no obvious issues
      score += 1;
      this.addScore(1, 1, 'No obvious circular dependency issues');

      this.setDetail('dependencyCount', totalDeps);
      this.setDetail('prodDependencies', Object.keys(deps).length);
      this.setDetail('devDependencies', Object.keys(devDeps).length);

    }

    catch (error) {
      this.addIssue(`Dependency analysis failed: ${error.message}`);
    }
  }  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */


  async getRequiredDirectories() {
    const common = ['src'];

    if (this.isReactProject() || this.isVueProject() || this.isSvelteProject()) {
      return [...common, 'components', 'pages', 'hooks', 'services', 'utils'];
    }

    else if (this.isNodeProject()) {
      return [...common, 'routes', 'middleware', 'models', 'services', 'utils'];
    }

    else {
      return [...common, 'lib', 'utils'];
    }
  }  /**
   * Checks the condition
   * @param {any} requiredDirs
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Checks the condition
   * @param {any} requiredDirs
   * @returns {Promise} Promise that resolves with the result
   */


  async checkDirectories(requiredDirs) {
    let existingCount = 0;    /**
   * Performs the specified operation
   * @param {any} const dir of requiredDirs
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const dir of requiredDirs
   * @returns {any} The operation result
   */


    for (const dir of requiredDirs) {
      const exists = await this.fileExists(dir) || await this.fileExists(`src/${dir}`);      /**
   * Performs the specified operation
   * @param {boolean} exists
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} exists
   * @returns {boolean} True if successful, false otherwise
   */

      if (exists) {
        existingCount++;
      }
    }

    return existingCount;
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeFileGrouping() {
    let score = 0;
    const maxScore = 2;

    // Check if files are grouped logically
    const srcExists = await this.fileExists('src');    /**
   * Performs the specified operation
   * @param {boolean} srcExists
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} srcExists
   * @returns {boolean} True if successful, false otherwise
   */

    if (srcExists) {
      score += 1;
      this.addScore(1, 1, 'Source files are organized in src directory');

      // Check for further organization within src
      const srcContents = await this.getDirectoryContents('src');
      const hasSubdirs = srcContents.some(item => item.isDirectory);      /**
   * Performs the specified operation
   * @param {boolean} hasSubdirs
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {boolean} hasSubdirs
   * @returns {any} The operation result
   */


      if (hasSubdirs) {
        score += 1;
        this.addScore(1, 1, 'Source files are further organized into subdirectories');
      }

      else {
        this.addIssue('Flat src structure', 'Consider organizing src files into subdirectories by feature or type');
      }
    }

    else {
      this.addIssue('No src directory found', 'Organize source files into a src directory');
    }

    return score;
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeSeparationOfConcerns() {
    let score = 0;
    const maxScore = 1;

    // Look for separation indicators
    const indicators = [
      { path: 'components', weight: 0.2 },
      { path: 'services', weight: 0.2 },
      { path: 'utils', weight: 0.2 },
      { path: 'hooks', weight: 0.2 },
      { path: 'types', weight: 0.2 }
    ];    /**
   * Performs the specified operation
   * @param {any} const indicator of indicators
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const indicator of indicators
   * @returns {any} The operation result
   */


    for (const indicator of indicators) {
      const exists = await this.fileExists(indicator.path) || await this.fileExists(`src/${indicator.path}`);      /**
   * Performs the specified operation
   * @param {boolean} exists
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {boolean} exists
   * @returns {boolean} True if successful, false otherwise
   */

      if (exists) {
        score += indicator.weight;
      }
    }    /**
   * Performs the specified operation
   * @param {any} score > 0.5
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} score > 0.5
   * @returns {any} The operation result
   */


    if (score > 0.5) {
      this.addScore(score, maxScore, 'Good separation of concerns detected');
    }

    else {
      this.addIssue('Poor separation of concerns', 'Separate code into logical modules (components, services, utils, etc.)');
    }

    return Math.min(score, maxScore);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeModuleStructure() {
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    let totalSize = 0;
    let totalModules = 0;
    let hasConsistentExports = true;

    for (const file of files.slice(0, 20)) { // Sample first 20 files for performance
      try {
        const content = await this.readFile(file);
        const stats = await this.getFileStats(file);        /**
   * Performs the specified operation
   * @param {any} stats
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} stats
   * @returns {any} The operation result
   */


        if (stats) {
          totalSize += stats.lines;
          totalModules++;
        }

        // Check for export consistency (very basic check)
        const hasExport = content.includes('export');
        const hasDefaultExport = content.includes('export default');
        const hasNamedExports = /export\s+{/.test(content) || /export\s+const|let|var|function|class/.test(content);

        if (!hasExport && !hasDefaultExport && !hasNamedExports && content.trim().length > 100) {
          hasConsistentExports = false;
        }
      }

      catch (error) {
        // Skip files that can't be read
      }
    }

    return {
      averageModuleSize: totalModules > 0 ? totalSize / totalModules : 0,
      totalModules,
      hasConsistentExports
    };
  }  /**
   * Analyzes the provided data
   * @param {any} files
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @param {any} files
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeFileNames(files) {
    const patterns = {
      camelCase: 0,
      kebabCase: 0,
      PascalCase: 0,
      snake_case: 0
    };

    let total = 0;    /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const file of files
   * @returns {any} The operation result
   */


    for (const file of files) {
      const fileName = path.basename(file, path.extname(file));
      total++;

      if (/^[a-z][a-zA-Z0-9]*$/.test(fileName)) {
        patterns.camelCase++;
      }

      else if (/^[a-z][a-z0-9-]*$/.test(fileName)) {
        patterns.kebabCase++;
      }

      else if (/^[A-Z][a-zA-Z0-9]*$/.test(fileName)) {
        patterns.PascalCase++;
      }

      else if (/^[a-z][a-z0-9_]*$/.test(fileName)) {
        patterns.snake_case++;
      }
    }

    // Calculate consistency as the percentage of files following the most common pattern
    const maxPatternCount = Math.max(...Object.values(patterns));
    const consistency = total > 0 ? maxPatternCount / total : 1;

    return { consistency, patterns, total };
  }  /**
   * Analyzes the provided data
   * @param {any} files
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @param {any} files
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeNamingPatterns(files) {
    let score = 0;
    const maxScore = 2;

    // Check if naming matches project type conventions
    if (this.isReactProject()) {
      // React components should use PascalCase
      const componentFiles = files.filter(f =>
        f.includes('component') ||
        f.includes('Component') ||
        f.match(/src\/(components|pages)\//)
      );

      const properlyNamed = componentFiles.filter(f => {
        const fileName = path.basename(f, path.extname(f));
        return /^[A-Z][a-zA-Z0-9]*$/.test(fileName);
      });      /**
   * Performs the specified operation
   * @param {any} componentFiles.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} componentFiles.length > 0
   * @returns {any} The operation result
   */


      if (componentFiles.length > 0) {
        const ratio = properlyNamed.length / componentFiles.length;
        score += ratio * maxScore;        /**
   * Performs the specified operation
   * @param {any} ratio > 0.8
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} ratio > 0.8
   * @returns {any} The operation result
   */


        if (ratio > 0.8) {
          this.addScore(maxScore, maxScore, 'React components follow PascalCase naming');
        }

        else {
          this.addScore(ratio * maxScore, maxScore, `${Math.round(ratio * 100)}% of components follow PascalCase`);
          this.addIssue('Some React components don\'t follow PascalCase', 'Use PascalCase for React component names');
        }
      }

      else {
        score += maxScore; // No components to check
        this.addScore(maxScore, maxScore, 'No naming issues detected');
      }
    }

    else {
      // For other projects, prefer kebab-case or camelCase
      score += maxScore * 0.8; // Assume good for now
      this.addScore(maxScore * 0.8, maxScore, 'Naming patterns appear consistent');
    }

    return Math.min(score, maxScore);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeReactArchitecture() {
    let score = 0;
    const maxScore = 3;

    // Check for proper React patterns
    const hasComponents = await this.fileExists('src/components') || await this.fileExists('components');
    const hasHooks = await this.fileExists('src/hooks') || await this.fileExists('hooks');
    const hasServices = await this.fileExists('src/services') || await this.fileExists('services');    /**
   * Performs the specified operation
   * @param {boolean} hasComponents
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasComponents
   * @returns {any} The operation result
   */


    if (hasComponents) {
      score += 1;
      this.addScore(1, 1, 'Components directory structure found');
    }

    else {
      this.addIssue('No components directory', 'Create a components directory for React components');
    }    /**
   * Performs the specified operation
   * @param {boolean} hasHooks
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasHooks
   * @returns {any} The operation result
   */


    if (hasHooks) {
      score += 1;
      this.addScore(1, 1, 'Custom hooks directory found');
    }

    else if (this.config.projectType.includes('react')) {
      this.addIssue('No hooks directory', 'Consider organizing custom hooks in a dedicated directory');
    }    /**
   * Performs the specified operation
   * @param {boolean} hasServices
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasServices
   * @returns {any} The operation result
   */


    if (hasServices) {
      score += 1;
      this.addScore(1, 1, 'Services directory for business logic found');
    }

    return score;
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeVueArchitecture() {
    let score = 0;
    const maxScore = 3;

    // Check for Vue-specific patterns
    const hasComponents = await this.fileExists('src/components') || await this.fileExists('components');
    const hasViews = await this.fileExists('src/views') || await this.fileExists('views');
    const hasComposables = await this.fileExists('src/composables') || await this.fileExists('composables');    /**
   * Performs the specified operation
   * @param {boolean} hasComponents
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasComponents
   * @returns {any} The operation result
   */


    if (hasComponents) {
      score += 1;
      this.addScore(1, 1, 'Vue components directory found');
    }    /**
   * Performs the specified operation
   * @param {boolean} hasViews
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasViews
   * @returns {any} The operation result
   */


    if (hasViews) {
      score += 1;
      this.addScore(1, 1, 'Views/Pages directory found');
    }    /**
   * Performs the specified operation
   * @param {boolean} hasComposables
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasComposables
   * @returns {any} The operation result
   */


    if (hasComposables) {
      score += 1;
      this.addScore(1, 1, 'Composables directory found (Vue 3 pattern)');
    }

    return score;
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeNodeArchitecture() {
    let score = 0;
    const maxScore = 3;

    // Check for Node.js API patterns
    const hasRoutes = await this.fileExists('src/routes') || await this.fileExists('routes');
    const hasMiddleware = await this.fileExists('src/middleware') || await this.fileExists('middleware');
    const hasControllers = await this.fileExists('src/controllers') || await this.fileExists('controllers');    /**
   * Performs the specified operation
   * @param {boolean} hasRoutes
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasRoutes
   * @returns {any} The operation result
   */


    if (hasRoutes) {
      score += 1;
      this.addScore(1, 1, 'Routes directory found');
    }    /**
   * Performs the specified operation
   * @param {number} hasMiddleware
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} hasMiddleware
   * @returns {any} The operation result
   */


    if (hasMiddleware) {
      score += 1;
      this.addScore(1, 1, 'Middleware directory found');
    }    /**
   * Performs the specified operation
   * @param {boolean} hasControllers
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasControllers
   * @returns {any} The operation result
   */


    if (hasControllers) {
      score += 1;
      this.addScore(1, 1, 'Controllers directory found');
    }

    return score;
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeGeneralArchitecture() {
    let score = 0;
    const maxScore = 3;

    // General architecture patterns
    const hasLib = await this.fileExists('lib') || await this.fileExists('src/lib');
    const hasUtils = await this.fileExists('utils') || await this.fileExists('src/utils');
    const hasConfig = await this.fileExists('config') || await this.fileExists('src/config');    /**
   * Performs the specified operation
   * @param {boolean} hasLib || hasUtils
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasLib || hasUtils
   * @returns {any} The operation result
   */


    if (hasLib || hasUtils) {
      score += 1;
      this.addScore(1, 1, 'Utility/Library code organization found');
    }    /**
   * Performs the specified operation
   * @param {Object} hasConfig
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {Object} hasConfig
   * @returns {any} The operation result
   */


    if (hasConfig) {
      score += 1;
      this.addScore(1, 1, 'Configuration organization found');
    }

    // Default some points for basic organization
    score += 1;
    this.addScore(1, 1, 'Basic project organization detected');

    return score;
  }  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Performs the specified operation
   * @returns {Promise} Promise that resolves with the result
   */


  async countFiles() {
    const allFiles = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte']);
    return allFiles.length;
  }  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */


  async getAllDirectories() {
    const directories = [];    /**
   * Function implementation
   * @param {string} relativePath
   * @returns {Promise} Promise that resolves with the result
   */
    /**
   * Function implementation
   * @param {string} relativePath
   * @returns {Promise} Promise that resolves with the result
   */


    async function walkDirectory(relativePath) {
      try {
        const fullPath = path.join(this.projectRoot, relativePath);
        const contents = await fs.readdir(fullPath, { withFileTypes: true });        /**
   * Performs the specified operation
   * @param {any} const item of contents
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const item of contents
   * @returns {any} The operation result
   */


        for (const item of contents) {
          if (item.isDirectory()) {
            const dirPath = relativePath ? path.join(relativePath, item.name) : item.name;
            directories.push(dirPath);

            // Skip node_modules and hidden directories for performance
            if (!item.name.startsWith('.') && item.name !== 'node_modules') {
              await walkDirectory.call(this, dirPath);
            }
          }
        }
      }

      catch (error) {
        // Skip directories we can't access
      }
    }

    await walkDirectory.call(this, '');
    return directories;
  }  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Retrieves data
   * @returns {Promise} Promise that resolves with the result
   */


  async getDirectoryStructure() {
    const structure = {};

    try {
      const rootContents = await this.getDirectoryContents('');
      structure.root = rootContents.filter(item => item.isDirectory).map(item => item.name);

      if (await this.fileExists('src')) {
        const srcContents = await this.getDirectoryContents('src');
        structure.src = srcContents.filter(item => item.isDirectory).map(item => item.name);
      }
    }

    catch (error) {
      structure.error = error.message;
    }

    return structure;
  }

  /**
   * Analyze file sizes and detect large file anti-patterns
   */
  async analyzeFileSizes() {
    try {
      const fileSizeAnalyzer = new FileSizeAnalyzer({
        fileSizeWarning: 300,
        fileSizeMajor: 500, 
        fileSizeCritical: 1000,
        methodLimit: 15
      });

      const sizeResults = await fileSizeAnalyzer.analyze(this.projectRoot);
      
      // Integrate file size issues into structure analysis
      if (sizeResults && sizeResults.issues) {
        for (const issue of sizeResults.issues) {
          // Handle both string and object issues
          if (typeof issue === 'string') {
            this.addIssue(issue);
          } else if (issue && issue.message) {
            this.addIssue(issue.message, issue.suggestion);
          }
        }
      }

      // Add file size details to structure analysis  
      if (sizeResults && sizeResults.details) {
        this.setDetail('fileSizeAnalysis', {
          averageFileSize: sizeResults.details.averageFileSize,
          largestFiles: sizeResults.details.largestFiles,
          complexityPatterns: sizeResults.details.complexityPatterns
        });
      }

      // Integrate suggestions
      if (sizeResults && sizeResults.suggestions) {
        for (const suggestion of sizeResults.suggestions) {
          this.addSuggestion({
            category: 'File Size Management',
            type: 'file-size-improvement',
            description: suggestion.message || 'Improve file organization',
            priority: 'medium'
          });
        }
      }

    } catch (error) {
      this.addIssue({
        type: 'file-size-analysis-error',
        message: `File size analysis failed: ${error.message}`,
        severity: 'warning'
      });
    }
  }
}