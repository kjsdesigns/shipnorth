import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  business_name?: string;
  business_type?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class CustomerModel {
  static async query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async list(limit = 100): Promise<Customer[]> {
    try {
      const result = await this.query(
        'SELECT * FROM customers ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error listing customers:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<Customer | null> {
    try {
      const result = await this.query('SELECT * FROM customers WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding customer by ID:', error);
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<Customer | null> {
    try {
      const result = await this.query('SELECT * FROM customers WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding customer by email:', error);
      throw error;
    }
  }

  static async create(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    try {
      const id = uuidv4();
      const result = await this.query(`
        INSERT INTO customers (id, name, email, phone, business_name, business_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [id, customerData.name, customerData.email, customerData.phone, customerData.business_name, customerData.business_type]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  static async update(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id')
        .map((key, i) => `${key} = $${i + 2}`)
        .join(', ');

      const values = Object.entries(updates)
        .filter(([key]) => key !== 'id')
        .map(([, value]) => value);

      const result = await this.query(`
        UPDATE customers SET ${setClause}, updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [id, ...values]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await this.query('DELETE FROM customers WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  static async search(query: string, limit = 20): Promise<Customer[]> {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      const result = await this.query(`
        SELECT * FROM customers 
        WHERE LOWER(name) LIKE $1 
           OR LOWER(email) LIKE $1 
           OR LOWER(business_name) LIKE $1
        ORDER BY created_at DESC 
        LIMIT $2
      `, [searchTerm, limit]);
      
      return result.rows;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
}