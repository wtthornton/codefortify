/**
 * AgentManager - Manages and coordinates all agents
 */

import { EnhancementAgent } from '../../agents/EnhancementAgent.js';
import { ReviewAgent } from '../../agents/ReviewAgent.js';
import { AnalysisAgent } from '../../agents/AnalysisAgent.js';
import { ImprovementAgent } from '../../agents/ImprovementAgent.js';
import { VisualTestingAgent } from '../../agents/VisualTestingAgent.js';

/**


 * AgentManager class implementation


 *


 * Provides functionality for agentmanager operations


 */


/**


 * AgentManager class implementation


 *


 * Provides functionality for agentmanager operations


 */


export class AgentManager {
  constructor(config) {
    this.config = config;
    this.agents = this.initializeAgents();
  }

  /**
   * Initialize all agents
   * @returns {Object} Map of agents
   */
  initializeAgents() {
    const agents = {
      enhancement: new EnhancementAgent(this.config),
      review: new ReviewAgent(this.config),
      analysis: new AnalysisAgent(this.config),
      improvement: new ImprovementAgent(this.config)
    };

    // Add visual testing agent if enabled    /**
   * Performs the specified operation
   * @param {Object} this.config.visualTesting ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {Object} this.config.visualTesting ! - Optional parameter
   * @returns {boolean} True if successful, false otherwise
   */

    if (this.config.visualTesting !== false) {
      agents.visualTesting = new VisualTestingAgent(this.config);
    }

    return agents;
  }

  /**
   * Run analysis using the analysis agent
   * @returns {Promise<Object>} Analysis results
   */
  async runAnalysis() {
    return await this.agents.analysis.analyze();
  }

  /**
   * Run enhancement using the enhancement agent
   * @param {Object} analysisResult - Results from analysis
   * @returns {Promise<Object>} Enhancement results
   */
  async runEnhancement(analysisResult) {
    return await this.agents.enhancement.enhance(analysisResult);
  }

  /**
   * Run review using the review agent
   * @param {Object} enhancementResult - Results from enhancement
   * @returns {Promise<Object>} Review results
   */
  async runReview(enhancementResult) {
    return await this.agents.review.review(enhancementResult);
  }

  /**
   * Run improvement using the improvement agent
   * @param {Object} reviewResult - Results from review
   * @returns {Promise<Object>} Improvement results
   */
  async runImprovement(reviewResult) {
    return await this.agents.improvement.improve(reviewResult);
  }

  /**
   * Run visual testing if available
   * @param {Object} codeChanges - Code changes to test
   * @returns {Promise<Object>} Visual testing results
   */
  async runVisualTesting(codeChanges) {  /**
   * Performs the specified operation
   * @param {boolean} !this.agents.visualTesting
   * @returns {boolean} True if successful, false otherwise
   */
    /**
   * Performs the specified operation
   * @param {boolean} !this.agents.visualTesting
   * @returns {boolean} True if successful, false otherwise
   */

    if (!this.agents.visualTesting) {
      return { skipped: true, reason: 'Visual testing not enabled' };
    }

    return await this.agents.visualTesting.test(codeChanges);
  }

  /**
   * Get status of all agents
   * @returns {Object} Agent statuses
   */
  getAgentStatuses() {
    const statuses = {};

    for (const [name, agent] of Object.entries(this.agents)) {
      statuses[name] = {
        available: !!agent,
        status: agent?.getStatus?.() || 'unknown'
      };
    }

    return statuses;
  }

  /**
   * Shutdown all agents
   */
  async shutdown() {
    for (const [name, agent] of Object.entries(this.agents)) {      /**
   * Performs the specified operation
   * @param {any} agent && typeof agent.shutdown - Optional parameter
   * @returns {any} The operation result
   */
      /**
   * Performs the specified operation
   * @param {any} agent && typeof agent.shutdown - Optional parameter
   * @returns {any} The operation result
   */

      if (agent && typeof agent.shutdown === 'function') {
        try {
          await agent.shutdown();
        } catch (error) {
          // ERROR: `Error shutting down agent ${name}:`, error.message
        }
      }
    }
  }
}
