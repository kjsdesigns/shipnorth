#!/bin/bash

# Docker Health Monitor
# Monitors Docker daemon and container health with automatic restart capabilities

set -e

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

echo "🏥 Docker Health Monitor"
echo "======================"

# Function to check if Colima is running
check_colima() {
    if colima status >/dev/null 2>&1; then
        log_success "Colima is running"
        return 0
    else
        log_error "Colima is not running"
        return 1
    fi
}

# Function to restart Colima with proper resources
restart_colima() {
    log_fix "Restarting Colima with optimized settings..."
    colima stop >/dev/null 2>&1 || true
    colima start --cpu 4 --memory 8 --disk 60 --vm-type vz >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "Colima restarted successfully"
        return 0
    else
        log_error "Failed to restart Colima"
        return 1
    fi
}

# Function to check Docker daemon
check_docker_daemon() {
    if docker info >/dev/null 2>&1; then
        log_success "Docker daemon is healthy"
        return 0
    else
        log_error "Docker daemon is not responding"
        return 1
    fi
}

# Function to check container health
check_containers() {
    local containers=("shipnorth-app" "shipnorth-postgres")
    local all_healthy=true
    
    for container in "${containers[@]}"; do
        if docker ps -q -f name="$container" | grep -q .; then
            local status=$(docker inspect --format="{{.State.Status}}" "$container" 2>/dev/null)
            local health=$(docker inspect --format="{{.State.Health.Status}}" "$container" 2>/dev/null || echo "none")
            
            if [ "$status" = "running" ]; then
                if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
                    log_success "Container $container: $status (health: $health)"
                else
                    log_warning "Container $container: $status but unhealthy (health: $health)"
                    all_healthy=false
                fi
            else
                log_error "Container $container: $status"
                all_healthy=false
            fi
        else
            log_error "Container $container: not found"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to check service endpoints
check_endpoints() {
    # Get ports from environment variables
    local WEB_PORT=${WEB_PORT:-8849}
    local API_PORT=${API_PORT:-8850}
    
    local endpoints=(
        "http://localhost:$WEB_PORT,Frontend"
        "http://localhost:$API_PORT/health,API"
    )
    
    local all_responding=true
    
    for endpoint in "${endpoints[@]}"; do
        IFS=',' read -r url name <<< "$endpoint"
        
        if curl -f -s -m 5 "$url" >/dev/null 2>&1; then
            log_success "$name endpoint responding: $url"
        else
            log_error "$name endpoint not responding: $url"
            all_responding=false
        fi
    done
    
    if [ "$all_responding" = true ]; then
        return 0
    else
        return 1
    fi
}

# Main health check function
perform_health_check() {
    local issues=0
    
    echo ""
    log_info "Performing comprehensive health check..."
    
    # Check Colima
    if ! check_colima; then
        if restart_colima; then
            log_success "Colima recovery successful"
        else
            log_error "Colima recovery failed"
            ((issues++))
        fi
    fi
    
    # Check Docker daemon
    if ! check_docker_daemon; then
        log_error "Docker daemon health check failed"
        ((issues++))
    fi
    
    # Check containers
    if ! check_containers; then
        log_warning "Some containers are unhealthy"
        log_fix "Consider restarting containers: docker-compose restart"
        ((issues++))
    fi
    
    # Check endpoints
    if ! check_endpoints; then
        log_warning "Some service endpoints are not responding"
        ((issues++))
    fi
    
    echo ""
    if [ $issues -eq 0 ]; then
        log_success "All health checks passed! 🎉"
        echo "System is healthy and ready for development."
    else
        log_warning "Found $issues issue(s) requiring attention"
        echo ""
        echo "Recommended actions:"
        echo "1. Check Docker logs: docker-compose logs"
        echo "2. Restart services: docker-compose restart"
        echo "3. Full rebuild: docker-compose down && docker-compose up --build -d"
        echo "4. Monitor with: ./scripts/docker-health-monitor.sh --monitor"
    fi
    
    return $issues
}

# Continuous monitoring mode
monitor_mode() {
    log_info "Starting continuous monitoring mode (Ctrl+C to stop)"
    
    while true; do
        clear
        echo "$(date): Docker Health Monitor - Continuous Mode"
        perform_health_check
        
        echo ""
        echo "Next check in 30 seconds..."
        sleep 30
    done
}

# Parse command line arguments
case "${1:-}" in
    --monitor|-m)
        monitor_mode
        ;;
    --help|-h)
        echo "Docker Health Monitor"
        echo ""
        echo "Usage:"
        echo "  $0                  Run single health check"
        echo "  $0 --monitor        Run continuous monitoring"
        echo "  $0 --help          Show this help"
        ;;
    *)
        perform_health_check
        exit $?
        ;;
esac