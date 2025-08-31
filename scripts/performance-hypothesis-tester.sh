#!/bin/bash

# Performance Hypothesis Testing Suite
# Systematically tests 8 hypotheses for Docker performance issues

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_test() { echo -e "${CYAN}🧪 HYPOTHESIS $1:${NC} $2"; }
log_result() { echo -e "${GREEN}📊 RESULT:${NC} $1"; }
log_measure() { echo -e "${BLUE}📏 MEASURE:${NC} $1"; }
log_conclusion() { echo -e "${YELLOW}🎯 CONCLUSION:${NC} $1"; }

echo "🔬 PERFORMANCE HYPOTHESIS TESTING SUITE"
echo "======================================"

API_PORT=${API_PORT:-8850}
WEB_PORT=${WEB_PORT:-8849}

# Test 1: Database Query Performance
log_test "1" "Database Query Slowdown"
log_measure "Comparing API response times: Host vs Docker"

# Test from host
HOST_API_TIME=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:$API_PORT/health" || echo "0")
HOST_CUSTOMERS_TIME=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:$API_PORT/customers" || echo "0")

# Test from container  
DOCKER_API_TIME=$(docker exec shipnorth-app curl -o /dev/null -s -w "%{time_total}" "http://localhost:$API_PORT/health" 2>/dev/null || echo "0")
DOCKER_CUSTOMERS_TIME=$(docker exec shipnorth-app curl -o /dev/null -s -w "%{time_total}" "http://localhost:$API_PORT/customers" 2>/dev/null || echo "0")

log_result "Host API: ${HOST_API_TIME}s, Customers: ${HOST_CUSTOMERS_TIME}s"
log_result "Docker API: ${DOCKER_API_TIME}s, Customers: ${DOCKER_CUSTOMERS_TIME}s"

API_DIFF=$(echo "$DOCKER_API_TIME - $HOST_API_TIME" | bc -l 2>/dev/null || echo "0")
if (( $(echo "$API_DIFF > 0.1" | bc -l 2>/dev/null || echo 0) )); then
    log_conclusion "CONFIRMED: Database queries slower in Docker (+${API_DIFF}s)"
else
    log_conclusion "REJECTED: No significant database performance difference"
fi

# Test 2: Next.js Compilation Performance
log_test "2" "Next.js Dev Server Compilation Lag"
log_measure "Testing cold vs warm page loads"

# Clear Next.js cache and test
docker exec shipnorth-app sh -c "cd /app/apps/web && rm -rf .next" 2>/dev/null || true
docker-compose restart shipnorth >/dev/null 2>&1
sleep 30

# Cold load (first time)
COLD_START=$(date +%s%3N)
curl -s "http://localhost:$WEB_PORT/" >/dev/null
COLD_END=$(date +%s%3N)
COLD_TIME=$((COLD_END - COLD_START))

# Warm load (second time)
WARM_START=$(date +%s%3N)
curl -s "http://localhost:$WEB_PORT/" >/dev/null
WARM_END=$(date +%s%3N)
WARM_TIME=$((WARM_END - WARM_START))

log_result "Cold load: ${COLD_TIME}ms, Warm load: ${WARM_TIME}ms"
COMPILE_DIFF=$((COLD_TIME - WARM_TIME))

if [ $COMPILE_DIFF -gt 1000 ]; then
    log_conclusion "CONFIRMED: Next.js compilation adds ${COMPILE_DIFF}ms delay"
else
    log_conclusion "REJECTED: No significant compilation overhead"
fi

# Test 3: Static Asset Performance
log_test "3" "Docker Volume Mount Performance"
log_measure "Comparing static asset load times"

# Test CSS load time
CSS_TIME=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:$WEB_PORT/_next/static/css/app/layout.css" || echo "0")
# Test JS chunk load time  
JS_TIME=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:$WEB_PORT/_next/static/chunks/webpack.js" || echo "0")

log_result "CSS load: ${CSS_TIME}s, JS load: ${JS_TIME}s"

if (( $(echo "$CSS_TIME > 0.5 || $JS_TIME > 0.5" | bc -l 2>/dev/null || echo 0) )); then
    log_conclusion "CONFIRMED: Static asset loading is slow (CSS: ${CSS_TIME}s, JS: ${JS_TIME}s)"
else
    log_conclusion "REJECTED: Static assets load efficiently"
fi

# Test 4: Container Resource Constraints
log_test "4" "Memory/CPU Resource Constraints"
log_measure "Monitoring container resource usage"

CONTAINER_STATS=$(docker stats shipnorth-app --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" | tail -1 || echo "0%\t0B / 0B")
CPU_USAGE=$(echo "$CONTAINER_STATS" | cut -f1 | sed 's/%//')
MEM_USAGE=$(echo "$CONTAINER_STATS" | cut -f2)

log_result "CPU: ${CPU_USAGE}%, Memory: ${MEM_USAGE}"

if (( $(echo "$CPU_USAGE > 80" | bc -l 2>/dev/null || echo 0) )); then
    log_conclusion "CONFIRMED: High CPU usage (${CPU_USAGE}%) causing performance issues"
elif [[ "$MEM_USAGE" == *"GiB"* ]]; then
    log_conclusion "POTENTIAL: High memory usage detected: $MEM_USAGE"
else
    log_conclusion "REJECTED: Container resources within normal limits"
fi

# Test 5: Network Stack Performance
log_test "5" "Docker Network Bridge Latency"
log_measure "Comparing ping times and HTTP latencies"

# Test ping to container (if supported)
PING_TIME=$(docker exec shipnorth-app ping -c 1 localhost 2>/dev/null | grep "time=" | cut -d'=' -f4 | cut -d' ' -f1 || echo "0")

# Test HTTP connection time vs transfer time
HTTP_TIMES=$(curl -o /dev/null -s -w "connect:%{time_connect}|transfer:%{time_starttransfer}|total:%{time_total}" "http://localhost:$WEB_PORT/" || echo "connect:0|transfer:0|total:0")
CONNECT_TIME=$(echo "$HTTP_TIMES" | cut -d'|' -f1 | cut -d':' -f2)
TRANSFER_TIME=$(echo "$HTTP_TIMES" | cut -d'|' -f2 | cut -d':' -f2)
TOTAL_TIME=$(echo "$HTTP_TIMES" | cut -d'|' -f3 | cut -d':' -f2)

log_result "Connect: ${CONNECT_TIME}s, Transfer: ${TRANSFER_TIME}s, Total: ${TOTAL_TIME}s"

if (( $(echo "$CONNECT_TIME > 0.1" | bc -l 2>/dev/null || echo 0) )); then
    log_conclusion "CONFIRMED: Network connection overhead (${CONNECT_TIME}s)"
else
    log_conclusion "REJECTED: Network performance acceptable"
fi

# Test 6: React Hydration Performance
log_test "6" "React Hydration Performance"
log_measure "Analyzing browser performance timing"

# Create a simple performance test page
PERF_TEST=$(curl -s "http://localhost:$WEB_PORT/" | grep -o "window\.performance" | wc -l)
if [ "$PERF_TEST" -gt 0 ]; then
    log_result "Performance API available for measurement"
    log_conclusion "TESTABLE: Can measure React hydration timing"
else
    log_result "Performance API not found in page"
    log_conclusion "INCONCLUSIVE: Cannot measure hydration performance"
fi

# Test 7: API Rate Limiting
log_test "7" "API Rate Limiting or Throttling"
log_measure "Testing rapid API requests for rate limiting"

# Make 10 rapid requests
RATE_TEST_START=$(date +%s%3N)
for i in {1..10}; do
    curl -s "http://localhost:$API_PORT/health" >/dev/null &
done
wait
RATE_TEST_END=$(date +%s%3N)
RATE_TEST_TIME=$((RATE_TEST_END - RATE_TEST_START))

# Check for rate limit headers
RATE_HEADERS=$(curl -I -s "http://localhost:$API_PORT/health" | grep -i "ratelimit" | wc -l)

log_result "10 requests completed in ${RATE_TEST_TIME}ms"
log_result "Rate limit headers found: $RATE_HEADERS"

if [ $RATE_TEST_TIME -gt 2000 ] || [ $RATE_HEADERS -gt 0 ]; then
    log_conclusion "CONFIRMED: Rate limiting detected (${RATE_TEST_TIME}ms for 10 requests)"
else
    log_conclusion "REJECTED: No significant rate limiting"
fi

# Test 8: Database Connection Pool
log_test "8" "PostgreSQL Connection Pool Saturation"
log_measure "Monitoring database connections and query performance"

# Check database connections
DB_CONNECTIONS=$(docker exec shipnorth-postgres psql -U shipnorth -d shipnorth -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" -t 2>/dev/null | tr -d ' ' || echo "0")

# Test database query time directly
DB_QUERY_TIME=$(docker exec shipnorth-postgres sh -c "time -p psql -U shipnorth -d shipnorth -c 'SELECT count(*) FROM users;' >/dev/null" 2>&1 | grep real | awk '{print $2}' || echo "0")

log_result "Active DB connections: $DB_CONNECTIONS"
log_result "Direct DB query time: ${DB_QUERY_TIME}s"

if [ "$DB_CONNECTIONS" -gt 10 ] || (( $(echo "$DB_QUERY_TIME > 0.1" | bc -l 2>/dev/null || echo 0) )); then
    log_conclusion "CONFIRMED: Database performance issues (${DB_CONNECTIONS} connections, ${DB_QUERY_TIME}s queries)"
else
    log_conclusion "REJECTED: Database performance acceptable"
fi

echo ""
echo "🎯 PERFORMANCE ANALYSIS COMPLETE"
echo "==============================="
echo "Review results above to identify the actual root cause."
echo "Focus on CONFIRMED hypotheses for targeted fixes."
echo ""
echo "Next steps:"
echo "1. Address confirmed performance bottlenecks"
echo "2. Re-run Docker tests to verify improvements"
echo "3. Update performance targets if container environment requires it"