import { UserModel } from './models/user';
import bcrypt from 'bcryptjs';
import { DatabaseService } from './services/database';

const testCreateSingle = async () => {
  console.log('🧪 Testing single user creation with detailed logging...\n');

  // First, delete any existing admin user
  const existing = await UserModel.findByEmail('admin@shipnorth.com');
  if (existing) {
    console.log(`Found existing admin user, deleting...`);
    await UserModel.delete(existing.id);
  }

  // Test data
  const testUser = {
    email: 'admin@shipnorth.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
    status: 'active' as const,
  };

  console.log('Input data:');
  console.log(JSON.stringify(testUser, null, 2));

  // Hash the password manually to see what we expect
  const expectedHash = await bcrypt.hash(testUser.password, 10);
  console.log(`\nExpected hash for 'admin123': ${expectedHash}`);

  // Create the user
  console.log('\nCalling UserModel.create()...');
  const createdUser = await UserModel.create(testUser);
  console.log('\nReturned user:');
  console.log(JSON.stringify(createdUser, null, 2));

  // Fetch the user directly from database
  console.log('\nFetching user from database...');
  const dbUser = await UserModel.findByEmail('admin@shipnorth.com');
  if (dbUser) {
    console.log('User from database:');
    console.log(`  Email: ${dbUser.email}`);
    console.log(`  Name: ${dbUser.firstName} ${dbUser.lastName}`);
    console.log(`  Role: ${dbUser.role}`);
    console.log(`  Status: ${dbUser.status}`);
    console.log(`  Password hash: ${dbUser.password}`);

    // Test the password
    const isValid = await bcrypt.compare('admin123', dbUser.password);
    console.log(`\nPassword test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    // Check if it's the same problematic hash
    const problematicHash = '$2b$10$Or4GVxDq0YrlyotG4o5ch.rNs/POwL4HBh2YicBibyG1GmPd9QYLa';
    if (dbUser.password === problematicHash) {
      console.log('⚠️  WARNING: Got the same problematic hash again!');
      console.log('This suggests the hash is being cached or reused somehow.');
    }

    // Query the database directly
    console.log('\nQuerying database directly...');
    const directItem = await DatabaseService.get(`USER#${dbUser.id}`, 'METADATA');
    if (directItem) {
      console.log('Direct database item Data.password:', directItem.Data.password);
    }
  } else {
    console.log('❌ User not found in database!');
  }
};

testCreateSingle().catch(console.error);
