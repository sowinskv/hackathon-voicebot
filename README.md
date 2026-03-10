# Next-Generation Call Center Solution

A complete AI-powered call center platform with voicebot automation, live consultant escalation, visual flow builder, and comprehensive analytics.

## 🎯 Overview

This system provides an end-to-end solution for handling customer service calls through an AI voicebot with seamless escalation to human consultants. Built specifically for insurance claims (OC damage reporting), but configurable for any use case.

### Key Features

- **🎙️ Voice App** - Web-based voice interface with LiveKit integration
- **🤖 Voicebot Engine** - AI conversation engine with STT, TTS, and LLM
- **👨‍💼 Agent Console** - Dashboard for consultants to manage escalated cases
- **🎨 Bot Builder** - No-code visual flow editor and prompt configurator
- **📊 Analytics** - Real-time metrics, cost tracking, and quality insights
- **🚀 Auto-Generator** - Generate flows from existing call recordings (BONUS)
- **🛡️ Safety Guardrails** - Content filtering, abuse detection, cost limits
- **🌍 Multi-language** - Polish and English support

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Voice App   │  │ Bot Builder  │  │ Agent Console    │  │
│  │  :5173       │  │    :5174     │  │     :5175        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATION LAYER                        │
│                   ┌────────────────┐                         │
│                   │    LiveKit     │                         │
│                   │  (Voice WebRTC)│                         │
│                   └────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ API Gateway  │  │   Voicebot   │  │   Escalation     │  │
│  │    :3000     │  │    Engine    │  │    Service       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                               │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │  Analytics   │  │    Auto-Generator (BONUS)            │ │
│  │   Service    │  │                                      │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   STT    │  │   TTS    │  │   LLM    │                  │
│  │ (Whisper)│  │(ElevenLab│  │ (Gemini) │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│              ┌────────────────────────┐                      │
│              │    PostgreSQL :5432    │                      │
│              └────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** (recommended)
- **Node.js 18+** and **npm** (for local development)
- **PostgreSQL 15+** (if not using Docker)
- **LiveKit Server** (cloud or self-hosted)

### 1. Clone and Configure

```bash
cd /home/marcinlojek/hackathon
cp .env .env.local  # Your API keys are already configured!
```

### 2. Configure LiveKit

You need to set up LiveKit (required for voice orchestration):

**Option A: Use LiveKit Cloud** (Easiest)
```bash
# Sign up at https://cloud.livekit.io
# Get your API key, secret, and URL
# Update .env with:
# LIVEKIT_API_KEY=your_key
# LIVEKIT_API_SECRET=your_secret
# LIVEKIT_URL=wss://your-project.livekit.cloud
```

**Option B: Self-host LiveKit**
```bash
# See: https://docs.livekit.io/deploy/
```

### 3. Start All Services

```bash
# Start everything with Docker Compose
docker-compose up --build

# Wait for all services to be healthy (30-60 seconds)
```

### 4. Access the Applications

- **Voice App**: http://localhost:5173 (Client interface)
- **Bot Builder**: http://localhost:5174 (Configure voicebot)
- **Agent Console**: http://localhost:5175 (Consultant dashboard)
- **API Gateway**: http://localhost:3000 (Backend API)

### 5. Test the System

1. Open **Bot Builder** (localhost:5174)
   - Default OC damage flow is already loaded
   - Customize if needed

2. Open **Voice App** (localhost:5173)
   - Select language (Polish or English)
   - Click "Start Session"
   - Allow microphone access
   - Start talking about a car accident

3. Open **Agent Console** (localhost:5175)
   - View active sessions
   - See escalations when user says "connect me to consultant"

## 📦 Services

### Frontend Applications

| Service | Port | Description |
|---------|------|-------------|
| **Voice App** | 5173 | Client-facing voice interface |
| **Bot Builder** | 5174 | No-code flow editor and prompt configurator |
| **Agent Console** | 5175 | Consultant dashboard for managing cases |

### Backend Services

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | Main REST API and WebSocket gateway |
| **Voicebot Engine** | - | Conversation engine with LiveKit agent |
| **Escalation Service** | - | Handles bot-to-human handoffs |
| **Analytics Service** | - | Metrics collection and aggregation |
| **Auto-Generator** | - | Generate flows from recordings (BONUS) |

### Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| **PostgreSQL** | 5432 | Main database |

## 📚 Documentation

- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - System architecture and design decisions
- [**API.md**](./docs/API.md) - Complete API documentation
- [**DEPLOYMENT.md**](./docs/DEPLOYMENT.md) - Production deployment guide
- [**FLOW_SPECIFICATION.md**](./docs/FLOW_SPECIFICATION.md) - Flow JSON format spec
- [**TROUBLESHOOTING.md**](./docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🔑 Environment Variables

See `.env` file (already configured with your API keys):

## 🛠️ Development

### Local Development (without Docker)

Each service can be run independently:

```bash
# Backend API Gateway
cd backend/api-gateway
npm install && npm run dev

# Voicebot Engine
cd backend/voicebot-engine
npm install && npm run dev

# Frontend Voice App
cd frontend/voice-app
npm install && npm run dev
```

### Build for Production

```bash
# Build all Docker images
docker-compose build

# Push to registry (if needed)
docker-compose push
```

## 🧪 Testing

### Manual Testing

Use the provided test scripts:

```bash
# Test API health
curl http://localhost:3000/health

# Test session creation
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"language": "en", "flowId": "default"}'
```

### End-to-End Testing

1. Start all services
2. Open Voice App
3. Complete a full conversation
4. Trigger escalation
5. View in Agent Console
6. Check Analytics dashboard

## 📊 Features Implemented

### Core Features (MVP)
- ✅ Web-based voice conversation with LiveKit
- ✅ Real-time STT (Azure Whisper Diarize)
- ✅ Natural TTS (ElevenLabs)
- ✅ AI conversation (Gemini 2.5 Flash)
- ✅ Structured data collection (OC damage report)
- ✅ Live transcription display
- ✅ Escalation to consultant
- ✅ Agent console with case management
- ✅ Polish and English support
- ✅ WebSocket real-time updates

### Platform Features
- ✅ Visual flow editor (React Flow)
- ✅ System prompt editor (Monaco)
- ✅ Required fields configurator
- ✅ Test mode
- ✅ Version management
- ✅ Session analytics dashboard

### Bonus Features
- ✅ **Cost Security**: 10-min time limits, 3 retry limits, rate limiting
- ✅ **Content Security**: Profanity filter, off-topic detection, prompt injection prevention
- ✅ **Data Quality**: Field validation, confirmation mechanism, quality gates
- ✅ **Fast Deployment**: Auto-generate flows from recordings
- ✅ **Observability**: Metrics, cost tracking, performance analytics
- ✅ **Safety**: Customer satisfaction tracking, abuse detection, tags

## 🎯 Demo Scenarios

### Scenario 1: Happy Path (Complete Session)
1. User starts session in Voice App
2. Voicebot greets and asks for policy number
3. User provides all required information
4. Voicebot confirms data
5. Session completes successfully
6. Satisfaction survey

### Scenario 2: Escalation
1. User starts session
2. User says "I want to speak to a human"
3. Voicebot creates escalation
4. Agent Console shows notification
5. Consultant reviews full context

### Scenario 3: Bot Configuration
1. Open Bot Builder
2. Edit system prompt
3. Modify flow (add/remove nodes)
4. Configure required fields
5. Test in test mode
6. Publish to production

## 🔒 Security & Safety

### Cost Protection
- Maximum session duration: 10 minutes
- Maximum retries per field: 3
- Rate limiting: 20 requests/minute
- Warning threshold: 3 strikes
- Emergency session termination

### Content Safety
- Profanity detection and filtering
- Off-topic conversation detection
- Prompt injection prevention
- Abuse pattern detection
- PII (Personally Identifiable Information) protection

### Data Quality
- Field type validation (email, phone, date formats)
- Required field enforcement
- Confirmation for critical data
- Quality gate before session completion
- Completeness checking

## 📈 Analytics & Monitoring

The system tracks:
- Session metrics (count, duration, status)
- Escalation rates and reasons
- Field completeness percentages
- API costs (STT, TTS, LLM usage)
- Customer satisfaction scores
- Performance bottlenecks
- Safety events and abuse patterns

## 🤝 Contributing

This project was built for a hackathon. For production use:

1. Add authentication/authorization
2. Implement proper logging (e.g., ELK stack)
3. Add monitoring (Prometheus, Grafana)
4. Set up CI/CD pipeline
5. Add comprehensive testing
6. Implement backup and disaster recovery
7. Add GDPR compliance measures

## 📝 License

This project is for hackathon/educational purposes. See individual service licenses for dependencies.

## 🆘 Troubleshooting

### Common Issues

**Services won't start**
```bash
# Check Docker logs
docker-compose logs -f

# Restart specific service
docker-compose restart api-gateway
```

**Database connection errors**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Reinitialize database
docker-compose down -v
docker-compose up -d postgres
```

**LiveKit connection issues**
- Verify LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in .env
- Check LiveKit server is accessible
- Test with LiveKit example apps first

**Microphone not working**
- Browser must use HTTPS or localhost
- Check browser permissions
- Try different browser (Chrome recommended)

**No audio from bot**
- Check ElevenLabs API key is valid
- Verify browser audio is not muted
- Check browser console for errors

For more help, see [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

## 📧 Support

Built by the Hive Mind Swarm for the hackathon.

**Key Technologies:**
- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- Voice: LiveKit
- AI: Gemini 2.5 Flash, Azure Whisper, ElevenLabs

---

**⚡ Ready to revolutionize call centers with AI!** 🚀
