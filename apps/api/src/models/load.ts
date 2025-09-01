import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface Load {
  id: string;
  name: string;
  driver_id?: string;
  vehicle?: string;
  vehicleId?: string; // Alias for vehicle
  status: string;
  departure_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  created_at?: Date;
  updated_at?: Date;
  
  // Additional properties used by services (with getters/aliases)
  driverId?: string;
  departureDate?: string;
  routeOptimized?: boolean;
  totalPackages?: number;
  estimatedDistance?: number;
  estimatedDuration?: number; // Alias for estimated_duration
  defaultDeliveryDate?: string;
  deliveryCities?: Array<{city: string; province: string; country?: string; expectedDeliveryDate?: string}> | string[];
  driverName?: string;
  carrierOrTruck?: string;
  originAddress?: string;
  transportMode?: string;
  notes?: string;
  locationHistory?: any[];
  currentLocation?: any;
}

export class LoadModel {
  static async query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async list(limit = 100): Promise<Load[]> {
    try {
      const result = await this.query(
        'SELECT * FROM loads ORDER BY departure_date DESC, created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error listing loads:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<Load | null> {
    try {
      const result = await this.query('SELECT * FROM loads WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding load by ID:', error);
      throw error;
    }
  }

  static async findByDriver(driverId: string): Promise<Load[]> {
    try {
      const result = await this.query(
        'SELECT * FROM loads WHERE driver_id = $1 ORDER BY departure_date DESC',
        [driverId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding loads by driver:', error);
      throw error;
    }
  }

  static async create(loadData: Omit<Load, 'id' | 'created_at' | 'updated_at'>): Promise<Load> {
    try {
      const id = uuidv4();
      const result = await this.query(`
        INSERT INTO loads (id, name, driver_id, vehicle, status, departure_date, estimated_duration, actual_duration)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [id, loadData.name, loadData.driver_id, loadData.vehicle, loadData.status, loadData.departure_date, loadData.estimated_duration, loadData.actual_duration]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating load:', error);
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Load>): Promise<Load | null> {
    try {
      const setFields = [];
      const values = [id];
      let paramIndex = 2;

      // Handle field mapping and build SET clause dynamically
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'id') continue;
        
        let dbField = key;
        if (key === 'routeOptimized') dbField = 'route_optimized';
        else if (key === 'estimatedDistance') dbField = 'estimated_distance';
        else if (key === 'estimatedDuration') dbField = 'estimated_duration_total';
        
        setFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      // Always update the updated_at timestamp
      setFields.push(`updated_at = NOW()`);

      const result = await this.query(`
        UPDATE loads 
        SET ${setFields.join(', ')}
        WHERE id = $1 
        RETURNING *
      `, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating load:', error);
      throw error;
    }
  }

  static async getPackages(loadId: string): Promise<string[]> {
    try {
      const result = await this.query(
        'SELECT package_id FROM load_packages WHERE load_id = $1 ORDER BY sequence_order',
        [loadId]
      );
      return result.rows.map(row => row.package_id);
    } catch (error) {
      console.error('Error getting load packages:', error);
      throw error;
    }
  }

  static async assignPackages(loadId: string, packageIds: string[]): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Remove existing assignments for these packages (they might be assigned to other loads)
      if (packageIds.length > 0) {
        const placeholders = packageIds.map((_, i) => `$${i + 1}`).join(',');
        await client.query(
          `DELETE FROM load_packages WHERE package_id IN (${placeholders})`,
          packageIds
        );
      }

      // Add new assignments to the junction table
      for (let i = 0; i < packageIds.length; i++) {
        const packageId = packageIds[i];
        await client.query(
          'INSERT INTO load_packages (load_id, package_id, sequence_order) VALUES ($1, $2, $3)',
          [loadId, packageId, i + 1]
        );
      }

      await client.query('COMMIT');
      console.log(`✅ Assigned ${packageIds.length} packages to load ${loadId}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error assigning packages to load:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Remove load-package relationships
      await client.query('DELETE FROM load_packages WHERE load_id = $1', [id]);
      
      // Clear load_id from packages
      await client.query('UPDATE packages SET load_id = NULL WHERE load_id = $1', [id]);
      
      // Delete the load
      const result = await client.query('DELETE FROM loads WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting load:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async assignDriver(loadId: string, driverId: string): Promise<boolean> {
    try {
      const result = await this.query(
        'UPDATE loads SET driver_id = $1, updated_at = NOW() WHERE id = $2',
        [driverId, loadId]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error assigning driver to load:', error);
      throw error;
    }
  }

  static async addLocationTracking(loadId: string, location: any): Promise<boolean> {
    try {
      // Mock implementation for location tracking
      // This would typically update a GPS tracking table
      console.log(`Adding location tracking for load ${loadId}:`, location);
      return true;
    } catch (error) {
      console.error('Error adding location tracking:', error);
      throw error;
    }
  }

  static async updateDeliveryCities(loadId: string, cities: string[]): Promise<boolean> {
    try {
      // Mock implementation - would typically update a separate table or JSON column
      console.log(`Updating delivery cities for load ${loadId}:`, cities);
      return true;
    } catch (error) {
      console.error('Error updating delivery cities:', error);
      throw error;
    }
  }
}