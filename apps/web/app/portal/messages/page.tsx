'use client';

import { CustomerProtectedRoute } from '@/components/auth/SessionProtectedRoute';
import ModernLayout from '@/components/ModernLayout';
import CustomerMessagesTab from '@/components/customer/CustomerMessagesTab';
import { useServerSession } from '@/hooks/useServerSession';

export default function CustomerMessagesPage() {
  const { user } = useServerSession();
  
  return (
    <CustomerProtectedRoute>
      <ModernLayout role="customer">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Messages</h1>
            <p className="text-gray-600">
              View your notification history and communication preferences
            </p>
          </div>
          
          {user?.id && (
            <CustomerMessagesTab customerId={user.id} />
          )}
        </div>
      </ModernLayout>
    </CustomerProtectedRoute>
  );
}