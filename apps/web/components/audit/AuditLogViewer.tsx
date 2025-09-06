'use client';

import { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, User, Calendar, Download, Filter, Eye } from 'lucide-react';

interface AuditEntry {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  actionCategory: string;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  timestamp: Date;
  success: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sensitiveData: boolean;
  errorMessage?: string;
  metadata?: any;
}

const RISK_COLORS = {
  LOW: 'text-green-600 bg-green-100',
  MEDIUM: 'text-yellow-600 bg-yellow-100', 
  HIGH: 'text-orange-600 bg-orange-100',
  CRITICAL: 'text-red-600 bg-red-100'
};

const ACTION_COLORS = {
  AUTH: 'text-blue-600 bg-blue-100',
  CRUD: 'text-gray-600 bg-gray-100',
  BUSINESS: 'text-purple-600 bg-purple-100',
  SYSTEM: 'text-green-600 bg-green-100',
  SECURITY: 'text-red-600 bg-red-100'
};

interface Props {
  resourceType?: string;
  resourceId?: string;
  showGlobal?: boolean;
}

export default function AuditLogViewer({ resourceType, resourceId, showGlobal = true }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    actionCategory: '',
    riskLevel: '',
    actorId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    loadAuditEntries();
  }, [filters, pagination.offset, resourceType, resourceId]);

  const loadAuditEntries = async () => {
    setLoading(true);
    try {
      let url = '/api/audit-logs';
      
      if (resourceType && resourceId) {
        url = `/api/audit-logs/object/${resourceType}/${resourceId}`;
      }
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(searchQuery && { q: searchQuery }),
        ...(filters.actionCategory && { actionCategory: filters.actionCategory }),
        ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
        ...(filters.actorId && { actorId: filters.actorId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`${url}?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data.data);
        if (data.pagination) {
          setPagination(prev => ({ ...prev, total: data.pagination.total }));
        }
      }
    } catch (error) {
      console.error('Failed to load audit entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadAuditEntries();
  };

  const exportAudit = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });
      
      const response = await fetch(`/api/audit-logs/export?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-export-${new Date().toISOString()}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {showGlobal && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            Audit Log
          </h1>
          <button
            onClick={exportAudit}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            Export Audit
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search actions, users, or resources..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select
            value={filters.actionCategory}
            onChange={(e) => setFilters(prev => ({ ...prev, actionCategory: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            <option value="AUTH">Authentication</option>
            <option value="CRUD">Data Operations</option>
            <option value="BUSINESS">Business Actions</option>
            <option value="SYSTEM">System Events</option>
            <option value="SECURITY">Security Events</option>
          </select>
          
          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
            placeholder="From Date"
          />
          
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
            placeholder="To Date"
          />
        </div>
      </div>

      {/* Audit Entries */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading audit entries...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actor & Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Risk & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{entry.actorEmail}</div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              ACTION_COLORS[entry.actionCategory as keyof typeof ACTION_COLORS]
                            }`}>
                              {entry.action}
                            </span>
                            {entry.sensitiveData && (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {entry.resourceName || entry.resourceId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.resourceType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          RISK_COLORS[entry.riskLevel]
                        }`}>
                          {entry.riskLevel}
                        </span>
                        <div className={`text-xs ${entry.success ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.success ? '✓ Success' : '✗ Failed'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        <Eye className="h-3 w-3" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Audit Entry Details</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Actor Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Email:</span> {selectedEntry.actorEmail}</div>
                    <div><span className="font-medium">Role:</span> {selectedEntry.actorRole}</div>
                    <div><span className="font-medium">Action:</span> {selectedEntry.action}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Resource Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Type:</span> {selectedEntry.resourceType}</div>
                    <div><span className="font-medium">ID:</span> {selectedEntry.resourceId}</div>
                    <div><span className="font-medium">Name:</span> {selectedEntry.resourceName || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Event Details</h4>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <div><span className="font-medium">Timestamp:</span> {new Date(selectedEntry.timestamp).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Risk Level:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${RISK_COLORS[selectedEntry.riskLevel]}`}>
                        {selectedEntry.riskLevel}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div><span className="font-medium">Status:</span> {selectedEntry.success ? 'Success' : 'Failed'}</div>
                    <div><span className="font-medium">Sensitive Data:</span> {selectedEntry.sensitiveData ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                
                {selectedEntry.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800">Error Message:</div>
                    <div className="text-red-700 text-sm">{selectedEntry.errorMessage}</div>
                  </div>
                )}
              </div>
              
              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Additional Context</h4>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}