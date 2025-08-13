#!/bin/bash

# AWS Setup Script for Shipnorth
# This script sets up all AWS resources needed for the CI/CD pipeline

set -e

echo "🚀 Setting up AWS infrastructure for Shipnorth"

# Configuration
REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${1:-dev}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Checking AWS credentials...${NC}"
aws sts get-caller-identity

echo -e "${YELLOW}Step 2: Creating S3 buckets...${NC}"
aws s3 mb s3://shipnorth-${ENVIRONMENT}-uploads --region $REGION 2>/dev/null || echo "Bucket already exists"
aws s3 mb s3://shipnorth-${ENVIRONMENT}-manifests --region $REGION 2>/dev/null || echo "Bucket already exists"

echo -e "${YELLOW}Step 3: Creating VPC and networking...${NC}"
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region $REGION --query 'Vpc.VpcId' --output text 2>/dev/null || echo "")
if [ ! -z "$VPC_ID" ]; then
  aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=shipnorth-${ENVIRONMENT}-vpc --region $REGION
  echo "Created VPC: $VPC_ID"
else
  echo "VPC already exists or error occurred"
fi

echo -e "${YELLOW}Step 4: Setting up ALB...${NC}"
# This would be done by CDK

echo -e "${YELLOW}Step 5: Creating ECS Cluster...${NC}"
aws ecs create-cluster --cluster-name shipnorth-cluster-${ENVIRONMENT} --region $REGION 2>/dev/null || echo "Cluster already exists"

echo -e "${YELLOW}Step 6: Creating task definitions...${NC}"
cat > /tmp/api-task-def.json << EOF
{
  "family": "shipnorth-api-${ENVIRONMENT}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "905418363362.dkr.ecr.${REGION}.amazonaws.com/shipnorth-api-${ENVIRONMENT}:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "4000"},
        {"name": "AWS_REGION", "value": "${REGION}"},
        {"name": "DYNAMODB_TABLE", "value": "shipnorth-${ENVIRONMENT}-main"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/shipnorth-api-${ENVIRONMENT}",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
EOF

cat > /tmp/web-task-def.json << EOF
{
  "family": "shipnorth-web-${ENVIRONMENT}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "905418363362.dkr.ecr.${REGION}.amazonaws.com/shipnorth-web-${ENVIRONMENT}:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"},
        {"name": "NEXT_PUBLIC_API_URL", "value": "https://api-${ENVIRONMENT}.shipnorth.com"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/shipnorth-web-${ENVIRONMENT}",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "web"
        }
      }
    }
  ]
}
EOF

# Create log groups
aws logs create-log-group --log-group-name /ecs/shipnorth-api-${ENVIRONMENT} --region $REGION 2>/dev/null || echo "Log group exists"
aws logs create-log-group --log-group-name /ecs/shipnorth-web-${ENVIRONMENT} --region $REGION 2>/dev/null || echo "Log group exists"

# Register task definitions
aws ecs register-task-definition --cli-input-json file:///tmp/api-task-def.json --region $REGION
aws ecs register-task-definition --cli-input-json file:///tmp/web-task-def.json --region $REGION

echo -e "${GREEN}✅ AWS infrastructure setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Build and push Docker images:"
echo "   npm run docker:build"
echo "   ./scripts/push-images.sh"
echo ""
echo "2. Deploy with CDK:"
echo "   cd infrastructure && npx cdk deploy"
echo ""
echo "3. Create GitHub repository and push code:"
echo "   gh repo create shipnorth --public"
echo "   git remote add origin https://github.com/YOUR_USERNAME/shipnorth.git"
echo "   git push -u origin main"
echo ""
echo "4. Set GitHub secrets:"
echo "   gh secret set AWS_ACCESS_KEY_ID"
echo "   gh secret set AWS_SECRET_ACCESS_KEY"
echo ""
echo "ECR Repositories:"
echo "  - API: 905418363362.dkr.ecr.${REGION}.amazonaws.com/shipnorth-api-${ENVIRONMENT}"
echo "  - Web: 905418363362.dkr.ecr.${REGION}.amazonaws.com/shipnorth-web-${ENVIRONMENT}"