import { Router, Request, Response } from 'express';
import { AppError, asyncHandler } from '../middleware/error';
import { AccessToken } from 'livekit-server-sdk';

const router = Router();

// POST /api/voice/token - Generate LiveKit access token
router.post(
  '/token',
  asyncHandler(async (req: Request, res: Response) => {
    const { roomName, participantName, metadata } = req.body;

    if (!roomName || !participantName) {
      throw new AppError('roomName and participantName are required', 400);
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new AppError('LiveKit credentials not configured', 500);
    }

    try {
      console.log('[VOICE] Generating token for:', { roomName, participantName });

      // Create access token
      const token = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
        metadata: JSON.stringify(metadata || {}),
      });

      // Grant permissions
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const jwt = await token.toJwt();

      console.log('[VOICE] Token generated successfully');

      res.json({
        status: 'success',
        data: {
          token: jwt,
          url: process.env.LIVEKIT_URL_PUBLIC || process.env.LIVEKIT_URL,
        },
      });
    } catch (error: any) {
      console.error('[VOICE] Token generation error:', error);
      throw new AppError('Failed to generate access token: ' + error.message, 500);
    }
  })
);

// POST /api/voice/room - Create a voice session room
router.post(
  '/room',
  asyncHandler(async (req: Request, res: Response) => {
    const { flowId, sessionId, language = 'pl' } = req.body;

    if (!flowId || !sessionId) {
      throw new AppError('flowId and sessionId are required', 400);
    }

    try {
      console.log('[VOICE] Creating room for session:', sessionId);

      // Fetch flow configuration from database
      const { query } = require('../db');
      const flowResult = await query(
        'SELECT * FROM flows WHERE id = $1 AND status = $2',
        [flowId, 'published']
      );

      if (flowResult.rows.length === 0) {
        throw new AppError('Flow not found or not published', 404);
      }

      const flow = flowResult.rows[0];

      const roomName = `session-${sessionId}`;

      // Room metadata includes bot configuration
      const roomMetadata = {
        sessionId,
        flowId,
        systemPrompt: flow.system_prompt,
        requiredFields: flow.required_fields,
        language: flow.language || language,
      };

      console.log('[VOICE] Room created:', roomName);

      res.json({
        status: 'success',
        data: {
          roomName,
          metadata: roomMetadata,
        },
      });
    } catch (error: any) {
      console.error('[VOICE] Room creation error:', error);
      throw new AppError('Failed to create room: ' + error.message, 500);
    }
  })
);

// POST /api/voice/start - Start a voice bot session
router.post(
  '/start',
  asyncHandler(async (req: Request, res: Response) => {
    const { flowId, participantName = 'User', language = 'pl' } = req.body;

    if (!flowId) {
      throw new AppError('flowId is required', 400);
    }

    try {
      console.log('[VOICE] Starting voice session with flow:', flowId);

      // Get flow details
      const { query } = require('../db');
      const flowResult = await query(
        `SELECT system_prompt, flow_definition FROM flows WHERE id = $1`,
        [flowId]
      );

      if (flowResult.rows.length === 0) {
        throw new AppError('Flow not found', 404);
      }

      const flow = flowResult.rows[0];
      const roomName = `session-${Date.now()}`;

      // Create session in database
      const sessionResult = await query(
        `INSERT INTO sessions (room_id, status, language, flow_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [roomName, 'active', language, flowId]
      );

      const session = sessionResult.rows[0];

      // Create LiveKit room with metadata using LiveKit SDK
      const { RoomServiceClient } = require('livekit-server-sdk');
      const livekitUrl = process.env.LIVEKIT_URL || 'http://livekit:7880';
      const roomService = new RoomServiceClient(
        livekitUrl,
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
      );

      // Create room with metadata
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300,
        metadata: JSON.stringify({
          systemPrompt: flow.system_prompt,
          flowDefinition: flow.flow_definition,
          sessionId: session.id,
          language,
        }),
      });

      console.log('[VOICE] Room created:', roomName);

      // Generate participant token
      const token = new AccessToken(
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!,
        {
          identity: participantName,
          metadata: JSON.stringify({ sessionId: session.id }),
        }
      );

      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const jwt = await token.toJwt();

      console.log('[VOICE] Session started:', session.id);

      res.json({
        status: 'success',
        data: {
          sessionId: session.id,
          roomName: roomName,
          token: jwt,
          url: process.env.LIVEKIT_URL_PUBLIC || process.env.LIVEKIT_URL,
        },
      });
    } catch (error: any) {
      console.error('[VOICE] Start session error:', error);
      throw new AppError('Failed to start session: ' + error.message, 500);
    }
  })
);

export default router;
