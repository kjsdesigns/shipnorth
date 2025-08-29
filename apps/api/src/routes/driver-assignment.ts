import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { LoadModel } from '../models/load';
import { UserModel } from '../models/user';
import { DatabaseService } from '../services/database';

const router = Router();

// Get available drivers for load assignment
router.get('/available-drivers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only staff/admin can view available drivers
    const userRoles = req.user!.roles || [req.user!.role];
    if (!userRoles.includes('staff') && !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Access denied - staff access required' });
    }

    const { includeAssigned = false, status = 'active' } = req.query;

    // Get all users with driver role
    const allUsers = await UserModel.list(undefined, 200); // Get enough users to filter
    const drivers = allUsers.filter((user: any) => {
      const userRoles = user.roles || [user.role];
      return userRoles.includes('driver') && user.status === status;
    });

    // If not including assigned drivers, filter out those with active loads
    let availableDrivers = drivers;
    if (includeAssigned !== 'true') {
      const driversWithLoads = new Set();

      // Get all loads with assigned drivers
      const loads = await LoadModel.list(500);
      loads.forEach((load: any) => {
        if (load.driverId && (load.status === 'planned' || load.status === 'in_transit')) {
          driversWithLoads.add(load.driverId);
        }
      });

      availableDrivers = drivers.filter((driver) => !driversWithLoads.has(driver.id));
    }

    // Format driver data for selection
    const formattedDrivers = availableDrivers.map((driver: any) => ({
      id: driver.id,
      name: `${driver.firstName} ${driver.lastName}`,
      email: driver.email,
      roles: driver.roles || [driver.role],
      isMultiRole: driver.roles && driver.roles.length > 1,
      canAccessStaff: (driver.roles || [driver.role]).includes('staff'),
      lastLogin: driver.lastLogin,
      status: driver.status,
    }));

    // Sort by availability (multi-role drivers last since they may be busy with staff duties)
    formattedDrivers.sort((a, b) => {
      if (a.isMultiRole && !b.isMultiRole) return 1;
      if (!a.isMultiRole && b.isMultiRole) return -1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      drivers: formattedDrivers,
      totalDrivers: drivers.length,
      availableDrivers: availableDrivers.length,
      criteria: {
        includeAssigned: includeAssigned === 'true',
        status,
      },
    });
  } catch (error) {
    console.error('Available drivers retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve available drivers' });
  }
});

// Assign driver to load
router.post('/assign-driver', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { loadId, driverId } = req.body;

    // Only staff/admin can assign drivers
    const userRoles = req.user!.roles || [req.user!.role];
    if (!userRoles.includes('staff') && !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Access denied - staff access required' });
    }

    if (!loadId || !driverId) {
      return res.status(400).json({ error: 'Load ID and driver ID required' });
    }

    // Verify load exists
    const load = await LoadModel.findById(loadId);
    if (!load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    // Verify driver exists and has driver role
    const driver = await UserModel.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverRoles = driver.roles || [driver.role];
    if (!driverRoles.includes('driver')) {
      return res.status(400).json({
        error: 'User does not have driver role',
        userRoles: driverRoles,
      });
    }

    // Check if driver is already assigned to another active load
    const driverLoads = await LoadModel.findByDriver(driverId);
    const activeLoad = driverLoads.find((l) => l.status === 'planned' || l.status === 'in_transit');

    if (activeLoad && activeLoad.id !== loadId) {
      return res.status(409).json({
        error: 'Driver already assigned to another active load',
        conflictingLoad: {
          id: activeLoad.id,
          status: activeLoad.status,
          departureDate: activeLoad.departureDate,
        },
      });
    }

    // Assign driver to load
    const success = await LoadModel.assignDriver(loadId, driverId);
    if (!success) {
      return res.status(500).json({ error: 'Failed to assign driver to load' });
    }

    // Log the assignment
    console.log(
      `🚛 Driver assigned: ${driver.firstName} ${driver.lastName} → Load ${loadId} by ${req.user!.email}`
    );

    res.json({
      success: true,
      assignment: {
        loadId,
        driverId,
        driverName: `${driver.firstName} ${driver.lastName}`,
        driverRoles: driverRoles,
        assignedBy: req.user!.id,
        assignedAt: new Date().toISOString(),
      },
      message: `Driver ${driver.firstName} ${driver.lastName} assigned to load ${loadId}`,
    });
  } catch (error) {
    console.error('Driver assignment error:', error);
    res.status(500).json({ error: 'Failed to assign driver to load' });
  }
});

// Unassign driver from load
router.post('/unassign-driver', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { loadId } = req.body;

    // Only staff/admin can unassign drivers
    const userRoles = req.user!.roles || [req.user!.role];
    if (!userRoles.includes('staff') && !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Access denied - staff access required' });
    }

    if (!loadId) {
      return res.status(400).json({ error: 'Load ID required' });
    }

    // Verify load exists
    const load = await LoadModel.findById(loadId);
    if (!load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    if (!load.driverId) {
      return res.status(400).json({ error: 'Load has no assigned driver' });
    }

    const previousDriverId = load.driverId;

    // Unassign driver
    const success = await LoadModel.update(loadId, {
      driverId: undefined,
      status: 'planned' as const,
    });

    if (!success) {
      return res.status(500).json({ error: 'Failed to unassign driver from load' });
    }

    console.log(
      `🚛 Driver unassigned: Load ${loadId} (was ${previousDriverId}) by ${req.user!.email}`
    );

    res.json({
      success: true,
      loadId,
      previousDriverId,
      unassignedBy: req.user!.id,
      unassignedAt: new Date().toISOString(),
      message: `Driver unassigned from load ${loadId}`,
    });
  } catch (error) {
    console.error('Driver unassignment error:', error);
    res.status(500).json({ error: 'Failed to unassign driver from load' });
  }
});

// Get driver workload summary
router.get('/driver-workload/:driverId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { driverId } = req.params;

    // Authorization: staff can view any driver, drivers can view themselves
    const userRoles = req.user!.roles || [req.user!.role];
    if (driverId !== req.user!.id && !userRoles.includes('staff') && !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get driver info
    const driver = await UserModel.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Get driver's loads
    const loads = await LoadModel.findByDriver(driverId);

    // Calculate workload metrics
    const activeLoads = loads.filter((l) => l.status === 'planned' || l.status === 'in_transit');
    const completedLoads = loads.filter((l) => l.status === 'complete');

    const totalPackages = loads.reduce((sum, load) => sum + (load.totalPackages || 0), 0);
    const totalDistance = loads.reduce((sum, load) => sum + (load.estimatedDistance || 0), 0);

    const workloadSummary = {
      driverId,
      driverName: `${driver.firstName} ${driver.lastName}`,
      driverRoles: driver.roles || [driver.role],
      isMultiRole: driver.roles && driver.roles.length > 1,
      workload: {
        activeLoads: activeLoads.length,
        completedLoads: completedLoads.length,
        totalLoads: loads.length,
        totalPackages,
        totalDistance: Math.round(totalDistance * 100) / 100,
      },
      availability: {
        available: activeLoads.length === 0,
        capacity:
          activeLoads.length < 3 ? 'available' : activeLoads.length < 5 ? 'busy' : 'overloaded',
        nextAvailable:
          activeLoads.length > 0
            ? Math.min(
                ...activeLoads.map((l) =>
                  new Date(l.departureDate || l.defaultDeliveryDate || new Date()).getTime()
                )
              )
            : Date.now(),
      },
      loads: loads.map((load) => ({
        id: load.id,
        status: load.status,
        departureDate: load.departureDate,
        packages: load.totalPackages || 0,
        distance: load.estimatedDistance || 0,
      })),
    };

    res.json({
      success: true,
      workload: workloadSummary,
    });
  } catch (error) {
    console.error('Driver workload retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve driver workload' });
  }
});

// Get optimal driver recommendations for a load
router.get('/recommend-drivers/:loadId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { loadId } = req.params;

    // Only staff/admin can get recommendations
    const userRoles = req.user!.roles || [req.user!.role];
    if (!userRoles.includes('staff') && !userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Access denied - staff access required' });
    }

    // Verify load exists
    const load = await LoadModel.findById(loadId);
    if (!load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    // Get all available drivers
    const allUsers = await UserModel.list(undefined, 200);
    const drivers = allUsers.filter((user: any) => {
      const userRoles = user.roles || [user.role];
      return userRoles.includes('driver') && user.status === 'active';
    });

    // Score each driver based on availability and suitability
    const recommendations = [];

    for (const driver of drivers) {
      const driverLoads = await LoadModel.findByDriver(driver.id);
      const activeLoads = driverLoads.filter(
        (l) => l.status === 'planned' || l.status === 'in_transit'
      );

      let score = 100; // Start with perfect score
      let reasons = [];

      // Availability scoring
      if (activeLoads.length === 0) {
        reasons.push('✅ Fully available');
      } else if (activeLoads.length <= 2) {
        score -= 20;
        reasons.push(`⚠️ Has ${activeLoads.length} active load(s)`);
      } else {
        score -= 50;
        reasons.push(`🚨 Overloaded with ${activeLoads.length} loads`);
      }

      // Multi-role penalty (may be busy with staff duties)
      if (driver.roles && driver.roles.length > 1) {
        score -= 10;
        reasons.push('ℹ️ Multi-role user (may have other duties)');
      }

      // Recent activity bonus
      if (driver.lastLogin && new Date(driver.lastLogin) > new Date(Date.now() - 86400000)) {
        score += 10;
        reasons.push('✅ Recently active');
      }

      recommendations.push({
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        email: driver.email,
        roles: driver.roles || [driver.role],
        score: Math.max(0, score),
        availability:
          activeLoads.length === 0 ? 'available' : activeLoads.length <= 2 ? 'busy' : 'overloaded',
        activeLoads: activeLoads.length,
        reasons,
        lastLogin: driver.lastLogin,
      });
    }

    // Sort by score (highest first)
    recommendations.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      loadId,
      recommendations,
      totalDrivers: drivers.length,
      bestMatch: recommendations[0] || null,
    });
  } catch (error) {
    console.error('Driver recommendation error:', error);
    res.status(500).json({ error: 'Failed to get driver recommendations' });
  }
});

export default router;
