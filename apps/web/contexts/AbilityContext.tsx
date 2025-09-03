'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createMongoAbility, MongoAbility } from '@casl/ability';
import { useAuth } from './AuthContext';

type AppAbility = MongoAbility;

interface AbilityContextType {
  ability: AppAbility;
  updateAbility: (rules: any[]) => void;
  isLoading: boolean;
}

const AbilityContext = createContext<AbilityContextType>({
  ability: createMongoAbility(),
  updateAbility: () => {},
  isLoading: true
});

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [ability, setAbility] = useState<AppAbility>(createMongoAbility());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      fetchUserPermissions();
    } else {
      // Reset to no permissions when user logs out
      setAbility(createMongoAbility());
      setIsLoading(false);
    }
  }, [user, token]);

  const fetchUserPermissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.rules) {
          updateAbility(data.rules);
        } else {
          // Fallback: create basic abilities based on user role
          const rules = createBasicRules(user);
          updateAbility(rules);
        }
      } else {
        console.error('Failed to fetch permissions:', response.status);
        const rules = createBasicRules(user);
        updateAbility(rules);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      const rules = createBasicRules(user);
      updateAbility(rules);
    } finally {
      setIsLoading(false);
    }
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