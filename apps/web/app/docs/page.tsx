'use client';

import Link from 'next/link';
import {
  Book,
  Code,
  Users,
  History,
  Search,
  ArrowRight,
  FileText,
  Settings,
  Truck,
  Package,
  CreditCard,
  Shield,
  Globe,
  Zap,
} from 'lucide-react';

export default function DocsHome() {
  const docSections = [
    {
      title: 'API Documentation',
      description: 'Interactive API documentation with examples and authentication details',
      href: '/docs/api',
      icon: Code,
      badge: 'Interactive',
      color: 'bg-blue-500',
    },
    {
      title: 'Business Documentation',
      description: 'Workflows, processes, user guides, and business rules',
      href: '/docs/business',
      icon: Users,
      badge: 'Guides',
      color: 'bg-green-500',
    },
    {
      title: 'Change History',
      description: 'Track implementation dates, feature rollouts, and version changes',
      href: '/docs/changes',
      icon: History,
      badge: 'Updated',
      color: 'bg-purple-500',
    },
  ];

  const quickLinks = [
    { title: 'Authentication', href: '/docs/api#authentication', icon: Shield },
    { title: 'Package Management', href: '/docs/api#packages', icon: Package },
    { title: 'Payment Processing', href: '/docs/api#payments', icon: CreditCard },
    { title: 'Load Planning', href: '/docs/api#loads', icon: Truck },
    { title: 'User Roles', href: '/docs/business#roles', icon: Users },
    { title: 'Workflows', href: '/docs/business#workflows', icon: Settings },
  ];

  const features = [
    {
      title: 'Interactive Examples',
      description: 'Try API endpoints directly from the documentation',
      icon: Zap,
    },
    {
      title: 'Code Samples',
      description: 'Ready-to-use code examples in multiple languages',
      icon: Code,
    },
    {
      title: 'Global Search',
      description: 'Find any information across all documentation',
      icon: Search,
    },
    {
      title: 'Mobile Friendly',
      description: 'Responsive design works on all devices',
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shipnorth</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Documentation</p>
                </div>
              </Link>
            </div>

            {/* Search */}
            <div className="max-w-md flex-1 mx-8">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search documentation..."
                  readOnly
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-500 rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
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

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Shipnorth Documentation
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Complete documentation for the autonomous shipping and billing platform. Integrate
              with our APIs, understand our workflows, and track changes over time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/docs/api"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-sm transition-colors flex items-center"
              >
                View API Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/docs/business"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold"
              >
                Business Guides →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Documentation Sections */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Documentation Sections
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Everything you need to integrate with and understand Shipnorth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {docSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="group relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div
                      className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {section.title}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/20 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                        {section.badge}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{section.description}</p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-gray-100 dark:bg-gray-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Quick Access</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Jump directly to frequently accessed documentation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  className="flex items-center space-x-3 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                >
                  <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="font-medium text-gray-900 dark:text-white">{link.title}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Documentation Features
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Built for developers, designed for clarity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Shipnorth</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 Shipnorth. Documentation auto-updated from source code.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
