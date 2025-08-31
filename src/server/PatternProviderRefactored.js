/**
 * PatternProvider - Refactored for better organization
 * 
 * Provides framework-specific code patterns using modular pattern classes.
 */

import { ReactPatterns } from './patterns/ReactPatterns.js';
import { VuePatterns } from './patterns/VuePatterns.js';
import { NodePatterns } from './patterns/NodePatterns.js';

export class PatternProvider {
  constructor(config) {
    this.config = config;
  }

  async generatePatterns() {
    const framework = this.config.projectType;
    
    switch (framework) {
    case 'react-webapp':
      return this.getReactPatterns();
    case 'vue-webapp':
      return this.getVuePatterns();
    case 'node-api':
      return this.getNodePatterns();
    default:
      return this.getJavaScriptPatterns();
    }
  }

  async getPattern(patternType, framework = this.config.projectType) {
    const frameworkKey = framework.split('-')[0]; // react-webapp -> react
    
    switch (frameworkKey) {
    case 'react':
      return this.getReactPattern(patternType);
    case 'vue':
      return this.getVuePattern(patternType);
    case 'node':
      return this.getNodePattern(patternType);
    default:
      return this.getJavaScriptPattern(patternType);
    }
  }

  getReactPattern(patternType) {
    switch (patternType) {
    case 'component':
      return ReactPatterns.getComponentPattern();
    case 'hook':
      return ReactPatterns.getHookPattern();
    case 'test':
      return ReactPatterns.getTestPattern();
    default:
      return 'Pattern not found for React framework';
    }
  }

  getVuePattern(patternType) {
    switch (patternType) {
    case 'component':
      return VuePatterns.getComponentPattern();
    case 'composable':
      return VuePatterns.getComposablePattern();
    case 'test':
      return VuePatterns.getTestPattern();
    default:
      return 'Pattern not found for Vue framework';
    }
  }

  getNodePattern(patternType) {
    switch (patternType) {
    case 'service':
      return NodePatterns.getServicePattern();
    case 'middleware':
      return NodePatterns.getMiddlewarePattern();
    case 'route':
      return NodePatterns.getRoutePattern();
    case 'test':
      return NodePatterns.getTestPattern();
    default:
      return 'Pattern not found for Node.js framework';
    }
  }

  getJavaScriptPattern(patternType) {
    switch (patternType) {
    case 'class':
      return this.getJavaScriptClassPattern();
    case 'function':
      return this.getJavaScriptFunctionPattern();
    default:
      return 'Pattern not found for JavaScript';
    }
  }

  // Legacy methods for backward compatibility
  getReactPatterns() {
    return '// Context7 React Patterns for ' + this.config.projectName + '\n\n' +
           ReactPatterns.getComponentPattern() + '\n\n' +
           ReactPatterns.getHookPattern() + '\n\n' +
           ReactPatterns.getTestPattern();
  }

  getVuePatterns() {
    return '// Context7 Vue Patterns for ' + this.config.projectName + '\n\n' +
           VuePatterns.getComponentPattern() + '\n\n' +
           VuePatterns.getComposablePattern();
  }

  getNodePatterns() {
    return '// Context7 Node.js Patterns for ' + this.config.projectName + '\n\n' +
           NodePatterns.getServicePattern() + '\n\n' +
           NodePatterns.getMiddlewarePattern() + '\n\n' +
           NodePatterns.getRoutePattern();
  }

  getJavaScriptPatterns() {
    return '// Context7 JavaScript Patterns for ' + this.config.projectName + '\n\n' +
           this.getJavaScriptClassPattern() + '\n\n' +
           this.getJavaScriptFunctionPattern();
  }

  getJavaScriptClassPattern() {
    return `// Context7 JavaScript Class Pattern
/** AI ASSISTANT CONTEXT: JavaScript class with proper error handling */
export class ExampleClass {
  constructor(config = {}) {
    this.config = { ...this.getDefaultConfig(), ...config };
    this.validateConfig();
  }

  async processData(input) {
    try {
      // Input validation
      this.validateInput(input);
      
      // Main processing logic
      const result = await this.performOperation(input);
      
      return result;
    } catch (error) {
      throw new Error('Processing failed: ' + error.message);
    }
  }

  validateInput(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input: expected object');
    }
  }

  validateConfig() {
    const required = ['apiKey', 'baseUrl'];
    for (const key of required) {
      if (!this.config[key]) {
        throw new Error('Missing required config: ' + key);
      }
    }
  }

  getDefaultConfig() {
    return {
      timeout: 5000,
      retries: 3,
    };
  }

  async performOperation(data) {
    // Implementation here
    return data;
  }
}`;
  }

  getJavaScriptFunctionPattern() {
    return `// Context7 JavaScript Function Pattern
/** AI ASSISTANT CONTEXT: Pure function with input validation and error handling */
export async function processData(input, options = {}) {
  // Input validation
  if (!input) {
    throw new Error('Input is required');
  }

  const config = {
    timeout: 5000,
    retries: 3,
    ...options
  };

  try {
    // Processing logic
    const result = await performOperation(input, config);
    return result;
  } catch (error) {
    console.error('Processing error:', error);
    throw new Error('Failed to process data: ' + error.message);
  }
}

async function performOperation(data, config) {
  // Implementation details
  return data;
}`;
  }
}
