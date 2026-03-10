import { Router, Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../middleware/error';

const router = Router();

/**
 * GET /api/metrics - Get dashboard metrics
 *
 * Calculates and returns real-time metrics:
 * - Total sessions
 * - Active sessions
 * - Escalation rate
 * - Average duration
 * - Average satisfaction score
 * - Completed and escalated sessions today
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // Get current date at start of day for "today" calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const metricsQuery = `
      WITH
        -- Overall metrics
        metrics AS (
          SELECT
            COUNT(*) as total_sessions,
            COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
            COUNT(*) FILTER (WHERE escalated = true)::float / NULLIF(COUNT(*), 0)::float as escalation_rate,
            AVG(duration_seconds)::float as avg_duration,
            AVG(satisfaction_score)::float as avg_satisfaction
          FROM sessions
        ),
        -- Today's metrics
        today_metrics AS (
          SELECT
            COUNT(*) FILTER (WHERE status IN ('completed', 'resolved')) as completed_today,
            COUNT(*) FILTER (WHERE escalated = true) as escalated_today
          FROM sessions
          WHERE DATE(created_at) = CURRENT_DATE
        )

      SELECT
        m.total_sessions,
        m.active_sessions,
        m.escalation_rate,
        m.avg_duration,
        m.avg_satisfaction,
        t.completed_today,
        t.escalated_today
      FROM metrics m, today_metrics t
    `;

    const result = await query(metricsQuery);

    // Format results and handle null values
    const metrics = result.rows[0];

    res.json({
      status: 'success',
      data: {
        total_sessions: parseInt(metrics.total_sessions || '0'),
        active_sessions: parseInt(metrics.active_sessions || '0'),
        escalation_rate: parseFloat(metrics.escalation_rate || '0'),
        avg_duration: parseFloat(metrics.avg_duration || '0'),
        avg_satisfaction: parseFloat(metrics.avg_satisfaction || '0'),
        completed_today: parseInt(metrics.completed_today || '0'),
        escalated_today: parseInt(metrics.escalated_today || '0')
      }
    });
  })
);

export default router;