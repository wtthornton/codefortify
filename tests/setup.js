/**
 * Test setup file for Context7 MCP tests
 */

import { vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global test configuration
global.testConfig = {
  projectRoot: path.join(__dirname, 'fixtures', 'test-project'),
  agentOsPath: '.agent-os',
  timeout: 5000
};

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Setup test fixtures before all tests
beforeAll(async () => {
  await setupTestFixtures();
});

// Cleanup after all tests
afterAll(async () => {
  await cleanupTestFixtures();
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

async function setupTestFixtures() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const testProjectDir = path.join(fixturesDir, 'test-project');
  
  // Create test project structure
  await fs.ensureDir(testProjectDir);
  await fs.ensureDir(path.join(testProjectDir, '.agent-os'));
  await fs.ensureDir(path.join(testProjectDir, '.agent-os', 'instructions'));
  await fs.ensureDir(path.join(testProjectDir, '.agent-os', 'standards'));
  await fs.ensureDir(path.join(testProjectDir, '.agent-os', 'product'));
  await fs.ensureDir(path.join(testProjectDir, 'src'));
  await fs.ensureDir(path.join(testProjectDir, 'examples'));

  // Create test files
  await fs.writeFile(
    path.join(testProjectDir, 'package.json'),
    JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      type: 'module',
      dependencies: {
        'react': '^18.0.0',
        '@modelcontextprotocol/sdk': '^1.17.4'
      },
      scripts: {
        'test': 'vitest'
      }
    }, null, 2)
  );

  await fs.writeFile(
    path.join(testProjectDir, '.agent-os', 'config.yml'),
    `agent_os_version: 1.4.0
mcp:
  enabled: true
  context7_integration: true
  servers:
    - name: test-server
      command: ["node", "src/mcp-server.js"]
      transport: stdio
agents:
  claude_code:
    enabled: true
context7:
  enabled: true`
  );

  await fs.writeFile(
    path.join(testProjectDir, 'AGENTS.md'),
    '# Test Project\n\nContext7 MCP integration test project.'
  );

  await fs.writeFile(
    path.join(testProjectDir, 'CLAUDE.md'),
    '# CLAUDE.md\n\nTest project for Context7 MCP.'
  );

  await fs.writeFile(
    path.join(testProjectDir, '.agent-os', 'standards', 'context7-standards.md'),
    '# Context7 Standards\n\nTest standards documentation.'
  );
}

async function cleanupTestFixtures() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  try {
    await fs.remove(fixturesDir);
  } catch (error) {
    // Ignore cleanup errors
  }
}