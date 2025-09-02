/**
 * TestingAnalyzer - Analyzes testing coverage and quality
 *
 * Evaluates:
 * - Test coverage and presence (8pts)
 * - Test organization and structure (4pts)
 * - Testing tools and framework setup (3pts)
 * - Test-first development patterns (5pts) - Technical debt prevention
 * Total: 20pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';
import { execSync } from 'child_process';

/**


 * TestingAnalyzer class implementation


 *


 * Provides functionality for testinganalyzer operations


 */


/**


 * TestingAnalyzer class implementation


 *


 * Provides functionality for testinganalyzer operations


 */


export class TestingAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Testing & Documentation';
    this.description = 'Test coverage, organization, and testing infrastructure';
  }  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Runs the specified task
   * @returns {Promise} Promise that resolves with the result
   */


  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];

    await this.analyzeTestPresence(); // 8pts
    await this.analyzeTestOrganization(); // 4pts
    await this.analyzeTestingTools(); // 3pts
    await this.analyzeTestFirstDevelopment(); // NEW: Technical debt prevention
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeTestPresence() {
    let score = 0;
    const maxScore = 8;

    // Find test files
    const testFiles = await this.findTestFiles();
    const sourceFiles = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx']);    /**
   * Performs the specified operation
   * @param {any} testFiles.length - Optional parameter
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} testFiles.length - Optional parameter
   * @returns {any} The operation result
   */


    if (testFiles.length === 0) {
      this.addIssue('No test files found', 'Add unit tests to ensure code quality and prevent regressions');
      this.setDetail('testCoverage', 0);
      return;
    }

    // PHASE 1 UPGRADE: Use real coverage tools (c8, nyc, jest) for actual coverage metrics
    const coverageResult = await this.runCoverageAnalysis();    /**
   * Performs the specified operation
   * @param {any} coverageResult.success
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} coverageResult.success
   * @returns {any} The operation result
   */


    if (coverageResult.success) {
      const { lines, functions, branches, statements } = coverageResult.data;
      const avgCoverage = (lines + functions + branches + statements) / 4;

      // ENHANCED: Much stricter test coverage requirements for rigorous quality      /**
   * Performs the specified operation
   * @param {any} avgCoverage > - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} avgCoverage > - Optional parameter
   * @returns {any} The operation result
   */

      if (avgCoverage >= 95) {
        score += 8;
        this.addScore(8, 8, `Perfect test coverage (${avgCoverage.toFixed(1)}% avg)`);
      }

      else if (avgCoverage >= 90) {
        score += 7;
        this.addScore(7, 8, `Excellent test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Near-perfect coverage needed', 'Aim for 95%+ test coverage for A+ grade');
      }

      else if (avgCoverage >= 85) {
        score += 6;
        this.addScore(6, 8, `Very good test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('High coverage needed', 'Aim for 90%+ test coverage for A grade');
      }

      else if (avgCoverage >= 80) {
        score += 5;
        this.addScore(5, 8, `Good test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Excellent coverage needed', 'Aim for 85%+ test coverage for A- grade');
      }

      else if (avgCoverage >= 70) {
        score += 4;
        this.addScore(4, 8, `Moderate test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Good coverage needed', 'Aim for 80%+ test coverage for B+ grade');
      }

      else if (avgCoverage >= 60) {
        score += 3;
        this.addScore(3, 8, `Fair test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Moderate coverage needed', 'Aim for 70%+ test coverage for B grade');
      }

      else if (avgCoverage >= 50) {
        score += 2;
        this.addScore(2, 8, `Low test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Low test coverage', 'Aim for 60%+ test coverage for C grade');
      }

      else {
        score += 1;
        this.addScore(1, 8, `Very low test coverage (${avgCoverage.toFixed(1)}% avg)`);
        this.addIssue('Critical: Very low test coverage', 'Add comprehensive test suite - aim for 50%+ minimum');
      }

      this.setDetail('realCoverage', coverageResult.data);
    }

    else {
      // ENHANCED: Much stricter fallback test coverage ratio requirements
      const coverageRatio = sourceFiles.length > 0 ? testFiles.length / sourceFiles.length : 0;      /**
   * Performs the specified operation
   * @param {any} coverageRatio > - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} coverageRatio > - Optional parameter
   * @returns {any} The operation result
   */


      if (coverageRatio >= 1.0) {
        score += 6; // Slightly lower score for approximation
        this.addScore(6, 8, `Excellent test file ratio (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Need real coverage metrics', 'Add coverage tool (c8, nyc, jest --coverage) for accurate measurement');
      }

      else if (coverageRatio >= 0.8) {
        score += 5;
        this.addScore(5, 8, `Good test file ratio (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Need real coverage metrics', 'Add coverage tool for accurate measurement');
      }

      else if (coverageRatio >= 0.6) {
        score += 4;
        this.addScore(4, 8, `Moderate test file ratio (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Test coverage needs improvement', 'Add more tests and coverage tool (c8, nyc, jest --coverage)');
      }

      else if (coverageRatio >= 0.4) {
        score += 3;
        this.addScore(3, 8, `Fair test file ratio (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Low test coverage', 'Significantly increase test files and add coverage tool');
      }

      else if (coverageRatio >= 0.2) {
        score += 2;
        this.addScore(2, 8, `Poor test file ratio (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Very low test coverage', 'Add comprehensive test suite with coverage tool');
      }

      else {
        score += 1;
        this.addScore(1, 8, `Critical: Very few test files (~${Math.round(coverageRatio * 100)}%)`);
        this.addIssue('Critical: Insufficient test coverage', 'Add comprehensive test suite immediately');
      }

      // Enhanced error message with specific installation guidance
      if (coverageResult.error.includes('No test script found')) {
        this.addIssue('No test script configured', 'Add "test": "vitest" or "test": "jest" to package.json scripts');
      }

      else if (coverageResult.error.includes('No coverage tool detected')) {
        this.addIssue('No coverage tool available', 'Install coverage: npm install --save-dev c8 (for vitest) or jest --coverage');
      }

      else {
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
      const packageJson = await this.readPackageJson();      /**
   * Performs the specified operation
   * @param {any} !packageJson || !packageJson.scripts || !packageJson.scripts.test
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !packageJson || !packageJson.scripts || !packageJson.scripts.test
   * @returns {any} The operation result
   */

      if (!packageJson || !packageJson.scripts || !packageJson.scripts.test) {
        return { success: false, error: 'No test script found in package.json' };
      }

      const testScript = packageJson.scripts.test;
      let coverageCommand = null;

      // Detect coverage tools and build appropriate command
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };      /**
   * Performs the specified operation
   * @param {any} deps['c8']
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps['c8']
   * @returns {any} The operation result
   */


      if (deps['c8']) {
        coverageCommand = `c8 --reporter=json ${testScript}`;
      }

      else if (deps['nyc']) {
        coverageCommand = `nyc --reporter=json ${testScript}`;
      }

      else if (deps['jest']) {
        coverageCommand = `${testScript} --coverage --coverageReporters=json`;
      }

      else if (testScript.includes('vitest')) {
        coverageCommand = `${testScript} --coverage --reporter=json`;
      }

      else {
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
      let coverageData;      /**
   * Performs the specified operation
   * @param {any} deps['c8'] || deps['nyc']
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} deps['c8'] || deps['nyc']
   * @returns {any} The operation result
   */


      if (deps['c8'] || deps['nyc']) {
        // c8/nyc JSON format
        const jsonOutput = output.split('\n').find(line => line.startsWith('{'));        /**
   * Performs the specified operation
   * @param {any} jsonOutput
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} jsonOutput
   * @returns {any} The operation result
   */

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
      }

      else if (deps['jest'] || testScript.includes('vitest')) {
        // Jest/Vitest coverage format - look for coverage summary
        const lines = output.split('\n');
        const summaryLine = lines.find(line => line.includes('coverage'));        /**
   * Performs the specified operation
   * @param {any} summaryLine
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} summaryLine
   * @returns {any} The operation result
   */

        if (summaryLine) {
          // Simple regex to extract percentages
          const percentages = summaryLine.match(/(\d+.?\d*)%/g);          /**
   * Performs the specified operation
   * @param {any} percentages && percentages.length > - Optional parameter
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} percentages && percentages.length > - Optional parameter
   * @returns {any} The operation result
   */

          if (percentages && percentages.length >= 4) {
            coverageData = {
              lines: parseFloat(percentages[0]),
              functions: parseFloat(percentages[1]),
              branches: parseFloat(percentages[2]),
              statements: parseFloat(percentages[3])
            };
          }
        }
      }      /**
   * Performs the specified operation
   * @param {any} !coverageData
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} !coverageData
   * @returns {any} The operation result
   */


      if (!coverageData) {
        return { success: false, error: 'Could not parse coverage output' };
      }

      return { success: true, data: coverageData };

    }

    catch (error) {
      return { success: false, error: error.message };
    }
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeTestOrganization() {
    let score = 0;
    const maxScore = 4;

    // Check for test directory structure
    const hasTestDir = await this.fileExists('test') ||
                      await this.fileExists('tests') ||
                      await this.fileExists('__tests__') ||
                      await this.fileExists('src/__tests__');    /**
   * Performs the specified operation
   * @param {boolean} hasTestDir
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasTestDir
   * @returns {any} The operation result
   */


    if (hasTestDir) {
      score += 2;
      this.addScore(2, 2, 'Dedicated test directory found');
    }

    else {
      // Check for co-located tests
      const testFiles = await this.findTestFiles();      /**
   * Performs the specified operation
   * @param {any} testFiles.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} testFiles.length > 0
   * @returns {any} The operation result
   */

      if (testFiles.length > 0) {
        score += 1;
        this.addScore(1, 2, 'Co-located test files found');
      }

      else {
        this.addIssue('No organized test structure', 'Create a dedicated test directory or co-locate tests');
      }
    }

    // Check for different types of tests
    const testFiles = await this.findTestFiles();
    const hasUnitTests = testFiles.some(f => f.includes('unit') || f.includes('.test.') || f.includes('.spec.'));
    const hasIntegrationTests = testFiles.some(f => f.includes('integration') || f.includes('e2e'));    /**
   * Performs the specified operation
   * @param {boolean} hasUnitTests
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasUnitTests
   * @returns {any} The operation result
   */


    if (hasUnitTests) {
      score += 1;
      this.addScore(1, 1, 'Unit tests detected');
    }    /**
   * Performs the specified operation
   * @param {boolean} hasIntegrationTests
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} hasIntegrationTests
   * @returns {any} The operation result
   */


    if (hasIntegrationTests) {
      score += 1;
      this.addScore(1, 1, 'Integration/E2E tests detected');
    }

    else {
      this.addIssue('No integration tests found', 'Add integration tests for critical user flows');
    }

    this.setDetail('hasTestDir', hasTestDir);
    this.setDetail('hasUnitTests', hasUnitTests);
    this.setDetail('hasIntegrationTests', hasIntegrationTests);
  }  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Analyzes the provided data
   * @returns {Promise} Promise that resolves with the result
   */


  async analyzeTestingTools() {
    let score = 0;
    const maxScore = 3;

    const packageJson = await this.readPackageJson();    /**
   * Performs the specified operation
   * @param {any} !packageJson
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} !packageJson
   * @returns {any} The operation result
   */

    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot analyze testing dependencies');
      return;
    }

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const testingTools = this.identifyTestingTools(deps);    /**
   * Performs the specified operation
   * @param {any} testingTools.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} testingTools.length > 0
   * @returns {any} The operation result
   */


    if (testingTools.length > 0) {
      score += 2;
      this.addScore(2, 2, `Testing framework found: ${testingTools.join(', ')}`);
    }

    else {
      this.addIssue('No testing framework detected', 'Install a testing framework (Jest, Vitest, Mocha, etc.)');
    }

    // Check for test script in package.json    /**
   * Performs the specified operation
   * @param {any} packageJson.scripts && packageJson.scripts.test
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} packageJson.scripts && packageJson.scripts.test
   * @returns {any} The operation result
   */

    if (packageJson.scripts && packageJson.scripts.test) {
      score += 1;
      this.addScore(1, 1, 'Test script configured in package.json');
    }

    else {
      this.addIssue('No test script in package.json', 'Add "test" script to package.json');
    }

    this.setDetail('testingTools', testingTools);
    this.setDetail('hasTestScript', !!(packageJson.scripts && packageJson.scripts.test));
  }  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */
  /**
   * Tests the functionality
   * @returns {Promise} Promise that resolves with the result
   */


  async findTestFiles() {
    const testPatterns = [
      '.test.js', '.test.ts', '.test.jsx', '.test.tsx',
      '.spec.js', '.spec.ts', '.spec.jsx', '.spec.tsx'
    ];

    const testFiles = [];

    // Find files with test patterns    /**
   * Performs the specified operation
   * @param {any} const pattern of testPatterns
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const pattern of testPatterns
   * @returns {any} The operation result
   */

    for (const pattern of testPatterns) {
      const files = await this.getAllFiles('');
      testFiles.push(...files.filter(file => file.includes(pattern)));
    }

    // Find files in test directories
    const testDirs = ['test', 'tests', '__tests__', 'src/__tests__'];    /**
   * Performs the specified operation
   * @param {any} const dir of testDirs
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} const dir of testDirs
   * @returns {any} The operation result
   */

    for (const dir of testDirs) {
      if (await this.fileExists(dir)) {
        const files = await this.getAllFiles(dir, ['.js', '.ts', '.jsx', '.tsx']);
        testFiles.push(...files);
      }
    }

    // Remove duplicates
    return [...new Set(testFiles)];
  }  /**
   * Tests the functionality
   * @param {any} dependencies
   * @returns {any} The operation result
   */
  /**
   * Tests the functionality
   * @param {any} dependencies
   * @returns {any} The operation result
   */


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

    for (const [pkg, name] of Object.entries(testingPackages)) {      /**
   * Performs the specified operation
   * @param {any} dependencies[pkg]
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} dependencies[pkg]
   * @returns {any} The operation result
   */

      if (dependencies[pkg]) {
        tools.push(name);
      }
    }

    return tools;
  }

  /**
   * Analyze Test-First Development Patterns (Technical Debt Prevention)
   *
   * MISSION: Help AI assistants write code with proper test coverage to prevent technical debt
   * This method detects patterns that indicate whether the project follows test-first development
   */
  async analyzeTestFirstDevelopment() {
    let score = 0;
    const maxScore = 5; // Additional points for test-first development

    try {
      // Get source files and test files
      const sourceFiles = await this.getAllFiles('src', ['.js', '.ts', '.jsx', '.tsx']);
      const testFiles = await this.findTestFiles();      /**
   * Performs the specified operation
   * @param {any} sourceFiles.length - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} sourceFiles.length - Optional parameter
   * @returns {any} The operation result
   */


      if (sourceFiles.length === 0) {
        this.addScore(0, maxScore, 'No source files to analyze for test-first patterns');
        return;
      }

      // Analyze test-to-source file ratio
      const testToSourceRatio = testFiles.length / sourceFiles.length;      /**
   * Performs the specified operation
   * @param {any} testToSourceRatio > - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} testToSourceRatio > - Optional parameter
   * @returns {any} The operation result
   */


      if (testToSourceRatio >= 0.8) {
        score += 2;
        this.addScore(2, maxScore, `Excellent test-to-source ratio (${(testToSourceRatio * 100).toFixed(1)}%) - indicates test-first development`);
      }

      else if (testToSourceRatio >= 0.6) {
        score += 1.5;
        this.addScore(1.5, maxScore, `Good test-to-source ratio (${(testToSourceRatio * 100).toFixed(1)}%) - approaching test-first development`);
        this.addIssue('Test coverage could be improved', 'Aim for 80%+ test-to-source ratio for test-first development');
      }

      else if (testToSourceRatio >= 0.4) {
        score += 1;
        this.addScore(1, maxScore, `Moderate test-to-source ratio (${(testToSourceRatio * 100).toFixed(1)}%) - some test-first patterns`);
        this.addIssue('Low test-to-source ratio', 'Significantly increase test files to prevent technical debt');
      }

      else {
        score += 0.5;
        this.addScore(0.5, maxScore, `Poor test-to-source ratio (${(testToSourceRatio * 100).toFixed(1)}%) - high technical debt risk`);
        this.addIssue('Critical test-to-source ratio', 'Immediate action required: Add tests before writing more code');
      }

      // Analyze test file naming patterns (test-first indicators)
      const testFirstPatterns = await this.analyzeTestFirstPatterns(sourceFiles, testFiles);
      score += testFirstPatterns.score;

      // Analyze code complexity vs test coverage correlation
      const complexityAnalysis = await this.analyzeComplexityTestCorrelation(sourceFiles, testFiles);
      score += complexityAnalysis.score;

      this.setDetail('testFirstDevelopment', {
        testToSourceRatio: testToSourceRatio,
        testFirstPatterns: testFirstPatterns.details,
        complexityCorrelation: complexityAnalysis.details,
        score: score,
        maxScore: maxScore
      });

    }

    catch (error) {
      this.addScore(0, maxScore, `Error analyzing test-first development: ${error.message}`);
    }
  }

  /**
   * Analyze test-first development patterns in file structure and naming
   */
  async analyzeTestFirstPatterns(sourceFiles, testFiles) {
    let score = 0;
    const details = {
      parallelStructure: false,
      testFirstNaming: false,
      testDrivenFiles: 0
    };

    try {
      // Check for parallel test structure (src/ vs tests/ or src/ vs src/__tests__/)
      const sourceDirs = new Set(sourceFiles.map(f => f.split('/').slice(0, -1).join('/')));
      const testDirs = new Set(testFiles.map(f => f.split('/').slice(0, -1).join('/')));

      // Look for parallel structure patterns
      const hasParallelStructure = Array.from(sourceDirs).some(sourceDir => {
        const testDir = sourceDir.replace('src/', 'tests/').replace('src/', 'test/');
        return testDirs.has(testDir) || testDirs.has(sourceDir + '/__tests__');
      });      /**
   * Performs the specified operation
   * @param {boolean} hasParallelStructure
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {boolean} hasParallelStructure
   * @returns {any} The operation result
   */


      if (hasParallelStructure) {
        score += 1;
        details.parallelStructure = true;
      }

      // Check for test-first naming patterns (test files created before source files)
      const testFirstNaming = testFiles.some(testFile => {
        const sourceFile = testFile.replace(/.(test|spec)./, '.').replace(/.(test|spec)$/, '');
        return sourceFiles.includes(sourceFile);
      });      /**
   * Performs the specified operation
   * @param {any} testFirstNaming
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} testFirstNaming
   * @returns {any} The operation result
   */


      if (testFirstNaming) {
        score += 1;
        details.testFirstNaming = true;
      }

      // Count files that have corresponding tests (test-driven development indicator)
      const testDrivenFiles = sourceFiles.filter(sourceFile => {
        const testFile = sourceFile.replace(/.(js|ts|jsx|tsx)$/, '.test.$1');
        return testFiles.includes(testFile);
      }).length;

      details.testDrivenFiles = testDrivenFiles;      /**
   * Performs the specified operation
   * @param {any} testDrivenFiles > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} testDrivenFiles > 0
   * @returns {any} The operation result
   */

      if (testDrivenFiles > 0) {
        score += 0.5;
      }

    }

    catch (error) {
      // Continue with analysis even if this part fails
    }

    return { score, details };
  }

  /**
   * Analyze correlation between code complexity and test coverage
   * High complexity files should have corresponding tests
   */
  async analyzeComplexityTestCorrelation(sourceFiles, testFiles) {
    let score = 0;
    const details = {
      complexFilesWithoutTests: 0,
      totalComplexFiles: 0,
      correlationScore: 0
    };

    try {
      // Sample files for complexity analysis (limit to avoid performance issues)
      const sampleFiles = sourceFiles.slice(0, 20);      /**
   * Performs the specified operation
   * @param {any} const sourceFile of sampleFiles
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} const sourceFile of sampleFiles
   * @returns {any} The operation result
   */


      for (const sourceFile of sampleFiles) {
        try {
          const content = await this.safeFileRead(sourceFile);          /**
   * Performs the specified operation
   * @param {any} !content
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {any} !content
   * @returns {any} The operation result
   */

          if (!content) {continue;}

          // Simple complexity analysis (line count, function count)
          const lines = content.split('\n').length;
          const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
          const complexity = lines + (functionCount * 2); // Weight functions more heavily

          // Consider files with >100 lines or >5 functions as "complex"          /**
   * Performs the specified operation
   * @param {number} lines > 100 || functionCount > 5
   * @returns {any} The operation result
   */
          /**
   * Performs the specified operation
   * @param {number} lines > 100 || functionCount > 5
   * @returns {any} The operation result
   */

          if (lines > 100 || functionCount > 5) {
            details.totalComplexFiles++;

            // Check if this complex file has a corresponding test
            const testFile = sourceFile.replace(/.(js|ts|jsx|tsx)$/, '.test.$1');
            const hasTest = testFiles.includes(testFile);            /**
   * Performs the specified operation
   * @param {boolean} !hasTest
   * @returns {any} The operation result
   */
            /**
   * Performs the specified operation
   * @param {boolean} !hasTest
   * @returns {any} The operation result
   */


            if (!hasTest) {
              details.complexFilesWithoutTests++;
            }
          }
        }

        catch (error) {
          // Skip files that can't be read
          continue;
        }
      }

      // Calculate correlation score      /**
   * Performs the specified operation
   * @param {any} details.totalComplexFiles > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} details.totalComplexFiles > 0
   * @returns {any} The operation result
   */

      if (details.totalComplexFiles > 0) {
        details.correlationScore = (details.totalComplexFiles - details.complexFilesWithoutTests) / details.totalComplexFiles;        /**
   * Performs the specified operation
   * @param {any} details.correlationScore > - Optional parameter
   * @returns {any} The operation result
   */
        /**
   * Performs the specified operation
   * @param {any} details.correlationScore > - Optional parameter
   * @returns {any} The operation result
   */


        if (details.correlationScore >= 0.8) {
          score += 1;
        }

        else if (details.correlationScore >= 0.6) {
          score += 0.5;
        }

        else if (details.correlationScore < 0.4) {
          this.addIssue('Complex files lack test coverage', 'High complexity files should have corresponding tests to prevent technical debt');
        }
      }

    }

    catch (error) {
      // Continue with analysis even if this part fails
    }

    return { score, details };
  }
}