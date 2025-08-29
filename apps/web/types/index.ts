// Core entity interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'staff' | 'admin' | 'driver';
  status: 'active' | 'inactive';
  phone?: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  status: 'active' | 'inactive';
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Package {
  id: string;
  customerId: string;
  customer?: Customer;
  recipientName: string;
  recipientAddress: Address;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  status: 'pending' | 'quoted' | 'labeled' | 'shipped' | 'delivered' | 'cancelled';
  loadId?: string;
  load?: Load;
  trackingNumber?: string;
  carrierService?: string;
  labelCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Load {
  id: string;
  driverId?: string;
  driver?: User;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  packageIds: string[];
  packages?: Package[];
  originAddress: Address;
  deliveryCities: string[];
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  estimatedDelivery?: string;
  actualDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  customer?: Customer;
  packageId: string;
  package?: Package;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId?: string;
  refundId?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface PackageFormData {
  customerId: string;
  recipientName: string;
  recipientAddress: {
    name: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  weight: string;
  length: string;
  width: string;
  height: string;
  notes: string;
}

// Hook state types
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseDataTableState<T> {
  items: T[];
  filteredItems: T[];
  searchQuery: string;
  selectedIds: Set<string>;
  sortField: keyof T | null;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Error types
export interface FormError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}
