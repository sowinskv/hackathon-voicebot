import express, { Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { query } from '../db';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/x-m4a',
      'audio/webm',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

// Transcribe audio using Azure OpenAI Whisper
async function transcribeAudio(filePath: string): Promise<string> {
  const endpoint = process.env.AZURE_WHISPER_ENDPOINT;
  const apiKey = process.env.AZURE_WHISPER_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error('Azure Whisper credentials not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(endpoint, formData, {
      headers: {
        'api-key': apiKey,
        ...formData.getHeaders(),
      },
    });

    return response.data.text || '';
  } catch (error: any) {
    console.error('Transcription error:', error.response?.data || error.message);
    throw new Error('Failed to transcribe audio');
  }
}

// Upload and transcribe endpoint
router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { projectId, description } = req.body;

    console.log(`Transcribing file: ${req.file.filename}`);
    const transcript = await transcribeAudio(req.file.path);

    // Save transcript to database
    const result = await query(
      `INSERT INTO transcripts (project_id, file_name, file_path, transcript, description, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, transcript, created_at`,
      [projectId || null, req.file.originalname, req.file.path, transcript, description || null]
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      transcriptId: result.rows[0].id,
      transcript: result.rows[0].transcript,
      createdAt: result.rows[0].created_at,
    });
  } catch (error: any) {
    console.error('Upload error:', error);

    // Clean up file if it exists
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to process audio file',
      details: error.message,
    });
  }
});

// Upload transcript text directly (no audio)
router.post('/transcript', async (req: Request, res: Response) => {
  try {
    const { projectId, transcript, description, source } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript text is required' });
    }

    const result = await query(
      `INSERT INTO transcripts (project_id, transcript, description, source, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, transcript, created_at`,
      [projectId || null, transcript, description || null, source || 'manual']
    );

    res.json({
      success: true,
      transcriptId: result.rows[0].id,
      transcript: result.rows[0].transcript,
      createdAt: result.rows[0].created_at,
    });
  } catch (error: any) {
    console.error('Transcript upload error:', error);
    res.status(500).json({
      error: 'Failed to save transcript',
      details: error.message,
    });
  }
});

// Get all transcripts
router.get('/transcripts', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;

    let queryText = 'SELECT id, project_id, file_name, description, source, created_at FROM transcripts';
    let params: any[] = [];

    if (projectId) {
      queryText += ' WHERE project_id = $1';
      params = [projectId];
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      transcripts: result.rows,
    });
  } catch (error: any) {
    console.error('Fetch transcripts error:', error);
    res.status(500).json({
      error: 'Failed to fetch transcripts',
      details: error.message,
    });
  }
});

// Get single transcript with full text
router.get('/transcripts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM transcripts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcript not found' });
    }

    res.json({
      success: true,
      transcript: result.rows[0],
    });
  } catch (error: any) {
    console.error('Fetch transcript error:', error);
    res.status(500).json({
      error: 'Failed to fetch transcript',
      details: error.message,
    });
  }
});

// Delete transcript
router.delete('/transcripts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM transcripts WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Transcript deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete transcript error:', error);
    res.status(500).json({
      error: 'Failed to delete transcript',
      details: error.message,
    });
  }
});

export default router;
