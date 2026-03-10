# Agent Console - Voice AI Dashboard

A modern, professional React dashboard for consultants/agents to view and manage escalated customer service cases from the Voice AI system.

## Features

- **Real-time Dashboard** - Key metrics and KPIs at a glance
- **Session Management** - Browse, filter, and search all customer sessions
- **Detailed Session View** - Full transcript, audio playback, collected data
- **Case Resolution** - Mark escalated cases as resolved with notes
- **Real-time Notifications** - WebSocket-based notifications for new escalations
- **Advanced Filtering** - Filter by status (active, completed, escalated, resolved)
- **Search Functionality** - Search by session ID, client name, phone, or email
- **Audio Playback** - Built-in audio player for call recordings
- **Notes Editor** - Add and edit consultant notes for each session

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **TailwindCSS** - Styling
- **Recharts** - Data visualization (ready for charts)
- **date-fns** - Date formatting

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (optional)

### Installation

1. Clone the repository and navigate to the project:

```bash
cd /home/marcinlojek/hackathon/frontend/agent-console
```

2. Copy the environment example:

```bash
cp .env.example .env
```

3. Update `.env` with your API endpoint:

```env
VITE_API_BASE_URL=http://localhost:8000
```

4. Install dependencies:

```bash
npm install
```

5. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Docker Setup

Build and run with Docker:

```bash
docker build -t agent-console .
docker run -p 5173:5173 -v $(pwd):/app agent-console
```

Or use with docker-compose:

```yaml
version: '3.8'

services:
  agent-console:
    build: ./frontend/agent-console
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/agent-console:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=http://api:8000
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AudioPlayer.tsx
│   ├── DataFieldsDisplay.tsx
│   ├── MetricsWidget.tsx
│   ├── NotesEditor.tsx
│   ├── NotificationBell.tsx
│   ├── SessionCard.tsx
│   ├── StatusFilter.tsx
│   └── TranscriptViewer.tsx
├── hooks/               # Custom React hooks
│   ├── useSessions.ts
│   └── useWebSocket.ts
├── pages/               # Page components
│   ├── Dashboard.tsx
│   ├── SessionDetail.tsx
│   └── SessionList.tsx
├── services/            # API and external services
│   └── api.ts
├── styles/              # Global styles
│   └── globals.css
├── App.tsx              # Main app component
└── main.tsx             # Entry point
```

## API Integration

The application expects a backend API with the following endpoints:

### Sessions
- `GET /api/sessions` - List all sessions (with filters)
- `GET /api/sessions/:id` - Get session details
- `PATCH /api/sessions/:id/status` - Update session status
- `PATCH /api/sessions/:id/notes` - Update agent notes
- `POST /api/sessions/:id/resolve` - Mark session as resolved

### Metrics
- `GET /api/metrics` - Get dashboard metrics

### WebSocket
- `WS /ws` - Real-time updates for new escalations and session changes

## Usage

### Dashboard
The dashboard shows key metrics:
- Total sessions
- Active sessions count
- Escalation rate
- Average satisfaction score
- Recent escalations list

### Sessions List
Browse all sessions with:
- Status filters (all, active, escalated, completed, resolved)
- Search by session ID, name, phone, or email
- Real-time updates via WebSocket
- Click any session to view details

### Session Detail
View comprehensive session information:
- Full conversation transcript
- Audio recording playback
- All collected data fields
- Client information
- Session metadata
- Add/edit consultant notes
- Mark escalated cases as resolved

## Development

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
