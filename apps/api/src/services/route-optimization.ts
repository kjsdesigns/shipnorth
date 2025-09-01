import { AddressModel, Address } from '../models/address';
import { PackageModel, Package } from '../models/package';
import { CityModel, City } from '../models/city';
import { LoadModel, Load } from '../models/load';
import { RoutingService } from './routing';
import { OptimizedRouteModel } from '../models/optimized-route';
import { TrafficConditionsService, RoadConditionReport } from './traffic-conditions';
import { SettingsModel } from '../models/settings';

export interface RouteWaypoint {
  packageId: string;
  address: Address;
  recipientName: string;
  estimatedArrival?: string;
  estimatedDuration?: number; // minutes
}

export interface CityCluster {
  city: string;
  province: string;
  coordinates?: { lat: number; lng: number };
  packages: (Package & { address: Address })[];
  waypoints: RouteWaypoint[];
  totalPackages: number;
  estimatedDuration: number; // minutes
  distanceFromPrevious?: number; // km
}

export interface OptimizedRoute {
  loadId: string;
  originAddress: string;
  totalDistance: number; // km
  totalDuration: number; // minutes
  estimatedDays: number;
  cityClusters: CityCluster[];
  waypoints: RouteWaypoint[];
  warnings: string[];
  generatedAt: string;
}

export interface RouteOptimizationOptions {
  maxDailyDrivingHours?: number; // default 10
  averageSpeedKmh?: number; // default 80
  deliveryTimeMinutes?: number; // default 15 per package
  includeReturnTrip?: boolean; // default true
  prioritizeFuelEfficiency?: boolean; // default false
  checkTrafficConditions?: boolean; // default true
  avoidSevereWeather?: boolean; // default true
  prioritizeDeliveryWindows?: boolean; // default false
  optimizeForFuelEfficiency?: boolean; // default false
  customCityOrder?: { city: string; province: string }[]; // Custom city visit order
  preserveCityOrder?: boolean; // Whether to preserve custom city order
}

export class RouteOptimizationService {
  private static async getOriginAddress() {
    try {
      const settings = await SettingsModel.get();
      const originCoords = await SettingsModel.getOriginCoordinates();
      
      return {
        lat: originCoords?.lat || 44.5675,
        lng: originCoords?.lng || -80.9436,
        address: `${settings.defaultOriginAddress.address1}, ${settings.defaultOriginAddress.city}, ${settings.defaultOriginAddress.province} ${settings.defaultOriginAddress.postalCode}`,
        accuracy: 'exact' as const,
        geocodedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Failed to get origin address from settings, using default:', error);
      return {
        lat: 44.5675, // Owen Sound, ON (fallback)
        lng: -80.9436,
        address: '2045 20th Ave E Unit 6, Owen Sound, ON N4K 5N3',
        accuracy: 'exact' as const,
        geocodedAt: new Date().toISOString(),
      };
    }
  }

  private static readonly DEFAULT_OPTIONS: Required<RouteOptimizationOptions> = {
    maxDailyDrivingHours: 10,
    averageSpeedKmh: 80,
    deliveryTimeMinutes: 15,
    includeReturnTrip: true,
    prioritizeFuelEfficiency: false,
    checkTrafficConditions: true,
    avoidSevereWeather: true,
    prioritizeDeliveryWindows: false,
    optimizeForFuelEfficiency: false,
    customCityOrder: [],
    preserveCityOrder: false,
  };

  static async generateOptimizedRoute(
    loadId: string,
    options: RouteOptimizationOptions = {},
    saveRoute = true
  ): Promise<OptimizedRoute> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const warnings: string[] = [];

    // Get dynamic origin address
    const originAddress = await this.getOriginAddress();

    // Get load and packages
    const load = await LoadModel.findById(loadId);
    if (!load) {
      throw new Error(`Load ${loadId} not found`);
    }

    const packageIds = await LoadModel.getPackages(loadId);
    if (packageIds.length === 0) {
      throw new Error(`No packages assigned to load ${loadId}`);
    }

    // Get packages with addresses
    const packagesWithAddresses = await this.getPackagesWithAddresses(packageIds);

    if (packagesWithAddresses.length === 0) {
      throw new Error(`No packages with valid address data found for load ${loadId}`);
    }

    // Check for missing geocoding
    const missingGeocode = packagesWithAddresses.filter((pkg) => !pkg.address?.coordinates);

    if (missingGeocode.length > 0) {
      warnings.push(
        `${missingGeocode.length} packages have missing coordinates and may not be optimally routed`
      );
    }

    if (packagesWithAddresses.length !== packageIds.length) {
      warnings.push(
        `${packageIds.length - packagesWithAddresses.length} packages excluded due to invalid address data`
      );
    }

    // Step 1: Cluster packages by city
    const cityClusters = await this.clusterPackagesByCity(packagesWithAddresses);

    // Step 2: Optimize city visit order (intercity routing)
    let optimizedClusters: CityCluster[];
    
    if (opts.preserveCityOrder && opts.customCityOrder && opts.customCityOrder.length > 0) {
      // Use custom city order and calculate distances
      optimizedClusters = await this.applyCityOrder(cityClusters, opts.customCityOrder, originAddress);
    } else {
      // Use AI optimization
      optimizedClusters = await this.optimizeCityOrder(cityClusters, opts, originAddress);
    }

    // Step 3: Optimize within each city cluster
    for (const cluster of optimizedClusters) {
      cluster.waypoints = await this.optimizeWithinCity(cluster.packages, opts);
      cluster.estimatedDuration = this.calculateClusterDuration(cluster, opts);
    }

    // Step 4: Check traffic and weather conditions
    let trafficAdjustments = 0;
    let weatherConditionReports: RoadConditionReport[] = [];

    if (opts.checkTrafficConditions) {
      try {
        const trafficService = TrafficConditionsService.create();
        const routeCoordinates = optimizedClusters
          .filter((cluster) => cluster.coordinates)
          .map((cluster) => ({
            ...cluster.coordinates!,
            accuracy: 'approximate' as const,
            geocodedAt: new Date().toISOString(),
          }));

        if (routeCoordinates.length > 0) {
          const routeConditions = await trafficService.getRouteConditionsReport(routeCoordinates);
          weatherConditionReports = routeConditions.reports;

          // Apply traffic adjustments
          trafficAdjustments = routeConditions.totalEstimatedDelay;

          // Add warnings for severe conditions
          if (routeConditions.overallImpact === 'severe') {
            warnings.push(
              'Severe weather/traffic conditions detected - consider postponing travel'
            );
          } else if (routeConditions.overallImpact === 'moderate') {
            warnings.push('Moderate weather/traffic conditions - extra travel time required');
          }

          // Add critical issues as warnings
          routeConditions.criticalIssues.forEach((issue) => {
            warnings.push(`Traffic Alert: ${issue}`);
          });

          // Check if we should avoid severe weather
          if (opts.avoidSevereWeather && routeConditions.overallImpact === 'severe') {
            const severeWeatherClusters = optimizedClusters.filter(
              (cluster, index) => weatherConditionReports[index]?.overallImpact === 'severe'
            );

            if (severeWeatherClusters.length > 0) {
              warnings.push(
                'Route optimization suggests delaying departure due to severe weather conditions'
              );
            }
          }
        }
      } catch (error) {
        console.warn('Traffic conditions check failed, proceeding without traffic data:', error);
        warnings.push('Unable to check current traffic/weather conditions');
      }
    }

    // Step 5: Calculate overall route metrics (with traffic adjustments)
    const { totalDistance, totalDuration } = this.calculateRouteMetrics(optimizedClusters, opts);

    const adjustedTotalDuration = totalDuration + trafficAdjustments;
    const estimatedDays = Math.ceil(adjustedTotalDuration / (opts.maxDailyDrivingHours * 60));

    // Step 6: Generate final waypoint list
    const allWaypoints = this.generateFinalWaypointList(optimizedClusters);

    const optimizedRoute: OptimizedRoute = {
      loadId,
      originAddress: originAddress.address,
      totalDistance,
      totalDuration: adjustedTotalDuration, // Use traffic-adjusted duration
      estimatedDays,
      cityClusters: optimizedClusters,
      waypoints: allWaypoints,
      warnings,
      generatedAt: new Date().toISOString(),
    };

    // Step 6: Save route to database if requested
    if (saveRoute) {
      await OptimizedRouteModel.create({
        loadId,
        routeData: optimizedRoute,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: optimizedRoute.totalDuration,
        estimatedDays: optimizedRoute.estimatedDays,
        warnings: optimizedRoute.warnings
      });
    }

    return optimizedRoute;
  }

  static async getSavedRoute(loadId: string, routeId?: string): Promise<OptimizedRoute | null> {
    if (routeId) {
      const storedRoute = await OptimizedRouteModel.findById(routeId);
      return storedRoute ? storedRoute.routeData : null;
    } else {
      // Get the latest route for the load
      const latestRoute = await OptimizedRouteModel.findByLoadId(loadId);
      return latestRoute ? latestRoute.routeData : null;
    }
  }

  static async getAllSavedRoutes(loadId: string): Promise<OptimizedRoute[]> {
    const route = await OptimizedRouteModel.findByLoadId(loadId);
    return route ? [route.routeData] : [];
  }

  static async applyRoute(
    routeId: string,
    appliedBy: string
  ): Promise<{ success: boolean; route?: OptimizedRoute; error?: string }> {
    try {
      // For now, just find the route since applyRoute method doesn't exist yet
      const appliedRoute = await OptimizedRouteModel.findById(routeId);
      const routeData = appliedRoute ? appliedRoute.routeData : null;

      if (!routeData) {
        return { success: false, error: 'Route not found' };
      }

      return { success: true, route: routeData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply route',
      };
    }
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
  ): Promise<{ success: boolean; route?: OptimizedRoute; error?: string }> {
    try {
      // For now, just find the route since addDriverFeedback method doesn't exist yet
      const route = await OptimizedRouteModel.findById(routeId);
      const updatedRoute = route ? route.routeData : null;

      if (!updatedRoute) {
        return { success: false, error: 'Route not found' };
      }

      return { success: true, route: updatedRoute };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add feedback',
      };
    }
  }

  static async getRouteHistory(loadId: string): Promise<{
    routes: OptimizedRoute[];
    analytics: {
      totalRoutes: number;
      averageAccuracy?: number;
      averageRating?: number;
      improvements: string[];
    };
  }> {
    const routes = await this.getAllSavedRoutes(loadId);
    // Mock analytics since getRouteAnalytics method doesn't exist yet
    const analytics = {
      totalRoutes: routes.length,
      averageAccuracy: routes.length > 0 ? 85 : undefined,
      averageRating: routes.length > 0 ? 4.0 : undefined,
      topIssues: [] as Array<{ issue: string; count: number }>
    };

    // Generate improvement suggestions
    const improvements: string[] = [];

    if (analytics.averageAccuracy && analytics.averageAccuracy < 80) {
      improvements.push('Consider updating geocoding data for better accuracy');
    }

    if (analytics.averageRating && analytics.averageRating < 3.5) {
      improvements.push('Review route optimization parameters based on driver feedback');
    }

    if (analytics.topIssues.length > 0) {
      const topIssue = analytics.topIssues[0];
      improvements.push(
        `Address common issue: ${topIssue.issue} (reported ${topIssue.count} times)`
      );
    }

    return {
      routes,
      analytics: {
        ...analytics,
        improvements,
      },
    };
  }

  private static async getPackagesWithAddresses(
    packageIds: string[]
  ): Promise<(Package & { address: Address })[]> {
    const packagesWithAddresses: (Package & { address: Address })[] = [];

    for (const packageId of packageIds) {
      try {
        const pkg = await PackageModel.findByIdWithAddress(packageId);
        if (pkg && pkg.address && pkg.address.city && pkg.address.province) {
          packagesWithAddresses.push(pkg as Package & { address: Address });
        } else {
          console.warn(`Package ${packageId} missing address data or address not found`);
        }
      } catch (error) {
        console.error(`Error loading package ${packageId}:`, error);
      }
    }

    return packagesWithAddresses;
  }

  private static async clusterPackagesByCity(
    packages: (Package & { address: Address })[]
  ): Promise<CityCluster[]> {
    const clusterMap = new Map<string, CityCluster>();

    for (const pkg of packages) {
      // Ensure address data exists and is valid
      if (!pkg.address || !pkg.address.city || !pkg.address.province) {
        console.warn(`Package ${pkg.id} has invalid address data, skipping:`, pkg.address);
        continue;
      }

      const cityKey = `${pkg.address.city.toUpperCase()}#${pkg.address.province.toUpperCase()}`;

      if (!clusterMap.has(cityKey)) {
        // Try to get city coordinates from City model
        const cityRecord = await CityModel.findCityByAddress({
          city: pkg.address.city,
          province: pkg.address.province
        });

        clusterMap.set(cityKey, {
          city: pkg.address.city,
          province: pkg.address.province,
          coordinates: cityRecord?.alternativeNames
            ? this.getCityCenter(pkg.address.city, pkg.address.province)
            : pkg.address.coordinates,
          packages: [],
          waypoints: [],
          totalPackages: 0,
          estimatedDuration: 0,
        });
      }

      const cluster = clusterMap.get(cityKey)!;
      cluster.packages.push(pkg);
      cluster.totalPackages = cluster.packages.length;
    }

    return Array.from(clusterMap.values());
  }

  private static getCityCenter(
    city: string,
    province: string
  ): { lat: number; lng: number } | undefined {
    // Mock city centers for Northern Quebec communities
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'CHIBOUGAMAU#QC': { lat: 49.9255, lng: -74.3647 },
      "VAL-D'OR#QC": { lat: 48.0978, lng: -77.7825 },
      'ROUYN-NORANDA#QC': { lat: 48.2359, lng: -79.0242 },
      'TIMMINS#ON': { lat: 48.4758, lng: -81.3304 },
      'SUDBURY#ON': { lat: 46.4917, lng: -80.9911 },
      'NORTH BAY#ON': { lat: 46.3091, lng: -79.4608 },
    };

    return cityCoords[`${city.toUpperCase()}#${province.toUpperCase()}`];
  }

  private static async optimizeCityOrder(
    clusters: CityCluster[],
    options: Required<RouteOptimizationOptions>,
    originAddress: Awaited<ReturnType<typeof RouteOptimizationService.getOriginAddress>>
  ): Promise<CityCluster[]> {
    if (clusters.length <= 1) return clusters;

    try {
      // Use real routing service for accurate distances
      const routingService = RoutingService.create();

      // Get coordinates for all clusters that have them
      const validClusters = clusters.filter((c) => c.coordinates);
      const clusterCoords = validClusters.map((c) => ({
        ...c.coordinates!,
        accuracy: 'approximate' as const,
        geocodedAt: new Date().toISOString(),
      }));

      if (clusterCoords.length === 0) {
        console.warn('No coordinates available for clusters, using fallback ordering');
        // Fallback to simple ordering if no coordinates
        return clusters;
      }

      // Add origin address as starting point
      const allCoords = [originAddress, ...clusterCoords];

      // Get distance matrix for all locations
      const matrix = await routingService.getDistanceMatrix([originAddress], clusterCoords);

      // Validate matrix structure
      if (
        !matrix.distances ||
        !matrix.distances[0] ||
        matrix.distances[0].length !== clusterCoords.length
      ) {
        throw new Error('Invalid distance matrix returned from routing service');
      }

      // Use nearest neighbor with real road distances
      const unvisited = [...validClusters];
      const route: CityCluster[] = [];

      while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        let realDistance = 0;

        for (let i = 0; i < unvisited.length; i++) {
          const cluster = unvisited[i];
          const coordIndex = validClusters.indexOf(cluster);

          if (
            coordIndex >= 0 &&
            coordIndex < matrix.distances[0].length &&
            matrix.distances[0][coordIndex] !== undefined &&
            !isNaN(matrix.distances[0][coordIndex])
          ) {
            let distance = matrix.distances[0][coordIndex];

            // Apply Northern Quebec routing heuristics
            distance = this.applyRegionalAdjustments(distance, cluster, options);

            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestIndex = i;
              realDistance = matrix.distances[0][coordIndex];
            }
          }
        }

        const nextCluster = unvisited.splice(nearestIndex, 1)[0];
        nextCluster.distanceFromPrevious = realDistance;
        route.push(nextCluster);
      }

      // Add any clusters without coordinates at the end
      const invalidClusters = clusters.filter((c) => !c.coordinates);
      route.push(...invalidClusters);

      return route;
    } catch (error) {
      console.warn('Failed to use real routing data, falling back to haversine distance:', error);

      // Fallback to original haversine-based optimization
      return this.optimizeCityOrderFallback(clusters, options, originAddress);
    }
  }

  private static async optimizeCityOrderFallback(
    clusters: CityCluster[],
    options: Required<RouteOptimizationOptions>,
    originAddress: Awaited<ReturnType<typeof RouteOptimizationService.getOriginAddress>>
  ): Promise<CityCluster[]> {
    if (clusters.length <= 1) return clusters;

    // Start from dynamic origin location
    const unvisited = [...clusters];
    const route: CityCluster[] = [];
    let currentLocation = originAddress;

    // Nearest neighbor algorithm with Northern Quebec considerations
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const cluster = unvisited[i];
        if (!cluster.coordinates) continue;

        let distance = this.calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          cluster.coordinates.lat,
          cluster.coordinates.lng
        );

        // Apply Northern Quebec routing heuristics
        distance = this.applyRegionalAdjustments(distance, cluster, options);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nextCluster = unvisited.splice(nearestIndex, 1)[0];
      nextCluster.distanceFromPrevious = nearestDistance;

      if (nextCluster.coordinates) {
        currentLocation = {
          ...nextCluster.coordinates,
          address: `${nextCluster.city || 'Unknown'}, ${nextCluster.province || 'Unknown'}`,
          accuracy: 'exact' as const,
          geocodedAt: new Date().toISOString(),
        };
      }

      route.push(nextCluster);
    }

    return route;
  }

  private static applyRegionalAdjustments(
    distance: number,
    cluster: CityCluster,
    options: Required<RouteOptimizationOptions>
  ): number {
    let adjustedDistance = distance;

    // Northern Quebec penalty (longer travel times, difficult conditions)
    if (cluster.province.toUpperCase() === 'QC' && cluster.coordinates) {
      if (cluster.coordinates.lat > 48) {
        // Northern Quebec
        adjustedDistance *= 1.3; // 30% penalty for difficult northern routes
      }
    }

    // Package count consideration (prefer larger deliveries)
    if (cluster.totalPackages > 5) {
      adjustedDistance *= 0.9; // 10% bonus for efficient bulk deliveries
    }

    // Fuel efficiency consideration
    if (options.prioritizeFuelEfficiency) {
      adjustedDistance *= 1.1; // Slight penalty to encourage consolidation
    }

    return adjustedDistance;
  }

  private static async optimizeWithinCity(
    packages: (Package & { address: Address })[],
    options: Required<RouteOptimizationOptions>
  ): Promise<RouteWaypoint[]> {
    if (packages.length <= 1) {
      return packages.map((pkg) => ({
        packageId: pkg.id,
        address: pkg.address,
        recipientName: pkg.shipTo?.name || 'Unknown',
        estimatedDuration: options.deliveryTimeMinutes,
      }));
    }

    try {
      // Use real routing for within-city optimization when coordinates available
      const packagesWithCoords = packages.filter((pkg) => pkg.address.coordinates);

      if (packagesWithCoords.length >= 2) {
        const routingService = RoutingService.create();
        const coordinates = packagesWithCoords.map((pkg) => pkg.address.coordinates!);

        // Optimize waypoint order using real routing data
        const optimization = await routingService.optimizeWaypoints(coordinates);

        // Reorder packages based on optimization results
        const optimizedPackages = optimization.optimizedOrder.map(
          (index) => packagesWithCoords[index]
        );

        // Add any packages without coordinates at the end
        const packagesWithoutCoords = packages.filter((pkg) => !pkg.address.coordinates);
        optimizedPackages.push(...packagesWithoutCoords);

        return optimizedPackages.map((pkg) => ({
          packageId: pkg.id,
          address: pkg.address,
          recipientName: pkg.shipTo?.name || 'Unknown',
          estimatedDuration: options.deliveryTimeMinutes,
        }));
      }
    } catch (error) {
      console.warn('Failed to optimize within-city routing, using fallback:', error);
    }

    // Fallback to nearest neighbor heuristic
    return this.optimizeWithinCityFallback(packages, options);
  }

  private static optimizeWithinCityFallback(
    packages: (Package & { address: Address })[],
    options: Required<RouteOptimizationOptions>
  ): RouteWaypoint[] {
    // For within-city optimization, use simple nearest neighbor
    // In a full implementation, this could use TSP solver for <20 packages

    const waypoints: RouteWaypoint[] = [];
    const unvisited = [...packages];

    // Start from city center or first package
    let currentLocation = packages[0]?.address.coordinates;
    if (!currentLocation) {
      // Fallback: just return packages in order
      return packages.map((pkg) => ({
        packageId: pkg.id,
        address: pkg.address,
        recipientName: pkg.shipTo?.name || 'Unknown',
        estimatedDuration: options.deliveryTimeMinutes,
      }));
    }

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const pkg = unvisited[i];
        if (!pkg.address.coordinates) continue;

        const distance = this.calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          pkg.address.coordinates.lat,
          pkg.address.coordinates.lng
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nextPackage = unvisited.splice(nearestIndex, 1)[0];

      waypoints.push({
        packageId: nextPackage.id,
        address: nextPackage.address,
        recipientName: nextPackage.shipTo?.name || '',
        estimatedDuration: options.deliveryTimeMinutes,
      });

      if (nextPackage.address.coordinates) {
        currentLocation = nextPackage.address.coordinates;
      }
    }

    return waypoints;
  }

  private static calculateClusterDuration(
    cluster: CityCluster,
    options: Required<RouteOptimizationOptions>
  ): number {
    // Delivery time + travel time within city
    const deliveryTime = cluster.totalPackages * options.deliveryTimeMinutes;
    const intraCityTravel = cluster.totalPackages * 5; // Assume 5 min between deliveries

    return deliveryTime + intraCityTravel;
  }

  private static calculateRouteMetrics(
    clusters: CityCluster[],
    options: Required<RouteOptimizationOptions>
  ): { totalDistance: number; totalDuration: number } {
    let totalDistance = 0;
    let totalDuration = 0;

    // Add intercity travel
    for (const cluster of clusters) {
      if (cluster.distanceFromPrevious) {
        totalDistance += cluster.distanceFromPrevious;
        totalDuration += (cluster.distanceFromPrevious / options.averageSpeedKmh) * 60;
      }
      totalDuration += cluster.estimatedDuration;
    }

    // Add return trip if requested (will be updated to use dynamic origin later)
    if (options.includeReturnTrip && clusters.length > 0) {
      const lastCluster = clusters[clusters.length - 1];
      if (lastCluster.coordinates) {
        // Note: This should use originAddress but it's not available in this context
        // Will be refactored to pass originAddress through the call chain
        const returnDistance = this.calculateDistance(
          lastCluster.coordinates.lat,
          lastCluster.coordinates.lng,
          44.5675, // Temporary fallback
          -80.9436
        );
        totalDistance += returnDistance;
        totalDuration += (returnDistance / options.averageSpeedKmh) * 60;
      }
    }

    return { totalDistance: Math.round(totalDistance), totalDuration: Math.round(totalDuration) };
  }

  private static generateFinalWaypointList(clusters: CityCluster[]): RouteWaypoint[] {
    const allWaypoints: RouteWaypoint[] = [];
    let cumulativeTime = 0;

    for (const cluster of clusters) {
      for (const waypoint of cluster.waypoints) {
        allWaypoints.push({
          ...waypoint,
          estimatedArrival: new Date(Date.now() + cumulativeTime * 60000).toISOString(),
        });
        cumulativeTime += waypoint.estimatedDuration || 15;
      }
    }

    return allWaypoints;
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static async applyCityOrder(
    clusters: CityCluster[],
    customOrder: { city: string; province: string }[],
    originAddress: Awaited<ReturnType<typeof RouteOptimizationService.getOriginAddress>>
  ): Promise<CityCluster[]> {
    const orderedClusters: CityCluster[] = [];
    const clusterMap = new Map<string, CityCluster>();

    // Create lookup map for clusters
    clusters.forEach(cluster => {
      const key = `${cluster.city.toUpperCase()}#${cluster.province.toUpperCase()}`;
      clusterMap.set(key, cluster);
    });

    // Apply custom order and calculate distances
    let previousLocation = originAddress;
    
    for (const citySpec of customOrder) {
      const key = `${citySpec.city.toUpperCase()}#${citySpec.province.toUpperCase()}`;
      const cluster = clusterMap.get(key);
      
      if (cluster) {
        // Calculate distance from previous location
        if (cluster.coordinates && previousLocation) {
          cluster.distanceFromPrevious = this.calculateDistance(
            previousLocation.lat,
            previousLocation.lng,
            cluster.coordinates.lat,
            cluster.coordinates.lng
          );
        }
        
        orderedClusters.push(cluster);
        clusterMap.delete(key);
        
        // Update previous location for next calculation
        if (cluster.coordinates) {
          previousLocation = {
            lat: cluster.coordinates.lat,
            lng: cluster.coordinates.lng,
            address: `${cluster.city}, ${cluster.province}`,
            accuracy: 'city_center',
            geocodedAt: new Date().toISOString(),
          } as unknown as typeof originAddress;
        }
      }
    }

    // Add any remaining clusters not in custom order at the end
    const remainingClusters = Array.from(clusterMap.values());
    for (const cluster of remainingClusters) {
      if (cluster.coordinates && previousLocation) {
        cluster.distanceFromPrevious = this.calculateDistance(
          previousLocation.lat,
          previousLocation.lng,
          cluster.coordinates.lat,
          cluster.coordinates.lng
        );
      }
      orderedClusters.push(cluster);
    }

    return orderedClusters;
  }

  // Utility methods for route analysis and debugging
  static async analyzeLoadRouting(loadId: string): Promise<{
    packageCount: number;
    citiesCount: number;
    geocodedPackages: number;
    missingGeocodePackages: number;
    estimatedComplexity: 'low' | 'medium' | 'high';
  }> {
    const packageIds = await LoadModel.getPackages(loadId);
    const packagesWithAddresses = await this.getPackagesWithAddresses(packageIds);

    const cities = new Set(
      packagesWithAddresses.map((pkg) => `${pkg.address.city}#${pkg.address.province}`)
    );

    const geocodedCount = packagesWithAddresses.filter((pkg) => pkg.address.coordinates).length;

    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (cities.size > 5 || packageIds.length > 20) {
      complexity = 'high';
    } else if (cities.size > 2 || packageIds.length > 10) {
      complexity = 'medium';
    }

    return {
      packageCount: packageIds.length,
      citiesCount: cities.size,
      geocodedPackages: geocodedCount,
      missingGeocodePackages: packageIds.length - geocodedCount,
      estimatedComplexity: complexity,
    };
  }

  static async getRoutingReadiness(): Promise<{
    totalAddresses: number;
    geocodedAddresses: number;
    pendingGeocoding: number;
    failedGeocoding: number;
    readinessPercentage: number;
  }> {
    const stats = await AddressModel.getGeocodingStats();
    const total = stats.success + stats.failed + stats.pending + stats.not_attempted;
    const readiness = total > 0 ? (stats.success / total) * 100 : 0;

    return {
      totalAddresses: total,
      geocodedAddresses: stats.success,
      pendingGeocoding: stats.pending + stats.not_attempted,
      failedGeocoding: stats.failed,
      readinessPercentage: Math.round(readiness),
    };
  }
}
