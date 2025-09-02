import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IssueLearningSystem } from '../../../src/learning/IssueLearningSystem.js';
import fs from 'fs/promises';
import path from 'path';

describe('IssueLearningSystem', () => {
  let learningSystem;
  let testDir;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), 'temp-test-learning');
    await fs.mkdir(testDir, { recursive: true });
    learningSystem = new IssueLearningSystem({
      projectRoot: testDir,
      learningDir: '.test-learning'
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should initialize with correct configuration', () => {
    expect(learningSystem.config.projectRoot).toBe(testDir);
    expect(learningSystem.config.learningDir).toBe('.test-learning');
    expect(learningSystem.config.maxIssuesPerCategory).toBe(100);
  });

  it('should record current session learnings', async () => {
    const sessionLearnings = await learningSystem.recordCurrentSessionLearnings();

    expect(sessionLearnings).toHaveProperty('timestamp');
    expect(sessionLearnings).toHaveProperty('improvements');
    expect(sessionLearnings.improvements).toHaveLength(3);

    const patterns = sessionLearnings.improvements.map(imp => imp.pattern);
    expect(patterns).toContain('verbose-documentation-compression');
    expect(patterns).toContain('batch-eslint-optimization');
    expect(patterns).toContain('lean-development');
  });

  it('should record CodeFortify issues', async () => {
    const issueId = await learningSystem.recordCodeFortifyIssue(
      'eslint-error',
      'Unused variable found',
      'test.js',
      'Remove unused variable'
    );

    expect(issueId).toMatch(/^issue-/);
    expect(learningSystem.learningMetrics.totalIssues).toBe(1);
    expect(learningSystem.learningMetrics.resolvedIssues).toBe(1);
  });

  it('should generate lean learning report', () => {
    const report = learningSystem.generateLeanLearningReport();

    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('totalLearnings');
    expect(report).toHaveProperty('topEffectivePatterns');
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('metrics');

    expect(report.recommendations).toHaveLength(3);
    expect(report.recommendations[0]).toHaveProperty('type', 'lean-documentation');
    expect(report.recommendations[0]).toHaveProperty('priority', 'high');
  });

  it('should provide actionable learning recommendations', () => {
    const recommendations = learningSystem.getActionableLearningRecommendations();

    expect(recommendations).toHaveLength(3);

    const priorities = recommendations.map(r => r.priority);
    expect(priorities).toContain('high');
    expect(priorities).toContain('medium');

    const patterns = recommendations.map(r => r.pattern);
    expect(patterns).toContain('verbose-documentation-compression');
    expect(patterns).toContain('batch-eslint-optimization');
    expect(patterns).toContain('lean-development');
  });

  it('should generate pattern IDs consistently', () => {
    const improvement = {
      type: 'test-type',
      pattern: 'test-pattern'
    };

    const id1 = learningSystem.generatePatternId(improvement);
    const id2 = learningSystem.generatePatternId(improvement);

    expect(id1).toMatch(/^pattern-/);
    expect(id2).toMatch(/^pattern-/);
    // IDs should be different due to timestamp
    expect(id1).not.toBe(id2);
  });

  it('should handle simple hash generation', () => {
    const hash1 = learningSystem.simpleHash('test-string');
    const hash2 = learningSystem.simpleHash('test-string');
    const hash3 = learningSystem.simpleHash('different-string');

    expect(hash1).toBe(hash2); // Same input, same hash
    expect(hash1).not.toBe(hash3); // Different input, different hash
    expect(typeof hash1).toBe('string');
  });
});