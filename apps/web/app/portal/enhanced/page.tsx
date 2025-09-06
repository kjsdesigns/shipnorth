'use client';

import { CustomerProtectedRoute } from '@/components/auth/SessionProtectedRoute';
import ModernLayout from '@/components/ModernLayout';
import EnhancedCustomerPortal from '@/components/customer/EnhancedCustomerPortal';
import { useServerSession } from '@/hooks/useServerSession';

export default function EnhancedCustomerPortalPage() {
  const { user } = useServerSession();
  
  return (
    <CustomerProtectedRoute>
      <ModernLayout role="customer">
        {user?.id ? (
          <EnhancedCustomerPortal 
            customerId={user.id} 
            customerData={user}
          />
        ) : (
          <div className="text-center p-8">
            <p>Loading customer data...</p>
          </div>
        )}
      </ModernLayout>
    </CustomerProtectedRoute>
  );
}