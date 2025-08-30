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
    
    // Calculate rough test coverage based on file count ratio
    const coverageRatio = sourceFiles.length > 0 ? testFiles.length / sourceFiles.length : 0;
    
    if (coverageRatio >= 0.8) {
      score += 8;
      this.addScore(8, 8, `Excellent test coverage (~${Math.round(coverageRatio * 100)}%)`);
    } else if (coverageRatio >= 0.6) {
      score += 6;
      this.addScore(6, 8, `Good test coverage (~${Math.round(coverageRatio * 100)}%)`);
    } else if (coverageRatio >= 0.4) {
      score += 4;
      this.addScore(4, 8, `Moderate test coverage (~${Math.round(coverageRatio * 100)}%)`);
      this.addIssue('Test coverage could be improved', 'Aim for 80%+ test coverage');
    } else if (coverageRatio >= 0.2) {
      score += 2;
      this.addScore(2, 8, `Low test coverage (~${Math.round(coverageRatio * 100)}%)`);
      this.addIssue('Low test coverage', 'Significantly increase test coverage');
    } else {
      score += 1;
      this.addScore(1, 8, `Very low test coverage (~${Math.round(coverageRatio * 100)}%)`);
      this.addIssue('Very low test coverage', 'Add comprehensive test suite');
    }
    
    this.setDetail('testFiles', testFiles.length);
    this.setDetail('sourceFiles', sourceFiles.length);
    this.setDetail('testCoverage', coverageRatio);
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
    
    let testFiles = [];
    
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