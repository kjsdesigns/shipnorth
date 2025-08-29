'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, adminUserAPI, loadAPI, packageAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import {
  Users,
  UserCheck,
  Settings,
  Shield,
  BarChart3,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLoads: 0,
    systemHealth: 'good',
    pendingActions: 0,
  });

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (!currentUser.roles?.includes('admin') && currentUser.role !== 'admin')) {
      router.push('/staff');
      return;
    }

    setUser(currentUser);
    loadAdminData();
  }, [router]);

  const loadAdminData = async () => {
    try {
      // Get real admin data from APIs
      const [usersResponse, loadsResponse, packagesResponse] = await Promise.all([
        adminUserAPI.list({ limit: 1000 }),
        loadAPI.list(),
        packageAPI.getStats(),
      ]);

      const users = usersResponse.data.users || usersResponse.data;
      const loads = loadsResponse.data;
      const packageStats = packagesResponse.data;

      const totalUsers = Array.isArray(users) ? users.length : 0;
      const activeUsers = Array.isArray(users)
        ? users.filter((u: any) => u.status === 'active').length
        : 0;
      const totalLoads = Array.isArray(loads) ? loads.length : 0;

      setStats({
        totalUsers,
        activeUsers,
        totalLoads,
        systemHealth: 'good', // Would check from monitoring endpoint
        pendingActions: Math.max(0, totalUsers - activeUsers), // Simple calculation
      });
    } catch (error) {
      console.error('Failed to load admin data:', error);
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

  return (
    <ModernLayout role="staff">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            System administration and user management
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalLoads}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${
                  stats.systemHealth === 'good'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {stats.systemHealth === 'good' ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  System Health
                </p>
                <p
                  className={`text-2xl font-bold ${
                    stats.systemHealth === 'good'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {stats.systemHealth === 'good' ? 'Good' : 'Issues'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User Management
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="/staff/admin/users"
                className="block bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-3 rounded-lg transition-colors"
              >
                <p className="font-medium text-blue-900 dark:text-blue-100">Manage Users</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Create, edit, and manage user accounts
                </p>
              </a>
              <a
                href="/staff/admin/roles"
                className="block bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">Role Management</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure user roles and permissions
                </p>
              </a>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Settings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure system-wide settings
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="/staff/admin/settings"
                className="block bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 p-3 rounded-lg transition-colors"
              >
                <p className="font-medium text-green-900 dark:text-green-100">General Settings</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  System configuration and preferences
                </p>
              </a>
              <a
                href="/staff/admin/integrations"
                className="block bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">Integrations</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  API keys and external services
                </p>
              </a>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  System performance and insights
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="/staff/admin/analytics"
                className="block bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 p-3 rounded-lg transition-colors"
              >
                <p className="font-medium text-purple-900 dark:text-purple-100">System Analytics</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Performance metrics and reports
                </p>
              </a>
              <a
                href="/staff/admin/logs"
                className="block bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">System Logs</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View system and error logs
                </p>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Admin Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-4">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  New user created
                </p>
                <p className="text-xs text-gray-500">john.driver@shipnorth.com • 2 hours ago</p>
              </div>
              <span className="text-xs text-gray-500">Admin</span>
            </div>

            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 mr-4">
                <Settings className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  System settings updated
                </p>
                <p className="text-xs text-gray-500">Rate limits configuration • 4 hours ago</p>
              </div>
              <span className="text-xs text-gray-500">Admin</span>
            </div>

            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-4">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Security policy updated
                </p>
                <p className="text-xs text-gray-500">
                  Password requirements strengthened • 1 day ago
                </p>
              </div>
              <span className="text-xs text-gray-500">Admin</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="font-medium text-green-900 dark:text-green-100">API Services</span>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="font-medium text-green-900 dark:text-green-100">Database</span>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400">Healthy</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <span className="font-medium text-yellow-900 dark:text-yellow-100">
                  External APIs
                </span>
              </div>
              <span className="text-sm text-yellow-600 dark:text-yellow-400">Slow</span>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        {stats.pendingActions > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {stats.pendingActions} Pending Admin Actions
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Review user access requests and system alerts
                </p>
              </div>
              <button className="ml-auto bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg">
                Review
              </button>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}
