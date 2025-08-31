'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, packageAPI, customerAPI, loadAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import ChipSelector, { ChipOption } from '@/components/ChipSelector';
import {
  Package,
  Search,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  MoreVertical,
  Truck,
  DollarSign,
  Clock,
  AlertCircle,
  User,
  MapPin,
  X,
  Calculator,
  MapPinOff,
  Square,
  CheckSquare,
  Minus,
  Wind,
} from 'lucide-react';
import RateLookupDialog from '@/components/RateLookupDialog';

// Modal interfaces
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">​</span>
        <div
          className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PackagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loads, setLoads] = useState<any[]>([]);
  const [customerOptions, setCustomerOptions] = useState<ChipOption[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [geocodingData, setGeocodingData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPackages, setFilteredPackages] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPackages: 0,
    unassigned: 0,
    inTransit: 0,
    delivered: 0,
    totalRevenue: 0,
  });

  // Bulk selection state
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [isSelectAllMode, setIsSelectAllMode] = useState<'none' | 'filtered' | 'all'>('none');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [rateLookupPackage, setRateLookupPackage] = useState<any>(null);
  const [isRateLookupOpen, setIsRateLookupOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    recipientName: '',
    recipientAddress: {
      name: '',
      address1: '',
      address2: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Canada',
    },
    weight: '',
    length: '',
    width: '',
    height: '',
    notes: '',
  });

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  // Real-time search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPackages(packages);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = packages.filter(
      (pkg) =>
        pkg.trackingNumber?.toLowerCase().includes(query) ||
        pkg.shipTo?.name?.toLowerCase().includes(query) ||
        pkg.shipmentStatus?.toLowerCase().includes(query) ||
        pkg.carrier?.toLowerCase().includes(query)
    );

    setFilteredPackages(filtered);
  }, [searchQuery, packages]);

  // Clear selection when filtered packages change
  useEffect(() => {
    setSelectedPackages(new Set());
    setIsSelectAllMode('none');
    setShowBulkActions(false);
  }, [filteredPackages]);

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedPackages.size > 0);
  }, [selectedPackages]);

  const loadData = async () => {
    try {
      const [packagesRes, customersRes, loadsRes] = await Promise.all([
        packageAPI.list({ limit: 100 }),
        customerAPI.list(),
        loadAPI.list(),
      ]);

      const packagesData = packagesRes.data.packages || [];
      const customersData = customersRes.data.customers || [];
      const loadsData = loadsRes.data.loads || [];

      setPackages(packagesData);
      setCustomers(customersData);
      setLoads(loadsData);

      // Convert customers to ChipSelector options
      const options = customersData.map((customer: any) => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`,
        subtitle: customer.email,
      }));
      setCustomerOptions(options);
      setFilteredPackages(packagesData);

      // Calculate stats
      const unassigned = packagesData.filter((p: any) => !p.loadId).length;
      const inTransit = packagesData.filter((p: any) => p.shipmentStatus === 'in_transit').length;
      const delivered = packagesData.filter((p: any) => p.shipmentStatus === 'delivered').length;
      const revenue = packagesData.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

      setStats({
        totalPackages: packagesData.length,
        unassigned,
        inTransit,
        delivered,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';
  };

  const getLoadInfo = (loadId: string) => {
    const load = loads.find((l) => l.id === loadId);
    return load
      ? {
          driver: load.driverName,
          vehicle: load.vehicleId,
          id: load.id.slice(-6),
          departureDate: load.departureDate,
          estimatedDelivery: load.departureDate
            ? new Date(
                new Date(load.departureDate).getTime() + 2 * 24 * 60 * 60 * 1000
              ).toLocaleDateString()
            : null,
        }
      : null;
  };

  const getGeocodingStatus = (pkg: any) => {
    // Mock geocoding status for demo - in real app, this would come from the Address model
    const addressKey = `${pkg.shipTo?.address1}-${pkg.shipTo?.city}-${pkg.shipTo?.province}`;

    // Mock some packages as having geocoding issues
    const hasIssues =
      pkg.shipTo?.city?.toLowerCase().includes('remote') ||
      pkg.shipTo?.address1?.toLowerCase().includes('po box') ||
      !pkg.shipTo?.postalCode;

    return hasIssues ? 'failed' : 'success';
  };

  const renderGeocodingIndicator = (pkg: any) => {
    const status = getGeocodingStatus(pkg);

    if (status === 'failed') {
      return <MapPinOff className="h-3 w-3 text-orange-500" />;
    }

    return <MapPin className="h-3 w-3 text-green-500" />;
  };

  const handleCustomerSearch = async (query: string) => {
    if (!query.trim()) {
      const options = customers.map((customer) => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`,
        subtitle: customer.email,
      }));
      setCustomerOptions(options);
      return;
    }

    setCustomerSearchLoading(true);
    try {
      const response = await customerAPI.search(query);
      const searchResults = response.data.customers || [];
      const options = searchResults.map((customer: any) => ({
        value: customer.id,
        label: `${customer.firstName} ${customer.lastName}`,
        subtitle: customer.email,
      }));
      setCustomerOptions(options);
    } catch (error) {
      console.error('Customer search failed:', error);
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const countryOptions: ChipOption[] = [
    { value: 'Canada', label: 'Canada' },
    { value: 'United States', label: 'United States' },
  ];

  const resetForm = () => {
    setFormData({
      customerId: '',
      recipientName: '',
      recipientAddress: {
        name: '',
        address1: '',
        address2: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'Canada',
      },
      weight: '',
      length: '',
      width: '',
      height: '',
      notes: '',
    });
    setSubmitMessage(null);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.customerId) errors.push('Customer is required');
    if (!formData.recipientName.trim()) errors.push('Recipient name is required');
    if (!formData.recipientAddress.address1.trim()) errors.push('Recipient address is required');
    if (!formData.recipientAddress.city.trim()) errors.push('Recipient city is required');
    if (!formData.recipientAddress.province.trim()) errors.push('Recipient province is required');
    if (!formData.recipientAddress.postalCode.trim())
      errors.push('Recipient postal code is required');
    if (!formData.weight || isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
      errors.push('Valid weight is required');
    }
    if (!formData.length || isNaN(Number(formData.length)) || Number(formData.length) <= 0) {
      errors.push('Valid length is required');
    }
    if (!formData.width || isNaN(Number(formData.width)) || Number(formData.width) <= 0) {
      errors.push('Valid width is required');
    }
    if (!formData.height || isNaN(Number(formData.height)) || Number(formData.height) <= 0) {
      errors.push('Valid height is required');
    }

    return errors;
  };

  const handleAddPackage = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setFormData({
      customerId: pkg.customerId || '',
      recipientName: pkg.shipTo?.name || '',
      recipientAddress: {
        name: pkg.shipTo?.name || '',
        address1: pkg.shipTo?.address1 || '',
        address2: pkg.shipTo?.address2 || '',
        city: pkg.shipTo?.city || '',
        province: pkg.shipTo?.province || '',
        postalCode: pkg.shipTo?.postalCode || '',
        country: pkg.shipTo?.country || 'Canada',
      },
      weight: pkg.weight?.toString() || '',
      length: pkg.dimensions?.length?.toString() || '',
      width: pkg.dimensions?.width?.toString() || '',
      height: pkg.dimensions?.height?.toString() || '',
      notes: pkg.notes || '',
    });
    setSubmitMessage(null);
    setIsEditModalOpen(true);
  };

  const handleViewCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      alert(
        `👤 Customer: ${customer.firstName} ${customer.lastName}\n\n📧 ${customer.email}\n📞 ${customer.phone || 'N/A'}\n🏠 ${customer.addressLine1}, ${customer.city}, ${customer.province}\n\n(Click to view full customer profile)`
      );
    }
  };

  const handleRateLookup = (pkg: any) => {
    if (!pkg.shipTo || !pkg.weight || !pkg.dimensions) {
      alert(
        '❌ Package missing required data for rate lookup\n\nRequired:\n• Shipping address\n• Weight\n• Dimensions'
      );
      return;
    }

    setRateLookupPackage(pkg);
    setIsRateLookupOpen(true);
  };

  const handleRateSaved = (selectedRate: any) => {
    console.log('✅ Rate saved for package:', rateLookupPackage?.id, selectedRate);

    // Refresh package data to show updated rates
    loadData();

    // Show success message
    alert(
      `✅ Shipping rate saved!\n\n${selectedRate.carrier} ${selectedRate.service}\n$${selectedRate.rate.toFixed(2)} ${selectedRate.currency}`
    );
  };

  // Bulk selection handlers
  const handleSelectPackage = (packageId: string, checked: boolean) => {
    const newSelected = new Set(selectedPackages);
    if (checked) {
      newSelected.add(packageId);
    } else {
      newSelected.delete(packageId);
    }
    setSelectedPackages(newSelected);
    
    // Update select all mode based on current selection
    if (newSelected.size === 0) {
      setIsSelectAllMode('none');
    } else if (newSelected.size === filteredPackages.length) {
      setIsSelectAllMode('filtered');
    } else {
      setIsSelectAllMode('none');
    }
  };

  const handleSelectAll = () => {
    if (isSelectAllMode === 'none') {
      // Select all filtered packages
      const filteredIds = new Set(filteredPackages.map(pkg => pkg.id));
      setSelectedPackages(filteredIds);
      setIsSelectAllMode('filtered');
    } else if (isSelectAllMode === 'filtered') {
      // Select all packages (including those not currently filtered)
      const allIds = new Set(packages.map(pkg => pkg.id));
      setSelectedPackages(allIds);
      setIsSelectAllMode('all');
    } else {
      // Clear all selections
      setSelectedPackages(new Set());
      setIsSelectAllMode('none');
    }
  };

  const clearSelection = () => {
    setSelectedPackages(new Set());
    setIsSelectAllMode('none');
  };

  // Bulk action handlers
  const handleBulkAssignToLoad = async () => {
    if (selectedPackages.size === 0) return;
    
    // Show load selection dialog
    const selectedLoad = prompt(`Assign ${selectedPackages.size} package(s) to load:\n\nAvailable loads:\n${loads.map(l => `• ${l.id.slice(-6)} - ${l.driverName} (${l.status})`).join('\n')}\n\nEnter load ID (last 6 digits):`);
    
    if (selectedLoad) {
      const fullLoadId = loads.find(l => l.id.endsWith(selectedLoad))?.id;
      if (fullLoadId) {
        try {
          // In real implementation, this would call the API
          console.log('Assigning packages to load:', Array.from(selectedPackages), fullLoadId);
          alert(`✅ Assigned ${selectedPackages.size} packages to load ${selectedLoad}`);
          clearSelection();
          loadData(); // Refresh data
        } catch (error) {
          alert('❌ Failed to assign packages to load');
        }
      } else {
        alert('❌ Load not found');
      }
    }
  };

  const handleBulkRemoveFromLoad = async () => {
    if (selectedPackages.size === 0) return;
    
    const selectedPackagesList = Array.from(selectedPackages)
      .map(id => packages.find(p => p.id === id))
      .filter(pkg => pkg?.loadId);
    
    if (selectedPackagesList.length === 0) {
      alert('❌ No selected packages are currently assigned to loads');
      return;
    }
    
    if (confirm(`Remove ${selectedPackagesList.length} package(s) from their loads?`)) {
      try {
        // In real implementation, this would call the API
        console.log('Removing packages from loads:', selectedPackagesList.map(p => p.id));
        alert(`✅ Removed ${selectedPackagesList.length} packages from loads`);
        clearSelection();
        loadData(); // Refresh data
      } catch (error) {
        alert('❌ Failed to remove packages from loads');
      }
    }
  };

  const handleBulkMarkDelivered = async () => {
    if (selectedPackages.size === 0) return;
    
    if (confirm(`Mark ${selectedPackages.size} package(s) as delivered? This action cannot be undone.`)) {
      try {
        // In real implementation, this would call the API for each package
        console.log('Marking packages as delivered:', Array.from(selectedPackages));
        alert(`✅ Marked ${selectedPackages.size} packages as delivered! 💨`);
        clearSelection();
        loadData(); // Refresh data
      } catch (error) {
        alert('❌ Failed to mark packages as delivered');
      }
    }
  };

  const getSelectedPackageCount = () => {
    if (isSelectAllMode === 'all') {
      return packages.length;
    } else if (isSelectAllMode === 'filtered') {
      return filteredPackages.length;
    } else {
      return selectedPackages.size;
    }
  };

  const getSelectedPackagesText = () => {
    const count = getSelectedPackageCount();
    if (isSelectAllMode === 'all') {
      return `All ${count} packages selected`;
    } else if (isSelectAllMode === 'filtered') {
      return `All ${count} filtered packages selected`;
    } else {
      return `${count} package${count !== 1 ? 's' : ''} selected`;
    }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();

    if (errors.length > 0) {
      setSubmitMessage({ type: 'error', text: errors.join(', ') });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const packageData = {
        customerId: formData.customerId,
        shipTo: {
          name: formData.recipientName,
          address1: formData.recipientAddress.address1,
          address2: formData.recipientAddress.address2,
          city: formData.recipientAddress.city,
          province: formData.recipientAddress.province,
          postalCode: formData.recipientAddress.postalCode,
          country: formData.recipientAddress.country,
        },
        weight: parseFloat(formData.weight),
        dimensions: {
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
        },
        notes: formData.notes,
      };

      await packageAPI.create(packageData);
      setSubmitMessage({ type: 'success', text: 'Package created successfully!' });
      setTimeout(() => {
        setIsCreateModalOpen(false);
        resetForm();
        loadData();
      }, 1500);
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create package',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();

    if (errors.length > 0) {
      setSubmitMessage({ type: 'error', text: errors.join(', ') });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const packageData = {
        customerId: formData.customerId,
        shipTo: {
          name: formData.recipientName,
          address1: formData.recipientAddress.address1,
          address2: formData.recipientAddress.address2,
          city: formData.recipientAddress.city,
          province: formData.recipientAddress.province,
          postalCode: formData.recipientAddress.postalCode,
          country: formData.recipientAddress.country,
        },
        weight: parseFloat(formData.weight),
        dimensions: {
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
        },
        notes: formData.notes,
      };

      await packageAPI.update(editingPackage.id, packageData);
      setSubmitMessage({ type: 'success', text: 'Package updated successfully!' });
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingPackage(null);
        resetForm();
        loadData();
      }, 1500);
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update package',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCreateModal = () => {
    if (!isSubmitting) {
      setIsCreateModalOpen(false);
      resetForm();
    }
  };

  const handleCloseEditModal = () => {
    if (!isSubmitting) {
      setIsEditModalOpen(false);
      setEditingPackage(null);
      resetForm();
    }
  };

  if (loading) {
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
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Packages</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage package shipments, tracking, and delivery status
            </p>
          </div>
          <button
            onClick={handleAddPackage}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalPackages}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Packages</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unassigned}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unassigned</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inTransit}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
            </div>
            <Truck className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages by tracking number, recipient, status, or carrier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Packages</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {filteredPackages.length} of {packages.length} packages
                {showBulkActions && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                    • {getSelectedPackagesText()}
                  </span>
                )}
              </p>
            </div>
            {showBulkActions && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearSelection}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {getSelectedPackagesText()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkAssignToLoad}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Assign to Load
                  </button>
                  <button
                    onClick={handleBulkRemoveFromLoad}
                    className="inline-flex items-center px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Remove from Load
                  </button>
                  <button
                    onClick={handleBulkMarkDelivered}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Wind className="h-4 w-4 mr-1" />
                    Mark Delivered
                  </button>
                  <button
                    onClick={clearSelection}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center w-4 h-4 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {isSelectAllMode === 'none' ? (
                        <Square className="h-3 w-3 text-gray-400" />
                      ) : isSelectAllMode === 'filtered' ? (
                        <CheckSquare className="h-3 w-3 text-blue-600" />
                      ) : (
                        <CheckSquare className="h-3 w-3 text-purple-600" />
                      )}
                    </button>
                    {isSelectAllMode === 'filtered' && filteredPackages.length < packages.length && (
                      <button
                        onClick={handleSelectAll}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Select all {packages.length}
                      </button>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tracking #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Delivery Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Load
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Est. Delivery
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quoted Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPackages.map((pkg, index) => {
                const isSelected = selectedPackages.has(pkg.id) || isSelectAllMode === 'all' || (isSelectAllMode === 'filtered' && filteredPackages.some(p => p.id === pkg.id));
                return (
                <tr key={pkg.id || index} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="px-6 py-4 text-sm">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectPackage(pkg.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => handleEditPackage(pkg)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      {pkg.trackingNumber || `PKG-${index + 1001}`}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {pkg.shipTo?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleViewCustomer(pkg.customerId)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      {getCustomerName(pkg.customerId)}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-1">{renderGeocodingIndicator(pkg)}</div>
                      <div>
                        <div>{pkg.shipTo?.address1}</div>
                        <div className="text-xs">
                          {pkg.shipTo?.city}, {pkg.shipTo?.province}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pkg.shipmentStatus === 'delivered'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : pkg.shipmentStatus === 'in_transit'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {pkg.shipmentStatus || 'ready'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {pkg.loadId ? (
                      <div className="flex items-center space-x-1">
                        <Truck className="h-3 w-3 text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          Load #{getLoadInfo(pkg.loadId)?.id}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({getLoadInfo(pkg.loadId)?.driver})
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-left">
                    {pkg.loadId && getLoadInfo(pkg.loadId)?.estimatedDelivery ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        {getLoadInfo(pkg.loadId)?.estimatedDelivery}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    {pkg.weight || '0'} kg
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    {pkg.quotedCarrier && pkg.quotedRate ? (
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            pkg.quotedCarrier === 'CanadaPost'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : pkg.quotedService?.toLowerCase().includes('express') ||
                                  pkg.quotedService?.toLowerCase().includes('priority')
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {pkg.quotedCarrier === 'CanadaPost'
                            ? 'CP'
                            : pkg.quotedCarrier === 'UPS'
                              ? 'UPS'
                              : pkg.quotedCarrier === 'FedEx'
                                ? 'FDX'
                                : pkg.quotedCarrier?.substring(0, 3).toUpperCase() || '???'}
                          {pkg.quotedService?.toLowerCase().includes('express') ||
                          pkg.quotedService?.toLowerCase().includes('priority')
                            ? '+'
                            : ''}
                        </span>
                        <span className="font-medium">${pkg.quotedRate.toFixed(2)}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRateLookup(pkg)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Get Quote
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    ${pkg.price || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRateLookup(pkg)}
                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <Calculator className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Mark package ${pkg.trackingNumber} as delivered?`)) {
                            alert('✅ Package marked as delivered!');
                          }
                        }}
                        className="text-green-400 hover:text-green-600 dark:hover:text-green-300"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          alert(
                            `⚙️ Package Options: ${pkg.trackingNumber}\n\n• Assign to Load\n• Generate Label\n• View Tracking History\n• Update Status\n• Archive Package`
                          )
                        }
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Package Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title="Create Package">
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer *
            </label>
            <ChipSelector
              value={formData.customerId}
              onChange={(value) => setFormData({ ...formData, customerId: value })}
              options={customerOptions}
              placeholder="Search for a customer..."
              searchable
              onSearch={handleCustomerSearch}
              loading={customerSearchLoading}
              required
              name="customerId"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recipient Address
            </h4>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={formData.recipientAddress.address1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, address1: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.recipientAddress.address2}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, address2: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientAddress: { ...formData.recipientAddress, city: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Province *
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress.province}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientAddress: { ...formData.recipientAddress, province: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientAddress: {
                        ...formData.recipientAddress,
                        postalCode: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Country *
              </label>
              <ChipSelector
                value={formData.recipientAddress.country}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, country: value },
                  })
                }
                options={countryOptions}
                placeholder="Select country..."
                searchable={false}
                required
                name="country"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Length (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Width (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Height (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Special handling instructions, contents description, etc."
            />
          </div>

          {submitMessage && (
            <div
              className={`flex items-center space-x-2 p-3 rounded-md ${
                submitMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {submitMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{submitMessage.text}</span>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseCreateModal}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Package'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Package Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Package">
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer *
            </label>
            <ChipSelector
              value={formData.customerId}
              onChange={(value) => setFormData({ ...formData, customerId: value })}
              options={customerOptions}
              placeholder="Search for a customer..."
              searchable
              onSearch={handleCustomerSearch}
              loading={customerSearchLoading}
              required
              name="customerId"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recipient Address
            </h4>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={formData.recipientAddress.address1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, address1: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.recipientAddress.address2}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, address2: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientAddress: { ...formData.recipientAddress, city: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Province *
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress.province}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientAddress: { ...formData.recipientAddress, province: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientAddress: {
                        ...formData.recipientAddress,
                        postalCode: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Country *
              </label>
              <ChipSelector
                value={formData.recipientAddress.country}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, country: value },
                  })
                }
                options={countryOptions}
                placeholder="Select country..."
                searchable={false}
                required
                name="country"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Length (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Width (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Height (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Special handling instructions, contents description, etc."
            />
          </div>

          {submitMessage && (
            <div
              className={`flex items-center space-x-2 p-3 rounded-md ${
                submitMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {submitMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{submitMessage.text}</span>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseEditModal}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Package'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rate Lookup Dialog */}
      {rateLookupPackage && (
        <RateLookupDialog
          isOpen={isRateLookupOpen}
          onClose={() => {
            setIsRateLookupOpen(false);
            setRateLookupPackage(null);
          }}
          packageId={rateLookupPackage.id}
          packageData={{
            weight: rateLookupPackage.weight,
            dimensions: rateLookupPackage.dimensions,
            shipTo: rateLookupPackage.shipTo,
          }}
          onRateSaved={handleRateSaved}
        />
      )}
    </ModernLayout>
  );
}
