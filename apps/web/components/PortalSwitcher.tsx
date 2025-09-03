'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Building2, Truck, User, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PortalSwitcherProps {
  currentPortal: 'staff' | 'driver' | 'customer';
  availablePortals: ('staff' | 'driver' | 'customer')[];
  hasAdminAccess: boolean;
  className?: string;
}

const PORTAL_CONFIG = {
  staff: {
    name: 'Staff Portal',
    icon: Building2,
    path: '/staff',
    color: 'text-green-600 dark:text-green-400',
  },
  driver: {
    name: 'Driver Portal',
    icon: Truck,
    path: '/driver',
    color: 'text-orange-600 dark:text-orange-400',
  },
  customer: {
    name: 'Customer Portal',
    icon: User,
    path: '/portal',
    color: 'text-blue-600 dark:text-blue-400',
  },
};

export default function PortalSwitcher({ className = '' }: { className?: string }) {
  const router = useRouter();
  const { user, token, updateUser, hasRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!user) return null;

  // Helper functions
  const canAccessPortal = (portal: 'staff' | 'driver' | 'customer') => {
    const roles = user.roles || [user.role];
    switch (portal) {
      case 'customer': return roles.includes('customer');
      case 'driver': return roles.includes('driver');
      case 'staff': return roles.includes('staff') || roles.includes('admin');
      default: return false;
    }
  };

  const getAvailablePortals = () => {
    const portals: string[] = [];
    if (canAccessPortal('customer')) portals.push('customer');
    if (canAccessPortal('driver')) portals.push('driver');
    if (canAccessPortal('staff')) portals.push('staff');
    return portals as ('staff' | 'driver' | 'customer')[];
  };

  const getCurrentPortal = (): 'staff' | 'driver' | 'customer' => {
    return user.lastUsedPortal || user.defaultPortal || 'customer';
  };

  const availablePortals = getAvailablePortals();
  const currentPortal = getCurrentPortal();
  const hasAdminAccess = hasRole('admin');
  const currentConfig = PORTAL_CONFIG[currentPortal];
  const CurrentIcon = currentConfig.icon;

  const handlePortalSwitch = async (targetPortal: 'staff' | 'driver' | 'customer') => {
    if (targetPortal === currentPortal) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/switch-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ portal: targetPortal })
      });

      if (response.ok) {
        const data = await response.json();
        updateUser(data.user);
        router.push(PORTAL_CONFIG[targetPortal].path);
      } else {
        console.error('Failed to switch portal:', response.status);
      }
    } catch (error) {
      console.error('Failed to switch portal:', error);
    } finally {
      setSwitching(false);
      setIsOpen(false);
    }
  };

  // Don't show switcher if user only has access to one portal
  if (availablePortals.length <= 1) {
    return (
      <div className={`flex items-center text-sm text-gray-600 dark:text-gray-400 ${className}`}>
        <CurrentIcon className="h-4 w-4 mr-2" />
        <span>{currentConfig.name}</span>
        {hasAdminAccess && currentPortal === 'staff' && (
          <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
            Admin
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        <CurrentIcon className={`h-4 w-4 mr-2 ${currentConfig.color}`} />
        <span className="text-gray-900 dark:text-white">{currentConfig.name}</span>
        {hasAdminAccess && currentPortal === 'staff' && (
          <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
            Admin
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 ml-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {availablePortals.map((portal) => {
              const config = PORTAL_CONFIG[portal];
              const Icon = config.icon;
              const isActive = portal === currentPortal;

              return (
                <button
                  key={portal}
                  onClick={() => handlePortalSwitch(portal)}
                  disabled={switching || isActive}
                  className={`w-full flex items-center px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 ${
                    isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <Icon className={`h-4 w-4 mr-3 ${config.color}`} />
                  <div className="flex-1">
                    <div className="text-gray-900 dark:text-white">{config.name}</div>
                    {isActive && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
                    )}
                  </div>
                  {hasAdminAccess && portal === 'staff' && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
