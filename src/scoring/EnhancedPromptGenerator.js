/**
 * Enhanced Prompt Generator - Creates small, perfect prompts for auto-execution
 * 
 * Generates optimized prompts that can be leveraged by codefortify to auto-execute
 * recommendations with minimal tokens, cost, and maximum first-try success rate.
 */

import { PromptEnhancer } from '../enhancement/PromptEnhancer.js';

export class EnhancedPromptGenerator {
  constructor(config = {}) {
    this.config = {
      maxPromptTokens: config.maxPromptTokens || 150, // Keep prompts small
      enableContextInjection: config.enableContextInjection !== false,
      optimizeForFirstTry: config.optimizeForFirstTry !== false,
      includeCodeExamples: config.includeCodeExamples !== false,
      ...config
    };
    
    this.promptEnhancer = new PromptEnhancer({
      maxTokens: this.config.maxPromptTokens,
      contextRelevanceThreshold: 0.8, // High relevance for auto-execution
      ...config
    });
    
    // Prompt templates for different recommendation types
    this.promptTemplates = this.initializePromptTemplates();
  }

  /**
   * Generate enhanced prompt for a recommendation
   */
  async generateEnhancedPrompt(recommendation, projectContext = {}) {
    const template = this.getTemplateForRecommendation(recommendation);
    if (!template) {
      return this.generateFallbackPrompt(recommendation);
    }

    // Build base prompt using template
    const basePrompt = this.buildPromptFromTemplate(template, recommendation, projectContext);
    
    // Enhance with context if enabled
    if (this.config.enableContextInjection) {
      const enhanced = await this.promptEnhancer.enhance(basePrompt, {
        projectType: projectContext.type,
        currentFile: projectContext.currentFile,
        recentFiles: projectContext.recentFiles || []
      });
      
      return {
        prompt: enhanced.enhancedPrompt,
        originalPrompt: basePrompt,
        confidence: enhanced.confidence,
        tokenReduction: enhanced.tokenReduction,
        autoExecutable: true,
        estimatedTokens: this.estimateTokens(enhanced.enhancedPrompt),
        successRate: this.estimateSuccessRate(enhanced.confidence, recommendation),
        category: recommendation.category,
        priority: recommendation.priority
      };
    }

    return {
      prompt: basePrompt,
      originalPrompt: basePrompt,
      confidence: 0.8,
      tokenReduction: 0,
      autoExecutable: true,
      estimatedTokens: this.estimateTokens(basePrompt),
      successRate: this.estimateSuccessRate(0.8, recommendation),
      category: recommendation.category,
      priority: recommendation.priority
    };
  }

  /**
   * Initialize prompt templates for different recommendation types
   */
  initializePromptTemplates() {
    return {
      // ESLint fixes
      eslint: {
        template: "Fix {errorCount} ESLint {errorType} in {projectType} project. Run: {command}",
        variables: ['errorCount', 'errorType', 'projectType', 'command'],
        maxTokens: 50,
        successRate: 0.95
      },
      
      // Security vulnerabilities
      security: {
        template: "Fix {vulnerabilityCount} {severity} security vulnerabilities. Command: {command}",
        variables: ['vulnerabilityCount', 'severity', 'command'],
        maxTokens: 45,
        successRate: 0.90
      },
      
      // Test coverage
      testing: {
        template: "Increase test coverage from {currentCoverage}% to {targetCoverage}%. Focus on {focusArea}.",
        variables: ['currentCoverage', 'targetCoverage', 'focusArea'],
        maxTokens: 60,
        successRate: 0.85
      },
      
      // Bundle optimization
      performance: {
        template: "Reduce bundle size from {currentSize}KB. {optimizationStrategy}",
        variables: ['currentSize', 'optimizationStrategy'],
        maxTokens: 55,
        successRate: 0.80
      },
      
      // Documentation
      documentation: {
        template: "Add JSDoc to {targetCount} {targetType}. Include @param, @returns, @throws.",
        variables: ['targetCount', 'targetType'],
        maxTokens: 50,
        successRate: 0.88
      },
      
      // Code structure
      structure: {
        template: "Reorganize {fileCount} files into {structureType}. Create {directories}.",
        variables: ['fileCount', 'structureType', 'directories'],
        maxTokens: 55,
        successRate: 0.75
      },
      
      // Dependencies
      dependencies: {
        template: "Replace {packageName} ({size}KB) with {alternative} for {benefit}.",
        variables: ['packageName', 'size', 'alternative', 'benefit'],
        maxTokens: 50,
        successRate: 0.82
      },
      
      // Error handling
      errorHandling: {
        template: "Add try-catch blocks to {functionCount} functions. Handle {errorTypes}.",
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
    
    // Replace template variables
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
    const numbers = suggestion.match(/\d+/g) || [];
    if (numbers.length > 0) {
      data.errorCount = numbers[0];
      data.vulnerabilityCount = numbers[0];
      data.targetCount = numbers[0];
      data.fileCount = numbers[0];
      data.functionCount = numbers[0];
    }
    
    // Extract percentages
    const percentages = suggestion.match(/(\d+)%/g) || [];
    if (percentages.length > 0) {
      data.currentCoverage = percentages[0].replace('%', '');
      if (percentages.length > 1) {
        data.targetCoverage = percentages[1].replace('%', '');
      }
    }
    
    // Extract sizes
    const sizes = suggestion.match(/(\d+)KB/g) || [];
    if (sizes.length > 0) {
      data.currentSize = sizes[0].replace('KB', '');
      data.size = sizes[0].replace('KB', '');
    }
    
    // Extract project type
    data.projectType = projectContext.type || 'JavaScript';
    
    // Extract commands from action
    const commands = action.match(/npx [^,]+|npm [^,]+/g) || [];
    if (commands.length > 0) {
      data.command = commands[0];
    }
    
    // Extract severity levels
    if (suggestion.includes('critical')) data.severity = 'critical';
    else if (suggestion.includes('high')) data.severity = 'high';
    else if (suggestion.includes('moderate')) data.severity = 'moderate';
    else if (suggestion.includes('low')) data.severity = 'low';
    
    // Extract focus areas
    if (suggestion.includes('branch')) data.focusArea = 'branch coverage';
    else if (suggestion.includes('function')) data.focusArea = 'function coverage';
    else if (suggestion.includes('line')) data.focusArea = 'line coverage';
    else data.focusArea = 'business logic';
    
    // Extract optimization strategies
    if (suggestion.includes('code splitting')) data.optimizationStrategy = 'Implement code splitting';
    else if (suggestion.includes('tree shaking')) data.optimizationStrategy = 'Enable tree shaking';
    else if (suggestion.includes('lazy loading')) data.optimizationStrategy = 'Add lazy loading';
    else data.optimizationStrategy = 'Remove unused dependencies';
    
    // Extract target types
    if (suggestion.includes('method')) data.targetType = 'methods';
    else if (suggestion.includes('class')) data.targetType = 'classes';
    else if (suggestion.includes('function')) data.targetType = 'functions';
    else data.targetType = 'functions';
    
    // Extract structure types
    if (suggestion.includes('feature')) data.structureType = 'feature-based structure';
    else if (suggestion.includes('layer')) data.structureType = 'layered architecture';
    else data.structureType = 'logical structure';
    
    // Extract directories
    if (suggestion.includes('component')) data.directories = 'components, services, utils';
    else if (suggestion.includes('api')) data.directories = 'routes, controllers, models';
    else data.directories = 'src, lib, test';
    
    // Extract package names and alternatives
    const packageMatch = suggestion.match(/Replace (\w+)/);
    if (packageMatch) {
      data.packageName = packageMatch[1];
      data.alternative = this.getPackageAlternative(packageMatch[1]);
      data.benefit = 'smaller bundle size';
    }
    
    // Extract error types
    if (suggestion.includes('API')) data.errorTypes = 'API errors';
    else if (suggestion.includes('validation')) data.errorTypes = 'validation errors';
    else data.errorTypes = 'runtime errors';
    
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
    
    // Limit length
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
    
    // Adjust based on recommendation complexity
    if (recommendation.priority === 'critical') baseRate += 0.1;
    if (recommendation.priority === 'high') baseRate += 0.05;
    
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
    const results = [];
    
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
   * Get prompt generation statistics
   */
  getPromptStats() {
    return {
      templatesAvailable: Object.keys(this.promptTemplates).length,
      maxTokensPerPrompt: this.config.maxPromptTokens,
      averageSuccessRate: Object.values(this.promptTemplates)
        .reduce((sum, template) => sum + template.successRate, 0) / Object.keys(this.promptTemplates).length,
      enhancementStats: this.promptEnhancer.getEnhancementStats()
    };
  }
}
