#!/bin/bash

# Fix Docker Build Issues
# This script fixes Dockerfile issues by changing npm ci to npm install

echo "🔧 Fixing Docker build configurations..."

# Find all Dockerfiles and replace 'npm ci' with 'npm install'
find . -name "Dockerfile" -type f | while read -r dockerfile; do
    echo "  Updating: $dockerfile"
    sed -i 's/npm ci/npm install/g' "$dockerfile"
    sed -i 's/npm ci --omit=dev/npm install --omit=dev/g' "$dockerfile"
done

echo "✅ Docker build configurations fixed!"
echo ""
echo "You can now run:"
echo "  docker-compose build"
echo "  docker-compose up"
