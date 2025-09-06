'use client';

import { StaffProtectedRoute } from '@/components/auth/SessionProtectedRoute';
import ModernLayout from '@/components/ModernLayout';
import EnhancedStaffDashboard from '@/components/staff/EnhancedStaffDashboard';

export default function StaffDashboardPage() {
  return (
    <StaffProtectedRoute>
      <ModernLayout role="staff">
        <EnhancedStaffDashboard />
      </ModernLayout>
    </StaffProtectedRoute>
  );
}