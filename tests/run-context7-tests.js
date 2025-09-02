#!/usr/bin/env node

/**
 * Test runner for Context7 enhancement system tests
 * Runs all tests related to the new Context7 enhancement functionality
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testSuites = [
  {
    name: 'Context Analysis Tests',
    pattern: 'tests/unit/context/**/*.test.js',
    description: 'Tests for AdvancedContextAnalyzer and related components'
  },
  {
    name: 'Pattern Learning Tests',
    pattern: 'tests/unit/learning/**/*.test.js',
    description: 'Tests for DynamicPatternLearner and learning system'
  },
  {
    name: 'Quality Monitoring Tests',
    pattern: 'tests/unit/monitoring/**/*.test.js',
    description: 'Tests for RealtimeQualityMonitor and monitoring components'
  },
  {
    name: 'Integration Tests',
    pattern: 'tests/integration/context7-enhancement-system.test.js',
    description: 'Integration tests for the complete Context7 enhancement system'
  }
];

function runTestSuite(suite) {
  // LOG: `\n🧪 Running ${suite.name}...`
  // LOG: `📝 ${suite.description}`
  // LOG: `🔍 Pattern: ${suite.pattern}`
  // LOG: ─.repeat(60)
  try {
    const command = `npx vitest run ${suite.pattern} --reporter=verbose`;
    execSync(command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    // LOG: `✅ ${suite.name} completed successfully`
    return true;
  } catch (error) {
    // ERROR: `❌ ${suite.name} failed`
    // ERROR: error.message
    return false;
  }
}

function runAllTests() {
  // LOG: 🚀 Starting Context7 Enhancement System Tests
  // LOG: =.repeat(60)
  const results = [];

  for (const suite of testSuites) {
    const success = runTestSuite(suite);
    results.push({ suite: suite.name, success });
  }

  // Summary
  // LOG: \n📊 Test Results Summary
  // LOG: =.repeat(60)
  const _passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    // LOG: `${status} ${result.suite}`
  });

  // LOG: `\n📈 Overall: ${passed} passed, ${failed} failed`
  if (failed > 0) {
    // LOG: \n💡 To run individual test suites:
    testSuites.forEach(suite => {
      // LOG: `   npm run test:context7:${suite.name.toLowerCase().replace(/\s+/g, -)}`
    });
    process.exit(1);
  } else {
    // LOG: \n🎉 All Context7 enhancement tests passed!
  }
}

function runCoverageReport() {
  // LOG: \n📊 Generating Coverage Report for Context7 Enhancements...
  // LOG: ─.repeat(60)
  try {
    const command = 'npx vitest run --coverage --reporter=verbose';
    execSync(command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    // LOG: ✅ Coverage report generated successfully
  } catch (error) {
    // ERROR: ❌ Coverage report generation failed
    // ERROR: error.message
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
case 'all':
  runAllTests();
  break;
case 'coverage':
  runCoverageReport();
  break;
case 'context':
  runTestSuite(testSuites[0]);
  break;
case 'learning':
  runTestSuite(testSuites[1]);
  break;
case 'monitoring':
  runTestSuite(testSuites[2]);
  break;
case 'integration':
  runTestSuite(testSuites[3]);
  break;
default:
  // LOG: Context7 Enhancement System Test Runner
  // LOG: Usage: node run-context7-tests.js <command>
  // LOG:
  // LOG: Commands:
  // LOG:   all         Run all Context7 enhancement tests
  // LOG:   coverage    Generate coverage report
  // LOG:   context     Run context analysis tests only
  // LOG:   learning    Run pattern learning tests only
  // LOG:   monitoring  Run quality monitoring tests only
  // LOG:   integration Run integration tests only
  // LOG:
  // LOG: Examples:
  // LOG:   node run-context7-tests.js all
  // LOG:   node run-context7-tests.js coverage
  // LOG:   node run-context7-tests.js context
  break;
}
