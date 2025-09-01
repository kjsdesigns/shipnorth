#!/usr/bin/env node

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

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

async function fixCustomerDataV2() {
  console.log('🔧 Starting customer data fix v2...');
  
  try {
    // Step 1: Create addresses for all customers and update customer table
    console.log('🏠 Creating addresses for customers...');
    
    const customersResult = await pool.query('SELECT * FROM customers ORDER BY created_at');
    const customers = customersResult.rows;
    console.log(`📊 Found ${customers.length} customers to process`);
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const address = canadianAddresses[i % canadianAddresses.length];
      
      console.log(`🏠 Processing customer ${customer.name} (${customer.id.slice(0,8)}...)`);
      
      // Create an address record for this customer
      const addressId = uuidv4();
      
      await pool.query(`
        INSERT INTO addresses (id, customer_id, type, address_line1, address_line2, city, province_state, postal_code, country, is_default, created_at)
        VALUES ($1, $2, 'shipping', $3, $4, $5, $6, $7, $8, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [
        addressId,
        customer.id,
        address.addressLine1,
        address.addressLine2 || null,
        address.city,
        address.province,
        address.postalCode,
        address.country,
      ]);
      
      // Also update the customer table with the same address for easy querying
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
      
      console.log(`  ✅ Created address: ${address.city}, ${address.province}`);
    }
    
    // Step 2: Ensure all packages are linked to customers
    console.log('🔗 Linking packages to customers...');
    
    const packagesResult = await pool.query('SELECT * FROM packages WHERE customer_id IS NULL ORDER BY created_at');
    const unlinkedPackages = packagesResult.rows;
    
    if (unlinkedPackages.length > 0) {
      console.log(`📦 Found ${unlinkedPackages.length} unlinked packages`);
      
      for (let i = 0; i < unlinkedPackages.length; i++) {
        const packageItem = unlinkedPackages[i];
        const customer = customers[i % customers.length];
        
        console.log(`🔗 Linking package ${packageItem.tracking_number || packageItem.id.slice(0,8)} to ${customer.name}`);
        
        await pool.query(`
          UPDATE packages 
          SET customer_id = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [customer.id, packageItem.id]);
      }
    } else {
      console.log(`✅ All packages already linked to customers`);
    }
    
    // Step 3: Link packages to shipping addresses
    console.log('📮 Setting package shipping addresses...');
    
    const packagesWithoutAddresses = await pool.query(`
      SELECT p.*, c.name as customer_name
      FROM packages p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.ship_to_address_id IS NULL
    `);
    
    console.log(`📍 Found ${packagesWithoutAddresses.rows.length} packages needing shipping addresses`);
    
    for (const pkg of packagesWithoutAddresses.rows) {
      // Find the default address for this customer
      const addressResult = await pool.query(`
        SELECT id FROM addresses 
        WHERE customer_id = $1 AND is_default = true 
        LIMIT 1
      `, [pkg.customer_id]);
      
      if (addressResult.rows.length > 0) {
        const addressId = addressResult.rows[0].id;
        
        console.log(`📮 Setting address for package ${pkg.tracking_number || pkg.id.slice(0,8)} to customer ${pkg.customer_name}'s default address`);
        
        await pool.query(`
          UPDATE packages 
          SET ship_to_address_id = $1,
              updated_at = NOW()
          WHERE id = $2
        `, [addressId, pkg.id]);
      }
    }
    
    console.log('🎉 All data fixes completed successfully!');
    
    // Show final summary
    const customersWithAddresses = await pool.query('SELECT COUNT(*) as count FROM customers WHERE city IS NOT NULL');
    const linkedPackages = await pool.query('SELECT COUNT(*) as count FROM packages WHERE customer_id IS NOT NULL');
    const packagesWithAddresses = await pool.query('SELECT COUNT(*) as count FROM packages WHERE ship_to_address_id IS NOT NULL');
    const totalAddresses = await pool.query('SELECT COUNT(*) as count FROM addresses');
    
    console.log('\\n📈 Final Summary:');
    console.log(`  ✅ Customers with addresses: ${customersWithAddresses.rows[0].count}`);
    console.log(`  ✅ Total address records: ${totalAddresses.rows[0].count}`);
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
  fixCustomerDataV2()
    .then(() => {
      console.log('🎯 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { fixCustomerDataV2 };