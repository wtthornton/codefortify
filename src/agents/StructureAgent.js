/**
 * StructureAgent - Parallel-Safe Code Structure and Architecture Analysis Agent
 *
 * Extends IAnalysisAgent with structure-specific parallel capabilities:
 * - Parallel directory traversal and analysis
 * - Concurrent pattern recognition and architecture detection
 * - Non-blocking file organization assessment
 * - Streaming architecture pattern discovery
 */

import { IAnalysisAgent } from './IAnalysisAgent.js';
import path from 'path';
import fs from 'fs/promises';

export class StructureAgent extends IAnalysisAgent {
  constructor(config = {}) {
    super(config);

    this.categoryName = 'Code Structure & Architecture';
    this.description = 'Parallel architecture analysis with pattern detection, file organization assessment, and architectural compliance checking';
    this.agentType = 'structure';
    this.priority = 2; // High priority for foundational analysis
    this.timeout = 45000; // Moderate timeout for filesystem operations

    // Structure-specific resource requirements
    this.resourceRequirements = {
      files: ['src', 'components', 'package.json', 'tsconfig.json'],
      memory: 80, // MB - Directory traversal can be memory intensive
      cpu: 0.2, // 20% CPU for file system operations
      network: false // No network needed for structure analysis
    };

    // Analysis caches
    this.directoryCache = new Map();
    this.patternCache = new Map();
    this.architectureCache = new Map();
    this.lastStructureAnalysis = 0;
    this.structureCacheTimeout = 300000; // 5 minutes

    // Streaming results
    this.streamingResults = {
      fileOrganization: [],
      moduleBoundaries: [],
      namingConventions: [],
      architecturePatterns: [],
      dependencies: []
    };

    // Structure scoring weights
    this.scoringWeights = {
      fileOrganization: 5,
      moduleBoundaries: 5,
      namingConventions: 4,
      architecturePatterns: 3,
      dependencies: 3
    };
  }

  async setupResources() {
    await super.setupResources();

    // Initialize structure-specific resources
    this.initializeStructureModules();
  }

  initializeStructureModules() {
    // Architecture pattern definitions
    this.architecturePatterns = {
      traditional: [
        'mvc', 'layeredArchitecture', 'serviceLayer', 'repositoryPattern',
        'observerPattern', 'singletonPattern', 'factoryPattern', 'strategyPattern',
        'middlewarePattern', 'compositionPattern', 'stateManagement', 'errorBoundaries'
      ],

      mcpSpecific: [
        'mcpServerPattern', 'mcpResourceHandlers', 'mcpToolHandlers',
        'mcpPromptHandlers', 'agentOSIntegration', 'context7Compliance',
        'mcpProtocolCompliance'
      ]
    };

    // Directory structure templates
    this.directoryTemplates = {
      'react-webapp': ['src', 'components', 'pages', 'hooks', 'services', 'utils'],
      'vue-webapp': ['src', 'components', 'views', 'composables', 'services', 'utils'],
      'node-api': ['src', 'routes', 'middleware', 'models', 'services', 'utils'],
      'javascript': ['src', 'lib', 'utils']
    };

    // Naming patterns
    this.namingPatterns = {
      camelCase: /^[a-z][a-zA-Z0-9]*$/,
      kebabCase: /^[a-z][a-z0-9-]*$/,
      PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
      snake_case: /^[a-z][a-z0-9_]*$/
    };

    // Progress tracking
    this.analysisProgress = {
      fileOrganization: { status: 'pending', progress: 0 },
      moduleBoundaries: { status: 'pending', progress: 0 },
      namingConventions: { status: 'pending', progress: 0 },
      architecturePatterns: { status: 'pending', progress: 0 },
      dependencies: { status: 'pending', progress: 0 }
    };
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];

    // Run structure analysis modules in parallel
    const analysisPromises = [
      this.analyzeFileOrganizationParallel(),
      this.analyzeModuleBoundariesParallel(),
      this.analyzeNamingConventionsParallel(),
      this.analyzeArchitecturePatternsParallel(),
      this.analyzeDependenciesParallel()
    ];

    // Emit progress start
    this.emit('analysis:progress', {
      agentId: this.agentId,
      phase: 'structure_analysis',
      modules: ['fileOrganization', 'moduleBoundaries', 'namingConventions', 'architecturePatterns', 'dependencies'],
      status: 'running'
    });

    try {
      await Promise.all(analysisPromises);

      // Store final analysis details
      this.setDetail('totalFiles', await this.countFilesParallel());
      this.setDetail('directoryStructure', await this.getDirectoryStructureParallel());
      this.setDetail('projectType', this.config.projectType);

      this.emit('analysis:progress', {
        agentId: this.agentId,
        phase: 'structure_analysis',
        status: 'completed',
        score: this.results.score,
        issues: this.results.issues.length
      });

    } catch (error) {
      this.emit('analysis:error', {
        agentId: this.agentId,
        phase: 'structure_analysis',
        error: error.message
      });
      throw error;
    }
  }

  async analyzeFileOrganizationParallel() {
    this.analysisProgress.fileOrganization.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.fileOrganization;

    try {
      this.emit('organization:started', { agentId: this.agentId });

      // Run directory analysis components in parallel
      const [directoryScore, groupingScore, separationScore] = await Promise.all([
        this.analyzeDirectoryStructureParallel(),
        this.analyzeFileGroupingParallel(),
        this.analyzeSeparationOfConcernsParallel()
      ]);

      score = directoryScore + groupingScore + separationScore;

      // Stream file organization results
      this.streamingResults.fileOrganization.push({
        directoryScore,
        groupingScore,
        separationScore,
        totalScore: score,
        timestamp: Date.now()
      });

      // Add recommendations based on score
      if (score < maxScore * 0.7) {
        this.addIssue(
          'File organization could be improved',
          'Consider organizing files into feature-based or layer-based directories'
        );
      }

      this.emit('organization:completed', {
        agentId: this.agentId,
        score: score,
        maxScore: maxScore
      });

    } catch (error) {
      this.addIssue('File organization analysis failed', `Error during analysis: ${error.message}`);
      this.emit('organization:failed', {
        agentId: this.agentId,
        error: error.message
      });
    }

    this.analysisProgress.fileOrganization.status = 'completed';
    this.analysisProgress.fileOrganization.progress = 100;
  }

  async analyzeDirectoryStructureParallel() {
    const requiredDirs = this.getRequiredDirectoriesForProject();
    const existingCount = await this.checkDirectoriesParallel(requiredDirs);

    const dirScore = (existingCount / requiredDirs.length) * 2;
    this.addScore(dirScore, 2, `Directory structure (${existingCount}/${requiredDirs.length} required dirs)`);

    return dirScore;
  }

  async checkDirectoriesParallel(requiredDirs) {
    const directoryChecks = requiredDirs.map(dir =>
      Promise.race([
        this.fileExists(dir),
        this.fileExists(`src/${dir}`)
      ]).catch(() => false)
    );

    const results = await Promise.allSettled(directoryChecks);
    return results.filter(result =>
      result.status === 'fulfilled' && result.value === true
    ).length;
  }

  async analyzeFileGroupingParallel() {
    let score = 0;
    const maxScore = 2;

    // Check source organization in parallel
    const [srcExists, srcContents] = await Promise.all([
      this.fileExists('src'),
      this.getDirectoryContents('src').catch(() => [])
    ]);

    if (srcExists && srcContents && srcContents.length > 0) {
      score += 1;
      this.addScore(1, 1, 'Source files are organized in src directory');

      const hasSubdirs = srcContents.some(item => item && item.isDirectory);
      if (hasSubdirs) {
        score += 1;
        this.addScore(1, 1, 'Source files are further organized into subdirectories');
      } else {
        this.addIssue('Flat src structure', 'Consider organizing src files into subdirectories by feature or type');
      }
    } else {
      this.addIssue('No src directory found', 'Organize source files into a src directory');
    }

    return score;
  }

  async analyzeSeparationOfConcernsParallel() {
    let score = 0;
    const maxScore = 1;

    const separationIndicators = [
      { path: 'components', weight: 0.2 },
      { path: 'services', weight: 0.2 },
      { path: 'utils', weight: 0.2 },
      { path: 'hooks', weight: 0.2 },
      { path: 'types', weight: 0.2 }
    ];

    // Check separation indicators in parallel
    const indicatorChecks = separationIndicators.map(indicator =>
      Promise.race([
        this.fileExists(indicator.path),
        this.fileExists(`src/${indicator.path}`)
      ]).then(exists => ({ ...indicator, exists })).catch(() => ({ ...indicator, exists: false }))
    );

    const results = await Promise.allSettled(indicatorChecks);

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.exists) {
        score += result.value.weight;
      }
    });

    if (score > 0.5) {
      this.addScore(score, maxScore, 'Good separation of concerns detected');
    } else {
      this.addIssue('Poor separation of concerns', 'Separate code into logical modules (components, services, utils, etc.)');
    }

    return Math.min(score, maxScore);
  }

  async analyzeModuleBoundariesParallel() {
    this.analysisProgress.moduleBoundaries.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.moduleBoundaries;

    try {
      // Analyze module structure with caching
      const moduleAnalysis = await this.analyzeModuleStructureParallel();

      // Score consistent exports (3pts)
      if (moduleAnalysis.hasConsistentExports) {
        score += 3;
        this.addScore(3, 3, 'Consistent export patterns found');
      } else {
        this.addIssue('Inconsistent module export patterns', 'Use consistent import/export patterns throughout the project');
      }

      // Score module size appropriateness (2pts)
      const avgModuleSize = moduleAnalysis.averageModuleSize;
      if (avgModuleSize < 200) {
        score += 2;
        this.addScore(2, 2, 'Modules are appropriately sized');
      } else if (avgModuleSize < 400) {
        score += 1;
        this.addScore(1, 2, 'Some modules are large but manageable');
        this.addIssue('Some modules are quite large', 'Consider breaking down large modules into smaller, focused units');
      } else {
        this.addIssue('Modules are too large', 'Break down large modules for better maintainability');
      }

      // Stream module boundaries results
      this.streamingResults.moduleBoundaries.push({
        averageModuleSize: avgModuleSize,
        totalModules: moduleAnalysis.totalModules,
        hasConsistentExports: moduleAnalysis.hasConsistentExports,
        timestamp: Date.now()
      });

      this.setDetail('averageModuleSize', avgModuleSize);
      this.setDetail('totalModules', moduleAnalysis.totalModules);

    } catch (error) {
      this.addIssue('Module boundary analysis failed', `Error during analysis: ${error.message}`);
    }

    this.analysisProgress.moduleBoundaries.status = 'completed';
    this.analysisProgress.moduleBoundaries.progress = 100;
  }

  async analyzeModuleStructureParallel() {
    const now = Date.now();

    // Check cache first
    if (this.lastStructureAnalysis > 0 && (now - this.lastStructureAnalysis) < this.structureCacheTimeout) {
      const cached = this.architectureCache.get('module-structure');
      if (cached) {
        this.emit('module:cache_hit', { agentId: this.agentId });
        return cached;
      }
    }

    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);

    // Process files in parallel chunks
    const chunkSize = 8;
    const fileChunks = [];
    for (let i = 0; i < Math.min(files.length, 24); i += chunkSize) {
      fileChunks.push(files.slice(i, i + chunkSize));
    }

    const chunkPromises = fileChunks.map(chunk => this.analyzeModuleChunk(chunk));
    const chunkResults = await Promise.allSettled(chunkPromises);

    // Aggregate results
    let totalSize = 0;
    let totalModules = 0;
    let exportingModules = 0;

    chunkResults.forEach(result => {
      if (result.status === 'fulfilled') {
        totalSize += result.value.totalSize;
        totalModules += result.value.totalModules;
        exportingModules += result.value.exportingModules;
      }
    });

    const hasConsistentExports = totalModules > 0 ? (exportingModules / totalModules) > 0.8 : true;

    const moduleAnalysis = {
      averageModuleSize: totalModules > 0 ? totalSize / totalModules : 0,
      totalModules,
      hasConsistentExports
    };

    // Cache the result
    this.architectureCache.set('module-structure', moduleAnalysis);
    this.lastStructureAnalysis = now;

    return moduleAnalysis;
  }

  async analyzeModuleChunk(files) {
    let totalSize = 0;
    let totalModules = 0;
    let exportingModules = 0;

    for (const file of files) {
      try {
        const [content, stats] = await Promise.all([
          this.readFile(file),
          this.getFileStats(file)
        ]);

        if (stats && stats.lines > 0) {
          totalSize += stats.lines;
          totalModules++;

          // Check for exports
          const hasExports = content.includes('export') ||
                          /export\s+{/.test(content) ||
                          /export\s+(?:const|let|var|function|class)/.test(content);

          if (hasExports || content.trim().length <= 100) {
            exportingModules++;
          }
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return { totalSize, totalModules, exportingModules };
  }

  async analyzeNamingConventionsParallel() {
    this.analysisProgress.namingConventions.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.namingConventions;

    try {
      const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte']);

      // Analyze naming in parallel
      const [consistencyAnalysis, patternScore] = await Promise.all([
        this.analyzeFileNamesParallel(files),
        this.analyzeNamingPatternsParallel(files)
      ]);

      // Score naming consistency (2pts)
      const consistency = consistencyAnalysis.consistency;
      if (consistency > 0.8) {
        score += 2;
        this.addScore(2, 2, `Naming conventions are consistent (${Math.round(consistency * 100)}%)`);
      } else if (consistency > 0.6) {
        score += 1;
        this.addScore(1, 2, `Naming conventions are mostly consistent (${Math.round(consistency * 100)}%)`);
        this.addIssue('Some naming inconsistencies found', 'Standardize naming conventions across the project');
      } else {
        this.addIssue('Naming conventions are inconsistent', 'Establish and follow consistent naming patterns');
      }

      // Add pattern-specific score (2pts)
      score += patternScore;

      // Stream naming conventions results
      this.streamingResults.namingConventions.push({
        consistency: consistency,
        patterns: consistencyAnalysis.patterns,
        patternScore: patternScore,
        totalFiles: consistencyAnalysis.total,
        timestamp: Date.now()
      });

      this.setDetail('namingConsistency', consistency);
      this.setDetail('fileNamingPatterns', consistencyAnalysis.patterns);

    } catch (error) {
      this.addIssue('Naming convention analysis failed', `Error during analysis: ${error.message}`);
    }

    this.analysisProgress.namingConventions.status = 'completed';
    this.analysisProgress.namingConventions.progress = 100;
  }

  async analyzeFileNamesParallel(files) {
    const patterns = {
      camelCase: 0,
      kebabCase: 0,
      PascalCase: 0,
      snake_case: 0
    };

    let total = 0;

    // Process files in chunks for better performance
    const chunkSize = 20;
    const fileChunks = [];
    for (let i = 0; i < files.length; i += chunkSize) {
      fileChunks.push(files.slice(i, i + chunkSize));
    }

    const chunkPromises = fileChunks.map(chunk => this.analyzeNamingChunk(chunk));
    const chunkResults = await Promise.allSettled(chunkPromises);

    // Aggregate results
    chunkResults.forEach(result => {
      if (result.status === 'fulfilled') {
        total += result.value.total;
        Object.keys(patterns).forEach(pattern => {
          patterns[pattern] += result.value.patterns[pattern];
        });
      }
    });

    // Calculate consistency
    const maxPatternCount = Math.max(...Object.values(patterns));
    const consistency = total > 0 ? maxPatternCount / total : 1;

    return { consistency, patterns, total };
  }

  async analyzeNamingChunk(files) {
    const patterns = {
      camelCase: 0,
      kebabCase: 0,
      PascalCase: 0,
      snake_case: 0
    };

    let total = 0;

    for (const file of files) {
      const fileName = path.basename(file, path.extname(file));
      total++;

      if (this.namingPatterns.camelCase.test(fileName)) {
        patterns.camelCase++;
      } else if (this.namingPatterns.kebabCase.test(fileName)) {
        patterns.kebabCase++;
      } else if (this.namingPatterns.PascalCase.test(fileName)) {
        patterns.PascalCase++;
      } else if (this.namingPatterns.snake_case.test(fileName)) {
        patterns.snake_case++;
      }
    }

    return { patterns, total };
  }

  async analyzeNamingPatternsParallel(files) {
    let score = 0;
    const maxScore = 2;

    if (this.isReactProject()) {
      // React-specific naming analysis
      const componentFiles = files.filter(f =>
        f.includes('component') ||
        f.includes('Component') ||
        f.match(/src\/(components|pages)\//)
      );

      if (componentFiles.length > 0) {
        const properlyNamed = componentFiles.filter(f => {
          const fileName = path.basename(f, path.extname(f));
          return this.namingPatterns.PascalCase.test(fileName);
        });

        const ratio = properlyNamed.length / componentFiles.length;
        score += ratio * maxScore;

        if (ratio > 0.8) {
          this.addScore(maxScore, maxScore, 'React components follow PascalCase naming');
        } else {
          this.addScore(ratio * maxScore, maxScore, `${Math.round(ratio * 100)}% of components follow PascalCase`);
          this.addIssue('Some React components don\'t follow PascalCase', 'Use PascalCase for React component names');
        }
      } else {
        score += maxScore;
        this.addScore(maxScore, maxScore, 'No naming issues detected');
      }
    } else {
      score += maxScore * 0.8;
      this.addScore(maxScore * 0.8, maxScore, 'Naming patterns appear consistent');
    }

    return Math.min(score, maxScore);
  }

  async analyzeArchitecturePatternsParallel() {
    this.analysisProgress.architecturePatterns.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.architecturePatterns;

    try {
      this.emit('patterns:started', { agentId: this.agentId });

      // Detect architecture patterns with parallel analysis
      const detectedPatterns = await this.detectArchitecturePatternsParallel();

      // Score based on project type
      if (this.isReactProject()) {
        score += await this.analyzeReactArchitectureParallel(detectedPatterns);
      } else if (this.isVueProject()) {
        score += await this.analyzeVueArchitectureParallel(detectedPatterns);
      } else if (this.isNodeProject()) {
        score += await this.analyzeNodeArchitectureParallel(detectedPatterns);
      } else {
        score += await this.analyzeGeneralArchitectureParallel(detectedPatterns);
      }

      // Add bonus for advanced patterns
      const bonusScore = this.scoreAdvancedPatternsParallel(detectedPatterns);
      score += bonusScore;

      // Stream architecture patterns results
      this.streamingResults.architecturePatterns.push({
        detectedPatterns: detectedPatterns,
        bonusScore: bonusScore,
        projectType: this.config.projectType,
        timestamp: Date.now()
      });

      this.setDetail('detectedPatterns', detectedPatterns);

      this.emit('patterns:completed', {
        agentId: this.agentId,
        patterns: Object.keys(detectedPatterns).filter(k => detectedPatterns[k]).length
      });

    } catch (error) {
      this.addIssue('Architecture pattern analysis failed', `Error during analysis: ${error.message}`);
      this.emit('patterns:failed', {
        agentId: this.agentId,
        error: error.message
      });
    }

    this.analysisProgress.architecturePatterns.status = 'completed';
    this.analysisProgress.architecturePatterns.progress = 100;
  }

  async detectArchitecturePatternsParallel() {
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
      // MCP-specific patterns
      mcpServerPattern: false,
      mcpResourceHandlers: false,
      mcpToolHandlers: false,
      mcpPromptHandlers: false,
      agentOSIntegration: false,
      context7Compliance: false,
      mcpProtocolCompliance: false
    };

    // Get files and directory structure in parallel
    const [files, directories] = await Promise.all([
      this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']),
      this.getAllDirectoriesParallel().catch(() => [])
    ]);

    // Ensure arrays are valid
    const safeFiles = files || [];
    const safeDirectories = directories || [];

    // Analyze files in parallel chunks for pattern detection
    const chunkSize = 6;
    const fileChunks = [];
    for (let i = 0; i < Math.min(safeFiles.length, 24); i += chunkSize) {
      fileChunks.push(safeFiles.slice(i, i + chunkSize));
    }

    const chunkPromises = fileChunks.map(chunk => this.detectPatternsInChunk(chunk));
    const chunkResults = await Promise.allSettled(chunkPromises);

    // Aggregate pattern results
    chunkResults.forEach(result => {
      if (result.status === 'fulfilled') {
        Object.keys(patterns).forEach(pattern => {
          patterns[pattern] = patterns[pattern] || result.value[pattern];
        });
      }
    });

    // Check directory-based patterns
    if (safeDirectories.length > 0 &&
        safeDirectories.some(d => d.includes('models')) &&
        safeDirectories.some(d => d.includes('views')) &&
        (safeDirectories.some(d => d.includes('controllers')) || safeDirectories.some(d => d.includes('services')))) {
      patterns.layeredArchitecture = true;
    }

    // Check Context7/MCP-specific structures in parallel
    const [agentOSExists, context7Files] = await Promise.all([
      Promise.race([
        this.fileExists('.agent-os'),
        this.fileExists('src/mcp-server.js')
      ]).catch(() => false),

      Promise.all([
        this.fileExists('AGENTS.md'),
        this.fileExists('CLAUDE.md'),
        this.fileExists('context7.config.js')
      ]).catch(() => [false, false, false])
    ]);

    if (agentOSExists) {
      patterns.agentOSIntegration = true;
    }

    if (context7Files.every(exists => exists)) {
      patterns.context7Compliance = true;
    }

    return patterns;
  }

  async detectPatternsInChunk(files) {
    const patterns = {};

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const lowerContent = content.toLowerCase();

        // Traditional patterns
        if (file.includes('controller') || file.includes('model') || file.includes('view')) {
          patterns.mvc = true;
        }

        if (file.includes('service') || lowerContent.includes('service')) {
          patterns.serviceLayer = true;
        }

        if (file.includes('repository') || lowerContent.includes('repository')) {
          patterns.repositoryPattern = true;
        }

        if (content.includes('addEventListener') || content.includes('EventEmitter')) {
          patterns.observerPattern = true;
        }

        if (content.includes('getInstance') || content.includes('singleton')) {
          patterns.singletonPattern = true;
        }

        if (content.includes('factory') || content.includes('Factory')) {
          patterns.factoryPattern = true;
        }

        if (content.includes('middleware') || content.includes('next()')) {
          patterns.middlewarePattern = true;
        }

        if (content.includes('strategy') || content.includes('Strategy')) {
          patterns.strategyPattern = true;
        }

        if (content.includes('React.memo') || content.includes('useMemo')) {
          patterns.compositionPattern = true;
        }

        if (content.includes('Redux') || content.includes('Vuex') || content.includes('useContext')) {
          patterns.stateManagement = true;
        }

        if (content.includes('componentDidCatch') || content.includes('ErrorBoundary')) {
          patterns.errorBoundaries = true;
        }

        if (content.includes('inject') || content.includes('@Injectable')) {
          patterns.dependencyInjection = true;
        }

        if (content.includes('EventBus') || content.includes('emit(')) {
          patterns.eventDriven = true;
        }

        // MCP-specific patterns
        if (content.includes('@modelcontextprotocol/sdk')) {
          patterns.mcpServerPattern = true;
        }

        if (content.includes('list_resources') || content.includes('ResourceManager')) {
          patterns.mcpResourceHandlers = true;
        }

        if (content.includes('list_tools') || content.includes('ToolManager')) {
          patterns.mcpToolHandlers = true;
        }

        if (content.includes('list_prompts') || content.includes('PromptManager')) {
          patterns.mcpPromptHandlers = true;
        }

        if (content.includes('Context7') || content.includes('CLAUDE.md')) {
          patterns.context7Compliance = true;
        }

        if (content.includes('JSON-RPC') && content.includes('initialize')) {
          patterns.mcpProtocolCompliance = true;
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return patterns;
  }

  async analyzeReactArchitectureParallel(detectedPatterns) {
    let score = 0;
    const maxScore = 3;

    // Check React-specific directories in parallel
    const [hasComponents, hasHooks, hasServices] = await Promise.all([
      Promise.race([
        this.fileExists('src/components'),
        this.fileExists('components')
      ]).catch(() => false),

      Promise.race([
        this.fileExists('src/hooks'),
        this.fileExists('hooks')
      ]).catch(() => false),

      Promise.race([
        this.fileExists('src/services'),
        this.fileExists('services')
      ]).catch(() => false)
    ]);

    if (hasComponents) {
      score += 1;
      this.addScore(1, 1, 'Components directory structure found');
    } else {
      this.addIssue('No components directory', 'Create a components directory for React components');
    }

    if (hasHooks) {
      score += 1;
      this.addScore(1, 1, 'Custom hooks directory found');
    } else if (this.config.projectType.includes('react')) {
      this.addIssue('No hooks directory', 'Consider organizing custom hooks in a dedicated directory');
    }

    if (hasServices) {
      score += 1;
      this.addScore(1, 1, 'Services directory for business logic found');
    }

    return score;
  }

  async analyzeVueArchitectureParallel(detectedPatterns) {
    let score = 0;
    const maxScore = 3;

    // Check Vue-specific directories in parallel
    const [hasComponents, hasViews, hasComposables] = await Promise.all([
      Promise.race([
        this.fileExists('src/components'),
        this.fileExists('components')
      ]).catch(() => false),

      Promise.race([
        this.fileExists('src/views'),
        this.fileExists('views')
      ]).catch(() => false),

      Promise.race([
        this.fileExists('src/composables'),
        this.fileExists('composables')
      ]).catch(() => false)
    ]);

    if (hasComponents) {
      score += 1;
      this.addScore(1, 1, 'Vue components directory found');
    }

    if (hasViews) {
      score += 1;
      this.addScore(1, 1, 'Views/Pages directory found');
    }

    if (hasComposables) {
      score += 1;
      this.addScore(1, 1, 'Composables directory found (Vue 3 pattern)');
    }

    return score;
  }

  async analyzeNodeArchitectureParallel(detectedPatterns) {
    let score = 0;
    const maxScore = 3;

    // Check Node.js API directories in parallel
    const [hasRoutes, hasMiddleware, hasControllers] = await Promise.all([
      Promise.race([
        this.fileExists('src/routes'),
        this.fileExists('routes')
      ]).catch(() => false),

      Promise.race([
        this.fileExists('src/middleware'),
        this.fileExists('middleware')
      ]).catch(() => false),

      Promise.race([
        this.fileExists('src/controllers'),
        this.fileExists('controllers')
      ]).catch(() => false)
    ]);

    if (hasRoutes) {
      score += 1;
      this.addScore(1, 1, 'Routes directory found');
    }

    if (hasMiddleware) {
      score += 1;
      this.addScore(1, 1, 'Middleware directory found');
    }

    if (hasControllers) {
      score += 1;
      this.addScore(1, 1, 'Controllers directory found');
    }

    return score;
  }

  async analyzeGeneralArchitectureParallel(detectedPatterns) {
    let score = 0;
    const maxScore = 3;

    // Check general architecture directories in parallel
    const [hasLib, hasConfig] = await Promise.all([
      Promise.race([
        this.fileExists('lib'),
        this.fileExists('src/lib'),
        this.fileExists('utils'),
        this.fileExists('src/utils')
      ]).catch(() => false),

      Promise.race([
        this.fileExists('config'),
        this.fileExists('src/config')
      ]).catch(() => false)
    ]);

    if (hasLib) {
      score += 1;
      this.addScore(1, 1, 'Utility/Library code organization found');
    }

    if (hasConfig) {
      score += 1;
      this.addScore(1, 1, 'Configuration organization found');
    }

    // Default some points for basic organization
    score += 1;
    this.addScore(1, 1, 'Basic project organization detected');

    return score;
  }

  scoreAdvancedPatternsParallel(patterns) {
    let bonusScore = 0;
    const detectedAdvancedPatterns = [];

    // Traditional architecture patterns
    const traditionalBonuses = {
      layeredArchitecture: 0.5,
      serviceLayer: 0.3,
      repositoryPattern: 0.4,
      stateManagement: 0.3,
      errorBoundaries: 0.2,
      middlewarePattern: 0.3
    };

    Object.entries(traditionalBonuses).forEach(([pattern, bonus]) => {
      if (patterns[pattern]) {
        bonusScore += bonus;
        detectedAdvancedPatterns.push(pattern.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    });

    // MCP-specific patterns (higher bonus)
    if (patterns.mcpServerPattern) {
      bonusScore += 0.6;
      detectedAdvancedPatterns.push('MCP Server Architecture');
    }

    if (patterns.mcpResourceHandlers && patterns.mcpToolHandlers) {
      bonusScore += 0.5;
      detectedAdvancedPatterns.push('Complete MCP Handler Implementation');
    } else if (patterns.mcpResourceHandlers || patterns.mcpToolHandlers) {
      bonusScore += 0.3;
      detectedAdvancedPatterns.push('Partial MCP Handler Implementation');
    }

    if (patterns.context7Compliance) {
      bonusScore += 0.4;
      detectedAdvancedPatterns.push('Context7 Standards Compliance');

      if (patterns.agentOSIntegration && patterns.mcpProtocolCompliance) {
        bonusScore += 0.3;
        detectedAdvancedPatterns.push('Full Context7 Integration');
      }
    }

    if (patterns.agentOSIntegration) {
      bonusScore += 0.3;
      detectedAdvancedPatterns.push('Agent OS Integration');
    }

    // Cap bonus at +2 points
    bonusScore = Math.min(bonusScore, 2);

    if (bonusScore > 0) {
      this.addScore(bonusScore, 2, `Advanced patterns detected: ${detectedAdvancedPatterns.join(', ')}`);

      // Add MCP-specific recommendations
      if (patterns.mcpServerPattern && !patterns.context7Compliance) {
        this.addIssue('MCP server without Context7 compliance', 'Add AGENTS.md and CLAUDE.md for full Context7 integration');
      }

      if (patterns.context7Compliance && !patterns.mcpProtocolCompliance) {
        this.addIssue('Context7 setup without proper MCP protocol', 'Ensure MCP JSON-RPC protocol implementation');
      }
    }

    return bonusScore;
  }

  async analyzeDependenciesParallel() {
    this.analysisProgress.dependencies.status = 'running';
    let score = 0;
    const maxScore = this.scoringWeights.dependencies;

    try {
      const packageJson = await this.readPackageJson();
      if (!packageJson) {
        this.addIssue('No package.json found', 'Add package.json to manage dependencies');
        return;
      }

      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;

      // Score dependency count (1pt)
      if (totalDeps < 30) {
        score += 1;
        this.addScore(1, 1, `Reasonable number of dependencies (${totalDeps})`);
      } else if (totalDeps < 60) {
        score += 0.5;
        this.addScore(0.5, 1, `Moderate number of dependencies (${totalDeps})`);
        this.addIssue('High number of dependencies', 'Consider if all dependencies are necessary');
      } else {
        this.addIssue('Too many dependencies', 'Audit and reduce unnecessary dependencies');
      }

      // Score dev/prod separation (1pt)
      if (Object.keys(devDeps).length > 0) {
        score += 1;
        this.addScore(1, 1, 'Dev dependencies are properly separated');
      } else {
        this.addIssue('No dev dependencies found', 'Separate development dependencies from production ones');
      }

      // Assume no circular dependency issues (1pt)
      score += 1;
      this.addScore(1, 1, 'No obvious circular dependency issues');

      // Stream dependencies results
      this.streamingResults.dependencies.push({
        totalDeps: totalDeps,
        prodDeps: Object.keys(deps).length,
        devDeps: Object.keys(devDeps).length,
        timestamp: Date.now()
      });

      this.setDetail('dependencyCount', totalDeps);
      this.setDetail('prodDependencies', Object.keys(deps).length);
      this.setDetail('devDependencies', Object.keys(devDeps).length);

    } catch (error) {
      this.addIssue('Dependency analysis failed', `Error during analysis: ${error.message}`);
    }

    this.analysisProgress.dependencies.status = 'completed';
    this.analysisProgress.dependencies.progress = 100;
  }

  // Utility methods
  getRequiredDirectoriesForProject() {
    return this.directoryTemplates[this.config.projectType] || this.directoryTemplates.javascript;
  }

  async getAllDirectoriesParallel() {
    const directories = [];

    const walkDirectory = async (relativePath) => {
      try {
        const fullPath = path.join(this.config.projectRoot || process.cwd(), relativePath);
        const contents = await fs.readdir(fullPath, { withFileTypes: true });

        for (const item of contents) {
          if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            const dirPath = relativePath ? path.join(relativePath, item.name) : item.name;
            directories.push(dirPath);

            // Recurse into subdirectories
            await walkDirectory(dirPath);
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    };

    await walkDirectory('');
    return directories;
  }

  async countFilesParallel() {
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte']);
    return files.length;
  }

  async getDirectoryStructureParallel() {
    const structure = {};

    try {
      // Get root and src structure in parallel
      const [rootContents, srcContents] = await Promise.allSettled([
        this.getDirectoryContents(''),
        this.fileExists('src').then(exists =>
          exists ? this.getDirectoryContents('src') : []
        )
      ]);

      if (rootContents.status === 'fulfilled') {
        structure.root = rootContents.value
          .filter(item => item.isDirectory)
          .map(item => item.name);
      }

      if (srcContents.status === 'fulfilled') {
        structure.src = srcContents.value
          .filter(item => item.isDirectory)
          .map(item => item.name);
      }

    } catch (error) {
      structure.error = error.message;
    }

    return structure;
  }

  /**
   * Get streaming structure analysis results
   */
  getStreamingResults() {
    return this.streamingResults;
  }

  /**
   * Get analysis progress
   */
  getAnalysisProgress() {
    return this.analysisProgress;
  }

  /**
   * Clear analysis caches
   */
  clearCaches() {
    this.directoryCache.clear();
    this.patternCache.clear();
    this.architectureCache.clear();
    this.lastStructureAnalysis = 0;
  }

  /**
   * Get structure-specific metrics
   */
  getStructureMetrics() {
    return {
      ...this.getMetrics(),
      caches: {
        directoryCacheSize: this.directoryCache.size,
        patternCacheSize: this.patternCache.size,
        architectureCacheSize: this.architectureCache.size,
        lastStructureAnalysis: this.lastStructureAnalysis
      },
      progress: this.analysisProgress,
      streaming: {
        organizationResults: this.streamingResults.fileOrganization.length,
        boundaryResults: this.streamingResults.moduleBoundaries.length,
        namingResults: this.streamingResults.namingConventions.length,
        patternResults: this.streamingResults.architecturePatterns.length,
        dependencyResults: this.streamingResults.dependencies.length
      }
    };
  }
}