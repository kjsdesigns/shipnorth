import { Request, Response } from 'express';
import { LoadService } from '../services/load.service';
import { ResponseHelper, asyncHandler } from '../utils/response';
import { ValidationHelper } from '../utils/validation';

export class LoadController {
  static listLoads = asyncHandler(async (req: Request, res: Response) => {
    const loads = await LoadModel.list();

    // Add package counts and destination info
    const loadsWithDetails = await Promise.all(
      loads.map(async (load) => {
        const packages = await LoadModel.getPackages(load.id);
        const destinationsWithDates =
          load.deliveryCities?.filter((city) => city.expectedDeliveryDate).length || 0;
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
                city.expectedDeliveryDate && (!min || city.expectedDeliveryDate < min)
                  ? city.expectedDeliveryDate
                  : min,
              ''
            ),
            latest: load.deliveryCities?.reduce(
              (max, city) =>
                city.expectedDeliveryDate && (!max || city.expectedDeliveryDate > max)
                  ? city.expectedDeliveryDate
                  : max,
              ''
            ),
          },
        };
      })
    );

    ResponseHelper.success(res, { loads: loadsWithDetails });
  });

  static getLoad = asyncHandler(async (req: Request, res: Response) => {
    const load = await LoadService.getLoadWithDetails(req.params.id);

    if (!load) {
      return ResponseHelper.notFound(res, 'Load not found');
    }

    ResponseHelper.success(res, { load });
  });

  static createLoad = asyncHandler(async (req: Request, res: Response) => {
    const validation = ValidationHelper.validateLoadData(req.body);

    if (!validation.isValid) {
      return ResponseHelper.validationError(res, validation.errors);
    }

    const newLoad = await LoadService.createLoadWithOptimization(req.body);
    ResponseHelper.created(res, { load: newLoad }, 'Load created successfully');
  });

  static updateLoad = asyncHandler(async (req: Request, res: Response) => {
    const load = await LoadModel.update(req.params.id, req.body);

    if (!load) {
      return ResponseHelper.notFound(res, 'Load not found');
    }

    ResponseHelper.success(res, { load }, 'Load updated successfully');
  });

  static assignPackages = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { packageIds } = req.body;

    if (!packageIds || !Array.isArray(packageIds)) {
      return ResponseHelper.badRequest(res, 'packageIds array is required');
    }

    await LoadService.assignPackagesToLoad(id, packageIds);

    ResponseHelper.success(
      res,
      { assignedCount: packageIds.length },
      'Packages assigned successfully'
    );
  });

  static updateDeliveryCities = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { cities, originAddress } = req.body;

    if (!Array.isArray(cities)) {
      return ResponseHelper.badRequest(res, 'cities array is required');
    }

    const updatedCities = await LoadService.updateDeliveryCitiesWithOptimization(
      id,
      cities,
      originAddress
    );

    ResponseHelper.success(res, { cities: updatedCities }, 'Delivery cities updated');
  });

  static addLocation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { lat, lng, address, isManual } = req.body;
    const addedBy = req.user?.id;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return ResponseHelper.badRequest(res, 'Valid latitude and longitude are required');
    }

    const location = await LoadService.addLocationTracking(
      id,
      lat,
      lng,
      isManual || false,
      addedBy,
      address
    );

    ResponseHelper.success(res, { location }, 'Location added successfully');
  });

  static getLocations = asyncHandler(async (req: Request, res: Response) => {
    const load = await LoadModel.findById(req.params.id);

    if (!load) {
      return ResponseHelper.notFound(res, 'Load not found');
    }

    ResponseHelper.success(
      res,
      {
        locations: load.locationHistory || [],
        currentLocation: load.currentLocation,
      },
      'Locations retrieved successfully'
    );
  });

  static startLoad = asyncHandler(async (req: Request, res: Response) => {
    const driverId = req.user?.id;
    if (!driverId) {
      return ResponseHelper.unauthorized(res, 'Driver ID is required');
    }

    const updatedLoad = await LoadService.startLoad(req.params.id, driverId);
    ResponseHelper.success(res, { load: updatedLoad }, 'Load started successfully');
  });

  static completeLoad = asyncHandler(async (req: Request, res: Response) => {
    const updatedLoad = await LoadService.completeLoad(req.params.id);
    ResponseHelper.success(res, { load: updatedLoad }, 'Load completed successfully');
  });

  static getDriverLoads = asyncHandler(async (req: Request, res: Response) => {
    const driverId = req.user?.id;
    if (!driverId) {
      return ResponseHelper.unauthorized(res, 'Driver ID is required');
    }

    const loads = await LoadService.getDriverLoads(driverId);
    const activeLoad = await LoadService.getActiveLoadForDriver(driverId);

    ResponseHelper.success(
      res,
      {
        loads,
        activeLoad,
      },
      'Driver loads retrieved successfully'
    );
  });
}
