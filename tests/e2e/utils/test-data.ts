export const testData = {
  // Tracking numbers for testing
  trackingNumbers: ['PKG-123456', 'PKG-789012', 'PKG-345678', 'TEST-PKG-001', 'DEMO-PKG-002'],

  // Customer information
  customers: {
    existing: {
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0123',
      address: {
        street: '123 Main St',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V6B 1A1',
        country: 'Canada',
      },
    },
    new: {
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1-555-0456',
      address: {
        street: '456 Oak Ave',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 3A8',
        country: 'Canada',
      },
    },
  },

  // Package data
  packages: [
    {
      trackingNumber: 'PKG-123456',
      status: 'in-transit',
      dimensions: { length: 12, width: 8, height: 6 },
      weight: 2.5,
      value: 150.0,
      shipper: 'ABC Corp',
      receiver: 'John Doe',
      destination: 'Vancouver, BC',
    },
    {
      trackingNumber: 'PKG-789012',
      status: 'delivered',
      dimensions: { length: 10, width: 10, height: 4 },
      weight: 1.8,
      value: 89.99,
      shipper: 'XYZ Ltd',
      receiver: 'Jane Smith',
      destination: 'Toronto, ON',
    },
  ],

  // Form validation data
  validation: {
    invalidEmails: ['invalid-email', '@domain.com', 'user@', 'user.domain', ''],
    validEmails: [
      'test@example.com',
      'user@domain.com',
      'first.last@company.co.uk',
      'admin@shipnorth.com',
    ],
    invalidPasswords: ['', '123', 'short'],
    validPasswords: ['password123', 'SecurePass!', 'myPassword2023'],
  },

  // API test data
  api: {
    endpoints: {
      auth: '/api/auth/login/',
      packages: '/api/packages',
      customers: '/api/customers',
      tracking: '/api/tracking',
      health: '/api/health',
    },
    validResponses: {
      health: { status: 'ok', timestamp: '2025-08-22T20:00:00.000Z' },
      auth: { token: 'mock-jwt-token', user: { id: 'test-user', role: 'staff' } },
    },
  },

  // Mobile viewport sizes
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1024, height: 768 },
    largeDesktop: { width: 1440, height: 900 },
  },

  // Theme testing
  themes: {
    light: 'light',
    dark: 'dark',
  },

  // File upload data
  files: {
    validImages: ['test-image.jpg', 'test-photo.png', 'sample-signature.svg'],
    invalidFiles: ['document.pdf', 'script.js', 'large-file.zip'],
  },

  // GPS coordinates for testing
  gpsCoordinates: {
    vancouver: { lat: 49.2827, lng: -123.1207 },
    toronto: { lat: 43.6532, lng: -79.3832 },
    montreal: { lat: 45.5017, lng: -73.5673 },
  },

  // Search queries
  searchQueries: {
    documentation: [
      'API authentication',
      'package tracking',
      'user management',
      'shipping rates',
      'error codes',
    ],
    packages: ['PKG-123456', 'in-transit', 'Vancouver', 'John Doe'],
  },

  // Performance thresholds (in milliseconds)
  performance: {
    pageLoad: 5000,
    apiResponse: 2000,
    userInteraction: 1000,
    imageLoad: 3000,
  },

  // Error messages
  errorMessages: {
    invalidCredentials: /Invalid credentials|Authentication failed|Login failed/i,
    networkError: /Network error|Connection failed|Server error/i,
    validation: /Required field|Invalid format|Please fill/i,
    notFound: /Not found|404|Does not exist/i,
  },

  // Accessibility test data
  accessibility: {
    requiredAttributes: ['aria-label', 'alt', 'title'],
    focusableElements: ['button', 'input', 'select', 'textarea', 'a[href]'],
    landmarks: ['main', 'nav', 'header', 'footer', 'aside'],
  },

  // Driver-specific test data
  driver: {
    routes: [
      {
        id: 'ROUTE-001',
        packages: ['PKG-123456', 'PKG-789012'],
        stops: ['123 Main St', '456 Oak Ave'],
        status: 'active',
      },
    ],
    signatures: [
      { type: 'delivery', required: true },
      { type: 'pickup', required: false },
    ],
  },

  // Admin test data
  admin: {
    users: [
      {
        email: 'newstaff@shipnorth.com',
        role: 'staff',
        status: 'active',
      },
      {
        email: 'newdriver@shipnorth.com',
        role: 'driver',
        status: 'pending',
      },
    ],
    systemSettings: {
      rateLimit: 200,
      sessionTimeout: 24,
      debugMode: false,
    },
  },

  // Common test utilities
  waitTimes: {
    short: 500,
    medium: 1000,
    long: 3000,
    veryLong: 10000,
  },

  // Test tags for categorization
  tags: {
    auth: '@auth',
    mobile: '@mobile',
    desktop: '@desktop',
    api: '@api',
    smoke: '@smoke',
    regression: '@regression',
    performance: '@performance',
    accessibility: '@accessibility',
  },
};

// Helper functions
export const generateTrackingNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `TEST-${timestamp}`;
};

export const generateCustomerEmail = (): string => {
  const timestamp = Date.now();
  return `test-customer-${timestamp}@example.com`;
};

export const getRandomPackage = () => {
  const packages = testData.packages;
  return packages[Math.floor(Math.random() * packages.length)];
};

export const getRandomViewport = () => {
  const viewports = Object.values(testData.viewports);
  return viewports[Math.floor(Math.random() * viewports.length)];
};

// Export as TestData for backward compatibility
export const TestData = testData;
