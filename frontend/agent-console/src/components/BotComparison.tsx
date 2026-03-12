import React from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { TimeframeSelector, Timeframe } from './TimeframeSelector';
import { useLanguage } from '../context/LanguageContext';
import { BotMetrics } from '../services/api';

// Bot Comparison Stats Card
function BotComparisonCard({ bot, loading }: { bot: BotMetrics; loading: boolean }) {
  const { translate } = useLanguage();

  return (
    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.04] rounded-3xl p-6 hover:bg-white/[0.04] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white tracking-tight">{bot.bot_name}</h3>
        {loading && <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />}
      </div>

      <div className="space-y-4">
        {/* Total Sessions */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.totalSessions')}</span>
          <span className="text-xl font-semibold text-white">{bot.total_sessions}</span>
        </div>

        {/* Active Sessions */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.activeSessions')}</span>
          <span className="text-xl font-semibold text-white">{bot.active_sessions}</span>
        </div>

        {/* Escalation Rate */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.escalationRate')}</span>
          <span className="text-xl font-semibold text-white">{((bot.escalation_rate || 0) * 100).toFixed(1)}%</span>
        </div>

        {/* Avg Satisfaction */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.avgSatisfaction')}</span>
          <span className="text-xl font-semibold text-white">{(bot.avg_satisfaction || 0).toFixed(1)}/5.0</span>
        </div>

        <div className="pt-4 border-t border-white/[0.06] flex justify-between items-baseline">
          <span className="text-xs uppercase tracking-wider text-white/40">{translate('metrics.completed')}</span>
          <span className="text-lg font-medium text-white/80">{bot.completed}</span>
        </div>
      </div>
    </div>
  );
}

export function BotComparison() {
  const { translate } = useLanguage();
  const [timeframe, setTimeframe] = React.useState<Timeframe>('all');
  const { metrics, loading: metricsLoading } = useMetrics(timeframe);

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
  };

  if (metricsLoading) {
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
          <p className="text-white/70">Loading bot comparisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          {translate('comparison.title')}
        </h2>
        <TimeframeSelector onChange={handleTimeframeChange} defaultValue={timeframe} />
      </div>

      {/* Bot Comparison Cards */}
      <div className="card">
        {metrics?.bots_metrics && metrics.bots_metrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.bots_metrics.map(bot => (
              <BotComparisonCard
                key={bot.bot_id}
                bot={bot}
                loading={metricsLoading}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">
            {translate('comparison.noData')}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {metrics?.bots_metrics && metrics.bots_metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
              Total Bots
            </span>
            <div className="text-4xl font-bold text-white tracking-tight">
              {metrics.bots_metrics.length}
            </div>
          </div>
          <div className="card">
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
              Best Performer
            </span>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.bots_metrics.reduce((prev, curr) =>
                (curr.avg_satisfaction || 0) > (prev.avg_satisfaction || 0) ? curr : prev
              ).bot_name}
            </div>
            <div className="text-sm text-white/60 mt-1">
              {metrics.bots_metrics.reduce((prev, curr) =>
                (curr.avg_satisfaction || 0) > (prev.avg_satisfaction || 0) ? curr : prev
              ).avg_satisfaction?.toFixed(1)}/5.0 satisfaction
            </div>
          </div>
          <div className="card">
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
              Most Active
            </span>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.bots_metrics.reduce((prev, curr) =>
                curr.total_sessions > prev.total_sessions ? curr : prev
              ).bot_name}
            </div>
            <div className="text-sm text-white/60 mt-1">
              {metrics.bots_metrics.reduce((prev, curr) =>
                curr.total_sessions > prev.total_sessions ? curr : prev
              ).total_sessions} sessions
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
