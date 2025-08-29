import { test, expect } from '@playwright/test';
import { config } from './config';

test.describe('Comprehensive API Tests', () => {
  let authToken: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const response = await request.post(`${config.apiUrl}/auth/login`, {
      data: {
        email: config.testUsers.admin.email,
        password: config.testUsers.admin.password
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    authToken = data.accessToken;
    userId = data.user.id;
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('Health endpoint works', async ({ request }) => {
    const response = await request.get(`${config.apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('Auth - Login with valid credentials', async ({ request }) => {
    const response = await request.post(`${config.apiUrl}/auth/login`, {
      data: {
        email: config.testUsers.admin.email,
        password: config.testUsers.admin.password
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.accessToken).toBeDefined();
    expect(data.user.role).toBe('admin');
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('Auth - Reject invalid credentials', async ({ request }) => {
    const response = await request.post(`${config.apiUrl}/auth/login`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    expect(response.status()).toBe(401);
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('Packages - List packages (authenticated)', async ({ request }) => {
    const response = await request.get(`${config.apiUrl}/packages`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.packages).toBeDefined();
    expect(Array.isArray(data.packages)).toBeTruthy();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('Packages - Reject unauthenticated access', async ({ request }) => {
    const response = await request.get(`${config.apiUrl}/packages`);
    expect(response.status()).toBe(401);
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('Customers - List customers (admin only)', async ({ request }) => {
    const response = await request.get(`${config.apiUrl}/customers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.customers).toBeDefined();
    expect(Array.isArray(data.customers)).toBeTruthy();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('Loads - List loads (authenticated)', async ({ request }) => {
    const response = await request.get(`${config.apiUrl}/loads`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.loads).toBeDefined();
    expect(Array.isArray(data.loads)).toBeTruthy();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }

  test('CORS headers are present', async ({ request }) => {
    const response = await request.get(`${config.apiUrl}/health`, {
      headers: {
        'Origin': 'https://example.com'
      }
    });
    } catch (error) {
      // Ignore localStorage access errors
    }
    
    expect(response.ok()).toBeTruthy();
    
    // Check for CORS headers in response
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
  });
    } catch (error) {
      // Ignore localStorage access errors
    }
});
    } catch (error) {
      // Ignore localStorage access errors
    }