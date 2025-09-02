import { AutoRefactorSuggestions } from './src/utils/AutoRefactorSuggestions.js';

async function analyzeLargeFiles() {
  const refactor = new AutoRefactorSuggestions();
  
  // Top files that need refactoring (>1000 lines)
  const largeFiles = [
    './src/cli/CommandCoordinator.js',
    './src/intelligence/ContextAwareRecommendations.js', 
    './src/scoring/ParallelProjectScorer.js',
    './src/scoring/ScoringReport.js',
    './src/learning/PatternDatabase.js',
    './src/scoring/analyzers/StructureAnalyzer.js',
    './src/ui/InteractiveQualityDashboard.js',
    './src/scoring/ProjectScorer.js',
    './src/scoring/RecommendationEngine.js',
    './src/server/PatternProvider.js',
    './src/context/TeamConventionDetector.js',
    './src/scoring/EnhancedPromptGenerator.js',
    './src/context/CodeStyleAnalyzer.js',
    './src/cli/commands/InitCommand.js',
    './src/agents/ImprovementAgent.js'
  ];

  const results = [];
  
  for (const filePath of largeFiles) {
    try {
      console.log(`\n🔍 Analyzing ${filePath}...`);
      const plan = await refactor.generateRefactoringPlan(filePath);
      
      results.push({
        file: filePath,
        lines: plan.currentSize,
        priority: plan.priority,
        reductionPotential: plan.refactorings.reduce((sum, r) => sum + (r.estimatedReduction || 0), 0),
        topIssues: plan.refactorings.slice(0, 2).map(r => ({
          description: r.description,
          reduction: r.estimatedReduction || 0,
          effort: r.effort
        }))
      });
      
    } catch (error) {
      console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
    }
  }
  
  // Sort by priority and reduction potential
  results.sort((a, b) => {
    const priorityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
    const aPriority = priorityOrder[a.priority] || 0;
    const bPriority = priorityOrder[b.priority] || 0;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    return b.reductionPotential - a.reductionPotential;
  });
  
  console.log('\n🎯 REFACTORING PRIORITY REPORT');
  console.log('==============================\n');
  
  results.forEach((result, index) => {
    const reductionPercent = Math.round((result.reductionPotential / result.lines) * 100);
    console.log(`${index + 1}. ${result.file.replace('./src/', '')}`);
    console.log(`   📊 ${result.lines} lines | Priority: ${result.priority.toUpperCase()}`);
    console.log(`   ⚡ Reduction potential: ${result.reductionPotential} lines (${reductionPercent}%)`);
    
    if (result.topIssues.length > 0) {
      console.log(`   🔧 Top Issues:`);
      result.topIssues.forEach((issue, i) => {
        console.log(`      ${i + 1}. ${issue.description} (-${issue.reduction} lines, ${issue.effort} effort)`);
      });
    }
    console.log('');
  });
  
  const totalReduction = results.reduce((sum, r) => sum + r.reductionPotential, 0);
  const totalLines = results.reduce((sum, r) => sum + r.lines, 0);
  console.log(`📈 SUMMARY: ${totalReduction} total lines can be reduced from ${totalLines} lines (${Math.round((totalReduction/totalLines) * 100)}%)`);
}

analyzeLargeFiles().catch(console.error);