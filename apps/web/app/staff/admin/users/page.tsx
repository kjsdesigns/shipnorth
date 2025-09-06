'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminUserAPI } from '@/lib/api';
import useServerSession from '@/hooks/useServerSession';
import ModernLayout from '@/components/ModernLayout';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Settings,
  Download,
  Upload,
  AlertTriangle,
  Key,
  UserCheck,
  UserX,
  Copy,
  History,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  CheckSquare,
  Square,
  RefreshCw,
  X,
  Save,
  Plus,
  Minus,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  role: string; // Primary role
  status: 'active' | 'inactive';
  lastLogin?: string;
  lastUsedPortal?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
}

export default function UserManagement() {
  const router = useRouter();
  const { user, loading: authLoading, hasRole } = useServerSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Bulk operations
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkOperation, setBulkOperation] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Create user form
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roles: [] as string[],
    primaryRole: 'customer' as 'customer' | 'staff' | 'admin' | 'driver',
  });
  
  // Edit user form
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    roles: [] as string[],
    primaryRole: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login/');
        return;
      }
      
      if (!hasRole('admin')) {
        router.push('/staff/');
        return;
      }
      
      loadUsers();
    }
  }, [user, authLoading, hasRole, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminUserAPI.list({
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: searchQuery || undefined,
        limit: 100,
      });

      const usersData = response.data.users || response.data || [];
      const formattedUsers: User[] = usersData.map((userData: any) => ({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone,
        roles: userData.roles || [userData.role],
        role: userData.role,
        status: userData.status || 'active',
        lastLogin: userData.lastLogin,
        lastUsedPortal: userData.lastUsedPortal,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadges = (roles: string[], isMultiRole = false) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      staff: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      driver: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      customer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };

    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => (
          <span
            key={role}
            className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors] || colors.staff}`}
          >
            {role}
          </span>
        ))}
        {isMultiRole && roles.length > 1 && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Multi-role
          </span>
        )}
      </div>
    );
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleEditUser = (targetUser: User) => {
    setSelectedUser(targetUser);
    setEditForm({
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      phone: targetUser.phone || '',
      roles: [...targetUser.roles],
      primaryRole: targetUser.role,
      status: targetUser.status,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      const updates = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        roles: editForm.roles,
        role: editForm.primaryRole,
        status: editForm.status,
      };
      
      await adminUserAPI.update(selectedUser.id, updates);
      await loadUsers(); // Refresh list
      setShowUserModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const userData = {
        email: createForm.email,
        password: createForm.password,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        phone: createForm.phone,
        role: createForm.primaryRole,
      };
      
      await adminUserAPI.create(userData);
      await loadUsers(); // Refresh list
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        roles: [],
        primaryRole: 'customer',
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleBulkOperation = async () => {
    if (selectedUserIds.size === 0 || !bulkOperation) return;
    
    setBulkLoading(true);
    try {
      const userIds = Array.from(selectedUserIds);
      let updates = {};
      
      switch (bulkOperation) {
        case 'activate':
          updates = { status: 'active' };
          break;
        case 'deactivate':
          updates = { status: 'inactive' };
          break;
        case 'add-staff-role':
          // This would need special handling in API
          updates = { addRole: 'staff' };
          break;
        case 'remove-staff-role':
          updates = { removeRole: 'staff' };
          break;
      }
      
      await adminUserAPI.bulkUpdate(userIds, updates);
      await loadUsers();
      setSelectedUserIds(new Set());
      setShowBulkModal(false);
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  const loadActivityLogs = async (userId: string) => {
    setActivityLoading(true);
    try {
      const response = await adminUserAPI.getActivity(userId);
      setActivityLogs(response.data.activities || []);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setActivityLogs([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
        await adminUserAPI.updateStatus(userId, newStatus);
        await loadUsers();
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await adminUserAPI.export();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  };

  if (loading) {
    return (
      <ModernLayout role="staff">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout role="staff">
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage user accounts, roles, and permissions
            </p>
            <div className="flex items-center space-x-6 mt-2 text-sm text-gray-500">
              <span>Total: {users.length}</span>
              <span>Active: {users.filter(u => u.status === 'active').length}</span>
              <span>Multi-role: {users.filter(u => u.roles.length > 1).length}</span>
              <span>Selected: {selectedUserIds.size}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportUsers}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="driver">Driver</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Bulk Operations Bar */}
          {selectedUserIds.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
                  </span>
                  <select
                    value={bulkOperation}
                    onChange={(e) => setBulkOperation(e.target.value)}
                    className="text-sm border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select bulk action...</option>
                    <option value="activate">Activate Users</option>
                    <option value="deactivate">Deactivate Users</option>
                    <option value="add-staff-role">Add Staff Role</option>
                    <option value="remove-staff-role">Remove Staff Role</option>
                    <option value="reset-passwords">Reset Passwords</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedUserIds(new Set())}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    disabled={!bulkOperation}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                  >
                    Execute
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Users ({filteredUsers.length})
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSelectAll(selectedUserIds.size !== filteredUsers.length)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {selectedUserIds.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={loadUsers}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Roles & Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status & Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((targetUser) => (
                  <tr key={targetUser.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(targetUser.id)}
                        onChange={(e) => handleUserSelect(targetUser.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {targetUser.firstName[0] || 'U'}
                            {targetUser.lastName[0] || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {targetUser.firstName} {targetUser.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{targetUser.email}</p>
                          {targetUser.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {targetUser.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getRoleBadges(targetUser.roles, targetUser.roles.length > 1)}
                        {targetUser.roles.length > 1 && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                            <Shield className="h-3 w-3 mr-1" />
                            Multi-role user
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Primary: {targetUser.role}
                          {targetUser.lastUsedPortal && (
                            <span className="ml-2">• Portal: {targetUser.lastUsedPortal}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {targetUser.status === 'active' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                              <span className="text-green-800 dark:text-green-400 text-sm font-medium">
                                Active
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
                              <span className="text-red-800 dark:text-red-400 text-sm font-medium">
                                Inactive
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {targetUser.lastLogin ? (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(targetUser.lastLogin).toLocaleDateString()}
                            </div>
                          ) : (
                            'Never logged in'
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Created: {new Date(targetUser.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditUser(targetUser)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(targetUser);
                            setShowActivityModal(true);
                            loadActivityLogs(targetUser.id);
                          }}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                          title="View activity logs"
                        >
                          <Activity className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(targetUser.id)}
                          className={`${
                            targetUser.status === 'active'
                              ? 'text-red-600 hover:text-red-800 dark:text-red-400'
                              : 'text-green-600 hover:text-green-800 dark:text-green-400'
                          }`}
                          title={targetUser.status === 'active' ? 'Deactivate user' : 'Activate user'}
                        >
                          {targetUser.status === 'active' ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <div className="relative">
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Users Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No users match your search criteria' : 'No users in the system'}
            </p>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create New User
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    placeholder="+1-416-555-0123"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Role *
                  </label>
                  <select
                    value={createForm.primaryRole}
                    onChange={(e) => setCreateForm({...createForm, primaryRole: e.target.value as 'customer' | 'staff' | 'admin' | 'driver'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateUser}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal with Multi-Role Assignment */}
        {selectedUser && showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit User: {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setSelectedUser(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email (Read Only)
                  </label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Enhanced Multi-Role Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Role Assignment
                  </label>
                  
                  {/* Primary Role Selection */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Primary Role *
                    </label>
                    <select
                      value={editForm.primaryRole}
                      onChange={(e) => {
                        const newPrimaryRole = e.target.value;
                        setEditForm({
                          ...editForm, 
                          primaryRole: newPrimaryRole,
                          roles: editForm.roles.includes(newPrimaryRole) 
                            ? editForm.roles 
                            : [...editForm.roles, newPrimaryRole]
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="driver">Driver</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Multi-Role Checkboxes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">
                      Additional Roles (Multi-Role Support)
                    </label>
                    <div className="space-y-3">
                      {[
                        { role: 'admin', description: 'Full system access, user management, settings' },
                        { role: 'staff', description: 'Package management, customer service, reports' },
                        { role: 'driver', description: 'Delivery interface, GPS tracking, package scanning' },
                        { role: 'customer', description: 'Portal access, package tracking, billing' }
                      ].map(({ role, description }) => (
                        <div key={role} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <input
                            type="checkbox"
                            id={`role-${role}`}
                            checked={editForm.roles.includes(role)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditForm({...editForm, roles: [...editForm.roles, role]});
                              } else {
                                // Don't allow removing primary role
                                if (role !== editForm.primaryRole) {
                                  setEditForm({...editForm, roles: editForm.roles.filter(r => r !== role)});
                                }
                              }
                            }}
                            disabled={role === editForm.primaryRole}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`role-${role}`}
                              className={`text-sm font-medium ${role === editForm.primaryRole ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'} capitalize cursor-pointer`}
                            >
                              {role} {role === editForm.primaryRole && '(Primary)'}
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {editForm.roles.length > 1 && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            Multi-Role User
                          </span>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          This user will have access to multiple portals: {editForm.roles.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowUserModal(false);
                        setSelectedUser(null);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUser}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Logs Modal */}
        {selectedUser && showActivityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Activity Logs: {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <button
                    onClick={() => {
                      setShowActivityModal(false);
                      setSelectedUser(null);
                      setActivityLogs([]);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Activity Logs
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No recent activity found for this user.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {log.ipAddress && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            IP: {log.ipAddress}
                          </p>
                        )}
                        {log.details && (
                          <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Operations Confirmation Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirm Bulk Operation
                  </h3>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Bulk Operation Confirmation
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This action will affect {selectedUserIds.size} users
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Operation:</strong> {bulkOperation.replace('-', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <strong>Affected Users:</strong> {Array.from(selectedUserIds).length} selected
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    disabled={bulkLoading}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkOperation}
                    disabled={bulkLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    {bulkLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}