'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

interface SystemMetrics {
  users: {
    total: number;
    active: number;
    newToday: number;
    byRole: Record<string, number>;
  };
  packages: {
    total: number;
    inTransit: number;
    delivered: number;
    pendingPayment: number;
    revenue: number;
  };
  performance: {
    apiResponseTime: number;
    databaseConnections: number;
    errorRate: number;
    uptime: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
}

export default function SystemOverview() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemMetrics();
    
    const interval = setInterval(loadSystemMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemMetrics = async () => {
    try {
      // In production, this would call real system metrics APIs
      const mockMetrics: SystemMetrics = {
        users: {
          total: 156,
          active: 142,
          newToday: 3,
          byRole: {
            customer: 134,
            driver: 12,
            staff: 8,
            admin: 2
          }
        },
        packages: {
          total: 2847,
          inTransit: 67,
          delivered: 2634,
          pendingPayment: 23,
          revenue: 47392.50
        },
        performance: {
          apiResponseTime: 127,
          databaseConnections: 8,
          errorRate: 0.02,
          uptime: 99.97
        },
        system: {
          memoryUsage: 68.5,
          cpuUsage: 23.2,
          diskUsage: 45.8,
          activeConnections: 24
        }
      };

      setMetrics(mockMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    format = 'number'
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
    format?: 'number' | 'currency' | 'percentage' | 'duration';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return `$${val.toLocaleString()}`;
        case 'percentage': return `${val}%`;
        case 'duration': return `${val}ms`;
        default: return val.toLocaleString();
      }
    };

    const colorClasses = {
      blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
      orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
      red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
      purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatValue(value)}
              </p>
              {change !== undefined && (
                <div className={`ml-2 flex items-center ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm ml-1">{Math.abs(change)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatusIndicator = ({ 
    status, 
    label 
  }: { 
    status: 'good' | 'warning' | 'error'; 
    label: string;
  }) => {
    const statusConfig = {
      good: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
      warning: { color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle },
      error: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className="flex items-center">
        <div className={`p-1 rounded-full ${config.bg} mr-2`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
    );
  };

  if (loading || !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={loadSystemMetrics}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics.users.total}
          change={2.3}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Shipments"
          value={metrics.packages.inTransit}
          change={-5.1}
          icon={Package}
          color="orange"
        />
        <MetricCard
          title="Monthly Revenue"
          value={metrics.packages.revenue}
          change={12.4}
          icon={DollarSign}
          color="green"
          format="currency"
        />
        <MetricCard
          title="System Uptime"
          value={metrics.performance.uptime}
          icon={CheckCircle}
          color="green"
          format="percentage"
        />
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Health
          </h3>
          <div className="space-y-3">
            <StatusIndicator 
              status={metrics.performance.errorRate < 0.05 ? 'good' : 'warning'} 
              label={`Error Rate: ${(metrics.performance.errorRate * 100).toFixed(2)}%`}
            />
            <StatusIndicator 
              status={metrics.performance.apiResponseTime < 200 ? 'good' : 'warning'} 
              label={`API Response: ${metrics.performance.apiResponseTime}ms`}
            />
            <StatusIndicator 
              status={metrics.system.memoryUsage < 80 ? 'good' : 'warning'} 
              label={`Memory Usage: ${metrics.system.memoryUsage}%`}
            />
            <StatusIndicator 
              status={metrics.system.cpuUsage < 70 ? 'good' : 'warning'} 
              label={`CPU Usage: ${metrics.system.cpuUsage}%`}
            />
            <StatusIndicator 
              status={metrics.system.diskUsage < 80 ? 'good' : 'warning'} 
              label={`Disk Usage: ${metrics.system.diskUsage}%`}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.users.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 capitalize">{role}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="API Response Time"
          value={metrics.performance.apiResponseTime}
          icon={Cpu}
          color="purple"
          format="duration"
        />
        <MetricCard
          title="DB Connections"
          value={metrics.performance.databaseConnections}
          icon={Database}
          color="blue"
        />
        <MetricCard
          title="Memory Usage"
          value={metrics.system.memoryUsage}
          icon={HardDrive}
          color={metrics.system.memoryUsage > 80 ? 'red' : 'green'}
          format="percentage"
        />
        <MetricCard
          title="Active Sessions"
          value={metrics.system.activeConnections}
          icon={Wifi}
          color="blue"
        />
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{metrics.users.newToday}</p>
            <p className="text-gray-600 dark:text-gray-400">New Users</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {metrics.packages.delivered - Math.floor(metrics.packages.delivered * 0.92)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">Packages Delivered</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{metrics.packages.pendingPayment}</p>
            <p className="text-gray-600 dark:text-gray-400">Pending Payments</p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Alerts
        </h3>
        <div className="space-y-3">
          {metrics.performance.errorRate > 0.05 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">High Error Rate</p>
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    Error rate is {(metrics.performance.errorRate * 100).toFixed(2)}% (threshold: 5%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {metrics.system.memoryUsage > 80 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">High Memory Usage</p>
                  <p className="text-orange-600 dark:text-orange-400 text-sm">
                    Memory usage is {metrics.system.memoryUsage}% (threshold: 80%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {metrics.packages.pendingPayment > 20 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Pending Payments Alert</p>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                    {metrics.packages.pendingPayment} packages have pending payments
                  </p>
                </div>
              </div>
            </div>
          )}

          {metrics.performance.errorRate < 0.01 && metrics.system.memoryUsage < 70 && metrics.packages.pendingPayment < 10 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">All Systems Operational</p>
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    No issues detected across all monitoring metrics
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}