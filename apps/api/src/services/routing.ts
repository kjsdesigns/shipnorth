import axios from 'axios';
import { Address, Coordinates } from '../models/address';

export interface RouteMatrix {
  distances: number[][]; // km
  durations: number[][]; // minutes
  origins: Coordinates[];
  destinations: Coordinates[];
}

export interface RouteDirections {
  distance: number; // km
  duration: number; // minutes
  polyline?: string; // Encoded polyline for map display
  steps: RouteStep[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  coordinates: Coordinates;
}

export interface RoutingProvider {
  getDistanceMatrix(origins: Coordinates[], destinations: Coordinates[]): Promise<RouteMatrix>;
  getDirections(origin: Coordinates, destination: Coordinates): Promise<RouteDirections>;
  getBulkDirections(waypoints: Coordinates[]): Promise<RouteDirections>;
}

export class GoogleRoutingProvider implements RoutingProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getDistanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<RouteMatrix> {
    try {
      const originStr = origins.map((o) => `${o.lat},${o.lng}`).join('|');
      const destStr = destinations.map((d) => `${d.lat},${d.lng}`).join('|');

      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: originStr,
          destinations: destStr,
          key: this.apiKey,
          mode: 'driving',
          units: 'metric',
          avoid: 'tolls', // Prefer non-toll routes for cost efficiency
        },
        timeout: 15000,
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Distance Matrix API error: ${response.data.status}`);
      }

      const distances: number[][] = [];
      const durations: number[][] = [];

      response.data.rows.forEach((row: any, rowIndex: number) => {
        distances[rowIndex] = [];
        durations[rowIndex] = [];

        row.elements.forEach((element: any, colIndex: number) => {
          if (element.status === 'OK') {
            distances[rowIndex][colIndex] = element.distance.value / 1000; // Convert to km
            durations[rowIndex][colIndex] = element.duration.value / 60; // Convert to minutes
          } else {
            // Fallback to straight-line distance if routing fails
            const origin = origins[rowIndex];
            const dest = destinations[colIndex];
            distances[rowIndex][colIndex] = this.calculateHaversineDistance(origin, dest);
            durations[rowIndex][colIndex] = (distances[rowIndex][colIndex] / 80) * 60; // Assume 80 km/h
          }
        });
      });

      return {
        distances,
        durations,
        origins,
        destinations,
      };
    } catch (error) {
      console.error('Google Distance Matrix API error:', error);
      throw new Error(
        `Distance matrix calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getDirections(origin: Coordinates, destination: Coordinates): Promise<RouteDirections> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          key: this.apiKey,
          mode: 'driving',
          avoid: 'tolls',
          alternatives: false,
        },
        timeout: 15000,
      });

      if (response.data.status !== 'OK' || !response.data.routes.length) {
        throw new Error(`Google Directions API error: ${response.data.status}`);
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      const steps: RouteStep[] = leg.steps.map((step: any) => ({
        distance: step.distance.value / 1000,
        duration: step.duration.value / 60,
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML
        coordinates: {
          lat: step.end_location.lat,
          lng: step.end_location.lng,
        },
      }));

      return {
        distance: leg.distance.value / 1000,
        duration: leg.duration.value / 60,
        polyline: route.overview_polyline.points,
        steps,
      };
    } catch (error) {
      console.error('Google Directions API error:', error);
      throw new Error(
        `Directions calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getBulkDirections(waypoints: Coordinates[]): Promise<RouteDirections> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required for bulk directions');
    }

    try {
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const intermediates = waypoints.slice(1, -1);

      const waypointsParam =
        intermediates.length > 0
          ? intermediates.map((w) => `${w.lat},${w.lng}`).join('|')
          : undefined;

      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          waypoints: waypointsParam,
          key: this.apiKey,
          mode: 'driving',
          avoid: 'tolls',
          optimize: true, // Let Google optimize waypoint order
        },
        timeout: 20000,
      });

      if (response.data.status !== 'OK' || !response.data.routes.length) {
        throw new Error(`Google Directions API error: ${response.data.status}`);
      }

      const route = response.data.routes[0];

      let totalDistance = 0;
      let totalDuration = 0;
      const allSteps: RouteStep[] = [];

      route.legs.forEach((leg: any) => {
        totalDistance += leg.distance.value / 1000;
        totalDuration += leg.duration.value / 60;

        leg.steps.forEach((step: any) => {
          allSteps.push({
            distance: step.distance.value / 1000,
            duration: step.duration.value / 60,
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            coordinates: {
              lat: step.end_location.lat,
              lng: step.end_location.lng,
              accuracy: 'approximate' as const,
              geocodedAt: new Date().toISOString(),
            },
          });
        });
      });

      return {
        distance: totalDistance,
        duration: totalDuration,
        polyline: route.overview_polyline.points,
        steps: allSteps,
      };
    } catch (error) {
      console.error('Google Bulk Directions API error:', error);
      throw new Error(
        `Bulk directions calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private calculateHaversineDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export class MapBoxRoutingProvider implements RoutingProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getDistanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<RouteMatrix> {
    try {
      // MapBox Matrix API supports up to 25 origins/destinations
      if (origins.length > 25 || destinations.length > 25) {
        return await this.getBatchedDistanceMatrix(origins, destinations);
      }

      const coordinates = [...origins, ...destinations];
      const coordStr = coordinates.map((c) => `${c.lng},${c.lat}`).join(';');

      // Source indices (origins) and destination indices
      const sources = origins.map((_, i) => i).join(';');
      const destinations_idx = destinations.map((_, i) => origins.length + i).join(';');

      const response = await axios.get(
        `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordStr}`,
        {
          params: {
            access_token: this.accessToken,
            sources: sources,
            destinations: destinations_idx,
            annotations: 'distance,duration',
          },
          timeout: 15000,
        }
      );

      if (response.data.code !== 'Ok') {
        throw new Error(`MapBox Matrix API error: ${response.data.code}`);
      }

      const distances = response.data.distances.map(
        (row: number[]) => row.map((d) => d / 1000) // Convert to km
      );

      const durations = response.data.durations.map(
        (row: number[]) => row.map((d) => d / 60) // Convert to minutes
      );

      return {
        distances,
        durations,
        origins,
        destinations,
      };
    } catch (error) {
      console.error('MapBox Distance Matrix API error:', error);
      throw new Error(
        `Distance matrix calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async getBatchedDistanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<RouteMatrix> {
    // For large matrices, break into smaller chunks
    const batchSize = 20;
    const distances: number[][] = [];
    const durations: number[][] = [];

    for (let i = 0; i < origins.length; i += batchSize) {
      const originBatch = origins.slice(i, i + batchSize);
      distances[i] = [];
      durations[i] = [];

      for (let j = 0; j < destinations.length; j += batchSize) {
        const destBatch = destinations.slice(j, j + batchSize);
        const batchResult = await this.getDistanceMatrix(originBatch, destBatch);

        batchResult.distances.forEach((row, rowIdx) => {
          distances[i + rowIdx] = distances[i + rowIdx] || [];
          durations[i + rowIdx] = durations[i + rowIdx] || [];

          row.forEach((dist, colIdx) => {
            distances[i + rowIdx][j + colIdx] = dist;
            durations[i + rowIdx][j + colIdx] = batchResult.durations[rowIdx][colIdx];
          });
        });

        // Add delay between API calls to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return { distances, durations, origins, destinations };
  }

  async getDirections(origin: Coordinates, destination: Coordinates): Promise<RouteDirections> {
    try {
      const coordStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}`,
        {
          params: {
            access_token: this.accessToken,
            geometries: 'polyline',
            steps: true,
            overview: 'full',
          },
          timeout: 15000,
        }
      );

      if (response.data.code !== 'Ok' || !response.data.routes.length) {
        throw new Error(`MapBox Directions API error: ${response.data.code}`);
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      const steps: RouteStep[] = leg.steps.map((step: any) => ({
        distance: step.distance / 1000,
        duration: step.duration / 60,
        instruction: step.maneuver.instruction,
        coordinates: {
          lat: step.maneuver.location[1],
          lng: step.maneuver.location[0],
        },
      }));

      return {
        distance: route.distance / 1000,
        duration: route.duration / 60,
        polyline: route.geometry,
        steps,
      };
    } catch (error) {
      console.error('MapBox Directions API error:', error);
      throw new Error(
        `Directions calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getBulkDirections(waypoints: Coordinates[]): Promise<RouteDirections> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required for bulk directions');
    }

    // MapBox supports up to 25 waypoints
    if (waypoints.length > 25) {
      return await this.getChunkedDirections(waypoints);
    }

    try {
      const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');

      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}`,
        {
          params: {
            access_token: this.accessToken,
            geometries: 'polyline',
            steps: true,
            overview: 'full',
          },
          timeout: 20000,
        }
      );

      if (response.data.code !== 'Ok' || !response.data.routes.length) {
        throw new Error(`MapBox Directions API error: ${response.data.code}`);
      }

      const route = response.data.routes[0];

      let totalDistance = 0;
      let totalDuration = 0;
      const allSteps: RouteStep[] = [];

      route.legs.forEach((leg: any) => {
        totalDistance += leg.distance / 1000;
        totalDuration += leg.duration / 60;

        leg.steps.forEach((step: any) => {
          allSteps.push({
            distance: step.distance / 1000,
            duration: step.duration / 60,
            instruction: step.maneuver.instruction,
            coordinates: {
              lat: step.maneuver.location[1],
              lng: step.maneuver.location[0],
              accuracy: 'approximate' as const,
              geocodedAt: new Date().toISOString(),
            },
          });
        });
      });

      return {
        distance: totalDistance,
        duration: totalDuration,
        polyline: route.geometry,
        steps: allSteps,
      };
    } catch (error) {
      console.error('MapBox Bulk Directions API error:', error);
      throw new Error(
        `Bulk directions calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async getChunkedDirections(waypoints: Coordinates[]): Promise<RouteDirections> {
    // Break large routes into smaller chunks
    const chunkSize = 20;
    let totalDistance = 0;
    let totalDuration = 0;
    const allSteps: RouteStep[] = [];
    let fullPolyline = '';

    for (let i = 0; i < waypoints.length; i += chunkSize - 1) {
      const chunk = waypoints.slice(i, i + chunkSize);
      if (chunk.length < 2) break;

      const chunkDirections = await this.getBulkDirections(chunk);
      totalDistance += chunkDirections.distance;
      totalDuration += chunkDirections.duration;
      allSteps.push(...chunkDirections.steps);

      if (chunkDirections.polyline) {
        fullPolyline += chunkDirections.polyline;
      }

      // Add delay between chunks
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return {
      distance: totalDistance,
      duration: totalDuration,
      polyline: fullPolyline,
      steps: allSteps,
    };
  }
}

export class RoutingService {
  private provider: RoutingProvider;

  constructor(provider: RoutingProvider) {
    this.provider = provider;
  }

  static create(): RoutingService {
    // Choose provider based on environment variables
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    if (googleApiKey) {
      return new RoutingService(new GoogleRoutingProvider(googleApiKey));
    } else if (mapboxToken) {
      return new RoutingService(new MapBoxRoutingProvider(mapboxToken));
    } else {
      // Fallback to mock provider for development
      return new RoutingService(new MockRoutingProvider());
    }
  }

  async getDistanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<RouteMatrix> {
    return await this.provider.getDistanceMatrix(origins, destinations);
  }

  async getDirections(origin: Coordinates, destination: Coordinates): Promise<RouteDirections> {
    return await this.provider.getDirections(origin, destination);
  }

  async getBulkDirections(waypoints: Coordinates[]): Promise<RouteDirections> {
    return await this.provider.getBulkDirections(waypoints);
  }

  // Utility method to calculate the best route through multiple waypoints
  async optimizeWaypoints(waypoints: Coordinates[]): Promise<{
    optimizedOrder: number[];
    totalDistance: number;
    totalDuration: number;
  }> {
    if (waypoints.length <= 2) {
      return {
        optimizedOrder: waypoints.map((_, i) => i),
        totalDistance:
          waypoints.length === 2
            ? await this.getDirections(waypoints[0], waypoints[1]).then((d) => d.distance)
            : 0,
        totalDuration:
          waypoints.length === 2
            ? await this.getDirections(waypoints[0], waypoints[1]).then((d) => d.duration)
            : 0,
      };
    }

    // Get distance matrix for all waypoints
    const matrix = await this.getDistanceMatrix(waypoints, waypoints);

    // Use nearest neighbor heuristic for optimization
    const visited = new Set<number>();
    const route = [0]; // Start from first waypoint
    visited.add(0);

    let totalDistance = 0;
    let totalDuration = 0;

    while (route.length < waypoints.length) {
      const current = route[route.length - 1];
      let nearest = -1;
      let nearestDistance = Infinity;

      for (let i = 0; i < waypoints.length; i++) {
        if (!visited.has(i) && matrix.distances[current][i] < nearestDistance) {
          nearest = i;
          nearestDistance = matrix.distances[current][i];
        }
      }

      if (nearest >= 0) {
        route.push(nearest);
        visited.add(nearest);
        totalDistance += nearestDistance;
        totalDuration += matrix.durations[current][nearest];
      }
    }

    return {
      optimizedOrder: route,
      totalDistance,
      totalDuration,
    };
  }
}

// Mock provider for development/testing
class MockRoutingProvider implements RoutingProvider {
  async getDistanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<RouteMatrix> {
    // Validate inputs
    if (!origins || origins.length === 0 || !destinations || destinations.length === 0) {
      throw new Error('Invalid origins or destinations provided');
    }

    const distances: number[][] = [];
    const durations: number[][] = [];

    origins.forEach((origin, i) => {
      distances[i] = [];
      durations[i] = [];

      destinations.forEach((dest, j) => {
        // Validate coordinates
        if (
          !origin ||
          !dest ||
          typeof origin.lat !== 'number' ||
          typeof origin.lng !== 'number' ||
          typeof dest.lat !== 'number' ||
          typeof dest.lng !== 'number'
        ) {
          distances[i][j] = Infinity;
          durations[i][j] = Infinity;
          return;
        }

        const distance = this.calculateHaversineDistance(origin, dest);
        distances[i][j] = distance;
        durations[i][j] = (distance / 80) * 60; // Assume 80 km/h average speed
      });
    });

    return { distances, durations, origins, destinations };
  }

  async getDirections(origin: Coordinates, destination: Coordinates): Promise<RouteDirections> {
    const distance = this.calculateHaversineDistance(origin, destination);
    const duration = (distance / 80) * 60; // 80 km/h average

    return {
      distance,
      duration,
      steps: [
        {
          distance,
          duration,
          instruction: `Drive ${distance.toFixed(1)} km to destination`,
          coordinates: destination,
        },
      ],
    };
  }

  async getBulkDirections(waypoints: Coordinates[]): Promise<RouteDirections> {
    let totalDistance = 0;
    let totalDuration = 0;
    const steps: RouteStep[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const segmentDistance = this.calculateHaversineDistance(waypoints[i], waypoints[i + 1]);
      const segmentDuration = (segmentDistance / 80) * 60;

      totalDistance += segmentDistance;
      totalDuration += segmentDuration;

      steps.push({
        distance: segmentDistance,
        duration: segmentDuration,
        instruction: `Drive ${segmentDistance.toFixed(1)} km to waypoint ${i + 2}`,
        coordinates: waypoints[i + 1],
      });
    }

    return {
      distance: totalDistance,
      duration: totalDuration,
      steps,
    };
  }

  private calculateHaversineDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
