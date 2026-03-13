import { Router, Request, Response } from 'express';
import { query } from '../db';
import { AppError, asyncHandler } from '../middleware/error';
import { broadcastSessionUpdate } from '../websocket/handler';

const router = Router();

interface Session {
  id: string;
  room_id: string;
  flow_id: string;
  status: string;
  language: string;
  started_at: Date;
  ended_at?: Date;
  duration_seconds?: number;
  escalated: boolean;
  escalated_at?: Date;
  escalation_reason?: string;
  client_metadata?: any;
  cost_data?: any;
  tags?: string[];
  satisfaction_score?: number;
  created_at: Date;
  updated_at: Date;
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

    queryText += ` ORDER BY s.started_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query<Session>(queryText, params);

    // Enhance sessions with data field counts
    const enhancedSessions = await Promise.all(
      result.rows.map(async (session) => {
        // Get count of collected data fields
        const dataFieldsResult = await query(
          `SELECT COUNT(*) as count FROM session_data WHERE session_id = $1`,
          [session.id]
        );

        // Get count of transcript entries
        const transcriptsResult = await query(
          `SELECT COUNT(*) as count FROM transcripts WHERE session_id = $1`,
          [session.id]
        );

        return {
          ...session,
          data_fields_count: parseInt(dataFieldsResult.rows[0]?.count || '0'),
          transcript_count: parseInt(transcriptsResult.rows[0]?.count || '0')
        };
      })
    );

    console.log(`[Sessions] Retrieved ${enhancedSessions.length} sessions`);

    res.json({
      status: 'success',
      data: enhancedSessions,
      count: enhancedSessions.length,
    });
  })
);

// GET /api/sessions/:id - Get single session
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // First, get the session
    const sessionResult = await query<Session>(
      `
      SELECT s.*, f.name as flow_name
      FROM sessions s
      LEFT JOIN flows f ON s.flow_id = f.id
      WHERE s.id = $1
    `,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const session = sessionResult.rows[0];

    // Get session transcripts
    const transcriptResult = await query(
      `
      SELECT speaker, text, timestamp, language
      FROM transcripts
      WHERE session_id = $1
      ORDER BY timestamp ASC
    `,
      [id]
    );

    // Map database speaker values to the frontend expected values
    const transcripts = transcriptResult.rows.map(transcript => ({
      ...transcript,
      // Make sure the speaker is properly identified as 'bot' when the speaker is 'bot'
      speaker: transcript.speaker === 'bot' ? 'bot' : transcript.speaker
    }));

    // Get collected data fields
    const dataFieldsResult = await query(
      `
      SELECT field_name, field_value, field_type
      FROM session_data
      WHERE session_id = $1
    `,
      [id]
    );

    // Transform data fields into key-value object
    const collectedData: Record<string, string> = {};
    for (const row of dataFieldsResult.rows) {
      collectedData[row.field_name] = row.field_value;
    }

    // Create enhanced session object with collected data and transcript
    const enhancedSession = {
      ...session,
      transcript: transcripts, // Use the mapped transcripts
      collected_data: collectedData
    };

    console.log('[Sessions] Fetched session details with data:', {
      id,
      dataFields: Object.keys(collectedData),
      transcriptCount: transcriptResult.rowCount
    });

    res.json({
      status: 'success',
      data: enhancedSession,
    });
  })
);

// POST /api/sessions - Create new session
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { flow_id, language = 'en', client_metadata } = req.body;

    if (!flow_id) {
      throw new AppError('flow_id is required', 400);
    }

    // Verify flow exists
    const flowCheck = await query('SELECT id FROM flows WHERE id = $1', [
      flow_id,
    ]);

    if (flowCheck.rows.length === 0) {
      throw new AppError('Flow not found', 404);
    }

    // Generate unique room ID
    const room_id = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const result = await query<Session>(
      `
      INSERT INTO sessions (room_id, flow_id, status, language, client_metadata)
      VALUES ($1, $2, 'active', $3, $4)
      RETURNING *
    `,
      [room_id, flow_id, language, client_metadata ? JSON.stringify(client_metadata) : '{}']
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
    const { status, client_metadata, escalated, escalation_reason, satisfaction_score, ended_at } = req.body;

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

    if (status !== undefined) {
      const validStatuses = ['active', 'completed', 'escalated', 'abandoned'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status value', 400);
      }
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (client_metadata !== undefined) {
      updates.push(`client_metadata = $${paramCount}`);
      params.push(JSON.stringify(client_metadata));
      paramCount++;
    }

    if (escalated !== undefined) {
      updates.push(`escalated = $${paramCount}`);
      params.push(escalated);
      paramCount++;

      if (escalated && !existingSession.rows[0].escalated_at) {
        updates.push(`escalated_at = NOW()`);
      }
    }

    if (escalation_reason !== undefined) {
      updates.push(`escalation_reason = $${paramCount}`);
      params.push(escalation_reason);
      paramCount++;
    }

    if (satisfaction_score !== undefined) {
      updates.push(`satisfaction_score = $${paramCount}`);
      params.push(satisfaction_score);
      paramCount++;
    }

    if (ended_at !== undefined) {
      updates.push(`ended_at = $${paramCount}`);
      params.push(ended_at);
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

// POST /api/sessions/:id/transcript - Add transcript entry
router.post(
  '/:id/transcript',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { speaker, text, timestamp, language } = req.body;

    if (!speaker || !text) {
      throw new AppError('Speaker and text are required', 400);
    }

    const result = await query(
      `INSERT INTO transcripts (session_id, speaker, text, timestamp, language)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, speaker, text, timestamp || new Date(), language || 'en']
    );

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  })
);

// POST /api/sessions/:id/data - Add session data field
router.post(
  '/:id/data',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { field_name, field_value, field_type } = req.body;

    if (!field_name || !field_value) {
      throw new AppError('field_name and field_value are required', 400);
    }

    const result = await query(
      `INSERT INTO session_data (session_id, field_name, field_value, field_type, validation_status)
       VALUES ($1, $2, $3, $4, 'valid')
       ON CONFLICT (session_id, field_name)
       DO UPDATE SET field_value = $3, updated_at = NOW()
       RETURNING *`,
      [id, field_name, field_value, field_type || 'text']
    );

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  })
);

// PATCH /api/sessions/:id/status - Update session status
router.patch(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const validStatuses = ['active', 'completed', 'escalated', 'abandoned'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status value', 400);
    }

    const result = await query<Session>(
      `UPDATE sessions
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
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

// PATCH /api/sessions/:id/notes - Update session notes
router.patch(
  '/:id/notes',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await query<Session>(
      `UPDATE sessions
       SET escalation_reason = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes, id]
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

// POST /api/sessions/:id/resolve - Mark session as resolved
router.post(
  '/:id/resolve',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;

    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = ['completed'];
    let paramCount = 2;

    if (notes) {
      updates.push(`escalation_reason = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }

    params.push(id);

    const result = await query<Session>(
      `UPDATE sessions
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
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

// POST /api/sessions/:id/end - End a session
router.post(
  '/:id/end',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await query<Session>(
      `UPDATE sessions
       SET status = 'completed', ended_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
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

// POST /api/sessions/:id/escalate - Escalate a session
router.post(
  '/:id/escalate',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await query<Session>(
      `UPDATE sessions
       SET status = 'escalated',
           escalated = true,
           escalated_at = NOW(),
           escalation_reason = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason || 'Escalated by user', id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    // Broadcast escalation
    broadcastSessionUpdate({
      type: 'new_escalation',
      session: result.rows[0],
    });

    res.json({
      status: 'success',
      data: result.rows[0],
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
      dataValues: collectedData || {},
      satisfaction: satisfactionScore
    });

    // Start transaction
    const roomId = `chat-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const startedAt = new Date(Date.now() - (duration || 0) * 1000);
    const endedAt = new Date();

    console.log('[Sessions] Generated roomId:', roomId);

    // 1. Create session record
    const sessionResult = await query(
      `INSERT INTO sessions (
        room_id, status, language, flow_id,
        started_at, ended_at, duration_seconds,
        satisfaction_score, client_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        roomId,
        'completed',
        language || 'en',
        flowId,
        startedAt,
        endedAt,
        duration || 0,
        satisfactionScore,
        JSON.stringify({ source: 'chat' }) // Add some client metadata to identify chat sessions
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
      console.log('[Sessions] Processing collected data fields:', Object.keys(collectedData));
      console.log('[Sessions] Data values:', JSON.stringify(collectedData));

      for (const [fieldName, fieldValue] of Object.entries(collectedData)) {
        if (!fieldValue && fieldValue !== 0 && fieldValue !== false) continue; // Skip empty values but allow 0 and false

        // Convert non-string values to strings
        const stringValue = typeof fieldValue === 'string'
          ? fieldValue
          : JSON.stringify(fieldValue);

        try {
          // Use UPSERT to avoid duplicate key errors
          await query(
            `INSERT INTO session_data (
              session_id, field_name, field_value,
              field_type, validation_status
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (session_id, field_name)
            DO UPDATE SET field_value = $3, updated_at = NOW()`,
            [
              sessionId,
              fieldName,
              stringValue,
              'text',
              'valid'
            ]
          );
          console.log(`[Sessions] Saved field ${fieldName} with value ${stringValue}`);
        } catch (error) {
          console.error(`[Sessions] Error saving field ${fieldName}:`, error);
        }
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
