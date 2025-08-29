import { LoadModel, Load, LoadDeliveryCity, LocationTracking } from '../models/load';
import { DatabaseService } from '../services/database';

// Mock the DatabaseService
jest.mock('../services/database', () => ({
  DatabaseService: {
    put: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
    queryByGSI: jest.fn(),
    scan: jest.fn(),
    batchWrite: jest.fn(),
  },
  generateId: jest.fn(() => 'mock-id-123'),
}));

describe('LoadModel', () => {
  const mockLoad: Omit<Load, 'id' | 'createdAt' | 'updatedAt'> = {
    departureDate: '2024-01-15T10:00:00Z',
    defaultDeliveryDate: '2024-01-20T17:00:00Z',
    deliveryCities: [
      {
        city: 'Toronto',
        province: 'ON',
        country: 'CA',
        expectedDeliveryDate: '2024-01-18T17:00:00Z',
        distance: 500,
        drivingDuration: 360,
      },
      {
        city: 'Montreal',
        province: 'QC',
        country: 'CA',
        expectedDeliveryDate: '2024-01-20T17:00:00Z',
        distance: 850,
        drivingDuration: 600,
      },
    ],
    transportMode: 'truck',
    driverName: 'John Doe',
    driverId: 'driver-123',
    originAddress: '123 Main St, Warehouse City, ON',
    notes: 'Handle with care',
    status: 'planned',
    locationHistory: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new load with correct structure', async () => {
      (DatabaseService.put as jest.Mock).mockResolvedValue(undefined);

      const result = await LoadModel.create(mockLoad);

      expect(result).toEqual({
        id: 'mock-id-123',
        ...mockLoad,
        totalPackages: 0,
        totalWeight: 0,
        locationHistory: [],
      });

      expect(DatabaseService.put).toHaveBeenCalledWith({
        PK: 'LOAD#mock-id-123',
        SK: 'METADATA',
        GSI2PK: 'DATE#2024-01-15',
        GSI2SK: 'LOAD#mock-id-123',
        Type: 'Load',
        Data: expect.objectContaining({
          id: 'mock-id-123',
          status: 'planned',
          transportMode: 'truck',
        }),
      });
    });

    it('should set default values for optional fields', async () => {
      const minimalLoad = {
        departureDate: '2024-01-15T10:00:00Z',
        deliveryCities: [],
        transportMode: 'truck' as const,
        locationHistory: [],
        status: 'planned' as const,
      };

      const result = await LoadModel.create(minimalLoad);

      expect(result.status).toBe('planned');
      expect(result.totalPackages).toBe(0);
      expect(result.totalWeight).toBe(0);
      expect(result.locationHistory).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return load data when found', async () => {
      const mockLoadData = { id: 'test-id', ...mockLoad };
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: mockLoadData });

      const result = await LoadModel.findById('test-id');

      expect(result).toEqual(mockLoadData);
      expect(DatabaseService.get).toHaveBeenCalledWith('LOAD#test-id', 'METADATA');
    });

    it('should return null when load not found', async () => {
      (DatabaseService.get as jest.Mock).mockResolvedValue(null);

      const result = await LoadModel.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateDeliveryCities', () => {
    it('should update delivery cities for existing load', async () => {
      const loadId = 'test-load-id';
      const newCities: LoadDeliveryCity[] = [
        {
          city: 'Vancouver',
          province: 'BC',
          country: 'CA',
          expectedDeliveryDate: '2024-01-25T17:00:00Z',
        },
      ];

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: mockLoad });
      (DatabaseService.update as jest.Mock).mockResolvedValue({
        Data: { ...mockLoad, deliveryCities: newCities },
      });

      const result = await LoadModel.updateDeliveryCities(loadId, newCities);

      expect(result).toBe(true);
      expect(DatabaseService.update).toHaveBeenCalledWith(`LOAD#${loadId}`, 'METADATA', {
        Data: expect.objectContaining({ deliveryCities: newCities }),
      });
    });

    it('should return false for nonexistent load', async () => {
      (DatabaseService.get as jest.Mock).mockResolvedValue(null);

      const result = await LoadModel.updateDeliveryCities('nonexistent', []);

      expect(result).toBe(false);
    });
  });

  describe('addLocationTracking', () => {
    it('should add location tracking entry', async () => {
      const loadId = 'test-load-id';
      const lat = 43.6532;
      const lng = -79.3832;
      const address = 'Toronto, ON';

      const existingLoad = { ...mockLoad, id: loadId, locationHistory: [] };
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: existingLoad });
      (DatabaseService.update as jest.Mock).mockResolvedValue({ Data: existingLoad });

      const result = await LoadModel.addLocationTracking(
        loadId,
        lat,
        lng,
        true,
        'user-123',
        address
      );

      expect(result).toBe(true);
      expect(DatabaseService.update).toHaveBeenCalledWith(
        `LOAD#${loadId}`,
        'METADATA',
        expect.objectContaining({
          Data: expect.objectContaining({
            locationHistory: expect.arrayContaining([
              expect.objectContaining({
                lat,
                lng,
                address,
                isManual: true,
                addedBy: 'user-123',
              }),
            ]),
            currentLocation: expect.objectContaining({
              lat,
              lng,
              address,
              isManual: true,
              addedBy: 'user-123',
            }),
          }),
        })
      );
    });
  });

  describe('getExpectedDeliveryDate', () => {
    it('should return city-specific delivery date when available', async () => {
      const loadWithCities = {
        ...mockLoad,
        id: 'test-id',
        deliveryCities: [
          {
            city: 'Toronto',
            province: 'ON',
            country: 'CA',
            expectedDeliveryDate: '2024-01-18T17:00:00Z',
          },
          {
            city: 'Montreal',
            province: 'QC',
            country: 'CA',
            expectedDeliveryDate: '2024-01-20T17:00:00Z',
          },
        ],
      };

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: loadWithCities });

      const result = await LoadModel.getExpectedDeliveryDate('test-id', 'Toronto');

      expect(result).toBe('2024-01-18T17:00:00Z');
    });

    it('should return default delivery date when city not found', async () => {
      const loadWithDefault = {
        ...mockLoad,
        id: 'test-id',
        defaultDeliveryDate: '2024-01-22T17:00:00Z',
        deliveryCities: [],
      };

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: loadWithDefault });

      const result = await LoadModel.getExpectedDeliveryDate('test-id', 'Unknown City');

      expect(result).toBe('2024-01-22T17:00:00Z');
    });

    it('should return null when load not found', async () => {
      (DatabaseService.get as jest.Mock).mockResolvedValue(null);

      const result = await LoadModel.getExpectedDeliveryDate('nonexistent', 'Toronto');

      expect(result).toBeNull();
    });
  });

  describe('assignPackages', () => {
    it('should assign packages to load and update package records', async () => {
      const loadId = 'test-load-id';
      const packageIds = ['pkg-1', 'pkg-2', 'pkg-3'];

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Data: mockLoad });
      (DatabaseService.batchWrite as jest.Mock).mockResolvedValue(undefined);
      (DatabaseService.update as jest.Mock).mockResolvedValue(undefined);

      // Mock getPackages for updateTotals
      (DatabaseService.query as jest.Mock).mockResolvedValue([
        { packageId: 'pkg-1' },
        { packageId: 'pkg-2' },
        { packageId: 'pkg-3' },
      ]);

      // Mock package data for weight calculation
      (DatabaseService.get as jest.Mock)
        .mockResolvedValueOnce({ Data: mockLoad }) // First call for load existence check
        .mockResolvedValueOnce({ Data: { weight: 10 } }) // Package 1
        .mockResolvedValueOnce({ Data: { weight: 15 } }) // Package 2
        .mockResolvedValueOnce({ Data: { weight: 8 } }); // Package 3

      const result = await LoadModel.assignPackages(loadId, packageIds);

      expect(result).toBe(true);
      expect(DatabaseService.batchWrite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            PK: `LOAD#${loadId}`,
            SK: 'PACKAGE#pkg-1',
            Type: 'LoadPackageRelation',
            packageId: 'pkg-1',
          }),
        ])
      );

      // Should update each package with loadId
      expect(DatabaseService.update).toHaveBeenCalledWith('PACKAGE#pkg-1', 'METADATA', {
        'Data.loadId': loadId,
      });
    });
  });

  describe('list', () => {
    it('should return list of loads', async () => {
      const mockLoads = [
        { Data: { id: 'load-1', ...mockLoad } },
        { Data: { id: 'load-2', ...mockLoad } },
      ];

      (DatabaseService.scan as jest.Mock).mockResolvedValue(mockLoads);

      const result = await LoadModel.list();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'load-1', ...mockLoad });
      expect(DatabaseService.scan).toHaveBeenCalledWith({
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: { '#type': 'Type' },
        ExpressionAttributeValues: { ':type': 'Load' },
        Limit: 100,
      });
    });
  });
});
