import { CustomerModel } from './models/customer';

const cleanCustomers = async () => {
  console.log('🧹 Cleaning duplicate customers...\n');
  
  const customers = await CustomerModel.list();
  console.log(`Found ${customers.length} customers`);
  
  // Find duplicates based on ID
  const seenIds = new Set<string>();
  const duplicates: any[] = [];
  
  for (const customer of customers) {
    if (customer.id === 'cust-001') {
      duplicates.push(customer);
    }
  }
  
  console.log(`\nFound ${duplicates.length} customers with ID 'cust-001'`);
  
  // Keep only the first one, delete the rest
  if (duplicates.length > 1) {
    for (let i = 1; i < duplicates.length; i++) {
      console.log(`Deleting duplicate: ${duplicates[i].email} (ID: cust-001)`);
      await CustomerModel.delete('cust-001');
      break; // Only delete once since they have the same ID
    }
  }
  
  // Also remove any customers with password field (these shouldn't be in customer table)
  for (const customer of customers) {
    if ('password' in customer) {
      console.log(`\nRemoving customer with password field: ${customer.email} (ID: ${customer.id})`);
      await CustomerModel.delete(customer.id);
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

cleanCustomers().catch(console.error);