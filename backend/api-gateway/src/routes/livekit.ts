import { Router, Request, Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { AppError, asyncHandler } from '../middleware/error';
import { query } from '../db';

const router = Router();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.warn('Warning: LIVEKIT_API_KEY or LIVEKIT_API_SECRET not set');
}

// POST /api/livekit/token - Generate LiveKit access token
router.post(
  '/token',
  asyncHandler(async (req: Request, res: Response) => {
    const { room_name, participant_name, session_id, metadata } = req.body;

    if (!room_name || !participant_name) {
      throw new AppError('room_name and participant_name are required', 400);
    }

    // Verify session exists if session_id provided
    if (session_id) {
      const sessionCheck = await query(
        'SELECT id, room_name FROM sessions WHERE id = $1',
        [session_id]
      );

      if (sessionCheck.rows.length === 0) {
        throw new AppError('Session not found', 404);
      }

      // Verify room_name matches session
      if (sessionCheck.rows[0].room_name !== room_name) {
        throw new AppError('Room name does not match session', 400);
      }
    }

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participant_name,
      name: participant_name,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    // Grant permissions
    at.addGrant({
      room: room_name,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      status: 'success',
      data: {
        token,
        url: LIVEKIT_URL,
        room_name,
        participant_name,
      },
    });
  })
);

// POST /api/livekit/token/agent - Generate LiveKit agent token
router.post(
  '/token/agent',
  asyncHandler(async (req: Request, res: Response) => {
    const { room_name, agent_name = 'AI-Agent', session_id } = req.body;

    if (!room_name) {
      throw new AppError('room_name is required', 400);
    }

    // Verify session exists if session_id provided
    if (session_id) {
      const sessionCheck = await query(
        'SELECT id, room_name FROM sessions WHERE id = $1',
        [session_id]
      );

      if (sessionCheck.rows.length === 0) {
        throw new AppError('Session not found', 404);
      }

      if (sessionCheck.rows[0].room_name !== room_name) {
        throw new AppError('Room name does not match session', 400);
      }
    }

    // Create access token for agent
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `agent_${Date.now()}`,
      name: agent_name,
      metadata: JSON.stringify({ type: 'agent' }),
    });

    // Grant agent permissions
    at.addGrant({
      room: room_name,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      hidden: false, // Set to true if you want agent hidden from participant list
    });

    const token = await at.toJwt();

    res.json({
      status: 'success',
      data: {
        token,
        url: LIVEKIT_URL,
        room_name,
        agent_name,
      },
    });
  })
);

// GET /api/livekit/config - Get LiveKit configuration
router.get(
  '/config',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      status: 'success',
      data: {
        url: LIVEKIT_URL,
        configured: !!(LIVEKIT_API_KEY && LIVEKIT_API_SECRET),
      },
    });
  })
);

export default router;
