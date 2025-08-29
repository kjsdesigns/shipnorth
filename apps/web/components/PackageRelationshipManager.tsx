'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Link as LinkIcon,
  Unlink,
  Users,
  ArrowRight,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react';
import { packageAPI } from '@/lib/api';

interface PackageWithRelationships {
  id: string;
  description?: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  parentId?: string;
  childIds?: string[];
  consolidatedAt?: string;
  children?: PackageWithRelationships[];
  parent?: PackageWithRelationships;
  shipmentStatus: string;
  labelStatus: string;
}

interface PackageRelationshipManagerProps {
  packageId: string;
  onRelationshipChange?: () => void;
  className?: string;
}

export default function PackageRelationshipManager({
  packageId,
  onRelationshipChange,
  className = '',
}: PackageRelationshipManagerProps) {
  const [packageData, setPackageData] = useState<PackageWithRelationships | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');

  useEffect(() => {
    loadPackageData();
  }, [packageId]);

  const loadPackageData = async () => {
    try {
      setLoading(true);
      const response = await packageAPI.getWithRelationships(packageId);
      setPackageData(response.data);

      // Load available packages for consolidation
      const packagesResponse = await packageAPI.list({ limit: 100 });
      const allPackages = packagesResponse.data.packages || [];

      // Filter packages that can be consolidated (not already consolidated, different package)
      const available = allPackages.filter(
        (pkg: any) => pkg.id !== packageId && !pkg.parentId && !pkg.childIds?.length
      );
      setAvailablePackages(available);
    } catch (error) {
      console.error('Error loading package relationships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!selectedChildId) return;

    try {
      await packageAPI.consolidate(selectedChildId, packageId);
      setShowAddChild(false);
      setSelectedChildId('');
      loadPackageData();
      onRelationshipChange?.();
    } catch (error) {
      console.error('Error consolidating package:', error);
    }
  };

  const handleRemoveChild = async (childId: string) => {
    try {
      await packageAPI.removeFromConsolidation(childId);
      loadPackageData();
      onRelationshipChange?.();
    } catch (error) {
      console.error('Error removing child package:', error);
    }
  };

  const handleRemoveFromParent = async () => {
    if (!packageData?.parentId) return;

    try {
      await packageAPI.removeFromConsolidation(packageId);
      loadPackageData();
      onRelationshipChange?.();
    } catch (error) {
      console.error('Error removing from parent:', error);
    }
  };

  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className={`${className} p-6`}>
        <div className="text-red-600">Failed to load package data</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Package Relationships
        </h3>

        {/* Current Package Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Package {packageData.id}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {packageData.description || `${packageData.weight}kg package`}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {packageData.length}×{packageData.width}×{packageData.height}cm
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  packageData.shipmentStatus === 'delivered'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : packageData.shipmentStatus === 'in_transit'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                }`}
              >
                {packageData.shipmentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Parent Relationship */}
        {packageData.parentId && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <LinkIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    Consolidated into Package {packageData.parentId}
                  </div>
                  {packageData.consolidatedAt && (
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Added {new Date(packageData.consolidatedAt).toLocaleDateString()}
                    </div>
                  )}
                  {packageData.parent && (
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {packageData.parent.description || `${packageData.parent.weight}kg package`}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemoveFromParent}
                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Remove from consolidated package"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Child Packages */}
        {packageData.childIds && packageData.childIds.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Consolidated Packages ({packageData.childIds.length})
              </h4>
            </div>

            <div className="space-y-2">
              {packageData.children?.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        Package {child.id}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {child.description || `${child.weight}kg package`}
                      </div>
                      {child.consolidatedAt && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Added {new Date(child.consolidatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveChild(child.id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove from consolidation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Child Package */}
        {!packageData.parentId && (
          <div className="space-y-4">
            {!showAddChild ? (
              <button
                onClick={() => setShowAddChild(true)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add package to consolidation</span>
              </button>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    Select package to consolidate
                  </h5>
                  <button
                    onClick={() => setShowAddChild(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a package...</option>
                    {availablePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.id} - {pkg.description || `${pkg.weight}kg package`}
                      </option>
                    ))}
                  </select>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAddChild(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddChild}
                      disabled={!selectedChildId}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Consolidate Package
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">Package Consolidation</div>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Incoming packages can be repackaged together for outbound shipment</li>
                <li>• Consolidated packages maintain relationship tracking</li>
                <li>• Parent packages show all contained items with add/remove dates</li>
                <li>• Child packages show their parent relationship clearly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
