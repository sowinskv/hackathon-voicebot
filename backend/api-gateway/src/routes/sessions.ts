import { Router, Request, Response } from 'express';
import { query } from '../db';
import { AppError, asyncHandler } from '../middleware/error';
import { broadcastSessionUpdate } from '../websocket/handler';

const router = Router();

interface Session {
  id: string;
  name: string;
  flow_id: string;
  status: string;
  room_name: string;
  created_at: Date;
  updated_at: Date;
  metadata?: any;
}

// GET /api/sessions - List all sessions
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, flow_id, limit = 100, offset = 0 } = req.query;

    let queryText = `
      SELECT s.*, f.name as flow_name
      FROM sessions s
      LEFT JOIN flows f ON s.flow_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (flow_id) {
      queryText += ` AND s.flow_id = $${paramCount}`;
      params.push(flow_id);
      paramCount++;
    }

    queryText += ` ORDER BY s.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query<Session>(queryText, params);

    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length,
    });
  })
);

// GET /api/sessions/:id - Get single session
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await query<Session>(
      `
      SELECT s.*, f.name as flow_name
      FROM sessions s
      LEFT JOIN flows f ON s.flow_id = f.id
      WHERE s.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  })
);

// POST /api/sessions - Create new session
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, flow_id, metadata } = req.body;

    if (!name || !flow_id) {
      throw new AppError('Name and flow_id are required', 400);
    }

    // Verify flow exists
    const flowCheck = await query('SELECT id FROM flows WHERE id = $1', [
      flow_id,
    ]);

    if (flowCheck.rows.length === 0) {
      throw new AppError('Flow not found', 404);
    }

    // Generate unique room name
    const room_name = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const result = await query<Session>(
      `
      INSERT INTO sessions (name, flow_id, status, room_name, metadata)
      VALUES ($1, $2, 'pending', $3, $4)
      RETURNING *
    `,
      [name, flow_id, room_name, metadata ? JSON.stringify(metadata) : null]
    );

    const newSession = result.rows[0];

    // Broadcast session creation
    broadcastSessionUpdate({
      type: 'session_created',
      session: newSession,
    });

    res.status(201).json({
      status: 'success',
      data: newSession,
    });
  })
);

// PUT /api/sessions/:id - Update session
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, status, metadata } = req.body;

    // Check if session exists
    const existingSession = await query('SELECT id FROM sessions WHERE id = $1', [
      id,
    ]);

    if (existingSession.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (status !== undefined) {
      const validStatuses = ['pending', 'active', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status value', 400);
      }
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (metadata !== undefined) {
      updates.push(`metadata = $${paramCount}`);
      params.push(JSON.stringify(metadata));
      paramCount++;
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query<Session>(
      `
      UPDATE sessions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `,
      params
    );

    const updatedSession = result.rows[0];

    // Broadcast session update
    broadcastSessionUpdate({
      type: 'session_updated',
      session: updatedSession,
    });

    res.json({
      status: 'success',
      data: updatedSession,
    });
  })
);

// DELETE /api/sessions/:id - Delete session
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await query<Session>(
      'DELETE FROM sessions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    // Broadcast session deletion
    broadcastSessionUpdate({
      type: 'session_deleted',
      sessionId: id,
    });

    res.json({
      status: 'success',
      message: 'Session deleted successfully',
      data: result.rows[0],
    });
  })
);

// GET /api/sessions/:id/transcript - Get session transcript
router.get(
  '/:id/transcript',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if session exists
    const sessionCheck = await query('SELECT id FROM sessions WHERE id = $1', [
      id,
    ]);

    if (sessionCheck.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    // Get transcript entries
    const result = await query(
      `
      SELECT *
      FROM transcripts
      WHERE session_id = $1
      ORDER BY timestamp ASC
    `,
      [id]
    );

    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length,
    });
  })
);

// POST /api/sessions/complete - Complete a session with transcript and collected data
router.post(
  '/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      flowId,
      language,
      messages,
      collectedData,
      satisfactionScore,
      duration
    } = req.body;

    console.log('[Sessions] Completing session:', {
      flowId,
      language,
      messageCount: messages?.length,
      dataFields: Object.keys(collectedData || {}),
      satisfaction: satisfactionScore
    });

    // Start transaction
    const roomId = `chat-${Date.now()}`;
    const startedAt = new Date(Date.now() - (duration || 0) * 1000);
    const endedAt = new Date();

    // 1. Create session record
    const sessionResult = await query(
      `INSERT INTO sessions (
        room_id, status, language, flow_id,
        started_at, ended_at, duration_seconds,
        satisfaction_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        roomId,
        'completed',
        language || 'en',
        flowId,
        startedAt,
        endedAt,
        duration || 0,
        satisfactionScore
      ]
    );

    const sessionId = sessionResult.rows[0].id;
    console.log('[Sessions] Created session:', sessionId);

    // 2. Save transcripts
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        if (!msg.content) continue; // Skip empty messages

        await query(
          `INSERT INTO transcripts (
            session_id, speaker, text, timestamp, language
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            sessionId,
            msg.role === 'user' ? 'client' : 'bot',
            msg.content,
            msg.timestamp || new Date(),
            language || 'en'
          ]
        );
      }
      console.log('[Sessions] Saved', messages.length, 'transcripts');
    }

    // 3. Save collected data
    if (collectedData && Object.keys(collectedData).length > 0) {
      for (const [fieldName, fieldValue] of Object.entries(collectedData)) {
        if (!fieldValue) continue; // Skip empty values

        await query(
          `INSERT INTO session_data (
            session_id, field_name, field_value,
            field_type, validation_status
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            sessionId,
            fieldName,
            fieldValue as string,
            'text',
            'valid'
          ]
        );
      }
      console.log('[Sessions] Saved', Object.keys(collectedData).length, 'data fields');
    }

    res.json({
      status: 'success',
      sessionId,
      message: 'Session completed and saved successfully'
    });
  })
);

export default router;
