/**
 * Refactor Command - Provides intelligent refactoring suggestions for large files
 * 
 * Helps developers identify and fix large file anti-patterns with specific,
 * actionable recommendations and implementation steps.
 */

import chalk from 'chalk';
import { AutoRefactorSuggestions } from '../../utils/AutoRefactorSuggestions.js';
import { FileSizeAnalyzer } from '../../scoring/analyzers/FileSizeAnalyzer.js';
import path from 'path';
import fs from 'fs/promises';

export class RefactorCommand {
  constructor(globalConfig = {}) {
    this.globalConfig = globalConfig;
    this.refactorEngine = new AutoRefactorSuggestions({
      targetFileSize: 250,
      maxMethodsPerClass: 12,
      suggestionsLimit: 8
    });
  }

  /**
   * Execute refactor analysis command
   */
  async execute(options = {}) {
    try {
      const projectRoot = options.projectRoot || process.cwd();
      
      console.log(chalk.blue('🔧 CodeFortify Refactoring Analysis'));
      console.log(chalk.gray('Analyzing large files and anti-patterns...\n'));

      // Find files needing refactoring
      const candidates = await this.findRefactoringCandidates(projectRoot, options);
      
      if (candidates.length === 0) {
        console.log(chalk.green('✅ No large files detected - your codebase looks healthy!'));
        return { success: true, candidates: [], message: 'No refactoring needed' };
      }

      // Generate refactoring plans
      const plans = [];
      for (const candidate of candidates.slice(0, 5)) { // Limit to top 5 files
        const plan = await this.refactorEngine.generateRefactoringPlan(candidate.path, options);
        plans.push(plan);
      }

      // Display results
      await this.displayRefactoringPlans(plans);

      // Optionally save detailed report
      if (options.output) {
        await this.saveRefactoringReport(plans, options.output);
      }

      return {
        success: true,
        candidates: candidates.length,
        plans,
        message: `Generated refactoring plans for ${plans.length} files`
      };

    } catch (error) {
      console.error(chalk.red('Error during refactoring analysis:'), error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find files that need refactoring
   */
  async findRefactoringCandidates(projectRoot, options) {
    const analyzer = new FileSizeAnalyzer({
      fileSizeWarning: 250,
      fileSizeMajor: 400,
      fileSizeCritical: 800
    });

    const analysis = await analyzer.analyze(projectRoot);
    const candidates = [];

    // Add critical and major files
    if (analysis.results?.details) {
      const details = analysis.results.details;
      
      // Critical files (highest priority)
      if (details.criticalFiles) {
        for (const file of details.criticalFiles) {
          candidates.push({
            path: file.path,
            lines: file.lines,
            priority: 'critical',
            reason: `${file.lines} lines (critical threshold)`
          });
        }
      }

      // Major files  
      if (details.majorFiles) {
        for (const file of details.majorFiles) {
          candidates.push({
            path: file.path, 
            lines: file.lines,
            priority: 'high',
            reason: `${file.lines} lines (major threshold)`
          });
        }
      }

      // Add files with complexity patterns
      if (details.complexityPatterns) {
        for (const pattern of details.complexityPatterns) {
          const existingCandidate = candidates.find(c => c.path.includes(pattern.file));
          if (existingCandidate) {
            existingCandidate.patterns = existingCandidate.patterns || [];
            existingCandidate.patterns.push(pattern);
          }
        }
      }
    }

    // Sort by priority and size
    return candidates.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.lines - a.lines;
    });
  }

  /**
   * Display refactoring plans in a user-friendly format
   */
  async displayRefactoringPlans(plans) {
    for (const plan of plans) {
      await this.displaySinglePlan(plan);
      console.log(''); // Add spacing between plans
    }

    // Display summary
    this.displaySummary(plans);
  }

  /**
   * Display a single refactoring plan
   */
  async displaySinglePlan(plan) {
    const fileName = path.basename(plan.filePath);
    const priorityColors = {
      critical: chalk.red,
      high: chalk.yellow,
      medium: chalk.blue,
      low: chalk.gray
    };
    const priorityColor = priorityColors[plan.priority] || chalk.white;

    console.log(priorityColor.bold(`📁 ${fileName} (${plan.currentSize} lines)`));
    console.log(priorityColor(`   Priority: ${plan.priority.toUpperCase()} | Target: ${plan.targetSize} lines | Effort: ${plan.estimatedEffort}`));

    if (plan.refactorings.length > 0) {
      console.log(chalk.cyan('\n   🔧 Refactoring Recommendations:'));
      
      for (let i = 0; i < Math.min(plan.refactorings.length, 4); i++) {
        const refactor = plan.refactorings[i];
        const icon = this.getRefactoringIcon(refactor.type);
        const effort = this.getEffortIndicator(refactor.effort);
        
        console.log(chalk.white(`   ${i + 1}. ${icon} ${refactor.description} ${effort}`));
        
        if (refactor.steps) {
          refactor.steps.slice(0, 2).forEach(step => {
            console.log(chalk.gray(`      • ${step}`));
          });
        }

        if (refactor.estimatedReduction) {
          const reductionPercent = Math.round((refactor.estimatedReduction / plan.currentSize) * 100);
          console.log(chalk.green(`      📊 Reduces file by ~${refactor.estimatedReduction} lines (${reductionPercent}%)`));
        }
      }
    }

    if (plan.benefits.length > 0) {
      console.log(chalk.green('\n   ✨ Expected Benefits:'));
      plan.benefits.slice(0, 3).forEach(benefit => {
        console.log(chalk.green(`      • ${benefit}`));
      });
    }
  }

  /**
   * Display summary of all refactoring plans
   */
  displaySummary(plans) {
    console.log('═'.repeat(60));
    console.log(chalk.bold.blue('📊 REFACTORING SUMMARY'));
    console.log('═'.repeat(60));

    const totalFiles = plans.length;
    const totalLines = plans.reduce((sum, p) => sum + p.currentSize, 0);
    const totalReduction = plans.reduce((sum, p) => {
      return sum + p.refactorings.reduce((rs, r) => rs + (r.estimatedReduction || 0), 0);
    }, 0);
    const reductionPercent = Math.round((totalReduction / totalLines) * 100);

    console.log(chalk.white(`Files analyzed: ${totalFiles}`));
    console.log(chalk.white(`Total lines: ${totalLines.toLocaleString()}`));
    console.log(chalk.green(`Potential reduction: ${totalReduction.toLocaleString()} lines (${reductionPercent}%)`));

    // Effort breakdown
    const effortCounts = { high: 0, medium: 0, low: 0 };
    plans.forEach(p => effortCounts[p.estimatedEffort]++);
    
    console.log(chalk.yellow(`Effort required: ${effortCounts.high} high, ${effortCounts.medium} medium, ${effortCounts.low} low`));

    // Priority breakdown
    const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    plans.forEach(p => priorityCounts[p.priority]++);
    
    console.log(chalk.red(`Priority: ${priorityCounts.critical} critical, ${priorityCounts.high} high, ${priorityCounts.medium} medium`));

    console.log('\n' + chalk.cyan('💡 TIP: Start with critical priority files for maximum impact'));
    console.log(chalk.gray('Run with --output report.json to save detailed refactoring plans'));
  }

  /**
   * Save detailed refactoring report to file
   */
  async saveRefactoringReport(plans, outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: plans.length,
        totalLines: plans.reduce((sum, p) => sum + p.currentSize, 0),
        potentialReduction: plans.reduce((sum, p) => {
          return sum + p.refactorings.reduce((rs, r) => rs + (r.estimatedReduction || 0), 0);
        }, 0)
      },
      plans: plans.map(plan => ({
        ...plan,
        refactorings: plan.refactorings.map(r => ({
          type: r.type,
          description: r.description,
          priority: r.priority,
          effort: r.effort,
          estimatedReduction: r.estimatedReduction,
          steps: r.steps,
          automatable: r.automatable
        }))
      }))
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n📄 Detailed report saved to: ${outputPath}`));
  }

  /**
   * Get icon for refactoring type
   */
  getRefactoringIcon(type) {
    const icons = {
      'extract-class': '📦',
      'extract-mixin': '🔧',
      'command-pattern-refactor': '⚙️',
      'strategy-pattern': '🎯',
      'factory-pattern': '🏭',
      'documentation-cleanup': '📝',
      'file-splitting': '✂️',
      default: '🔄'
    };
    return icons[type] || icons.default;
  }

  /**
   * Get effort indicator
   */
  getEffortIndicator(effort) {
    const indicators = {
      low: chalk.green('●'),
      medium: chalk.yellow('●●'),
      high: chalk.red('●●●')
    };
    return indicators[effort] || '';
  }
}