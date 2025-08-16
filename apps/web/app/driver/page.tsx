'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, loadAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import { 
  Truck, MapPin, Clock, Package, Play, Square, Navigation,
  CheckCircle, AlertCircle, Eye, Plus, Fingerprint, Shield
} from 'lucide-react';

interface MapProps {
  center: { lat: number; lng: number };
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    type: 'current' | 'destination' | 'waypoint';
  }>;
  interactive?: boolean;
}

// Enhanced map component for driver interface
function DriverMap({ center, onLocationSelect, markers = [], interactive = false }: MapProps) {
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onLocationSelect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Mock coordinate calculation based on click position
    const lat = center.lat + ((rect.height / 2 - y) / rect.height) * 0.1;
    const lng = center.lng + ((x - rect.width / 2) / rect.width) * 0.1;
    
    onLocationSelect(lat, lng);
  };

  return (
    <div 
      className={`w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden ${
        interactive ? 'cursor-crosshair' : 'cursor-default'
      }`}
      onClick={handleMapClick}
    >
      {/* Mock map visualization */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900">
        {markers.map((marker, index) => (
          <div
            key={index}
            className={`absolute w-4 h-4 rounded-full ${
              marker.type === 'current' 
                ? 'bg-red-500 animate-pulse border-2 border-white' 
                : marker.type === 'destination'
                ? 'bg-green-500 border-2 border-white'
                : 'bg-blue-500 border-2 border-white'
            } transform -translate-x-1/2 -translate-y-1/2`}
            style={{
              left: `${50 + (marker.position.lng - center.lng) * 800}%`,
              top: `${50 - (marker.position.lat - center.lat) * 800}%`,
            }}
            title={marker.title}
          />
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm shadow z-10">
        <MapPin className="w-4 h-4 inline mr-1" />
        {interactive ? 'Click to set location' : 'Live GPS Tracking'}
      </div>
    </div>
  );
}

export default function DriverPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loads, setLoads] = useState<any[]>([]);
  const [activeLoad, setActiveLoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [manualLocationMode, setManualLocationMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [trackingActive, setTrackingActive] = useState(false);
  const [lastTrackedLocation, setLastTrackedLocation] = useState<any>(null);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'driver') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadDriverData();
    
    // Check for geolocation support
    if (navigator.geolocation) {
      setGpsEnabled(true);
    }
  }, [router]);

  const loadDriverData = async () => {
    try {
      const loadsRes = await loadAPI.list();
      const allLoads = loadsRes.data.loads || [];
      
      // Filter loads for this driver or unassigned loads
      const driverLoads = allLoads.filter((load: any) => 
        !load.driverId || load.driverId === user?.id
      );
      
      setLoads(driverLoads);
      
      // Check if driver has an active load
      const active = driverLoads.find((load: any) => 
        load.status === 'in_transit' && load.driverId === user?.id
      );
      if (active) {
        setActiveLoad(active);
        setTrackingActive(true);
        
        // Get last location
        const locationRes = await loadAPI.getLocations(active.id);
        if (locationRes.data.currentLocation) {
          setLastTrackedLocation(locationRes.data.currentLocation);
        }
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLoad = async (loadId: string) => {
    try {
      await loadAPI.update(loadId, {
        status: 'in_transit',
        driverId: user?.id,
      });
      
      const updatedLoad = await loadAPI.get(loadId);
      setActiveLoad(updatedLoad.data.load);
      setTrackingActive(true);
      
      // Start automatic GPS tracking
      startGPSTracking(loadId);
      
      loadDriverData();
    } catch (error) {
      console.error('Error starting load:', error);
    }
  };

  const startGPSTracking = (loadId: string) => {
    if (!gpsEnabled) return;
    
    const trackingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            await loadAPI.addLocation(loadId, latitude, longitude, false);
            setLastTrackedLocation({
              lat: latitude,
              lng: longitude,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Error updating GPS:', error);
          }
        },
        (error) => {
          console.error('GPS error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    }, 300000); // Every 5 minutes

    // Store interval ID for cleanup
    (window as any).gpsTrackingInterval = trackingInterval;
  };

  const stopGPSTracking = () => {
    if ((window as any).gpsTrackingInterval) {
      clearInterval((window as any).gpsTrackingInterval);
      (window as any).gpsTrackingInterval = null;
    }
    setTrackingActive(false);
  };

  const addManualLocation = async () => {
    if (!selectedLocation || !activeLoad) return;
    
    try {
      await loadAPI.addLocation(
        activeLoad.id, 
        selectedLocation.lat, 
        selectedLocation.lng, 
        true, 
        locationAddress || undefined
      );
      
      setLastTrackedLocation({
        ...selectedLocation,
        timestamp: new Date().toISOString(),
        address: locationAddress,
      });
      
      setSelectedLocation(null);
      setLocationAddress('');
      setManualLocationMode(false);
    } catch (error) {
      console.error('Error adding manual location:', error);
    }
  };

  const completeLoad = async () => {
    if (!activeLoad) return;
    
    try {
      await loadAPI.update(activeLoad.id, {
        status: 'delivered',
      });
      
      stopGPSTracking();
      setActiveLoad(null);
      loadDriverData();
    } catch (error) {
      console.error('Error completing load:', error);
    }
  };

  if (loading) {
    return (
      <ModernLayout role="driver">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout role="driver">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Driver Portal
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {user?.firstName} {user?.lastName} • {gpsEnabled ? 'GPS Enabled' : 'GPS Disabled'}
          </p>
        </div>
        
        {/* Quick Access Buttons */}
        <div className="flex space-x-2">
          <button
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            title="Quick PIN Access"
          >
            <Shield className="h-4 w-4" />
          </button>
          <button
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            title="Biometric Access"
          >
            <Fingerprint className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active Load Section */}
      {activeLoad && (
        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Truck className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Active Load: #{activeLoad.id.slice(-6)}
                </h2>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {activeLoad.deliveryCities?.length || 0} destinations • {activeLoad.totalPackages || 0} packages
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setManualLocationMode(!manualLocationMode)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  manualLocationMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 border border-blue-600'
                }`}
              >
                {manualLocationMode ? 'Cancel' : 'Manual Location'}
              </button>
              <button
                onClick={completeLoad}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Load
              </button>
            </div>
          </div>

          {/* GPS Tracking Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {manualLocationMode ? (
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                    Select Location Manually
                  </h3>
                  <DriverMap
                    center={lastTrackedLocation || { lat: 43.6532, lng: -79.3832 }}
                    onLocationSelect={setSelectedLocation}
                    interactive={true}
                    markers={selectedLocation ? [{
                      position: selectedLocation,
                      title: 'Selected Location',
                      type: 'current',
                    }] : []}
                  />
                  
                  {selectedLocation && (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </div>
                      <input
                        type="text"
                        placeholder="Location description (optional)"
                        value={locationAddress}
                        onChange={(e) => setLocationAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="datetime-local"
                          defaultValue={new Date().toISOString().slice(0, 16)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                        />
                        <button
                          onClick={addManualLocation}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                    Current Location
                  </h3>
                  <DriverMap
                    center={lastTrackedLocation || { lat: 43.6532, lng: -79.3832 }}
                    markers={lastTrackedLocation ? [{
                      position: lastTrackedLocation,
                      title: 'Current Position',
                      type: 'current',
                    }] : []}
                  />
                  
                  {lastTrackedLocation && (
                    <div className="mt-3 text-sm text-blue-700 dark:text-blue-300">
                      <div className="flex items-center">
                        <Navigation className="h-4 w-4 mr-1" />
                        Last update: {new Date(lastTrackedLocation.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="mt-1">
                        Coordinates: {lastTrackedLocation.lat.toFixed(6)}, {lastTrackedLocation.lng.toFixed(6)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Route Info */}
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                Route Information
              </h3>
              <div className="space-y-3">
                {activeLoad.deliveryCities?.map((city: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        city.expectedDeliveryDate ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {city.city}, {city.province}
                        </p>
                        {city.expectedDeliveryDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {new Date(city.expectedDeliveryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      {city.distance && `${city.distance} km`}
                      {city.drivingDuration && (
                        <div>{Math.floor(city.drivingDuration / 60)}h {city.drivingDuration % 60}m</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tracking Status */}
          <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  trackingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  GPS Tracking: {trackingActive ? 'Active (5min intervals)' : 'Stopped'}
                </span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Next update: {trackingActive ? '4:32' : 'Stopped'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Loads */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeLoad ? 'Other Available Loads' : 'Available Loads'}
          </h2>
        </div>
        
        <div className="p-6">
          {loads.filter(load => load.id !== activeLoad?.id).length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No available loads</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Check back later for new assignments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loads
                .filter(load => load.id !== activeLoad?.id)
                .map((load) => (
                  <div
                    key={load.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Truck className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            Load #{load.id.slice(-6)}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Departure: {new Date(load.departureDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {load.deliveryCities?.length || 0} stops • {load.totalPackages || 0} packages
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          load.status === 'planned' 
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {load.status}
                        </span>
                        
                        {load.status === 'planned' && !activeLoad && (
                          <button
                            onClick={() => startLoad(load.id)}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </button>
                        )}
                        
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Route Preview */}
                    {load.deliveryCities && load.deliveryCities.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3" />
                          <span>Route: </span>
                          {load.deliveryCities.slice(0, 3).map((city: any, idx: number) => (
                            <span key={idx}>
                              {city.city}
                              {idx < Math.min(load.deliveryCities.length - 1, 2) && ' → '}
                            </span>
                          ))}
                          {load.deliveryCities.length > 3 && (
                            <span> + {load.deliveryCities.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Driver Status Panel */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Driver Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${gpsEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-600 dark:text-gray-400">
              GPS: {gpsEnabled ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${trackingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-gray-600 dark:text-gray-400">
              Tracking: {trackingActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${activeLoad ? 'bg-blue-500' : 'bg-gray-400'}`} />
            <span className="text-gray-600 dark:text-gray-400">
              Load: {activeLoad ? 'In Progress' : 'Available'}
            </span>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}