/**
 * Docker Test Configuration
 * Uses container networking for test runner inside Docker
 */

// For Docker environment, use container names instead of localhost
const WEB_PORT = process.env.WEB_PORT || '8849';
const API_PORT = process.env.API_PORT || '8850';

const useContainerNetworking = process.env.TEST_ENV === 'docker' || 
                               process.env.TEST_WEB_URL || 
                               process.env.TEST_API_URL;

export const dockerConfig = {
  // Use container networking when available, fallback to localhost
  webUrl: useContainerNetworking 
    ? (process.env.TEST_WEB_URL || `http://shipnorth-app:${WEB_PORT}`)
    : `http://localhost:${WEB_PORT}`,
    
  apiUrl: useContainerNetworking
    ? (process.env.TEST_API_URL || `http://shipnorth-app:${API_PORT}`)
    : `http://localhost:${API_PORT}`,

  // Test timeouts  
  timeout: 30000,
  retries: 1,

  // Test users (matching PostgreSQL seed data)
  testUsers: {
    admin: { email: 'admin@shipnorth.com', password: 'admin123' },
    staff: { email: 'staff@shipnorth.com', password: 'staff123' },
    customer: { email: 'test@test.com', password: 'test123' },
    driver: { email: 'driver@shipnorth.com', password: 'driver123' }
  }
};

// Export both for compatibility
export const config = dockerConfig;
export default dockerConfig;