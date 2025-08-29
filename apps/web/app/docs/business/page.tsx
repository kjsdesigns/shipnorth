'use client';

import { useState } from 'react';
import DocsLayout from '@/components/DocsLayout';
import {
  Users,
  Shield,
  Package,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Smartphone,
  Monitor,
  AlertCircle,
  DollarSign,
  FileText,
  Bell,
  Settings,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  actor: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: 'success' | 'warning' | 'error';
  details?: string[];
}

interface UserRole {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  workflows: string[];
}

export default function BusinessDocsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['roles']);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>('package-intake');

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const userRoles: UserRole[] = [
    {
      name: 'Staff',
      description:
        'Front-line employees who handle package intake, customer service, and daily operations',
      icon: UserCheck,
      permissions: [
        'Create and edit packages',
        'Manage customer information',
        'Purchase shipping labels',
        'Process payments',
        'View reports and analytics',
        'Manage loads and assignments',
      ],
      workflows: [
        'Package intake and labeling',
        'Customer registration',
        'Payment processing',
        'Load planning',
      ],
    },
    {
      name: 'Admin',
      description: 'System administrators with full access to all features and settings',
      icon: Shield,
      permissions: [
        'All staff permissions',
        'User management',
        'System configuration',
        'Carrier settings',
        'Notification setup',
        'Financial reports',
        'Audit logs',
        'Refund approval',
      ],
      workflows: [
        'All staff workflows',
        'User account management',
        'System configuration',
        'Financial oversight',
      ],
    },
    {
      name: 'Customer',
      description: 'End customers who ship packages through Shipnorth',
      icon: Users,
      permissions: [
        'View own packages',
        'Track shipments',
        'Manage payment methods',
        'Update contact information',
        'View invoices and payment history',
        'Receive notifications',
      ],
      workflows: ['Package tracking', 'Payment management', 'Account management'],
    },
    {
      name: 'Driver',
      description: 'Delivery drivers who transport loads and update package status',
      icon: Truck,
      permissions: [
        'View assigned loads',
        'Update package status',
        'Upload delivery photos',
        'Capture signatures',
        'Update GPS location',
        'Access mobile interface',
      ],
      workflows: ['Load management', 'Package delivery', 'Status updates', 'Proof of delivery'],
    },
  ];

  const workflows = {
    'package-intake': {
      title: 'Package Intake & Labeling',
      description: 'Complete workflow from package receipt to shipping label purchase',
      steps: [
        {
          id: '1',
          title: 'Package Receipt',
          description: 'Customer brings package to Shipnorth facility',
          actor: 'Customer',
          icon: Package,
          details: [
            'Customer arrives with package',
            'Staff verifies package contents',
            'Initial package inspection',
          ],
        },
        {
          id: '2',
          title: 'Package Registration',
          description: 'Staff creates package record in system',
          actor: 'Staff',
          icon: FileText,
          details: [
            'Enter package dimensions and weight',
            'Record package description and value',
            'Verify customer information',
            'Assign unique package ID',
          ],
        },
        {
          id: '3',
          title: 'Address Validation',
          description: 'System validates destination address',
          actor: 'System',
          icon: MapPin,
          status: 'warning',
          details: [
            'Automatic validation with Canada Post',
            'Manual override available for unrecognized addresses',
            'Address standardization and geocoding',
          ],
        },
        {
          id: '4',
          title: 'Rate Shopping',
          description: 'System queries carriers for shipping rates',
          actor: 'System',
          icon: DollarSign,
          details: [
            'Query all available carriers via ShipStation',
            'Apply markup calculations',
            'Highlight cheapest and fastest options',
            'Display retail comparison pricing',
          ],
        },
        {
          id: '5',
          title: 'Rate Selection',
          description: 'Staff or system selects shipping option',
          actor: 'Staff',
          icon: CheckCircle,
          details: [
            'Staff reviews rate options',
            'Can auto-select cheapest or manually choose',
            'Rate locked for 24 hours',
            'Customer notified of shipping cost',
          ],
        },
        {
          id: '6',
          title: 'Label Purchase',
          description: 'System purchases shipping label from carrier',
          actor: 'System',
          icon: CreditCard,
          status: 'success',
          details: [
            'Label purchased via ShipStation API',
            'Tracking number generated',
            'Label PDF stored in S3',
            'Package status updated to "Ready"',
          ],
        },
        {
          id: '7',
          title: 'Payment Processing',
          description: 'Customer charged for shipping cost',
          actor: 'System',
          icon: CreditCard,
          status: 'warning',
          details: [
            'Immediate charge on label purchase',
            'Uses saved payment method',
            'Invoice created and emailed',
            'Failed payments trigger notification',
          ],
        },
      ],
    },
    'payment-processing': {
      title: 'Payment Processing',
      description: 'How payments are handled from charge to completion',
      steps: [
        {
          id: '1',
          title: 'Payment Method Setup',
          description: 'Customer adds payment method to account',
          actor: 'Customer',
          icon: CreditCard,
          details: [
            'Stripe setup session created',
            'Customer redirected to secure form',
            'Payment method saved to Stripe',
            'Webhook confirms setup',
          ],
        },
        {
          id: '2',
          title: 'Charge Creation',
          description: 'Payment Intent created when label purchased',
          actor: 'System',
          icon: DollarSign,
          details: [
            'Stripe PaymentIntent created',
            'Off-session payment attempted',
            'Amount includes shipping + tax',
            'Invoice record created',
          ],
        },
        {
          id: '3',
          title: 'Payment Confirmation',
          description: 'Payment success or failure handling',
          actor: 'System',
          icon: CheckCircle,
          status: 'success',
          details: [
            'Success: Invoice marked paid, confirmation sent',
            'Failure: Customer notified, payment link provided',
            'Webhook processing for status updates',
            'Automatic retry logic for temporary failures',
          ],
        },
        {
          id: '4',
          title: 'Refund Processing',
          description: 'Manual refund approval and processing',
          actor: 'Admin',
          icon: XCircle,
          status: 'warning',
          details: [
            'Admin approval required for all refunds',
            'Void shipping label first',
            'Process Stripe refund',
            'Update invoice status',
            'Notify customer of refund',
          ],
        },
      ],
    },
    'load-planning': {
      title: 'Load Planning & Delivery',
      description: 'Optimizing package grouping and delivery routing',
      steps: [
        {
          id: '1',
          title: 'AI Optimization',
          description: 'System suggests optimal package grouping',
          actor: 'System',
          icon: Settings,
          details: [
            'Group packages by postal code proximity',
            'Consider departure dates and capacity',
            'Optimize for delivery efficiency',
            'Factor in package priorities',
          ],
        },
        {
          id: '2',
          title: 'Manual Review',
          description: 'Staff reviews and adjusts load assignments',
          actor: 'Staff',
          icon: Eye,
          details: [
            'Review AI suggestions',
            'Manual adjustments as needed',
            'Consider special requirements',
            'Confirm vehicle capacity limits',
          ],
        },
        {
          id: '3',
          title: 'Load Creation',
          description: 'Finalize load and generate manifest',
          actor: 'Staff',
          icon: FileText,
          status: 'success',
          details: [
            'Assign driver and vehicle',
            'Set departure date/time',
            'Generate manifest PDF',
            'Send notifications to driver',
          ],
        },
        {
          id: '4',
          title: 'Driver Assignment',
          description: 'Driver receives load assignment and begins delivery',
          actor: 'Driver',
          icon: Truck,
          details: [
            'Driver logs into mobile interface',
            'Reviews package manifest',
            'Confirms load pickup',
            'Begins GPS tracking',
          ],
        },
      ],
    },
    'tracking-delivery': {
      title: 'Tracking & Delivery',
      description: 'Real-time tracking and delivery confirmation',
      steps: [
        {
          id: '1',
          title: 'Status Polling',
          description: 'System polls carriers for tracking updates',
          actor: 'System',
          icon: Clock,
          details: [
            'Poll ShipStation every 5 minutes',
            'Update package status in database',
            'Calculate delivery ETAs',
            'Trigger customer notifications',
          ],
        },
        {
          id: '2',
          title: 'GPS Tracking',
          description: 'Real-time location updates from driver',
          actor: 'Driver',
          icon: MapPin,
          details: [
            'Automatic GPS updates from mobile device',
            'Manual check-ins at key locations',
            'Route optimization updates',
            'Live map updates for customers',
          ],
        },
        {
          id: '3',
          title: 'Delivery Attempt',
          description: 'Package delivery and proof capture',
          actor: 'Driver',
          icon: Package,
          status: 'warning',
          details: [
            'Scan package barcode',
            'Capture recipient signature',
            'Take delivery photo',
            'Update package status',
          ],
        },
        {
          id: '4',
          title: 'Delivery Confirmation',
          description: 'Final status update and customer notification',
          actor: 'System',
          icon: CheckCircle,
          status: 'success',
          details: [
            'Mark package as delivered',
            'Store proof of delivery',
            'Send confirmation to customer',
            'Update tracking history',
          ],
        },
      ],
    },
  };

  const businessRules = [
    {
      title: 'Package Intake',
      icon: Package,
      rules: [
        'Staff-only package creation - customers cannot self-service intake',
        'All dimensions and weight required before proceeding',
        'Address validation with Canada Post API, manual override allowed',
        'Customer must have valid payment method on file',
      ],
    },
    {
      title: 'Rate Shopping',
      icon: DollarSign,
      rules: [
        'Query all available carriers via ShipStation for each package',
        'Apply markup: (base_rate × percentage) + fixed_amount per carrier',
        'Highlight cheapest and fastest options automatically',
        'Rate quotes valid for 24 hours, must be refreshed after',
      ],
    },
    {
      title: 'Payment Processing',
      icon: CreditCard,
      rules: [
        'Immediate charge triggered on shipping label purchase',
        'Off-session payment using saved payment methods',
        'Failed payments generate customer notification with payment link',
        'Manual approval required for all refunds',
      ],
    },
    {
      title: 'Load Planning',
      icon: Truck,
      rules: [
        'AI suggests optimal package grouping by postal code proximity',
        'Staff can manually override AI suggestions',
        'Vehicle capacity limits enforced automatically',
        'Driver assignments must be confirmed before departure',
      ],
    },
    {
      title: 'Tracking Updates',
      icon: MapPin,
      rules: [
        'System polls carrier APIs every 5 minutes for status updates',
        'GPS tracking updates from driver devices in real-time',
        'Customer notifications triggered on status changes',
        'Delivery requires photo and signature proof',
      ],
    },
    {
      title: 'Data Retention',
      icon: FileText,
      rules: [
        'Package data retained indefinitely for audit purposes',
        'Delivery photos stored for 2 years minimum',
        'Payment records retained for 7 years per regulation',
        'Customer can request data deletion (PIPEDA compliance)',
      ],
    },
  ];

  const interfaceGuides = [
    {
      title: 'Staff Portal',
      description: 'Web-based interface for package management and operations',
      icon: Monitor,
      features: [
        'Package intake and editing',
        'Customer management',
        'Rate shopping and label purchase',
        'Load planning and assignment',
        'Analytics and reporting',
        'Payment processing',
      ],
      access: 'Desktop/laptop browsers, staff credentials required',
    },
    {
      title: 'Customer Portal',
      description: 'Self-service portal for customers to track packages',
      icon: Users,
      features: [
        'Package tracking with live map',
        'Invoice viewing and payment',
        'Payment method management',
        'Contact information updates',
        'Notification preferences',
        'Delivery history',
      ],
      access: 'Web browser, customer account required',
    },
    {
      title: 'Driver Mobile Interface',
      description: 'Mobile-optimized interface for delivery drivers',
      icon: Smartphone,
      features: [
        'Load manifest viewing',
        'Package scanning and updates',
        'GPS location sharing',
        'Photo capture and signatures',
        'Route optimization',
        'Status updates',
      ],
      access: 'Mobile web browser, driver credentials required',
    },
  ];

  return (
    <DocsLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Business Documentation
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Workflows, processes, and user guides for Shipnorth operations
              </p>
            </div>
          </div>
        </div>

        {/* User Roles Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Shield className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
              User Roles & Permissions
            </h2>
            <button
              onClick={() => toggleSection('roles')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {expandedSections.includes('roles') ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>

          {expandedSections.includes('roles') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userRoles.map((role, index) => {
                const Icon = role.icon;
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {role.name}
                        </h3>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{role.description}</p>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Permissions:
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {role.permissions.map((permission, permIndex) => (
                          <li key={permIndex} className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Primary Workflows:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {role.workflows.map((workflow, workIndex) => (
                          <span
                            key={workIndex}
                            className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium"
                          >
                            {workflow}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Workflows Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Settings className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
            Business Workflows
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(workflows).map(([key, workflow]) => (
              <button
                key={key}
                onClick={() => setSelectedWorkflow(key)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedWorkflow === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {workflow.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{workflow.description}</p>
              </button>
            ))}
          </div>

          {selectedWorkflow && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {workflows[selectedWorkflow as keyof typeof workflows].title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {workflows[selectedWorkflow as keyof typeof workflows].description}
              </p>

              <div className="space-y-6">
                {workflows[selectedWorkflow as keyof typeof workflows].steps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast =
                    index ===
                    workflows[selectedWorkflow as keyof typeof workflows].steps.length - 1;

                  return (
                    <div key={step.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            step.status === 'success'
                              ? 'bg-green-100 dark:bg-green-900/20'
                              : step.status === 'warning'
                                ? 'bg-orange-100 dark:bg-orange-900/20'
                                : step.status === 'error'
                                  ? 'bg-red-100 dark:bg-red-900/20'
                                  : 'bg-blue-100 dark:bg-blue-900/20'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              step.status === 'success'
                                ? 'text-green-600 dark:text-green-400'
                                : step.status === 'warning'
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : step.status === 'error'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-blue-600 dark:text-blue-400'
                            }`}
                          />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 h-16 bg-gray-200 dark:bg-gray-600 mt-4"></div>
                        )}
                      </div>

                      <div className="flex-1 pb-8">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {step.title}
                          </h4>
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium">
                            {step.actor}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">{step.description}</p>

                        {step.details && (
                          <ul className="space-y-1">
                            {step.details.map((detail, detailIndex) => (
                              <li
                                key={detailIndex}
                                className="flex items-start text-sm text-gray-600 dark:text-gray-300"
                              >
                                <ArrowRight className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Business Rules Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertCircle className="h-6 w-6 mr-3 text-orange-600 dark:text-orange-400" />
            Business Rules & Policies
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {businessRules.map((category, index) => {
              const Icon = category.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {category.rules.map((rule, ruleIndex) => (
                      <li
                        key={ruleIndex}
                        className="flex items-start text-sm text-gray-600 dark:text-gray-300"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Interface Guides Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Monitor className="h-6 w-6 mr-3 text-indigo-600 dark:text-indigo-400" />
            User Interface Guides
          </h2>

          <div className="space-y-6">
            {interfaceGuides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {guide.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{guide.description}</p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            Key Features:
                          </h4>
                          <ul className="space-y-2">
                            {guide.features.map((feature, featureIndex) => (
                              <li
                                key={featureIndex}
                                className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            Access Requirements:
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                            {guide.access}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertCircle className="h-6 w-6 mr-3 text-red-600 dark:text-red-400" />
            Troubleshooting Guide
          </h2>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6 space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Common Issues
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400">Payment Failed</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-2">
                      Customer payment cannot be processed
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                      <li>• Check if customer has valid payment method on file</li>
                      <li>• Verify card is not expired or over limit</li>
                      <li>• Send payment link for customer to update method</li>
                      <li>• Contact customer if multiple attempts fail</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400">
                      Label Purchase Failed
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-2">
                      Shipping label cannot be purchased from carrier
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                      <li>• Verify address validation was successful</li>
                      <li>• Check carrier API status and connectivity</li>
                      <li>• Try alternative carrier or service</li>
                      <li>• Contact technical support if issue persists</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400">
                      Package Not Tracking
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-2">
                      Tracking information not updating
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                      <li>• Allow 24-48 hours for tracking to activate</li>
                      <li>• Verify tracking number is correct</li>
                      <li>• Check if package was actually picked up by carrier</li>
                      <li>• Contact carrier directly for status</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Emergency Contacts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                    <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">
                      Technical Support
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <Phone className="h-4 w-4 inline mr-1" />
                      1-800-SHIPTECH
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      24/7 for critical system issues
                    </p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-4">
                    <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">
                      Operations Manager
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      <Phone className="h-4 w-4 inline mr-1" />
                      1-800-SHIPOPS
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Business hours for operational issues
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Business Documentation • Last updated: August 22, 2025</p>
          <p className="mt-1">
            For technical API documentation, see{' '}
            <a href="/docs/api" className="text-blue-600 dark:text-blue-400 hover:underline">
              API Reference
            </a>
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
