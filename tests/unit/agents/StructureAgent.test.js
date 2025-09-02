/**
 * Tests for StructureAgent
 * Comprehensive test coverage for code structure and architecture analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StructureAgent } from '../../../src/agents/StructureAgent.js';

describe('StructureAgent', () => {
  let agent;
  let mockContext;

  beforeEach(() => {
    agent = new StructureAgent({
      enableFileOrganization: true,
      enableNamingConventions: true,
      enableArchitecturePatterns: true,
      enableModularization: true
    });

    mockContext = {
      projectRoot: '/test/project'
    };

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(agent.agentType).toBe('structure');
      expect(agent.categoryName).toBe('Code Structure & Architecture');
      expect(agent.maxScore).toBe(18);
      expect(agent.weight).toBe(0.25);
    });

    it('should initialize naming patterns', () => {
      expect(agent.namingPatterns).toBeDefined();
      expect(agent.namingPatterns.camelCase).toBeInstanceOf(RegExp);
      expect(agent.namingPatterns.PascalCase).toBeInstanceOf(RegExp);
      expect(agent.namingPatterns.kebabCase).toBeInstanceOf(RegExp);
      expect(agent.namingPatterns.snakeCase).toBeInstanceOf(RegExp);
    });

    it('should initialize with custom config', () => {
      const customAgent = new StructureAgent({ enableFileOrganization: false });
      expect(customAgent.config.enableFileOrganization).toBe(false);
      expect(customAgent.config.enableNamingConventions).toBe(true);
    });
  });

  describe('execute', () => {
    it('should execute all structure analysis phases', async () => {
      const result = await agent.execute(mockContext);

      expect(result).toHaveProperty('agent', 'structure');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('executionTime');
      expect(result.result.analysisTime).toBeGreaterThan(0);
    });

    it('should skip disabled analysis phases', async () => {
      agent.config.enableFileOrganization = false;
      const spy = vi.spyOn(agent, 'analyzeFileOrganization');

      await agent.execute(mockContext);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle execution errors gracefully', async () => {
      vi.spyOn(agent, 'analyzeFileOrganization').mockRejectedValue(new Error('Structure analysis failed'));

      const result = await agent.execute(mockContext);

      expect(result).toHaveProperty('error');
    });
  });

  describe('analyzeFileOrganization', () => {
    it('should analyze directory structure successfully', async () => {
      const mockStructure = {
        src: { depth: 2, fileCount: 15 },
        tests: { depth: 2, fileCount: 8 },
        docs: { depth: 1, fileCount: 3 }
      };

      vi.spyOn(agent, 'analyzeDirectoryStructure').mockResolvedValue(mockStructure);

      await agent.analyzeFileOrganization(mockContext.projectRoot);

      expect(agent.results.details.organization).toBeDefined();
      expect(agent.results.details.organization.directoryStructure).toEqual(mockStructure);
      expect(agent.results.details.organization.depthScore).toBeGreaterThan(0);
      expect(agent.results.details.organization.consistencyScore).toBeGreaterThan(0);
      expect(agent.results.details.organization.logicalGrouping).toBeGreaterThan(0);
    });

    it('should handle file organization analysis errors', async () => {
      vi.spyOn(agent, 'analyzeDirectoryStructure').mockRejectedValue(new Error('Directory analysis failed'));

      await agent.analyzeFileOrganization(mockContext.projectRoot);

      expect(agent.results.issues).toContainEqual(
        expect.objectContaining({
          type: 'file-organization-error',
          severity: 'info'
        })
      );
    });
  });

  describe('analyzeNamingConventions', () => {
    it('should analyze naming conventions across files', async () => {
      const mockFiles = ['/test/camelCase.js', '/test/kebab-case.js', '/test/PascalCase.js'];

      vi.spyOn(agent, 'getProjectFiles').mockResolvedValue(mockFiles);
      vi.spyOn(agent, 'analyzeCodeNaming').mockResolvedValue({
        variables: 4.5,
        functions: 4.2
      });

      await agent.analyzeNamingConventions(mockContext.projectRoot);

      expect(agent.results.details.naming).toBeDefined();
      expect(agent.results.details.naming.fileNamingScore).toBeGreaterThan(0);
      expect(agent.results.details.naming.variableNamingScore).toBeCloseTo(4.5);
      expect(agent.results.details.naming.functionNamingScore).toBeCloseTo(4.2);
    });

    it('should handle naming analysis errors', async () => {
      vi.spyOn(agent, 'getProjectFiles').mockRejectedValue(new Error('File access failed'));

      await agent.analyzeNamingConventions(mockContext.projectRoot);

      expect(agent.results.issues).toContainEqual(
        expect.objectContaining({
          type: 'naming-analysis-error',
          severity: 'info'
        })
      );
    });
  });

  describe('analyzeArchitecturePatterns', () => {
    it('should detect architectural patterns', async () => {
      vi.spyOn(agent, 'detectArchitecturalPatterns').mockResolvedValue(['MVC', 'Observer']);
      vi.spyOn(agent, 'analyzeSeparationOfConcerns').mockReturnValue(4.5);
      vi.spyOn(agent, 'analyzeLayeredArchitecture').mockReturnValue(4.0);
      vi.spyOn(agent, 'detectDesignPatterns').mockReturnValue(3.5);

      await agent.analyzeArchitecturePatterns(mockContext.projectRoot);

      expect(agent.results.details.architecture).toBeDefined();
      expect(agent.results.details.architecture.patterns).toEqual(['MVC', 'Observer']);
      expect(agent.results.details.architecture.separationOfConcerns).toBe(4.5);
      expect(agent.results.details.architecture.layeredArchitecture).toBe(4.0);
      expect(agent.results.details.architecture.designPatterns).toBe(3.5);
    });

    it('should handle architecture analysis errors', async () => {
      vi.spyOn(agent, 'detectArchitecturalPatterns').mockRejectedValue(new Error('Architecture analysis failed'));

      await agent.analyzeArchitecturePatterns(mockContext.projectRoot);

      expect(agent.results.issues).toContainEqual(
        expect.objectContaining({
          type: 'architecture-analysis-error',
          severity: 'info'
        })
      );
    });
  });

  describe('analyzeModularization', () => {
    it('should analyze code modularization', async () => {
      const mockModules = [
        { name: 'utils', files: 5, dependencies: 2 },
        { name: 'components', files: 10, dependencies: 3 },
        { name: 'services', files: 7, dependencies: 4 }
      ];

      vi.spyOn(agent, 'identifyModules').mockResolvedValue(mockModules);
      vi.spyOn(agent, 'calculateCohesion').mockReturnValue(4.2);
      vi.spyOn(agent, 'calculateCoupling').mockReturnValue(3.8);
      vi.spyOn(agent, 'calculateReusability').mockReturnValue(3.5);

      await agent.analyzeModularization(mockContext.projectRoot);

      expect(agent.results.details.modularization).toBeDefined();
      expect(agent.results.details.modularization.moduleCount).toBe(3);
      expect(agent.results.details.modularization.cohesionScore).toBe(4.2);
      expect(agent.results.details.modularization.couplingScore).toBe(3.8);
      expect(agent.results.details.modularization.reuseScore).toBe(3.5);
    });

    it('should handle modularization analysis errors', async () => {
      vi.spyOn(agent, 'identifyModules').mockRejectedValue(new Error('Module analysis failed'));

      await agent.analyzeModularization(mockContext.projectRoot);

      expect(agent.results.issues).toContainEqual(
        expect.objectContaining({
          type: 'modularization-analysis-error',
          severity: 'info'
        })
      );
    });
  });

  describe('calculateFinalScore', () => {
    beforeEach(() => {
      agent.score = 14; // Mock accumulated score
    });

    it('should calculate final score and grade', () => {
      agent.calculateFinalScore();

      expect(agent.results.score).toBe(14);
      expect(agent.results.percentage).toBe(78);
      expect(agent.results.grade).toBe('C+');
    });

    it('should add organization suggestions for low depth score', () => {
      agent.results.details.organization = { depthScore: 2 };

      agent.calculateFinalScore();

      expect(agent.results.suggestions).toContainEqual(
        expect.objectContaining({
          type: 'organization',
          priority: 'medium'
        })
      );
    });

    it('should add naming suggestions for low consistency', () => {
      agent.results.details.naming = { consistencyScore: 0.5 };

      agent.calculateFinalScore();

      expect(agent.results.suggestions).toContainEqual(
        expect.objectContaining({
          type: 'naming',
          priority: 'medium'
        })
      );
    });
  });

  describe('calculateDepthScore', () => {
    it('should give optimal score for ideal depth', () => {
      const structure = {
        src: { depth: 3 },
        tests: { depth: 2 },
        docs: { depth: 2 }
      };

      const score = agent.calculateDepthScore(structure);
      expect(score).toBe(5);
    });

    it('should give lower score for extreme depths', () => {
      const structure = {
        src: { depth: 8 },
        tests: { depth: 1 }
      };

      const score = agent.calculateDepthScore(structure);
      expect(score).toBeLessThan(5);
    });
  });

  describe('analyzeFileNaming', () => {
    it('should score files with good naming conventions', () => {
      const files = ['/test/camelCase.js', '/test/kebab-case.js', '/test/helper.js'];

      const score = agent.analyzeFileNaming(files);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(5);
    });

    it('should handle empty file list', () => {
      const score = agent.analyzeFileNaming([]);
      expect(score).toBe(0);
    });

    it('should properly test naming patterns', () => {
      // Test camelCase pattern
      expect(agent.namingPatterns.camelCase.test('camelCase')).toBe(true);
      expect(agent.namingPatterns.camelCase.test('PascalCase')).toBe(false);

      // Test PascalCase pattern
      expect(agent.namingPatterns.PascalCase.test('PascalCase')).toBe(true);
      expect(agent.namingPatterns.PascalCase.test('camelCase')).toBe(false);

      // Test kebab-case pattern
      expect(agent.namingPatterns.kebabCase.test('kebab-case')).toBe(true);
      expect(agent.namingPatterns.kebabCase.test('camelCase')).toBe(false);

      // Test snake_case pattern
      expect(agent.namingPatterns.snakeCase.test('snake_case')).toBe(true);
      expect(agent.namingPatterns.snakeCase.test('camelCase')).toBe(false);
    });
  });

  describe('calculateNamingConsistency', () => {
    it('should calculate consistency from scoring variance', () => {
      const naming = {
        fileNamingScore: 4.0,
        variableNamingScore: 4.2,
        functionNamingScore: 3.8
      };

      const consistency = agent.calculateNamingConsistency(naming);

      expect(consistency).toBeGreaterThan(0);
      expect(consistency).toBeLessThanOrEqual(1);
    });

    it('should return high consistency for similar scores', () => {
      const naming = {
        fileNamingScore: 4.0,
        variableNamingScore: 4.0,
        functionNamingScore: 4.0
      };

      const consistency = agent.calculateNamingConsistency(naming);

      expect(consistency).toBeGreaterThan(0.9);
    });
  });

  describe('calculateVariance', () => {
    it('should calculate correct variance', () => {
      const numbers = [1, 2, 3, 4, 5];
      const variance = agent.calculateVariance(numbers);

      expect(variance).toBeCloseTo(1.414, 2); // sqrt(2) ≈ 1.414
    });

    it('should return zero variance for identical numbers', () => {
      const numbers = [3, 3, 3, 3];
      const variance = agent.calculateVariance(numbers);

      expect(variance).toBe(0);
    });

    it('should handle single number', () => {
      const numbers = [5];
      const variance = agent.calculateVariance(numbers);

      expect(variance).toBe(0);
    });
  });

  describe('helper methods', () => {
    it('should get project files', async () => {
      const files = await agent.getProjectFiles('/test');

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should analyze directory structure', async () => {
      const structure = await agent.analyzeDirectoryStructure('/test');

      expect(typeof structure).toBe('object');
      expect(structure).toHaveProperty('src');
      expect(structure).toHaveProperty('tests');
      expect(structure).toHaveProperty('docs');
    });

    it('should detect architectural patterns', async () => {
      const patterns = await agent.detectArchitecturalPatterns('/test');

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should identify modules', async () => {
      const modules = await agent.identifyModules('/test');

      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
      expect(modules[0]).toHaveProperty('name');
      expect(modules[0]).toHaveProperty('files');
      expect(modules[0]).toHaveProperty('dependencies');
    });
  });
});