/**
 * Unit tests for ToolManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolManager } from '../../src/server/ToolManager.js';

describe('ToolManager', () => {
  let toolManager;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      projectType: 'react-webapp',
      validation: {
        strictTypes: true,
        requireDocumentation: true
      }
    };
    toolManager = new ToolManager(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct config', () => {
      expect(toolManager.config).toBe(mockConfig);
    });
  });

  describe('listTools', () => {
    it('should return all available tools', async () => {
      const result = await toolManager.listTools();

      expect(result).toHaveProperty('tools');
      expect(result.tools).toBeInstanceOf(Array);
      expect(result.tools).toHaveLength(5);

      const toolNames = result.tools.map(tool => tool.name);
      expect(toolNames).toContain('validate_context7_compliance');
      expect(toolNames).toContain('get_pattern_examples');
      expect(toolNames).toContain('check_naming_conventions');
      expect(toolNames).toContain('suggest_improvements');
      expect(toolNames).toContain('generate_component_scaffold');
    });

    it('should include proper tool schemas', async () => {
      const result = await toolManager.listTools();
      const validationTool = result.tools.find(tool => tool.name === 'validate_context7_compliance');

      expect(validationTool).toEqual({
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
      });
    });
  });

  describe('executeTool', () => {
    it('should execute validate_context7_compliance tool', async () => {
      const args = {
        code: 'export const MyComponent: React.FC = () => <div>Hello</div>;',
        language: 'typescript',
        component_type: 'react'
      };

      const result = await toolManager.executeTool('validate_context7_compliance', args);

      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]).toHaveProperty('type', 'text');

      const response = JSON.parse(result.content[0].text);
      expect(response).toHaveProperty('compliance_score');
      expect(response).toHaveProperty('issues');
      expect(response).toHaveProperty('suggestions');
      expect(response).toHaveProperty('project_type', 'react-webapp');
    });

    it('should execute get_pattern_examples tool', async () => {
      const args = {
        pattern_type: 'component',
        framework: 'react'
      };

      const result = await toolManager.executeTool('get_pattern_examples', args);

      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('React.FC');
    });

    it('should execute check_naming_conventions tool', async () => {
      const args = {
        names: ['MyComponent', 'useMyHook', 'bad-component-name'],
        context: 'component'
      };

      const result = await toolManager.executeTool('check_naming_conventions', args);

      expect(result).toHaveProperty('content');
      const response = JSON.parse(result.content[0].text);
      expect(response).toHaveProperty('results');
      expect(response.results).toHaveLength(3);
    });

    it('should throw error for unknown tool', async () => {
      await expect(
        toolManager.executeTool('unknown_tool', {})
      ).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });

  describe('validateContext7Compliance', () => {
    it('should validate React component code', async () => {
      const args = {
        code: 'export const MyComponent: React.FC = () => <div>Hello</div>;',
        language: 'typescript',
        component_type: 'react'
      };

      const result = await toolManager.validateContext7Compliance(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.compliance_score).toBeGreaterThan(0);
      expect(response.project_type).toBe('react-webapp');
    });

    it('should find issues in non-compliant React code', async () => {
      const args = {
        code: 'export const MyComponent = () => <div>Hello</div>;', // Missing React.FC
        language: 'typescript',
        component_type: 'react'
      };

      const result = await toolManager.validateContext7Compliance(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.issues).toContain('Components should use React.FC type annotation');
      expect(response.issues).toContain('Missing AI ASSISTANT CONTEXT documentation');
    });

    it('should validate custom hooks', async () => {
      const args = {
        code: 'export const useMyHook = () => { return useState(); };',
        language: 'typescript',
        component_type: 'hook'
      };

      const result = await toolManager.validateContext7Compliance(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.compliance_score).toBeGreaterThan(0);
    });

    it('should find issues with bad hook naming', async () => {
      const args = {
        code: 'export const badHookName = () => { return useState(); };',
        language: 'typescript',
        component_type: 'hook'
      };

      const result = await toolManager.validateContext7Compliance(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.issues).toContain('Custom hooks should start with "use" and use camelCase');
    });
  });

  describe('checkNamingConventions', () => {
    it('should validate component names', async () => {
      const args = {
        names: ['MyComponent', 'badComponentName', 'Another-Bad-Name'],
        context: 'component'
      };

      const result = await toolManager.checkNamingConventions(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.results).toHaveLength(3);
      expect(response.results[0].isValid).toBe(true);
      expect(response.results[1].isValid).toBe(false);
      expect(response.results[2].isValid).toBe(false);
    });

    it('should validate hook names', async () => {
      const args = {
        names: ['useMyHook', 'badHookName', 'useAnotherHook'],
        context: 'hook'
      };

      const result = await toolManager.checkNamingConventions(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.results[0].isValid).toBe(true);
      expect(response.results[1].isValid).toBe(false);
      expect(response.results[2].isValid).toBe(true);
    });

    it('should validate file names', async () => {
      const args = {
        names: ['my-component.tsx', 'BadFileName.tsx', 'good-file.js'],
        context: 'file'
      };

      toolManager.config.validation = { namingConventions: { files: 'kebab-case' } };

      const result = await toolManager.checkNamingConventions(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.results[0].isValid).toBe(true);
      expect(response.results[1].isValid).toBe(false);
      expect(response.results[2].isValid).toBe(true);
    });
  });

  describe('suggestImprovements', () => {
    it('should suggest performance improvements', async () => {
      const args = {
        code: 'const items = data.map(item => <div>{item.name}</div>);',
        focus_area: 'performance'
      };

      const result = await toolManager.suggestImprovements(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Performance',
            suggestion: 'Add unique keys to mapped elements for better React performance'
          })
        ])
      );
    });

    it('should suggest accessibility improvements', async () => {
      const args = {
        code: '<button onClick={handleClick}>Click me</button><img src="image.jpg" />',
        focus_area: 'accessibility'
      };

      const result = await toolManager.suggestImprovements(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Accessibility',
            suggestion: 'Add aria-label attributes to buttons for screen readers'
          }),
          expect.objectContaining({
            category: 'Accessibility',
            suggestion: 'Add alt attributes to images for accessibility'
          })
        ])
      );
    });

    it('should suggest Context7 improvements', async () => {
      const args = {
        code: 'const MyComponent = () => <div>Hello</div>;'
      };

      const result = await toolManager.suggestImprovements(args);
      const response = JSON.parse(result.content[0].text);

      expect(response.suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Context7',
            suggestion: 'Add AI ASSISTANT CONTEXT comments to improve AI understanding'
          })
        ])
      );
    });
  });

  describe('getValidationRules', () => {
    it('should return default validation rules', () => {
      const rules = toolManager.getValidationRules();

      expect(rules).toEqual({
        strictTypes: true,
        requireDocumentation: true,
        mobileFirst: true
      });
    });

    it('should override with config rules', () => {
      toolManager.config.validation = {
        strictTypes: false,
        customRule: true
      };

      const rules = toolManager.getValidationRules();

      expect(rules.strictTypes).toBe(false);
      expect(rules.customRule).toBe(true);
      expect(rules.requireDocumentation).toBe(true); // default
    });
  });

  describe('getAppliedStandards', () => {
    it('should return React standards for React project', () => {
      const standards = toolManager.getAppliedStandards();

      expect(standards).toContain('Context7 patterns');
      expect(standards).toContain('Code documentation');
      expect(standards).toContain('React functional components');
      expect(standards).toContain('React Query patterns');
    });

    it('should return base standards for non-React project', () => {
      toolManager.config.projectType = 'node-api';
      const standards = toolManager.getAppliedStandards();

      expect(standards).toContain('Context7 patterns');
      expect(standards).toContain('Code documentation');
      expect(standards).not.toContain('React functional components');
    });
  });
});