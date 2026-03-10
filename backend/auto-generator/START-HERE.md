# START HERE - Auto-Generator Service

## What is This?

The **Auto-Generator Service** automatically creates voice bot configurations from call recordings. It's an AI-powered tool that analyzes conversations and generates:

- **Flow Diagrams** - Complete conversation flows with decision points
- **System Prompts** - Bot personality and behavior instructions  
- **Validation Rules** - Data validation logic
- **Improvement Suggestions** - AI recommendations based on analytics

## Quick Start (2 Minutes)

### 1. Prerequisites
You need:
- Node.js 20+
- PostgreSQL database
- Google Gemini API key ([Get one here](https://makersuite.google.com/))
- Azure OpenAI API key ([Get one here](https://portal.azure.com/))

### 2. Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your API keys

# Setup database
psql -U postgres -d voicebot -f database.sql

# Start the service
npm run dev
```

### 3. Test It

```bash
# Run the example workflow
./example-usage.sh
```

This will:
1. Upload a sample transcript
2. Generate a complete bot configuration
3. Save all artifacts to files

## What You Get

After running the wizard, you'll have:

1. **Conversation Analysis** (`pattern.json`)
   - Identified conversation stages
   - Data fields to collect
   - Conversation style analysis
   - Domain knowledge

2. **Flow Diagram** (`flow.json`)
   - Node-based conversation flow
   - Decision points
   - Optimized paths

3. **System Prompt** (`system-prompt.json` & `formatted-prompt.txt`)
   - Complete bot personality
   - Response templates
   - Error handling

4. **Validation Rules** (`validation-rules.json`)
   - Field validation
   - Error messages
   - Allowed values

## How to Use

### Upload a Recording

```bash
./test-audio-upload.sh your-recording.wav
```

### Or Upload Text Transcript

```bash
curl -X POST http://localhost:3003/api/upload/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Your conversation transcript here..."
  }'
```

### Generate Everything

```bash
curl -X POST http://localhost:3003/api/generate/wizard/1 \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "My Bot",
    "optimize": true
  }'
```

## Documentation

- **QUICKSTART.md** - Detailed setup guide
- **README.md** - Complete API documentation
- **SERVICE-OVERVIEW.md** - Architecture and features
- **DEPLOYMENT-CHECKLIST.md** - Production deployment guide

## Example Output

After generating, you'll see files like:

```
pattern.json            # Conversation pattern analysis
flow.json              # Flow diagram structure
system-prompt.json     # System prompt configuration
formatted-prompt.txt   # Ready-to-use prompt
validation-rules.json  # Validation rules
```

## API Endpoints

- **POST** `/api/upload/transcribe` - Upload audio file
- **POST** `/api/upload/transcript` - Upload text
- **POST** `/api/generate/wizard/:id` - Full generation
- **POST** `/api/generate/improvements/:projectId` - Suggest improvements
- **GET** `/health` - Health check

See **README.md** for complete API documentation.

## Common Use Cases

### 1. Rapid Prototyping
Upload one call recording → Get a working bot configuration in minutes

### 2. Bot Migration  
Convert existing call scripts → Automated bot flows

### 3. Continuous Improvement
Analyze conversation data → Get improvement suggestions

### 4. A/B Testing
Compare different flows → Optimize conversation paths

## Technology

- **Node.js + TypeScript** - Server runtime
- **Express.js** - Web framework
- **Google Gemini 1.5 Pro** - AI analysis
- **Azure OpenAI Whisper** - Audio transcription
- **PostgreSQL** - Database

## Project Structure

```
auto-generator/
├── src/
│   ├── index.ts                    # Main server
│   ├── db.ts                       # Database
│   ├── transcript-analyzer.ts      # AI analysis
│   ├── flow-generator.ts           # Flow generation
│   ├── prompt-generator.ts         # Prompt generation
│   ├── improvement-suggester.ts    # Improvements
│   └── routes/
│       ├── upload.ts               # Upload endpoints
│       └── generate.ts             # Generation endpoints
├── Dockerfile                       # Docker container
├── database.sql                     # Database schema
├── example-usage.sh                 # Test script
└── [documentation]
```

## Getting Help

1. **Setup Issues?** → See QUICKSTART.md
2. **API Questions?** → See README.md
3. **Deployment?** → See DEPLOYMENT-CHECKLIST.md
4. **Architecture?** → See SERVICE-OVERVIEW.md

## Next Steps

1. ✅ Run `./example-usage.sh` to see it in action
2. ✅ Review the generated files
3. ✅ Upload your own call recordings
4. ✅ Deploy to production (see DEPLOYMENT-CHECKLIST.md)
5. ✅ Integrate with your bot platform

## Features Checklist

- ✅ Audio file upload (WAV, MP3, M4A, WebM)
- ✅ Azure Whisper transcription
- ✅ AI conversation analysis
- ✅ Flow diagram generation
- ✅ System prompt generation
- ✅ Validation rules
- ✅ Improvement suggestions
- ✅ Flow comparison
- ✅ Full generation wizard
- ✅ Docker support
- ✅ Production-ready

## Requirements

- Node.js 20+
- PostgreSQL 15+
- 2GB RAM minimum
- Google Gemini API access
- Azure OpenAI API access (for audio transcription)

## Support

- Documentation: See README.md, QUICKSTART.md
- Examples: Run example-usage.sh
- API Testing: Import postman-collection.json

---

**Ready to start?** Run `./example-usage.sh` now!

**Need help?** Check QUICKSTART.md for detailed instructions.

**Production deployment?** See DEPLOYMENT-CHECKLIST.md.
