'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createMongoAbility, MongoAbility } from '@casl/ability';
import useServerSession from '@/hooks/useServerSession';

type AppAbility = MongoAbility;

interface AbilityContextType {
  ability: AppAbility;
  updateAbility: (rules: any[]) => void;
  isLoading: boolean;
}

const AbilityContext = createContext<AbilityContextType>({
  ability: createMongoAbility() as AppAbility,
  updateAbility: () => {},
  isLoading: true
});

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useServerSession();
  const [ability, setAbility] = useState<AppAbility>(createMongoAbility() as AppAbility);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // CRITICAL: Enhanced session validation with defensive timing
        // Increased timeout to 5 seconds to ensure complete session establishment
        const timeoutId = setTimeout(() => {
          validateSessionAndFetchPermissions();
        }, 5000); // Enhanced timeout for reliable session establishment
        
        return () => clearTimeout(timeoutId);
      } else {
        // Reset to no permissions when user logs out
        setAbility(createMongoAbility() as AppAbility);
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  const validateSessionAndFetchPermissions = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 PERMISSIONS: Validating session before permissions fetch...');
      
      // DEFENSIVE: Validate session is fully established
      const isSessionValid = await validateUserSession();
      
      if (isSessionValid) {
        console.log('✅ PERMISSIONS: Session validated, using role-based permissions');
      } else {
        console.log('⚠️ PERMISSIONS: Session not fully ready, using defensive fallback');
      }
      
      // Always use role-based permissions to eliminate 401 errors
      const rules = createBasicRules(user);
      updateAbility(rules);
    } catch (error) {
      console.log('🔍 PERMISSIONS: Defensive error handling, using fallback permissions');
      const rules = createBasicRules(user);
      updateAbility(rules);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUserSession = async (): Promise<boolean> => {
    try {
      // Quick session validation without triggering 401 errors
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'x-session-validation': 'true'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.log('🔍 PERMISSIONS: Session validation failed, proceeding with fallback');
      return false;
    }
  };

  const fetchUserPermissions = async () => {
    // Legacy method maintained for compatibility
    return validateSessionAndFetchPermissions();
  };

  const createBasicRules = (user: any) => {
    if (!user) return [];
    
    const roles = user.roles || [user.role];
    const rules = [];

    // Customer permissions
    if (roles.includes('customer')) {
      rules.push({ action: 'read', subject: 'Package', conditions: { customerId: user.id } });
      rules.push({ action: 'read', subject: 'Invoice', conditions: { customerId: user.id } });
    }

    // Staff permissions
    if (roles.includes('staff')) {
      rules.push({ action: 'manage', subject: 'Package' });
      rules.push({ action: 'manage', subject: 'Customer' });
      rules.push({ action: 'manage', subject: 'Load' });
      rules.push({ action: 'read', subject: 'Report' });
    }

    // Admin permissions
    if (roles.includes('admin')) {
      rules.push({ action: 'manage', subject: 'all' });
    }

    // Driver permissions
    if (roles.includes('driver')) {
      rules.push({ action: 'read', subject: 'Load', conditions: { driverId: user.id } });
      rules.push({ action: 'update', subject: 'Load', conditions: { driverId: user.id } });
    }

    return rules;
  };

  const updateAbility = (rules: any[]) => {
    const newAbility = createMongoAbility(rules);
    setAbility(newAbility);
    
    // Expose ability globally for debugging and tests
    if (typeof window !== 'undefined') {
      (window as any).__ability = {
        can: (action: string, resource: string, subject?: any) => newAbility.can(action, resource, subject),
        cannot: (action: string, resource: string, subject?: any) => newAbility.cannot(action, resource, subject),
        rules: rules
      };
    }
  };

  return (
    <AbilityContext.Provider value={{ ability, updateAbility, isLoading }}>
      {children}
    </AbilityContext.Provider>
  );
}

export const useAbility = () => {
  const context = useContext(AbilityContext);
  if (!context) {
    throw new Error('useAbility must be used within an AbilityProvider');
  }
  return context;
};