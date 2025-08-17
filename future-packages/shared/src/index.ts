// Export all types
export * from './types';
export * from './constants';

// Export specific commonly used items
export {
  type Customer,
  type Package,
  type Load,
  type User,
  type Address,
  type LocationTracking,
  type DeliveryConfirmation,
  type ApiResponse,
  type PackageStats,
  type LoadStats,
  type DashboardStats,
} from './types';

export {
  USER_ROLES,
  SHIPMENT_STATUSES,
  LOAD_STATUSES,
  PAYMENT_STATUSES,
  PAGINATION_DEFAULTS,
  API_ENDPOINTS,
  ERROR_CODES,
  BUSINESS_RULES,
} from './constants';