#!/bin/bash

# Simple startup script for Call Center System

set -e

echo "🚀 Starting Call Center System"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || true

echo ""
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to initialize..."
echo "   (First start takes 3-5 minutes for npm install)"
sleep 10

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Services started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📍 Access the applications:"
echo "   Voice App:      http://localhost:5173"
echo "   Bot Builder:    http://localhost:5174"
echo "   Agent Console:  http://localhost:5175"
echo "   API Gateway:    http://localhost:3000"
echo "   PostgreSQL:     localhost:5433"
echo ""
echo "⏱️  First startup timeline:"
echo "   Now:        Docker containers starting"
echo "   1-2 min:    PostgreSQL ready, API responding"
echo "   2-5 min:    npm install running for frontends"
echo "   5+ min:     All apps ready!"
echo ""
echo "📋 Useful commands:"
echo "   View logs:       docker-compose logs -f"
echo "   Check status:    docker-compose ps"
echo "   Stop system:     docker-compose down"
echo ""
echo "💡 Watch progress:"
echo "   docker logs callcenter-voice-app -f"
echo "   (Wait for: 'ready in XXX ms')"
echo ""
echo -e "${YELLOW}⚠️  Be patient! First start takes 3-5 minutes.${NC}"
echo ""
