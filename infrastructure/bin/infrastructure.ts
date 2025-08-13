#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ShipnorthLambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';

// Database Stack
new DatabaseStack(app, `ShipnorthDatabase-${environment}`, {
  environment: environment as 'dev' | 'staging' | 'prod',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '905418363362',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stackName: `shipnorth-database-${environment}`,
  description: `Shipnorth DynamoDB tables for ${environment} environment`,
});

// Lambda Stack
new ShipnorthLambdaStack(app, `ShipnorthLambda-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '905418363362',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stackName: `shipnorth-lambda-${environment}`,
  description: `Shipnorth Lambda functions and API Gateway for ${environment} environment`,
});