'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, loadAPI, packageAPI } from '@/lib/api';
import { 
  Truck, Package, MapPin, Navigation, CheckCircle, 
  AlertCircle, LogOut, Phone, QrCode, Clock, Route
} from 'lucide-react';

export default function DriverPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentLoad, setCurrentLoad] = useState<any>(null);
  const [manifest, setManifest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [gpsEnabled, setGpsEnabled] = useState(false);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'driver') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
    
    // Request GPS permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsEnabled(true),
        () => setGpsEnabled(false)
      );
    }
  }, []);

  const loadData = async () => {
    try {
      const loadsRes = await loadAPI.list();
      
      // Find active load for this driver
      const activeLoad = loadsRes.data.loads?.find(
        (load: any) => load.driverId === user?.id && load.status === 'active'
      );
      
      if (activeLoad) {
        setCurrentLoad(activeLoad);
        
        // Get manifest
        const manifestRes = await loadAPI.getManifest(activeLoad.id);
        setManifest(manifestRes.data.packages || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!scannedBarcode) return;
    
    try {
      // Find package in manifest
      const pkg = manifest.find(p => p.barcode === scannedBarcode);
      if (!pkg) {
        alert('Package not found in manifest!');
        return;
      }
      
      // Update package status
      await packageAPI.update(pkg.id, { 
        shipmentStatus: 'delivered',
        deliveredAt: new Date().toISOString()
      });
      
      alert('Package marked as delivered!');
      setScannedBarcode('');
      loadData();
    } catch (error) {
      alert('Error updating package status');
    }
  };

  const updateGPS = () => {
    if (!navigator.geolocation || !currentLoad) return;
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await loadAPI.updateGPS(
          currentLoad.id,
          position.coords.latitude,
          position.coords.longitude
        );
      } catch (error) {
        console.error('Error updating GPS:', error);
      }
    });
  };

  // Update GPS every 5 minutes
  useEffect(() => {
    if (!gpsEnabled || !currentLoad) return;
    
    updateGPS();
    const interval = setInterval(updateGPS, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [gpsEnabled, currentLoad]);

  const stats = {
    totalPackages: manifest.length,
    delivered: manifest.filter(p => p.shipmentStatus === 'delivered').length,
    pending: manifest.filter(p => p.shipmentStatus !== 'delivered').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Truck className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-xl font-bold">Driver Portal</h1>
                <p className="text-sm text-blue-100">Welcome, {user?.firstName}</p>
              </div>
            </div>
            <button
              onClick={() => {
                authAPI.logout();
                router.push('/');
              }}
              className="p-2 hover:bg-blue-700 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* GPS Status Bar */}
      <div className={`px-4 py-2 text-sm ${gpsEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        <div className="flex items-center">
          <Navigation className="h-4 w-4 mr-2" />
          {gpsEnabled ? 'GPS tracking active' : 'GPS tracking disabled - Enable location services'}
        </div>
      </div>

      {/* Current Load Info */}
      {currentLoad ? (
        <div className="px-4 py-4 bg-white border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold">Load #{currentLoad.id.slice(0, 8)}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Vehicle: {currentLoad.vehicleId} | Route: {currentLoad.route}
              </p>
              <p className="text-sm text-gray-600">
                Departure: {new Date(currentLoad.departureDate).toLocaleDateString()}
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-8 bg-white border-b text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No active load assigned</p>
          <p className="text-sm text-gray-500 mt-1">Contact dispatch for assignment</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-4 text-center">
            <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalPackages}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.delivered}</p>
            <p className="text-xs text-gray-600">Delivered</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Package Scanner</h3>
            <QrCode className="h-6 w-6 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter or scan barcode..."
              value={scannedBarcode}
              onChange={(e) => setScannedBarcode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleScan}
              disabled={!scannedBarcode}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Mark as Delivered
            </button>
          </div>
        </div>
      </div>

      {/* Manifest */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b">
            <h3 className="text-lg font-semibold">Delivery Manifest</h3>
          </div>
          
          {manifest.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No packages in manifest</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {manifest.map((pkg) => (
                <div key={pkg.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-sm">{pkg.barcode}</span>
                        {pkg.shipmentStatus === 'delivered' && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {pkg.shipTo?.address}
                        </div>
                        <div>
                          {pkg.shipTo?.city}, {pkg.shipTo?.province} {pkg.shipTo?.postalCode}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {pkg.shipTo?.phone || 'No phone'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-3">
                      {pkg.shipmentStatus === 'delivered' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Delivered
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setScannedBarcode(pkg.barcode);
                            handleScan();
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          Deliver
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {pkg.specialInstructions && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                      Note: {pkg.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white rounded-lg p-4 flex flex-col items-center hover:bg-gray-50">
            <Route className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium">View Route</span>
          </button>
          <button className="bg-white rounded-lg p-4 flex flex-col items-center hover:bg-gray-50">
            <Phone className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium">Call Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
}