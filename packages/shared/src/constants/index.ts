// Status constants
export const USER_ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff', 
  ADMIN: 'admin',
  DRIVER: 'driver',
} as const;

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export const CUSTOMER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_HOLD: 'onhold',
} as const;

export const LABEL_STATUSES = {
  UNLABELED: 'unlabeled',
  QUOTED: 'quoted',
  PURCHASED: 'purchased',
  VOID_REQUESTED: 'void_requested',
  VOIDED: 'voided',
} as const;

export const PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  WRITEOFF: 'writeoff',
} as const;

export const SHIPMENT_STATUSES = {
  READY: 'ready',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  EXCEPTION: 'exception',
  RETURNED: 'returned',
} as const;

export const LOAD_STATUSES = {
  PLANNED: 'planned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETE: 'complete',
} as const;

export const TRANSPORT_MODES = {
  TRUCK: 'truck',
  RAIL: 'rail',
  AIR: 'air',
  SEA: 'sea',
} as const;

// Configuration constants
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 50,
  MAX_LIMIT: 500,
} as const;

export const GPS_TRACKING = {
  INTERVAL_MS: 300000, // 5 minutes
  HIGH_ACCURACY: true,
  TIMEOUT_MS: 10000,
  MAX_AGE_MS: 300000,
} as const;

export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook',
} as const;

// Validation constants
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  POSTAL_CODE_CA_REGEX: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  POSTAL_CODE_US_REGEX: /^\d{5}(-\d{4})?$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE_MB: 10,
} as const;

// UI constants
export const THEME_COLORS = {
  BLUE: 'blue',
  GREEN: 'green',
  ORANGE: 'orange',
  PURPLE: 'purple',
  RED: 'red',
  GRAY: 'gray',
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

// Business rules
export const BUSINESS_RULES = {
  SESSION_DURATION_HOURS: 24,
  REFRESH_TOKEN_DAYS: 30,
  TRACKING_UPDATE_INTERVAL_MINUTES: 5,
  MAX_PACKAGE_WEIGHT_KG: 50,
  MIN_PACKAGE_DIMENSIONS_CM: 1,
  MAX_PACKAGE_DIMENSIONS_CM: 200,
  DEFAULT_DELIVERY_TIME: '17:00:00',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  CUSTOMERS: {
    LIST: '/customers',
    GET: '/customers/:id',
    CREATE: '/customers',
    UPDATE: '/customers/:id',
    DELETE: '/customers/:id',
    REGISTER: '/customers/register',
    COMPLETE_REGISTRATION: '/customers/complete-registration',
    IMPORT: '/customers/import',
    PACKAGES: '/customers/:id/packages',
    INVOICES: '/customers/:id/invoices',
  },
  PACKAGES: {
    LIST: '/packages',
    GET: '/packages/:id',
    CREATE: '/packages',
    UPDATE: '/packages/:id',
    DELETE: '/packages/:id',
    STATS: '/packages/stats/overview',
    BULK_ASSIGN: '/packages/bulk-assign',
    MARK_DELIVERED: '/packages/:id/mark-delivered',
    QUOTE: '/packages/:id/quote',
    PURCHASE_LABEL: '/packages/:id/purchase-label',
  },
  LOADS: {
    LIST: '/loads',
    GET: '/loads/:id',
    CREATE: '/loads',
    UPDATE: '/loads/:id',
    DELETE: '/loads/:id',
    ASSIGN_PACKAGES: '/loads/:id/assign-packages',
    UPDATE_CITIES: '/loads/:id/delivery-cities',
    ADD_LOCATION: '/loads/:id/location',
    GET_LOCATIONS: '/loads/:id/locations',
    MANIFEST: '/loads/:id/manifest',
  },
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
    ORIGIN_ADDRESS: '/settings/origin-address',
  },
} as const;