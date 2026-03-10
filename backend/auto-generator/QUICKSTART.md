# Quick Start Guide

Get the Auto-Generator Service up and running in 5 minutes.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Google Gemini API key
- Azure OpenAI API key (for Whisper transcription)

## Step 1: Install Dependencies

```bash
cd /home/marcinlojek/hackathon/backend/auto-generator
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
PORT=3003
DATABASE_URL=postgresql://user:password@localhost:5432/voicebot
GEMINI_API_KEY=your_gemini_api_key_here
AZURE_WHISPER_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/whisper/audio/transcriptions?api-version=2024-02-01
AZURE_WHISPER_API_KEY=your_azure_openai_api_key
```

## Step 3: Set Up Database

```bash
# Connect to your PostgreSQL database
psql -U postgres -d voicebot

# Run the schema
\i database.sql

# Exit
\q
```

Or using Docker:

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=voicebot \
  -p 5432:5432 \
  postgres:15-alpine

# Wait a few seconds, then:
psql -U postgres -h localhost -d voicebot -f database.sql
```

## Step 4: Run the Service

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

Docker:

```bash
docker build -t auto-generator .
docker run -p 3003:3003 --env-file .env auto-generator
```

## Step 5: Test It Out

### Option A: Use the Example Script

```bash
./example-usage.sh
```

This will:
1. Upload a sample transcript
2. Run the full generation wizard
3. Save all generated artifacts to files
4. Show you the complete workflow

### Option B: Manual Testing

1. **Check health:**
```bash
curl http://localhost:3003/health
```

2. **Upload a transcript:**
```bash
curl -X POST http://localhost:3003/api/upload/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Agent: Hello! Customer: Hi, I need help.",
    "description": "Test call"
  }'
```

3. **Run the wizard (replace :id with the transcript ID from step 2):**
```bash
curl -X POST http://localhost:3003/api/generate/wizard/:id \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "My Bot",
    "optimize": true
  }'
```

### Option C: Upload Audio File

If you have an audio recording:

```bash
./test-audio-upload.sh /path/to/your/recording.wav
```

Or manually:

```bash
curl -X POST http://localhost:3003/api/upload/transcribe \
  -F "audio=@recording.wav" \
  -F "description=Customer call"
```

## What You Get

After running the wizard, you'll receive:

1. **Conversation Pattern Analysis**
   - Stages identified (greeting, data collection, confirmation, etc.)
   - Data fields to collect
   - Conversation style and tone
   - Domain knowledge

2. **Flow Diagram**
   - Node-based flow structure
   - Ready to import into flow editors
   - Optimized conversation paths

3. **System Prompt**
   - Complete bot personality
   - Response templates
   - Error handling instructions
   - Conversation guidelines

4. **Validation Rules**
   - Field-specific validation
   - Error messages
   - Allowed values

## Example Output Files

After running the example script, check these files:

- `pattern.json` - Conversation pattern analysis
- `flow.json` - Flow diagram structure
- `system-prompt.json` - System prompt object
- `formatted-prompt.txt` - Ready-to-use prompt text
- `validation-rules.json` - Validation rules

## Next Steps

1. **Upload Real Recordings**: Use actual call recordings for better results
2. **Deploy Your Bot**: Use the generated flow and prompt in your bot platform
3. **Analyze Improvements**: After collecting conversation data, use the improvements endpoint:

```bash
curl -X POST http://localhost:3003/api/generate/improvements/1 \
  -H "Content-Type: application/json" \
  -d '{"includeFlow": true, "includePrompt": true}'
```

4. **Iterate**: Upload more recordings, compare flows, and continuously improve

## Troubleshooting

### Port already in use
Change the PORT in `.env` to something else (e.g., 3004)

### Database connection error
- Check your DATABASE_URL
- Ensure PostgreSQL is running
- Verify the database exists

### Gemini API errors
- Verify your GEMINI_API_KEY is correct
- Check your API quota
- Ensure you have Gemini 1.5 Pro access

### Azure Whisper errors
- Verify your AZURE_WHISPER_ENDPOINT URL
- Check your AZURE_WHISPER_API_KEY
- Ensure your deployment name is correct in the URL
- Supported audio formats: WAV, MP3, M4A, WebM (max 25MB)

## API Documentation

Full API docs: See README.md

Quick reference:
- `POST /api/upload/transcribe` - Upload audio file
- `POST /api/upload/transcript` - Upload text transcript
- `POST /api/generate/wizard/:id` - Full auto-generation
- `POST /api/generate/improvements/:projectId` - Suggest improvements
- `GET /api/upload/transcripts` - List all transcripts
- `GET /health` - Health check

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify your environment variables
3. Ensure all prerequisites are met
4. Review the README.md for detailed documentation

## Advanced Usage

### Custom Flow Generation

```bash
curl -X POST http://localhost:3003/api/generate/flow/:transcriptId \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "My Custom Bot",
    "optimize": true
  }'
```

### Custom Prompt Generation

```bash
curl -X POST http://localhost:3003/api/generate/prompt/:transcriptId \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "My Custom Bot",
    "includeValidation": true
  }'
```

### Compare Flow Versions

```bash
curl -X POST http://localhost:3003/api/generate/compare-flows \
  -H "Content-Type: application/json" \
  -d '{
    "oldFlowId": 1,
    "newFlowId": 2
  }'
```

## Docker Compose Integration

To add this service to your existing docker-compose.yml:

```yaml
  auto-generator:
    build: ./backend/auto-generator
    ports:
      - "3003:3003"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/voicebot
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - AZURE_WHISPER_ENDPOINT=${AZURE_WHISPER_ENDPOINT}
      - AZURE_WHISPER_API_KEY=${AZURE_WHISPER_API_KEY}
    depends_on:
      - db
```

See `docker-compose.example.yml` for a complete example.

---

**Ready to automate bot creation?** Run `./example-usage.sh` to see it in action!
