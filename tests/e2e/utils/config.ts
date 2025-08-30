/**
 * Test Configuration Utility - References Centralized Environment
 * NO HARDCODED URLS OR PORTS - All derived from environment
 */

// Import environment variables (fallback to reasonable defaults)
const WEB_PORT = process.env.WEB_PORT || '8849';
const API_PORT = process.env.API_PORT || '8850';

export const TEST_CONFIG = {
  // Base URLs derived from environment
  WEB_URL: `http://localhost:${WEB_PORT}`,
  API_URL: `http://localhost:${API_PORT}`,
  
  // Specific endpoints
  ENDPOINTS: {
    HEALTH: `http://localhost:${API_PORT}/health`,
    LOGIN: `http://localhost:${API_PORT}/auth/login`,
    HOMEPAGE: `http://localhost:${WEB_PORT}`,
    LOGIN_PAGE: `http://localhost:${WEB_PORT}/login`,
    STAFF_PORTAL: `http://localhost:${WEB_PORT}/staff`,
    CUSTOMER_PORTAL: `http://localhost:${WEB_PORT}/portal`, 
    DRIVER_PORTAL: `http://localhost:${WEB_PORT}/driver`,
  },
  
  // Test timeouts
  TIMEOUTS: {
    PAGE_LOAD: 15000,
    API_CALL: 10000,
    LOGIN_FLOW: 20000,
    INFRASTRUCTURE: 60000
  },
  
  // Test users (matching PostgreSQL seed data)
  USERS: {
    admin: { email: 'admin@shipnorth.com', password: 'admin123' },
    staff: { email: 'staff@shipnorth.com', password: 'staff123' },
    customer: { email: 'test@test.com', password: 'test123' },
    driver: { email: 'driver@shipnorth.com', password: 'driver123' }
  }
};

export default TEST_CONFIG;