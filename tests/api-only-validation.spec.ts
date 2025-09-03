import { test, expect } from '@playwright/test';

// API-only validation test suite that bypasses browser navigation issues
test.describe('🔌 API-Only Validation Suite', () => {
  const baseApiUrl = 'http://localhost:8850';
  
  test('Complete authentication workflow validation @api @critical', async () => {
    console.log('🔐 Testing complete authentication workflow...');
    
    // Test all user role authentications
    const users = [
      { email: 'test@test.com', password: 'test123', expectedPortal: 'customer' },
      { email: 'staff@shipnorth.com', password: 'staff123', expectedPortal: 'staff' },
      { email: 'admin@shipnorth.com', password: 'admin123', expectedPortal: 'staff' },
      { email: 'driver@shipnorth.com', password: 'driver123', expectedPortal: 'driver' }
    ];
    
    for (const user of users) {
      const response = await fetch(`${baseApiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
      });
      
      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.token).toBeDefined();
      expect(data.user.defaultPortal).toBe(user.expectedPortal);
      
      console.log(`✅ ${user.email}: defaultPortal="${data.user.defaultPortal}"`);
    }
  });
  
  test('Portal switching API validation @api @critical', async () => {
    console.log('🔄 Testing portal switching functionality...');
    
    // Login as admin (has multiple portal access)
    const loginResponse = await fetch(`${baseApiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@shipnorth.com', password: 'admin123' })
    });
    
    const { token } = await loginResponse.json();
    
    // Test portal switching
    const switchResponse = await fetch(`${baseApiUrl}/auth/switch-portal`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ portal: 'staff' })
    });
    
    expect(switchResponse.ok).toBe(true);
    console.log('✅ Portal switching API working');
  });
  
  test('ACL permission validation @api @critical', async () => {
    console.log('🛡️ Testing ACL permission system...');
    
    // Login as customer 
    const loginResponse = await fetch(`${baseApiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test123' })
    });
    
    const { token } = await loginResponse.json();
    
    // Test permission endpoint
    const permResponse = await fetch(`${baseApiUrl}/auth/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    expect(permResponse.ok).toBe(true);
    const permissions = await permResponse.json();
    
    expect(permissions.role).toBeDefined();
    console.log('✅ ACL permissions API working');
  });
});