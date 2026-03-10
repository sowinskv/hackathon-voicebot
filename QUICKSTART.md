# 🚀 QUICKSTART GUIDE

Get the Next-Generation Call Center running in 5 minutes!

## Prerequisites

- ✅ Docker and Docker Compose installed
- ✅ API keys configured in `.env` (already done!)
- ⚠️ LiveKit account (you need to create this - see below)

## Step 1: Configure LiveKit (5 minutes)

LiveKit is REQUIRED for voice features. You must configure it before starting.

### Option A: LiveKit Cloud (Recommended - Easiest)

1. Go to https://cloud.livekit.io
2. Sign up for a free account
3. Create a new project
4. Copy your credentials:
   - API Key
   - API Secret
   - WebSocket URL (e.g., `wss://your-project.livekit.cloud`)

5. Update your `.env` file:
```bash
LIVEKIT_API_KEY=your_actual_key_here
LIVEKIT_API_SECRET=your_actual_secret_here
LIVEKIT_URL=wss://your-project.livekit.cloud
```

### Option B: Self-hosted LiveKit (Advanced)

See: https://docs.livekit.io/deploy/

## Step 2: Start the System (2 minutes)

```bash
cd /home/marcinlojek/hackathon
./scripts/setup.sh
```

This will:
- Build all Docker images
- Start all services
- Initialize the database
- Check health of services

**Wait 1-2 minutes for everything to start up.**

## Step 3: Access the Applications

Open these URLs in your browser:

1. **Voice App** (Client Interface)
   - URL: http://localhost:5173
   - Use this to test voice conversations

2. **Bot Builder** (Admin Panel)
   - URL: http://localhost:5174
   - Use this to configure the voicebot

3. **Agent Console** (Consultant Dashboard)
   - URL: http://localhost:5175
   - Use this to view and manage cases

## Step 4: Test the System

### Test 1: Voice Conversation

1. Open **Voice App** (localhost:5173)
2. Select language (Polish or English)
3. Click **"Start Session"**
4. Allow microphone access when prompted
5. Start talking about a car accident
   - Example: "I had a car accident today and need to report damage"
6. The bot will ask you questions and collect information
7. Watch the live transcript appear

### Test 2: Escalation

1. While in a conversation, say:
   - English: "I want to speak to a human" or "Connect me to a consultant"
   - Polish: "Chcę rozmawiać z człowiekiem" or "Połącz mnie z konsultantem"
2. The session will be marked as escalated
3. Open **Agent Console** (localhost:5175)
4. You'll see a notification about the new escalation
5. Click on the session to view full details

### Test 3: Bot Configuration

1. Open **Bot Builder** (localhost:5174)
2. You'll see the default OC damage report flow
3. Try editing:
   - System prompt (Prompt Editor tab)
   - Flow diagram (Flow Editor tab)
   - Required fields (Fields tab)
4. Click **"Save Draft"** or **"Publish"**

## Step 5: View Analytics

1. Open **Agent Console** (localhost:5175)
2. Click **"Dashboard"** in navigation
3. View metrics:
   - Total sessions
   - Escalation rate
   - Average satisfaction score
   - Cost per session

## 🎉 You're Done!

The system is now running and ready for your demo.

## 📚 Next Steps

- Read the [README.md](./README.md) for detailed documentation
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for what was built
- Explore [TASKS_SPECIFICATION.md](./TASKS_SPECIFICATION.md) to see all features

## 🛑 Stop the System

When you're done:

```bash
docker-compose down
```

To stop and remove all data:

```bash
docker-compose down -v
```

## 🔧 Troubleshooting

### Voice doesn't work
- Make sure LiveKit is configured in `.env`
- Check browser console for errors
- Try Chrome (best compatibility)
- Allow microphone permissions

### Services won't start
```bash
# Check logs
docker-compose logs -f

# Restart a specific service
docker-compose restart api-gateway
```

### Database errors
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose up -d
```

### Can't access applications
- Wait 1-2 minutes after starting
- Check if ports are available: `netstat -an | grep 5173`
- Try: http://127.0.0.1:5173 instead of localhost

## 🆘 Need Help?

Check the logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f voicebot-engine
```

Health check:
```bash
curl http://localhost:3000/health
```

## 🎯 Demo Tips

For a successful demo:

1. **Test beforehand** - Run through the entire flow at least once
2. **Have backup** - Record a video as backup
3. **Prepare scenarios** - Know what you'll say
4. **Check audio** - Test microphone and speakers
5. **Show all apps** - Have tabs open for all three frontends

**Good luck with your demo! 🚀**
