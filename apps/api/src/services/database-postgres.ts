import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'shipnorth-postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function to generate IDs
export const generateId = () => uuidv4();

// Base PostgreSQL database operations
export class DatabaseService {
  static async query(text: string, params: any[] = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async put(tableName: string, item: any) {
    const keys = Object.keys(item);
    const values = Object.values(item);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET
      ${keys.map((key, i) => `${key} = $${i + 1}`).join(', ')}
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    return { Item: result.rows[0] };
  }

  static async get(tableName: string, key: any) {
    const whereClause = Object.keys(key).map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const query = `SELECT * FROM ${tableName} WHERE ${whereClause} LIMIT 1`;
    
    const result = await this.query(query, Object.values(key));
    return { Item: result.rows[0] || null };
  }

  static async scan(tableName: string, options: any = {}) {
    let query = `SELECT * FROM ${tableName}`;
    const params: any[] = [];
    
    if (options.FilterExpression) {
      // Basic filter support - would need more sophisticated parsing for complex filters
      query += ` WHERE ${options.FilterExpression}`;
    }
    
    if (options.Limit) {
      query += ` LIMIT ${options.Limit}`;
    }
    
    const result = await this.query(query, params);
    return { Items: result.rows };
  }

  static async update(tableName: string, key: any, updateExpression: string, values: any) {
    // Parse update expression and convert to SQL UPDATE
    const setClause = Object.keys(values).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const whereClause = Object.keys(key).map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;
    
    const params = [...Object.values(key), ...Object.values(values)];
    const result = await this.query(query, params);
    return { Attributes: result.rows[0] };
  }

  static async delete(tableName: string, key: any) {
    const whereClause = Object.keys(key).map((k, i) => `${k} = $${i + 1}`).join(' AND ');
    const query = `DELETE FROM ${tableName} WHERE ${whereClause} RETURNING *`;
    
    const result = await this.query(query, Object.values(key));
    return { Attributes: result.rows[0] };
  }

  // Initialize database tables
  static async initializeTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'customer',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        first_name VARCHAR(255),
        last_name VARCHAR(255), 
        email VARCHAR(255),
        phone VARCHAR(255),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(255),
        province VARCHAR(10),
        postal_code VARCHAR(20),
        country VARCHAR(10) DEFAULT 'CA',
        stripe_customer_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS packages (
        id VARCHAR(255) PRIMARY KEY,
        tracking_number VARCHAR(255) UNIQUE,
        barcode VARCHAR(255),
        customer_id VARCHAR(255) REFERENCES customers(id),
        load_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'ready',
        shipment_status VARCHAR(50) DEFAULT 'pending',
        weight DECIMAL(10,2),
        length DECIMAL(10,2),
        width DECIMAL(10,2),
        height DECIMAL(10,2),
        ship_to_name VARCHAR(255),
        ship_to_address TEXT,
        ship_to_city VARCHAR(255),
        ship_to_province VARCHAR(10),
        ship_to_postal_code VARCHAR(20),
        ship_to_country VARCHAR(10) DEFAULT 'CA',
        expected_delivery_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS loads (
        id VARCHAR(255) PRIMARY KEY,
        driver_id VARCHAR(255),
        driver_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'planning',
        pickup_address TEXT,
        delivery_address TEXT,
        estimated_delivery DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255) REFERENCES customers(id),
        invoice_number VARCHAR(255) UNIQUE,
        amount INTEGER, -- in cents
        status VARCHAR(50) DEFAULT 'pending',
        stripe_payment_intent_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      try {
        await this.query(tableSQL);
        console.log('✅ Table initialized:', tableSQL.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]);
      } catch (error) {
        console.error('❌ Table creation failed:', error);
        throw error;
      }
    }

    // Insert test users if they don't exist
    await this.insertTestUsers();
  }

  static async insertTestUsers() {
    const testUsers = [
      {
        id: 'user-admin-1',
        email: 'admin@shipnorth.com',
        password_hash: '$2b$10$xyz123', // In real app, hash 'admin123'
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      },
      {
        id: 'user-staff-1', 
        email: 'staff@shipnorth.com',
        password_hash: '$2b$10$xyz123', // In real app, hash 'staff123'
        first_name: 'Staff',
        last_name: 'User',
        role: 'staff'
      },
      {
        id: 'user-customer-1',
        email: 'test@test.com',
        password_hash: '$2b$10$xyz123', // In real app, hash 'test123'
        first_name: 'John',
        last_name: 'Doe',
        role: 'customer'
      },
      {
        id: 'user-driver-1',
        email: 'driver@shipnorth.com',
        password_hash: '$2b$10$xyz123', // In real app, hash 'driver123'
        first_name: 'Driver',
        last_name: 'User',
        role: 'driver'
      }
    ];

    for (const user of testUsers) {
      try {
        await this.query(
          'INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
          [user.id, user.email, user.password_hash, user.first_name, user.last_name, user.role]
        );
      } catch (error) {
        // Ignore duplicate key errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('duplicate key')) {
          console.error('❌ Test user creation failed:', error);
        }
      }
    }

    console.log('✅ Test users initialized');
  }
}

export default DatabaseService;
export { pool };