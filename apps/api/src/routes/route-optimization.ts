import { Router, Request, Response } from 'express';
import { RouteOptimizationService, RouteOptimizationOptions } from '../services/route-optimization';
import { LoadModel } from '../models/load';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkCASLPermission } from '../middleware/casl-permissions';
import { TrafficConditionsService } from '../services/traffic-conditions';

const router = Router();

// Generate optimized route for a load
router.post(
  '/loads/:loadId/optimize-route',
  authenticate,
  checkCASLPermission({ action: 'update', resource: 'Route' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { loadId } = req.params;
      const options: RouteOptimizationOptions = req.body || {};

      // Validate load exists
      const load = await LoadModel.findById(loadId);
      if (!load) {
        return res.status(404).json({
          error: 'Load not found',
          loadId,
        });
      }

      // Check if load has packages
      const packageIds = await LoadModel.getPackages(loadId);
      if (packageIds.length === 0) {
        return res.status(400).json({
          error: 'Load has no packages assigned',
          loadId,
        });
      }

      console.log(`Generating route for load ${loadId} with ${packageIds.length} packages`);

      // Generate optimized route
      const optimizedRoute = await RouteOptimizationService.generateOptimizedRoute(loadId, options);

      // Update load with route optimization flag
      await LoadModel.update(loadId, {
        routeOptimized: true,
        estimatedDistance: optimizedRoute.totalDistance,
        estimatedDuration: optimizedRoute.totalDuration,
      });

      res.json({
        success: true,
        route: optimizedRoute,
        summary: {
          totalPackages: optimizedRoute.waypoints.length,
          totalCities: optimizedRoute.cityClusters.length,
          totalDistance: `${optimizedRoute.totalDistance} km`,
          totalDuration: `${Math.round(optimizedRoute.totalDuration / 60)} hours`,
          estimatedDays: optimizedRoute.estimatedDays,
          warningsCount: optimizedRoute.warnings.length,
        },
      });
    } catch (error) {
      console.error('Route optimization error:', error);
      res.status(500).json({
        error: 'Failed to optimize route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get route analysis for a load (without generating full route)
router.get(
  '/loads/:loadId/route-analysis',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { loadId } = req.params;

      const analysis = await RouteOptimizationService.analyzeLoadRouting(loadId);

      if (!analysis) {
        return res.status(404).json({ error: 'Unable to analyze route for this load' });
      }

      res.json({
        success: true,
        loadId,
        analysis,
        recommendations: [], // TODO: Implement generateRecommendations function
      });
    } catch (error) {
      console.error('Route analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get system-wide routing readiness
router.get('/routing-readiness', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const readiness = await RouteOptimizationService.getRoutingReadiness();

    if (!readiness) {
      return res.status(500).json({ error: 'Unable to assess routing readiness' });
    }

    res.json({
      success: true,
      readiness,
      status:
        readiness.readinessPercentage >= 80
          ? 'ready'
          : readiness.readinessPercentage >= 60
            ? 'partial'
            : 'not_ready',
      recommendations: [], // TODO: Implement generateReadinessRecommendations function
    });
  } catch (error) {
    console.error('Routing readiness error:', error);
    res.status(500).json({
      error: 'Failed to check routing readiness',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get route preview (lightweight version without full optimization)
router.get(
  '/loads/:loadId/route-preview',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { loadId } = req.params;

      const load = await LoadModel.findById(loadId);
      if (!load) {
        return res.status(404).json({
          error: 'Load not found',
          loadId,
        });
      }

      const packageIds = await LoadModel.getPackages(loadId);
      if (packageIds.length === 0) {
        return res.status(400).json({
          error: 'Load has no packages assigned',
          loadId,
        });
      }

      // Get basic analysis without full optimization
      const analysis = await RouteOptimizationService.analyzeLoadRouting(loadId);
      const readiness = await RouteOptimizationService.getRoutingReadiness();

      if (!analysis || !readiness) {
        return res.status(500).json({ error: 'Unable to analyze load routing' });
      }

      res.json({
        success: true,
        loadId,
        preview: {
          packageCount: analysis.packageCount,
          citiesCount: analysis.citiesCount,
          complexity: analysis.estimatedComplexity,
          geocodingStatus: {
            ready: analysis.geocodedPackages,
            missing: analysis.missingGeocodePackages,
            percentage: Math.round((analysis.geocodedPackages / analysis.packageCount) * 100),
          },
          estimatedOptimizationTime: 5, // TODO: Implement estimateOptimizationTime function
          canOptimize: analysis.missingGeocodePackages === 0,
        },
      });
    } catch (error) {
      console.error('Route preview error:', error);
      res.status(500).json({
        error: 'Failed to generate route preview',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get saved routes for a load
router.get('/loads/:loadId/saved-routes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { loadId } = req.params;

    const routes = await RouteOptimizationService.getAllSavedRoutes(loadId);

    res.json({
      success: true,
      loadId,
      routes,
      count: routes.length,
    });
  } catch (error) {
    console.error('Get saved routes error:', error);
    res.status(500).json({
      error: 'Failed to get saved routes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Apply a saved route
router.post('/routes/:routeId/apply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { routeId } = req.params;
    const appliedBy = req.user?.id || 'unknown';

    const result = await RouteOptimizationService.applyRoute(routeId, appliedBy);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Route applied successfully',
      route: result.route,
    });
  } catch (error) {
    console.error('Apply route error:', error);
    res.status(500).json({
      error: 'Failed to apply route',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get route history and analytics
router.get(
  '/loads/:loadId/route-history',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { loadId } = req.params;

      const history = await RouteOptimizationService.getRouteHistory(loadId);

      res.json({
        success: true,
        loadId,
        ...history,
      });
    } catch (error) {
      console.error('Get route history error:', error);
      res.status(500).json({
        error: 'Failed to get route history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Add driver feedback to a route
router.post('/routes/:routeId/feedback', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { routeId } = req.params;
    const { rating, comments, actualDuration, actualDistance, issues } = req.body;
    const submittedBy = req.user?.id || 'unknown';

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
    }

    const result = await RouteOptimizationService.addDriverFeedback(routeId, {
      rating,
      comments: comments || '',
      actualDuration,
      actualDistance,
      issues: issues || [],
      submittedBy,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Feedback added successfully',
      route: result.route,
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      error: 'Failed to add feedback',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get a specific saved route
router.get('/routes/:routeId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { routeId } = req.params;

    const route = await RouteOptimizationService.getSavedRoute('', routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    }

    res.json({
      success: true,
      route,
    });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({
      error: 'Failed to get route',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get current traffic and weather conditions for a load route
router.get(
  '/loads/:loadId/traffic-conditions',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { loadId } = req.params;

      // Get the active route for this load
      const activeRoute = await RouteOptimizationService.getSavedRoute(loadId);

      if (!activeRoute) {
        return res.status(404).json({
          success: false,
          error: 'No route found for this load',
        });
      }

      const trafficService = TrafficConditionsService.create();

      // Get coordinates from route clusters
      const routeCoordinates = activeRoute.cityClusters
        .filter((cluster) => cluster.coordinates)
        .map((cluster) => ({
          ...cluster.coordinates!,
          accuracy: 'approximate' as const,
          geocodedAt: new Date().toISOString(),
        }));

      if (routeCoordinates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No coordinates available for traffic conditions check',
        });
      }

      const routeConditions = await trafficService.getRouteConditionsReport(routeCoordinates);

      res.json({
        success: true,
        loadId,
        routeId: (activeRoute as any).id || 'unknown',
        conditions: routeConditions,
        summary: {
          overallImpact: routeConditions.overallImpact,
          totalEstimatedDelay: routeConditions.totalEstimatedDelay,
          criticalIssuesCount: routeConditions.criticalIssues.length,
          weatherImpact: routeConditions.reports
            .map((r) => r.weather.drivingImpact)
            .reduce((max, impact) => {
              const levels = ['none', 'minor', 'moderate', 'severe'];
              return levels.indexOf(impact) > levels.indexOf(max) ? impact : max;
            }, 'none'),
        },
        recommendations: routeConditions.criticalIssues.slice(0, 5), // Top 5 recommendations
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Traffic conditions error:', error);
      res.status(500).json({
        error: 'Failed to get traffic conditions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Get weather conditions for a specific location
router.get('/weather/:lat/:lng', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates provided',
      });
    }

    const trafficService = TrafficConditionsService.create();
    const weather = await trafficService.getWeatherConditions({
      lat: latitude,
      lng: longitude,
      accuracy: 'approximate' as const,
      geocodedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      location: { lat: latitude, lng: longitude },
      weather,
      drivingRecommendations: generateDrivingRecommendations(weather),
    });
  } catch (error) {
    console.error('Weather conditions error:', error);
    res.status(500).json({
      error: 'Failed to get weather conditions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper functions (would normally be in a separate utility file)
function generateRecommendations(analysis: any): string[] {
  const recommendations: string[] = [];

  if (analysis.missingGeocodePackages > 0) {
    recommendations.push(
      `${analysis.missingGeocodePackages} packages need geocoding before route optimization`
    );
  }

  if (analysis.estimatedComplexity === 'high') {
    recommendations.push(
      'This is a complex route. Consider splitting into multiple loads for better efficiency'
    );
  }

  if (analysis.citiesCount > 8) {
    recommendations.push(
      'Route spans many cities. Consider organizing by regions for multi-day delivery'
    );
  }

  if (analysis.packageCount > 30) {
    recommendations.push(
      'High package count detected. Ensure adequate vehicle capacity and delivery time'
    );
  }

  return recommendations;
}

function generateReadinessRecommendations(readiness: any): string[] {
  const recommendations: string[] = [];

  if (readiness.readinessPercentage < 80) {
    recommendations.push(
      `${readiness.pendingGeocoding} addresses need geocoding. Run geocoding process to improve routing accuracy`
    );
  }

  if (readiness.failedGeocoding > 0) {
    recommendations.push(
      `${readiness.failedGeocoding} addresses failed geocoding. Review and fix address formatting`
    );
  }

  if (readiness.readinessPercentage >= 95) {
    recommendations.push('Excellent geocoding coverage. Routes will be highly accurate');
  }

  return recommendations;
}

function estimateOptimizationTime(analysis: any): string {
  if (analysis.estimatedComplexity === 'low') {
    return '< 5 seconds';
  } else if (analysis.estimatedComplexity === 'medium') {
    return '5-15 seconds';
  } else {
    return '15-30 seconds';
  }
}

function generateDrivingRecommendations(weather: any): string[] {
  const recommendations: string[] = [];

  if (weather.drivingImpact === 'severe') {
    recommendations.push('Avoid travel if possible due to severe weather conditions');
  } else if (weather.drivingImpact === 'moderate') {
    recommendations.push('Exercise extreme caution and reduce speed');
  } else if (weather.drivingImpact === 'minor') {
    recommendations.push('Drive with care and allow extra time');
  }

  if (weather.recommendedSpeedReduction > 0) {
    recommendations.push(`Reduce speed by ${weather.recommendedSpeedReduction}%`);
  }

  if (weather.roadConditions === 'icy') {
    recommendations.push('Icy road conditions - winter tires essential');
  } else if (weather.roadConditions === 'snowy') {
    recommendations.push('Snowy conditions - increase following distance');
  } else if (weather.roadConditions === 'wet') {
    recommendations.push('Wet roads - avoid sudden movements');
  }

  if (weather.visibility < 5) {
    recommendations.push('Low visibility - use headlights and drive slowly');
  }

  return recommendations;
}

export default router;
