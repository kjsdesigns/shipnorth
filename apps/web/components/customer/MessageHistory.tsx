'use client';

import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface CustomerMessage {
  id: string;
  type: 'email' | 'sms';
  event: string;
  recipient: string;
  subject?: string;
  content: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt: Date;
  relatedObjectType: string;
  relatedObjectId: string;
}

const EVENT_ICONS = {
  package_delivered: '📦',
  load_started: '🚚',
  package_shipped: '📮',
  delivery_exception: '⚠️',
  package_created: '📋'
};

const EVENT_NAMES = {
  package_delivered: 'Package Delivered',
  load_started: 'Load Started',
  package_shipped: 'Package Shipped',
  delivery_exception: 'Delivery Exception',
  package_created: 'Package Created'
};

interface Props {
  customerId: string;
}

export default function MessageHistory({ customerId }: Props) {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [customerId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/customer/${customerId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'bounced': return <XCircle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading message history...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Message History</h2>
          <button
            onClick={loadMessages}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No messages sent yet</p>
            <p className="text-sm">You'll see notifications about your packages here</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {message.type === 'email' ? (
                    <Mail className="h-5 w-5 text-green-600" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {EVENT_ICONS[message.event as keyof typeof EVENT_ICONS] || '📋'}
                    </span>
                    <h3 className="font-medium text-gray-900">
                      {EVENT_NAMES[message.event as keyof typeof EVENT_NAMES] || message.event}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {getStatusIcon(message.status)}
                      <span className="capitalize">{message.status}</span>
                    </div>
                  </div>
                  
                  {message.subject && (
                    <div className="font-medium text-gray-800 mb-2">{message.subject}</div>
                  )}
                  
                  <div className="text-gray-700 mb-3">{message.content}</div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>To: {message.recipient}</span>
                      <span>Sent: {new Date(message.sentAt).toLocaleString()}</span>
                      {message.relatedObjectType && (
                        <span>
                          Related: {message.relatedObjectType} #{message.relatedObjectId.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    
                    <span className={`px-2 py-1 rounded ${
                      message.type === 'email' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {message.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}