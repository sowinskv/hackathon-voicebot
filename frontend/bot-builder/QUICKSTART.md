# Quick Start Guide - Bot Builder

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd /home/marcinlojek/hackathon/frontend/bot-builder
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env to point to your API server
```

### Step 3: Start Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 📋 First Time Setup Checklist

- [ ] Node.js 20+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Backend API running (or configured to proxy)
- [ ] Browser opened to http://localhost:5173

---

## 🎯 Creating Your First Bot

### 1. Configure Bot Settings
1. Click **Settings** button in the header
2. Enter bot name (e.g., "Customer Support Bot")
3. Add optional description
4. Settings auto-save when you save the bot

### 2. Build the Conversation Flow
1. Go to **Flow Editor** tab
2. Drag **Start** node from the palette
3. Add **Message** nodes for greetings
4. Add **Slot Collection** node to gather info
5. Add **Confirmation** node to verify data
6. Add **End** node to close conversation
7. Connect nodes by dragging from output circles to input circles
8. Click any node to edit its properties in the right panel

### 3. Write the System Prompt
1. Go to **System Prompt** tab
2. Describe your bot's behavior and personality
3. Use templates:
   - `{REQUIRED_FIELDS}` - Lists configured fields
   - `{CONVERSATION_FLOW}` - References the visual flow
4. Prompt auto-saves when you save the bot

### 4. Configure Required Fields
1. Go to **Required Fields** tab
2. Click **Add Field** or **AI Suggest** for recommendations
3. For each field:
   - Set name (e.g., "customer_name")
   - Choose type (string, number, email, etc.)
   - Add description
   - Configure validation rules
4. Click **Save Field**

### 5. Test Your Bot
1. Go to **Test Console** tab
2. Click **Start Test** to begin a session
3. Type messages to interact with the bot
4. Verify the bot collects all required fields
5. Click **End Test** when done

### 6. Save and Publish
1. Click **Save Draft** in the header
2. Test thoroughly in Test Console
3. When ready, click **Publish**
4. Bot is now live in production!

---

## 🎨 UI Overview

```
┌─────────────────────────────────────────────────────────┐
│  🤖 Bot Builder    [Settings] [Save Draft] [Publish]   │
├─────────────────────────────────────────────────────────┤
│  [Flow Editor] [System Prompt] [Fields] [Test] [Vers.] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                   Main Content Area                      │
│              (Changes based on active tab)               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Nodes: 5    Edges: 4    Fields: 3    Bot Builder v1.0 │
└─────────────────────────────────────────────────────────┘
```

### Flow Editor Layout
```
┌──────────┬────────────────────┬──────────────┐
│   Node   │                    │   Node       │
│  Palette │   Canvas Area      │  Inspector   │
│          │                    │  (Properties)│
│  - Start │   [Flow Diagram]   │              │
│  - Msg   │                    │   Selected:  │
│  - Slot  │   [Zoom Controls]  │   Message    │
│  - Valid │   [Minimap]        │              │
│  - Conf  │                    │   Label: ... │
│  - Escal │                    │   Text: ...  │
│  - End   │                    │   [Delete]   │
└──────────┴────────────────────┴──────────────┘
```

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete node | `Delete` or `Backspace` |
| Multi-select | `Ctrl/Cmd` + Click |
| Pan canvas | Click + Drag |
| Zoom in/out | Mouse wheel |
| Fit view | Button in canvas controls |

---

## 💡 Pro Tips

### Flow Design
- **Start with one path**: Build the happy path first, then add error handling
- **Keep it simple**: Fewer nodes = easier to understand and maintain
- **Test early**: Test each section as you build it
- **Use descriptive labels**: Help future you understand the flow

### System Prompt
- **Be specific**: Clear instructions = better bot behavior
- **Give examples**: Show the bot what good responses look like
- **Set boundaries**: Define what the bot should NOT do
- **Use context**: Reference the flow and fields for consistency

### Required Fields
- **Start small**: Add only essential fields first
- **Use AI Suggest**: Let AI recommend fields based on your prompt
- **Validate appropriately**: Not everything needs strict validation
- **Good descriptions**: Help the bot understand what to collect

### Testing
- **Test variations**: Try different ways users might respond
- **Test errors**: What if user gives wrong info?
- **Test interruptions**: Users change their mind mid-conversation
- **Test edge cases**: Empty inputs, very long inputs, etc.

---

## 🐛 Troubleshooting

### "Cannot connect to API"
- Check `.env` has correct `VITE_API_BASE_URL`
- Verify backend API is running
- Check browser console for CORS errors

### "Nodes won't connect"
- Some nodes have specific input/output requirements
- Validation nodes have 2 outputs (valid/invalid)
- End nodes only have inputs

### "Flow validation fails"
- Ensure all nodes are connected
- Check that flow has exactly one Start node
- Verify all required node properties are filled

### "Test session won't start"
- Save bot as draft first
- Check that flow is valid
- Verify backend API is accessible

### "Changes not saving"
- Look for unsaved changes indicator
- Click "Save Draft" explicitly
- Check browser console for errors

---

## 📚 Common Patterns

### Basic Information Gathering
```
Start → Slot Collection → Confirmation → End
```

### With Validation
```
Start → Slot Collection → Validation → Confirmation → End
                              ↓ (invalid)
                          Error Message ─┘
```

### With Escalation
```
Start → Slot Collection → Validation → Escalation (if needed)
                              ↓ (valid)
                         Confirmation → End
```

### Multi-Stage Collection
```
Start → Slot1 → Validation1 → Slot2 → Validation2 → Confirmation → End
```

---

## 🔗 Useful Links

- **Full Documentation**: See README.md
- **API Reference**: See api.ts for endpoint definitions
- **Component Guide**: See OVERVIEW.md for architecture
- **React Flow Docs**: https://reactflow.dev/
- **TailwindCSS**: https://tailwindcss.com/docs

---

## 🆘 Getting Help

1. Check the console for error messages
2. Review the README.md for detailed docs
3. Inspect network requests in browser DevTools
4. Check that all dependencies are installed
5. Verify Node.js version (20+)

---

## ✅ Production Checklist

Before publishing to production:

- [ ] Flow is complete and validated
- [ ] All nodes have proper labels and messages
- [ ] System prompt is clear and comprehensive
- [ ] All required fields are configured with validation
- [ ] Bot tested with multiple scenarios
- [ ] Edge cases handled (errors, interruptions)
- [ ] Bot name and description are set
- [ ] Previous version backed up (if applicable)
- [ ] Team reviewed and approved
- [ ] Monitoring/analytics configured

---

**Happy Bot Building! 🤖**

For questions or issues, check the documentation or contact the development team.
