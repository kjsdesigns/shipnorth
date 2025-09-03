export enum UserRole {
  Customer = 'customer',
  Driver = 'driver',
  Staff = 'staff',
  Admin = 'admin'
}

export enum Resource {
  Package = 'Package',
  Customer = 'Customer',
  Load = 'Load',
  Invoice = 'Invoice',
  User = 'User',
  Settings = 'Settings',
  Report = 'Report',
  Route = 'Route',
  Delivery = 'Delivery',
  AuditLog = 'AuditLog'
}

export enum Action {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Manage = 'manage' // Full CRUD
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole; // Legacy single role
  roles?: UserRole[]; // Multi-role support
  lastUsedPortal?: 'staff' | 'driver' | 'customer';
  availablePortals: string[];
  defaultPortal: string;
}

export interface Package {
  id: string;
  customerId: string;
  trackingNumber: string;
  status: string;
  recipient: {
    name: string;
    email: string;
  };
  loads?: {
    driverId: string;
  }[];
}

export interface Load {
  id: string;
  driverId: string;
  status: string;
  packages: Package[];
}

export interface RouteData {
  id: string;
  loadId: string;
  driverId: string;
  optimized: boolean;
}

export interface Delivery {
  id: string;
  packageId: string;
  loadId: string;
  driverId: string;
  status: string;
  deliveredAt?: Date;
  proofOfDelivery?: {
    signature?: string;
    photo?: string;
  };
}

export interface Invoice {
  id: string;
  customerId: string;
  packageIds: string[];
  amount: number;
  status: string;
}

export type Portal = 'customer' | 'driver' | 'staff';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: Action;
  resource: Resource;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}