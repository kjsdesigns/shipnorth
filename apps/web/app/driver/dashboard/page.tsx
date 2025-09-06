'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadAPI } from '@/lib/api';
import useServerSession from '@/hooks/useServerSession';
import ModernLayout from '@/components/ModernLayout';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Camera,
  FileText,
  Navigation,
  Settings,
} from 'lucide-react';

export default function DriverDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, hasRole } = useServerSession();
  const [loads, setLoads] = useState<any[]>([]);
  const [currentLoad, setCurrentLoad] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [stats, setStats] = useState({
    assignedLoads: 0,
    pendingDeliveries: 0,
    completedToday: 0,
    totalDistance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Server-side authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ DRIVER DASHBOARD: No authenticated user, redirecting');
        router.push('/login/');
        return;
      }
      
      if (!hasRole('driver')) {
        console.log('❌ DRIVER DASHBOARD: User lacks driver role');
        router.push('/login/');
        return;
      }
      
      console.log('✅ DRIVER DASHBOARD: User authenticated via server session');
      setLoading(false);
    }
  }, [user, authLoading, hasRole, router]);

  // Load data when user is authenticated
  useEffect(() => {
    if (user && hasRole('driver') && !loading) {
      loadDriverData();
      startLocationTracking();
    }
  }, [user, hasRole, loading]);

  const loadDriverData = async () => {
    try {
      // Mock driver data - in real implementation, fetch from API
      const mockLoads = [
        {
          id: 'L-2024-001',
          driverName: user?.firstName + ' ' + user?.lastName || 'Driver',
          status: 'in_transit',
          departureDate: new Date().toISOString(),
          packages: [
            {
              id: 'PKG-001',
              trackingNumber: 'SN001234567',
              recipientName: 'John Smith',
              address: '123 Main St, Vancouver, BC V6B 1A1',
              status: 'in_transit',
              deliveryInstructions: 'Ring bell twice',
            },
            {
              id: 'PKG-002',
              trackingNumber: 'SN001234568',
              recipientName: 'Sarah Johnson',
              address: '456 Oak Ave, Richmond, BC V7A 2B2',
              status: 'in_transit',
            },
          ],
        },
      ];

      setLoads(mockLoads);
      setCurrentLoad(mockLoads[0]);
      setPackages(mockLoads[0]?.packages || []);

      // Calculate stats
      const totalPackages = mockLoads.reduce((sum, load) => sum + load.packages.length, 0);
      const pendingPackages = mockLoads.reduce(
        (sum, load) => sum + load.packages.filter((pkg) => pkg.status !== 'delivered').length,
        0
      );
      const deliveredToday = mockLoads.reduce(
        (sum, load) => sum + load.packages.filter((pkg) => pkg.status === 'delivered').length,
        0
      );

      setStats({
        assignedLoads: mockLoads.length,
        pendingDeliveries: pendingPackages,
        completedToday: deliveredToday,
        totalDistance: 127.5, // Mock distance
      });
    } catch (error) {
      console.error('Failed to load driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
        },
        (error) => console.error('Location error:', error)
      );
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Driver Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your loads and deliveries</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Assigned Loads
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.assignedLoads}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Deliveries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingDeliveries}
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completed Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completedToday}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Distance Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDistance}km
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Load Status */}
        {currentLoad && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Current Load: {currentLoad.id}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentLoad.status === 'in_transit'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}
              >
                {currentLoad.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {location && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      GPS Tracking Active
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Last updated: {new Date(location.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <button className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="font-medium text-blue-800 dark:text-blue-200">Scan Package</span>
              </button>

              <button className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Mark Delivered
                </span>
              </button>

              <button className="flex items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <Navigation className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                <span className="font-medium text-purple-800 dark:text-purple-200">View Route</span>
              </button>

              <button className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-2" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Manifest</span>
              </button>
            </div>

            {/* Packages List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Packages ({packages.length})
              </h3>
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border rounded-lg p-4 ${
                      pkg.status === 'delivered'
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {pkg.trackingNumber}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pkg.status === 'delivered'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                      >
                        {pkg.status === 'delivered' ? 'Delivered' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-medium">{pkg.recipientName}</p>
                      <p>{pkg.address}</p>
                      {pkg.deliveryInstructions && (
                        <p className="text-blue-600 dark:text-blue-400 italic">
                          📝 {pkg.deliveryInstructions}
                        </p>
                      )}
                    </div>
                    {pkg.status !== 'delivered' && (
                      <div className="mt-3 flex gap-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                          📷 Photo
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                          ✅ Deliver
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Active Load State */}
        {!currentLoad && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Active Load
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any active deliveries assigned. Contact dispatch for load assignment.
            </p>
            <button
              onClick={loadDriverData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Refresh Loads
            </button>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}
