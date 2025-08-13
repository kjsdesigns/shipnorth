import { DatabaseService } from './services/database';
import { CustomerModel } from './models/customer';

const fixCustomersThoroughly = async () => {
  console.log('🔧 Thoroughly fixing customer data...\n');
  
  // Get all customer items from database
  const items = await DatabaseService.scan({
    FilterExpression: '#type = :type',
    ExpressionAttributeNames: {
      '#type': 'Type',
    },
    ExpressionAttributeValues: {
      ':type': 'Customer',
    },
  });
  
  console.log(`Found ${items.length} customer items in database`);
  
  // Group by email to find duplicates
  const customersByEmail = new Map<string, any[]>();
  
  for (const item of items) {
    const customer = item.Data;
    if (!customersByEmail.has(customer.email)) {
      customersByEmail.set(customer.email, []);
    }
    customersByEmail.get(customer.email)!.push(item);
  }
  
  // Clean up duplicates
  for (const [email, customerItems] of customersByEmail) {
    if (customerItems.length > 1) {
      console.log(`\nFound ${customerItems.length} entries for ${email}:`);
      
      // Keep the one without password field, or the most complete one
      let keepIndex = 0;
      for (let i = 0; i < customerItems.length; i++) {
        const item = customerItems[i];
        // Skip items with password field (these shouldn't be in customer table)
        if (!item.Data.password && item.Data.addressLine1) {
          keepIndex = i;
          break;
        }
      }
      
      // Delete all except the one we're keeping
      for (let i = 0; i < customerItems.length; i++) {
        if (i !== keepIndex) {
          const item = customerItems[i];
          console.log(`  Deleting duplicate: PK=${item.PK}, SK=${item.SK}`);
          await DatabaseService.delete(item.PK, item.SK);
          // Also delete GSI entry
          if (item.GSI1PK && item.GSI1SK) {
            await DatabaseService.delete(item.GSI1PK, item.GSI1SK);
          }
        } else {
          console.log(`  Keeping: ID=${customerItems[i].Data.id}`);
        }
      }
    }
  }
  
  // Delete any items with 'cust-001' ID
  for (const item of items) {
    if (item.Data.id === 'cust-001') {
      console.log(`\nDeleting hardcoded ID 'cust-001': ${item.Data.email}`);
      await DatabaseService.delete(item.PK, item.SK);
      if (item.GSI1PK && item.GSI1SK) {
        await DatabaseService.delete(item.GSI1PK, item.GSI1SK);
      }
    }
  }
  
  console.log('\n✨ Cleanup complete!');
  
  // Show remaining customers
  const cleanedCustomers = await CustomerModel.list();
  console.log(`\nRemaining customers: ${cleanedCustomers.length}`);
  for (const customer of cleanedCustomers) {
    console.log(`  - ${customer.firstName} ${customer.lastName} (${customer.email}) - ID: ${customer.id}`);
  }
};

fixCustomersThoroughly().catch(console.error);