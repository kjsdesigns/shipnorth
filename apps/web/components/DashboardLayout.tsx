'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import {
  Package,
  Users,
  Truck,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Bell,
  Search,
  ChevronDown,
  User,
  CreditCard,
  Map,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  UserCheck,
  Package2,
  AlertCircle,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'staff' | 'driver' | 'customer';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications] = useState(3);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleLogout = () => {
    authAPI.logout();
  };

  // Navigation items based on role
  const getNavItems = () => {
    const baseItems = [{ name: 'Dashboard', href: `/${role}`, icon: Home }];

    switch (role) {
      case 'admin':
        return [
          ...baseItems,
          { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
          { name: 'Customers', href: '/admin/customers', icon: Users },
          { name: 'Packages', href: '/admin/packages', icon: Package },
          { name: 'Loads', href: '/admin/loads', icon: Truck },
          { name: 'Invoices', href: '/admin/invoices', icon: FileText },
          { name: 'Staff', href: '/admin/staff', icon: UserCheck },
          { name: 'Settings', href: '/admin/settings', icon: Settings },
        ];
      case 'staff':
        return [
          ...baseItems,
          { name: 'Customers', href: '/staff/customers', icon: Users },
          { name: 'Packages', href: '/staff/packages', icon: Package },
          { name: 'Loads', href: '/staff/loads', icon: Truck },
          { name: 'Invoices', href: '/staff/invoices', icon: FileText },
          { name: 'Reports', href: '/staff/reports', icon: BarChart3 },
        ];
      case 'driver':
        return [
          ...baseItems,
          { name: 'My Loads', href: '/driver/loads', icon: Truck },
          { name: 'Routes', href: '/driver/routes', icon: Map },
          { name: 'Deliveries', href: '/driver/deliveries', icon: Package2 },
          { name: 'Earnings', href: '/driver/earnings', icon: DollarSign },
        ];
      case 'customer':
        return [
          ...baseItems,
          { name: 'My Packages', href: '/portal/packages', icon: Package },
          { name: 'Track Shipment', href: '/portal/track', icon: Map },
          { name: 'Invoices', href: '/portal/invoices', icon: FileText },
          { name: 'Payment Methods', href: '/portal/payment', icon: CreditCard },
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar for desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 bg-gray-900">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white">Shipnorth</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== `/${role}` && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-gray-800 shadow-lg border-b border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <Menu className="h-6 w-6" />
                </button>

                {/* Search bar */}
                <div className="ml-4 lg:ml-0 flex-1 max-w-md">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="search"
                      className="block w-full rounded-lg bg-gray-700 py-2 pl-10 pr-3 text-sm text-gray-300 placeholder-gray-400 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search..."
                    />
                  </div>
                </div>
              </div>

              {/* Right side items */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative text-gray-400 hover:text-white">
                  <Bell className="h-6 w-6" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* User menu */}
                <div className="relative">
                  <button className="flex items-center text-sm text-gray-300 hover:text-white">
                    <div className="mr-2 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
