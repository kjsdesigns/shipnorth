'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, packageAPI, customerAPI, loadAPI, invoiceAPI } from '@/lib/api';
import { 
  Package, Users, Truck, DollarSign, TrendingUp, 
  AlertCircle, Settings, Activity, Database, Shield,
  Mail, MessageSquare, CreditCard, LogOut, RefreshCw,
  CheckCircle, XCircle, Clock, BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalLoads: 0,
    packagesInTransit: 0,
    packagesDelivered: 0,
    failedPayments: 0,
    activeDrivers: 0,
    todayPackages: 0,
    todayRevenue: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
  });
  
  // Data
  const [packages, setPackages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loads, setLoads] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    api: 'operational',
    database: 'operational',
    payments: 'operational',
    notifications: 'operational',
  });

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
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

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPackages = packagesData.filter((p: any) => 
        new Date(p.createdAt) >= today
      );
      
      const totalRevenue = invoicesData
        .filter((i: any) => i.status === 'paid')
        .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      
      const todayRevenue = invoicesData
        .filter((i: any) => i.status === 'paid' && new Date(i.createdAt) >= today)
        .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

      setStats({
        totalPackages: packagesData.length,
        totalCustomers: customersData.length,
        totalRevenue: totalRevenue / 100, // Convert from cents
        totalLoads: loadsData.length,
        packagesInTransit: packagesData.filter((p: any) => p.shipmentStatus === 'in_transit').length,
        packagesDelivered: packagesData.filter((p: any) => p.shipmentStatus === 'delivered').length,
        failedPayments: packagesData.filter((p: any) => p.paymentStatus === 'failed').length,
        activeDrivers: loadsData.filter((l: any) => l.status === 'active').length,
        todayPackages: todayPackages.length,
        todayRevenue: todayRevenue / 100,
        weeklyGrowth: 12.5, // Mock data
        monthlyGrowth: 28.3, // Mock data
      });
      
      // Check system health (mock)
      setSystemHealth({
        api: 'operational',
        database: 'operational',
        payments: Math.random() > 0.1 ? 'operational' : 'degraded',
        notifications: 'operational',
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className={`p-2 rounded-lg hover:bg-gray-100 ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600">
                {user?.firstName} ({user?.role})
              </span>
              <button
                onClick={() => {
                  authAPI.logout();
                  router.push('/');
                }}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['overview', 'analytics', 'users', 'system', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs text-green-600 mt-1">+{stats.monthlyGrowth}% this month</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Packages</p>
                    <p className="text-2xl font-bold">{stats.totalPackages}</p>
                    <p className="text-xs text-blue-600 mt-1">{stats.todayPackages} today</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Customers</p>
                    <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                    <p className="text-xs text-purple-600 mt-1">+{stats.weeklyGrowth}% this week</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Loads</p>
                    <p className="text-2xl font-bold">{stats.activeDrivers}</p>
                    <p className="text-xs text-orange-600 mt-1">{stats.totalLoads} total</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Truck className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">System Health</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(systemHealth).map(([service, status]) => (
                    <div key={service} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        status === 'operational' ? 'bg-green-500' :
                        status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium capitalize">{service}</p>
                        <p className={`text-xs ${getHealthColor(status).split(' ')[0]}`}>
                          {status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold">Recent Packages</h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                  {packages.slice(0, 5).map((pkg) => (
                    <div key={pkg.id} className="px-6 py-3 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{pkg.barcode}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(pkg.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pkg.shipmentStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          pkg.shipmentStatus === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {pkg.shipmentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold">Recent Payments</h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="px-6 py-3 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(invoice.amount / 100)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(invoice.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Revenue Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(stats.todayRevenue)}
                  </p>
                  <p className="text-sm text-gray-600">Today's Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(stats.totalRevenue * 0.23)}
                  </p>
                  <p className="text-sm text-gray-600">This Week</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                  <p className="text-sm text-gray-600">This Month</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Package Status Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Delivered</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '65%'}}></div>
                      </div>
                      <span className="text-sm font-medium">{stats.packagesDelivered}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Transit</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '25%'}}></div>
                      </div>
                      <span className="text-sm font-medium">{stats.packagesInTransit}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{width: '10%'}}></div>
                      </div>
                      <span className="text-sm font-medium">
                        {stats.totalPackages - stats.packagesDelivered - stats.packagesInTransit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-lg font-bold text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Failed Payments</span>
                    <span className="text-lg font-bold text-red-600">{stats.failedPayments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Processing Time</span>
                    <span className="text-lg font-bold">2.3s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">User Management</h2>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                Add User
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { name: 'Admin User', email: 'admin@shipnorth.com', role: 'admin', status: 'active', lastLogin: 'Now' },
                    { name: 'Staff User', email: 'staff@shipnorth.com', role: 'staff', status: 'active', lastLogin: '2 hours ago' },
                    { name: 'Driver One', email: 'driver@shipnorth.com', role: 'driver', status: 'active', lastLogin: '1 day ago' },
                  ].map((user, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.lastLogin}</td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Disable</button>
                      </td>
                    </tr>
                  ))}
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          customer
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          customer.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">-</td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                        <button className="text-red-600 hover:text-red-900">Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">System Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Environment</p>
                  <p className="font-medium">Development</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">API Version</p>
                  <p className="font-medium">1.0.0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Database</p>
                  <p className="font-medium">AWS DynamoDB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Gateway</p>
                  <p className="font-medium">PayPal Sandbox</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email Service</p>
                  <p className="font-medium">AWS SES</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SMS Service</p>
                  <p className="font-medium">AWS SNS</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Service Status</h2>
              <div className="space-y-3">
                {[
                  { name: 'API Server', status: 'operational', uptime: '99.99%' },
                  { name: 'Database (DynamoDB)', status: 'operational', uptime: '99.95%' },
                  { name: 'PayPal Integration', status: 'operational', uptime: '99.90%' },
                  { name: 'AWS SES (Email)', status: 'operational', uptime: '99.99%' },
                  { name: 'AWS SNS (SMS)', status: 'operational', uptime: '99.99%' },
                  { name: 'ShipStation', status: 'degraded', uptime: '98.50%' },
                ].map((service) => (
                  <div key={service.name} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        service.status === 'operational' ? 'bg-green-500' :
                        service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">Uptime: {service.uptime}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getHealthColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">General Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Shipnorth"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    defaultValue="support@shipnorth.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Currency
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>CAD - Canadian Dollar</option>
                    <option>USD - US Dollar</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" defaultChecked />
                  <span>Send email notifications for new packages</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" defaultChecked />
                  <span>Send SMS notifications for deliveries</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" defaultChecked />
                  <span>Send payment failure alerts</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3" />
                  <span>Send daily summary reports</span>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Limit (requests/minute)
                  </label>
                  <input
                    type="number"
                    defaultValue="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    JWT Token Expiry
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>24 hours</option>
                    <option>7 days</option>
                    <option>30 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environment
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Development</option>
                    <option>Staging</option>
                    <option>Production</option>
                  </select>
                </div>
              </div>
              <button className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}