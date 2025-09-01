import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

// Northern Quebec towns for test data
const QUEBEC_TOWNS = [
  {
    name: 'Chibougamau',
    province: 'QC',
    coordinates: { lat: 49.9255, lng: -74.3647 },
    addresses: [
      '123 Rue Principale',
      '456 Avenue des Pins', 
      '789 Boulevard Nord',
      '321 Rue du Lac',
      '654 Avenue Central',
      '987 Rue de la Forêt'
    ]
  },
  {
    name: "Val-d'Or",
    province: 'QC', 
    coordinates: { lat: 48.0978, lng: -77.7825 },
    addresses: [
      '111 3e Avenue',
      '222 Rue Sullivan',
      '333 Boulevard Forest',
      '444 Avenue Perreault',
      '555 Rue Saguenay',
      '666 Boulevard Lamaque'
    ]
  },
  {
    name: 'Rouyn-Noranda',
    province: 'QC',
    coordinates: { lat: 48.2359, lng: -79.0242 },
    addresses: [
      '777 Avenue du Lac',
      '888 Rue Perreault',
      '999 Boulevard Rideau',
      '101 Avenue Québec',
      '202 Rue Murdoch',
      '303 Boulevard des Pins'
    ]
  },
  {
    name: 'Amos',
    province: 'QC',
    coordinates: { lat: 48.5664, lng: -78.1198 },
    addresses: [
      '404 1re Avenue Ouest',
      '505 Rue Principale',
      '606 Avenue Authier',
      '707 Rue des Érables',
      '808 Boulevard Mercier',
      '909 Avenue Harricana'
    ]
  },
  {
    name: 'La Sarre',
    province: 'QC',
    coordinates: { lat: 48.7942, lng: -79.1997 },
    addresses: [
      '110 Rue Principale',
      '220 Avenue des Pionniers',
      '330 Boulevard Tessier',
      '440 Rue Première',
      '550 Avenue du Centenaire',
      '660 Rue des Fondateurs'
    ]
  }
];

// Sample customer names for realistic test data
const CUSTOMER_NAMES = [
  'Jean Tremblay', 'Marie Bouchard', 'Pierre Gagnon', 'Louise Côté', 'Michel Roy',
  'Sylvie Bergeron', 'André Morin', 'Diane Bélanger', 'Robert Gauthier', 'Linda Pelletier',
  'Daniel Leblanc', 'Nicole Fournier', 'Claude Lavoie', 'Francine Girard', 'Alain Mercier',
  'Suzanne Dubois', 'Marcel Beaulieu', 'Joanne Simard', 'Paul Martin', 'Hélène Boisvert',
  'Gilles Rousseau', 'Céline Bolduc', 'François Lavigne', 'Monique Turcotte', 'Denis Caron',
  'Ginette Dufour', 'Raymond Tessier', 'Lucie Poulin', 'Roger Bédard', 'Johanne Bernier'
];

async function query(text: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function createRouteOptimizationTestData() {
  try {
    console.log('🚀 Creating route optimization test data...');

    // 1. Insert system setting for origin address
    console.log('📍 Updating system settings with Shipnorth headquarters address...');
    await query(`
      INSERT INTO settings (category, key, value, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (category, key) 
      DO UPDATE SET value = $3, updated_at = NOW()
    `, [
      'system', 
      'default_origin_address',
      JSON.stringify({
        address1: '2045 20th Ave E Unit 6',
        city: 'Owen Sound',
        province: 'ON',
        postalCode: 'N4K 5N3',
        country: 'CA'
      }),
      'Default shipping origin address for Shipnorth headquarters'
    ]);

    // 2. Create test customers for each town
    console.log('👥 Creating test customers...');
    const customers = [];
    const customerAddresses = [];
    
    for (let townIndex = 0; townIndex < QUEBEC_TOWNS.length; townIndex++) {
      const town = QUEBEC_TOWNS[townIndex];
      
      // Create 6 customers per town
      for (let i = 0; i < 6; i++) {
        const customerIndex = townIndex * 6 + i;
        const customerName = CUSTOMER_NAMES[customerIndex];
        const [firstName, lastName] = customerName.split(' ');
        
        const customerResult = await query(`
          INSERT INTO customers (name, email, phone, business_name, business_type)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          `${firstName} ${lastName}`,
          `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          `+1-819-${(300 + customerIndex).toString().padStart(3, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`,
          Math.random() > 0.7 ? `${lastName} Enterprises` : null,
          Math.random() > 0.8 ? 'retail' : 'individual'
        ]);
        
        const customer = customerResult.rows[0];
        customers.push(customer);

        // Create shipping address for this customer  
        const addressResult = await query(`
          INSERT INTO addresses (customer_id, type, address_line1, city, province_state, postal_code, country, is_default)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          customer.id,
          'shipping',
          town.addresses[i],
          town.name,
          town.province,
          `G${Math.floor(Math.random() * 9)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(Math.random() * 9)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}`,
          'CA',
          true
        ]);

        const address = addressResult.rows[0];
        customerAddresses.push({ customer, address });
      }
    }

    // 3. Create test driver
    console.log('🚛 Creating test driver...');
    const driverResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING *
    `, [
      'test.driver@shipnorth.com',
      'driver123',
      'Test',
      'Driver',
      '+1-519-387-6969',
      'driver'
    ]);

    const driver = driverResult.rows[0] || await query(`
      SELECT * FROM users WHERE email = $1
    `, ['test.driver@shipnorth.com']).then(r => r.rows[0]);

    // 4. Create test load
    console.log('📦 Creating test load...');
    const loadResult = await query(`
      INSERT INTO loads (name, driver_id, vehicle, status, departure_date, estimated_duration)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      `Quebec Route Test - ${new Date().toLocaleDateString()}`,
      driver.id,
      'Freightliner Cascadia',
      'pending',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow date only
      0 // Will be calculated by route optimization
    ]);

    const load = loadResult.rows[0];

    // 5. Create 30 packages distributed across the 5 towns
    console.log('📦 Creating 30 test packages...');
    const packages = [];
    
    for (let i = 0; i < 30; i++) {
      const customerIndex = i % customerAddresses.length;
      const { customer, address } = customerAddresses[customerIndex];
      
      const pkgResult = await query(`
        INSERT INTO packages (barcode, customer_id, weight, length, width, height, declared_value, description, ship_to_address_id, status, service_type, estimated_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        `TEST-${Date.now()}-${i.toString().padStart(3, '0')}`,
        customer.id,
        Math.round((Math.random() * 10 + 1) * 100) / 100, // 1-11 kg
        Math.round((Math.random() * 30 + 10) * 100) / 100, // 10-40 cm
        Math.round((Math.random() * 20 + 10) * 100) / 100,  // 10-30 cm 
        Math.round((Math.random() * 15 + 5) * 100) / 100,  // 5-20 cm
        Math.round((Math.random() * 200 + 50) * 100) / 100, // $50-$250
        [
          'Electronics Package',
          'Clothing Order', 
          'Book Shipment',
          'Personal Items',
          'Household Goods',
          'Sporting Equipment',
          'Office Supplies',
          'Gift Package'
        ][Math.floor(Math.random() * 8)],
        address.id,
        'ready_for_shipping',
        'ground',
        Math.round((Math.random() * 50 + 15) * 100) / 100 // $15-$65
      ]);

      packages.push(pkgResult.rows[0]);
    }

    // 6. Assign packages to the load
    console.log('🔗 Assigning packages to load...');
    for (let i = 0; i < packages.length; i++) {
      await query(`
        INSERT INTO load_packages (load_id, package_id, sequence_order)
        VALUES ($1, $2, $3)
      `, [load.id, packages[i].id, i + 1]);
    }

    // 7. Create origin address setting
    console.log('🏢 Creating Shipnorth origin address setting...');
    await query(`
      INSERT INTO settings (category, key, value, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (category, key) 
      DO UPDATE SET value = $3, updated_at = NOW()
    `, [
      'shipping', 
      'origin_coordinates',
      JSON.stringify({
        lat: 44.5675,
        lng: -80.9436,
        accuracy: 'exact',
        geocodedAt: new Date().toISOString()
      }),
      'Geocoded coordinates for Shipnorth headquarters in Owen Sound'
    ]);

    console.log('✅ Route optimization test data created successfully!');
    console.log('📊 Summary:');
    console.log(`   • Load ID: ${load.id}`);
    console.log(`   • Driver: ${driver.first_name} ${driver.last_name} (${driver.email})`);
    console.log(`   • Packages: ${packages.length} packages`);
    console.log(`   • Towns: ${QUEBEC_TOWNS.length} Quebec towns`);
    console.log(`   • Origin: Owen Sound, ON (Shipnorth HQ)`);
    console.log(`   • Customers: ${customerAddresses.length} customers`);
    console.log('');
    console.log('🧪 Test the route optimization at:');
    console.log(`   http://localhost:8849/staff/loads/${load.id}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Email: staff@shipnorth.com');
    console.log('   Password: staff123');

    // Define a default origin address for testing
    const originAddress = {
      lat: 43.7001,
      lng: -79.4163,
      address: 'Shipnorth Warehouse, 123 Warehouse Blvd, Toronto, ON',
      accuracy: 'exact' as const,
      geocodedAt: new Date().toISOString(),
    };

    return {
      load,
      driver,
      packages,
      customers: customerAddresses.map(ca => ca.customer),
      originAddress
    };

  } catch (error) {
    console.error('❌ Error creating route optimization test data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createRouteOptimizationTestData()
    .then(() => {
      console.log('🎉 Test data creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data creation failed:', error);
      process.exit(1);
    });
}