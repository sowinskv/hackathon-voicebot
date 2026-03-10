import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface BotFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface RequiredField {
  name: string;
  type: 'string' | 'number' | 'date' | 'email' | 'phone' | 'boolean';
  description: string;
  validation?: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface BotConfig {
  id?: string;
  name: string;
  description?: string;
  flow: BotFlow;
  systemPrompt: string;
  requiredFields: RequiredField[];
  status: 'draft' | 'published';
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BotVersion {
  id: string;
  version: number;
  status: 'draft' | 'published';
  flow: BotFlow;
  systemPrompt: string;
  requiredFields: RequiredField[];
  createdAt: string;
  createdBy: string;
}

export interface TestSession {
  sessionId: string;
  status: 'active' | 'completed';
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export interface FieldSuggestion {
  name: string;
  type: string;
  description: string;
  confidence: number;
}

// Bot Configuration APIs
export const saveBotConfig = async (config: BotConfig): Promise<BotConfig> => {
  const response = await api.post('/api/bot-configs', config);
  return response.data;
};

export const updateBotConfig = async (id: string, config: Partial<BotConfig>): Promise<BotConfig> => {
  const response = await api.put(`/api/bot-configs/${id}`, config);
  return response.data;
};

export const getBotConfig = async (id: string): Promise<BotConfig> => {
  const response = await api.get(`/api/bot-configs/${id}`);
  return response.data;
};

export const listBotConfigs = async (): Promise<BotConfig[]> => {
  const response = await api.get('/api/bot-configs');
  return response.data;
};

export const publishBotConfig = async (id: string): Promise<BotConfig> => {
  const response = await api.post(`/api/bot-configs/${id}/publish`);
  return response.data;
};

// Version Management APIs
export const getBotVersions = async (botId: string): Promise<BotVersion[]> => {
  const response = await api.get(`/api/bot-configs/${botId}/versions`);
  return response.data;
};

export const revertToVersion = async (botId: string, versionId: string): Promise<BotConfig> => {
  const response = await api.post(`/api/bot-configs/${botId}/revert/${versionId}`);
  return response.data;
};

// Test Session APIs
export const createTestSession = async (botId: string): Promise<TestSession> => {
  const response = await api.post(`/api/bot-configs/${botId}/test-session`);
  return response.data;
};

export const sendTestMessage = async (sessionId: string, message: string): Promise<TestSession> => {
  const response = await api.post(`/api/test-sessions/${sessionId}/messages`, { message });
  return response.data;
};

export const getTestSession = async (sessionId: string): Promise<TestSession> => {
  const response = await api.get(`/api/test-sessions/${sessionId}`);
  return response.data;
};

export const endTestSession = async (sessionId: string): Promise<void> => {
  await api.post(`/api/test-sessions/${sessionId}/end`);
};

// AI-Powered Features
export const suggestFields = async (
  systemPrompt: string,
  flow: BotFlow
): Promise<FieldSuggestion[]> => {
  const response = await api.post('/api/ai/suggest-fields', {
    systemPrompt,
    flow,
  });
  return response.data.suggestions;
};

export const validateFlow = async (flow: BotFlow): Promise<{ valid: boolean; errors: string[] }> => {
  const response = await api.post('/api/flow/validate', { flow });
  return response.data;
};

export default api;
