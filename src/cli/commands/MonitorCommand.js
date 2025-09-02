/**
 * Monitor Command - Track AI coding agent effectiveness
 * 
 * Monitors code quality improvements made by external AI agents
 * without making any autonomous changes.
 */

import chalk from 'chalk';
import ora from 'ora';
import { AIAgentMonitor } from '../../monitoring/AIAgentMonitor.js';

export class MonitorCommand {
  constructor(globalConfig) {
    this.globalConfig = globalConfig;
    this.config = {
      projectRoot: globalConfig.projectRoot || process.cwd(),
      verbose: globalConfig.verbose || false
    };
  }

  /**
   * Execute the monitor command
   */
  async execute(options = {}) {
    const monitorConfig = {
      ...this.config,
      ...options,
      monitoringInterval: parseInt(options.interval) || 5000,
      enableRealtime: !options.noRealtime,
      trackChanges: options.trackChanges !== false
    };

    console.log(chalk.cyan('📊 CodeFortify AI Agent Monitor'));
    console.log(chalk.gray('Tracking code improvements without autonomous changes'));
    console.log('');

    const monitor = new AIAgentMonitor(monitorConfig);
    const spinner = ora('Initializing monitoring system...').start();

    // Setup event listeners
    monitor.on('monitoring:started', (data) => {
      spinner.succeed('Monitoring started');
      console.log(chalk.green(`✓ Baseline score: ${data.baseline.totalScore.toFixed(1)}/100`));
      console.log(chalk.gray('Monitoring for changes...'));
      console.log('');
    });

    monitor.on('score:changed', (event) => {
      const trend = event.delta > 0 ? '↗️' : '↘️';
      const color = event.delta > 0 ? chalk.green : chalk.red;
      
      console.log(`${trend} ${new Date().toLocaleTimeString()} - Score changed: ${color((event.delta > 0 ? '+' : '') + event.delta.toFixed(1))} → ${event.newScore.toFixed(1)}/100`);
      
      // Show category changes
      if (event.categories && Object.keys(event.categories).length > 0) {
        Object.entries(event.categories).forEach(([category, change]) => {
          const catTrend = change.delta > 0 ? '↑' : '↓';
          const catColor = change.delta > 0 ? chalk.green : chalk.red;
          console.log(`  ${catTrend} ${category}: ${catColor((change.delta > 0 ? '+' : '') + change.delta.toFixed(1))}`);
        });
      }
      
      // Show recommendations
      if (event.recommendations && event.recommendations.length > 0) {
        console.log(chalk.cyan('  Recommendations:'));
        event.recommendations.slice(0, 3).forEach(rec => {
          console.log(`    • ${rec.description} (est. +${rec.estimatedImpact.scoreImprovement})`);
        });
      }
      console.log('');
    });

    monitor.on('aiagent:activity', (event) => {
      if (monitorConfig.verbose) {
        console.log(chalk.gray(`  [AI Agent] ${event.type} detected`));
      }
    });

    monitor.on('file:changed', (event) => {
      if (monitorConfig.verbose) {
        console.log(chalk.gray(`  [File] ${event.eventType}: ${event.filename}`));
      }
    });

    try {
      const result = await monitor.startMonitoring();
      
      // Display monitoring dashboard
      if (options.dashboard) {
        this.displayDashboard(monitor);
      }

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n' + chalk.yellow('Stopping monitor...'));
        
        const summary = await monitor.stopMonitoring();
        this.displaySummary(summary);
        
        process.exit(0);
      });

      // Handle status requests
      if (options.status) {
        setInterval(() => {
          const status = monitor.getStatus();
          this.displayStatus(status);
        }, 10000); // Every 10 seconds
      }

      // Keep process alive
      console.log(chalk.gray('\nPress Ctrl+C to stop monitoring\n'));
      await new Promise(() => {}); // Keep running until interrupted

    } catch (error) {
      spinner.fail('Failed to start monitoring');
      console.error(chalk.red('Error:'), error.message);
      if (monitorConfig.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  }

  /**
   * Display monitoring summary
   */
  displaySummary(summary) {
    console.log('\n' + chalk.cyan('━'.repeat(50)));
    console.log(chalk.cyan.bold('📈 Monitoring Summary'));
    console.log(chalk.cyan('━'.repeat(50)));
    
    const duration = Math.round(summary.duration / 1000 / 60);
    const improvement = summary.improvement;
    const improvementColor = improvement > 0 ? chalk.green : improvement < 0 ? chalk.red : chalk.gray;
    
    console.log(`Duration: ${chalk.white(duration + ' minutes')}`);
    console.log(`Score Change: ${improvementColor((improvement > 0 ? '+' : '') + improvement.toFixed(1) + ' points')}`);
    console.log(`Changes Detected: ${chalk.white(summary.changeCount)}`);
    console.log(`AI Agent Events: ${chalk.white(summary.aiAgentEvents)}`);
    
    if (summary.baseline && summary.final) {
      console.log(`\nBaseline: ${chalk.gray(summary.baseline.totalScore.toFixed(1) + '/100')}`);
      console.log(`Final: ${chalk.white(summary.final.totalScore.toFixed(1) + '/100')}`);
      
      // Show grade change if applicable
      const baselineGrade = this.getGrade(summary.baseline.totalScore);
      const finalGrade = this.getGrade(summary.final.totalScore);
      if (baselineGrade !== finalGrade) {
        console.log(`Grade: ${chalk.gray(baselineGrade)} → ${chalk.white(finalGrade)}`);
      }
    }
    
    console.log(chalk.cyan('━'.repeat(50)));
  }

  /**
   * Display current status
   */
  displayStatus(status) {
    if (status.status === 'idle') {
      return;
    }

    console.log(chalk.cyan('\n📊 Current Status:'));
    console.log(`Score: ${status.current ? status.current.totalScore.toFixed(1) : 'N/A'}/100`);
    console.log(`Improvement: ${status.improvement > 0 ? '+' : ''}${status.improvement.toFixed(1)}`);
    console.log(`Changes: ${status.changeCount}`);
    
    if (status.lastChange) {
      const time = new Date(status.lastChange.timestamp).toLocaleTimeString();
      console.log(`Last Change: ${time} (${status.lastChange.delta > 0 ? '+' : ''}${status.lastChange.delta.toFixed(1)})`);
    }
  }

  /**
   * Display live dashboard
   */
  displayDashboard(monitor) {
    setInterval(() => {
      const report = monitor.getEffectivenessReport();
      const status = monitor.getStatus();
      
      // Clear console and redraw
      console.clear();
      
      console.log(chalk.cyan.bold('═'.repeat(60)));
      console.log(chalk.cyan.bold('  CodeFortify AI Agent Monitor - Live Dashboard'));
      console.log(chalk.cyan.bold('═'.repeat(60)));
      
      if (status.current) {
        const score = status.current.totalScore;
        const grade = this.getGrade(score);
        const scoreColor = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
        
        console.log(`\n📊 Current Score: ${scoreColor(score.toFixed(1) + '/100')} (${grade})`);
        console.log(`📈 Improvement: ${status.improvement > 0 ? chalk.green('+') : ''}${status.improvement.toFixed(1)} points`);
        console.log(`⏱️  Session Time: ${Math.round(status.sessionDuration / 1000 / 60)} minutes`);
        console.log(`🔄 Changes: ${status.changeCount}`);
      }
      
      if (report.aiAgentEffectiveness) {
        const eff = report.aiAgentEffectiveness;
        console.log(`\n🤖 AI Agent Effectiveness: ${eff.rating} (${eff.score}%)`);
      }
      
      if (report.topRecommendations && report.topRecommendations.length > 0) {
        console.log('\n💡 Top Recommendations:');
        report.topRecommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. ${rec.description}`);
        });
      }
      
      console.log(chalk.gray('\n\nPress Ctrl+C to stop monitoring'));
      
    }, 5000); // Update every 5 seconds
  }

  /**
   * Get letter grade for score
   */
  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }
}

export default MonitorCommand;