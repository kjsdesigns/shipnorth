#!/bin/bash

# Shipnorth Auto-Deploy Script
# This script watches for changes and automatically deploys to AWS
# No GitHub required - runs entirely locally!

set -e

# Configuration
WATCH_INTERVAL=5  # seconds
DEPLOY_DELAY=10   # seconds to wait after changes stop
AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${1:-dev}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Shipnorth Auto-Deploy Started${NC}"
echo -e "${YELLOW}Watching for changes... (Press Ctrl+C to stop)${NC}"

# Function to calculate checksum of source files
calculate_checksum() {
  find apps/api/src apps/web/app infrastructure/lib -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -exec md5sum {} \; | sort | md5sum | cut -d' ' -f1
}

# Function to deploy
deploy() {
  echo -e "${GREEN}🔄 Starting deployment...${NC}"
  
  # Build
  echo "Building applications..."
  npm run build
  
  # Deploy infrastructure
  echo "Deploying infrastructure..."
  cd infrastructure
  npx cdk deploy --all --require-approval never --context environment=$ENVIRONMENT
  cd ..
  
  # Deploy Lambda (if exists)
  if aws lambda get-function --function-name shipnorth-api-$ENVIRONMENT &>/dev/null; then
    echo "Updating Lambda function..."
    cd apps/api
    zip -r function.zip dist node_modules
    aws lambda update-function-code \
      --function-name shipnorth-api-$ENVIRONMENT \
      --zip-file fileb://function.zip \
      --region $AWS_REGION
    cd ../..
  fi
  
  # Deploy to S3 (if bucket exists)
  if aws s3 ls s3://shipnorth-web-$ENVIRONMENT &>/dev/null; then
    echo "Deploying web app to S3..."
    cd apps/web
    npm run build
    aws s3 sync .next/static s3://shipnorth-web-$ENVIRONMENT/ --delete
    cd ../..
  fi
  
  echo -e "${GREEN}✅ Deployment complete!${NC}"
}

# Initial checksum
LAST_CHECKSUM=$(calculate_checksum)
LAST_CHANGE_TIME=0

# Main watch loop
while true; do
  CURRENT_CHECKSUM=$(calculate_checksum)
  
  if [ "$CURRENT_CHECKSUM" != "$LAST_CHECKSUM" ]; then
    echo -e "${YELLOW}📝 Changes detected!${NC}"
    LAST_CHECKSUM=$CURRENT_CHECKSUM
    LAST_CHANGE_TIME=$(date +%s)
  fi
  
  # Check if we should deploy (changes detected and stable for DEPLOY_DELAY seconds)
  if [ $LAST_CHANGE_TIME -gt 0 ]; then
    CURRENT_TIME=$(date +%s)
    TIME_SINCE_CHANGE=$((CURRENT_TIME - LAST_CHANGE_TIME))
    
    if [ $TIME_SINCE_CHANGE -ge $DEPLOY_DELAY ]; then
      deploy
      LAST_CHANGE_TIME=0
    else
      REMAINING=$((DEPLOY_DELAY - TIME_SINCE_CHANGE))
      echo -e "${BLUE}⏱️  Deploying in ${REMAINING} seconds...${NC}"
    fi
  fi
  
  sleep $WATCH_INTERVAL
done