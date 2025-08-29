import { test, expect } from '@playwright/test';
import { AuthHelpers } from './utils/auth-helpers';
import { CustomAssertions } from './utils/assertions';
import { TestData } from './utils/test-data';
import { config } from './config';

/**
 * API Integration - Comprehensive Test Suite
 *
 * Consolidates:
 * - api-comprehensive.spec.ts
 * - api-health.spec.ts
 * - comprehensive-integration.spec.ts
 *
 * Coverage:
 * - API endpoint functionality and data consistency
 * - Authentication and authorization
 * - Request/response validation
 * - Error handling and status codes
 * - Rate limiting and throttling
 * - Data persistence and integrity
 * - Performance and load testing
 * - Integration between frontend and backend
 */

test.describe('API Integration', () => {
  let authHelpers: AuthHelpers;
  let assertions: CustomAssertions;
  let apiBaseUrl: string;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    assertions = new CustomAssertions(page);
    apiBaseUrl = config.apiUrl;

    // Set up API headers and authentication
    await page.setExtraHTTPHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  });

  test.describe('API Health and Status', () => {
    test('should return healthy status from health endpoint @smoke', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/health`);

      expect(response.status()).toBe(200);

      const healthData = await response.json();
      expect(healthData.status).toBe('healthy');
      expect(healthData.timestamp).toBeDefined();
      expect(healthData.version).toBeDefined();
    });

    test('should return service status information @health', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/status`);

      expect(response.status()).toBe(200);

      const statusData = await response.json();
      expect(statusData.services).toBeDefined();
      expect(statusData.services.database).toBeDefined();
      expect(statusData.services.stripe).toBeDefined();
      expect(statusData.services.shipstation).toBeDefined();

      // Verify service health
      expect(['healthy', 'degraded']).toContain(statusData.services.database.status);
      expect(['healthy', 'degraded']).toContain(statusData.services.stripe.status);
      expect(['healthy', 'degraded']).toContain(statusData.services.shipstation.status);
    });

    test('should return API version and build information @health', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/version`);

      expect(response.status()).toBe(200);

      const versionData = await response.json();
      expect(versionData.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(versionData.buildDate).toBeDefined();
      expect(versionData.commitHash).toBeDefined();
      expect(versionData.environment).toBeDefined();
    });

    test('should handle API rate limiting @health', async ({ request }) => {
      // Test rate limiting by making multiple requests
      const requests = Array(210)
        .fill(null)
        .map(async () => {
          return request.get(`${apiBaseUrl}/health`);
        });

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && result.value.status() === 429
      );

      // Should have some rate limited responses after 200 requests per minute
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      if (rateLimitedResponses.length > 0) {
        const rateLimitResponse = rateLimitedResponses[0].value;
        expect(rateLimitResponse.headers()['retry-after']).toBeDefined();
        expect(rateLimitResponse.headers()['x-ratelimit-remaining']).toBeDefined();
      }
    });
  });

  test.describe('Authentication and Authorization', () => {
    test('should authenticate with valid credentials @auth', async ({ request }) => {
      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.staff.email,
          password: config.testUsers.staff.password,
        },
      });

      expect(loginResponse.status()).toBe(200);

      const authData = await loginResponse.json();
      expect(authData.token).toBeDefined();
      expect(authData.refreshToken).toBeDefined();
      expect(authData.user).toBeDefined();
      expect(authData.user.email).toBe(config.testUsers.staff.email);
      expect(authData.user.role).toBe('staff');
    });

    test('should reject invalid credentials @auth', async ({ request }) => {
      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: 'invalid@example.com',
          password: 'wrongpassword',
        },
      });

      expect(loginResponse.status()).toBe(401);

      const errorData = await loginResponse.json();
      expect(errorData.error).toBeDefined();
      expect(errorData.message).toMatch(/invalid credentials|authentication failed/i);
    });

    test('should refresh access token with valid refresh token @auth', async ({ request }) => {
      // First login to get tokens
      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.staff.email,
          password: config.testUsers.staff.password,
        },
      });

      const authData = await loginResponse.json();
      const refreshToken = authData.refreshToken;

      // Wait a moment then refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refreshResponse = await request.post(`${apiBaseUrl}/auth/refresh`, {
        data: { refreshToken },
      });

      expect(refreshResponse.status()).toBe(200);

      const refreshData = await refreshResponse.json();
      expect(refreshData.token).toBeDefined();
      expect(refreshData.refreshToken).toBeDefined();
      expect(refreshData.token).not.toBe(authData.token);
    });

    test('should require authentication for protected endpoints @auth', async ({ request }) => {
      const protectedEndpoints = [
        { method: 'GET', path: '/packages' },
        { method: 'POST', path: '/packages' },
        { method: 'GET', path: '/users' },
        { method: 'POST', path: '/users' },
      ];

      for (const endpoint of protectedEndpoints) {
        let response;

        if (endpoint.method === 'GET') {
          response = await request.get(`${apiBaseUrl}${endpoint.path}`);
        } else {
          response = await request.post(`${apiBaseUrl}${endpoint.path}`, {
            data: {},
          });
        }

        expect(response.status()).toBe(401);

        const errorData = await response.json();
        expect(errorData.error).toMatch(/unauthorized|authentication required/i);
      }
    });

    test('should enforce role-based access control @auth', async ({ request }) => {
      // Login as customer (limited permissions)
      const customerLogin = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.customer.email,
          password: config.testUsers.customer.password,
        },
      });

      const customerAuth = await customerLogin.json();

      // Try to access admin-only endpoint
      const adminResponse = await request.get(`${apiBaseUrl}/admin/users`, {
        headers: {
          Authorization: `Bearer ${customerAuth.token}`,
        },
      });

      expect(adminResponse.status()).toBe(403);

      const errorData = await adminResponse.json();
      expect(errorData.error).toMatch(/forbidden|insufficient permissions/i);
    });

    test('should handle token expiration @auth', async ({ request }) => {
      // This test would need a way to create expired tokens
      // For now, we'll test with an obviously invalid token
      const response = await request.get(`${apiBaseUrl}/packages`, {
        headers: {
          Authorization: 'Bearer invalid.token.here',
        },
      });

      expect(response.status()).toBe(401);

      const errorData = await response.json();
      expect(errorData.error).toMatch(/invalid token|token expired/i);
    });
  });

  test.describe('Package Management API', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      // Authenticate before each test
      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.staff.email,
          password: config.testUsers.staff.password,
        },
      });

      const authData = await loginResponse.json();
      authToken = authData.token;
    });

    test('should create new package @packages', async ({ request }) => {
      const packageData = {
        trackingNumber: `TEST-${Date.now()}`,
        weight: 2.5,
        dimensions: {
          length: 12,
          width: 10,
          height: 8,
        },
        destination: {
          name: 'John Doe',
          address: '123 Test Street',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M1M 1M1',
          country: 'Canada',
        },
        contents: 'Test package contents',
      };

      const response = await request.post(`${apiBaseUrl}/packages`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: packageData,
      });

      expect(response.status()).toBe(201);

      const createdPackage = await response.json();
      expect(createdPackage.id).toBeDefined();
      expect(createdPackage.trackingNumber).toBe(packageData.trackingNumber);
      expect(createdPackage.weight).toBe(packageData.weight);
      expect(createdPackage.status).toBe('pending');
      expect(createdPackage.createdAt).toBeDefined();
    });

    test('should retrieve package by ID @packages', async ({ request }) => {
      // First create a package
      const packageData = {
        trackingNumber: `RETRIEVE-${Date.now()}`,
        weight: 1.5,
        dimensions: { length: 10, width: 8, height: 6 },
        destination: {
          name: 'Jane Doe',
          address: '456 Test Avenue',
          city: 'Vancouver',
          province: 'BC',
          postalCode: 'V1V 1V1',
          country: 'Canada',
        },
      };

      const createResponse = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: packageData,
      });

      const createdPackage = await createResponse.json();

      // Then retrieve it
      const getResponse = await request.get(`${apiBaseUrl}/packages/${createdPackage.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(getResponse.status()).toBe(200);

      const retrievedPackage = await getResponse.json();
      expect(retrievedPackage.id).toBe(createdPackage.id);
      expect(retrievedPackage.trackingNumber).toBe(packageData.trackingNumber);
    });

    test('should update package status @packages', async ({ request }) => {
      // Create package
      const packageData = {
        trackingNumber: `UPDATE-${Date.now()}`,
        weight: 3.0,
        dimensions: { length: 15, width: 12, height: 10 },
        destination: {
          name: 'Test Update',
          address: '789 Update Street',
          city: 'Calgary',
          province: 'AB',
          postalCode: 'T1T 1T1',
          country: 'Canada',
        },
      };

      const createResponse = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: packageData,
      });

      const createdPackage = await createResponse.json();

      // Update status
      const updateResponse = await request.put(`${apiBaseUrl}/packages/${createdPackage.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          status: 'in_transit',
          statusMessage: 'Package is being shipped',
        },
      });

      expect(updateResponse.status()).toBe(200);

      const updatedPackage = await updateResponse.json();
      expect(updatedPackage.status).toBe('in_transit');
      expect(updatedPackage.statusMessage).toBe('Package is being shipped');
      expect(updatedPackage.updatedAt).toBeDefined();
    });

    test('should list packages with pagination @packages', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/packages?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status()).toBe(200);

      const packageList = await response.json();
      expect(packageList.packages).toBeDefined();
      expect(Array.isArray(packageList.packages)).toBeTruthy();
      expect(packageList.pagination).toBeDefined();
      expect(packageList.pagination.page).toBe(1);
      expect(packageList.pagination.limit).toBe(10);
      expect(packageList.pagination.total).toBeGreaterThanOrEqual(0);
    });

    test('should filter packages by status @packages', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/packages?status=pending`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status()).toBe(200);

      const packageList = await response.json();

      if (packageList.packages.length > 0) {
        // All returned packages should have pending status
        for (const pkg of packageList.packages) {
          expect(pkg.status).toBe('pending');
        }
      }
    });

    test('should validate package data on creation @packages', async ({ request }) => {
      // Test with invalid data
      const invalidPackageData = {
        trackingNumber: '', // Empty tracking number
        weight: -1, // Negative weight
        dimensions: {
          length: 0, // Zero dimension
          width: 10,
          height: 8,
        },
        // Missing destination
      };

      const response = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: invalidPackageData,
      });

      expect(response.status()).toBe(400);

      const errorData = await response.json();
      expect(errorData.error).toBeDefined();
      expect(errorData.validationErrors).toBeDefined();
      expect(Array.isArray(errorData.validationErrors)).toBeTruthy();
      expect(errorData.validationErrors.length).toBeGreaterThan(0);
    });

    test('should handle package not found @packages', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/packages/non-existent-id`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status()).toBe(404);

      const errorData = await response.json();
      expect(errorData.error).toMatch(/not found|package not found/i);
    });
  });

  test.describe('User Management API', () => {
    let adminToken: string;

    test.beforeEach(async ({ request }) => {
      // Authenticate as admin
      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.admin.email,
          password: config.testUsers.admin.password,
        },
      });

      const authData = await loginResponse.json();
      adminToken = authData.token;
    });

    test('should create new user @users', async ({ request }) => {
      const userData = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
        role: 'staff',
      };

      const response = await request.post(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: userData,
      });

      expect(response.status()).toBe(201);

      const createdUser = await response.json();
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.role).toBe(userData.role);
      expect(createdUser.password).toBeUndefined(); // Password should not be returned
      expect(createdUser.createdAt).toBeDefined();
    });

    test('should list users with proper permissions @users', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status()).toBe(200);

      const userList = await response.json();
      expect(userList.users).toBeDefined();
      expect(Array.isArray(userList.users)).toBeTruthy();

      // Verify user data structure
      if (userList.users.length > 0) {
        const firstUser = userList.users[0];
        expect(firstUser.id).toBeDefined();
        expect(firstUser.email).toBeDefined();
        expect(firstUser.role).toBeDefined();
        expect(firstUser.password).toBeUndefined();
      }
    });

    test('should update user information @users', async ({ request }) => {
      // First create a user
      const userData = {
        name: 'Update Test User',
        email: `update-test-${Date.now()}@example.com`,
        password: 'testpassword123',
        role: 'staff',
      };

      const createResponse = await request.post(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: userData,
      });

      const createdUser = await createResponse.json();

      // Then update it
      const updateData = {
        name: 'Updated User Name',
        role: 'driver',
      };

      const updateResponse = await request.put(`${apiBaseUrl}/users/${createdUser.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: updateData,
      });

      expect(updateResponse.status()).toBe(200);

      const updatedUser = await updateResponse.json();
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.role).toBe(updateData.role);
      expect(updatedUser.updatedAt).toBeDefined();
    });

    test('should validate user email uniqueness @users', async ({ request }) => {
      // Try to create user with existing email
      const userData = {
        name: 'Duplicate Email Test',
        email: config.testUsers.staff.email, // Use existing email
        password: 'testpassword123',
        role: 'staff',
      };

      const response = await request.post(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: userData,
      });

      expect(response.status()).toBe(400);

      const errorData = await response.json();
      expect(errorData.error).toMatch(/email.*already.*exists|duplicate.*email/i);
    });

    test('should enforce role-based access for user operations @users', async ({ request }) => {
      // Login as staff (not admin)
      const staffLoginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.staff.email,
          password: config.testUsers.staff.password,
        },
      });

      const staffAuth = await staffLoginResponse.json();

      // Try to create user as staff
      const response = await request.post(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${staffAuth.token}` },
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password',
          role: 'staff',
        },
      });

      expect(response.status()).toBe(403);

      const errorData = await response.json();
      expect(errorData.error).toMatch(/forbidden|insufficient.*permissions/i);
    });
  });

  test.describe('Tracking and Status Updates', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.staff.email,
          password: config.testUsers.staff.password,
        },
      });

      const authData = await loginResponse.json();
      authToken = authData.token;
    });

    test('should track package by tracking number @tracking', async ({ request }) => {
      // Create a package first
      const packageData = {
        trackingNumber: `TRACK-${Date.now()}`,
        weight: 1.0,
        dimensions: { length: 8, width: 6, height: 4 },
        destination: {
          name: 'Track Test',
          address: '123 Track Street',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M1M 1M1',
          country: 'Canada',
        },
      };

      await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: packageData,
      });

      // Track the package
      const trackResponse = await request.get(
        `${apiBaseUrl}/tracking/${packageData.trackingNumber}`
      );

      expect(trackResponse.status()).toBe(200);

      const trackingData = await trackResponse.json();
      expect(trackingData.trackingNumber).toBe(packageData.trackingNumber);
      expect(trackingData.status).toBeDefined();
      expect(trackingData.statusHistory).toBeDefined();
      expect(Array.isArray(trackingData.statusHistory)).toBeTruthy();
    });

    test('should update package location @tracking', async ({ request }) => {
      // Create and track a package
      const packageData = {
        trackingNumber: `LOCATION-${Date.now()}`,
        weight: 2.0,
        dimensions: { length: 10, width: 8, height: 6 },
        destination: {
          name: 'Location Test',
          address: '456 Location Ave',
          city: 'Vancouver',
          province: 'BC',
          postalCode: 'V1V 1V1',
          country: 'Canada',
        },
      };

      const createResponse = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: packageData,
      });

      const createdPackage = await createResponse.json();

      // Update location
      const locationUpdate = {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          address: 'Vancouver Distribution Center',
          timestamp: new Date().toISOString(),
        },
        status: 'in_transit',
        message: 'Package arrived at Vancouver facility',
      };

      const updateResponse = await request.post(
        `${apiBaseUrl}/packages/${createdPackage.id}/location`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: locationUpdate,
        }
      );

      expect(updateResponse.status()).toBe(200);

      // Verify tracking reflects location update
      const trackResponse = await request.get(
        `${apiBaseUrl}/tracking/${packageData.trackingNumber}`
      );
      const trackingData = await trackResponse.json();

      expect(trackingData.currentLocation).toBeDefined();
      expect(trackingData.currentLocation.address).toBe(locationUpdate.location.address);
    });

    test('should handle invalid tracking numbers @tracking', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/tracking/INVALID-TRACKING-123`);

      expect(response.status()).toBe(404);

      const errorData = await response.json();
      expect(errorData.error).toMatch(/tracking.*not.*found|invalid.*tracking/i);
    });

    test('should provide tracking history @tracking', async ({ request }) => {
      // Create package and add multiple status updates
      const packageData = {
        trackingNumber: `HISTORY-${Date.now()}`,
        weight: 1.5,
        dimensions: { length: 9, width: 7, height: 5 },
        destination: {
          name: 'History Test',
          address: '789 History Blvd',
          city: 'Calgary',
          province: 'AB',
          postalCode: 'T1T 1T1',
          country: 'Canada',
        },
      };

      const createResponse = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: packageData,
      });

      const createdPackage = await createResponse.json();

      // Add multiple status updates
      const statusUpdates = [
        { status: 'picked_up', message: 'Package picked up' },
        { status: 'in_transit', message: 'Package in transit' },
        { status: 'out_for_delivery', message: 'Package out for delivery' },
      ];

      for (const update of statusUpdates) {
        await request.put(`${apiBaseUrl}/packages/${createdPackage.id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: update,
        });

        // Wait a bit between updates
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Get tracking history
      const trackResponse = await request.get(
        `${apiBaseUrl}/tracking/${packageData.trackingNumber}`
      );
      const trackingData = await trackResponse.json();

      expect(trackingData.statusHistory.length).toBeGreaterThanOrEqual(statusUpdates.length);

      // Verify chronological order
      for (let i = 1; i < trackingData.statusHistory.length; i++) {
        const prevTimestamp = new Date(trackingData.statusHistory[i - 1].timestamp);
        const currentTimestamp = new Date(trackingData.statusHistory[i].timestamp);
        expect(currentTimestamp.getTime()).toBeGreaterThanOrEqual(prevTimestamp.getTime());
      }
    });
  });

  test.describe('Error Handling and Validation', () => {
    test('should return proper error codes @error-handling', async ({ request }) => {
      const errorScenarios = [
        {
          description: 'Invalid JSON syntax',
          endpoint: '/packages',
          method: 'POST',
          data: 'invalid json',
          expectedStatus: 400,
          headers: { Authorization: 'Bearer valid-token' },
        },
        {
          description: 'Missing required fields',
          endpoint: '/packages',
          method: 'POST',
          data: { weight: 1.0 }, // Missing required fields
          expectedStatus: 400,
          headers: { Authorization: 'Bearer valid-token' },
        },
        {
          description: 'Resource not found',
          endpoint: '/packages/non-existent-id',
          method: 'GET',
          expectedStatus: 404,
          headers: { Authorization: 'Bearer valid-token' },
        },
        {
          description: 'Unauthorized access',
          endpoint: '/packages',
          method: 'GET',
          expectedStatus: 401,
          // No Authorization header
        },
      ];

      for (const scenario of errorScenarios) {
        let response;
        const options: any = {};

        if (scenario.headers) {
          options.headers = scenario.headers;
        }

        if (scenario.data) {
          if (typeof scenario.data === 'string') {
            options.data = scenario.data;
            options.headers = { ...options.headers, 'Content-Type': 'text/plain' };
          } else {
            options.data = scenario.data;
          }
        }

        if (scenario.method === 'GET') {
          response = await request.get(`${apiBaseUrl}${scenario.endpoint}`, options);
        } else if (scenario.method === 'POST') {
          response = await request.post(`${apiBaseUrl}${scenario.endpoint}`, options);
        }

        expect(response.status()).toBe(scenario.expectedStatus);

        const errorData = await response.json();
        expect(errorData.error).toBeDefined();
      }
    });

    test('should validate request content type @error-handling', async ({ request }) => {
      const response = await request.post(`${apiBaseUrl}/packages`, {
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'text/plain',
        },
        data: 'This is not JSON',
      });

      expect(response.status()).toBe(400);

      const errorData = await response.json();
      expect(errorData.error).toMatch(/content.*type|invalid.*format/i);
    });

    test('should handle server errors gracefully @error-handling', async ({ request }) => {
      // This test might need to be implemented based on how you want to simulate server errors
      // For now, we'll test a potential server error scenario

      const response = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: 'Bearer valid-token' },
        data: {
          trackingNumber: 'A'.repeat(1000), // Extremely long tracking number
          weight: 1.0,
          dimensions: { length: 10, width: 8, height: 6 },
          destination: {
            name: 'Test',
            address: '123 Test St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M1M 1M1',
            country: 'Canada',
          },
        },
      });

      // Should handle gracefully, either with validation error or server error
      expect([400, 500]).toContain(response.status());
    });
  });

  test.describe('Data Consistency and Integrity', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.staff.email,
          password: config.testUsers.staff.password,
        },
      });

      const authData = await loginResponse.json();
      authToken = authData.token;
    });

    test('should maintain data consistency across operations @consistency', async ({ request }) => {
      // Create package
      const packageData = {
        trackingNumber: `CONSISTENCY-${Date.now()}`,
        weight: 2.5,
        dimensions: { length: 12, width: 10, height: 8 },
        destination: {
          name: 'Consistency Test',
          address: '123 Consistency Lane',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M1M 1M1',
          country: 'Canada',
        },
      };

      const createResponse = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: packageData,
      });

      const createdPackage = await createResponse.json();

      // Update package
      const updateResponse = await request.put(`${apiBaseUrl}/packages/${createdPackage.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { status: 'picked_up', statusMessage: 'Package picked up from sender' },
      });

      const updatedPackage = await updateResponse.json();

      // Verify consistency across different endpoints
      const getResponse = await request.get(`${apiBaseUrl}/packages/${createdPackage.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const retrievedPackage = await getResponse.json();

      const trackResponse = await request.get(
        `${apiBaseUrl}/tracking/${packageData.trackingNumber}`
      );
      const trackingData = await trackResponse.json();

      // All endpoints should return consistent data
      expect(retrievedPackage.status).toBe(updatedPackage.status);
      expect(trackingData.status).toBe(updatedPackage.status);
      expect(retrievedPackage.statusMessage).toBe(updatedPackage.statusMessage);
    });

    test('should handle concurrent updates correctly @consistency', async ({ request }) => {
      // Create package
      const packageData = {
        trackingNumber: `CONCURRENT-${Date.now()}`,
        weight: 1.8,
        dimensions: { length: 11, width: 9, height: 7 },
        destination: {
          name: 'Concurrent Test',
          address: '456 Concurrent Ave',
          city: 'Vancouver',
          province: 'BC',
          postalCode: 'V1V 1V1',
          country: 'Canada',
        },
      };

      const createResponse = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authToken}` },
        data: packageData,
      });

      const createdPackage = await createResponse.json();

      // Attempt concurrent updates
      const updates = [
        { status: 'picked_up', statusMessage: 'Update 1' },
        { status: 'in_transit', statusMessage: 'Update 2' },
        { status: 'out_for_delivery', statusMessage: 'Update 3' },
      ];

      const updatePromises = updates.map((update) =>
        request.put(`${apiBaseUrl}/packages/${createdPackage.id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: update,
        })
      );

      const updateResponses = await Promise.all(updatePromises);

      // At least one update should succeed
      const successfulUpdates = updateResponses.filter((response) => response.status() === 200);
      expect(successfulUpdates.length).toBeGreaterThan(0);

      // Final state should be consistent
      const finalResponse = await request.get(`${apiBaseUrl}/packages/${createdPackage.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const finalPackage = await finalResponse.json();
      expect(finalPackage.status).toBeDefined();
      expect(['picked_up', 'in_transit', 'out_for_delivery']).toContain(finalPackage.status);
    });

    test('should maintain referential integrity @consistency', async ({ request }) => {
      // This test would verify that related data remains consistent
      // For example, if a user is deleted, their associated packages should handle this properly
      // Implementation depends on your specific business rules

      const response = await request.get(`${apiBaseUrl}/packages?include=user`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status()).toBe(200);

      const packageList = await response.json();

      if (packageList.packages.length > 0) {
        for (const pkg of packageList.packages) {
          if (pkg.createdBy) {
            expect(pkg.createdBy.id).toBeDefined();
            expect(pkg.createdBy.email).toBeDefined();
            // Password should not be included
            expect(pkg.createdBy.password).toBeUndefined();
          }
        }
      }
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent requests @performance', async ({ request }) => {
      const concurrentRequests = 50;
      const requests = Array(concurrentRequests)
        .fill(null)
        .map(() => request.get(`${apiBaseUrl}/health`));

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / concurrentRequests;

      // All requests should succeed
      responses.forEach((response) => {
        // Expect 200 or 429 (rate limited) - both are valid for load testing
        expect([200, 429]).toContain(response.status());
      });

      // Average response time should be reasonable
      expect(avgResponseTime).toBeLessThan(1000); // Less than 1 second average
    });

    test('should handle large payloads efficiently @performance', async ({ request }) => {
      // Login first
      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: config.testUsers.staff.email,
          password: config.testUsers.staff.password,
        },
      });

      const authData = await loginResponse.json();

      // Create package with large description
      const largeDescription = 'A'.repeat(10000); // 10KB description

      const packageData = {
        trackingNumber: `LARGE-${Date.now()}`,
        weight: 5.0,
        dimensions: { length: 20, width: 15, height: 12 },
        destination: {
          name: 'Large Payload Test',
          address: '789 Large Payload Rd',
          city: 'Calgary',
          province: 'AB',
          postalCode: 'T1T 1T1',
          country: 'Canada',
        },
        contents: largeDescription,
      };

      const startTime = Date.now();
      const response = await request.post(`${apiBaseUrl}/packages`, {
        headers: { Authorization: `Bearer ${authData.token}` },
        data: packageData,
      });
      const endTime = Date.now();

      expect(response.status()).toBe(201);

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds

      const createdPackage = await response.json();
      expect(createdPackage.contents).toBe(largeDescription);
    });

    test('should maintain performance under sustained load @performance', async ({ request }) => {
      const numberOfRequests = 100;
      const batchSize = 10;
      const responseTimes: number[] = [];

      // Execute requests in batches to simulate sustained load
      for (let i = 0; i < numberOfRequests; i += batchSize) {
        const batch = Array(Math.min(batchSize, numberOfRequests - i))
          .fill(null)
          .map(async () => {
            const startTime = Date.now();
            const response = await request.get(`${apiBaseUrl}/health`);
            const endTime = Date.now();

            // Expect 200 or 429 (rate limited) - both are valid
            expect([200, 429]).toContain(response.status());
            return endTime - startTime;
          });

        const batchResponseTimes = await Promise.all(batch);
        responseTimes.push(...batchResponseTimes);

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      // Performance should remain consistent
      expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
      expect(maxResponseTime).toBeLessThan(2000); // Max under 2 seconds
    });
  });
});
