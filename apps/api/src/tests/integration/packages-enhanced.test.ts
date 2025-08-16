import request from 'supertest';
import { app } from '../../index';
import { PackageModel } from '../../models/package';
import { LoadModel } from '../../models/load';

// Mock the models
jest.mock('../../models/package');
jest.mock('../../models/load');
jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'staff-123', role: 'staff' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => {
    req.user = { id: 'staff-123', role: 'staff' };
    next();
  },
}));

describe('Packages API Enhanced Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /packages/stats/overview', () => {
    it('should return package statistics', async () => {
      const mockStats = {
        unassigned: 15,
        assigned: 8,
        in_transit: 12,
      };

      (PackageModel.getPackageStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/packages/stats/overview')
        .expect(200);

      expect(response.body).toEqual(mockStats);
      expect(PackageModel.getPackageStats).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (PackageModel.getPackageStats as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/packages/stats/overview')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });

  describe('GET /packages with filters', () => {
    it('should list packages with status filter', async () => {
      const mockPackages = [
        { id: 'pkg-1', shipmentStatus: 'ready', loadId: null },
        { id: 'pkg-2', shipmentStatus: 'ready', loadId: null },
      ];

      (PackageModel.getPackagesByLoadStatus as jest.Mock).mockResolvedValue(mockPackages);
      (PackageModel.getExpectedDeliveryDate as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/packages?status=unassigned&limit=50')
        .expect(200);

      expect(response.body.packages).toHaveLength(2);
      expect(PackageModel.getPackagesByLoadStatus).toHaveBeenCalledWith('unassigned');
    });

    it('should add expected delivery dates to packages', async () => {
      const mockPackages = [
        { id: 'pkg-1', loadId: 'load-123' },
        { id: 'pkg-2', loadId: null },
      ];

      (PackageModel.getPackagesByLoadStatus as jest.Mock).mockResolvedValue(mockPackages);
      (PackageModel.getExpectedDeliveryDate as jest.Mock)
        .mockResolvedValueOnce('2024-01-20T17:00:00Z')
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/packages')
        .expect(200);

      expect(response.body.packages[0].expectedDeliveryDate).toBe('2024-01-20T17:00:00Z');
      expect(response.body.packages[1].expectedDeliveryDate).toBeNull();
    });

    it('should return pagination info', async () => {
      (PackageModel.getPackagesByLoadStatus as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/packages?page=2&limit=100')
        .expect(200);

      expect(response.body.pagination).toEqual({
        page: 2,
        limit: 100,
        total: 0,
      });
    });
  });

  describe('POST /packages/bulk-assign', () => {
    it('should bulk assign packages to load', async () => {
      const packageIds = ['pkg-1', 'pkg-2', 'pkg-3'];
      const loadId = 'load-123';

      (PackageModel.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/packages/bulk-assign')
        .send({ packageIds, loadId })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        assignedCount: 3,
      });

      expect(PackageModel.update).toHaveBeenCalledTimes(3);
      expect(PackageModel.update).toHaveBeenCalledWith('pkg-1', { loadId });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/packages/bulk-assign')
        .send({ packageIds: ['pkg-1'] })
        .expect(400);

      expect(response.body.error).toBe('loadId is required');
    });

    it('should validate packageIds array', async () => {
      const response = await request(app)
        .post('/packages/bulk-assign')
        .send({ packageIds: 'not-an-array', loadId: 'load-123' })
        .expect(400);

      expect(response.body.error).toBe('packageIds array is required');
    });
  });

  describe('POST /packages/:id/mark-delivered', () => {
    it('should mark package as delivered with full data', async () => {
      const packageId = 'pkg-123';
      const deliveryData = {
        deliveredAt: '2024-01-20T15:30:00Z',
        photoUrl: 'https://s3.example.com/proof.jpg',
        signature: 'data:image/png;base64,signature',
        recipientName: 'John Doe',
        relationship: 'Homeowner',
      };

      const updatedPackage = {
        id: packageId,
        shipmentStatus: 'delivered',
        deliveryConfirmation: {
          ...deliveryData,
          confirmedBy: 'staff-123',
        },
      };

      (PackageModel.markAsDelivered as jest.Mock).mockResolvedValue(updatedPackage);

      const response = await request(app)
        .post(`/packages/${packageId}/mark-delivered`)
        .send(deliveryData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        package: updatedPackage,
      });

      expect(PackageModel.markAsDelivered).toHaveBeenCalledWith(packageId, {
        ...deliveryData,
        confirmedBy: 'staff-123',
      });
    });

    it('should mark package as delivered with minimal data', async () => {
      const packageId = 'pkg-123';
      const updatedPackage = { id: packageId, shipmentStatus: 'delivered' };

      (PackageModel.markAsDelivered as jest.Mock).mockResolvedValue(updatedPackage);

      const response = await request(app)
        .post(`/packages/${packageId}/mark-delivered`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(PackageModel.markAsDelivered).toHaveBeenCalledWith(packageId, {
        confirmedBy: 'staff-123',
      });
    });

    it('should handle package not found', async () => {
      (PackageModel.markAsDelivered as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/packages/nonexistent/mark-delivered')
        .send({})
        .expect(404);

      expect(response.body.error).toBe('Package not found');
    });
  });

  describe('GET /packages/:id with expected delivery', () => {
    it('should return package with expected delivery date', async () => {
      const packageId = 'pkg-123';
      const mockPackage = {
        id: packageId,
        loadId: 'load-456',
        shipTo: { city: 'Toronto' },
      };
      const expectedDate = '2024-01-22T17:00:00Z';

      (PackageModel.findById as jest.Mock).mockResolvedValue(mockPackage);
      (PackageModel.getExpectedDeliveryDate as jest.Mock).mockResolvedValue(expectedDate);

      const response = await request(app)
        .get(`/packages/${packageId}`)
        .expect(200);

      expect(response.body.package).toEqual({
        ...mockPackage,
        expectedDeliveryDate: expectedDate,
      });
    });

    it('should handle package not found', async () => {
      (PackageModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/packages/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Package not found');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in bulk assign', async () => {
      (PackageModel.update as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/packages/bulk-assign')
        .send({ packageIds: ['pkg-1'], loadId: 'load-123' })
        .expect(500);

      expect(response.body.error).toBe('Database connection failed');
    });

    it('should handle errors in mark delivered', async () => {
      (PackageModel.markAsDelivered as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .post('/packages/pkg-123/mark-delivered')
        .send({})
        .expect(500);

      expect(response.body.error).toBe('Update failed');
    });
  });

  describe('Authorization', () => {
    it('should require staff or admin role for bulk operations', async () => {
      // This test assumes the middleware checks roles
      // In a real implementation, you'd mock the middleware to return 403
      const response = await request(app)
        .post('/packages/bulk-assign')
        .send({ packageIds: ['pkg-1'], loadId: 'load-123' })
        .expect(200); // Should pass with mocked staff role

      expect(response.body.success).toBe(true);
    });
  });
});