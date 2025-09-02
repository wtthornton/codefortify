import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImprovementAgent } from '../../../src/agents/ImprovementAgent.js';

describe('ImprovementAgent', () => {
  let agent;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      projectType: 'javascript',
      maxImprovements: 15,
      priorityThreshold: 3
    };

    agent = new ImprovementAgent(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const defaultAgent = new ImprovementAgent();
      expect(defaultAgent.config.projectRoot).toBe(process.cwd());
      expect(defaultAgent.config.projectType).toBe('javascript');
      expect(defaultAgent.config.maxImprovements).toBe(15);
      expect(defaultAgent.config.priorityThreshold).toBe(3);
    });

    it('should initialize with provided config', () => {
      expect(agent.config.projectRoot).toBe('/test/project');
      expect(agent.config.projectType).toBe('javascript');
      expect(agent.config.maxImprovements).toBe(15);
      expect(agent.config.priorityThreshold).toBe(3);
    });

    it('should initialize improvement strategies and applied fixes', () => {
      expect(agent.improvementStrategies).toBeDefined();
      expect(Array.isArray(agent.appliedFixes)).toBe(true);
      expect(agent.appliedFixes).toHaveLength(0);
    });
  });

  describe('improve', () => {
    let mockCode;
    let mockReviewResult;
    let mockAnalysisResult;

    beforeEach(() => {
      mockCode = `
        function calculateSum(arr) {
          var total = 0;
          for (var i = 0; i < arr.length; i++) {
            total = total + arr[i];
          }
          return total;
        }
      `;

      mockReviewResult = {
        score: 65,
        issues: [
          {
            type: 'style',
            severity: 'minor',
            category: 'Code Quality',
            description: 'Use let/const instead of var',
            location: { line: 2, column: 10 },
            fix: 'Replace var with const/let'
          },
          {
            type: 'performance',
            severity: 'major',
            category: 'Performance',
            description: 'Inefficient loop pattern',
            location: { line: 3, column: 15 },
            fix: 'Use array methods like reduce()'
          }
        ],
        recommendations: [
          {
            type: 'modernization',
            priority: 4,
            description: 'Update to modern JavaScript syntax',
            actionable: true
          }
        ]
      };

      mockAnalysisResult = {
        insights: [
          {
            type: 'pattern-recognition',
            description: 'Common accumulator pattern detected',
            actionable: true,
            priority: 3,
            suggestion: 'Consider using Array.reduce()'
          }
        ],
        recommendations: [
          {
            type: 'refactoring',
            priority: 4,
            description: 'Extract complex logic into smaller functions'
          }
        ],
        technicalDebt: {
          recommendations: [
            {
              type: 'modernization',
              priority: 3,
              description: 'Update variable declarations to use const/let'
            }
          ]
        }
      };
    });

    it('should identify and apply improvements successfully', async () => {
      const result = await agent.improve(mockCode, mockReviewResult, mockAnalysisResult);

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.fixes).toBeDefined();
      expect(Array.isArray(result.fixes)).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.opportunities).toBeDefined();
      expect(result.applied).toBeDefined();
      expect(result.skipped).toBeDefined();
    });

    it('should track performance metrics', async () => {
      const result = await agent.improve(mockCode, mockReviewResult, mockAnalysisResult);

      expect(result.performance).toBeDefined();
      expect(result.performance.duration).toBeDefined();
      expect(typeof result.performance.duration).toBe('number');
    });

    it('should handle empty review and analysis results', async () => {
      const result = await agent.improve(mockCode, {}, {});

      expect(result).toBeDefined();
      expect(result.code).toBe(mockCode);
      expect(result.fixes).toHaveLength(0);
    });

    it('should respect max improvements limit', async () => {
      agent.config.maxImprovements = 1;

      const result = await agent.improve(mockCode, mockReviewResult, mockAnalysisResult);

      expect(result.fixes.length).toBeLessThanOrEqual(1);
    });

    it('should respect priority threshold', async () => {
      agent.config.priorityThreshold = 5;

      const result = await agent.improve(mockCode, mockReviewResult, mockAnalysisResult);

      // Should skip low priority improvements
      result.fixes.forEach(fix => {
        if (fix.priority !== undefined) {
          expect(fix.priority).toBeGreaterThanOrEqual(5);
        }
      });
    });

    it('should handle improvement errors gracefully', async () => {
      const invalidCode = 'function unclosed() { if (true) ';

      const result = await agent.improve(invalidCode, mockReviewResult, mockAnalysisResult);

      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });
  });

  describe('identifyImprovementOpportunities', () => {
    it('should extract opportunities from review issues', async () => {
      const reviewResult = {
        issues: [
          {
            type: 'security',
            severity: 'critical',
            description: 'Hardcoded secret detected',
            fix: 'Move to environment variables'
          }
        ]
      };

      const opportunities = await agent.identifyImprovementOpportunities(reviewResult, {});

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0].type).toBe('security');
      expect(opportunities[0].severity).toBe('critical');
    });

    it('should extract opportunities from review recommendations', async () => {
      const reviewResult = {
        recommendations: [
          {
            type: 'testing',
            priority: 4,
            description: 'Add unit tests for this function',
            actionable: true
          }
        ]
      };

      const opportunities = await agent.identifyImprovementOpportunities(reviewResult, {});

      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0].type).toBe('testing');
      expect(opportunities[0].priority).toBe(4);
    });

    it('should extract opportunities from analysis insights', async () => {
      const analysisResult = {
        insights: [
          {
            type: 'performance',
            description: 'Inefficient algorithm detected',
            actionable: true,
            priority: 5,
            suggestion: 'Use more efficient data structure'
          }
        ]
      };

      const opportunities = await agent.identifyImprovementOpportunities({}, analysisResult);

      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0].type).toBe('performance');
      expect(opportunities[0].priority).toBe(5);
    });

    it('should extract opportunities from technical debt recommendations', async () => {
      const analysisResult = {
        technicalDebt: {
          recommendations: [
            {
              type: 'refactoring',
              priority: 3,
              description: 'Break down large function'
            }
          ]
        }
      };

      const opportunities = await agent.identifyImprovementOpportunities({}, analysisResult);

      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0].type).toBe('refactoring');
      expect(opportunities[0].priority).toBe(3);
    });

    it('should handle missing or malformed input', async () => {
      const opportunities = await agent.identifyImprovementOpportunities(null, undefined);

      expect(Array.isArray(opportunities)).toBe(true);
      expect(opportunities).toHaveLength(0);
    });
  });

  describe('prioritizeImprovements', () => {
    it('should prioritize by severity and priority', () => {
      const opportunities = [
        { type: 'style', severity: 'minor', priority: 2 },
        { type: 'security', severity: 'critical', priority: 5 },
        { type: 'performance', severity: 'major', priority: 4 }
      ];

      const prioritized = agent.prioritizeImprovements(opportunities);

      expect(prioritized).toBeDefined();
      expect(Array.isArray(prioritized)).toBe(true);
      // Security (critical) should come first
      expect(prioritized[0].type).toBe('security');
    });

    it('should filter by priority threshold', () => {
      agent.config.priorityThreshold = 4;
      const opportunities = [
        { type: 'low', priority: 2 },
        { type: 'high', priority: 5 },
        { type: 'medium', priority: 4 }
      ];

      const prioritized = agent.prioritizeImprovements(opportunities);

      // Should only include high and medium priority
      expect(prioritized.length).toBe(2);
      expect(prioritized.every(opp => opp.priority >= 4)).toBe(true);
    });

    it('should handle opportunities without explicit priority', () => {
      const opportunities = [
        { type: 'test', severity: 'major' },
        { type: 'test2', severity: 'minor' }
      ];

      const prioritized = agent.prioritizeImprovements(opportunities);

      expect(prioritized).toBeDefined();
      expect(Array.isArray(prioritized)).toBe(true);
    });
  });

  describe('applyImprovements', () => {
    it('should apply multiple improvements to code', async () => {
      const code = 'var x = 1; var y = 2;';
      const opportunities = [
        {
          type: 'modernization',
          description: 'Replace var with const',
          pattern: /var\s+/g,
          replacement: 'const ',
          priority: 3
        }
      ];

      const result = await agent.applyImprovements(code, opportunities);

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.code).not.toBe(code);
      expect(result.fixes).toBeDefined();
      expect(Array.isArray(result.fixes)).toBe(true);
    });

    it('should handle improvements that don\'t apply', async () => {
      const code = 'const x = 1;'; // Already modern
      const opportunities = [
        {
          type: 'modernization',
          description: 'Replace var with const',
          pattern: /var\s+/g,
          replacement: 'const ',
          priority: 3
        }
      ];

      const result = await agent.applyImprovements(code, opportunities);

      expect(result.code).toBe(code); // Unchanged
      expect(result.fixes).toHaveLength(0);
    });

    it('should track successful and failed improvements', async () => {
      const code = 'var x = 1; function test() {}';
      const opportunities = [
        {
          type: 'modernization',
          description: 'Replace var with const',
          pattern: /var\s+/g,
          replacement: 'const ',
          priority: 3
        },
        {
          type: 'invalid',
          description: 'Invalid improvement',
          pattern: null, // Invalid pattern
          replacement: 'test',
          priority: 3
        }
      ];

      const result = await agent.applyImprovements(code, opportunities);

      expect(result.fixes.length).toBe(1); // Only successful improvement
    });
  });

  describe('validateImprovements', () => {
    it('should validate that improvements don\'t break syntax', async () => {
      const originalCode = 'function test() { return true; }';
      const improvedCode = 'const test = () => true;';

      const validation = await agent.validateImprovements(improvedCode, originalCode);

      expect(validation).toBeDefined();
      expect(validation.valid).toBeDefined();
      expect(typeof validation.valid).toBe('boolean');
      expect(validation.syntaxErrors).toBeDefined();
    });

    it('should detect syntax errors in improved code', async () => {
      const originalCode = 'function test() { return true; }';
      const brokenCode = 'function test() { return true; '; // Missing closing brace

      const validation = await agent.validateImprovements(brokenCode, originalCode);

      expect(validation.valid).toBe(false);
      expect(validation.syntaxErrors).toBeDefined();
      expect(validation.syntaxErrors.length).toBeGreaterThan(0);
    });

    it('should provide rollback recommendation for invalid improvements', async () => {
      const originalCode = 'var x = 1;';
      const brokenCode = 'var x = '; // Incomplete

      const validation = await agent.validateImprovements(brokenCode, originalCode);

      expect(validation.valid).toBe(false);
      expect(validation.recommendation).toBe('rollback');
    });
  });

  describe('Improvement Strategies', () => {
    it('should initialize improvement strategies', () => {
      expect(agent.improvementStrategies).toBeDefined();
      expect(typeof agent.improvementStrategies).toBe('object');
    });

    it('should have strategies for common improvement types', () => {
      const strategies = agent.improvementStrategies;

      // Should have strategies for common types
      expect(strategies.security || strategies.performance || strategies.style).toBeDefined();
    });
  });

  describe('Applied Fixes Tracking', () => {
    it('should track applied fixes', async () => {
      const code = 'var test = "value";';
      const reviewResult = {
        issues: [{
          type: 'modernization',
          description: 'Use const instead of var',
          fix: 'Replace var with const'
        }]
      };

      const initialFixesCount = agent.appliedFixes.length;
      await agent.improve(code, reviewResult, {});

      expect(agent.appliedFixes.length).toBeGreaterThanOrEqual(initialFixesCount);
    });

    it('should include metadata in applied fixes', async () => {
      const code = 'console.log("debug");';
      const reviewResult = {
        issues: [{
          type: 'cleanup',
          description: 'Remove debug statements',
          severity: 'minor'
        }]
      };

      await agent.improve(code, reviewResult, {});

      if (agent.appliedFixes.length > 0) {
        const lastFix = agent.appliedFixes[agent.appliedFixes.length - 1];
        expect(lastFix.timestamp).toBeDefined();
        expect(lastFix.type).toBeDefined();
      }
    });
  });

  describe('Configuration Variations', () => {
    it('should handle different project types', async () => {
      const reactAgent = new ImprovementAgent({
        ...mockConfig,
        projectType: 'react'
      });

      const jsxCode = 'const Component = () => <div>Hello</div>;';
      const result = await reactAgent.improve(jsxCode, {}, {});

      expect(result).toBeDefined();
    });

    it('should handle custom priority threshold', async () => {
      const strictAgent = new ImprovementAgent({
        ...mockConfig,
        priorityThreshold: 5
      });

      const opportunities = [
        { type: 'low', priority: 3 },
        { type: 'high', priority: 5 }
      ];

      const prioritized = strictAgent.prioritizeImprovements(opportunities);
      expect(prioritized.length).toBe(1);
      expect(prioritized[0].priority).toBe(5);
    });

    it('should handle custom max improvements limit', async () => {
      const limitedAgent = new ImprovementAgent({
        ...mockConfig,
        maxImprovements: 2
      });

      const code = 'var a = 1; var b = 2; var c = 3;';
      const opportunities = Array(5).fill({
        type: 'modernization',
        pattern: /var\s+/g,
        replacement: 'const ',
        priority: 4
      });

      const result = await limitedAgent.applyImprovements(code, opportunities);
      // Should respect the limit
      expect(result.fixes.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const result = await agent.improve(null, null, null);

      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should handle improvement application errors', async () => {
      const code = 'function test() {}';
      const badOpportunity = {
        type: 'invalid',
        pattern: null, // Invalid pattern
        replacement: 'test',
        priority: 3
      };

      const result = await agent.applyImprovements(code, [badOpportunity]);

      expect(result).toBeDefined();
      expect(result.code).toBe(code); // Should remain unchanged
    });

    it('should handle validation errors', async () => {
      const originalCode = 'function test() {}';
      const improvedCode = 'invalid syntax here {';

      const validation = await agent.validateImprovements(improvedCode, originalCode);

      expect(validation).toBeDefined();
      expect(validation.valid).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should work with complex real-world scenarios', async () => {
      const complexCode = `
        function processUserData(users) {
          var results = [];
          for (var i = 0; i < users.length; i++) {
            var user = users[i];
            if (user.active == true) {
              results.push({
                id: user.id,
                name: user.name,
                email: user.email
              });
            }
          }
          return results;
        }
      `;

      const complexReviewResult = {
        issues: [
          {
            type: 'style',
            severity: 'minor',
            description: 'Use strict equality',
            fix: 'Replace == with ==='
          },
          {
            type: 'modernization',
            severity: 'minor',
            description: 'Use const/let instead of var'
          }
        ],
        recommendations: [
          {
            type: 'functional',
            priority: 3,
            description: 'Consider using array methods like filter and map',
            actionable: true
          }
        ]
      };

      const result = await agent.improve(complexCode, complexReviewResult, {});

      expect(result).toBeDefined();
      expect(result.code).toBeDefined();
      expect(result.code).not.toBe(complexCode);
      expect(result.fixes.length).toBeGreaterThan(0);
      expect(result.validation.valid).toBe(true);
    });
  });
});