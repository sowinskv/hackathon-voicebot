/**
 * Session-related types for the call center system
 */

/**
 * Session status enum
 */
export type SessionStatus = 'active' | 'completed' | 'escalated' | 'abandoned';

/**
 * Language code enum
 */
export type LanguageCode = 'pl' | 'en';

/**
 * Speaker type in conversation
 */
export type SpeakerType = 'client' | 'bot' | 'agent';

/**
 * Sentiment analysis result
 */
export type Sentiment = 'positive' | 'neutral' | 'negative';

/**
 * Field validation status
 */
export type ValidationStatus = 'valid' | 'invalid' | 'pending';

/**
 * Field type for collected data
 */
export type FieldType = 'text' | 'date' | 'number' | 'phone' | 'email' | 'policy_number';

/**
 * Cost data structure for session billing
 */
export interface CostData {
  total_usd?: number;
  input_tokens?: number;
  output_tokens?: number;
  audio_minutes?: number;
  [key: string]: any;
}

/**
 * Client metadata structure
 */
export interface ClientMetadata {
  ip?: string;
  user_agent?: string;
  device_type?: string;
  referrer?: string;
  [key: string]: any;
}

/**
 * Main session interface matching the sessions table
 */
export interface Session {
  /** Unique session identifier */
  id: string;
  /** Daily.co room ID */
  room_id: string;
  /** Current session status */
  status: SessionStatus;
  /** Conversation language */
  language: LanguageCode;
  /** Associated flow ID */
  flow_id: string | null;
  /** When the session started */
  started_at: Date;
  /** When the session ended */
  ended_at: Date | null;
  /** Total duration in seconds */
  duration_seconds: number | null;
  /** Whether session was escalated to human agent */
  escalated: boolean;
  /** When escalation occurred */
  escalated_at: Date | null;
  /** Reason for escalation */
  escalation_reason: string | null;
  /** Client metadata (IP, device, etc.) */
  client_metadata: ClientMetadata;
  /** Cost tracking data */
  cost_data: CostData;
  /** Tags for categorization */
  tags: string[];
  /** Customer satisfaction score (1-5) */
  satisfaction_score: number | null;
  /** Record creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * Transcript entry interface matching the transcripts table
 */
export interface Transcript {
  /** Unique transcript entry ID */
  id: string;
  /** Associated session ID */
  session_id: string;
  /** Who is speaking */
  speaker: SpeakerType;
  /** Transcript text content */
  text: string;
  /** When this was spoken */
  timestamp: Date;
  /** URL to audio recording */
  audio_url: string | null;
  /** Detected sentiment */
  sentiment: Sentiment | null;
  /** Language of this specific entry */
  language: LanguageCode | null;
  /** Record creation timestamp */
  created_at: Date;
}

/**
 * Session data (collected fields/slots) interface matching the session_data table
 */
export interface SessionData {
  /** Unique data entry ID */
  id: string;
  /** Associated session ID */
  session_id: string;
  /** Field name/key */
  field_name: string;
  /** Field value (stored as text) */
  field_value: string | null;
  /** Type of field */
  field_type: FieldType | null;
  /** Whether the value was confirmed by user */
  is_confirmed: boolean;
  /** When confirmation occurred */
  confirmed_at: Date | null;
  /** Validation status */
  validation_status: ValidationStatus | null;
  /** When the data was collected */
  collected_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * Session event (audit log) interface matching the session_events table
 */
export interface SessionEvent {
  /** Unique event ID */
  id: string;
  /** Associated session ID */
  session_id: string;
  /** Type of event */
  event_type: string;
  /** Event-specific data */
  event_data: Record<string, any>;
  /** When the event occurred */
  timestamp: Date;
}

/**
 * Safety event interface matching the safety_events table
 */
export type SafetyEventType =
  | 'profanity'
  | 'off_topic'
  | 'prompt_injection'
  | 'loop_detected'
  | 'timeout'
  | 'abuse';

/**
 * Severity level for safety events
 */
export type SafetyEventSeverity = 'warning' | 'critical';

/**
 * Safety event tracking interface
 */
export interface SafetyEvent {
  /** Unique event ID */
  id: string;
  /** Associated session ID */
  session_id: string | null;
  /** Type of safety event */
  event_type: SafetyEventType;
  /** Severity level */
  severity: SafetyEventSeverity;
  /** Detailed description */
  details: string | null;
  /** Action taken in response */
  action_taken: string | null;
  /** When the event was created */
  created_at: Date;
}

/**
 * Complete session with related data
 */
export interface SessionWithDetails extends Session {
  /** All transcripts for this session */
  transcripts?: Transcript[];
  /** All collected data for this session */
  session_data?: SessionData[];
  /** All events for this session */
  events?: SessionEvent[];
  /** Safety events for this session */
  safety_events?: SafetyEvent[];
}
