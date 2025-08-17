import { Load, LoadDeliveryCity, LocationTracking, LoadStats } from '@shipnorth/shared';
import { LoadModel } from '../models/load';
import { PackageModel } from '../models/package';
import { MapsService } from './maps';

export class LoadService {
  static async createLoadWithOptimization(loadData: {
    departureDate: string;
    driverId?: string;
    driverName?: string;
    originAddress?: string;
    cities: Array<{ city: string; province: string; country: string }>;
    optimizeRoute?: boolean;
  }): Promise<Load> {
    let deliveryCities: LoadDeliveryCity[] = loadData.cities;

    // Optimize route if requested
    if (loadData.optimizeRoute && loadData.cities.length > 1) {
      try {
        const optimization = await MapsService.optimizeRoute(
          loadData.originAddress || 'Toronto, ON, Canada',
          loadData.cities
        );
        
        deliveryCities = optimization.waypoints.map(wp => ({
          city: wp.city,
          province: wp.province,
          country: wp.country,
          distance: wp.distance,
          drivingDuration: wp.duration,
        }));
      } catch (error) {
        console.error('Route optimization failed, using original order:', error);
      }
    }

    const newLoad = await LoadModel.create({
      departureDate: loadData.departureDate,
      deliveryCities,
      driverId: loadData.driverId,
      driverName: loadData.driverName,
      originAddress: loadData.originAddress,
      transportMode: 'truck',
      status: 'planned',
      locationHistory: [],
    });

    return newLoad;
  }

  static async assignPackagesToLoad(loadId: string, packageIds: string[]): Promise<void> {
    const load = await LoadModel.findById(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    // Validate all packages exist and are available
    for (const packageId of packageIds) {
      const pkg = await PackageModel.findById(packageId);
      if (!pkg) {
        throw new Error(`Package ${packageId} not found`);
      }
      if (pkg.loadId && pkg.loadId !== loadId) {
        throw new Error(`Package ${packageId} is already assigned to another load`);
      }
    }

    // Assign packages
    await LoadModel.assignPackages(loadId, packageIds);

    // Update load totals
    await LoadModel.updateTotals(loadId);
  }

  static async updateDeliveryCitiesWithOptimization(
    loadId: string,
    cities: LoadDeliveryCity[],
    originAddress?: string
  ): Promise<LoadDeliveryCity[]> {
    const load = await LoadModel.findById(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    let updatedCities = cities;

    // Add route optimization if more than one city
    if (cities.length > 1) {
      try {
        const optimization = await MapsService.optimizeRoute(
          originAddress || load.originAddress || 'Toronto, ON, Canada',
          cities
        );
        
        updatedCities = optimization.waypoints.map((wp, index) => {
          const originalCity = cities.find(c => c.city === wp.city) || cities[index];
          return {
            ...originalCity,
            distance: wp.distance,
            drivingDuration: wp.duration,
          };
        });
      } catch (error) {
        console.error('Route optimization failed:', error);
      }
    }

    await LoadModel.updateDeliveryCities(loadId, updatedCities);
    return updatedCities;
  }

  static async addLocationTracking(
    loadId: string,
    lat: number,
    lng: number,
    isManual: boolean = false,
    addedBy?: string,
    address?: string
  ): Promise<LocationTracking> {
    const load = await LoadModel.findById(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    // Reverse geocode if address not provided
    let locationAddress = address;
    if (!locationAddress && !isManual) {
      try {
        locationAddress = await MapsService.reverseGeocode(lat, lng);
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
      }
    }

    const success = await LoadModel.addLocationTracking(
      loadId,
      lat,
      lng,
      isManual,
      addedBy,
      locationAddress || undefined
    );

    if (!success) {
      throw new Error('Failed to add location tracking');
    }

    return {
      lat,
      lng,
      timestamp: new Date().toISOString(),
      address: locationAddress,
      isManual,
      addedBy,
    };
  }

  static async getLoadStats(): Promise<LoadStats> {
    const loads = await LoadModel.list(1000);
    
    const stats = loads.reduce(
      (acc, load) => {
        acc[load.status as keyof LoadStats]++;
        acc.total++;
        return acc;
      },
      { planned: 0, in_transit: 0, delivered: 0, complete: 0, total: 0 }
    );

    return stats;
  }

  static async getLoadWithDetails(loadId: string): Promise<Load & { packages: Package[] } | null> {
    const load = await LoadModel.findById(loadId);
    if (!load) return null;

    const packageIds = await LoadModel.getPackages(loadId);
    const packages = await Promise.all(
      packageIds.map(id => PackageModel.findById(id))
    );

    return {
      ...load,
      packages: packages.filter(Boolean) as Package[],
    };
  }

  static async startLoad(loadId: string, driverId: string): Promise<Load> {
    const load = await LoadModel.findById(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    if (load.status !== 'planned') {
      throw new Error('Load is not in planned status');
    }

    const updatedLoad = await LoadModel.update(loadId, {
      status: 'in_transit',
      driverId,
    });

    if (!updatedLoad) {
      throw new Error('Failed to start load');
    }

    // Notify customers of packages in this load
    try {
      const packageIds = await LoadModel.getPackages(loadId);
      for (const packageId of packageIds) {
        const pkg = await PackageModel.findById(packageId);
        if (pkg) {
          await PackageModel.update(packageId, { shipmentStatus: 'in_transit' });
          
          const customer = await CustomerModel.findById(pkg.customerId);
          if (customer) {
            const expectedDeliveryDate = await PackageModel.getExpectedDeliveryDate(packageId);
            await NotificationService.notifyPackageStatusChange(
              packageId,
              'in_transit',
              customer,
              {
                trackingNumber: pkg.trackingNumber,
                expectedDeliveryDate,
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to send load start notifications:', error);
    }

    return updatedLoad;
  }

  static async completeLoad(loadId: string): Promise<Load> {
    const load = await LoadModel.findById(loadId);
    if (!load) {
      throw new Error('Load not found');
    }

    if (load.status !== 'in_transit') {
      throw new Error('Load is not in transit');
    }

    const updatedLoad = await LoadModel.update(loadId, {
      status: 'delivered',
    });

    if (!updatedLoad) {
      throw new Error('Failed to complete load');
    }

    return updatedLoad;
  }

  static async getDriverLoads(driverId: string): Promise<Load[]> {
    const allLoads = await LoadModel.list();
    return allLoads.filter(load => 
      !load.driverId || load.driverId === driverId
    );
  }

  static async getActiveLoadForDriver(driverId: string): Promise<Load | null> {
    const loads = await this.getDriverLoads(driverId);
    return loads.find(load => 
      load.status === 'in_transit' && load.driverId === driverId
    ) || null;
  }
}