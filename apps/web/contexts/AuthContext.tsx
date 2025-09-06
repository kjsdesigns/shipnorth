'use client';

import React, { createContext, useContext } from 'react';
import { useServerSession } from '@/hooks/useServerSession';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  roles?: string[];
  firstName?: string;
  lastName?: string;
  lastUsedPortal?: 'staff' | 'driver' | 'customer';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  validateSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * 🛡️ AuthProvider - Authentication Agent Compliant
 * SINGLE SOURCE OF TRUTH using HTTP-only cookies via useServerSession
 * NO localStorage, NO multiple auth systems
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const serverSession = useServerSession();

  const value: AuthContextType = {
    user: serverSession.user,
    loading: serverSession.loading,
    error: serverSession.error,
    login: serverSession.login,
    logout: serverSession.logout,
    isAuthenticated: serverSession.isAuthenticated,
    hasRole: serverSession.hasRole,
    validateSession: serverSession.validateSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 🛡️ useAuth - Authentication Agent Compliant
 * Wrapper around server-side session management
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}