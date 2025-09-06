'use client';

import { useState } from 'react';
import { MessageSquare, Settings } from 'lucide-react';
import MessageHistory from './MessageHistory';
import CommunicationPreferences from '../communication/CommunicationPreferences';

interface Props {
  customerId: string;
}

export default function CustomerMessagesTab({ customerId }: Props) {
  const [activeTab, setActiveTab] = useState<'history' | 'preferences'>('history');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message History
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Notification Settings
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'history' && (
          <MessageHistory customerId={customerId} />
        )}
        
        {activeTab === 'preferences' && (
          <CommunicationPreferences 
            customerId={customerId}
            onSave={(prefs) => {
              console.log('Communication preferences updated:', prefs);
              // Could add success notification here
            }}
          />
        )}
      </div>
    </div>
  );
}