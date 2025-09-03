'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  roles?: string[];
  lastUsedPortal?: 'staff' | 'driver' | 'customer';
  availablePortals: string[];
  defaultPortal: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (err) {
      console.error('Error loading user from storage:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const result = await response.json();
      const userData = result.user;
      const userToken = result.token || result.accessToken;

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userToken);

      setUser(userData);
      setToken(userToken);

      // Auto-redirect to appropriate portal  
      const availablePortals = userData.availablePortals || [];
      const defaultPortal = userData.defaultPortal || userData.lastUsedPortal || availablePortals[0] || 'customer';
      
      const portalUrls = {
        customer: '/portal',
        staff: '/staff',
        driver: '/driver',
        admin: '/staff'
      };
      
      const redirectUrl = portalUrls[defaultPortal as keyof typeof portalUrls] || '/portal';
      
      // Use proper navigation - check if running in test environment
      if (typeof window !== 'undefined') {
        // For tests, use a more reliable navigation method
        console.log(`Navigating to portal: ${redirectUrl}`);
        
        // Validate the URL exists before navigating
        const validUrls = ['/portal', '/staff', '/driver'];
        const targetUrl = validUrls.includes(redirectUrl) ? redirectUrl : '/portal';
        
        // Use window.location.replace for more reliable navigation in tests
        window.location.replace(targetUrl);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const isAuthenticated = !!user && !!token;

  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    const roles = user.roles || [user.role];
    return roles.includes(role);
  }, [user]);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}