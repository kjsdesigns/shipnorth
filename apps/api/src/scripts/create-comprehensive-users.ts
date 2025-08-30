#!/usr/bin/env tsx

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

async function createComprehensiveUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating comprehensive user test data...');
    
    // Begin transaction
    await client.query('BEGIN');

    // Update existing users or insert new ones (don't delete due to foreign key constraints)
    console.log('🔄 Updating/inserting user records...');

    // Comprehensive user scenarios covering all business rules
    const testUsers = [
      // 1. Super Admin - Full system access
      {
        email: 'admin@shipnorth.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+1-416-555-0001',
        role: 'admin',
        roles: ['admin', 'staff'], // Admin inherits staff access
        lastUsedPortal: 'staff',
      },

      // 2. Staff Manager - Staff operations only
      {
        email: 'staff@shipnorth.com', 
        password: 'staff123',
        firstName: 'Staff',
        lastName: 'Manager',
        phone: '+1-416-555-0002',
        role: 'staff',
        roles: ['staff'],
        lastUsedPortal: 'staff',
      },

      // 3. Pure Driver - Delivery operations only
      {
        email: 'driver@shipnorth.com',
        password: 'driver123', 
        firstName: 'Road',
        lastName: 'Driver',
        phone: '+1-416-555-0003',
        role: 'driver',
        roles: ['driver'],
        lastUsedPortal: 'driver',
      },

      // 4. Test Customer - Portal access
      {
        email: 'customer@test.com',
        password: 'customer123',
        firstName: 'Test',
        lastName: 'Customer', 
        phone: '+1-416-555-0004',
        role: 'customer',
        roles: ['customer'],
        lastUsedPortal: 'customer',
      },

      // 5. Multi-role: Shift Manager (Staff + Driver)
      {
        email: 'shift.manager@shipnorth.com',
        password: 'shift123',
        firstName: 'Alex',
        lastName: 'Wilson',
        phone: '+1-416-555-0005',
        role: 'staff', // Primary role
        roles: ['staff', 'driver'], // Can handle both duties
        lastUsedPortal: 'staff',
      },

      // 6. Multi-role: Operations Director (Admin + Driver)
      {
        email: 'ops.director@shipnorth.com',
        password: 'ops123',
        firstName: 'Jordan',
        lastName: 'Chen',
        phone: '+1-416-555-0006',
        role: 'admin', // Primary role
        roles: ['admin', 'staff', 'driver'], // Full access
        lastUsedPortal: 'staff',
      },

      // 7. Customer Service Rep - Staff only
      {
        email: 'support@shipnorth.com',
        password: 'support123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+1-416-555-0007',
        role: 'staff',
        roles: ['staff'],
        lastUsedPortal: 'staff',
      },

      // 8. Contract Driver - Driver only
      {
        email: 'contract.driver@shipnorth.com',
        password: 'contract123',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        phone: '+1-416-555-0008',
        role: 'driver',
        roles: ['driver'],
        lastUsedPortal: 'driver',
      },

      // 9. Inactive Staff - Test deactivated user
      {
        email: 'inactive.staff@shipnorth.com',
        password: 'inactive123',
        firstName: 'Former',
        lastName: 'Employee',
        phone: '+1-416-555-0009',
        role: 'staff',
        roles: ['staff'],
        lastUsedPortal: 'staff',
      },

      // 10. Premium Customer - Test customer with account
      {
        email: 'premium.customer@example.com',
        password: 'premium123',
        firstName: 'Business',
        lastName: 'Owner',
        phone: '+1-416-555-0010',
        role: 'customer',
        roles: ['customer'],
        lastUsedPortal: 'customer',
      },

      // 11. Temporary Driver - Active driver
      {
        email: 'temp.driver@shipnorth.com',
        password: 'temp123',
        firstName: 'Lisa',
        lastName: 'Thompson',
        phone: '+1-416-555-0011',
        role: 'driver',
        roles: ['driver'],
        lastUsedPortal: 'driver',
      },

      // 12. Admin Trainee - Limited admin
      {
        email: 'trainee.admin@shipnorth.com',
        password: 'trainee123',
        firstName: 'Admin',
        lastName: 'Trainee',
        phone: '+1-416-555-0012',
        role: 'admin',
        roles: ['admin', 'staff'],
        lastUsedPortal: 'staff', 
      }
    ];

    console.log('👥 Creating users with proper password hashing...');
    
    for (const userData of testUsers) {
      // Hash password with bcrypt (industry standard)
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      try {
        await client.query(`
          INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, roles, last_used_portal)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (email) DO UPDATE SET
            password_hash = $3,
            first_name = $4,
            last_name = $5,
            phone = $6,
            role = $7,
            roles = $8,
            last_used_portal = $9,
            updated_at = NOW()
        `, [
          uuidv4(),
          userData.email,
          hashedPassword,
          userData.firstName,
          userData.lastName,
          userData.phone,
          userData.role,
          userData.roles,
          userData.lastUsedPortal
        ]);
        
        console.log(`✅ Created/Updated: ${userData.email} [${userData.roles.join(', ')}]`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error);
      }
    }

    // Link customers to their user accounts
    console.log('🔗 Linking customer user accounts...');
    
    // Update customer users with customer_id references
    const customerUsers = testUsers.filter(u => u.roles.includes('customer'));
    
    for (const customerUser of customerUsers) {
      // Find matching customer record by email
      const customerResult = await client.query(
        'SELECT id FROM customers WHERE email = $1',
        [customerUser.email]
      );
      
      if (customerResult.rows.length > 0) {
        const customerId = customerResult.rows[0].id;
        
        await client.query(
          'UPDATE users SET customer_id = $1 WHERE email = $2',
          [customerId, customerUser.email]
        );
        
        console.log(`🔗 Linked ${customerUser.email} to customer record`);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Comprehensive user creation complete!');
    console.log('📊 User Summary:');
    
    // Show summary by role
    const roleCounts = testUsers.reduce((acc, user) => {
      user.roles.forEach(role => {
        acc[role] = (acc[role] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });
    
    console.log(`   Total: ${testUsers.length} users`);
    console.log(`   Multi-role: ${testUsers.filter(u => u.roles.length > 1).length}`);
    
    console.log('\n🔐 Test Credentials:');
    testUsers.forEach(user => {
      console.log(`   ${user.email} / ${user.password} [${user.roles.join(', ')}]`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating comprehensive users:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    await createComprehensiveUsers();
    console.log('🎉 User creation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { createComprehensiveUsers };