import { UserModel } from './models/user';
import { CustomerModel } from './models/customer';
import { DatabaseService } from './services/database';

const cleanAndSeed = async () => {
  console.log('🧹 Cleaning up duplicate users...\n');

  try {
    // Get all users
    const users = await UserModel.list();
    console.log(`Found ${users.length} users. Removing duplicates...\n`);

    // Delete all users except the most recent ones
    const uniqueEmails = new Set<string>();
    const toDelete: string[] = [];

    // Sort by ID to keep the most recent ones
    const sortedUsers = [...users].reverse();

    for (const user of sortedUsers) {
      if (uniqueEmails.has(user.email)) {
        toDelete.push(user.id);
        console.log(`🗑️  Marking duplicate for deletion: ${user.email} (ID: ${user.id})`);
      } else {
        uniqueEmails.add(user.email);
        console.log(`✅ Keeping: ${user.email} (ID: ${user.id})`);
      }
    }

    // Delete duplicates
    for (const id of toDelete) {
      await UserModel.delete(id);
      console.log(`❌ Deleted user with ID: ${id}`);
    }

    console.log('\n🌱 Re-seeding demo users with correct passwords...\n');

    // Delete and recreate all demo users to ensure correct passwords
    const demoEmails = [
      'admin@shipnorth.com',
      'staff@shipnorth.com',
      'driver@shipnorth.com',
      'john.doe@example.com',
    ];

    for (const email of demoEmails) {
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        await UserModel.delete(existing.id);
        console.log(`🗑️  Deleted existing ${email}`);
      }
    }

    // Now create fresh users
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

    for (const user of freshUsers) {
      await UserModel.create(user);
      console.log(`✅ Created ${user.role}: ${user.email}`);
    }

    // Also create customer record for John Doe
    const existing = await CustomerModel.findByEmail('john.doe@example.com');
    if (!existing) {
      await CustomerModel.create({
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
      console.log(`✅ Created customer record: john.doe@example.com`);
    }

    console.log('\n🔐 Testing authentication...\n');
    const testUsers = [
      { email: 'admin@shipnorth.com', password: 'admin123' },
      { email: 'staff@shipnorth.com', password: 'staff123' },
      { email: 'driver@shipnorth.com', password: 'driver123' },
      { email: 'john.doe@example.com', password: 'customer123' },
    ];

    for (const test of testUsers) {
      const result = await UserModel.validatePassword(test.email, test.password);
      if (result) {
        console.log(`✅ ${test.email} - Authentication successful`);
      } else {
        console.log(`❌ ${test.email} - Authentication failed`);
      }
    }

    console.log('\n✨ Clean and seed complete!');
  } catch (error) {
    console.error('Error during clean and seed:', error);
  }
};

cleanAndSeed().catch(console.error);
