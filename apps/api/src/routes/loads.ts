/// <reference path="../types/express.d.ts" />
import { Router } from 'express';
import { authorize, authenticate } from '../middleware/auth';
import { LoadModel } from '../models/load';
import { PackageModel } from '../models/package';
import { CustomerModel } from '../models/customer';

const router = Router();

// List loads
router.get('/', authenticate, async (req, res) => {
  try {
    const { driver } = req.query;

    // Handle driver-specific loads
    if (driver === 'current' && req.user?.role === 'driver') {
      // Mock load for demo driver
      const mockLoad = {
        id: 'load-demo-001',
        driverName: 'John Driver',
        driverId: 'driver-1',
        departureDate: new Date().toISOString(),
        status: 'in_transit',
        transportMode: 'truck',
        deliveryCities: [
          { city: 'Vancouver', province: 'BC', country: 'Canada' },
          { city: 'Richmond', province: 'BC', country: 'Canada' },
          { city: 'Burnaby', province: 'BC', country: 'Canada' },
        ],
        locationHistory: [],
        packages: [], // Will be populated in the frontend for demo
      };

      return res.json({ loads: [mockLoad] });
    }

    const loads = await LoadModel.list();

    // Add package counts and destination info
    const loadsWithDetails = await Promise.all(
      loads.map(async (load) => {
        const packages = await LoadModel.getPackages(load.id);
        const destinationsWithDates =
          load.deliveryCities?.filter((city) => typeof city === 'object' && city.expectedDeliveryDate).length || 0;
        const totalDestinations = load.deliveryCities?.length || 0;

        return {
          ...load,
          packageCount: packages.length,
          destinationInfo: {
            withDates: destinationsWithDates,
            total: totalDestinations,
            cities: load.deliveryCities || [],
          },
          deliveryDateRange: {
            earliest: load.deliveryCities?.reduce(
              (min, city) =>
                typeof city === 'object' && city.expectedDeliveryDate && (!min || city.expectedDeliveryDate < min)
                  ? city.expectedDeliveryDate
                  : min,
              ''
            ),
            latest: load.deliveryCities?.reduce(
              (max, city) =>
                typeof city === 'object' && city.expectedDeliveryDate && (!max || city.expectedDeliveryDate > max)
                  ? city.expectedDeliveryDate
                  : max,
              ''
            ),
          },
        };
      })
    );

    res.json({ loads: loadsWithDetails });
  } catch (error: any) {
    console.error('Error listing loads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get load details
router.get('/:id', async (req, res) => {
  try {
    const load = await LoadModel.findById(req.params.id);
    if (!load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    const packageIds = await LoadModel.getPackages(load.id);
    
    // Get package details with address information using direct SQL
    const packageDetails = [];
    for (const packageId of packageIds) {
      try {
        const pkg = await PackageModel.findById(packageId);
        if (pkg) {
          // Get customer info
          const customer = await CustomerModel.findById(pkg.customer_id);
          
          // Get complete address info including coordinates from PostgreSQL
          const addressResult = await PackageModel.query(`
            SELECT address_line1, address_line2, city, province_state as province, postal_code, country, coordinates, geocoding_status
            FROM addresses 
            WHERE id = $1
          `, [pkg.ship_to_address_id]);
          
          console.log(`Address query for package ${packageId}:`, {
            ship_to_address_id: pkg.ship_to_address_id,
            addressFound: addressResult.rows.length > 0,
            address: addressResult.rows[0]
          });
          
          const address = addressResult.rows[0];
          
          // Structure package data for frontend compatibility
          const packageWithAddress = {
            ...pkg,
            trackingNumber: pkg.tracking_number,
            shipTo: address ? {
              name: customer?.name || 'Unknown',
              address1: address.address_line1,
              address2: address.address_line2,
              city: address.city,
              province: address.province,
              postalCode: address.postal_code,
              country: address.country
            } : null,
            address: address ? {
              coordinates: address.coordinates ? (typeof address.coordinates === 'string' ? JSON.parse(address.coordinates) : address.coordinates) : null,
              geocodingStatus: address.geocoding_status || 'not_attempted'
            } : null,
            customer: customer ? {
              name: customer.name,
              email: customer.email
            } : null
          };
          
          packageDetails.push(packageWithAddress);
        }
      } catch (error) {
        console.warn(`Failed to load package ${packageId}:`, error);
      }
    }

    res.json({
      load: {
        ...load,
        packages: packageDetails,
      },
    });
  } catch (error: any) {
    console.error('Error getting load:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update delivery cities
router.put('/:id/delivery-cities', authorize('staff', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { cities } = req.body;

    const success = await LoadModel.updateDeliveryCities(id, cities);
    if (!success) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating delivery cities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add location tracking
router.post('/:id/location', authorize('staff', 'admin', 'driver'), async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, address, isManual } = req.body;
    const addedBy = req.user?.id;

    const success = await LoadModel.addLocationTracking(id, { lat, lng, isManual, addedBy, address });
    if (!success) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error adding location tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get location history
router.get('/:id/locations', async (req, res) => {
  try {
    const load = await LoadModel.findById(req.params.id);
    if (!load) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({
      locations: load.locationHistory || [],
      currentLocation: load.currentLocation,
    });
  } catch (error: any) {
    console.error('Error getting locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update load (staff only)
router.put('/:id', authorize('staff', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate required fields if creating from scratch
    if (updates.departureDate) {
      if (!updates.transportMode) {
        return res
          .status(400)
          .json({ error: 'transportMode is required when updating departureDate' });
      }
    }

    const updatedLoad = await LoadModel.update(id, updates);

    if (!updatedLoad) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({ load: updatedLoad });
  } catch (error: any) {
    console.error('Error updating load:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create load (staff only)
router.post('/', authorize('staff', 'admin'), async (req, res) => {
  try {
    const loadData = req.body;
    const newLoad = await LoadModel.create(loadData);
    res.json({ load: newLoad });
  } catch (error: any) {
    console.error('Error creating load:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign packages to load
router.put('/:id/assign-packages', authorize('staff', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { packageIds } = req.body;

    const success = await LoadModel.assignPackages(id, packageIds);
    if (!success) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({ success: true, assignedCount: packageIds.length });
  } catch (error: any) {
    console.error('Error assigning packages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate manifest
router.get('/:id/manifest', async (req, res) => {
  res.json({ manifestUrl: 'https://s3.amazonaws.com/...' });
});

// Update GPS position (driver) - deprecated, use /location instead
router.post('/:id/gps', authorize('driver', 'staff', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const addedBy = req.user?.id;

    const success = await LoadModel.addLocationTracking(id, { lat, lng, isManual: false, addedBy });
    if (!success) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating GPS:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
