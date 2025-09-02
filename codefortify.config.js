/**
 * CodeFortify Configuration
 *
 * Configuration for AI-powered code strengthening and security enhancement
 */

export default {
  // Project metadata
  name: '@wtthornton/codefortify',
  type: 'ai-ml',
  description: 'CodeFortify - AI-powered code strengthening and security enhancement for modern development',

  // MCP Server configuration
  mcp: {
    enabled: true,
    server: './src/mcp-server.js',
    port: 3001,

    // Available resources
    resources: {
      standards: true,        // CodeFortify security standards
      patterns: true,         // Framework-specific patterns
      documentation: true     // Project documentation
    },

    // Available tools
    tools: {
      validate: true,         // CodeFortify compliance validation
      generate: true,         // Pattern generation
      analyze: true          // Security analysis
    }
  },

  // Agent OS integration
  agentOS: {
    enabled: true,
    configFile: './AGENTS.md'
  },

  // Quality scoring configuration
  scoring: {
    categories: [
      'structure',           // Code Structure & Architecture (20pts)
      'quality',            // Code Quality & Maintainability (20pts)
      'performance',        // Performance & Optimization (15pts)
      'testing',           // Testing & Documentation (15pts)
      'security',          // Security & Error Handling (15pts)
      'developerExperience', // Developer Experience (10pts)
      'completeness'       // Completeness & Production Readiness (5pts)
    ],

    // Scoring thresholds
    thresholds: {
      excellent: 90,
      good: 75,
      warning: 60,
      poor: 40
    }
  }
};
