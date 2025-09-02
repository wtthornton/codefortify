/**
 * CodeFortify Claude Code Integration Demo
 *
 * Demonstrates the most valuable CodeFortify commands
 * optimized for Claude Code usage
 */

import codefortify from '../src/claude-commands/index.js';

// === Demo Functions ===

async function demoQuickCheck() {
  console.log('='.repeat(60));
  console.log('🎯 DEMO: Quick Health Check');
  console.log('='.repeat(60));

  const result = await codefortify.quickCheck();

  console.log('\n📋 **What this provides:**');
  console.log('  • Instant project health assessment');
  console.log('  • Identification of urgent issues');
  console.log('  • Quick fixes that can be applied immediately');
  console.log('  • Real-time status information');

  return result;
}

async function demoSmartAnalysis() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DEMO: Smart Quality Analysis');
  console.log('='.repeat(60));

  const result = await codefortify.analyzeQuality({
    detailed: true,
    recommendations: true
  });

  console.log('\n📋 **What this provides:**');
  console.log('  • Comprehensive 7-category quality breakdown');
  console.log('  • Contextual insights based on score patterns');
  console.log('  • Prioritized recommendations with impact estimates');
  console.log('  • Intelligent interpretation of results');

  return result;
}

async function demoEnhancementPreview() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 DEMO: Smart Enhancement Preview');
  console.log('='.repeat(60));

  const result = await codefortify.enhanceCode({
    dryRun: true  // Preview only, don't actually enhance
  });

  console.log('\n📋 **What this provides:**');
  console.log('  • Intelligent target score calculation');
  console.log('  • Estimated iterations and time requirements');
  console.log('  • Preview of enhancement command to be executed');
  console.log('  • Safe preview mode for planning');

  return result;
}

async function demoReportGeneration() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEMO: Professional Report Generation');
  console.log('='.repeat(60));

  const result = await codefortify.generateReport({
    includeRecommendations: true,
    includeMetrics: true,
    autoOpen: false  // Don't auto-open in demo
  });

  console.log('\n📋 **What this provides:**');
  console.log('  • Professional HTML report with charts and graphs');
  console.log('  • Executive summary for stakeholders');
  console.log('  • Detailed technical recommendations');
  console.log('  • Historical trend analysis (when available)');

  return result;
}

async function demoFullWorkflow() {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 DEMO: Complete Assessment Workflow');
  console.log('='.repeat(60));

  const result = await codefortify.fullAssessment({
    generateReport: true,
    autoOpen: false
  });

  console.log('\n📋 **What this provides:**');
  console.log('  • Complete quality assessment in one command');
  console.log('  • Health check + detailed analysis + report');
  console.log('  • Consolidated summary of all findings');
  console.log('  • Perfect for project reviews and audits');

  return result;
}

// === Usage Examples for Claude Code ===

function showUsageExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('📚 CLAUDE CODE USAGE EXAMPLES');
  console.log('='.repeat(60));

  console.log(`
🎯 **Quick Commands for Claude Code:**

// Quick health check
import codefortify from './src/claude-commands/index.js';
await codefortify.quickCheck();

// Smart analysis with insights
await codefortify.analyzeQuality({ detailed: true });

// Preview enhancement plan
await codefortify.enhanceCode({ dryRun: true });

// Generate professional report  
await codefortify.generateReport({ autoOpen: true });

// Complete assessment workflow
await codefortify.fullAssessment();

🚀 **Advanced Workflows:**

// Smart enhancement workflow (analysis -> enhance -> validate)
await codefortify.smartEnhancementWorkflow({ 
    target: 90, 
    iterations: 3 
});

// Custom analysis with specific focus
await codefortify.analyzeQuality({
    detailed: true,
    recommendations: true,
    generateReport: true
});

🎨 **Natural Language Integration:**

Instead of remembering CLI syntax, Claude Code can use these commands
contextually based on conversation:

"Check the code quality" → quickCheck()
"Analyze this project" → analyzeQuality()  
"How can I improve this?" → enhanceCode({ dryRun: true })
"Generate a report" → generateReport()
"Run a complete audit" → fullAssessment()
`);
}

// === Main Demo Runner ===

async function runCompleteDemo() {
  console.log(`
🚀 CodeFortify Claude Code Integration Demo
==========================================

This demo shows the most valuable CodeFortify commands
optimized for seamless Claude Code integration.
`);

  try {
    // Initialize CodeFortify
    codefortify.initialize({ verbose: false });

    // Run demos
    await demoQuickCheck();
    await demoSmartAnalysis();
    await demoEnhancementPreview();
    await demoReportGeneration();
    await demoFullWorkflow();

    // Show usage examples
    showUsageExamples();

    console.log(`
✅ Demo Complete!

The CodeFortify Claude Code integration provides:
• Natural language interface to CodeFortify features
• Intelligent defaults and contextual insights  
• Error handling and recovery suggestions
• Consolidated workflows for common tasks
• Professional reporting and analysis

This eliminates the need to remember CLI syntax while
providing enhanced functionality through AI-powered
contextual intelligence.
`);

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('\n💡 This is expected if CodeFortify CLI is not properly installed.');
    console.log('   The integration will work once CodeFortify is set up.');
  }
}

// Export for use in other contexts
export {
  demoQuickCheck,
  demoSmartAnalysis,
  demoEnhancementPreview,
  demoReportGeneration,
  demoFullWorkflow,
  showUsageExamples
};

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteDemo();
}