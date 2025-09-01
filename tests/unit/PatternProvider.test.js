/**
 * Unit tests for PatternProvider
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PatternProvider } from '../../src/server/PatternProvider.js';

describe('PatternProvider', () => {
  let patternProvider;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      projectName: 'test-project',
      projectType: 'react-webapp'
    };
    patternProvider = new PatternProvider(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct config', () => {
      expect(patternProvider.config).toBe(mockConfig);
    });
  });

  describe('generatePatterns', () => {
    it('should generate React patterns for react-webapp', async () => {
      const patterns = await patternProvider.generatePatterns();

      expect(patterns).toContain('Context7 React Patterns for test-project');
      expect(patterns).toContain('React.FC');
      expect(patterns).toContain('useQuery');
    });

    it('should generate Vue patterns for vue-webapp', async () => {
      patternProvider.config.projectType = 'vue-webapp';
      const patterns = await patternProvider.generatePatterns();

      expect(patterns).toContain('Context7 Vue Patterns for test-project');
    });

    it('should generate Node patterns for node-api', async () => {
      patternProvider.config.projectType = 'node-api';
      const patterns = await patternProvider.generatePatterns();

      expect(patterns).toContain('Context7 Node.js Patterns for test-project');
    });

    it('should generate JavaScript patterns for unknown type', async () => {
      patternProvider.config.projectType = 'unknown';
      const patterns = await patternProvider.generatePatterns();

      expect(patterns).toContain('Context7 JavaScript Patterns for test-project');
    });
  });

  describe('getPattern', () => {
    it('should return React component pattern', async () => {
      const pattern = await patternProvider.getPattern('component', 'react-webapp');

      expect(pattern).toContain('React.FC');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
      expect(pattern).toContain('useQuery');
      expect(pattern).toContain('isLoading');
      expect(pattern).toContain('error');
    });

    it('should return React hook pattern', async () => {
      const pattern = await patternProvider.getPattern('hook', 'react-webapp');

      expect(pattern).toContain('useExampleData');
      expect(pattern).toContain('useQuery');
      expect(pattern).toContain('useMutation');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });

    it('should return service pattern', async () => {
      const pattern = await patternProvider.getPattern('service', 'react-webapp');

      expect(pattern).toContain('ExampleService');
      expect(pattern).toContain('z.object');
      expect(pattern).toContain('singleton');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });

    it('should return Vue component pattern', async () => {
      const pattern = await patternProvider.getPattern('component', 'vue-webapp');

      expect(pattern).toContain('<template>');
      expect(pattern).toContain('<script setup');
      expect(pattern).toContain('useQuery');
    });

    it('should return Node service pattern', async () => {
      const pattern = await patternProvider.getPattern('service', 'node-api');

      expect(pattern).toContain('ExampleService');
      expect(pattern).toContain('z.object');
      expect(pattern).toContain('dependency injection');
    });

    it('should return "Pattern not found" for unknown pattern', async () => {
      const pattern = await patternProvider.getPattern('unknown', 'react-webapp');

      expect(pattern).toContain('Pattern \'unknown\' not found for framework \'react-webapp\'');
      expect(pattern).toContain('Available patterns:');
    });

    it('should fallback to JavaScript patterns for unknown framework', async () => {
      const pattern = await patternProvider.getPattern('class', 'unknown-framework');

      expect(pattern).toContain('ExampleClass');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });
  });

  describe('getReactComponentPattern', () => {
    it('should include all required React patterns', () => {
      const pattern = patternProvider.getReactComponentPattern();

      expect(pattern).toContain('interface ComponentProps');
      expect(pattern).toContain('React.FC<ComponentProps>');
      expect(pattern).toContain('useQuery');
      expect(pattern).toContain('isLoading');
      expect(pattern).toContain('error');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
      expect(pattern).toContain('className=');
      expect(pattern).toContain('export default');
    });
  });

  describe('getReactHookPattern', () => {
    it('should include all required hook patterns', () => {
      const pattern = patternProvider.getReactHookPattern();

      expect(pattern).toContain('useExampleData');
      expect(pattern).toContain('useQuery');
      expect(pattern).toContain('useMutation');
      expect(pattern).toContain('useCallback');
      expect(pattern).toContain('useEffect');
      expect(pattern).toContain('queryClient.invalidateQueries');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });
  });

  describe('getServicePattern', () => {
    it('should include all required service patterns', () => {
      const pattern = patternProvider.getServicePattern();

      expect(pattern).toContain('ExampleService');
      expect(pattern).toContain('z.object');
      expect(pattern).toContain('private static instance');
      expect(pattern).toContain('fetch');
      expect(pattern).toContain('error handling');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });
  });

  describe('getNodePatterns', () => {
    it('should include Node.js patterns', () => {
      const patterns = patternProvider.getNodePatterns();

      expect(patterns).toContain('Context7 Node.js Patterns');
      expect(patterns).toContain('Service Pattern');
      expect(patterns).toContain('Middleware Pattern');
      expect(patterns).toContain('Route Pattern');
    });
  });

  describe('getNodeServicePattern', () => {
    it('should include Node service patterns', () => {
      const pattern = patternProvider.getNodeServicePattern();

      expect(pattern).toContain('ExampleService');
      expect(pattern).toContain('z.object');
      expect(pattern).toContain('dependency injection');
      expect(pattern).toContain('error handling');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });
  });

  describe('getMiddlewarePattern', () => {
    it('should include Express middleware patterns', () => {
      const pattern = patternProvider.getMiddlewarePattern();

      expect(pattern).toContain('exampleMiddleware');
      expect(pattern).toContain('Request, Response, NextFunction');
      expect(pattern).toContain('requireAuth');
      expect(pattern).toContain('authorization');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });
  });

  describe('getRoutePattern', () => {
    it('should include Express route patterns', () => {
      const pattern = patternProvider.getRoutePattern();

      expect(pattern).toContain('Router');
      expect(pattern).toContain('z.object');
      expect(pattern).toContain('router.post(\'/items\'');
      expect(pattern).toContain('CreateItemSchema');
      expect(pattern).toContain('.status(');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });
  });

  describe('generateComponentScaffold', () => {
    it('should generate React component scaffold', async () => {
      const scaffold = await patternProvider.generateComponentScaffold(
        'UserProfile',
        'page',
        'react',
        ['userId', 'onUpdate']
      );

      expect(scaffold).toContain('UserProfile');
      expect(scaffold).toContain('UserProfileProps');
      expect(scaffold).toContain('userId: any;');
      expect(scaffold).toContain('onUpdate: any;');
      expect(scaffold).toContain('React.FC<UserProfileProps>');
      expect(scaffold).toContain('AI ASSISTANT CONTEXT');
      expect(scaffold).toContain('export default UserProfile');
    });

    it('should handle empty props array', async () => {
      const scaffold = await patternProvider.generateComponentScaffold(
        'EmptyComponent',
        'ui',
        'react',
        []
      );

      expect(scaffold).toContain('EmptyComponent');
      expect(scaffold).toContain('EmptyComponentProps');
      expect(scaffold).not.toContain(': any;');
    });
  });

  describe('Vue patterns', () => {
    it('should generate Vue component pattern', () => {
      const pattern = patternProvider.getVueComponentPattern();

      expect(pattern).toContain('<template>');
      expect(pattern).toContain('<script setup lang="ts">');
      expect(pattern).toContain('useQuery');
      expect(pattern).toContain('Props');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });
  });

  describe('JavaScript patterns', () => {
    it('should generate JavaScript class pattern', () => {
      const pattern = patternProvider.getJavaScriptClassPattern();

      expect(pattern).toContain('ExampleClass');
      expect(pattern).toContain('constructor');
      expect(pattern).toContain('performOperation');
      expect(pattern).toContain('error handling');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });

    it('should generate JavaScript function pattern', () => {
      const pattern = patternProvider.getJavaScriptFunctionPattern();

      expect(pattern).toContain('processData');
      expect(pattern).toContain('input validation');
      expect(pattern).toContain('function');
      expect(pattern).toContain('error handling');
      expect(pattern).toContain('AI ASSISTANT CONTEXT');
    });
  });
});