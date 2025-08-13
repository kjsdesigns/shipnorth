import { DatabaseService, generateId } from './services/database';
import bcrypt from 'bcryptjs';

const directDbFix = async () => {
  console.log('🔧 Direct database operation to fix staff user...\n');
  
  // Query for staff users
  const items = await DatabaseService.queryByGSI('GSI1', 'EMAIL#staff@shipnorth.com');
  console.log(`Found ${items.length} items for staff@shipnorth.com`);
  
  for (const item of items) {
    if (item.Type === 'User') {
      console.log('\nFound User item:');
      console.log(`  PK: ${item.PK}`);
      console.log(`  SK: ${item.SK}`);
      console.log(`  ID: ${item.Data.id}`);
      console.log(`  Email: ${item.Data.email}`);
      console.log(`  Current hash: ${item.Data.password}`);
      
      // Delete this item
      console.log('\nDeleting item...');
      await DatabaseService.delete(item.PK, item.SK);
      
      // Also delete GSI entry
      await DatabaseService.delete(item.GSI1PK, item.GSI1SK);
    }
  }
  
  // Create completely fresh user
  console.log('\nCreating completely fresh staff user...');
  const id = generateId();
  const hashedPassword = await bcrypt.hash('staff123', 10);
  
  console.log(`New ID: ${id}`);
  console.log(`New hash: ${hashedPassword}`);
  
  const newUser = {
    id,
    email: 'staff@shipnorth.com',
    password: hashedPassword,
    firstName: 'Sarah',
    lastName: 'Staff',
    role: 'staff',
    status: 'active',
  };
  
  await DatabaseService.put({
    PK: `USER#${id}`,
    SK: 'METADATA',
    GSI1PK: `EMAIL#staff@shipnorth.com`,
    GSI1SK: `USER#${id}`,
    Type: 'User',
    Data: newUser,
  });
  
  console.log('\n✅ Created new staff user');
  
  // Verify
  console.log('\nVerifying...');
  const verifyItem = await DatabaseService.get(`USER#${id}`, 'METADATA');
  if (verifyItem) {
    console.log(`Stored hash: ${verifyItem.Data.password}`);
    const isValid = await bcrypt.compare('staff123', verifyItem.Data.password);
    console.log(`Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  }
  
  // Also test through GSI
  console.log('\nVerifying through GSI...');
  const gsiItems = await DatabaseService.queryByGSI('GSI1', 'EMAIL#staff@shipnorth.com');
  for (const item of gsiItems) {
    if (item.Type === 'User') {
      console.log(`GSI hash: ${item.Data.password}`);
      const isValid = await bcrypt.compare('staff123', item.Data.password);
      console.log(`GSI password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }
  }
};

directDbFix().catch(console.error);