'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;
  customerId?: string;
  hasAdminAccess?: boolean;
  availablePortals?: string[];
  defaultPortal?: string;
  lastUsedPortal?: 'staff' | 'driver' | 'customer';
}

/**
 * Future-Proof Server-Side Session Hook
 * Zero client-side storage, all validation server-side
 */
export function useServerSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Validate current session with server
  const validateSession = useCallback(async (): Promise<User | null> => {
    try {
      // Use Next.js API proxy for same-origin session validation
      const response = await fetch(`/api/auth/session`, {
        method: 'GET',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json',
          // Test mode headers for development
          ...(process.env.NODE_ENV === 'development' && {
            'x-test-mode': 'true',
            'x-test-role': 'staff' // Default test role
          })
        }
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        console.log('✅ SERVER SESSION: Valid session found');
        return sessionData.user;
      }
      
      if (response.status === 401) {
        console.log('❌ SERVER SESSION: No valid session');
        return null;
      }
      
      throw new Error(`Session validation failed: ${response.status}`);
      
    } catch (err: any) {
      console.error('❌ SERVER SESSION: Validation error:', err);
      return null;
    }
  }, []);

  // Login with server-side session creation
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        credentials: 'include', // Enable cookie setting
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const result = await response.json();
      setUser(result.user);
      
      // Server sets HTTP-only session cookie automatically
      console.log('✅ SERVER SESSION: Login successful');
      
      // Redirect to appropriate portal
      const defaultPortal = result.user.defaultPortal || result.user.availablePortals?.[0] || 'customer';
      const portalUrls = {
        customer: '/portal/',
        staff: '/staff/',
        driver: '/driver/',
        admin: '/staff/'
      };
      
      const redirectUrl = portalUrls[defaultPortal as keyof typeof portalUrls] || '/portal/';
      router.push(redirectUrl);
      
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Logout with server-side session clearing
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      setError(null);
      router.push('/login/');
      
      console.log('✅ SERVER SESSION: Logout successful');
      
    } catch (err) {
      console.error('❌ SERVER SESSION: Logout error:', err);
      // Force logout anyway
      setUser(null);
      router.push('/login/');
    }
  }, [router]);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionUser = await validateSession();
        setUser(sessionUser);
      } catch (err: any) {
        console.error('❌ SERVER SESSION: Init failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [validateSession]);

  // Helper functions
  const hasRole = useCallback((role: string): boolean => {
    return user?.roles?.includes(role) || user?.role === role || false;
  }, [user]);

  const requiresAuth = useCallback((requiredRoles?: string[]): boolean => {
    if (!user) return true;
    if (!requiredRoles) return false;
    return !requiredRoles.some(role => hasRole(role));
  }, [user, hasRole]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    requiresAuth,
    validateSession,
    isAuthenticated: !!user,
    // Test helpers
    isTestMode: process.env.NODE_ENV === 'development'
  };
}

export default useServerSession;