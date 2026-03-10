# Voice App Frontend

The main client-facing voice interface where users interact with the AI voicebot.

## Features

- **LiveKit Voice Integration** - Real-time voice communication with microphone permissions
- **Real-time Transcript Display** - Live conversation transcript with auto-scroll
- **Session Controls** - Start/Stop/Escalate buttons with state management
- **Language Toggle** - Switch between Polish and English
- **Modern UI** - Clean interface built with React, TypeScript, and TailwindCSS
- **WebSocket Updates** - Real-time session status and transcript updates

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **LiveKit Client** - WebRTC voice communication
- **@livekit/components-react** - LiveKit React components
- **Axios** - API client

## Project Structure

```
src/
├── components/          # React components
│   ├── VoiceControls.tsx       # Start/Stop/Escalate buttons
│   ├── TranscriptDisplay.tsx   # Real-time transcript viewer
│   └── SessionStatus.tsx       # Status indicator
├── hooks/              # Custom React hooks
│   ├── useLiveKit.ts           # LiveKit connection management
│   └── useWebSocket.ts         # WebSocket connection for updates
├── services/           # API and external services
│   └── api.ts                  # Backend API client
├── styles/             # Global styles
│   └── globals.css             # TailwindCSS + custom styles
├── App.tsx             # Main application component
├── main.tsx            # React entry point
└── vite-env.d.ts       # TypeScript environment types
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (optional):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your backend URLs:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   App will be available at http://localhost:5173

## Docker

**Build image**:
```bash
docker build -t voice-app .
```

**Run container**:
```bash
docker run -p 5173:5173 voice-app
```

## Usage

1. **Select Language** - Choose English or Polish (only when idle)
2. **Start Session** - Click "Start Session" to begin voice interaction
3. **Grant Microphone Access** - Allow microphone permissions when prompted
4. **Speak Naturally** - The AI assistant will respond in real-time
5. **View Transcript** - See the conversation in the transcript panel
6. **Escalate if Needed** - Click "Connect to Consultant" for human assistance
7. **End Session** - Click "End Session" when finished

## Components

### VoiceControls
Main control panel with session management buttons:
- Start/Stop session
- Microphone toggle
- Escalation to human consultant
- Connection status indicator

### TranscriptDisplay
Real-time conversation transcript:
- Auto-scrolling message display
- User/Assistant message differentiation
- Timestamp for each message
- Copy transcript functionality

### SessionStatus
Visual indicator of current session state:
- Idle, Connecting, Active, Escalated, Completed, Error
- Color-coded status badges with animations

## Hooks

### useLiveKit
Manages LiveKit connection and audio:
- Room connection/disconnection
- Microphone permissions
- Audio track management
- Error handling and reconnection

### useWebSocket
Handles WebSocket communication:
- Real-time transcript updates
- Session status changes
- Automatic reconnection
- Message queue management

## API Integration

The app communicates with the backend via:

1. **REST API** (`/services/api.ts`)
   - `POST /sessions` - Create new session
   - `GET /sessions/:id` - Get session status
   - `POST /sessions/:id/end` - End session
   - `POST /sessions/:id/escalate` - Escalate to human

2. **WebSocket** (`/ws/:sessionId`)
   - Real-time transcript updates
   - Session status notifications
   - Escalation events

## Development

**Build for production**:
```bash
npm run build
```

**Preview production build**:
```bash
npm run preview
```

**Lint code**:
```bash
npm run lint
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Requirements**:
- Microphone access
- WebRTC support
- WebSocket support

## Troubleshooting

**Microphone not working**:
- Check browser permissions
- Ensure HTTPS in production
- Verify microphone hardware

**Connection issues**:
- Check backend API is running
- Verify CORS settings
- Check LiveKit server status

**No audio from assistant**:
- Check browser audio permissions
- Verify WebRTC connection
- Check LiveKit track subscriptions

## License

MIT
