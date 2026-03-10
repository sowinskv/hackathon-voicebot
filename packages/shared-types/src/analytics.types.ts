/**
 * Analytics and metrics types for the call center system
 */

/**
 * Daily metrics interface matching the daily_metrics table
 */
export interface DailyMetrics {
  /** Unique metrics ID */
  id: string;
  /** Date of metrics */
  date: Date;
  /** Total number of sessions */
  total_sessions: number;
  /** Number of completed sessions */
  completed_sessions: number;
  /** Number of escalated sessions */
  escalated_sessions: number;
  /** Number of abandoned sessions */
  abandoned_sessions: number;
  /** Average session duration in seconds */
  avg_duration_seconds: number | null;
  /** Average satisfaction score */
  avg_satisfaction_score: number | null;
  /** Total cost in USD */
  total_cost_usd: number | null;
  /** Completeness rate percentage */
  completeness_rate: number | null;
  /** Record creation timestamp */
  created_at: Date;
}

/**
 * Time period for analytics queries
 */
export type TimePeriod = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

/**
 * Date range filter
 */
export interface DateRange {
  /** Start date */
  start_date: Date;
  /** End date */
  end_date: Date;
}

/**
 * Session metrics aggregation
 */
export interface SessionMetrics {
  /** Total sessions in period */
  total_sessions: number;
  /** Active sessions */
  active_sessions: number;
  /** Completed sessions */
  completed_sessions: number;
  /** Escalated sessions */
  escalated_sessions: number;
  /** Abandoned sessions */
  abandoned_sessions: number;
  /** Completion rate percentage */
  completion_rate: number;
  /** Escalation rate percentage */
  escalation_rate: number;
  /** Abandonment rate percentage */
  abandonment_rate: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Average session duration in seconds */
  avg_duration_seconds: number;
  /** Median session duration in seconds */
  median_duration_seconds: number;
  /** Average response time in seconds */
  avg_response_time_seconds: number;
  /** Sessions by language */
  sessions_by_language: Record<string, number>;
  /** Sessions by hour of day */
  sessions_by_hour: Record<number, number>;
}

/**
 * Quality metrics
 */
export interface QualityMetrics {
  /** Average satisfaction score (1-5) */
  avg_satisfaction_score: number | null;
  /** Satisfaction distribution */
  satisfaction_distribution: Record<number, number>;
  /** Field completion rate percentage */
  field_completion_rate: number;
  /** Average fields collected per session */
  avg_fields_collected: number;
  /** Validation success rate percentage */
  validation_success_rate: number;
}

/**
 * Cost metrics
 */
export interface CostMetrics {
  /** Total cost in USD */
  total_cost_usd: number;
  /** Average cost per session */
  avg_cost_per_session: number;
  /** Cost by type */
  cost_breakdown: {
    /** AI token costs */
    ai_tokens: number;
    /** Audio processing costs */
    audio_processing: number;
    /** Other costs */
    other: number;
  };
  /** Total tokens used */
  total_tokens: {
    input: number;
    output: number;
  };
}

/**
 * Safety metrics
 */
export interface SafetyMetrics {
  /** Total safety events */
  total_events: number;
  /** Events by type */
  events_by_type: Record<string, number>;
  /** Events by severity */
  events_by_severity: {
    warning: number;
    critical: number;
  };
  /** Sessions with safety events */
  affected_sessions: number;
}

/**
 * Flow performance metrics
 */
export interface FlowMetrics {
  /** Flow ID */
  flow_id: string;
  /** Flow name */
  flow_name: string;
  /** Number of sessions using this flow */
  session_count: number;
  /** Average completion rate */
  avg_completion_rate: number;
  /** Average duration */
  avg_duration_seconds: number;
  /** Average satisfaction score */
  avg_satisfaction_score: number | null;
  /** Escalation rate */
  escalation_rate: number;
}

/**
 * Comprehensive analytics dashboard data
 */
export interface AnalyticsDashboard {
  /** Time period for this dashboard */
  period: TimePeriod;
  /** Date range */
  date_range: DateRange;
  /** Session metrics */
  session_metrics: SessionMetrics;
  /** Performance metrics */
  performance_metrics: PerformanceMetrics;
  /** Quality metrics */
  quality_metrics: QualityMetrics;
  /** Cost metrics */
  cost_metrics: CostMetrics;
  /** Safety metrics */
  safety_metrics: SafetyMetrics;
  /** Flow performance */
  flow_metrics: FlowMetrics[];
}

/**
 * Trend data point
 */
export interface TrendDataPoint {
  /** Date or timestamp */
  date: Date;
  /** Metric value */
  value: number;
  /** Optional label */
  label?: string;
}

/**
 * Trend analysis
 */
export interface TrendAnalysis {
  /** Metric name */
  metric: string;
  /** Data points */
  data: TrendDataPoint[];
  /** Trend direction */
  trend: 'up' | 'down' | 'stable';
  /** Percentage change */
  change_percentage: number;
}

/**
 * Real-time statistics
 */
export interface RealTimeStats {
  /** Currently active sessions */
  active_sessions: number;
  /** Sessions today */
  sessions_today: number;
  /** Average wait time for escalations in seconds */
  avg_escalation_wait_time: number;
  /** Pending escalations */
  pending_escalations: number;
  /** System health status */
  system_health: 'healthy' | 'degraded' | 'critical';
  /** Last updated timestamp */
  last_updated: Date;
}

/**
 * Export data format
 */
export interface AnalyticsExport {
  /** Export format */
  format: 'csv' | 'json' | 'excel';
  /** Exported data */
  data: any[];
  /** Metadata */
  metadata: {
    exported_at: Date;
    period: TimePeriod;
    date_range: DateRange;
    total_records: number;
  };
}
