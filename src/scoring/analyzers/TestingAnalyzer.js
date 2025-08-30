/**
 * TestingAnalyzer - Analyzes testing coverage and quality
 * 
 * Evaluates:
 * - Test coverage and presence (8pts)
 * - Test organization and structure (4pts)
 * - Testing tools and framework setup (3pts)
 * Total: 15pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';
import { execSync } from 'child_process';

export class TestingAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Testing & Documentation';
    this.description = 'Test coverage, organization, and testing infrastructure';
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];
    
    await this.analyzeTestPresence(); // 8pts
    await this.analyzeTestOrganization(); // 4pts  
    await this.analyzeTestingTools(); // 3pts
  }

  async analyzeTestPresence() {
    let score = 0;
    const maxScore = 8;
    
    // Find test files
    const testFiles = await this.findTestFiles();
    const sourceFiles = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);
    
    if (testFiles.length === 0) {
      this.addIssue('No test files found', 'Add unit tests to ensure code quality and prevent regressions');
      this.setDetail('testCoverage', 0);
      return;
    }
    
    // PHASE 1 UPGRADE: Use real coverage tools (c8, nyc, jest) for actual coverage metrics
    const coverageResult = await this.runCoverageAnalysis();
    
    if (coverageResult.success) {
      const { lines, functions, branches, statements } = coverageResult.data;
      const avgCoverage = (lines + functions + branches + statements) / 4;
      
      // Score based on actual coverage metrics (8pts)
      if (avgCoverage >= 80) {
        score += 8;
        this.addScore(8, 8, `Excellent test coverage (${avgCoverage.toFixed(1)}% avg)`);
      } else if (avgCoverage >= 70) {
        score += 6;
        this.addScore(6, 8, `Good test coverage (${avgCoverage.toFixed(1)}% avg)`);
      } else if (avgCoverage >= 50) {
        score += 4;
        this.addScore(4, 8, `Moderate test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Test coverage could be improved', 'Aim for 80%+ test coverage');
      } else if (avgCoverage >= 30) {
        score += 2;
        this.addScore(2, 8, `Low test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Low test coverage', 'Significantly increase test coverage');
      } else {
        score += 1;
        this.addScore(1, 8, `Very low test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Very low test coverage', 'Add comprehensive test suite');
      }

      this.setDetail('realCoverage', coverageResult.data);
    } else {
      // Fallback to file count ratio if coverage tools unavailable
      const coverageRatio = sourceFiles.length > 0 ? testFiles.length / sourceFiles.length : 0;
      
      if (coverageRatio >= 0.8) {
        score += 6; // Slightly lower score for approximation
        this.addScore(6, 8, `Test file ratio suggests good coverage (~${Math.round(coverageRatio * 100)}%)`);
      } else if (coverageRatio >= 0.6) {
        score += 4;
        this.addScore(4, 8, `Test file ratio suggests moderate coverage (~${Math.round(coverageRatio * 100)}%)`);
      } else if (coverageRatio >= 0.4) {
        score += 3;
        this.addScore(3, 8, `Test file ratio suggests fair coverage (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Test coverage could be improved', 'Add coverage tool (c8, nyc, jest --coverage)');
      } else if (coverageRatio >= 0.2) {
        score += 2;
        this.addScore(2, 8, `Test file ratio suggests low coverage (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Low test coverage', 'Add coverage tool and more tests');
      } else {
        score += 1;
        this.addScore(1, 8, `Very few test files found (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Very low test coverage', 'Add comprehensive test suite with coverage');
      }

      // Enhanced error message with specific installation guidance
      if (coverageResult.error.includes('No test script found')) {
        this.addIssue('No test script configured', 'Add "test": "vitest" or "test": "jest" to package.json scripts');
      } else if (coverageResult.error.includes('No coverage tool detected')) {
        this.addIssue('No coverage tool available', 'Install coverage: npm install --save-dev c8 (for vitest) or jest --coverage');
      } else {
        this.addIssue('Coverage analysis failed', `${coverageResult.error}. Install: npm install --save-dev c8 nyc jest`);
      }
    }
    
    this.setDetail('testFiles', testFiles.length);
    this.setDetail('sourceFiles', sourceFiles.length);
  }

  /**
   * Run coverage analysis using c8, nyc, or jest
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async runCoverageAnalysis() {
    try {
      // Check package.json for test script and coverage setup
      const packageJson = await this.readPackageJson();
      if (!packageJson || !packageJson.scripts || !packageJson.scripts.test) {
        return { success: false, error: 'No test script found in package.json' };
      }

      const testScript = packageJson.scripts.test;
      let coverageCommand = null;

      // Detect coverage tools and build appropriate command
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps['c8']) {
        coverageCommand = `c8 --reporter=json ${testScript}`;
      } else if (deps['nyc']) {
        coverageCommand = `nyc --reporter=json ${testScript}`;
      } else if (deps['jest']) {
        coverageCommand = `${testScript} --coverage --coverageReporters=json`;
      } else if (testScript.includes('vitest')) {
        coverageCommand = `${testScript} --coverage --reporter=json`;
      } else {
        return { 
          success: false, 
          error: 'No coverage tool detected (c8, nyc, jest, vitest)' 
        };
      }

      // Run coverage command
      const output = execSync(coverageCommand, {
        encoding: 'utf8',
        timeout: 60000, // 60 second timeout
        cwd: this.config.projectRoot || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Parse coverage results based on tool
      let coverageData;
      
      if (deps['c8'] || deps['nyc']) {
        // c8/nyc JSON format
        const jsonOutput = output.split('\n').find(line => line.startsWith('{'));
        if (jsonOutput) {
          const coverage = JSON.parse(jsonOutput);
          const total = coverage.total;
          coverageData = {
            lines: total.lines.pct,
            functions: total.functions.pct,
            branches: total.branches.pct,
            statements: total.statements.pct
          };
        }
      } else if (deps['jest'] || testScript.includes('vitest')) {
        // Jest/Vitest coverage format - look for coverage summary
        const lines = output.split('\n');
        const summaryLine = lines.find(line => line.includes('coverage'));
        if (summaryLine) {
          // Simple regex to extract percentages
          const percentages = summaryLine.match(/(\d+\.?\d*)%/g);
          if (percentages && percentages.length >= 4) {
            coverageData = {
              lines: parseFloat(percentages[0]),
              functions: parseFloat(percentages[1]),
              branches: parseFloat(percentages[2]),
              statements: parseFloat(percentages[3])
            };
          }
        }
      }

      if (!coverageData) {
        return { success: false, error: 'Could not parse coverage output' };
      }

      return { success: true, data: coverageData };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async analyzeTestOrganization() {
    let score = 0;
    const maxScore = 4;
    
    // Check for test directory structure
    const hasTestDir = await this.fileExists('test') || 
                      await this.fileExists('tests') || 
                      await this.fileExists('__tests__') ||
                      await this.fileExists('src/__tests__');
    
    if (hasTestDir) {
      score += 2;
      this.addScore(2, 2, 'Dedicated test directory found');
    } else {
      // Check for co-located tests
      const testFiles = await this.findTestFiles();
      if (testFiles.length > 0) {
        score += 1;
        this.addScore(1, 2, 'Co-located test files found');
      } else {
        this.addIssue('No organized test structure', 'Create a dedicated test directory or co-locate tests');
      }
    }
    
    // Check for different types of tests
    const testFiles = await this.findTestFiles();
    const hasUnitTests = testFiles.some(f => f.includes('unit') || f.includes('.test.') || f.includes('.spec.'));
    const hasIntegrationTests = testFiles.some(f => f.includes('integration') || f.includes('e2e'));
    
    if (hasUnitTests) {
      score += 1;
      this.addScore(1, 1, 'Unit tests detected');
    }
    
    if (hasIntegrationTests) {
      score += 1;
      this.addScore(1, 1, 'Integration/E2E tests detected');
    } else {
      this.addIssue('No integration tests found', 'Add integration tests for critical user flows');
    }
    
    this.setDetail('hasTestDir', hasTestDir);
    this.setDetail('hasUnitTests', hasUnitTests);
    this.setDetail('hasIntegrationTests', hasIntegrationTests);
  }

  async analyzeTestingTools() {
    let score = 0;
    const maxScore = 3;
    
    const packageJson = await this.readPackageJson();
    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot analyze testing dependencies');
      return;
    }
    
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const testingTools = this.identifyTestingTools(deps);
    
    if (testingTools.length > 0) {
      score += 2;
      this.addScore(2, 2, `Testing framework found: ${testingTools.join(', ')}`);
    } else {
      this.addIssue('No testing framework detected', 'Install a testing framework (Jest, Vitest, Mocha, etc.)');
    }
    
    // Check for test script in package.json
    if (packageJson.scripts && packageJson.scripts.test) {
      score += 1;
      this.addScore(1, 1, 'Test script configured in package.json');
    } else {
      this.addIssue('No test script in package.json', 'Add "test" script to package.json');
    }
    
    this.setDetail('testingTools', testingTools);
    this.setDetail('hasTestScript', !!(packageJson.scripts && packageJson.scripts.test));
  }

  async findTestFiles() {
    const testPatterns = [
      '.test.js', '.test.ts', '.test.jsx', '.test.tsx',
      '.spec.js', '.spec.ts', '.spec.jsx', '.spec.tsx'
    ];
    
    const testFiles = [];
    
    // Find files with test patterns
    for (const pattern of testPatterns) {
      const files = await this.getAllFiles('');
      testFiles.push(...files.filter(file => file.includes(pattern)));
    }
    
    // Find files in test directories
    const testDirs = ['test', 'tests', '__tests__', 'src/__tests__'];
    for (const dir of testDirs) {
      if (await this.fileExists(dir)) {
        const files = await this.getAllFiles(dir, ['.js', '.ts', '.jsx', '.tsx']);
        testFiles.push(...files);
      }
    }
    
    // Remove duplicates
    return [...new Set(testFiles)];
  }

  identifyTestingTools(dependencies) {
    const tools = [];
    const testingPackages = {
      'jest': 'Jest',
      'vitest': 'Vitest', 
      'mocha': 'Mocha',
      'jasmine': 'Jasmine',
      'ava': 'AVA',
      'tape': 'Tape',
      '@testing-library/react': 'React Testing Library',
      '@testing-library/vue': 'Vue Testing Library',
      'cypress': 'Cypress',
      'playwright': 'Playwright',
      'puppeteer': 'Puppeteer',
      'selenium-webdriver': 'Selenium',
      'enzyme': 'Enzyme',
      'sinon': 'Sinon',
      'chai': 'Chai',
      'supertest': 'Supertest'
    };
    
    for (const [pkg, name] of Object.entries(testingPackages)) {
      if (dependencies[pkg]) {
        tools.push(name);
      }
    }
    
    return tools;
  }
}