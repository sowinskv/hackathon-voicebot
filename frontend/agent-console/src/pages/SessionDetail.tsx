import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSession } from '../hooks/useSessions';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { DataFieldsDisplay } from '../components/DataFieldsDisplay';
import { AudioPlayer } from '../components/AudioPlayer';
import { NotesEditor } from '../components/NotesEditor';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  active: 'badge-info',
  completed: 'badge-success',
  escalated: 'badge-danger',
  resolved: 'badge-gray',
};

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, loading, error, markResolved, updateNotes } = useSession(
    sessionId!
  );
  const [resolving, setResolving] = useState(false);

  const handleMarkResolved = async () => {
    if (!window.confirm('Are you sure you want to mark this case as resolved?')) {
      return;
    }

    try {
      setResolving(true);
      await markResolved(session?.agent_notes);
      // Refresh to show updated status
    } catch (err) {
      alert('Failed to mark as resolved. Please try again.');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-primary-600 mb-4"
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
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
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
        <p className="text-red-600 font-medium mb-2">Session not found</p>
        <p className="text-gray-600 text-sm mb-4">
          {error || 'The requested session could not be loaded'}
        </p>
        <Link to="/sessions" className="btn-primary">
          Back to Sessions
        </Link>
      </div>
    );
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/sessions')}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Sessions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Session {session.session_id}
          </h1>
          <p className="text-gray-600 mt-1">
            Started {formatDistanceToNow(new Date(session.start_time), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={statusColors[session.status]}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
          {session.escalated && session.status !== 'resolved' && (
            <button
              onClick={handleMarkResolved}
              disabled={resolving}
              className="btn-success disabled:opacity-50"
            >
              {resolving ? 'Resolving...' : 'Mark as Resolved'}
            </button>
          )}
        </div>
      </div>

      {/* Escalation Alert */}
      {session.escalated && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Case Escalated</h3>
              <p className="text-red-700">{session.escalation_reason || 'No reason provided'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transcript */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Conversation Transcript
            </h2>
            <div className="max-h-[600px] overflow-y-auto">
              <TranscriptViewer transcript={session.transcript || []} />
            </div>
          </div>

          {/* Audio Recording */}
          {session.audio_url && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Audio Recording
              </h2>
              <AudioPlayer audioUrl={session.audio_url} />
            </div>
          )}

          {/* Collected Data */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Collected Data
            </h2>
            <DataFieldsDisplay data={session.collected_data || {}} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Session Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Session Info</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Session ID</dt>
                <dd className="text-sm font-medium text-gray-900 font-mono">
                  {session.session_id}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Duration</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatDuration(session.duration)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Start Time</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(session.start_time).toLocaleString()}
                </dd>
              </div>
              {session.end_time && (
                <div>
                  <dt className="text-sm text-gray-600">End Time</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(session.end_time).toLocaleString()}
                  </dd>
                </div>
              )}
              {session.satisfaction_score && (
                <div>
                  <dt className="text-sm text-gray-600">Satisfaction Score</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {session.satisfaction_score}/5.0
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Client Info */}
          {session.client_info && Object.keys(session.client_info).length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Client Info</h3>
              <dl className="space-y-3">
                {session.client_info.name && (
                  <div>
                    <dt className="text-sm text-gray-600">Name</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {session.client_info.name}
                    </dd>
                  </div>
                )}
                {session.client_info.phone && (
                  <div>
                    <dt className="text-sm text-gray-600">Phone</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {session.client_info.phone}
                    </dd>
                  </div>
                )}
                {session.client_info.email && (
                  <div>
                    <dt className="text-sm text-gray-600">Email</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {session.client_info.email}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Notes */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Notes</h3>
            <NotesEditor
              initialNotes={session.agent_notes}
              onSave={updateNotes}
              readOnly={session.status === 'resolved'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
