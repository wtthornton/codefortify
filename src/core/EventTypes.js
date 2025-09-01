/**
 * CodeFortify Real-Time Event Types
 * 
 * Standardized event schema for real-time status updates across IDE integrations
 */

export const EVENT_TYPES = {
  // Analysis Events
  ANALYSIS_START: 'analysis_start',
  ANALYSIS_PROGRESS: 'analysis_progress', 
  ANALYSIS_COMPLETE: 'analysis_complete',
  ANALYSIS_ERROR: 'analysis_error',

  // Score Events
  SCORE_UPDATE: 'score_update',
  SCORE_IMPROVEMENT: 'score_improvement',
  SCORE_DEGRADATION: 'score_degradation',

  // Enhancement Events
  ENHANCEMENT_START: 'enhancement_start',
  ENHANCEMENT_PROGRESS: 'enhancement_progress',
  ENHANCEMENT_COMPLETE: 'enhancement_complete',
  ENHANCEMENT_ERROR: 'enhancement_error',

  // Recommendation Events
  RECOMMENDATION_GENERATED: 'recommendation_generated',
  RECOMMENDATION_APPLIED: 'recommendation_applied',
  RECOMMENDATION_DISMISSED: 'recommendation_dismissed',

  // Status Events
  STATUS_UPDATE: 'status_update',
  AGENT_STATUS: 'agent_status',
  SYSTEM_STATUS: 'system_status',

  // Connection Events
  CONNECTION_ESTABLISHED: 'connection_established',
  CONNECTION_LOST: 'connection_lost',
  CONNECTION_RESTORED: 'connection_restored',

  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  WARNING_ISSUED: 'warning_issued',

  // Session Events
  SESSION_START: 'session_start',
  SESSION_END: 'session_end'
};

export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high', 
  MEDIUM: 'medium',
  LOW: 'low'
};

export const STATUS_PHASES = {
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  ENHANCING: 'enhancing',
  TESTING: 'testing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

export const ANALYSIS_STEPS = {
  SECURITY_SCAN: 'security-scan',
  QUALITY_CHECK: 'quality-check',
  PERFORMANCE_ANALYSIS: 'performance-analysis',
  STRUCTURE_REVIEW: 'structure-review',
  VISUAL_TESTING: 'visual-testing',
  DOCUMENTATION_CHECK: 'documentation-check',
  COMPLETENESS_REVIEW: 'completeness-review'
};

/**
 * Base event schema validation
 */
export class EventSchema {
  static validate(event) {
    const required = ['type', 'timestamp', 'session_id'];
    const missing = required.filter(field => !event[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (!Object.values(EVENT_TYPES).includes(event.type)) {
      throw new Error(`Invalid event type: ${event.type}`);
    }

    return true;
  }

  static create(type, data = {}, options = {}) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      session_id: options.sessionId || 'default_session',
      data: {
        ...data
      }
    };

    if (options.priority) {
      event.priority = options.priority;
    }

    if (options.source) {
      event.source = options.source;
    }

    if (options.target) {
      event.target = options.target;
    }

    EventSchema.validate(event);
    return event;
  }
}

/**
 * Specialized event creators for common event types
 */
export class EventCreators {
  static analysisStart(step, sessionId) {
    return EventSchema.create(EVENT_TYPES.ANALYSIS_START, {
      step,
      message: `Starting ${step} analysis...`
    }, { sessionId, priority: PRIORITY_LEVELS.MEDIUM });
  }

  static analysisProgress(step, progress, message, sessionId) {
    return EventSchema.create(EVENT_TYPES.ANALYSIS_PROGRESS, {
      step,
      progress,
      message
    }, { sessionId, priority: PRIORITY_LEVELS.LOW });
  }

  static analysisComplete(step, results, sessionId) {
    return EventSchema.create(EVENT_TYPES.ANALYSIS_COMPLETE, {
      step,
      results,
      message: `${step} analysis complete`
    }, { sessionId, priority: PRIORITY_LEVELS.MEDIUM });
  }

  static scoreUpdate(newScore, previousScore, changes, sessionId) {
    const improvement = newScore > previousScore;
    const eventType = improvement ? EVENT_TYPES.SCORE_IMPROVEMENT : EVENT_TYPES.SCORE_DEGRADATION;
    
    return EventSchema.create(eventType, {
      score: newScore,
      previousScore,
      changes,
      improvement,
      message: `Score ${improvement ? 'improved' : 'decreased'}: ${newScore.toFixed(1)}`
    }, { 
      sessionId, 
      priority: improvement ? PRIORITY_LEVELS.HIGH : PRIORITY_LEVELS.MEDIUM 
    });
  }

  static statusUpdate(phase, progress, message, sessionId) {
    return EventSchema.create(EVENT_TYPES.STATUS_UPDATE, {
      phase,
      progress,
      message,
      timestamp: new Date().toISOString()
    }, { sessionId, priority: PRIORITY_LEVELS.LOW });
  }

  static recommendationGenerated(recommendations, category, sessionId) {
    return EventSchema.create(EVENT_TYPES.RECOMMENDATION_GENERATED, {
      recommendations,
      category,
      count: recommendations.length,
      message: `${recommendations.length} new recommendations available`
    }, { sessionId, priority: PRIORITY_LEVELS.MEDIUM });
  }

  static errorOccurred(error, context, sessionId) {
    return EventSchema.create(EVENT_TYPES.ERROR_OCCURRED, {
      error: error.message,
      stack: error.stack,
      context,
      message: `Error: ${error.message}`
    }, { sessionId, priority: PRIORITY_LEVELS.CRITICAL });
  }

  static agentStatus(agentId, status, progress, message, sessionId) {
    return EventSchema.create(EVENT_TYPES.AGENT_STATUS, {
      agentId,
      status,
      progress,
      message
    }, { sessionId, priority: PRIORITY_LEVELS.LOW, source: agentId });
  }
}

/**
 * Event filtering utilities
 */
export class EventFilters {
  static byPriority(events, minPriority) {
    const priorities = [
      PRIORITY_LEVELS.LOW,
      PRIORITY_LEVELS.MEDIUM, 
      PRIORITY_LEVELS.HIGH,
      PRIORITY_LEVELS.CRITICAL
    ];
    
    const minIndex = priorities.indexOf(minPriority);
    if (minIndex === -1) return events;
    
    return events.filter(event => {
      const eventPriority = event.priority || PRIORITY_LEVELS.LOW;
      const eventIndex = priorities.indexOf(eventPriority);
      return eventIndex >= minIndex;
    });
  }

  static byType(events, ...types) {
    return events.filter(event => types.includes(event.type));
  }

  static byTimeRange(events, startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return events.filter(event => {
      const eventTime = new Date(event.timestamp);
      return eventTime >= start && eventTime <= end;
    });
  }

  static bySessionId(events, sessionId) {
    return events.filter(event => event.session_id === sessionId);
  }
}

export default {
  EVENT_TYPES,
  PRIORITY_LEVELS,
  STATUS_PHASES,
  ANALYSIS_STEPS,
  EventSchema,
  EventCreators,
  EventFilters
};