#!/bin/bash

# Frontend-API Connectivity Diagnostic Suite
# Tests 10 hypotheses systematically to resolve recurring connectivity issues

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_test() { echo -e "${CYAN}🧪 TEST $1:${NC} $2"; }
log_pass() { echo -e "${GREEN}✅ PASS:${NC} $1"; }
log_fail() { echo -e "${RED}❌ FAIL:${NC} $1"; }
log_info() { echo -e "${BLUE}ℹ️ INFO:${NC} $1"; }
log_fix() { echo -e "${YELLOW}🔧 FIX:${NC} $1"; }

echo "🔬 FRONTEND-API CONNECTIVITY DIAGNOSTIC SUITE"
echo "=============================================="

# Get environment variables
API_PORT=${API_PORT:-8850}
WEB_PORT=${WEB_PORT:-8849}

# Test 1: Docker Network Isolation
log_test "1" "Docker Network Isolation"
log_info "Testing if browser can reach API from host network..."

HOST_TO_API=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:$API_PORT/health)
if [ "$HOST_TO_API" = "200" ]; then
    log_pass "Host can reach API on localhost:$API_PORT"
else
    log_fail "Host cannot reach API (HTTP $HOST_TO_API)"
    log_fix "Check docker port mapping: docker-compose ps"
fi

# Test 2: Next.js Build-Time Environment
log_test "2" "Next.js Build-Time Environment Variables"
log_info "Checking if NEXT_PUBLIC_API_URL is baked into frontend build..."

FRONTEND_JS=$(curl -s http://localhost:$WEB_PORT/_next/static/chunks/app/layout.js 2>/dev/null || echo "")
if echo "$FRONTEND_JS" | grep -q "localhost:$API_PORT"; then
    log_pass "Frontend build contains correct API URL: localhost:$API_PORT"
else
    log_fail "Frontend build missing or wrong API URL"
    log_fix "Rebuild frontend with correct NEXT_PUBLIC_API_URL"
fi

# Test 3: API Server Binding Configuration  
log_test "3" "API Server Internal Binding"
log_info "Checking if API server binds to 0.0.0.0 vs 127.0.0.1..."

NETSTAT_RESULT=$(docker exec shipnorth-app netstat -tlnp 2>/dev/null | grep ":$API_PORT" || echo "not found")
if echo "$NETSTAT_RESULT" | grep -q "0.0.0.0:$API_PORT"; then
    log_pass "API server binds to 0.0.0.0 (accepts external connections)"
elif echo "$NETSTAT_RESULT" | grep -q "127.0.0.1:$API_PORT"; then
    log_fail "API server binds to 127.0.0.1 (localhost only)"
    log_fix "Update API server to bind to 0.0.0.0"
else
    log_fail "API server not found on port $API_PORT"
    log_fix "Check if API process is running: docker exec shipnorth-app ps aux | grep node"
fi

# Test 4: Frontend API Client Configuration
log_test "4" "Frontend Axios Configuration"
log_info "Testing frontend API client from browser context..."

# Create test endpoint to return client config
docker exec shipnorth-app sh -c "
cd /app/apps/web && 
node -e \"
const fs = require('fs');
const path = require('path');
console.log('Checking frontend API configuration...');
try {
  const apiFile = fs.readFileSync('lib/api.ts', 'utf8');
  if (apiFile.includes('process.env.NEXT_PUBLIC_API_URL')) {
    console.log('✅ Frontend uses environment variable');
  } else {
    console.log('❌ Frontend missing environment variable usage');
  }
} catch(e) {
  console.log('❌ Cannot read API configuration file');
}
\"
" 2>/dev/null && log_pass "Frontend API config accessible" || log_fail "Frontend API config issues"

# Test 5: Docker Container Startup Timing
log_test "5" "Container Startup Race Condition"
log_info "Testing API readiness after container start..."

# Test API health multiple times to check consistency
HEALTH_CHECKS=0
for i in {1..5}; do
    HEALTH_STATUS=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:$API_PORT/health)
    if [ "$HEALTH_STATUS" = "200" ]; then
        ((HEALTH_CHECKS++))
    fi
    sleep 1
done

if [ $HEALTH_CHECKS -eq 5 ]; then
    log_pass "API consistently healthy (5/5 checks)"
else
    log_fail "API inconsistently healthy ($HEALTH_CHECKS/5 checks)"
    log_fix "Add startup delays or health check retries"
fi

# Test 6: CORS Configuration Timing
log_test "6" "CORS Configuration Loading"
log_info "Testing CORS headers and origins..."

CORS_TEST=$(curl -s -H "Origin: http://localhost:$WEB_PORT" -I http://localhost:$API_PORT/health | grep -i "access-control-allow-origin" || echo "missing")
if echo "$CORS_TEST" | grep -q "localhost:$WEB_PORT"; then
    log_pass "CORS allows frontend origin"
else
    log_fail "CORS missing or wrong origin: $CORS_TEST"
    log_fix "Check ALLOWED_ORIGINS environment variable"
fi

# Test 7: Next.js SSR vs Client Hydration
log_test "7" "SSR vs Client Hydration Mismatch"
log_info "Testing server-side vs client-side API URL resolution..."

# Check if Next.js is using different URLs on server vs client
SSR_CHECK=$(curl -s http://localhost:$WEB_PORT/login | grep -o "localhost:[0-9][0-9][0-9][0-9]" | head -1 || echo "none")
if [ "$SSR_CHECK" = "localhost:$API_PORT" ]; then
    log_pass "SSR uses correct API URL"
elif [ "$SSR_CHECK" = "none" ]; then
    log_info "No API URL found in SSR HTML (might be client-side only)"
else
    log_fail "SSR uses wrong API URL: $SSR_CHECK"
fi

# Test 8: Docker Port Mapping Verification
log_test "8" "Docker Port Mapping"
log_info "Verifying Docker port mapping configuration..."

PORT_MAPPING=$(docker port shipnorth-app $API_PORT 2>/dev/null || echo "unmapped")
if echo "$PORT_MAPPING" | grep -q "0.0.0.0:$API_PORT"; then
    log_pass "API port correctly mapped to host"
else
    log_fail "API port mapping issue: $PORT_MAPPING"
    log_fix "Check docker-compose.yml port configuration"
fi

# Test 9: Frontend Build Cache Issues
log_test "9" "Frontend Build Cache"
log_info "Testing for stale frontend build cache..."

# Check if frontend build is recent
BUILD_TIME=$(docker exec shipnorth-app stat -c %Y /app/apps/web/.next 2>/dev/null || echo "0")
CURRENT_TIME=$(date +%s)
AGE=$((CURRENT_TIME - BUILD_TIME))

if [ $AGE -lt 3600 ]; then
    log_pass "Frontend build is recent (${AGE}s ago)"
else
    log_fail "Frontend build is stale (${AGE}s ago)"
    log_fix "Clear build cache and rebuild: rm -rf apps/web/.next && npm run build:web"
fi

# Test 10: Container DNS Resolution
log_test "10" "Container Internal DNS"
log_info "Testing container-to-container communication..."

INTERNAL_API_TEST=$(docker exec shipnorth-app curl -s -w "%{http_code}" -o /dev/null http://shipnorth-app:$API_PORT/health 2>/dev/null || echo "000")
if [ "$INTERNAL_API_TEST" = "200" ]; then
    log_pass "Container internal DNS working"
else
    log_fail "Container internal DNS not working (HTTP $INTERNAL_API_TEST)"
    log_info "This is expected - testing for completeness"
fi

echo ""
echo "🎯 DIAGNOSTIC COMPLETE - Analysis Summary:"
echo "=========================================="

# Provide diagnosis summary
echo "📋 Next steps based on findings above:"
echo "1. Review failed tests for specific issues"
echo "2. Apply suggested fixes"
echo "3. Test login functionality manually"
echo "4. Re-run test suite"

echo ""
echo "🧪 To test login manually:"
echo "   curl -X POST http://localhost:$API_PORT/auth/login \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"email\":\"test@test.com\",\"password\":\"test123\"}'"
echo ""
echo "🌐 Frontend URLs:"
echo "   • Login: http://localhost:$WEB_PORT/login"
echo "   • API Health: http://localhost:$API_PORT/health"