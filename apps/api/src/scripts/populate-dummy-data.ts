#!/usr/bin/env tsx

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

// Helper function to generate Canadian postal codes
function generateCanadianPostalCode(): string {
  const letters = 'ABCDEFGHIJKLMNPRSTUVWXYZ'; // Excludes O, I, Q
  const numbers = '0123456789';
  
  return `${letters.charAt(Math.floor(Math.random() * letters.length))}${numbers.charAt(Math.floor(Math.random() * 10))}${letters.charAt(Math.floor(Math.random() * letters.length))} ${numbers.charAt(Math.floor(Math.random() * 10))}${letters.charAt(Math.floor(Math.random() * letters.length))}${numbers.charAt(Math.floor(Math.random() * 10))}`;
}

// Helper function to generate tracking numbers
function generateTrackingNumber(): string {
  const carriers = ['CP', 'UPS', 'FDX', 'DHL'];
  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  const number = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return `${carrier}${number}`;
}

// Helper function to generate barcode
function generateBarcode(): string {
  return `PKG${Date.now()}${Math.random().toString(36).substr(2, 8)}`.toUpperCase();
}

// Dummy data arrays
const canadianCities = [
  { city: 'Toronto', province: 'ON' },
  { city: 'Vancouver', province: 'BC' },
  { city: 'Montreal', province: 'QC' },
  { city: 'Calgary', province: 'AB' },
  { city: 'Edmonton', province: 'AB' },
  { city: 'Ottawa', province: 'ON' },
  { city: 'Winnipeg', province: 'MB' },
  { city: 'Quebec City', province: 'QC' },
  { city: 'Hamilton', province: 'ON' },
  { city: 'Halifax', province: 'NS' },
];

const businessNames = [
  'Tech Solutions Inc',
  'Maple Leaf Manufacturing',
  'Northern Lights Trading',
  'Coastal Import Co',
  'Prairie Logistics Ltd',
  'Mountain View Enterprises',
  'Great Lakes Distribution',
  'Atlantic Supply Chain',
  'Pacific Rim Trading',
  'Central Canada Corp',
];

const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Amanda', 'William', 'Jennifer', 'James', 'Michelle', 'Daniel', 'Ashley', 'Christopher', 'Lisa'];
const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez'];

const packageDescriptions = [
  'Electronics - Laptop',
  'Books and Stationery', 
  'Clothing Package',
  'Home Goods',
  'Medical Supplies',
  'Auto Parts',
  'Kitchen Equipment',
  'Sports Gear',
  'Art Supplies',
  'Industrial Tools',
  'Food Products',
  'Personal Care Items',
];

async function generateDummyData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting dummy data population...');
    
    // Begin transaction
    await client.query('BEGIN');

    // 1. Create 8 additional users (we already have 4)
    console.log('👥 Creating additional users...');
    const users = [];
    const roles = ['customer', 'staff', 'driver', 'admin'];
    
    for (let i = 0; i < 8; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 5}@shipnorth.com`;
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const userData = {
        id: uuidv4(),
        email: email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone: `+1-416-555-${(1000 + i).toString().substr(1)}`,
        role: role,
        roles: [role], // Multi-role support
        last_used_portal: role === 'admin' ? 'staff' : role,
      };
      
      await client.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, roles, last_used_portal)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (email) DO NOTHING
      `, [userData.id, userData.email, userData.password_hash, userData.first_name, userData.last_name, userData.phone, userData.role, userData.roles, userData.last_used_portal]);
      
      users.push(userData);
    }

    // 2. Create 8 customers with business data
    console.log('🏢 Creating customers...');
    const customers = [];
    
    for (let i = 0; i < 8; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const city = canadianCities[Math.floor(Math.random() * canadianCities.length)];
      const businessName = businessNames[i];
      
      const customerData = {
        id: uuidv4(),
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: `+1-${Math.floor(Math.random() * 900) + 100}-555-${Math.floor(Math.random() * 9000) + 1000}`,
        business_name: businessName,
        business_type: ['Import/Export', 'E-commerce', 'Manufacturing', 'Wholesale', 'Retail'][Math.floor(Math.random() * 5)],
      };
      
      await client.query(`
        INSERT INTO customers (id, name, email, phone, business_name, business_type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [customerData.id, customerData.name, customerData.email, customerData.phone, customerData.business_name, customerData.business_type]);
      
      customers.push(customerData);
    }

    // 3. Create 16 addresses (2 per customer)
    console.log('📍 Creating addresses...');
    const addresses = [];
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      // Billing address
      const billingCity = canadianCities[Math.floor(Math.random() * canadianCities.length)];
      const billingAddress = {
        id: uuidv4(),
        customer_id: customer.id,
        type: 'billing',
        address_line1: `${Math.floor(Math.random() * 9999) + 1} ${['Main St', 'Oak Ave', 'Elm Dr', 'King St', 'Queen St', 'Bay St'][Math.floor(Math.random() * 6)]}`,
        city: billingCity.city,
        province_state: billingCity.province,
        postal_code: generateCanadianPostalCode(),
        country: 'CA',
        is_default: true,
      };
      
      await client.query(`
        INSERT INTO addresses (id, customer_id, type, address_line1, city, province_state, postal_code, country, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [billingAddress.id, billingAddress.customer_id, billingAddress.type, billingAddress.address_line1, billingAddress.city, billingAddress.province_state, billingAddress.postal_code, billingAddress.country, billingAddress.is_default]);
      
      addresses.push(billingAddress);
      
      // Shipping address (different city)
      const shippingCity = canadianCities[Math.floor(Math.random() * canadianCities.length)];
      const shippingAddress = {
        id: uuidv4(),
        customer_id: customer.id,
        type: 'shipping',
        address_line1: `${Math.floor(Math.random() * 9999) + 1} ${['Industrial Blvd', 'Commerce Dr', 'Business Pkwy', 'Trade Ave', 'Warehouse Rd'][Math.floor(Math.random() * 5)]}`,
        city: shippingCity.city,
        province_state: shippingCity.province,
        postal_code: generateCanadianPostalCode(),
        country: 'CA',
        is_default: false,
      };
      
      await client.query(`
        INSERT INTO addresses (id, customer_id, type, address_line1, city, province_state, postal_code, country, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [shippingAddress.id, shippingAddress.customer_id, shippingAddress.type, shippingAddress.address_line1, shippingAddress.city, shippingAddress.province_state, shippingAddress.postal_code, shippingAddress.country, shippingAddress.is_default]);
      
      addresses.push(shippingAddress);
    }

    // 4. Create 8 packages with various statuses
    console.log('📦 Creating packages...');
    const packages = [];
    const packageStatuses = ['pending', 'quoted', 'labeled', 'shipped', 'delivered'];
    
    for (let i = 0; i < 8; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const shipToAddress = addresses.find(addr => addr.customer_id === customer.id && addr.type === 'shipping');
      const shipFromAddress = addresses.find(addr => addr.customer_id === customer.id && addr.type === 'billing');
      
      const packageData = {
        id: uuidv4(),
        barcode: generateBarcode(),
        customer_id: customer.id,
        weight: (Math.random() * 45 + 0.5).toFixed(2), // 0.5-45kg
        length: (Math.random() * 40 + 10).toFixed(2),   // 10-50cm
        width: (Math.random() * 30 + 10).toFixed(2),    // 10-40cm
        height: (Math.random() * 20 + 5).toFixed(2),    // 5-25cm
        declared_value: (Math.random() * 1000 + 50).toFixed(2),
        description: packageDescriptions[Math.floor(Math.random() * packageDescriptions.length)],
        ship_from_address_id: shipFromAddress?.id,
        ship_to_address_id: shipToAddress?.id,
        status: packageStatuses[Math.floor(Math.random() * packageStatuses.length)],
        tracking_number: Math.random() > 0.3 ? generateTrackingNumber() : null,
        carrier: ['Canada Post', 'UPS', 'FedEx', 'Purolator'][Math.floor(Math.random() * 4)],
        service_type: ['Standard', 'Express', 'Priority', 'Overnight'][Math.floor(Math.random() * 4)],
        estimated_cost: (Math.random() * 100 + 15).toFixed(2),
        actual_cost: null as string | null,
        label_url: null as string | null,
      };
      
      // Some packages get actual costs when labeled/shipped
      if (['labeled', 'shipped', 'delivered'].includes(packageData.status)) {
        packageData.actual_cost = packageData.estimated_cost;
        packageData.label_url = `https://mock-labels.s3.amazonaws.com/${packageData.id}.pdf`;
      }
      
      await client.query(`
        INSERT INTO packages (id, barcode, customer_id, weight, length, width, height, declared_value, description, ship_from_address_id, ship_to_address_id, status, tracking_number, carrier, service_type, estimated_cost, actual_cost, label_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [packageData.id, packageData.barcode, packageData.customer_id, packageData.weight, packageData.length, packageData.width, packageData.height, packageData.declared_value, packageData.description, packageData.ship_from_address_id, packageData.ship_to_address_id, packageData.status, packageData.tracking_number, packageData.carrier, packageData.service_type, packageData.estimated_cost, packageData.actual_cost, packageData.label_url]);
      
      packages.push(packageData);
    }

    // 5. Create 8 loads with different statuses
    console.log('🚛 Creating loads...');
    const loads = [];
    const loadStatuses = ['planned', 'active', 'completed', 'cancelled'];
    const vehicles = ['Truck-001', 'Truck-002', 'Truck-003', 'Van-001', 'Van-002'];
    const driverUsers = users.filter(u => u.role === 'driver');
    
    for (let i = 0; i < 8; i++) {
      const driver = driverUsers[Math.floor(Math.random() * driverUsers.length)];
      const departureDays = Math.floor(Math.random() * 14) - 7; // -7 to +7 days from today
      const departureDate = new Date(Date.now() + departureDays * 24 * 60 * 60 * 1000);
      
      const loadData = {
        id: uuidv4(),
        name: `Load ${String.fromCharCode(65 + i)}-${departureDate.getFullYear()}${(departureDate.getMonth() + 1).toString().padStart(2, '0')}${departureDate.getDate().toString().padStart(2, '0')}`,
        driver_id: Math.random() > 0.3 ? driver?.id : null, // Some loads unassigned
        vehicle: vehicles[Math.floor(Math.random() * vehicles.length)],
        status: loadStatuses[Math.floor(Math.random() * loadStatuses.length)],
        departure_date: departureDate.toISOString().split('T')[0],
        estimated_duration: Math.floor(Math.random() * 480 + 120), // 2-10 hours in minutes
        actual_duration: Math.random() > 0.5 ? Math.floor(Math.random() * 480 + 120) : null,
      };
      
      await client.query(`
        INSERT INTO loads (id, name, driver_id, vehicle, status, departure_date, estimated_duration, actual_duration)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [loadData.id, loadData.name, loadData.driver_id, loadData.vehicle, loadData.status, loadData.departure_date, loadData.estimated_duration, loadData.actual_duration]);
      
      loads.push(loadData);
    }

    // 6. Assign some packages to loads (load_packages junction table)
    console.log('🔗 Creating load-package relationships...');
    const assignedPackages = packages.slice(0, 6); // Assign 6 out of 8 packages
    
    for (let i = 0; i < assignedPackages.length; i++) {
      const pkg = assignedPackages[i];
      const load = loads[Math.floor(i / 2)]; // 2 packages per load for first 3 loads
      
      await client.query(`
        INSERT INTO load_packages (load_id, package_id, sequence_order)
        VALUES ($1, $2, $3)
      `, [load.id, pkg.id, i + 1]);
    }

    // 7. Create 8 invoices with different statuses  
    console.log('💰 Creating invoices...');
    const invoiceStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    for (let i = 0; i < 8; i++) {
      const customer = customers[i % customers.length];
      const pkg = packages[i];
      const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)];
      const amount = parseFloat(pkg.actual_cost || pkg.estimated_cost);
      
      const invoiceData = {
        id: uuidv4(),
        customer_id: customer.id,
        package_id: pkg.id,
        amount: amount,
        status: status,
        payment_method: ['credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 3)],
        payment_id: status === 'paid' ? `pay_${Date.now()}_${Math.random().toString(36).substr(2, 8)}` : null,
        paid_at: status === 'paid' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      };
      
      await client.query(`
        INSERT INTO invoices (id, customer_id, package_id, amount, status, payment_method, payment_id, paid_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [invoiceData.id, invoiceData.customer_id, invoiceData.package_id, invoiceData.amount, invoiceData.status, invoiceData.payment_method, invoiceData.payment_id, invoiceData.paid_at]);
    }

    // 8. Create system settings
    console.log('⚙️  Creating system settings...');
    const settingsData = [
      { category: 'shipping', key: 'default_carrier', value: { carrier: 'Canada Post' }, description: 'Default shipping carrier' },
      { category: 'shipping', key: 'rate_markup', value: { percentage: 15 }, description: 'Shipping rate markup percentage' },
      { category: 'general', key: 'company_name', value: { name: 'Shipnorth' }, description: 'Company name' },
      { category: 'general', key: 'support_email', value: { email: 'support@shipnorth.com' }, description: 'Support contact email' },
      { category: 'notifications', key: 'email_enabled', value: { enabled: true }, description: 'Email notifications enabled' },
      { category: 'notifications', key: 'sms_enabled', value: { enabled: false }, description: 'SMS notifications enabled' },
      { category: 'security', key: 'session_timeout', value: { minutes: 1440 }, description: 'Session timeout in minutes' },
      { category: 'analytics', key: 'tracking_enabled', value: { enabled: true }, description: 'Analytics tracking enabled' },
    ];
    
    for (const setting of settingsData) {
      await client.query(`
        INSERT INTO settings (id, category, key, value, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (category, key) DO UPDATE SET value = $4, description = $5
      `, [uuidv4(), setting.category, setting.key, JSON.stringify(setting.value), setting.description]);
    }

    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Dummy data population complete!');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${users.length} additional (12 total)`);
    console.log(`   🏢 Customers: ${customers.length}`);
    console.log(`   📍 Addresses: ${addresses.length}`);
    console.log(`   📦 Packages: ${packages.length}`);
    console.log(`   🚛 Loads: ${loads.length}`);
    console.log(`   🔗 Load-Package assignments: 6`);
    console.log(`   💰 Invoices: 8`);
    console.log(`   ⚙️  Settings: ${settingsData.length}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error populating dummy data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    await generateDummyData();
    console.log('🎉 Database populated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateDummyData };