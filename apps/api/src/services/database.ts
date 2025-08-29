import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client
// Use default credentials from AWS CLI/SDK
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ca-central-1',
  // Don't specify credentials - use default chain
});

export const dynamodb = DynamoDBDocumentClient.from(client);
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'shipnorth-dev-main';

// Helper function to generate IDs
export const generateId = () => uuidv4();

// Base database operations
export class DatabaseService {
  static async put(item: any) {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return dynamodb.send(command);
  }

  static async get(pk: string, sk: string) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    });
    const result = await dynamodb.send(command);
    return result.Item;
  }

  static async query(params: any) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      ...params,
    });
    const result = await dynamodb.send(command);
    return result.Items || [];
  }

  static async update(pk: string, sk: string, updates: any) {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};

    Object.keys(updates).forEach((key, index) => {
      const placeholder = `#attr${index}`;
      const valuePlaceholder = `:val${index}`;

      updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
      expressionAttributeNames[placeholder] = key;
      expressionAttributeValues[valuePlaceholder] = updates[key];
    });

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamodb.send(command);
    return result.Attributes;
  }

  static async delete(pk: string, sk: string) {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    });
    return dynamodb.send(command);
  }

  static async scan(params?: any) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      ...params,
    });
    const result = await dynamodb.send(command);
    return result.Items || [];
  }

  static async batchWrite(items: any[]) {
    const putRequests = items.map((item) => ({
      PutRequest: {
        Item: {
          ...item,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    }));

    const command = new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: putRequests,
      },
    });

    return dynamodb.send(command);
  }

  static async queryByGSI(indexName: string, pkValue: string, skValue?: string) {
    const params: any = {
      IndexName: indexName,
      KeyConditionExpression: `${indexName}PK = :pk`,
      ExpressionAttributeValues: {
        ':pk': pkValue,
      },
    };

    if (skValue) {
      params.KeyConditionExpression += ` AND ${indexName}SK = :sk`;
      params.ExpressionAttributeValues[':sk'] = skValue;
    }

    return this.query(params);
  }
}
