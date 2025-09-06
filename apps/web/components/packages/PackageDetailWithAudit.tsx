'use client';

import { useState, useEffect } from 'react';
import ObjectAuditTrail from '../common/ObjectAuditTrail';
import MessageHistory from '../customer/MessageHistory';
import { Package, MessageSquare, History, Truck, MapPin } from 'lucide-react';

interface PackageDetails {
  id: string;
  trackingNumber: string;
  customerId: string;
  customerName: string;
  status: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  shipTo: any;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  packageId: string;
}

export default function PackageDetailWithAudit({ packageId }: Props) {
  const [packageData, setPackageData] = useState<PackageDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'audit'>('details');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackageData();
  }, [packageId]);

  const loadPackageData = async () => {
    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPackageData(data.data);
      }
    } catch (error) {
      console.error('Failed to load package data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading package details...</span>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="text-center p-8">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Package not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Package Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-4 mb-4">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Package #{packageData.trackingNumber}
            </h1>
            <p className="text-gray-600">
              {packageData.customerName} • Status: {packageData.status}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Package Details
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Customer Messages
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Audit Trail
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Package Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Tracking Number:</span>
                  <span className="ml-2 font-mono">{packageData.trackingNumber}</span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    packageData.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    packageData.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {packageData.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Weight:</span>
                  <span className="ml-2">{packageData.weight} kg</span>
                </div>
                <div>
                  <span className="font-medium">Dimensions:</span>
                  <span className="ml-2">
                    {packageData.dimensions.length} × {packageData.dimensions.width} × {packageData.dimensions.height} cm
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Information
              </h2>
              <div className="space-y-2">
                <div className="text-gray-700">
                  {packageData.shipTo?.street || 'Address not available'}
                </div>
                <div className="text-gray-600">
                  {packageData.shipTo?.city}, {packageData.shipTo?.province} {packageData.shipTo?.postalCode}
                </div>
                <div className="text-gray-600">
                  {packageData.shipTo?.country || 'Canada'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'messages' && (
          <MessageHistory customerId={packageData.customerId} />
        )}
        
        {activeTab === 'audit' && (
          <ObjectAuditTrail 
            resourceType="package"
            resourceId={packageData.id}
            resourceName={packageData.trackingNumber}
          />
        )}
      </div>
    </div>
  );
}