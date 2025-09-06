'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { packageAPI } from '@/lib/api';
import useServerSession from '@/hooks/useServerSession';
import {
  Package,
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Mail,
  Package2,
  Weight,
  Ruler,
  DollarSign,
  Eye,
  Copy,
  RefreshCw,
  Bell,
  Star,
  Download,
  Share,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface TrackingEvent {
  id: string;
  timestamp: string;
  status: string;
  description: string;
  location?: string;
  details?: string;
}

export default function PackageTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const trackingNumber = params.trackingNumber as string;

  const { user, loading: authLoading, hasRole } = useServerSession();
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock tracking events for demo
  const [trackingEvents] = useState<TrackingEvent[]>([
    {
      id: '4',
      timestamp: new Date().toISOString(),
      status: 'in_transit',
      description: 'Package is in transit',
      location: 'Toronto, ON',
      details: 'On delivery truck for final delivery',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      description: 'Arrived at local facility',
      location: 'Mississauga, ON',
      details: 'Package sorted for delivery',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_transit',
      description: 'In transit to destination',
      location: 'Montreal, QC',
      details: 'Package on route to destination city',
    },
    {
      id: '1',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      status: 'ready',
      description: 'Package picked up',
      location: 'Calgary, AB',
      details: 'Package collected from origin',
    },
  ]);

  // Server-side authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ PACKAGE TRACKING: No authenticated user, redirecting');
        router.push('/login/');
        return;
      }
      
      if (!hasRole('customer')) {
        console.log('❌ PACKAGE TRACKING: User lacks customer role');
        router.push('/login/');
        return;
      }
      
      console.log('✅ PACKAGE TRACKING: User authenticated via server session');
      setLoading(false);
    }
  }, [user, authLoading, hasRole, router]);

  // Load package data when user is authenticated
  useEffect(() => {
    if (user && hasRole('customer') && !loading && trackingNumber) {
      loadPackageData();
    }
  }, [user, hasRole, loading, trackingNumber]);

  const loadPackageData = async () => {
    if (!trackingNumber) return;

    try {
      const packagesRes = await packageAPI.list();
      const pkg = packagesRes.data.packages?.find(
        (p: any) => p.trackingNumber === trackingNumber && p.customerId === user?.customerId
      );

      if (!pkg) {
        setError('Package not found or you do not have permission to view it.');
        return;
      }

      setPackageData(pkg);
    } catch (error) {
      console.error('Error loading package:', error);
      setError('Failed to load package information.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPackageData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 dark:text-green-400';
      case 'in_transit':
        return 'text-blue-600 dark:text-blue-400';
      case 'ready':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'exception':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'ready':
        return <Package2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'exception':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Package Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/portal"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/portal"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Package Tracking
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Real-time shipment updates
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Tracking Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(packageData?.shipmentStatus)}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {trackingNumber}
                    </h2>
                    <p
                      className={`text-sm font-medium ${getStatusColor(packageData?.shipmentStatus)}`}
                    >
                      {packageData?.shipmentStatus?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyTrackingNumber}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {packageData?.estimatedDeliveryDate && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>
                    Expected delivery:{' '}
                    {new Date(packageData.estimatedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Tracking History
              </h3>

              <div className="space-y-6">
                {trackingEvents.map((event, index) => (
                  <div key={event.id} className="relative">
                    {index !== trackingEvents.length - 1 && (
                      <div className="absolute left-4 top-8 h-full w-px bg-gray-200 dark:bg-gray-700"></div>
                    )}

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          {getStatusIcon(event.status)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.description}
                          </h4>
                          <time className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </time>
                        </div>

                        {event.location && (
                          <div className="flex items-center space-x-1 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {event.location}
                            </span>
                          </div>
                        )}

                        {event.details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Package Details Sidebar */}
          <div className="space-y-6">
            {/* Package Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Package Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Package2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Barcode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {packageData?.barcode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Weight className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Weight</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {packageData?.weight} kg
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Ruler className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dimensions</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {packageData?.length} × {packageData?.width} × {packageData?.height} cm
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Received</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(
                        packageData?.receivedDate || packageData?.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {packageData?.carrier && (
                  <div className="flex items-center space-x-3">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Carrier</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {packageData.carrier}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Destination */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Destination
              </h3>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {packageData?.shipTo?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {packageData?.shipTo?.address1}
                  {packageData?.shipTo?.address2 && `, ${packageData.shipTo.address2}`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {packageData?.shipTo?.city}, {packageData?.shipTo?.province}{' '}
                  {packageData?.shipTo?.postalCode}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {packageData?.shipTo?.country}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Bell className="h-4 w-4" />
                  <span>Enable Notifications</span>
                </button>

                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Share className="h-4 w-4" />
                  <span>Share Tracking</span>
                </button>

                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Download Label</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
