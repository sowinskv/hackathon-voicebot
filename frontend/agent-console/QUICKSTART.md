# Quick Start Guide

Get the Agent Console up and running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- npm or yarn
- Backend API running (or mock API)

## Step 1: Install Dependencies

```bash
cd /home/marcinlojek/hackathon/frontend/agent-console
npm install
```

This will install all required dependencies:
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- Recharts
- date-fns

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your API endpoint:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Step 3: Start Development Server

```bash
npm run dev
```

The app will open at: http://localhost:5173

## Step 4: Explore the Application

### Dashboard (/)
- View system metrics and KPIs
- See recent escalations
- Monitor active sessions

### Sessions List (/sessions)
- Browse all sessions
- Filter by status
- Search sessions
- Click any session to view details

### Session Detail (/sessions/:id)
- View full transcript
- Play audio recording
- See collected data
- Add consultant notes
- Resolve escalated cases

## Docker Quick Start

If you prefer Docker:

```bash
# Build the image
docker build -t agent-console .

# Run the container
docker run -p 5173:5173 \
  -e VITE_API_BASE_URL=http://localhost:8000 \
  agent-console
```

## Common Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## Troubleshooting

### Port Already in Use

If port 5173 is taken, Vite will automatically try 5174, 5175, etc.

Or specify a different port:

```bash
npm run dev -- --port 3000
```

### API Connection Issues

1. Check `.env` has correct `VITE_API_BASE_URL`
2. Ensure backend API is running
3. Check browser console for CORS errors
4. Verify network tab in DevTools

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000` | Backend API base URL |

## Default Credentials

This is a frontend-only application. Authentication should be handled by your backend API.

## Sample Data

For testing without a backend, you can modify `src/services/api.ts` to return mock data:

```typescript
// Mock data example
async getSessions(): Promise<Session[]> {
  return [
    {
      session_id: 'sess_123',
      status: 'escalated',
      start_time: new Date().toISOString(),
      escalated: true,
      escalation_reason: 'Complex insurance query',
      client_info: {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
      },
      duration: 180,
      transcript: [
        { speaker: 'agent', text: 'Hello!', timestamp: new Date().toISOString() },
        { speaker: 'client', text: 'Hi there', timestamp: new Date().toISOString() },
      ],
    },
  ];
}
```

## Next Steps

1. **Customize Branding**: Update colors in `tailwind.config.js`
2. **Add Features**: Extend components in `src/components/`
3. **Connect Backend**: Implement your API in `src/services/api.ts`
4. **Deploy**: Build and deploy to your hosting provider

## Getting Help

- Check `README.md` for detailed documentation
- Review `ARCHITECTURE.md` for system design
- Open an issue for bugs or questions

## Project Structure Quick Reference

```
agent-console/
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components (routes)
│   ├── services/        # API client and services
│   ├── styles/          # Global CSS
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

## Key Features to Test

- [ ] Dashboard loads with metrics
- [ ] Session list displays sessions
- [ ] Status filters work
- [ ] Search functionality works
- [ ] Session detail page loads
- [ ] Transcript displays correctly
- [ ] Audio player works (if audio URL available)
- [ ] Notes editor saves changes
- [ ] Resolve button marks cases as resolved
- [ ] Notifications appear (with WebSocket)
- [ ] Navigation between pages works

## Performance Tips

- Keep browser DevTools Network tab open to monitor API calls
- Check Console for any errors or warnings
- Monitor WebSocket connection in Network tab (WS filter)
- Use React DevTools extension for component debugging

Enjoy using Agent Console!
