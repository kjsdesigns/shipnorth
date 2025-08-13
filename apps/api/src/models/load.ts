import { DatabaseService, generateId } from '../services/database';

export interface Load {
  id: string;
  departureDate: string;
  arrivalDate?: string;
  transportMode: 'truck' | 'rail' | 'air' | 'sea';
  carrierOrTruck?: string;
  vehicleId?: string;
  driverName?: string;
  originAddress?: string;
  notes?: string;
  status: 'planned' | 'departed' | 'arrived' | 'closed';
  totalPackages?: number;
  totalWeight?: number;
  manifestUrl?: string;
  gpsTracking?: {
    lat: number;
    lng: number;
    timestamp: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export class LoadModel {
  static async create(load: Omit<Load, 'id' | 'createdAt' | 'updatedAt'>): Promise<Load> {
    const id = generateId();
    
    const newLoad: Load = {
      id,
      ...load,
      status: load.status || 'planned',
      transportMode: load.transportMode || 'truck',
      totalPackages: 0,
      totalWeight: 0,
      gpsTracking: [],
    };

    await DatabaseService.put({
      PK: `LOAD#${id}`,
      SK: 'METADATA',
      GSI2PK: `DATE#${newLoad.departureDate.split('T')[0]}`,
      GSI2SK: `LOAD#${id}`,
      Type: 'Load',
      Data: newLoad,
    });

    return newLoad;
  }

  static async findById(id: string): Promise<Load | null> {
    const item = await DatabaseService.get(`LOAD#${id}`, 'METADATA');
    return item ? item.Data : null;
  }

  static async findByDate(date: string): Promise<Load[]> {
    const items = await DatabaseService.queryByGSI('GSI2', `DATE#${date}`);
    return items
      .filter((item: any) => item.Type === 'Load')
      .map((item: any) => item.Data);
  }

  static async update(id: string, updates: Partial<Load>): Promise<Load | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updatedLoad = { ...current, ...updates };
    
    const result = await DatabaseService.update(`LOAD#${id}`, 'METADATA', {
      Data: updatedLoad,
    });
    
    return result ? result.Data : null;
  }

  static async list(limit = 100): Promise<Load[]> {
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': 'Load',
      },
      Limit: limit,
    });

    return items.map((item: any) => item.Data).filter(Boolean);
  }

  static async getPackages(loadId: string): Promise<string[]> {
    const items = await DatabaseService.query({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `LOAD#${loadId}`,
        ':sk': 'PACKAGE#',
      },
    });

    return items.map((item: any) => item.packageId);
  }

  static async assignPackages(loadId: string, packageIds: string[]): Promise<boolean> {
    const load = await this.findById(loadId);
    if (!load) return false;

    // Add packages to load
    const putItems = packageIds.map(packageId => ({
      PK: `LOAD#${loadId}`,
      SK: `PACKAGE#${packageId}`,
      Type: 'LoadPackageRelation',
      packageId,
    }));

    await DatabaseService.batchWrite(putItems);

    // Update package records
    for (const packageId of packageIds) {
      await DatabaseService.update(`PACKAGE#${packageId}`, 'METADATA', {
        'Data.loadId': loadId,
      });
    }

    // Update load totals
    await this.updateTotals(loadId);

    return true;
  }

  static async updateTotals(loadId: string): Promise<void> {
    const packageIds = await this.getPackages(loadId);
    let totalWeight = 0;
    
    for (const packageId of packageIds) {
      const pkg = await DatabaseService.get(`PACKAGE#${packageId}`, 'METADATA');
      if (pkg && pkg.Data) {
        totalWeight += pkg.Data.weight || 0;
      }
    }

    await this.update(loadId, {
      totalPackages: packageIds.length,
      totalWeight,
    });
  }

  static async updateGPS(loadId: string, lat: number, lng: number): Promise<boolean> {
    const load = await this.findById(loadId);
    if (!load) return false;

    const gpsEntry = {
      lat,
      lng,
      timestamp: new Date().toISOString(),
    };

    const gpsTracking = [...(load.gpsTracking || []), gpsEntry];

    await this.update(loadId, { gpsTracking });
    return true;
  }

  static async generateManifest(loadId: string): Promise<string> {
    const load = await this.findById(loadId);
    if (!load) throw new Error('Load not found');

    const packages = await this.getPackages(loadId);
    
    // Mock manifest URL
    const manifestUrl = `https://mock-manifests.s3.amazonaws.com/load-${loadId}.pdf`;
    
    await this.update(loadId, { manifestUrl });
    
    return manifestUrl;
  }

  static async delete(id: string): Promise<boolean> {
    const load = await this.findById(id);
    if (!load) return false;

    // Remove all package associations
    const packages = await this.getPackages(id);
    for (const packageId of packages) {
      await DatabaseService.delete(`LOAD#${id}`, `PACKAGE#${packageId}`);
      await DatabaseService.update(`PACKAGE#${packageId}`, 'METADATA', {
        'Data.loadId': null,
      });
    }

    await DatabaseService.delete(`LOAD#${id}`, 'METADATA');
    
    return true;
  }
}