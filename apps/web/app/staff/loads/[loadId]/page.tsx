'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authAPI, loadAPI, packageAPI, routeAPI } from '@/lib/api';
import RouteOptimizer from '@/components/RouteOptimizer';
import {
  Truck,
  ArrowLeft,
  Edit,
  Package,
  MapPin,
  Calendar,
  User,
  Clock,
  Zap,
  Navigation,
  Route,
  AlertCircle,
  CheckCircle,
  Loader,
  Eye,
  Download,
  Copy,
  Share,
  MoreVertical,
  RefreshCw,
  MapPinOff,
} from 'lucide-react';

export default function LoadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const loadId = params.loadId as string;

  const [user, setUser] = useState<any>(null);
  const [load, setLoad] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'route' | 'tracking'>(
    'route'
  );

  // Route optimization states
  const [routeData, setRouteData] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routePreview, setRoutePreview] = useState<any>(null);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [loadId, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [loadRes, packagesRes] = await Promise.all([
        loadAPI.get(loadId),
        packageAPI.getByLoad(loadId).catch(() => ({ data: { packages: [] } })),
      ]);

      setLoad(loadRes.data.load || loadRes.data);
      setPackages(packagesRes.data.packages || []);

      // Load route preview
      try {
        const previewRes = await routeAPI.getRoutePreview(loadId);
        setRoutePreview(previewRes.data.preview);
      } catch (error) {
        console.warn('Route preview failed:', error);
      }
    } catch (error) {
      console.error('Error loading load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeRoute = async () => {
    setRouteLoading(true);
    setRouteError(null);

    try {
      console.log('Starting route optimization for load:', loadId);

      const response = await routeAPI.optimizeRoute(loadId, {
        maxDailyDrivingHours: 10,
        averageSpeedKmh: 80,
        deliveryTimeMinutes: 15,
        includeReturnTrip: true,
        checkTrafficConditions: false,
        avoidSevereWeather: false,
      });

      console.log('Route optimization successful:', response.data);
      setRouteData(response.data.route);
    } catch (error: any) {
      console.error('Route optimization error:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to optimize route';

      setRouteError(`${errorMessage}`);
    } finally {
      setRouteLoading(false);
    }
  };

  const copyRouteToClipboard = () => {
    if (!routeData) return;

    const routeText = `OPTIMIZED ROUTE - Load #${load?.id?.slice(-6)}

Summary:
• ${routeData.waypoints.length} packages across ${routeData.cityClusters.length} cities
• ${routeData.totalDistance} km, ${Math.round(routeData.totalDuration / 60)} hours
• ${routeData.estimatedDays} estimated days

Route:
${routeData.cityClusters
  .map((c: any, i: number) => `${i + 1}. ${c.city}, ${c.province} (${c.totalPackages} packages)`)
  .join('\n')}`;

    navigator.clipboard.writeText(routeText);
    alert('📋 Route copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Load Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested load could not be found.
          </p>
          <button
            onClick={() => router.push('/staff')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/staff')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Load #{load.id?.slice(-6) || 'Unknown'}
                </h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {load.driverName || 'Unassigned'}
                  </div>
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    {packages.length} packages
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleOptimizeRoute}
              disabled={routeLoading || packages.length === 0}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {routeLoading ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {routeLoading ? 'Optimizing...' : 'Optimize Route'}
            </button>
          </div>
        </div>

        {/* Route Optimization Results */}
        <div className="space-y-6">
          {/* Route Preview/Status */}
          {routePreview && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Navigation className="h-5 w-5 mr-2" />
                Route Readiness
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Packages
                  </label>
                  <p className="text-gray-900 dark:text-white">{routePreview.packageCount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Cities
                  </label>
                  <p className="text-gray-900 dark:text-white">{routePreview.citiesCount}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Geocoded
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {routePreview.geocodingStatus?.ready}/{routePreview.packageCount}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Can Optimize
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      routePreview.canOptimize
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {routePreview.canOptimize ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Route Results */}
          {routeLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
              <div className="flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-lg">Optimizing route...</span>
              </div>
            </div>
          ) : routeError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="font-medium text-red-800 dark:text-red-400">
                  Route Optimization Failed
                </h3>
              </div>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">{routeError}</div>
            </div>
          ) : routeData ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Route className="h-5 w-5 mr-2" />
                  Optimized Route
                </h3>
                <button
                  onClick={copyRouteToClipboard}
                  className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Route
                </button>
              </div>

              {/* Route Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800 dark:text-green-400">
                      📦 Packages:
                    </span>
                    <span className="ml-2 text-green-700 dark:text-green-300">
                      {routeData.waypoints?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-green-800 dark:text-green-400">
                      🏘️ Cities:
                    </span>
                    <span className="ml-2 text-green-700 dark:text-green-300">
                      {routeData.cityClusters?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-green-800 dark:text-green-400">
                      🚗 Distance:
                    </span>
                    <span className="ml-2 text-green-700 dark:text-green-300">
                      {routeData.totalDistance || 0} km
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-green-800 dark:text-green-400">
                      ⏱️ Duration:
                    </span>
                    <span className="ml-2 text-green-700 dark:text-green-300">
                      {Math.round((routeData.totalDuration || 0) / 60)} hours
                    </span>
                  </div>
                </div>

                {routeData.warnings && routeData.warnings.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">
                      ⚠️ Warnings:
                    </h4>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      {routeData.warnings.map((warning: string, index: number) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Route Steps */}
              {routeData.cityClusters && routeData.cityClusters.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Route Steps</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {routeData.cityClusters.map((cluster: any, index: number) => (
                      <div
                        key={index}
                        className="border-l-4 border-blue-400 pl-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-r-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {index + 1}. {cluster.city}, {cluster.province}
                          </h5>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {cluster.distanceFromPrevious?.toFixed(1) || 0} km
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          📦 {cluster.totalPackages} packages • ⏱️ {cluster.estimatedDuration}{' '}
                          minutes
                        </div>

                        <div className="space-y-1">
                          {cluster.waypoints?.slice(0, 5).map((waypoint: any, wpIndex: number) => (
                            <div
                              key={wpIndex}
                              className="flex justify-between text-xs text-gray-600 dark:text-gray-400"
                            >
                              <span>📍 {waypoint.recipientName}</span>
                              <span className="font-mono">{waypoint.packageId}</span>
                            </div>
                          ))}
                          {(cluster.waypoints?.length || 0) > 5 && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                              ... and {cluster.waypoints.length - 5} more deliveries
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
              <div className="text-center">
                <Route className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Route Generated
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Click "Optimize Route" to generate an efficient delivery sequence for this load.
                </p>
                <button
                  onClick={handleOptimizeRoute}
                  disabled={packages.length === 0}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Route
                </button>

                {packages.length === 0 && (
                  <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                    No packages assigned to this load. Add packages before optimizing route.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Package Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Packages ({packages.length})
            </h3>

            {packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.slice(0, 12).map((pkg: any, index: number) => (
                  <div
                    key={pkg.id || index}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {pkg.trackingNumber || `PKG-${index + 1001}`}
                      </div>
                      {pkg.address?.coordinates ? (
                        <MapPin className="h-3 w-3 text-green-500" />
                      ) : (
                        <MapPinOff className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <div>{pkg.shipTo?.name}</div>
                      <div>
                        {pkg.shipTo?.city}, {pkg.shipTo?.province}
                      </div>
                      <div className="mt-1 font-medium">{pkg.weight || 0} kg</div>
                    </div>
                  </div>
                ))}
                {packages.length > 12 && (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    +{packages.length - 12} more packages
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No packages assigned to this load</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
