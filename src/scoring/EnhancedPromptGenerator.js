/**
 * Enhanced Prompt Generator - Creates small, perfect prompts for auto-execution
 *
 * Generates optimized prompts that can be leveraged by codefortify to auto-execute
 * recommendations with minimal tokens, cost, and maximum first-try success rate.
 */

import { PromptEnhancer } from '../enhancement/PromptEnhancer.js';
import { SuggestionGenerator } from '../monitoring/SuggestionGenerator.js';
import { PatternProvider } from '../server/PatternProvider.js';
import { ResourceManager } from '../server/ResourceManager.js';

/**


 * EnhancedPromptGenerator class implementation


 *


 * Provides functionality for enhancedpromptgenerator operations


 */


/**


 * EnhancedPromptGenerator class implementation


 *


 * Provides functionality for enhancedpromptgenerator operations


 */


export class EnhancedPromptGenerator {
  constructor(config = {}) {
    this.config = {
      maxPromptTokens: config.maxPromptTokens || 150, // Keep prompts small
      enableContextInjection: config.enableContextInjection !== false,
      optimizeForFirstTry: config.optimizeForFirstTry !== false,
      includeCodeExamples: config.includeCodeExamples !== false,
      enableLearning: config.enableLearning !== false,
      enablePatternInjection: config.enablePatternInjection !== false,
      enableSuggestionIntegration: config.enableSuggestionIntegration !== false,
      ...config
    };

    // Initialize all enhancement systems
    this.promptEnhancer = new PromptEnhancer({
      maxTokens: this.config.maxPromptTokens,
      contextRelevanceThreshold: 0.8, // High relevance for auto-execution
      projectRoot: config.projectRoot || process.cwd(),
      ...config
    });

    this.suggestionGenerator = new SuggestionGenerator({
      maxSuggestions: 5,
      suggestionPriority: {
        security: 'critical',
        performance: 'high',
        maintainability: 'medium',
        readability: 'low',
        testability: 'medium',
        complexity: 'high'
      }
    });

    this.patternProvider = new PatternProvider({
      projectType: config.projectType || 'javascript',
      ...config
    });

    this.resourceManager = new ResourceManager({
      projectRoot: config.projectRoot || process.cwd(),
      ...config
    });

    // Prompt templates for different recommendation types
    this.promptTemplates = this.initializePromptTemplates();

    // Learning system for continuous improvement
    this.learningSystem = {
      successRates: new Map(),
      feedbackHistory: new Map(),
      patternEffectiveness: new Map(),
      contextRelevance: new Map()
    };
  }

  /**
   * Generate enhanced prompt for a recommendation with full enhancement pipeline
   */
  async generateEnhancedPrompt(recommendation, projectContext = {}) {
    try {
      // Step 1: Get base template and build initial prompt
      const template = this.getTemplateForRecommendation(recommendation);      /**
   * Performs the specified operation
   * @param {any} !template
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !template
   * @returns {any} The operation result
   */

      if (!template) {
        return this.generateFallbackPrompt(recommendation);
      }

      const basePrompt = this.buildPromptFromTemplate(template, recommendation, projectContext);

      // Step 2: Generate comprehensive context using all enhancement systems
      const enhancedContext = await this.generateComprehensiveContext(recommendation, projectContext);

      // Step 3: Apply full enhancement pipeline
      const enhanced = await this.applyFullEnhancementPipeline(basePrompt, enhancedContext, recommendation);

      // Step 4: Apply learning-based optimizations
      const optimized = await this.applyLearningOptimizations(enhanced, recommendation);

      // Step 5: Final validation and metrics
      const finalPrompt = await this.validateAndFinalizePrompt(optimized, recommendation);

      // Step 6: Record for learning (if enabled)      /**
   * Performs the specified operation
   * @param {Object} this.config.enableLearning
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.enableLearning
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.enableLearning) {
        await this.recordPromptGeneration(recommendation, finalPrompt);
      }

      return finalPrompt;

    } catch (error) {
      // WARN: `⚠️  Enhanced prompt generation failed: ${error.message}`
      return this.generateFallbackPrompt(recommendation);
    }
  }

  /**
   * Generate comprehensive context using all enhancement systems
   */
  async generateComprehensiveContext(recommendation, projectContext) {
    const context = {
      projectType: projectContext.type || 'javascript',
      currentFile: projectContext.currentFile,
      recentFiles: projectContext.recentFiles || [],
      recommendation: recommendation,
      patterns: {},
      suggestions: {},
      documentation: {},
      examples: {},
      metrics: {}
    };

    try {
      // Get relevant patterns from PatternProvider      /**
   * Performs the specified operation
   * @param {Object} this.config.enablePatternInjection
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.enablePatternInjection
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.enablePatternInjection) {
        const patternType = this.getPatternTypeForRecommendation(recommendation);        /**
   * Performs the specified operation
   * @param {any} patternType
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} patternType
   * @returns {any} The operation result
   */

        if (patternType) {
          context.patterns = await this.patternProvider.getPattern(patternType, context.projectType);
        }
      }

      // Get additional suggestions from SuggestionGenerator      /**
   * Performs the specified operation
   * @param {Object} this.config.enableSuggestionIntegration
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.enableSuggestionIntegration
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.enableSuggestionIntegration) {
        const mockCode = this.generateMockCodeForRecommendation(recommendation);
        const mockIssues = this.generateMockIssuesForRecommendation(recommendation);
        context.suggestions = await this.suggestionGenerator.generateSuggestions(mockIssues, mockCode, context);
      }

      // Get relevant documentation from ResourceManager      /**
   * Performs the specified operation
   * @param {Object} this.config.enableContextInjection
   * @returns {boolean} True if successful, false otherwise
   */
      /**
   * Performs the specified operation
   * @param {Object} this.config.enableContextInjection
   * @returns {boolean} True if successful, false otherwise
   */

      if (this.config.enableContextInjection) {
        const technologies = this.extractTechnologiesFromRecommendation(recommendation);        /**
   * Performs the specified operation
   * @param {any} const tech of technologies
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} const tech of technologies
   * @returns {any} The operation result
   */

        for (const tech of technologies) {
          try {
            const docs = await this.resourceManager.getVersionSpecificDocs(tech);            /**
   * Performs the specified operation
   * @param {any} docs
   * @returns {any} The operation result
   */
            /**
   * Performs the specified operation
   * @param {any} docs
   * @returns {any} The operation result
   */

            if (docs) {
              context.documentation[tech] = docs;
            }
          } catch (error) {
            // Continue without this documentation
          }
        }
      }

      // Calculate context relevance metrics
      context.metrics = this.calculateContextMetrics(context);

    } catch (error) {
      // WARN: `⚠️  Context generation failed: ${error.message}`
    }

    return context;
  }

  /**
   * Apply full enhancement pipeline using PromptEnhancer
   */
  async applyFullEnhancementPipeline(basePrompt, context, recommendation) {
    // Use the sophisticated PromptEnhancer with full context
    const enhanced = await this.promptEnhancer.enhance(basePrompt, {
      projectType: context.projectType,
      currentFile: context.currentFile,
      recentFiles: context.recentFiles,
      patterns: context.patterns,
      suggestions: context.suggestions,
      documentation: context.documentation,
      recommendation: recommendation
    });

    // Add pattern-specific enhancements
    if (context.patterns && Object.keys(context.patterns).length > 0) {
      enhanced.enhancedPrompt = await this.injectPatternContext(enhanced.enhancedPrompt, context.patterns);
    }

    // Add suggestion-specific enhancements    /**
   * Performs the specified operation
   * @param {any} context.suggestions && context.suggestions.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} context.suggestions && context.suggestions.length > 0
   * @returns {any} The operation result
   */

    if (context.suggestions && context.suggestions.length > 0) {
      enhanced.enhancedPrompt = await this.injectSuggestionContext(enhanced.enhancedPrompt, context.suggestions);
    }

    return {
      prompt: enhanced.enhancedPrompt,
      originalPrompt: basePrompt,
      confidence: enhanced.confidence,
      tokenReduction: enhanced.tokenReduction,
      autoExecutable: true,
      estimatedTokens: this.estimateTokens(enhanced.enhancedPrompt),
      successRate: this.estimateSuccessRate(enhanced.confidence, recommendation),
      category: recommendation.category,
      priority: recommendation.priority,
      context: context,
      enhancement: enhanced
    };
  }

  /**
   * Initialize prompt templates for different recommendation types
   */
  initializePromptTemplates() {
    return {
      // ESLint fixes
      eslint: {
        template: 'Fix {errorCount} ESLint {errorType} in {projectType} project. Run: {command}',
        variables: ['errorCount', 'errorType', 'projectType', 'command'],
        maxTokens: 50,
        successRate: 0.95
      },

      // Security vulnerabilities
      security: {
        template: 'Fix {vulnerabilityCount} {severity} security vulnerabilities. Command: {command}',
        variables: ['vulnerabilityCount', 'severity', 'command'],
        maxTokens: 45,
        successRate: 0.90
      },

      // Test coverage
      testing: {
        template: 'Increase test coverage from {currentCoverage}% to {targetCoverage}%. Focus on {focusArea}.',
        variables: ['currentCoverage', 'targetCoverage', 'focusArea'],
        maxTokens: 60,
        successRate: 0.85
      },

      // Bundle optimization
      performance: {
        template: 'Reduce bundle size from {currentSize}KB. {optimizationStrategy}',
        variables: ['currentSize', 'optimizationStrategy'],
        maxTokens: 55,
        successRate: 0.80
      },

      // Documentation
      documentation: {
        template: 'Add JSDoc to {targetCount} {targetType}. Include @param, @returns, @throws.',
        variables: ['targetCount', 'targetType'],
        maxTokens: 50,
        successRate: 0.88
      },

      // Code structure
      structure: {
        template: 'Reorganize {fileCount} files into {structureType}. Create {directories}.',
        variables: ['fileCount', 'structureType', 'directories'],
        maxTokens: 55,
        successRate: 0.75
      },

      // Dependencies
      dependencies: {
        template: 'Replace {packageName} ({size}KB) with {alternative} for {benefit}.',
        variables: ['packageName', 'size', 'alternative', 'benefit'],
        maxTokens: 50,
        successRate: 0.82
      },

      // Error handling
      errorHandling: {
        template: 'Add try-catch blocks to {functionCount} functions. Handle {errorTypes}.',
        variables: ['functionCount', 'errorTypes'],
        maxTokens: 50,
        successRate: 0.85
      }
    };
  }

  /**
   * Get appropriate template for recommendation
   */
  getTemplateForRecommendation(recommendation) {
    const suggestion = recommendation.suggestion.toLowerCase();
    const action = recommendation.action.toLowerCase();

    // ESLint related
    if (suggestion.includes('eslint') || action.includes('eslint')) {
      return this.promptTemplates.eslint;
    }

    // Security related
    if (suggestion.includes('security') || suggestion.includes('vulnerabilit')) {
      return this.promptTemplates.security;
    }

    // Testing related
    if (suggestion.includes('test') || suggestion.includes('coverage')) {
      return this.promptTemplates.testing;
    }

    // Performance related
    if (suggestion.includes('bundle') || suggestion.includes('performance') || suggestion.includes('size')) {
      return this.promptTemplates.performance;
    }

    // Documentation related
    if (suggestion.includes('document') || suggestion.includes('jsdoc')) {
      return this.promptTemplates.documentation;
    }

    // Structure related
    if (suggestion.includes('structure') || suggestion.includes('organize') || suggestion.includes('reorganize')) {
      return this.promptTemplates.structure;
    }

    // Dependencies related
    if (suggestion.includes('dependenc') || suggestion.includes('package') || suggestion.includes('replace')) {
      return this.promptTemplates.dependencies;
    }

    // Error handling related
    if (suggestion.includes('error') || suggestion.includes('try-catch')) {
      return this.promptTemplates.errorHandling;
    }

    return null;
  }

  /**
   * Build prompt from template with recommendation data
   */
  buildPromptFromTemplate(template, recommendation, projectContext) {
    let prompt = template.template;

    // Extract data from recommendation
    const data = this.extractDataFromRecommendation(recommendation, projectContext);

    // Replace template variables    /**
   * Performs the specified operation
   * @param {any} const variable of template.variables
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const variable of template.variables
   * @returns {any} The operation result
   */

    for (const variable of template.variables) {
      const value = data[variable] || this.getDefaultValue(variable, recommendation);
      prompt = prompt.replace(`{${variable}}`, value);
    }

    return prompt;
  }

  /**
   * Extract relevant data from recommendation
   */
  extractDataFromRecommendation(recommendation, projectContext) {
    const data = {};
    const suggestion = recommendation.suggestion;
    const action = recommendation.action;

    // Extract numbers
    const numbers = suggestion.match(/\d+/g) || [];    /**
   * Performs the specified operation
   * @param {any} numbers.length > 0
   * @returns {number} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} numbers.length > 0
   * @returns {number} The operation result
   */

    if (numbers.length > 0) {
      data.errorCount = numbers[0];
      data.vulnerabilityCount = numbers[0];
      data.targetCount = numbers[0];
      data.fileCount = numbers[0];
      data.functionCount = numbers[0];
    }

    // Extract percentages
    const percentages = suggestion.match(/(\d+)%/g) || [];    /**
   * Performs the specified operation
   * @param {any} percentages.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} percentages.length > 0
   * @returns {any} The operation result
   */

    if (percentages.length > 0) {
      data.currentCoverage = percentages[0].replace('%', '');      /**
   * Performs the specified operation
   * @param {any} percentages.length > 1
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} percentages.length > 1
   * @returns {any} The operation result
   */

      if (percentages.length > 1) {
        data.targetCoverage = percentages[1].replace('%', '');
      }
    }

    // Extract sizes
    const sizes = suggestion.match(/(\d+)KB/g) || [];    /**
   * Performs the specified operation
   * @param {any} sizes.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} sizes.length > 0
   * @returns {any} The operation result
   */

    if (sizes.length > 0) {
      data.currentSize = sizes[0].replace('KB', '');
      data.size = sizes[0].replace('KB', '');
    }

    // Extract project type
    data.projectType = projectContext.type || 'JavaScript';

    // Extract commands from action
    const commands = action.match(/npx [^,]+|npm [^,]+/g) || [];    /**
   * Performs the specified operation
   * @param {any} commands.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} commands.length > 0
   * @returns {any} The operation result
   */

    if (commands.length > 0) {
      data.command = commands[0];
    }

    // Extract severity levels
    if (suggestion.includes('critical')) {data.severity = 'critical';}
    else if (suggestion.includes('high')) {data.severity = 'high';}
    else if (suggestion.includes('moderate')) {data.severity = 'moderate';}
    else if (suggestion.includes('low')) {data.severity = 'low';}

    // Extract focus areas
    if (suggestion.includes('branch')) {data.focusArea = 'branch coverage';}
    else if (suggestion.includes('function')) {data.focusArea = 'function coverage';}
    else if (suggestion.includes('line')) {data.focusArea = 'line coverage';}
    else {data.focusArea = 'business logic';}

    // Extract optimization strategies
    if (suggestion.includes('code splitting')) {data.optimizationStrategy = 'Implement code splitting';}
    else if (suggestion.includes('tree shaking')) {data.optimizationStrategy = 'Enable tree shaking';}
    else if (suggestion.includes('lazy loading')) {data.optimizationStrategy = 'Add lazy loading';}
    else {data.optimizationStrategy = 'Remove unused dependencies';}

    // Extract target types
    if (suggestion.includes('method')) {data.targetType = 'methods';}
    else if (suggestion.includes('class')) {data.targetType = 'classes';}
    else if (suggestion.includes('function')) {data.targetType = 'functions';}
    else {data.targetType = 'functions';}

    // Extract structure types
    if (suggestion.includes('feature')) {data.structureType = 'feature-based structure';}
    else if (suggestion.includes('layer')) {data.structureType = 'layered architecture';}
    else {data.structureType = 'logical structure';}

    // Extract directories
    if (suggestion.includes('component')) {data.directories = 'components, services, utils';}
    else if (suggestion.includes('api')) {data.directories = 'routes, controllers, models';}
    else {data.directories = 'src, lib, test';}

    // Extract package names and alternatives
    const packageMatch = suggestion.match(/Replace (\w+)/);    /**
   * Performs the specified operation
   * @param {any} packageMatch
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageMatch
   * @returns {any} The operation result
   */

    if (packageMatch) {
      data.packageName = packageMatch[1];
      data.alternative = this.getPackageAlternative(packageMatch[1]);
      data.benefit = 'smaller bundle size';
    }

    // Extract error types
    if (suggestion.includes('API')) {data.errorTypes = 'API errors';}
    else if (suggestion.includes('validation')) {data.errorTypes = 'validation errors';}
    else {data.errorTypes = 'runtime errors';}

    return data;
  }

  /**
   * Get default values for template variables
   */
  getDefaultValue(variable, recommendation) {
    const defaults = {
      errorCount: '5',
      errorType: 'errors',
      projectType: 'JavaScript',
      command: 'npx eslint --fix .',
      vulnerabilityCount: '3',
      severity: 'high',
      currentCoverage: '60',
      targetCoverage: '80',
      focusArea: 'business logic',
      currentSize: '500',
      optimizationStrategy: 'Remove unused dependencies',
      targetCount: '10',
      targetType: 'functions',
      fileCount: '20',
      structureType: 'logical structure',
      directories: 'src, lib, test',
      packageName: 'lodash',
      size: '100',
      alternative: 'lodash-es',
      benefit: 'smaller bundle',
      functionCount: '5',
      errorTypes: 'runtime errors'
    };

    return defaults[variable] || 'N/A';
  }

  /**
   * Get package alternatives
   */
  getPackageAlternative(packageName) {
    const alternatives = {
      'lodash': 'lodash-es',
      'moment': 'day.js',
      'axios': 'fetch API',
      'jquery': 'vanilla JS',
      'bootstrap': 'Tailwind CSS',
      'webpack': 'Vite'
    };

    return alternatives[packageName.toLowerCase()] || 'lighter alternative';
  }

  /**
   * Generate fallback prompt for unrecognized recommendations
   */
  generateFallbackPrompt(recommendation) {
    const action = recommendation.action;
    const suggestion = recommendation.suggestion;

    // Create a simple, direct prompt
    let prompt = suggestion;

    // Add action if it's a command
    if (action.includes('npx ') || action.includes('npm ')) {
      prompt += ` Command: ${action}`;
    }

    // Limit length    /**
   * Performs the specified operation
   * @param {Object} prompt.length > this.config.maxPromptTokens * 4
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} prompt.length > this.config.maxPromptTokens * 4
   * @returns {boolean} True if successful, false otherwise
   */

    if (prompt.length > this.config.maxPromptTokens * 4) {
      prompt = prompt.substring(0, this.config.maxPromptTokens * 4) + '...';
    }

    return {
      prompt,
      originalPrompt: prompt,
      confidence: 0.6,
      tokenReduction: 0,
      autoExecutable: true,
      estimatedTokens: this.estimateTokens(prompt),
      successRate: 0.6,
      category: recommendation.category,
      priority: recommendation.priority
    };
  }

  /**
   * Estimate token count for prompt
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate success rate based on confidence and recommendation type
   */
  estimateSuccessRate(confidence, recommendation) {
    let baseRate = confidence;

    // Adjust based on recommendation complexity    /**
   * Performs the specified operation
   * @param {any} recommendation.priority - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} recommendation.priority - Optional parameter
   * @returns {any} The operation result
   */

    if (recommendation.priority === 'critical') {baseRate += 0.1;}    /**
   * Performs the specified operation
   * @param {any} recommendation.priority - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} recommendation.priority - Optional parameter
   * @returns {any} The operation result
   */

    if (recommendation.priority === 'high') {baseRate += 0.05;}

    // Adjust based on category
    const categoryRates = {
      'quality': 0.9,
      'security': 0.85,
      'testing': 0.8,
      'performance': 0.75,
      'structure': 0.7,
      'documentation': 0.85,
      'developerExperience': 0.8
    };

    const categoryRate = categoryRates[recommendation.category] || 0.75;
    return Math.min((baseRate + categoryRate) / 2, 0.95);
  }

  /**
   * Generate batch enhanced prompts for multiple recommendations
   */
  async generateBatchPrompts(recommendations, projectContext = {}) {
    const results = [];    /**
   * Performs the specified operation
   * @param {any} const recommendation of recommendations
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const recommendation of recommendations
   * @returns {any} The operation result
   */


    for (const recommendation of recommendations) {
      try {
        const enhanced = await this.generateEnhancedPrompt(recommendation, projectContext);
        results.push({
          recommendation,
          enhancedPrompt: enhanced
        });
      } catch (error) {
        results.push({
          recommendation,
          enhancedPrompt: this.generateFallbackPrompt(recommendation),
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Apply learning-based optimizations
   */
  async applyLearningOptimizations(enhanced, recommendation) {  /**
   * Performs the specified operation
   * @param {Object} !this.config.enableLearning
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} !this.config.enableLearning
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.config.enableLearning) {
      return enhanced;
    }

    const category = recommendation.category;
    const priority = recommendation.priority;

    // Get historical success rates for this category/priority combination
    const key = `${category}-${priority}`;
    const historicalSuccess = this.learningSystem.successRates.get(key) || 0.8;

    // Adjust confidence based on historical performance    /**
   * Performs the specified operation
   * @param {boolean} historicalSuccess > 0.9
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} historicalSuccess > 0.9
   * @returns {boolean} True if successful, false otherwise
   */

    if (historicalSuccess > 0.9) {
      enhanced.confidence = Math.min(enhanced.confidence + 0.1, 1.0);
    } else if (historicalSuccess < 0.7) {
      enhanced.confidence = Math.max(enhanced.confidence - 0.1, 0.5);
    }

    // Adjust success rate based on learning
    enhanced.successRate = this.estimateSuccessRate(enhanced.confidence, recommendation, historicalSuccess);

    return enhanced;
  }

  /**
   * Validate and finalize prompt
   */
  async validateAndFinalizePrompt(enhanced, recommendation) {
    // Ensure prompt is within token limits  /**
   * Performs the specified operation
   * @param {Object} enhanced.estimatedTokens > this.config.maxPromptTokens
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} enhanced.estimatedTokens > this.config.maxPromptTokens
   * @returns {boolean} True if successful, false otherwise
   */

    if (enhanced.estimatedTokens > this.config.maxPromptTokens) {
      enhanced.prompt = this.truncatePrompt(enhanced.prompt, this.config.maxPromptTokens);
      enhanced.estimatedTokens = this.estimateTokens(enhanced.prompt);
    }

    // Ensure auto-executable flag is set
    enhanced.autoExecutable = true;

    // Add final validation
    enhanced.validation = {
      tokenCount: enhanced.estimatedTokens,
      withinLimits: enhanced.estimatedTokens <= this.config.maxPromptTokens,
      hasCommand: this.hasExecutableCommand(enhanced.prompt),
      confidence: enhanced.confidence,
      successRate: enhanced.successRate
    };

    return enhanced;
  }

  /**
   * Record prompt generation for learning
   */
  async recordPromptGeneration(recommendation, finalPrompt) {
    const key = `${recommendation.category}-${recommendation.priority}`;

    // Record success rate
    if (!this.learningSystem.successRates.has(key)) {
      this.learningSystem.successRates.set(key, finalPrompt.successRate);
    } else {
      const current = this.learningSystem.successRates.get(key);
      const newRate = (current + finalPrompt.successRate) / 2;
      this.learningSystem.successRates.set(key, newRate);
    }

    // Record pattern effectiveness    /**
   * Performs the specified operation
   * @param {any} finalPrompt.context && finalPrompt.context.patterns
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} finalPrompt.context && finalPrompt.context.patterns
   * @returns {any} The operation result
   */

    if (finalPrompt.context && finalPrompt.context.patterns) {
      const patternKey = Object.keys(finalPrompt.context.patterns).join(',');
      if (!this.learningSystem.patternEffectiveness.has(patternKey)) {
        this.learningSystem.patternEffectiveness.set(patternKey, []);
      }
      this.learningSystem.patternEffectiveness.get(patternKey).push({
        successRate: finalPrompt.successRate,
        confidence: finalPrompt.confidence,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get pattern type for recommendation
   */
  getPatternTypeForRecommendation(recommendation) {
    const suggestion = recommendation.suggestion.toLowerCase();

    if (suggestion.includes('component') || suggestion.includes('react')) {
      return 'component';
    }
    if (suggestion.includes('api') || suggestion.includes('route')) {
      return 'api';
    }
    if (suggestion.includes('test')) {
      return 'test';
    }
    if (suggestion.includes('function') || suggestion.includes('method')) {
      return 'function';
    }

    return null;
  }

  /**
   * Generate mock code for SuggestionGenerator
   */
  generateMockCodeForRecommendation(recommendation) {
    const suggestion = recommendation.suggestion.toLowerCase();

    if (suggestion.includes('eslint')) {
      return 'function example() { var x = 1; if (x == 1) { console.log("test"); } }';
    }
    if (suggestion.includes('security')) {
      return 'eval(userInput); document.innerHTML = userData;';
    }
    if (suggestion.includes('performance')) {
      return 'for (let i = 0; i < array.length; i++) { process(array[i]); }';
    }

    return 'function example() { return "mock code"; }';
  }

  /**
   * Generate mock issues for SuggestionGenerator
   */
  generateMockIssuesForRecommendation(recommendation) {
    const issues = [];
    const suggestion = recommendation.suggestion.toLowerCase();

    if (suggestion.includes('eslint')) {
      issues.push({ type: 'maintainability', value: 45 });
    }
    if (suggestion.includes('security')) {
      issues.push({ type: 'security', value: 30 });
    }
    if (suggestion.includes('performance')) {
      issues.push({ type: 'performance', value: 50 });
    }

    return issues;
  }

  /**
   * Extract technologies from recommendation
   */
  extractTechnologiesFromRecommendation(recommendation) {
    const technologies = [];
    const suggestion = recommendation.suggestion.toLowerCase();
    const action = recommendation.action.toLowerCase();

    if (suggestion.includes('react') || action.includes('react')) {
      technologies.push('react');
    }
    if (suggestion.includes('typescript') || action.includes('typescript')) {
      technologies.push('typescript');
    }
    if (suggestion.includes('node') || action.includes('node')) {
      technologies.push('nodejs');
    }
    if (suggestion.includes('jest') || action.includes('jest')) {
      technologies.push('jest');
    }
    if (suggestion.includes('vitest') || action.includes('vitest')) {
      technologies.push('vitest');
    }

    return technologies;
  }

  /**
   * Calculate context metrics
   */
  calculateContextMetrics(context) {
    return {
      patternCount: Object.keys(context.patterns).length,
      suggestionCount: Array.isArray(context.suggestions) ? context.suggestions.length : 0,
      documentationCount: Object.keys(context.documentation).length,
      relevanceScore: this.calculateOverallRelevance(context),
      complexity: this.assessContextComplexity(context)
    };
  }

  /**
   * Calculate overall relevance score
   */
  calculateOverallRelevance(context) {
    let score = 0;
    let factors = 0;

    if (Object.keys(context.patterns).length > 0) {
      score += 0.3;
      factors++;
    }
    if (Array.isArray(context.suggestions) && context.suggestions.length > 0) {
      score += 0.3;
      factors++;
    }
    if (Object.keys(context.documentation).length > 0) {
      score += 0.4;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Assess context complexity
   */
  assessContextComplexity(context) {
    let complexity = 0;

    complexity += Object.keys(context.patterns).length * 0.1;
    complexity += (Array.isArray(context.suggestions) ? context.suggestions.length : 0) * 0.05;
    complexity += Object.keys(context.documentation).length * 0.1;

    return Math.min(complexity, 1.0);
  }

  /**
   * Inject pattern context into prompt
   */
  async injectPatternContext(prompt, patterns) {
    if (!patterns || Object.keys(patterns).length === 0) {
      return prompt;
    }

    // Limit pattern injection to avoid token overflow
    const maxPatternLength = 50; // Maximum characters for pattern info
    let patternInfo = '';    /**
   * Performs the specified operation
   * @param {any} typeof patterns - Optional parameter
   * @returns {string} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} typeof patterns - Optional parameter
   * @returns {string} The operation result
   */


    if (typeof patterns === 'string') {
      // If patterns is a string (like test pattern), extract key info
      const lines = patterns.split('\n');
      const keyLines = lines.filter(line =>
        line.includes('import') ||
        line.includes('describe') ||
        line.includes('it(') ||
        line.includes('expect')
      ).slice(0, 3); // Take first 3 relevant lines

      patternInfo = keyLines.join(' ').substring(0, maxPatternLength);
    } else if (typeof patterns === 'object') {
      // If patterns is an object, extract descriptions
      const entries = Object.entries(patterns).slice(0, 2); // Limit to 2 patterns
      patternInfo = entries
        .map(([type, pattern]) => {          /**
   * Performs the specified operation
   * @param {any} typeof pattern - Optional parameter
   * @returns {string} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} typeof pattern - Optional parameter
   * @returns {string} The operation result
   */

          if (typeof pattern === 'string') {
            return `${type}: ${pattern.substring(0, 20)}...`;
          }
          return `${type}: ${pattern.description || 'Available'}`;
        })
        .join(', ')
        .substring(0, maxPatternLength);
    }    /**
   * Performs the specified operation
   * @param {any} patternInfo
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} patternInfo
   * @returns {any} The operation result
   */


    if (patternInfo) {
      return `${prompt}\n\nPattern: ${patternInfo}`;
    }

    return prompt;
  }

  /**
   * Inject suggestion context into prompt
   */
  async injectSuggestionContext(prompt, suggestions) {  /**
   * Performs the specified operation
   * @param {any} !suggestions || suggestions.length - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !suggestions || suggestions.length - Optional parameter
   * @returns {any} The operation result
   */

    if (!suggestions || suggestions.length === 0) {
      return prompt;
    }

    // Limit suggestion injection to avoid token overflow
    const maxSuggestionLength = 60; // Maximum characters for suggestions
    const topSuggestions = suggestions.slice(0, 2)
      .map(s => {
        const text = s.title || s.action || s.description || '';
        return text.substring(0, 25); // Limit each suggestion to 25 chars
      })
      .join(', ')
      .substring(0, maxSuggestionLength);    /**
   * Performs the specified operation
   * @param {any} topSuggestions
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} topSuggestions
   * @returns {any} The operation result
   */


    if (topSuggestions) {
      return `${prompt}\n\nRelated: ${topSuggestions}`;
    }

    return prompt;
  }

  /**
   * Truncate prompt to fit token limits
   */
  truncatePrompt(prompt, maxTokens) {
    const maxChars = maxTokens * 4; // Rough estimation    /**
   * Performs the specified operation
   * @param {any} prompt.length < - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} prompt.length < - Optional parameter
   * @returns {any} The operation result
   */

    if (prompt.length <= maxChars) {
      return prompt;
    }

    return prompt.substring(0, maxChars - 3) + '...';
  }

  /**
   * Check if prompt has executable command
   */
  hasExecutableCommand(prompt) {
    return /npx|npm|yarn|pnpm|git|./.test(prompt);
  }

  /**
   * Enhanced success rate estimation with learning
   */
  estimateSuccessRate(confidence, recommendation, historicalSuccess = null) {
    let baseRate = confidence;

    // Adjust based on recommendation complexity    /**
   * Performs the specified operation
   * @param {any} recommendation.priority - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} recommendation.priority - Optional parameter
   * @returns {any} The operation result
   */

    if (recommendation.priority === 'critical') {baseRate += 0.1;}    /**
   * Performs the specified operation
   * @param {any} recommendation.priority - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} recommendation.priority - Optional parameter
   * @returns {any} The operation result
   */

    if (recommendation.priority === 'high') {baseRate += 0.05;}

    // Adjust based on category
    const categoryRates = {
      'quality': 0.9,
      'security': 0.85,
      'testing': 0.8,
      'performance': 0.75,
      'structure': 0.7,
      'documentation': 0.85,
      'developerExperience': 0.8
    };

    const categoryRate = categoryRates[recommendation.category] || 0.75;
    let finalRate = (baseRate + categoryRate) / 2;

    // Apply historical learning if available    /**
   * Performs the specified operation
   * @param {boolean} historicalSuccess ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} historicalSuccess ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (historicalSuccess !== null) {
      finalRate = (finalRate + historicalSuccess) / 2;
    }

    return Math.min(finalRate, 0.95);
  }

  /**
   * Get comprehensive prompt generation statistics
   */
  getPromptStats() {
    const baseStats = {
      templatesAvailable: Object.keys(this.promptTemplates).length,
      maxTokensPerPrompt: this.config.maxPromptTokens,
      averageSuccessRate: Object.values(this.promptTemplates)
        .reduce((sum, template) => sum + template.successRate, 0) / Object.keys(this.promptTemplates).length,
      enhancementStats: this.promptEnhancer.getEnhancementStats()
    };

    // Add learning statistics    /**
   * Performs the specified operation
   * @param {Object} this.config.enableLearning
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.enableLearning
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.enableLearning) {
      baseStats.learningStats = {
        categoriesTracked: this.learningSystem.successRates.size,
        patternsTracked: this.learningSystem.patternEffectiveness.size,
        averageHistoricalSuccess: Array.from(this.learningSystem.successRates.values())
          .reduce((sum, rate) => sum + rate, 0) / this.learningSystem.successRates.size || 0
      };
    }

    // Add enhancement system statistics
    baseStats.enhancementSystems = {
      promptEnhancer: true,
      suggestionGenerator: this.config.enableSuggestionIntegration,
      patternProvider: this.config.enablePatternInjection,
      resourceManager: this.config.enableContextInjection,
      learningSystem: this.config.enableLearning
    };

    return baseStats;
  }
}
