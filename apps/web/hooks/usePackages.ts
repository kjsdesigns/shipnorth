import { useState, useCallback } from 'react';
import { Package, PackageStats, PaginationParams, FilterParams } from '@shipnorth/shared';
import { useApiList, useApiMutation } from '@shipnorth/ui';
import { packageAPI } from '@/lib/api';

interface UsePackagesOptions {
  initialFilters?: FilterParams;
  initialPagination?: PaginationParams;
}

export function usePackages(options: UsePackagesOptions = {}) {
  const [filters, setFilters] = useState<FilterParams>(options.initialFilters || {});
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const {
    items: packages,
    loading,
    error,
    refresh,
    params,
    updateParams,
    pagination,
  } = useApiList(
    (params) => packageAPI.list(params),
    { ...options.initialPagination, ...options.initialFilters }
  );

  const { mutate: bulkAssign, loading: bulkAssigning } = useApiMutation(
    ({ packageIds, loadId }: { packageIds: string[]; loadId: string }) =>
      packageAPI.bulkAssign(packageIds, loadId)
  );

  const { mutate: markDelivered, loading: markingDelivered } = useApiMutation(
    ({ packageId, deliveryData }: { packageId: string; deliveryData: any }) =>
      packageAPI.markDelivered(packageId, deliveryData)
  );

  const updateFilter = useCallback((key: keyof FilterParams, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateParams(newFilters);
  }, [filters, updateParams]);

  const clearFilters = useCallback(() => {
    setFilters({});
    updateParams({});
  }, [updateParams]);

  const handleBulkAssign = useCallback(async (loadId: string) => {
    if (selectedPackages.length === 0) return false;

    const result = await bulkAssign({ packageIds: selectedPackages, loadId });
    if (result) {
      setSelectedPackages([]);
      refresh();
      return true;
    }
    return false;
  }, [selectedPackages, bulkAssign, refresh]);

  const handleMarkDelivered = useCallback(async (packageId: string, deliveryData: any) => {
    const result = await markDelivered({ packageId, deliveryData });
    if (result) {
      refresh();
      return true;
    }
    return false;
  }, [markDelivered, refresh]);

  const selectAllPackages = useCallback(() => {
    setSelectedPackages(packages.map((pkg: Package) => pkg.id));
  }, [packages]);

  const clearSelection = useCallback(() => {
    setSelectedPackages([]);
  }, []);

  const togglePackageSelection = useCallback((packageId: string) => {
    setSelectedPackages(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  }, []);

  return {
    // Data
    packages: packages as (Package & { expectedDeliveryDate?: string })[],
    selectedPackages,
    pagination,
    filters,
    
    // Loading states
    loading,
    bulkAssigning,
    markingDelivered,
    error,
    
    // Actions
    refresh,
    updateFilter,
    clearFilters,
    handleBulkAssign,
    handleMarkDelivered,
    selectAllPackages,
    clearSelection,
    togglePackageSelection,
    
    // Pagination
    setPage: (page: number) => updateParams({ page }),
    setLimit: (limit: number) => updateParams({ limit }),
  };
}

export function usePackageStats() {
  return useApiList(() => packageAPI.getStats(), {});
}