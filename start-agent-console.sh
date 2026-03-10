#!/bin/bash

echo "===== Voice Bot Agent Console Setup ====="
echo ""
echo "This script will help you start the agent console with example sessions."
echo ""

# Check if Docker is running
if command -v docker &> /dev/null; then
  echo "✓ Docker found"
  DOCKER_RUNNING=$(docker ps > /dev/null 2>&1 && echo "yes" || echo "no")
  if [ "$DOCKER_RUNNING" = "yes" ]; then
    echo "✓ Docker is running"
  else
    echo "⚠ Docker is not running or you don't have permissions"
    echo "  Please start Docker and ensure you have correct permissions"
  fi
else
  echo "⚠ Docker not found, skipping Docker checks"
fi

# Check API availability
echo ""
echo "Checking API connection..."
if curl -s http://localhost:3000/health > /dev/null; then
  echo "✓ API is running at http://localhost:3000"
else
  echo "⚠ API is not available at http://localhost:3000"
  echo "  Make sure to start the backend services first:"
  echo "  $ cd /home/mpachnik/hackathon-voicebot"
  echo "  $ docker-compose up -d"
  echo "  Wait for services to start, then run this script again"
  echo ""
  echo "If you continue, the application will run but may not show any sessions."
  read -p "Continue anyway? (y/n): " CONTINUE
  if [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]]; then
    echo "Exiting."
    exit 1
  fi
fi

# Add sample sessions
echo ""
echo "Do you want to add example sessions to the database?"
echo "This requires PostgreSQL client (psql) and database access."
read -p "Add example sessions? (y/n): " ADD_SESSIONS

if [[ "$ADD_SESSIONS" == "y" || "$ADD_SESSIONS" == "Y" ]]; then
  echo "Adding example sessions to database..."
  cd /home/mpachnik/hackathon-voicebot/database
  chmod +x seed_mock_data.sh
  ./seed_mock_data.sh
  cd -
fi

# Start the agent console frontend
echo ""
echo "Starting the Agent Console application..."
cd /home/mpachnik/hackathon-voicebot/frontend/agent-console
npm run dev