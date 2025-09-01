import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RouteOptimizationService } from '../services/route-optimization';
import { LoadModel } from '../models/load';
import { PackageModel, Package } from '../models/package';
import { AddressModel, Address } from '../models/address';

const router = Router();

// Simple test endpoint for route optimization
router.get('/test-route/:loadId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { loadId } = req.params;

    console.log(`Testing route optimization for load: ${loadId}`);

    // Step 1: Check if load exists
    const load = await LoadModel.findById(loadId);
    if (!load) {
      return res.status(404).json({
        error: 'Load not found',
        loadId,
      });
    }

    console.log(`Load found: ${load.driverName}, status: ${load.status}`);

    // Step 2: Get package IDs
    const packageIds = await LoadModel.getPackages(loadId);
    console.log(`Package IDs for load: ${packageIds.length} packages`);

    if (packageIds.length === 0) {
      return res.status(400).json({
        error: 'No packages assigned to load',
        loadId,
        packageIds: [],
      });
    }

    // Step 3: Test package loading
    const testResults = {
      loadId,
      load: {
        id: load.id,
        driverName: load.driverName,
        status: load.status,
        packageCount: packageIds.length,
      },
      packageIds,
      packages: [] as Partial<Package>[],
      addresses: [] as (Partial<Address> | null)[],
      errors: [] as string[],
      analysis: null as any,
    };

    // Step 4: Load each package and its address
    for (let i = 0; i < Math.min(packageIds.length, 5); i++) {
      // Limit to first 5 for testing
      const packageId = packageIds[i];
      try {
        console.log(`Loading package: ${packageId}`);

        const pkg = await PackageModel.findById(packageId);
        if (!pkg) {
          testResults.errors.push(`Package ${packageId} not found`);
          continue;
        }

        console.log(`Package ${packageId} found, shipTo:`, JSON.stringify(pkg.shipTo, null, 2));

        // Check if it's new structure (addressId) or legacy structure
        if ((pkg.shipTo as any).addressId) {
          console.log(`Package ${packageId} uses new Address model structure`);
          const address = await AddressModel.findById((pkg.shipTo as any).addressId);
          testResults.addresses.push(address);
        } else if ((pkg.shipTo as any).address1) {
          console.log(`Package ${packageId} uses legacy embedded address structure`);
          testResults.addresses.push({
            id: `legacy-${packageId}`,
            address1: (pkg.shipTo as any).address1,
            city: (pkg.shipTo as any).city,
            province: (pkg.shipTo as any).province,
            geocodingStatus: 'not_attempted',
          });
        } else {
          testResults.errors.push(`Package ${packageId} has invalid shipTo structure`);
        }

        testResults.packages.push({
          id: pkg.id,
          customer_id: pkg.customer_id,
          shipTo: pkg.shipTo,
          weight: pkg.weight,
        });
      } catch (error) {
        console.error(`Error loading package ${packageId}:`, error);
        testResults.errors.push(
          `Error loading package ${packageId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Step 5: Try simple route analysis
    try {
      console.log('Attempting route analysis...');
      const analysis = await RouteOptimizationService.analyzeLoadRouting(loadId);
      testResults.analysis = analysis;
      console.log('Route analysis completed:', analysis);
    } catch (error) {
      console.error('Route analysis failed:', error);
      testResults.errors.push(
        `Route analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    res.json({
      success: true,
      testResults,
      recommendations:
        testResults.errors.length > 0
          ? [
              'Some packages have data issues that need to be resolved',
              'Check package address data structure',
              'Ensure geocoding is completed for accurate routing',
            ]
          : ['All packages loaded successfully', 'Ready for route optimization'],
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      error: 'Test route failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

export default router;
