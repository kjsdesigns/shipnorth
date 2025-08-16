import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { LoadModel } from '../models/load';
import { PackageModel } from '../models/package';

const router = Router();

// List loads
router.get('/', async (req, res) => {
  try {
    const loads = await LoadModel.list();
    
    // Add package counts and destination info
    const loadsWithDetails = await Promise.all(
      loads.map(async (load) => {
        const packages = await LoadModel.getPackages(load.id);
        const destinationsWithDates = load.deliveryCities?.filter(city => city.expectedDeliveryDate).length || 0;
        const totalDestinations = load.deliveryCities?.length || 0;
        
        return {
          ...load,
          packageCount: packages.length,
          destinationInfo: {
            withDates: destinationsWithDates,
            total: totalDestinations,
            cities: load.deliveryCities || []
          },
          deliveryDateRange: {
            earliest: load.deliveryCities?.reduce((min, city) => 
              city.expectedDeliveryDate && (!min || city.expectedDeliveryDate < min) 
                ? city.expectedDeliveryDate : min, ''),
            latest: load.deliveryCities?.reduce((max, city) => 
              city.expectedDeliveryDate && (!max || city.expectedDeliveryDate > max) 
                ? city.expectedDeliveryDate : max, '')
          }
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
    
    const packages = await LoadModel.getPackages(load.id);
    const packageDetails = await Promise.all(
      packages.map(packageId => PackageModel.findById(packageId))
    );
    
    res.json({ 
      load: {
        ...load,
        packages: packageDetails.filter(Boolean)
      }
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
    
    const success = await LoadModel.addLocationTracking(id, lat, lng, isManual, addedBy, address);
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
      currentLocation: load.currentLocation
    });
  } catch (error: any) {
    console.error('Error getting locations:', error);
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
    
    const success = await LoadModel.addLocationTracking(id, lat, lng, false, addedBy);
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