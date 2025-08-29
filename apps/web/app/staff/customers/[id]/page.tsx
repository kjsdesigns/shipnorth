'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  Link as LinkIcon,
  Users,
} from 'lucide-react';
import ModernLayout from '@/components/ModernLayout';
import { authAPI, customerAPI, packageAPI } from '@/lib/api';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  shipId: string;
  status: string;
  lastLoginAt?: string;
  createdAt?: string;
}

interface Package {
  id: string;
  customerId: string;
  parentId?: string;
  childIds?: string[];
  description?: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  shipmentStatus: string;
  labelStatus: string;
  trackingNumber?: string;
  statusChangedAt?: string;
  receivedDate: string;
  deliveryDate?: string;
  consolidatedAt?: string;
}

const STATUS_COLORS = {
  received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  ready_to_ship: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  shipped: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  resolved: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('receivedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || !['staff', 'admin'].includes(currentUser.role)) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadCustomerData();
  }, [router, customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, packagesRes] = await Promise.all([
        customerAPI.get(customerId),
        customerAPI.getPackages(customerId),
      ]);

      setCustomer(customerRes.data);

      // Add mock data for enhanced fields until API is updated
      const packagesWithEnhancements = (packagesRes.data || []).map((pkg: any) => ({
        ...pkg,
        description: pkg.description || `${pkg.carrier || 'Package'} - ${pkg.weight}kg`,
        statusChangedAt: pkg.statusChangedAt || pkg.receivedDate,
        consolidatedAt: pkg.consolidatedAt || null,
      }));

      setPackages(packagesWithEnhancements);
    } catch (error: any) {
      console.error('Failed to load customer data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search packages
  useEffect(() => {
    let filtered = [...packages];

    // Apply tab filter
    if (activeTab === 'received') {
      filtered = filtered.filter((pkg) => pkg.shipmentStatus === 'ready' && !pkg.trackingNumber);
    } else if (activeTab === 'ready_to_ship') {
      filtered = filtered.filter(
        (pkg) => pkg.labelStatus === 'quoted' || pkg.labelStatus === 'purchased'
      );
    } else if (activeTab === 'shipped') {
      filtered = filtered.filter((pkg) => pkg.shipmentStatus === 'in_transit');
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter((pkg) => pkg.shipmentStatus === 'delivered');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.id.toLowerCase().includes(query) ||
          (pkg.description && pkg.description.toLowerCase().includes(query)) ||
          (pkg.trackingNumber && pkg.trackingNumber.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Package] as any;
      const bValue = b[sortBy as keyof Package] as any;

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPackages(filtered);
  }, [packages, activeTab, searchQuery, sortBy, sortDirection]);

  const getStatusDisplay = (
    pkg: Package
  ): 'delivered' | 'shipped' | 'ready_to_ship' | 'received' | 'resolved' => {
    if (pkg.shipmentStatus === 'delivered') return 'resolved';
    if (pkg.shipmentStatus === 'in_transit') return 'shipped';
    if (pkg.labelStatus === 'purchased') return 'ready_to_ship';
    return 'received';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatSize = (pkg: Package) => {
    return `${pkg.length}x${pkg.width}x${pkg.height} cm`;
  };

  if (loading) {
    return (
      <ModernLayout role={user?.role || 'staff'}>
        <div className="animate-pulse p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </ModernLayout>
    );
  }

  if (error || !customer) {
    return (
      <ModernLayout role={user?.role || 'staff'}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error || 'Customer not found'}</div>
          <Link href="/staff/customers" className="text-blue-600 hover:text-blue-500">
            Back to Customers
          </Link>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout role={user.role}>
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/staff/customers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span>Users</span>
              <span>&gt;</span>
              <span>
                {customer.firstName} {customer.lastName} (
                {customer.shipId || customer.id.slice(0, 8).toUpperCase()})
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Parcels for {customer.firstName} {customer.lastName}
            </h1>
          </div>
        </div>

        {/* Customer Info Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button className="flex items-center px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent">
              <Eye className="w-4 h-4 mr-2" />
              View User
            </button>
            <button className="flex items-center px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent">
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </button>
            <button className="flex items-center px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent">
              <MapPin className="w-4 h-4 mr-2" />
              Edit User Address
            </button>
            <button className="flex items-center px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400">
              <Package className="w-4 h-4 mr-2" />
              Parcels
            </button>
          </div>

          {/* Customer Quick Info */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{customer.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{customer.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {customer.shipId || customer.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {customer.addressLine1}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {customer.city}, {customer.province}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">{customer.postalCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Last login at</div>
                  <div className="text-gray-900 dark:text-white">
                    {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Package Tabs and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          {/* Tab Headers */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex space-x-6">
              {[
                { id: 'all', label: 'All', count: packages.length },
                {
                  id: 'received',
                  label: 'Received',
                  count: packages.filter((p) => getStatusDisplay(p) === 'received').length,
                },
                {
                  id: 'ready_to_ship',
                  label: 'Ready to ship',
                  count: packages.filter((p) => getStatusDisplay(p) === 'ready_to_ship').length,
                },
                {
                  id: 'shipped',
                  label: 'Shipped',
                  count: packages.filter((p) => getStatusDisplay(p) === 'shipped').length,
                },
                {
                  id: 'resolved',
                  label: 'Resolved',
                  count: packages.filter((p) => getStatusDisplay(p) === 'resolved').length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label} {tab.count > 0 && <span className="ml-2 text-xs">({tab.count})</span>}
                </button>
              ))}
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New parcel
            </button>
          </div>

          {/* Filters and Search */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Active filters
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                  Hide Consolidated
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="receivedDate">Status</option>
                    <option value="id">ID</option>
                    <option value="weight">Weight</option>
                    <option value="statusChangedAt">Status Changed</option>
                  </select>
                  <select
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                    className="text-sm border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-64"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Package Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedPackages.length === filteredPackages.length &&
                        filteredPackages.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPackages(filteredPackages.map((p) => p.id));
                        } else {
                          setSelectedPackages([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Id
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Parent id
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status changed at
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tracking number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="w-12 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        {searchQuery
                          ? 'No packages match your search'
                          : `No packages in ${activeTab} status`}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        pkg.parentId ? 'bg-gray-25 dark:bg-gray-800/25' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPackages.includes(pkg.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPackages([...selectedPackages, pkg.id]);
                            } else {
                              setSelectedPackages(selectedPackages.filter((id) => id !== pkg.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                        {pkg.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {pkg.parentId ? (
                          <Link
                            href={`/staff/packages/${pkg.parentId}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            {pkg.parentId}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {formatSize(pkg)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {pkg.weight.toFixed(1)} lb
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[getStatusDisplay(pkg) as keyof typeof STATUS_COLORS]
                          }`}
                        >
                          {getStatusDisplay(pkg) === 'ready_to_ship'
                            ? 'Ready to ship'
                            : getStatusDisplay(pkg).charAt(0).toUpperCase() +
                              getStatusDisplay(pkg).slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(pkg.statusChangedAt || pkg.receivedDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {pkg.trackingNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {pkg.description || '-'}
                        {pkg.childIds && pkg.childIds.length > 0 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Contains {pkg.childIds.length} package(s)
                          </div>
                        )}
                        {pkg.consolidatedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Consolidated {formatDate(pkg.consolidatedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
