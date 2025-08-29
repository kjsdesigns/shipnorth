import { UserModel } from './models/user';
import bcrypt from 'bcryptjs';

const fixStaffUser = async () => {
  console.log('🔧 Fixing staff user specifically...\n');

  // Delete any existing staff user
  console.log('Looking for existing staff users...');
  const allUsers = await UserModel.list();
  for (const user of allUsers) {
    if (user.email === 'staff@shipnorth.com') {
      console.log(`Found staff user with ID: ${user.id}, deleting...`);
      await UserModel.delete(user.id);
    }
  }

  // Create a fresh staff user
  console.log('\nCreating fresh staff user...');
  const staffData = {
    email: 'staff@shipnorth.com',
    password: 'staff123',
    firstName: 'Sarah',
    lastName: 'Staff',
    role: 'staff' as const,
    status: 'active' as const,
  };

  console.log('Input data:', JSON.stringify(staffData, null, 2));

  const createdUser = await UserModel.create(staffData);
  console.log('\nCreated user:', JSON.stringify(createdUser, null, 2));

  // Fetch and verify
  const dbUser = await UserModel.findByEmail('staff@shipnorth.com');
  if (dbUser) {
    console.log('\nUser from database:');
    console.log(`  Email: ${dbUser.email}`);
    console.log(`  Name: ${dbUser.firstName} ${dbUser.lastName}`);
    console.log(`  Password hash: ${dbUser.password}`);

    // Test password
    const isValid = await bcrypt.compare('staff123', dbUser.password);
    console.log(`\nDirect bcrypt test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    // Test through validatePassword
    const validateResult = await UserModel.validatePassword('staff@shipnorth.com', 'staff123');
    console.log(`validatePassword test: ${validateResult ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Check if it's the problematic hash
    const problematicHash = '$2b$10$zsACfFmgHX/6nzCz99kY1.ToZssHrZIaeN7phbKDX9p7bNpAn7Ldy';
    if (dbUser.password === problematicHash) {
      console.log('\n⚠️  WARNING: Still got the problematic hash!');
      console.log('This hash appears to be stuck in the database somehow.');

      // Let's manually create a new hash and see if we can update it
      console.log('\nTrying manual update with new hash...');
      const newHash = await bcrypt.hash('staff123', 10);
      console.log(`New hash: ${newHash}`);

      // Try to update directly
      await UserModel.update(dbUser.id, { password: 'staff123' });

      // Check again
      const updatedUser = await UserModel.findByEmail('staff@shipnorth.com');
      if (updatedUser) {
        console.log(`Updated hash: ${updatedUser.password}`);
        const updatedValid = await bcrypt.compare('staff123', updatedUser.password);
        console.log(`Updated password test: ${updatedValid ? '✅ VALID' : '❌ INVALID'}`);
      }
    }
  }
};

fixStaffUser().catch(console.error);
