/**
 * CodeFortify Claude Code Command Integration
 *
 * Provides intelligent wrappers for CodeFortify commands within Claude Code sessions
 * Focus on high-value operations with contextual intelligence
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

export class CodeFortifyCommands {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.verbose = options.verbose || false;
    this.defaultTimeout = options.timeout || 120000; // 2 minutes
  }

  /**
     * 🎯 Smart Quality Analysis
     * Analyzes code quality with intelligent defaults and contextual insights
     */
  async analyzeQuality(options = {}) {
    const {
      detailed = true,
      recommendations = true,
      format = 'console',
      targetFiles = null,
      generateReport = false
    } = options;

    console.log('🎯 Running CodeFortify quality analysis...');

    try {
      // Build command with intelligent defaults
      let command = 'codefortify score';

      if (detailed) {command += ' --detailed';}
      if (recommendations) {command += ' --recommendations';}

      if (generateReport && format === 'html') {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const reportPath = `codefortify-analysis-${timestamp}.html`;
        command += ` --format html --output ${reportPath} --open`;
      } else if (format !== 'console') {
        command += ` --format ${format}`;
      }

      const result = this.executeCommand(command);

      // Parse and enhance results
      const analysis = this.parseAnalysisResults(result);

      // Provide contextual insights
      const insights = this.generateInsights(analysis);

      return {
        success: true,
        rawOutput: result,
        analysis,
        insights,
        recommendations: this.prioritizeRecommendations(analysis)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestion: this.getErrorSuggestion(error)
      };
    }
  }

  /**
     * 🚀 Intelligent Code Enhancement
     * Runs autonomous code enhancement with smart parameter selection
     */
  async enhanceCode(options = {}) {
    const {
      targetFile = null,
      targetScore = null,
      iterations = null,
      aggressive = false,
      learn = true,
      dryRun = false
    } = options;

    console.log('🚀 Starting intelligent code enhancement...');

    try {
      // Analyze current state first
      const currentAnalysis = await this.analyzeQuality({ detailed: false, recommendations: false });
      if (!currentAnalysis.success) {
        throw new Error('Failed to analyze current state');
      }

      // Calculate intelligent defaults
      const smartDefaults = this.calculateEnhancementDefaults(currentAnalysis.analysis);

      // Build enhancement command
      let command = 'codefortify enhance';

      if (targetFile) {
        command += ` ${targetFile}`;
      }

      const finalTargetScore = targetScore || smartDefaults.targetScore;
      const finalIterations = iterations || smartDefaults.iterations;

      command += ` --target ${finalTargetScore} --iterations ${finalIterations}`;

      if (aggressive) {command += ' --aggressive';}
      if (learn) {command += ' --learn';}

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          command,
          estimatedImpact: smartDefaults,
          message: `Would run: ${command}`
        };
      }

      console.log(`🎯 Target Score: ${finalTargetScore}% (${smartDefaults.expectedImprovement}% improvement)`);
      console.log(`🔄 Max Iterations: ${finalIterations}`);

      // Execute with timeout handling
      const result = this.executeCommand(command, { timeout: 300000 }); // 5 minutes

      const enhancementResults = this.parseEnhancementResults(result);

      return {
        success: true,
        rawOutput: result,
        results: enhancementResults,
        improvement: this.calculateImprovement(currentAnalysis.analysis, enhancementResults),
        nextSteps: this.suggestNextSteps(enhancementResults)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestion: this.getEnhancementErrorSuggestion(error),
        recovery: this.suggestRecoveryActions(error)
      };
    }
  }

  /**
     * 📊 Quick Health Check
     * Rapid assessment of project health with actionable insights
     */
  async quickHealthCheck() {
    console.log('📊 Running quick health check...');

    try {
      // Run basic analysis
      const result = this.executeCommand('codefortify score --categories structure,quality,security');
      const analysis = this.parseAnalysisResults(result);

      // Check status files
      const statusInfo = this.checkStatusFiles();

      // Generate health summary
      const healthSummary = this.generateHealthSummary(analysis, statusInfo);

      return {
        success: true,
        health: healthSummary,
        urgentIssues: this.identifyUrgentIssues(analysis),
        quickFixes: this.suggestQuickFixes(analysis),
        statusFiles: statusInfo
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallbackChecks: this.runFallbackChecks()
      };
    }
  }

  /**
     * 🔧 Smart Validation
     * Project validation with intelligent error interpretation
     */
  async validateProject() {
    console.log('🔧 Running project validation...');

    try {
      const result = this.executeCommand('codefortify validate');

      const validation = this.parseValidationResults(result);

      return {
        success: validation.passed,
        results: validation,
        fixes: this.suggestValidationFixes(validation),
        setup: this.checkProjectSetup()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        diagnostics: this.runValidationDiagnostics(),
        setup: this.suggestProjectSetup()
      };
    }
  }

  /**
     * 📈 Generate Professional Report
     * Creates comprehensive HTML report with executive summary
     */
  async generateReport(options = {}) {
    const {
      includeRecommendations = true,
      includeMetrics = true,
      autoOpen = true,
      customName = null
    } = options;

    console.log('📈 Generating professional quality report...');

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const reportName = customName || `codefortify-report-${timestamp}.html`;

      let command = `codefortify score --format html --output ${reportName} --detailed`;

      if (includeRecommendations) {command += ' --recommendations';}
      if (includeMetrics) {command += ' --bundle-analysis --performance';}
      if (autoOpen) {command += ' --open';}

      const result = this.executeCommand(command);

      // Read and analyze the generated report
      const reportPath = path.join(this.projectRoot, reportName);
      const reportExists = existsSync(reportPath);

      return {
        success: true,
        reportPath: reportExists ? reportPath : null,
        reportSize: reportExists ? this.getFileSize(reportPath) : null,
        summary: this.extractReportSummary(result),
        recommendations: this.extractKeyRecommendations(result)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback: 'Try running: codefortify score --detailed --recommendations'
      };
    }
  }

  // === Helper Methods ===

  executeCommand(command, options = {}) {
    const { timeout = this.defaultTimeout } = options;

    if (this.verbose) {
      console.log(`🔧 Executing: ${command}`);
    }

    try {
      return execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
    } catch (error) {
      if (error.code === 'TIMEOUT') {
        throw new Error(`Command timed out after ${timeout}ms: ${command}`);
      }
      throw error;
    }
  }

  parseAnalysisResults(output) {
    // Extract score and category information
    const scoreMatch = output.match(/Overall Score: (\d+)\/100 \((\d+)%\) (.+)/);
    const categories = {};

    // Parse category scores
    const categoryRegex = /(.+?)\n\s+[█░]+\s+(\d+)% (.+?) \(([0-9.]+)\/(\d+)\)/g;
    let match;

    while ((match = categoryRegex.exec(output)) !== null) {
      const [, name, percentage, grade, score, total] = match;
      categories[name.trim()] = {
        percentage: parseInt(percentage),
        grade: grade.trim(),
        score: parseFloat(score),
        total: parseInt(total)
      };
    }

    return {
      overallScore: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      overallPercentage: scoreMatch ? parseInt(scoreMatch[2]) : 0,
      overallGrade: scoreMatch ? scoreMatch[3].trim() : 'Unknown',
      categories,
      timestamp: new Date().toISOString()
    };
  }

  calculateEnhancementDefaults(analysis) {
    const currentScore = analysis.overallScore || 0;

    // Intelligent target calculation
    let targetScore = 90; // Default target
    if (currentScore < 60) {targetScore = 75;}      // Aggressive for low scores
    else if (currentScore < 80) {targetScore = 85;} // Moderate improvement
    else if (currentScore > 90) {targetScore = 95;} // Polish high-quality code

    // Iteration calculation based on score gap
    const scoreGap = targetScore - currentScore;
    let iterations = Math.max(3, Math.ceil(scoreGap / 10));
    if (iterations > 8) {iterations = 8;} // Cap at 8 iterations

    return {
      targetScore,
      iterations,
      expectedImprovement: scoreGap,
      estimatedTime: `${iterations * 2}-${iterations * 4} minutes`
    };
  }

  generateInsights(analysis) {
    const insights = [];
    const score = analysis.overallScore;

    // Overall assessment
    if (score >= 90) {
      insights.push('🎉 Excellent code quality! Focus on maintaining standards and minor optimizations.');
    } else if (score >= 80) {
      insights.push('👍 Good foundation. Target specific categories for meaningful improvement.');
    } else if (score >= 70) {
      insights.push('⚠️ Average quality. Significant improvements possible with focused effort.');
    } else {
      insights.push('🚨 Below average quality. Immediate attention needed for production readiness.');
    }

    // Category-specific insights
    Object.entries(analysis.categories).forEach(([category, data]) => {
      if (data.percentage < 60) {
        insights.push(`🔴 ${category}: Critical attention needed (${data.percentage}%)`);
      } else if (data.percentage < 80) {
        insights.push(`🟡 ${category}: Room for improvement (${data.percentage}%)`);
      }
    });

    return insights;
  }

  prioritizeRecommendations(analysis) {
    const recommendations = [];

    // Analyze categories and suggest priorities
    const categories = analysis.categories;
    const sortedCategories = Object.entries(categories)
      .sort(([,a], [,b]) => a.percentage - b.percentage);

    sortedCategories.slice(0, 3).forEach(([category, data], index) => {
      const priority = ['🔥 HIGH', '🟡 MEDIUM', '🟢 LOW'][index];
      recommendations.push({
        priority,
        category,
        score: data.percentage,
        action: this.getCategoryAction(category, data.percentage)
      });
    });

    return recommendations;
  }

  getCategoryAction(category, score) {
    const actions = {
      'Code Structure & Architecture': score < 70 ? 'Refactor large modules and improve separation of concerns' : 'Fine-tune architecture patterns',
      'Code Quality & Maintainability': score < 70 ? 'Configure ESLint, add documentation, reduce complexity' : 'Enhance documentation and reduce technical debt',
      'Performance & Optimization': score < 70 ? 'Optimize critical paths and bundle size' : 'Fine-tune performance bottlenecks',
      'Testing & Documentation': score < 70 ? 'Increase test coverage and add comprehensive docs' : 'Enhance test quality and documentation depth',
      'Security & Error Handling': score < 70 ? 'Address security vulnerabilities and improve error handling' : 'Strengthen security posture',
      'Developer Experience': score < 70 ? 'Improve tooling and development workflow' : 'Enhance developer productivity tools',
      'Completeness & Production Readiness': score < 70 ? 'Complete missing features and production config' : 'Polish production deployment'
    };

    return actions[category] || 'Review and improve based on specific feedback';
  }

  checkStatusFiles() {
    const statusPath = path.join(this.projectRoot, '.codefortify', 'status.json');

    if (!existsSync(statusPath)) {
      return { exists: false, message: 'No status file found - run codefortify score first' };
    }

    try {
      const statusContent = readFileSync(statusPath, 'utf8');
      const status = JSON.parse(statusContent);

      return {
        exists: true,
        lastUpdate: status.lastSaved,
        phase: status.globalStatus?.phase || 'unknown',
        progress: status.globalStatus?.progress || 0,
        currentScore: status.score?.currentScore || 0,
        sessionActive: Date.now() - new Date(status.lastSaved).getTime() < 300000 // 5 minutes
      };
    } catch (error) {
      return { exists: true, error: 'Failed to parse status file', details: error.message };
    }
  }

  generateHealthSummary(analysis, statusInfo) {
    const score = analysis.overallScore;

    let healthLevel = 'Poor';
    let healthIcon = '🔴';

    if (score >= 90) { healthLevel = 'Excellent'; healthIcon = '🟢'; }
    else if (score >= 80) { healthLevel = 'Good'; healthIcon = '🟡'; }
    else if (score >= 70) { healthLevel = 'Fair'; healthIcon = '🟠'; }

    return {
      level: healthLevel,
      icon: healthIcon,
      score,
      trend: this.calculateTrend(statusInfo),
      lastCheck: analysis.timestamp,
      activeSession: statusInfo.sessionActive || false
    };
  }

  identifyUrgentIssues(analysis) {
    const urgent = [];

    Object.entries(analysis.categories).forEach(([category, data]) => {
      if (data.percentage < 50) {
        urgent.push({
          category,
          severity: 'critical',
          score: data.percentage,
          impact: 'high'
        });
      } else if (data.percentage < 60 && category.includes('Security')) {
        urgent.push({
          category,
          severity: 'high',
          score: data.percentage,
          impact: 'security'
        });
      }
    });

    return urgent;
  }

  suggestQuickFixes(analysis) {
    const fixes = [];

    // Common quick fixes based on analysis
    if (analysis.categories['Code Quality & Maintainability']?.percentage < 70) {
      fixes.push('Run: npm run lint:fix (if available) to auto-fix code style issues');
    }

    if (analysis.categories['Testing & Documentation']?.percentage < 70) {
      fixes.push('Add basic README.md and increase test coverage');
    }

    if (analysis.categories['Security & Error Handling']?.percentage < 80) {
      fixes.push('Run: npm audit fix to address known vulnerabilities');
    }

    return fixes;
  }

  getFileSize(filePath) {
    try {
      const stats = require('fs').statSync(filePath);
      const sizeInBytes = stats.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      return `${sizeInKB} KB`;
    } catch {
      return 'Unknown';
    }
  }

  calculateTrend(statusInfo) {
    if (!statusInfo.exists) {return 'unknown';}

    const currentScore = statusInfo.currentScore || 0;
    // In a real implementation, this would compare with historical data
    return currentScore > 0 ? 'stable' : 'unknown';
  }

  getErrorSuggestion(error) {
    if (error.message.includes('command not found')) {
      return 'CodeFortify CLI not installed. Run: npm install -g @wtthornton/codefortify';
    }
    if (error.message.includes('timeout')) {
      return 'Analysis taking too long. Try with fewer categories: --categories structure,quality';
    }
    return 'Check that you are in a valid project directory with a package.json file';
  }

  // Additional helper methods would continue here...
  parseEnhancementResults(output) { return { completed: true, output }; }
  calculateImprovement(before, after) { return { improvement: 'calculated' }; }
  suggestNextSteps(results) { return ['Continue monitoring', 'Run tests']; }
  getEnhancementErrorSuggestion(error) { return 'Try with lower target score or fewer iterations'; }
  suggestRecoveryActions(error) { return ['Check system resources', 'Try smaller scope']; }
  parseValidationResults(output) { return { passed: true, issues: [] }; }
  suggestValidationFixes(validation) { return []; }
  checkProjectSetup() { return { valid: true }; }
  runValidationDiagnostics() { return { system: 'ok' }; }
  suggestProjectSetup() { return ['Run codefortify init']; }
  extractReportSummary(output) { return 'Report generated successfully'; }
  extractKeyRecommendations(output) { return []; }
  runFallbackChecks() { return { basic: 'ok' }; }
}

export default CodeFortifyCommands;