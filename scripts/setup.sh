#!/bin/bash

# Next-Generation Call Center - Setup Script
# This script helps you set up the entire system

set -e  # Exit on error

echo "🤖 Next-Generation Call Center - Setup Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
else
    echo -e "${GREEN}✅ Docker found${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
else
    echo -e "${GREEN}✅ Docker Compose found${NC}"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create .env file with your API keys"
    exit 1
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Check LiveKit configuration
echo ""
echo "🔍 Checking LiveKit configuration..."
if grep -q "your_livekit_api_key_here" .env; then
    echo -e "${YELLOW}⚠️  LiveKit is not configured${NC}"
    echo ""
    echo "You need to configure LiveKit to enable voice features:"
    echo "1. Sign up at: https://cloud.livekit.io"
    echo "2. Create a project and get your API key, secret, and URL"
    echo "3. Update .env file with:"
    echo "   LIVEKIT_API_KEY=your_key"
    echo "   LIVEKIT_API_SECRET=your_secret"
    echo "   LIVEKIT_URL=wss://your-project.livekit.cloud"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ LiveKit configured${NC}"
fi

# Build and start services
echo ""
echo "🏗️  Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for database to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API Gateway is healthy${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "Waiting for API Gateway... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ API Gateway failed to start${NC}"
    echo "Check logs with: docker-compose logs api-gateway"
    exit 1
fi

# Success!
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🌐 Access the applications:"
echo "   Voice App:      http://localhost:5173"
echo "   Bot Builder:    http://localhost:5174"
echo "   Agent Console:  http://localhost:5175"
echo "   API Gateway:    http://localhost:3000"
echo ""
echo "📚 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "🔄 Restart services:"
echo "   docker-compose restart"
echo ""
echo "Happy building! 🚀"
