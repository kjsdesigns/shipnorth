'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, routeAPI, loadAPI } from '@/lib/api';
import useServerSession from '@/hooks/useServerSession';
import ModernLayout from '@/components/ModernLayout';
import {
  Navigation,
  MapPin,
  Route,
  Clock,
  Zap,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface RouteStop {
  id: string;
  address: string;
  city: string;
  estimatedArrival: string;
  status: 'pending' | 'current' | 'completed';
  packages: number;
}

interface RouteData {
  id: string;
  loadId: string;
  status: 'draft' | 'active' | 'completed';
  totalDistance: number;
  estimatedDuration: number;
  actualDuration?: number;
  optimizationScore: number;
  stops: RouteStop[];
  createdAt: string;
  lastModified: string;
}

export default function DriverRoutes() {
  const router = useRouter();
  const { user, loading: authLoading, hasRole } = useServerSession();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [activeRoute, setActiveRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Server-side authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ DRIVER ROUTES: No authenticated user, redirecting');
        router.push('/login/');
        return;
      }
      
      if (!hasRole('driver')) {
        console.log('❌ DRIVER ROUTES: User lacks driver role');
        router.push('/login/');
        return;
      }
      
      console.log('✅ DRIVER ROUTES: User authenticated via server session');
      setLoading(false);
    }
  }, [user, authLoading, hasRole, router]);

  // Load data when user is authenticated
  useEffect(() => {
    if (user && hasRole('driver') && !loading) {
      loadDriverRoutes();
    }
  }, [user, hasRole, loading]);

  const loadDriverRoutes = async () => {
    try {
      // Get driver's loads
      const loadsResponse = await loadAPI.list();
      const allLoads = loadsResponse.data;
      const driverLoads = allLoads.filter((load: any) => load.driverId === user?.id);

      const allRoutes = [];
      let currentActiveRoute = null;

      for (const load of driverLoads) {
        try {
          // Get saved routes for this load
          const routesResponse = await routeAPI.getSavedRoutes(load.id);
          const loadRoutes = routesResponse.data.map((route: any) => ({
            id: route.id,
            loadId: load.id,
            status: route.status,
            totalDistance: route.totalDistance,
            estimatedDuration: route.estimatedDuration,
            actualDuration: route.actualDuration,
            optimizationScore: route.optimizationScore || 85,
            createdAt: route.createdAt,
            lastModified: route.updatedAt || route.createdAt,
            stops: route.stops || [],
          }));

          allRoutes.push(...loadRoutes);

          // Find active route
          const activeRouteForLoad = loadRoutes.find((r: any) => r.status === 'active');
          if (activeRouteForLoad && load.status === 'in_transit') {
            currentActiveRoute = activeRouteForLoad;
          }
        } catch (error) {
          console.warn(`Failed to load routes for load ${load.id}:`, error);
        }
      }

      setRoutes(allRoutes);
      setActiveRoute(currentActiveRoute);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = async () => {
    setIsOptimizing(true);
    try {
      if (activeRoute) {
        // Use real AI route optimization API
        const response = await authAPI.routes.generateAI(activeRoute.loadId, {
          prioritizeDeliveryWindows: true,
          optimizeForFuelEfficiency: true,
          checkTrafficConditions: true,
          maxDailyDrivingHours: 10,
        });

        if (response.data.success) {
          const newRoute = response.data.route;
          const optimizedRoute = {
            ...activeRoute,
            optimizationScore: newRoute.optimizationScore || 90,
            totalDistance: newRoute.totalDistance,
            estimatedDuration: newRoute.totalDuration,
            lastModified: new Date().toISOString(),
            stops:
              newRoute.routeData?.cityClusters?.map((cluster: any, index: number) => ({
                id: `S${index + 1}`,
                address: `${cluster.city}, ${cluster.province}`,
                city: cluster.city,
                estimatedArrival: new Date(Date.now() + (index + 1) * 3600000).toISOString(),
                status: index === 0 ? 'current' : 'pending',
                packages: cluster.totalPackages,
              })) || [],
          };
          setActiveRoute(optimizedRoute);
          setRoutes(routes.map((r) => (r.id === activeRoute.id ? optimizedRoute : r)));
        }
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ModernLayout role="driver">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Routes</h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered route optimization and navigation
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={optimizeRoute}
              disabled={isOptimizing || !activeRoute}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center"
            >
              {isOptimizing ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Zap className="h-5 w-5 mr-2" />
              )}
              {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
            </button>
            <button
              onClick={loadDriverRoutes}
              className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Active Route */}
        {activeRoute && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Active Route: {activeRoute.id}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">Load: {activeRoute.loadId}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-1" />
                    <span className="font-semibold text-green-600">
                      {activeRoute.optimizationScore}% Optimized
                    </span>
                  </div>
                </div>
              </div>

              {/* Route Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Route className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Total Distance</p>
                      <p className="font-bold text-blue-800 dark:text-blue-200">
                        {activeRoute.totalDistance.toFixed(1)} km
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                    <div>
                      <p className="text-sm text-orange-600 dark:text-orange-400">Estimated Time</p>
                      <p className="font-bold text-orange-800 dark:text-orange-200">
                        {Math.round(activeRoute.estimatedDuration / 60)}h{' '}
                        {activeRoute.estimatedDuration % 60}m
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Total Stops</p>
                      <p className="font-bold text-purple-800 dark:text-purple-200">
                        {activeRoute.stops.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Stops */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Route Stops
              </h3>
              <div className="space-y-4">
                {activeRoute.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className={`border rounded-lg p-4 ${
                      stop.status === 'completed'
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : stop.status === 'current'
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                            stop.status === 'completed'
                              ? 'bg-green-600 text-white'
                              : stop.status === 'current'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-400 text-white'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {stop.address}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stop.packages} package{stop.packages !== 1 ? 's' : ''} • ETA:{' '}
                            {new Date(stop.estimatedArrival).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {stop.status === 'current' && (
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                            Navigate
                          </button>
                        )}
                        {stop.status === 'completed' && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Route History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Route History
          </h3>
          <div className="space-y-3">
            {routes
              .filter((r) => r.status === 'completed')
              .map((route) => (
                <div
                  key={route.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{route.id}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {route.totalDistance.toFixed(1)}km •{' '}
                        {Math.round(route.estimatedDuration / 60)}h
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(route.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
