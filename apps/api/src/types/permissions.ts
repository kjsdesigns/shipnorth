// Local copy of permission types for API
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
  Manage = 'manage'
}

export interface PermissionUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  roles?: UserRole[];
  lastUsedPortal?: 'staff' | 'driver' | 'customer';
  availablePortals: string[];
  defaultPortal: string;
}

export interface Package {
  id: string;
  customerId: string;
  trackingNumber: string;
  status: string;
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

export interface Invoice {
  id: string;
  customerId: string;
  packageIds: string[];
  amount: number;
  status: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: Action;
  resource: Resource;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
  createdAt: Date;
}