import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy: 'exact' | 'postal_code' | 'city_center' | 'approximate';
  geocodedAt: string;
  geocodingService?: string;
}

export interface Address {
  id: string;
  customer_id?: string;
  type?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  coordinates?: Coordinates;
  geocodingStatus: 'pending' | 'success' | 'failed' | 'not_attempted';
  geocodingError?: string;
  geocodedAt?: string;
  isDefault?: boolean;
  createdAt: string;
}

export class AddressModel {
  static async query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async create(addressData: Omit<Address, 'id' | 'createdAt'>): Promise<Address> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      const newAddress: Address = {
        id,
        ...addressData,
        geocodingStatus: addressData.geocodingStatus || 'not_attempted',
        createdAt: now,
      };

      const result = await this.query(`
        INSERT INTO addresses (id, customer_id, type, address_line1, address_line2, city, province_state, postal_code, country, is_default, geocoding_status, geocoding_error)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        id,
        addressData.customer_id,
        addressData.type || 'shipping',
        addressData.address1,
        addressData.address2,
        addressData.city,
        addressData.province,
        addressData.postalCode,
        addressData.country || 'CA',
        addressData.isDefault || false,
        newAddress.geocodingStatus,
        addressData.geocodingError
      ]);

      const createdAddress = result.rows[0];
      
      // Trigger geocoding if not already done
      if (newAddress.geocodingStatus === 'not_attempted') {
        // Don't await this - let it happen async
        this.requestGeocoding(id);
      }

      return createdAddress;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<Address | null> {
    try {
      const result = await this.query(`
        SELECT 
          *,
          province_state as province,
          postal_code as "postalCode",
          address_line1 as address1,
          address_line2 as address2
        FROM addresses 
        WHERE id = $1
      `, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding address by ID:', error);
      return null;
    }
  }

  static async findExisting(addressData: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  }): Promise<Address | null> {
    try {
      const result = await this.query(`
        SELECT * FROM addresses 
        WHERE address_line1 ILIKE $1 
          AND city ILIKE $2 
          AND province_state ILIKE $3 
          AND postal_code = $4 
          AND country = $5
          AND COALESCE(address_line2, '') = COALESCE($6, '')
        LIMIT 1
      `, [
        addressData.address1,
        addressData.city,
        addressData.province,
        addressData.postalCode.replace(/\s/g, '').toUpperCase(),
        addressData.country || 'CA',
        addressData.address2 || ''
      ]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding existing address:', error);
      return null;
    }
  }

  static async findOrCreate(addressData: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    customer_id?: string;
    type?: string;
  }): Promise<Address> {
    const existing = await this.findExisting(addressData);
    if (existing) {
      return existing;
    }

    return await this.create({
      ...addressData,
      geocodingStatus: 'not_attempted' as const,
    });
  }

  static async requestGeocoding(id: string): Promise<void> {
    try {
      await this.updateGeocodingStatus(id, 'pending');
      
      // Get address data
      const address = await this.findById(id);
      if (!address) return;

      // Mock geocoding for Canadian addresses
      const coordinates = await this.mockGeocode(address);
      
      if (coordinates) {
        await this.updateGeocodingStatus(id, 'success', coordinates);
      } else {
        await this.updateGeocodingStatus(id, 'failed', undefined, 'Mock geocoding failed');
      }
    } catch (error) {
      await this.updateGeocodingStatus(id, 'failed', undefined, error instanceof Error ? error.message : 'Geocoding failed');
    }
  }

  static async updateGeocodingStatus(
    id: string,
    status: Address['geocodingStatus'],
    coordinates?: Coordinates,
    error?: string
  ): Promise<Address | null> {
    try {
      let query = 'UPDATE addresses SET geocoding_status = $1, geocoded_at = NOW()';
      let params: any[] = [status];
      let paramIndex = 2;

      if (coordinates) {
        query += `, coordinates = $${paramIndex}`;
        params.push(JSON.stringify(coordinates));
        paramIndex++;
      }

      if (error) {
        query += `, geocoding_error = $${paramIndex}`;
        params.push(error);
        paramIndex++;
      }

      query += ' WHERE id = $' + paramIndex + ' RETURNING *';
      params.push(id);

      const result = await this.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating geocoding status:', error);
      throw error;
    }
  }

  private static async mockGeocode(address: Address): Promise<Coordinates | null> {
    // Comprehensive mock geocoding for Canadian cities
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      // Major cities
      'toronto-on': { lat: 43.6532, lng: -79.3832 },
      'montreal-qc': { lat: 45.5017, lng: -73.5673 },
      'vancouver-bc': { lat: 49.2827, lng: -123.1207 },
      'calgary-ab': { lat: 51.0447, lng: -114.0719 },
      'ottawa-on': { lat: 45.4215, lng: -75.6972 },
      'halifax-ns': { lat: 44.6488, lng: -63.5752 },
      'winnipeg-mb': { lat: 49.8951, lng: -97.1384 },
      'edmonton-ab': { lat: 53.5461, lng: -113.4938 },
      'mississauga-on': { lat: 43.5890, lng: -79.6441 },
      'richmond-bc': { lat: 49.1666, lng: -123.1336 },
      'charlottetown-pe': { lat: 46.2382, lng: -63.1311 },
      
      // Quebec cities
      'la sarre-qc': { lat: 48.7969, lng: -79.2008 },
      'amos-qc': { lat: 48.5667, lng: -78.1167 },
      'chibougamau-qc': { lat: 49.9167, lng: -74.3667 },
      'rouyn-noranda-qc': { lat: 48.2467, lng: -79.0228 },
      'val-d\'or-qc': { lat: 48.0978, lng: -77.7828 },
      
      // Additional centers
      'london-on': { lat: 42.9849, lng: -81.2453 },
      'hamilton-on': { lat: 43.2557, lng: -79.8711 },
      'kitchener-on': { lat: 43.4516, lng: -80.4925 },
      'saskatoon-sk': { lat: 52.1332, lng: -106.6700 },
      'regina-sk': { lat: 50.4452, lng: -104.6189 },
    };

    const cityKey = `${address.city.toLowerCase()}-${address.province.toLowerCase()}`;
    let coords = cityCoordinates[cityKey];

    // If exact match not found, try fuzzy matching
    if (!coords) {
      const fuzzyKey = Object.keys(cityCoordinates).find(key => 
        key.includes(address.city.toLowerCase()) || 
        address.city.toLowerCase().includes(key.split('-')[0])
      );
      if (fuzzyKey) {
        coords = cityCoordinates[fuzzyKey];
      }
    }

    // Fallback: Use provincial center for unknown cities
    if (!coords) {
      const provincialCenters: { [key: string]: { lat: number; lng: number } } = {
        'on': { lat: 44.2619, lng: -78.2635 }, // Central Ontario
        'qc': { lat: 46.8139, lng: -71.2080 }, // Quebec City
        'bc': { lat: 53.7267, lng: -127.6476 }, // Central BC
        'ab': { lat: 53.9333, lng: -116.5765 }, // Central Alberta
        'mb': { lat: 53.7609, lng: -98.8139 }, // Central Manitoba
        'sk': { lat: 52.9399, lng: -106.4509 }, // Central Saskatchewan
        'ns': { lat: 44.6820, lng: -63.7443 }, // Central Nova Scotia
        'nb': { lat: 46.5653, lng: -66.4619 }, // Central New Brunswick
        'pe': { lat: 46.2382, lng: -63.1311 }, // Charlottetown
        'nl': { lat: 47.5615, lng: -52.7126 }, // St. John's
      };
      
      coords = provincialCenters[address.province.toLowerCase()];
    }

    if (coords) {
      // Add small random offset for street-level accuracy
      const latOffset = (Math.random() - 0.5) * 0.02; // ~1km variation
      const lngOffset = (Math.random() - 0.5) * 0.02;

      return {
        lat: coords.lat + latOffset,
        lng: coords.lng + lngOffset,
        accuracy: 'approximate' as const,
        geocodedAt: new Date().toISOString(),
        geocodingService: 'mock-geocoder-comprehensive'
      };
    }

    return null;
  }

  static async geocodeAllAddresses(): Promise<void> {
    try {
      console.log('🌍 Geocoding all addresses...');
      
      const result = await this.query(
        "SELECT id FROM addresses WHERE geocoding_status = 'not_attempted' OR coordinates IS NULL"
      );
      
      const addressesToGeocode = result.rows;
      console.log(`Found ${addressesToGeocode.length} addresses to geocode`);

      for (const row of addressesToGeocode) {
        await this.requestGeocoding(row.id);
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ Geocoding complete');
    } catch (error) {
      console.error('Error geocoding addresses:', error);
      throw error;
    }
  }

  static async list(limit = 100): Promise<Address[]> {
    try {
      const result = await this.query(
        'SELECT * FROM addresses ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error listing addresses:', error);
      return [];
    }
  }

  static async getGeocodingStats(): Promise<{
    pending: number;
    success: number;
    failed: number;
    not_attempted: number;
  }> {
    try {
      const result = await this.query(`
        SELECT 
          geocoding_status,
          COUNT(*) as count
        FROM addresses 
        GROUP BY geocoding_status
      `);

      const stats = {
        pending: 0,
        success: 0,
        failed: 0,
        not_attempted: 0,
      };

      result.rows.forEach(row => {
        const status = row.geocoding_status;
        const count = parseInt(row.count, 10);
        if (status in stats) {
          (stats as any)[status] = count;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting geocoding stats:', error);
      return {
        pending: 0,
        success: 0,
        failed: 0,
        not_attempted: 0,
      };
    }
  }
}