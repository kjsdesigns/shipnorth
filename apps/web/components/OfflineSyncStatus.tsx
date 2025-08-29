'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncQueueItem {
  id: string;
  action: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface OfflineSyncStatusProps {
  className?: string;
}

export default function OfflineSyncStatus({ className = '' }: OfflineSyncStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueStatus, setQueueStatus] = useState<{
    pending: number;
    processing: number;
    failed: number;
    lastSync: string | null;
  }>({
    pending: 0,
    processing: 0,
    failed: 0,
    lastSync: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check queue status every 30 seconds
    const interval = setInterval(checkQueueStatus, 30000);

    // Initial queue status check
    checkQueueStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkQueueStatus = async () => {
    try {
      const response = await authAPI.sync.getQueueStatus(24); // Last 24 hours
      setQueueStatus(response.data);
    } catch (error) {
      console.error('Failed to check sync queue status:', error);
    }
  };

  const processQueue = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      await authAPI.sync.processQueue();
      await checkQueueStatus();
    } catch (error) {
      console.error('Failed to process sync queue:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
    }

    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-600" />;
    }

    if (queueStatus.failed > 0) {
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }

    if (queueStatus.pending > 0 || queueStatus.processing > 0) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (queueStatus.failed > 0) return `${queueStatus.failed} failed`;
    if (queueStatus.pending > 0) return `${queueStatus.pending} pending`;
    return 'Synced';
  };

  const getTotalQueueItems = () => {
    return queueStatus.pending + queueStatus.processing + queueStatus.failed;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {getStatusIcon()}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStatusText()}
        </span>
        {getTotalQueueItems() > 0 && (
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded-full">
            {getTotalQueueItems()}
          </span>
        )}
      </button>

      {/* Sync Details Dropdown */}
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Sync Status</h4>
              <div className="flex items-center text-sm">
                {isOnline ? (
                  <div className="flex items-center text-green-600">
                    <Wifi className="h-4 w-4 mr-1" />
                    Online
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="h-4 w-4 mr-1" />
                    Offline
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                <span className="font-medium">{queueStatus.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Processing:</span>
                <span className="font-medium">{queueStatus.processing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                <span className="font-medium text-red-600">{queueStatus.failed}</span>
              </div>
              {queueStatus.lastSync && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                  <span className="font-medium text-green-600">
                    {new Date(queueStatus.lastSync).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {isOnline && getTotalQueueItems() > 0 && (
              <button
                onClick={processQueue}
                disabled={isSyncing}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg text-sm font-medium"
              >
                {isSyncing ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </div>
                ) : (
                  'Sync Now'
                )}
              </button>
            )}

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isOnline
                  ? 'All actions are automatically synced when online'
                  : 'Actions are queued and will sync when back online'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
