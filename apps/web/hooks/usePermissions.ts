'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAbility } from '@/contexts/AbilityContext';

export function usePermissions() {
  const { ability, isLoading } = useAbility();
  
  const can = (action: string, resource: string, subject?: any) => {
    if (isLoading) return false;
    return ability.can(action, subject || resource);
  };
  
  const cannot = (action: string, resource: string, subject?: any) => {
    if (isLoading) return false;
    return ability.cannot(action, subject || resource);
  };
  
  return { can, cannot, ability, isLoading };
}

// Portal access hook using CASL
export function usePortalAccess() {
  const { user, loading } = useAuth();
  const { ability, isLoading: abilityLoading } = useAbility();
  
  const isLoading = loading || abilityLoading;
  
  const canAccessPortal = (portal: 'staff' | 'driver' | 'customer') => {
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
  };
  
  const availablePortals = () => {
    if (!user) return [];
    
    const portals: string[] = [];
    if (canAccessPortal('customer')) portals.push('customer');
    if (canAccessPortal('driver')) portals.push('driver');
    if (canAccessPortal('staff')) portals.push('staff');
    
    return portals;
  };
  
  const hasAdminAccess = () => {
    if (!user) return false;
    const roles = user.roles || [user.role];
    return roles.includes('admin');
  };
  
  const getDefaultPortal = () => {
    if (!user) return 'customer';
    const roles = user.roles || [user.role];
    if (roles.includes('admin') || roles.includes('staff')) return 'staff';
    if (roles.includes('driver')) return 'driver';
    return 'customer';
  };
  
  return { 
    canAccessPortal, 
    availablePortals, 
    hasAdminAccess,
    currentPortal: user?.lastUsedPortal || getDefaultPortal(),
    isLoading
  };
}

// Convenience hooks for common CASL operations
export function useCanRead(resource: string, subject?: any) {
  const { can, isLoading } = usePermissions();
  if (isLoading) return false;
  return can('read', resource, subject);
}

export function useCanCreate(resource: string, subject?: any) {
  const { can, isLoading } = usePermissions();
  if (isLoading) return false;
  return can('create', resource, subject);
}

export function useCanUpdate(resource: string, subject?: any) {
  const { can, isLoading } = usePermissions();
  if (isLoading) return false;
  return can('update', resource, subject);
}

export function useCanDelete(resource: string, subject?: any) {
  const { can, isLoading } = usePermissions();
  if (isLoading) return false;
  return can('delete', resource, subject);
}

export function useCanManage(resource: string, subject?: any) {
  const { can, isLoading } = usePermissions();
  if (isLoading) return false;
  return can('manage', resource, subject);
}

// Multi-role checking hooks
export function useHasRole(role: string) {
  const { user } = useAuth();
  if (!user) return false;
  
  const roles = user.roles || [user.role];
  return roles.includes(role);
}

export function useIsAdmin() {
  return useHasRole('admin');
}

export function useIsStaff() {
  const isStaff = useHasRole('staff');
  const isAdmin = useHasRole('admin');
  return isStaff || isAdmin;
}

export function useIsDriver() {
  return useHasRole('driver');
}

export function useIsCustomer() {
  return useHasRole('customer');
}