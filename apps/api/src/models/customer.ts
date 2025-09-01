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
  firstName?: string; // Parsed from name field
  lastName?: string;  // Parsed from name field
  email?: string;
  phone?: string;
  accountType?: 'personal' | 'business';
  business_name?: string;
  business_type?: string;
  primaryContactName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
  
  // Payment-related properties
  paymentMethod?: {
    last4?: string;
    brand?: string;
    expiryMonth?: string;
    expiryYear?: string;
    type?: string;
    token?: string;
  } | string;
  paypalCustomerId?: string;
  paypalPaymentTokenId?: string;
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
        'SELECT *, address_line1 as "addressLine1", address_line2 as "addressLine2", postal_code as "postalCode" FROM customers ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows.map(customer => this.addParsedNames(customer));
    } catch (error) {
      console.error('Error listing customers:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<Customer | null> {
    try {
      const result = await this.query('SELECT *, address_line1 as "addressLine1", address_line2 as "addressLine2", postal_code as "postalCode" FROM customers WHERE id = $1', [id]);
      const customer = result.rows[0] || null;
      return customer ? this.addParsedNames(customer) : null;
    } catch (error) {
      console.error('Error finding customer by ID:', error);
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<Customer | null> {
    try {
      const result = await this.query('SELECT *, address_line1 as "addressLine1", address_line2 as "addressLine2", postal_code as "postalCode" FROM customers WHERE email = $1', [email]);
      const customer = result.rows[0] || null;
      return customer ? this.addParsedNames(customer) : null;
    } catch (error) {
      console.error('Error finding customer by email:', error);
      throw error;
    }
  }

  static async create(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    try {
      const id = uuidv4();
      
      // Combine firstName and lastName into name field if provided separately
      const name = customerData.name || (customerData.firstName && customerData.lastName 
        ? `${customerData.firstName} ${customerData.lastName}` 
        : customerData.firstName || customerData.lastName || '');
      
      const result = await this.query(`
        INSERT INTO customers (id, name, email, phone, business_name, business_type, 
                             address_line1, address_line2, city, province, postal_code, country, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *, address_line1 as "addressLine1", address_line2 as "addressLine2", postal_code as "postalCode"
      `, [id, name, customerData.email, customerData.phone, customerData.business_name, customerData.business_type,
          customerData.addressLine1, customerData.addressLine2, customerData.city, customerData.province, 
          customerData.postalCode, customerData.country || 'CA', customerData.status || 'active']);
      
      return this.addParsedNames(result.rows[0]);
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
      return result.rowCount !== null && result.rowCount > 0;
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
      
      return result.rows.map(customer => this.addParsedNames(customer));
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Get packages for a customer
   */
  static async getPackages(customerId: string): Promise<any[]> {
    try {
      const result = await this.query(
        'SELECT * FROM packages WHERE customer_id = $1 ORDER BY created_at DESC',
        [customerId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting customer packages:', error);
      throw error;
    }
  }

  /**
   * Parse full name into firstName and lastName for frontend compatibility
   */
  static async getInvoices(customerId: string): Promise<any[]> {
    try {
      // For now, return empty array as invoices table might not exist yet
      // This can be implemented when invoice functionality is added
      return [];
    } catch (error) {
      console.error('Error getting customer invoices:', error);
      return [];
    }
  }

  private static addParsedNames(customer: any): Customer {
    if (customer.name) {
      const nameParts = customer.name.trim().split(' ');
      customer.firstName = nameParts[0] || '';
      customer.lastName = nameParts.slice(1).join(' ') || '';
    }
    return customer;
  }

  // Additional method for compatibility
  static async get(id: string): Promise<Customer | null> {
    return this.findById(id);
  }
}