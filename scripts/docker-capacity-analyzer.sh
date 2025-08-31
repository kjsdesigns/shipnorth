#!/bin/bash

# Docker Capacity Analyzer
# Evaluates system capacity and optimizes for concurrent test execution

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

log_section() { echo -e "\n${MAGENTA}🔍 $1${NC}"; echo "$(printf '=%.0s' {1..50})"; }
log_metric() { echo -e "${BLUE}📊 $1:${NC} $2"; }
log_recommendation() { echo -e "${YELLOW}💡 RECOMMENDATION:${NC} $1"; }
log_action() { echo -e "${GREEN}🔧 ACTION:${NC} $1"; }

echo -e "${CYAN}🐳 DOCKER CAPACITY ANALYSIS & OPTIMIZATION${NC}"
echo "==========================================="

# Section 1: Current System Resources
log_section "Current System Resources"

# Colima VM resources
COLIMA_INFO=$(colima status 2>/dev/null || echo "not available")
echo "$COLIMA_INFO" | grep -E "arch|runtime|mountType"

# Docker system info
DOCKER_INFO=$(docker system info 2>/dev/null)
TOTAL_CPU=$(echo "$DOCKER_INFO" | grep "CPUs:" | awk '{print $2}')
TOTAL_MEM=$(echo "$DOCKER_INFO" | grep "Total Memory:" | awk '{print $3$4}')

log_metric "Total CPUs" "$TOTAL_CPU cores"
log_metric "Total Memory" "$TOTAL_MEM"

# macOS host resources
HOST_CPU=$(sysctl -n hw.ncpu)
HOST_MEM=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024 "GB"}')

log_metric "Host CPUs" "$HOST_CPU cores"
log_metric "Host Memory" "${HOST_MEM}"

# Section 2: Current Container Resource Usage
log_section "Current Container Resource Usage"

docker stats --no-stream --format "table {{.Container}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | while read line; do
    if [[ "$line" == "CONTAINER"* ]]; then
        echo "$line"
    else
        CONTAINER_ID=$(echo "$line" | awk '{print $1}')
        CONTAINER_NAME=$(echo "$line" | awk '{print $2}')
        CPU_PERC=$(echo "$line" | awk '{print $3}' | sed 's/%//')
        MEM_USAGE=$(echo "$line" | awk '{print $4}')
        MEM_PERC=$(echo "$line" | awk '{print $5}' | sed 's/%//')
        
        if [[ -n "$CONTAINER_NAME" ]]; then
            echo "📦 $CONTAINER_NAME: CPU ${CPU_PERC}%, Memory ${MEM_USAGE} (${MEM_PERC}%)"
        fi
    fi
done

# Section 3: Resource Constraints Analysis
log_section "Resource Constraints Analysis"

# Calculate theoretical capacity for concurrent tests
TOTAL_CPU_NUM=${TOTAL_CPU:-4}
CURRENT_CPU_USAGE=$(docker stats --no-stream --format "{{.CPUPerc}}" | sed 's/%//' | awk '{sum+=$1} END {print sum}' || echo "0")

log_metric "Current total CPU usage" "${CURRENT_CPU_USAGE}%"

# Memory analysis
TOTAL_MEM_GB=$(echo "$TOTAL_MEM" | sed 's/GiB//' | sed 's/GB//')
AVAILABLE_CPU=$((100 - ${CURRENT_CPU_USAGE%.*}))
AVAILABLE_MEM_PERCENT=$((100 - $(docker stats --no-stream shipnorth-app --format "{{.MemPerc}}" | sed 's/%//' | head -1)))

log_metric "Available CPU capacity" "${AVAILABLE_CPU}%"
log_metric "Available Memory capacity" "${AVAILABLE_MEM_PERCENT}%"

# Calculate optimal worker count
if [ $AVAILABLE_CPU -gt 70 ] && [ $AVAILABLE_MEM_PERCENT -gt 50 ]; then
    OPTIMAL_WORKERS=8
    log_recommendation "System can handle 8+ concurrent workers"
elif [ $AVAILABLE_CPU -gt 50 ] && [ $AVAILABLE_MEM_PERCENT -gt 30 ]; then
    OPTIMAL_WORKERS=6
    log_recommendation "System can handle 6 concurrent workers"
elif [ $AVAILABLE_CPU -gt 30 ] && [ $AVAILABLE_MEM_PERCENT -gt 20 ]; then
    OPTIMAL_WORKERS=4
    log_recommendation "System can handle 4 concurrent workers"
else
    OPTIMAL_WORKERS=2
    log_recommendation "System should use 2 concurrent workers"
fi

# Section 4: Optimization Recommendations
log_section "Optimization Recommendations"

# Check if we can increase Colima resources
CURRENT_COLIMA_CPU=$(echo "$DOCKER_INFO" | grep "CPUs:" | awk '{print $2}')
CURRENT_COLIMA_MEM=$(echo "$TOTAL_MEM" | sed 's/GiB//')

if [ "$HOST_CPU" -gt "$CURRENT_COLIMA_CPU" ]; then
    RECOMMENDED_CPU=$((HOST_CPU - 2))  # Leave 2 cores for host
    log_action "Increase Colima CPU from $CURRENT_COLIMA_CPU to $RECOMMENDED_CPU cores"
    echo "   Command: colima stop && colima start --cpu $RECOMMENDED_CPU --memory 12"
fi

if (( $(echo "$HOST_MEM" | sed 's/GB//') > $(echo "$CURRENT_COLIMA_MEM" | sed 's/GB//') )); then
    log_action "Increase Colima memory to 12-16GB"
    echo "   Command: colima stop && colima start --cpu $RECOMMENDED_CPU --memory 16"
fi

# Container-specific optimizations
log_action "Add memory limits to prevent OOM issues"
echo "   Add to docker-compose.yml: mem_limit: 2g for shipnorth-app"

log_action "Configure swap if not available"
SWAP_INFO=$(docker info 2>/dev/null | grep "Swap Limit" || echo "Unknown")
echo "   Current: $SWAP_INFO"

# Section 5: Test Concurrency Optimization
log_section "Test Concurrency Optimization Strategy"

log_action "Update Playwright config for optimal Docker performance"
echo "   Set workers: process.env.DOCKER_ENV ? $OPTIMAL_WORKERS : 6"

log_action "Add resource monitoring during tests"
echo "   Monitor: docker stats during test execution"

log_action "Consider test prioritization"
echo "   Run critical tests first with higher concurrency"
echo "   Run extended tests with lower concurrency"

# Section 6: Immediate Action Plan
log_section "Immediate Action Plan"

echo "1. 🚀 Increase Colima VM resources:"
echo "   colima stop"
echo "   colima start --cpu 6 --memory 16 --disk 100"
echo ""
echo "2. 🐳 Add container resource limits:"
echo "   Add mem_limit and cpu_limit to docker-compose.yml"
echo ""
echo "3. ⚡ Optimize Playwright workers:"
echo "   Set workers to $OPTIMAL_WORKERS for Docker environment"
echo ""
echo "4. 📊 Monitor resource usage:"
echo "   Run tests with resource monitoring enabled"

echo ""
echo "🎯 EXPECTED IMPROVEMENT:"
echo "- Support 6-8 concurrent test workers in Docker"
echo "- Reduce test suite execution time by 30-50%"
echo "- Eliminate timeout issues from resource contention"