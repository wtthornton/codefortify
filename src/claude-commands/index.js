/**
 * CodeFortify Claude Code Integration - Main Interface
 *
 * Easy-to-use functions for Claude Code integration
 * Provides intelligent wrappers for the most valuable CodeFortify operations
 */

import CodeFortifyCommands from './CodeFortifyCommands.js';

// Global instance for easy access
let codefortify = null;

/**
 * Initialize CodeFortify commands for current project
 */
export function initializeCodeFortify(options = {}) {
  codefortify = new CodeFortifyCommands(options);
  return codefortify;
}

/**
 * 🎯 Quick Quality Check
 * Perfect for getting an immediate assessment of code quality
 */
export async function quickCheck() {  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */

  if (!codefortify) {initializeCodeFortify();}

  // LOG: 🎯 Running quick quality check...
  const result = await codefortify.quickHealthCheck();  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */


  if (result.success) {
    // LOG: `\n${result.health.icon} **Project Health: ${result.health.level}**`
    // LOG: `📊 Current Score: ${result.health.score}/100`
  /**
   * Performs the specified operation
   * @param {boolean} result.urgentIssues.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {boolean} result.urgentIssues.length > 0
   * @returns {any} The operation result
   */
    if (result.urgentIssues.length > 0) {
      // LOG: \n🚨 **Urgent Issues:**
      result.urgentIssues.forEach(issue => {
        // LOG: `  • ${issue.category}: ${issue.score}% (${issue.severity})`
      });
    }    /**
   * Performs the specified operation
   * @param {any} result.quickFixes.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.quickFixes.length > 0
   * @returns {any} The operation result
   */


    if (result.quickFixes.length > 0) {
      // LOG: \n⚡ **Quick Fixes:**
      result.quickFixes.forEach(fix => console.log(`  • ${fix}`));
    }
  }

  return result;
}

/**
 * 🔍 Analyze Code Quality
 * Comprehensive analysis with actionable insights
 */
export async function analyzeQuality(options = {}) {  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */

  if (!codefortify) {initializeCodeFortify();}

  // LOG: 🔍 Analyzing code quality...
  const result = await codefortify.analyzeQuality(options);  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */


  if (result.success) {
    // LOG: `\n📊 **Overall Score: ${result.analysis.overallScore}/100** (${result.analysis.overallGrade})`
    // Show insights  /**
   * Performs the specified operation
   * @param {any} result.insights.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.insights.length > 0
   * @returns {any} The operation result
   */

    if (result.insights.length > 0) {
      // LOG: \n💡 **Key Insights:**
      result.insights.forEach(insight => console.log(`  ${insight}`));
    }

    // Show prioritized recommendations    /**
   * Performs the specified operation
   * @param {any} result.recommendations.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.recommendations.length > 0
   * @returns {any} The operation result
   */

    if (result.recommendations.length > 0) {
      // LOG: \n🎯 **Priority Actions:**
      result.recommendations.forEach(rec => {
        // LOG: `  ${rec.priority} ${rec.category} (${rec.score}%)`
        // LOG: `    → ${rec.action}`
      });
    }
  } else {
    // LOG: `❌ Analysis failed: ${result.error}`
  /**
   * Performs the specified operation
   * @param {any} result.suggestion
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.suggestion
   * @returns {any} The operation result
   */
    if (result.suggestion) {
      // LOG: `💡 Suggestion: ${result.suggestion}`
    }
  }

  return result;
}

/**
 * 🚀 Enhance Code
 * Autonomous code improvement with intelligent defaults
 */
export async function enhanceCode(options = {}) {  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */

  if (!codefortify) {initializeCodeFortify();}

  // LOG: 🚀 Starting code enhancement...
  const result = await codefortify.enhanceCode(options);  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */


  if (result.success) {  /**
   * Performs the specified operation
   * @param {any} result.dryRun
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.dryRun
   * @returns {any} The operation result
   */

    if (result.dryRun) {
      // LOG: \n🧪 **Dry Run Preview:**
      // LOG: `Command: ${result.command}`
      // LOG: `Target: ${result.estimatedImpact.targetScore}% (+${result.estimatedImpact.expectedImprovement}%)`
      // LOG: `Estimated Time: ${result.estimatedImpact.estimatedTime}`
    } else {
      // LOG: \n✅ **Enhancement Complete!**
      /**
   * Performs the specified operation
   * @param {any} result.improvement
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} result.improvement
   * @returns {any} The operation result
   */
      if (result.improvement) {
        // LOG: `📈 Score Change: ${result.improvement.before}% → ${result.improvement.after}%`
      }      /**
   * Performs the specified operation
   * @param {any} result.nextSteps.length > 0
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} result.nextSteps.length > 0
   * @returns {any} The operation result
   */


      if (result.nextSteps.length > 0) {
        // LOG: \n🎯 **Next Steps:**
        result.nextSteps.forEach(step => console.log(`  • ${step}`));
      }
    }
  } else {
    // LOG: `❌ Enhancement failed: ${result.error}`
  /**
   * Performs the specified operation
   * @param {any} result.suggestion
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.suggestion
   * @returns {any} The operation result
   */
    if (result.suggestion) {console.log(`💡 ${result.suggestion}`);}    /**
   * Performs the specified operation
   * @param {any} result.recovery
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.recovery
   * @returns {any} The operation result
   */

    if (result.recovery) {
      // LOG: 🔧 **Recovery Actions:**
      result.recovery.forEach(action => console.log(`  • ${action}`));
    }
  }

  return result;
}

/**
 * 📊 Generate Report
 * Create professional HTML quality report
 */
export async function generateReport(options = {}) {  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */

  if (!codefortify) {initializeCodeFortify();}

  // LOG: 📊 Generating quality report...
  const result = await codefortify.generateReport(options);  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */


  if (result.success) {
    // LOG: \n✅ **Report Generated!**
  /**
   * Performs the specified operation
   * @param {string} result.reportPath
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {string} result.reportPath
   * @returns {any} The operation result
   */
    if (result.reportPath) {
      // LOG: `📄 Location: ${result.reportPath}`
      // LOG: `📏 Size: ${result.reportSize}`
    }    /**
   * Performs the specified operation
   * @param {any} result.summary
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.summary
   * @returns {any} The operation result
   */


    if (result.summary) {
      // LOG: `📋 ${result.summary}`
    }    /**
   * Performs the specified operation
   * @param {any} result.recommendations?.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.recommendations?.length > 0
   * @returns {any} The operation result
   */


    if (result.recommendations?.length > 0) {
      // LOG: \n🎯 **Key Recommendations:**
      result.recommendations.slice(0, 3).forEach(rec => console.log(`  • ${rec}`));
    }
  } else {
    // LOG: `❌ Report generation failed: ${result.error}`
  /**
   * Performs the specified operation
   * @param {any} result.fallback
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.fallback
   * @returns {any} The operation result
   */
    if (result.fallback) {console.log(`💡 Fallback: ${result.fallback}`);}
  }

  return result;
}

/**
 * ✅ Validate Project
 * Check CodeFortify compliance and project setup
 */
export async function validateProject() {  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} !codefortify
   * @returns {any} The operation result
   */

  if (!codefortify) {initializeCodeFortify();}

  // LOG: ✅ Validating project...
  const result = await codefortify.validateProject();  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {any} result.success
   * @returns {any} The operation result
   */


  if (result.success) {
    // LOG: \n✅ **Project Validation Passed!**
  /**
   * Performs the specified operation
   * @param {number} result.setup?.valid
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {number} result.setup?.valid
   * @returns {any} The operation result
   */
    if (result.setup?.valid) {
      // LOG: 📋 Project setup is complete and compliant
    }
  } else {
    // LOG: `❌ Validation failed: ${result.error}`
  /**
   * Performs the specified operation
   * @param {any} result.fixes?.length > 0
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.fixes?.length > 0
   * @returns {any} The operation result
   */
    if (result.fixes?.length > 0) {
      // LOG: \n🔧 **Suggested Fixes:**
      result.fixes.forEach(fix => console.log(`  • ${fix}`));
    }    /**
   * Performs the specified operation
   * @param {any} result.setup
   * @returns {any} The operation result
   */
    /**
   * Performs the specified operation
   * @param {any} result.setup
   * @returns {any} The operation result
   */


    if (result.setup) {
      // LOG: \n📋 **Setup Recommendations:**
      result.setup.forEach(setup => console.log(`  • ${setup}`));
    }
  }

  return result;
}

// === Convenience Functions for Common Workflows ===

/**
 * 🎯 Complete Quality Assessment
 * Full analysis + report generation in one command
 */
export async function fullAssessment(options = {}) {
  // LOG: 🎯 Running complete quality assessment...
  // Step 1: Quick health check
  const health = await quickCheck();

  // Step 2: Detailed analysis
  const analysis = await analyzeQuality({
    detailed: true,
    recommendations: true
  });

  // Step 3: Generate report if requested
  let report = null;  /**
   * Performs the specified operation
   * @param {Object} options.generateReport ! - Optional parameter
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {Object} options.generateReport ! - Optional parameter
   * @returns {any} The operation result
   */

  if (options.generateReport !== false) {
    report = await generateReport({
      includeRecommendations: true,
      autoOpen: options.autoOpen !== false
    });
  }

  return {
    health,
    analysis,
    report,
    summary: {
      score: analysis.success ? analysis.analysis.overallScore : 0,
      healthLevel: health.success ? health.health.level : 'Unknown',
      urgentIssues: health.success ? health.urgentIssues.length : 0,
      reportGenerated: report?.success || false
    }
  };
}

/**
 * 🚀 Smart Enhancement Workflow
 * Analysis + Enhancement + Validation in sequence
 */
export async function smartEnhancementWorkflow(options = {}) {
  // LOG: 🚀 Starting smart enhancement workflow...
  // Step 1: Pre-enhancement analysis
  const beforeAnalysis = await analyzeQuality();

  // Step 2: Smart enhancement
  const enhancement = await enhanceCode({
    dryRun: options.dryRun,
    ...options
  });

  // Step 3: Post-enhancement validation (if not dry run)
  let validation = null;  /**
   * Performs the specified operation
   * @param {Object} !options.dryRun && enhancement.success
   * @returns {any} The operation result
   */
  /**
   * Performs the specified operation
   * @param {Object} !options.dryRun && enhancement.success
   * @returns {any} The operation result
   */

  if (!options.dryRun && enhancement.success) {
    validation = await validateProject();
  }

  return {
    before: beforeAnalysis,
    enhancement,
    validation,
    workflow: {
      completed: enhancement.success && (options.dryRun || validation?.success),
      improvementMade: enhancement.success && !options.dryRun
    }
  };
}

// Export the main class for advanced usage
export { CodeFortifyCommands };

// Export all individual functions for easy access
export default {
  initialize: initializeCodeFortify,
  quickCheck,
  analyzeQuality,
  enhanceCode,
  generateReport,
  validateProject,
  fullAssessment,
  smartEnhancementWorkflow
};