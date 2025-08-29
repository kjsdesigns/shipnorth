'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, adminUserAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import {
  Shield,
  Users,
  Settings,
  Edit,
  Plus,
  Save,
  X,
  UserCheck,
  UserX,
  Crown,
  Truck,
  Package,
} from 'lucide-react';

interface Role {
  id: string;
  name: 'customer' | 'staff' | 'admin' | 'driver';
  displayName: string;
  permissions: string[];
  userCount: number;
  description: string;
}

export default function RoleManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || (!currentUser.roles?.includes('admin') && currentUser.role !== 'admin')) {
      router.push('/staff');
      return;
    }

    setUser(currentUser);
    loadRoles();
  }, [router]);

  const loadRoles = async () => {
    try {
      // Get user counts by role
      const [customerUsers, staffUsers, adminUsers, driverUsers] = await Promise.all([
        adminUserAPI.list({ role: 'customer', limit: 1000 }),
        adminUserAPI.list({ role: 'staff', limit: 1000 }),
        adminUserAPI.list({ role: 'admin', limit: 1000 }),
        adminUserAPI.list({ role: 'driver', limit: 1000 }),
      ]);

      const rolesData: Role[] = [
        {
          id: 'customer',
          name: 'customer',
          displayName: 'Customer',
          permissions: ['view_own_packages', 'track_packages', 'manage_payment_methods'],
          userCount: customerUsers.data?.users?.length || customerUsers.data?.length || 0,
          description: 'Can track packages and manage their account',
        },
        {
          id: 'staff',
          name: 'staff',
          displayName: 'Staff',
          permissions: ['manage_customers', 'manage_packages', 'manage_loads', 'view_reports'],
          userCount: staffUsers.data?.users?.length || staffUsers.data?.length || 0,
          description: 'Can manage customers, packages, and loads',
        },
        {
          id: 'driver',
          name: 'driver',
          displayName: 'Driver',
          permissions: [
            'view_assigned_loads',
            'update_delivery_status',
            'capture_signatures',
            'gps_tracking',
          ],
          userCount: driverUsers.data?.users?.length || driverUsers.data?.length || 0,
          description: 'Can manage deliveries and update package status',
        },
        {
          id: 'admin',
          name: 'admin',
          displayName: 'Administrator',
          permissions: ['manage_users', 'manage_system_settings', 'view_analytics', 'manage_roles'],
          userCount: adminUsers.data?.users?.length || adminUsers.data?.length || 0,
          description: 'Full system administration access',
        },
      ];

      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'customer':
        return <Package className="h-6 w-6" />;
      case 'staff':
        return <Users className="h-6 w-6" />;
      case 'driver':
        return <Truck className="h-6 w-6" />;
      case 'admin':
        return <Crown className="h-6 w-6" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'customer':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'staff':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'driver':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'admin':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ModernLayout role="staff">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Role Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage user roles and permissions</p>
          </div>
          <button
            onClick={() => setShowRoleModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Role
          </button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full ${getRoleColor(role.name)}`}>
                      {getRoleIcon(role.name)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {role.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {role.userCount} users
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowRoleModal(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">{role.description}</p>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Permissions</h4>
                  <div className="space-y-1">
                    {role.permissions.map((permission) => (
                      <div key={permission} className="flex items-center text-sm">
                        <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User Role Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            User Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="text-center">
                <div
                  className={`p-4 rounded-full mx-auto mb-2 w-16 h-16 flex items-center justify-center ${getRoleColor(role.name)}`}
                >
                  {getRoleIcon(role.name)}
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{role.userCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{role.displayName}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
