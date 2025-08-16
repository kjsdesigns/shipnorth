import { useState, useCallback } from 'react';
import { Load, LoadStats, LocationTracking } from '@shipnorth/shared';
import { useApiList, useApiMutation, useApi } from '@shipnorth/ui';
import { loadAPI } from '@/lib/api';

export function useLoads() {
  const {
    items: loads,
    loading,
    error,
    refresh,
  } = useApiList(() => loadAPI.list(), {});

  const { mutate: createLoad, loading: creating } = useApiMutation(
    (loadData: any) => loadAPI.create(loadData)
  );

  const { mutate: updateLoad, loading: updating } = useApiMutation(
    ({ loadId, data }: { loadId: string; data: any }) => loadAPI.update(loadId, data)
  );

  const { mutate: assignPackages, loading: assigning } = useApiMutation(
    ({ loadId, packageIds }: { loadId: string; packageIds: string[] }) =>
      loadAPI.assignPackages(loadId, packageIds)
  );

  const handleCreateLoad = useCallback(async (loadData: any) => {
    const result = await createLoad(loadData);
    if (result) {
      refresh();
      return result;
    }
    return null;
  }, [createLoad, refresh]);

  const handleUpdateLoad = useCallback(async (loadId: string, data: any) => {
    const result = await updateLoad({ loadId, data });
    if (result) {
      refresh();
      return result;
    }
    return null;
  }, [updateLoad, refresh]);

  const handleAssignPackages = useCallback(async (loadId: string, packageIds: string[]) => {
    const result = await assignPackages({ loadId, packageIds });
    if (result) {
      refresh();
      return true;
    }
    return false;
  }, [assignPackages, refresh]);

  return {
    // Data
    loads: loads as Load[],
    
    // Loading states
    loading,
    creating,
    updating,
    assigning,
    error,
    
    // Actions
    refresh,
    createLoad: handleCreateLoad,
    updateLoad: handleUpdateLoad,
    assignPackages: handleAssignPackages,
  };
}

export function useLoadDetails(loadId: string) {
  const { data: load, loading, error, execute: fetchLoad } = useApi(
    () => loadAPI.get(loadId),
    { immediate: !!loadId }
  );

  const { mutate: updateDeliveryCities, loading: updatingCities } = useApiMutation(
    (cities: any[]) => loadAPI.updateDeliveryCities(loadId, cities)
  );

  const { mutate: addLocation, loading: addingLocation } = useApiMutation(
    (locationData: { lat: number; lng: number; isManual: boolean; address?: string }) =>
      loadAPI.addLocation(loadId, locationData.lat, locationData.lng, locationData.isManual, locationData.address)
  );

  const handleUpdateCities = useCallback(async (cities: any[]) => {
    const result = await updateDeliveryCities(cities);
    if (result) {
      fetchLoad();
      return true;
    }
    return false;
  }, [updateDeliveryCities, fetchLoad]);

  const handleAddLocation = useCallback(async (
    lat: number, 
    lng: number, 
    isManual: boolean = false, 
    address?: string
  ) => {
    const result = await addLocation({ lat, lng, isManual, address });
    if (result) {
      fetchLoad();
      return true;
    }
    return false;
  }, [addLocation, fetchLoad]);

  return {
    // Data
    load: load?.load as Load | null,
    
    // Loading states
    loading,
    updatingCities,
    addingLocation,
    error,
    
    // Actions
    refresh: fetchLoad,
    updateDeliveryCities: handleUpdateCities,
    addLocation: handleAddLocation,
  };
}

export function useLoadTracking(loadId: string) {
  const { data, loading, error, execute: fetchLocations } = useApi(
    () => loadAPI.getLocations(loadId),
    { immediate: !!loadId }
  );

  const { mutate: addLocation, loading: addingLocation } = useApiMutation(
    (locationData: { lat: number; lng: number; isManual: boolean; address?: string }) =>
      loadAPI.addLocation(loadId, locationData.lat, locationData.lng, locationData.isManual, locationData.address)
  );

  const handleAddLocation = useCallback(async (
    lat: number,
    lng: number,
    isManual: boolean = false,
    address?: string
  ) => {
    const result = await addLocation({ lat, lng, isManual, address });
    if (result) {
      fetchLocations();
      return true;
    }
    return false;
  }, [addLocation, fetchLocations]);

  return {
    // Data
    currentLocation: data?.currentLocation as LocationTracking | null,
    locationHistory: (data?.locations || []) as LocationTracking[],
    
    // Loading states
    loading,
    addingLocation,
    error,
    
    // Actions
    refresh: fetchLocations,
    addLocation: handleAddLocation,
  };
}

export function useDriverLoads(driverId: string) {
  const { loads, loading, error, refresh } = useLoads();
  
  const driverLoads = loads.filter((load: Load) => 
    !load.driverId || load.driverId === driverId
  );
  
  const activeLoad = driverLoads.find((load: Load) => 
    load.status === 'in_transit' && load.driverId === driverId
  );

  const availableLoads = driverLoads.filter((load: Load) => 
    load.status === 'planned' && !load.driverId
  );

  const { mutate: startLoad, loading: starting } = useApiMutation(
    (loadId: string) => loadAPI.update(loadId, { 
      status: 'in_transit', 
      driverId 
    })
  );

  const { mutate: completeLoad, loading: completing } = useApiMutation(
    (loadId: string) => loadAPI.update(loadId, { status: 'delivered' })
  );

  const handleStartLoad = useCallback(async (loadId: string) => {
    const result = await startLoad(loadId);
    if (result) {
      refresh();
      return true;
    }
    return false;
  }, [startLoad, refresh]);

  const handleCompleteLoad = useCallback(async (loadId: string) => {
    const result = await completeLoad(loadId);
    if (result) {
      refresh();
      return true;
    }
    return false;
  }, [completeLoad, refresh]);

  return {
    // Data
    driverLoads,
    activeLoad,
    availableLoads,
    
    // Loading states
    loading,
    starting,
    completing,
    error,
    
    // Actions
    refresh,
    startLoad: handleStartLoad,
    completeLoad: handleCompleteLoad,
  };
}