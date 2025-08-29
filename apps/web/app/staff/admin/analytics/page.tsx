'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, packageAPI, loadAPI, adminUserAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Truck,
  DollarSign,
  Clock,
  MapPin,
  Activity,
  Download,
} from 'lucide-react';

interface AnalyticsData {
  packages: {
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
    deliveryRate: number;
  };
  loads: {
    total: number;
    active: number;
    completed: number;
    averagePackagesPerLoad: number;
  };
  users: {
    total: number;
    customers: number;
    drivers: number;
    staff: number;
    activeToday: number;
  };
  performance: {
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
    systemUptime: number;
    responseTime: number;
  };
}

export default function AdminAnalytics() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (!currentUser.roles?.includes('admin') && currentUser.role !== 'admin')) {
      router.push('/staff');
      return;
    }

    setUser(currentUser);
    loadAnalytics();
  }, [router, timeRange]);

  const loadAnalytics = async () => {
    try {
      // Get data from multiple APIs
      const [packagesResponse, loadsResponse, usersResponse] = await Promise.all([
        packageAPI.getStats(),
        loadAPI.list(),
        adminUserAPI.list({ limit: 1000 }),
      ]);

      const packageStats = packagesResponse.data;
      const loads = loadsResponse.data;
      const usersData = usersResponse.data.users || usersResponse.data || [];

      // Process analytics data
      const totalPackages =
        packageStats?.total ||
        (Array.isArray(loads)
          ? loads.reduce((sum: number, load: any) => sum + (load.packages?.length || 0), 0)
          : 0);
      const completedLoads = Array.isArray(loads)
        ? loads.filter((load: any) => load.status === 'complete').length
        : 0;
      const activeLoads = Array.isArray(loads)
        ? loads.filter((load: any) => load.status === 'in_transit' || load.status === 'planned')
            .length
        : 0;

      const usersByRole = {
        customers: usersData.filter((u: any) => (u.roles || [u.role]).includes('customer')).length,
        drivers: usersData.filter((u: any) => (u.roles || [u.role]).includes('driver')).length,
        staff: usersData.filter((u: any) => (u.roles || [u.role]).includes('staff')).length,
      };

      const analyticsData: AnalyticsData = {
        packages: {
          total: totalPackages,
          delivered: packageStats?.delivered || Math.floor(totalPackages * 0.7),
          inTransit: packageStats?.inTransit || Math.floor(totalPackages * 0.2),
          pending: packageStats?.pending || Math.floor(totalPackages * 0.1),
          deliveryRate: packageStats?.deliveryRate || 94.2,
        },
        loads: {
          total: Array.isArray(loads) ? loads.length : 0,
          active: activeLoads,
          completed: completedLoads,
          averagePackagesPerLoad:
            totalPackages > 0 && Array.isArray(loads) ? totalPackages / loads.length : 0,
        },
        users: {
          total: usersData.length,
          customers: usersByRole.customers,
          drivers: usersByRole.drivers,
          staff: usersByRole.staff,
          activeToday: usersData.filter((u: any) => {
            const lastLogin = u.lastLogin ? new Date(u.lastLogin) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return lastLogin && lastLogin >= today;
          }).length,
        },
        performance: {
          averageDeliveryTime: 2.3, // days
          onTimeDeliveryRate: 96.8,
          systemUptime: 99.9,
          responseTime: 145, // ms
        },
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <ModernLayout role="staff">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Failed to load analytics data</p>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout role="staff">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">
              System performance and business insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Packages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.packages.total}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+12.3%</span>
                </div>
              </div>
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Delivery Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.packages.deliveryRate}%
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+2.1%</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.users.activeToday}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  <span className="text-sm text-red-600">-5.2%</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  System Uptime
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.performance.systemUptime}%
                </p>
                <div className="flex items-center mt-1">
                  <Activity className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">Excellent</span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Package Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Package Status Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {analytics.packages.delivered}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Delivered</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(analytics.packages.delivered / analytics.packages.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.packages.inTransit}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Transit</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(analytics.packages.inTransit / analytics.packages.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {analytics.packages.pending}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{
                    width: `${(analytics.packages.pending / analytics.packages.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {analytics.packages.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-gray-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Performance Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Avg Delivery Time</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {analytics.performance.averageDeliveryTime} days
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">On-Time Rate</span>
                </div>
                <span className="font-semibold text-green-600">
                  {analytics.performance.onTimeDeliveryRate}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">System Uptime</span>
                </div>
                <span className="font-semibold text-purple-600">
                  {analytics.performance.systemUptime}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-orange-600 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">API Response Time</span>
                </div>
                <span className="font-semibold text-orange-600">
                  {analytics.performance.responseTime}ms
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Load Analytics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Loads</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {analytics.loads.total}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Loads</span>
                <span className="font-semibold text-blue-600">{analytics.loads.active}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Completed Loads</span>
                <span className="font-semibold text-green-600">{analytics.loads.completed}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Packages/Load</span>
                <span className="font-semibold text-purple-600">
                  {analytics.loads.averagePackagesPerLoad.toFixed(1)}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Load Completion Rate</span>
                  <span className="font-medium text-green-600">
                    {analytics.loads.total > 0
                      ? Math.round((analytics.loads.completed / analytics.loads.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${analytics.loads.total > 0 ? (analytics.loads.completed / analytics.loads.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            User Activity
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.users.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analytics.users.customers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Customers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {analytics.users.drivers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Drivers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analytics.users.staff}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Staff</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {analytics.users.activeToday}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Today</div>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
