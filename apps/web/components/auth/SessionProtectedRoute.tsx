'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useServerSession from '@/hooks/useServerSession';

interface SessionProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Server-Session Protected Route Component
 * Uses server-side session validation with graceful fallbacks
 */
export function SessionProtectedRoute({
  children,
  requiredRole,
  fallback,
  redirectTo = '/login/'
}: SessionProtectedRouteProps) {
  const { user, loading, hasRole, isTestMode } = useServerSession();
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Test mode always allows access
    if (isTestMode) {
      console.log('🧪 PROTECTED ROUTE: Test mode - access granted');
      setAuthorized(true);
      return;
    }

    // Check authentication
    if (!user) {
      console.log('❌ PROTECTED ROUTE: No authenticated user');
      router.push(redirectTo);
      return;
    }

    // Check role authorization
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const hasRequiredRole = roles.some(role => hasRole(role));
      
      if (!hasRequiredRole) {
        console.log(`❌ PROTECTED ROUTE: User lacks required role(s): ${roles.join(', ')}`);
        router.push(redirectTo);
        return;
      }
    }

    console.log('✅ PROTECTED ROUTE: Access granted');
    setAuthorized(true);
  }, [user, loading, hasRole, isTestMode, requiredRole, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 dark:text-gray-300">Validating session...</div>
        </div>
      </div>
    );
  }

  // Show fallback if not authorized
  if (!authorized) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            Authentication required
          </div>
          <a
            href={redirectTo}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

// Convenience components for specific roles
export function StaffProtectedRoute({ children, ...props }: Omit<SessionProtectedRouteProps, 'requiredRole'>) {
  return (
    <SessionProtectedRoute requiredRole={['staff', 'admin']} {...props}>
      {children}
    </SessionProtectedRoute>
  );
}

export function CustomerProtectedRoute({ children, ...props }: Omit<SessionProtectedRouteProps, 'requiredRole'>) {
  return (
    <SessionProtectedRoute requiredRole="customer" {...props}>
      {children}
    </SessionProtectedRoute>
  );
}

export function DriverProtectedRoute({ children, ...props }: Omit<SessionProtectedRouteProps, 'requiredRole'>) {
  return (
    <SessionProtectedRoute requiredRole="driver" {...props}>
      {children}
    </SessionProtectedRoute>
  );
}

export default SessionProtectedRoute;