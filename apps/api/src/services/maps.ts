import axios from 'axios';
import { SettingsModel } from '../models/settings';

export interface RouteWaypoint {
  city: string;
  province: string;
  country: string;
  address?: string;
}

export interface RouteOptimizationResult {
  optimizedOrder: number[];
  totalDistance: number;
  totalDuration: number;
  waypoints: Array<{
    city: string;
    province: string;
    country: string;
    distance: number;
    duration: number;
    order: number;
  }>;
}

export class MapsService {
  private static async getApiKey(): Promise<string> {
    const settings = await SettingsModel.get();
    const apiKey = settings.googleMapsApiKey;

    if (!apiKey) {
      throw new Error('Google Maps API key not configured in system settings');
    }

    return apiKey;
  }

  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const apiKey = await this.getApiKey();
      const encodedAddress = encodeURIComponent(address);

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  static async optimizeRoute(
    origin: string,
    destinations: RouteWaypoint[]
  ): Promise<RouteOptimizationResult> {
    try {
      const apiKey = await this.getApiKey();

      // First, geocode all destinations
      const geocodedDestinations = await Promise.all(
        destinations.map(async (dest, index) => {
          const address = dest.address || `${dest.city}, ${dest.province}, ${dest.country}`;
          const coords = await this.geocodeAddress(address);
          return {
            ...dest,
            coordinates: coords,
            originalIndex: index,
          };
        })
      );

      // Filter out destinations that couldn't be geocoded
      const validDestinations = geocodedDestinations.filter((dest) => dest.coordinates);

      if (validDestinations.length === 0) {
        throw new Error('No valid destinations found');
      }

      // Use Google Maps Directions API with waypoint optimization
      const waypoints = validDestinations
        .map((dest) => dest.coordinates!)
        .map((coord) => `${coord.lat},${coord.lng}`)
        .join('|');

      const directionsResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?` +
          `origin=${encodeURIComponent(origin)}&` +
          `destination=${encodeURIComponent(origin)}&` +
          `waypoints=optimize:true|${waypoints}&` +
          `key=${apiKey}`
      );

      if (directionsResponse.data.status !== 'OK') {
        throw new Error(`Directions API error: ${directionsResponse.data.status}`);
      }

      const route = directionsResponse.data.routes[0];
      const waypointOrder = route.waypoint_order || [];

      // Calculate distances and durations for each leg
      const legs = route.legs;
      const optimizedWaypoints = waypointOrder.map((optimizedIndex: number, legIndex: number) => {
        const originalDestination = validDestinations[optimizedIndex];
        const leg = legs[legIndex];

        return {
          city: originalDestination.city,
          province: originalDestination.province,
          country: originalDestination.country,
          distance: Math.round(leg.distance.value / 1000), // Convert to km
          duration: Math.round(leg.duration.value / 60), // Convert to minutes
          order: legIndex + 1,
        };
      });

      const totalDistance =
        legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0) / 1000;
      const totalDuration =
        legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0) / 60;

      return {
        optimizedOrder: waypointOrder,
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        waypoints: optimizedWaypoints,
      };
    } catch (error) {
      console.error('Route optimization error:', error);

      // Fallback: return original order with estimated distances
      const fallbackWaypoints = destinations.map((dest, index) => ({
        city: dest.city,
        province: dest.province,
        country: dest.country,
        distance: 100 + index * 50, // Mock distance
        duration: 120 + index * 60, // Mock duration in minutes
        order: index + 1,
      }));

      return {
        optimizedOrder: destinations.map((_, index) => index),
        totalDistance: fallbackWaypoints.reduce((sum, wp) => sum + wp.distance, 0),
        totalDuration: fallbackWaypoints.reduce((sum, wp) => sum + wp.duration, 0),
        waypoints: fallbackWaypoints,
      };
    }
  }

  static async getDistanceMatrix(origins: string[], destinations: string[]): Promise<any> {
    try {
      const apiKey = await this.getApiKey();

      const originsStr = origins.map((o) => encodeURIComponent(o)).join('|');
      const destinationsStr = destinations.map((d) => encodeURIComponent(d)).join('|');

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?` +
          `origins=${originsStr}&` +
          `destinations=${destinationsStr}&` +
          `units=metric&` +
          `key=${apiKey}`
      );

      return response.data;
    } catch (error) {
      console.error('Distance matrix error:', error);
      throw error;
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const apiKey = await this.getApiKey();

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  static formatAddress(components: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  }): string {
    const parts = [
      components.address1,
      components.address2,
      components.city,
      components.province,
      components.postalCode,
      components.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Mock implementation for development when API key is not available
  static mockRouteOptimization(
    origin: string,
    destinations: RouteWaypoint[]
  ): RouteOptimizationResult {
    const shuffledDestinations = [...destinations].sort(() => Math.random() - 0.5);

    const waypoints = shuffledDestinations.map((dest, index) => ({
      city: dest.city,
      province: dest.province,
      country: dest.country,
      distance: 50 + Math.random() * 200,
      duration: 60 + Math.random() * 180,
      order: index + 1,
    }));

    return {
      optimizedOrder: shuffledDestinations.map((_, index) => index),
      totalDistance: Math.round(waypoints.reduce((sum, wp) => sum + wp.distance, 0)),
      totalDuration: Math.round(waypoints.reduce((sum, wp) => sum + wp.duration, 0)),
      waypoints,
    };
  }
}
