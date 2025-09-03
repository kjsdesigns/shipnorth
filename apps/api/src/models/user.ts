import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
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
  lastUsedPortal?: 'staff' | 'customer' | 'driver';
  defaultPortal?: 'staff' | 'customer' | 'driver';
  availablePortals: string[];
  customerId?: string;
  customer_id?: string; // Alias for database compatibility
  status: 'active' | 'inactive';
  lastLogin?: Date;
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
        `SELECT id, email, password_hash as password, first_name as "firstName", last_name as "lastName", 
                role, roles, last_used_portal as "lastUsedPortal", customer_id, status, created_at as "createdAt" 
         FROM users WHERE email = $1`,
        [email]
      );
      
      const user = result.rows[0];
      if (user) {
        // Ensure roles array is populated
        if (!user.roles && user.role) {
          user.roles = [user.role];
        }
        
        // Add computed fields
        user.availablePortals = this.getAvailablePortals(user);
        user.defaultPortal = user.lastUsedPortal || this.getDefaultPortal(user);
      }
      
      return user || null;
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
      const id = userData.id || uuidv4();
      const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;

      const result = await this.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, customer_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, email, first_name as "firstName", last_name as "lastName", phone, role, customer_id as "customerId", created_at as "createdAt"`,
        [
          id,
          userData.email,
          hashedPassword,
          userData.firstName,
          userData.lastName,
          userData.phone,
          userData.role || 'customer',
          userData.customerId
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
      const setFields = [];
      const values = [id];
      let paramIndex = 2;

      // Handle field mapping and build SET clause dynamically
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'id') continue;
        
        let dbField = key;
        let processedValue = value;
        
        if (key === 'firstName') dbField = 'first_name';
        else if (key === 'lastName') dbField = 'last_name';
        else if (key === 'lastUsedPortal') dbField = 'last_used_portal';
        else if (key === 'roles') {
          // Convert roles array to JSON string for database storage
          dbField = 'roles';
          processedValue = Array.isArray(value) ? JSON.stringify(value) : (value ? String(value) : '');
        }
        
        setFields.push(`${dbField} = $${paramIndex}`);
        values.push(processedValue as string);
        paramIndex++;
      }

      // Always update the updated_at timestamp
      setFields.push(`updated_at = NOW()`);

      const result = await this.query(`
        UPDATE users 
        SET ${setFields.join(', ')}
        WHERE id = $1 
        RETURNING id, email, first_name as "firstName", last_name as "lastName", phone, role, roles, last_used_portal as "lastUsedPortal", customer_id as "customerId", status, created_at as "createdAt", updated_at as "updatedAt"
      `, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Enhanced methods for multi-role ACL system
  static getAvailablePortals(user: User): string[] {
    const portals = [];
    const roles = user.roles || [user.role];
    
    if (roles.includes('customer')) {
      portals.push('customer');
    }
    if (roles.includes('driver')) {
      portals.push('driver');
    }
    if (roles.includes('staff') || roles.includes('admin')) {
      portals.push('staff');
    }
    
    return portals;
  }

  static getDefaultPortal(user: User): string {
    const roles = user.roles || [user.role];
    
    // Admin and staff default to staff portal
    if (roles.includes('admin') || roles.includes('staff')) {
      return 'staff';
    }
    
    // Driver defaults to driver portal
    if (roles.includes('driver')) {
      return 'driver';
    }
    
    // Customer defaults to customer portal
    return 'customer';
  }

  static hasAdminAccess(user: User): boolean {
    const roles = user.roles || [user.role];
    return roles.includes('admin');
  }

  static hasStaffAccess(user: User): boolean {
    const roles = user.roles || [user.role];
    return roles.includes('admin') || roles.includes('staff');
  }

  static hasDriverAccess(user: User): boolean {
    const roles = user.roles || [user.role];
    return roles.includes('driver');
  }

  static hasCustomerAccess(user: User): boolean {
    const roles = user.roles || [user.role];
    return roles.includes('customer');
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await this.query('DELETE FROM users WHERE id = $1', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async changePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const result = await this.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, id]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  static canAccessPortal(user: any, portal: string): boolean {
    if (!user) return false;
    
    // Check roles array first, then fallback to role
    const userRoles = user.roles || [user.role];
    
    switch (portal) {
      case 'staff':
        return userRoles.includes('staff') || userRoles.includes('admin');
      case 'driver':
        return userRoles.includes('driver');
      case 'customer':
        return userRoles.includes('customer');
      case 'admin':
        return userRoles.includes('admin');
      default:
        return false;
    }
  }

  static async updateLastUsedPortal(id: string, portal: string): Promise<boolean> {
    try {
      const result = await this.query(
        'UPDATE users SET last_used_portal = $1, updated_at = NOW() WHERE id = $2',
        [portal, id]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error updating last used portal:', error);
      throw error;
    }
  }
}

export const UserModel = User;
export default User;