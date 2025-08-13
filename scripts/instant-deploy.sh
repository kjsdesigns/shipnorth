#!/bin/bash

# Instant Deploy - Deploys immediately to AWS without GitHub
# Usage: ./scripts/instant-deploy.sh [environment]

set -e

ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting instant deployment to $ENVIRONMENT${NC}"

# Step 1: Build
echo -e "${YELLOW}Building applications...${NC}"
npm run build

# Step 2: Deploy infrastructure
echo -e "${YELLOW}Deploying infrastructure with CDK...${NC}"
cd infrastructure
npx cdk deploy --all --require-approval never --context environment=$ENVIRONMENT
cd ..

# Step 3: Get stack outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name shipnorth-lambda-$ENVIRONMENT \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text 2>/dev/null || echo "Not deployed")

WEB_URL=$(aws cloudformation describe-stacks \
  --stack-name shipnorth-lambda-$ENVIRONMENT \
  --query 'Stacks[0].Outputs[?OutputKey==`WebUrl`].OutputValue' \
  --output text 2>/dev/null || echo "Not deployed")

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 URLs:"
echo "   API: $API_URL"
echo "   Web: $WEB_URL"
echo ""
echo "No GitHub or manual configuration needed!"