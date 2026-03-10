#!/bin/bash

echo "🚀 Starting Voice App Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your configuration."
    echo ""
fi

# Start the development server
echo "🌐 Starting Vite dev server..."
echo "📍 Application will be available at: http://localhost:5173"
echo ""

npm run dev
