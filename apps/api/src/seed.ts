import bcrypt from 'bcryptjs';
import { UserModel } from './models/user';
import { CustomerModel } from './models/customer';

const seedUsers = async () => {
  console.log('🌱 Seeding demo users...');

  const users = [
    {
      id: 'admin-001',
      email: 'admin@shipnorth.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'staff-001',
      email: 'staff@shipnorth.com',
      password: await bcrypt.hash('staff123', 10),
      firstName: 'Sarah',
      lastName: 'Staff',
      role: 'staff' as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'driver-001',
      email: 'driver@shipnorth.com',
      password: await bcrypt.hash('driver123', 10),
      firstName: 'Bob',
      lastName: 'Driver',
      role: 'driver' as const,
      createdAt: new Date().toISOString(),
    },
  ];

  // Create users
  for (const user of users) {
    try {
      await UserModel.create(user);
      console.log(`✅ Created ${user.role}: ${user.email}`);
    } catch (error) {
      console.log(`⏭️  ${user.role} already exists: ${user.email}`);
    }
  }

  // Create customer
  const customer = {
    id: 'cust-001',
    email: 'john.doe@example.com',
    password: await bcrypt.hash('customer123', 10),
    firstName: 'John',
    lastName: 'Doe',
    phone: '416-555-0123',
    address: '123 Main St',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5V 2T6',
    createdAt: new Date().toISOString(),
  };

  try {
    await CustomerModel.create(customer);
    console.log(`✅ Created customer: ${customer.email}`);
  } catch (error) {
    console.log(`⏭️  Customer already exists: ${customer.email}`);
  }

  console.log('✨ Seeding complete!');
};

// Run seed
seedUsers().catch(console.error);