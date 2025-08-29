import { AddressModel } from '../models/address';
import { PackageModel } from '../models/package';
import { LoadModel } from '../models/load';
import { RouteOptimizationService } from '../services/route-optimization';

async function createTestData() {
  console.log('Creating test addresses...');

  // Create test addresses
  const addresses = [
    {
      address1: '123 Main Street',
      address2: '',
      city: 'Owen Sound',
      province: 'ON',
      postalCode: 'N4K 5N4',
      country: 'Canada',
    },
    {
      address1: '456 Elm Avenue',
      address2: 'Suite 201',
      city: 'Chibougamau',
      province: 'QC',
      postalCode: 'G8P 2K5',
      country: 'Canada',
    },
    {
      address1: '789 Pine Road',
      address2: '',
      city: "Val-d'Or",
      province: 'QC',
      postalCode: 'J9P 6Y8',
      country: 'Canada',
    },
    {
      address1: '321 Oak Street',
      address2: '',
      city: 'Rouyn-Noranda',
      province: 'QC',
      postalCode: 'J9X 7A1',
      country: 'Canada',
    },
    {
      address1: '654 Maple Drive',
      address2: '',
      city: 'Timmins',
      province: 'ON',
      postalCode: 'P4N 8K2',
      country: 'Canada',
    },
    {
      address1: 'PO Box 42',
      address2: '',
      city: 'Remote Northern Community',
      province: 'QC',
      postalCode: '',
      country: 'Canada',
    },
  ];

  const createdAddresses = [];
  for (const addrData of addresses) {
    const address = await AddressModel.create({
      ...addrData,
      geocodingStatus: 'pending' as const,
    });
    createdAddresses.push(address);
    console.log(
      `Created address: ${address.city}, ${address.province} (${address.geocodingStatus})`
    );

    // Wait for geocoding to potentially complete
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log('\nCreating test packages...');

  // Create test packages
  const packages = [];
  for (let i = 0; i < createdAddresses.length; i++) {
    const address = createdAddresses[i];

    const pkg = await PackageModel.create({
      customerId: 'test-customer-001',
      shipTo: {
        name: `Recipient ${i + 1}`,
        addressId: address.id,
      },
      weight: 2.5 + Math.random() * 10,
      length: 20 + Math.random() * 30,
      width: 15 + Math.random() * 25,
      height: 10 + Math.random() * 20,
      labelStatus: 'unlabeled',
      paymentStatus: 'unpaid',
      shipmentStatus: 'ready',
      receivedDate: new Date().toISOString(),
      notes: `Test package for ${address.city}`,
    });

    packages.push(pkg);
    console.log(`Created package: ${pkg.id} for ${address.city}`);
  }

  console.log('\nCreating test load...');

  // Create test load
  const load = await LoadModel.create({
    departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    deliveryCities: [],
    transportMode: 'truck',
    driverName: 'John Doe',
    carrierOrTruck: 'TRUCK-001',
    status: 'planned',
    notes: 'Test load for route optimization',
    locationHistory: [], // Required field
  });

  console.log(`Created load: ${load.id}`);

  // Assign packages to load
  const packageIds = packages.map((p) => p.id);
  await LoadModel.assignPackages(load.id, packageIds);
  console.log(`Assigned ${packageIds.length} packages to load`);

  return { load, packages, addresses: createdAddresses };
}

async function testRouteOptimization() {
  try {
    console.log('🚛 Starting Route Optimization Test\n');

    // Create test data
    const { load, packages, addresses } = await createTestData();

    console.log('\n📊 Analyzing load routing...');

    // Test route analysis
    const analysis = await RouteOptimizationService.analyzeLoadRouting(load.id);
    console.log('Load Analysis:', JSON.stringify(analysis, null, 2));

    console.log('\n🌍 Checking routing readiness...');

    // Test routing readiness
    const readiness = await RouteOptimizationService.getRoutingReadiness();
    console.log('Routing Readiness:', JSON.stringify(readiness, null, 2));

    console.log('\n🛣️ Generating optimized route...');

    // Test route optimization with different options
    const routeOptions = [
      {
        name: 'Standard Route',
        options: {},
      },
      {
        name: 'Fuel Efficient Route',
        options: {
          prioritizeFuelEfficiency: true,
          averageSpeedKmh: 75,
        },
      },
      {
        name: 'Fast Delivery Route',
        options: {
          maxDailyDrivingHours: 12,
          averageSpeedKmh: 90,
          deliveryTimeMinutes: 10,
        },
      },
    ];

    for (const { name, options } of routeOptions) {
      console.log(`\n--- ${name} ---`);

      try {
        const optimizedRoute = await RouteOptimizationService.generateOptimizedRoute(
          load.id,
          options
        );

        console.log(`✅ Route generated successfully!`);
        console.log(`📍 Cities to visit: ${optimizedRoute.cityClusters.length}`);
        console.log(`📦 Total packages: ${optimizedRoute.waypoints.length}`);
        console.log(`🚗 Total distance: ${optimizedRoute.totalDistance} km`);
        console.log(`⏱️ Total duration: ${Math.round(optimizedRoute.totalDuration / 60)} hours`);
        console.log(`📅 Estimated days: ${optimizedRoute.estimatedDays}`);

        if (optimizedRoute.warnings.length > 0) {
          console.log(`⚠️ Warnings: ${optimizedRoute.warnings.length}`);
          optimizedRoute.warnings.forEach((warning) => console.log(`   - ${warning}`));
        }

        console.log('\n📋 Route Summary:');
        optimizedRoute.cityClusters.forEach((cluster, index) => {
          console.log(`${index + 1}. ${cluster.city}, ${cluster.province}`);
          console.log(`   📦 ${cluster.totalPackages} packages`);
          console.log(`   🚗 ${cluster.distanceFromPrevious?.toFixed(1) || 0} km from previous`);
          console.log(`   ⏱️ ${cluster.estimatedDuration} minutes in city`);

          // Show first few waypoints
          const sampleWaypoints = cluster.waypoints.slice(0, 3);
          sampleWaypoints.forEach((waypoint, wpIndex) => {
            console.log(`     ${wpIndex + 1}. ${waypoint.recipientName} (${waypoint.packageId})`);
          });
          if (cluster.waypoints.length > 3) {
            console.log(`     ... and ${cluster.waypoints.length - 3} more`);
          }
        });
      } catch (error) {
        console.error(
          `❌ Failed to generate ${name}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    console.log('\n🧪 Test completed successfully!');
    console.log(`\nCreated test data:`);
    console.log(`- Load ID: ${load.id}`);
    console.log(`- Package IDs: ${packages.map((p) => p.id).join(', ')}`);
    console.log(`- Address IDs: ${addresses.map((a) => a.id).join(', ')}`);
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}

// Run the test
if (require.main === module) {
  testRouteOptimization()
    .then(() => {
      console.log('\n✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testRouteOptimization };
