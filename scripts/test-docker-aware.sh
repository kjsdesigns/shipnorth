#!/bin/bash

# Docker-Aware Test Runner
# Runs tests from host with container networking awareness

set -e

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }

echo "🐳 Docker-Aware Test Runner"
echo "=========================="

# Ensure Docker services are running
log_info "Checking Docker services..."
if ! docker-compose ps | grep -q "Up"; then
    echo "Starting Docker services..."
    docker-compose up -d
    sleep 30
fi

# Verify services are healthy
./scripts/docker-health-monitor.sh

# Set environment for container-aware testing
export TEST_ENV=docker-aware
export TEST_WEB_URL="http://localhost:${WEB_PORT:-8849}"
export TEST_API_URL="http://localhost:${API_PORT:-8850}"

log_info "Test environment configured:"
echo "  • Web URL: $TEST_WEB_URL"  
echo "  • API URL: $TEST_API_URL"
echo "  • Test ENV: $TEST_ENV"

# Run tests with Docker-aware configuration
log_info "Running tests with Docker awareness..."

if [ "$1" = "--full" ]; then
    log_info "Running full test suite..."
    npx playwright test -c playwright-optimized.config.ts
elif [ "$1" = "--critical" ]; then
    log_info "Running critical path tests..."
    npx playwright test -c playwright-optimized.config.ts --project=critical-path
elif [ "$1" = "--diagnostic" ]; then
    log_info "Running connectivity diagnostic..."
    npx playwright test -c playwright-optimized.config.ts tests/e2e/00-connectivity-diagnostic.spec.ts
else
    log_info "Running connectivity diagnostic (default)..."
    npx playwright test -c playwright-optimized.config.ts tests/e2e/00-connectivity-diagnostic.spec.ts
fi

log_success "Docker-aware testing complete!"
echo ""
echo "Available options:"
echo "  ./scripts/test-docker-aware.sh --full       # Full test suite"
echo "  ./scripts/test-docker-aware.sh --critical   # Critical path only"  
echo "  ./scripts/test-docker-aware.sh --diagnostic # Connectivity diagnostic only"