/**
 * Minimal test for AdvancedContextAnalyzer to isolate syntax issues
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AdvancedContextAnalyzer Minimal Test', () => {
  let testProjectDir;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, 'fixtures', 'minimal-test-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });

    await fs.writeFile(
      path.join(testProjectDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0'
        }
      }, null, 2)
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should import AdvancedContextAnalyzer without syntax errors', async () => {
    // This test will fail if there are syntax errors in the import
    const { AdvancedContextAnalyzer } = await import('../../../src/context/AdvancedContextAnalyzer.js');

    expect(AdvancedContextAnalyzer).toBeDefined();
    expect(typeof AdvancedContextAnalyzer).toBe('function');
  });

  it('should create AdvancedContextAnalyzer instance', async () => {
    const { AdvancedContextAnalyzer } = await import('../../../src/context/AdvancedContextAnalyzer.js');

    const analyzer = new AdvancedContextAnalyzer();

    expect(analyzer).toBeDefined();
    expect(analyzer.config).toBeDefined();
    expect(analyzer.analyzerCache).toBeInstanceOf(Map);
  });
});
