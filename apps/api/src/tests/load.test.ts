import { LoadModel, Load } from '../models/load';

// Mock the PostgreSQL pool
const mockQuery = jest.fn();
const mockRelease = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(() => ({
      query: mockQuery,
      release: mockRelease,
    })),
  })),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('LoadModel', () => {
  const mockLoad: Omit<Load, 'id' | 'created_at' | 'updated_at'> = {
    name: 'Test Load',
    status: 'planned',
    departure_date: '2024-01-15T05:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new load with correct structure', async () => {
      const expectedResult = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Load',
        status: 'planned',
        departure_date: '2024-01-15T05:00:00.000Z',
        driver_id: null,
        vehicle: null,
        estimated_duration: null,
        actual_duration: null,
        created_at: new Date('2025-09-04T21:52:27.242Z'),
        updated_at: new Date('2025-09-04T21:52:27.242Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedResult]
      });

      const result = await LoadModel.create(mockLoad);

      expect(result).toEqual(expectedResult);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO loads'),
        [
          '550e8400-e29b-41d4-a716-446655440000',
          'Test Load',
          undefined,
          undefined,
          'planned',
          '2024-01-15T05:00:00.000Z',
          undefined,
          undefined
        ]
      );
    });

    it('should set default values for optional fields', async () => {
      const minimalLoad = {
        name: 'Minimal Load',
        status: 'planned' as const,
        departure_date: '2024-01-15T05:00:00.000Z',
      };

      const expectedResult = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Minimal Load',
        status: 'planned',
        departure_date: '2024-01-15T05:00:00.000Z',
        driver_id: null,
        vehicle: null,
        estimated_duration: null,
        actual_duration: null,
        created_at: new Date('2025-09-04T21:52:27.242Z'),
        updated_at: new Date('2025-09-04T21:52:27.242Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedResult]
      });

      const result = await LoadModel.create(minimalLoad);

      expect(result.status).toBe('planned');
      expect(result.driver_id).toBe(null);
      expect(result.vehicle).toBe(null);
    });
  });

  describe('findById', () => {
    it('should return load data when found', async () => {
      const mockLoadData = { 
        id: '550e8400-e29b-41d4-a716-446655440000', 
        name: 'Test Load',
        status: 'planned',
        departure_date: '2024-01-15T05:00:00.000Z',
        driver_id: null,
        vehicle: null,
        estimated_duration: null,
        actual_duration: null,
        created_at: new Date('2025-09-04T21:52:27.242Z'),
        updated_at: new Date('2025-09-04T21:52:27.242Z'),
      };
      
      mockQuery.mockResolvedValue({
        rows: [mockLoadData]
      });

      const result = await LoadModel.findById('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toEqual(mockLoadData);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM loads WHERE id = $1',
        ['550e8400-e29b-41d4-a716-446655440000']
      );
    });

    it('should return null when load not found', async () => {
      mockQuery.mockResolvedValue({
        rows: []
      });

      const result = await LoadModel.findById('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return list of loads', async () => {
      const mockLoads = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Load',
          status: 'planned',
          departure_date: '2024-01-15T05:00:00.000Z',
          driver_id: null,
          vehicle: null,
          estimated_duration: null,
          actual_duration: null,
          created_at: new Date('2025-09-04T21:52:27.242Z'),
          updated_at: new Date('2025-09-04T21:52:27.242Z'),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Test Load 2',
          status: 'planned',
          departure_date: '2024-01-16T05:00:00.000Z',
          driver_id: null,
          vehicle: null,
          estimated_duration: null,
          actual_duration: null,
          created_at: new Date('2025-09-04T21:52:27.255Z'),
          updated_at: new Date('2025-09-04T21:52:27.255Z'),
        }
      ];

      mockQuery.mockResolvedValue({
        rows: mockLoads
      });

      const result = await LoadModel.list();

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockLoads);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM loads ORDER BY departure_date DESC, created_at DESC LIMIT $1',
        [100]
      );
    });
  });

  describe('findByDriver', () => {
    it('should return loads for specific driver', async () => {
      const driverId = 'driver-123';
      const mockLoads = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Driver Load',
        status: 'planned',
        departure_date: '2024-01-15T05:00:00.000Z',
        driver_id: driverId,
        vehicle: 'truck-001',
        estimated_duration: 480,
        actual_duration: null,
        created_at: new Date('2025-09-04T21:52:27.242Z'),
        updated_at: new Date('2025-09-04T21:52:27.242Z'),
      }];

      mockQuery.mockResolvedValue({
        rows: mockLoads
      });

      const result = await LoadModel.findByDriver(driverId);

      expect(result).toEqual(mockLoads);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM loads WHERE driver_id = $1 ORDER BY departure_date DESC',
        [driverId]
      );
    });
  });
});