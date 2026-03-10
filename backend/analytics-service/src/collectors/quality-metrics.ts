import { query } from '../db';

export interface QualityMetric {
  session_id: string;
  completeness_percentage: number;
  satisfaction_score?: number;
  accuracy_score?: number;
  time_efficiency_score: number;
  quality_issues: string[];
  created_at: Date;
}

/**
 * Calculate quality metrics for a session
 */
export async function calculateQualityMetrics(sessionId: string): Promise<QualityMetric> {
  try {
    // Get session completeness
    const sessionResult = await query({
      text: `
        SELECT
          s.fields_completed,
          s.total_fields,
          s.completeness_score,
          s.created_at,
          s.completed_at,
          s.status
        FROM sessions s
        WHERE s.id = $1
      `,
      values: [sessionId]
    });

    if (sessionResult.rows.length === 0) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const session = sessionResult.rows[0];
    const completenessPercentage = session.total_fields > 0
      ? (session.fields_completed / session.total_fields) * 100
      : 0;

    // Get satisfaction feedback if available
    const feedbackResult = await query({
      text: `
        SELECT
          rating,
          feedback_text,
          created_at
        FROM session_feedback
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      values: [sessionId]
    });

    const satisfactionScore = feedbackResult.rows.length > 0
      ? feedbackResult.rows[0].rating
      : null;

    // Calculate time efficiency (compare actual duration vs expected)
    const expectedDuration = 300; // 5 minutes baseline
    const actualDuration = session.completed_at
      ? (new Date(session.completed_at).getTime() - new Date(session.created_at).getTime()) / 1000
      : null;

    const timeEfficiencyScore = actualDuration
      ? Math.max(0, Math.min(100, (expectedDuration / actualDuration) * 100))
      : 0;

    // Detect quality issues
    const qualityIssues: string[] = [];

    if (completenessPercentage < 50) {
      qualityIssues.push('low_completeness');
    }

    if (session.status === 'abandoned') {
      qualityIssues.push('session_abandoned');
    }

    if (actualDuration && actualDuration > expectedDuration * 2) {
      qualityIssues.push('excessive_duration');
    }

    if (satisfactionScore && satisfactionScore < 3) {
      qualityIssues.push('low_satisfaction');
    }

    // Check for safety events
    const safetyResult = await query({
      text: `
        SELECT COUNT(*) as safety_event_count
        FROM safety_events
        WHERE session_id = $1
      `,
      values: [sessionId]
    });

    if (parseInt(safetyResult.rows[0].safety_event_count) > 0) {
      qualityIssues.push('safety_events_detected');
    }

    // Store quality metrics
    const qualityMetric: QualityMetric = {
      session_id: sessionId,
      completeness_percentage: completenessPercentage,
      satisfaction_score: satisfactionScore,
      accuracy_score: null, // Could be calculated based on field validation
      time_efficiency_score: timeEfficiencyScore,
      quality_issues: qualityIssues,
      created_at: new Date()
    };

    await query({
      text: `
        INSERT INTO quality_metrics (
          session_id, completeness_percentage, satisfaction_score,
          accuracy_score, time_efficiency_score, quality_issues, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (session_id)
        DO UPDATE SET
          completeness_percentage = EXCLUDED.completeness_percentage,
          satisfaction_score = EXCLUDED.satisfaction_score,
          accuracy_score = EXCLUDED.accuracy_score,
          time_efficiency_score = EXCLUDED.time_efficiency_score,
          quality_issues = EXCLUDED.quality_issues,
          updated_at = NOW()
      `,
      values: [
        sessionId,
        completenessPercentage,
        satisfactionScore,
        null,
        timeEfficiencyScore,
        qualityIssues
      ]
    });

    return qualityMetric;
  } catch (error) {
    console.error('Error calculating quality metrics:', error);
    throw error;
  }
}

/**
 * Get quality statistics for a date range
 */
export async function getQualityStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  avg_completeness: number;
  avg_satisfaction: number;
  avg_time_efficiency: number;
  total_quality_issues: number;
  issue_breakdown: Record<string, number>;
}> {
  try {
    const conditions = [];
    const values: any[] = [];

    if (startDate) {
      values.push(startDate);
      conditions.push(`qm.created_at >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      conditions.push(`qm.created_at <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query({
      text: `
        SELECT
          AVG(qm.completeness_percentage) as avg_completeness,
          AVG(qm.satisfaction_score) as avg_satisfaction,
          AVG(qm.time_efficiency_score) as avg_time_efficiency,
          COUNT(*) FILTER (WHERE array_length(qm.quality_issues, 1) > 0) as total_quality_issues
        FROM quality_metrics qm
        ${whereClause}
      `,
      values
    });

    // Get issue breakdown
    const issueResult = await query({
      text: `
        SELECT
          unnest(qm.quality_issues) as issue_type,
          COUNT(*) as issue_count
        FROM quality_metrics qm
        ${whereClause}
        GROUP BY issue_type
        ORDER BY issue_count DESC
      `,
      values
    });

    const issueBreakdown: Record<string, number> = {};
    issueResult.rows.forEach(row => {
      issueBreakdown[row.issue_type] = parseInt(row.issue_count);
    });

    return {
      avg_completeness: parseFloat(result.rows[0].avg_completeness) || 0,
      avg_satisfaction: parseFloat(result.rows[0].avg_satisfaction) || 0,
      avg_time_efficiency: parseFloat(result.rows[0].avg_time_efficiency) || 0,
      total_quality_issues: parseInt(result.rows[0].total_quality_issues) || 0,
      issue_breakdown: issueBreakdown
    };
  } catch (error) {
    console.error('Error getting quality statistics:', error);
    throw error;
  }
}

/**
 * Get sessions with quality issues
 */
export async function getSessionsWithQualityIssues(
  issueType?: string,
  limit: number = 20
): Promise<QualityMetric[]> {
  try {
    const conditions = ['array_length(qm.quality_issues, 1) > 0'];
    const values: any[] = [];

    if (issueType) {
      values.push(issueType);
      conditions.push(`$${values.length} = ANY(qm.quality_issues)`);
    }

    values.push(limit);

    const result = await query({
      text: `
        SELECT
          session_id,
          completeness_percentage,
          satisfaction_score,
          accuracy_score,
          time_efficiency_score,
          quality_issues,
          created_at
        FROM quality_metrics qm
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${values.length}
      `,
      values
    });

    return result.rows as QualityMetric[];
  } catch (error) {
    console.error('Error getting sessions with quality issues:', error);
    throw error;
  }
}
