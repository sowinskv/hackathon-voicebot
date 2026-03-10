import React from 'react';
import { Link } from 'react-router-dom';
import { MetricsWidget } from '../components/MetricsWidget';
import { SessionCard } from '../components/SessionCard';
import { useSessions } from '../hooks/useSessions';
import { useMetrics } from '../hooks/useMetrics';

export function Dashboard() {
  const { sessions, loading: sessionsLoading } = useSessions('escalated');
  const { metrics, loading: metricsLoading, lastUpdated } = useMetrics(10000);

  // Log metrics updates for debugging
  React.useEffect(() => {
    if (lastUpdated) {
      console.log(`Dashboard metrics updated at: ${lastUpdated.toLocaleTimeString()}`);
    }
  }, [lastUpdated]);

  if (metricsLoading || sessionsLoading) {
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
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your Voice AI system performance
          </p>
        </div>

        {lastUpdated && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <svg className={`w-3 h-3 ${metricsLoading ? 'text-primary-400 animate-spin' : 'text-green-500'}`}
                fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>
              {metricsLoading
                ? "Updating metrics..."
                : `Updated: ${lastUpdated.toLocaleTimeString()}`}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsWidget
          title="Total Sessions"
          value={metrics?.total_sessions || 0}
          subtitle="All time"
          color="blue"
          loading={metricsLoading}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          }
        />

        <MetricsWidget
          title="Active Sessions"
          value={metrics?.active_sessions || 0}
          subtitle="Currently in progress"
          color="green"
          loading={metricsLoading}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          }
        />

        <MetricsWidget
          title="Escalation Rate"
          value={`${((metrics?.escalation_rate || 0) * 100).toFixed(1)}%`}
          subtitle={`${metrics?.escalated_today || 0} today`}
          color="red"
          loading={metricsLoading}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          }
        />

        <MetricsWidget
          title="Avg Satisfaction"
          value={`${(metrics?.avg_satisfaction || 0).toFixed(1)}/5.0`}
          subtitle="Customer rating"
          color="purple"
          loading={metricsLoading}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          }
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Avg Call Duration
            </h3>
            {metricsLoading && (
              <div className="w-2 h-2 rounded-full bg-primary-200 animate-pulse" />
            )}
          </div>
          <p className={`text-2xl font-bold ${metricsLoading ? 'text-gray-400' : 'text-gray-900'}`}>
            {metricsLoading ? "..." : (
              <>
                {Math.floor((metrics?.avg_duration || 0) / 60)}m{' '}
                {Math.floor((metrics?.avg_duration || 0) % 60)}s
              </>
            )}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Completed Today
            </h3>
            {metricsLoading && (
              <div className="w-2 h-2 rounded-full bg-primary-200 animate-pulse" />
            )}
          </div>
          <p className={`text-2xl font-bold ${metricsLoading ? 'text-gray-400' : 'text-gray-900'}`}>
            {metricsLoading ? "..." : metrics?.completed_today || 0}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Escalated Today
            </h3>
            {metricsLoading && (
              <div className="w-2 h-2 rounded-full bg-primary-200 animate-pulse" />
            )}
          </div>
          <p className={`text-2xl font-bold ${metricsLoading ? 'text-gray-400' : 'text-gray-900'}`}>
            {metricsLoading ? "..." : metrics?.escalated_today || 0}
          </p>
        </div>
      </div>

      {/* Recent Escalations */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Escalations
          </h2>
          <Link
            to="/sessions?status=escalated"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View all →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium mb-1">No escalations</p>
            <p className="text-sm">All sessions are running smoothly</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sessions.slice(0, 4).map(session => (
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
    </div>
  );
}
