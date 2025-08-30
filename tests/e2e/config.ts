// Environment configuration for Playwright tests
// Usage: TEST_ENV=dev npm run test:e2e
// Supported environments: local, dev, staging, prod

const environments = {
  local: {
    apiUrl: `http://localhost:${process.env.API_PORT || 8850}`,
    webUrl: `http://localhost:${process.env.WEB_PORT || 8849}`,
  },
  dev: {
    apiUrl: 'https://rv6q5b27n2.execute-api.ca-central-1.amazonaws.com',
    webUrl: 'https://d3i19husj7b5d7.cloudfront.net',
  },
  staging: {
    apiUrl: process.env.STAGING_API_URL || 'https://staging-api.shipnorth.com',
    webUrl: process.env.STAGING_WEB_URL || 'https://staging.shipnorth.com',
  },
  prod: {
    apiUrl: process.env.PROD_API_URL || 'https://api.shipnorth.com',
    webUrl: process.env.PROD_WEB_URL || 'https://shipnorth.com',
  },
};

const testEnv = process.env.TEST_ENV || 'local';

if (!environments[testEnv]) {
  throw new Error(
    `Invalid TEST_ENV: ${testEnv}. Supported environments: ${Object.keys(environments).join(', ')}`
  );
}

export const config = {
  // Current environment
  environment: testEnv,

  // URLs for current environment
  ...environments[testEnv],

  // Test user credentials (same across environments)
  testUsers: {
    admin: {
      email: 'admin@shipnorth.com',
      password: 'admin123',
    },
    staff: {
      email: 'staff@shipnorth.com',
      password: 'staff123',
    },
    customer: {
      email: 'test@test.com', // Use existing test customer
      password: 'test123',
    },
    driver: {
      email: 'driver@shipnorth.com',
      password: 'driver123',
    },
  },

  // Environment-specific settings
  timeout: testEnv === 'local' ? 10000 : 30000,
  retries: testEnv === 'prod' ? 3 : 1,
};
