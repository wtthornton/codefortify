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
export async function quickCheck() {
    if (!codefortify) initializeCodeFortify();
    
    console.log('🎯 Running quick quality check...');
    const result = await codefortify.quickHealthCheck();
    
    if (result.success) {
        console.log(`\n${result.health.icon} **Project Health: ${result.health.level}**`);
        console.log(`📊 Current Score: ${result.health.score}/100`);
        
        if (result.urgentIssues.length > 0) {
            console.log('\n🚨 **Urgent Issues:**');
            result.urgentIssues.forEach(issue => {
                console.log(`  • ${issue.category}: ${issue.score}% (${issue.severity})`);
            });
        }
        
        if (result.quickFixes.length > 0) {
            console.log('\n⚡ **Quick Fixes:**');
            result.quickFixes.forEach(fix => console.log(`  • ${fix}`));
        }
    }
    
    return result;
}

/**
 * 🔍 Analyze Code Quality  
 * Comprehensive analysis with actionable insights
 */
export async function analyzeQuality(options = {}) {
    if (!codefortify) initializeCodeFortify();
    
    console.log('🔍 Analyzing code quality...');
    const result = await codefortify.analyzeQuality(options);
    
    if (result.success) {
        console.log(`\n📊 **Overall Score: ${result.analysis.overallScore}/100** (${result.analysis.overallGrade})`);
        
        // Show insights
        if (result.insights.length > 0) {
            console.log('\n💡 **Key Insights:**');
            result.insights.forEach(insight => console.log(`  ${insight}`));
        }
        
        // Show prioritized recommendations
        if (result.recommendations.length > 0) {
            console.log('\n🎯 **Priority Actions:**');
            result.recommendations.forEach(rec => {
                console.log(`  ${rec.priority} ${rec.category} (${rec.score}%)`);
                console.log(`    → ${rec.action}`);
            });
        }
    } else {
        console.log(`❌ Analysis failed: ${result.error}`);
        if (result.suggestion) {
            console.log(`💡 Suggestion: ${result.suggestion}`);
        }
    }
    
    return result;
}

/**
 * 🚀 Enhance Code
 * Autonomous code improvement with intelligent defaults
 */
export async function enhanceCode(options = {}) {
    if (!codefortify) initializeCodeFortify();
    
    console.log('🚀 Starting code enhancement...');
    const result = await codefortify.enhanceCode(options);
    
    if (result.success) {
        if (result.dryRun) {
            console.log(`\n🧪 **Dry Run Preview:**`);
            console.log(`Command: ${result.command}`);
            console.log(`Target: ${result.estimatedImpact.targetScore}% (+${result.estimatedImpact.expectedImprovement}%)`);
            console.log(`Estimated Time: ${result.estimatedImpact.estimatedTime}`);
        } else {
            console.log('\n✅ **Enhancement Complete!**');
            if (result.improvement) {
                console.log(`📈 Score Change: ${result.improvement.before}% → ${result.improvement.after}%`);
            }
            
            if (result.nextSteps.length > 0) {
                console.log('\n🎯 **Next Steps:**');
                result.nextSteps.forEach(step => console.log(`  • ${step}`));
            }
        }
    } else {
        console.log(`❌ Enhancement failed: ${result.error}`);
        if (result.suggestion) console.log(`💡 ${result.suggestion}`);
        if (result.recovery) {
            console.log('🔧 **Recovery Actions:**');
            result.recovery.forEach(action => console.log(`  • ${action}`));
        }
    }
    
    return result;
}

/**
 * 📊 Generate Report
 * Create professional HTML quality report
 */
export async function generateReport(options = {}) {
    if (!codefortify) initializeCodeFortify();
    
    console.log('📊 Generating quality report...');
    const result = await codefortify.generateReport(options);
    
    if (result.success) {
        console.log('\n✅ **Report Generated!**');
        if (result.reportPath) {
            console.log(`📄 Location: ${result.reportPath}`);
            console.log(`📏 Size: ${result.reportSize}`);
        }
        
        if (result.summary) {
            console.log(`📋 ${result.summary}`);
        }
        
        if (result.recommendations?.length > 0) {
            console.log('\n🎯 **Key Recommendations:**');
            result.recommendations.slice(0, 3).forEach(rec => console.log(`  • ${rec}`));
        }
    } else {
        console.log(`❌ Report generation failed: ${result.error}`);
        if (result.fallback) console.log(`💡 Fallback: ${result.fallback}`);
    }
    
    return result;
}

/**
 * ✅ Validate Project
 * Check CodeFortify compliance and project setup
 */
export async function validateProject() {
    if (!codefortify) initializeCodeFortify();
    
    console.log('✅ Validating project...');
    const result = await codefortify.validateProject();
    
    if (result.success) {
        console.log('\n✅ **Project Validation Passed!**');
        if (result.setup?.valid) {
            console.log('📋 Project setup is complete and compliant');
        }
    } else {
        console.log(`❌ Validation failed: ${result.error}`);
        
        if (result.fixes?.length > 0) {
            console.log('\n🔧 **Suggested Fixes:**');
            result.fixes.forEach(fix => console.log(`  • ${fix}`));
        }
        
        if (result.setup) {
            console.log('\n📋 **Setup Recommendations:**');
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
    console.log('🎯 Running complete quality assessment...');
    
    // Step 1: Quick health check
    const health = await quickCheck();
    
    // Step 2: Detailed analysis
    const analysis = await analyzeQuality({ 
        detailed: true, 
        recommendations: true 
    });
    
    // Step 3: Generate report if requested
    let report = null;
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
    console.log('🚀 Starting smart enhancement workflow...');
    
    // Step 1: Pre-enhancement analysis
    const beforeAnalysis = await analyzeQuality();
    
    // Step 2: Smart enhancement 
    const enhancement = await enhanceCode({
        dryRun: options.dryRun,
        ...options
    });
    
    // Step 3: Post-enhancement validation (if not dry run)
    let validation = null;
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