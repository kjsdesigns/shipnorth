'use client';

import { useState } from 'react';
import DocsLayout from '@/components/DocsLayout';
import {
  History,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Tag,
  GitBranch,
  Users,
  Package,
  CreditCard,
  Truck,
  Settings,
  Shield,
  Code,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Change {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'enhancement' | 'bugfix' | 'security' | 'breaking';
  status: 'planned' | 'in_progress' | 'completed' | 'deployed';
  category: string;
  planFile?: string;
  implementationDate?: string;
  deploymentDate?: string;
  version?: string;
  impact: 'low' | 'medium' | 'high';
  affectedComponents: string[];
  details?: string[];
}

interface Release {
  version: string;
  date: string;
  status: 'deployed' | 'in_progress' | 'planned';
  title: string;
  description: string;
  changes: Change[];
  planFile?: string;
}

export default function ChangesPage() {
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'feature' | 'enhancement' | 'bugfix' | 'security'
  >('all');
  const [expandedReleases, setExpandedReleases] = useState<string[]>(['v1.0.0']);

  const toggleRelease = (version: string) => {
    setExpandedReleases((prev) =>
      prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]
    );
  };

  const releases: Release[] = [
    {
      version: 'v1.2.0',
      date: '2025-09-15',
      status: 'planned',
      title: 'Advanced Analytics & Reporting',
      description:
        'Enhanced reporting capabilities with real-time analytics and custom dashboard widgets',
      planFile: '003-analytics-enhancement.md',
      changes: [
        {
          id: 'analytics-dashboard',
          title: 'Real-time Analytics Dashboard',
          description: 'Interactive dashboard with key performance metrics and real-time updates',
          type: 'feature',
          status: 'planned',
          category: 'Analytics',
          impact: 'high',
          affectedComponents: ['Web Portal', 'API'],
          details: [
            'Real-time package volume tracking',
            'Revenue analytics with trend analysis',
            'Customer engagement metrics',
            'Carrier performance comparisons',
          ],
        },
        {
          id: 'custom-reports',
          title: 'Custom Report Builder',
          description:
            'Allow users to create custom reports with flexible filters and export options',
          type: 'feature',
          status: 'planned',
          category: 'Reporting',
          impact: 'medium',
          affectedComponents: ['Web Portal', 'Database'],
        },
        {
          id: 'api-metrics',
          title: 'API Usage Metrics',
          description: 'Track API endpoint usage, performance, and error rates',
          type: 'feature',
          status: 'planned',
          category: 'API',
          impact: 'low',
          affectedComponents: ['API Gateway', 'Monitoring'],
        },
      ],
    },
    {
      version: 'v1.1.0',
      date: '2025-09-01',
      status: 'in_progress',
      title: 'Mobile Experience & Customer Self-Service',
      description: 'Enhanced mobile interfaces and expanded customer portal functionality',
      planFile: '002-mobile-enhancement.md',
      changes: [
        {
          id: 'mobile-customer-portal',
          title: 'Mobile Customer Portal',
          description:
            'Responsive mobile-first design for customer package tracking and management',
          type: 'enhancement',
          status: 'in_progress',
          category: 'Customer Portal',
          implementationDate: '2025-08-25',
          impact: 'high',
          affectedComponents: ['Customer Portal', 'Mobile Interface'],
          details: [
            'Touch-optimized interface design',
            'Offline capability for tracking',
            'Push notifications for status updates',
            'Mobile payment integration',
          ],
        },
        {
          id: 'driver-app-improvements',
          title: 'Enhanced Driver Mobile Interface',
          description:
            'Improved mobile experience for drivers with better navigation and offline support',
          type: 'enhancement',
          status: 'in_progress',
          category: 'Driver Interface',
          implementationDate: '2025-08-28',
          impact: 'high',
          affectedComponents: ['Driver Mobile App', 'GPS Tracking'],
          details: [
            'Offline package scanning capability',
            'Improved GPS accuracy and routing',
            'Voice-guided navigation integration',
            'Enhanced photo capture quality',
          ],
        },
        {
          id: 'customer-self-intake',
          title: 'Customer Self-Service Package Intake',
          description: 'Allow customers to pre-register packages online before drop-off',
          type: 'feature',
          status: 'planned',
          category: 'Customer Portal',
          impact: 'medium',
          affectedComponents: ['Customer Portal', 'API', 'Staff Portal'],
        },
      ],
    },
    {
      version: 'v1.0.0',
      date: '2025-08-22',
      status: 'deployed',
      title: 'Shipnorth MVP Launch',
      description: 'Initial release with core shipping and billing functionality',
      planFile: '001-shipnorth-mvp.md',
      changes: [
        {
          id: 'staff-portal',
          title: 'Staff Management Portal',
          description:
            'Complete web interface for staff to manage packages, customers, and operations',
          type: 'feature',
          status: 'completed',
          category: 'Staff Portal',
          implementationDate: '2025-08-20',
          impact: 'high',
          affectedComponents: ['Web Portal', 'Authentication', 'Database'],
          details: [
            'Package intake and management',
            'Customer registration and management',
            'Load planning and assignment',
            'Payment processing and invoicing',
            'Analytics dashboard',
            'User management system',
          ],
        },
        {
          id: 'customer-portal',
          title: 'Customer Tracking Portal',
          description: 'Self-service portal for customers to track packages and manage account',
          type: 'feature',
          status: 'completed',
          category: 'Customer Portal',
          implementationDate: '2025-08-18',
          impact: 'high',
          affectedComponents: ['Customer Portal', 'Tracking System', 'Authentication'],
          details: [
            'Real-time package tracking with map',
            'Invoice viewing and payment',
            'Payment method management',
            'Account information updates',
            'Notification preferences',
          ],
        },
        {
          id: 'driver-interface',
          title: 'Driver Mobile Interface',
          description: 'Mobile-optimized interface for delivery drivers',
          type: 'feature',
          status: 'completed',
          category: 'Driver Interface',
          implementationDate: '2025-08-19',
          impact: 'high',
          affectedComponents: ['Mobile Interface', 'GPS Tracking', 'Authentication'],
          details: [
            'Load manifest viewing',
            'Package scanning and status updates',
            'GPS location sharing',
            'Signature and photo capture',
            'Route optimization display',
          ],
        },
        {
          id: 'payment-integration',
          title: 'Stripe Payment Integration',
          description: 'Complete integration with Stripe for payment processing',
          type: 'feature',
          status: 'completed',
          category: 'Payments',
          implementationDate: '2025-08-15',
          impact: 'high',
          affectedComponents: ['API', 'Payment System', 'Webhooks'],
          details: [
            'Automatic charging on label purchase',
            'Payment method setup and management',
            'Webhook handling for payment events',
            'Refund processing capabilities',
          ],
        },
        {
          id: 'shipstation-integration',
          title: 'ShipStation Carrier Integration',
          description: 'Integration with ShipStation for multi-carrier shipping label purchase',
          type: 'feature',
          status: 'completed',
          category: 'Shipping',
          implementationDate: '2025-08-16',
          impact: 'high',
          affectedComponents: ['API', 'Shipping Service', 'Tracking System'],
          details: [
            'Multi-carrier rate shopping',
            'Label purchase and generation',
            'Tracking number integration',
            'Automatic status updates',
          ],
        },
        {
          id: 'authentication-system',
          title: 'JWT Authentication & Authorization',
          description: 'Secure authentication system with role-based access control',
          type: 'feature',
          status: 'completed',
          category: 'Security',
          implementationDate: '2025-08-12',
          impact: 'high',
          affectedComponents: ['API', 'All Portals', 'Security'],
          details: [
            'JWT token-based authentication',
            'Role-based access control (RBAC)',
            '24-hour access tokens',
            '30-day refresh tokens',
            'Secure password hashing',
          ],
        },
        {
          id: 'database-design',
          title: 'DynamoDB Single-Table Design',
          description: 'Scalable database architecture using AWS DynamoDB',
          type: 'feature',
          status: 'completed',
          category: 'Database',
          implementationDate: '2025-08-10',
          impact: 'high',
          affectedComponents: ['Database', 'API', 'All Services'],
          details: [
            'Single-table design for optimal performance',
            'Global secondary indexes for access patterns',
            'Customer, package, load, and invoice entities',
            'Audit logging capabilities',
          ],
        },
        {
          id: 'documentation-site',
          title: 'Comprehensive Documentation Site',
          description: 'Complete documentation site with API reference and business guides',
          type: 'feature',
          status: 'completed',
          category: 'Documentation',
          impact: 'medium',
          affectedComponents: ['Documentation', 'Web Portal'],
          details: [
            'Interactive API documentation',
            'Business workflow guides',
            'User role documentation',
            'Change history tracking',
            'Search functionality across all docs',
          ],
        },
      ],
    },
  ];

  const typeColors = {
    feature:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700',
    enhancement:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700',
    bugfix:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700',
    security:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700',
    breaking:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700',
  };

  const statusColors = {
    planned: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    deployed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  };

  const impactColors = {
    low: 'text-green-600 dark:text-green-400',
    medium: 'text-orange-600 dark:text-orange-400',
    high: 'text-red-600 dark:text-red-400',
  };

  const filteredReleases = releases
    .map((release) => ({
      ...release,
      changes:
        selectedFilter === 'all'
          ? release.changes
          : release.changes.filter((change) => change.type === selectedFilter),
    }))
    .filter((release) => release.changes.length > 0);

  return (
    <DocsLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Change History</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Track feature rollouts, implementation dates, and version changes
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {(['all', 'feature', 'enhancement', 'bugfix', 'security'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completed
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {releases.reduce(
                  (acc, r) => acc + r.changes.filter((c) => c.status === 'completed').length,
                  0
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  In Progress
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {releases.reduce(
                  (acc, r) => acc + r.changes.filter((c) => c.status === 'in_progress').length,
                  0
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Planned
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {releases.reduce(
                  (acc, r) => acc + r.changes.filter((c) => c.status === 'planned').length,
                  0
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <GitBranch className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Releases
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{releases.length}</p>
            </div>
          </div>
        </div>

        {/* Release Timeline */}
        <div className="space-y-8">
          {filteredReleases.map((release) => {
            const isExpanded = expandedReleases.includes(release.version);

            return (
              <div
                key={release.version}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Release Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleRelease(release.version)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          release.status === 'deployed'
                            ? 'bg-green-500'
                            : release.status === 'in_progress'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                        }`}
                      ></div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {release.version}
                          </h2>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[release.status]}`}
                          >
                            {release.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <Tag className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {release.title}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{release.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{release.date}</span>
                        </div>
                        {release.planFile && (
                          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 mt-1">
                            <FileText className="h-4 w-4" />
                            <span>{release.planFile}</span>
                          </div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Release Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-6">
                      <div className="space-y-6">
                        {release.changes.map((change, index) => (
                          <div
                            key={change.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {change.title}
                                  </h3>
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded border ${typeColors[change.type]}`}
                                  >
                                    {change.type}
                                  </span>
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[change.status]}`}
                                  >
                                    {change.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-3">
                                  {change.description}
                                </p>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      Impact:{' '}
                                    </span>
                                    <span
                                      className={`font-semibold ${impactColors[change.impact]}`}
                                    >
                                      {change.impact.toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      Category:{' '}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {change.category}
                                    </span>
                                  </div>
                                  {change.implementationDate && (
                                    <div>
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Implemented:{' '}
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {change.implementationDate}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {change.affectedComponents.length > 0 && (
                                  <div className="mt-3">
                                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                                      Affected Components:{' '}
                                    </span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {change.affectedComponents.map((component, compIndex) => (
                                        <span
                                          key={compIndex}
                                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                                        >
                                          {component}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {change.details && change.details.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                      Implementation Details:
                                    </h4>
                                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                      {change.details.map((detail, detailIndex) => (
                                        <li key={detailIndex} className="flex items-start">
                                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                          {detail}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Plan Files Reference */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Plan Files
          </h2>
          <p className="text-blue-800 dark:text-blue-300 mb-4">
            Detailed implementation plans are stored in the repository under{' '}
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">/plans/</code>{' '}
            directory.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <a
                href="/plans/001-shipnorth-mvp.md"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                001-shipnorth-mvp.md - Initial MVP implementation plan
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-blue-700 dark:text-blue-300">
                002-mobile-enhancement.md - Mobile improvements (In Progress)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-blue-700 dark:text-blue-300">
                003-analytics-enhancement.md - Analytics features (Planned)
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Change history automatically updated from implementation tracking • Last updated: August
            22, 2025
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
