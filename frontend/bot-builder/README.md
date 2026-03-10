# Bot Builder - No-Code Voicebot Platform

A modern, intuitive frontend for configuring voicebot flows and system prompts without writing code.

## Features

### 1. Visual Flow Editor
- **Drag-and-drop interface** using React Flow
- **7 node types**:
  - Start - Entry point with welcome message
  - Message - Send messages to users
  - Slot Collection - Collect multiple pieces of information
  - Validation - Validate user inputs with custom rules
  - Confirmation - Ask users to confirm collected data
  - Escalation - Transfer to human agents
  - End - Conversation termination with goodbye message
- **Visual connections** between nodes with validation
- **Node inspector panel** for detailed configuration
- **Canvas controls**: zoom, pan, fit view, minimap

### 2. System Prompt Editor
- **Monaco Editor** with syntax highlighting
- **Markdown support** for structured prompts
- **Template variables**: `{REQUIRED_FIELDS}`, `{CONVERSATION_FLOW}`
- **Real-time editing** with auto-save indication

### 3. Required Fields Configurator
- **Add/edit/remove** fields dynamically
- **Field types**: string, number, date, email, phone, boolean
- **Validation rules**: required, min/max length, patterns, ranges
- **AI-powered suggestions**: Analyze prompt and flow to suggest fields
- **Visual field management** with intuitive UI

### 4. Test Console
- **Live testing** with draft configurations
- **Real-time chat interface** for bot interaction
- **Session management**: start, chat, end sessions
- **Message history** with timestamps
- **Visual indicators** for user/bot messages

### 5. Version Management
- **Version history** with details
- **Revert to previous versions**
- **Compare configurations**: nodes, edges, fields
- **Version metadata**: creator, timestamp, status

### 6. Save & Publish Workflow
- **Draft mode**: Save and test without publishing
- **Flow validation**: Ensure flows are complete before saving
- **Publish**: Deploy configurations to production
- **Status indicators**: Draft, Published, Unsaved changes

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first styling
- **React Flow** - Visual flow editor
- **Monaco Editor** - Code/prompt editing
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **date-fns** - Date formatting

## Project Structure

```
bot-builder/
├── src/
│   ├── components/
│   │   ├── FlowEditor/
│   │   │   ├── Canvas.tsx          # Main flow canvas with React Flow
│   │   │   ├── NodeTypes.tsx       # Custom node components
│   │   │   ├── Toolbar.tsx         # Node palette for drag-and-drop
│   │   │   └── Inspector.tsx       # Node properties panel
│   │   ├── PromptEditor.tsx        # Monaco editor for system prompt
│   │   ├── SlotConfigurator.tsx    # Required fields manager
│   │   ├── TestConsole.tsx         # Live testing interface
│   │   └── VersionHistory.tsx      # Version management UI
│   ├── hooks/
│   │   └── useFlowState.ts         # Global state management
│   ├── services/
│   │   └── api.ts                  # API client and types
│   ├── styles/
│   │   └── globals.css             # Global styles and utilities
│   ├── App.tsx                     # Main application component
│   └── main.tsx                    # Application entry point
├── public/                         # Static assets
├── Dockerfile                      # Container definition
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
└── tailwind.config.js              # TailwindCSS configuration
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure API endpoint in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Docker

### Build Image
```bash
docker build -t bot-builder:latest .
```

### Run Container
```bash
docker run -p 5173:5173 \
  -e VITE_API_BASE_URL=http://api:8000 \
  bot-builder:latest
```

### Docker Compose
The frontend is designed to work with docker-compose alongside the backend services.

## Usage Guide

### Creating a Bot Flow

1. **Start with Settings**
   - Click "Settings" to set bot name and description
   - Save as draft

2. **Build the Flow**
   - Navigate to "Flow Editor" tab
   - Drag nodes from the palette or click to add
   - Connect nodes by dragging from output handles to input handles
   - Click nodes to edit their properties in the inspector panel

3. **Configure System Prompt**
   - Navigate to "System Prompt" tab
   - Write or edit the prompt defining bot behavior
   - Use template variables for dynamic content

4. **Set Up Required Fields**
   - Navigate to "Required Fields" tab
   - Add fields manually or click "AI Suggest" for recommendations
   - Configure field types and validation rules
   - Edit or delete fields as needed

5. **Test Your Bot**
   - Navigate to "Test Console" tab
   - Click "Start Test" to begin a session
   - Chat with the bot to verify behavior
   - End session when done

6. **Publish**
   - Review all configurations
   - Click "Publish" to deploy to production
   - View version history for rollback if needed

### Keyboard Shortcuts

- `Delete` - Delete selected node(s)
- `Ctrl` + Click - Multi-select nodes
- Mouse wheel - Zoom in/out
- Click + Drag (on background) - Pan canvas

## API Integration

The frontend expects the following API endpoints:

### Bot Configurations
- `POST /api/bot-configs` - Create new configuration
- `GET /api/bot-configs/:id` - Get configuration
- `PUT /api/bot-configs/:id` - Update configuration
- `POST /api/bot-configs/:id/publish` - Publish configuration

### Versions
- `GET /api/bot-configs/:id/versions` - List versions
- `POST /api/bot-configs/:id/revert/:versionId` - Revert to version

### Testing
- `POST /api/bot-configs/:id/test-session` - Create test session
- `POST /api/test-sessions/:id/messages` - Send message
- `GET /api/test-sessions/:id` - Get session
- `POST /api/test-sessions/:id/end` - End session

### AI Features
- `POST /api/ai/suggest-fields` - Get field suggestions
- `POST /api/flow/validate` - Validate flow

## Styling

The application uses TailwindCSS with custom components:

- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`
- **Inputs**: `.input`
- **Cards**: `.card`
- **Tabs**: `.tab`, `.tab-active`

Custom colors are defined in `tailwind.config.js` with primary color palette.

## State Management

The application uses Zustand for global state management. Key state includes:

- `nodes`, `edges` - Flow graph data
- `systemPrompt` - System prompt text
- `requiredFields` - Field configurations
- `botConfig` - Current bot configuration
- `isDirty` - Unsaved changes indicator
- `activeTab` - Current active tab

All state is managed in `useFlowState` hook.

## Contributing

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Keep components focused and reusable
4. Add proper type definitions
5. Test all features before committing

## License

Proprietary - Hackathon Project
