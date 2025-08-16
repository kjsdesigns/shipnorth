import { PackageModel, Package } from '../models/package';
import { LoadModel } from '../models/load';
import { DatabaseService } from '../services/database';

// Mock the dependencies
jest.mock('../services/database', () => ({
  DatabaseService: {
    put: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
    queryByGSI: jest.fn(),
    scan: jest.fn(),
  },
  generateId: jest.fn(() => 'mock-package-id'),
}));

jest.mock('../models/load');

describe('PackageModel Enhanced Features', () => {
  const mockPackage: Omit<Package, 'id' | 'createdAt' | 'updatedAt'> = {
    customerId: 'customer-123',
    receivedDate: '2024-01-15T10:00:00Z',
    length: 30,
    width: 20,
    height: 15,
    weight: 5.5,
    labelStatus: 'unlabeled',
    paymentStatus: 'unpaid',
    shipmentStatus: 'ready',
    shipTo: {
      name: 'John Doe',
      address1: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 1A1',
      country: 'CA',
    },
    notes: 'Fragile item',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markAsDelivered', () => {
    it('should mark package as delivered with confirmation data', async () => {
      const packageId = 'pkg-123';
      const deliveryData = {
        photoUrl: 'https://s3.amazonaws.com/proof.jpg',
        signature: 'data:image/png;base64,signature',
        recipientName: 'Jane Smith',
        relationship: 'Resident',
        confirmedBy: 'staff-456',
      };

      const existingPackage = { id: packageId, ...mockPackage };
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: existingPackage });
      (DatabaseService.update as jest.Mock).mockResolvedValue({ 
        Data: { 
          ...existingPackage, 
          shipmentStatus: 'delivered',
          deliveryConfirmation: expect.any(Object),
        }
      });

      const result = await PackageModel.markAsDelivered(packageId, deliveryData);

      expect(result).toBeTruthy();
      expect(DatabaseService.update).toHaveBeenCalledWith(
        `PACKAGE#${packageId}`,
        'METADATA',
        expect.objectContaining({
          Data: expect.objectContaining({
            shipmentStatus: 'delivered',
            deliveryConfirmation: expect.objectContaining({
              photoUrl: deliveryData.photoUrl,
              signature: deliveryData.signature,
              recipientName: deliveryData.recipientName,
              relationship: deliveryData.relationship,
              confirmedBy: deliveryData.confirmedBy,
              deliveredAt: expect.any(String),
            }),
          }),
        })
      );
    });

    it('should use current timestamp when deliveredAt not provided', async () => {
      const packageId = 'pkg-123';
      const deliveryData = { confirmedBy: 'staff-456' };

      const existingPackage = { id: packageId, ...mockPackage };
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: existingPackage });
      (DatabaseService.update as jest.Mock).mockResolvedValue({ Data: existingPackage });

      const beforeTime = Date.now();
      await PackageModel.markAsDelivered(packageId, deliveryData);
      const afterTime = Date.now();

      const updateCall = (DatabaseService.update as jest.Mock).mock.calls[0][2];
      const deliveredAt = updateCall.Data.deliveryConfirmation.deliveredAt;

      expect(new Date(deliveredAt).getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(new Date(deliveredAt).getTime()).toBeLessThanOrEqual(afterTime);
    });

    it('should return null for nonexistent package', async () => {
      (DatabaseService.get as jest.Mock).mockResolvedValue(null);

      const result = await PackageModel.markAsDelivered('nonexistent', { confirmedBy: 'staff' });

      expect(result).toBeNull();
    });
  });

  describe('getExpectedDeliveryDate', () => {
    it('should return expected delivery date from load', async () => {
      const packageId = 'pkg-123';
      const loadId = 'load-456';
      const expectedDate = '2024-01-20T17:00:00Z';

      const packageWithLoad = { 
        ...mockPackage, 
        id: packageId, 
        loadId,
        shipTo: { ...mockPackage.shipTo, city: 'Toronto' }
      };

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: packageWithLoad });
      (LoadModel.getExpectedDeliveryDate as jest.Mock).mockResolvedValue(expectedDate);

      const result = await PackageModel.getExpectedDeliveryDate(packageId);

      expect(result).toBe(expectedDate);
      expect(LoadModel.getExpectedDeliveryDate).toHaveBeenCalledWith(loadId, 'Toronto');
    });

    it('should return null when package has no load', async () => {
      const packageWithoutLoad = { ...mockPackage, id: 'pkg-123', loadId: undefined };
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: packageWithoutLoad });

      const result = await PackageModel.getExpectedDeliveryDate('pkg-123');

      expect(result).toBeNull();
      expect(LoadModel.getExpectedDeliveryDate).not.toHaveBeenCalled();
    });

    it('should return null when package not found', async () => {
      (DatabaseService.get as jest.Mock).mockResolvedValue(null);

      const result = await PackageModel.getExpectedDeliveryDate('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPackagesByLoadStatus', () => {
    const mockPackages = [
      { ...mockPackage, id: 'pkg-1', loadId: undefined, shipmentStatus: 'ready' },
      { ...mockPackage, id: 'pkg-2', loadId: 'load-1', shipmentStatus: 'ready' },
      { ...mockPackage, id: 'pkg-3', loadId: 'load-2', shipmentStatus: 'in_transit' },
      { ...mockPackage, id: 'pkg-4', loadId: undefined, shipmentStatus: 'ready' },
    ];

    beforeEach(() => {
      (DatabaseService.scan as jest.Mock).mockResolvedValue(
        mockPackages.map(pkg => ({ Data: pkg }))
      );
    });

    it('should return unassigned packages', async () => {
      const result = await PackageModel.getPackagesByLoadStatus('unassigned');

      expect(result).toHaveLength(2);
      expect(result.every(pkg => !pkg.loadId)).toBe(true);
    });

    it('should return assigned packages', async () => {
      const result = await PackageModel.getPackagesByLoadStatus('assigned');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pkg-2');
      expect(result[0].loadId).toBe('load-1');
      expect(result[0].shipmentStatus).toBe('ready');
    });

    it('should return in-transit packages', async () => {
      const result = await PackageModel.getPackagesByLoadStatus('in_transit');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pkg-3');
      expect(result[0].shipmentStatus).toBe('in_transit');
    });

    it('should return all packages when no status filter', async () => {
      const result = await PackageModel.getPackagesByLoadStatus();

      expect(result).toHaveLength(4);
    });
  });

  describe('getPackageStats', () => {
    it('should return correct package statistics', async () => {
      const mockPackages = [
        { ...mockPackage, id: 'pkg-1', loadId: undefined, shipmentStatus: 'ready' },
        { ...mockPackage, id: 'pkg-2', loadId: undefined, shipmentStatus: 'ready' },
        { ...mockPackage, id: 'pkg-3', loadId: 'load-1', shipmentStatus: 'ready' },
        { ...mockPackage, id: 'pkg-4', loadId: 'load-1', shipmentStatus: 'ready' },
        { ...mockPackage, id: 'pkg-5', loadId: 'load-2', shipmentStatus: 'in_transit' },
        { ...mockPackage, id: 'pkg-6', loadId: 'load-2', shipmentStatus: 'in_transit' },
        { ...mockPackage, id: 'pkg-7', loadId: 'load-3', shipmentStatus: 'in_transit' },
      ];

      (DatabaseService.scan as jest.Mock).mockResolvedValue(
        mockPackages.map(pkg => ({ Data: pkg }))
      );

      const result = await PackageModel.getPackageStats();

      expect(result).toEqual({
        unassigned: 2,
        assigned: 2,
        in_transit: 3,
      });
    });

    it('should return zeros when no packages exist', async () => {
      (DatabaseService.scan as jest.Mock).mockResolvedValue([]);

      const result = await PackageModel.getPackageStats();

      expect(result).toEqual({
        unassigned: 0,
        assigned: 0,
        in_transit: 0,
      });
    });
  });

  describe('create with enhanced fields', () => {
    it('should create package with delivery confirmation structure', async () => {
      const packageData = {
        ...mockPackage,
        deliveryConfirmation: undefined, // Should remain undefined until delivery
      };

      (DatabaseService.put as jest.Mock).mockResolvedValue(undefined);

      const result = await PackageModel.create(packageData);

      expect(result.barcode).toMatch(/^PKG\d+[A-Z0-9]{5}$/);
      expect(result.deliveryConfirmation).toBeUndefined();
      expect(DatabaseService.put).toHaveBeenCalledWith(
        expect.objectContaining({
          PK: 'PACKAGE#mock-package-id',
          SK: 'METADATA',
          Type: 'Package',
          Data: expect.objectContaining({
            id: 'mock-package-id',
            labelStatus: 'unlabeled',
            paymentStatus: 'unpaid',
            shipmentStatus: 'ready',
          }),
        })
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle package lifecycle from creation to delivery', async () => {
      const packageId = 'pkg-lifecycle';
      
      // 1. Create package
      const newPackage = await PackageModel.create(mockPackage);
      expect(newPackage.shipmentStatus).toBe('ready');
      expect(newPackage.loadId).toBeUndefined();

      // 2. Assign to load (simulate via update)
      const loadId = 'load-123';
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: newPackage });
      (DatabaseService.update as jest.Mock).mockResolvedValue({ 
        Data: { ...newPackage, loadId } 
      });

      await PackageModel.update(packageId, { loadId });

      // 3. Mark as delivered
      const updatedPackage = { ...newPackage, loadId };
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: updatedPackage });
      (DatabaseService.update as jest.Mock).mockResolvedValue({
        Data: { ...updatedPackage, shipmentStatus: 'delivered' }
      });

      const deliveryResult = await PackageModel.markAsDelivered(packageId, {
        confirmedBy: 'staff-123',
        recipientName: 'Customer Name',
      });

      expect(deliveryResult).toBeTruthy();
    });
  });
});