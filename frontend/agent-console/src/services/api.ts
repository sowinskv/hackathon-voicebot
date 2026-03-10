const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Session {
  session_id: string;
  status: 'active' | 'completed' | 'escalated' | 'resolved';
  start_time: string;
  end_time?: string;
  duration?: number;
  escalated: boolean;
  escalation_reason?: string;
  client_info?: {
    phone?: string;
    name?: string;
    email?: string;
    [key: string]: any;
  };
  collected_data?: Record<string, any>;
  transcript?: Array<{
    speaker: 'agent' | 'client';
    text: string;
    timestamp: string;
  }>;
  audio_url?: string;
  satisfaction_score?: number;
  agent_notes?: string;
  metadata?: Record<string, any>;
}

export interface SessionMetrics {
  total_sessions: number;
  active_sessions: number;
  escalation_rate: number;
  avg_duration: number;
  avg_satisfaction: number;
  completed_today: number;
  escalated_today: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Sessions
  async getSessions(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Session[]> {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const query = queryParams.toString();
    return this.request<Session[]>(`/api/sessions${query ? `?${query}` : ''}`);
  }

  async getSession(sessionId: string): Promise<Session> {
    return this.request<Session>(`/api/sessions/${sessionId}`);
  }

  async updateSessionStatus(
    sessionId: string,
    status: Session['status']
  ): Promise<Session> {
    return this.request<Session>(`/api/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateSessionNotes(
    sessionId: string,
    notes: string
  ): Promise<Session> {
    return this.request<Session>(`/api/sessions/${sessionId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  async markAsResolved(
    sessionId: string,
    notes?: string
  ): Promise<Session> {
    return this.request<Session>(`/api/sessions/${sessionId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // Metrics
  async getMetrics(): Promise<SessionMetrics> {
    return this.request<SessionMetrics>('/api/metrics');
  }

  // WebSocket URL
  getWebSocketUrl(): string {
    const wsProtocol = this.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = this.baseUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${baseUrl}/ws`;
  }
}

export const api = new ApiClient();
