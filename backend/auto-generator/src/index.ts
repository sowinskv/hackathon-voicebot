import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './routes/upload';
import generateRoutes from './routes/generate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auto-generator',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/generate', generateRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Auto-Generator Service',
    description: 'Generate bot flows and prompts from call recordings',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      upload: {
        transcribe: 'POST /api/upload/transcribe',
        transcript: 'POST /api/upload/transcript',
        list: 'GET /api/upload/transcripts',
        get: 'GET /api/upload/transcripts/:id',
        delete: 'DELETE /api/upload/transcripts/:id',
      },
      generate: {
        analyze: 'POST /api/generate/analyze/:transcriptId',
        flow: 'POST /api/generate/flow/:transcriptId',
        prompt: 'POST /api/generate/prompt/:transcriptId',
        wizard: 'POST /api/generate/wizard/:transcriptId',
        improvements: 'POST /api/generate/improvements/:projectId',
        compareFlows: 'POST /api/generate/compare-flows',
        history: 'GET /api/generate/history/:transcriptId',
      },
    },
    documentation: {
      uploadAudio: {
        endpoint: 'POST /api/upload/transcribe',
        description: 'Upload audio file and transcribe using Azure Whisper',
        requestType: 'multipart/form-data',
        fields: {
          audio: 'Audio file (WAV, MP3, M4A, WebM)',
          projectId: 'Optional project ID',
          description: 'Optional description',
        },
      },
      wizard: {
        endpoint: 'POST /api/generate/wizard/:transcriptId',
        description: 'Full auto-generation wizard - analyze, generate flow, prompt, and validation rules',
        body: {
          projectName: 'Name of the project',
          optimize: 'true to optimize the generated flow',
        },
      },
      improvements: {
        endpoint: 'POST /api/generate/improvements/:projectId',
        description: 'Analyze past conversations and suggest improvements',
        body: {
          includeFlow: 'Include current flow in analysis',
          includePrompt: 'Include current prompt in analysis',
        },
      },
    },
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Auto-Generator Service                                  ║
║   Generate bot flows and prompts from recordings          ║
║                                                           ║
║   Server running on port ${PORT}                             ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                           ║
║   Endpoints:                                              ║
║   - POST /api/upload/transcribe                           ║
║   - POST /api/generate/wizard/:transcriptId               ║
║   - POST /api/generate/improvements/:projectId            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  console.log('Ready to process audio files and generate bot configurations!');
});

export default app;
