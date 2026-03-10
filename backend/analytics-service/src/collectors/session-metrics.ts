import { query } from '../db';

export interface SessionMetric {
  session_id: string;
  duration_seconds: number;
  status: string;
  completeness_score: number;
  fields_completed: number;
  total_fields: number;
  created_at: Date;
  completed_at?: Date;
}

/**
 * Collect session-level metrics
 */
export async function collectSessionMetrics(sessionId: string): Promise<SessionMetric | null> {
  try {
    const result = await query({
      text: `
        SELECT
          s.id as session_id,
          EXTRACT(EPOCH FROM (COALESCE(s.completed_at, NOW()) - s.created_at)) as duration_seconds,
          s.status,
          s.completeness_score,
          s.fields_completed,
          s.total_fields,
          s.created_at,
          s.completed_at
        FROM sessions s
        WHERE s.id = $1
      `,
      values: [sessionId]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as SessionMetric;
  } catch (error) {
    console.error('Error collecting session metrics:', error);
    throw error;
  }
}

/**
 * Collect metrics for all sessions in a date range
 */
export async function collectSessionMetricsInRange(
  startDate: Date,
  endDate: Date
): Promise<SessionMetric[]> {
  try {
    const result = await query({
      text: `
        SELECT
          s.id as session_id,
          EXTRACT(EPOCH FROM (COALESCE(s.completed_at, NOW()) - s.created_at)) as duration_seconds,
          s.status,
          s.completeness_score,
          s.fields_completed,
          s.total_fields,
          s.created_at,
          s.completed_at
        FROM sessions s
        WHERE s.created_at >= $1 AND s.created_at <= $2
        ORDER BY s.created_at DESC
      `,
      values: [startDate, endDate]
    });

    return result.rows as SessionMetric[];
  } catch (error) {
    console.error('Error collecting session metrics in range:', error);
    throw error;
  }
}

/**
 * Get session statistics summary
 */
export async function getSessionStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  avg_duration_seconds: number;
  avg_completeness_score: number;
  completion_rate: number;
}> {
  try {
    const conditions = [];
    const values: any[] = [];

    if (startDate) {
      values.push(startDate);
      conditions.push(`s.created_at >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      conditions.push(`s.created_at <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query({
      text: `
        SELECT
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE s.status = 'completed') as completed_sessions,
          COUNT(*) FILTER (WHERE s.status = 'abandoned') as abandoned_sessions,
          AVG(EXTRACT(EPOCH FROM (COALESCE(s.completed_at, NOW()) - s.created_at))) as avg_duration_seconds,
          AVG(s.completeness_score) as avg_completeness_score,
          CASE
            WHEN COUNT(*) > 0 THEN
              (COUNT(*) FILTER (WHERE s.status = 'completed')::float / COUNT(*)::float) * 100
            ELSE 0
          END as completion_rate
        FROM sessions s
        ${whereClause}
      `,
      values
    });

    return result.rows[0];
  } catch (error) {
    console.error('Error getting session statistics:', error);
    throw error;
  }
}

/**
 * Track session status changes
 */
export async function recordSessionStatusChange(
  sessionId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    await query({
      text: `
        INSERT INTO session_status_changes (session_id, old_status, new_status, changed_at)
        VALUES ($1, $2, $3, NOW())
      `,
      values: [sessionId, oldStatus, newStatus]
    });
  } catch (error) {
    console.error('Error recording session status change:', error);
    throw error;
  }
}
