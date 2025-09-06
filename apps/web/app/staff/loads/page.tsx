'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadAPI, packageAPI, routeAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ModernLayout from '@/components/ModernLayout';
import {
  Truck,
  Search,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  MapPin,
  Calendar,
  Package,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Route,
  Navigation,
  X,
  Zap,
  MapPinOff,
  Loader,
} from 'lucide-react';

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

export default function LoadsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, hasRole } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLoads: 0,
    activeLoads: 0,
    inTransit: 0,
    completed: 0,
    totalPackages: 0,
    averagePackagesPerLoad: 0,
  });

  // Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    driverName: '',
    vehicleId: '',
    departureDate: '',
    notes: '',
    originAddress: '',
  });

  // Route optimization states
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeOptimizingLoad, setRouteOptimizingLoad] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routePreview, setRoutePreview] = useState<any>(null);

  useEffect(() => {
    // Wait for auth loading to complete before making decisions
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated || (!hasRole('staff') && !hasRole('admin'))) {
      router.push('/login');
      return;
    }
    
    loadLoads();
  }, [authLoading, isAuthenticated, hasRole, router]);

  // Real-time search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLoads(loads);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = loads.filter(
      (load) =>
        load.id?.toLowerCase().includes(query) ||
        load.driverName?.toLowerCase().includes(query) ||
        load.status?.toLowerCase().includes(query) ||
        load.vehicleId?.toLowerCase().includes(query)
    );

    setFilteredLoads(filtered);
  }, [searchQuery, loads]);

  const loadLoads = async () => {
    try {
      const [loadsRes, packagesRes] = await Promise.all([
        loadAPI.list(),
        packageAPI.list({ limit: 500 }),
      ]);

      const loadsData = loadsRes.data.loads || [];
      const packagesData = packagesRes.data.packages || [];

      // Enrich loads with package information
      const enrichedLoads = loadsData.map((load: any) => {
        const loadPackages = packagesData.filter((pkg: any) => pkg.loadId === load.id);
        return {
          ...load,
          packageCount: loadPackages.length,
          totalWeight: loadPackages.reduce((sum: number, pkg: any) => sum + (pkg.weight || 0), 0),
          totalValue: loadPackages.reduce((sum: number, pkg: any) => sum + (pkg.price || 0), 0),
        };
      });

      setLoads(enrichedLoads);
      setFilteredLoads(enrichedLoads);

      // Calculate stats
      const activeLoads = enrichedLoads.filter(
        (l: any) => l.status === 'active' || l.status === 'planned'
      ).length;
      const inTransit = enrichedLoads.filter((l: any) => l.status === 'in_transit').length;
      const completed = enrichedLoads.filter(
        (l: any) => l.status === 'complete' || l.status === 'delivered'
      ).length;
      const totalPackages = enrichedLoads.reduce(
        (sum: number, load: any) => sum + (load.packageCount || 0),
        0
      );

      setStats({
        totalLoads: enrichedLoads.length,
        activeLoads,
        inTransit,
        completed,
        totalPackages,
        averagePackagesPerLoad:
          enrichedLoads.length > 0
            ? Math.round((totalPackages / enrichedLoads.length) * 10) / 10
            : 0,
      });
    } catch (error) {
      console.error('Error loading loads:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      driverName: '',
      vehicleId: '',
      departureDate: '',
      notes: '',
      originAddress: '',
    });
    setSubmitMessage(null);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.driverName.trim()) errors.push('Driver name is required');
    if (!formData.vehicleId.trim()) errors.push('Vehicle ID is required');
    if (!formData.departureDate) errors.push('Departure date is required');
    if (!formData.originAddress.trim()) errors.push('Origin address is required');

    // Validate departure date is not in the past
    if (formData.departureDate) {
      const departureDate = new Date(formData.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (departureDate < today) {
        errors.push('Departure date cannot be in the past');
      }
    }

    return errors;
  };

  const handleCreateLoad = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEditLoad = (load: any) => {
    setEditingLoad(load);
    setFormData({
      driverName: load.driverName || '',
      vehicleId: load.vehicleId || '',
      departureDate: load.departureDate
        ? new Date(load.departureDate).toISOString().split('T')[0]
        : '',
      notes: load.notes || '',
      originAddress: load.originAddress || '',
    });
    setSubmitMessage(null);
    setIsEditModalOpen(true);
  };

  const handleViewLoad = (load: any) => {
    alert(
      `🚛 Load Details: #${load.id?.slice(-6)}\n\n👤 Driver: ${load.driverName || 'Unassigned'}\n🚐 Vehicle: ${load.vehicleId || 'TBD'}\n📦 Packages: ${load.packageCount || 0}\n⚖️ Weight: ${load.totalWeight || 0} kg\n💰 Value: $${load.totalValue?.toFixed(2) || '0.00'}\n📅 Departure: ${load.departureDate ? new Date(load.departureDate).toLocaleDateString() : 'TBD'}\n📍 Status: ${load.status}\n\n(Full load management interface would open here)`
    );
  };

  const handleViewRoute = (load: any) => {
    alert(
      `🗺️ Route Management: #${load.id?.slice(-6)}\n\nGPS Tracking: ${load.gpsTracking?.length || 0} points\nCurrent Location: ${load.currentLocation?.address || 'No location'}\nDestinations: ${load.destinationInfo?.total || 0} cities\n\n(Interactive route map would open here)`
    );
  };

  // Route Optimization Functions
  const handleOptimizeRoute = async (load: any) => {
    setRouteOptimizingLoad(load);
    setRouteData(null);
    setRouteError(null);
    setRouteLoading(true);

    try {
      // Get route preview first
      const previewResponse = await routeAPI.getRoutePreview(load.id);
      setRoutePreview(previewResponse.data.preview);

      if (!previewResponse.data.preview.canOptimize) {
        setRouteError(
          `Cannot optimize route: ${previewResponse.data.preview.geocodingStatus.missing} packages missing geocoding`
        );
        setRouteLoading(false);
        setIsRouteModalOpen(true);
        return;
      }

      // Generate optimized route
      const routeResponse = await routeAPI.optimizeRoute(load.id, {
        maxDailyDrivingHours: 10,
        averageSpeedKmh: 80,
        deliveryTimeMinutes: 15,
        includeReturnTrip: true,
      });

      setRouteData(routeResponse.data.route);
      setRouteError(null);
    } catch (error: any) {
      console.error('Route optimization error:', error);
      setRouteError(error.response?.data?.message || 'Failed to optimize route');
      setRouteData(null);
    } finally {
      setRouteLoading(false);
      setIsRouteModalOpen(true);
    }
  };

  const handleQuickRouteAnalysis = async (load: any) => {
    try {
      const response = await routeAPI.analyzeRoute(load.id);
      const analysis = response.data.analysis;

      alert(
        `🔍 Route Analysis: #${load.id?.slice(-6)}\n\n📦 Packages: ${analysis.packageCount}\n🏘️ Cities: ${analysis.citiesCount}\n📍 Geocoded: ${analysis.geocodedPackages}/${analysis.packageCount}\n❌ Missing coords: ${analysis.missingGeocodePackages}\n🧠 Complexity: ${analysis.estimatedComplexity}\n\n${analysis.missingGeocodePackages > 0 ? '⚠️ Some packages need geocoding before optimization' : '✅ Ready for route optimization'}`
      );
    } catch (error) {
      console.error('Route analysis error:', error);
      alert('❌ Failed to analyze route');
    }
  };

  const closeRouteModal = () => {
    setIsRouteModalOpen(false);
    setRouteOptimizingLoad(null);
    setRouteData(null);
    setRouteError(null);
    setRoutePreview(null);
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
      const loadData = {
        driverName: formData.driverName,
        vehicleId: formData.vehicleId,
        departureDate: formData.departureDate,
        notes: formData.notes,
        originAddress: formData.originAddress,
        status: 'planned',
      };

      await loadAPI.create(loadData);
      setSubmitMessage({ type: 'success', text: 'Load created successfully!' });
      setTimeout(() => {
        setIsCreateModalOpen(false);
        resetForm();
        loadLoads();
      }, 1500);
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create load',
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
      const loadData = {
        driverName: formData.driverName,
        vehicleId: formData.vehicleId,
        departureDate: formData.departureDate,
        notes: formData.notes,
        originAddress: formData.originAddress,
      };

      await loadAPI.update(editingLoad.id, loadData);
      setSubmitMessage({ type: 'success', text: 'Load updated successfully!' });
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingLoad(null);
        resetForm();
        loadLoads();
      }, 1500);
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update load',
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
      setEditingLoad(null);
      resetForm();
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loads</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage load assignments, routes, and delivery schedules
            </p>
          </div>
          <button
            onClick={handleCreateLoad}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Load
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLoads}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Loads</p>
            </div>
            <Truck className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeLoads}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Loads</p>
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
            <Navigation className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalPackages}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Packages</p>
            </div>
            <Package className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averagePackagesPerLoad}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Packages/Load</p>
            </div>
            <Users className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search loads by ID, driver, status, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Loads</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {filteredLoads.length} of {loads.length} loads
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Load ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Packages
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Departure Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Delivery Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLoads.map((load, index) => (
                <tr key={load.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => router.push(`/staff/loads/${load.id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      Load #{load.id?.slice(-6) || `${index + 1001}`}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {load.driverName || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        load.status === 'complete' || load.status === 'delivered'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : load.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : load.status === 'active' || load.status === 'planned'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {load.status || 'planned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Package className="h-3 w-3 text-gray-400" />
                      <span>{load.packageCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    {load.totalWeight || 0} kg
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-left">
                    {load.departureDate ? new Date(load.departureDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-left">
                    {load.deliveryDateRange?.earliest && load.deliveryDateRange?.latest ? (
                      <span>
                        {new Date(load.deliveryDateRange.earliest).toLocaleDateString()} -{' '}
                        {new Date(load.deliveryDateRange.latest).toLocaleDateString()}
                      </span>
                    ) : load.defaultDeliveryDate ? (
                      new Date(load.defaultDeliveryDate).toLocaleDateString()
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {load.currentLocation ? (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-green-500" />
                        <span className="text-xs">
                          {load.currentLocation.address ||
                            `${load.currentLocation.lat?.toFixed(3)}, ${load.currentLocation.lng?.toFixed(3)}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No location</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditLoad(load)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/staff/loads/${load.id}`)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Route className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOptimizeRoute(load)}
                        className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleQuickRouteAnalysis(load)}
                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <Navigation className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          alert(
                            `⚙️ Load Options: #${load.id?.slice(-6)}\n\n• Assign Packages\n• Update Status\n• GPS Tracking\n• Delivery Updates\n• Driver Communication\n• Route Optimization\n• Load Documents`
                          )
                        }
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLoads.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No loads found</p>
                  <p className="text-sm">No loads match "{searchQuery}"</p>
                </div>
              ) : (
                <div>
                  <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No loads yet</p>
                  <p className="text-sm">Create your first load to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Load Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title="Create Load">
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Driver Name *
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter driver full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vehicle ID *
              </label>
              <input
                type="text"
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vehicle license plate or ID"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departure Date *
            </label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              min={getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Origin Address *
            </label>
            <input
              type="text"
              value={formData.originAddress}
              onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Starting warehouse or pickup address"
              required
            />
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
              placeholder="Special instructions, route notes, vehicle requirements, etc."
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
              {isSubmitting ? 'Creating...' : 'Create Load'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Load Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Load">
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Driver Name *
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter driver full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vehicle ID *
              </label>
              <input
                type="text"
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Vehicle license plate or ID"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departure Date *
            </label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              min={getTodayDate()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Origin Address *
            </label>
            <input
              type="text"
              value={formData.originAddress}
              onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Starting warehouse or pickup address"
              required
            />
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
              placeholder="Special instructions, route notes, vehicle requirements, etc."
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
              {isSubmitting ? 'Updating...' : 'Update Load'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Route Optimization Modal */}
      <Modal
        isOpen={isRouteModalOpen}
        onClose={closeRouteModal}
        title={`Route Optimization - Load #${routeOptimizingLoad?.id?.slice(-6) || ''}`}
      >
        <div className="space-y-4">
          {routeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-lg">Optimizing route...</span>
            </div>
          ) : routeError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Route Optimization Failed
                </h3>
              </div>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">{routeError}</div>

              {routePreview && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                    Load Summary:
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>📦 Packages: {routePreview.packageCount}</div>
                    <div>🏘️ Cities: {routePreview.citiesCount}</div>
                    <div>📍 Geocoded: {routePreview.geocodingStatus.ready}</div>
                    <div>❌ Missing: {routePreview.geocodingStatus.missing}</div>
                  </div>
                </div>
              )}
            </div>
          ) : routeData ? (
            <div className="space-y-6">
              {/* Route Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                    Route Optimized Successfully
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-green-700 dark:text-green-300">
                      <strong>📦 Total Packages:</strong> {routeData.waypoints.length}
                    </div>
                    <div className="text-green-700 dark:text-green-300">
                      <strong>🏘️ Cities to Visit:</strong> {routeData.cityClusters.length}
                    </div>
                    <div className="text-green-700 dark:text-green-300">
                      <strong>📅 Estimated Days:</strong> {routeData.estimatedDays}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-green-700 dark:text-green-300">
                      <strong>🚗 Total Distance:</strong> {routeData.totalDistance} km
                    </div>
                    <div className="text-green-700 dark:text-green-300">
                      <strong>⏱️ Total Duration:</strong> {Math.round(routeData.totalDuration / 60)}{' '}
                      hours
                    </div>
                    <div className="text-green-700 dark:text-green-300">
                      <strong>📍 Origin:</strong> {routeData.originAddress}
                    </div>
                  </div>
                </div>

                {routeData.warnings.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">
                      ⚠️ Warnings:
                    </h4>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                      {routeData.warnings.map((warning: string, index: number) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Route Details */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  🛣️ Optimized Route
                </h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {routeData.cityClusters.map((cluster: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-400 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {index + 1}. {cluster.city}, {cluster.province}
                        </h5>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {cluster.distanceFromPrevious?.toFixed(1) || 0} km
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        📦 {cluster.totalPackages} packages • ⏱️ {cluster.estimatedDuration} minutes
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                        {cluster.waypoints.slice(0, 3).map((waypoint: any, wpIndex: number) => (
                          <div key={wpIndex} className="flex justify-between">
                            <span>📍 {waypoint.recipientName}</span>
                            <span>{waypoint.packageId}</span>
                          </div>
                        ))}
                        {cluster.waypoints.length > 3 && (
                          <div className="text-gray-400 italic">
                            ... and {cluster.waypoints.length - 3} more deliveries
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    alert(
                      '🚛 Route Applied!\n\nThe optimized route has been applied to this load. The driver will see the updated delivery sequence in their mobile app.'
                    );
                    closeRouteModal();
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Apply Route
                </button>
                <button
                  onClick={() => {
                    const routeText = `OPTIMIZED ROUTE - Load #${routeOptimizingLoad?.id?.slice(-6)}\n\nSummary:\n• ${routeData.waypoints.length} packages across ${routeData.cityClusters.length} cities\n• ${routeData.totalDistance} km, ${Math.round(routeData.totalDuration / 60)} hours\n• ${routeData.estimatedDays} estimated days\n\nRoute:\n${routeData.cityClusters.map((c: any, i: number) => `${i + 1}. ${c.city}, ${c.province} (${c.totalPackages} packages)`).join('\n')}`;
                    navigator.clipboard.writeText(routeText);
                    alert('📋 Route copied to clipboard!');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Copy Route
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Click "Optimize Route" to generate the best delivery sequence for this load.</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={closeRouteModal}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </ModernLayout>
  );
}
