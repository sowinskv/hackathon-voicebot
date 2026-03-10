import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { errorHandler, notFoundHandler } from './middleware/error';
import { initWebSocket, getConnectedClientsCount } from './websocket/handler';
import sessionsRouter from './routes/sessions';
import flowsRouter from './routes/flows';
import analyticsRouter from './routes/analytics';
import livekitRouter from './routes/livekit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    websocket: {
      connected_clients: getConnectedClientsCount(),
    },
  });
});

// API Routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/flows', flowsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/livekit', livekitRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      sessions: '/api/sessions',
      flows: '/api/flows',
      analytics: '/api/analytics',
      livekit: '/api/livekit',
      websocket: '/ws',
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   API Gateway Service                     ║
╠═══════════════════════════════════════════════════════════╣
║  HTTP Server:    http://localhost:${PORT}                    ║
║  WebSocket:      ws://localhost:${PORT}/ws                   ║
║  Health Check:   http://localhost:${PORT}/health             ║
╚═══════════════════════════════════════════════════════════╝
  `);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Database:', process.env.DB_HOST || 'localhost');
  console.log('LiveKit URL:', process.env.LIVEKIT_URL || 'ws://localhost:7880');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
