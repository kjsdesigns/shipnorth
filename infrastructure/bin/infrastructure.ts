#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { SimpleLambdaStack } from '../lib/simple-lambda-stack';
import { WebStack } from '../lib/web-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';

// Database Stack
new DatabaseStack(app, `ShipnorthDatabase-${environment}`, {
  environment: environment as 'dev' | 'staging' | 'prod',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '905418363362',
    region: process.env.CDK_DEFAULT_REGION || 'ca-central-1',
  },
  stackName: `shipnorth-database-${environment}`,
  description: `Shipnorth DynamoDB tables for ${environment} environment`,
});

// Simple Lambda Stack (API)
new SimpleLambdaStack(app, `ShipnorthSimple-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '905418363362',
    region: process.env.CDK_DEFAULT_REGION || 'ca-central-1',
  },
  stackName: `shipnorth-simple-${environment}`,
  description: `Shipnorth Lambda API for ${environment} environment`,
});

// Web Stack (Frontend)
new WebStack(app, `ShipnorthWeb-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '905418363362',
    region: process.env.CDK_DEFAULT_REGION || 'ca-central-1',
  },
  stackName: `shipnorth-web-${environment}`,
  description: `Shipnorth Web Frontend for ${environment} environment`,
});
