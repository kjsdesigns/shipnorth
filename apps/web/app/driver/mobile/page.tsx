'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, loadAPI, packageAPI } from '@/lib/api';
import useServerSession from '@/hooks/useServerSession';
import { 
  Package, 
  Truck, 
  MapPin, 
  Camera, 
  CheckCircle, 
  Clock, 
  Phone,
  Navigation,
  Scan,
  FileSignature,
  AlertCircle,
  Battery,
  Wifi,
  WifiOff
} from 'lucide-react';

interface MobileDriverState {
  currentLoad: any;
  activePackage: any;
  gpsStatus: 'active' | 'inactive' | 'error';
  networkStatus: 'online' | 'offline';
  batteryLevel: number;
  syncQueueSize: number;
}

export default function MobileDriverInterface() {
  const router = useRouter();
  const { user, loading: authLoading, hasRole } = useServerSession();
  const [state, setState] = useState<MobileDriverState>({
    currentLoad: null,
    activePackage: null,
    gpsStatus: 'inactive',
    networkStatus: 'online',
    batteryLevel: 100,
    syncQueueSize: 0
  });
  
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Server-side authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ DRIVER MOBILE: No authenticated user, redirecting');
        router.push('/login/');
        return;
      }
      
      if (!hasRole('driver')) {
        console.log('❌ DRIVER MOBILE: User lacks driver role');
        router.push('/login/');
        return;
      }
      
      console.log('✅ DRIVER MOBILE: User authenticated via server session');
      setLoading(false);
    }
  }, [user, authLoading, hasRole, router]);

  // Initialize mobile interface when user is authenticated
  useEffect(() => {
    if (user && hasRole('driver') && !loading) {
      initializeMobileInterface();
      startLocationTracking();
      setupNetworkMonitoring();
      setupBatteryMonitoring();
    }
  }, [user, hasRole, loading]);

  const initializeMobileInterface = async () => {
    try {
      // Load current assignment
      const loadsResponse = await loadAPI.list();
      const driverLoads = loadsResponse.data.filter((load: any) => 
        load.driverId === user?.id && load.status === 'in_transit'
      );

      if (driverLoads.length > 0) {
        setState(prev => ({
          ...prev,
          currentLoad: driverLoads[0],
          activePackage: driverLoads[0].packages?.find((p: any) => p.status !== 'delivered')
        }));
      }

    } catch (error) {
      console.error('Mobile interface initialization failed:', error);
    }
  };

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      };

      navigator.geolocation.watchPosition(
        async (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            heading: position.coords.heading,
            speed: position.coords.speed
          };

          setLocation(locationData);
          setState(prev => ({ ...prev, gpsStatus: 'active' }));

          // Send to server with offline queue fallback
          try {
            await authAPI.gps.updateLocation(locationData);
          } catch (error) {
            console.log('📱 Adding GPS update to offline queue');
            await authAPI.sync.addToQueue({
              action: 'location_update',
              data: locationData,
              priority: 'high'
            });
          }
        },
        (error) => {
          console.error('GPS error:', error);
          setState(prev => ({ ...prev, gpsStatus: 'error' }));
        },
        options
      );
    }
  };

  const setupNetworkMonitoring = () => {
    const updateNetworkStatus = () => {
      setState(prev => ({
        ...prev,
        networkStatus: navigator.onLine ? 'online' : 'offline'
      }));
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
  };

  const setupBatteryMonitoring = async () => {
    try {
      // @ts-ignore - Battery API not in TypeScript types yet
      const battery = await navigator.getBattery?.();
      if (battery) {
        const updateBatteryLevel = () => {
          setState(prev => ({ ...prev, batteryLevel: Math.round(battery.level * 100) }));
        };
        
        battery.addEventListener('levelchange', updateBatteryLevel);
        updateBatteryLevel();
      }
    } catch (error) {
      console.log('Battery monitoring not supported');
    }
  };

  const handlePackageScanned = async (scanData: any) => {
    try {
      setScanning(false);
      
      // Validate scan matches current load
      const packageInLoad = state.currentLoad?.packages?.find((p: any) => 
        p.trackingNumber === scanData.trackingNumber || p.barcode === scanData.barcode
      );

      if (!packageInLoad) {
        alert('📦 Package not found in current load');
        return;
      }

      setSelectedPackage(packageInLoad);
      setDeliveryMode(true);

    } catch (error) {
      console.error('Package scan processing failed:', error);
      alert('❌ Scan processing failed');
    }
  };

  const markPackageDelivered = async (packageId: string, deliveryData: any) => {
    try {
      // Call API to mark delivered
      await packageAPI.markDelivered(packageId, {
        deliveredAt: new Date().toISOString(),
        signature: deliveryData.signature,
        photoUrl: deliveryData.photoUrl,
        recipientName: deliveryData.recipientName,
        confirmedBy: user?.id
      });

      // Update local state
      setState(prev => ({
        ...prev,
        currentLoad: {
          ...prev.currentLoad,
          packages: prev.currentLoad?.packages?.map((p: any) => 
            p.id === packageId 
              ? { ...p, status: 'delivered', deliveredAt: new Date().toISOString() }
              : p
          )
        },
        activePackage: prev.currentLoad?.packages?.find((p: any) => 
          p.id !== packageId && p.status !== 'delivered'
        ) || null
      }));

      setDeliveryMode(false);
      setSelectedPackage(null);

      // Show success feedback
      console.log('✅ Package marked as delivered successfully');

    } catch (error) {
      console.error('Delivery confirmation failed:', error);
      
      // Add to offline queue
      await authAPI.sync.addToQueue({
        action: 'delivery_confirmation',
        data: { packageId, ...deliveryData },
        priority: 'high'
      });

      alert('📱 Delivery saved offline - will sync when connected');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'offline': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-orange-500';
    return 'text-red-500';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Initializing mobile interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Status Bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${getStatusColor(state.gpsStatus)}`}>
            <MapPin className="h-4 w-4 mr-1" />
            GPS
          </div>
          <div className={`flex items-center ${state.networkStatus === 'online' ? 'text-green-500' : 'text-red-500'}`}>
            {state.networkStatus === 'online' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </div>
          <div className={`flex items-center ${getBatteryColor(state.batteryLevel)}`}>
            <Battery className="h-4 w-4 mr-1" />
            {state.batteryLevel}%
          </div>
        </div>
        
        {state.syncQueueSize > 0 && (
          <div className="bg-orange-600 px-2 py-1 rounded text-xs">
            {state.syncQueueSize} pending sync
          </div>
        )}
      </div>

      {/* Main Interface */}
      <div className="p-4 space-y-4">
        {/* Current Load Status */}
        {state.currentLoad ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Current Load</h2>
              <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                {state.currentLoad.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Load ID</p>
                <p className="font-medium">{state.currentLoad.id}</p>
              </div>
              <div>
                <p className="text-gray-400">Packages</p>
                <p className="font-medium">{state.currentLoad.packages?.length || 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Completed</p>
                <p className="font-medium text-green-400">
                  {state.currentLoad.packages?.filter((p: any) => p.status === 'delivered').length || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Remaining</p>
                <p className="font-medium text-orange-400">
                  {state.currentLoad.packages?.filter((p: any) => p.status !== 'delivered').length || 0}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <Truck className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Active Load</h3>
            <p className="text-gray-400">Contact dispatch for assignments</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setScanning(true)}
            disabled={!state.currentLoad}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 p-6 rounded-lg flex flex-col items-center justify-center"
          >
            <Scan className="h-8 w-8 mb-2" />
            <span className="font-medium">Scan Package</span>
          </button>

          <button
            onClick={() => router.push('/driver/routes')}
            disabled={!state.currentLoad}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 p-6 rounded-lg flex flex-col items-center justify-center"
          >
            <Navigation className="h-8 w-8 mb-2" />
            <span className="font-medium">Navigation</span>
          </button>
        </div>

        {/* Next Delivery */}
        {state.activePackage && (
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Package className="h-6 w-6 mr-2" />
              <h3 className="font-semibold">Next Delivery</h3>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">{state.activePackage.recipientName}</p>
              <p className="text-green-100 text-sm">
                {state.activePackage.address}, {state.activePackage.city}
              </p>
              
              {state.activePackage.phoneNumber && (
                <a 
                  href={`tel:${state.activePackage.phoneNumber}`}
                  className="flex items-center text-green-100 text-sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {state.activePackage.phoneNumber}
                </a>
              )}

              {state.activePackage.deliveryInstructions && (
                <div className="bg-green-700 bg-opacity-50 rounded p-2 mt-2">
                  <p className="text-xs text-green-100">
                    📝 {state.activePackage.deliveryInstructions}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedPackage(state.activePackage);
                setDeliveryMode(true);
              }}
              className="w-full bg-white text-green-700 font-semibold py-3 rounded-lg mt-4"
            >
              Mark as Delivered
            </button>
          </div>
        )}

        {/* Remaining Packages */}
        {state.currentLoad?.packages && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Remaining Deliveries</h3>
            <div className="space-y-2">
              {state.currentLoad.packages
                .filter((p: any) => p.status !== 'delivered')
                .map((pkg: any) => (
                  <div key={pkg.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{pkg.recipientName}</p>
                        <p className="text-gray-400 text-xs">{pkg.trackingNumber}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setDeliveryMode(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                      >
                        Deliver
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Location Status */}
        {location && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="font-medium">GPS Active</p>
                  <p className="text-gray-400 text-xs">
                    ±{location.accuracy?.toFixed(0) || '0'}m accuracy
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{new Date(location.timestamp).toLocaleTimeString()}</p>
                {location.speed && (
                  <p>{(location.speed * 3.6).toFixed(0)} km/h</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Package Scanner Modal */}
      {scanning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 m-4 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Scan Package</h3>
            <div className="bg-gray-700 h-48 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Camera preview</p>
                <p className="text-xs text-gray-500">Point at barcode</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handlePackageScanned({ trackingNumber: 'SN001234567' })}
                className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium"
              >
                Simulate Scan
              </button>
              <button
                onClick={() => setScanning(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {deliveryMode && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg m-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Confirm Delivery</h3>
              
              {/* Package Info */}
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="font-medium">{selectedPackage.trackingNumber}</p>
                <p className="text-gray-400">{selectedPackage.recipientName}</p>
                <p className="text-gray-400 text-sm">
                  {selectedPackage.address}, {selectedPackage.city}
                </p>
              </div>

              {/* Delivery Actions */}
              <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg flex items-center justify-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </button>

                <button className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg flex items-center justify-center">
                  <FileSignature className="h-5 w-5 mr-2" />
                  Capture Signature
                </button>

                <button
                  onClick={() => markPackageDelivered(selectedPackage.id, {
                    signature: 'Digital Signature',
                    recipientName: selectedPackage.recipientName
                  })}
                  className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg flex items-center justify-center font-medium"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirm Delivery
                </button>

                <button
                  onClick={() => {
                    setDeliveryMode(false);
                    setSelectedPackage(null);
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="grid grid-cols-4 gap-1 p-2">
          <button
            onClick={() => router.push('/driver')}
            className="flex flex-col items-center py-3 px-2 text-gray-400 hover:text-white"
          >
            <Truck className="h-5 w-5 mb-1" />
            <span className="text-xs">Dashboard</span>
          </button>
          
          <button
            onClick={() => setScanning(true)}
            disabled={!state.currentLoad}
            className="flex flex-col items-center py-3 px-2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <Scan className="h-5 w-5 mb-1" />
            <span className="text-xs">Scan</span>
          </button>
          
          <button
            onClick={() => router.push('/driver/routes')}
            disabled={!state.currentLoad}
            className="flex flex-col items-center py-3 px-2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <Navigation className="h-5 w-5 mb-1" />
            <span className="text-xs">Route</span>
          </button>
          
          <button
            onClick={() => router.push('/driver/earnings')}
            className="flex flex-col items-center py-3 px-2 text-gray-400 hover:text-white"
          >
            <Clock className="h-5 w-5 mb-1" />
            <span className="text-xs">Time</span>
          </button>
        </div>
      </div>
    </div>
  );
}