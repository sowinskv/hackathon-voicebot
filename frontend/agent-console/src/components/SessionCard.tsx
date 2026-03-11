import React from 'react';
import { Session } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

interface SessionCardProps {
  session: Session;
  onClick: () => void;
}

const statusColors = {
  active: 'badge-info',
  completed: 'badge-success',
  escalated: 'badge-danger',
  resolved: 'badge-gray',
};

export function SessionCard({ session, onClick }: SessionCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the correct values from the session object, handling both API response format and frontend format
  const sessionId = session.session_id || session.id;
  const startTime = session.start_time || session.started_at;
  const clientInfo = session.client_info || session.client_metadata;

  return (
    <div
      onClick={onClick}
      className="card hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary-500"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-white">
            {sessionId}
          </h3>
          <p className="text-sm text-white/60">
            {formatDistanceToNow(new Date(startTime), {
              addSuffix: true,
            })}
          </p>
        </div>
        <span className={statusColors[session.status]}>
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </span>
      </div>

      {clientInfo && (
        <div className="mb-3 space-y-1">
          {clientInfo.name && (
            <p className="text-sm text-white/80">
              <span className="font-medium">Name:</span> {clientInfo.name}
            </p>
          )}
          {clientInfo.phone && (
            <p className="text-sm text-white/80">
              <span className="font-medium">Phone:</span> {clientInfo.phone}
            </p>
          )}
          {clientInfo.email && (
            <p className="text-sm text-white/80">
              <span className="font-medium">Email:</span> {clientInfo.email}
            </p>
          )}
        </div>
      )}

      {session.escalated && session.escalation_reason && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm font-medium text-red-300 mb-1">
            Escalation Reason:
          </p>
          <p className="text-sm text-red-200">{session.escalation_reason}</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-white/70">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          <span>{formatDuration(session.duration || session.duration_seconds)}</span>
        </div>
        {session.satisfaction_score && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{session.satisfaction_score}/5</span>
          </div>
        )}
        {session.collected_data && Object.keys(session.collected_data).length > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            <span>{Object.keys(session.collected_data).length} fields</span>
          </div>
        )}
      </div>
    </div>
  );
}
