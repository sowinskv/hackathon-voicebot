import { Router, Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../middleware/error';

const router = Router();

// GET /api/analytics/overview - Get overview statistics
router.get(
  '/overview',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'active') as active_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'completed') as completed_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'failed') as failed_sessions,
        (SELECT COUNT(*) FROM flows) as total_flows,
        (SELECT COUNT(*) FROM flows WHERE is_active = true) as active_flows
    `);

    res.json({
      status: 'success',
      data: stats.rows[0],
    });
  })
);

// GET /api/analytics/sessions/status - Session status breakdown
router.get(
  '/sessions/status',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(`
      SELECT
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM sessions
      GROUP BY status
      ORDER BY count DESC
    `);

    res.json({
      status: 'success',
      data: result.rows,
    });
  })
);

// GET /api/analytics/sessions/timeline - Session creation timeline
router.get(
  '/sessions/timeline',
  asyncHandler(async (req: Request, res: Response) => {
    const { period = '7d' } = req.query;

    let interval = '1 day';
    let dateFormat = 'YYYY-MM-DD';

    if (period === '24h') {
      interval = '1 hour';
      dateFormat = 'YYYY-MM-DD HH24:00';
    } else if (period === '30d') {
      interval = '1 day';
      dateFormat = 'YYYY-MM-DD';
    }

    const result = await query(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('hour', created_at), $1) as period,
        COUNT(*) as count
      FROM sessions
      WHERE created_at >= NOW() - INTERVAL $2
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY period ASC
    `,
      [dateFormat, period === '24h' ? '24 hours' : period === '30d' ? '30 days' : '7 days']
    );

    res.json({
      status: 'success',
      data: result.rows,
    });
  })
);

// GET /api/analytics/flows/usage - Flow usage statistics
router.get(
  '/flows/usage',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(`
      SELECT
        f.id,
        f.name,
        COUNT(s.id) as session_count,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN s.status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_count,
        ROUND(
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END) * 100.0 /
          NULLIF(COUNT(s.id), 0), 2
        ) as success_rate
      FROM flows f
      LEFT JOIN sessions s ON f.id = s.flow_id
      GROUP BY f.id, f.name
      ORDER BY session_count DESC
    `);

    res.json({
      status: 'success',
      data: result.rows,
    });
  })
);

// GET /api/analytics/sessions/duration - Average session duration
router.get(
  '/sessions/duration',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(`
      SELECT
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds,
        MIN(EXTRACT(EPOCH FROM (updated_at - created_at))) as min_duration_seconds,
        MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_duration_seconds,
        COUNT(*) as total_sessions
      FROM sessions
      WHERE status = 'completed'
        AND updated_at > created_at
    `);

    const data = result.rows[0];

    res.json({
      status: 'success',
      data: {
        average_duration_seconds: parseFloat(data.avg_duration_seconds || 0),
        min_duration_seconds: parseFloat(data.min_duration_seconds || 0),
        max_duration_seconds: parseFloat(data.max_duration_seconds || 0),
        total_sessions: parseInt(data.total_sessions || 0),
      },
    });
  })
);

// GET /api/analytics/sessions/recent - Recent session activity
router.get(
  '/sessions/recent',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10 } = req.query;

    const result = await query(
      `
      SELECT
        s.id,
        s.name,
        s.status,
        s.created_at,
        s.updated_at,
        f.name as flow_name
      FROM sessions s
      LEFT JOIN flows f ON s.flow_id = f.id
      ORDER BY s.updated_at DESC
      LIMIT $1
    `,
      [limit]
    );

    res.json({
      status: 'success',
      data: result.rows,
    });
  })
);

// GET /api/analytics/transcripts/stats - Transcript statistics
router.get(
  '/transcripts/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(`
      SELECT
        COUNT(*) as total_transcripts,
        COUNT(DISTINCT session_id) as sessions_with_transcripts,
        AVG(char_count) as avg_transcript_length
      FROM (
        SELECT
          session_id,
          LENGTH(text) as char_count
        FROM transcripts
      ) t
    `);

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  })
);

export default router;
