import { UserModel } from './models/user';
import { CustomerModel } from './models/customer';

const seedUsers = async () => {
  console.log('🌱 Seeding demo users...');

  const users = [
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
  ];

  // Create users
  for (const user of users) {
    try {
      // Check if user already exists
      const existing = await UserModel.findByEmail(user.email);
      if (existing) {
        console.log(`⏭️  ${user.role} already exists: ${user.email}`);
      } else {
        await UserModel.create(user);
        console.log(`✅ Created ${user.role}: ${user.email}`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${user.role}: ${error}`);
    }
  }

  // Create customer user
  const customerUser = {
    email: 'john.doe@example.com',
    password: 'customer123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '416-555-0123',
    role: 'customer' as const,
    status: 'active' as const,
  };

  try {
    // Check if customer user already exists
    const existing = await UserModel.findByEmail(customerUser.email);
    if (existing) {
      console.log(`⏭️  Customer user already exists: ${customerUser.email}`);
    } else {
      await UserModel.create(customerUser);
      console.log(`✅ Created customer user: ${customerUser.email}`);
    }
  } catch (error) {
    console.log(`❌ Error creating customer user: ${error}`);
  }

  // Also create in customer table
  const customerData = {
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
  };

  try {
    // Check if customer already exists
    const existing = await CustomerModel.findByEmail(customerData.email);
    if (existing) {
      console.log(`⏭️  Customer record already exists: ${customerData.email}`);
    } else {
      await CustomerModel.create(customerData);
      console.log(`✅ Created customer record: ${customerData.email}`);
    }
  } catch (error) {
    console.log(`❌ Error creating customer record: ${error}`);
  }

  console.log('✨ Seeding complete!');
};

// Run seed
seedUsers().catch(console.error);