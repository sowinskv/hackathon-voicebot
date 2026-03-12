import React from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { TimeframeSelector, Timeframe } from './TimeframeSelector';
import { TimeframeDistributionChart } from './TimeframeDistributionChart';
import { SideMetricsWidget } from './SideMetricsWidget';
import { useLanguage } from '../context/LanguageContext';

export function MetricsOverview() {
  const { translate } = useLanguage();
  const [timeframe, setTimeframe] = React.useState<Timeframe>('all');
  const { metrics, loading: metricsLoading, lastUpdated } = useMetrics(timeframe);

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
  };

  // Removed full-screen loading state - just show content immediately

  return (
    <div className="space-y-10">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-end">
        <TimeframeSelector onChange={handleTimeframeChange} defaultValue={timeframe} />
      </div>

      {/* Main Stats Section */}
      <div className="space-y-20">
        {/* Hero Metric */}
        <div>
          <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
            {translate('metrics.totalSessions')}
          </span>
          <div className="text-8xl font-light text-white tracking-tight">
            {metricsLoading ? '...' : (metrics?.total_sessions || 0).toLocaleString()}
          </div>
        </div>

        {/* Distribution Chart */}
        <div>
          <TimeframeDistributionChart
            data={metrics?.timeframe_distribution || {}}
            timeframe={timeframe}
            loading={metricsLoading}
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-16">
          {/* Active Sessions */}
          <div>
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
              {translate('metrics.activeSessions')}
            </span>
            <div className="text-5xl font-light text-white tracking-tight">
              {metricsLoading ? '...' : (metrics?.active_sessions || 0).toLocaleString()}
            </div>
          </div>

          {/* Escalation Rate */}
          <div>
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
              {translate('metrics.escalationRate')}
            </span>
            <div className="text-5xl font-light text-white tracking-tight">
              {metricsLoading ? '...' : `${((metrics?.escalation_rate || 0) * 100).toFixed(2)}%`}
            </div>
          </div>

          {/* Avg Satisfaction */}
          <div>
            <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3 block">
              {translate('metrics.avgSatisfaction')}
            </span>
            <div className="text-5xl font-light text-white tracking-tight">
              {metricsLoading ? '...' : `${(metrics?.avg_satisfaction || 0).toFixed(1)}/5.0`}
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-3 gap-16 pt-12 border-t border-white/10">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3">
              {translate('metrics.avgCallDuration')}
            </div>
            <div className="text-3xl font-light text-white tracking-tight">
              {metricsLoading ? '...' : `${Math.floor((metrics?.avg_duration || 0) / 60)}m ${Math.floor((metrics?.avg_duration || 0) % 60)}s`}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3">
              {translate('metrics.completed')}
            </div>
            <div className="text-3xl font-light text-white tracking-tight">
              {metricsLoading ? '...' : (metrics?.completed || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium mb-3">
              {translate('metrics.escalated')}
            </div>
            <div className="text-3xl font-light text-white tracking-tight">
              {metricsLoading ? '...' : (metrics?.escalated || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Side Metrics */}
        <div className="pt-12 border-t border-white/10">
          <SideMetricsWidget
            firstTryCompletionRate={metrics?.first_try_completion_rate || 0}
            angryCustomersRate={metrics?.angry_customers_rate || 0}
            legalThreatsRate={metrics?.legal_threats_rate || 0}
            loading={metricsLoading}
          />
        </div>
      </div>
    </div>
  );
}
