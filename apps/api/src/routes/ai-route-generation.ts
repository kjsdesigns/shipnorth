import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { LoadModel } from '../models/load-postgres';
import { PackageModel } from '../models/package-postgres';
import { AddressModel } from '../models/address';
import { OptimizedRouteModel } from '../models/optimized-route';
import { RouteOptimizationService } from '../services/route-optimization';
import { DatabaseService, generateId } from '../services/database';

const router = Router();

interface RouteVersion {
  id: string;
  loadId: string;
  version: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdBy: string; // User ID who created this version
  createdByRole: 'staff' | 'driver';
  routeData: any; // Full route optimization data
  modifications?: {
    modifiedBy: string;
    modifiedAt: string;
    changes: string[];
    reason?: string;
  }[];
  performance?: {
    estimatedDuration: number;
    actualDuration?: number;
    estimatedDistance: number;
    actualDistance?: number;
    fuelEfficiency?: number;
    onTimePerformance?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Generate AI-optimized route for a load
router.post(
  '/loads/:loadId/generate-route',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { loadId } = req.params;
      const { options = {}, saveAsActive = false, notes = '' } = req.body;
      const userId = req.user!.id;
      const userRole =
        req.user!.roles?.includes('staff') || req.user!.role === 'staff' ? 'staff' : 'driver';

      // Verify load exists
      const load = await LoadModel.findById(loadId);
      if (!load) {
        return res.status(404).json({ error: 'Load not found' });
      }

      // Verify user has access to this load
      if (userRole === 'driver' && load.driverId !== userId) {
        return res.status(403).json({ error: 'Access denied - load not assigned to you' });
      }

      console.log(`🤖 Generating AI route for load ${loadId} by ${userRole} ${userId}`);

      // Generate optimized route using RouteOptimizationService
      const routeData = await RouteOptimizationService.generateOptimizedRoute(loadId, {
        maxDailyDrivingHours: options.maxDailyDrivingHours || 10,
        prioritizeDeliveryWindows: options.prioritizeDeliveryWindows !== false,
        avoidTollRoads: options.avoidTollRoads || false,
        optimizeForFuelEfficiency: options.optimizeForFuelEfficiency !== false,
        checkTrafficConditions: options.checkTrafficConditions !== false,
        allowBacktracking: options.allowBacktracking || false,
        ...options,
      });

      if (!routeData) {
        return res.status(500).json({ error: 'Failed to generate route optimization' });
      }

      // Get existing route versions for this load
      const existingRoutes = await OptimizedRouteModel.findByLoadId(loadId);
      const nextVersion = Math.max(0, ...existingRoutes.map((r) => r.version)) + 1;

      // Create new route version
      const routeVersion: RouteVersion = {
        id: generateId(),
        loadId,
        version: nextVersion,
        status: saveAsActive ? 'active' : 'draft',
        createdBy: userId,
        createdByRole: userRole,
        routeData,
        modifications: [],
        performance: {
          estimatedDuration: routeData.totalDuration || 0,
          estimatedDistance: routeData.totalDistance || 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save route version
      await DatabaseService.put({
        PK: `ROUTE_VERSION#${routeVersion.id}`,
        SK: 'METADATA',
        Type: 'RouteVersion',
        Data: routeVersion,
        GSI1PK: `LOAD#${loadId}`,
        GSI1SK: `VERSION#${nextVersion.toString().padStart(3, '0')}#${routeVersion.id}`,
      });

      // If saving as active, deactivate other versions
      if (saveAsActive) {
        for (const existingRoute of existingRoutes) {
          if (existingRoute.status === 'active') {
            await DatabaseService.update(`ROUTE_VERSION#${existingRoute.id}`, 'METADATA', {
              'Data.status': 'archived',
              'Data.updatedAt': new Date().toISOString(),
            });
          }
        }
      }

      // Calculate optimization improvements
      const previousBestRoute = existingRoutes
        .filter((r) => r.performance?.estimatedDistance)
        .sort(
          (a, b) =>
            (a.performance?.estimatedDistance || 999) - (b.performance?.estimatedDistance || 999)
        )[0];

      const improvements = previousBestRoute
        ? {
            distanceImprovement:
              (((previousBestRoute.performance?.estimatedDistance || 0) - routeData.totalDistance) /
                (previousBestRoute.performance?.estimatedDistance || 1)) *
              100,
            timeImprovement:
              (((previousBestRoute.performance?.estimatedDuration || 0) - routeData.totalDuration) /
                (previousBestRoute.performance?.estimatedDuration || 1)) *
              100,
          }
        : null;

      res.json({
        success: true,
        route: {
          id: routeVersion.id,
          version: nextVersion,
          status: routeVersion.status,
          loadId,
          createdBy: userRole,
          optimizationScore: 85, // Default optimization score
          totalDistance: routeData.totalDistance,
          totalDuration: routeData.totalDuration,
          stops: routeData.cityClusters?.length || 0,
          packages:
            routeData.cityClusters?.reduce((total, cluster) => total + cluster.totalPackages, 0) ||
            0,
        },
        routeData,
        improvements,
        previousVersions: existingRoutes.length,
        message: `AI route generated successfully${saveAsActive ? ' and activated' : ''}`,
      });
    } catch (error) {
      console.error('AI route generation error:', error);
      res.status(500).json({
        error: 'Failed to generate AI route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get all route versions for a load
router.get('/loads/:loadId/routes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { loadId } = req.params;
    const { includeData = false } = req.query;

    // Verify load exists and user has access
    const load = await LoadModel.findById(loadId);
    if (!load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    const userRole =
      req.user!.roles?.includes('staff') || req.user!.role === 'staff' ? 'staff' : 'driver';
    if (userRole === 'driver' && load.driverId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all route versions for this load
    const routeItems = await DatabaseService.queryByGSI('GSI1', `LOAD#${loadId}`);
    const routeVersions = routeItems
      .filter((item: any) => item.Type === 'RouteVersion')
      .map((item: any) => item.Data as RouteVersion)
      .sort((a, b) => b.version - a.version);

    // Format response
    const routes = routeVersions.map((route) => ({
      id: route.id,
      version: route.version,
      status: route.status,
      createdBy: route.createdByRole,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      performance: route.performance,
      optimizationScore: route.routeData?.optimizationScore || 0,
      totalStops: route.routeData?.cityClusters?.length || 0,
      modifications: route.modifications?.length || 0,
      ...(includeData === 'true' ? { routeData: route.routeData } : {}),
    }));

    const activeRoute = routes.find((r) => r.status === 'active');

    res.json({
      success: true,
      loadId,
      routes,
      totalVersions: routes.length,
      activeRoute: activeRoute || null,
      canEdit: userRole === 'staff' || load.driverId === req.user!.id,
    });
  } catch (error) {
    console.error('Route versions retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve route versions' });
  }
});

// Modify existing route (create new version with modifications)
router.post('/routes/:routeId/modify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { routeId } = req.params;
    const { modifications, reason, saveAsActive = true } = req.body;
    const userId = req.user!.id;
    const userRole =
      req.user!.roles?.includes('staff') || req.user!.role === 'staff' ? 'staff' : 'driver';

    if (!modifications || typeof modifications !== 'object') {
      return res.status(400).json({ error: 'Modifications object required' });
    }

    // Get original route version
    const originalRoute = await DatabaseService.get(`ROUTE_VERSION#${routeId}`, 'METADATA');
    if (!originalRoute?.Data) {
      return res.status(404).json({ error: 'Route version not found' });
    }

    const original = originalRoute.Data as RouteVersion;

    // Verify user has access to modify this route
    const load = await LoadModel.findById(original.loadId);
    if (!load) {
      return res.status(404).json({ error: 'Associated load not found' });
    }

    if (userRole === 'driver' && load.driverId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Apply modifications to route data
    const modifiedRouteData = {
      ...original.routeData,
      ...modifications,
      lastModified: new Date().toISOString(),
      modifiedBy: userId,
      modifiedByRole: userRole,
    };

    // Get next version number
    const existingRoutes = await OptimizedRouteModel.findByLoadId(original.loadId);
    const nextVersion = Math.max(0, ...existingRoutes.map((r) => r.version)) + 1;

    // Create new route version with modifications
    const newRouteVersion: RouteVersion = {
      id: generateId(),
      loadId: original.loadId,
      version: nextVersion,
      status: saveAsActive ? 'active' : 'draft',
      createdBy: userId,
      createdByRole: userRole,
      routeData: modifiedRouteData,
      modifications: [
        ...(original.modifications || []),
        {
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
          changes: Object.keys(modifications),
          reason,
        },
      ],
      performance: {
        estimatedDuration:
          modifiedRouteData.totalDuration || original.performance?.estimatedDuration || 0,
        estimatedDistance:
          modifiedRouteData.totalDistance || original.performance?.estimatedDistance || 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save new route version
    await DatabaseService.put({
      PK: `ROUTE_VERSION#${newRouteVersion.id}`,
      SK: 'METADATA',
      Type: 'RouteVersion',
      Data: newRouteVersion,
      GSI1PK: `LOAD#${original.loadId}`,
      GSI1SK: `VERSION#${nextVersion.toString().padStart(3, '0')}#${newRouteVersion.id}`,
    });

    // If saving as active, deactivate other versions
    if (saveAsActive) {
      for (const existingRoute of existingRoutes) {
        if (existingRoute.status === 'active') {
          await DatabaseService.update(`ROUTE_VERSION#${existingRoute.id}`, 'METADATA', {
            'Data.status': 'archived',
            'Data.updatedAt': new Date().toISOString(),
          });
        }
      }
    }

    res.json({
      success: true,
      route: {
        id: newRouteVersion.id,
        version: nextVersion,
        status: newRouteVersion.status,
        loadId: original.loadId,
        basedOn: original.version,
        modifications: modifications,
        modifiedBy: userRole,
      },
      routeData: modifiedRouteData,
      message: `Route modified and saved as version ${nextVersion}`,
    });
  } catch (error) {
    console.error('Route modification error:', error);
    res.status(500).json({ error: 'Failed to modify route' });
  }
});

// Activate a specific route version
router.post('/routes/:routeId/activate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { routeId } = req.params;
    const userId = req.user!.id;
    const userRole =
      req.user!.roles?.includes('staff') || req.user!.role === 'staff' ? 'staff' : 'driver';

    // Get route version
    const routeData = await DatabaseService.get(`ROUTE_VERSION#${routeId}`, 'METADATA');
    if (!routeData?.Data) {
      return res.status(404).json({ error: 'Route version not found' });
    }

    const route = routeData.Data as RouteVersion;

    // Verify user has access
    const load = await LoadModel.findById(route.loadId);
    if (!load) {
      return res.status(404).json({ error: 'Associated load not found' });
    }

    if (userRole === 'driver' && load.driverId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Deactivate other versions
    const existingRoutes = await DatabaseService.queryByGSI('GSI1', `LOAD#${route.loadId}`);
    const routeVersions = existingRoutes
      .filter((item: any) => item.Type === 'RouteVersion')
      .map((item: any) => item.Data as RouteVersion);

    for (const existingRoute of routeVersions) {
      if (existingRoute.status === 'active' && existingRoute.id !== routeId) {
        await DatabaseService.update(`ROUTE_VERSION#${existingRoute.id}`, 'METADATA', {
          'Data.status': 'archived',
          'Data.updatedAt': new Date().toISOString(),
        });
      }
    }

    // Activate this version
    await DatabaseService.update(`ROUTE_VERSION#${routeId}`, 'METADATA', {
      'Data.status': 'active',
      'Data.updatedAt': new Date().toISOString(),
    });

    // Update load with active route information
    await LoadModel.update(route.loadId, {
      routeOptimized: true,
      estimatedDistance: route.performance?.estimatedDistance,
      estimatedDuration: route.performance?.estimatedDuration,
    });

    res.json({
      success: true,
      route: {
        id: routeId,
        version: route.version,
        status: 'active',
        loadId: route.loadId,
        activatedBy: userRole,
      },
      message: `Route version ${route.version} activated successfully`,
    });
  } catch (error) {
    console.error('Route activation error:', error);
    res.status(500).json({ error: 'Failed to activate route' });
  }
});

// Get active route for a load
router.get('/loads/:loadId/active-route', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { loadId } = req.params;
    const { includeFullData = false } = req.query;

    // Verify load exists and user has access
    const load = await LoadModel.findById(loadId);
    if (!load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    const userRole =
      req.user!.roles?.includes('staff') || req.user!.role === 'staff' ? 'staff' : 'driver';
    if (userRole === 'driver' && load.driverId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find active route
    const routeItems = await DatabaseService.queryByGSI('GSI1', `LOAD#${loadId}`);
    const activeRouteItem = routeItems.find(
      (item: any) => item.Type === 'RouteVersion' && item.Data.status === 'active'
    );

    if (!activeRouteItem) {
      return res.json({
        success: true,
        loadId,
        activeRoute: null,
        message: 'No active route found for this load',
      });
    }

    const activeRoute = activeRouteItem.Data as RouteVersion;

    res.json({
      success: true,
      loadId,
      activeRoute: {
        id: activeRoute.id,
        version: activeRoute.version,
        status: activeRoute.status,
        createdBy: activeRoute.createdByRole,
        createdAt: activeRoute.createdAt,
        performance: activeRoute.performance,
        optimizationScore: activeRoute.routeData?.optimizationScore || 0,
        totalStops: activeRoute.routeData?.cityClusters?.length || 0,
        modifications: activeRoute.modifications?.length || 0,
        ...(includeFullData === 'true' ? { routeData: activeRoute.routeData } : {}),
      },
    });
  } catch (error) {
    console.error('Active route retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve active route' });
  }
});

// Compare route versions
router.get(
  '/routes/:routeId/compare/:compareWithId',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { routeId, compareWithId } = req.params;

      // Get both route versions
      const [route1Data, route2Data] = await Promise.all([
        DatabaseService.get(`ROUTE_VERSION#${routeId}`, 'METADATA'),
        DatabaseService.get(`ROUTE_VERSION#${compareWithId}`, 'METADATA'),
      ]);

      if (!route1Data?.Data || !route2Data?.Data) {
        return res.status(404).json({ error: 'One or both route versions not found' });
      }

      const route1 = route1Data.Data as RouteVersion;
      const route2 = route2Data.Data as RouteVersion;

      // Verify both routes belong to same load
      if (route1.loadId !== route2.loadId) {
        return res.status(400).json({ error: 'Cannot compare routes from different loads' });
      }

      // Verify user has access to the load
      const load = await LoadModel.findById(route1.loadId);
      if (!load) {
        return res.status(404).json({ error: 'Load not found' });
      }

      const userRole =
        req.user!.roles?.includes('staff') || req.user!.role === 'staff' ? 'staff' : 'driver';
      if (userRole === 'driver' && load.driverId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Calculate comparison metrics
      const comparison = {
        distance: {
          route1: route1.performance?.estimatedDistance || 0,
          route2: route2.performance?.estimatedDistance || 0,
          difference:
            (route1.performance?.estimatedDistance || 0) -
            (route2.performance?.estimatedDistance || 0),
          improvement:
            route1.performance?.estimatedDistance && route2.performance?.estimatedDistance
              ? ((route2.performance.estimatedDistance - route1.performance.estimatedDistance) /
                  route2.performance.estimatedDistance) *
                100
              : 0,
        },
        duration: {
          route1: route1.performance?.estimatedDuration || 0,
          route2: route2.performance?.estimatedDuration || 0,
          difference:
            (route1.performance?.estimatedDuration || 0) -
            (route2.performance?.estimatedDuration || 0),
          improvement:
            route1.performance?.estimatedDuration && route2.performance?.estimatedDuration
              ? ((route2.performance.estimatedDuration - route1.performance.estimatedDuration) /
                  route2.performance.estimatedDuration) *
                100
              : 0,
        },
        stops: {
          route1: route1.routeData?.cityClusters?.length || 0,
          route2: route2.routeData?.cityClusters?.length || 0,
        },
        optimizationScore: {
          route1: route1.routeData?.optimizationScore || 0,
          route2: route2.routeData?.optimizationScore || 0,
        },
      };

      res.json({
        success: true,
        comparison,
        routes: {
          route1: {
            id: route1.id,
            version: route1.version,
            createdBy: route1.createdByRole,
            createdAt: route1.createdAt,
          },
          route2: {
            id: route2.id,
            version: route2.version,
            createdBy: route2.createdByRole,
            createdAt: route2.createdAt,
          },
        },
        recommendation:
          comparison.distance.improvement > 5
            ? route1.id
            : comparison.distance.improvement < -5
              ? route2.id
              : 'similar',
      });
    } catch (error) {
      console.error('Route comparison error:', error);
      res.status(500).json({ error: 'Failed to compare routes' });
    }
  }
);

export default router;
