import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface Package {
  id: string;
  barcode: string;
  customer_id: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  declared_value?: number;
  description?: string;
  ship_from_address_id?: string;
  ship_to_address_id?: string;
  status: string;
  tracking_number?: string;
  carrier?: string;
  service_type?: string;
  label_url?: string;
  estimated_cost?: number;
  actual_cost?: number;
  load_id?: string;
  loadId?: string; // Alias for load_id
  created_at?: Date;
  updated_at?: Date;
  
  // Additional properties used by services (aliases and computed properties)
  trackingNumber?: string; // Alias for tracking_number
  shipTo?: {
    name?: string;
    address?: any;
    addressId?: string;
  };
  shipmentStatus?: string;
  labelStatus?: string;
  paymentStatus?: string;
  notes?: string;
  customerName?: string; // From joined customer data
  address?: any; // Address information
  receivedDate?: Date;
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paymentUrl?: string;
  paidAt?: Date;
  shipping_cost?: number;
  parent_package_id?: string;
  quotedCarrier?: string;
  quotedService?: string;
  quotedRate?: number;
  deliveryDate?: Date;
  labelUrl?: string;  // Alias for label_url
  price?: number;
  deliveryConfirmation?: {
    photos?: string[];
    photoUrl?: string;
    signature?: string;
    timestamp?: Date;
    deliveredAt?: Date;
    notes?: string;
    confirmedBy?: string;
    recipientName?: string;
  };
}

export class PackageModel {
  static async query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async list(limit = 50): Promise<Package[]> {
    try {
      const result = await this.query(
        'SELECT * FROM packages ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error listing packages:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<Package | null> {
    try {
      const result = await this.query('SELECT * FROM packages WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding package by ID:', error);
      throw error;
    }
  }

  static async findByCustomer(customerId: string): Promise<Package[]> {
    try {
      const result = await this.query(
        'SELECT * FROM packages WHERE customer_id = $1 ORDER BY created_at DESC',
        [customerId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding packages by customer:', error);
      throw error;
    }
  }

  static async getPackagesByLoadStatus(status: string): Promise<Package[]> {
    try {
      let query = '';
      let params: any[] = [];

      switch (status) {
        case 'unassigned':
          query = 'SELECT * FROM packages WHERE load_id IS NULL ORDER BY created_at DESC';
          break;
        case 'assigned':
          query = 'SELECT * FROM packages WHERE load_id IS NOT NULL AND status IN ($1, $2) ORDER BY created_at DESC';
          params = ['pending', 'quoted'];
          break;
        case 'in_transit':
          query = 'SELECT * FROM packages WHERE status = $1 ORDER BY created_at DESC';
          params = ['shipped'];
          break;
        default:
          query = 'SELECT * FROM packages ORDER BY created_at DESC';
      }

      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting packages by load status:', error);
      throw error;
    }
  }

  static async create(packageData: Omit<Package, 'id' | 'created_at' | 'updated_at'>): Promise<Package> {
    try {
      const id = uuidv4();
      const result = await this.query(`
        INSERT INTO packages (id, barcode, customer_id, weight, length, width, height, declared_value, description, ship_from_address_id, ship_to_address_id, status, tracking_number, carrier, service_type, estimated_cost, actual_cost, label_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `, [
        id,
        packageData.barcode,
        packageData.customer_id,
        packageData.weight,
        packageData.length,
        packageData.width,
        packageData.height,
        packageData.declared_value,
        packageData.description,
        packageData.ship_from_address_id,
        packageData.ship_to_address_id,
        packageData.status,
        packageData.tracking_number,
        packageData.carrier,
        packageData.service_type,
        packageData.estimated_cost,
        packageData.actual_cost,
        packageData.label_url
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating package:', error);
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Package>): Promise<Package | null> {
    try {
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id')
        .map((key, i) => `${key} = $${i + 2}`)
        .join(', ');

      const values = Object.entries(updates)
        .filter(([key]) => key !== 'id')
        .map(([, value]) => value);

      const result = await this.query(`
        UPDATE packages SET ${setClause}, updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [id, ...values]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating package:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await this.query('DELETE FROM packages WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting package:', error);
      throw error;
    }
  }

  // Additional methods needed for compatibility with existing code
  static async getExpectedDeliveryDate(id: string): Promise<string | null> {
    // Mock implementation for now
    const pkg = await this.findById(id);
    if (!pkg) return null;
    
    // Return a mock delivery date 3 days from now
    const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return deliveryDate.toISOString();
  }

  static async getPackageStats(): Promise<{
    unassigned: number;
    assigned: number;
    in_transit: number;
  }> {
    try {
      const result = await this.query(`
        SELECT 
          SUM(CASE WHEN load_id IS NULL THEN 1 ELSE 0 END) as unassigned,
          SUM(CASE WHEN load_id IS NOT NULL AND status NOT IN ('shipped', 'delivered') THEN 1 ELSE 0 END) as assigned,
          SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as in_transit
        FROM packages
      `);
      
      const stats = result.rows[0];
      return {
        unassigned: parseInt(stats.unassigned) || 0,
        assigned: parseInt(stats.assigned) || 0,
        in_transit: parseInt(stats.in_transit) || 0,
      };
    } catch (error) {
      console.error('Error getting package stats:', error);
      return { unassigned: 0, assigned: 0, in_transit: 0 };
    }
  }

  static async search(query: string, limit = 50): Promise<Package[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      const result = await this.query(`
        SELECT * FROM packages 
        WHERE LOWER(description) LIKE $1 
           OR LOWER(barcode) LIKE $1 
           OR LOWER(tracking_number) LIKE $1
        ORDER BY created_at DESC 
        LIMIT $2
      `, [searchTerm, limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Error searching packages:', error);
      throw error;
    }
  }

  static async findByIdWithAddress(id: string): Promise<(Package & { address?: any }) | null> {
    try {
      // Get package with complete ship-to address data for route optimization
      const result = await this.query(`
        SELECT p.*, 
               a.id as address_id,
               a.address_line1,
               a.address_line2,
               a.city,
               a.province_state as province,
               a.postal_code,
               a.country,
               a.coordinates,
               a.geocoding_status
        FROM packages p
        LEFT JOIN addresses a ON p.ship_to_address_id = a.id
        WHERE p.id = $1
      `, [id]);
      
      const packageData = result.rows[0];
      if (!packageData) return null;
      
      // Structure the address data for route optimization compatibility
      if (packageData.address_id) {
        packageData.address = {
          id: packageData.address_id,
          address1: packageData.address_line1,
          address2: packageData.address_line2,
          city: packageData.city,
          province: packageData.province,
          postalCode: packageData.postal_code,
          country: packageData.country,
          geocodingStatus: packageData.geocoding_status || 'success',
          coordinates: packageData.coordinates ? (typeof packageData.coordinates === 'string' ? JSON.parse(packageData.coordinates) : packageData.coordinates) : null,
          createdAt: new Date().toISOString(),
        };
      }
      
      return packageData;
    } catch (error) {
      console.error('Error finding package with address:', error);
      return this.findById(id);
    }
  }

  // Additional methods for compatibility
  static async get(id: string): Promise<Package | null> {
    return this.findById(id);
  }

  static async markAsDelivered(id: string, deliveryInfo?: any): Promise<boolean> {
    try {
      const result = await this.update(id, {
        status: 'delivered',
        deliveryConfirmation: deliveryInfo,
        receivedDate: new Date(),
      });
      return !!result;
    } catch (error) {
      console.error('Error marking package as delivered:', error);
      return false;
    }
  }

  static async addToParentPackage(childId: string, parentId: string): Promise<boolean> {
    try {
      // Mock implementation - would typically handle package relationships
      console.log(`Adding package ${childId} to parent ${parentId}`);
      return true;
    } catch (error) {
      console.error('Error adding to parent package:', error);
      return false;
    }
  }

  static async removeFromParentPackage(childId: string, parentId: string): Promise<boolean> {
    try {
      // Mock implementation - would typically handle package relationships
      console.log(`Removing package ${childId} from parent ${parentId}`);
      return true;
    } catch (error) {
      console.error('Error removing from parent package:', error);
      return false;
    }
  }

  static async getPackageWithRelationships(id: string): Promise<Package | null> {
    try {
      // Mock implementation - would typically join with related packages
      const pkg = await this.findById(id);
      return pkg;
    } catch (error) {
      console.error('Error getting package with relationships:', error);
      return null;
    }
  }
}