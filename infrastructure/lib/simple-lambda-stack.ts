import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

export class SimpleLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const env = this.node.tryGetContext('environment') || 'dev';

    // Import existing DynamoDB table
    const tableName = `shipnorth-${env}-main`;

    // Import secrets
    const secrets = secretsmanager.Secret.fromSecretNameV2(
      this,
      'ShipnorthSecrets',
      `shipnorth/${env}/secrets`
    );

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
        DYNAMODB_TABLE: tableName,
        CORS_ORIGIN: '*',
      },
    });

    // Grant permissions to Lambda
    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${tableName}`,
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${tableName}/index/*`,
        ],
      })
    );

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

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url!,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiFunction.functionName,
      description: 'Lambda function name',
    });
  }
}
