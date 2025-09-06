'use client';

import { useState, useEffect } from 'react';
import { Can } from '@/components/auth/Can';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogEntry {
  id: number;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: string;
  ip_address?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export default function AuditLogViewer() {
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditData();
    }
  }, [isAuthenticated]);

  const fetchAuditData = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      
      // Fetch logs and stats in parallel using Next.js proxy (Authentication Agent compliant)
      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`/api/audit`, {
          credentials: 'include'
        }),
        fetch(`/api/audit/stats`, {
          credentials: 'include'
        })
      ]);

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData.logs || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'failed') return !log.success;
    if (filter === 'success') return log.success;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading audit logs...</span>
      </div>
    );
  }

  return (
    <Can I="read" a="AuditLog" fallback={
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Access denied. Admin privileges required to view audit logs.</p>
      </div>
    }>
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Total Logs</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Recent Failed</h3>
              <p className="text-2xl font-bold text-red-600">{stats.recentFailed}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-500">Top Action</h3>
              <p className="text-lg font-semibold text-gray-900">
                {stats.topActions?.[0]?.action || 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'success' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Success ({logs.filter(l => l.success).length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Failed ({logs.filter(l => !l.success).length})
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.user_id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="font-mono bg-blue-100 px-2 py-1 rounded text-xs">
                        {log.resource}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {log.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No audit logs found for the selected filter.
          </div>
        )}
      </div>
    </Can>
  );
}