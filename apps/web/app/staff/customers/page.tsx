'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, customerAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import ChipSelector, { ChipOption } from '@/components/ChipSelector';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  Activity,
  X,
  AlertCircle,
  CheckCircle,
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

export default function CustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newThisMonth: 0,
    totalRevenue: 0,
  });

  // Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada',
  });

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadCustomers();
  }, [router]);

  // Real-time search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(
      (customer) =>
        customer.firstName?.toLowerCase().includes(query) ||
        customer.lastName?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(query)
    );

    setFilteredCustomers(filtered);
    console.log(`🔍 Search "${searchQuery}" found ${filtered.length} customers`);
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.list();
      const customersData = response.data.customers || [];

      setCustomers(customersData);
      setFilteredCustomers(customersData);

      // Calculate stats
      const activeCustomers = customersData.filter((c: any) => c.status === 'active').length;
      setStats({
        totalCustomers: customersData.length,
        activeCustomers: activeCustomers,
        newThisMonth: Math.floor(customersData.length * 0.3), // Mock calculation
        totalRevenue: 1284.5, // Mock from API
      });
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Canada',
    });
    setSubmitMessage(null);
  };

  const countryOptions: ChipOption[] = [
    { value: 'Canada', label: 'Canada' },
    { value: 'United States', label: 'United States' },
  ];

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.firstName.trim()) errors.push('First name is required');
    if (!formData.lastName.trim()) errors.push('Last name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.addressLine1.trim()) errors.push('Address is required');
    if (!formData.city.trim()) errors.push('City is required');
    if (!formData.province.trim()) errors.push('Province is required');
    if (!formData.postalCode.trim()) errors.push('Postal code is required');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    return errors;
  };

  const handleAddCustomer = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      addressLine1: customer.addressLine1 || '',
      addressLine2: customer.addressLine2 || '',
      city: customer.city || '',
      province: customer.province || '',
      postalCode: customer.postalCode || '',
      country: customer.country || 'Canada',
    });
    setSubmitMessage(null);
    setIsEditModalOpen(true);
  };

  const handleViewCustomer = (customer: any) => {
    // Navigate to new full-page customer interface
    router.push(`/staff/customers/${customer.id}`);
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
      await customerAPI.create(formData);
      setSubmitMessage({ type: 'success', text: 'Customer created successfully!' });
      setTimeout(() => {
        setIsCreateModalOpen(false);
        resetForm();
        loadCustomers();
      }, 1500);
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create customer',
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
      await customerAPI.update(editingCustomer.id, formData);
      setSubmitMessage({ type: 'success', text: 'Customer updated successfully!' });
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingCustomer(null);
        resetForm();
        loadCustomers();
      }, 1500);
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update customer',
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
      setEditingCustomer(null);
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage customer profiles, contacts, and billing information
            </p>
          </div>
          <button
            onClick={handleAddCustomer}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalCustomers}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeCustomers}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Customers</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.newThisMonth}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">New This Month</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalRevenue}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customer Revenue</p>
            </div>
            <CreditCard className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}{' '}
            matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Customers</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Packages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="flex items-center text-left hover:bg-gray-50 dark:hover:bg-gray-600/50 rounded p-1 -m-1 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4">
                        <span className="text-sm font-medium text-white">
                          {customer.firstName?.[0]}
                          {customer.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {customer.id.slice(-8)}
                        </p>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-900 dark:text-white mb-1">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3 w-3 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div>{customer.addressLine1}</div>
                        {customer.addressLine2 && <div>{customer.addressLine2}</div>}
                        <div>
                          {customer.city}, {customer.province} {customer.postalCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {customer.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    0 packages
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <div>
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No customers found</p>
                  <p className="text-sm">No customers match "{searchQuery}"</p>
                </div>
              ) : (
                <div>
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No customers yet</p>
                  <p className="text-sm">Add your first customer to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Customer Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title="Create Customer">
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Province *
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country *
            </label>
            <ChipSelector
              value={formData.country}
              onChange={(value) => setFormData({ ...formData, country: value })}
              options={countryOptions}
              placeholder="Select country..."
              searchable={false}
              required
              name="country"
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
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Customer">
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Province *
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country *
            </label>
            <ChipSelector
              value={formData.country}
              onChange={(value) => setFormData({ ...formData, country: value })}
              options={countryOptions}
              placeholder="Select country..."
              searchable={false}
              required
              name="country"
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
              {isSubmitting ? 'Updating...' : 'Update Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </ModernLayout>
  );
}
