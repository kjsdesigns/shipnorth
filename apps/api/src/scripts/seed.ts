import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import { UserModel } from '../models/user';
import { CustomerModel } from '../models/customer';
import { PackageModel } from '../models/package';
import { LoadModel } from '../models/load';
import { InvoiceModel } from '../models/invoice';
import { CityModel } from '../models/city';

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
      paypalCustomerId: 'pp_customer_mock_' + Date.now(),
      paypalPaymentTokenId: 'pt_mock_' + Date.now(),
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
      paypalCustomerId: 'pp_customer_mock_' + Date.now(),
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
      defaultDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
      deliveryCities: [
        {
          city: 'Toronto',
          province: 'ON',
          country: 'CA',
          expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
      transportMode: 'truck',
      carrierOrTruck: 'Shipnorth Truck #1',
      vehicleId: 'TRUCK001',
      driverName: 'Mike Wilson',
      driverId: driver.id,
      originAddress: '100 Warehouse Dr, Toronto, ON',
      status: 'planned',
      notes: 'Regular northern route',
      locationHistory: [],
    });
    console.log('✅ Created load:', load1.id);

    const load2 = await LoadModel.create({
      departureDate: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
      defaultDeliveryDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
      deliveryCities: [
        {
          city: 'Montreal',
          province: 'QC',
          country: 'CA',
          expectedDeliveryDate: new Date(Date.now() + 259200000).toISOString(),
        },
        {
          city: 'Ottawa',
          province: 'ON',
          country: 'CA',
          expectedDeliveryDate: new Date(Date.now() + 345600000).toISOString(),
        },
      ],
      transportMode: 'truck',
      carrierOrTruck: 'Shipnorth Truck #2',
      vehicleId: 'TRUCK002',
      driverName: 'Dave Brown',
      originAddress: '100 Warehouse Dr, Toronto, ON',
      status: 'planned',
      notes: 'Eastern route',
      locationHistory: [],
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
        addressId: 'temp-address-1', // TODO: Create proper address and reference
      },
      // Legacy structure temporarily preserved as comment:
      // address: { address1: '321 Pine Street', city: 'Thunder Bay', province: 'ON', postalCode: 'P7B 1K3', country: 'Canada' }
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
      quotedRate: 35.5,
      labelStatus: 'quoted',
      price: 42.5,
      paymentStatus: 'unpaid',
      shipmentStatus: 'ready',
      shipTo: {
        name: 'Bob Smith',
        addressId: 'temp-address-' + Math.random(), // TODO: Fix '555 Elm Avenue',
        // city: 'Sudbury',
        // province: 'ON',
        // postalCode: 'P3E 2T5',
        // country: 'Canada',
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
      quotedRate: 22.0,
      labelStatus: 'purchased',
      carrier: 'UPS',
      trackingNumber: '1Z999AA10123456784',
      labelUrl: 'https://mock-labels.s3.amazonaws.com/label3.pdf',
      price: 28.0,
      paymentStatus: 'paid',
      shipmentStatus: 'delivered',
      shipTo: {
        name: 'Carol White',
        addressId: 'temp-address-' + Math.random(), // TODO: Fix '777 Oak Road',
        // city: 'London',
        // province: 'ON',
        // postalCode: 'N6A 1H7',
        // country: 'Canada',
      },
    });

    await InvoiceModel.create({
      customerId: customer1.id,
      packageId: package3.id,
      amount: 28.0,
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
        addressId: 'temp-address-' + Math.random(), // TODO: Fix '999 Maple Drive',
        // city: 'Kingston',
        // province: 'ON',
        // postalCode: 'K7L 4V1',
        // country: 'Canada',
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
        addressId: 'temp-address-' + Math.random(), // TODO: Fix '111 Cedar Lane',
        // city: 'Windsor',
        // province: 'ON',
        // postalCode: 'N9A 6J3',
        // country: 'Canada',
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
    await LoadModel.addLocationTracking(
      load1.id,
      43.6532,
      -79.3832,
      false,
      driver.id,
      'Toronto, ON'
    );
    await LoadModel.addLocationTracking(
      load1.id,
      44.3894,
      -79.6903,
      false,
      driver.id,
      'Barrie, ON'
    );
    await LoadModel.addLocationTracking(
      load1.id,
      46.4917,
      -80.993,
      false,
      driver.id,
      'Sudbury, ON'
    );
    console.log('✅ Added GPS tracking data');

    // Create cities with alternative names
    const toronto = await CityModel.create({
      name: 'Toronto',
      province: 'ON',
      alternativeNames: ['Downtown Toronto', 'T.O.', 'The Big Smoke'],
    });
    console.log('✅ Created city:', toronto.name);

    const mississauga = await CityModel.create({
      name: 'Mississauga',
      province: 'ON',
      alternativeNames: ['Sauga', 'Square One'],
    });
    console.log('✅ Created city:', mississauga.name);

    const london = await CityModel.create({
      name: 'London',
      province: 'ON',
      alternativeNames: ['Forest City', 'London Ontario'],
    });
    console.log('✅ Created city:', london.name);

    const windsor = await CityModel.create({
      name: 'Windsor',
      province: 'ON',
      alternativeNames: ['City of Roses', 'Windsor Ontario'],
    });
    console.log('✅ Created city:', windsor.name);

    const kingston = await CityModel.create({
      name: 'Kingston',
      province: 'ON',
      alternativeNames: ['Limestone City', 'K-Town'],
    });
    console.log('✅ Created city:', kingston.name);

    const vancouver = await CityModel.create({
      name: 'Vancouver',
      province: 'BC',
      alternativeNames: ['Van City', 'Rain City', 'Hollywood North'],
    });
    console.log('✅ Created city:', vancouver.name);

    const montreal = await CityModel.create({
      name: 'Montreal',
      province: 'QC',
      alternativeNames: ['Montréal', 'MTL', 'City of Saints'],
    });
    console.log('✅ Created city:', montreal.name);

    const calgary = await CityModel.create({
      name: 'Calgary',
      province: 'AB',
      alternativeNames: ['Cowtown', 'C-Town', 'Stampede City'],
    });
    console.log('✅ Created city:', calgary.name);

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
seedDatabase()
  .then(() => {
    console.log('\n✅ Seed complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
