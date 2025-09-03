'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAbility } from '@/contexts/AbilityContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  portal?: 'staff' | 'driver' | 'customer';
  requireAction?: string;
  requireResource?: string;
  fallbackUrl?: string;
  loadingComponent?: React.ReactNode;
}

import { LoadingPage } from '@/components/ui/LoadingSpinner';

function LoadingSpinner() {
  return <LoadingPage message="Checking permissions..." />;
}

export function ProtectedRoute({
  children,
  portal,
  requireAction,
  requireResource,
  fallbackUrl = '/unauthorized',
  loadingComponent = <LoadingSpinner />
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { ability, isLoading: abilityLoading } = useAbility();
  
  const isLoading = authLoading || abilityLoading;

  // Portal access check helper
  const canAccessPortal = (userToCheck: any, targetPortal: string) => {
    if (!userToCheck) return false;
    const roles = userToCheck.roles || [userToCheck.role];
    
    switch (targetPortal) {
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user && !isLoading) {
      // Check portal access
      if (portal && !canAccessPortal(user, portal)) {
        router.push(fallbackUrl);
        return;
      }
      
      // Check specific permission
      if (requireAction && requireResource) {
        if (!ability.can(requireAction, requireResource)) {
          router.push(fallbackUrl);
          return;
        }
      }
    }
  }, [user, isLoading, isAuthenticated, portal, requireAction, requireResource, ability, router, fallbackUrl]);
  
  if (isLoading) {
    return <>{loadingComponent}</>;
  }
  
  if (!isAuthenticated) {
    return null;
  }

  // Final checks before rendering
  if (portal && !canAccessPortal(user, portal)) {
    return null;
  }

  if (requireAction && requireResource && !ability.can(requireAction, requireResource)) {
    return null;
  }
  
  return <>{children}</>;
}

// Higher-order component version
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Specific portal protection components
export function StaffOnlyRoute({ children, ...props }: Omit<ProtectedRouteProps, 'portal'>) {
  return (
    <ProtectedRoute portal="staff" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function DriverOnlyRoute({ children, ...props }: Omit<ProtectedRouteProps, 'portal'>) {
  return (
    <ProtectedRoute portal="driver" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function CustomerOnlyRoute({ children, ...props }: Omit<ProtectedRouteProps, 'portal'>) {
  return (
    <ProtectedRoute portal="customer" {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Admin-only route (staff portal + admin permissions)
export function AdminOnlyRoute({ children, ...props }: Omit<ProtectedRouteProps, 'portal' | 'requireAction' | 'requireResource'>) {
  return (
    <ProtectedRoute 
      portal="staff" 
      requireAction="manage" 
      requireResource="Settings"
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}