/**
 * Loop Metrics - Self-measurement system for continuous improvement tracking
 *
 * Tracks every aspect of the continuous loop process to enable:
 * - ROI calculation and measurement
 * - Pattern learning effectiveness
 * - Performance optimization
 * - Automatic improvement detection
 */

import { existsSync, mkdirSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class LoopMetrics extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      metricsDir: config.metricsDir || '.codefortify/metrics',
      persistMetrics: config.persistMetrics !== false, // Default to true
      ...config
    };

    this.sessions = new Map();
    this.currentSession = null;

    // Initialize metrics directory
    this.initializeMetricsDir();
  }

  /**
   * Start a new metrics session
   */
  startSession(sessionId = null) {
    sessionId = sessionId || this.generateSessionId();

    const session = {
      id: sessionId,
      startTime: Date.now(),
      startTimestamp: new Date().toISOString(),
      iterations: [],
      patterns: [],
      improvements: [],
      tokens: {
        baseline: 0,
        optimized: 0,
        saved: 0,
        reduction: 0
      },
      quality: {
        initialScore: 0,
        finalScore: 0,
        improvement: 0,
        bugsFixed: 0,
        issuesResolved: 0
      },
      velocity: {
        totalDuration: 0,
        averageIterationTime: 0,
        convergenceRate: 0
      },
      roi: {
        timeSaved: 0,
        costSaved: 0,
        valueGenerated: 0,
        efficiency: 0
      }
    };

    this.sessions.set(sessionId, session);
    this.currentSession = sessionId;

    this.emit('session:start', { sessionId, session });
    return sessionId;
  }

  /**
   * Record iteration metrics
   */
  recordIteration(sessionId, iterationData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const iterationMetrics = {
      iteration: iterationData.iteration,
      timestamp: new Date().toISOString(),
      duration: iterationData.duration,
      score: iterationData.score,
      improvements: iterationData.enhanced?.improvements?.length || 0,
      issues: iterationData.review?.issues?.length || 0,
      fixes: iterationData.improved?.fixes?.length || 0,
      patterns: iterationData.enhanced?.patterns?.length || 0,

      // Step-level metrics
      steps: {
        enhance: iterationData.enhanced?.duration || 0,
        review: iterationData.review?.duration || 0,
        analyze: iterationData.analysis?.duration || 0,
        improve: iterationData.improved?.duration || 0
      },

      // Token usage if available
      tokens: {
        input: iterationData.enhanced?.tokenUsage?.input || 0,
        output: iterationData.enhanced?.tokenUsage?.output || 0,
        total: iterationData.enhanced?.tokenUsage?.total || 0
      }
    };

    session.iterations.push(iterationMetrics);

    // Update session totals
    session.velocity.totalDuration += iterationData.duration;
    session.velocity.averageIterationTime = session.velocity.totalDuration / session.iterations.length;

    // Track quality progression
    if (session.quality.initialScore === 0) {
      session.quality.initialScore = iterationData.score;
    }
    session.quality.finalScore = iterationData.score;
    session.quality.improvement = session.quality.finalScore - session.quality.initialScore;

    this.emit('iteration:recorded', { sessionId, iteration: iterationMetrics });

    return iterationMetrics;
  }

  /**
   * Record pattern learning
   */
  recordPattern(sessionId, pattern) {
    const session = this.sessions.get(sessionId);
    if (!session) {return;}

    const patternMetric = {
      id: this.generatePatternId(),
      timestamp: new Date().toISOString(),
      type: pattern.type,
      description: pattern.description,
      effectiveness: pattern.effectiveness || 0,
      timesUsed: 1,
      successRate: 1,
      tokensSaved: pattern.tokensSaved || 0,
      context: pattern.context || {}
    };

    session.patterns.push(patternMetric);
    this.emit('pattern:learned', { sessionId, pattern: patternMetric });

    return patternMetric;
  }

  /**
   * Record token usage and savings
   */
  recordTokenUsage(sessionId, tokenData) {
    const session = this.sessions.get(sessionId);
    if (!session) {return;}

    session.tokens.baseline += tokenData.baseline || 0;
    session.tokens.optimized += tokenData.optimized || 0;
    session.tokens.saved = session.tokens.baseline - session.tokens.optimized;
    session.tokens.reduction = session.tokens.baseline > 0
      ? (session.tokens.saved / session.tokens.baseline) * 100
      : 0;

    // Calculate cost savings (approximate)
    const costPerToken = 0.000002; // Rough estimate for API costs
    session.roi.costSaved = session.tokens.saved * costPerToken;

    this.emit('tokens:recorded', { sessionId, tokens: session.tokens });
  }

  /**
   * Calculate and record ROI metrics
   */
  calculateROI(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {return null;}

    const duration = Date.now() - session.startTime;
    const durationHours = duration / (1000 * 60 * 60);

    // Time savings estimation
    const iterationsSaved = Math.max(0, session.iterations.length - 1); // Assume would need more iterations without tool
    const timePerIteration = 30; // minutes
    session.roi.timeSaved = (iterationsSaved * timePerIteration) / 60; // hours

    // Value calculation
    const hourlyRate = 75; // Estimate developer hourly rate
    session.roi.valueGenerated = session.roi.timeSaved * hourlyRate + session.roi.costSaved;

    // Efficiency (value per time invested)
    session.roi.efficiency = durationHours > 0 ? session.roi.valueGenerated / durationHours : 0;

    this.emit('roi:calculated', { sessionId, roi: session.roi });

    return session.roi;
  }

  /**
   * Get session metrics
   */
  async getSessionMetrics(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {return null;}

    // Calculate final ROI
    this.calculateROI(sessionId);

    return {
      session: session.id,
      duration: Date.now() - session.startTime,
      summary: {
        iterations: session.iterations.length,
        patterns: session.patterns.length,
        improvements: session.quality.improvement,
        tokensSaved: session.tokens.saved,
        timeSaved: session.roi.timeSaved,
        roi: session.roi.efficiency
      },
      detailed: {
        tokens: session.tokens,
        quality: session.quality,
        velocity: session.velocity,
        roi: session.roi,
        iterations: session.iterations,
        patterns: session.patterns
      }
    };
  }

  /**
   * Store session data persistently
   */
  async storeSession(sessionId, finalReport = null) {
    if (!this.config.persistMetrics) {return;}

    const session = this.sessions.get(sessionId);
    if (!session) {return;}

    try {
      const metrics = await this.getSessionMetrics(sessionId);
      const fileName = `${session.startTimestamp.split('T')[0]}-${sessionId}.json`;
      const filePath = path.join(this.config.projectRoot, this.config.metricsDir, fileName);

      const data = {
        ...metrics,
        finalReport: finalReport ? {
          summary: finalReport.summary,
          progression: finalReport.progression
        } : null,
        timestamp: new Date().toISOString()
      };

      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      this.emit('session:stored', { sessionId, filePath });

    } catch (error) {
      this.emit('storage:error', { sessionId, error });
    }
  }

  /**
   * Analyze historical data for improvement opportunities
   */
  async analyzeUsagePatterns() {
    if (!this.config.persistMetrics) {return [];}

    try {
      const metricsPath = path.join(this.config.projectRoot, this.config.metricsDir);
      if (!existsSync(metricsPath)) {return [];}

      const files = await fs.readdir(metricsPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const sessions = [];
      for (const file of jsonFiles.slice(-10)) { // Analyze last 10 sessions
        try {
          const filePath = path.join(metricsPath, file);
          const data = await fs.readFile(filePath, 'utf-8');
          sessions.push(JSON.parse(data));
        } catch (error) {
          // Skip corrupted files
        }
      }

      return this.extractImprovementOpportunities(sessions);

    } catch (error) {
      this.emit('analysis:error', { error });
      return [];
    }
  }

  /**
   * Extract improvement opportunities from historical data
   */
  extractImprovementOpportunities(sessions) {
    const opportunities = [];

    if (sessions.length === 0) {return opportunities;}

    // Analyze convergence patterns
    const avgIterations = sessions.reduce((sum, s) => sum + s.summary.iterations, 0) / sessions.length;
    if (avgIterations > 3) {
      opportunities.push({
        type: 'convergence',
        description: 'Sessions often require many iterations. Consider improving initial analysis.',
        impact: 'high',
        estimatedSavings: `${Math.round((avgIterations - 2) * 2)} minutes per session`,
        autoImplementable: true
      });
    }

    // Analyze pattern effectiveness
    const allPatterns = sessions.flatMap(s => s.detailed?.patterns || []);
    const patternGroups = allPatterns.reduce((acc, pattern) => {
      const key = pattern.type + pattern.description;
      if (!acc[key]) {
        acc[key] = { pattern, count: 0, totalEffectiveness: 0 };
      }
      acc[key].count++;
      acc[key].totalEffectiveness += pattern.effectiveness || 0;
      return acc;
    }, {});

    Object.values(patternGroups).forEach(group => {
      const avgEffectiveness = group.totalEffectiveness / group.count;
      if (group.count > 3 && avgEffectiveness > 0.8) {
        opportunities.push({
          type: 'pattern',
          description: `Pattern "${group.pattern.description}" is highly effective (${Math.round(avgEffectiveness * 100)}%) and used frequently`,
          impact: 'medium',
          estimatedSavings: `${group.pattern.tokensSaved * group.count} tokens saved`,
          autoImplementable: true
        });
      }
    });

    // Analyze token efficiency
    const tokenData = sessions.filter(s => s.detailed?.tokens?.reduction > 0);
    if (tokenData.length > 0) {
      const avgReduction = tokenData.reduce((sum, s) => sum + s.detailed.tokens.reduction, 0) / tokenData.length;
      if (avgReduction < 70) { // Less than 70% reduction
        opportunities.push({
          type: 'tokens',
          description: `Token reduction averaging ${Math.round(avgReduction)}%. Target should be >70%.`,
          impact: 'high',
          estimatedSavings: `${Math.round((70 - avgReduction) * 10)} additional tokens per session`,
          autoImplementable: false
        });
      }
    }

    return opportunities.sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      return impactScore[b.impact] - impactScore[a.impact];
    });
  }

  /**
   * Generate metrics dashboard data
   */
  async getDashboardMetrics() {
    const opportunities = await this.analyzeUsagePatterns();
    const currentSession = this.currentSession ? this.sessions.get(this.currentSession) : null;

    return {
      current: currentSession ? {
        iterations: currentSession.iterations.length,
        currentScore: currentSession.quality.finalScore,
        improvement: currentSession.quality.improvement,
        tokensSaved: currentSession.tokens.saved,
        duration: Date.now() - currentSession.startTime
      } : null,
      opportunities: opportunities.slice(0, 5), // Top 5
      summary: {
        totalSessions: this.sessions.size,
        avgImprovement: Array.from(this.sessions.values())
          .reduce((sum, s) => sum + s.quality.improvement, 0) / this.sessions.size,
        totalTimeSaved: Array.from(this.sessions.values())
          .reduce((sum, s) => sum + s.roi.timeSaved, 0)
      }
    };
  }

  /**
   * Initialize metrics directory
   */
  initializeMetricsDir() {
    if (!this.config.persistMetrics) {return;}

    const metricsPath = path.join(this.config.projectRoot, this.config.metricsDir);
    if (!existsSync(metricsPath)) {
      mkdirSync(metricsPath, { recursive: true });
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `cf-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique pattern ID
   */
  generatePatternId() {
    return `pat-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * End current session
   */
  async endSession(sessionId = null) {
    sessionId = sessionId || this.currentSession;
    if (!sessionId) {return;}

    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = Date.now();
      session.endTimestamp = new Date().toISOString();
      await this.storeSession(sessionId);
      this.emit('session:end', { sessionId, session });
    }

    if (sessionId === this.currentSession) {
      this.currentSession = null;
    }
  }
}