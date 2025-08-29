import axios from 'axios';
import { Coordinates } from '../models/address';

export interface TrafficCondition {
  severity: 'low' | 'moderate' | 'heavy' | 'severe';
  description: string;
  delay?: number; // Additional minutes due to traffic
  affectedSegment: {
    start: Coordinates;
    end: Coordinates;
    description: string;
  };
  type: 'construction' | 'accident' | 'weather' | 'congestion' | 'road_closure' | 'event';
  startTime?: string;
  endTime?: string;
  source: string;
}

export interface WeatherCondition {
  temperature: number; // Celsius
  description: string;
  visibility: number; // km
  precipitation: number; // mm/h
  windSpeed: number; // km/h
  roadConditions: 'clear' | 'wet' | 'icy' | 'snowy' | 'hazardous';
  drivingImpact: 'none' | 'minor' | 'moderate' | 'severe';
  recommendedSpeedReduction: number; // percentage
  location: Coordinates;
  timestamp: string;
}

export interface RoadConditionReport {
  location: Coordinates;
  conditions: TrafficCondition[];
  weather: WeatherCondition;
  overallImpact: 'none' | 'minor' | 'moderate' | 'severe';
  recommendedActions: string[];
  estimatedDelay: number; // Additional minutes
  updatedAt: string;
}

export interface TrafficProvider {
  getTrafficConditions(route: Coordinates[]): Promise<TrafficCondition[]>;
  getWeatherConditions(location: Coordinates): Promise<WeatherCondition>;
  getRoadConditionReport(location: Coordinates): Promise<RoadConditionReport>;
}

export class GoogleTrafficProvider implements TrafficProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getTrafficConditions(route: Coordinates[]): Promise<TrafficCondition[]> {
    try {
      const conditions: TrafficCondition[] = [];

      // Use Google Maps Roads API to get traffic information
      for (let i = 0; i < route.length - 1; i++) {
        const start = route[i];
        const end = route[i + 1];

        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
          params: {
            origin: `${start.lat},${start.lng}`,
            destination: `${end.lat},${end.lng}`,
            key: this.apiKey,
            departure_time: 'now',
            traffic_model: 'best_guess',
            mode: 'driving',
          },
          timeout: 10000,
        });

        if (response.data.status === 'OK' && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          const leg = route.legs[0];

          // Analyze traffic conditions based on duration difference
          const durationWithTraffic = leg.duration_in_traffic?.value || leg.duration.value;
          const durationWithoutTraffic = leg.duration.value;
          const trafficDelay = (durationWithTraffic - durationWithoutTraffic) / 60; // Convert to minutes

          if (trafficDelay > 5) {
            let severity: TrafficCondition['severity'] = 'low';
            if (trafficDelay > 30) severity = 'severe';
            else if (trafficDelay > 15) severity = 'heavy';
            else if (trafficDelay > 10) severity = 'moderate';

            conditions.push({
              severity,
              description: `Traffic congestion detected: ${Math.round(trafficDelay)} min delay`,
              delay: Math.round(trafficDelay),
              affectedSegment: {
                start,
                end,
                description: `${leg.start_address} to ${leg.end_address}`,
              },
              type: 'congestion',
              source: 'Google Traffic',
            });
          }
        }

        // Add delay between requests to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      return conditions;
    } catch (error) {
      console.error('Google Traffic API error:', error);
      throw new Error(
        `Traffic conditions lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getWeatherConditions(location: Coordinates): Promise<WeatherCondition> {
    // Google doesn't provide weather API directly, so we'll use a fallback or integration
    // In production, you would integrate with OpenWeatherMap, Weather.com API, or similar
    return this.getMockWeatherConditions(location);
  }

  async getRoadConditionReport(location: Coordinates): Promise<RoadConditionReport> {
    try {
      const [trafficConditions, weather] = await Promise.all([
        this.getTrafficConditions([location]), // Single point check
        this.getWeatherConditions(location),
      ]);

      const overallImpact = this.calculateOverallImpact(trafficConditions, weather);
      const estimatedDelay = trafficConditions.reduce(
        (sum, condition) => sum + (condition.delay || 0),
        0
      );
      const recommendedActions = this.generateRecommendations(trafficConditions, weather);

      return {
        location,
        conditions: trafficConditions,
        weather,
        overallImpact,
        recommendedActions,
        estimatedDelay,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Road condition report error:', error);
      throw new Error(
        `Road condition report failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getMockWeatherConditions(location: Coordinates): WeatherCondition {
    // Mock weather data - in production, integrate with weather API
    const isNorthernQuebec = location.lat > 48;
    const isWinter = new Date().getMonth() >= 10 || new Date().getMonth() <= 3;

    return {
      temperature: isWinter ? (isNorthernQuebec ? -15 : -5) : isNorthernQuebec ? 10 : 20,
      description: isWinter ? (isNorthernQuebec ? 'Snow' : 'Light snow') : 'Clear',
      visibility: isWinter ? 5 : 15,
      precipitation: isWinter ? 2 : 0,
      windSpeed: isNorthernQuebec ? 25 : 15,
      roadConditions: isWinter ? (isNorthernQuebec ? 'icy' : 'wet') : 'clear',
      drivingImpact: isWinter ? (isNorthernQuebec ? 'severe' : 'moderate') : 'none',
      recommendedSpeedReduction: isWinter ? (isNorthernQuebec ? 40 : 20) : 0,
      location,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateOverallImpact(
    conditions: TrafficCondition[],
    weather: WeatherCondition
  ): RoadConditionReport['overallImpact'] {
    const hasSeververeConditions =
      conditions.some((c) => c.severity === 'severe') || weather.drivingImpact === 'severe';
    const hasModerateConditions =
      conditions.some((c) => c.severity === 'heavy' || c.severity === 'moderate') ||
      weather.drivingImpact === 'moderate';
    const hasMinorConditions = conditions.length > 0 || weather.drivingImpact === 'minor';

    if (hasSeververeConditions) return 'severe';
    if (hasModerateConditions) return 'moderate';
    if (hasMinorConditions) return 'minor';
    return 'none';
  }

  private generateRecommendations(
    conditions: TrafficCondition[],
    weather: WeatherCondition
  ): string[] {
    const recommendations: string[] = [];

    if (weather.drivingImpact === 'severe') {
      recommendations.push(
        'Consider postponing non-essential travel due to severe weather conditions'
      );
      recommendations.push(
        `Reduce speed by ${weather.recommendedSpeedReduction}% if travel is necessary`
      );
    } else if (weather.drivingImpact === 'moderate') {
      recommendations.push('Exercise caution due to weather conditions');
      recommendations.push(`Reduce speed by ${weather.recommendedSpeedReduction}%`);
    }

    if (weather.roadConditions === 'icy') {
      recommendations.push('Ensure winter tires are installed and carry emergency supplies');
    } else if (weather.roadConditions === 'snowy') {
      recommendations.push('Allow extra time for travel and maintain safe following distance');
    }

    const severeTraffic = conditions.filter((c) => c.severity === 'severe');
    if (severeTraffic.length > 0) {
      recommendations.push('Consider alternate routes due to severe traffic conditions');
    }

    const roadClosures = conditions.filter((c) => c.type === 'road_closure');
    if (roadClosures.length > 0) {
      recommendations.push('Road closures detected - alternate routes required');
    }

    const construction = conditions.filter((c) => c.type === 'construction');
    if (construction.length > 0) {
      recommendations.push('Construction zones ahead - expect delays and reduced speeds');
    }

    return recommendations;
  }
}

export class WeatherAPIProvider implements TrafficProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getTrafficConditions(route: Coordinates[]): Promise<TrafficCondition[]> {
    // Weather API providers don't typically provide traffic, so return empty
    return [];
  }

  async getWeatherConditions(location: Coordinates): Promise<WeatherCondition> {
    try {
      // Using OpenWeatherMap API as example
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: location.lat,
          lon: location.lng,
          appid: this.apiKey,
          units: 'metric',
        },
        timeout: 10000,
      });

      const data = response.data;
      const weather = data.weather[0];
      const main = data.main;

      // Analyze road conditions based on weather
      let roadConditions: WeatherCondition['roadConditions'] = 'clear';
      let drivingImpact: WeatherCondition['drivingImpact'] = 'none';
      let speedReduction = 0;

      const isRaining = weather.main.toLowerCase().includes('rain');
      const isSnowing = weather.main.toLowerCase().includes('snow');
      const isIcy = main.temp < 0 && (isRaining || data.humidity > 80);
      const lowVisibility = data.visibility < 5000; // Less than 5km visibility

      if (isIcy) {
        roadConditions = 'icy';
        drivingImpact = 'severe';
        speedReduction = 40;
      } else if (isSnowing) {
        roadConditions = 'snowy';
        drivingImpact = 'moderate';
        speedReduction = 25;
      } else if (isRaining || lowVisibility) {
        roadConditions = 'wet';
        drivingImpact = 'minor';
        speedReduction = 15;
      }

      // Increase impact for extreme temperatures
      if (main.temp < -20 || main.temp > 35) {
        if (drivingImpact === 'none') drivingImpact = 'minor';
        else if (drivingImpact === 'minor') drivingImpact = 'moderate';
      }

      return {
        temperature: Math.round(main.temp),
        description: weather.description,
        visibility: (data.visibility || 10000) / 1000, // Convert to km
        precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
        windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // Convert m/s to km/h
        roadConditions,
        drivingImpact,
        recommendedSpeedReduction: speedReduction,
        location,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error(
        `Weather conditions lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getRoadConditionReport(location: Coordinates): Promise<RoadConditionReport> {
    try {
      const weather = await this.getWeatherConditions(location);
      const conditions: TrafficCondition[] = []; // No traffic data from weather API

      const overallImpact = weather.drivingImpact;
      const recommendedActions = this.generateWeatherRecommendations(weather);

      return {
        location,
        conditions,
        weather,
        overallImpact,
        recommendedActions,
        estimatedDelay:
          weather.drivingImpact === 'severe' ? 30 : weather.drivingImpact === 'moderate' ? 15 : 0,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Weather road condition report error:', error);
      throw new Error(
        `Weather road condition report failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private generateWeatherRecommendations(weather: WeatherCondition): string[] {
    const recommendations: string[] = [];

    if (weather.temperature < -20) {
      recommendations.push('Extreme cold conditions - ensure vehicle is winter-ready');
      recommendations.push('Allow extra time for vehicle warm-up and travel');
    } else if (weather.temperature > 35) {
      recommendations.push('Extreme heat - ensure adequate vehicle cooling and hydration');
    }

    if (weather.roadConditions === 'icy') {
      recommendations.push('Icy road conditions - use winter tires and drive with extreme caution');
    } else if (weather.roadConditions === 'snowy') {
      recommendations.push('Snowy conditions - reduce speed and increase following distance');
    } else if (weather.roadConditions === 'wet') {
      recommendations.push('Wet road conditions - reduce speed and avoid sudden movements');
    }

    if (weather.visibility < 1) {
      recommendations.push('Very low visibility - consider postponing travel if possible');
    } else if (weather.visibility < 5) {
      recommendations.push('Reduced visibility - use headlights and drive slowly');
    }

    if (weather.windSpeed > 50) {
      recommendations.push('High wind conditions - be alert for crosswinds, especially on bridges');
    }

    return recommendations;
  }
}

export class TrafficConditionsService {
  private provider: TrafficProvider;

  constructor(provider: TrafficProvider) {
    this.provider = provider;
  }

  static create(): TrafficConditionsService {
    // Choose provider based on environment variables
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const weatherApiKey = process.env.OPENWEATHER_API_KEY;

    if (googleApiKey) {
      return new TrafficConditionsService(new GoogleTrafficProvider(googleApiKey));
    } else if (weatherApiKey) {
      return new TrafficConditionsService(new WeatherAPIProvider(weatherApiKey));
    } else {
      // Fallback to mock provider for development
      return new TrafficConditionsService(new MockTrafficProvider());
    }
  }

  async getTrafficConditions(route: Coordinates[]): Promise<TrafficCondition[]> {
    return await this.provider.getTrafficConditions(route);
  }

  async getWeatherConditions(location: Coordinates): Promise<WeatherCondition> {
    return await this.provider.getWeatherConditions(location);
  }

  async getRoadConditionReport(location: Coordinates): Promise<RoadConditionReport> {
    return await this.provider.getRoadConditionReport(location);
  }

  async getRouteConditionsReport(route: Coordinates[]): Promise<{
    route: Coordinates[];
    reports: RoadConditionReport[];
    overallImpact: 'none' | 'minor' | 'moderate' | 'severe';
    totalEstimatedDelay: number;
    criticalIssues: string[];
  }> {
    try {
      const reports: RoadConditionReport[] = [];

      // Sample key points along the route for condition checks
      const checkPoints = this.sampleRoutePoints(route, 5); // Check up to 5 points

      for (const point of checkPoints) {
        const report = await this.getRoadConditionReport(point);
        reports.push(report);

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const overallImpact = this.calculateRouteOverallImpact(reports);
      const totalEstimatedDelay = reports.reduce((sum, report) => sum + report.estimatedDelay, 0);
      const criticalIssues = this.extractCriticalIssues(reports);

      return {
        route,
        reports,
        overallImpact,
        totalEstimatedDelay,
        criticalIssues,
      };
    } catch (error) {
      console.error('Route conditions report error:', error);
      throw new Error(
        `Route conditions report failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private sampleRoutePoints(route: Coordinates[], maxPoints: number): Coordinates[] {
    if (route.length <= maxPoints) return route;

    const step = Math.floor(route.length / maxPoints);
    const sampled: Coordinates[] = [route[0]]; // Always include start

    for (let i = step; i < route.length - step; i += step) {
      sampled.push(route[i]);
    }

    sampled.push(route[route.length - 1]); // Always include end
    return sampled;
  }

  private calculateRouteOverallImpact(
    reports: RoadConditionReport[]
  ): 'none' | 'minor' | 'moderate' | 'severe' {
    const impacts = reports.map((r) => r.overallImpact);

    if (impacts.includes('severe')) return 'severe';
    if (impacts.includes('moderate')) return 'moderate';
    if (impacts.includes('minor')) return 'minor';
    return 'none';
  }

  private extractCriticalIssues(reports: RoadConditionReport[]): string[] {
    const issues: string[] = [];

    reports.forEach((report) => {
      if (report.overallImpact === 'severe') {
        issues.push(...report.recommendedActions);
      }

      report.conditions.forEach((condition) => {
        if (condition.severity === 'severe' || condition.type === 'road_closure') {
          issues.push(condition.description);
        }
      });
    });

    // Remove duplicates
    return Array.from(new Set(issues));
  }
}

// Mock provider for development/testing
class MockTrafficProvider implements TrafficProvider {
  async getTrafficConditions(route: Coordinates[]): Promise<TrafficCondition[]> {
    // Mock some traffic conditions for Northern Quebec routes
    const conditions: TrafficCondition[] = [];

    // Simulate construction on longer routes
    if (route.length > 2) {
      conditions.push({
        severity: 'moderate',
        description: 'Construction zone - single lane traffic',
        delay: 15,
        affectedSegment: {
          start: route[1],
          end: route[2],
          description: 'Highway construction zone',
        },
        type: 'construction',
        source: 'Mock Traffic',
      });
    }

    return conditions;
  }

  async getWeatherConditions(location: Coordinates): Promise<WeatherCondition> {
    const isNorthernQuebec = location.lat > 48;
    const isWinter = new Date().getMonth() >= 10 || new Date().getMonth() <= 3;

    return {
      temperature: isWinter ? (isNorthernQuebec ? -12 : -3) : isNorthernQuebec ? 8 : 18,
      description: isWinter ? 'Light snow' : 'Partly cloudy',
      visibility: isWinter ? 8 : 15,
      precipitation: isWinter ? 1 : 0,
      windSpeed: 20,
      roadConditions: isWinter ? 'snowy' : 'clear',
      drivingImpact: isWinter ? 'moderate' : 'none',
      recommendedSpeedReduction: isWinter ? 25 : 0,
      location,
      timestamp: new Date().toISOString(),
    };
  }

  async getRoadConditionReport(location: Coordinates): Promise<RoadConditionReport> {
    const [conditions, weather] = await Promise.all([
      this.getTrafficConditions([location]),
      this.getWeatherConditions(location),
    ]);

    return {
      location,
      conditions,
      weather,
      overallImpact: weather.drivingImpact,
      recommendedActions:
        weather.drivingImpact !== 'none' ? ['Exercise caution due to weather conditions'] : [],
      estimatedDelay: weather.drivingImpact === 'moderate' ? 10 : 0,
      updatedAt: new Date().toISOString(),
    };
  }
}
