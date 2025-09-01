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
  console.log(`\n🧪 Running ${suite.name}...`);
  console.log(`📝 ${suite.description}`);
  console.log(`🔍 Pattern: ${suite.pattern}`);
  console.log('─'.repeat(60));

  try {
    const command = `npx vitest run ${suite.pattern} --reporter=verbose`;
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${suite.name} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${suite.name} failed`);
    console.error(error.message);
    return false;
  }
}

function runAllTests() {
  console.log('🚀 Starting Context7 Enhancement System Tests');
  console.log('='.repeat(60));

  const results = [];
  
  for (const suite of testSuites) {
    const success = runTestSuite(suite);
    results.push({ suite: suite.name, success });
  }

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.suite}`);
  });
  
  console.log(`\n📈 Overall: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n💡 To run individual test suites:');
    testSuites.forEach(suite => {
      console.log(`   npm run test:context7:${suite.name.toLowerCase().replace(/\s+/g, '-')}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All Context7 enhancement tests passed!');
  }
}

function runCoverageReport() {
  console.log('\n📊 Generating Coverage Report for Context7 Enhancements...');
  console.log('─'.repeat(60));

  try {
    const command = 'npx vitest run --coverage --reporter=verbose';
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Coverage report generated successfully');
  } catch (error) {
    console.error('❌ Coverage report generation failed');
    console.error(error.message);
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
    console.log('Context7 Enhancement System Test Runner');
    console.log('Usage: node run-context7-tests.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  all         Run all Context7 enhancement tests');
    console.log('  coverage    Generate coverage report');
    console.log('  context     Run context analysis tests only');
    console.log('  learning    Run pattern learning tests only');
    console.log('  monitoring  Run quality monitoring tests only');
    console.log('  integration Run integration tests only');
    console.log('');
    console.log('Examples:');
    console.log('  node run-context7-tests.js all');
    console.log('  node run-context7-tests.js coverage');
    console.log('  node run-context7-tests.js context');
    break;
}
