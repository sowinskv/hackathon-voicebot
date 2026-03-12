const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    try {
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
    } catch (error) {
      console.error("Error fetching sessions, using mock data:", error);

      // Return mock sessions for UI development
      const mockSessions: Session[] = [
        {
          id: 'sess_001',
          session_id: 'sess_001',
          room_id: 'room_001',
          status: 'escalated',
          language: 'en',
          flow_id: 'flow_001',
          flow_name: 'Customer Support Flow',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          start_time: new Date(Date.now() - 3600000).toISOString(),
          ended_at: null,
          end_time: null,
          duration_seconds: 3600,
          duration: 3600,
          escalated: true,
          escalated_at: new Date(Date.now() - 1800000).toISOString(),
          escalation_reason: 'Customer requested to speak with a manager regarding billing dispute',
          client_metadata: {
            name: 'Sarah Johnson',
            phone: '+1 (555) 123-4567',
            email: 'sarah.j@example.com'
          },
          client_info: {
            name: 'Sarah Johnson',
            phone: '+1 (555) 123-4567',
            email: 'sarah.j@example.com'
          },
          satisfaction_score: 2,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 'sess_002',
          session_id: 'sess_002',
          room_id: 'room_002',
          status: 'escalated',
          language: 'en',
          flow_id: 'flow_002',
          flow_name: 'Technical Support Flow',
          started_at: new Date(Date.now() - 7200000).toISOString(),
          start_time: new Date(Date.now() - 7200000).toISOString(),
          ended_at: null,
          end_time: null,
          duration_seconds: 1200,
          duration: 1200,
          escalated: true,
          escalated_at: new Date(Date.now() - 5400000).toISOString(),
          escalation_reason: 'Technical issue beyond bot capabilities - server authentication failure',
          client_metadata: {
            name: 'Michael Chen',
            phone: '+1 (555) 987-6543',
            email: 'mchen@techcorp.com'
          },
          client_info: {
            name: 'Michael Chen',
            phone: '+1 (555) 987-6543',
            email: 'mchen@techcorp.com'
          },
          satisfaction_score: 3,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 5400000).toISOString()
        },
        {
          id: 'sess_003',
          session_id: 'sess_003',
          room_id: 'room_003',
          status: 'escalated',
          language: 'en',
          flow_id: 'flow_001',
          flow_name: 'Customer Support Flow',
          started_at: new Date(Date.now() - 10800000).toISOString(),
          start_time: new Date(Date.now() - 10800000).toISOString(),
          ended_at: null,
          end_time: null,
          duration_seconds: 890,
          duration: 890,
          escalated: true,
          escalated_at: new Date(Date.now() - 9000000).toISOString(),
          escalation_reason: 'Customer expressing frustration, requesting immediate assistance',
          client_metadata: {
            name: 'Emily Rodriguez',
            phone: '+1 (555) 246-8135',
            email: 'emily.r@gmail.com'
          },
          client_info: {
            name: 'Emily Rodriguez',
            phone: '+1 (555) 246-8135',
            email: 'emily.r@gmail.com'
          },
          satisfaction_score: 2,
          created_at: new Date(Date.now() - 10800000).toISOString(),
          updated_at: new Date(Date.now() - 9000000).toISOString()
        },
        {
          id: 'sess_004',
          session_id: 'sess_004',
          room_id: 'room_004',
          status: 'escalated',
          language: 'en',
          flow_id: 'flow_003',
          flow_name: 'Sales Inquiry Flow',
          started_at: new Date(Date.now() - 14400000).toISOString(),
          start_time: new Date(Date.now() - 14400000).toISOString(),
          ended_at: null,
          end_time: null,
          duration_seconds: 567,
          duration: 567,
          escalated: true,
          escalated_at: new Date(Date.now() - 12600000).toISOString(),
          escalation_reason: 'Complex pricing inquiry requiring sales specialist',
          client_metadata: {
            name: 'David Thompson',
            phone: '+1 (555) 369-2580',
            email: 'd.thompson@business.com'
          },
          client_info: {
            name: 'David Thompson',
            phone: '+1 (555) 369-2580',
            email: 'd.thompson@business.com'
          },
          satisfaction_score: 4,
          created_at: new Date(Date.now() - 14400000).toISOString(),
          updated_at: new Date(Date.now() - 12600000).toISOString()
        }
      ];

      // Filter by status if requested
      if (params?.status && params.status !== 'all') {
        return mockSessions.filter(s => s.status === params.status);
      }

      return mockSessions;
    }
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

  // Helper to generate mock distribution data
  private generateMockDistribution(timeframe: string): { [key: string]: number } {
    const mockDistribution: { [key: string]: number } = {};

    // Generate distribution based on timeframe with realistic patterns
    if (timeframe === 'day') {
      // 24 hours - higher during business hours
      const hourlyPattern = [12, 8, 5, 3, 2, 4, 8, 15, 32, 45, 52, 48, 42, 47, 51, 49, 43, 38, 28, 22, 18, 16, 14, 10];
      for (let i = 0; i < 24; i++) {
        mockDistribution[i.toString()] = hourlyPattern[i];
      }
    } else if (timeframe === 'week') {
      // 7 days - weekdays higher than weekends
      const dailyPattern = [45, 128, 142, 138, 145, 136, 52];
      for (let i = 0; i < 7; i++) {
        mockDistribution[i.toString()] = dailyPattern[i];
      }
    } else if (timeframe === 'month') {
      // 30 days - realistic daily variation pattern
      const dailyPattern = [
        45, 52, 48, 51, 49, 43, 38, 42, 48, 54, 58, 62, 59, 55, 51,
        47, 49, 53, 57, 61, 64, 68, 65, 62, 58, 54, 50, 46, 42, 39
      ];
      for (let i = 1; i <= 30; i++) {
        mockDistribution[i.toString()] = dailyPattern[i - 1];
      }
    } else if (timeframe === 'year') {
      // 12 months
      const monthlyPattern = [320, 298, 342, 367, 385, 392, 358, 375, 398, 412, 405, 395];
      for (let i = 1; i <= 12; i++) {
        mockDistribution[i.toString()] = monthlyPattern[i - 1];
      }
    } else {
      // 'all' timeframe - show last 7 days by default
      const dailyPattern = [45, 128, 142, 138, 145, 136, 52];
      for (let i = 0; i < 7; i++) {
        mockDistribution[i.toString()] = dailyPattern[i];
      }
    }

    return mockDistribution;
  }

  // Metrics
  async getMetrics(timeframe: string = 'all'): Promise<SessionMetrics> {
    try {
      // Try fetching from real API first
      const response = await this.request<{status: string, data: SessionMetrics, message?: string}>(`/api/metrics?timeframe=${timeframe}`);

      // Check for API error messages
      if (response.status === 'error' && response.message) {
        throw new Error(`API Error: ${response.message}`);
      }

      // Process metrics data
      const metricsData = response.data;
      console.log('Real-time metrics fetched:', metricsData);

      // If timeframe_distribution is empty, use mock data
      const distribution = (metricsData.timeframe_distribution && Object.keys(metricsData.timeframe_distribution).length > 0)
        ? metricsData.timeframe_distribution
        : this.generateMockDistribution(timeframe);

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
        timeframe_distribution: distribution,
        bots_metrics: metricsData.bots_metrics || []
      };

      return processedMetrics;
    } catch (error) {
      console.error("Error fetching metrics, using mock data:", error);

      // Return mock data for UI development
      const mockMetrics: SessionMetrics = {
        total_sessions: 12847,
        active_sessions: 34,
        escalation_rate: 0.0823,
        avg_duration: 245,
        avg_satisfaction: 4.3,
        completed: 11986,
        escalated: 1057,
        first_try_completion_rate: 0.872,
        angry_customers_rate: 0.054,
        legal_threats_rate: 0.012,
        timeframe_distribution: this.generateMockDistribution(timeframe),
        bots_metrics: [
          {
            bot_id: '1',
            bot_name: 'Customer Support Bot',
            total_sessions: 5234,
            active_sessions: 12,
            escalation_rate: 0.065,
            avg_satisfaction: 4.5,
            avg_duration: 198,
            completed: 4893,
            first_try_completion_rate: 0.89,
            angry_customers_rate: 0.042,
            legal_threats_rate: 0.008
          },
          {
            bot_id: '2',
            bot_name: 'Technical Support Bot',
            total_sessions: 4312,
            active_sessions: 15,
            escalation_rate: 0.124,
            avg_satisfaction: 4.1,
            avg_duration: 312,
            completed: 3781,
            first_try_completion_rate: 0.81,
            angry_customers_rate: 0.078,
            legal_threats_rate: 0.019
          },
          {
            bot_id: '3',
            bot_name: 'Sales Inquiry Bot',
            total_sessions: 3301,
            active_sessions: 7,
            escalation_rate: 0.058,
            avg_satisfaction: 4.6,
            avg_duration: 176,
            completed: 3112,
            first_try_completion_rate: 0.92,
            angry_customers_rate: 0.031,
            legal_threats_rate: 0.005
          }
        ]
      };

      return mockMetrics;
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