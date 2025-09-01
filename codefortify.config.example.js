/**
 * Context7-MCP Configuration Example
 * 
 * Copy this file to codefortify.config.js and customize for your project.
 * This configuration enables Smart Report Routing and Quality Gates Integration.
 */

module.exports = {
  // Project configuration
  projectRoot: process.cwd(),
  verbose: false,

  // Smart Report Routing Configuration
  routing: {
    // Strategy: 'auto' (detect), 'monorepo', 'single', 'workspace', 'custom'
    strategy: 'auto',
    
    // Base directory for reports (relative to project root)
    basePath: './reports',
    
    // Format-specific custom paths
    customPaths: {
      html: './docs/quality-reports',
      json: './data/quality-metrics',
      markdown: './docs'
    },
    
    // Organization structure
    organization: {
      byDate: true,           // Organize by date (YYYY-MM-DD)
      byProject: false,       // Organize by project name
      dateFormat: 'YYYY-MM-DD',
      maxHistory: 30          // Keep last 30 reports
    }
  },

  // Quality Gates Configuration
  gates: {
    enabled: true,
    
    // Quality thresholds
    thresholds: {
      overall: { 
        min: 70,      // Minimum overall score
        warning: 80   // Warning threshold
      },
      categories: {
        quality: { min: 15, warning: 18 },
        testing: { min: 10, warning: 12 },
        security: { min: 12, warning: 14 },
        structure: { min: 15, warning: 18 },
        performance: { min: 10, warning: 12 },
        developerExperience: { min: 7, warning: 9 },
        completeness: { min: 3, warning: 4 }
      }
    },
    
    // CI/CD integration
    ci: {
      format: 'auto',  // 'auto', 'github-actions', 'gitlab-ci', 'jenkins', 'generic'
      output: {
        summary: true,
        detailed: false,
        trend: false
      },
      blocking: {
        enabled: true,
        onFailure: 'error',    // 'error', 'warning', 'none'
        onWarning: 'warning'
      },
      setEnvironment: true,
      environmentPrefix: 'QUALITY_GATES_'
    }
  },

  // Scoring configuration
  scoring: {
    categories: ['all'],  // or specific categories: ['quality', 'testing', 'security']
    detailed: false,
    includeRecommendations: true
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  module.exports.gates.thresholds.overall.min = 80;
  module.exports.gates.thresholds.overall.warning = 90;
}

if (process.env.CI === 'true') {
  module.exports.gates.ci.blocking.enabled = true;
  module.exports.gates.ci.setEnvironment = true;
}
