import { Router, Request, Response } from 'express';
import {
  getDashboardOverview,
  getTrendData,
  getFlowStatistics,
  getCostBreakdown,
  getQualityInsights
} from '../exporters/dashboard-api';
import { runDailyAggregation, backfillAggregations } from '../aggregators/daily-aggregator';
import { calculateSessionCosts } from '../collectors/cost-metrics';
import { calculateQualityMetrics } from '../collectors/quality-metrics';
import { collectSessionMetrics } from '../collectors/session-metrics';

const router = Router();

/**
 * GET /metrics/overview
 * Get dashboard overview with key metrics
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const overview = await getDashboardOverview();
    res.json(overview);
  } catch (error) {
    console.error('Error getting overview:', error);
    res.status(500).json({ error: 'Failed to get overview metrics' });
  }
});

/**
 * GET /metrics/trends
 * Get trend data for charts
 * Query params: days (default: 30)
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trends = await getTrendData(days);
    res.json(trends);
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({ error: 'Failed to get trend data' });
  }
});

/**
 * GET /metrics/flow
 * Get flow statistics and funnel analysis
 * Query params: days (default: 7)
 */
router.get('/flow', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const flowStats = await getFlowStatistics(days);
    res.json(flowStats);
  } catch (error) {
    console.error('Error getting flow statistics:', error);
    res.status(500).json({ error: 'Failed to get flow statistics' });
  }
});

/**
 * GET /metrics/costs
 * Get cost breakdown and analysis
 * Query params: days (default: 30)
 */
router.get('/costs', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const costs = await getCostBreakdown(days);
    res.json(costs);
  } catch (error) {
    console.error('Error getting cost breakdown:', error);
    res.status(500).json({ error: 'Failed to get cost breakdown' });
  }
});

/**
 * GET /metrics/quality
 * Get quality insights
 * Query params: days (default: 7)
 */
router.get('/quality', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const quality = await getQualityInsights(days);
    res.json(quality);
  } catch (error) {
    console.error('Error getting quality insights:', error);
    res.status(500).json({ error: 'Failed to get quality insights' });
  }
});

/**
 * POST /metrics/session/:sessionId/collect
 * Collect all metrics for a specific session
 */
router.post('/session/:sessionId/collect', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const [sessionMetrics, costMetrics, qualityMetrics] = await Promise.all([
      collectSessionMetrics(sessionId),
      calculateSessionCosts(sessionId),
      calculateQualityMetrics(sessionId)
    ]);

    res.json({
      session: sessionMetrics,
      costs: costMetrics,
      quality: qualityMetrics
    });
  } catch (error) {
    console.error('Error collecting session metrics:', error);
    res.status(500).json({ error: 'Failed to collect session metrics' });
  }
});

/**
 * GET /metrics/session/:sessionId
 * Get all metrics for a specific session
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const [sessionMetrics, costMetrics, qualityMetrics] = await Promise.all([
      collectSessionMetrics(sessionId),
      calculateSessionCosts(sessionId),
      calculateQualityMetrics(sessionId)
    ]);

    res.json({
      session: sessionMetrics,
      costs: costMetrics,
      quality: qualityMetrics
    });
  } catch (error) {
    console.error('Error getting session metrics:', error);
    res.status(500).json({ error: 'Failed to get session metrics' });
  }
});

/**
 * POST /metrics/aggregate/daily
 * Manually trigger daily aggregation
 */
router.post('/aggregate/daily', async (req: Request, res: Response) => {
  try {
    await runDailyAggregation();
    res.json({ message: 'Daily aggregation completed successfully' });
  } catch (error) {
    console.error('Error running daily aggregation:', error);
    res.status(500).json({ error: 'Failed to run daily aggregation' });
  }
});

/**
 * POST /metrics/aggregate/backfill
 * Backfill aggregations for a date range
 * Body: { startDate: string, endDate: string }
 */
router.post('/aggregate/backfill', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    await backfillAggregations(start, end);
    res.json({ message: 'Backfill completed successfully' });
  } catch (error) {
    console.error('Error running backfill:', error);
    res.status(500).json({ error: 'Failed to run backfill' });
  }
});

export default router;
