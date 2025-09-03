// Simple permission system for frontend that matches backend SimpleACL

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

interface SimpleUser {
  id: string;
  email: string;
  role: string;
  roles?: string[];
  customerId?: string;
}

export class ClientACL {
  /**
   * Check if user can perform action on resource
   */
  static can(user: SimpleUser | null, action: Action, resource: Resource, subject?: any): boolean {
    if (!user) return false;
    
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
  static canAccessPortal(user: SimpleUser | null, portal: 'staff' | 'driver' | 'customer'): boolean {
    if (!user) return false;
    
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
  static getAvailablePortals(user: SimpleUser | null): string[] {
    if (!user) return [];
    
    const portals: string[] = [];
    
    if (this.canAccessPortal(user, 'customer')) portals.push('customer');
    if (this.canAccessPortal(user, 'driver')) portals.push('driver');
    if (this.canAccessPortal(user, 'staff')) portals.push('staff');
    
    return portals;
  }

  /**
   * Check if user has admin access
   */
  static hasAdminAccess(user: SimpleUser | null): boolean {
    if (!user) return false;
    const roles = user.roles || [user.role];
    return roles.includes('admin');
  }

  // Resource-specific permission checks (simplified for frontend)
  private static checkPackagePermission(user: SimpleUser, action: Action, subject?: any): boolean {
    const roles = user.roles || [user.role];
    
    // Staff can manage all packages
    if (roles.includes('staff')) {
      return true;
    }
    
    // Customers can read their own packages
    if (roles.includes('customer') && action === Action.READ) {
      return true; // Frontend will get filtered results from API
    }
    
    // Drivers can read packages in their loads
    if (roles.includes('driver') && action === Action.READ) {
      return true; // Frontend will get filtered results from API
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
      return true;
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
      return true;
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
      return true;
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
        return true; // Backend will enforce admin user restriction
      }
    }
    
    // Users can read/update their own profile
    if (action === Action.READ || action === Action.UPDATE) {
      return true;
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
      return true;
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
      return true;
    }
    
    return false;
  }
}