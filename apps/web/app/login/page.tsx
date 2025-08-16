'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Package, Truck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await authAPI.login(email, password);
      
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'staff') {
        router.push('/staff');
      } else if (user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/portal');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Quick login buttons for demo
  const quickLogin = async (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError('');
    setLoading(true);
    
    try {
      const { user } = await authAPI.login(email, password);
      
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'staff') {
        router.push('/staff');
      } else if (user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/portal');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 relative">
      <ThemeToggle className="absolute top-4 right-4" />
      
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="flex items-center group transition-transform hover:scale-105">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Shipnorth
              </h1>
            </Link>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Welcome back</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New customer?{' '}
              <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                Create an account
              </Link>
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center font-medium">Quick Login (Demo)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin('admin@shipnorth.com', 'admin123')}
                disabled={loading}
                className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 text-sm font-medium transition-all duration-200 border border-purple-200 dark:border-purple-800 disabled:opacity-50"
              >
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Admin
                </div>
              </button>
              <button
                onClick={() => quickLogin('staff@shipnorth.com', 'staff123')}
                disabled={loading}
                className="px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 text-sm font-medium transition-all duration-200 border border-green-200 dark:border-green-800 disabled:opacity-50"
              >
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Staff
                </div>
              </button>
              <button
                onClick={() => quickLogin('driver@shipnorth.com', 'driver123')}
                disabled={loading}
                className="px-4 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 text-sm font-medium transition-all duration-200 border border-orange-200 dark:border-orange-800 disabled:opacity-50"
              >
                <div className="flex items-center justify-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Driver
                </div>
              </button>
              <button
                onClick={() => quickLogin('john.doe@example.com', 'customer123')}
                disabled={loading}
                className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm font-medium transition-all duration-200 border border-blue-200 dark:border-blue-800 disabled:opacity-50"
              >
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Customer
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 text-center">
              Click any role above to sign in instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}