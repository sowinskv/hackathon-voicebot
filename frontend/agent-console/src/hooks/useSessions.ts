import { useState, useEffect, useCallback } from 'react';
import { api, Session } from '../services/api';

export function useSessions(
  status: string = 'all',
  search: string = ''
) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSessions({ status, search });
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const refresh = useCallback(() => {
    fetchSessions();
  }, [fetchSessions]);

  const updateSession = useCallback((updatedSession: Session) => {
    setSessions(prev =>
      prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s)
    );
  }, []);

  const addSession = useCallback((newSession: Session) => {
    setSessions(prev => [newSession, ...prev]);
  }, []);

  return {
    sessions,
    loading,
    error,
    refresh,
    updateSession,
    addSession,
  };
}

export function useSession(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSession(sessionId);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const markResolved = useCallback(async (notes?: string) => {
    try {
      const updated = await api.markAsResolved(sessionId, notes);
      setSession(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve session');
      throw err;
    }
  }, [sessionId]);

  const updateNotes = useCallback(async (notes: string) => {
    try {
      const updated = await api.updateSessionNotes(sessionId, notes);
      setSession(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
      throw err;
    }
  }, [sessionId]);

  return {
    session,
    loading,
    error,
    refresh: fetchSession,
    markResolved,
    updateNotes,
  };
}
