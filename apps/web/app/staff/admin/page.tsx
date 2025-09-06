'use client';

import { AdminOnlyRoute } from '@/components/auth/ProtectedRoute';
import ModernLayout from '@/components/ModernLayout';
import SystemOverview from '@/components/admin/SystemOverview';

export default function AdminDashboard() {
  return (
    <AdminOnlyRoute>
      <ModernLayout role="staff">
        <SystemOverview />
      </ModernLayout>
    </AdminOnlyRoute>
  );
}
