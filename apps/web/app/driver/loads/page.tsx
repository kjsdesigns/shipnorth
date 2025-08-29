'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, loadAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import OfflineSyncStatus from '@/components/OfflineSyncStatus';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Navigation,
  FileText,
} from 'lucide-react';

interface Load {
  id: string;
  driverName: string;
  status: 'assigned' | 'in_transit' | 'delivered' | 'complete';
  departureDate: string;
  estimatedDeliveryDate: string;
  packages: number;
  totalDistance: number;
  currentLocation?: string;
  notes?: string;
}

export default function DriverLoads() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loads, setLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsActive, setGpsActive] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(
    null
  );

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (!currentUser.roles?.includes('driver') && currentUser.role !== 'driver')) {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    loadDriverLoads();
    startGPSTracking();
  }, [router]);

  const loadDriverLoads = async () => {
    try {
      // Get real loads from API
      const response = await loadAPI.list();
      const allLoads = response.data;

      // Filter loads assigned to current driver
      const driverLoads = allLoads.filter((load: any) => load.driverId === user?.id);

      // Transform to expected format
      const formattedLoads: Load[] = driverLoads.map((load: any) => ({
        id: load.id,
        driverName: load.driverName || `${user?.firstName} ${user?.lastName}`,
        status: load.status,
        departureDate: load.departureDate,
        estimatedDeliveryDate: load.deliveryDate || load.departureDate,
        packages: load.packages?.length || 0,
        totalDistance: load.totalDistance || 0,
        currentLocation: load.currentLocation || 'Not tracked',
        notes: load.notes,
      }));

      setLoads(formattedLoads);
    } catch (error) {
      console.error('Failed to load driver loads:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGPSTracking = () => {
    if (navigator.geolocation) {
      setGpsActive(true);

      // Get initial position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setLocation(locationData);

          // Send to server
          try {
            await authAPI.gps.updateLocation({
              ...locationData,
              isManual: false,
            });
          } catch (error) {
            console.error('Failed to update GPS location:', error);
            // Add to offline sync queue
            await authAPI.sync.addToQueue({
              action: 'location_update',
              data: locationData,
              priority: 'high',
            });
          }
        },
        (error) => {
          console.error('GPS tracking error:', error);
          setGpsActive(false);
        }
      );

      // Set up periodic tracking every 5 minutes
      const trackingInterval = setInterval(
        async () => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
              };

              setLocation(locationData);

              try {
                await authAPI.gps.updateLocation({
                  ...locationData,
                  isManual: false,
                });
              } catch (error) {
                console.error('Failed to update GPS location:', error);
                await authAPI.sync.addToQueue({
                  action: 'location_update',
                  data: locationData,
                  priority: 'high',
                });
              }
            },
            (error) => console.error('GPS update error:', error)
          );
        },
        5 * 60 * 1000
      ); // 5 minutes

      // Cleanup on unmount
      return () => clearInterval(trackingInterval);
    }
  };

  const startLoad = async (loadId: string) => {
    try {
      await loadAPI.update(loadId, { status: 'in_transit' });
      await loadDriverLoads(); // Refresh loads
    } catch (error) {
      console.error('Failed to start load:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_transit':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'complete':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Clock className="h-5 w-5" />;
      case 'in_transit':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Loads</h1>
            <div className="flex items-center space-x-4">
              <p className="text-gray-600 dark:text-gray-400">
                Manage your assigned loads and delivery schedules
              </p>
              {gpsActive && location && (
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  GPS Active (±{location.accuracy?.toFixed(0) || '0'}m)
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <OfflineSyncStatus />
            <button
              onClick={loadDriverLoads}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Refresh Loads
            </button>
          </div>
        </div>

        {/* Load Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{loads.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Truck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loads.filter((l) => l.status === 'in_transit' || l.status === 'assigned').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loads.filter((l) => l.status === 'complete').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loads List */}
        <div className="space-y-4">
          {loads.map((load) => (
            <div key={load.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 mr-4">
                      {getStatusIcon(load.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Load {load.id}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {load.packages} packages • {load.totalDistance}km
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(load.status)}`}
                    >
                      {load.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <button
                      onClick={() => setSelectedLoad(load)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Departure: {new Date(load.departureDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Due: {new Date(load.estimatedDeliveryDate).toLocaleDateString()}
                    </span>
                  </div>

                  {load.currentLocation && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {load.currentLocation}
                      </span>
                    </div>
                  )}
                </div>

                {load.notes && (
                  <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">📋 {load.notes}</p>
                  </div>
                )}

                {load.status === 'assigned' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => startLoad(load.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                      Start Load
                    </button>
                    <button
                      onClick={() => router.push(`/driver/routes?loadId=${load.id}`)}
                      className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg"
                    >
                      View Route
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {loads.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Loads Assigned
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Contact dispatch for load assignments
            </p>
            <button
              onClick={loadDriverLoads}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Check for New Loads
            </button>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}
