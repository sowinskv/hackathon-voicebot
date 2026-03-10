# Auto-Generator Service - Complete Overview

## What It Does

The Auto-Generator Service automatically creates voice bot configurations from call recordings. Upload an audio file or transcript, and it generates:

1. **Flow Diagrams** - Visual conversation flow with nodes and decision points
2. **System Prompts** - Complete bot personality and behavior instructions
3. **Validation Rules** - Data validation logic for collected information
4. **Improvement Suggestions** - AI-powered recommendations based on conversation data

## Key Features

### 1. Audio Transcription
- Upload WAV, MP3, M4A, or WebM files (up to 25MB)
- Automatic transcription using Azure OpenAI Whisper
- Supports manual transcript text upload

### 2. Conversation Analysis
- Identifies conversation stages (greeting, data collection, confirmation, closing)
- Extracts data fields and their types
- Analyzes conversation style, tone, and pace
- Captures domain-specific knowledge and terminology
- Identifies business rules and decision logic

### 3. Flow Generation
- Creates node-based flow diagrams
- Supports multiple node types:
  - **Start**: Entry point
  - **Message**: Bot speaks
  - **Input**: Collect user data
  - **Condition**: Decision branching
  - **Action**: Execute tasks
  - **End**: Conversation exit
- Auto-optimizes flow for efficiency
- Positions nodes for readability

### 4. Prompt Generation
- Creates comprehensive system prompts
- Includes personality traits and guidelines
- Provides response templates
- Defines error handling strategies
- Lists context variables to track

### 5. Validation Rules
- Generates field-specific validation
- Creates regex patterns
- Defines allowed values
- Provides user-friendly error messages

### 6. Bootstrap Learning (Improvement Suggestions)
- Analyzes past conversation data
- Identifies drop-off points
- Suggests flow optimizations
- Provides implementation guidance
- Prioritizes by impact

## Architecture

```
auto-generator/
├── src/
│   ├── index.ts                    # Express server with API endpoints
│   ├── db.ts                       # PostgreSQL connection pool
│   ├── transcript-analyzer.ts      # AI-powered conversation analysis
│   ├── flow-generator.ts           # Flow diagram generation
│   ├── prompt-generator.ts         # System prompt creation
│   ├── improvement-suggester.ts    # Improvement analytics
│   └── routes/
│       ├── upload.ts               # Upload & transcription endpoints
│       └── generate.ts             # Generation & analysis endpoints
├── Dockerfile                       # Production container
├── database.sql                     # Database schema
└── [config files]
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 |
| Language | TypeScript |
| Web Framework | Express.js |
| AI Models | Google Gemini 1.5 Pro/Flash |
| Transcription | Azure OpenAI Whisper |
| Database | PostgreSQL |
| File Upload | Multer |
| HTTP Client | Axios |

## API Endpoints Summary

### Upload Routes (`/api/upload/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/transcribe` | POST | Upload audio file and transcribe |
| `/transcript` | POST | Upload transcript text |
| `/transcripts` | GET | List all transcripts |
| `/transcripts/:id` | GET | Get single transcript |
| `/transcripts/:id` | DELETE | Delete transcript |

### Generation Routes (`/api/generate/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze/:id` | POST | Analyze conversation patterns |
| `/flow/:id` | POST | Generate flow diagram |
| `/prompt/:id` | POST | Generate system prompt |
| `/wizard/:id` | POST | Full auto-generation (all-in-one) |
| `/improvements/:projectId` | POST | Suggest improvements |
| `/compare-flows` | POST | Compare flow versions |
| `/history/:id` | GET | Get generation history |

## Typical Workflow

### Quick Start (1 API Call)

```bash
# 1. Upload transcript
curl -X POST http://localhost:3003/api/upload/transcript \
  -H "Content-Type: application/json" \
  -d '{"transcript": "your call transcript..."}'
# Response: {"transcriptId": 1}

# 2. Run wizard (generates everything)
curl -X POST http://localhost:3003/api/generate/wizard/1 \
  -H "Content-Type: application/json" \
  -d '{"projectName": "My Bot", "optimize": true}'
# Response: {pattern, flow, prompt, validationRules, ...}
```

### Detailed Workflow (Step-by-Step)

```bash
# 1. Upload audio file
curl -X POST http://localhost:3003/api/upload/transcribe \
  -F "audio=@recording.wav"

# 2. Analyze patterns
curl -X POST http://localhost:3003/api/generate/analyze/1

# 3. Generate flow
curl -X POST http://localhost:3003/api/generate/flow/1 \
  -d '{"projectName": "My Bot", "optimize": true}'

# 4. Generate prompt
curl -X POST http://localhost:3003/api/generate/prompt/1 \
  -d '{"includeValidation": true}'

# 5. Later: Suggest improvements
curl -X POST http://localhost:3003/api/generate/improvements/1 \
  -d '{"includeFlow": true, "includePrompt": true}'
```

## Database Schema

### Core Tables

1. **transcripts** - Uploaded transcripts
2. **transcript_analysis** - AI analysis results
3. **generated_flows** - Flow diagrams
4. **generated_prompts** - System prompts
5. **improvement_suggestions** - AI improvement recommendations

### Analytics Tables

6. **conversation_errors** - Error tracking
7. **conversation_feedback** - User feedback
8. **conversations** - Conversation logs
9. **messages** - Individual messages

See `database.sql` for complete schema.

## Environment Variables

```env
PORT=3003                           # Server port
DATABASE_URL=postgresql://...       # PostgreSQL connection
GEMINI_API_KEY=...                 # Google Gemini API key
AZURE_WHISPER_ENDPOINT=...         # Azure OpenAI endpoint
AZURE_WHISPER_API_KEY=...          # Azure OpenAI API key
NODE_ENV=production                # Environment
```

## Files Created

### Core Application Files
- ✅ **Dockerfile** - Production container definition
- ✅ **package.json** - Dependencies and scripts
- ✅ **tsconfig.json** - TypeScript configuration
- ✅ **src/index.ts** - Main Express server
- ✅ **src/db.ts** - Database connection
- ✅ **src/transcript-analyzer.ts** - AI conversation analysis
- ✅ **src/flow-generator.ts** - Flow diagram generation
- ✅ **src/prompt-generator.ts** - Prompt generation
- ✅ **src/improvement-suggester.ts** - Improvement analytics
- ✅ **src/routes/upload.ts** - Upload endpoints
- ✅ **src/routes/generate.ts** - Generation endpoints

### Configuration & Setup Files
- ✅ **.env.example** - Environment template
- ✅ **.gitignore** - Git ignore rules
- ✅ **.dockerignore** - Docker ignore rules
- ✅ **database.sql** - Database schema
- ✅ **docker-compose.example.yml** - Docker Compose example

### Documentation Files
- ✅ **README.md** - Complete documentation
- ✅ **QUICKSTART.md** - Quick start guide
- ✅ **SERVICE-OVERVIEW.md** - This file

### Testing & Examples
- ✅ **example-usage.sh** - Example workflow script
- ✅ **test-audio-upload.sh** - Audio upload test script
- ✅ **postman-collection.json** - Postman API collection

## Getting Started

### 1. Quick Test
```bash
./example-usage.sh
```

### 2. Development
```bash
npm install
npm run dev
```

### 3. Production
```bash
docker build -t auto-generator .
docker run -p 3003:3003 --env-file .env auto-generator
```

### 4. Full Documentation
See `QUICKSTART.md` for detailed setup instructions.

## Use Cases

### 1. Rapid Prototyping
Upload a single call recording and generate a working bot configuration in minutes.

### 2. Bot Migration
Convert existing call scripts or recordings into automated bot flows.

### 3. Continuous Improvement
Analyze conversation data to identify issues and generate improvement suggestions.

### 4. A/B Testing
Compare different flow versions to optimize conversation paths.

### 5. Training Data Generation
Create training datasets for voice bot development.

## AI Models

### Google Gemini 1.5 Pro
- **Used for**: Complex analysis, flow generation, prompt generation
- **Why**: Advanced reasoning, large context window
- **Endpoints**: `/analyze`, `/flow`, `/prompt`, `/wizard`

### Google Gemini 1.5 Flash
- **Used for**: Quick insights, optimization, validation rules
- **Why**: Fast responses, cost-effective
- **Endpoints**: Optimization and validation tasks

### Azure OpenAI Whisper
- **Used for**: Audio transcription
- **Why**: Accurate speech-to-text
- **Endpoint**: `/transcribe`

## Performance Considerations

- **Transcription**: 30-60 seconds per minute of audio
- **Analysis**: 10-30 seconds per transcript
- **Flow Generation**: 20-40 seconds
- **Prompt Generation**: 15-30 seconds
- **Full Wizard**: 60-120 seconds total

## Security Notes

- Audio files stored temporarily in `/tmp/uploads`
- Files deleted after transcription
- Database credentials in environment variables
- API keys never logged or exposed
- Input validation on all endpoints
- File size limits (25MB for audio)

## Scaling Recommendations

1. **Horizontal Scaling**: Multiple instances behind load balancer
2. **Database**: Connection pooling (configured)
3. **File Storage**: Use S3/Cloud Storage for audio files
4. **Caching**: Cache analysis results for repeat transcripts
5. **Rate Limiting**: Add rate limits for API endpoints

## Integration Points

### Input Sources
- Direct API calls
- Web upload interface
- Automated recording pipelines
- CRM systems
- Call center platforms

### Output Targets
- Bot platforms (Dialogflow, Rasa, etc.)
- Configuration management systems
- Version control
- Analytics platforms

## Monitoring & Observability

Built-in logging:
- Request/response logging
- Database query logging
- Error tracking
- Performance metrics

Recommended additions:
- Application Performance Monitoring (APM)
- Log aggregation (ELK, Splunk)
- Metrics (Prometheus, Grafana)
- Alerting (PagerDuty, Slack)

## Future Enhancements

Potential additions:
- Multi-language support
- Custom AI model fine-tuning
- Real-time transcription
- Visual flow editor integration
- Advanced analytics dashboard
- Sentiment analysis
- Speaker diarization
- Compliance checking

## Support & Maintenance

### Common Tasks

**View logs:**
```bash
docker logs auto-generator
```

**Database backup:**
```bash
pg_dump voicebot > backup.sql
```

**Update dependencies:**
```bash
npm update
```

**Rebuild:**
```bash
npm run build
```

## Contributing

To extend the service:

1. Add new analyzers in `src/`
2. Add new endpoints in `src/routes/`
3. Update database schema in `database.sql`
4. Add tests
5. Update documentation

## License

MIT License - See LICENSE file for details

---

**Version**: 1.0.0
**Last Updated**: 2026-03-10
**Port**: 3003
**Status**: Production Ready ✅
