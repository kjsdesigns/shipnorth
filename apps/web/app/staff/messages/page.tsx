'use client';

import { StaffProtectedRoute } from '@/components/auth/SessionProtectedRoute';
import ModernLayout from '@/components/ModernLayout';
import GlobalMessagesList from '@/components/messages/GlobalMessagesList';

export default function MessagesPage() {
  return (
    <StaffProtectedRoute>
      <ModernLayout role="staff">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
              <p className="text-gray-600">
                View all customer communications sent by the system
              </p>
            </div>
          </div>
          
          <GlobalMessagesList />
        </div>
      </ModernLayout>
    </StaffProtectedRoute>
  );
}