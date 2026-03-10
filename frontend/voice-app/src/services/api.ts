import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface SessionResponse {
  sessionId: string
  livekitToken: string
  livekitUrl: string
  agentId: string
}

export interface SessionStatusResponse {
  sessionId: string
  status: 'active' | 'escalated' | 'completed'
  startTime: string
  endTime?: string
  escalatedAt?: string
}

/**
 * Create a new voice session
 */
export async function createSession(language: string = 'en'): Promise<SessionResponse> {
  try {
    const response = await api.post('/sessions', { language })
    return response.data
  } catch (error) {
    console.error('Failed to create session:', error)
    throw error
  }
}

/**
 * Get session status
 */
export async function getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  try {
    const response = await api.get(`/sessions/${sessionId}`)
    return response.data
  } catch (error) {
    console.error('Failed to get session status:', error)
    throw error
  }
}

/**
 * End a session
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    await api.post(`/sessions/${sessionId}/end`)
  } catch (error) {
    console.error('Failed to end session:', error)
    throw error
  }
}

/**
 * Escalate session to human consultant
 */
export async function escalateSession(sessionId: string): Promise<void> {
  try {
    await api.post(`/sessions/${sessionId}/escalate`)
  } catch (error) {
    console.error('Failed to escalate session:', error)
    throw error
  }
}

/**
 * Get session transcript
 */
export async function getTranscript(sessionId: string): Promise<any> {
  try {
    const response = await api.get(`/sessions/${sessionId}/transcript`)
    return response.data
  } catch (error) {
    console.error('Failed to get transcript:', error)
    throw error
  }
}

export default api
