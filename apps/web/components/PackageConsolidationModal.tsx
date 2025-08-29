'use client';

import { useState, useEffect } from 'react';
import { Package, Search, X, Link as LinkIcon, Info } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { packageAPI } from '@/lib/api';

interface PackageConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePackageId: string;
  sourcePackageName: string;
  onConsolidated?: () => void;
}

interface AvailablePackage {
  id: string;
  description?: string;
  weight: number;
  customerId: string;
  shipmentStatus: string;
  receivedDate: string;
}

export default function PackageConsolidationModal({
  isOpen,
  onClose,
  sourcePackageId,
  sourcePackageName,
  onConsolidated,
}: PackageConsolidationModalProps) {
  const [availablePackages, setAvailablePackages] = useState<AvailablePackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<AvailablePackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [consolidating, setConsolidating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailablePackages();
    }
  }, [isOpen, sourcePackageId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = availablePackages.filter(
        (pkg) =>
          pkg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPackages(filtered);
    } else {
      setFilteredPackages(availablePackages);
    }
  }, [availablePackages, searchQuery]);

  const loadAvailablePackages = async () => {
    try {
      setLoading(true);
      const response = await packageAPI.list({ limit: 200 });
      const allPackages = response.data.packages || [];

      // Filter packages that can be consolidated:
      // - Not the source package itself
      // - Not already consolidated (no parent)
      // - Not already a parent package (no children)
      // - Same customer or ready for cross-customer consolidation
      const available = allPackages.filter(
        (pkg: any) =>
          pkg.id !== sourcePackageId &&
          !pkg.parentId &&
          !pkg.childIds?.length &&
          pkg.shipmentStatus !== 'delivered'
      );

      setAvailablePackages(available);
      setFilteredPackages(available);
    } catch (error) {
      console.error('Error loading available packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidate = async () => {
    if (!selectedPackageId) return;

    try {
      setConsolidating(true);
      await packageAPI.consolidate(selectedPackageId, sourcePackageId);

      onConsolidated?.();
      onClose();
      setSelectedPackageId('');
      setSearchQuery('');
    } catch (error) {
      console.error('Error consolidating packages:', error);
    } finally {
      setConsolidating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Package Consolidation">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-900 dark:text-blue-100">
                Add packages to: {sourcePackageName}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Selected packages will become child packages of {sourcePackageId}
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages by ID or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Available Packages */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-gray-500 mt-2">Loading available packages...</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredPackages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? 'No packages match your search'
                  : 'No packages available for consolidation'}
              </div>
            ) : (
              filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPackageId === pkg.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Package {pkg.id}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {pkg.description || `${pkg.weight}kg package`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Received {formatDate(pkg.receivedDate)} • Status: {pkg.shipmentStatus}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {pkg.weight}kg
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          pkg.shipmentStatus === 'ready'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}
                      >
                        {pkg.shipmentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>Select a package to add to consolidation</span>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConsolidate}
              disabled={!selectedPackageId || consolidating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {consolidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Consolidating...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Consolidate Package
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
