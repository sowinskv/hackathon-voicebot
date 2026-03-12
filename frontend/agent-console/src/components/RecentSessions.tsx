import React from 'react';
import { Link } from 'react-router-dom';
import { SessionCard } from './SessionCard';
import { useSessions } from '../hooks/useSessions';
import { useMetrics } from '../hooks/useMetrics';
import { StatusFilter } from './StatusFilter';
import { useLanguage } from '../context/LanguageContext';

export function RecentSessions() {
  const { translate } = useLanguage();
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'escalated' | 'completed' | 'active'>('all');
  const { sessions, loading: sessionsLoading } = useSessions(statusFilter === 'all' ? undefined : statusFilter);
  const { metrics } = useMetrics('all');

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
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
          <p className="text-white/70">Loading recent sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* View All Link */}
      <div className="flex items-center justify-end">
        <Link
          to="/sessions"
          className="text-white/60 hover:text-white font-medium text-sm transition-colors uppercase tracking-wider hover:scale-105 transition-all duration-200"
        >
          View All →
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-12">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Total Sessions</div>
          <div className="text-3xl font-light text-white">{metrics?.total_sessions || 0}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Active Now</div>
          <div className="text-3xl font-light text-white">{metrics?.active_sessions || 0}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Escalated</div>
          <div className="text-3xl font-light text-white">{metrics?.escalated || 0}</div>
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Sessions List */}
      <div>
        {sessions.length === 0 ? (
          <div className="text-center py-16 text-white/60">
            <p className="text-lg font-light mb-2 text-white">
              {statusFilter === 'escalated' ? translate('escalations.noEscalations') : 'No sessions found'}
            </p>
            <p className="text-sm text-white/40">
              {statusFilter === 'escalated' ? translate('escalations.runningSmooth') : 'Start a conversation to see sessions here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sessions.slice(0, 10).map(session => (
              <SessionCard
                key={session.session_id || session.id}
                session={session}
                onClick={() => {
                  window.location.href = `/sessions/${session.session_id || session.id}`;
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Show "View All" if there are more sessions */}
      {sessions.length > 10 && (
        <div className="text-center">
          <Link
            to="/sessions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-xl text-white font-medium transition-all duration-300"
          >
            View All {sessions.length} Sessions
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
