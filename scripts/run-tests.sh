#!/bin/bash

# Permanent Test Runner for Shipnorth
# Ensures tests always run from correct directory with proper formatting

set -e

# Change to project root directory
cd "$(dirname "$0")/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Shipnorth Test Runner${NC}"
echo -e "${CYAN}=========================${NC}"
echo ""

# Check if we're in the correct directory
if [ ! -f "full-test-suite.js" ]; then
    echo -e "${RED}❌ Error: full-test-suite.js not found${NC}"
    echo -e "${RED}   Make sure you're running this from the project root${NC}"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js not found${NC}"
    echo -e "${RED}   Please install Node.js to run tests${NC}"
    exit 1
fi

# Run the enhanced test suite
echo -e "${YELLOW}🔧 Running enhanced test suite...${NC}"
echo ""

# Execute the test suite and capture exit code
set +e
node full-test-suite.js
EXIT_CODE=$?
set -e

echo ""
echo -e "${CYAN}=========================${NC}"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests need attention (exit code: $EXIT_CODE)${NC}"
fi

echo -e "${CYAN}🎯 Test Results Template: DISPLAYED${NC}"
echo ""

exit $EXIT_CODE