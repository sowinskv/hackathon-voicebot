/**
 * Shared TypeScript types for the call center system
 *
 * This package contains all shared type definitions used across
 * the call center frontend and backend services.
 */

// Session types
export {
  Session,
  Transcript,
  SessionData,
  SessionEvent,
  SafetyEvent,
  SessionWithDetails,
  SessionStatus,
  LanguageCode,
  SpeakerType,
  Sentiment,
  ValidationStatus,
  FieldType,
  SafetyEventType,
  SafetyEventSeverity,
  CostData,
  ClientMetadata,
} from './session.types';

// Flow types
export {
  Flow,
  FlowNode,
  FlowEdge,
  FlowDefinition,
  FlowSummary,
  FlowValidationResult,
  FieldConfig,
  ValidationRule,
  BranchCondition,
  NodePosition,
  FlowStatus,
  FlowLanguage,
  NodeType,
  EdgeType,
  ConditionOperator,
} from './flow.types';

// Analytics types
export {
  DailyMetrics,
  AnalyticsDashboard,
  SessionMetrics,
  PerformanceMetrics,
  QualityMetrics,
  CostMetrics,
  SafetyMetrics,
  FlowMetrics,
  TrendDataPoint,
  TrendAnalysis,
  RealTimeStats,
  AnalyticsExport,
  TimePeriod,
  DateRange,
} from './analytics.types';

// Escalation types
export {
  Escalation,
  EscalationWithSession,
  EscalationQueueItem,
  EscalationAssignment,
  EscalationResolution,
  EscalationStats,
  EscalationFilters,
  EscalationNotification,
  EscalationHandoff,
  Agent,
  EscalationStatus,
  EscalationPriority,
  EscalationReason,
  AgentStatus,
} from './escalation.types';

// API types
export {
  ApiResponse,
  PaginatedResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  UpdateSessionRequest,
  GetSessionsFilters,
  AddTranscriptRequest,
  GetTranscriptsRequest,
  UpdateSessionDataRequest,
  GetSessionDataRequest,
  CreateFlowRequest,
  UpdateFlowRequest,
  GetFlowsFilters,
  PublishFlowRequest,
  GetAnalyticsRequest,
  GetDailyMetricsRequest,
  CreateEscalationRequest,
  UpdateEscalationRequest,
  GetEscalationsFilters,
  AssignEscalationRequest,
  ResolveEscalationRequest,
  WebSocketMessage,
  SessionUpdateMessage,
  TranscriptMessage,
  EscalationNotificationMessage,
  HealthCheckResponse,
  ErrorResponse,
} from './api.types';
