'use client';

import { useState, useEffect } from 'react';
import { Package, Users, Truck, MessageSquare, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import NotificationCenter from '../notifications/NotificationCenter';
import ObjectAuditTrail from '../common/ObjectAuditTrail';

interface DashboardStats {
  packages: { total: number, delivered: number, inTransit: number };
  customers: { total: number, active: number };
  loads: { total: number, active: number };
  messages: { sent: number, delivered: number, failed: number };
  auditEvents: { total: number, highRisk: number, today: number };
}

export default function EnhancedStaffDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    packages: { total: 0, delivered: 0, inTransit: 0 },
    customers: { total: 0, active: 0 },
    loads: { total: 0, active: 0 },
    messages: { sent: 0, delivered: 0, failed: 0 },
    auditEvents: { total: 0, highRisk: 0, today: 0 }
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock dashboard data - would connect to real APIs
      setStats({
        packages: { total: 156, delivered: 142, inTransit: 14 },
        customers: { total: 89, active: 67 },
        loads: { total: 23, active: 3 },
        messages: { sent: 245, delivered: 231, failed: 14 },
        auditEvents: { total: 1247, highRisk: 3, today: 45 }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color, 
    href 
  }: { 
    title: string; 
    value: number | string; 
    subtitle?: string; 
    icon: React.ComponentType<any>; 
    color: string;
    href?: string;
  }) => {
    const CardContent = (
      <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color} mr-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
        </div>
      </div>
    );

    return href ? <a href={href}>{CardContent}</a> : CardContent;
  };

  return (
    <div className="space-y-6">
      {/* Header with Notification Center */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600">Monitor packages, customers, and system activity</p>
        </div>
        <NotificationCenter />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Packages"
          value={stats.packages.total}
          subtitle={`${stats.packages.delivered} delivered, ${stats.packages.inTransit} in transit`}
          icon={Package}
          color="bg-blue-600"
          href="/staff/packages"
        />
        
        <StatCard
          title="Active Customers"
          value={stats.customers.active}
          subtitle={`${stats.customers.total} total customers`}
          icon={Users}
          color="bg-green-600"
          href="/staff/customers"
        />
        
        <StatCard
          title="Active Loads"
          value={stats.loads.active}
          subtitle={`${stats.loads.total} total loads`}
          icon={Truck}
          color="bg-orange-600"
          href="/staff/loads"
        />
        
        <StatCard
          title="Messages Sent"
          value={stats.messages.sent}
          subtitle={`${stats.messages.failed} failed, ${stats.messages.delivered} delivered`}
          icon={MessageSquare}
          color="bg-purple-600"
          href="/staff/messages"
        />
      </div>

      {/* Communication & Security Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
              <a href="/staff/messages" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </a>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Package Delivered</div>
                  <div className="text-sm text-green-700">Sent to john.doe@example.com</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Load Started</div>
                  <div className="text-sm text-blue-700">Notified 5 customers</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-900">Delivery Exception</div>
                  <div className="text-sm text-yellow-700">SMS delivery failed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Overview */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Security Overview</h2>
              <a href="/staff/audit" className="text-sm text-blue-600 hover:text-blue-800">
                View audit log
              </a>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.auditEvents.today}</div>
                <div className="text-sm text-gray-600">Events Today</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${stats.auditEvents.highRisk > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.auditEvents.highRisk}
                </div>
                <div className="text-sm text-gray-600">High Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.auditEvents.total}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">System Secure</span>
                </div>
                <span className="text-xs text-green-700">No critical events</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Activity Normal</span>
                </div>
                <span className="text-xs text-blue-700">Within expected range</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
        </div>
        <div className="p-6">
          <ObjectAuditTrail 
            resourceType="system"
            resourceId="dashboard"
            resourceName="System Activity"
            compact={true}
          />
        </div>
      </div>
    </div>
  );
}