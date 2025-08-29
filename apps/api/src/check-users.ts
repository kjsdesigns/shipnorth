import { UserModel } from './models/user';

const checkUsers = async () => {
  console.log('🔍 Checking users in database...\n');

  try {
    const users = await UserModel.list();
    console.log(`Found ${users.length} users:\n`);

    for (const user of users) {
      console.log(`📧 ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Name: ${user.firstName} ${user.lastName}`);
      console.log(`  - Status: ${user.status}`);
      console.log(`  - ID: ${user.id}`);
      console.log();
    }

    // Test authentication
    console.log('🔐 Testing authentication...\n');
    const testUsers = [
      { email: 'admin@shipnorth.com', password: 'admin123' },
      { email: 'staff@shipnorth.com', password: 'staff123' },
      { email: 'driver@shipnorth.com', password: 'driver123' },
      { email: 'john.doe@example.com', password: 'customer123' },
    ];

    for (const test of testUsers) {
      try {
        const result = await UserModel.validatePassword(test.email, test.password);
        if (result) {
          console.log(`✅ ${test.email} - Authentication successful`);
        } else {
          console.log(`❌ ${test.email} - Authentication failed`);
        }
      } catch (error) {
        console.log(`❌ ${test.email} - Error: ${error}`);
      }
    }
  } catch (error) {
    console.error('Error checking users:', error);
  }
};

checkUsers().catch(console.error);
