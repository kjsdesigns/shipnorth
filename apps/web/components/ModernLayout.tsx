'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Package, Users, Truck, FileText, BarChart3, Settings,
  LogOut, Menu, X, Home, Bell, Search, ChevronDown,
  User, CreditCard, Map, DollarSign,
  Package2, UserCheck, TrendingUp, Activity, Layers
} from 'lucide-react';

interface ModernLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'staff' | 'driver' | 'customer';
}

export default function ModernLayout({ children, role }: ModernLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications] = useState(3);
  const [profileDropdown, setProfileDropdown] = useState(false);

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
    const baseItems = [
      { name: 'Dashboard', href: `/${role}`, icon: Home },
    ];

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Shipnorth</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {role === 'customer' ? 'Customer' : role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== `/${role}` && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Menu className="h-6 w-6" />
                </button>
                
                {/* Search */}
                <div className="ml-4 lg:ml-0 max-w-md flex-1">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Search..."
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Theme toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <button className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Bell className="h-6 w-6" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setProfileDropdown(!profileDropdown)}
                    className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {profileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}