'use client';

import { AdminOnlyRoute } from '@/components/auth/ProtectedRoute';
import AuditLogViewer from '@/components/admin/AuditLogViewer';

function AuditPageContent() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600">Security audit trail and system activity monitoring</p>
      </div>
      
      <AuditLogViewer />
    </div>
  );
}

export default function AuditPage() {
  return (
    <AdminOnlyRoute>
      <AuditPageContent />
    </AdminOnlyRoute>
  );
}