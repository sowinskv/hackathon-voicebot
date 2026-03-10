import dotenv from 'dotenv';
import { Pool } from 'pg';
import { WebSocket, WebSocketServer } from 'ws';
import { LiveKitAgent } from './livekit/agent';
import { getPool } from './db';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startVoicebotEngine() {
  console.log('Starting Voicebot Engine...');

  // Validate required environment variables
  const required = [
    'LIVEKIT_URL',
    'LIVEKIT_API_KEY',
    'LIVEKIT_API_SECRET',
    'AZURE_WHISPER_ENDPOINT',
    'AZURE_WHISPER_KEY',
    'ELEVENLABS_API_KEY',
    'GEMINI_API_KEY',
    'DATABASE_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  // Test database connection
  try {
    const pool = getPool();
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }

  // Create WebSocket server for receiving room join requests
  const wss = new WebSocketServer({ port: Number(PORT) });
  console.log(`WebSocket server listening on port ${PORT}`);

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'join_room') {
          const { roomName, sessionId, flowId } = message;

          if (!roomName || !sessionId || !flowId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Missing required fields: roomName, sessionId, flowId'
            }));
            return;
          }

          console.log(`Request to join room: ${roomName}, session: ${sessionId}, flow: ${flowId}`);

          // Create and start agent
          const agent = new LiveKitAgent(roomName, sessionId, flowId);

          agent.on('ready', () => {
            ws.send(JSON.stringify({
              type: 'agent_joined',
              roomName,
              sessionId
            }));
          });

          agent.on('error', (error) => {
            ws.send(JSON.stringify({
              type: 'error',
              message: error.message
            }));
          });

          agent.on('disconnected', () => {
            ws.send(JSON.stringify({
              type: 'agent_disconnected',
              roomName,
              sessionId
            }));
          });

          await agent.start();
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Health check endpoint (simple HTTP server)
  const http = require('http');
  const healthServer = http.createServer((req: any, res: any) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  const healthPort = Number(PORT) + 1;
  healthServer.listen(healthPort);
  console.log(`Health check endpoint available at http://localhost:${healthPort}/health`);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    wss.close();
    healthServer.close();
    await getPool().end();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    wss.close();
    healthServer.close();
    await getPool().end();
    process.exit(0);
  });
}

startVoicebotEngine().catch((error) => {
  console.error('Failed to start Voicebot Engine:', error);
  process.exit(1);
});
