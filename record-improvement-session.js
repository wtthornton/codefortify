#!/usr/bin/env node

/**
 * Record CodeFortify Improvement Session
 *
 * This script demonstrates how the IssueLearningSystem captures
 * and learns from our improvement activities.
 */

import { IssueLearningSystem } from './src/learning/IssueLearningSystem.js';
import { LearningLoopController } from './src/learning/LearningLoopController.js';

async function recordImprovementSession() {
  console.log('🔄 Recording CodeFortify improvement session...');

  // Initialize the learning system
  const learningSystem = new IssueLearningSystem({
    projectRoot: process.cwd(),
    learningDir: '.codefortify/learning'
  });

  const learningController = new LearningLoopController({
    projectRoot: process.cwd()
  });

  // Record our improvement session
  const sessionResults = {
    description: 'Systematic CodeFortify improvement session - ESLint fixes, JSDoc additions, and learning system enhancements',
    totalImprovements: 25,
    scoreImprovement: 0.015994436717663423, // Small but measurable improvement
    categoriesImproved: ['code-quality', 'maintainability', 'learning-system'],
    timeSpent: '45 minutes',
    eslintFixes: {
      issues: [
        { rule: 'no-unused-vars', message: 'Unused variable in IssueLearningSystem.js', file: 'src/learning/IssueLearningSystem.js', line: 214 },
        { rule: 'no-unused-vars', message: 'Unused variable in RecommendationEngine.js', file: 'src/scoring/RecommendationEngine.js', line: 963 },
        { rule: 'no-unused-vars', message: 'Unused variable in ContextAwareRecommendations.js', file: 'src/intelligence/ContextAwareRecommendations.js', line: 59 }
      ],
      strategy: 'Prefix unused variables with underscore or use .values() instead of destructuring'
    },
    jsdocImprovements: [
      { type: 'class', name: 'IssueLearningSystem', file: 'src/learning/IssueLearningSystem.js', line: 28 },
      { type: 'class', name: 'RecommendationEngine', file: 'src/scoring/RecommendationEngine.js', line: 17 },
      { type: 'class', name: 'ContextAwareRecommendations', file: 'src/intelligence/ContextAwareRecommendations.js', line: 18 },
      { type: 'method', name: 'recordIssue', file: 'src/learning/IssueLearningSystem.js', line: 72 },
      { type: 'method', name: 'recordSolution', file: 'src/learning/IssueLearningSystem.js', line: 142 },
      { type: 'method', name: 'generateRecommendations', file: 'src/scoring/RecommendationEngine.js', line: 39 },
      { type: 'method', name: 'initialize', file: 'src/intelligence/ContextAwareRecommendations.js', line: 66 }
    ],
    scoringEnhancements: [
      {
        description: 'Enhanced CodeFortify scoring to be much more rigorous',
        solution: 'Raised A+ threshold to 98%+, made ESLint scoring stricter, increased test coverage requirements',
        category: 'scoring-system',
        oldScore: 75,
        newScore: 76
      },
      {
        description: 'Fixed retry messages bug in BaseAnalyzer',
        solution: 'Optimized error handling and retry logic to eliminate unnecessary retries',
        category: 'performance',
        oldScore: 10.5,
        newScore: 10.5
      }
    ]
  };

  try {
    // Record the improvement session
    await learningController.recordImprovementSession(sessionResults);

    console.log('✅ Improvement session recorded successfully!');

    // Generate a learning report
    const learningReport = learningSystem.generateLearningReport();
    console.log('\n📊 Learning Report:');
    console.log(`   Total Issues: ${learningReport.metrics.totalIssues}`);
    console.log(`   Resolved Issues: ${learningReport.metrics.resolvedIssues}`);
    console.log(`   Recurring Issues: ${learningReport.metrics.recurringIssues}`);
    console.log(`   Prevention Rate: ${(learningReport.metrics.preventionRate * 100).toFixed(1)}%`);
    console.log(`   Learning Effectiveness: ${(learningReport.learningEffectiveness * 100).toFixed(1)}%`);

    console.log('\n🎯 Key Learning Insights:');
    for (const recommendation of learningReport.recommendations) {
      console.log(`   - ${recommendation.message} (${recommendation.priority} priority)`);
    }

  } catch (error) {
    console.error('❌ Error recording improvement session:', error);
  }
}

// Run the script
recordImprovementSession().catch(console.error);
