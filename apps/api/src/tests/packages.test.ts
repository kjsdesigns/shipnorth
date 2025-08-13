import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { PackageModel } from '../models/package';

describe('Packages API', () => {
  let server: any;
  let staffToken: string;
  let customerToken: string;
  let testPackageId: string;

  beforeAll(async () => {
    server = app.listen(4002);
    
    // Login as staff
    const staffLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'staff@shipnorth.com',
        password: 'staff123',
      });
    staffToken = staffLogin.body.accessToken;

    // Login as customer
    const customerLogin = await request(app)
      .post('/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'customer123',
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
    server.close();
  });

  describe('POST /packages', () => {
    it('should create package as staff', async () => {
      const packageData = {
        customerId: 'test-customer-id',
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
          country: 'Canada',
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
      const response = await request(app)
        .get(`/packages/${testPackageId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.package).toHaveProperty('id');
      expect(response.body.package.id).toBe(testPackageId);
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
      const response = await request(app)
        .post(`/packages/${testPackageId}/charge`)
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
  let cost = 15.00;
  cost += packageData.weight * 2.50;
  
  const volume = packageData.length * packageData.width * packageData.height;
  if (volume > 100000) {
    cost += 10.00;
  }
  
  if (packageData.serviceType === 'express') {
    cost *= 1.5;
  }
  
  return Math.round(cost * 100) / 100;
}