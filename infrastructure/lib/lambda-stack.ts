import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

export class ShipnorthLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const env = this.node.tryGetContext('environment') || 'dev';

    // DynamoDB no longer used - migrated to PostgreSQL

    // Import secrets
    const secrets = secretsmanager.Secret.fromSecretNameV2(
      this,
      'ShipnorthSecrets',
      `shipnorth/${env}/secrets`
    );

    // Create S3 bucket for static web hosting
    const webBucket = new s3.Bucket(this, 'WebBucket', {
      bucketName: `shipnorth-web-${env}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create Origin Access Identity for CloudFront
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${env} distribution`,
    });

    // Grant read permissions to CloudFront
    webBucket.grantRead(oai);

    // Create Lambda function for API
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `shipnorth-api-${env}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../apps/api/lambda-bundle')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        NODE_ENV: 'production',
        // DYNAMODB_TABLE: tableName,  // Removed - using PostgreSQL
        POSTGRES_HOST: process.env.POSTGRES_HOST || 'postgres',
        POSTGRES_DB: process.env.POSTGRES_DB || 'shipnorth',
        POSTGRES_USER: process.env.POSTGRES_USER || 'shipnorth',
        CORS_ORIGIN: env === 'prod' ? 'https://shipnorth.com' : '*',
      },
    });

    // DynamoDB permissions removed - now using PostgreSQL
    // PostgreSQL connection will be handled via VPC/security groups

    // Grant S3 permissions
    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`arn:aws:s3:::shipnorth-${env}-uploads/*`],
      })
    );

    // Grant SES permissions
    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );

    // Grant SNS permissions
    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: ['*'],
      })
    );

    // Grant access to secrets
    secrets.grantRead(apiFunction);

    // Add environment variables (secrets will be read at runtime)
    apiFunction.addEnvironment('SECRETS_ARN', secrets.secretArn);
    apiFunction.addEnvironment('JWT_SECRET', 'will-be-loaded-from-secrets-manager');
    apiFunction.addEnvironment('JWT_REFRESH_SECRET', 'will-be-loaded-from-secrets-manager');

    // Create API Gateway
    const httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: `shipnorth-api-${env}`,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
      },
    });

    // Create Lambda integration
    const integration = new apigatewayIntegrations.HttpLambdaIntegration(
      'ApiIntegration',
      apiFunction
    );

    // Add routes
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration,
    });

    httpApi.addRoutes({
      path: '/',
      methods: [apigateway.HttpMethod.ANY],
      integration,
    });

    // Create CloudFront distribution for web app
    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(webBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url!,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WebUrl', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'WebBucketName', {
      value: webBucket.bucketName,
      description: 'S3 bucket for web hosting',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiFunction.functionName,
      description: 'Lambda function name',
    });
  }
}
