/**
 * Vitest Configuration with Professional Coverage Thresholds
 *
 * Comprehensive testing setup with module-specific coverage requirements,
 * performance monitoring, and detailed reporting for Context7 MCP package.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment and globals
    environment: 'node',
    globals: true,

    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/templates/**'
    ],

    // Enhanced coverage configuration
    coverage: {
      provider: 'v8',  // Use v8 provider for better compatibility
      reporter: ['text', 'json', 'html', 'lcov', 'clover', 'text-summary'],
      reportsDirectory: './coverage',

      // Professional coverage thresholds by module importance
      thresholds: {
        // Overall project minimum standards
        global: {
          branches: 85,      // 85% branch coverage
          functions: 85,     // 85% function coverage
          lines: 85,         // 85% line coverage
          statements: 85     // 85% statement coverage
        },

        // Core scoring system - highest standards (business critical)
        'src/scoring/ProjectScorer*.js': {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90
        },

        // Individual analyzers - high standards
        'src/scoring/analyzers/*.js': {
          branches: 88,
          functions: 90,
          lines: 88,
          statements: 88
        },

        // Core modules - high standards
        'src/scoring/core/*.js': {
          branches: 87,
          functions: 90,
          lines: 87,
          statements: 87
        },

        // Scoring reports - high standards (user-facing)
        'src/scoring/ScoringReport.js': {
          branches: 85,
          functions: 90,
          lines: 85,
          statements: 85
        },

        // MCP Server - high standards (external interface)
        'src/server/*.js': {
          branches: 85,
          functions: 88,
          lines: 85,
          statements: 85
        },

        // Validation - high standards (critical for correctness)
        'src/validation/*.js': {
          branches: 88,
          functions: 90,
          lines: 88,
          statements: 88
        },

        // CLI commands - moderate standards (interactive, hard to test)
        'src/cli/**/*.js': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        },

        // Testing utilities - moderate standards
        'src/testing/*.js': {
          branches: 80,
          functions: 85,
          lines: 82,
          statements: 82
        }
      },

      // Include/exclude patterns for coverage analysis
      include: [
        'src/**/*.{js,mjs,cjs,ts,tsx}'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.config.js',
        'src/**/*.test.{js,ts}',
        'src/**/*.spec.{js,ts}',
        'src/**/types.js',
        'bin/**/*.js',        // CLI entry points
        'templates/**',       // Template files
        'src/**/constants.js', // Simple constant files
        '**/*.benchmark.js'   // Performance benchmarks
      ],

      // Coverage reporting configuration
      all: true,              // Include all files in coverage
      clean: true,            // Clean coverage directory before each run
      skipFull: false,        // Don't skip files with 100% coverage
      watermarks: {
        statements: [80, 90],
        functions: [80, 90],
        branches: [75, 85],
        lines: [80, 90]
      }
    },

    // Performance and timeout settings
    testTimeout: 15000,       // 15 second timeout per test (some integration tests need time)
    hookTimeout: 10000,       // 10 second timeout for setup/teardown
    teardownTimeout: 5000,    // 5 second cleanup timeout

    // Parallel execution settings
    threads: true,            // Enable parallel test execution
    maxThreads: 4,           // Limit concurrent threads to prevent resource exhaustion
    minThreads: 1,           // Minimum threads for small test suites
    isolate: true,           // Isolate test environments

    // Reporter configuration
    reporter: [
      'verbose',              // Detailed console output
      'json',                 // Machine-readable results
      'junit'                 // CI/CD compatible format
    ],

    outputFile: {
      json: './test-results/results.json',
      html: './test-results/report.html',
      junit: './test-results/junit.xml'
    },

    // Mock and stub behavior
    clearMocks: true,         // Clear mocks between tests
    restoreMocks: true,       // Restore original implementations
    mockReset: true,          // Reset mock state

    // Development experience
    watch: true,              // Enable watch mode for development
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/test-results/**',
      '**/.git/**'
    ],

    // Setup and teardown
    setupFiles: [
      './tests/setup.js'
    ],

    // Global test configuration
    retry: 2,                 // Retry flaky tests twice
    bail: 10,                 // Stop after 10 test failures

    // Performance benchmarks
    benchmark: {
      include: [
        '**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
      ],
      exclude: [
        'node_modules',
        'dist'
      ],
      reporters: ['verbose']
    }
  },

  // Module resolution
  resolve: {
    alias: {
      '@': './src',
      '@tests': './tests',
      '@fixtures': './tests/fixtures'
    }
  }
});