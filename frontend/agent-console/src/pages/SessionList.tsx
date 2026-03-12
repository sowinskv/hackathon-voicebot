import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SessionCard } from '../components/SessionCard';
import { StatusFilter } from '../components/StatusFilter';
import { useSessions } from '../hooks/useSessions';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';

export function SessionList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { sessions, loading, error, refresh, updateSession, addSession } =
    useSessions(status, debouncedSearch);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Update URL when status changes
  useEffect(() => {
    if (status !== 'all') {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  }, [status, setSearchParams]);

  // Handle WebSocket updates
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    if (message.type === 'session_update') {
      updateSession(message.data);
    } else if (message.type === 'new_escalation') {
      // Add new escalation if we're viewing escalated sessions
      if (status === 'all' || status === 'escalated') {
        addSession(message.data);
      }
    }
  };

  useWebSocket(handleWebSocketMessage);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-light text-white tracking-tight mb-2">Sessions</h1>
        <p className="text-white/50 text-lg">
          View and manage all customer interaction sessions
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-6">
        <div className="relative">
          <svg
            className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-white/20 focus:border-white/40 outline-none pl-6 pb-2 text-white placeholder:text-white/40 transition-colors"
          />
        </div>

        <StatusFilter value={status} onChange={handleStatusChange} />
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 mx-auto text-white/80 mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-white/70">Loading sessions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-300 font-medium mb-2">Failed to load sessions</p>
            <p className="text-white/70 text-sm mb-4">{error}</p>
            <button onClick={refresh} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-white/60">
            <p className="text-lg font-medium mb-2 text-white">No sessions found</p>
            <p className="text-sm text-white/40">
              {search
                ? 'Try adjusting your search or filters'
                : 'No sessions match your current filters'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-white/50 uppercase tracking-wider">
              Showing {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.map(session => (
                <SessionCard
                  key={session.session_id || session.id}
                  session={session}
                  onClick={() => navigate(`/sessions/${session.session_id || session.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
