/**
 * ToolManager - Handles Context7 tool operations
 *
 * Provides AI assistants with tools for code validation, pattern examples,
 * naming conventions, and improvement suggestions.
 */

export class ToolManager {
  constructor(config) {
    this.config = config;
  }

  async listTools() {
    try {
      console.error('ToolManager: Listing tools...');
      const result = {
        tools: [
          {
            name: 'validate_context7_compliance',
            description: 'Validate code against Context7 standards',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'Code to validate' },
                language: { type: 'string', description: 'Programming language (typescript, javascript, css)' },
                component_type: { type: 'string', description: 'Type of component (react, hook, service, etc.)' }
              },
              required: ['code', 'language']
            }
          },
          {
            name: 'get_pattern_examples',
            description: 'Get Context7 pattern examples for specific component types',
            inputSchema: {
              type: 'object',
              properties: {
                pattern_type: { type: 'string', description: 'Type of pattern (component, hook, service, etc.)' },
                framework: { type: 'string', description: 'Framework context (react, vue, express, etc.)' }
              },
              required: ['pattern_type']
            }
          },
          {
            name: 'check_naming_conventions',
            description: 'Check if names follow Context7 conventions',
            inputSchema: {
              type: 'object',
              properties: {
                names: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Names to check (files, functions, components, etc.)'
                },
                context: { type: 'string', description: 'Context (component, hook, file, etc.)' }
              },
              required: ['names']
            }
          },
          {
            name: 'suggest_improvements',
            description: 'Suggest Context7 improvements for code',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'Code to analyze' },
                file_path: { type: 'string', description: 'File path for context' },
                focus_area: { type: 'string', description: 'Specific area to focus on (performance, accessibility, etc.)' }
              },
              required: ['code']
            }
          },
          {
            name: 'generate_component_scaffold',
            description: 'Generate Context7-compliant component scaffold',
            inputSchema: {
              type: 'object',
              properties: {
                component_name: { type: 'string', description: 'Name of component' },
                component_type: { type: 'string', description: 'Type (page, ui, chart, etc.)' },
                framework: { type: 'string', description: 'Framework (react, vue, svelte)' },
                props: { type: 'array', items: { type: 'string' }, description: 'Component props' }
              },
              required: ['component_name', 'component_type']
            }
          }
        ]
      };
      console.error('ToolManager: Tools listed successfully');
      return result;
    } catch (error) {
      console.error('ToolManager: Tool listing failed:', error.message);
      throw new Error(`Tool listing failed: ${error.message}`);
    }
  }

  async executeTool(name, args) {
    try {
      console.error(`ToolManager: Executing tool ${name}`);
      
      if (!args) {
        args = {};
      }
      
      let result;
      switch (name) {
      case 'validate_context7_compliance':
        result = await this.validateContext7Compliance(args);
        break;
      case 'get_pattern_examples':
        result = await this.getPatternExamples(args);
        break;
      case 'check_naming_conventions':
        result = await this.checkNamingConventions(args);
        break;
      case 'suggest_improvements':
        result = await this.suggestImprovements(args);
        break;
      case 'generate_component_scaffold':
        result = await this.generateComponentScaffold(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
      }
      
      console.error('ToolManager: Tool executed successfully');
      return result;
    } catch (error) {
      console.error(`ToolManager: Tool execution failed for ${name}:`, error.message);
      throw new Error(`Tool execution failed for ${name}: ${error.message}`);
    }
  }

  async validateContext7Compliance(args) {
    try {
      const { code, language, component_type } = args;
      
      if (!code) {
        throw new Error('Code parameter is required');
      }

      const issues = [];
      const suggestions = [];

      // Get project-specific validation rules
      const validationRules = this.getValidationRules();

      // Basic validation rules based on Context7 standards
      if (language === 'typescript' || language === 'javascript') {
        await this.validateJavaScriptCode(code, component_type, issues, suggestions, validationRules);
      }

      if (language === 'css' || code.includes('className') || code.includes('style=')) {
        await this.validateStylingCode(code, issues, suggestions, validationRules);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              compliance_score: Math.max(0, 100 - (issues.length * 15)),
              issues,
              suggestions,
              standards_applied: this.getAppliedStandards(),
              project_type: this.config.projectType
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Context7 compliance validation failed: ${error.message}`);
    }
  }

  async validateJavaScriptCode(code, component_type, issues, suggestions, _rules) {
    // React/Component validation
    if (component_type === 'react' || this.config.projectType.includes('react')) {
      if (!code.includes('React.FC') && code.includes('export const') && code.includes('(')) {
        issues.push('Components should use React.FC type annotation');
        suggestions.push('Add React.FC<PropsInterface> to component declaration');
      }

      if (!code.includes('AI ASSISTANT CONTEXT')) {
        issues.push('Missing AI ASSISTANT CONTEXT documentation');
        suggestions.push('Add /** AI ASSISTANT CONTEXT: ... */ comments to describe component purpose');
      }

      if (code.includes('useQuery') && !code.includes('error')) {
        issues.push('React Query usage should include error handling');
        suggestions.push('Add error state handling: if (error) return <div>Error: {error.message}</div>');
      }

      if (code.includes('useQuery') && !code.includes('isLoading')) {
        issues.push('React Query usage should include loading state');
        suggestions.push('Add loading state handling: if (isLoading) return <div>Loading...</div>');
      }
    }

    // Hook validation
    if (component_type === 'hook' || code.includes('export const use')) {
      if (!code.match(/export const use[A-Z]/)) {
        issues.push('Custom hooks should start with "use" and use camelCase');
        suggestions.push('Rename hook to follow useFeatureName pattern');
      }
    }

    // General code quality
    if (code.includes('any') && component_type !== 'migration') {
      issues.push('Avoid using "any" type, use specific types instead');
      suggestions.push('Define proper TypeScript interfaces for type safety');
    }
  }

  async validateStylingCode(code, issues, suggestions, _rules) {
    // Tailwind CSS validation
    if (this.config.projectType.includes('tailwind') || code.includes('className')) {
      if (code.includes('style=') && !code.includes('--')) {
        issues.push('Prefer Tailwind classes over inline styles');
        suggestions.push('Use Tailwind utility classes for consistent styling');
      }
    }

    // Mobile-first validation
    if (code.includes('sm:') && !code.includes('md:')) {
      suggestions.push('Consider adding tablet (md:) breakpoints for better responsive design');
    }
  }

  getValidationRules() {
    return {
      strictTypes: this.config.validation?.strictTypes ?? true,
      requireDocumentation: this.config.validation?.requireDocumentation ?? true,
      mobileFirst: this.config.validation?.mobileFirst ?? true,
      ...this.config.validation
    };
  }

  getAppliedStandards() {
    const standards = ['Context7 patterns', 'Code documentation'];

    if (this.config.projectType.includes('react')) {
      standards.push('React functional components', 'React Query patterns');
    }
    if (this.config.projectType.includes('tailwind')) {
      standards.push('Tailwind CSS utility-first');
    }

    return standards;
  }

  async getPatternExamples(args) {
    try {
      const { pattern_type, framework = this.config.projectType } = args;
      
      if (!pattern_type) {
        throw new Error('Pattern type parameter is required');
      }

      const { PatternProvider } = await import('./PatternProvider.js');
      const provider = new PatternProvider(this.config);
      const pattern = await provider.getPattern(pattern_type, framework);

      return {
        content: [
          {
            type: 'text',
            text: pattern
          }
        ]
      };
    } catch (error) {
      throw new Error(`Pattern example retrieval failed: ${error.message}`);
    }
  }

  async checkNamingConventions(args) {
    try {
      const { names, context } = args;
      
      if (!names || !Array.isArray(names)) {
        throw new Error('Names parameter must be an array');
      }

      const results = names.map(name => {
        const issues = [];
        const suggestions = [];

        switch (context) {
        case 'component':
          if (!name.match(/^[A-Z][a-zA-Z0-9]*$/)) {
            issues.push('Component names should use PascalCase');
            suggestions.push(`Rename to: ${name.charAt(0).toUpperCase() + name.slice(1).replace(/[^a-zA-Z0-9]/g, '')}`);
          }
          if (!name.endsWith('.tsx') && name.includes('.')) {
            issues.push('React components should use .tsx extension');
            suggestions.push(`Rename to: ${name.replace(/\.[^.]*$/, '.tsx')}`);
          }
          break;

        case 'hook':
          if (!name.startsWith('use')) {
            issues.push('Custom hooks should start with "use"');
            suggestions.push(`Rename to: use${name.charAt(0).toUpperCase() + name.slice(1)}`);
          }
          if (!name.match(/^use[A-Z][a-zA-Z0-9]*$/)) {
            issues.push('Hook names should use camelCase after "use"');
          }
          break;

        case 'file':
          if (name.includes(' ')) {
            issues.push('File names should not contain spaces');
            suggestions.push(`Rename to: ${name.replace(/\s+/g, '-').toLowerCase()}`);
          }

          // Check for project-specific naming conventions
          {
            const conventions = this.config.validation?.namingConventions;
            if (conventions?.files === 'kebab-case') {
              const basename = name.split('.')[0]; // Remove extension for validation
              if (!basename.match(/^[a-z][a-z0-9-]*$/)) {
                issues.push('Files should use kebab-case naming');
                suggestions.push(`Rename to: ${basename.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${name.split('.').slice(1).join('.')}`);
              }
            }
          }
          break;
        }

        return {
          name,
          isValid: issues.length === 0,
          issues,
          suggestions
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ results }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Naming convention check failed: ${error.message}`);
    }
  }

  async suggestImprovements(args) {
    try {
      const { code, file_path, focus_area } = args;
      
      if (!code) {
        throw new Error('Code parameter is required');
      }

      const suggestions = [];

      // Performance suggestions
      if (focus_area === 'performance' || !focus_area) {
        if (code.includes('useEffect') && code.includes('[]')) {
          suggestions.push({
            category: 'Performance',
            suggestion: 'Consider using React Query for data fetching instead of useEffect',
            priority: 'medium'
          });
        }

        if (code.includes('map') && !code.includes('key=')) {
          suggestions.push({
            category: 'Performance',
            suggestion: 'Add unique keys to mapped elements for better React performance',
            priority: 'high'
          });
        }
      }

      // Accessibility suggestions
      if (focus_area === 'accessibility' || !focus_area) {
        if (code.includes('<button') && !code.includes('aria-label')) {
          suggestions.push({
            category: 'Accessibility',
            suggestion: 'Add aria-label attributes to buttons for screen readers',
            priority: 'high'
          });
        }

        if (code.includes('<img') && !code.includes('alt=')) {
          suggestions.push({
            category: 'Accessibility',
            suggestion: 'Add alt attributes to images for accessibility',
            priority: 'high'
          });
        }
      }

      // Context7 specific suggestions
      if (!code.includes('AI ASSISTANT CONTEXT')) {
        suggestions.push({
          category: 'Context7',
          suggestion: 'Add AI ASSISTANT CONTEXT comments to improve AI understanding',
          priority: 'medium'
        });
      }

      // Project-specific suggestions
      if (this.config.projectType.includes('mobile')) {
        if (!code.includes('touch') && code.includes('onClick')) {
          suggestions.push({
            category: 'Mobile',
            suggestion: 'Ensure touch targets are at least 44px for mobile accessibility',
            priority: 'medium'
          });
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ suggestions, file_path, project_type: this.config.projectType }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Improvement suggestions failed: ${error.message}`);
    }
  }

  async generateComponentScaffold(args) {
    try {
      const { component_name, component_type, framework = this.config.projectType, props = [] } = args;
      
      if (!component_name || !component_type) {
        throw new Error('Component name and type are required');
      }

      const { PatternProvider } = await import('./PatternProvider.js');
      const provider = new PatternProvider(this.config);
      const scaffold = await provider.generateComponentScaffold(component_name, component_type, framework, props);

      return {
        content: [
          {
            type: 'text',
            text: scaffold
          }
        ]
      };
    } catch (error) {
      throw new Error(`Component scaffold generation failed: ${error.message}`);
    }
  }
}