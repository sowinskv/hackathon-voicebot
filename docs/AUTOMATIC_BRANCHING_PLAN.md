# Automatic Branching & Visual Workflow Plan

**Date:** 2026-03-10
**Status:** Planning
**Goal:** Implement visual workflow builder with automatic branching and branch-scoped field validation

---

## Overview

Enable voicebot to automatically detect conversation paths (e.g., OC insurance vs property damage) and collect only the fields relevant to that branch, all configured through a visual block-based workflow builder.

### Current State
- Linear field collection (one field after another)
- Global `required_fields` for entire flow
- No branching logic
- Simple FlowEditor UI that just orders fields

### Target State
- Visual workflow builder with nodes and conditional edges
- Branch detection based on user responses
- Branch-scoped field requirements
- Automatic field collection per branch
- Runtime branch tracking and validation

---

## 1. Type System Extensions

### 1.1 Enhanced Flow Types

**File:** `packages/shared-types/src/flow.types.ts`

```typescript
/**
 * Extended node types with branching
 */
export type NodeType =
  | 'start'
  | 'question'        // Ask a question (for branching decision)
  | 'branch'          // Branch decision point
  | 'field_group'     // Collect multiple fields
  | 'validation'
  | 'confirmation'
  | 'action'          // Perform action (API call, etc.)
  | 'end'
  | 'escalation'
  | 'transfer';

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
 * Enhanced FlowNode with branch support
 */
export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  data: {
    prompt?: string;
    field?: string;
    validation?: ValidationRule[];

    // Branch node specific
    branches?: BranchConfig[];
    detection_field?: string;  // Which field triggers branching

    // Field group node specific
    fields?: string[];  // List of field names to collect

    // Action node specific
    action?: string;
    action_params?: Record<string, any>;

    // General
    description?: string;
    [key: string]: any;
  };
  position?: NodePosition;
}

/**
 * Enhanced edge with conditional routing
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;

  // Conditional edge
  condition?: BranchCondition;

  // Visual styling
  style?: {
    stroke?: string;
    strokeWidth?: number;
    animated?: boolean;
  };
}

/**
 * Runtime session context
 */
export interface SessionContext {
  session_id: string;
  flow_id: string;

  // Current state
  current_node_id: string;
  active_branch_path: string[];  // Stack of active branch IDs

  // Collected data
  collected_fields: Record<string, any>;

  // Branch-specific tracking
  required_for_branch: FieldConfig[];
  missing_fields: string[];

  // Validation state
  validation_errors: Record<string, string[]>;

  // Metadata
  created_at: Date;
  updated_at: Date;
}
```

### 1.2 Example Flow Structure

```json
{
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "label": "Start",
      "data": {
        "prompt": "Welcome! How can I help you today?"
      }
    },
    {
      "id": "collect-basic",
      "type": "field_group",
      "label": "Collect Basic Info",
      "data": {
        "fields": ["customer_name", "policy_number"],
        "description": "Collect customer identification"
      }
    },
    {
      "id": "detect-claim-type",
      "type": "branch",
      "label": "Detect Claim Type",
      "data": {
        "prompt": "What type of claim would you like to report?",
        "detection_field": "claim_type",
        "branches": [
          {
            "id": "oc_insurance",
            "name": "OC Insurance Claim",
            "description": "Car accident or third-party liability",
            "conditions": [
              {
                "field": "claim_type",
                "operator": "contains",
                "value": "car|accident|oc|vehicle",
                "logic": "or"
              }
            ],
            "required_fields": [
              {
                "name": "incident_date",
                "type": "date",
                "label": "Date of Incident",
                "required": true
              },
              {
                "name": "location",
                "type": "text",
                "label": "Location of Incident",
                "required": true
              },
              {
                "name": "other_party_info",
                "type": "text",
                "label": "Other Party Information",
                "required": true
              },
              {
                "name": "witness_info",
                "type": "text",
                "label": "Witness Information",
                "required": false
              }
            ]
          },
          {
            "id": "property_damage",
            "name": "Property Damage",
            "description": "Home, apartment, or building damage",
            "conditions": [
              {
                "field": "claim_type",
                "operator": "contains",
                "value": "property|home|house|building|apartment",
                "logic": "or"
              }
            ],
            "required_fields": [
              {
                "name": "property_address",
                "type": "text",
                "label": "Property Address",
                "required": true
              },
              {
                "name": "damage_type",
                "type": "text",
                "label": "Type of Damage",
                "required": true
              },
              {
                "name": "damage_date",
                "type": "date",
                "label": "When did the damage occur?",
                "required": true
              },
              {
                "name": "damage_photos",
                "type": "text",
                "label": "Photo documentation",
                "required": false
              }
            ]
          }
        ]
      }
    },
    {
      "id": "collect-oc-fields",
      "type": "field_group",
      "label": "Collect OC Details",
      "data": {
        "fields": ["incident_date", "location", "other_party_info", "witness_info"]
      }
    },
    {
      "id": "collect-property-fields",
      "type": "field_group",
      "label": "Collect Property Details",
      "data": {
        "fields": ["property_address", "damage_type", "damage_date", "damage_photos"]
      }
    },
    {
      "id": "confirm-data",
      "type": "confirmation",
      "label": "Confirm Information",
      "data": {
        "prompt": "Let me confirm the information you provided..."
      }
    },
    {
      "id": "end",
      "type": "end",
      "label": "End",
      "data": {
        "message": "Thank you! Your claim has been submitted."
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "start",
      "target": "collect-basic",
      "type": "default"
    },
    {
      "id": "e2",
      "source": "collect-basic",
      "target": "detect-claim-type",
      "type": "default"
    },
    {
      "id": "e3",
      "source": "detect-claim-type",
      "target": "collect-oc-fields",
      "type": "conditional",
      "label": "if OC Insurance",
      "condition": {
        "field": "detected_branch",
        "operator": "equals",
        "value": "oc_insurance"
      }
    },
    {
      "id": "e4",
      "source": "detect-claim-type",
      "target": "collect-property-fields",
      "type": "conditional",
      "label": "if Property Damage",
      "condition": {
        "field": "detected_branch",
        "operator": "equals",
        "value": "property_damage"
      }
    },
    {
      "id": "e5",
      "source": "collect-oc-fields",
      "target": "confirm-data",
      "type": "default"
    },
    {
      "id": "e6",
      "source": "collect-property-fields",
      "target": "confirm-data",
      "type": "default"
    },
    {
      "id": "e7",
      "source": "confirm-data",
      "target": "end",
      "type": "default"
    }
  ]
}
```

---

## 2. Backend: Automatic Branching Logic

### 2.1 Branch Detection Engine

**File:** `backend/voicebot-engine/src/services/BranchDetectionService.ts`

**Responsibilities:**
- Analyze user response against branch conditions
- Select appropriate branch based on matching criteria
- Handle ambiguous cases (ask clarifying questions)
- Track active branch path in session

**Algorithm:**
```
1. User provides input
2. Check if current node is a branch node
3. If yes:
   a. Extract detection field value from user input
   b. Evaluate each branch condition
   c. Score branches by match confidence
   d. If confident (>80%): select branch
   e. If ambiguous (50-80%): ask clarification
   f. If unclear (<50%): re-prompt
4. Update session with active_branch_path
5. Load required_fields for selected branch
6. Continue flow execution
```

**Pseudo-code:**
```typescript
class BranchDetectionService {
  async detectBranch(
    node: FlowNode,
    userInput: string,
    sessionContext: SessionContext
  ): Promise<BranchDetectionResult> {
    const branches = node.data.branches || [];
    const scores: BranchScore[] = [];

    for (const branch of branches) {
      const score = await this.evaluateBranch(branch, userInput);
      scores.push({ branch, score, confidence: score.confidence });
    }

    // Sort by confidence
    scores.sort((a, b) => b.confidence - a.confidence);

    const bestMatch = scores[0];

    if (bestMatch.confidence > 0.8) {
      // High confidence - select this branch
      return {
        selected_branch: bestMatch.branch.id,
        confidence: bestMatch.confidence,
        action: 'proceed'
      };
    } else if (bestMatch.confidence > 0.5) {
      // Medium confidence - ask clarification
      return {
        selected_branch: null,
        confidence: bestMatch.confidence,
        action: 'clarify',
        clarification_prompt: this.generateClarification(scores)
      };
    } else {
      // Low confidence - re-prompt
      return {
        selected_branch: null,
        confidence: bestMatch.confidence,
        action: 'reprompt'
      };
    }
  }

  private async evaluateBranch(
    branch: BranchConfig,
    userInput: string
  ): Promise<{ confidence: number }> {
    // Use LLM or keyword matching to evaluate
    // For MVP: simple keyword matching
    // For production: use embedding similarity or LLM classification

    const conditions = branch.conditions;
    let totalScore = 0;

    for (const condition of conditions) {
      if (condition.operator === 'contains') {
        const keywords = condition.value.split('|');
        const matches = keywords.filter(kw =>
          userInput.toLowerCase().includes(kw.toLowerCase())
        );
        totalScore += matches.length / keywords.length;
      }
    }

    return { confidence: totalScore / conditions.length };
  }
}
```

### 2.2 Field Collection Service

**File:** `backend/voicebot-engine/src/services/FieldCollectionService.ts`

**Responsibilities:**
- Track which fields are required for current branch
- Collect fields in logical order
- Validate fields as they're collected
- Handle re-prompts on validation failures

**Logic:**
```typescript
class FieldCollectionService {
  async collectFieldsForBranch(
    branchId: string,
    flowDefinition: FlowDefinition,
    sessionContext: SessionContext
  ): Promise<FieldCollectionPlan> {
    // 1. Get branch configuration
    const branch = this.findBranch(branchId, flowDefinition);

    // 2. Get required fields for this branch
    const requiredFields = branch.required_fields;

    // 3. Filter out already collected fields
    const missingFields = requiredFields.filter(
      field => !sessionContext.collected_fields[field.name]
    );

    // 4. Sort by priority/dependencies
    const sortedFields = this.sortFieldsByPriority(missingFields);

    // 5. Return collection plan
    return {
      fields_to_collect: sortedFields,
      total_count: sortedFields.length,
      next_field: sortedFields[0]
    };
  }

  async validateField(
    field: FieldConfig,
    value: any
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    if (field.validation) {
      for (const rule of field.validation) {
        if (!this.checkValidationRule(rule, value)) {
          errors.push(rule.error_message);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      field_name: field.name,
      value
    };
  }
}
```

### 2.3 Flow Execution Engine Updates

**File:** `backend/voicebot-engine/src/services/FlowExecutionService.ts`

**Enhanced to handle branching:**
```typescript
class FlowExecutionService {
  async executeNode(
    node: FlowNode,
    sessionContext: SessionContext
  ): Promise<ExecutionResult> {
    switch (node.type) {
      case 'start':
        return this.handleStart(node, sessionContext);

      case 'field_group':
        return this.handleFieldGroup(node, sessionContext);

      case 'branch':
        return this.handleBranch(node, sessionContext);

      case 'confirmation':
        return this.handleConfirmation(node, sessionContext);

      case 'end':
        return this.handleEnd(node, sessionContext);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private async handleBranch(
    node: FlowNode,
    sessionContext: SessionContext
  ): Promise<ExecutionResult> {
    // 1. Get user input
    const userInput = sessionContext.last_user_message;

    // 2. Detect branch
    const detection = await this.branchDetectionService.detectBranch(
      node,
      userInput,
      sessionContext
    );

    if (detection.action === 'proceed') {
      // 3. Update session with selected branch
      sessionContext.active_branch_path.push(detection.selected_branch);

      // 4. Find next node (follow conditional edge)
      const nextNode = this.findNextNodeForBranch(
        node,
        detection.selected_branch
      );

      return {
        next_node_id: nextNode.id,
        response: `I understand this is a ${detection.selected_branch} case. Let me collect the necessary information.`
      };
    } else if (detection.action === 'clarify') {
      return {
        next_node_id: node.id, // Stay on same node
        response: detection.clarification_prompt
      };
    } else {
      return {
        next_node_id: node.id,
        response: node.data.prompt // Re-prompt
      };
    }
  }
}
```

---

## 3. UI: Visual Workflow Builder

### 3.1 Architecture

**Tech Stack:**
- React Flow (already installed)
- Zustand for state management
- Tailwind for styling

**Components:**

```
FlowEditor/
├── Canvas.tsx              # Main ReactFlow canvas
├── Sidebar.tsx             # Node palette + properties
├── NodeTypes/
│   ├── StartNode.tsx
│   ├── BranchNode.tsx      # NEW: Branch decision node
│   ├── FieldGroupNode.tsx  # NEW: Multi-field collection
│   ├── ConfirmationNode.tsx
│   ├── ActionNode.tsx      # NEW: Custom actions
│   ├── EndNode.tsx
│   └── index.ts
├── EdgeTypes/
│   ├── ConditionalEdge.tsx # NEW: Styled conditional edges
│   └── index.ts
├── Inspector/
│   ├── BranchInspector.tsx # NEW: Configure branch conditions
│   ├── FieldInspector.tsx  # NEW: Configure field collection
│   └── EdgeInspector.tsx   # NEW: Configure edge conditions
├── Toolbar.tsx
└── index.tsx
```

### 3.2 Enhanced FlowEditor Component

**File:** `frontend/bot-builder/src/components/FlowEditor/index.tsx`

```tsx
import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from './NodeTypes';
import { edgeTypes } from './EdgeTypes';
import Sidebar from './Sidebar';
import Inspector from './Inspector';

interface Props {
  flow: FlowDefinition;
  onChange: (flow: FlowDefinition) => void;
  fields: FieldConfig[];
}

const FlowEditor: React.FC<Props> = ({ flow, onChange, fields }) => {
  const [nodes, setNodes] = useState<Node[]>(flow.nodes || []);
  const [edges, setEdges] = useState<Edge[]>(flow.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const addNode = (type: string) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 250, y: 100 },
      data: { label: `New ${type}` },
    };
    setNodes([...nodes, newNode]);
  };

  const updateNodeData = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  };

  const updateEdgeData = (edgeId: string, data: any) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId ? { ...edge, ...data } : edge
      )
    );
  };

  // Sync changes back to parent
  React.useEffect(() => {
    onChange({ ...flow, nodes, edges });
  }, [nodes, edges]);

  return (
    <div className="flex h-screen">
      {/* Node Palette */}
      <Sidebar onAddNode={addNode} />

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onEdgeClick={(_, edge) => setSelectedEdge(edge)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Properties Inspector */}
      <Inspector
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        fields={fields}
        onUpdateNode={updateNodeData}
        onUpdateEdge={updateEdgeData}
      />
    </div>
  );
};

export default FlowEditor;
```

### 3.3 Branch Node Component

**File:** `frontend/bot-builder/src/components/FlowEditor/NodeTypes/BranchNode.tsx`

```tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Plus } from 'lucide-react';

export const BranchNode = memo(({ data, selected }: NodeProps) => {
  const branches = data.branches || [];

  return (
    <div
      className={`bg-white rounded-lg border-2 border-orange-500 shadow-lg min-w-[250px] ${
        selected ? 'ring-2 ring-orange-300 ring-offset-2' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-500" />

      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-orange-600" />
          <div className="font-semibold text-gray-900">{data.label}</div>
        </div>
        {data.description && (
          <p className="text-xs text-gray-500 mt-1">{data.description}</p>
        )}
      </div>

      {/* Branches */}
      <div className="p-2 space-y-1">
        {branches.map((branch, idx) => (
          <div
            key={branch.id}
            className="text-xs bg-orange-50 rounded px-2 py-1 flex items-center justify-between"
          >
            <span className="font-medium text-orange-700">{branch.name}</span>
            <span className="text-gray-500">
              {branch.required_fields?.length || 0} fields
            </span>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-2">
            No branches configured
          </div>
        )}
      </div>

      {/* Multiple output handles (one per branch) */}
      {branches.map((branch, idx) => (
        <Handle
          key={branch.id}
          type="source"
          position={Position.Bottom}
          id={branch.id}
          className="!bg-orange-500"
          style={{
            left: `${(100 / (branches.length + 1)) * (idx + 1)}%`,
          }}
        />
      ))}

      {/* Default fallback handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="fallback"
        className="!bg-gray-400"
      />
    </div>
  );
});
```

### 3.4 Branch Inspector Panel

**File:** `frontend/bot-builder/src/components/FlowEditor/Inspector/BranchInspector.tsx`

```tsx
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  node: Node;
  fields: FieldConfig[];
  onUpdate: (nodeId: string, data: any) => void;
}

const BranchInspector: React.FC<Props> = ({ node, fields, onUpdate }) => {
  const branches = node.data.branches || [];

  const addBranch = () => {
    const newBranch: BranchConfig = {
      id: `branch-${Date.now()}`,
      name: 'New Branch',
      description: '',
      conditions: [],
      required_fields: [],
    };

    onUpdate(node.id, {
      branches: [...branches, newBranch],
    });
  };

  const updateBranch = (branchId: string, updates: Partial<BranchConfig>) => {
    const updated = branches.map(b =>
      b.id === branchId ? { ...b, ...updates } : b
    );
    onUpdate(node.id, { branches: updated });
  };

  const deleteBranch = (branchId: string) => {
    const updated = branches.filter(b => b.id !== branchId);
    onUpdate(node.id, { branches: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Branch Configuration</h3>
        <button
          onClick={addBranch}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {branches.map((branch) => (
        <div key={branch.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <input
              type="text"
              value={branch.name}
              onChange={(e) => updateBranch(branch.id, { name: e.target.value })}
              className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => deleteBranch(branch.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <textarea
            placeholder="Description"
            value={branch.description}
            onChange={(e) => updateBranch(branch.id, { description: e.target.value })}
            className="w-full text-sm text-gray-600 border rounded p-2"
            rows={2}
          />

          {/* Condition Builder */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions</h4>
            {/* TODO: Add condition builder UI */}
            <div className="text-xs text-gray-400">
              Add keyword matching or field conditions
            </div>
          </div>

          {/* Field Selector */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Required Fields ({branch.required_fields?.length || 0})
            </h4>
            <select
              onChange={(e) => {
                const field = fields.find(f => f.name === e.target.value);
                if (field) {
                  updateBranch(branch.id, {
                    required_fields: [...(branch.required_fields || []), field],
                  });
                }
              }}
              className="w-full text-sm border rounded p-2"
            >
              <option value="">Select field to add...</option>
              {fields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label}
                </option>
              ))}
            </select>

            <div className="mt-2 space-y-1">
              {branch.required_fields?.map((field) => (
                <div
                  key={field.name}
                  className="text-xs bg-gray-50 rounded px-2 py-1 flex items-center justify-between"
                >
                  <span>{field.label}</span>
                  <button
                    onClick={() => {
                      updateBranch(branch.id, {
                        required_fields: branch.required_fields.filter(
                          f => f.name !== field.name
                        ),
                      });
                    }}
                    className="text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {branches.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No branches yet. Add one to get started.
        </div>
      )}
    </div>
  );
};

export default BranchInspector;
```

### 3.5 Conditional Edge Component

**File:** `frontend/bot-builder/src/components/FlowEditor/EdgeTypes/ConditionalEdge.tsx`

```tsx
import React from 'react';
import { getBezierPath, EdgeProps } from 'reactflow';

const ConditionalEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: data?.condition ? '#f59e0b' : '#94a3b8',
          strokeWidth: 2,
          strokeDasharray: data?.condition ? '5,5' : 'none',
        }}
      />
      {data?.label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-30}
            y={-10}
            width={60}
            height={20}
            fill="white"
            stroke="#f59e0b"
            strokeWidth={1}
            rx={4}
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fontSize={10}
            fill="#f59e0b"
            fontWeight="500"
          >
            {data.label}
          </text>
        </g>
      )}
    </>
  );
};

export default ConditionalEdge;
```

---

## 4. Runtime Execution Flow

### 4.1 Example Conversation Flow

**Scenario:** User calls about a car accident

```
System: Welcome! How can I help you today?
User: I had a car accident and need to file a claim

[System detects branch = "oc_insurance"]

System: I understand this is a car accident claim. Let me collect some information.
        First, can you provide your policy number?
User: ABC123456

System: Thank you. When did the accident occur?
User: Yesterday around 3pm

System: Where did it happen?
User: On Main Street near the mall

System: Can you describe what happened and provide information about the other party?
User: I was at a red light and someone hit me from behind. The other driver's name is John Smith...

[System collects all OC-specific fields]

System: Let me confirm the information:
        - Policy: ABC123456
        - Date: Yesterday 3pm
        - Location: Main Street near mall
        - Other party: John Smith
        Is this correct?
User: Yes

System: Perfect. Your claim has been submitted. You'll receive a confirmation email shortly.
```

### 4.2 Session State Tracking

```typescript
// Session state example
{
  "session_id": "sess-12345",
  "flow_id": "flow-oc-claims",
  "current_node_id": "collect-oc-fields",
  "active_branch_path": ["oc_insurance"],
  "collected_fields": {
    "customer_name": "Jane Doe",
    "policy_number": "ABC123456",
    "claim_type": "car accident",
    "incident_date": "2026-03-09 15:00",
    "location": "Main Street near mall",
    "other_party_info": "John Smith, license plate XYZ789..."
  },
  "required_for_branch": [
    "incident_date",
    "location",
    "other_party_info",
    "witness_info"
  ],
  "missing_fields": ["witness_info"],
  "validation_errors": {}
}
```

---

## 5. Implementation Phases

### Phase 1: Type System & Basic Backend (Week 1)
- [ ] Extend flow.types.ts with branch types
- [ ] Implement BranchDetectionService (basic keyword matching)
- [ ] Update FlowExecutionService to handle branch nodes
- [ ] Add SessionContext tracking
- [ ] Write unit tests

### Phase 2: Visual Editor Foundation (Week 2)
- [ ] Refactor FlowEditor to use ReactFlow
- [ ] Implement BranchNode component
- [ ] Implement FieldGroupNode component
- [ ] Add basic drag-and-drop
- [ ] Add node/edge CRUD operations

### Phase 3: Branch Configuration UI (Week 2-3)
- [ ] Build BranchInspector panel
- [ ] Add condition builder UI
- [ ] Implement field selection for branches
- [ ] Add conditional edge styling
- [ ] Add validation visualization

### Phase 4: Field Collection Logic (Week 3)
- [ ] Implement FieldCollectionService
- [ ] Add field validation per branch
- [ ] Handle missing field prompts
- [ ] Add re-validation on failures
- [ ] Test with multiple branches

### Phase 5: Integration & Testing (Week 4)
- [ ] Connect visual editor to API
- [ ] Save/load flow definitions
- [ ] End-to-end testing with voice-app
- [ ] Add flow validation (detect orphaned nodes, cycles, etc.)
- [ ] Performance optimization

### Phase 6: Advanced Features (Future)
- [ ] Multi-level nested branching
- [ ] ML-based branch detection (embeddings)
- [ ] Dynamic field dependencies
- [ ] A/B testing for branches
- [ ] Analytics dashboard

---

## 6. Open Questions & Decisions

### Q1: How to handle ambiguous branch detection?
**Options:**
- A) Ask clarifying question
- B) Use ML to score confidence
- C) Let user explicitly select

**Decision:** Start with A (clarifying questions), upgrade to B later

### Q2: Should branches inherit parent fields?
**Decision:** Yes, with `inherit_parent_fields` flag. Default: true

### Q3: How to handle nested branching (branch within branch)?
**Decision:** Support via `sub_branches` in BranchConfig. Phase 6 feature.

### Q4: Validation on partial field collection?
**Decision:** Validate fields immediately as collected. Store validation errors in session.

### Q5: Edge case - User changes their mind mid-branch?
**Decision:** Allow branch switching. Clear branch-specific collected fields, keep global fields.

---

## 7. Success Criteria

- [ ] Visual workflow builder matches inspiration image
- [ ] Branch detection accuracy >85% for clear cases
- [ ] Field collection only asks relevant questions per branch
- [ ] No duplicate field collection across branches
- [ ] Flows are saveable/loadable via API
- [ ] Voice-app can execute branching flows correctly
- [ ] Bot-builder UI is intuitive (user testing)

---

## 8. Resources & References

- ReactFlow docs: https://reactflow.dev/
- Inspiration: `/ui-inspo/workflow-overview.webp`
- Current types: `packages/shared-types/src/flow.types.ts`
- Current FlowEditor: `frontend/bot-builder/src/components/FlowEditor.tsx`
- Database schema: `database/init.sql`

---

**Next Steps:**
1. Review this plan with team
2. Prioritize phases
3. Start Phase 1 implementation
4. Set up weekly demos
