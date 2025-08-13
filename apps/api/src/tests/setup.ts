import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../.env.test'),
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DYNAMODB_TABLE_NAME = 'shipnorth-test';

// Mock console during tests to reduce noise
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}