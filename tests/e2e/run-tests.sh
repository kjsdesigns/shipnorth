#!/bin/bash

# Shipnorth E2E Test Runner - Bash Version
# Simple wrapper for common test execution scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SUITE="all"
ENV="local"
BROWSER="chromium"
HEADED=false
DEBUG=false
CLEAN=false
REPORT=false
HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --suite)
      SUITE="$2"
      shift 2
      ;;
    --env)
      ENV="$2"
      shift 2
      ;;
    --browser)
      BROWSER="$2"
      shift 2
      ;;
    --headed)
      HEADED=true
      shift
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    --report)
      REPORT=true
      shift
      ;;
    --help)
      HELP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      HELP=true
      shift
      ;;
  esac
done

# Help function
show_help() {
  echo -e "${BLUE}🚢 Shipnorth E2E Test Runner${NC}"
  echo ""
  echo "Usage: ./run-tests.sh [options]"
  echo ""
  echo "Options:"
  echo "  --suite <name>    Test suite (smoke, core, mobile, api, ui, workflows, all)"
  echo "  --env <env>       Environment (local, dev, staging, prod)"
  echo "  --browser <name>  Browser (chromium, webkit, all)"
  echo "  --headed          Run in headed mode"
  echo "  --debug           Run in debug mode"
  echo "  --clean           Clean test results first"
  echo "  --report          Show report after tests"
  echo "  --help            Show this help"
  echo ""
  echo "Examples:"
  echo "  ./run-tests.sh --suite smoke --env dev"
  echo "  ./run-tests.sh --suite mobile --headed"
  echo "  ./run-tests.sh --clean --suite all --report"
}

# Clean test results
clean_results() {
  echo -e "${YELLOW}🧹 Cleaning test results...${NC}"
  rm -rf test-results
  mkdir -p test-results
  echo -e "${GREEN}✅ Test results cleaned${NC}"
}

# Build and run playwright command
run_tests() {
  local cmd="npx playwright test"
  
  # Set environment
  export TEST_ENV=$ENV
  
  # Add suite-specific options
  case $SUITE in
    smoke)
      cmd="$cmd --grep @smoke"
      ;;
    core)
      cmd="$cmd --project desktop-core"
      ;;
    mobile)
      cmd="$cmd --project mobile-core"
      ;;
    api)
      cmd="$cmd api-integration.spec.ts"
      ;;
    ui)
      cmd="$cmd ui-ux.spec.ts"
      ;;
    workflows)
      cmd="$cmd end-to-end.spec.ts"
      ;;
    all)
      # Run all tests (default config)
      ;;
  esac
  
  # Add browser selection
  if [[ $BROWSER == "webkit" ]]; then
    cmd="$cmd --project safari-desktop"
  fi
  
  # Add execution options
  if [[ $HEADED == true ]]; then
    cmd="$cmd --headed"
  fi
  
  if [[ $DEBUG == true ]]; then
    cmd="$cmd --debug"
  fi
  
  echo -e "${BLUE}🚀 Starting tests...${NC}"
  echo -e "${YELLOW}📋 Suite: $SUITE${NC}"
  echo -e "${YELLOW}🌍 Environment: $ENV${NC}"
  echo -e "${YELLOW}🌐 Browser: $BROWSER${NC}"
  echo -e "${YELLOW}⚡ Command: $cmd${NC}"
  echo "────────────────────────────────────────"
  
  # Run the command
  if eval $cmd; then
    echo -e "${GREEN}✅ Tests completed successfully${NC}"
    return 0
  else
    echo -e "${RED}❌ Some tests failed${NC}"
    return 1
  fi
}

# Show test report
show_report() {
  if [[ $REPORT == true ]]; then
    echo -e "${BLUE}📊 Opening test report...${NC}"
    npx playwright show-report
  fi
}

# Main execution
main() {
  echo -e "${BLUE}🚢 Shipnorth E2E Test Runner${NC}"
  echo -e "${BLUE}🏗️  Modular Test Architecture${NC}"
  echo ""
  
  if [[ $HELP == true ]]; then
    show_help
    exit 0
  fi
  
  if [[ $CLEAN == true ]]; then
    clean_results
  fi
  
  local start_time=$(date +%s)
  
  if run_tests; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "════════════════════════════════════════"
    echo -e "${GREEN}🎉 Test Summary${NC}"
    echo "════════════════════════════════════════"
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo -e "⏱️  Duration: ${duration}s"
    echo -e "📋 Suite: $SUITE"
    echo -e "🌍 Environment: $ENV"
    echo ""
    echo -e "${BLUE}📁 Test Results:${NC}"
    echo "   HTML Report: test-results/html-report/index.html"
    echo "   JSON Results: test-results/results.json"
    echo "════════════════════════════════════════"
    
    show_report
    exit 0
  else
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "════════════════════════════════════════"
    echo -e "${RED}💥 Test Summary${NC}"
    echo "════════════════════════════════════════"
    echo -e "${RED}❌ Some tests failed${NC}"
    echo -e "⏱️  Duration: ${duration}s"
    echo -e "📋 Suite: $SUITE"
    echo -e "🌍 Environment: $ENV"
    echo ""
    echo -e "${YELLOW}🔧 Check the HTML report for details${NC}"
    echo "════════════════════════════════════════"
    
    show_report
    exit 1
  fi
}

# Run main function
main