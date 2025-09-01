import { UserModel } from './models/user';
import { CustomerModel } from './models/customer';
import { DatabaseService } from './services/database';
import bcrypt from 'bcryptjs';

const forceResetUsers = async () => {
  console.log('🔥 Force resetting all demo users...\n');

  try {
    // Delete ALL users first
    const allUsers = await UserModel.list();
    console.log(`Found ${allUsers.length} users. Deleting all demo users...\n`);

    const demoEmails = [
      'admin@shipnorth.com',
      'staff@shipnorth.com',
      'driver@shipnorth.com',
      'john.doe@example.com',
    ];

    for (const user of allUsers) {
      if (demoEmails.includes(user.email)) {
        await UserModel.delete(user.id);
        console.log(`🗑️  Deleted: ${user.email} (ID: ${user.id})`);
      }
    }

    console.log('\n🌱 Creating fresh demo users...\n');

    // Now create fresh users with properly hashed passwords
    const freshUsers = [
      {
        email: 'admin@shipnorth.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as const,
        status: 'active' as const,
      },
      {
        email: 'staff@shipnorth.com',
        password: 'staff123',
        firstName: 'Sarah',
        lastName: 'Staff',
        role: 'staff' as const,
        status: 'active' as const,
      },
      {
        email: 'driver@shipnorth.com',
        password: 'driver123',
        firstName: 'Bob',
        lastName: 'Driver',
        role: 'driver' as const,
        status: 'active' as const,
      },
      {
        email: 'john.doe@example.com',
        password: 'customer123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '416-555-0123',
        role: 'customer' as const,
        status: 'active' as const,
      },
    ];

    for (const userData of freshUsers) {
      // Create the user through UserModel.create which will hash the password
      const user = await UserModel.create(userData);
      console.log(`✅ Created ${userData.role}: ${userData.email}`);

      // Immediately test the password
      const testResult = await UserModel.validatePassword(userData.email, userData.password);
      if (testResult) {
        console.log(`   ✅ Password validation successful`);
      } else {
        console.log(`   ❌ Password validation FAILED - investigating...`);

        // Debug the issue
        const createdUser = await UserModel.findByEmail(userData.email);
        if (createdUser) {
          const directTest = createdUser.password ? await bcrypt.compare(userData.password, createdUser.password) : false;
          console.log(`   Direct bcrypt test: ${directTest ? 'PASS' : 'FAIL'}`);
          console.log(`   Expected password: ${userData.password}`);
          console.log(`   Stored hash: ${createdUser.password}`);
        }
      }
    }

    // Create customer record for John Doe
    const existing = await CustomerModel.findByEmail('john.doe@example.com');
    if (!existing) {
      await CustomerModel.create({
        name: 'John Doe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '416-555-0123',
        addressLine1: '123 Main St',
        city: 'Toronto',
        province: 'ON' as const,
        postalCode: 'M5V 2T6',
        country: 'Canada',
        status: 'active' as const,
      });
      console.log(`\n✅ Created customer record: john.doe@example.com`);
    }

    console.log('\n🔐 Final authentication test...\n');
    const testUsers = [
      { email: 'admin@shipnorth.com', password: 'admin123' },
      { email: 'staff@shipnorth.com', password: 'staff123' },
      { email: 'driver@shipnorth.com', password: 'driver123' },
      { email: 'john.doe@example.com', password: 'customer123' },
    ];

    let allPassed = true;
    for (const test of testUsers) {
      const result = await UserModel.validatePassword(test.email, test.password);
      if (result) {
        console.log(`✅ ${test.email} - Authentication successful`);
      } else {
        console.log(`❌ ${test.email} - Authentication FAILED`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('\n✨ All users authenticated successfully!');
    } else {
      console.log('\n⚠️  Some users failed authentication. Check the logs above.');
    }
  } catch (error) {
    console.error('Error during force reset:', error);
  }
};

forceResetUsers().catch(console.error);
