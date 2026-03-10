# Agent Console Architecture

## Overview

The Agent Console is a React-based single-page application (SPA) designed for consultants to manage and monitor escalated Voice AI customer service cases. It features real-time updates, comprehensive session management, and a modern, professional UI.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Agent Console                         │
│                     (React + TypeScript)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │ Session List │  │Session Detail│      │
│  │    Page      │  │     Page     │  │     Page     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │          Components Layer            │             │
│         │  - SessionCard  - TranscriptViewer   │             │
│         │  - MetricsWidget - AudioPlayer       │             │
│         │  - NotificationBell - NotesEditor    │             │
│         │  - StatusFilter - DataFieldsDisplay  │             │
│         └──────────────────┬──────────────────┘             │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │           Hooks Layer                │             │
│         │  - useSessions  - useWebSocket       │             │
│         └──────────────────┬──────────────────┘             │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │          Services Layer              │             │
│         │  - API Client (REST)                 │             │
│         │  - WebSocket Handler                 │             │
│         └──────────────────┬──────────────────┘             │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   Backend API   │
                    │   HTTP + WS     │
                    └─────────────────┘
```

## Component Architecture

### Pages (Routes)

#### 1. Dashboard (`/`)
- **Purpose**: Overview of system performance and key metrics
- **Features**:
  - Real-time metrics widgets (total sessions, active, escalation rate, satisfaction)
  - Quick stats (avg duration, completed today, escalated today)
  - Recent escalations list (last 4)
  - Links to full session list
- **Data Sources**:
  - `/api/metrics` endpoint
  - `/api/sessions?status=escalated` endpoint

#### 2. Session List (`/sessions`)
- **Purpose**: Browse and filter all customer sessions
- **Features**:
  - Status filtering (all, active, escalated, completed, resolved)
  - Real-time search (session ID, name, phone, email)
  - Session cards with key info
  - Real-time updates via WebSocket
  - Click-through to session details
- **Data Sources**:
  - `/api/sessions` endpoint with query params
  - WebSocket for live updates

#### 3. Session Detail (`/sessions/:sessionId`)
- **Purpose**: Comprehensive view of a single session
- **Features**:
  - Full conversation transcript
  - Audio recording playback
  - Collected data fields display
  - Client information panel
  - Session metadata (duration, timestamps, status)
  - Agent notes editor
  - Mark as resolved button (for escalated cases)
  - Escalation reason alert
- **Data Sources**:
  - `/api/sessions/:id` endpoint
  - PATCH endpoints for updates

### Components

#### Core UI Components

1. **MetricsWidget**
   - Displays KPI cards with icons
   - Configurable colors and trend indicators
   - Used on Dashboard

2. **SessionCard**
   - Compact session overview
   - Status badge, timing, client info preview
   - Escalation reason highlight
   - Used in lists

3. **StatusFilter**
   - Filter buttons for session status
   - Active state highlighting
   - Quick status switching

4. **NotificationBell**
   - Real-time notification dropdown
   - WebSocket-based alerts
   - Browser notifications for new escalations
   - Connection status indicator
   - Click-through to relevant sessions

#### Session Detail Components

5. **TranscriptViewer**
   - Chat-style conversation display
   - Agent/client message distinction
   - Timestamp formatting
   - Scrollable view

6. **AudioPlayer**
   - Custom audio playback controls
   - Progress bar with seek functionality
   - Play/pause, skip forward/backward (10s)
   - Volume control
   - Time display

7. **DataFieldsDisplay**
   - Grid layout of collected data
   - Key-value pairs with formatting
   - Empty state handling
   - Responsive columns

8. **NotesEditor**
   - Rich text area for agent notes
   - Save/reset functionality
   - Auto-save indicator
   - Read-only mode for resolved cases

### Hooks

#### 1. `useSessions(status, search)`
- Fetches and manages session list
- Parameters: status filter, search query
- Returns: sessions array, loading state, error, refresh, update functions
- Features:
  - Automatic refetch on parameter change
  - Session update capability (for WebSocket updates)
  - Session addition (for new escalations)

#### 2. `useSession(sessionId)`
- Fetches single session details
- Returns: session object, loading, error, refresh, markResolved, updateNotes
- Features:
  - Dedicated methods for common actions
  - Error handling

#### 3. `useWebSocket(onMessage)`
- Manages WebSocket connection for real-time updates
- Auto-reconnect on disconnect (5s delay)
- Message parsing and callback
- Connection status tracking
- Used by: NotificationBell, SessionList

### Services

#### API Client (`api.ts`)

**Configuration:**
- Base URL from environment variable
- Default: `http://localhost:8000`
- Configurable per deployment

**Endpoints:**

```typescript
// Sessions
GET    /api/sessions              // List with filters
GET    /api/sessions/:id          // Get details
PATCH  /api/sessions/:id/status   // Update status
PATCH  /api/sessions/:id/notes    // Update notes
POST   /api/sessions/:id/resolve  // Mark resolved

// Metrics
GET    /api/metrics               // Dashboard metrics

// WebSocket
WS     /ws                        // Real-time updates
```

**WebSocket Messages:**
```typescript
{
  type: 'session_update' | 'new_escalation' | 'session_completed',
  data: Session
}
```

## Data Models

### Session
```typescript
{
  session_id: string;
  status: 'active' | 'completed' | 'escalated' | 'resolved';
  start_time: string;          // ISO 8601
  end_time?: string;           // ISO 8601
  duration?: number;           // seconds
  escalated: boolean;
  escalation_reason?: string;
  client_info?: {
    phone?: string;
    name?: string;
    email?: string;
  };
  collected_data?: Record<string, any>;
  transcript?: Array<{
    speaker: 'agent' | 'client';
    text: string;
    timestamp: string;         // ISO 8601
  }>;
  audio_url?: string;
  satisfaction_score?: number; // 1-5
  agent_notes?: string;
  metadata?: Record<string, any>;
}
```

### SessionMetrics
```typescript
{
  total_sessions: number;
  active_sessions: number;
  escalation_rate: number;     // 0-1 (percentage)
  avg_duration: number;        // seconds
  avg_satisfaction: number;    // 1-5
  completed_today: number;
  escalated_today: number;
}
```

## Styling Approach

### TailwindCSS Utility-First
- Responsive design with breakpoints (sm, md, lg)
- Custom color palette (primary blue scale)
- Reusable component classes (btn-*, badge-*, card)
- Smooth transitions and hover states

### Design System
- **Primary Color**: Blue (professional, trustworthy)
- **Status Colors**:
  - Active: Blue
  - Completed: Green
  - Escalated: Red
  - Resolved: Gray
- **Typography**: System fonts, clear hierarchy
- **Spacing**: Consistent 4px grid
- **Shadows**: Subtle elevation

## State Management

### Local State (useState)
- Component-specific UI state
- Form inputs
- Toggle states

### Custom Hooks
- Shared data fetching logic
- WebSocket connection management
- Reusable across components

### No Global State Library
- Simple prop drilling where needed
- Context avoided for this scale
- Can add Redux/Zustand if complexity grows

## Performance Optimizations

1. **Code Splitting**: React Router lazy loading (ready for implementation)
2. **Memoization**: useCallback for stable function references
3. **Debouncing**: Search input debounced (500ms)
4. **Virtual Scrolling**: Ready for large transcript lists
5. **WebSocket**: Efficient real-time updates vs polling

## Security Considerations

1. **API Authentication**: Ready for JWT/token headers
2. **XSS Prevention**: React's built-in escaping
3. **CORS**: Configured via backend
4. **Environment Variables**: Sensitive config in .env

## Development Workflow

1. **Hot Module Replacement**: Vite's instant updates
2. **TypeScript**: Compile-time type checking
3. **ESLint**: Code quality enforcement
4. **Docker**: Containerized development
5. **Source Maps**: Debug support

## Deployment

### Docker Production Build
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Environment Configuration
- Build-time: `VITE_API_BASE_URL`
- Runtime: Nginx config or env.js injection

## Future Enhancements

1. **Advanced Charts**: Recharts integration for trends
2. **Export Functionality**: Session data export (CSV, PDF)
3. **Bulk Operations**: Multi-session actions
4. **Advanced Search**: Full-text search, date ranges
5. **User Management**: Multi-user support with roles
6. **Session Analytics**: Deeper insights and reporting
7. **Internationalization**: Multi-language support
8. **Dark Mode**: Theme switching
9. **Offline Support**: Service worker for PWA
10. **Keyboard Shortcuts**: Power user features

## Testing Strategy (Ready for Implementation)

1. **Unit Tests**: Component logic (Jest + React Testing Library)
2. **Integration Tests**: API interactions (MSW)
3. **E2E Tests**: User flows (Playwright/Cypress)
4. **Accessibility**: WCAG compliance checks

## Browser Compatibility

- Modern evergreen browsers (last 2 versions)
- ES2020+ features
- WebSocket support required
- Audio element support required
