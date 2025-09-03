/**
 * Test data and fixtures for Playwright tests
 * Centralized mock data to reduce duplication across tests
 */

export const testData = {
  // Package tracking numbers for testing
  trackingNumbers: ['PKG-123456', 'PKG-789012', '1Z999AA1234567890', 'CP123456789CA'],

  // Customer information
  customers: [
    {
      id: 'cust_001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0101',
      address: {
        street: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 3A8',
      },
    },
    {
      id: 'cust_002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0102',
      address: {
        street: '456 Oak Ave',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V6B 1A1',
      },
    },
  ],

  // Driver information
  drivers: [
    {
      id: 'drv_001',
      name: 'Mike Wilson',
      email: 'mike.wilson@shipnorth.com',
      phone: '+1-555-0201',
      licenseNumber: 'DL123456789',
    },
    {
      id: 'drv_002',
      name: 'Dave Johnson',
      email: 'dave.johnson@shipnorth.com',
      phone: '+1-555-0202',
      licenseNumber: 'DL987654321',
    },
  ],

  // Load information
  loads: [
    {
      id: 'load_001',
      loadNumber: 'Load #001',
      driverId: 'drv_001',
      status: 'in_transit',
      packages: ['PKG-123456', 'PKG-789012'],
      estimatedDelivery: '2025-01-15',
    },
    {
      id: 'load_002',
      loadNumber: 'Load #002',
      driverId: 'drv_002',
      status: 'pending',
      packages: ['1Z999AA1234567890'],
      estimatedDelivery: '2025-01-16',
    },
  ],

  // Package information
  packages: [
    {
      id: 'pkg_001',
      trackingNumber: 'PKG-123456',
      recipientName: 'John Doe',
      recipientEmail: 'john.doe@example.com',
      status: 'in_transit',
      loadId: 'load_001',
      weight: 2.5,
      dimensions: '10x8x6',
    },
    {
      id: 'pkg_002',
      trackingNumber: 'PKG-789012',
      recipientName: 'Jane Smith',
      recipientEmail: 'jane.smith@example.com',
      status: 'assigned',
      loadId: 'load_001',
      weight: 1.2,
      dimensions: '8x6x4',
    },
  ],

  // Form validation test cases
  validation: {
    invalidEmails: [
      'invalid-email',
      '@example.com',
      'test@',
      'test.com',
      'test@.com',
      'test..test@example.com',
    ],

    validEmails: ['test@example.com', 'user.name@domain.org', 'firstname+lastname@company.co.uk'],

    invalidPasswords: [
      '', // empty
      '123', // too short
      'password', // too weak
    ],

    validPasswords: ['Password123!', 'MySecureP@ss', 'TestPass2025'],

    invalidPhoneNumbers: [
      '123',
      'abc-def-ghij',
      '555-0123', // missing area code
    ],

    validPhoneNumbers: ['+1-555-0123', '(555) 123-4567', '555.123.4567'],
  },

  // API endpoints for testing
  apiEndpoints: {
    auth: {
      login: '/api/auth/login/,
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
    },
    packages: {
      list: '/api/packages',
      create: '/api/packages',
      track: '/api/packages/track',
    },
    customers: {
      list: '/api/customers',
      create: '/api/customers',
    },
    loads: {
      list: '/api/loads',
      create: '/api/loads',
    },
    tracking: {
      update: '/api/tracking/update',
      history: '/api/tracking/history',
    },
  },

  // GPS coordinates for testing
  gpsCoordinates: {
    toronto: { lat: 43.6532, lng: -79.3832 },
    vancouver: { lat: 49.2827, lng: -123.1207 },
    montreal: { lat: 45.5017, lng: -73.5673 },
    calgary: { lat: 51.0447, lng: -114.0719 },
  },

  // File upload test data
  uploadFiles: {
    validImages: ['signature.png', 'package-photo.jpg', 'delivery-proof.jpeg'],
    invalidFiles: ['document.pdf', 'data.xlsx', 'script.js'],
  },

  // Filter options for testing
  filterOptions: {
    packageStatus: ['pending', 'assigned', 'in_transit', 'delivered', 'exception'],
    loadStatus: ['pending', 'in_progress', 'completed', 'cancelled'],
    customerStatus: ['active', 'inactive', 'suspended'],
  },

  // Pagination test data
  pagination: {
    pageSizes: [10, 25, 50, 100, 250, 500],
    defaultPageSize: 25,
  },
};

/**
 * Generate random test data
 */
export const generateTestData = {
  trackingNumber: () => `PKG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,

  email: (domain = 'example.com') => {
    const username = Math.random().toString(36).substr(2, 8);
    return `${username}@${domain}`;
  },

  phone: () => {
    const area = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `+1-${area}-${exchange}-${number}`;
  },

  name: () => {
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom', 'Anna'];
    const lastNames = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
    ];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  },
};
