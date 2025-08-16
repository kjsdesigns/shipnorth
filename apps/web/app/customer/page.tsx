'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, customerAPI, loadAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import { 
  Package, MapPin, Clock, Truck, CheckCircle, AlertCircle, 
  Eye, Phone, Mail, CreditCard, Settings, Refresh
} from 'lucide-react';

interface MapProps {
  center: { lat: number; lng: number };
  markers: Array<{
    position: { lat: number; lng: number };
    title: string;
    type: 'current' | 'destination' | 'waypoint';
  }>;
  zoom?: number;
}

// Simple map component placeholder - would use Google Maps in production
function SimpleMap({ center, markers, zoom = 10 }: MapProps) {
  return (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
      {/* Mock map visualization */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900">
        {markers.map((marker, index) => (
          <div
            key={index}
            className={`absolute w-4 h-4 rounded-full ${
              marker.type === 'current' 
                ? 'bg-red-500 animate-pulse' 
                : marker.type === 'destination'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{
              left: `${50 + (marker.position.lng - center.lng) * 100}%`,
              top: `${50 - (marker.position.lat - center.lat) * 100}%`,
            }}
            title={marker.title}
          />
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm shadow">
        <MapPin className="w-4 h-4 inline mr-1" />
        Live Tracking Map
      </div>
    </div>
  );
}

export default function CustomerPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loadLocation, setLoadLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'customer') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadCustomerData(currentUser.customerId);
  }, [router]);

  const loadCustomerData = async (customerId: string) => {
    try {
      const [customerRes, packagesRes] = await Promise.all([
        customerAPI.get(customerId),
        customerAPI.getPackages(customerId),
      ]);

      setCustomer(customerRes.data.customer);
      
      // Add expected delivery dates to packages
      const packagesWithDelivery = await Promise.all(
        (packagesRes.data.packages || []).map(async (pkg: any) => {
          if (pkg.loadId) {
            const locationRes = await loadAPI.getLocations(pkg.loadId);
            return {
              ...pkg,
              loadLocation: locationRes.data.currentLocation,
              locationHistory: locationRes.data.locations,
            };
          }
          return pkg;
        })
      );

      setPackages(packagesWithDelivery);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTracking = async () => {
    if (!user?.customerId) return;
    
    setRefreshing(true);
    await loadCustomerData(user.customerId);
    setRefreshing(false);
  };

  const formatTrackingStatus = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready for Pickup';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'exception': return 'Delivery Exception';
      case 'returned': return 'Returned to Sender';
      default: return 'Processing';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_transit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'exception': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'returned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const showPackageDetails = (pkg: any) => {
    setSelectedPackage(pkg);
  };

  const closePackageDetails = () => {
    setSelectedPackage(null);
  };

  if (loading) {
    return (
      <ModernLayout role="customer">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout role="customer">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {customer?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track your packages and manage your shipments
          </p>
        </div>
        <button
          onClick={refreshTracking}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Refresh className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Tracking'}
        </button>
      </div>

      {/* Package Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packages.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Packages</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packages.filter(pkg => pkg.shipmentStatus === 'in_transit').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packages.filter(pkg => pkg.shipmentStatus === 'delivered').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Shipments */}
      {packages.filter(pkg => pkg.shipmentStatus === 'in_transit').length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Shipments</h2>
          <div className="grid gap-6">
            {packages
              .filter(pkg => pkg.shipmentStatus === 'in_transit')
              .map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {pkg.trackingNumber}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        To: {pkg.shipTo.city}, {pkg.shipTo.province}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pkg.shipmentStatus)}`}>
                      {formatTrackingStatus(pkg.shipmentStatus)}
                    </span>
                  </div>

                  {pkg.loadLocation && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Current Location
                      </h4>
                      <SimpleMap
                        center={{ lat: pkg.loadLocation.lat, lng: pkg.loadLocation.lng }}
                        markers={[
                          {
                            position: { lat: pkg.loadLocation.lat, lng: pkg.loadLocation.lng },
                            title: 'Current Location',
                            type: 'current',
                          },
                        ]}
                        zoom={12}
                      />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {pkg.loadLocation.address || 'Tracking location'}
                        <span className="ml-2 text-xs">
                          {new Date(pkg.loadLocation.timestamp).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  )}

                  {pkg.expectedDeliveryDate && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <Clock className="h-4 w-4 mr-2" />
                      Expected delivery: {new Date(pkg.expectedDeliveryDate).toLocaleDateString()}
                    </div>
                  )}

                  <button
                    onClick={() => showPackageDetails(pkg)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium"
                  >
                    View Full Tracking Details
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* All Packages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Packages</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tracking #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {pkg.trackingNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {pkg.shipTo.city}, {pkg.shipTo.province}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.shipmentStatus)}`}>
                      {formatTrackingStatus(pkg.shipmentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {pkg.expectedDeliveryDate 
                      ? new Date(pkg.expectedDeliveryDate).toLocaleDateString()
                      : pkg.deliveryDate
                      ? new Date(pkg.deliveryDate).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => showPackageDetails(pkg)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {packages.length === 0 && (
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No packages found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Your packages will appear here once they're added to our system.
            </p>
          </div>
        )}
      </div>

      {/* Package Details Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Package Details - {selectedPackage.trackingNumber}
                </h3>
                <button
                  onClick={closePackageDetails}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Package Info */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Package Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Weight:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedPackage.weight} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedPackage.length}×{selectedPackage.width}×{selectedPackage.height} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Carrier:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedPackage.carrier || 'TBD'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Service:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedPackage.quotedService || 'Standard'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Delivery Address</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPackage.shipTo.name}<br />
                  {selectedPackage.shipTo.address1}<br />
                  {selectedPackage.shipTo.address2 && `${selectedPackage.shipTo.address2}\n`}
                  {selectedPackage.shipTo.city}, {selectedPackage.shipTo.province} {selectedPackage.shipTo.postalCode}<br />
                  {selectedPackage.shipTo.country}
                </div>
              </div>

              {/* Live Tracking */}
              {selectedPackage.loadLocation && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Live Tracking</h4>
                  <SimpleMap
                    center={{ lat: selectedPackage.loadLocation.lat, lng: selectedPackage.loadLocation.lng }}
                    markers={[
                      {
                        position: { lat: selectedPackage.loadLocation.lat, lng: selectedPackage.loadLocation.lng },
                        title: 'Current Location',
                        type: 'current',
                      },
                    ]}
                    zoom={10}
                  />
                  <div className="mt-3 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      Last updated: {new Date(selectedPackage.loadLocation.timestamp).toLocaleString()}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Location: {selectedPackage.loadLocation.address || 'Tracking coordinates'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tracking History */}
              {selectedPackage.locationHistory && selectedPackage.locationHistory.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Tracking History</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedPackage.locationHistory
                      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((location: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white">
                              {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                              {new Date(location.timestamp).toLocaleString()}
                              {location.isManual && <span className="ml-2 text-xs">(Manual entry)</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Delivery Confirmation */}
              {selectedPackage.deliveryConfirmation && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Delivery Confirmation</h4>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Delivered on {new Date(selectedPackage.deliveryConfirmation.deliveredAt).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedPackage.deliveryConfirmation.recipientName && (
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Received by: {selectedPackage.deliveryConfirmation.recipientName}
                        {selectedPackage.deliveryConfirmation.relationship && 
                          ` (${selectedPackage.deliveryConfirmation.relationship})`}
                      </p>
                    )}
                    {selectedPackage.deliveryConfirmation.photoUrl && (
                      <div className="mt-3">
                        <img
                          src={selectedPackage.deliveryConfirmation.photoUrl}
                          alt="Delivery proof"
                          className="w-32 h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Account Info */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">{customer?.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">{customer?.phone}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Shipping Address</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {customer?.addressLine1}<br />
                {customer?.addressLine2 && `${customer.addressLine2}\n`}
                {customer?.city}, {customer?.province} {customer?.postalCode}<br />
                {customer?.country}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Payment method on file
                </span>
                {customer?.stripePaymentMethodId && (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                )}
              </div>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm">
                <Settings className="h-4 w-4 inline mr-1" />
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}