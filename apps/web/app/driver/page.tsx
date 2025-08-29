'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, packageAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import {
  Truck,
  Package,
  MapPin,
  CheckCircle,
  AlertCircle,
  Camera,
  FileText,
  Navigation,
  Clock,
  Phone,
  User,
  RefreshCw,
} from 'lucide-react';

interface DriverPackage {
  id: string;
  trackingNumber: string;
  recipientName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  status: 'in_transit' | 'delivered';
  deliveryInstructions?: string;
  phoneNumber?: string;
  signature?: string;
  photoUrl?: string;
  deliveredAt?: string;
}

interface DriverLoad {
  id: string;
  driverName: string;
  status: 'planned' | 'in_transit' | 'delivered' | 'complete';
  departureDate: string;
  packages: DriverPackage[];
  manifestUrl?: string;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loads, setLoads] = useState<DriverLoad[]>([]);
  const [currentLoad, setCurrentLoad] = useState<DriverLoad | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<DriverPackage | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [stats, setStats] = useState({
    assignedLoads: 0,
    pendingDeliveries: 0,
    completedToday: 0,
    totalDistance: 127.5,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  // Authentication and data loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('⚠️ Driver authentication timeout - forcing not loading');
      setLoading(false);
    }, 3000);

    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (!currentUser.roles?.includes('driver') && currentUser.role !== 'driver')) {
      setLoading(false);
      clearTimeout(timeout);
      router.push('/login');
      return;
    }

    setUser(currentUser);
    loadDriverData();
    startLocationTracking();
    clearTimeout(timeout);
  }, [router]);

  const loadDriverData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      // Mock comprehensive driver data
      const mockLoads: DriverLoad[] = [
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
              address: '123 Main St',
              city: 'Vancouver',
              province: 'BC',
              postalCode: 'V6B 1A1',
              status: 'in_transit',
              deliveryInstructions: 'Ring bell twice, leave at door if no answer',
              phoneNumber: '(604) 555-0123',
            },
            {
              id: 'PKG-002',
              trackingNumber: 'SN001234568',
              recipientName: 'Sarah Johnson',
              address: '456 Oak Avenue',
              city: 'Richmond',
              province: 'BC',
              postalCode: 'V7A 2B2',
              status: 'in_transit',
              phoneNumber: '(604) 555-0456',
            },
            {
              id: 'PKG-003',
              trackingNumber: 'SN001234569',
              recipientName: 'Mike Brown',
              address: '789 Pine Street',
              city: 'Burnaby',
              province: 'BC',
              postalCode: 'V5H 3C3',
              status: 'delivered',
              deliveredAt: new Date(Date.now() - 3600000).toISOString(),
              signature: 'M. Brown',
            },
          ],
        },
      ];

      setLoads(mockLoads);
      setCurrentLoad(mockLoads[0]);

      // Calculate stats
      const allPackages = mockLoads.flatMap((load) => load.packages);
      const pendingPackages = allPackages.filter((pkg) => pkg.status !== 'delivered');
      const deliveredToday = allPackages.filter(
        (pkg) =>
          pkg.status === 'delivered' &&
          pkg.deliveredAt &&
          new Date(pkg.deliveredAt).toDateString() === new Date().toDateString()
      );

      setStats({
        assignedLoads: mockLoads.length,
        pendingDeliveries: pendingPackages.length,
        completedToday: deliveredToday.length,
        totalDistance: 127.5,
      });
    } catch (error) {
      console.error('Failed to load driver data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };

          setLocation(locationData);

          // Send location to server
          try {
            await authAPI.gps.updateLocation({
              lat: locationData.lat,
              lng: locationData.lng,
              accuracy: locationData.accuracy,
              isManual: false,
            });
          } catch (error) {
            console.error('Failed to update location on server:', error);
            // Add to offline sync queue
            await authAPI.sync.addToQueue({
              action: 'location_update',
              data: locationData,
              priority: 'high',
            });
          }
        },
        (error) => console.error('Location tracking error:', error)
      );
    }
  };

  const markPackageDelivered = async (packageId: string) => {
    try {
      // Validate package for delivery using scanning API
      const validationResult = await authAPI.scanning.validateDelivery(packageId);

      if (!validationResult.data.success) {
        console.error('Package validation failed:', validationResult.data.error);
        return;
      }

      // Mark package as delivered (using existing package API)
      await packageAPI.markDelivered(packageId, {
        deliveredAt: new Date().toISOString(),
        signature: 'Digital Signature',
        confirmedBy: user?.id,
      });

      // Update local state
      if (currentLoad) {
        const updatedPackages = currentLoad.packages.map((pkg) =>
          pkg.id === packageId
            ? {
                ...pkg,
                status: 'delivered' as const,
                deliveredAt: new Date().toISOString(),
                signature: 'Digital Signature',
              }
            : pkg
        );
        setCurrentLoad({ ...currentLoad, packages: updatedPackages });

        // Update stats
        setStats((prev) => ({
          ...prev,
          pendingDeliveries: prev.pendingDeliveries - 1,
          completedToday: prev.completedToday + 1,
        }));
      }

      // Add to sync queue for backup
      await authAPI.sync.addToQueue({
        action: 'delivery_confirmation',
        data: { packageId, deliveredAt: new Date().toISOString() },
        priority: 'high',
      });
    } catch (error) {
      console.error('Failed to mark package delivered:', error);

      // Add to offline sync queue if API call fails
      try {
        await authAPI.sync.addToQueue({
          action: 'delivery_confirmation',
          data: { packageId, deliveredAt: new Date().toISOString(), offline: true },
          priority: 'high',
        });
      } catch (syncError) {
        console.error('Failed to add to sync queue:', syncError);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabContent = () => {
    switch (activeTab) {
      case 'loads':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Loads</h2>
            {loads.map((load) => (
              <div key={load.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Load {load.id}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      load.status === 'in_transit'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {load.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {load.packages.length} packages
                </p>
                <button
                  onClick={() => setCurrentLoad(load)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        );

      case 'routes':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Routes</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Navigation className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Route Optimization
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    AI-powered route optimization and editing tools
                  </p>
                  <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                    Generate Route
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'deliveries':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deliveries</h2>
            <div className="space-y-4">
              {currentLoad?.packages.map((pkg) => (
                <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{pkg.trackingNumber}</h3>
                      <p className="text-gray-600">{pkg.recipientName}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        pkg.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {pkg.status === 'delivered' ? 'Delivered' : 'Pending'}
                    </span>
                  </div>
                  {pkg.status !== 'delivered' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => markPackageDelivered(pkg.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'earnings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Today</h3>
                <p className="text-3xl font-bold text-green-600">$127.50</p>
                <p className="text-sm text-gray-600">{stats.completedToday} deliveries</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">This Week</h3>
                <p className="text-3xl font-bold text-blue-600">$892.75</p>
                <p className="text-sm text-gray-600">23 deliveries</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">This Month</h3>
                <p className="text-3xl font-bold text-purple-600">$3,247.80</p>
                <p className="text-sm text-gray-600">89 deliveries</p>
              </div>
            </div>
          </div>
        );

      default: // dashboard
        return (
          <div className="space-y-6">
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

            {/* Current Load */}
            {currentLoad ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Current Load: {currentLoad.id}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentLoad.packages.length} packages • Status:{' '}
                      {currentLoad.status.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => loadDriverData(true)}
                    disabled={refreshing}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50"
                  >
                    <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* GPS Status */}
                {location && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          GPS Tracking Active
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Last updated: {new Date(location.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        ±{location.accuracy?.toFixed(0) || '0'}m
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Scan Package
                    </span>
                  </button>

                  <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Mark Delivered
                    </span>
                  </button>

                  <button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                    <Navigation className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      View Route
                    </span>
                  </button>

                  <button className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <FileText className="h-8 w-8 text-gray-600 dark:text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Manifest
                    </span>
                  </button>
                </div>

                {/* Packages List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Today's Packages
                  </h3>
                  <div className="space-y-3">
                    {currentLoad.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          pkg.status === 'delivered'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="font-semibold text-gray-900 dark:text-white mr-3">
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
                          <button
                            onClick={() => setSelectedPackage(pkg)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                          >
                            View Details
                          </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {pkg.recipientName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {pkg.address}, {pkg.city}, {pkg.province}
                            </p>
                            {pkg.phoneNumber && (
                              <div className="flex items-center mt-1">
                                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                <a
                                  href={`tel:${pkg.phoneNumber}`}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  {pkg.phoneNumber}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-end">
                            {pkg.status !== 'delivered' && (
                              <button
                                onClick={() => markPackageDelivered(pkg.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                Mark Delivered
                              </button>
                            )}
                            {pkg.status === 'delivered' && (
                              <div className="text-green-600 dark:text-green-400 text-sm">
                                ✓ Delivered{' '}
                                {pkg.deliveredAt && new Date(pkg.deliveredAt).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {pkg.deliveryInstructions && (
                          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              📝 {pkg.deliveryInstructions}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Load
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No deliveries assigned at the moment
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <ModernLayout role="driver">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Driver Portal</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.firstName}! Manage your deliveries and routes.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: Truck },
              { id: 'loads', name: 'My Loads', icon: Package },
              { id: 'routes', name: 'Routes', icon: Navigation },
              { id: 'deliveries', name: 'Deliveries', icon: CheckCircle },
              { id: 'earnings', name: 'Earnings', icon: Clock },
            ].map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {tabContent()}

        {/* Package Details Modal */}
        {selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Package Details
                  </h3>
                  <button
                    onClick={() => setSelectedPackage(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Tracking Number
                  </h4>
                  <p className="text-lg font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {selectedPackage.trackingNumber}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Delivery Address
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedPackage.recipientName}
                      </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{selectedPackage.address}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedPackage.city}, {selectedPackage.province}{' '}
                      {selectedPackage.postalCode}
                    </p>
                    {selectedPackage.phoneNumber && (
                      <div className="flex items-center mt-2">
                        <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                        <a
                          href={`tel:${selectedPackage.phoneNumber}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedPackage.phoneNumber}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPackage.deliveryInstructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Delivery Instructions
                    </h4>
                    <p className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                      📝 {selectedPackage.deliveryInstructions}
                    </p>
                  </div>
                )}

                {selectedPackage.status !== 'delivered' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                      onClick={() => {
                        markPackageDelivered(selectedPackage.id);
                        setSelectedPackage(null);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
                    >
                      Mark as Delivered
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}

// Helper functions from original implementation
const markPackageDelivered = async (packageId: string) => {
  // Mock implementation - in real app, call API
  console.log(`Package ${packageId} marked as delivered`);
};
