#!/bin/bash
# Start all services including LiveKit voice system

echo "🎙️  Starting CallCenter VoiceBot System..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and configure your API keys"
    exit 1
fi

# Build voicebot engine if needed
echo "🔨 Building VoiceBot Engine..."
docker-compose build voicebot-engine

echo ""
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ Services started!"
echo ""
echo "🌐 URLs:"
echo "   Bot Builder:   http://localhost:5174"
echo "   Voice App:     http://localhost:5173"
echo "   Agent Console: http://localhost:5175"
echo "   API Gateway:   http://localhost:3000"
echo "   LiveKit:       ws://localhost:7880"
echo ""
echo "📊 Check status:"
echo "   docker-compose ps"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f voicebot-engine  # VoiceBot agent"
echo "   docker-compose logs -f livekit          # LiveKit server"
echo "   docker-compose logs -f api-gateway      # API Gateway"
echo ""
echo "📖 Setup guide: See LIVEKIT_SETUP.md"
echo ""
