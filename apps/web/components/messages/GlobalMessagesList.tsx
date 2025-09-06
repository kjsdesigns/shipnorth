'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Mail, MessageSquare, CheckCircle, XCircle, Clock, RefreshCw, Download } from 'lucide-react';

interface Message {
  id: string;
  customerId: string;
  customerName?: string;
  type: 'email' | 'sms';
  event: string;
  recipient: string;
  subject?: string;
  content: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt: Date;
  deliveredAt?: Date;
  failureReason?: string;
  relatedObjectType: string;
  relatedObjectId: string;
}

const STATUS_COLORS = {
  sent: 'text-blue-600',
  delivered: 'text-green-600', 
  failed: 'text-red-600',
  bounced: 'text-orange-600'
};

const STATUS_ICONS = {
  sent: Clock,
  delivered: CheckCircle,
  failed: XCircle,
  bounced: XCircle
};

const EVENT_NAMES = {
  package_delivered: 'Package Delivered',
  load_started: 'Load Started',
  package_shipped: 'Package Shipped',
  delivery_exception: 'Delivery Exception',
  package_created: 'Package Created'
};

export default function GlobalMessagesList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    customerId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    pages: 0
  });

  useEffect(() => {
    loadMessages();
  }, [filters, pagination.offset]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(searchQuery && { query: searchQuery }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/messages?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data);
        setPagination(prev => ({ ...prev, total: data.pagination.total, pages: data.pagination.pages }));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadMessages();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      type: '',
      status: '',
      customerId: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const exportMessages = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });
      
      const response = await fetch(`/api/messages/export?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `messages-export-${new Date().toISOString()}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Global Messages</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMessages}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportMessages}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

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
                placeholder="Search messages, recipients, or content..."
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
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

          <button
            onClick={resetFilters}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading messages...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Related
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.map((message) => {
                  const StatusIcon = STATUS_ICONS[message.status];
                  return (
                    <tr key={message.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {message.type === 'email' ? (
                            <Mail className="h-5 w-5 text-green-600" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {EVENT_NAMES[message.event as keyof typeof EVENT_NAMES] || message.event}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {message.subject || message.content}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{message.recipient}</div>
                          {message.customerName && (
                            <div className="text-sm text-gray-500">{message.customerName}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          message.type === 'email' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {message.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${STATUS_COLORS[message.status]}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm font-medium capitalize">{message.status}</span>
                        </div>
                        {message.failureReason && (
                          <div className="text-xs text-red-500 mt-1">{message.failureReason}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(message.sentAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-gray-900">{message.relatedObjectType}</span>
                        <div className="text-xs text-gray-500">{message.relatedObjectId}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {messages.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No messages found matching your criteria
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} messages
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
    </div>
  );
}