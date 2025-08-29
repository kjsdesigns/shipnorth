'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Menu,
  X,
  Search,
  Book,
  Code,
  Users,
  History,
  Shield,
  CreditCard,
  Truck,
  FileText,
  Settings,
  Globe,
  ChevronRight,
  ChevronDown,
  Home,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import DocsSearch from './DocsSearch';

interface DocsLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['api', 'business']);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const navigationItems: NavItem[] = [
    {
      title: 'Overview',
      href: '/docs',
      icon: Home,
    },
    {
      title: 'API Reference',
      icon: Code,
      children: [
        { title: 'Overview', href: '/docs/api' },
        { title: 'Authentication', href: '/docs/api#authentication' },
        { title: 'Customers', href: '/docs/api#customers' },
        { title: 'Packages', href: '/docs/api#packages' },
        { title: 'Loads', href: '/docs/api#loads' },
        { title: 'Invoices', href: '/docs/api#invoices' },
        { title: 'Webhooks', href: '/docs/api#webhooks' },
        { title: 'Admin', href: '/docs/api#admin' },
      ],
    },
    {
      title: 'Business Guides',
      icon: Users,
      children: [
        { title: 'Overview', href: '/docs/business' },
        { title: 'User Roles', href: '/docs/business#roles' },
        { title: 'Package Workflow', href: '/docs/business#package-workflow' },
        { title: 'Payment Processing', href: '/docs/business#payments' },
        { title: 'Load Planning', href: '/docs/business#load-planning' },
        { title: 'Tracking & Delivery', href: '/docs/business#tracking' },
        { title: 'Customer Portal', href: '/docs/business#customer-portal' },
        { title: 'Driver Interface', href: '/docs/business#driver-interface' },
      ],
    },
    {
      title: 'Integration Guides',
      icon: Globe,
      children: [
        { title: 'Getting Started', href: '/docs/integration' },
        { title: 'Stripe Setup', href: '/docs/integration#stripe' },
        { title: 'ShipStation Setup', href: '/docs/integration#shipstation' },
        { title: 'Webhooks', href: '/docs/integration#webhooks' },
        { title: 'Testing', href: '/docs/integration#testing' },
      ],
    },
    {
      title: 'Change History',
      href: '/docs/changes',
      icon: History,
    },
  ];

  const isActiveLink = (href: string | undefined) => {
    if (!href) return false;
    if (href === '/docs') return pathname === '/docs';
    return pathname.startsWith(href);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/docs" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">Shipnorth</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">Documentation</div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search docs..."
                onClick={() => setSearchOpen(true)}
                readOnly
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-500 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const sectionKey = item.title.toLowerCase().replace(/\s+/g, '-');
              const isExpanded = expandedSections.includes(sectionKey);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={index}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleSection(sectionKey)}
                        className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all duration-200"
                      >
                        {Icon && (
                          <Icon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                        )}
                        <span className="flex-1 text-left">{item.title}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="mt-1 space-y-1">
                          {item.children?.map((child, childIndex) => (
                            <Link
                              key={childIndex}
                              href={child.href || '#'}
                              className={`block pl-10 pr-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                isActiveLink(child.href)
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }`}
                            >
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActiveLink(item.href)
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {Icon && (
                        <Icon
                          className={`mr-3 h-4 w-4 ${
                            isActiveLink(item.href)
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                          }`}
                        />
                      )}
                      {item.title}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <Link
              href="/"
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              <Home className="mr-3 h-4 w-4 text-gray-400" />
              Back to App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 lg:hidden">
          <div className="px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <Link href="/docs" className="ml-4 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Docs</span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="px-6">
            <div className="flex h-16 items-center justify-end">
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Link
                  href="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Search Modal */}
      <DocsSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
