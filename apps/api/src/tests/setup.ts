import dotenv from 'dotenv';
import path from 'path';

// Load main environment variables first
dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
});

// Load test-specific overrides if available
dotenv.config({
  path: path.resolve(__dirname, '../../.env.test'),
  override: true,
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DYNAMODB_TABLE_NAME = 'shipnorth-test';

// Override database host for local testing
process.env.POSTGRES_HOST = process.env.TEST_POSTGRES_HOST || 'localhost';

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
