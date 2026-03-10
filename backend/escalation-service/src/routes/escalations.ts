import { Router, Request, Response } from 'express';
import escalationManager from '../escalation-manager';
import queueManager from '../queue-manager';

const router = Router();

/**
 * POST /api/escalations
 * Create a new escalation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, userId, messages, collectedData, reason, priority } = req.body;

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId and messages are required',
      });
    }

    const escalation = await escalationManager.createEscalation({
      sessionId,
      userId,
      messages,
      collectedData,
      reason,
      priority,
    });

    res.status(201).json({
      success: true,
      escalation,
    });
  } catch (error: any) {
    console.error('Error creating escalation:', error);
    res.status(500).json({
      error: 'Failed to create escalation',
      message: error.message,
    });
  }
});

/**
 * GET /api/escalations
 * Get all escalations with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority, assignedTo, limit, offset } = req.query;

    const result = await escalationManager.getEscalations({
      status: status as string,
      priority: priority as string,
      assignedTo: assignedTo as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error getting escalations:', error);
    res.status(500).json({
      error: 'Failed to get escalations',
      message: error.message,
    });
  }
});

/**
 * GET /api/escalations/:id
 * Get escalation by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const escalationId = parseInt(req.params.id);
    const escalation = await escalationManager.getEscalation(escalationId);

    res.json({
      success: true,
      escalation,
    });
  } catch (error: any) {
    console.error('Error getting escalation:', error);
    res.status(404).json({
      error: 'Escalation not found',
      message: error.message,
    });
  }
});

/**
 * GET /api/escalations/session/:sessionId
 * Get escalation by session ID
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const escalation = await escalationManager.getEscalationBySession(sessionId);

    res.json({
      success: true,
      escalation,
    });
  } catch (error: any) {
    console.error('Error getting escalation by session:', error);
    res.status(404).json({
      error: 'Escalation not found',
      message: error.message,
    });
  }
});

/**
 * PUT /api/escalations/:id/assign
 * Assign escalation to consultant
 */
router.put('/:id/assign', async (req: Request, res: Response) => {
  try {
    const escalationId = parseInt(req.params.id);
    const { consultantId } = req.body;

    if (!consultantId) {
      return res.status(400).json({
        error: 'consultantId is required',
      });
    }

    const escalation = await escalationManager.assignToConsultant(escalationId, consultantId);

    res.json({
      success: true,
      escalation,
    });
  } catch (error: any) {
    console.error('Error assigning escalation:', error);
    res.status(500).json({
      error: 'Failed to assign escalation',
      message: error.message,
    });
  }
});

/**
 * PUT /api/escalations/:id/status
 * Update escalation status
 */
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const escalationId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'status is required',
      });
    }

    const escalation = await escalationManager.updateStatus(escalationId, status);

    res.json({
      success: true,
      escalation,
    });
  } catch (error: any) {
    console.error('Error updating escalation status:', error);
    res.status(500).json({
      error: 'Failed to update escalation status',
      message: error.message,
    });
  }
});

/**
 * PUT /api/escalations/:id/resolve
 * Resolve escalation
 */
router.put('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const escalationId = parseInt(req.params.id);
    const { resolutionNotes } = req.body;

    const escalation = await escalationManager.resolveEscalation(escalationId, resolutionNotes);

    res.json({
      success: true,
      escalation,
    });
  } catch (error: any) {
    console.error('Error resolving escalation:', error);
    res.status(500).json({
      error: 'Failed to resolve escalation',
      message: error.message,
    });
  }
});

/**
 * POST /api/escalations/:id/notes
 * Add note to escalation
 */
router.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const escalationId = parseInt(req.params.id);
    const { note, author } = req.body;

    if (!note || !author) {
      return res.status(400).json({
        error: 'note and author are required',
      });
    }

    const escalation = await escalationManager.addNote(escalationId, note, author);

    res.json({
      success: true,
      escalation,
    });
  } catch (error: any) {
    console.error('Error adding note to escalation:', error);
    res.status(500).json({
      error: 'Failed to add note',
      message: error.message,
    });
  }
});

/**
 * GET /api/escalations/queue/next
 * Get next escalation in queue
 */
router.get('/queue/next', async (req: Request, res: Response) => {
  try {
    const next = await queueManager.getNextInQueue();

    res.json({
      success: true,
      escalation: next,
    });
  } catch (error: any) {
    console.error('Error getting next in queue:', error);
    res.status(500).json({
      error: 'Failed to get next escalation',
      message: error.message,
    });
  }
});

/**
 * POST /api/escalations/queue/auto-assign
 * Auto-assign next escalation to consultant
 */
router.post('/queue/auto-assign', async (req: Request, res: Response) => {
  try {
    const { consultantId } = req.body;

    if (!consultantId) {
      return res.status(400).json({
        error: 'consultantId is required',
      });
    }

    const escalation = await queueManager.autoAssign(consultantId);

    if (!escalation) {
      return res.json({
        success: true,
        escalation: null,
        message: 'No escalations available in queue',
      });
    }

    res.json({
      success: true,
      escalation,
    });
  } catch (error: any) {
    console.error('Error auto-assigning escalation:', error);
    res.status(500).json({
      error: 'Failed to auto-assign escalation',
      message: error.message,
    });
  }
});

/**
 * GET /api/escalations/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    const stats = await queueManager.getQueueStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      error: 'Failed to get queue stats',
      message: error.message,
    });
  }
});

/**
 * GET /api/escalations/consultant/:consultantId
 * Get escalations assigned to consultant
 */
router.get('/consultant/:consultantId', async (req: Request, res: Response) => {
  try {
    const { consultantId } = req.params;
    const escalations = await queueManager.getConsultantEscalations(consultantId);

    res.json({
      success: true,
      escalations,
    });
  } catch (error: any) {
    console.error('Error getting consultant escalations:', error);
    res.status(500).json({
      error: 'Failed to get consultant escalations',
      message: error.message,
    });
  }
});

export default router;
