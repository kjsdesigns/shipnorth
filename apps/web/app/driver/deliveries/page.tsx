'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, packageAPI, loadAPI } from '@/lib/api';
import useServerSession from '@/hooks/useServerSession';
import ModernLayout from '@/components/ModernLayout';
import PhotoUpload from '@/components/PhotoUpload';
import SignatureCapture from '@/components/SignatureCapture';
import OfflineSyncStatus from '@/components/OfflineSyncStatus';
import {
  Package,
  CheckCircle,
  Clock,
  MapPin,
  Camera,
  FileText,
  User,
  Phone,
  AlertCircle,
  RefreshCw,
  Signature,
} from 'lucide-react';

interface DeliveryPackage {
  id: string;
  trackingNumber: string;
  recipientName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  deliveryInstructions?: string;
  phoneNumber?: string;
  signature?: string;
  photoUrl?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  attemptCount: number;
}

export default function DriverDeliveries() {
  const router = useRouter();
  const { user, loading: authLoading, hasRole } = useServerSession();
  const [packages, setPackages] = useState<DeliveryPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<DeliveryPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showSignatureCapture, setShowSignatureCapture] = useState(false);
  const [activePackageForCapture, setActivePackageForCapture] = useState<DeliveryPackage | null>(
    null
  );

  // Server-side authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ DRIVER DELIVERIES: No authenticated user, redirecting');
        router.push('/login/');
        return;
      }
      
      if (!hasRole('driver')) {
        console.log('❌ DRIVER DELIVERIES: User lacks driver role');
        router.push('/login/');
        return;
      }
      
      console.log('✅ DRIVER DELIVERIES: User authenticated via server session');
      setLoading(false);
    }
  }, [user, authLoading, hasRole, router]);

  // Load data when user is authenticated
  useEffect(() => {
    if (user && hasRole('driver') && !loading) {
      loadDeliveries();
    }
  }, [user, hasRole, loading]);

  const loadDeliveries = async () => {
    try {
      // Get driver's loads and extract packages
      const loadsResponse = await loadAPI.list();
      const allLoads = loadsResponse.data;

      // Filter loads assigned to current driver
      const driverLoads = allLoads.filter((load: any) => load.driverId === user?.id);

      // Get packages from all driver loads
      const allPackages = [];
      for (const load of driverLoads) {
        try {
          const packagesResponse = await packageAPI.getByLoad(load.id);
          const loadPackages = packagesResponse.data.map((pkg: any) => ({
            id: pkg.id,
            trackingNumber: pkg.trackingNumber,
            recipientName: pkg.recipientName || 'Unknown Recipient',
            address: pkg.deliveryAddress?.address || pkg.address,
            city: pkg.deliveryAddress?.city || pkg.city,
            province: pkg.deliveryAddress?.province || pkg.province,
            postalCode: pkg.deliveryAddress?.postalCode || pkg.postalCode,
            status:
              pkg.status === 'delivered'
                ? 'delivered'
                : pkg.status === 'picked_up' || pkg.status === 'shipped'
                  ? 'in_transit'
                  : 'pending',
            deliveryInstructions: pkg.deliveryInstructions,
            phoneNumber: pkg.deliveryAddress?.phone || pkg.phone,
            signature: pkg.deliveryConfirmation?.signature,
            photoUrl: pkg.deliveryConfirmation?.photoUrl,
            deliveredAt: pkg.deliveryConfirmation?.deliveredAt,
            deliveryNotes: pkg.deliveryNotes,
            attemptCount: pkg.attemptCount || 0,
          }));
          allPackages.push(...loadPackages);
        } catch (error) {
          console.warn(`Failed to load packages for load ${load.id}:`, error);
        }
      }

      setPackages(allPackages);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'in_transit':
        return <Package className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    if (filter === 'all') return true;
    return pkg.status === filter;
  });

  const markAsDelivered = (pkg: DeliveryPackage) => {
    setSelectedPackage(pkg);
    setShowDeliveryModal(true);
  };

  const confirmDelivery = async () => {
    if (selectedPackage) {
      try {
        // Use real API to mark package as delivered
        await packageAPI.markDelivered(selectedPackage.id, {
          deliveredAt: new Date().toISOString(),
          signature: 'Digital Signature',
          confirmedBy: user?.id,
        });

        // Update local state
        const updatedPackages = packages.map((pkg) =>
          pkg.id === selectedPackage.id
            ? {
                ...pkg,
                status: 'delivered' as const,
                deliveredAt: new Date().toISOString(),
                signature: 'Digital Signature',
              }
            : pkg
        );
        setPackages(updatedPackages);
        setSelectedPackage(null);
        setShowDeliveryModal(false);

        // Add to offline sync queue as backup
        await authAPI.sync.addToQueue({
          action: 'delivery_confirmation',
          data: {
            packageId: selectedPackage.id,
            deliveredAt: new Date().toISOString(),
            confirmedBy: user?.id,
          },
          priority: 'high',
        });
      } catch (error) {
        console.error('Failed to confirm delivery:', error);

        // Add to offline sync queue if API call fails
        try {
          await authAPI.sync.addToQueue({
            action: 'delivery_confirmation',
            data: {
              packageId: selectedPackage.id,
              deliveredAt: new Date().toISOString(),
              confirmedBy: user?.id,
              offline: true,
            },
            priority: 'high',
          });
        } catch (syncError) {
          console.error('Failed to add to sync queue:', syncError);
        }
      }
    }
  };

  const scanPackage = async (scannedValue: string) => {
    try {
      const scanResponse = await authAPI.scanning.scanPackage({
        scannedValue,
        scanType: 'barcode', // or 'qr_code'
        lat: 0, // Would use GPS location if available
        lng: 0,
        notes: 'Driver delivery scan',
      });

      if (scanResponse.data.success) {
        setScanResult(`Package ${scannedValue} validated successfully`);

        // Find and select the scanned package
        const scannedPackage = packages.find(
          (pkg) => pkg.trackingNumber === scannedValue || pkg.id === scannedValue
        );
        if (scannedPackage) {
          setSelectedPackage(scannedPackage);
        }
      } else {
        setScanResult(`Package ${scannedValue} not found or invalid`);
      }
    } catch (error) {
      console.error('Package scan failed:', error);
      setScanResult(`Scan failed: ${error}`);
    }
  };

  const takePhoto = async (packageId: string) => {
    try {
      // Mock photo capture - in real app would use camera
      const mockPhotoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/...'; // Mock base64 data

      const response = await authAPI.media.uploadPhoto({
        packageId,
        photoData: mockPhotoData,
        metadata: {
          capturedAt: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          location: { lat: 0, lng: 0 }, // Would use real GPS
        },
      });

      if (response.data.success) {
        console.log('Photo uploaded successfully');
        // Update package with photo URL
        setPackages((prev) =>
          prev.map((pkg) =>
            pkg.id === packageId ? { ...pkg, photoUrl: response.data.media.url } : pkg
          )
        );
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      // Add to offline sync queue
      await authAPI.sync.addToQueue({
        action: 'photo_upload',
        data: { packageId, offline: true },
        priority: 'medium',
      });
    }
  };

  const getSignature = async (packageId: string, recipientName: string) => {
    try {
      // Mock signature capture - in real app would use signature pad
      const mockSignatureData = 'data:image/svg+xml;base64,...'; // Mock signature data

      const response = await authAPI.media.uploadSignature({
        packageId,
        signatureData: mockSignatureData,
        recipientName,
        metadata: {
          capturedAt: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
        },
      });

      if (response.data.success) {
        console.log('Signature captured successfully');
        // Update package with signature
        setPackages((prev) =>
          prev.map((pkg) => (pkg.id === packageId ? { ...pkg, signature: recipientName } : pkg))
        );
      }
    } catch (error) {
      console.error('Signature capture failed:', error);
      // Add to offline sync queue
      await authAPI.sync.addToQueue({
        action: 'signature_capture',
        data: { packageId, recipientName, offline: true },
        priority: 'medium',
      });
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
        {/* Header with Stats */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deliveries</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage package deliveries and proof of delivery
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <OfflineSyncStatus />
              <button
                onClick={() => setShowScanModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Camera className="h-5 w-5 mr-2" />
                Scan Package
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                  <p className="font-bold text-yellow-800 dark:text-yellow-200">
                    {packages.filter((p) => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">In Transit</p>
                  <p className="font-bold text-blue-800 dark:text-blue-200">
                    {packages.filter((p) => p.status === 'in_transit').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Delivered</p>
                  <p className="font-bold text-green-800 dark:text-green-200">
                    {packages.filter((p) => p.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                  <p className="font-bold text-red-800 dark:text-red-200">
                    {packages.filter((p) => p.status === 'failed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', name: 'All Packages' },
              { id: 'pending', name: 'Pending' },
              { id: 'in_transit', name: 'In Transit' },
              { id: 'delivered', name: 'Delivered' },
              { id: 'failed', name: 'Failed' },
            ].map(({ id, name }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                {name}
              </button>
            ))}
          </nav>
        </div>

        {/* Packages List */}
        <div className="space-y-4">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-4`}>{getStatusIcon(pkg.status)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {pkg.trackingNumber}
                      </h3>
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="text-gray-600 dark:text-gray-400">{pkg.recipientName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pkg.status)}`}
                    >
                      {pkg.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {pkg.attemptCount > 0 && (
                      <span className="text-xs text-gray-500">Attempt {pkg.attemptCount}</span>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Address
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                      {pkg.address}, {pkg.city}, {pkg.province} {pkg.postalCode}
                    </p>
                  </div>

                  {pkg.phoneNumber && (
                    <div>
                      <div className="flex items-center mb-1">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Contact
                        </span>
                      </div>
                      <a
                        href={`tel:${pkg.phoneNumber}`}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 ml-6"
                      >
                        {pkg.phoneNumber}
                      </a>
                    </div>
                  )}
                </div>

                {pkg.deliveryInstructions && (
                  <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Delivery Instructions
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {pkg.deliveryInstructions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {pkg.status === 'delivered' && (
                  <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          ✓ Delivered Successfully
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {pkg.deliveredAt && new Date(pkg.deliveredAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {pkg.signature && (
                          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                            <Signature className="h-4 w-4 mr-1" />
                            Signed
                          </div>
                        )}
                        {pkg.photoUrl && (
                          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                            <Camera className="h-4 w-4 mr-1" />
                            Photo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {pkg.status === 'failed' && pkg.deliveryNotes && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Delivery Failed
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {pkg.deliveryNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  {pkg.status === 'pending' || pkg.status === 'in_transit' ? (
                    <>
                      <button
                        onClick={() => markAsDelivered(pkg)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Delivered
                      </button>
                      <button
                        onClick={() => setSelectedPackage(pkg)}
                        className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
                      >
                        View Details
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedPackage(pkg)}
                      className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg text-sm"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPackages.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No {filter !== 'all' ? filter : ''} packages
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'No packages assigned' : `No ${filter} packages found`}
            </p>
          </div>
        )}

        {/* Package Details Modal */}
        {selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Package {selectedPackage.trackingNumber}
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
                    Recipient Information
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="font-semibold">{selectedPackage.recipientName}</p>
                    <p className="text-gray-600 dark:text-gray-400">{selectedPackage.address}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedPackage.city}, {selectedPackage.province}{' '}
                      {selectedPackage.postalCode}
                    </p>
                    {selectedPackage.phoneNumber && (
                      <div className="mt-2 flex items-center">
                        <Phone className="h-4 w-4 text-blue-600 mr-2" />
                        <a
                          href={`tel:${selectedPackage.phoneNumber}`}
                          className="text-blue-600 hover:underline"
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
                    <p className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded text-sm">
                      {selectedPackage.deliveryInstructions}
                    </p>
                  </div>
                )}

                {selectedPackage.status === 'delivered' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      Delivery Confirmation
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-green-700 dark:text-green-300">
                        Delivered:{' '}
                        {selectedPackage.deliveredAt &&
                          new Date(selectedPackage.deliveredAt).toLocaleString()}
                      </p>
                      {selectedPackage.signature && (
                        <p className="text-green-700 dark:text-green-300">
                          Signature: {selectedPackage.signature}
                        </p>
                      )}
                      {selectedPackage.photoUrl && (
                        <p className="text-green-700 dark:text-green-300">
                          📷 Delivery photo captured
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(selectedPackage.status === 'pending' ||
                  selectedPackage.status === 'in_transit') && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          markAsDelivered(selectedPackage);
                          setSelectedPackage(null);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                      >
                        Mark as Delivered
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setActivePackageForCapture(selectedPackage);
                            setShowPhotoUpload(true);
                          }}
                          className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded text-sm"
                        >
                          📷 Take Photo
                        </button>
                        <button
                          onClick={() => {
                            setActivePackageForCapture(selectedPackage);
                            setShowSignatureCapture(true);
                          }}
                          className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded text-sm"
                        >
                          ✍️ Get Signature
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Package Scan Modal */}
        {showScanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Scan Package
                  </h3>
                  <button
                    onClick={() => {
                      setShowScanModal(false);
                      setScanResult('');
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking Number or Barcode
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tracking number or scan barcode"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value;
                        if (value) {
                          scanPackage(value);
                        }
                      }
                    }}
                  />
                </div>

                {scanResult && (
                  <div
                    className={`p-3 rounded-lg ${
                      scanResult.includes('successfully')
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}
                  >
                    {scanResult}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowScanModal(false);
                      setScanResult('');
                    }}
                    className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const input = document.querySelector(
                        'input[placeholder*="tracking"]'
                      ) as HTMLInputElement;
                      if (input?.value) {
                        scanPackage(input.value);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Scan Package
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Upload Component */}
        <PhotoUpload
          isOpen={showPhotoUpload}
          packageId={activePackageForCapture?.trackingNumber}
          onPhotoCapture={async (photoData: string) => {
            if (activePackageForCapture) {
              try {
                const response = await authAPI.media.uploadPhoto({
                  packageId: activePackageForCapture.id,
                  photoData,
                  metadata: {
                    capturedAt: new Date().toISOString(),
                    deviceInfo: navigator.userAgent,
                    location: { lat: 0, lng: 0 }, // Would use real GPS
                  },
                });

                if (response.data.success) {
                  // Update package with photo URL
                  setPackages((prev) =>
                    prev.map((pkg) =>
                      pkg.id === activePackageForCapture.id
                        ? { ...pkg, photoUrl: response.data.media.url }
                        : pkg
                    )
                  );
                }
              } catch (error) {
                console.error('Photo upload failed:', error);
                await authAPI.sync.addToQueue({
                  action: 'photo_upload',
                  data: { packageId: activePackageForCapture.id, photoData, offline: true },
                  priority: 'medium',
                });
              }
            }
            setShowPhotoUpload(false);
            setActivePackageForCapture(null);
          }}
          onCancel={() => {
            setShowPhotoUpload(false);
            setActivePackageForCapture(null);
          }}
        />

        {/* Signature Capture Component */}
        <SignatureCapture
          isOpen={showSignatureCapture}
          recipientName={activePackageForCapture?.recipientName}
          onSignatureCapture={async (signatureData: string) => {
            if (activePackageForCapture) {
              try {
                const response = await authAPI.media.uploadSignature({
                  packageId: activePackageForCapture.id,
                  signatureData,
                  recipientName: activePackageForCapture.recipientName,
                  metadata: {
                    capturedAt: new Date().toISOString(),
                    deviceInfo: navigator.userAgent,
                  },
                });

                if (response.data.success) {
                  // Update package with signature
                  setPackages((prev) =>
                    prev.map((pkg) =>
                      pkg.id === activePackageForCapture.id
                        ? { ...pkg, signature: activePackageForCapture.recipientName }
                        : pkg
                    )
                  );
                }
              } catch (error) {
                console.error('Signature capture failed:', error);
                await authAPI.sync.addToQueue({
                  action: 'signature_capture',
                  data: {
                    packageId: activePackageForCapture.id,
                    recipientName: activePackageForCapture.recipientName,
                    signatureData,
                    offline: true,
                  },
                  priority: 'medium',
                });
              }
            }
            setShowSignatureCapture(false);
            setActivePackageForCapture(null);
          }}
          onCancel={() => {
            setShowSignatureCapture(false);
            setActivePackageForCapture(null);
          }}
        />
      </div>
    </ModernLayout>
  );
}
