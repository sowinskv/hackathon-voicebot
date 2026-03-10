import { Router, Request, Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { AppError, asyncHandler } from '../middleware/error';
import { query } from '../db';

const router = Router();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';

// POST /api/voice-sessions
// Creates a DB session, generates a LiveKit token, returns everything the client needs.
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { language = 'en' } = req.body;

    if (!['en', 'pl'].includes(language)) {
      throw new AppError('language must be "en" or "pl"', 400);
    }

    // Find published flow for the requested language
    const flowResult = await query<{ id: string }>(
      `SELECT id FROM flows WHERE status = 'published' AND language = $1 LIMIT 1`,
      [language]
    );
    const flowId = flowResult.rows[0]?.id ?? null;

    // Unique room ID for LiveKit
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Insert session into DB
    const sessionResult = await query<{ id: string }>(
      `INSERT INTO sessions (room_id, status, language, flow_id)
       VALUES ($1, 'active', $2, $3)
       RETURNING id`,
      [roomId, language, flowId]
    );
    const sessionId = sessionResult.rows[0].id;

    // Generate LiveKit access token for the client participant
    const participantIdentity = `client_${sessionId.substring(0, 8)}`;
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantIdentity,
    });
    at.addGrant({
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const livekitToken = await at.toJwt();

    res.status(201).json({
      sessionId,
      livekitToken,
      livekitUrl: LIVEKIT_URL,
      agentId: 'voicebot-agent',
    });
  })
);

export default router;
