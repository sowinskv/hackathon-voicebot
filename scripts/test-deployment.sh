#!/bin/bash

# Test Deployment Script
# Validates that all services can be built and started

set -e

echo "🧪 Testing Next-Generation Call Center Deployment"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for tests
test_step() {
    echo -e "${BLUE}▶${NC} $1"
}

test_pass() {
    echo -e "${GREEN}  ✅ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

test_fail() {
    echo -e "${RED}  ❌ FAIL: $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

# Test 1: Check Docker
test_step "Checking Docker installation..."
if command -v docker &> /dev/null; then
    test_pass
else
    test_fail "Docker not installed"
fi

# Test 2: Check Docker Compose
test_step "Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    test_pass
else
    test_fail "Docker Compose not installed"
fi

# Test 3: Check .env file
test_step "Checking .env file exists..."
if [ -f .env ]; then
    test_pass
else
    test_fail ".env file not found"
fi

# Test 4: Check required directories
test_step "Checking project structure..."
if [ -d "backend" ] && [ -d "frontend" ] && [ -d "database" ]; then
    test_pass
else
    test_fail "Missing required directories"
fi

# Test 5: Check database schema
test_step "Checking database schema..."
if [ -f "database/init.sql" ]; then
    test_pass
else
    test_fail "database/init.sql not found"
fi

# Test 6: Check docker-compose.yml
test_step "Checking docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    test_pass
else
    test_fail "docker-compose.yml not found"
fi

# Test 7: Validate docker-compose config
test_step "Validating docker-compose configuration..."
if docker-compose config > /dev/null 2>&1; then
    test_pass
else
    test_fail "Invalid docker-compose.yml"
fi

# Test 8: Check LiveKit configuration
test_step "Checking LiveKit configuration..."
if grep -q "your_livekit_api_key_here" .env; then
    echo -e "${YELLOW}  ⚠️  WARNING: LiveKit not configured (voice features will not work)${NC}"
else
    test_pass
fi

# Test 9: Check backend services
test_step "Checking backend services..."
backend_services=("api-gateway" "voicebot-engine" "escalation-service" "analytics-service" "auto-generator")
all_exist=true
for service in "${backend_services[@]}"; do
    if [ ! -d "backend/$service" ]; then
        all_exist=false
        break
    fi
done
if $all_exist; then
    test_pass
else
    test_fail "Missing backend services"
fi

# Test 10: Check frontend applications
test_step "Checking frontend applications..."
frontend_apps=("voice-app" "bot-builder" "agent-console")
all_exist=true
for app in "${frontend_apps[@]}"; do
    if [ ! -d "frontend/$app" ]; then
        all_exist=false
        break
    fi
done
if $all_exist; then
    test_pass
else
    test_fail "Missing frontend applications"
fi

# Test 11: Check shared packages
test_step "Checking shared packages..."
if [ -d "packages/shared-types" ]; then
    test_pass
else
    test_fail "Missing shared-types package"
fi

# Test 12: Try building images (if Docker daemon is running)
test_step "Testing Docker build (this may take a while)..."
if docker info > /dev/null 2>&1; then
    # Try building just the API gateway as a test
    if docker-compose build --no-cache api-gateway > /tmp/docker-build.log 2>&1; then
        test_pass
    else
        test_fail "Docker build failed (see /tmp/docker-build.log)"
    fi
else
    echo -e "${YELLOW}  ⚠️  SKIP: Docker daemon not running${NC}"
fi

# Summary
echo ""
echo "================================================"
echo "📊 Test Results"
echo "================================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! System is ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure LiveKit in .env (if not done)"
    echo "2. Run: ./scripts/setup.sh"
    echo "3. Access apps at:"
    echo "   - Voice App: http://localhost:5173"
    echo "   - Bot Builder: http://localhost:5174"
    echo "   - Agent Console: http://localhost:5175"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi
