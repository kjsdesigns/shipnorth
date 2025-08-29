'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import ModernLayout from '@/components/ModernLayout';
import PaymentMethodManager from '@/components/PaymentMethodManager';
import { authAPI, customerAPI } from '@/lib/api';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
}

export default function CustomerPaymentMethodsPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!['staff', 'admin'].includes(currentUser.role)) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    loadCustomer();
  }, [router, customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.get(customerId);
      setCustomer(response.data);
    } catch (error: any) {
      console.error('Failed to load customer:', error);
      setError(error.response?.data?.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ModernLayout role={user?.role || 'staff'}>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </ModernLayout>
    );
  }

  if (error) {
    return (
      <ModernLayout role={user?.role || 'staff'}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <Link href="/staff/customers" className="text-blue-600 hover:text-blue-500">
            Back to Customers
          </Link>
        </div>
      </ModernLayout>
    );
  }

  if (!user || !customer) {
    return null;
  }

  return (
    <ModernLayout role={user.role}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href={`/staff/customers/${customerId}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
              <User className="w-4 h-4 mr-2" />
              {customer.firstName} {customer.lastName} ({customer.email})
            </p>
          </div>
        </div>

        {/* Customer info card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Name:</span>
              <p className="text-gray-900 dark:text-white">
                {customer.firstName} {customer.lastName}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Email:</span>
              <p className="text-gray-900 dark:text-white">{customer.email}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Status:</span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  customer.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}
              >
                {customer.status}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <PaymentMethodManager
          customerId={customerId}
          isStaff={true}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        />

        {/* Staff notes */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Staff Notes</h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Customers are only charged when packages are shipped</li>
            <li>• Payment method replacement requires customer approval through PayPal</li>
            <li>• Expired payment methods will prevent new shipments</li>
            <li>• All payment data is securely stored with PayPal</li>
          </ul>
        </div>
      </div>
    </ModernLayout>
  );
}
