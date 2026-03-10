/**
 * Escalation types for the call center system
 */

/**
 * Escalation status
 */
export type EscalationStatus = 'pending' | 'assigned' | 'resolved';

/**
 * Escalation priority level
 */
export type EscalationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Escalation reason categories
 */
export type EscalationReason =
  | 'customer_request'
  | 'bot_unable_to_help'
  | 'complex_issue'
  | 'technical_problem'
  | 'angry_customer'
  | 'sensitive_information'
  | 'policy_exception'
  | 'other';

/**
 * Main escalation interface matching the escalations table
 */
export interface Escalation {
  /** Unique escalation ID */
  id: string;
  /** Associated session ID */
  session_id: string | null;
  /** Current escalation status */
  status: EscalationStatus;
  /** Priority level */
  priority: EscalationPriority;
  /** Summary of why escalation occurred */
  summary: string;
  /** Agent assigned to handle escalation */
  assigned_to: string | null;
  /** When assigned to agent */
  assigned_at: Date | null;
  /** When resolved */
  resolved_at: Date | null;
  /** Notes from the agent */
  agent_notes: string | null;
  /** Record creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * Escalation with session details
 */
export interface EscalationWithSession extends Escalation {
  /** Session details */
  session?: {
    room_id: string;
    language: string;
    started_at: Date;
    client_metadata: Record<string, any>;
  };
  /** Latest transcripts from the session */
  recent_transcripts?: Array<{
    speaker: string;
    text: string;
    timestamp: Date;
  }>;
  /** Collected session data */
  collected_data?: Record<string, any>;
}

/**
 * Escalation queue item
 */
export interface EscalationQueueItem {
  /** Escalation ID */
  id: string;
  /** Session ID */
  session_id: string | null;
  /** Priority level */
  priority: EscalationPriority;
  /** Summary */
  summary: string;
  /** When created */
  created_at: Date;
  /** Wait time in seconds */
  wait_time_seconds: number;
  /** Session language */
  language?: string;
  /** Customer sentiment */
  sentiment?: string;
}

/**
 * Agent availability status
 */
export type AgentStatus = 'available' | 'busy' | 'offline';

/**
 * Agent information
 */
export interface Agent {
  /** Agent username/ID */
  username: string;
  /** Display name */
  display_name: string;
  /** Current status */
  status: AgentStatus;
  /** Languages the agent speaks */
  languages: string[];
  /** Currently assigned escalations */
  current_escalations: number;
  /** Maximum concurrent escalations */
  max_escalations: number;
  /** Agent skills/tags */
  skills: string[];
}

/**
 * Escalation assignment request
 */
export interface EscalationAssignment {
  /** Escalation ID */
  escalation_id: string;
  /** Agent to assign to */
  agent_username: string;
  /** Optional notes */
  notes?: string;
}

/**
 * Escalation resolution
 */
export interface EscalationResolution {
  /** Escalation ID */
  escalation_id: string;
  /** Resolution notes */
  agent_notes: string;
  /** Session outcome after resolution */
  outcome: 'resolved' | 'completed' | 'transferred' | 'abandoned';
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Escalation statistics
 */
export interface EscalationStats {
  /** Total pending escalations */
  pending: number;
  /** Total assigned escalations */
  assigned: number;
  /** Total resolved today */
  resolved_today: number;
  /** Average wait time in seconds */
  avg_wait_time: number;
  /** Average resolution time in seconds */
  avg_resolution_time: number;
  /** Escalations by priority */
  by_priority: Record<EscalationPriority, number>;
  /** Available agents */
  available_agents: number;
  /** Total agents */
  total_agents: number;
}

/**
 * Escalation filters for queries
 */
export interface EscalationFilters {
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
  /** Filter by language */
  language?: string;
}

/**
 * Escalation notification
 */
export interface EscalationNotification {
  /** Notification ID */
  id: string;
  /** Escalation ID */
  escalation_id: string;
  /** Notification type */
  type: 'new' | 'assigned' | 'reminder' | 'urgent';
  /** Target agent */
  target_agent: string;
  /** Message content */
  message: string;
  /** When notification was created */
  created_at: Date;
  /** Whether notification was read */
  read: boolean;
}

/**
 * Escalation handoff data
 */
export interface EscalationHandoff {
  /** Session ID */
  session_id: string;
  /** Reason for escalation */
  reason: EscalationReason;
  /** Priority level */
  priority: EscalationPriority;
  /** Context summary */
  summary: string;
  /** Collected data to pass to agent */
  collected_data: Record<string, any>;
  /** Conversation history */
  transcript: Array<{
    speaker: string;
    text: string;
    timestamp: Date;
  }>;
  /** Suggested actions */
  suggested_actions?: string[];
  /** Customer metadata */
  customer_metadata?: Record<string, any>;
}
