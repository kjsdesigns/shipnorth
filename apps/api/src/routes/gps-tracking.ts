import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { LoadModel } from '../models/load';
import { DatabaseService, generateId } from '../services/database';

const router = Router();

interface LocationUpdate {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  isManual: boolean;
  address?: string;
  speed?: number;
  heading?: number;
}

interface GPSTrackingHistory {
  id: string;
  driverId: string;
  loadId?: string;
  locations: LocationUpdate[];
  createdAt: string;
  lastUpdated: string;
}

// Update driver location
router.post('/location', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, accuracy, isManual = false, address, speed, heading } = req.body;
    const driverId = req.user!.id;

    // Validate coordinates
    if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Valid latitude and longitude required' });
    }

    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const locationUpdate: LocationUpdate = {
      lat,
      lng,
      accuracy: accuracy || 0,
      timestamp: new Date().toISOString(),
      isManual,
      address,
      speed,
      heading,
    };

    // Get driver's current load if any
    const driverLoads = await LoadModel.findByDriver(driverId);
    const currentLoad = driverLoads.find(
      (load) => load.status === 'in_transit' || load.status === 'planned'
    );

    // Store location in GPS tracking history
    const trackingId = `GPS#${driverId}#${new Date().toISOString().split('T')[0]}`;

    // Get existing tracking for today
    const existing = await DatabaseService.get(trackingId, 'LOCATION_HISTORY');
    const trackingHistory: GPSTrackingHistory = existing?.Data || {
      id: trackingId,
      driverId,
      loadId: currentLoad?.id,
      locations: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Add new location (keep last 100 locations per day)
    trackingHistory.locations.push(locationUpdate);
    if (trackingHistory.locations.length > 100) {
      trackingHistory.locations = trackingHistory.locations.slice(-100);
    }
    trackingHistory.lastUpdated = new Date().toISOString();
    trackingHistory.loadId = currentLoad?.id || trackingHistory.loadId;

    // Save updated tracking history
    await DatabaseService.put({
      PK: trackingId,
      SK: 'LOCATION_HISTORY',
      Type: 'GPSTracking',
      Data: trackingHistory,
      GSI1PK: `DRIVER#${driverId}`,
      GSI1SK: `GPS#${new Date().toISOString()}`,
    });

    // Update current load location if driver has active load
    if (currentLoad) {
      await LoadModel.addLocationTracking(currentLoad.id, lat, lng, isManual, driverId, address);
    }

    res.json({
      success: true,
      location: locationUpdate,
      loadId: currentLoad?.id,
      trackingId,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('GPS location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get current user's location history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { date, limit = 24 } = req.query;

    const targetDate = date
      ? new Date(date as string).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const trackingId = `GPS#${driverId}#${targetDate}`;
    const trackingHistory = await DatabaseService.get(trackingId, 'LOCATION_HISTORY');

    if (!trackingHistory?.Data) {
      return res.json({
        driverId,
        date: targetDate,
        locations: [],
        totalLocations: 0,
      });
    }

    const history = trackingHistory.Data as GPSTrackingHistory;
    const recentLocations = history.locations
      .slice(-parseInt(limit as string))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      driverId,
      date: targetDate,
      locations: recentLocations,
      totalLocations: history.locations.length,
      loadId: history.loadId,
      lastUpdated: history.lastUpdated,
    });
  } catch (error) {
    console.error('GPS history retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve location history' });
  }
});

// Get current user's location
router.get('/current', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user!.id;

    const today = new Date().toISOString().split('T')[0];
    const trackingId = `GPS#${driverId}#${today}`;
    const trackingHistory = await DatabaseService.get(trackingId, 'LOCATION_HISTORY');

    if (!trackingHistory?.Data) {
      return res.json({
        driverId,
        currentLocation: null,
        lastUpdate: null,
      });
    }

    const history = trackingHistory.Data as GPSTrackingHistory;
    const currentLocation = history.locations[history.locations.length - 1] || null;

    res.json({
      driverId,
      currentLocation,
      lastUpdate: history.lastUpdated,
      loadId: history.loadId,
    });
  } catch (error) {
    console.error('Current location retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve current location' });
  }
});

export default router;
