/**
 * CodeFortify Package - Main Entry Point
 *
 * Exports all the main classes and utilities for CodeFortify AI-powered development
 * Including the revolutionary continuous enhancement system with self-improvement
 */

// Server components
export { CodeFortifyMCPServer } from './server/CodeFortifyMCPServer.js';
export { ResourceManager } from './server/ResourceManager.js';
export { ToolManager } from './server/ToolManager.js';
export { PatternProvider } from './server/PatternProvider.js';

// Scoring and analysis components
export { ProjectScorer } from './scoring/ProjectScorer.js';
export { ParallelProjectScorer } from './scoring/ParallelProjectScorer.js';
export { ScoringReport } from './scoring/ScoringReport.js';
export { RecommendationEngine } from './scoring/RecommendationEngine.js';

// Parallel Analysis Engine
export { AgentOrchestrator } from './core/AgentOrchestrator.js';
export { IAnalysisAgent } from './agents/IAnalysisAgent.js';
export { SecurityAgent } from './agents/SecurityAgent.js';
export { QualityAgent } from './agents/QualityAgent.js';
export { StructureAgent } from './agents/StructureAgent.js';
export { VisualTestingAgent } from './agents/VisualTestingAgent.js';

// Validation components
export { CodeFortifyValidator } from './validation/CodeFortifyValidator.js';

// Testing components
export { MCPConnectionTester } from './testing/MCPTester.js';

// Revolutionary Enhancement System
export { ContinuousLoopController } from './core/ContinuousLoopController.js';
export { LoopMetrics } from './core/LoopMetrics.js';

// AI Agents
export { EnhancementAgent } from './agents/EnhancementAgent.js';
export { ReviewAgent } from './agents/ReviewAgent.js';
export { AnalysisAgent } from './agents/AnalysisAgent.js';
export { ImprovementAgent } from './agents/ImprovementAgent.js';

// Learning and Intelligence
export { PatternLearningSystem } from './learning/PatternLearningSystem.js';
export { PromptEnhancer } from './enhancement/PromptEnhancer.js';

// CLI Commands
export { EnhanceCommand } from './cli/commands/EnhanceCommand.js';
export { ScoreCommand } from './cli/commands/ScoreCommand.js';
export { CommandCoordinator } from './cli/CommandCoordinator.js';

// Utilities
export { ErrorHandler } from './utils/ErrorHandler.js';
export { CodeFortifyError } from './utils/CodeFortifyError.js';

// Default export - the continuous enhancement system as the main feature
export { ContinuousLoopController as default } from './core/ContinuousLoopController.js';