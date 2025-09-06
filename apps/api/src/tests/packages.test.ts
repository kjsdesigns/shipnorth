import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';
import { PackageModel } from '../models/package';
import { UserModel } from '../models/user';
import { CustomerModel } from '../models/customer';

// Mock PayPal service for tests
jest.mock('../services/paypal', () => ({
  PayPalService: {
    getInstance: () => ({
      createOrder: jest.fn().mockResolvedValue({
        id: 'mock-paypal-order-id',
        links: [{ rel: 'approve', href: 'https://paypal.com/mock-approval-url' }]
      })
    })
  }
}));

describe('Packages API', () => {
  let server: any;
  let staffToken: string;
  let customerToken: string;
  let testPackageId: string;
  let staffUserId: string;
  let customerUserId: string;

  const staffUser = {
    email: 'staff@shipnorth.com',
    password: 'staff123',
    firstName: 'Staff',
    lastName: 'User',
    role: 'staff' as const,
  };

  const customerUser = {
    email: 'customer@test.com',
    password: 'customer123',
    firstName: 'Customer',
    lastName: 'User',
    role: 'customer' as const,
  };

  beforeAll(async () => {
    server = app.listen(4002);

    // Clean up existing test users
    try {
      const existingStaff = await UserModel.findByEmail(staffUser.email);
      if (existingStaff) {
        await UserModel.delete(existingStaff.id);
      }
      const existingCustomer = await UserModel.findByEmail(customerUser.email);
      if (existingCustomer) {
        await UserModel.delete(existingCustomer.id);
      }
    } catch (e) {}

    // Create test users directly via UserModel (since registration only creates customers)
    const staffUserCreated = await UserModel.create(staffUser);
    staffUserId = staffUserCreated.id;
    
    // Create a test customer directly for package tests
    const testCustomer = {
      name: 'Test Customer',
      email: customerUser.email,
      phone: '555-0123',
      country: 'CAN'
    };
    const customerCreated = await CustomerModel.create(testCustomer);
    customerUserId = customerCreated.id;
    
    // Create customer user account
    const customerUserCreated = await UserModel.create({
      ...customerUser,
      customerId: customerUserId
    });

    // Login as staff
    const staffLogin = await request(app).post('/auth/login').send({
      email: staffUser.email,
      password: staffUser.password,
    });
    staffToken = staffLogin.body.accessToken;

    // Login as customer
    const customerLogin = await request(app).post('/auth/login').send({
      email: customerUser.email,
      password: customerUser.password,
    });
    customerToken = customerLogin.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test package
    if (testPackageId) {
      try {
        await PackageModel.delete(testPackageId);
      } catch (e) {}
    }
    
    // Clean up test users
    try {
      if (staffUserId) {
        await UserModel.delete(staffUserId);
      }
      if (customerUserId) {
        await UserModel.delete(customerUserId);
      }
    } catch (e) {}
    
    server.close();
  });

  describe('POST /packages', () => {
    it('should create package as staff', async () => {
      const packageData = {
        customer_id: customerUserId,
        customerId: customerUserId,
        barcode: 'TEST-' + Date.now(),
        weight: 5.5,
        length: 30,
        width: 20,
        height: 15,
        shipTo: {
          name: 'John Doe',
          address: '123 Test St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 2T6',
          country: 'CAN',
          phone: '416-555-0123',
        },
      };

      const response = await request(app)
        .post('/packages')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(packageData);

      expect(response.status).toBe(200);
      expect(response.body.package).toHaveProperty('id');
      expect(response.body.package.barcode).toBe(packageData.barcode);

      testPackageId = response.body.package.id;
    });

    it('should reject package creation from customer', async () => {
      const response = await request(app)
        .post('/packages')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          barcode: 'TEST-FORBIDDEN',
        });

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/packages')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          barcode: 'INCOMPLETE',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /packages', () => {
    it('should list packages', async () => {
      const response = await request(app)
        .get('/packages')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('packages');
      expect(Array.isArray(response.body.packages)).toBe(true);
    });

    it('should get specific package', async () => {
      // First create a package to retrieve
      const packageData = {
        customer_id: customerUserId,
        customerId: customerUserId,
        barcode: 'TEST-RETRIEVE-' + Date.now(),
        weight: 5.5,
      };
      
      const createResponse = await request(app)
        .post('/packages')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(packageData);
        
      const packageId = createResponse.body.package.id;
      
      const response = await request(app)
        .get(`/packages/${packageId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.package).toHaveProperty('id');
      expect(response.body.package.id).toBe(packageId);
    });

    it('should return 404 for non-existent package', async () => {
      const response = await request(app)
        .get('/packages/non-existent-id')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /packages/:id/quote', () => {
    it('should generate shipping quote', async () => {
      const response = await request(app)
        .post(`/packages/${testPackageId}/quote`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('quotes');
    });

    it('should require staff permission for quotes', async () => {
      const response = await request(app)
        .post(`/packages/${testPackageId}/quote`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /packages/:id/charge', () => {
    it('should initiate payment charge', async () => {
      // First create a package to charge
      const packageData = {
        customer_id: customerUserId,
        customerId: customerUserId,
        barcode: 'TEST-CHARGE-' + Date.now(),
        weight: 5.5,
        actualCost: 25.99
      };
      
      const createResponse = await request(app)
        .post('/packages')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(packageData);
        
      const packageId = createResponse.body.package.id;
      
      const response = await request(app)
        .post(`/packages/${packageId}/charge`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('paymentUrl');
    });
  });
});

describe('Package Business Logic', () => {
  describe('Shipping Cost Calculation', () => {
    it('should calculate base shipping cost', () => {
      const cost = calculateShippingCost({
        weight: 5,
        length: 30,
        width: 20,
        height: 10,
        serviceType: 'standard',
      });

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(100);
    });

    it('should add express surcharge', () => {
      const standardCost = calculateShippingCost({
        weight: 5,
        length: 30,
        width: 20,
        height: 10,
        serviceType: 'standard',
      });

      const expressCost = calculateShippingCost({
        weight: 5,
        length: 30,
        width: 20,
        height: 10,
        serviceType: 'express',
      });

      expect(expressCost).toBeGreaterThan(standardCost);
    });

    it('should add oversize surcharge', () => {
      const normalCost = calculateShippingCost({
        weight: 5,
        length: 30,
        width: 20,
        height: 10,
        serviceType: 'standard',
      });

      const oversizeCost = calculateShippingCost({
        weight: 5,
        length: 100,
        width: 100,
        height: 100,
        serviceType: 'standard',
      });

      expect(oversizeCost).toBeGreaterThan(normalCost);
    });
  });
});

// Helper function (should match the one in PayPal service)
function calculateShippingCost(packageData: any): number {
  let cost = 15.0;
  cost += packageData.weight * 2.5;

  const volume = packageData.length * packageData.width * packageData.height;
  if (volume > 100000) {
    cost += 10.0;
  }

  if (packageData.serviceType === 'express') {
    cost *= 1.5;
  }

  return Math.round(cost * 100) / 100;
}
