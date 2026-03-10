# Agent Console - Quick Reference Card

## Essential Commands

```bash
# Setup
npm install                    # Install dependencies
cp .env.example .env          # Copy environment template

# Development
npm run dev                   # Start dev server (http://localhost:5173)
npm run build                 # Build for production
npm run preview               # Preview production build
npm run lint                  # Run ESLint

# Docker
docker build -t agent-console .
docker run -p 5173:5173 agent-console
```

## Project Structure at a Glance

```
src/
├── App.tsx                   Main app with routing & navigation
├── main.tsx                  React entry point
│
├── pages/                    3 route components
│   ├── Dashboard.tsx         / (metrics & overview)
│   ├── SessionList.tsx       /sessions (list with filters)
│   └── SessionDetail.tsx     /sessions/:id (full detail view)
│
├── components/               8 reusable components
│   ├── MetricsWidget         KPI cards
│   ├── SessionCard           Session previews
│   ├── StatusFilter          Filter buttons
│   ├── NotificationBell      Real-time alerts
│   ├── TranscriptViewer      Chat display
│   ├── AudioPlayer           Audio controls
│   ├── DataFieldsDisplay     Data grid
│   └── NotesEditor           Notes editing
│
├── hooks/                    2 custom hooks
│   ├── useSessions           Session data fetching
│   └── useWebSocket          Real-time updates
│
├── services/                 1 API client
│   └── api.ts                REST & WebSocket client
│
└── styles/
    └── globals.css           Global styles + Tailwind
```

## Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Dashboard | Metrics & recent escalations |
| `/sessions` | SessionList | Browse all sessions |
| `/sessions/:id` | SessionDetail | View session details |

## API Endpoints Expected

```typescript
GET    /api/sessions              // List sessions
GET    /api/sessions/:id          // Get session
PATCH  /api/sessions/:id/status   // Update status
PATCH  /api/sessions/:id/notes    // Update notes
POST   /api/sessions/:id/resolve  // Mark resolved
GET    /api/metrics               // Dashboard metrics
WS     /ws                        // Real-time updates
```

## Key Components Props

### MetricsWidget
```typescript
{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}
```

### SessionCard
```typescript
{
  session: Session;
  onClick: () => void;
}
```

### TranscriptViewer
```typescript
{
  transcript: Array<{
    speaker: 'agent' | 'client';
    text: string;
    timestamp: string;
  }>;
}
```

### AudioPlayer
```typescript
{
  audioUrl: string;
}
```

### NotesEditor
```typescript
{
  initialNotes?: string;
  onSave: (notes: string) => Promise<void>;
  readOnly?: boolean;
}
```

## Hooks Usage

### useSessions
```typescript
const {
  sessions,      // Session[]
  loading,       // boolean
  error,         // string | null
  refresh,       // () => void
  updateSession, // (session: Session) => void
  addSession     // (session: Session) => void
} = useSessions(status, search);
```

### useSession
```typescript
const {
  session,       // Session | null
  loading,       // boolean
  error,         // string | null
  refresh,       // () => void
  markResolved,  // (notes?: string) => Promise<Session>
  updateNotes    // (notes: string) => Promise<Session>
} = useSession(sessionId);
```

### useWebSocket
```typescript
const {
  connected      // boolean
} = useWebSocket((message: WebSocketMessage) => {
  // Handle: 'session_update' | 'new_escalation' | 'session_completed'
});
```

## Session Status Values

- `active` - Session in progress
- `completed` - Session finished normally
- `escalated` - Requires human intervention
- `resolved` - Escalation handled

## Status Badge Styles

```typescript
const statusColors = {
  active: 'badge-info',      // Blue
  completed: 'badge-success', // Green
  escalated: 'badge-danger',  // Red
  resolved: 'badge-gray'      // Gray
};
```

## Tailwind Utility Classes

```css
/* Buttons */
.btn-primary      /* Blue button */
.btn-secondary    /* Gray button */
.btn-success      /* Green button */

/* Badges */
.badge-success    /* Green badge */
.badge-warning    /* Yellow badge */
.badge-danger     /* Red badge */
.badge-info       /* Blue badge */
.badge-gray       /* Gray badge */

/* Card */
.card             /* White card with shadow */

/* Input */
.input-field      /* Styled input/textarea */
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000
```

## WebSocket Message Types

```typescript
// Session updated
{
  type: 'session_update',
  data: Session
}

// New escalation
{
  type: 'new_escalation',
  data: Session
}

// Session completed
{
  type: 'session_completed',
  data: Session
}
```

## Common Patterns

### Fetching Sessions with Filters
```typescript
const { sessions } = useSessions('escalated', '');
```

### Handling WebSocket Updates
```typescript
useWebSocket((message) => {
  if (message.type === 'new_escalation') {
    // Handle new escalation
  }
});
```

### Formatting Dates
```typescript
import { formatDistanceToNow } from 'date-fns';
formatDistanceToNow(new Date(timestamp), { addSuffix: true });
```

### Navigating Programmatically
```typescript
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate(`/sessions/${sessionId}`);
```

## Debugging Tips

1. **API Issues**: Check browser Network tab for failed requests
2. **WebSocket**: Look for WS connection in Network tab
3. **State Issues**: Use React DevTools to inspect component state
4. **Type Errors**: Run `npx tsc --noEmit` to check TypeScript
5. **Styling Issues**: Inspect element and check Tailwind classes

## File Locations Quick Access

| Need | File |
|------|------|
| Add new route | `src/App.tsx` |
| Add API endpoint | `src/services/api.ts` |
| New component | `src/components/` |
| New page | `src/pages/` |
| Custom hook | `src/hooks/` |
| Global styles | `src/styles/globals.css` |
| Tailwind config | `tailwind.config.js` |
| TypeScript types | `src/services/api.ts` |

## Build Output

```bash
npm run build
# → dist/
#    ├── index.html
#    ├── assets/
#    │   ├── index-[hash].js
#    │   └── index-[hash].css
#    └── ...
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port in use | Change port: `npm run dev -- --port 3000` |
| Build fails | Clear cache: `rm -rf node_modules/.vite` |
| Types error | Reinstall: `rm -rf node_modules && npm install` |
| WebSocket fails | Check backend URL in `.env` |
| CORS error | Configure backend CORS headers |

## Performance Tips

- Sessions list auto-debounces search (500ms)
- Metrics auto-refresh every 30s
- WebSocket auto-reconnects every 5s
- Use React DevTools Profiler for optimization

## Documentation Files

- `README.md` - Full feature documentation
- `ARCHITECTURE.md` - System design & architecture
- `QUICKSTART.md` - Step-by-step setup guide
- `FILE_MANIFEST.md` - Complete file listing
- `SUMMARY.txt` - Project overview
- `QUICK_REFERENCE.md` - This file

## Support

Check documentation files for detailed information about:
- Setup and installation
- Feature descriptions
- API integration
- Deployment options
- Architecture details

---

**Version**: 1.0.0
**Last Updated**: 2026-03-10
**Tech Stack**: React 18 + TypeScript + Vite + TailwindCSS
