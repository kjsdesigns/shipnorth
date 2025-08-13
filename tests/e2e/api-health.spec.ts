import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('API Health Tests', () => {
  test('API health endpoint responds successfully', async ({ request }) => {
    const response = await request.get(`${config.apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  test('API auth endpoint accepts valid credentials', async ({ request }) => {
    const response = await request.post(`${config.apiUrl}/auth/login`, {
      data: {
        email: 'admin@shipnorth.com',
        password: 'admin123'
      }
    });
    
    // Should return 200 for valid credentials
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('admin@shipnorth.com');
    expect(data.user.role).toBe('admin');
  });

  test('API auth endpoint rejects invalid credentials', async ({ request }) => {
    const response = await request.post(`${config.apiUrl}/auth/login`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
    });
    
    // Should return 401 for invalid credentials
    expect(response.status()).toBe(401);
  });
});