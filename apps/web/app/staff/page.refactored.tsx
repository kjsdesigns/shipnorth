'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { usePackages, useLoads } from '@/hooks';
import ModernLayout from '@/components/ModernLayout';
import ModernStatsCard from '@/components/ModernStatsCard';
import PackageStatusCards from '@/components/packages/PackageStatusCards';
import PackageTable from '@/components/packages/PackageTable';
import LoadTable from '@/components/loads/LoadTable';
import DeliveryConfirmationModal from '@/components/DeliveryConfirmationModal';
import RouteOptimizer from '@/components/RouteOptimizer';
import { Modal, ConfirmationModal } from '@shipnorth/ui';
import { Package, Users, Truck, DollarSign } from 'lucide-react';

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Package management
  const {
    packages,
    selectedPackages,
    loading: packagesLoading,
    error: packagesError,
    handleBulkAssign,
    handleMarkDelivered,
    selectAllPackages,
    clearSelection,
    togglePackageSelection,
    updateFilter,
    setPage,
    setLimit,
    pagination: packagePagination,
  } = usePackages({
    initialPagination: { page: 1, limit: 50 },
  });

  // Load management
  const {
    loads,
    loading: loadsLoading,
    error: loadsError,
    createLoad,
    updateLoad,
    assignPackages,
  } = useLoads();

  // Modal states
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedPackageForDelivery, setSelectedPackageForDelivery] = useState<any>(null);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [selectedLoadForRoute, setSelectedLoadForRoute] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalCustomers: 0,
    activeLoads: 0,
    revenue: 0,
  });

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    // Calculate stats from loaded data
    setStats({
      totalPackages: packages.length,
      totalCustomers: 0, // Would need customer count
      activeLoads: loads.filter(load => load.status === 'in_transit').length,
      revenue: packages.reduce((sum, pkg) => sum + (pkg.price || 0), 0),
    });
  }, [packages, loads]);

  const handleStatusCardClick = (status: string) => {
    updateFilter('status', status);
    setActiveTab('packages');
  };

  const handleViewPackage = (pkg: any) => {
    // Open package details modal
    console.log('View package:', pkg.id);
  };

  const handleEditPackage = (pkg: any) => {
    // Open package edit modal
    console.log('Edit package:', pkg.id);
  };

  const handleMarkPackageDelivered = (pkg: any) => {
    setSelectedPackageForDelivery(pkg);
    setShowDeliveryModal(true);
  };

  const handleViewLoad = (load: any) => {
    // Open load details modal
    console.log('View load:', load.id);
  };

  const handleEditLoad = (load: any) => {
    // Open load edit modal
    console.log('Edit load:', load.id);
  };

  const handleViewRoute = (load: any) => {
    setSelectedLoadForRoute(load.id);
    setShowRouteOptimizer(true);
  };

  const handleDeliveryConfirm = async (deliveryData: any) => {
    if (!selectedPackageForDelivery) return;
    
    const success = await handleMarkDelivered(selectedPackageForDelivery.id, deliveryData);
    if (success) {
      setShowDeliveryModal(false);
      setSelectedPackageForDelivery(null);
    }
  };

  const handleBulkAssignSubmit = async (loadId: string) => {
    const success = await handleBulkAssign(loadId);
    if (success) {
      setShowBulkActions(false);
    }
  };

  if (!user) {
    return (
      <ModernLayout role="staff">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout role="staff">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage packages, customers, and shipments
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ModernStatsCard
          title="Total Packages"
          value={stats.totalPackages}
          icon={Package}
          change={12}
          changeLabel="from last month"
          color="blue"
        />
        <ModernStatsCard
          title="Active Customers"
          value={stats.totalCustomers}
          icon={Users}
          change={8}
          changeLabel="from last month"
          color="green"
        />
        <ModernStatsCard
          title="Active Loads"
          value={stats.activeLoads}
          icon={Truck}
          change={-5}
          changeLabel="from last week"
          color="orange"
        />
        <ModernStatsCard
          title="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          icon={DollarSign}
          change={18}
          changeLabel="from last month"
          color="purple"
        />
      </div>

      {/* Package Status Cards */}
      <PackageStatusCards
        stats={{ unassigned: 0, assigned: 0, in_transit: 0, delivered: 0, total: 0 }}
        onStatusClick={handleStatusCardClick}
        loading={packagesLoading}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'packages', 'customers', 'loads'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          {/* Bulk Actions Bar */}
          {selectedPackages.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 dark:text-blue-300">
                  {selectedPackages.length} packages selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowBulkActions(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Assign to Load
                  </button>
                </div>
              </div>
            </div>
          )}

          <PackageTable
            packages={packages}
            loading={packagesLoading}
            selectedPackages={selectedPackages}
            onSelectionChange={(ids) => ids.length === packages.length ? clearSelection() : selectAllPackages()}
            onViewPackage={handleViewPackage}
            onEditPackage={handleEditPackage}
            onMarkDelivered={handleMarkPackageDelivered}
            pagination={{
              ...packagePagination,
              onPageChange: setPage,
              onLimitChange: setLimit,
            }}
          />
        </div>
      )}

      {activeTab === 'loads' && (
        <LoadTable
          loads={loads}
          loading={loadsLoading}
          onViewLoad={handleViewLoad}
          onEditLoad={handleEditLoad}
          onViewRoute={handleViewRoute}
        />
      )}

      {/* Modals */}
      {showDeliveryModal && selectedPackageForDelivery && (
        <DeliveryConfirmationModal
          packageId={selectedPackageForDelivery.id}
          trackingNumber={selectedPackageForDelivery.trackingNumber}
          recipientName={selectedPackageForDelivery.shipTo?.name || 'Unknown'}
          onConfirm={handleDeliveryConfirm}
          onClose={() => {
            setShowDeliveryModal(false);
            setSelectedPackageForDelivery(null);
          }}
        />
      )}

      {showRouteOptimizer && selectedLoadForRoute && (
        <RouteOptimizer
          loadId={selectedLoadForRoute}
          onClose={() => {
            setShowRouteOptimizer(false);
            setSelectedLoadForRoute(null);
          }}
          onSave={() => {
            setShowRouteOptimizer(false);
            setSelectedLoadForRoute(null);
            // Refresh loads
          }}
        />
      )}

      {showBulkActions && (
        <Modal
          isOpen={showBulkActions}
          onClose={() => setShowBulkActions(false)}
          title="Assign Packages to Load"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Assign {selectedPackages.length} selected packages to a load:
            </p>
            
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option value="">Select a load...</option>
              {loads
                .filter(load => load.status === 'planned')
                .map(load => (
                  <option key={load.id} value={load.id}>
                    Load #{load.id.slice(-6)} - {load.deliveryCities?.length || 0} destinations
                  </option>
                ))}
            </select>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBulkActions(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAssignSubmit('selected-load-id')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Assign Packages
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ModernLayout>
  );
}