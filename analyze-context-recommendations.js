import { AutoRefactorSuggestions } from './src/utils/AutoRefactorSuggestions.js';

async function analyzeContextRecommendations() {
  const refactor = new AutoRefactorSuggestions();
  
  try {
    console.log('🔍 Analyzing ContextAwareRecommendations.js for refactoring...\n');
    
    const plan = await refactor.generateRefactoringPlan('./src/intelligence/ContextAwareRecommendations.js');
    
    console.log('📁 File:', plan.filePath);
    console.log('📊 Current size:', plan.currentSize, 'lines');
    console.log('🎯 Target size:', plan.targetSize, 'lines');
    console.log('⚡ Priority:', plan.priority.toUpperCase());
    console.log('💪 Estimated effort:', plan.estimatedEffort);
    console.log('');
    
    if (plan.refactorings.length > 0) {
      console.log('🔧 Detailed Refactoring Recommendations:');
      plan.refactorings.forEach((r, i) => {
        console.log(`  ${i+1}. ${r.description}`);
        console.log(`     Priority: ${r.priority} | Effort: ${r.effort} | Reduction: ~${r.estimatedReduction || 0} lines`);
        if (r.steps && r.steps.length > 0) {
          console.log('     Implementation steps:');
          r.steps.forEach((step, j) => {
            console.log(`       ${j+1}. ${step}`);
          });
        }
        console.log('');
      });
    }
    
    if (plan.benefits.length > 0) {
      console.log('✨ Expected Benefits:');
      plan.benefits.forEach(b => console.log(`  • ${b}`));
    }
    
    console.log('\n🎯 DETAILED ANALYSIS:');
    const totalReduction = plan.refactorings.reduce((sum, r) => sum + (r.estimatedReduction || 0), 0);
    const reductionPercent = Math.round((totalReduction / plan.currentSize) * 100);
    console.log(`Total potential reduction: ${totalReduction} lines (${reductionPercent}%)`);
    console.log(`Final size: ${plan.currentSize - totalReduction} lines`);
    console.log(`Number of refactoring opportunities: ${plan.refactorings.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

analyzeContextRecommendations();