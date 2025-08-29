import { DatabaseService, generateId } from '../services/database';
import { GeocodingService } from '../services/geocoding';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy: 'exact' | 'postal_code' | 'city_center' | 'approximate';
  geocodedAt: string;
  geocodingService?: string;
}

export interface Address {
  id: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  coordinates?: Coordinates;
  geocodingStatus: 'pending' | 'success' | 'failed' | 'not_attempted';
  geocodingError?: string;
  createdAt: string;
  // Immutable - never updated once created with geocoding info
}

export class AddressModel {
  static async create(addressData: Omit<Address, 'id' | 'createdAt'>): Promise<Address> {
    const id = generateId();
    const now = new Date().toISOString();

    const newAddress: Address = {
      id,
      ...addressData,
      geocodingStatus: addressData.geocodingStatus || 'not_attempted',
      createdAt: now,
    };

    await DatabaseService.put({
      PK: `ADDRESS#${id}`,
      SK: 'METADATA',
      GSI1PK: `GEOCODING#${newAddress.geocodingStatus}`,
      GSI1SK: `ADDRESS#${id}`,
      GSI2PK: `CITY#${addressData.city.toUpperCase()}#${addressData.province.toUpperCase()}`,
      GSI2SK: `ADDRESS#${id}`,
      Type: 'Address',
      Data: newAddress,
    });

    // Trigger geocoding if not already done
    if (newAddress.geocodingStatus === 'not_attempted') {
      await this.requestGeocoding(id);
    }

    return newAddress;
  }

  static async findById(id: string): Promise<Address | null> {
    const item = await DatabaseService.get(`ADDRESS#${id}`, 'METADATA');
    return item ? item.Data : null;
  }

  static async findExisting(addressData: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  }): Promise<Address | null> {
    // Search for existing identical address
    const items = await DatabaseService.queryByGSI(
      'GSI2',
      `CITY#${addressData.city.toUpperCase()}#${addressData.province.toUpperCase()}`
    );

    for (const item of items) {
      if (item.Type === 'Address') {
        const addr = item.Data as Address;
        if (
          addr.address1.toLowerCase() === addressData.address1.toLowerCase() &&
          (addr.address2 || '') === (addressData.address2 || '') &&
          addr.postalCode.replace(/\s/g, '').toUpperCase() ===
            addressData.postalCode.replace(/\s/g, '').toUpperCase() &&
          addr.country.toLowerCase() === addressData.country.toLowerCase()
        ) {
          return addr;
        }
      }
    }

    return null;
  }

  static async findOrCreate(addressData: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  }): Promise<Address> {
    const existing = await this.findExisting(addressData);
    if (existing) {
      return existing;
    }

    return await this.create({
      ...addressData,
      geocodingStatus: 'pending' as const,
    });
  }

  static async findByGeocodingStatus(status: Address['geocodingStatus']): Promise<Address[]> {
    const items = await DatabaseService.queryByGSI('GSI1', `GEOCODING#${status}`);
    return items.filter((item: any) => item.Type === 'Address').map((item: any) => item.Data);
  }

  static async updateGeocodingStatus(
    id: string,
    status: Address['geocodingStatus'],
    coordinates?: Coordinates,
    error?: string
  ): Promise<Address | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updates: Partial<Address> = {
      geocodingStatus: status,
      geocodingError: error,
    };

    if (coordinates) {
      updates.coordinates = coordinates;
    }

    const updateData: any = {
      Data: { ...current, ...updates },
      GSI1PK: `GEOCODING#${status}`,
    };

    const result = await DatabaseService.update(`ADDRESS#${id}`, 'METADATA', updateData);
    return result ? result.Data : null;
  }

  static async requestGeocoding(id: string): Promise<void> {
    await this.updateGeocodingStatus(id, 'pending');

    // In a real implementation, this would trigger a background job
    // For now, we'll attempt immediate geocoding with mock data
    setTimeout(async () => {
      await this.performGeocoding(id);
    }, 1000);
  }

  private static async performGeocoding(id: string): Promise<void> {
    const address = await this.findById(id);
    if (!address) return;

    try {
      // Use real geocoding service
      const geocodingService = GeocodingService.create();
      const coordinates = await geocodingService.geocode(address);

      if (coordinates) {
        await this.updateGeocodingStatus(id, 'success', coordinates);
      } else {
        await this.updateGeocodingStatus(id, 'failed', undefined, 'Address not found');
      }
    } catch (error) {
      await this.updateGeocodingStatus(
        id,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Geocoding failed'
      );
    }
  }

  // Batch geocoding for multiple addresses
  static async batchGeocode(addresses: Address[]): Promise<void> {
    const geocodingService = GeocodingService.create();

    try {
      const results = await geocodingService.batchGeocode(addresses);

      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const coordinates = results[i];

        if (coordinates) {
          await this.updateGeocodingStatus(address.id, 'success', coordinates);
        } else {
          await this.updateGeocodingStatus(address.id, 'failed', undefined, 'Address not found');
        }
      }
    } catch (error) {
      console.error('Batch geocoding error:', error);

      // Mark all as failed
      for (const address of addresses) {
        await this.updateGeocodingStatus(
          address.id,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Batch geocoding failed'
        );
      }
    }
  }

  static async list(limit = 100): Promise<Address[]> {
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': 'Address',
      },
      Limit: limit,
    });

    return items.map((item: any) => item.Data).filter(Boolean);
  }

  static async getGeocodingStats(): Promise<{
    pending: number;
    success: number;
    failed: number;
    not_attempted: number;
  }> {
    const addresses = await this.list(1000);

    return {
      pending: addresses.filter((addr) => addr.geocodingStatus === 'pending').length,
      success: addresses.filter((addr) => addr.geocodingStatus === 'success').length,
      failed: addresses.filter((addr) => addr.geocodingStatus === 'failed').length,
      not_attempted: addresses.filter((addr) => addr.geocodingStatus === 'not_attempted').length,
    };
  }

  // Calculate distance between two addresses using Haversine formula
  static calculateDistance(addr1: Address, addr2: Address): number {
    if (!addr1.coordinates || !addr2.coordinates) {
      return Infinity;
    }

    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(addr2.coordinates.lat - addr1.coordinates.lat);
    const dLng = this.toRadians(addr2.coordinates.lng - addr1.coordinates.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(addr1.coordinates.lat)) *
        Math.cos(this.toRadians(addr2.coordinates.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
