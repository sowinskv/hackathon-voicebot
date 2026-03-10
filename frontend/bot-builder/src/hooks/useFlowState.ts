import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { BotConfig, RequiredField } from '@/services/api';

interface FlowState {
  // Flow state
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;

  // Bot configuration
  botConfig: BotConfig | null;
  systemPrompt: string;
  requiredFields: RequiredField[];

  // UI state
  isDirty: boolean;
  isSaving: boolean;
  activeTab: 'flow' | 'prompt' | 'fields' | 'test' | 'versions';

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Record<string, any>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (node: Node | null) => void;

  setSystemPrompt: (prompt: string) => void;
  setRequiredFields: (fields: RequiredField[]) => void;
  addRequiredField: (field: RequiredField) => void;
  updateRequiredField: (index: number, field: RequiredField) => void;
  deleteRequiredField: (index: number) => void;

  setBotConfig: (config: BotConfig) => void;
  setActiveTab: (tab: 'flow' | 'prompt' | 'fields' | 'test' | 'versions') => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;

  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
  selectedNode: null,
  botConfig: null,
  systemPrompt: '',
  requiredFields: [],
  isDirty: false,
  isSaving: false,
  activeTab: 'flow' as const,
};

let nodeIdCounter = 1;

export const useFlowState = create<FlowState>((set, get) => ({
  ...initialState,

  setNodes: (nodes) => set({ nodes, isDirty: true }),

  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
      isDirty: true,
    });
  },

  addNode: (type, position) => {
    const id = `node-${nodeIdCounter++}`;
    const newNode: Node = {
      id,
      type,
      position,
      data: getDefaultNodeData(type),
    };

    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
    });
  },

  updateNode: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      isDirty: true,
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
      isDirty: true,
    });
  },

  selectNode: (node) => {
    set({ selectedNode: node });
  },

  setSystemPrompt: (prompt) => {
    set({ systemPrompt: prompt, isDirty: true });
  },

  setRequiredFields: (fields) => {
    set({ requiredFields: fields, isDirty: true });
  },

  addRequiredField: (field) => {
    set({
      requiredFields: [...get().requiredFields, field],
      isDirty: true,
    });
  },

  updateRequiredField: (index, field) => {
    const fields = [...get().requiredFields];
    fields[index] = field;
    set({ requiredFields: fields, isDirty: true });
  },

  deleteRequiredField: (index) => {
    set({
      requiredFields: get().requiredFields.filter((_, i) => i !== index),
      isDirty: true,
    });
  },

  setBotConfig: (config) => {
    set({
      botConfig: config,
      nodes: config.flow.nodes.map(n => ({
        ...n,
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: config.flow.edges,
      systemPrompt: config.systemPrompt,
      requiredFields: config.requiredFields,
      isDirty: false,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setIsDirty: (dirty) => set({ isDirty: dirty }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  reset: () => set(initialState),
}));

function getDefaultNodeData(type: string): Record<string, any> {
  switch (type) {
    case 'start':
      return {
        label: 'Start',
        message: 'Welcome! How can I help you today?',
      };
    case 'message':
      return {
        label: 'Message',
        message: '',
      };
    case 'slotCollection':
      return {
        label: 'Slot Collection',
        slots: [],
        prompt: '',
      };
    case 'validation':
      return {
        label: 'Validation',
        field: '',
        rules: [],
      };
    case 'confirmation':
      return {
        label: 'Confirmation',
        message: 'Is this information correct?',
      };
    case 'escalation':
      return {
        label: 'Escalation',
        reason: '',
        transferTo: '',
      };
    case 'end':
      return {
        label: 'End',
        message: 'Thank you! Goodbye.',
      };
    default:
      return { label: type };
  }
}
