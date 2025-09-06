'use client';

import { useState } from 'react';
import { User, Package, MessageSquare, Settings, History, CreditCard } from 'lucide-react';
import MessageHistory from './MessageHistory';
import CommunicationPreferences from '../communication/CommunicationPreferences';
import ObjectAuditTrail from '../common/ObjectAuditTrail';

interface Props {
  customerId: string;
  customerData?: any;
}

export default function EnhancedCustomerPortal({ customerId, customerData }: Props) {
  const [activeTab, setActiveTab] = useState<'packages' | 'messages' | 'preferences' | 'account' | 'audit'>('packages');

  const tabs = [
    { key: 'packages', label: 'My Packages', icon: Package },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'preferences', label: 'Communication', icon: Settings },
    { key: 'account', label: 'Account', icon: User },
    { key: 'audit', label: 'Activity', icon: History }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'packages' && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Package Tracking</h2>
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Your packages will appear here</p>
              <p className="text-sm">Track deliveries and view shipping history</p>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Message History</h2>
              <p className="text-gray-600">All notifications sent to you about your packages</p>
            </div>
            <MessageHistory customerId={customerId} />
          </div>
        )}

        {activeTab === 'preferences' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Communication Preferences</h2>
              <p className="text-gray-600">Choose how you want to receive updates about your packages</p>
            </div>
            <CommunicationPreferences customerId={customerId} />
          </div>
        )}

        {activeTab === 'account' && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <div className="text-gray-900">{customerData?.name || 'Customer Name'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="text-gray-900">{customerData?.email || 'customer@example.com'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <div className="text-gray-900">{customerData?.phone || 'Not provided'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Activity History</h2>
              <p className="text-gray-600">Your account activity and package history</p>
            </div>
            <ObjectAuditTrail 
              resourceType="customer"
              resourceId={customerId}
              resourceName={customerData?.name}
              compact={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}