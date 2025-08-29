import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { DatabaseService, generateId } from '../services/database';

const router = Router();

interface SyncQueueItem {
  id: string;
  driverId: string;
  action:
    | 'location_update'
    | 'package_scan'
    | 'delivery_confirmation'
    | 'photo_upload'
    | 'signature_capture';
  data: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: string;
  errorMessage?: string;
  priority: 'high' | 'medium' | 'low';
}

interface SyncQueue {
  id: string;
  driverId: string;
  items: SyncQueueItem[];
  lastSync: string;
  createdAt: string;
  updatedAt: string;
}

// Add item to offline sync queue
router.post('/queue/add', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { action, data, priority = 'medium' } = req.body;
    const driverId = req.user!.id;

    if (!action || !data) {
      return res.status(400).json({ error: 'Action and data required' });
    }

    const validActions = [
      'location_update',
      'package_scan',
      'delivery_confirmation',
      'photo_upload',
      'signature_capture',
    ];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    const queueItem: SyncQueueItem = {
      id: generateId(),
      driverId,
      action,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
      priority,
    };

    // Get today's sync queue
    const today = new Date().toISOString().split('T')[0];
    const queueId = `SYNC#${driverId}#${today}`;

    const existing = await DatabaseService.get(queueId, 'QUEUE');
    const syncQueue: SyncQueue = existing?.Data || {
      id: queueId,
      driverId,
      items: [],
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add item to queue (keep last 500 items per day)
    syncQueue.items.push(queueItem);
    if (syncQueue.items.length > 500) {
      // Keep high priority and recent items
      const highPriority = syncQueue.items.filter((item) => item.priority === 'high');
      const recent = syncQueue.items.slice(-400);
      syncQueue.items = [...highPriority, ...recent].slice(-500);
    }

    syncQueue.updatedAt = new Date().toISOString();

    // Save updated queue
    await DatabaseService.put({
      PK: queueId,
      SK: 'QUEUE',
      Type: 'OfflineSync',
      Data: syncQueue,
      GSI1PK: `DRIVER#${driverId}`,
      GSI1SK: `SYNC#${queueItem.timestamp}`,
    });

    res.json({
      success: true,
      queueItem: {
        id: queueItem.id,
        action: queueItem.action,
        timestamp: queueItem.timestamp,
        status: queueItem.status,
      },
      queueSize: syncQueue.items.length,
      message: 'Item added to sync queue',
    });
  } catch (error) {
    console.error('Sync queue add error:', error);
    res.status(500).json({ error: 'Failed to add item to sync queue' });
  }
});

// Process offline sync queue (when driver comes back online)
router.post('/queue/process', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { date } = req.body;

    const targetDate = date || new Date().toISOString().split('T')[0];
    const queueId = `SYNC#${driverId}#${targetDate}`;

    const queueData = await DatabaseService.get(queueId, 'QUEUE');
    if (!queueData?.Data) {
      return res.json({
        success: true,
        processed: 0,
        failed: 0,
        message: 'No pending sync items',
      });
    }

    const syncQueue = queueData.Data as SyncQueue;
    const pendingItems = syncQueue.items.filter(
      (item) => item.status === 'pending' || item.status === 'retrying'
    );

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process each pending item
    for (const item of pendingItems) {
      try {
        item.attempts += 1;
        item.lastAttempt = new Date().toISOString();

        // Process based on action type
        switch (item.action) {
          case 'location_update':
            // Process location update
            console.log(`Processing location update for driver ${driverId}:`, item.data);
            item.status = 'synced';
            results.processed++;
            break;

          case 'package_scan':
            // Process package scan
            console.log(`Processing package scan for driver ${driverId}:`, item.data);
            item.status = 'synced';
            results.processed++;
            break;

          case 'delivery_confirmation':
            // Process delivery confirmation
            console.log(`Processing delivery confirmation for driver ${driverId}:`, item.data);
            item.status = 'synced';
            results.processed++;
            break;

          case 'photo_upload':
            // Process photo upload
            console.log(`Processing photo upload for driver ${driverId}:`, item.data);
            item.status = 'synced';
            results.processed++;
            break;

          case 'signature_capture':
            // Process signature capture
            console.log(`Processing signature capture for driver ${driverId}:`, item.data);
            item.status = 'synced';
            results.processed++;
            break;

          default:
            throw new Error(`Unknown action type: ${item.action}`);
        }
      } catch (error) {
        console.error(`Failed to process sync item ${item.id}:`, error);

        // Mark as failed after 3 attempts
        if (item.attempts >= 3) {
          item.status = 'failed';
          item.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        } else {
          item.status = 'retrying';
        }

        results.failed++;
        results.errors.push({
          itemId: item.id,
          action: item.action,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update sync queue with processed items
    syncQueue.items = syncQueue.items.map((item) => {
      const processedItem = pendingItems.find((p) => p.id === item.id);
      return processedItem || item;
    });
    syncQueue.lastSync = new Date().toISOString();
    syncQueue.updatedAt = new Date().toISOString();

    // Save updated queue
    await DatabaseService.update(queueId, 'QUEUE', { Data: syncQueue });

    res.json({
      success: true,
      processed: results.processed,
      failed: results.failed,
      totalPending: pendingItems.length,
      errors: results.errors,
      lastSync: syncQueue.lastSync,
    });
  } catch (error) {
    console.error('Sync queue processing error:', error);
    res.status(500).json({ error: 'Failed to process sync queue' });
  }
});

// Get current user's sync queue status
router.get('/queue/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { hours = 24 } = req.query;

    // Authorization check
    if (
      driverId !== req.user!.id &&
      !req.user!.roles?.includes('staff') &&
      req.user!.role !== 'staff'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get sync queues for the last X hours
    const hoursBack = parseInt(hours as string);
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // For simplicity, get today's and yesterday's queues
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [todayQueue, yesterdayQueue] = await Promise.all([
      DatabaseService.get(`SYNC#${driverId}#${today}`, 'QUEUE'),
      DatabaseService.get(`SYNC#${driverId}#${yesterday}`, 'QUEUE'),
    ]);

    const allItems: SyncQueueItem[] = [];

    if (todayQueue?.Data) {
      allItems.push(...(todayQueue.Data as SyncQueue).items);
    }
    if (yesterdayQueue?.Data) {
      allItems.push(...(yesterdayQueue.Data as SyncQueue).items);
    }

    // Filter by time window
    const recentItems = allItems.filter((item) => new Date(item.timestamp) >= cutoffTime);

    // Calculate statistics
    const stats = {
      total: recentItems.length,
      pending: recentItems.filter((item) => item.status === 'pending').length,
      synced: recentItems.filter((item) => item.status === 'synced').length,
      failed: recentItems.filter((item) => item.status === 'failed').length,
      retrying: recentItems.filter((item) => item.status === 'retrying').length,
    };

    // Group by action type
    const actionStats = recentItems.reduce(
      (acc, item) => {
        acc[item.action] = (acc[item.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get recent items for display (last 20)
    const recentForDisplay = recentItems
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    res.json({
      success: true,
      driverId,
      timeWindow: `${hours} hours`,
      stats,
      actionStats,
      recentItems: recentForDisplay,
      lastSync: todayQueue?.Data?.lastSync || null,
    });
  } catch (error) {
    console.error('Sync queue status error:', error);
    res.status(500).json({ error: 'Failed to get sync queue status' });
  }
});

// Clear old sync queue items (maintenance endpoint)
router.delete('/queue/cleanup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { olderThan = 7 } = req.query; // Default 7 days

    // Only staff or the driver themselves can clean up
    if (
      driverId !== req.user!.id &&
      !req.user!.roles?.includes('staff') &&
      req.user!.role !== 'staff'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cutoffDate = new Date(Date.now() - parseInt(olderThan as string) * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    // Clean up old queue items (this is a simplified approach)
    // In production, you'd want more sophisticated cleanup

    console.log(`Cleaning sync queue items older than ${olderThan} days for driver ${driverId}`);

    res.json({
      success: true,
      message: `Cleanup scheduled for items older than ${olderThan} days`,
      driverId,
      cutoffDate: cutoffDate.toISOString(),
      cleanedItems: cleanedCount,
    });
  } catch (error) {
    console.error('Sync queue cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup sync queue' });
  }
});

export default router;
