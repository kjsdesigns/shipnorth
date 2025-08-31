#!/bin/bash

# Docker-Only Test Wrapper Script
# This script ensures tests only run in Docker environment

set -e

echo "🐳 Docker-Only Test Suite"
echo "════════════════════════════════════════════════════════════════════════"

# Check if we're in Docker environment
if [ "$DOCKER_ENV" != "true" ]; then
    echo "❌ ERROR: This test suite can ONLY be run in Docker environment!"
    echo ""
    echo "🔍 Environment Detection:"
    echo "   DOCKER_ENV: ${DOCKER_ENV:-'not set'}"
    echo "   Hostname: $(hostname)"
    echo "   Platform: $(uname -s)"
    echo ""
    echo "🐳 To run these tests properly:"
    echo "   npm run test:docker           # Full test suite"
    echo "   npm run test:docker:critical  # Critical tests only"
    echo "   npm run test:docker:full      # All tests with reporting"
    echo ""
    echo "💡 Docker provides:"
    echo "   ✅ Isolated test environment"
    echo "   ✅ Consistent database state"
    echo "   ✅ Reliable network configuration"
    echo "   ✅ Container-specific dependencies"
    echo ""
    exit 1
fi

echo "✅ Docker environment confirmed"
echo "   Container: $(hostname)"
echo "   DOCKER_ENV: $DOCKER_ENV"
echo ""

# Run the actual test command
echo "🚀 Executing: $@"
echo "════════════════════════════════════════════════════════════════════════"
exec "$@"