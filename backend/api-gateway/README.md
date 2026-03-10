# API Gateway Service

Main backend API service that handles session management, flow management, analytics, and real-time WebSocket connections.

## Features

- **Session Management**: Full CRUD operations for sessions
- **Flow Management**: Full CRUD operations for flows
- **Analytics**: Comprehensive analytics endpoints for monitoring
- **LiveKit Integration**: Token generation for LiveKit rooms
- **WebSocket Support**: Real-time updates for session changes
- **Error Handling**: Comprehensive error handling middleware
- **CORS Support**: Configurable CORS for frontend integration

## Tech Stack

- Node.js with TypeScript
- Express.js
- PostgreSQL (via pg)
- WebSocket (via ws)
- LiveKit Server SDK
- Docker

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- LiveKit server (optional, for video features)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hackathon
DB_USER=postgres
DB_PASSWORD=postgres
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

### Docker

Build and run with Docker:

```bash
docker build -t api-gateway .
docker run -p 3000:3000 --env-file .env api-gateway
```

## API Endpoints

### Sessions

- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get single session
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/:id/transcript` - Get session transcript

### Flows

- `GET /api/flows` - List all flows
- `GET /api/flows/:id` - Get single flow
- `POST /api/flows` - Create new flow
- `PUT /api/flows/:id` - Update flow
- `DELETE /api/flows/:id` - Delete flow
- `GET /api/flows/:id/sessions` - Get all sessions for a flow

### Analytics

- `GET /api/analytics/overview` - Overview statistics
- `GET /api/analytics/sessions/status` - Session status breakdown
- `GET /api/analytics/sessions/timeline` - Session timeline
- `GET /api/analytics/flows/usage` - Flow usage statistics
- `GET /api/analytics/sessions/duration` - Session duration stats
- `GET /api/analytics/sessions/recent` - Recent sessions
- `GET /api/analytics/transcripts/stats` - Transcript statistics

### LiveKit

- `POST /api/livekit/token` - Generate participant token
- `POST /api/livekit/token/agent` - Generate agent token
- `GET /api/livekit/config` - Get LiveKit configuration

### Health & Info

- `GET /health` - Health check endpoint
- `GET /` - API information

## WebSocket

Connect to WebSocket at `ws://localhost:3000/ws`

### Message Types

**Client → Server:**

```json
{
  "type": "subscribe",
  "channels": ["sessions", "flows", "analytics"]
}
```

```json
{
  "type": "ping"
}
```

**Server → Client:**

```json
{
  "type": "session_created",
  "channel": "sessions",
  "session": { ... }
}
```

```json
{
  "type": "session_updated",
  "channel": "sessions",
  "session": { ... }
}
```

```json
{
  "type": "session_deleted",
  "channel": "sessions",
  "sessionId": "uuid"
}
```

## Database Schema

The service expects the following tables:

- `sessions` - Session records
- `flows` - Flow configurations
- `transcripts` - Session transcripts

Refer to the database migration service for schema setup.

## Architecture

```
src/
├── index.ts              # Main server setup
├── db.ts                 # Database connection pool
├── middleware/
│   └── error.ts          # Error handling middleware
├── routes/
│   ├── sessions.ts       # Session endpoints
│   ├── flows.ts          # Flow endpoints
│   ├── analytics.ts      # Analytics endpoints
│   └── livekit.ts        # LiveKit token generation
└── websocket/
    └── handler.ts        # WebSocket server
```

## License

MIT
