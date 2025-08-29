'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, packageAPI, invoiceAPI } from '@/lib/api';
import {
  Package,
  User,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Search,
  Eye,
  Truck,
  Calendar,
  Bell,
  Filter,
  MoreVertical,
  ArrowRight,
  Package2,
  Zap,
  Star,
  TrendingUp,
} from 'lucide-react';

export default function CustomerPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        const [packagesRes, invoicesRes] = await Promise.all([
          packageAPI.list(),
          invoiceAPI.list(),
        ]);

        // Filter packages for this customer
        const customerPackages =
          packagesRes.data.packages?.filter((pkg: any) => pkg.customerId === user?.customerId) ||
          [];

        // Filter invoices for this customer
        const customerInvoices =
          invoicesRes.data.invoices?.filter((inv: any) => inv.customerId === user?.customerId) ||
          [];

        setPackages(customerPackages);
        setInvoices(customerInvoices);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    },
    [user?.customerId]
  );

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (
      !currentUser ||
      (!currentUser.roles?.includes('customer') && currentUser.role !== 'customer')
    ) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => loadData(true), 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  const filteredPackages = packages.filter((pkg) => {
    if (searchQuery) {
      return (
        pkg.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => authAPI.logout()}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, {user?.firstName}!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Track your packages and manage your account
            </p>
          </div>

          {/* Package Tracking Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Track Package
            </h3>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Enter tracking number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => {
                  if (searchQuery) {
                    router.push(`/track/${searchQuery}`);
                  }
                }}
              >
                Track
              </button>
            </div>
          </div>

          {/* Your Packages Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Packages
              </h3>

              {filteredPackages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                          Tracking
                        </th>
                        <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                          Description
                        </th>
                        <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                          Location
                        </th>
                        <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPackages.map((pkg) => (
                        <tr key={pkg.id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-mono">
                            {pkg.trackingNumber}
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                            {pkg.description || 'Package'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                pkg.status === 'delivered'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : pkg.status === 'in_transit'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              }`}
                            >
                              {pkg.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                            {pkg.currentLocation || 'In transit'}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => router.push(`/track/${pkg.trackingNumber}`)}
                            >
                              Track
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No packages found</p>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile
                </label>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-gray-100">
                    <strong>Name:</strong> {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    <strong>Email:</strong> {user?.email}
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    <strong>Phone:</strong> {user?.phone || 'Not provided'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Summary
                </label>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-gray-100">
                    <strong>Total Packages:</strong> {packages.length}
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    <strong>Active Shipments:</strong>{' '}
                    {packages.filter((p) => p.status === 'in_transit').length}
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    <strong>Delivered:</strong>{' '}
                    {packages.filter((p) => p.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
