/**
 * Unit tests for ResourceManager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResourceManager } from '../../src/server/ResourceManager.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs/promises
vi.mock('fs/promises');

describe('ResourceManager', () => {
  let resourceManager;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      agentOsPath: '.agent-os',
      projectType: 'react-webapp'
    };
    resourceManager = new ResourceManager(mockConfig);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct config', () => {
      expect(resourceManager.config).toBe(mockConfig);
      expect(resourceManager.projectRoot).toBe('/test/project');
      expect(resourceManager.agentOsPath).toBe('.agent-os');
    });
  });

  describe('listResources', () => {
    it('should return default resources', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('No custom resources'));

      const result = await resourceManager.listResources();

      expect(result).toHaveProperty('resources');
      expect(result.resources).toBeInstanceOf(Array);
      expect(result.resources.length).toBeGreaterThan(0);

      const resourceNames = result.resources.map(r => r.name);
      expect(resourceNames).toContain('Technology Stack Standards');
      expect(resourceNames).toContain('Code Style Guidelines');
      expect(resourceNames).toContain('Context7 Implementation Standards');
    });

    it('should include custom resources when they exist', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['custom-doc.md', 'api-spec.md', 'not-markdown.txt']);

      const result = await resourceManager.listResources();

      expect(result.resources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Custom: custom-doc',
            uri: 'context7://custom/custom-doc'
          }),
          expect.objectContaining({
            name: 'Custom: api-spec',
            uri: 'context7://custom/api-spec'
          })
        ])
      );

      // Should not include non-markdown files
      expect(result.resources).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Custom: not-markdown'
          })
        ])
      );
    });
  });

  describe('readResource', () => {
    it('should read tech-stack resource', async () => {
      const mockContent = '# Tech Stack\n\nReact, TypeScript, Tailwind';
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await resourceManager.readResource('context7://standards/tech-stack');

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join('/test/project', '.agent-os', 'standards', 'tech-stack.md'),
        'utf-8'
      );
      expect(result).toEqual({
        contents: [
          {
            uri: 'context7://standards/tech-stack',
            mimeType: 'text/markdown',
            text: mockContent
          }
        ]
      });
    });

    it('should read code-style resource', async () => {
      const mockContent = '# Code Style\n\nUse Prettier and ESLint';
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await resourceManager.readResource('context7://standards/code-style');

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join('/test/project', '.agent-os', 'standards', 'code-style.md'),
        'utf-8'
      );
      expect(result).toEqual({
        contents: [
          {
            uri: 'context7://standards/code-style',
            mimeType: 'text/markdown',
            text: mockContent
          }
        ]
      });
    });

    it('should read context7-standards resource', async () => {
      const mockContent = '# Context7 Standards\n\nUse React.FC and AI ASSISTANT CONTEXT';
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await resourceManager.readResource('context7://standards/context7-standards');

      expect(result).toEqual({
        contents: [
          {
            uri: 'context7://standards/context7-standards',
            mimeType: 'text/markdown',
            text: mockContent
          }
        ]
      });
    });

    it('should generate component patterns for project type', async () => {
      const result = await resourceManager.readResource('context7://patterns/component-patterns');

      expect(result).toEqual({
        contents: [
          {
            uri: 'context7://patterns/component-patterns',
            mimeType: 'text/typescript',
            text: expect.stringContaining('React.FC')
          }
        ]
      });
    });

    it('should read custom resources', async () => {
      const mockContent = '# Custom Documentation';
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await resourceManager.readResource('context7://custom/api-docs');

      expect(fs.readFile).toHaveBeenCalledWith(
        path.join('/test/project', '.agent-os', 'resources', 'api-docs.md'),
        'utf-8'
      );
      expect(result).toEqual({
        contents: [
          {
            uri: 'context7://custom/api-docs',
            mimeType: 'text/markdown',
            text: mockContent
          }
        ]
      });
    });

    it('should handle file read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(
        resourceManager.readResource('context7://standards/tech-stack')
      ).rejects.toThrow('Failed to read resource context7://standards/tech-stack: File not found');
    });

    it('should handle unknown resource URIs', async () => {
      await expect(
        resourceManager.readResource('context7://unknown/resource')
      ).rejects.toThrow('Failed to read resource context7://unknown/resource');
    });
  });

  describe('generatePatternContent', () => {
    it('should generate React patterns for react-webapp project', async () => {
      const patterns = await resourceManager.generatePatternsContent();

      expect(patterns).toContain('React.FC');
      expect(patterns).toContain('useQuery');
      expect(patterns).toContain('AI ASSISTANT CONTEXT');
      expect(patterns).toContain('Context7 React Patterns');
    });

    it('should generate Vue patterns for vue-webapp project', async () => {
      const vueResourceManager = new ResourceManager({
        projectRoot: '/test/project',
        projectType: 'vue-webapp',
        agentOsPath: '.agent-os'
      });
      const patterns = await vueResourceManager.generatePatternsContent();

      expect(patterns).toContain('Vue');
      expect(patterns).toContain('<template>');
      expect(patterns).toContain('Context7 Vue Patterns');
    });

    it('should generate Node patterns for node-api project', async () => {
      const nodeResourceManager = new ResourceManager({
        projectRoot: '/test/project',
        projectType: 'node-api',
        agentOsPath: '.agent-os'
      });
      const patterns = await nodeResourceManager.generatePatternsContent();

      expect(patterns).toContain('Express');
      expect(patterns).toContain('Context7 Node.js Patterns');
    });

    it('should generate JavaScript patterns for unknown project type', async () => {
      const unknownResourceManager = new ResourceManager({
        projectRoot: '/test/project',
        projectType: 'unknown',
        agentOsPath: '.agent-os'
      });
      const patterns = await unknownResourceManager.generatePatternsContent();

      expect(patterns).toContain('Context7 JavaScript Patterns');
    });
  });
});