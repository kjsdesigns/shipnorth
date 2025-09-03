'use client';

import React from 'react';
import { useAbility } from '@/contexts/AbilityContext';

interface CanProps {
  I: string; // action
  a: string; // resource
  this?: any; // subject
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ I: action, a: resource, this: subject, children, fallback = null }: CanProps) {
  const { ability, isLoading } = useAbility();
  
  // Show fallback while loading permissions
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  // Check if user can perform the action
  const canPerform = ability.can(action, subject || resource);
  
  return canPerform ? <>{children}</> : <>{fallback}</>;
}

// Alternative syntax for conditional rendering
export function usePermission(action: string, resource: string, subject?: any) {
  const { ability, isLoading } = useAbility();
  
  if (isLoading) return false;
  
  return ability.can(action, subject || resource);
}

// Hook for checking if user cannot perform an action
export function useForbidden(action: string, resource: string, subject?: any) {
  const { ability, isLoading } = useAbility();
  
  if (isLoading) return false;
  
  return ability.cannot(action, subject || resource);
}

// Convenience hooks for common permission checks
export function useCanRead(resource: string, subject?: any) {
  return usePermission('read', resource, subject);
}

export function useCanCreate(resource: string, subject?: any) {
  return usePermission('create', resource, subject);
}

export function useCanUpdate(resource: string, subject?: any) {
  return usePermission('update', resource, subject);
}

export function useCanDelete(resource: string, subject?: any) {
  return usePermission('delete', resource, subject);
}

export function useCanManage(resource: string, subject?: any) {
  return usePermission('manage', resource, subject);
}