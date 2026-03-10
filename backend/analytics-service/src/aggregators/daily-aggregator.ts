import { query } from '../db';
import { getSessionStatistics } from '../collectors/session-metrics';
import { getCostStatistics } from '../collectors/cost-metrics';
import { getQualityStatistics } from '../collectors/quality-metrics';

export interface DailyAggregate {
  date: Date;
  total_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  avg_duration_seconds: number;
  completion_rate: number;
  total_cost: number;
  avg_cost_per_session: number;
  avg_completeness: number;
  avg_satisfaction: number;
  avg_time_efficiency: number;
  total_quality_issues: number;
  stt_cost: number;
  tts_cost: number;
  llm_cost: number;
}

/**
 * Aggregate metrics for a specific date
 */
export async function aggregateMetricsForDate(date: Date): Promise<DailyAggregate> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Aggregating metrics for ${date.toISOString().split('T')[0]}...`);

    // Collect all metrics in parallel
    const [sessionStats, costStats, qualityStats] = await Promise.all([
      getSessionStatistics(startOfDay, endOfDay),
      getCostStatistics(startOfDay, endOfDay),
      getQualityStatistics(startOfDay, endOfDay)
    ]);

    const aggregate: DailyAggregate = {
      date: startOfDay,
      total_sessions: parseInt(sessionStats.total_sessions),
      completed_sessions: parseInt(sessionStats.completed_sessions),
      abandoned_sessions: parseInt(sessionStats.abandoned_sessions),
      avg_duration_seconds: parseFloat(sessionStats.avg_duration_seconds) || 0,
      completion_rate: parseFloat(sessionStats.completion_rate) || 0,
      total_cost: costStats.total_cost,
      avg_cost_per_session: costStats.avg_cost_per_session,
      avg_completeness: qualityStats.avg_completeness,
      avg_satisfaction: qualityStats.avg_satisfaction,
      avg_time_efficiency: qualityStats.avg_time_efficiency,
      total_quality_issues: qualityStats.total_quality_issues,
      stt_cost: costStats.stt_total_cost,
      tts_cost: costStats.tts_total_cost,
      llm_cost: costStats.llm_total_cost
    };

    // Store the aggregated data
    await query({
      text: `
        INSERT INTO daily_metrics (
          date, total_sessions, completed_sessions, abandoned_sessions,
          avg_duration_seconds, completion_rate, total_cost, avg_cost_per_session,
          avg_completeness, avg_satisfaction, avg_time_efficiency,
          total_quality_issues, stt_cost, tts_cost, llm_cost, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        ON CONFLICT (date)
        DO UPDATE SET
          total_sessions = EXCLUDED.total_sessions,
          completed_sessions = EXCLUDED.completed_sessions,
          abandoned_sessions = EXCLUDED.abandoned_sessions,
          avg_duration_seconds = EXCLUDED.avg_duration_seconds,
          completion_rate = EXCLUDED.completion_rate,
          total_cost = EXCLUDED.total_cost,
          avg_cost_per_session = EXCLUDED.avg_cost_per_session,
          avg_completeness = EXCLUDED.avg_completeness,
          avg_satisfaction = EXCLUDED.avg_satisfaction,
          avg_time_efficiency = EXCLUDED.avg_time_efficiency,
          total_quality_issues = EXCLUDED.total_quality_issues,
          stt_cost = EXCLUDED.stt_cost,
          tts_cost = EXCLUDED.tts_cost,
          llm_cost = EXCLUDED.llm_cost,
          updated_at = NOW()
      `,
      values: [
        aggregate.date,
        aggregate.total_sessions,
        aggregate.completed_sessions,
        aggregate.abandoned_sessions,
        aggregate.avg_duration_seconds,
        aggregate.completion_rate,
        aggregate.total_cost,
        aggregate.avg_cost_per_session,
        aggregate.avg_completeness,
        aggregate.avg_satisfaction,
        aggregate.avg_time_efficiency,
        aggregate.total_quality_issues,
        aggregate.stt_cost,
        aggregate.tts_cost,
        aggregate.llm_cost
      ]
    });

    console.log(`Successfully aggregated metrics for ${date.toISOString().split('T')[0]}`);
    return aggregate;
  } catch (error) {
    console.error('Error aggregating metrics for date:', error);
    throw error;
  }
}

/**
 * Run daily aggregation for yesterday
 */
export async function runDailyAggregation(): Promise<void> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    console.log('Starting daily aggregation job...');
    await aggregateMetricsForDate(yesterday);
    console.log('Daily aggregation completed successfully');
  } catch (error) {
    console.error('Daily aggregation failed:', error);
    throw error;
  }
}

/**
 * Backfill aggregations for a date range
 */
export async function backfillAggregations(startDate: Date, endDate: Date): Promise<void> {
  try {
    console.log(`Backfilling aggregations from ${startDate.toISOString()} to ${endDate.toISOString()}...`);

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      await aggregateMetricsForDate(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Backfill completed successfully');
  } catch (error) {
    console.error('Backfill failed:', error);
    throw error;
  }
}

/**
 * Get daily aggregates for a date range
 */
export async function getDailyAggregates(
  startDate: Date,
  endDate: Date
): Promise<DailyAggregate[]> {
  try {
    const result = await query({
      text: `
        SELECT
          date, total_sessions, completed_sessions, abandoned_sessions,
          avg_duration_seconds, completion_rate, total_cost, avg_cost_per_session,
          avg_completeness, avg_satisfaction, avg_time_efficiency,
          total_quality_issues, stt_cost, tts_cost, llm_cost
        FROM daily_metrics
        WHERE date >= $1 AND date <= $2
        ORDER BY date ASC
      `,
      values: [startDate, endDate]
    });

    return result.rows as DailyAggregate[];
  } catch (error) {
    console.error('Error getting daily aggregates:', error);
    throw error;
  }
}
