import { DatabaseService, generateId } from '../services/database';
import { OptimizedRoute, CityCluster, RouteWaypoint } from '../services/route-optimization';

export interface StoredRoute extends OptimizedRoute {
  id: string;
  loadId: string;
  version: number; // Route version for tracking changes
  status: 'draft' | 'active' | 'completed' | 'archived';
  appliedAt?: string; // When route was applied to the load
  appliedBy?: string; // User ID who applied the route
  driverFeedback?: {
    rating: number; // 1-5 stars
    comments: string;
    actualDuration?: number; // minutes
    actualDistance?: number; // km
    issues: string[];
    submittedAt: string;
    submittedBy: string;
  };
  performance?: {
    estimatedDuration: number;
    actualDuration?: number;
    estimatedDistance: number;
    actualDistance?: number;
    accuracyScore?: number; // 0-100%
    fuelEfficiencyScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export class OptimizedRouteModel {
  static async create(
    loadId: string,
    routeData: OptimizedRoute,
    appliedBy?: string
  ): Promise<StoredRoute> {
    const id = generateId();
    const now = new Date().toISOString();

    // Check for existing routes for this load
    const existingRoutes = await this.findByLoadId(loadId);
    const version = Math.max(0, ...existingRoutes.map((r) => r.version)) + 1;

    const { loadId: _, ...routeDataWithoutLoadId } = routeData;
    const storedRoute: StoredRoute = {
      id,
      loadId,
      version,
      status: 'draft',
      appliedBy,
      performance: {
        estimatedDuration: routeData.totalDuration,
        estimatedDistance: routeData.totalDistance,
      },
      createdAt: now,
      updatedAt: now,
      ...routeDataWithoutLoadId,
    };

    await DatabaseService.put({
      PK: `ROUTE#${id}`,
      SK: 'METADATA',
      GSI1PK: `LOAD#${loadId}`,
      GSI1SK: `ROUTE#${version.toString().padStart(3, '0')}#${id}`,
      GSI2PK: `ROUTE_STATUS#${storedRoute.status}`,
      GSI2SK: `ROUTE#${id}`,
      Type: 'OptimizedRoute',
      Data: storedRoute,
    });

    return storedRoute;
  }

  static async findById(id: string): Promise<StoredRoute | null> {
    const item = await DatabaseService.get(`ROUTE#${id}`, 'METADATA');
    return item ? item.Data : null;
  }

  static async findByLoadId(loadId: string): Promise<StoredRoute[]> {
    const items = await DatabaseService.queryByGSI('GSI1', `LOAD#${loadId}`);
    return items
      .filter((item: any) => item.Type === 'OptimizedRoute')
      .map((item: any) => item.Data)
      .sort((a: StoredRoute, b: StoredRoute) => b.version - a.version); // Latest first
  }

  static async findActiveRoute(loadId: string): Promise<StoredRoute | null> {
    const routes = await this.findByLoadId(loadId);
    return routes.find((route) => route.status === 'active') || null;
  }

  static async findLatestRoute(loadId: string): Promise<StoredRoute | null> {
    const routes = await this.findByLoadId(loadId);
    return routes[0] || null; // Already sorted by version desc
  }

  static async findByStatus(status: StoredRoute['status']): Promise<StoredRoute[]> {
    const items = await DatabaseService.queryByGSI('GSI2', `ROUTE_STATUS#${status}`);
    return items
      .filter((item: any) => item.Type === 'OptimizedRoute')
      .map((item: any) => item.Data);
  }

  static async applyRoute(
    routeId: string,
    appliedBy: string,
    makeActive = true
  ): Promise<StoredRoute | null> {
    const route = await this.findById(routeId);
    if (!route) return null;

    // If making this route active, deactivate other routes for the same load
    if (makeActive) {
      const existingRoutes = await this.findByLoadId(route.loadId);
      for (const existingRoute of existingRoutes) {
        if (existingRoute.status === 'active' && existingRoute.id !== routeId) {
          await this.update(existingRoute.id, { status: 'archived' });
        }
      }
    }

    return await this.update(routeId, {
      status: makeActive ? 'active' : 'draft',
      appliedAt: new Date().toISOString(),
      appliedBy,
    });
  }

  static async update(id: string, updates: Partial<StoredRoute>): Promise<StoredRoute | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updatedRoute = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updateData: any = {
      Data: updatedRoute,
    };

    // Update status index if status changed
    if (updates.status && updates.status !== current.status) {
      updateData.GSI2PK = `ROUTE_STATUS#${updates.status}`;
    }

    const result = await DatabaseService.update(`ROUTE#${id}`, 'METADATA', updateData);
    return result ? result.Data : null;
  }

  static async addDriverFeedback(
    routeId: string,
    feedback: {
      rating: number;
      comments: string;
      actualDuration?: number;
      actualDistance?: number;
      issues: string[];
      submittedBy: string;
    }
  ): Promise<StoredRoute | null> {
    const route = await this.findById(routeId);
    if (!route) return null;

    const driverFeedback = {
      ...feedback,
      submittedAt: new Date().toISOString(),
    };

    // Calculate performance metrics if actual data provided
    let performance = route.performance;
    if (feedback.actualDuration && feedback.actualDistance) {
      const durationAccuracy = Math.max(
        0,
        100 -
          Math.abs(((feedback.actualDuration - route.totalDuration) / route.totalDuration) * 100)
      );
      const distanceAccuracy = Math.max(
        0,
        100 -
          Math.abs(((feedback.actualDistance - route.totalDistance) / route.totalDistance) * 100)
      );

      performance = {
        ...performance!,
        actualDuration: feedback.actualDuration,
        actualDistance: feedback.actualDistance,
        accuracyScore: Math.round((durationAccuracy + distanceAccuracy) / 2),
        fuelEfficiencyScore: feedback.rating * 20, // Convert 1-5 rating to 0-100 score
      };
    }

    return await this.update(routeId, {
      driverFeedback,
      performance,
      status: 'completed',
    });
  }

  static async getRouteAnalytics(loadId?: string): Promise<{
    totalRoutes: number;
    activeRoutes: number;
    completedRoutes: number;
    averageAccuracy?: number;
    averageRating?: number;
    topIssues: { issue: string; count: number }[];
  }> {
    let routes: StoredRoute[];

    if (loadId) {
      routes = await this.findByLoadId(loadId);
    } else {
      // Get all routes
      const allStatuses: StoredRoute['status'][] = ['draft', 'active', 'completed', 'archived'];
      routes = [];

      for (const status of allStatuses) {
        const statusRoutes = await this.findByStatus(status);
        routes.push(...statusRoutes);
      }
    }

    const completedRoutes = routes.filter((r) => r.status === 'completed');
    const routesWithFeedback = completedRoutes.filter((r) => r.driverFeedback);

    // Calculate averages
    const averageAccuracy =
      routesWithFeedback.length > 0
        ? routesWithFeedback.reduce((sum, r) => sum + (r.performance?.accuracyScore || 0), 0) /
          routesWithFeedback.length
        : undefined;

    const averageRating =
      routesWithFeedback.length > 0
        ? routesWithFeedback.reduce((sum, r) => sum + (r.driverFeedback?.rating || 0), 0) /
          routesWithFeedback.length
        : undefined;

    // Analyze issues
    const issueCount: Record<string, number> = {};
    routesWithFeedback.forEach((route) => {
      route.driverFeedback?.issues.forEach((issue) => {
        issueCount[issue] = (issueCount[issue] || 0) + 1;
      });
    });

    const topIssues = Object.entries(issueCount)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRoutes: routes.length,
      activeRoutes: routes.filter((r) => r.status === 'active').length,
      completedRoutes: completedRoutes.length,
      averageAccuracy: averageAccuracy ? Math.round(averageAccuracy) : undefined,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : undefined,
      topIssues,
    };
  }

  static async cloneRoute(
    sourceRouteId: string,
    modifications?: Partial<OptimizedRoute>
  ): Promise<StoredRoute | null> {
    const sourceRoute = await this.findById(sourceRouteId);
    if (!sourceRoute) return null;

    const clonedRoute: OptimizedRoute = {
      loadId: sourceRoute.loadId,
      originAddress: sourceRoute.originAddress,
      totalDistance: sourceRoute.totalDistance,
      totalDuration: sourceRoute.totalDuration,
      estimatedDays: sourceRoute.estimatedDays,
      cityClusters: sourceRoute.cityClusters,
      waypoints: sourceRoute.waypoints,
      warnings: sourceRoute.warnings,
      generatedAt: new Date().toISOString(),
      ...modifications,
    };

    return await this.create(sourceRoute.loadId, clonedRoute);
  }

  static async deleteRoute(id: string): Promise<boolean> {
    const route = await this.findById(id);
    if (!route) return false;

    // Only allow deletion of draft routes
    if (route.status !== 'draft') {
      throw new Error('Only draft routes can be deleted');
    }

    await DatabaseService.delete(`ROUTE#${id}`, 'METADATA');
    return true;
  }

  static async archiveOldRoutes(olderThanDays = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffISO = cutoffDate.toISOString();

    const allStatuses: StoredRoute['status'][] = ['draft', 'completed'];
    let archivedCount = 0;

    for (const status of allStatuses) {
      const routes = await this.findByStatus(status);

      for (const route of routes) {
        if (route.createdAt < cutoffISO) {
          await this.update(route.id, { status: 'archived' });
          archivedCount++;
        }
      }
    }

    return archivedCount;
  }

  static async list(
    limit = 100,
    offset = 0
  ): Promise<{
    routes: StoredRoute[];
    total: number;
  }> {
    // This is a simplified implementation - in production you'd want proper pagination
    const allStatuses: StoredRoute['status'][] = ['draft', 'active', 'completed', 'archived'];
    const allRoutes: StoredRoute[] = [];

    for (const status of allStatuses) {
      const statusRoutes = await this.findByStatus(status);
      allRoutes.push(...statusRoutes);
    }

    // Sort by creation date desc
    allRoutes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginatedRoutes = allRoutes.slice(offset, offset + limit);

    return {
      routes: paginatedRoutes,
      total: allRoutes.length,
    };
  }

  // Export route data for external systems (like driver mobile apps)
  static async exportRouteForDriver(routeId: string): Promise<{
    route: StoredRoute;
    driverInstructions: {
      loadId: string;
      totalStops: number;
      estimatedDays: number;
      cities: {
        city: string;
        province: string;
        packages: number;
        stops: {
          packageId: string;
          recipient: string;
          address: string;
          estimatedArrival?: string;
        }[];
      }[];
    };
  } | null> {
    const route = await this.findById(routeId);
    if (!route || route.status !== 'active') return null;

    const driverInstructions = {
      loadId: route.loadId,
      totalStops: route.waypoints.length,
      estimatedDays: route.estimatedDays,
      cities: route.cityClusters.map((cluster) => ({
        city: cluster.city,
        province: cluster.province,
        packages: cluster.totalPackages,
        stops: cluster.waypoints.map((waypoint) => ({
          packageId: waypoint.packageId,
          recipient: waypoint.recipientName,
          address: `${waypoint.address.address1}${waypoint.address.address2 ? ', ' + waypoint.address.address2 : ''}, ${waypoint.address.city}, ${waypoint.address.province}`,
          estimatedArrival: waypoint.estimatedArrival,
        })),
      })),
    };

    return {
      route,
      driverInstructions,
    };
  }
}
