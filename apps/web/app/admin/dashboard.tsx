'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, packageAPI, customerAPI, loadAPI, invoiceAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import ModernStatsCard from '@/components/ModernStatsCard';
import { 
  Package, Users, Truck, DollarSign, TrendingUp, Activity,
  AlertTriangle, CheckCircle, Clock, Calendar, BarChart3,
  FileText, UserCheck, Settings, Globe, Shield, Database
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loads, setLoads] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalPackages: 0,
    activeCustomers: 0,
    pendingInvoices: 0,
    activeLoads: 0,
    completionRate: 0,
    avgDeliveryTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [packagesRes, customersRes, loadsRes, invoicesRes] = await Promise.all([
        packageAPI.list(),
        customerAPI.list(),
        loadAPI.list(),
        invoiceAPI.list(),
      ]);

      const packagesData = packagesRes.data.packages || [];
      const customersData = customersRes.data.customers || [];
      const loadsData = loadsRes.data.loads || [];
      const invoicesData = invoicesRes.data.invoices || [];

      setPackages(packagesData);
      setCustomers(customersData);
      setLoads(loadsData);
      setInvoices(invoicesData);

      // Calculate comprehensive stats
      const totalRevenue = invoicesData
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

      const monthlyRevenue = invoicesData
        .filter((inv: any) => {
          const invDate = new Date(inv.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return inv.status === 'paid' && invDate > monthAgo;
        })
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

      const deliveredPackages = packagesData.filter((p: any) => p.status === 'delivered').length;
      const completionRate = packagesData.length > 0 
        ? Math.round((deliveredPackages / packagesData.length) * 100)
        : 0;

      setStats({
        totalRevenue,
        monthlyRevenue,
        totalPackages: packagesData.length,
        activeCustomers: customersData.filter((c: any) => c.status === 'active').length,
        pendingInvoices: invoicesData.filter((inv: any) => inv.status === 'pending').length,
        activeLoads: loadsData.filter((l: any) => l.status === 'in_transit').length,
        completionRate,
        avgDeliveryTime: 2.4, // Mock data - would calculate from actual delivery times
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for revenue trend
  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 58000 },
    { month: 'Jun', revenue: 67000 },
  ];

  if (loading) {
    return (
      <ModernLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout role="admin">
      {/* Page header with actions */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            System overview and management
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ModernStatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          change={23}
          changeLabel="vs last period"
          color="green"
        />
        <ModernStatsCard
          title="Active Customers"
          value={stats.activeCustomers}
          icon={Users}
          change={12}
          changeLabel="new this month"
          color="blue"
        />
        <ModernStatsCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={CheckCircle}
          change={5}
          changeLabel="improvement"
          color="purple"
        />
        <ModernStatsCard
          title="Active Loads"
          value={stats.activeLoads}
          icon={Truck}
          change={-8}
          changeLabel="from peak"
          color="orange"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${stats.monthlyRevenue.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Target: $75,000
          </p>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${Math.min((stats.monthlyRevenue / 75000) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Delivery Time</h3>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.avgDeliveryTime} days
          </p>
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            ↓ 0.3 days from last month
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Invoices</h3>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.pendingInvoices}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Worth ${(stats.pendingInvoices * 1250).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs for different views */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'analytics', 'operations', 'finance', 'system'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue Trend
            </h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {revenueData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                    style={{ height: `${(data.revenue / 70000) * 100}%` }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{data.month}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    New customer registered
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Alice Johnson - 2 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    Load #L-1234 departed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Driver: Bob Wilson - 15 minutes ago
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    Invoice #INV-5678 paid
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Amount: $2,450 - 1 hour ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}