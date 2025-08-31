#!/usr/bin/env tsx

import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

// Realistic Canadian addresses for each customer
const customerAddressUpdates = [
  {
    email: 'david.harris@techsolutionsinc.com',
    billingAddress: {
      address_line1: '2500 University Drive NW',
      city: 'Calgary',
      province_state: 'AB',
      postal_code: 'T2N 1N4'
    },
    shippingAddress: {
      address_line1: '1500 Tech Park Way',
      city: 'Calgary', 
      province_state: 'AB',
      postal_code: 'T2P 3T5'
    }
  },
  {
    email: 'jennifer.taylor@mapleleafmanufacturing.com',
    billingAddress: {
      address_line1: '3875 Rue Saint-Denis',
      city: 'Montreal',
      province_state: 'QC',
      postal_code: 'H2W 2M4'
    },
    shippingAddress: {
      address_line1: '6500 Boulevard Henri-Bourassa',
      city: 'Montreal',
      province_state: 'QC',
      postal_code: 'H1G 5X3'
    }
  },
  {
    email: 'john.miller@northernlightstrading.com',
    billingAddress: {
      address_line1: '100 Sparks Street',
      city: 'Ottawa',
      province_state: 'ON',
      postal_code: 'K1P 5B7'
    },
    shippingAddress: {
      address_line1: '2204 Walkley Road',
      city: 'Ottawa',
      province_state: 'ON', 
      postal_code: 'K1G 6A9'
    }
  },
  {
    email: 'amanda.smith@coastalimportco.com',
    billingAddress: {
      address_line1: '1959 Upper Water Street',
      city: 'Halifax',
      province_state: 'NS',
      postal_code: 'B3J 3N2'
    },
    shippingAddress: {
      address_line1: '7001 Mumford Road',
      city: 'Halifax',
      province_state: 'NS',
      postal_code: 'B3L 2H8'
    }
  },
  {
    email: 'michael.thomas@prairielogisticsltd.com',
    billingAddress: {
      address_line1: '201 Portage Avenue',
      city: 'Winnipeg',
      province_state: 'MB',
      postal_code: 'R3C 3X2'
    },
    shippingAddress: {
      address_line1: '1555 Regent Avenue West',
      city: 'Winnipeg',
      province_state: 'MB',
      postal_code: 'R2C 3B2'
    }
  },
  {
    email: 'william.martin@mountainviewenterprises.com',
    billingAddress: {
      address_line1: '4567 Kingsway',
      city: 'Vancouver',
      province_state: 'BC',
      postal_code: 'V5H 2A1'
    },
    shippingAddress: {
      address_line1: '8788 McKim Way',
      city: 'Richmond',
      province_state: 'BC',
      postal_code: 'V6X 4E1'
    }
  },
  {
    email: 'emily.white@greatlakesdistribution.com',
    billingAddress: {
      address_line1: '259 King Street West',
      city: 'Toronto',
      province_state: 'ON',
      postal_code: 'M5V 1J5'
    },
    shippingAddress: {
      address_line1: '6301 Silver Drive',
      city: 'Mississauga',
      province_state: 'ON',
      postal_code: 'L5T 1B4'
    }
  },
  {
    email: 'sarah.thompson@atlanticsupplychain.com',
    billingAddress: {
      address_line1: '5251 Duke Street',
      city: 'Halifax',
      province_state: 'NS',
      postal_code: 'B3J 1P3'
    },
    shippingAddress: {
      address_line1: '1800 Argyle Street',
      city: 'Halifax',
      province_state: 'NS',
      postal_code: 'B3J 3N8'
    }
  }
];

async function updateCustomerAddresses() {
  const client = await pool.connect();
  
  try {
    console.log('🏠 Updating customer addresses with realistic Canadian locations...');
    
    await client.query('BEGIN');

    for (const customerUpdate of customerAddressUpdates) {
      // Get customer ID
      const customerResult = await client.query(
        'SELECT id FROM customers WHERE email = $1',
        [customerUpdate.email]
      );
      
      if (customerResult.rows.length === 0) {
        console.log(`⚠️  Customer not found: ${customerUpdate.email}`);
        continue;
      }
      
      const customerId = customerResult.rows[0].id;
      
      // Update billing address
      await client.query(`
        UPDATE addresses 
        SET address_line1 = $1, city = $2, province_state = $3, postal_code = $4
        WHERE customer_id = $5 AND type = 'billing'
      `, [
        customerUpdate.billingAddress.address_line1,
        customerUpdate.billingAddress.city,
        customerUpdate.billingAddress.province_state,
        customerUpdate.billingAddress.postal_code,
        customerId
      ]);
      
      // Update shipping address
      await client.query(`
        UPDATE addresses 
        SET address_line1 = $1, city = $2, province_state = $3, postal_code = $4
        WHERE customer_id = $5 AND type = 'shipping'
      `, [
        customerUpdate.shippingAddress.address_line1,
        customerUpdate.shippingAddress.city,
        customerUpdate.shippingAddress.province_state,
        customerUpdate.shippingAddress.postal_code,
        customerId
      ]);
      
      console.log(`✅ Updated addresses for ${customerUpdate.email}`);
    }

    await client.query('COMMIT');
    console.log('✅ All customer addresses updated successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating customer addresses:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function assignPackagesToCustomers() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Assigning packages to customers with distribution: 3, 2, 1, 0 packages...');
    
    await client.query('BEGIN');

    // Get all customers and packages
    const customersResult = await client.query(
      'SELECT id, email FROM customers ORDER BY created_at'
    );
    const packagesResult = await client.query(
      'SELECT id FROM packages ORDER BY created_at'
    );
    
    const customers = customersResult.rows;
    const packages = packagesResult.rows;
    
    if (packages.length < 6) {
      console.log('⚠️  Not enough packages for distribution. Need at least 6 packages.');
      return;
    }

    // Package distribution plan: 3, 2, 1, 0, 0, 0, 0, 0, 0
    const packageDistribution = [3, 2, 1, 0, 0, 0, 0, 0, 0];
    let packageIndex = 0;

    for (let i = 0; i < customers.length && i < packageDistribution.length; i++) {
      const customer = customers[i];
      const packageCount = packageDistribution[i];
      
      console.log(`👤 ${customer.email}: assigning ${packageCount} packages`);
      
      for (let j = 0; j < packageCount && packageIndex < packages.length; j++) {
        const packageId = packages[packageIndex].id;
        
        await client.query(
          'UPDATE packages SET customer_id = $1 WHERE id = $2',
          [customer.id, packageId]
        );
        
        console.log(`  📦 Assigned package ${packageId.slice(-8)} to ${customer.email}`);
        packageIndex++;
      }
    }

    await client.query('COMMIT');
    
    // Show final distribution
    console.log('\n📊 Final Package Distribution:');
    for (const customer of customers) {
      const packageCountResult = await client.query(
        'SELECT COUNT(*) as count FROM packages WHERE customer_id = $1',
        [customer.id]
      );
      const count = packageCountResult.rows[0].count;
      console.log(`   ${customer.email}: ${count} packages`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error assigning packages:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await updateCustomerAddresses();
    await assignPackagesToCustomers();
    console.log('🎉 Customer data update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { updateCustomerAddresses, assignPackagesToCustomers };