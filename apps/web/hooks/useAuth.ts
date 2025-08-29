import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { User } from '@/types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  requireAuth: (allowedRoles?: string[]) => boolean;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize user from localStorage on mount
  useEffect(() => {
    try {
      const currentUser = authAPI.getCurrentUser();
      setUser(currentUser);
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
      const result = await authAPI.login(email, password);
      setUser(result.user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authAPI.register(data);
      setUser(result.user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    authAPI.logout();
  }, []);

  const requireAuth = useCallback(
    (allowedRoles?: string[]): boolean => {
      if (!user) {
        router.push('/login');
        return false;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/login');
        return false;
      }

      return true;
    },
    [user, router]
  );

  const isAuthenticated = !!user;

  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.role === role;
    },
    [user]
  );

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    requireAuth,
    isAuthenticated,
    hasRole,
  };
}
