#!/bin/bash

echo "🚀 Starting Next-Gen Call Center..."
echo ""

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Rebuild with cache
echo "🔨 Building services (this may take a few minutes on first run)..."
docker-compose build --parallel

# Start services
echo "▶️  Starting all services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check status
echo ""
echo "✅ Services started!"
echo ""
docker-compose ps

echo ""
echo "🌐 Access your applications:"
echo "   Bot Builder:   http://localhost:5174"
echo "   Voice App:     http://localhost:5173"
echo "   Agent Console: http://localhost:5175"
echo "   API Gateway:   http://localhost:3000"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop all:   docker-compose down"
echo ""
