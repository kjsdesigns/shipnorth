import { UserModel } from './models/user';
import bcrypt from 'bcryptjs';

const debugAuth = async () => {
  console.log('🔍 Debugging authentication...\n');

  const testUsers = [
    { email: 'admin@shipnorth.com', password: 'admin123' },
    { email: 'staff@shipnorth.com', password: 'staff123' },
  ];

  for (const test of testUsers) {
    console.log(`\n📧 Testing: ${test.email}`);
    console.log(`Password to test: ${test.password}`);

    const user = await UserModel.findByEmail(test.email);
    if (!user) {
      console.log('❌ User not found');
      continue;
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    console.log(`Stored hash: ${user.password}`);

    // Test bcrypt directly
    const isValid = await bcrypt.compare(test.password, user.password);
    console.log(`Direct bcrypt comparison: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

    // Test through validatePassword
    const result = await UserModel.validatePassword(test.email, test.password);
    console.log(`validatePassword result: ${result ? '✅ Success' : '❌ Failed'}`);

    // Create a new hash for comparison
    const newHash = await bcrypt.hash(test.password, 10);
    console.log(`New hash would be: ${newHash}`);
    const testNewHash = await bcrypt.compare(test.password, newHash);
    console.log(`New hash test: ${testNewHash ? '✅ Valid' : '❌ Invalid'}`);
  }
};

debugAuth().catch(console.error);
