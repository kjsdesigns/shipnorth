'use client';

import { StaffProtectedRoute } from '@/components/auth/SessionProtectedRoute';
import ModernLayout from '@/components/ModernLayout';
import AuditLogViewer from '@/components/audit/AuditLogViewer';

export default function AuditPage() {
  return (
    <StaffProtectedRoute>
      <ModernLayout role="staff">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
              <p className="text-gray-600">
                Complete audit trail of all system activities for compliance and security monitoring
              </p>
            </div>
          </div>
          
          <AuditLogViewer showGlobal={true} />
        </div>
      </ModernLayout>
    </StaffProtectedRoute>
  );
}