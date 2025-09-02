import { AutoRefactorSuggestions } from './src/utils/AutoRefactorSuggestions.js';

async function testRefactoring() {
  const refactor = new AutoRefactorSuggestions();
  
  try {
    console.log('🔍 Analyzing CommandCoordinator.js for refactoring opportunities...\n');
    
    const plan = await refactor.generateRefactoringPlan('./src/cli/CommandCoordinator.js');
    
    console.log('📁 File:', plan.filePath);
    console.log('📊 Current size:', plan.currentSize, 'lines');
    console.log('🎯 Target size:', plan.targetSize, 'lines');
    console.log('⚡ Priority:', plan.priority.toUpperCase());
    console.log('💪 Estimated effort:', plan.estimatedEffort);
    console.log('');
    
    if (plan.refactorings.length > 0) {
      console.log('🔧 Top Refactoring Recommendations:');
      plan.refactorings.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i+1}. ${r.description}`);
        console.log(`     Priority: ${r.priority} | Effort: ${r.effort} | Reduction: ~${r.estimatedReduction || 0} lines`);
        if (r.steps) {
          console.log('     Steps:', r.steps.slice(0, 2).join(', '));
        }
        console.log('');
      });
    }
    
    if (plan.benefits.length > 0) {
      console.log('✨ Expected Benefits:');
      plan.benefits.forEach(b => console.log(`  • ${b}`));
    }
    
    console.log('\n🎯 ANALYSIS SUMMARY:');
    const totalReduction = plan.refactorings.reduce((sum, r) => sum + (r.estimatedReduction || 0), 0);
    const reductionPercent = Math.round((totalReduction / plan.currentSize) * 100);
    console.log(`Potential size reduction: ${totalReduction} lines (${reductionPercent}%)`);
    console.log(`Number of refactoring opportunities: ${plan.refactorings.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

testRefactoring();