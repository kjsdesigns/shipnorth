import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PackageModel } from '../models/package';
import { LoadModel } from '../models/load';
import { DatabaseService, generateId } from '../services/database';

const router = Router();

interface ScanResult {
  id: string;
  driverId: string;
  loadId?: string;
  packageId?: string;
  scanType: 'barcode' | 'qr_code' | 'manual';
  scannedValue: string;
  success: boolean;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

interface ScanHistory {
  id: string;
  driverId: string;
  scans: ScanResult[];
  createdAt: string;
  lastUpdated: string;
}

// Scan package barcode/QR code
router.post('/scan', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { scannedValue, scanType = 'barcode', lat, lng, notes, loadId } = req.body;
    const driverId = req.user!.id;

    if (!scannedValue) {
      return res.status(400).json({ error: 'Scanned value is required' });
    }

    // Try to find package by tracking number or barcode
    const packages = await PackageModel.search(scannedValue, 50);
    const matchedPackage = packages.find(
      (pkg: any) =>
        pkg.trackingNumber === scannedValue ||
        pkg.barcode === scannedValue ||
        pkg.id === scannedValue
    );

    const scanResult: ScanResult = {
      id: generateId(),
      driverId,
      loadId,
      packageId: matchedPackage?.id,
      scanType,
      scannedValue,
      success: !!matchedPackage,
      timestamp: new Date().toISOString(),
      location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined,
      notes,
    };

    // Store scan history
    const today = new Date().toISOString().split('T')[0];
    const scanHistoryId = `SCAN#${driverId}#${today}`;

    try {
      const existing = await DatabaseService.get(scanHistoryId, 'SCAN_HISTORY');
      const scanHistory: ScanHistory = existing?.Data || {
        id: scanHistoryId,
        driverId,
        scans: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      // Add scan result (keep last 200 scans per day)
      scanHistory.scans.push(scanResult);
      if (scanHistory.scans.length > 200) {
        scanHistory.scans = scanHistory.scans.slice(-200);
      }
      scanHistory.lastUpdated = new Date().toISOString();

      // Save scan history
      await DatabaseService.put({
        PK: scanHistoryId,
        SK: 'SCAN_HISTORY',
        Type: 'PackageScanning',
        Data: scanHistory,
        GSI1PK: `DRIVER#${driverId}`,
        GSI1SK: `SCAN#${scanResult.timestamp}`,
      });

      // If package found and driver has a load, verify package is in driver's load
      let packageInLoad = false;
      if (matchedPackage && loadId) {
        const load = await LoadModel.findById(loadId);
        if (load) {
          // Check if package is assigned to this load
          packageInLoad = matchedPackage.loadId === loadId;
        }
      }

      res.json({
        success: true,
        scanResult,
        package: matchedPackage
          ? {
              id: matchedPackage.id,
              trackingNumber: matchedPackage.trackingNumber,
              recipientName: matchedPackage.shipTo?.name,
              status: matchedPackage.shipmentStatus,
              loadAssigned: packageInLoad,
            }
          : null,
        message: matchedPackage
          ? 'Package found and scanned successfully'
          : 'Package not found in system',
      });
    } catch (storageError) {
      // Even if storage fails, return scan result
      console.error('Scan history storage failed:', storageError);
      res.json({
        success: true,
        scanResult,
        package: matchedPackage
          ? {
              id: matchedPackage.id,
              trackingNumber: matchedPackage.trackingNumber,
              recipientName: matchedPackage.shipTo?.name,
              status: matchedPackage.shipmentStatus,
            }
          : null,
        warning: 'Scan successful but history storage failed',
      });
    }
  } catch (error) {
    console.error('Package scanning error:', error);
    res.status(500).json({ error: 'Failed to process package scan' });
  }
});

// Get current user's scan history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    const { date, limit = 50 } = req.query;

    // Authorization check
    if (
      driverId !== req.user!.id &&
      !req.user!.roles?.includes('staff') &&
      req.user!.role !== 'staff'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const targetDate = date
      ? new Date(date as string).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const scanHistoryId = `SCAN#${driverId}#${targetDate}`;
    const scanHistory = await DatabaseService.get(scanHistoryId, 'SCAN_HISTORY');

    if (!scanHistory?.Data) {
      return res.json({
        driverId,
        date: targetDate,
        scans: [],
        totalScans: 0,
      });
    }

    const history = scanHistory.Data as ScanHistory;
    const recentScans = history.scans
      .slice(-parseInt(limit as string))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      driverId,
      date: targetDate,
      scans: recentScans,
      totalScans: history.scans.length,
      lastUpdated: history.lastUpdated,
    });
  } catch (error) {
    console.error('Scan history retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve scan history' });
  }
});

// Manual package lookup (when barcode scanning fails)
router.get('/lookup/:query', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.params;
    const { loadId } = req.query;

    if (!query || query.length < 3) {
      return res.status(400).json({ error: 'Search query must be at least 3 characters' });
    }

    // Search packages by various fields
    const packages = await PackageModel.search(query, 20);

    // If loadId provided, prioritize packages in that load
    let results = packages;
    if (loadId) {
      const loadPackages = packages.filter((pkg: any) => pkg.loadId === loadId);
      const otherPackages = packages.filter((pkg: any) => pkg.loadId !== loadId);
      results = [...loadPackages, ...otherPackages];
    }

    // Format results for driver interface
    const formattedResults = results.map((pkg: any) => ({
      id: pkg.id,
      trackingNumber: pkg.trackingNumber,
      barcode: pkg.barcode,
      recipientName: pkg.shipTo?.name,
      address: pkg.shipTo?.addressId ? 'Address on file' : 'No address',
      status: pkg.shipmentStatus,
      loadId: pkg.loadId,
      inCurrentLoad: pkg.loadId === loadId,
    }));

    res.json({
      success: true,
      query,
      results: formattedResults,
      totalFound: results.length,
    });
  } catch (error) {
    console.error('Package lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup packages' });
  }
});

// Validate package for delivery (used during delivery process)
router.post(
  '/validate-delivery/:packageId',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { packageId } = req.params;
      const driverId = req.user!.id;

      const pkg = await PackageModel.findById(packageId);
      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Check if package is assigned to driver's current load
      const driverLoads = await LoadModel.findByDriver(driverId);
      const currentLoad = driverLoads.find(
        (load) => load.status === 'in_transit' && load.id === pkg.loadId
      );

      if (!currentLoad) {
        return res.status(403).json({
          error: 'Package not assigned to your current load',
          package: {
            id: pkg.id,
            trackingNumber: pkg.trackingNumber,
            status: pkg.shipmentStatus,
          },
        });
      }

      // Package is valid for delivery
      res.json({
        success: true,
        package: {
          id: pkg.id,
          trackingNumber: pkg.trackingNumber,
          recipientName: pkg.shipTo?.name,
          status: pkg.shipmentStatus,
          loadId: pkg.loadId,
          validForDelivery: pkg.shipmentStatus === 'in_transit' || pkg.shipmentStatus === 'ready',
        },
        load: {
          id: currentLoad.id,
          driverName: currentLoad.driverName,
        },
      });
    } catch (error) {
      console.error('Package delivery validation error:', error);
      res.status(500).json({ error: 'Failed to validate package for delivery' });
    }
  }
);

export default router;
