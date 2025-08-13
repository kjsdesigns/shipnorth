import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import { UserModel } from '../models/user';
import { CustomerModel } from '../models/customer';
import { PackageModel } from '../models/package';
import { LoadModel } from '../models/load';
import { InvoiceModel } from '../models/invoice';

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Create admin user
    const admin = await UserModel.create({
      email: 'admin@shipnorth.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+14165551000',
      status: 'active',
    });
    console.log('✅ Created admin user:', admin.email);

    // Create staff users
    const staff1 = await UserModel.create({
      email: 'staff@shipnorth.com',
      password: 'staff123',
      role: 'staff',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+14165551001',
      status: 'active',
    });
    console.log('✅ Created staff user:', staff1.email);

    const driver = await UserModel.create({
      email: 'driver@shipnorth.com',
      password: 'driver123',
      role: 'driver',
      firstName: 'Mike',
      lastName: 'Wilson',
      phone: '+14165551002',
      status: 'active',
    });
    console.log('✅ Created driver user:', driver.email);

    // Create customers
    const customer1 = await CustomerModel.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+14165552001',
      addressLine1: '123 Main Street',
      addressLine2: 'Suite 100',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 3A8',
      country: 'Canada',
      stripeCustomerId: 'cus_mock_' + Date.now(),
      stripePaymentMethodId: 'pm_mock_' + Date.now(),
      status: 'active',
    });

    // Create customer user account
    await UserModel.create({
      email: customer1.email,
      password: 'customer123',
      role: 'customer',
      customerId: customer1.id,
      firstName: customer1.firstName,
      lastName: customer1.lastName,
      phone: customer1.phone,
      status: 'active',
    });
    console.log('✅ Created customer:', customer1.email);

    const customer2 = await CustomerModel.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+14165552002',
      addressLine1: '456 Queen Street',
      city: 'Ottawa',
      province: 'ON',
      postalCode: 'K1P 5H3',
      country: 'Canada',
      stripeCustomerId: 'cus_mock_' + Date.now(),
      status: 'active',
    });

    await UserModel.create({
      email: customer2.email,
      password: 'customer123',
      role: 'customer',
      customerId: customer2.id,
      firstName: customer2.firstName,
      lastName: customer2.lastName,
      phone: customer2.phone,
      status: 'active',
    });
    console.log('✅ Created customer:', customer2.email);

    const customer3 = await CustomerModel.create({
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@example.com',
      phone: '+14165552003',
      addressLine1: '789 King Street',
      city: 'Hamilton',
      province: 'ON',
      postalCode: 'L8P 4S8',
      country: 'Canada',
      status: 'active',
    });
    console.log('✅ Created customer:', customer3.email);

    // Create loads
    const load1 = await LoadModel.create({
      departureDate: new Date().toISOString(),
      arrivalDate: new Date(Date.now() + 86400000).toISOString(),
      transportMode: 'truck',
      carrierOrTruck: 'Shipnorth Truck #1',
      vehicleId: 'TRUCK001',
      driverName: 'Mike Wilson',
      originAddress: '100 Warehouse Dr, Toronto, ON',
      status: 'planned',
      notes: 'Regular northern route',
    });
    console.log('✅ Created load:', load1.id);

    const load2 = await LoadModel.create({
      departureDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
      transportMode: 'truck',
      carrierOrTruck: 'Shipnorth Truck #2',
      vehicleId: 'TRUCK002',
      driverName: 'Dave Brown',
      originAddress: '100 Warehouse Dr, Toronto, ON',
      status: 'planned',
      notes: 'Eastern route',
    });
    console.log('✅ Created load:', load2.id);

    // Create packages with various statuses
    const package1 = await PackageModel.create({
      customerId: customer1.id,
      receivedDate: new Date(Date.now() - 86400000).toISOString(),
      length: 30,
      width: 20,
      height: 15,
      weight: 5.5,
      quotedCarrier: 'Canada Post',
      quotedService: 'Expedited Parcel',
      quotedRate: 25.99,
      labelStatus: 'purchased',
      carrier: 'Canada Post',
      trackingNumber: 'CP123456789CA',
      labelUrl: 'https://mock-labels.s3.amazonaws.com/label1.pdf',
      price: 32.99,
      paymentStatus: 'paid',
      shipmentStatus: 'in_transit',
      loadId: load1.id,
      shipTo: {
        name: 'Alice Johnson',
        address1: '321 Pine Street',
        city: 'Thunder Bay',
        province: 'ON',
        postalCode: 'P7B 1K3',
        country: 'Canada',
      },
    });

    await InvoiceModel.create({
      customerId: customer1.id,
      packageId: package1.id,
      amount: 32.99,
      tax: 4.29,
      total: 37.28,
      currency: 'CAD',
      stripePaymentIntentId: 'pi_mock_paid_' + Date.now(),
      status: 'paid',
    });
    console.log('✅ Created package with invoice:', package1.trackingNumber);

    const package2 = await PackageModel.create({
      customerId: customer2.id,
      receivedDate: new Date().toISOString(),
      length: 40,
      width: 30,
      height: 25,
      weight: 8.2,
      quotedCarrier: 'FedEx',
      quotedService: 'Ground',
      quotedRate: 35.50,
      labelStatus: 'quoted',
      price: 42.50,
      paymentStatus: 'unpaid',
      shipmentStatus: 'ready',
      shipTo: {
        name: 'Bob Smith',
        address1: '555 Elm Avenue',
        city: 'Sudbury',
        province: 'ON',
        postalCode: 'P3E 2T5',
        country: 'Canada',
      },
    });
    console.log('✅ Created package:', package2.barcode);

    const package3 = await PackageModel.create({
      customerId: customer1.id,
      receivedDate: new Date(Date.now() - 172800000).toISOString(),
      deliveryDate: new Date(Date.now() - 86400000).toISOString(),
      length: 25,
      width: 25,
      height: 20,
      weight: 4.0,
      quotedCarrier: 'UPS',
      quotedService: 'Standard',
      quotedRate: 22.00,
      labelStatus: 'purchased',
      carrier: 'UPS',
      trackingNumber: '1Z999AA10123456784',
      labelUrl: 'https://mock-labels.s3.amazonaws.com/label3.pdf',
      price: 28.00,
      paymentStatus: 'paid',
      shipmentStatus: 'delivered',
      shipTo: {
        name: 'Carol White',
        address1: '777 Oak Road',
        city: 'London',
        province: 'ON',
        postalCode: 'N6A 1H7',
        country: 'Canada',
      },
    });

    await InvoiceModel.create({
      customerId: customer1.id,
      packageId: package3.id,
      amount: 28.00,
      tax: 3.64,
      total: 31.64,
      currency: 'CAD',
      stripePaymentIntentId: 'pi_mock_paid2_' + Date.now(),
      status: 'paid',
    });
    console.log('✅ Created delivered package:', package3.trackingNumber);

    const package4 = await PackageModel.create({
      customerId: customer3.id,
      receivedDate: new Date().toISOString(),
      length: 50,
      width: 40,
      height: 30,
      weight: 12.5,
      labelStatus: 'unlabeled',
      paymentStatus: 'unpaid',
      shipmentStatus: 'ready',
      shipTo: {
        name: 'David Lee',
        address1: '999 Maple Drive',
        city: 'Kingston',
        province: 'ON',
        postalCode: 'K7L 4V1',
        country: 'Canada',
      },
      notes: 'Fragile - Handle with care',
    });
    console.log('✅ Created package:', package4.barcode);

    // Failed payment example
    const package5 = await PackageModel.create({
      customerId: customer2.id,
      receivedDate: new Date(Date.now() - 43200000).toISOString(),
      length: 35,
      width: 25,
      height: 18,
      weight: 6.0,
      quotedCarrier: 'Canada Post',
      quotedService: 'Regular Parcel',
      quotedRate: 18.99,
      labelStatus: 'purchased',
      carrier: 'Canada Post',
      trackingNumber: 'CP987654321CA',
      labelUrl: 'https://mock-labels.s3.amazonaws.com/label5.pdf',
      price: 24.99,
      paymentStatus: 'failed',
      shipmentStatus: 'ready',
      shipTo: {
        name: 'Eve Brown',
        address1: '111 Cedar Lane',
        city: 'Windsor',
        province: 'ON',
        postalCode: 'N9A 6J3',
        country: 'Canada',
      },
    });

    await InvoiceModel.create({
      customerId: customer2.id,
      packageId: package5.id,
      amount: 24.99,
      tax: 3.25,
      total: 28.24,
      currency: 'CAD',
      status: 'failed',
      notes: 'Payment declined - insufficient funds',
    });
    console.log('✅ Created package with failed payment:', package5.trackingNumber);

    // Assign packages to load
    await LoadModel.assignPackages(load1.id, [package1.id]);
    console.log('✅ Assigned packages to load');

    // Add GPS tracking to active load
    await LoadModel.updateGPS(load1.id, 43.6532, -79.3832); // Toronto
    await LoadModel.updateGPS(load1.id, 44.3894, -79.6903); // Barrie
    await LoadModel.updateGPS(load1.id, 46.4917, -80.9930); // Sudbury
    console.log('✅ Added GPS tracking data');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:    admin@shipnorth.com / admin123');
    console.log('Staff:    staff@shipnorth.com / staff123');
    console.log('Driver:   driver@shipnorth.com / driver123');
    console.log('Customer: john.doe@example.com / customer123');
    console.log('Customer: jane.smith@example.com / customer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log('\n✅ Seed complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});