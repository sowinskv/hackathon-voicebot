/**
 * API request and response types for the call center system
 */

import {
  Session,
  SessionStatus,
  LanguageCode,
  Transcript,
  SessionData,
  SessionWithDetails
} from './session.types';
import { Flow, FlowStatus, FlowSummary, FlowDefinition } from './flow.types';
import {
  AnalyticsDashboard,
  DailyMetrics,
  TimePeriod,
  SessionMetrics,
  RealTimeStats
} from './analytics.types';
import {
  Escalation,
  EscalationWithSession,
  EscalationQueueItem,
  EscalationStatus,
  EscalationPriority,
  EscalationHandoff,
  EscalationStats
} from './escalation.types';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Whether request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Error code */
  error_code?: string;
  /** Additional metadata */
  meta?: {
    /** Timestamp of response */
    timestamp: Date;
    /** Request ID for tracking */
    request_id?: string;
    /** API version */
    version?: string;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** Pagination metadata */
  pagination: {
    /** Current page number */
    page: number;
    /** Items per page */
    page_size: number;
    /** Total number of items */
    total_items: number;
    /** Total number of pages */
    total_pages: number;
    /** Whether there is a next page */
    has_next: boolean;
    /** Whether there is a previous page */
    has_previous: boolean;
  };
}

/**
 * Session API endpoints
 */

/** Create session request */
export interface CreateSessionRequest {
  /** Language for the session */
  language: LanguageCode;
  /** Flow ID to use */
  flow_id?: string;
  /** Client metadata */
  client_metadata?: Record<string, any>;
  /** Initial tags */
  tags?: string[];
}

/** Create session response */
export interface CreateSessionResponse {
  /** Created session */
  session: Session;
  /** Daily.co room URL */
  room_url: string;
  /** Access token for the room */
  access_token?: string;
}

/** Update session request */
export interface UpdateSessionRequest {
  /** New status */
  status?: SessionStatus;
  /** Satisfaction score */
  satisfaction_score?: number;
  /** Update tags */
  tags?: string[];
  /** Update metadata */
  client_metadata?: Record<string, any>;
}

/** Get sessions request filters */
export interface GetSessionsFilters {
  /** Filter by status */
  status?: SessionStatus | SessionStatus[];
  /** Filter by language */
  language?: LanguageCode;
  /** Filter by flow ID */
  flow_id?: string;
  /** Filter by date range */
  date_range?: {
    start: Date;
    end: Date;
  };
  /** Filter by tags */
  tags?: string[];
  /** Search query */
  search?: string;
  /** Page number */
  page?: number;
  /** Items per page */
  page_size?: number;
}

/**
 * Transcript API endpoints
 */

/** Add transcript entry request */
export interface AddTranscriptRequest {
  /** Session ID */
  session_id: string;
  /** Speaker type */
  speaker: 'client' | 'bot' | 'agent';
  /** Transcript text */
  text: string;
  /** Audio URL */
  audio_url?: string;
  /** Sentiment */
  sentiment?: 'positive' | 'neutral' | 'negative';
  /** Language */
  language?: LanguageCode;
}

/** Get transcripts request */
export interface GetTranscriptsRequest {
  /** Session ID */
  session_id: string;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Session data API endpoints
 */

/** Update session data request */
export interface UpdateSessionDataRequest {
  /** Session ID */
  session_id: string;
  /** Field name */
  field_name: string;
  /** Field value */
  field_value: string;
  /** Field type */
  field_type?: 'text' | 'date' | 'number' | 'phone' | 'email' | 'policy_number';
  /** Whether value is confirmed */
  is_confirmed?: boolean;
}

/** Get session data request */
export interface GetSessionDataRequest {
  /** Session ID */
  session_id: string;
  /** Optional field name filter */
  field_name?: string;
}

/**
 * Flow API endpoints
 */

/** Create flow request */
export interface CreateFlowRequest {
  /** Flow name */
  name: string;
  /** Flow description */
  description?: string;
  /** Language */
  language: LanguageCode;
  /** System prompt */
  system_prompt: string;
  /** Flow definition */
  flow_definition: FlowDefinition;
  /** Required fields */
  required_fields: any[];
  /** Validation rules */
  validation_rules?: Record<string, any>;
}

/** Update flow request */
export interface UpdateFlowRequest {
  /** Flow name */
  name?: string;
  /** Flow description */
  description?: string;
  /** System prompt */
  system_prompt?: string;
  /** Flow definition */
  flow_definition?: FlowDefinition;
  /** Required fields */
  required_fields?: any[];
  /** Validation rules */
  validation_rules?: Record<string, any>;
  /** Status */
  status?: FlowStatus;
}

/** Get flows filters */
export interface GetFlowsFilters {
  /** Filter by status */
  status?: FlowStatus | FlowStatus[];
  /** Filter by language */
  language?: LanguageCode;
  /** Search query */
  search?: string;
  /** Page number */
  page?: number;
  /** Items per page */
  page_size?: number;
}

/** Publish flow request */
export interface PublishFlowRequest {
  /** Flow ID */
  flow_id: string;
}

/**
 * Analytics API endpoints
 */

/** Get analytics request */
export interface GetAnalyticsRequest {
  /** Time period */
  period: TimePeriod;
  /** Custom date range (if period is 'custom') */
  date_range?: {
    start: Date;
    end: Date;
  };
  /** Specific metrics to retrieve */
  metrics?: string[];
}

/** Get daily metrics request */
export interface GetDailyMetricsRequest {
  /** Start date */
  start_date: Date;
  /** End date */
  end_date: Date;
}

/**
 * Escalation API endpoints
 */

/** Create escalation request */
export interface CreateEscalationRequest {
  /** Session ID */
  session_id: string;
  /** Escalation summary */
  summary: string;
  /** Priority level */
  priority?: EscalationPriority;
}

/** Update escalation request */
export interface UpdateEscalationRequest {
  /** New status */
  status?: EscalationStatus;
  /** Assigned agent */
  assigned_to?: string;
  /** Agent notes */
  agent_notes?: string;
}

/** Get escalations filters */
export interface GetEscalationsFilters {
  /** Filter by status */
  status?: EscalationStatus | EscalationStatus[];
  /** Filter by priority */
  priority?: EscalationPriority | EscalationPriority[];
  /** Filter by assigned agent */
  assigned_to?: string;
  /** Filter by date range */
  date_range?: {
    start: Date;
    end: Date;
  };
  /** Page number */
  page?: number;
  /** Items per page */
  page_size?: number;
}

/** Assign escalation request */
export interface AssignEscalationRequest {
  /** Escalation ID */
  escalation_id: string;
  /** Agent username */
  agent_username: string;
  /** Optional notes */
  notes?: string;
}

/** Resolve escalation request */
export interface ResolveEscalationRequest {
  /** Escalation ID */
  escalation_id: string;
  /** Resolution notes */
  agent_notes: string;
  /** Outcome */
  outcome?: 'resolved' | 'completed' | 'transferred' | 'abandoned';
}

/**
 * WebSocket message types
 */

/** WebSocket message base */
export interface WebSocketMessage {
  /** Message type */
  type: string;
  /** Message payload */
  payload: any;
  /** Timestamp */
  timestamp: Date;
}

/** Session update message */
export interface SessionUpdateMessage extends WebSocketMessage {
  type: 'session_update';
  payload: {
    session_id: string;
    status: SessionStatus;
    data: Partial<Session>;
  };
}

/** Transcript message */
export interface TranscriptMessage extends WebSocketMessage {
  type: 'transcript';
  payload: {
    session_id: string;
    transcript: Transcript;
  };
}

/** Escalation notification message */
export interface EscalationNotificationMessage extends WebSocketMessage {
  type: 'escalation_notification';
  payload: {
    escalation: Escalation;
    action: 'created' | 'assigned' | 'resolved';
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Service status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Timestamp */
  timestamp: Date;
  /** Service version */
  version: string;
  /** Component health */
  components: {
    database: 'up' | 'down';
    redis?: 'up' | 'down';
    daily_api?: 'up' | 'down';
    ai_service?: 'up' | 'down';
  };
  /** Uptime in seconds */
  uptime: number;
}

/**
 * Error response details
 */
export interface ErrorResponse {
  /** Error message */
  error: string;
  /** Error code */
  error_code: string;
  /** HTTP status code */
  status_code: number;
  /** Detailed error information */
  details?: any;
  /** Timestamp */
  timestamp: Date;
  /** Request ID */
  request_id?: string;
}
