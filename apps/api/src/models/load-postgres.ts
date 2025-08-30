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
  status: string;
  departure_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  created_at?: Date;
  updated_at?: Date;
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
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id')
        .map((key, i) => `${key} = $${i + 2}`)
        .join(', ');

      const values = Object.entries(updates)
        .filter(([key]) => key !== 'id')
        .map(([, value]) => value);

      const result = await this.query(`
        UPDATE loads SET ${setClause}, updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [id, ...values]);

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

      // Remove existing assignments for this load
      await client.query('DELETE FROM load_packages WHERE load_id = $1', [loadId]);

      // Add new assignments
      for (let i = 0; i < packageIds.length; i++) {
        const packageId = packageIds[i];
        await client.query(
          'INSERT INTO load_packages (load_id, package_id, sequence_order) VALUES ($1, $2, $3)',
          [loadId, packageId, i + 1]
        );
        
        // Update package with load_id
        await client.query('UPDATE packages SET load_id = $1 WHERE id = $2', [loadId, packageId]);
      }

      await client.query('COMMIT');
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
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting load:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}