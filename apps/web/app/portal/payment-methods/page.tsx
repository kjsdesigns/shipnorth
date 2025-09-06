'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ModernLayout from '@/components/ModernLayout';
import PaymentMethodManager from '@/components/PaymentMethodManager';
import PayPalScript from '@/components/PayPalScript';
import useServerSession from '@/hooks/useServerSession';

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { user, loading: authLoading, hasRole } = useServerSession();
  const [loading, setLoading] = useState(true);

  // Server-side authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ PAYMENT METHODS: No authenticated user, redirecting');
        router.push('/login/');
        return;
      }
      
      if (!hasRole('customer')) {
        console.log('❌ PAYMENT METHODS: User lacks customer role');
        router.push('/login/');
        return;
      }
      
      console.log('✅ PAYMENT METHODS: User authenticated via server session');
      setLoading(false);
    }
  }, [user, authLoading, hasRole, router]);

  if (authLoading || loading) {
    return (
      <ModernLayout role="customer">
        <div className="animate-pulse p-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </ModernLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ModernLayout role={user.role as 'staff' | 'driver' | 'customer'}>
      <PayPalScript enabled={true} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your payment methods for shipping charges
          </p>
        </div>

        <PaymentMethodManager
          customerId={user.customerId || user.id}
          isStaff={false}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 About Payment Methods
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Your payment method is only charged when you ship packages</li>
            <li>• We support credit cards and PayPal through secure PayPal processing</li>
            <li>• You can update or replace your payment method at any time</li>
            <li>• All payments are processed securely through PayPal's platform</li>
          </ul>
        </div>
      </div>
    </ModernLayout>
  );
}
