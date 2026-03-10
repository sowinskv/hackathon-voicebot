# Voicebot Engine

The core conversational AI engine that handles real-time voice interactions through LiveKit, integrating STT (Azure Whisper), LLM (Gemini 2.5 Flash), and TTS (ElevenLabs).

## Features

- **LiveKit Integration**: Join rooms as an agent participant and handle real-time audio
- **Speech-to-Text**: Azure Whisper for accurate transcription
- **LLM Processing**: Gemini 2.5 Flash for intelligent conversation flow
- **Text-to-Speech**: ElevenLabs for natural-sounding responses
- **Slot Filling**: Dynamic information collection based on flow definitions
- **Safety Guardrails**: Profanity filtering, prompt injection detection, content moderation
- **Rate Limiting**: Time limits (10 min), retry limits (3 attempts), turn limits
- **Cost Tracking**: Real-time API usage and cost monitoring
- **Escalation Handling**: Detect and handle requests to speak with human consultants

## Architecture

```
voicebot-engine/
├── src/
│   ├── index.ts                 # Main service entry point
│   ├── db.ts                    # Database connection and queries
│   ├── livekit/
│   │   └── agent.ts            # LiveKit agent implementation
│   ├── conversation/
│   │   ├── engine.ts           # Main conversation orchestrator
│   │   ├── state-manager.ts   # Conversation state tracking
│   │   └── slot-filler.ts     # Slot filling logic
│   ├── integrations/
│   │   ├── stt.ts             # Azure Whisper STT
│   │   ├── tts.ts             # ElevenLabs TTS
│   │   └── llm.ts             # Gemini integration
│   ├── safety/
│   │   ├── guardrails.ts      # Content safety checks
│   │   └── limiter.ts         # Rate limiting
│   └── utils/
│       └── cost-tracker.ts    # Cost tracking
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see `.env.example`):
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Build:
```bash
npm run build
```

4. Run:
```bash
npm start
```

## Usage

The voicebot engine exposes a WebSocket server on port 3000 (configurable via `PORT` env var).

### Join a Room

Send a WebSocket message to initiate the bot:

```json
{
  "type": "join_room",
  "roomName": "consultation-12345",
  "sessionId": "session-uuid",
  "flowId": "flow-uuid"
}
```

### Events

The bot emits the following events:

- `agent_joined`: Bot successfully joined the room
- `agent_disconnected`: Bot left the room
- `error`: An error occurred

## Conversation Flow

1. **Initialization**: Bot joins LiveKit room and loads flow definition
2. **Greeting**: Bot sends initial greeting message
3. **Slot Filling Loop**:
   - Listen to user audio
   - Transcribe with Azure Whisper
   - Extract slot values using Gemini
   - Generate contextual response
   - Synthesize with ElevenLabs
   - Publish audio to LiveKit
4. **Completion**: All required slots filled or escalation requested
5. **Cleanup**: Save transcript, update session status, disconnect

## Safety & Limits

- **Time Limit**: 10 minutes maximum per conversation
- **Retry Limit**: 3 attempts per slot
- **Turn Limit**: 50 conversation turns maximum
- **Rate Limiting**: 20 requests per minute per session
- **Content Moderation**: Profanity detection, prompt injection prevention
- **PII Detection**: Automatic detection of sensitive information

## Cost Tracking

The engine tracks costs in real-time:

- **STT**: ~$0.006 per minute of audio
- **TTS**: ~$0.30 per 1M characters
- **LLM**: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens

View cost summary in logs after each conversation.

## API Integration

### Azure Whisper STT

Requires:
- `AZURE_WHISPER_ENDPOINT`
- `AZURE_WHISPER_KEY`

### ElevenLabs TTS

Requires:
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID` (optional, defaults to Sarah voice)

### Gemini 2.5 Flash

Requires:
- `GEMINI_API_KEY`

### LiveKit

Requires:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

## Database Schema

The engine expects the following PostgreSQL tables:

- `flows`: Flow definitions with slots
- `sessions`: Session tracking
- `transcripts`: Conversation transcripts

See the database service for schema details.

## Development

```bash
# Watch mode
npm run watch

# Development with auto-restart
npm run dev
```

## Docker

Build and run:

```bash
docker build -t voicebot-engine .
docker run -p 3000:3000 --env-file .env voicebot-engine
```

## Troubleshooting

- **Audio not playing**: Check LiveKit track publication
- **Transcription errors**: Verify Azure Whisper endpoint and API key
- **TTS failures**: Check ElevenLabs API key and quota
- **LLM timeouts**: Increase timeout or reduce context size
- **High costs**: Review cost tracker logs and optimize prompts
