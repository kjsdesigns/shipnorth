// Core domain types
export interface Address {
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface LocationTracking {
  lat: number;
  lng: number;
  timestamp: string;
  address?: string;
  isManual: boolean;
  addedBy?: string;
}

export interface DeliveryConfirmation {
  deliveredAt: string;
  photoUrl?: string;
  signature?: string;
  recipientName?: string;
  relationship?: string;
  confirmedBy: string;
}

// Entity interfaces
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  status: CustomerStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Package {
  id: string;
  customerId: string;
  receivedDate: string;
  departureDate?: string;
  estimatedDeliveryDate?: string;
  deliveryDate?: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  loadId?: string;
  quotedCarrier?: string;
  quotedService?: string;
  quotedRate?: number;
  labelStatus: LabelStatus;
  carrier?: string;
  trackingNumber?: string;
  labelUrl?: string;
  barcode?: string;
  price?: number;
  paymentStatus: PaymentStatus;
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paymentUrl?: string;
  shippingCost?: number;
  paidAt?: string;
  shipmentStatus: ShipmentStatus;
  shipTo: Address;
  notes?: string;
  deliveryConfirmation?: DeliveryConfirmation;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoadDeliveryCity {
  city: string;
  province: string;
  country: string;
  expectedDeliveryDate?: string;
  distance?: number;
  drivingDuration?: number;
}

export interface Load {
  id: string;
  departureDate: string;
  defaultDeliveryDate?: string;
  deliveryCities: LoadDeliveryCity[];
  transportMode: TransportMode;
  carrierOrTruck?: string;
  vehicleId?: string;
  driverName?: string;
  driverId?: string;
  originAddress?: string;
  notes?: string;
  status: LoadStatus;
  totalPackages?: number;
  totalWeight?: number;
  manifestUrl?: string;
  currentLocation?: LocationTracking;
  locationHistory: LocationTracking[];
  routeOptimized?: boolean;
  estimatedDistance?: number;
  estimatedDuration?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  id: 'system';
  defaultOriginAddress: Address;
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    webhookUrl?: string;
  };
  googleMapsApiKey?: string;
  stripeSettings: {
    publishableKey: string;
    webhookSecret: string;
  };
  updatedAt?: string;
}

// Enums and status types
export type UserRole = 'customer' | 'staff' | 'admin' | 'driver';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type CustomerStatus = 'active' | 'inactive' | 'onhold';
export type LabelStatus = 'unlabeled' | 'quoted' | 'purchased' | 'void_requested' | 'voided';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded' | 'writeoff';
export type ShipmentStatus = 'ready' | 'in_transit' | 'delivered' | 'exception' | 'returned';
export type LoadStatus = 'planned' | 'in_transit' | 'delivered' | 'complete';
export type TransportMode = 'truck' | 'rail' | 'air' | 'sea';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Route optimization types
export interface RouteWaypoint {
  city: string;
  province: string;
  country: string;
  address?: string;
}

export interface RouteOptimizationResult {
  optimizedOrder: number[];
  totalDistance: number;
  totalDuration: number;
  waypoints: Array<{
    city: string;
    province: string;
    country: string;
    distance: number;
    duration: number;
    order: number;
  }>;
}

// Notification types
export interface NotificationData {
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  packageTrackingNumber: string;
  status: string;
  expectedDeliveryDate?: string;
  currentLocation?: string;
  deliveryConfirmation?: DeliveryConfirmation;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  loading: boolean;
  touched: Record<string, boolean>;
}

// Map-related types
export interface MapMarker {
  position: { lat: number; lng: number };
  title: string;
  type: 'current' | 'destination' | 'waypoint';
  id?: string;
}

export interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarker[];
  interactive: boolean;
}

// Statistics types
export interface PackageStats {
  unassigned: number;
  assigned: number;
  in_transit: number;
  delivered: number;
  total: number;
}

export interface LoadStats {
  planned: number;
  in_transit: number;
  delivered: number;
  complete: number;
  total: number;
}

export interface DashboardStats {
  packages: PackageStats;
  loads: LoadStats;
  customers: {
    total: number;
    active: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}