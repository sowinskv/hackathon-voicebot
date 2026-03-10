const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Session {
  id: string;
  room_id: string;
  status: 'active' | 'completed' | 'escalated' | 'resolved';
  language: string;
  flow_id: string;
  flow_name?: string;
  started_at: string;
  ended_at?: string | null;
  duration_seconds?: number | null;
  escalated: boolean;
  escalated_at?: string | null;
  escalation_reason?: string | null;
  client_metadata?: {
    name?: string;
    phone?: string;
    email?: string;
    [key: string]: any;
  };
  cost_data?: {
    llm_tokens?: number;
    stt_tokens?: number;
    total_cost_usd?: number;
    tts_characters?: number;
    [key: string]: any;
  };
  tags?: string[];
  satisfaction_score?: number | null;
  created_at: string;
  updated_at: string;

  // For compatibility with frontend components
  session_id?: string;
  start_time?: string;
  end_time?: string | null;
  duration?: number | null;
  client_info?: {
    name?: string;
    phone?: string;
    email?: string;
    [key: string]: any;
  };
  collected_data?: Record<string, any>;
  transcript?: Array<{
    speaker: 'agent' | 'client' | 'bot';
    text: string;
    timestamp: string;
  }>;
  audio_url?: string;
  agent_notes?: string;
  metadata?: Record<string, any>;
}

export interface BotMetrics {
  bot_id: string;
  bot_name: string;
  total_sessions: number;
  active_sessions: number;
  escalation_rate: number;
  avg_satisfaction: number;
  avg_duration: number;
  completed: number;
  first_try_completion_rate: number;
  angry_customers_rate: number;
  legal_threats_rate: number;
}

export interface SessionMetrics {
  total_sessions: number;
  active_sessions: number;
  escalation_rate: number;
  avg_duration: number;
  avg_satisfaction: number;
  completed: number;
  escalated: number;
  first_try_completion_rate: number;
  angry_customers_rate: number;
  legal_threats_rate: number;
  timeframe_distribution: { [key: string]: number };
  bots_metrics: BotMetrics[];
}

/**
 * API Client for the agent console
 */
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
    console.log(`API Request: ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        console.error(`API error: ${response.statusText}`, await response.text());
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`API Response:`, data);
      return data;
    } catch (error) {
      console.error(`API Request failed for ${url}:`, error);
      throw error;
    }
  }

  // Helper function to map API sessions to frontend format
  private mapSession(session: any): Session {
    console.log("Mapping session:", session);

    // Map backend fields to frontend expected fields for compatibility
    const mappedSession = {
      ...session,
      session_id: session.id,
      start_time: session.started_at,
      end_time: session.ended_at,
      duration: session.duration_seconds,
      client_info: session.client_metadata,
      // Add any other mappings needed
    };

    console.log("Mapped session:", mappedSession);
    return mappedSession;
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
    const response = await this.request<{status: string, data: any[], count: number}>(`/api/sessions${query ? `?${query}` : ''}`);

    // Map each session to the format expected by the frontend
    return response.data.map(this.mapSession);
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await this.request<{status: string, data: any}>(`/api/sessions/${sessionId}`);
    return this.mapSession(response.data);
  }

  async updateSessionStatus(
    sessionId: string,
    status: Session['status']
  ): Promise<Session> {
    const response = await this.request<{status: string, data: any}>(`/api/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return this.mapSession(response.data);
  }

  async updateSessionNotes(
    sessionId: string,
    notes: string
  ): Promise<Session> {
    const response = await this.request<{status: string, data: any}>(`/api/sessions/${sessionId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
    return this.mapSession(response.data);
  }

  async markAsResolved(
    sessionId: string,
    notes?: string
  ): Promise<Session> {
    const response = await this.request<{status: string, data: any}>(`/api/sessions/${sessionId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return this.mapSession(response.data);
  }

  // Metrics
  async getMetrics(timeframe: string = 'all'): Promise<SessionMetrics> {
    try {
      // Fetch metrics from the real API - no fallback to mock data
      const response = await this.request<{status: string, data: SessionMetrics, message?: string}>(`/api/metrics?timeframe=${timeframe}`);

      // Check for API error messages
      if (response.status === 'error' && response.message) {
        throw new Error(`API Error: ${response.message}`);
      }

      // Process metrics data
      const metricsData = response.data;
      console.log('Real-time metrics fetched:', metricsData);

      // Make sure all required metrics are present, with defaults for missing values
      const processedMetrics: SessionMetrics = {
        total_sessions: metricsData.total_sessions || 0,
        active_sessions: metricsData.active_sessions || 0,
        escalation_rate: metricsData.escalation_rate || 0,
        avg_duration: metricsData.avg_duration || 0,
        avg_satisfaction: metricsData.avg_satisfaction || 0,
        completed: metricsData.completed || 0,
        escalated: metricsData.escalated || 0,
        first_try_completion_rate: metricsData.first_try_completion_rate || 0,
        angry_customers_rate: metricsData.angry_customers_rate || 0,
        legal_threats_rate: metricsData.legal_threats_rate || 0,
        timeframe_distribution: metricsData.timeframe_distribution || {},
        bots_metrics: metricsData.bots_metrics || []
      };

      return processedMetrics;
    } catch (error) {
      console.error("Error fetching metrics:", error);

      // Throw the error so the UI can handle it appropriately
      throw error;
    }
  }

  // WebSocket URL
  getWebSocketUrl(): string {
    const wsProtocol = this.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = this.baseUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${baseUrl}/ws`;
  }
}

export const api = new ApiClient();