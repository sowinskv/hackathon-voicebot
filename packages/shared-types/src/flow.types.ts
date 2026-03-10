/**
 * Flow configuration types for the call center system
 */

/**
 * Flow status
 */
export type FlowStatus = 'draft' | 'published' | 'archived';

/**
 * Language code
 */
export type FlowLanguage = 'pl' | 'en';

/**
 * Node type in the flow
 */
export type NodeType =
  | 'start'
  | 'message'
  | 'question'
  | 'field_group'
  | 'branch'
  | 'confirmation'
  | 'validation'
  | 'action'
  | 'transfer'
  | 'escalation'
  | 'end';

/**
 * Edge type connecting nodes
 */
export type EdgeType = 'default' | 'conditional' | 'fallback';

/**
 * Condition operator for branching logic
 */
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'exists'
  | 'not_exists';

/**
 * Field validation rule
 */
export interface ValidationRule {
  /** Type of validation */
  type: 'regex' | 'length' | 'range' | 'custom' | 'required' | 'format';
  /** Validation parameters */
  params?: {
    pattern?: string;
    min?: number;
    max?: number;
    format?: string;
    message?: string;
  };
  /** Error message if validation fails */
  error_message: string;
}

/**
 * Field configuration in a flow
 */
export interface FieldConfig {
  /** Field name/key */
  name: string;
  /** Display label */
  label: string;
  /** Field type */
  type: 'text' | 'date' | 'number' | 'phone' | 'email' | 'policy_number';
  /** Whether field is required */
  required: boolean;
  /** Validation rules */
  validation?: ValidationRule[];
  /** Default value */
  default_value?: string;
  /** Help text or description */
  description?: string;
  /** Whether to confirm with user */
  needs_confirmation?: boolean;
}

/**
 * Condition for branching
 */
export interface BranchCondition {
  /** Field to check */
  field: string;
  /** Comparison operator */
  operator: ConditionOperator;
  /** Value to compare against */
  value: any;
  /** Logical operator for multiple conditions */
  logic?: 'and' | 'or';
}

/**
 * Branch-specific configuration
 */
export interface BranchConfig {
  /** Branch identifier */
  id: string;
  /** Branch name/label */
  name: string;
  /** Description of when this branch applies */
  description?: string;
  /** Conditions to enter this branch */
  conditions: BranchCondition[];
  /** Fields required for THIS branch only */
  required_fields: FieldConfig[];
  /** Whether to inherit parent fields */
  inherit_parent_fields?: boolean;
  /** Nested sub-branches (for multi-level branching) */
  sub_branches?: BranchConfig[];
}

/**
 * Node position in the visual editor
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Flow node configuration
 */
export interface FlowNode {
  /** Unique node ID */
  id: string;
  /** Node type */
  type: NodeType;
  /** Display label */
  label: string;
  /** Node configuration data */
  data: {
    /** Prompt or question text */
    prompt?: string;
    /** Message to display (for message nodes) */
    message?: string;
    /** Field to collect (for question nodes) */
    field?: string;
    /** Fields to collect (for field_group nodes) */
    fields?: string[];
    /** Branch configurations (for branch nodes) */
    branches?: BranchConfig[];
    /** Field that triggers branch detection */
    detection_field?: string;
    /** Validation rules */
    validation?: ValidationRule[];
    /** Conditions for branching */
    conditions?: BranchCondition[];
    /** Action to perform */
    action?: string;
    /** Action parameters */
    action_params?: Record<string, any>;
    /** Description */
    description?: string;
    /** Additional metadata */
    [key: string]: any;
  };
  /** Position in visual editor */
  position?: NodePosition;
}

/**
 * Flow edge (connection between nodes)
 */
export interface FlowEdge {
  /** Unique edge ID */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge type */
  type: EdgeType;
  /** Display label */
  label?: string;
  /** Condition for this edge to be taken */
  condition?: BranchCondition;
  /** Source handle ID (for branches with multiple outputs) */
  sourceHandle?: string;
  /** Target handle ID */
  targetHandle?: string;
  /** Visual styling */
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
  /** Whether edge is animated */
  animated?: boolean;
}

/**
 * Complete flow definition structure
 */
export interface FlowDefinition {
  /** All nodes in the flow */
  nodes: FlowNode[];
  /** All edges connecting nodes */
  edges: FlowEdge[];
  /** Starting node ID */
  start_node: string;
  /** Metadata */
  metadata?: {
    version?: string;
    author?: string;
    [key: string]: any;
  };
}

/**
 * Main flow interface matching the flows table
 */
export interface Flow {
  /** Unique flow ID */
  id: string;
  /** Flow name */
  name: string;
  /** Flow description */
  description: string | null;
  /** Version number */
  version: number;
  /** Flow status */
  status: FlowStatus;
  /** Flow language */
  language: FlowLanguage;
  /** System prompt for AI agent */
  system_prompt: string;
  /** Complete flow definition */
  flow_definition: FlowDefinition;
  /** Required fields configuration */
  required_fields: FieldConfig[];
  /** Validation rules */
  validation_rules: Record<string, ValidationRule[]>;
  /** Who created the flow */
  created_by: string;
  /** When published */
  published_at: Date | null;
  /** Record creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * Flow summary for listing
 */
export interface FlowSummary {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: FlowStatus;
  language: FlowLanguage;
  created_by: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Flow validation result
 */
export interface FlowValidationResult {
  /** Whether flow is valid */
  valid: boolean;
  /** Validation errors */
  errors: Array<{
    /** Error type */
    type: string;
    /** Error message */
    message: string;
    /** Node ID if applicable */
    node_id?: string;
    /** Edge ID if applicable */
    edge_id?: string;
  }>;
  /** Validation warnings */
  warnings: Array<{
    /** Warning type */
    type: string;
    /** Warning message */
    message: string;
    /** Node ID if applicable */
    node_id?: string;
  }>;
}

/**
 * Runtime session context with branch tracking
 */
export interface SessionContext {
  /** Session identifier */
  session_id: string;
  /** Flow identifier */
  flow_id: string;
  /** Current node ID */
  current_node_id: string;
  /** Stack of active branch IDs */
  active_branch_path: string[];
  /** All collected field values */
  collected_fields: Record<string, any>;
  /** Fields required for current branch */
  required_for_branch: FieldConfig[];
  /** Fields still needed */
  missing_fields: string[];
  /** Validation errors by field name */
  validation_errors: Record<string, string[]>;
  /** Session creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * Branch detection result
 */
export interface BranchDetectionResult {
  /** Selected branch ID (null if unclear) */
  selected_branch: string | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** Action to take */
  action: 'proceed' | 'clarify' | 'reprompt';
  /** Clarification prompt if needed */
  clarification_prompt?: string;
  /** All branch scores */
  branch_scores?: Array<{
    branch_id: string;
    score: number;
  }>;
}

/**
 * Field validation result
 */
export interface FieldValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Field name */
  field_name: string;
  /** Field value */
  value: any;
  /** Validation errors */
  errors: string[];
}

/**
 * Field collection plan
 */
export interface FieldCollectionPlan {
  /** Fields to collect in order */
  fields_to_collect: FieldConfig[];
  /** Total number of fields */
  total_count: number;
  /** Next field to collect */
  next_field: FieldConfig | null;
}
