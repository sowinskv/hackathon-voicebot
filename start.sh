#!/bin/bash
# Ultra-fast startup script

echo "⚡ Starting services (fast mode)..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo "✅ Services started!"
echo ""
echo "🌐 URLs:"
echo "   Bot Builder:   http://localhost:5174"
echo "   Voice App:     http://localhost:5173"
echo "   Agent Console: http://localhost:5175"
echo ""
