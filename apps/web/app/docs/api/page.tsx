'use client';

import { useState } from 'react';
import DocsLayout from '@/components/DocsLayout';
import CodeBlock from '@/components/CodeBlock';
import {
  Shield,
  Key,
  Users,
  Package,
  Truck,
  FileText,
  Webhook,
  Settings,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Code,
  Play,
  ExternalLink,
} from 'lucide-react';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  auth: boolean;
  roles?: string[];
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    type: string;
    description: string;
    example: any;
  };
  responses: Array<{
    code: number;
    description: string;
    example?: any;
  }>;
}

interface APISection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoints: APIEndpoint[];
}

export default function APIDocsPage() {
  const [expandedEndpoints, setExpandedEndpoints] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>(
    'curl'
  );

  const toggleEndpoint = (endpointId: string) => {
    setExpandedEndpoints((prev) =>
      prev.includes(endpointId) ? prev.filter((id) => id !== endpointId) : [...prev, endpointId]
    );
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateCodeExample = (
    endpoint: APIEndpoint,
    language: 'curl' | 'javascript' | 'python'
  ) => {
    const baseUrl = 'https://api.shipnorth.com';
    const fullUrl = `${baseUrl}${endpoint.path}`;

    switch (language) {
      case 'curl':
        return `curl -X ${endpoint.method} "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  ${endpoint.auth ? `-H "Authorization: Bearer YOUR_TOKEN" \\` : ''}${endpoint.requestBody ? `\n  -d '${JSON.stringify(endpoint.requestBody.example, null, 2)}'` : ''}`;

      case 'javascript':
        return `const response = await fetch('${fullUrl}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',${endpoint.auth ? `\n    'Authorization': 'Bearer YOUR_TOKEN',` : ''}
  },${endpoint.requestBody ? `\n  body: JSON.stringify(${JSON.stringify(endpoint.requestBody.example, null, 2)})` : ''}
});

const data = await response.json();`;

      case 'python':
        return `import requests

${
  endpoint.auth
    ? `headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
}`
    : `headers = {'Content-Type': 'application/json'}`
}

response = requests.${endpoint.method.toLowerCase()}(
    '${fullUrl}',
    headers=headers,${endpoint.requestBody ? `\n    json=${JSON.stringify(endpoint.requestBody.example, null, 2).replace(/"/g, "'")}` : ''}
)

data = response.json()`;
    }
  };

  const apiSections: APISection[] = [
    {
      title: 'Authentication',
      description: 'Manage user sessions and tokens',
      icon: Shield,
      endpoints: [
        {
          method: 'POST',
          path: '/auth/login',
          summary: 'User login',
          description: 'Authenticate a user and receive access/refresh tokens',
          auth: false,
          requestBody: {
            type: 'object',
            description: 'Login credentials',
            example: {
              email: 'user@example.com',
              password: 'password123',
              userType: 'staff',
            },
          },
          responses: [
            {
              code: 200,
              description: 'Login successful',
              example: {
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                user: {
                  id: 'user-123',
                  email: 'user@example.com',
                  role: 'staff',
                  firstName: 'John',
                  lastName: 'Doe',
                },
              },
            },
            {
              code: 401,
              description: 'Invalid credentials',
            },
          ],
        },
        {
          method: 'POST',
          path: '/auth/refresh',
          summary: 'Refresh access token',
          description: 'Get a new access token using refresh token',
          auth: false,
          requestBody: {
            type: 'object',
            description: 'Refresh token',
            example: {
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
          responses: [
            {
              code: 200,
              description: 'Token refreshed',
              example: {
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
            },
          ],
        },
        {
          method: 'POST',
          path: '/auth/register',
          summary: 'Register new customer',
          description: 'Create a new customer account',
          auth: false,
          requestBody: {
            type: 'object',
            description: 'Customer registration data',
            example: {
              email: 'customer@example.com',
              password: 'password123',
              firstName: 'Jane',
              lastName: 'Smith',
              phone: '+1-555-0123',
              addressLine1: '123 Main St',
              city: 'Toronto',
              province: 'ON',
              postalCode: 'M5V 3A1',
              country: 'Canada',
            },
          },
          responses: [
            {
              code: 201,
              description: 'Customer created successfully',
            },
            {
              code: 400,
              description: 'Email already registered',
            },
          ],
        },
      ],
    },
    {
      title: 'Customers',
      description: 'Manage customer accounts and information',
      icon: Users,
      endpoints: [
        {
          method: 'GET',
          path: '/customers',
          summary: 'List customers',
          description: 'Retrieve a list of customers (staff only)',
          auth: true,
          roles: ['staff', 'admin'],
          parameters: [
            {
              name: 'page',
              type: 'integer',
              required: false,
              description: 'Page number for pagination',
            },
            {
              name: 'limit',
              type: 'integer',
              required: false,
              description: 'Number of items per page',
            },
            {
              name: 'search',
              type: 'string',
              required: false,
              description: 'Search by name or email',
            },
          ],
          responses: [
            {
              code: 200,
              description: 'List of customers',
              example: {
                customers: [
                  {
                    id: 'customer-123',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane@example.com',
                    phone: '+1-555-0123',
                    status: 'active',
                    createdAt: '2025-08-22T10:00:00Z',
                  },
                ],
                pagination: {
                  page: 1,
                  limit: 20,
                  total: 50,
                  pages: 3,
                },
              },
            },
          ],
        },
        {
          method: 'GET',
          path: '/customers/{id}',
          summary: 'Get customer details',
          description: 'Retrieve detailed information about a specific customer',
          auth: true,
          roles: ['staff', 'admin', 'customer'],
          parameters: [{ name: 'id', type: 'string', required: true, description: 'Customer ID' }],
          responses: [
            {
              code: 200,
              description: 'Customer details',
              example: {
                id: 'customer-123',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                phone: '+1-555-0123',
                address: {
                  line1: '123 Main St',
                  city: 'Toronto',
                  province: 'ON',
                  postalCode: 'M5V 3A1',
                  country: 'Canada',
                },
                status: 'active',
                paymentMethods: ['card_***4242'],
                createdAt: '2025-08-22T10:00:00Z',
              },
            },
            {
              code: 404,
              description: 'Customer not found',
            },
          ],
        },
        {
          method: 'POST',
          path: '/customers',
          summary: 'Create customer',
          description: 'Create a new customer (staff only)',
          auth: true,
          roles: ['staff', 'admin'],
          requestBody: {
            type: 'object',
            description: 'Customer information',
            example: {
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              phone: '+1-555-0123',
              addressLine1: '123 Main St',
              city: 'Toronto',
              province: 'ON',
              postalCode: 'M5V 3A1',
              country: 'Canada',
            },
          },
          responses: [
            {
              code: 201,
              description: 'Customer created successfully',
            },
            {
              code: 400,
              description: 'Invalid customer data',
            },
          ],
        },
      ],
    },
    {
      title: 'Packages',
      description: 'Package management and shipping operations',
      icon: Package,
      endpoints: [
        {
          method: 'POST',
          path: '/packages',
          summary: 'Create package',
          description: 'Create a new package for shipping',
          auth: true,
          roles: ['staff', 'admin'],
          requestBody: {
            type: 'object',
            description: 'Package details',
            example: {
              customerId: 'customer-123',
              description: 'Electronics',
              dimensions: {
                length: 12,
                width: 8,
                height: 4,
              },
              weight: 2.5,
              value: 299.99,
              shipTo: {
                name: 'Jane Smith',
                addressLine1: '456 Elm St',
                city: 'Vancouver',
                province: 'BC',
                postalCode: 'V6B 1A1',
                country: 'Canada',
              },
            },
          },
          responses: [
            {
              code: 201,
              description: 'Package created successfully',
              example: {
                id: 'package-456',
                customerId: 'customer-123',
                status: 'unlabeled',
                trackingNumber: null,
                createdAt: '2025-08-22T14:30:00Z',
              },
            },
          ],
        },
        {
          method: 'GET',
          path: '/packages',
          summary: 'List packages',
          description: 'Retrieve packages with optional filtering',
          auth: true,
          parameters: [
            {
              name: 'customerId',
              type: 'string',
              required: false,
              description: 'Filter by customer',
            },
            { name: 'status', type: 'string', required: false, description: 'Filter by status' },
            { name: 'page', type: 'integer', required: false, description: 'Page number' },
            { name: 'limit', type: 'integer', required: false, description: 'Items per page' },
          ],
          responses: [
            {
              code: 200,
              description: 'List of packages',
              example: {
                packages: [
                  {
                    id: 'package-456',
                    customerId: 'customer-123',
                    description: 'Electronics',
                    status: 'ready',
                    trackingNumber: '1Z999AA1234567890',
                    estimatedDelivery: '2025-08-25T16:00:00Z',
                    createdAt: '2025-08-22T14:30:00Z',
                  },
                ],
                pagination: {
                  page: 1,
                  limit: 20,
                  total: 15,
                  pages: 1,
                },
              },
            },
          ],
        },
        {
          method: 'POST',
          path: '/packages/{id}/quote',
          summary: 'Get shipping rates',
          description: 'Get shipping rate quotes from available carriers',
          auth: true,
          roles: ['staff', 'admin'],
          parameters: [{ name: 'id', type: 'string', required: true, description: 'Package ID' }],
          responses: [
            {
              code: 200,
              description: 'Shipping rate quotes',
              example: {
                quotes: [
                  {
                    carrierId: 'ups',
                    serviceName: 'UPS Ground',
                    rate: 12.5,
                    markup: 3.75,
                    totalRate: 16.25,
                    estimatedDays: 3,
                    fastest: false,
                    cheapest: true,
                  },
                  {
                    carrierId: 'fedex',
                    serviceName: 'FedEx Express',
                    rate: 24.99,
                    markup: 7.5,
                    totalRate: 32.49,
                    estimatedDays: 1,
                    fastest: true,
                    cheapest: false,
                  },
                ],
                validUntil: '2025-08-23T14:30:00Z',
              },
            },
          ],
        },
        {
          method: 'POST',
          path: '/packages/{id}/purchase-label',
          summary: 'Purchase shipping label',
          description: 'Purchase shipping label and charge customer',
          auth: true,
          roles: ['staff', 'admin'],
          parameters: [{ name: 'id', type: 'string', required: true, description: 'Package ID' }],
          requestBody: {
            type: 'object',
            description: 'Selected shipping option',
            example: {
              carrierId: 'ups',
              serviceName: 'UPS Ground',
              rate: 16.25,
            },
          },
          responses: [
            {
              code: 200,
              description: 'Label purchased successfully',
              example: {
                trackingNumber: '1Z999AA1234567890',
                labelUrl: 'https://s3.amazonaws.com/shipnorth/labels/label-789.pdf',
                invoiceId: 'invoice-321',
                estimatedDelivery: '2025-08-25T16:00:00Z',
              },
            },
            {
              code: 402,
              description: 'Payment failed',
            },
          ],
        },
      ],
    },
    {
      title: 'Loads',
      description: 'Load planning and management for deliveries',
      icon: Truck,
      endpoints: [
        {
          method: 'GET',
          path: '/loads',
          summary: 'List loads',
          description: 'Retrieve all loads with optional filtering',
          auth: true,
          roles: ['staff', 'admin', 'driver'],
          parameters: [
            { name: 'status', type: 'string', required: false, description: 'Filter by status' },
            {
              name: 'driverName',
              type: 'string',
              required: false,
              description: 'Filter by driver',
            },
            {
              name: 'date',
              type: 'string',
              required: false,
              description: 'Filter by departure date',
            },
          ],
          responses: [
            {
              code: 200,
              description: 'List of loads',
              example: {
                loads: [
                  {
                    id: 'load-789',
                    departureDate: '2025-08-23T08:00:00Z',
                    mode: 'Truck',
                    driverName: 'Mike Johnson',
                    status: 'in_transit',
                    packageCount: 15,
                    estimatedArrival: '2025-08-25T18:00:00Z',
                  },
                ],
              },
            },
          ],
        },
        {
          method: 'POST',
          path: '/loads',
          summary: 'Create load',
          description: 'Create a new load for package delivery',
          auth: true,
          roles: ['staff', 'admin'],
          requestBody: {
            type: 'object',
            description: 'Load details',
            example: {
              departureDate: '2025-08-23T08:00:00Z',
              mode: 'Truck',
              driverName: 'Mike Johnson',
              vehicleId: 'TRUCK-001',
              packages: ['package-456', 'package-789'],
            },
          },
          responses: [
            {
              code: 201,
              description: 'Load created successfully',
              example: {
                id: 'load-789',
                status: 'planned',
                manifestUrl: 'https://s3.amazonaws.com/shipnorth/manifests/manifest-789.pdf',
              },
            },
          ],
        },
      ],
    },
    {
      title: 'Invoices',
      description: 'Invoice and payment management',
      icon: FileText,
      endpoints: [
        {
          method: 'GET',
          path: '/invoices',
          summary: 'List invoices',
          description: 'Retrieve invoices with optional filtering',
          auth: true,
          parameters: [
            {
              name: 'customerId',
              type: 'string',
              required: false,
              description: 'Filter by customer',
            },
            {
              name: 'status',
              type: 'string',
              required: false,
              description: 'Filter by payment status',
            },
            { name: 'dateFrom', type: 'string', required: false, description: 'Start date filter' },
            { name: 'dateTo', type: 'string', required: false, description: 'End date filter' },
          ],
          responses: [
            {
              code: 200,
              description: 'List of invoices',
              example: {
                invoices: [
                  {
                    id: 'invoice-321',
                    customerId: 'customer-123',
                    packageId: 'package-456',
                    amount: 16.25,
                    tax: 2.11,
                    total: 18.36,
                    status: 'paid',
                    paidAt: '2025-08-22T15:00:00Z',
                    createdAt: '2025-08-22T14:45:00Z',
                  },
                ],
              },
            },
          ],
        },
        {
          method: 'POST',
          path: '/invoices/{id}/retry-payment',
          summary: 'Retry failed payment',
          description: 'Retry payment for a failed invoice',
          auth: true,
          roles: ['staff', 'admin'],
          parameters: [{ name: 'id', type: 'string', required: true, description: 'Invoice ID' }],
          responses: [
            {
              code: 200,
              description: 'Payment retry initiated',
              example: {
                status: 'processing',
                paymentIntentId: 'pi_1234567890',
              },
            },
          ],
        },
      ],
    },
  ];

  const methodColors = {
    GET: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700',
    POST: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700',
    PUT: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700',
    DELETE:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700',
  };

  return (
    <DocsLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Code className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">API Reference</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Complete API documentation with interactive examples
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Base URL</h3>
            <code className="text-blue-800 dark:text-blue-400 font-mono">
              https://api.shipnorth.com
            </code>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              All API requests should be made to this base URL with HTTPS.
            </p>
          </div>

          {/* Quick Start */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Authentication
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Include your access token in the Authorization header:
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-sm">
                Authorization: Bearer YOUR_ACCESS_TOKEN
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <ExternalLink className="h-5 w-5 mr-2" />
                Interactive Testing
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Try endpoints directly from this documentation with real data.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center">
                <Play className="h-4 w-4 mr-2" />
                Try Now
              </button>
            </div>
          </div>
        </div>

        {/* API Sections */}
        <div className="space-y-8">
          {apiSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <div
                key={sectionIndex}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{section.description}</p>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {section.endpoints.map((endpoint, endpointIndex) => {
                    const endpointId = `${sectionIndex}-${endpointIndex}`;
                    const isExpanded = expandedEndpoints.includes(endpointId);

                    return (
                      <div key={endpointIndex} className="p-6">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleEndpoint(endpointId)}
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded border ${methodColors[endpoint.method]}`}
                            >
                              {endpoint.method}
                            </span>
                            <code className="font-mono text-gray-900 dark:text-gray-100">
                              {endpoint.path}
                            </code>
                            <span className="text-gray-600 dark:text-gray-300">
                              {endpoint.summary}
                            </span>
                            {endpoint.auth && <Shield className="h-4 w-4 text-orange-500" />}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-6 space-y-6">
                            <p className="text-gray-600 dark:text-gray-300">
                              {endpoint.description}
                            </p>

                            {/* Auth and Roles */}
                            {endpoint.auth && (
                              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                  <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                    Requires Authentication
                                  </span>
                                </div>
                                {endpoint.roles && (
                                  <p className="text-sm text-orange-700 dark:text-orange-300">
                                    Roles: {endpoint.roles.join(', ')}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Parameters */}
                            {endpoint.parameters && endpoint.parameters.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                  Parameters
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                                          Name
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                                          Type
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                                          Required
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                                          Description
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                      {endpoint.parameters.map((param, paramIndex) => (
                                        <tr key={paramIndex}>
                                          <td className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100">
                                            {param.name}
                                          </td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                            {param.type}
                                          </td>
                                          <td className="px-3 py-2">
                                            {param.required ? (
                                              <span className="text-red-600 dark:text-red-400 font-medium">
                                                Yes
                                              </span>
                                            ) : (
                                              <span className="text-gray-500 dark:text-gray-400">
                                                No
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                            {param.description}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Request Body */}
                            {endpoint.requestBody && (
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                  Request Body
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                  {endpoint.requestBody.description}
                                </p>
                                <CodeBlock
                                  code={JSON.stringify(endpoint.requestBody.example, null, 2)}
                                  language="json"
                                  showCopy={true}
                                />
                              </div>
                            )}

                            {/* Code Examples */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  Code Examples
                                </h4>
                                <select
                                  value={selectedLanguage}
                                  onChange={(e) => setSelectedLanguage(e.target.value as any)}
                                  className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
                                >
                                  <option value="curl">cURL</option>
                                  <option value="javascript">JavaScript</option>
                                  <option value="python">Python</option>
                                </select>
                              </div>
                              <CodeBlock
                                code={generateCodeExample(endpoint, selectedLanguage)}
                                language={selectedLanguage}
                                showCopy={true}
                              />
                            </div>

                            {/* Responses */}
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                Responses
                              </h4>
                              <div className="space-y-4">
                                {endpoint.responses.map((response, responseIndex) => (
                                  <div
                                    key={responseIndex}
                                    className="border border-gray-200 dark:border-gray-600 rounded"
                                  >
                                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                      <div className="flex items-center space-x-2">
                                        <span
                                          className={`px-2 py-1 text-xs font-semibold rounded ${
                                            response.code < 300
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                              : response.code < 500
                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                          }`}
                                        >
                                          {response.code}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                          {response.description}
                                        </span>
                                      </div>
                                    </div>
                                    {response.example && (
                                      <div className="p-4">
                                        <CodeBlock
                                          code={JSON.stringify(response.example, null, 2)}
                                          language="json"
                                          showCopy={true}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Try it out button */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors flex items-center">
                                <Play className="h-4 w-4 mr-2" />
                                Try this endpoint
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>API Documentation auto-generated from source code • Last updated: August 22, 2025</p>
        </div>
      </div>
    </DocsLayout>
  );
}
