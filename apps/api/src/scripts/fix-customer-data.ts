#!/usr/bin/env node

import { Pool } from 'pg';
import { CustomerModel } from '../models/customer';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

// Real Canadian addresses for testing
const canadianAddresses = [
  {
    addressLine1: '123 Queen Street West',
    addressLine2: 'Suite 1001',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5H 2M9',
    country: 'CA'
  },
  {
    addressLine1: '456 Granville Street',
    addressLine2: '',
    city: 'Vancouver',
    province: 'BC',
    postalCode: 'V6C 1V5',
    country: 'CA'
  },
  {
    addressLine1: '789 St-Catherine Street',
    addressLine2: 'Apt 305',
    city: 'Montreal',
    province: 'QC',
    postalCode: 'H3B 1A7',
    country: 'CA'
  },
  {
    addressLine1: '321 8th Avenue SW',
    addressLine2: '',
    city: 'Calgary',
    province: 'AB',
    postalCode: 'T2P 2Z5',
    country: 'CA'
  },
  {
    addressLine1: '654 Broadway Avenue',
    addressLine2: 'Unit 12',
    city: 'Winnipeg',
    province: 'MB',
    postalCode: 'R3C 0V8',
    country: 'CA'
  },
  {
    addressLine1: '987 Spring Garden Road',
    addressLine2: '',
    city: 'Halifax',
    province: 'NS',
    postalCode: 'B3H 3C3',
    country: 'CA'
  },
  {
    addressLine1: '159 University Avenue',
    addressLine2: 'Floor 5',
    city: 'Ottawa',
    province: 'ON',
    postalCode: 'K1N 6N8',
    country: 'CA'
  },
  {
    addressLine1: '753 Main Street',
    addressLine2: '',
    city: 'Saskatoon',
    province: 'SK',
    postalCode: 'S7N 0W6',
    country: 'CA'
  },
  {
    addressLine1: '852 Water Street',
    addressLine2: 'Building B',
    city: 'St. John\'s',
    province: 'NL',
    postalCode: 'A1C 6N3',
    country: 'CA'
  },
  {
    addressLine1: '147 Kent Street',
    addressLine2: '',
    city: 'Charlottetown',
    province: 'PE',
    postalCode: 'C1A 1N3',
    country: 'CA'
  }
];

async function fixCustomerData() {
  console.log('🔧 Starting customer data fix...');
  
  try {
    // First, check if address columns exist in the customers table
    const tableInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name IN ('address_line1', 'address_line2', 'city', 'province', 'postal_code', 'country', 'status')
    `);
    
    const existingColumns = tableInfo.rows.map(row => row.column_name);
    console.log('📋 Existing address columns:', existingColumns);
    
    // Add missing address columns if they don't exist
    const requiredColumns = [
      { name: 'address_line1', type: 'VARCHAR(255)' },
      { name: 'address_line2', type: 'VARCHAR(255)' },
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'province', type: 'VARCHAR(50)' },
      { name: 'postal_code', type: 'VARCHAR(20)' },
      { name: 'country', type: 'VARCHAR(10) DEFAULT \'CA\'' },
      { name: 'status', type: 'VARCHAR(50) DEFAULT \'active\'' }
    ];
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        await pool.query(`ALTER TABLE customers ADD COLUMN ${column.name} ${column.type}`);
      }
    }
    
    // Get all customers
    const customersResult = await pool.query('SELECT * FROM customers ORDER BY created_at');
    const customers = customersResult.rows;
    console.log(`📊 Found ${customers.length} customers to update`);
    
    // Update each customer with address data
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const address = canadianAddresses[i % canadianAddresses.length];
      
      console.log(`🏠 Updating customer ${customer.name || customer.id} with ${address.city}, ${address.province} address`);
      
      await pool.query(`
        UPDATE customers 
        SET address_line1 = $1, 
            address_line2 = $2, 
            city = $3, 
            province = $4, 
            postal_code = $5, 
            country = $6,
            status = COALESCE(status, 'active'),
            updated_at = NOW()
        WHERE id = $7
      `, [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.province,
        address.postalCode,
        address.country,
        customer.id
      ]);
    }
    
    console.log('✅ Customer addresses updated successfully');
    
    // Now fix packages to be linked to customers
    console.log('🔧 Fixing package-customer relationships...');
    
    const packagesResult = await pool.query('SELECT * FROM packages ORDER BY created_at');
    const packages = packagesResult.rows;
    console.log(`📦 Found ${packages.length} packages to link to customers`);
    
    // Link each package to a customer (round-robin)
    for (let i = 0; i < packages.length; i++) {
      const packageItem = packages[i];
      const customer = customers[i % customers.length];
      
      console.log(`🔗 Linking package ${packageItem.tracking_number || packageItem.id} to customer ${customer.name}`);
      
      await pool.query(`
        UPDATE packages 
        SET customer_id = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [customer.id, packageItem.id]);
    }
    
    // Update packages to use customer addresses as shipping addresses
    console.log('📍 Updating package shipping addresses from customer addresses...');
    
    const packagesWithCustomers = await pool.query(`
      SELECT p.*, c.name as customer_name, c.address_line1, c.address_line2, 
             c.city, c.province, c.postal_code, c.country
      FROM packages p
      JOIN customers c ON p.customer_id = c.id
    `);
    
    for (const pkg of packagesWithCustomers.rows) {
      console.log(`📮 Setting delivery address for package ${pkg.tracking_number || pkg.id} to ${pkg.city}, ${pkg.province}`);
      
      // Update the ship_to JSON field with customer address
      const shipTo = {
        name: pkg.customer_name,
        address1: pkg.address_line1,
        address2: pkg.address_line2 || '',
        city: pkg.city,
        province: pkg.province,
        postalCode: pkg.postal_code,
        country: pkg.country
      };
      
      await pool.query(`
        UPDATE packages 
        SET ship_to = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(shipTo), pkg.id]);
    }
    
    console.log('🎉 All data fixes completed successfully!');
    
    // Show final summary
    const updatedCustomers = await pool.query('SELECT COUNT(*) as count FROM customers WHERE address_line1 IS NOT NULL');
    const linkedPackages = await pool.query('SELECT COUNT(*) as count FROM packages WHERE customer_id IS NOT NULL');
    const packagesWithAddresses = await pool.query('SELECT COUNT(*) as count FROM packages WHERE ship_to IS NOT NULL');
    
    console.log('\n📈 Final Summary:');
    console.log(`  ✅ Customers with addresses: ${updatedCustomers.rows[0].count}`);
    console.log(`  ✅ Packages linked to customers: ${linkedPackages.rows[0].count}`);  
    console.log(`  ✅ Packages with shipping addresses: ${packagesWithAddresses.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error fixing customer data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  fixCustomerData()
    .then(() => {
      console.log('🎯 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { fixCustomerData };