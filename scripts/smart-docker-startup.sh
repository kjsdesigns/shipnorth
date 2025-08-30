#!/bin/bash

# Smart Docker Startup with Auto-Resolution
# Prevents and resolves common Docker issues before they cause test failures

set -e

echo "🚀 SMART DOCKER STARTUP - Self-Healing Infrastructure"
echo "===================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}🔍 $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_fix() { echo -e "${YELLOW}🔧 $1${NC}"; }

# Step 1: Pre-flight System Check
log_info "Checking system prerequisites..."

# Check Docker Engine
if ! docker info >/dev/null 2>&1; then
    log_error "Docker Engine not running"
    log_fix "Starting Docker Desktop..."
    open -a Docker 2>/dev/null || true
    
    # Wait for Docker to start
    for i in {1..30}; do
        if docker info >/dev/null 2>&1; then
            log_success "Docker Engine started"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Failed to start Docker Engine"
        echo "MANUAL RESOLUTION: Open Docker Desktop application"
        exit 1
    fi
fi

log_success "Docker Engine is running"

# Step 2: Clean up potential conflicts
log_info "Cleaning up potential conflicts..."

# Kill any processes on our ports that aren't Docker
PORTS=(80 8849 8850 5432)
for PORT in "${PORTS[@]}"; do
    PIDS=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ ! -z "$PIDS" ]; then
        for PID in $PIDS; do
            PROCESS=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
            if [[ ! "$PROCESS" =~ docker ]] && [[ ! "$PROCESS" =~ com.docker ]]; then
                log_warning "Killing non-Docker process on port $PORT: $PROCESS (PID: $PID)"
                kill -9 $PID 2>/dev/null || true
            fi
        done
    fi
done

# Step 3: Ensure /etc/hosts has domain mappings
log_info "Verifying domain mappings..."

HOSTS_FILE="/etc/hosts"
REQUIRED_DOMAINS="127.0.0.1 sn.local.com snapi.local.com"

if ! grep -q "sn.local.com" "$HOSTS_FILE" 2>/dev/null; then
    log_warning "Domain mappings missing from /etc/hosts"
    log_fix "Adding domain mappings (requires sudo)..."
    
    # Backup hosts file
    sudo cp "$HOSTS_FILE" "$HOSTS_FILE.backup.$(date +%s)" 2>/dev/null || true
    
    # Add domains
    echo "$REQUIRED_DOMAINS" | sudo tee -a "$HOSTS_FILE" >/dev/null
    log_success "Added domain mappings to /etc/hosts"
else
    log_success "Domain mappings already present"
fi

# Step 4: Clean Docker state if needed
log_info "Checking Docker state..."

# Stop any existing containers
if docker-compose ps -q 2>/dev/null | grep -q .; then
    log_info "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
fi

# Clean up dangling networks/volumes if they're causing issues
log_info "Cleaning Docker resources..."
docker network prune -f >/dev/null 2>&1 || true
docker volume prune -f >/dev/null 2>&1 || true

# Step 5: Start services with health verification
log_info "Starting Docker services..."

docker-compose up -d --build

# Step 6: Verify startup success
log_info "Verifying service startup..."

# Wait for containers to start
sleep 5

# Check container status
CONTAINERS=("shipnorth-app" "shipnorth-nginx" "shipnorth-postgres")
for CONTAINER in "${CONTAINERS[@]}"; do
    if docker ps --format "{{.Names}}" | grep -q "^$CONTAINER$"; then
        STATUS=$(docker inspect --format="{{.State.Status}}" "$CONTAINER" 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "running" ]; then
            log_success "Container $CONTAINER is running"
        else
            log_error "Container $CONTAINER status: $STATUS"
            echo "Logs for $CONTAINER:"
            docker logs "$CONTAINER" --tail=10
            exit 1
        fi
    else
        log_error "Container $CONTAINER not found"
        docker-compose ps
        exit 1
    fi
done

# Step 7: Health endpoint verification with retries
log_info "Verifying service health endpoints..."

# Function to test endpoint with retries
test_endpoint() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -m 5 "$url" >/dev/null 2>&1; then
            log_success "$name is responding ($url)"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    log_error "$name not responding after $max_attempts attempts"
    log_fix "Troubleshooting $name..."
    
    # Service-specific troubleshooting
    if [[ "$url" =~ "sn.local.com" ]]; then
        echo "Frontend troubleshooting:"
        docker exec shipnorth-app ps aux | grep node || true
        docker exec shipnorth-app curl -s http://localhost:8849 | head -5 || echo "Direct port test failed"
    elif [[ "$url" =~ "snapi.local.com" ]]; then
        echo "API troubleshooting:"  
        docker exec shipnorth-app curl -s http://localhost:8850/health || echo "Direct API test failed"
    fi
    
    return 1
}

# Test all endpoints
test_endpoint "http://sn.local.com" "Frontend (Next.js)"
test_endpoint "http://snapi.local.com/health" "API (Express)"

# Test database connectivity
if docker exec shipnorth-postgres pg_isready -U shipnorth >/dev/null 2>&1; then
    log_success "PostgreSQL database is ready"
else
    log_error "PostgreSQL database not ready"
    docker exec shipnorth-postgres pg_isready -U shipnorth
    exit 1
fi

# Step 8: Performance and connectivity verification
log_info "Running connectivity performance tests..."

# Test response times
WEB_TIME=$(curl -o /dev/null -s -w "%{time_total}" "http://sn.local.com" || echo "0")
API_TIME=$(curl -o /dev/null -s -w "%{time_total}" "http://snapi.local.com/health" || echo "0")

if (( $(echo "$WEB_TIME > 0" | bc -l) )); then
    log_success "Frontend response time: ${WEB_TIME}s"
else
    log_warning "Frontend response time test failed"
fi

if (( $(echo "$API_TIME > 0" | bc -l) )); then
    log_success "API response time: ${API_TIME}s"  
else
    log_warning "API response time test failed"
fi

echo ""
echo "🎉 SMART STARTUP COMPLETE!"
echo "✅ All services verified and ready for testing"
echo "📊 Service URLs:"
echo "   • Frontend: http://sn.local.com"
echo "   • API: http://snapi.local.com"  
echo "   • Database: localhost:5432"
echo ""