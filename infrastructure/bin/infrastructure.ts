#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';

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