import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

// Use CASL's recommended approach - let it infer the types
type AppAbility = MongoAbility;

// User interface matching existing Shipnorth user
interface CASLUser {
  id: string;
  email: string;
  role: string;
  roles?: string[];
  customerId?: string;
}

export function defineAbilityFor(user: CASLUser): AppAbility {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
  
  // Get all roles (support both legacy and multi-role)
  const roles = user.roles || [user.role];
  
  // Customer permissions
  if (roles.includes('customer')) {
    can('read', 'Package', { customerId: user.customerId });
    can('read', 'Invoice', { customerId: user.customerId });
    can('read', 'Customer', { id: user.customerId });
    can('update', 'Customer', { id: user.customerId });
    can('read', 'User', { id: user.id });
    can('update', 'User', { id: user.id });
  }
  
  // Driver permissions
  if (roles.includes('driver')) {
    can('read', 'Load', { driverId: user.id });
    can('update', 'Load', { driverId: user.id });
    can('read', 'Package', { 'load.driverId': user.id });
    can('read', 'Route', { driverId: user.id });
    can('update', 'Route', { driverId: user.id });
    can('create', 'Route', { driverId: user.id });
    can('read', 'Delivery', { driverId: user.id });
    can('update', 'Delivery', { driverId: user.id });
    can('create', 'Delivery', { driverId: user.id });
    can('read', 'User', { id: user.id });
    can('update', 'User', { id: user.id });
  }
  
  // Staff permissions
  if (roles.includes('staff')) {
    can('manage', 'Package');
    can('manage', 'Customer');
    can('manage', 'Load');
    can('manage', 'Invoice');
    can('manage', 'Route');
    can('manage', 'Delivery');
    can('read', 'Report');
    can('read', 'User');
    can('create', 'User');
    can('update', 'User', { role: { $ne: 'admin' } });
    can('delete', 'User', { role: { $ne: 'admin' } });
  }
  
  // Admin permissions (overlay on staff)
  if (roles.includes('admin')) {
    can('manage', 'all');
  }
  
  return build();
}

// Portal access helpers
export function canAccessPortal(user: CASLUser, portal: 'staff' | 'driver' | 'customer'): boolean {
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

export function getAvailablePortals(user: CASLUser): string[] {
  const portals: string[] = [];
  
  if (canAccessPortal(user, 'customer')) portals.push('customer');
  if (canAccessPortal(user, 'driver')) portals.push('driver');
  if (canAccessPortal(user, 'staff')) portals.push('staff');
  
  return portals;
}