import { getDailyAggregates } from '../aggregators/daily-aggregator';
import { getSessionStatistics } from '../collectors/session-metrics';
import { getCostStatistics, getTopCostSessions } from '../collectors/cost-metrics';
import { getQualityStatistics, getSessionsWithQualityIssues } from '../collectors/quality-metrics';
import { query } from '../db';

export interface DashboardOverview {
  today: {
    total_sessions: number;
    completed_sessions: number;
    completion_rate: number;
    total_cost: number;
    avg_satisfaction: number;
  };
  last_7_days: {
    total_sessions: number;
    avg_completion_rate: number;
    total_cost: number;
    trend: 'up' | 'down' | 'stable';
  };
  last_30_days: {
    total_sessions: number;
    avg_completion_rate: number;
    total_cost: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface TrendData {
  date: string;
  sessions: number;
  completion_rate: number;
  cost: number;
  avg_satisfaction: number;
}

export interface FlowStatistics {
  total_sessions: number;
  avg_duration_seconds: number;
  completion_funnel: {
    started: number;
    field_25_percent: number;
    field_50_percent: number;
    field_75_percent: number;
    completed: number;
  };
  drop_off_points: {
    step: string;
    drop_off_rate: number;
  }[];
}

/**
 * Get dashboard overview with key metrics
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = new Date();

  // Today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Last 7 days
  const last7DaysStart = new Date(now);
  last7DaysStart.setDate(last7DaysStart.getDate() - 7);
  last7DaysStart.setHours(0, 0, 0, 0);

  // Last 30 days
  const last30DaysStart = new Date(now);
  last30DaysStart.setDate(last30DaysStart.getDate() - 30);
  last30DaysStart.setHours(0, 0, 0, 0);

  // Previous 7 days (for trend comparison)
  const prev7DaysStart = new Date(now);
  prev7DaysStart.setDate(prev7DaysStart.getDate() - 14);
  prev7DaysStart.setHours(0, 0, 0, 0);
  const prev7DaysEnd = new Date(now);
  prev7DaysEnd.setDate(prev7DaysEnd.getDate() - 7);

  const [
    todaySession,
    todayCost,
    todayQuality,
    last7Session,
    last7Cost,
    last30Session,
    last30Cost,
    prev7Session
  ] = await Promise.all([
    getSessionStatistics(todayStart, now),
    getCostStatistics(todayStart, now),
    getQualityStatistics(todayStart, now),
    getSessionStatistics(last7DaysStart, now),
    getCostStatistics(last7DaysStart, now),
    getSessionStatistics(last30DaysStart, now),
    getCostStatistics(last30DaysStart, now),
    getSessionStatistics(prev7DaysStart, prev7DaysEnd)
  ]);

  // Calculate trends
  const last7Trend = calculateTrend(
    parseInt(last7Session.total_sessions),
    parseInt(prev7Session.total_sessions)
  );

  return {
    today: {
      total_sessions: parseInt(todaySession.total_sessions),
      completed_sessions: parseInt(todaySession.completed_sessions),
      completion_rate: parseFloat(todaySession.completion_rate) || 0,
      total_cost: todayCost.total_cost,
      avg_satisfaction: todayQuality.avg_satisfaction
    },
    last_7_days: {
      total_sessions: parseInt(last7Session.total_sessions),
      avg_completion_rate: parseFloat(last7Session.completion_rate) || 0,
      total_cost: last7Cost.total_cost,
      trend: last7Trend
    },
    last_30_days: {
      total_sessions: parseInt(last30Session.total_sessions),
      avg_completion_rate: parseFloat(last30Session.completion_rate) || 0,
      total_cost: last30Cost.total_cost,
      trend: 'stable'
    }
  };
}

/**
 * Get trend data for charts
 */
export async function getTrendData(days: number = 30): Promise<TrendData[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const aggregates = await getDailyAggregates(startDate, endDate);

  return aggregates.map(agg => ({
    date: agg.date.toISOString().split('T')[0],
    sessions: agg.total_sessions,
    completion_rate: agg.completion_rate,
    cost: agg.total_cost,
    avg_satisfaction: agg.avg_satisfaction
  }));
}

/**
 * Get flow statistics and funnel analysis
 */
export async function getFlowStatistics(days: number = 7): Promise<FlowStatistics> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sessionStats = await getSessionStatistics(startDate, endDate);

  // Get completion funnel
  const funnelResult = await query({
    text: `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completeness_score >= 25) as field_25,
        COUNT(*) FILTER (WHERE completeness_score >= 50) as field_50,
        COUNT(*) FILTER (WHERE completeness_score >= 75) as field_75,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM sessions
      WHERE created_at >= $1 AND created_at <= $2
    `,
    values: [startDate, endDate]
  });

  const funnel = funnelResult.rows[0];

  // Calculate drop-off points
  const dropOffPoints = [
    {
      step: '0-25%',
      drop_off_rate: funnel.total > 0
        ? ((funnel.total - funnel.field_25) / funnel.total) * 100
        : 0
    },
    {
      step: '25-50%',
      drop_off_rate: funnel.field_25 > 0
        ? ((funnel.field_25 - funnel.field_50) / funnel.field_25) * 100
        : 0
    },
    {
      step: '50-75%',
      drop_off_rate: funnel.field_50 > 0
        ? ((funnel.field_50 - funnel.field_75) / funnel.field_50) * 100
        : 0
    },
    {
      step: '75-100%',
      drop_off_rate: funnel.field_75 > 0
        ? ((funnel.field_75 - funnel.completed) / funnel.field_75) * 100
        : 0
    }
  ];

  return {
    total_sessions: parseInt(sessionStats.total_sessions),
    avg_duration_seconds: parseFloat(sessionStats.avg_duration_seconds),
    completion_funnel: {
      started: parseInt(funnel.total),
      field_25_percent: parseInt(funnel.field_25),
      field_50_percent: parseInt(funnel.field_50),
      field_75_percent: parseInt(funnel.field_75),
      completed: parseInt(funnel.completed)
    },
    drop_off_points: dropOffPoints
  };
}

/**
 * Get cost breakdown and top spending sessions
 */
export async function getCostBreakdown(days: number = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [costStats, topSessions] = await Promise.all([
    getCostStatistics(startDate, endDate),
    getTopCostSessions(10)
  ]);

  return {
    summary: costStats,
    top_sessions: topSessions
  };
}

/**
 * Get quality insights
 */
export async function getQualityInsights(days: number = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [qualityStats, issuesessions] = await Promise.all([
    getQualityStatistics(startDate, endDate),
    getSessionsWithQualityIssues(undefined, 20)
  ]);

  return {
    summary: qualityStats,
    sessions_with_issues: issuesessions
  };
}

/**
 * Calculate trend direction
 */
function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (previous === 0) return 'stable';

  const change = ((current - previous) / previous) * 100;

  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}
