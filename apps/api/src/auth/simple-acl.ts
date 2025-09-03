// Simple ACL implementation that works with existing Shipnorth user system
// This provides the foundation that can be enhanced to full CASL later

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage'
}

export enum Resource {
  PACKAGE = 'Package',
  CUSTOMER = 'Customer',
  LOAD = 'Load',
  INVOICE = 'Invoice',
  USER = 'User',
  SETTINGS = 'Settings',
  REPORT = 'Report',
  ROUTE = 'Route',
  DELIVERY = 'Delivery',
  AUDIT_LOG = 'AuditLog'
}

// Work with existing user type from AuthRequest
interface SimpleUser {
  id: string;
  email: string;
  role: 'customer' | 'staff' | 'admin' | 'driver';
  roles?: string[];
  customerId?: string;
  lastUsedPortal?: string;
}

export class SimpleACL {
  /**
   * Check if user can perform action on resource
   */
  static can(user: SimpleUser, action: Action, resource: Resource, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Admin can do everything
    if (roles.includes('admin')) {
      return true;
    }
    
    // Resource-specific permissions
    switch (resource) {
      case Resource.PACKAGE:
        return this.checkPackagePermission(user, action, subject);
      
      case Resource.CUSTOMER:
        return this.checkCustomerPermission(user, action, subject);
      
      case Resource.LOAD:
        return this.checkLoadPermission(user, action, subject);
      
      case Resource.INVOICE:
        return this.checkInvoicePermission(user, action, subject);
      
      case Resource.USER:
        return this.checkUserPermission(user, action, subject);
      
      case Resource.SETTINGS:
        return roles.includes('admin');
      
      case Resource.REPORT:
        return roles.includes('staff') || roles.includes('admin');
      
      case Resource.ROUTE:
        return this.checkRoutePermission(user, action, subject);
      
      case Resource.DELIVERY:
        return this.checkDeliveryPermission(user, action, subject);
      
      case Resource.AUDIT_LOG:
        return roles.includes('admin');
      
      default:
        return false;
    }
  }

  /**
   * Check portal access
   */
  static canAccessPortal(user: SimpleUser, portal: 'staff' | 'driver' | 'customer'): boolean {
    const roles = user.roles || [user.role];
    
    switch (portal) {
      case 'customer':
        return roles.includes('customer');
      case 'driver':
        return roles.includes('driver');
      case 'staff':
        return roles.includes('staff') || roles.includes('admin');
      default:
        return false;
    }
  }

  /**
   * Get available portals for user
   */
  static getAvailablePortals(user: SimpleUser): string[] {
    const portals: string[] = [];
    
    if (this.canAccessPortal(user, 'customer')) portals.push('customer');
    if (this.canAccessPortal(user, 'driver')) portals.push('driver');
    if (this.canAccessPortal(user, 'staff')) portals.push('staff');
    
    return portals;
  }

  // Resource-specific permission checks
  private static checkPackagePermission(user: SimpleUser, action: Action, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Staff can manage all packages
    if (roles.includes('staff')) {
      return true;
    }
    
    // Customers can read their own packages
    if (roles.includes('customer') && action === Action.READ) {
      return !subject || subject.customerId === user.customerId || subject.customer_id === user.customerId;
    }
    
    // Drivers can read packages in their loads
    if (roles.includes('driver') && action === Action.READ) {
      return !subject || (subject.loads && subject.loads.some((load: any) => load.driverId === user.id));
    }
    
    return false;
  }

  private static checkCustomerPermission(user: SimpleUser, action: Action, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Staff can manage all customers
    if (roles.includes('staff')) {
      return true;
    }
    
    // Customers can read/update their own profile
    if (roles.includes('customer') && (action === Action.READ || action === Action.UPDATE)) {
      return !subject || subject.id === user.customerId;
    }
    
    return false;
  }

  private static checkLoadPermission(user: SimpleUser, action: Action, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Staff can manage all loads
    if (roles.includes('staff')) {
      return true;
    }
    
    // Drivers can read/update their assigned loads
    if (roles.includes('driver') && (action === Action.READ || action === Action.UPDATE)) {
      return !subject || subject.driverId === user.id;
    }
    
    return false;
  }

  private static checkInvoicePermission(user: SimpleUser, action: Action, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Staff can manage all invoices
    if (roles.includes('staff')) {
      return true;
    }
    
    // Customers can read their own invoices
    if (roles.includes('customer') && action === Action.READ) {
      return !subject || subject.customerId === user.customerId;
    }
    
    return false;
  }

  private static checkUserPermission(user: SimpleUser, action: Action, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Admin can manage all users
    if (roles.includes('admin')) {
      return true;
    }
    
    // Staff can read users and manage non-admin users
    if (roles.includes('staff')) {
      if (action === Action.READ) return true;
      if ((action === Action.CREATE || action === Action.UPDATE || action === Action.DELETE)) {
        return !subject || subject.role !== 'admin';
      }
    }
    
    // Users can read/update their own profile
    if (action === Action.READ || action === Action.UPDATE) {
      return !subject || subject.id === user.id;
    }
    
    return false;
  }

  private static checkRoutePermission(user: SimpleUser, action: Action, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Staff can manage all routes
    if (roles.includes('staff')) {
      return true;
    }
    
    // Drivers can manage routes for their loads
    if (roles.includes('driver')) {
      return !subject || subject.driverId === user.id;
    }
    
    return false;
  }

  private static checkDeliveryPermission(user: SimpleUser, action: Action, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Staff can manage all deliveries
    if (roles.includes('staff')) {
      return true;
    }
    
    // Drivers can manage deliveries for their packages
    if (roles.includes('driver')) {
      return !subject || subject.driverId === user.id;
    }
    
    return false;
  }
}