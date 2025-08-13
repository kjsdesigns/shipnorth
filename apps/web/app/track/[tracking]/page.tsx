'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { packageAPI } from '@/lib/api';
import { 
  Package, MapPin, CheckCircle, Clock, Truck, 
  Calendar, AlertCircle, Home, Navigation
} from 'lucide-react';

export default function TrackingPage() {
  const params = useParams();
  const trackingNumber = params.tracking as string;
  const [packageData, setPackageData] = useState<any>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrackingData();
  }, [trackingNumber]);

  const loadTrackingData = async () => {
    try {
      // Get all packages and find by tracking number
      const packagesRes = await packageAPI.list();
      const pkg = packagesRes.data.packages?.find(
        (p: any) => p.trackingNumber === trackingNumber
      );
      
      if (!pkg) {
        setError('Package not found');
        setLoading(false);
        return;
      }
      
      setPackageData(pkg);
      
      // Mock tracking events
      const events = [
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Label Created',
          description: 'Shipping label was created',
          location: 'Toronto, ON',
          icon: Package,
        },
        {
          timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Package Received',
          description: 'Package received at Shipnorth facility',
          location: 'Toronto, ON',
          icon: Home,
        },
        {
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'In Transit',
          description: 'Package departed facility',
          location: 'Toronto, ON',
          icon: Truck,
        },
        {
          timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Out for Delivery',
          description: 'Package is out for delivery',
          location: `${pkg.shipTo?.city}, ${pkg.shipTo?.province}`,
          icon: Navigation,
        },
      ];
      
      if (pkg.shipmentStatus === 'delivered') {
        events.push({
          timestamp: pkg.deliveredAt || new Date().toISOString(),
          status: 'Delivered',
          description: 'Package was delivered successfully',
          location: `${pkg.shipTo?.city}, ${pkg.shipTo?.province}`,
          icon: CheckCircle,
        });
      }
      
      setTrackingEvents(events.reverse());
    } catch (err: any) {
      setError('Error loading tracking information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Package Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find a package with tracking number: <span className="font-mono">{trackingNumber}</span>
            </p>
            <a href="/" className="text-blue-600 hover:underline">Return to Home</a>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'in_transit':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Package Tracking</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Package Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Tracking #{trackingNumber}
              </h2>
              <p className="text-sm text-gray-600">Barcode: {packageData.barcode}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(packageData.shipmentStatus)}`}>
              {packageData.shipmentStatus?.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Destination</h3>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                <div>
                  <p className="text-gray-900">{packageData.shipTo?.name}</p>
                  <p className="text-gray-600">{packageData.shipTo?.address}</p>
                  <p className="text-gray-600">
                    {packageData.shipTo?.city}, {packageData.shipTo?.province} {packageData.shipTo?.postalCode}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Package Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="text-gray-900">{packageData.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="text-gray-900">
                    {packageData.length}x{packageData.width}x{packageData.height} cm
                  </span>
                </div>
                {packageData.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Delivery:</span>
                    <span className="text-gray-900">
                      {new Date(packageData.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tracking History</h2>
          
          <div className="relative">
            {trackingEvents.map((event, index) => {
              const Icon = event.icon;
              const isLast = index === trackingEvents.length - 1;
              const isFirst = index === 0;
              
              return (
                <div key={index} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isFirst ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${isFirst ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    {!isLast && (
                      <div className="w-0.5 h-20 bg-gray-300 mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 pb-8">
                    <h3 className={`font-semibold ${isFirst ? 'text-green-600' : 'text-gray-900'}`}>
                      {event.status}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(event.timestamp).toLocaleDateString()}
                      <span className="mx-2">•</span>
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(event.timestamp).toLocaleTimeString()}
                      <span className="mx-2">•</span>
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Map</h2>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Interactive map will be displayed here</p>
              <p className="text-sm text-gray-500 mt-1">Google Maps API integration required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}