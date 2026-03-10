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
  | 'question'
  | 'confirmation'
  | 'validation'
  | 'end'
  | 'escalation'
  | 'branch'
  | 'action';

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
    /** Field to collect (for question nodes) */
    field?: string;
    /** Validation rules */
    validation?: ValidationRule[];
    /** Conditions for branching */
    conditions?: BranchCondition[];
    /** Action to perform */
    action?: string;
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
