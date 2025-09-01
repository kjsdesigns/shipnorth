import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface OptimizedRoute {
  id: string;
  loadId: string;
  routeData: any;
  totalDistance: number;
  totalDuration: number;
  estimatedDays: number;
  warnings: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class OptimizedRouteModel {
  static async query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async create(routeData: Omit<OptimizedRoute, 'id' | 'createdAt' | 'updatedAt'>): Promise<OptimizedRoute> {
    try {
      const id = uuidv4();
      const result = await this.query(`
        INSERT INTO optimized_routes (id, load_id, route_data, total_distance, total_duration, estimated_days, warnings)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        id,
        routeData.loadId,
        JSON.stringify(routeData.routeData),
        routeData.totalDistance,
        routeData.totalDuration,
        routeData.estimatedDays,
        routeData.warnings
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating optimized route:', error);
      throw error;
    }
  }

  static async findByLoadId(loadId: string): Promise<OptimizedRoute | null> {
    try {
      const result = await this.query(
        'SELECT * FROM optimized_routes WHERE load_id = $1 ORDER BY created_at DESC LIMIT 1',
        [loadId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding optimized route by load ID:', error);
      return null;
    }
  }

  static async findById(id: string): Promise<OptimizedRoute | null> {
    try {
      const result = await this.query('SELECT * FROM optimized_routes WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding optimized route by ID:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<OptimizedRoute>): Promise<OptimizedRoute | null> {
    try {
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id')
        .map((key, i) => {
          if (key === 'routeData') return `route_data = $${i + 2}`;
          if (key === 'totalDistance') return `total_distance = $${i + 2}`;
          if (key === 'totalDuration') return `total_duration = $${i + 2}`;
          if (key === 'estimatedDays') return `estimated_days = $${i + 2}`;
          return `${key} = $${i + 2}`;
        })
        .join(', ');

      const values = Object.entries(updates)
        .filter(([key]) => key !== 'id')
        .map(([key, value]) => {
          if (key === 'routeData' || key === 'warnings') return JSON.stringify(value);
          return value;
        });

      const result = await this.query(`
        UPDATE optimized_routes SET ${setClause}, updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [id, ...values]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating optimized route:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await this.query('DELETE FROM optimized_routes WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting optimized route:', error);
      throw error;
    }
  }
}