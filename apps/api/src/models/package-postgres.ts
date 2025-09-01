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
  created_at?: Date;
  updated_at?: Date;
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
        INSERT INTO packages (id, barcode, customer_id, weight, length, width, height, declared_value, description, ship_from_address_id, ship_to_address_id, status, tracking_number, carrier, service_type, estimated_cost, actual_cost, label_url, load_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
        packageData.label_url,
        packageData.load_id
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
}