import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'shipnorth-postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'admin' | 'staff' | 'customer' | 'driver';
  roles?: ('admin' | 'staff' | 'customer' | 'driver')[];
  lastUsedPortal?: 'admin' | 'staff' | 'customer' | 'driver';
  customerId?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  static async query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.query(
        'SELECT id, email, password_hash as password, first_name as "firstName", last_name as "lastName", role, created_at as "createdAt" FROM users WHERE email = $1',
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async validatePassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return null;
      }

      // For test environment, allow simple password comparison
      if (process.env.NODE_ENV === 'development' && user.password === password) {
        return user;
      }

      // For production, use bcrypt
      if (user.password && await bcrypt.compare(password, user.password)) {
        return user;
      }

      return null;
    } catch (error) {
      console.error('Error validating password:', error);
      throw error;
    }
  }

  static async create(userData: Partial<User>): Promise<User> {
    try {
      const id = userData.id || `user-${Date.now()}`;
      const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;

      const result = await this.query(
        `INSERT INTO users (id, email, password, first_name, last_name, role, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, email, first_name as "firstName", last_name as "lastName", role, status, created_at as "createdAt"`,
        [
          id,
          userData.email,
          hashedPassword,
          userData.firstName,
          userData.lastName,
          userData.role || 'customer',
          userData.status || 'active'
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const result = await this.query(
        'SELECT id, email, first_name as "firstName", last_name as "lastName", role, status, created_at as "createdAt" FROM users WHERE id = $1',
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async list(role?: string, limit?: number): Promise<User[]> {
    try {
      let query = 'SELECT id, email, first_name as "firstName", last_name as "lastName", phone, role, roles, last_used_portal as "lastUsedPortal", customer_id as "customerId", status, created_at as "createdAt", updated_at as "updatedAt" FROM users';
      const params: any[] = [];
      
      if (role && role !== 'all') {
        query += ' WHERE role = $1';
        params.push(role);
      }
      
      query += ' ORDER BY created_at DESC';
      
      if (limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }
      
      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  static async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      const setClause = Object.keys(updates)
        .filter(key => key !== 'id')
        .map((key, i) => `${key === 'firstName' ? 'first_name' : key === 'lastName' ? 'last_name' : key} = $${i + 2}`)
        .join(', ');

      const values = Object.entries(updates)
        .filter(([key]) => key !== 'id')
        .map(([, value]) => value);

      const result = await this.query(
        `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, email, first_name as "firstName", last_name as "lastName", role, status`,
        [id, ...values]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Legacy methods for backward compatibility with DynamoDB code
  static getAvailablePortals(user: User): string[] {
    const portals = [];
    if (user.role === 'admin' || user.role === 'staff') {
      portals.push('staff');
    }
    if (user.role === 'driver') {
      portals.push('driver');
    }
    if (user.role === 'customer') {
      portals.push('customer');
    }
    return portals;
  }

  static getDefaultPortal(user: User): string {
    if (user.role === 'admin') return 'staff';
    return user.role;
  }

  static hasAdminAccess(user: User): boolean {
    return user.role === 'admin';
  }

  static hasStaffAccess(user: User): boolean {
    return user.role === 'admin' || user.role === 'staff';
  }
}

export default User;