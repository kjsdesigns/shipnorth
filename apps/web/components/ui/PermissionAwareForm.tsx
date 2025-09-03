'use client';

import React from 'react';
import { Can } from '@/components/auth/Can';

interface PermissionAwareFieldProps {
  action: string;
  resource: string;
  subject?: any;
  children: React.ReactNode;
  readOnlyFallback?: React.ReactNode;
}

export function PermissionAwareField({ 
  action, 
  resource, 
  subject, 
  children, 
  readOnlyFallback 
}: PermissionAwareFieldProps) {
  return (
    <Can 
      I={action} 
      a={resource} 
      this={subject}
      fallback={readOnlyFallback}
    >
      {children}
    </Can>
  );
}

interface PermissionAwareButtonProps {
  action: string;
  resource: string;
  subject?: any;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PermissionAwareButton({
  action,
  resource,
  subject,
  onClick,
  children,
  className = '',
  disabled = false
}: PermissionAwareButtonProps) {
  return (
    <Can I={action} a={resource} this={subject}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={className}
      >
        {children}
      </button>
    </Can>
  );
}

// Common permission-aware form components
export function CreateButton({ resource, onClick, children, ...props }: Omit<PermissionAwareButtonProps, 'action'>) {
  return (
    <PermissionAwareButton action="create" resource={resource} onClick={onClick} {...props}>
      {children}
    </PermissionAwareButton>
  );
}

export function EditButton({ resource, subject, onClick, children, ...props }: Omit<PermissionAwareButtonProps, 'action'>) {
  return (
    <PermissionAwareButton action="update" resource={resource} subject={subject} onClick={onClick} {...props}>
      {children}
    </PermissionAwareButton>
  );
}

export function DeleteButton({ resource, subject, onClick, children, ...props }: Omit<PermissionAwareButtonProps, 'action'>) {
  return (
    <PermissionAwareButton action="delete" resource={resource} subject={subject} onClick={onClick} {...props}>
      {children}
    </PermissionAwareButton>
  );
}

export function ReadOnlyField({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
      {children}
    </div>
  );
}