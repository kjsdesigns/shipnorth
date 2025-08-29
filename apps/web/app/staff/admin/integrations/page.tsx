'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, settingsAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import {
  Key,
  Shield,
  Globe,
  Database,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ExternalLink,
  Settings,
  DollarSign,
  Package,
  MapPin,
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  apiKey?: string;
  endpoint?: string;
  config?: any;
}

export default function SystemIntegrations() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (!currentUser.roles?.includes('admin') && currentUser.role !== 'admin')) {
      router.push('/staff');
      return;
    }

    setUser(currentUser);
    loadIntegrations();
  }, [router]);

  const loadIntegrations = async () => {
    try {
      // In a real app, this would fetch from settings API
      const mockIntegrations: Integration[] = [
        {
          id: 'stripe',
          name: 'Stripe Payment Processing',
          description: 'Handle customer payments and billing',
          status: 'connected',
          lastSync: new Date(Date.now() - 1800000).toISOString(),
          apiKey: 'sk_test_****************************',
          endpoint: 'https://api.stripe.com',
          config: {
            webhookSecret: 'whsec_****************************',
            currency: 'CAD',
          },
        },
        {
          id: 'shipstation',
          name: 'ShipStation Carrier Integration',
          description: 'Generate shipping labels and track packages',
          status: 'connected',
          lastSync: new Date(Date.now() - 900000).toISOString(),
          apiKey: 'SS-****************************',
          endpoint: 'https://ssapi.shipstation.com',
          config: {
            storeId: '123456',
            defaultCarrier: 'canada_post',
          },
        },
        {
          id: 'paypal',
          name: 'PayPal Payment Processing',
          description: 'Alternative payment method for customers',
          status: 'connected',
          lastSync: new Date(Date.now() - 3600000).toISOString(),
          apiKey: 'AX****************************',
          endpoint: 'https://api.paypal.com',
          config: {
            environment: 'sandbox',
            webhookId: 'WH-****************************',
          },
        },
        {
          id: 'geocoding',
          name: 'Google Geocoding API',
          description: 'Convert addresses to coordinates for mapping',
          status: 'connected',
          lastSync: new Date(Date.now() - 600000).toISOString(),
          apiKey: 'AIza****************************',
          endpoint: 'https://maps.googleapis.com',
          config: {
            region: 'CA',
            language: 'en',
          },
        },
        {
          id: 'sentry',
          name: 'Sentry Error Monitoring',
          description: 'Application error tracking and performance monitoring',
          status: 'error',
          apiKey: 'Not configured',
          endpoint: 'https://sentry.io',
          config: {
            environment: 'production',
          },
        },
      ];

      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Globe className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600';
    }
  };

  const toggleApiKeyVisibility = (integrationId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [integrationId]: !prev[integrationId],
    }));
  };

  const testIntegration = async (integrationId: string) => {
    console.log(`Testing integration: ${integrationId}`);
    // Would implement actual integration testing
  };

  const maskApiKey = (apiKey: string): string => {
    if (!apiKey || apiKey === 'Not configured') return apiKey;
    const visibleLength = 4;
    const masked =
      apiKey.slice(0, visibleLength) + '*'.repeat(Math.max(0, apiKey.length - visibleLength));
    return masked;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ModernLayout role="staff">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage external service integrations and API keys
          </p>
        </div>

        {/* Integration Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Connected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {integrations.filter((i) => i.status === 'connected').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {integrations.filter((i) => i.status === 'error').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Globe className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {integrations.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations List */}
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 mr-4">
                      {integration.id === 'stripe' ? (
                        <DollarSign className="h-6 w-6" />
                      ) : integration.id === 'shipstation' ? (
                        <Package className="h-6 w-6" />
                      ) : integration.id === 'paypal' ? (
                        <DollarSign className="h-6 w-6" />
                      ) : integration.id === 'geocoding' ? (
                        <MapPin className="h-6 w-6" />
                      ) : (
                        <Database className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {integration.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(integration.status)}`}
                    >
                      {getStatusIcon(integration.status)}
                      <span className="ml-1">{integration.status.toUpperCase()}</span>
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Key
                    </label>
                    <div className="flex items-center">
                      <input
                        type={showApiKeys[integration.id] ? 'text' : 'password'}
                        value={
                          showApiKeys[integration.id]
                            ? integration.apiKey
                            : maskApiKey(integration.apiKey || '')
                        }
                        readOnly
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                      />
                      <button
                        onClick={() => toggleApiKeyVisibility(integration.id)}
                        className="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showApiKeys[integration.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Endpoint
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={integration.endpoint || ''}
                        readOnly
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      {integration.endpoint && (
                        <a
                          href={integration.endpoint}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {integration.lastSync && (
                  <div className="mt-3 text-xs text-gray-500">
                    Last synced: {new Date(integration.lastSync).toLocaleString()}
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => testIntegration(integration.id)}
                    className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1 rounded text-sm"
                  >
                    Test Connection
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModernLayout>
  );
}
