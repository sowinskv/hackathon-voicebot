#!/bin/bash

echo "🎙️ Starting LiveKit Voice System (Native LiveKit)"
echo "=================================================="

# Check if LiveKit server is already downloaded
if [ ! -f "./livekit-server" ]; then
    echo "📥 Downloading LiveKit server..."
    wget -q https://github.com/livekit/livekit/releases/download/v1.9.12/livekit_1.9.12_linux_amd64.tar.gz
    tar -xzf livekit_1.9.12_linux_amd64.tar.gz
    rm livekit_1.9.12_linux_amd64.tar.gz
    echo "✅ LiveKit server downloaded"
fi

# Stop and remove Docker LiveKit container completely
echo "⏹️  Stopping and removing Docker LiveKit container..."
docker-compose rm -f -s livekit 2>/dev/null

# Start other Docker services (excluding LiveKit)
echo "🐳 Starting Docker services..."
docker-compose up -d postgres api-gateway voicebot-engine voice-app bot-builder agent-console

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 3

echo ""
echo "✨ Services started:"
echo "  - PostgreSQL: localhost:5433"
echo "  - API Gateway: localhost:3000"
echo "  - VoiceBot Agent: Running"
echo "  - Voice App: http://localhost:5173"
echo "  - Bot Builder: http://localhost:5174"
echo "  - Agent Console: http://localhost:5175"
echo ""
echo "🚀 Starting LiveKit server (native)..."
echo "   LiveKit will run on: ws://localhost:7880"
echo "   Press Ctrl+C to stop"
echo ""

# Run LiveKit server
./livekit-server --config livekit/livekit.yaml
