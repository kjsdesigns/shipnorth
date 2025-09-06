'use client';

import { useState, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Route,
  Clock,
  Zap,
  Save,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
  Package,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';

interface RouteStop {
  id: string;
  address: string;
  city: string;
  province: string;
  packages: string[];
  estimatedArrival?: string;
  status: 'pending' | 'current' | 'completed';
  coordinates?: { lat: number; lng: number };
  notes?: string;
}

interface RouteData {
  id?: string;
  loadId: string;
  status: 'draft' | 'active' | 'completed';
  totalDistance: number;
  estimatedDuration: number; // minutes
  optimizationScore: number;
  stops: RouteStop[];
  createdAt?: string;
  lastModified: string;
}

interface RouteOptimizerProps {
  loadId: string;
  initialRoute?: RouteData;
  onRouteUpdate?: (route: RouteData) => void;
  userRole: 'staff' | 'driver';
  className?: string;
  availablePackages?: any[]; // Packages not yet assigned to this route
  onPackagesChanged?: (addedPackages: string[], removedPackages: string[]) => void;
}

export default function RouteOptimizer({
  loadId,
  initialRoute,
  onRouteUpdate,
  userRole,
  className = '',
  availablePackages = [],
  onPackagesChanged,
}: RouteOptimizerProps) {
  const [route, setRoute] = useState<RouteData>(
    initialRoute || {
      loadId,
      status: 'draft',
      totalDistance: 0,
      estimatedDuration: 0,
      optimizationScore: 0,
      stops: [],
      lastModified: new Date().toISOString(),
    }
  );

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStop, setEditingStop] = useState<RouteStop | null>(null);
  const [showPackageManager, setShowPackageManager] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [drivingTimes, setDrivingTimes] = useState<Record<string, number>>({});

  const generateAIRoute = async () => {
    setIsOptimizing(true);
    try {
      // Use real AI route generation API
      const { authAPI } = await import('@/lib/api');
      const result = await authAPI.routes.generateAI(loadId, {
        maxDailyDrivingHours: 10,
        prioritizeDeliveryWindows: true,
        optimizeForFuelEfficiency: true,
        checkTrafficConditions: true,
      });

      if (result.data.success && result.data.routeData) {
        const apiRoute = result.data.routeData;
        const optimizedRoute: RouteData = {
          ...route,
          id: result.data.route?.id,
          totalDistance: apiRoute.totalDistance || result.data.route?.totalDistance || 0,
          estimatedDuration: apiRoute.totalDuration || result.data.route?.totalDuration || 0,
          optimizationScore:
            apiRoute.optimizationScore || result.data.route?.optimizationScore || 85,
          stops:
            apiRoute.cityClusters?.map((cluster: any, index: number) => ({
              id: cluster.id || `stop-${index + 1}`,
              address:
                cluster.name || `${cluster.city || 'Unknown'}, ${cluster.province || 'Unknown'}`,
              city: cluster.city || 'Unknown',
              province: cluster.province || 'Unknown',
              packages: cluster.waypoints?.map((wp: any) => wp.packageId) || [],
              estimatedArrival: new Date(Date.now() + (index + 1) * 3600000).toISOString(),
              status: 'pending' as const,
              coordinates: cluster.coordinates,
            })) || [],
          lastModified: new Date().toISOString(),
        };

        setRoute(optimizedRoute);
        onRouteUpdate?.(optimizedRoute);
      } else {
        throw new Error(result.data.error || 'Route generation failed');
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const saveRoute = async () => {
    setSaving(true);
    try {
      const { authAPI } = await import('@/lib/api');

      if (route.id) {
        // Update existing route
        await authAPI.routes.activateRoute(route.id);
      } else {
        // Generate and save new route
        const result = await authAPI.routes.generateAI(loadId, {
          customStops: route.stops,
          saveAsActive: true,
        });

        if (result.data.success) {
          const savedRoute = {
            ...route,
            id: result.data.route?.id || `R-${Date.now()}`,
            status: 'active' as const,
            lastModified: new Date().toISOString(),
          };
          setRoute(savedRoute);
          onRouteUpdate?.(savedRoute);
        }
      }
    } catch (error) {
      console.error('Failed to save route:', error);
    } finally {
      setSaving(false);
    }
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...route.stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newStops.length) {
      [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];

      const updatedRoute = {
        ...route,
        stops: newStops,
        lastModified: new Date().toISOString(),
      };
      setRoute(updatedRoute);
    }
  };

  const removeStop = (stopId: string) => {
    const updatedRoute = {
      ...route,
      stops: route.stops.filter((stop) => stop.id !== stopId),
      lastModified: new Date().toISOString(),
    };
    setRoute(updatedRoute);
  };

  const addStop = () => {
    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      address: '',
      city: '',
      province: '',
      packages: [],
      status: 'pending',
    };
    setEditingStop(newStop);
  };

  const saveStop = (stop: RouteStop) => {
    const updatedRoute = {
      ...route,
      stops: [...route.stops, stop],
      lastModified: new Date().toISOString(),
    };
    setRoute(updatedRoute);
    setEditingStop(null);
  };

  const addPackagesToRoute = async (packageIds: string[]) => {
    try {
      const { authAPI } = await import('@/lib/api');
      
      // Add packages to load
      await (await import('@/lib/api')).packageAPI.bulkAssign(packageIds, loadId);
      
      // Trigger re-optimization
      onPackagesChanged?.(packageIds, []);
      await generateAIRoute();
      
      setSelectedPackages([]);
      setShowPackageManager(false);
    } catch (error) {
      console.error('Failed to add packages:', error);
    }
  };

  const removePackageFromRoute = async (packageId: string) => {
    try {
      const { authAPI } = await import('@/lib/api');
      
      // Remove package from load (update package to remove loadId)
      await (await import('@/lib/api')).packageAPI.update(packageId, { loadId: null });
      
      // Update local route state
      const updatedRoute = {
        ...route,
        stops: route.stops.map(stop => ({
          ...stop,
          packages: stop.packages.filter(pid => pid !== packageId)
        })).filter(stop => stop.packages.length > 0),
        lastModified: new Date().toISOString(),
      };
      
      setRoute(updatedRoute);
      onPackagesChanged?.([], [packageId]);
      
      // Re-optimize if there are still stops
      if (updatedRoute.stops.length > 0) {
        await generateAIRoute();
      }
    } catch (error) {
      console.error('Failed to remove package:', error);
    }
  };

  const reorderCities = async (newOrder: RouteStop[]) => {
    try {
      // Update local state immediately for better UX
      const updatedRoute = {
        ...route,
        stops: newOrder,
        lastModified: new Date().toISOString(),
      };
      setRoute(updatedRoute);

      // Calculate driving times between cities
      await calculateDrivingTimes(newOrder);
      
      // Trigger re-optimization with new city order
      const { authAPI } = await import('@/lib/api');
      const result = await authAPI.routes.generateAI(loadId, {
        customCityOrder: newOrder.map(stop => ({ city: stop.city, province: stop.province })),
        preserveCityOrder: true,
      });

      if (result.data.success && result.data.routeData) {
        // Update with optimized route data
        const optimizedRoute = {
          ...updatedRoute,
          totalDistance: result.data.routeData.totalDistance || 0,
          estimatedDuration: result.data.routeData.totalDuration || 0,
          optimizationScore: result.data.routeData.optimizationScore || 85,
        };
        setRoute(optimizedRoute);
        onRouteUpdate?.(optimizedRoute);
      }
    } catch (error) {
      console.error('Failed to reorder cities:', error);
    }
  };

  const calculateDrivingTimes = async (stops: RouteStop[]) => {
    try {
      const times: Record<string, number> = {};
      
      for (let i = 1; i < stops.length; i++) {
        const fromStop = stops[i - 1];
        const toStop = stops[i];
        const key = `${fromStop.id}-${toStop.id}`;
        
        // Mock driving time calculation (in real implementation, use Google Maps API)
        const distance = calculateHaversineDistance(
          fromStop.coordinates?.lat || 0,
          fromStop.coordinates?.lng || 0,
          toStop.coordinates?.lat || 0,
          toStop.coordinates?.lng || 0
        );
        
        // Assume average speed of 80 km/h
        times[key] = Math.round((distance / 80) * 60); // Convert to minutes
      }
      
      setDrivingTimes(times);
    } catch (error) {
      console.error('Failed to calculate driving times:', error);
    }
  };

  const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Route Optimizer</h3>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered route optimization for Load {loadId}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              {route.optimizationScore.toFixed(0)}% Optimized
            </div>
          </div>
        </div>

        {/* Route Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center">
              <Route className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Distance</p>
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  {route.totalDistance.toFixed(1)} km
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Duration</p>
                <p className="font-semibold text-orange-800 dark:text-orange-200">
                  {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Stops</p>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  {route.stops.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateAIRoute}
            disabled={isOptimizing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center"
          >
            {isOptimizing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isOptimizing ? 'Optimizing...' : 'AI Optimize'}
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'View Mode' : 'Edit Route'}
          </button>

          {(isEditing || route.stops.length > 0) && (
            <button
              onClick={saveRoute}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Route'}
            </button>
          )}

          {isEditing && (
            <>
              <button
                onClick={addStop}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stop
              </button>
              
              <button
                onClick={() => setShowPackageManager(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Package className="h-4 w-4 mr-2" />
                Manage Packages
              </button>
              
              <button
                onClick={() => generateAIRoute()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Re-optimize
              </button>
            </>
          )}
        </div>
      </div>

      {/* Route Stops */}
      <div className="p-6">
        {route.stops.length === 0 ? (
          <div className="text-center py-12">
            <Navigation className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Route Generated
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Use AI optimization to generate an optimal delivery route
            </p>
            <button
              onClick={generateAIRoute}
              disabled={isOptimizing}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg"
            >
              Generate AI Route
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delivery Stops ({route.stops.length})
              </h4>
              {isEditing && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag stops to reorder or use arrow buttons
                </p>
              )}
            </div>

            {route.stops.map((stop, index) => (
              <div
                key={stop.id}
                data-testid="route-stop"
                className={`border rounded-lg p-4 ${
                  stop.status === 'completed'
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : stop.status === 'current'
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
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

                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{stop.address}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stop.city}, {stop.province}
                      </p>
                      <div className="flex items-center mt-1">
                        <Package className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {stop.packages.length} package{stop.packages.length !== 1 ? 's' : ''}
                        </span>
                        {stop.estimatedArrival && (
                          <>
                            <Clock className="h-4 w-4 text-gray-400 ml-3 mr-1" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              ETA: {new Date(stop.estimatedArrival).toLocaleTimeString()}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Driving time to this stop */}
                      {index > 0 && (
                        <div className="flex items-center mt-1">
                          <Route className="h-3 w-3 text-blue-400 mr-1" />
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {drivingTimes[`${route.stops[index - 1].id}-${stop.id}`] || '?'} min drive from previous stop
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stop Actions */}
                  <div className="flex items-center space-x-2">
                    {isEditing && (
                      <>
                        <button
                          onClick={() => moveStop(index, 'up')}
                          disabled={index === 0}
                          aria-label="Move up"
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveStop(index, 'down')}
                          disabled={index === route.stops.length - 1}
                          aria-label="Move down"
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingStop(stop)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeStop(stop.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {stop.status === 'current' && userRole === 'driver' && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        Navigate
                      </button>
                    )}
                  </div>
                </div>

                {stop.notes && (
                  <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2 rounded">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">📝 {stop.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optimization Progress */}
      {isOptimizing && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                AI Route Optimization in Progress...
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Analyzing traffic patterns, delivery windows, and optimal sequencing
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stop Edit Modal */}
      {editingStop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingStop.id.startsWith('stop-') ? 'Add Stop' : 'Edit Stop'}
              </h4>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editingStop.address}
                  onChange={(e) => setEditingStop({ ...editingStop, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editingStop.city}
                    onChange={(e) => setEditingStop({ ...editingStop, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    value={editingStop.province}
                    onChange={(e) => setEditingStop({ ...editingStop, province: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={editingStop.notes || ''}
                  onChange={(e) => setEditingStop({ ...editingStop, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setEditingStop(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveStop(editingStop)}
                  disabled={!editingStop.address || !editingStop.city}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
                >
                  Save Stop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Package Manager Modal */}
      {showPackageManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Manage Route Packages
                </h4>
                <button
                  onClick={() => setShowPackageManager(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Packages */}
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Available Packages ({availablePackages.length})
                  </h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availablePackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedPackages.includes(pkg.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => {
                          setSelectedPackages(prev => 
                            prev.includes(pkg.id)
                              ? prev.filter(id => id !== pkg.id)
                              : [...prev, pkg.id]
                          );
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{pkg.trackingNumber}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {pkg.shipTo?.city}, {pkg.shipTo?.province}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.weight}kg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Route Packages */}
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Route Packages ({route.stops.reduce((sum, stop) => sum + stop.packages.length, 0)})
                  </h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {route.stops.map((stop) => 
                      stop.packages.map((packageId) => (
                        <div
                          key={packageId}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-sm">{packageId}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {stop.city}, {stop.province}
                            </p>
                          </div>
                          <button
                            onClick={() => removePackageFromRoute(packageId)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button
                onClick={() => setShowPackageManager(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => addPackagesToRoute(selectedPackages)}
                disabled={selectedPackages.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
              >
                Add {selectedPackages.length} Packages to Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
