# Auto-Generator Service

Automatically generate bot flows and prompts from call recordings using AI.

## Features

- **Audio Transcription**: Upload WAV/audio files and transcribe with Azure Whisper
- **Pattern Analysis**: Identify conversation stages, data collected, and common questions
- **Flow Generation**: Auto-generate flow diagrams from conversation patterns
- **Prompt Generation**: Create system prompts matching conversation style
- **Validation Rules**: Generate validation rules for data fields
- **Improvement Suggestions**: Analyze past conversations and suggest improvements
- **Quick Deployment**: Full wizard for end-to-end generation

## Tech Stack

- Node.js + TypeScript
- Express.js
- Google Gemini AI (via @google/generative-ai)
- Azure OpenAI Whisper (for transcription)
- PostgreSQL
- Multer (file uploads)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

```env
PORT=3003
DATABASE_URL=postgresql://user:password@db:5432/voicebot
GEMINI_API_KEY=your_gemini_api_key_here
AZURE_WHISPER_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/whisper/audio/transcriptions?api-version=2024-02-01
AZURE_WHISPER_API_KEY=your_azure_openai_api_key
```

### 3. Database Setup

Create the following tables:

```sql
-- Transcripts table
CREATE TABLE transcripts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  file_name VARCHAR(255),
  file_path TEXT,
  transcript TEXT NOT NULL,
  description TEXT,
  source VARCHAR(50) DEFAULT 'upload',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analysis table
CREATE TABLE transcript_analysis (
  id SERIAL PRIMARY KEY,
  transcript_id INTEGER REFERENCES transcripts(id) ON DELETE CASCADE,
  pattern JSONB NOT NULL,
  insights JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(transcript_id)
);

-- Generated flows table
CREATE TABLE generated_flows (
  id SERIAL PRIMARY KEY,
  transcript_id INTEGER REFERENCES transcripts(id) ON DELETE CASCADE,
  flow_data JSONB NOT NULL,
  visualization TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated prompts table
CREATE TABLE generated_prompts (
  id SERIAL PRIMARY KEY,
  transcript_id INTEGER REFERENCES transcripts(id) ON DELETE CASCADE,
  prompt_data JSONB NOT NULL,
  formatted_prompt TEXT,
  validation_rules JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Improvement suggestions table
CREATE TABLE improvement_suggestions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  analytics JSONB,
  suggestions JSONB NOT NULL,
  next_steps JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Supporting tables for analytics
CREATE TABLE conversation_errors (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  conversation_id INTEGER,
  error_type VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversation_feedback (
  id SERIAL PRIMARY KEY,
  project_id INTEGER,
  conversation_id INTEGER,
  sentiment VARCHAR(50),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Run

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

Docker:
```bash
docker build -t auto-generator .
docker run -p 3003:3003 --env-file .env auto-generator
```

## API Endpoints

### Upload & Transcribe

#### POST /api/upload/transcribe
Upload audio file and transcribe.

**Request:**
- Type: `multipart/form-data`
- Fields:
  - `audio`: Audio file (WAV, MP3, M4A, WebM)
  - `projectId`: (optional) Project ID
  - `description`: (optional) Description

**Response:**
```json
{
  "success": true,
  "transcriptId": 1,
  "transcript": "Transcribed text...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### POST /api/upload/transcript
Upload transcript text directly (without audio).

**Request:**
```json
{
  "projectId": 1,
  "transcript": "Call transcript text...",
  "description": "Sales call example",
  "source": "manual"
}
```

#### GET /api/upload/transcripts
List all transcripts.

**Query params:**
- `projectId`: Filter by project

#### GET /api/upload/transcripts/:id
Get single transcript with full text.

#### DELETE /api/upload/transcripts/:id
Delete transcript.

### Generate

#### POST /api/generate/analyze/:transcriptId
Analyze transcript and extract patterns.

**Response:**
```json
{
  "success": true,
  "pattern": {
    "stages": [...],
    "dataCollected": [...],
    "conversationStyle": {...},
    "domainKnowledge": {...}
  },
  "insights": ["insight 1", "insight 2", ...]
}
```

#### POST /api/generate/flow/:transcriptId
Generate flow diagram from analysis.

**Request:**
```json
{
  "projectName": "My Bot",
  "optimize": true
}
```

**Response:**
```json
{
  "success": true,
  "flow": {
    "nodes": [...],
    "edges": [...],
    "metadata": {...}
  },
  "visualization": "text visualization"
}
```

#### POST /api/generate/prompt/:transcriptId
Generate system prompt from analysis.

**Request:**
```json
{
  "projectName": "My Bot",
  "includeValidation": true
}
```

**Response:**
```json
{
  "success": true,
  "systemPrompt": {...},
  "formattedPrompt": "formatted text",
  "validationRules": {...}
}
```

#### POST /api/generate/wizard/:transcriptId
Full auto-generation wizard (all-in-one).

**Request:**
```json
{
  "projectName": "My Bot",
  "optimize": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pattern": {...},
    "insights": [...],
    "flow": {...},
    "visualization": "...",
    "systemPrompt": {...},
    "formattedPrompt": "...",
    "validationRules": {...}
  }
}
```

#### POST /api/generate/improvements/:projectId
Analyze conversation history and suggest improvements.

**Request:**
```json
{
  "includeFlow": true,
  "includePrompt": true
}
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalCalls": 100,
    "averageDuration": 180,
    "completionRate": 85.5,
    "commonDropOffPoints": [...],
    "frequentErrors": [...],
    "userFeedback": [...]
  },
  "suggestions": [
    {
      "category": "flow",
      "priority": "high",
      "title": "...",
      "description": "...",
      "currentBehavior": "...",
      "suggestedBehavior": "...",
      "estimatedImpact": "...",
      "implementationNotes": "..."
    }
  ],
  "nextSteps": ["step 1", "step 2", ...]
}
```

#### POST /api/generate/compare-flows
Compare two flow versions.

**Request:**
```json
{
  "oldFlowId": 1,
  "newFlowId": 2
}
```

#### GET /api/generate/history/:transcriptId
Get generation history for a transcript.

## Usage Example

### Full Workflow

1. **Upload audio file:**
```bash
curl -X POST http://localhost:3003/api/upload/transcribe \
  -F "audio=@call-recording.wav" \
  -F "projectId=1" \
  -F "description=Sales call example"
```

2. **Run wizard (auto-generate everything):**
```bash
curl -X POST http://localhost:3003/api/generate/wizard/1 \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Sales Bot",
    "optimize": true
  }'
```

3. **Later, analyze improvements:**
```bash
curl -X POST http://localhost:3003/api/generate/improvements/1 \
  -H "Content-Type: application/json" \
  -d '{
    "includeFlow": true,
    "includePrompt": true
  }'
```

### Step-by-Step Workflow

1. Upload transcript
2. Analyze: `POST /api/generate/analyze/:transcriptId`
3. Generate flow: `POST /api/generate/flow/:transcriptId`
4. Generate prompt: `POST /api/generate/prompt/:transcriptId`
5. Review and deploy

## Architecture

```
auto-generator/
├── src/
│   ├── index.ts                    # Express server
│   ├── db.ts                       # PostgreSQL connection
│   ├── transcript-analyzer.ts      # Analyze conversation patterns
│   ├── flow-generator.ts           # Generate flow diagrams
│   ├── prompt-generator.ts         # Generate system prompts
│   ├── improvement-suggester.ts    # Suggest improvements
│   └── routes/
│       ├── upload.ts               # Upload & transcribe endpoints
│       └── generate.ts             # Generation endpoints
├── Dockerfile
├── package.json
└── tsconfig.json
```

## AI Models Used

- **Google Gemini 1.5 Pro**: Complex analysis, flow generation, prompt generation
- **Google Gemini 1.5 Flash**: Quick insights, optimization, validation rules
- **Azure OpenAI Whisper**: Audio transcription

## Features in Detail

### Transcript Analysis
- Identifies conversation stages (greeting, information gathering, confirmation, etc.)
- Extracts data fields with types and validation needs
- Analyzes conversation style and tone
- Captures domain knowledge and terminology
- Identifies business rules and decision logic

### Flow Generation
- Creates node-based flow diagrams
- Supports multiple node types (start, message, input, condition, action, end)
- Auto-positions nodes for readability
- Includes branching logic and validation
- Optimizes flow for efficiency

### Prompt Generation
- Generates comprehensive system prompts
- Includes personality traits and guidelines
- Provides response templates
- Defines error handling strategies
- Lists context variables to track

### Improvement Suggestions
- Analyzes conversation analytics
- Identifies drop-off points and errors
- Suggests flow improvements
- Provides implementation guidance
- Prioritizes by impact

## Bootstrap Learning

The service learns from past conversations to improve future bot designs:
1. Analyzes completed conversations
2. Identifies common patterns and issues
3. Suggests flow modifications
4. Generates validation rules based on real errors
5. Optimizes conversation paths

## License

MIT
