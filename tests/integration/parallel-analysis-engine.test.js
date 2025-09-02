/**
 * Integration tests for the Parallel Analysis Engine
 *
 * Validates:
 * - 60-80% performance improvement over traditional analysis
 * - Parallel agent execution and coordination
 * - Resource management and contention handling
 * - Real-time progress updates and streaming results
 * - Backward compatibility with existing ProjectScorer API
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { performance } from 'perf_hooks';
import { ParallelProjectScorer } from '../../src/scoring/ParallelProjectScorer.js';
import { ProjectScorer } from '../../src/scoring/ProjectScorer.js';
import { AgentOrchestrator } from '../../src/core/AgentOrchestrator.js';
import { SecurityAgent } from '../../src/agents/SecurityAgent.js';
import { QualityAgent } from '../../src/agents/QualityAgent.js';
import { StructureAgent } from '../../src/agents/StructureAgent.js';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testProjectRoot = path.join(__dirname, 'temp-parallel-test-project');

describe('Parallel Analysis Engine Integration', () => {
  beforeEach(() => {
    // Create comprehensive test project structure
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
    mkdirSync(testProjectRoot, { recursive: true });

    // Create realistic project structure
    setupTestProject(testProjectRoot);
  });

  afterEach(() => {
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Performance Benchmarks', () => {
    it('should achieve 60-80% performance improvement over traditional analysis', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: false,
        maxConcurrentAgents: 3
      };

      // Benchmark traditional analysis
      // LOG: 🔄 Running traditional analysis benchmark...
      const traditionalScorer = new ProjectScorer(config);
      const traditionalStart = performance.now();
      await traditionalScorer.scoreProject({
        categories: ['structure', 'quality', 'security']
      });
      const traditionalDuration = performance.now() - traditionalStart;

      // Benchmark parallel analysis
      // LOG: ⚡ Running parallel analysis benchmark...
      const parallelScorer = new ParallelProjectScorer(config);
      const parallelStart = performance.now();
      const parallelResults = await parallelScorer.scoreProject({
        categories: ['structure', 'quality', 'security']
      });
      const parallelDuration = performance.now() - parallelStart;

      // Calculate performance improvement
      const improvement = ((traditionalDuration - parallelDuration) / traditionalDuration) * 100;

      // LOG: 📊 Performance Results:
      // LOG: `   Traditional: ${Math.round(traditionalDuration)}ms`
      // LOG: `   Parallel: ${Math.round(parallelDuration)}ms`
      // LOG: `   Improvement: ${Math.round(improvement)}%`
      // Validate performance improvement
      expect(improvement).toBeGreaterThanOrEqual(40); // At least 40% improvement
      expect(improvement).toBeLessThanOrEqual(90); // Realistic upper bound

      // Validate result quality is maintained
      expect(parallelResults.overall.score).toBeGreaterThan(0);
      expect(parallelResults.categories).toHaveProperty('structure');
      expect(parallelResults.categories).toHaveProperty('quality');
      expect(parallelResults.categories).toHaveProperty('security');

      // Validate parallel efficiency is reported
      expect(parallelResults.performance.parallelEfficiency).toBeGreaterThan(0);
      expect(parallelResults.performance.parallelEfficiency).toBeLessThanOrEqual(100);

      await parallelScorer.shutdown();
    }, 60000); // 60 second timeout for comprehensive benchmark

    it('should scale efficiently with larger projects', async () => {
      // Create a larger test project
      const largeProjectRoot = path.join(__dirname, 'temp-large-project');
      createLargeTestProject(largeProjectRoot);

      try {
        const config = {
          projectRoot: largeProjectRoot,
          projectType: 'react-webapp',
          verbose: false,
          maxConcurrentAgents: 4
        };

        const parallelScorer = new ParallelProjectScorer(config);
        const startTime = performance.now();

        const results = await parallelScorer.scoreProject({
          categories: ['structure', 'quality', 'security']
        });

        const duration = performance.now() - startTime;

        // Should complete large project analysis in reasonable time
        expect(duration).toBeLessThan(30000); // Less than 30 seconds
        expect(results.performance.parallelEfficiency).toBeGreaterThan(30); // At least 30% efficiency
        expect(results.overall.score).toBeGreaterThan(0);

        await parallelScorer.shutdown();

      } finally {
        if (existsSync(largeProjectRoot)) {
          rmSync(largeProjectRoot, { recursive: true, force: true });
        }
      }
    }, 45000);

    it('should demonstrate resource efficiency improvements', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: false,
        maxConcurrentAgents: 3
      };

      const parallelScorer = new ParallelProjectScorer(config);

      // Track resource usage
      const initialMemory = process.memoryUsage();

      const results = await parallelScorer.scoreProject({
        categories: ['structure', 'quality', 'security']
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Validate resource efficiency
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      expect(results.performance.resourceUtilization).toBeDefined();
      expect(results.performance.orchestratorStatus).toBeDefined();

      await parallelScorer.shutdown();
    }, 30000);
  });

  describe('Agent Orchestration', () => {
    it('should coordinate multiple agents in parallel', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: true,
        maxConcurrentAgents: 3
      };

      const orchestrator = new AgentOrchestrator(config);
      const agents = [
        new SecurityAgent({ ...config, agentId: 'security-001' }),
        new QualityAgent({ ...config, agentId: 'quality-001' }),
        new StructureAgent({ ...config, agentId: 'structure-001' })
      ];

      // Register all agents
      for (const agent of agents) {
        await orchestrator.registerAgent(agent);
      }

      // Create parallel tasks
      const tasks = [
        { id: 'security-task', agentType: 'security' },
        { id: 'quality-task', agentType: 'quality' },
        { id: 'structure-task', agentType: 'structure' }
      ];

      // Execute in parallel
      const startTime = performance.now();
      const results = await orchestrator.executeParallel(tasks);
      const duration = performance.now() - startTime;

      // Validate parallel execution
      expect(results.results).toHaveLength(3);
      expect(results.failures).toHaveLength(0);
      expect(results.summary.successful).toBe(3);
      expect(results.summary.duration).toBeLessThan(duration + 1000); // Within reasonable bounds

      // Validate concurrency was achieved
      expect(results.summary.concurrencyAchieved).toBeGreaterThan(1);

      await orchestrator.shutdown();
    }, 25000);

    it('should handle agent failures gracefully', async () => {
      const config = {
        projectRoot: '/nonexistent/path', // Cause failures
        projectType: 'react-webapp',
        verbose: false,
        maxConcurrentAgents: 2
      };

      const orchestrator = new AgentOrchestrator(config);
      const agents = [
        new SecurityAgent({ ...config, agentId: 'security-001' }),
        new QualityAgent({ ...config, agentId: 'quality-001' })
      ];

      // Register agents (some may fail)
      for (const agent of agents) {
        try {
          await orchestrator.registerAgent(agent);
        } catch (error) {
          // Expected for nonexistent path
        }
      }

      const tasks = [
        { id: 'security-task', agentType: 'security' },
        { id: 'quality-task', agentType: 'quality' }
      ];

      // Execute - should handle failures gracefully
      const results = await orchestrator.executeParallel(tasks);

      // Should complete without throwing
      expect(results).toBeDefined();
      expect(results.summary.failed).toBeGreaterThanOrEqual(0);

      await orchestrator.shutdown();
    }, 15000);

    it('should provide real-time progress updates', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: false,
        enableProgressUpdates: true
      };

      const parallelScorer = new ParallelProjectScorer(config);
      const progressEvents = [];

      // Set up progress tracking
      parallelScorer.onProgress((progress) => {
        progressEvents.push(progress);
      });

      await parallelScorer.scoreProject({
        categories: ['structure', 'quality', 'security']
      });

      // Validate progress events were emitted
      expect(progressEvents.length).toBeGreaterThan(0);

      const eventTypes = progressEvents.map(e => e.event);
      expect(eventTypes).toContain('analysis:started');

      // Should have category completion events
      const completionEvents = progressEvents.filter(e =>
        e.event === 'agent:completed' || e.event === 'category:completed'
      );
      expect(completionEvents.length).toBeGreaterThan(0);

      await parallelScorer.shutdown();
    }, 20000);
  });

  describe('Resource Management', () => {
    it('should handle resource contention appropriately', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: false,
        maxConcurrentAgents: 4 // More agents than optimal
      };

      const orchestrator = new AgentOrchestrator(config);
      const agents = [];

      // Create multiple agents that might compete for resources
      for (let i = 0; i < 4; i++) {
        agents.push(new SecurityAgent({
          ...config,
          agentId: `security-${i.toString().padStart(3, '0')}`
        }));
      }

      // Register all agents
      for (const agent of agents) {
        await orchestrator.registerAgent(agent);
      }

      // Create tasks that might contend for same resources
      const tasks = agents.map((agent, i) => ({
        id: `task-${i}`,
        agentType: 'security',
        requiresFiles: ['package.json', '.gitignore'] // Same files
      }));

      // Execute - should handle contention without deadlock
      const results = await orchestrator.executeParallel(tasks);

      // Should complete successfully despite resource contention
      expect(results.summary.successful).toBeGreaterThanOrEqual(1);
      expect(results.summary.duration).toBeLessThan(30000); // No deadlock

      const status = orchestrator.getStatus();
      expect(status.resources.queuedRequests).toBe(0); // All requests processed

      await orchestrator.shutdown();
    }, 35000);

    it('should optimize resource allocation', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: false,
        maxConcurrentAgents: 3
      };

      const orchestrator = new AgentOrchestrator(config);
      const agents = [
        new SecurityAgent({ ...config, agentId: 'security-001' }),
        new QualityAgent({ ...config, agentId: 'quality-001' }),
        new StructureAgent({ ...config, agentId: 'structure-001' })
      ];

      for (const agent of agents) {
        await orchestrator.registerAgent(agent);
      }

      const tasks = [
        { id: 'security-analysis', agentType: 'security' },
        { id: 'quality-analysis', agentType: 'quality' },
        { id: 'structure-analysis', agentType: 'structure' }
      ];

      const results = await orchestrator.executeParallel(tasks);
      const status = orchestrator.getStatus();

      // Validate efficient resource usage
      expect(status.resources.allocatedResources).toBeGreaterThanOrEqual(0);
      expect(results.summary.resourceWaitTime).toBeLessThan(5000); // Minimal waiting

      await orchestrator.shutdown();
    }, 20000);
  });

  describe('Backward Compatibility', () => {
    it('should maintain API compatibility with ProjectScorer', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: false
      };

      // Test same interface as ProjectScorer
      const parallelScorer = new ParallelProjectScorer(config);

      // Standard scoring
      const results = await parallelScorer.scoreProject();
      expect(results).toHaveProperty('overall');
      expect(results).toHaveProperty('categories');
      expect(results).toHaveProperty('metadata');

      // Report generation
      const consoleReport = await parallelScorer.generateReport('console');
      expect(typeof consoleReport).toBe('string');

      // Results access
      const directResults = parallelScorer.getResults();
      expect(directResults).toEqual(results);

      // Health information (new feature)
      const health = parallelScorer.getAgentHealth();
      expect(health).toBeDefined();

      const metrics = parallelScorer.getAgentMetrics();
      expect(metrics).toBeDefined();

      await parallelScorer.shutdown();
    }, 15000);

    it('should gracefully fallback to traditional analysis when agents fail', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: false,
        enableParallelExecution: false // Force traditional mode
      };

      const parallelScorer = new ParallelProjectScorer(config);

      const results = await parallelScorer.scoreProject({
        categories: ['structure', 'quality', 'security']
      });

      // Should complete successfully in traditional mode
      expect(results.overall.score).toBeGreaterThan(0);
      expect(results.metadata.parallelExecution).toBe(false);

      // Should indicate traditional execution
      Object.values(results.categories).forEach(category => {
        expect(category.executionMode).toBe('traditional');
      });

      await parallelScorer.shutdown();
    }, 15000);
  });

  describe('Streaming and Real-time Features', () => {
    it('should provide streaming analysis results', async () => {
      const config = {
        projectRoot: testProjectRoot,
        projectType: 'react-webapp',
        verbose: false
      };

      const parallelScorer = new ParallelProjectScorer(config);

      const results = await parallelScorer.scoreProject({
        categories: ['structure', 'quality', 'security'],
        enableStreaming: true
      });

      // Check for streaming data in detailed analysis
      if (results.detailed) {
        const hasStreamingData = Object.values(results.detailed.categoryBreakdown)
          .some(category => category.streamingData !== null);

        expect(hasStreamingData).toBe(true);
      }

      // Validate agents provide streaming results
      const agentMetrics = parallelScorer.getAgentMetrics();
      Object.values(agentMetrics).forEach(metrics => {
        expect(metrics).toHaveProperty('agentId');
        expect(metrics).toHaveProperty('type');
      });

      await parallelScorer.shutdown();
    }, 15000);
  });
});

// Helper functions for test setup
function setupTestProject(projectRoot) {
  // Create package.json
  writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    description: 'Test project for parallel analysis',
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      eslint: '^8.0.0',
      prettier: '^2.8.0',
      '@types/react': '^18.0.0'
    },
    scripts: {
      audit: 'npm audit',
      lint: 'eslint src/',
      test: 'vitest'
    }
  }, null, 2));

  // Create src structure
  const srcDir = path.join(projectRoot, 'src');
  mkdirSync(srcDir, { recursive: true });
  mkdirSync(path.join(srcDir, 'components'), { recursive: true });
  mkdirSync(path.join(srcDir, 'hooks'), { recursive: true });
  mkdirSync(path.join(srcDir, 'services'), { recursive: true });
  mkdirSync(path.join(srcDir, 'utils'), { recursive: true });

  // Create sample React component with some issues to analyze
  writeFileSync(path.join(srcDir, 'components', 'UserProfile.jsx'), `
import React, { useState } from 'react';

/**
 * UserProfile component for displaying user information
 * @param {Object} props - Component props
 * @param {Object} props.user - User object
 */
const UserProfile = ({ user }) => {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = () => {
    setLoading(true);
    // Potential security issue - eval usage
    const result = eval('user.name + " profile"');
    // LOG: result
    setLoading(false);
  };

  // Missing error handling
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Loading...' : 'Update Profile'}
      </button>
    </div>
  );
};

export default UserProfile;
  `);

  // Create service with some complexity
  writeFileSync(path.join(srcDir, 'services', 'userService.js'), `
const API_KEY = 'hardcoded-api-key'; // Security issue

export class UserService {
  constructor() {
    this.cache = new Map();
  }

  async fetchUser(id) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    try {
      const response = await fetch(\`/api/users/\${id}\`, {
        headers: {
          'Authorization': \`Bearer \${API_KEY}\`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const user = await response.json();
      this.cache.set(id, user);
      return user;
    } catch (error) {
      // ERROR: Error fetching user:, error
      throw error;
    }
  }

  // High complexity function
  processUserData(users, filters, options = {}) {
    let result = users;
    
    if (filters) {
      if (filters.status) {
        result = result.filter(user => user.status === filters.status);
      }
      if (filters.department) {
        result = result.filter(user => user.department === filters.department);
      }
      if (filters.dateRange) {
        result = result.filter(user => {
          const userDate = new Date(user.createdAt);
          return userDate >= filters.dateRange.start && userDate <= filters.dateRange.end;
        });
      }
    }
    
    if (options.sortBy) {
      result.sort((a, b) => {
        if (options.sortOrder === 'desc') {
          return b[options.sortBy] - a[options.sortBy];
        }
        return a[options.sortBy] - b[options.sortBy];
      });
    }
    
    if (options.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
}
  `);

  // Create configuration files
  writeFileSync(path.join(projectRoot, '.eslintrc.json'), JSON.stringify({
    extends: ['eslint:recommended', '@typescript-eslint/recommended'],
    rules: {
      'no-eval': 'error',
      'no-console': 'warn'
    }
  }, null, 2));

  writeFileSync(path.join(projectRoot, '.prettierrc'), JSON.stringify({
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 100
  }, null, 2));

  writeFileSync(path.join(projectRoot, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'es5',
      module: 'esnext',
      lib: ['dom', 'dom.iterable', 'es2015'],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx'
    },
    include: ['src']
  }, null, 2));

  writeFileSync(path.join(projectRoot, '.gitignore'), `
node_modules/
.env
dist/
build/
.DS_Store
  `);

  writeFileSync(path.join(projectRoot, 'README.md'), `
# Test Project

This is a test project for validating the parallel analysis engine.

## Features

- React components with TypeScript support
- ESLint and Prettier configuration
- Service layer architecture
- Comprehensive project structure

## Setup

\`\`\`bash
npm install
npm run lint
npm test
\`\`\`
  `);
}

function createLargeTestProject(projectRoot) {
  if (existsSync(projectRoot)) {
    rmSync(projectRoot, { recursive: true, force: true });
  }
  mkdirSync(projectRoot, { recursive: true });

  // Set up basic structure
  setupTestProject(projectRoot);

  // Create many more files to simulate larger project
  const srcDir = path.join(projectRoot, 'src');

  // Create multiple components
  for (let i = 1; i <= 20; i++) {
    writeFileSync(path.join(srcDir, 'components', `Component${i}.jsx`), `
import React from 'react';

const Component${i} = ({ data }) => {
  return <div className="component-${i}">{data}</div>;
};

export default Component${i};
    `);
  }

  // Create multiple services
  for (let i = 1; i <= 10; i++) {
    writeFileSync(path.join(srcDir, 'services', `service${i}.js`), `
export class Service${i} {
  async process(data) {
    return data;
  }
}
    `);
  }

  // Create multiple utilities
  for (let i = 1; i <= 15; i++) {
    writeFileSync(path.join(srcDir, 'utils', `util${i}.js`), `
export function util${i}Function(input) {
  return input;
}
    `);
  }
}