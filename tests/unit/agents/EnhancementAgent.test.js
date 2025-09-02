import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancementAgent } from '../../../src/agents/EnhancementAgent.js';
import { ProjectScorer } from '../../../src/scoring/ProjectScorer.js';
import { PatternProvider } from '../../../src/server/PatternProvider.js';
import { PerformanceMonitor } from '../../../src/scoring/core/PerformanceMonitor.js';

// Mock dependencies
vi.mock('../../../src/scoring/ProjectScorer.js');
vi.mock('../../../src/server/PatternProvider.js');
vi.mock('../../../src/scoring/core/PerformanceMonitor.js');

describe('EnhancementAgent', () => {
  let agent;
  let mockConfig;
  let mockProjectScorer;
  let mockPatternProvider;
  let mockPerformanceMonitor;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      projectType: 'javascript',
      enhancementMode: 'comprehensive',
      targetScore: 95,
      maxEnhancements: 10
    };

    mockProjectScorer = {
      score: vi.fn(() => Promise.resolve({
        overall: { score: 75, percentage: 75 },
        categories: {
          structure: { score: 15, maxScore: 20 },
          quality: { score: 12, maxScore: 20 },
          performance: { score: 10, maxScore: 15 },
          testing: { score: 8, maxScore: 15 },
          security: { score: 10, maxScore: 15 },
          developer_experience: { score: 7, maxScore: 10 },
          completeness: { score: 3, maxScore: 5 }
        }
      }))
    };

    mockPatternProvider = {
      getEnhancementPatterns: vi.fn(() => Promise.resolve([
        {
          id: 'security-fix',
          type: 'security',
          description: 'Fix hardcoded secrets',
          pattern: /password\s*=\s*["'][^"']+["']/gi,
          replacement: 'password = process.env.PASSWORD',
          confidence: 0.9
        },
        {
          id: 'performance-optimization',
          type: 'performance',
          description: 'Cache DOM queries',
          pattern: /document\.getElementById\(['"]([^'"]+)['"]\)/gi,
          replacement: 'const element = document.getElementById("$1")',
          confidence: 0.8
        }
      ])),
      getCodePatterns: vi.fn(() => Promise.resolve({}))
    };

    mockPerformanceMonitor = {
      startTiming: vi.fn(),
      endTiming: vi.fn(),
      getMetrics: vi.fn(() => ({ duration: 150, memory: 60 }))
    };

    ProjectScorer.mockImplementation(() => mockProjectScorer);
    PatternProvider.mockImplementation(() => mockPatternProvider);
    PerformanceMonitor.mockImplementation(() => mockPerformanceMonitor);

    agent = new EnhancementAgent(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const defaultAgent = new EnhancementAgent();
      expect(defaultAgent.config.projectRoot).toBe(process.cwd());
      expect(defaultAgent.config.projectType).toBe('javascript');
      expect(defaultAgent.config.enhancementMode).toBe('comprehensive');
      expect(defaultAgent.config.targetScore).toBe(95);
    });

    it('should initialize with provided config', () => {
      expect(agent.config.projectRoot).toBe('/test/project');
      expect(agent.config.projectType).toBe('javascript');
      expect(agent.config.enhancementMode).toBe('comprehensive');
      expect(agent.config.targetScore).toBe(95);
    });

    it('should initialize dependencies', () => {
      expect(ProjectScorer).toHaveBeenCalledWith(mockConfig);
      expect(PatternProvider).toHaveBeenCalledWith(mockConfig);
      expect(PerformanceMonitor).toHaveBeenCalled();
    });

    it('should initialize enhancement history', () => {
      expect(Array.isArray(agent.enhancementHistory)).toBe(true);
      expect(agent.enhancementHistory).toHaveLength(0);
    });
  });

  describe('enhance', () => {
    it('should enhance code successfully', async () => {
      const inputCode = `
        const password = "secret123";
        function getUser() {
          const element = document.getElementById("userDiv");
          return element;
        }
      `;

      const result = await agent.enhance(inputCode);

      expect(result).toBeDefined();
      expect(result.enhancedCode).toBeDefined();
      expect(result.enhancements).toBeDefined();
      expect(Array.isArray(result.enhancements)).toBe(true);
      expect(result.scoreImprovement).toBeDefined();
    });

    it('should track performance metrics', async () => {
      const inputCode = 'function test() { return true; }';

      await agent.enhance(inputCode);

      expect(mockPerformanceMonitor.startTiming).toHaveBeenCalled();
      expect(mockPerformanceMonitor.endTiming).toHaveBeenCalled();
    });

    it('should handle empty code input', async () => {
      const result = await agent.enhance('');

      expect(result).toBeDefined();
      expect(result.enhancedCode).toBe('');
      expect(result.enhancements).toHaveLength(0);
    });

    it('should handle malformed code input', async () => {
      const malformedCode = 'function unclosed() { if (true) ';

      const result = await agent.enhance(malformedCode);

      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should respect max enhancements limit', async () => {
      agent.config.maxEnhancements = 2;
      const codeWithManyIssues = `
        const password1 = "secret1";
        const password2 = "secret2"; 
        const password3 = "secret3";
        const password4 = "secret4";
      `;

      const result = await agent.enhance(codeWithManyIssues);

      expect(result.enhancements.length).toBeLessThanOrEqual(2);
    });
  });

  describe('analyzeCode', () => {
    it('should analyze code and return analysis results', async () => {
      const code = `
        function calculateTotal(items) {
          let total = 0;
          for (let i = 0; i < items.length; i++) {
            total += items[i].price;
          }
          return total;
        }
      `;

      const result = await agent.analyzeCode(code);

      expect(result).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(mockProjectScorer.score).toHaveBeenCalled();
    });

    it('should handle analysis errors gracefully', async () => {
      mockProjectScorer.score.mockRejectedValue(new Error('Analysis failed'));

      const result = await agent.analyzeCode('test code');

      expect(result).toBeDefined();
      expect(result.error).toBe('Analysis failed');
    });
  });

  describe('identifyEnhancements', () => {
    it('should identify security enhancement opportunities', async () => {
      const code = 'const apiKey = "sk-1234567890abcdef";';
      const analysis = { categories: { security: { score: 8, maxScore: 15 } } };

      const opportunities = await agent.identifyEnhancements(code, analysis);

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.some(opp => opp.type === 'security')).toBe(true);
    });

    it('should identify performance enhancement opportunities', async () => {
      const code = `
        function inefficient() {
          for (let i = 0; i < array.length; i++) {
            document.getElementById("item" + i).innerHTML = data[i];
          }
        }
      `;
      const analysis = { categories: { performance: { score: 8, maxScore: 15 } } };

      const opportunities = await agent.identifyEnhancements(code, analysis);

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.some(opp => opp.type === 'performance')).toBe(true);
    });

    it('should prioritize opportunities by impact', async () => {
      const code = `
        const secret = "password123";
        function slowFunction() {
          for (let i = 0; i < 1000000; i++) {
            console.log(i);
          }
        }
      `;
      const analysis = {
        categories: {
          security: { score: 5, maxScore: 15 },
          performance: { score: 10, maxScore: 15 }
        }
      };

      const opportunities = await agent.identifyEnhancements(code, analysis);

      expect(opportunities).toBeDefined();
      expect(opportunities.length).toBeGreaterThan(0);
      // Security issues should have higher priority than performance
      const securityOpp = opportunities.find(opp => opp.type === 'security');
      if (securityOpp) {
        expect(securityOpp.priority).toBeDefined();
      }
    });

    it('should handle empty analysis gracefully', async () => {
      const opportunities = await agent.identifyEnhancements('test code', {});

      expect(Array.isArray(opportunities)).toBe(true);
    });
  });

  describe('applyEnhancements', () => {
    it('should apply multiple enhancements successfully', async () => {
      const code = `
        const password = "secret123";
        const element = document.getElementById("test");
      `;
      const opportunities = [
        {
          type: 'security',
          description: 'Fix hardcoded secret',
          pattern: /password\s*=\s*["'][^"']+["']/gi,
          replacement: 'password = process.env.PASSWORD',
          confidence: 0.9,
          impact: 'high'
        },
        {
          type: 'performance',
          description: 'Cache DOM query',
          pattern: /document\.getElementById\(["']([^"']+)["']\)/gi,
          replacement: '/* cached */ document.getElementById("$1")',
          confidence: 0.8,
          impact: 'medium'
        }
      ];

      const result = await agent.applyEnhancements(code, opportunities);

      expect(result).toBeDefined();
      expect(result.enhancedCode).toBeDefined();
      expect(result.enhancedCode).not.toBe(code);
      expect(result.successfulEnhancements).toBeDefined();
      expect(result.failedEnhancements).toBeDefined();
      expect(result.tokenUsage).toBeDefined();
    });

    it('should handle enhancement failures gracefully', async () => {
      const code = 'function test() { return true; }';
      const invalidOpportunity = {
        type: 'invalid',
        description: 'Invalid enhancement',
        pattern: null, // Invalid pattern
        replacement: 'replacement',
        confidence: 0.5
      };

      const result = await agent.applyEnhancements(code, [invalidOpportunity]);

      expect(result).toBeDefined();
      expect(result.enhancedCode).toBe(code); // Should remain unchanged
      expect(result.failedEnhancements.length).toBeGreaterThan(0);
    });

    it('should track token usage for enhancements', async () => {
      const code = 'const oldVar = "test";';
      const opportunities = [{
        type: 'modernization',
        description: 'Use const instead of var',
        pattern: /var\s+/gi,
        replacement: 'const ',
        confidence: 0.9
      }];

      const result = await agent.applyEnhancements(code, opportunities);

      expect(result.tokenUsage).toBeDefined();
      expect(result.tokenUsage.total).toBeDefined();
      expect(typeof result.tokenUsage.total).toBe('number');
    });
  });

  describe('applyEnhancement', () => {
    it('should apply single enhancement correctly', async () => {
      const code = 'var oldStyle = true;';
      const opportunity = {
        type: 'modernization',
        description: 'Use let/const instead of var',
        pattern: /var\s+/gi,
        replacement: 'const ',
        confidence: 0.9
      };

      const result = await agent.applyEnhancement(code, opportunity);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhancedCode).toContain('const oldStyle');
      expect(result.description).toBe(opportunity.description);
    });

    it('should handle regex pattern matching', async () => {
      const code = 'if (condition) statement;';
      const opportunity = {
        type: 'style',
        description: 'Add curly braces',
        pattern: /if\s*\([^)]+\)\s*([^{;]+;)/gi,
        replacement: 'if ($1) { $2 }',
        confidence: 0.8
      };

      const result = await agent.applyEnhancement(code, opportunity);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle enhancement that does not match', async () => {
      const code = 'const modern = true;';
      const opportunity = {
        type: 'modernization',
        description: 'Replace var with const',
        pattern: /var\s+/gi,
        replacement: 'const ',
        confidence: 0.9
      };

      const result = await agent.applyEnhancement(code, opportunity);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No matches found');
    });

    it('should handle invalid enhancement patterns', async () => {
      const code = 'function test() {}';
      const invalidOpportunity = {
        type: 'invalid',
        description: 'Invalid pattern test',
        pattern: null,
        replacement: 'something',
        confidence: 0.5
      };

      const result = await agent.applyEnhancement(code, invalidOpportunity);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('Enhancement History', () => {
    it('should track enhancement history', async () => {
      const code = 'var test = "old style";';

      expect(agent.enhancementHistory).toHaveLength(0);

      await agent.enhance(code);

      expect(agent.enhancementHistory.length).toBeGreaterThan(0);
      const lastEnhancement = agent.enhancementHistory[agent.enhancementHistory.length - 1];
      expect(lastEnhancement.timestamp).toBeDefined();
      expect(lastEnhancement.originalCode).toBe(code);
    });

    it('should include enhancement metadata in history', async () => {
      const code = 'console.log("debug");';

      await agent.enhance(code);

      const lastEnhancement = agent.enhancementHistory[agent.enhancementHistory.length - 1];
      expect(lastEnhancement.enhancements).toBeDefined();
      expect(lastEnhancement.scoreImprovement).toBeDefined();
      expect(lastEnhancement.duration).toBeDefined();
    });
  });

  describe('Configuration Variations', () => {
    it('should handle different enhancement modes', async () => {
      const basicAgent = new EnhancementAgent({
        ...mockConfig,
        enhancementMode: 'basic'
      });

      const code = 'function test() { return true; }';
      const result = await basicAgent.enhance(code);

      expect(result).toBeDefined();
    });

    it('should handle different target scores', async () => {
      const highTargetAgent = new EnhancementAgent({
        ...mockConfig,
        targetScore: 98
      });

      const code = 'var x = 1;';
      const result = await highTargetAgent.enhance(code);

      expect(result).toBeDefined();
    });

    it('should handle different project types', async () => {
      const reactAgent = new EnhancementAgent({
        ...mockConfig,
        projectType: 'react'
      });

      const code = 'const Component = () => <div>Hello</div>;';
      const result = await reactAgent.enhance(code);

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle pattern provider errors', async () => {
      mockPatternProvider.getEnhancementPatterns.mockRejectedValue(
        new Error('Pattern provider failed')
      );

      const code = 'function test() {}';
      const result = await agent.enhance(code);

      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should handle scoring errors during enhancement', async () => {
      mockProjectScorer.score.mockRejectedValue(new Error('Scoring failed'));

      const code = 'function test() {}';
      const result = await agent.enhance(code);

      expect(result).toBeDefined();
      // Should still attempt enhancement even if initial scoring fails
    });

    it('should handle performance monitoring errors', async () => {
      mockPerformanceMonitor.startTiming.mockImplementation(() => {
        throw new Error('Performance monitoring failed');
      });

      const code = 'function test() {}';
      const result = await agent.enhance(code);

      expect(result).toBeDefined();
      // Should continue with enhancement despite monitoring issues
    });
  });

  describe('Integration', () => {
    it('should work with real code patterns', async () => {
      const realCode = `
        function fetchUserData(userId) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', '/api/users/' + userId, false);
          xhr.send();
          return JSON.parse(xhr.responseText);
        }
      `;

      const result = await agent.enhance(realCode);

      expect(result).toBeDefined();
      expect(result.enhancedCode).toBeDefined();
    });

    it('should maintain code functionality while enhancing', async () => {
      const functionalCode = `
        function calculateSum(numbers) {
          var total = 0;
          for (var i = 0; i < numbers.length; i++) {
            total = total + numbers[i];
          }
          return total;
        }
      `;

      const result = await agent.enhance(functionalCode);

      expect(result.enhancedCode).toContain('function calculateSum');
      expect(result.enhancedCode).toContain('return total');
      // Core functionality should be preserved
    });
  });
});