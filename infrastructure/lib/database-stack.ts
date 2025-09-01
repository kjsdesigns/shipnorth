import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'prod';
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // VPC for RDS (if deploying to AWS RDS in future)
    this.vpc = new ec2.Vpc(this, 'ShipnorthVpc', {
      maxAzs: 2,
      natGateways: 1, // Cost optimization for dev
    });

    // Note: PostgreSQL currently runs in Docker containers
    // This infrastructure is prepared for future AWS RDS migration if needed
    
    // RDS PostgreSQL instance (commented out - using Docker)
    /*
    this.database = new rds.DatabaseInstance(this, 'ShipnorthDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      credentials: rds.Credentials.fromGeneratedSecret('shipnorth-admin'),
      databaseName: 'shipnorth',
      deleteAutomatedBackups: props.environment !== 'prod',
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });
    */

    // Output information for potential future AWS deployment
    new cdk.CfnOutput(this, 'DatabaseType', {
      value: 'PostgreSQL (Docker)',
      description: 'Database type and deployment method',
    });

    new cdk.CfnOutput(this, 'DatabaseLocation', {
      value: 'Docker Container (shipnorth-postgres)',
      description: 'Database location and access method',
    });
  }
}