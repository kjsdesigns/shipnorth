'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Eye, EyeOff, Truck } from 'lucide-react';

export default function DriverLogin() {
  const router = useRouter();
  const { login, error: authError, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'Driver Portal - Login';
  }, []);

  // Helper function to provide better error messages
  const getErrorMessage = (err: any): string => {
    // If error message comes directly from server (via useServerSession)
    if (typeof err === 'object' && err.message) {
      const message = err.message;
      
      // Check for specific authentication errors
      if (message.includes('Invalid credentials') || message.includes('Login failed')) {
        return 'Invalid email or password. Please check your credentials and try again.';
      }
      
      if (message.includes('Account disabled') || message.includes('forbidden')) {
        return 'Access forbidden. Your account may be disabled or you do not have driver permissions.';
      }
      
      // If it's a server error message, return it directly
      return message;
    }
    
    // Network/connection errors
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      return 'Unable to connect to server. Please check if the server is running and try again.';
    }

    if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Check for fetch-related network errors (TypeError for network failures)
    if (err instanceof TypeError && err.message.includes('fetch')) {
      return 'Cannot reach the server. The server may be down. Please try again later.';
    }

    // HTTP status-based errors
    const status = err.response?.status;
    const serverMessage = err.response?.data?.error;

    if (status) {
      switch (status) {
        case 401:
          return serverMessage || 'Invalid email or password. Please check your credentials.';
        case 403:
          return 'Access forbidden. You do not have driver permissions or your account may be disabled.';
        case 500:
          return 'Server error occurred. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'Server is temporarily unavailable. Please try again in a few moments.';
        default:
          return serverMessage || 'Login failed. Please try again.';
      }
    }

    // Fallback for unknown errors
    return typeof err === 'string' ? err : 'Login failed. Please try again.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext handles redirect automatically to appropriate portal
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Driver Portal</h1>
          <p className="text-gray-600">Sign in to manage your deliveries</p>
        </div>

        {/* Error Message */}
        {(error || authError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error || authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-gray-500"
              placeholder="driver@shipnorth.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-gray-500"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

          {/* Quick Login (Demo) */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2 font-medium">Demo Driver Account:</p>
            <button
              type="button"
              onClick={() => {
                setEmail('driver@shipnorth.com');
                setPassword('driver123');
              }}
              disabled={loading || authLoading}
              className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use demo credentials
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || authLoading}
            className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
              (loading || authLoading)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            }`}
          >
            {(loading || authLoading) ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Truck className="h-5 w-5 mr-2" />
                Sign In to Driver Portal
              </div>
            )}
          </button>
        </form>

        {/* Emergency Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">Need help?</p>
          <a
            href="tel:+1-800-SHIPNTH"
            className="text-blue-600 hover:text-blue-800 font-medium text-lg"
          >
            📞 1-800-SHIPNTH
          </a>
        </div>
      </div>
    </div>
  );
}
