'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalAccess } from '@/hooks/usePermissions';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { getDefaultPortal } = usePortalAccess();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      
      // Get user's default portal and redirect
      const defaultPortal = getDefaultPortal();
      const redirectPath = `/${defaultPortal}`;
      
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (userType: string, credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      await login(credentials.email, credentials.password);
      
      // Redirect based on user type
      const redirectPaths = {
        customer: '/portal',
        staff: '/staff', 
        admin: '/staff',
        driver: '/driver'
      };
      
      router.push(redirectPaths[userType as keyof typeof redirectPaths] || '/portal');
    } catch (err: any) {
      setError(`${userType} login failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Quick login buttons for testing */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">Quick login for testing:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => quickLogin('customer', { email: 'test@test.com', password: 'test123' })}
            className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            disabled={isLoading}
          >
            Customer
          </button>
          <button
            onClick={() => quickLogin('staff', { email: 'staff@shipnorth.com', password: 'staff123' })}
            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            disabled={isLoading}
          >
            Staff
          </button>
          <button
            onClick={() => quickLogin('driver', { email: 'driver@shipnorth.com', password: 'driver123' })}
            className="px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            disabled={isLoading}
          >
            Driver
          </button>
          <button
            onClick={() => quickLogin('admin', { email: 'admin@shipnorth.com', password: 'admin123' })}
            className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            disabled={isLoading}
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}