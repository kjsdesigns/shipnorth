import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface City {
  id: string;
  name: string;
  province: string;
  alternativeNames?: string[];
  packageCount?: number;
  businessRules?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CityModel {
  static async query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async findByName(name: string, province?: string): Promise<City[]> {
    try {
      let query = 'SELECT * FROM cities WHERE name ILIKE $1';
      const params = [`%${name}%`];
      
      if (province) {
        query += ' AND province ILIKE $2';
        params.push(`%${province}%`);
      }
      
      query += ' ORDER BY name';
      
      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding cities by name:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<City | null> {
    try {
      const result = await this.query('SELECT * FROM cities WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding city by ID:', error);
      return null;
    }
  }

  static async create(cityData: Omit<City, 'id' | 'createdAt' | 'updatedAt'>): Promise<City> {
    try {
      const id = uuidv4();
      const result = await this.query(`
        INSERT INTO cities (id, name, province, alternative_names, business_rules)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        id, 
        cityData.name, 
        cityData.province, 
        cityData.alternativeNames || [], 
        JSON.stringify(cityData.businessRules || {})
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating city:', error);
      throw error;
    }
  }

  static async getCitiesWithPackageCounts(): Promise<City[]> {
    try {
      const result = await this.query(`
        SELECT 
          c.*,
          COUNT(DISTINCT a.id) as package_count
        FROM cities c
        LEFT JOIN addresses a ON c.name ILIKE a.city AND c.province ILIKE a.province_state
        LEFT JOIN packages p ON a.id = p.ship_to_address_id
        GROUP BY c.id, c.name, c.province
        ORDER BY package_count DESC, c.name
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting cities with package counts:', error);
      return [];
    }
  }

  static async update(id: string, updates: Partial<City>): Promise<City | null> {
    try {
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id')
        .map((key, i) => {
          if (key === 'alternativeNames') return `alternative_names = $${i + 2}`;
          if (key === 'businessRules') return `business_rules = $${i + 2}`;
          return `${key} = $${i + 2}`;
        })
        .join(', ');

      const values = Object.entries(updates)
        .filter(([key]) => key !== 'id')
        .map(([key, value]) => {
          if (key === 'businessRules') return JSON.stringify(value);
          return value;
        });

      const result = await this.query(`
        UPDATE cities SET ${setClause}, updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [id, ...values]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating city:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await this.query('DELETE FROM cities WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting city:', error);
      throw error;
    }
  }

  static async addAlternativeName(id: string, name: string): Promise<City | null> {
    try {
      const city = await this.findById(id);
      if (!city) return null;
      
      const currentNames = city.alternativeNames || [];
      if (!currentNames.includes(name)) {
        currentNames.push(name);
        return await this.update(id, { alternativeNames: currentNames });
      }
      
      return city;
    } catch (error) {
      console.error('Error adding alternative name:', error);
      throw error;
    }
  }

  static async removeAlternativeName(id: string, name: string): Promise<City | null> {
    try {
      const city = await this.findById(id);
      if (!city) return null;
      
      const currentNames = city.alternativeNames || [];
      const updatedNames = currentNames.filter(n => n !== name);
      
      return await this.update(id, { alternativeNames: updatedNames });
    } catch (error) {
      console.error('Error removing alternative name:', error);
      throw error;
    }
  }

  static async findCityByAddress(address: any): Promise<City | null> {
    try {
      if (!address?.city || !address?.province) {
        return null;
      }
      
      const result = await this.query(
        'SELECT * FROM cities WHERE name ILIKE $1 AND province ILIKE $2 LIMIT 1',
        [address.city, address.province]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding city by address:', error);
      return null;
    }
  }
}