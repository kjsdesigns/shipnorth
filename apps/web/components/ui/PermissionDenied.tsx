'use client';

import { ShieldIcon } from 'lucide-react';

interface PermissionDeniedProps {
  message?: string;
  action?: string;
  resource?: string;
  showContactAdmin?: boolean;
}

export function PermissionDenied({ 
  message = 'Access denied', 
  action, 
  resource,
  showContactAdmin = true 
}: PermissionDeniedProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <ShieldIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-600">
          {action && resource ? (
            <>You don't have permission to {action} {resource.toLowerCase()}.</>
          ) : (
            message
          )}
        </p>
        {showContactAdmin && (
          <p className="mt-4 text-xs text-gray-500">
            If you believe this is an error, please contact your administrator.
          </p>
        )}
      </div>
    </div>
  );
}