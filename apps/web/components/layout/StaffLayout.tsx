'use client';

import { ReactNode } from 'react';
import StaffNavigation from '@/components/navigation/StaffNavigation';
import PortalSwitcher from '@/components/PortalSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalAccess } from '@/hooks/usePermissions';

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const { user } = useAuth();
  const { availablePortals, hasAdminAccess } = usePortalAccess();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm">
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-900">Shipnorth</h1>
            <p className="text-sm text-gray-600">Staff Portal</p>
            
            {/* Portal Switcher */}
            <div className="mt-4">
              <PortalSwitcher 
                currentPortal="staff"
                availablePortals={availablePortals()}
                hasAdminAccess={hasAdminAccess()}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6">
            <StaffNavigation />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}