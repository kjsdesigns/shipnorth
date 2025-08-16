'use client';

import { Load } from '@shipnorth/shared';
import { DataTable, Column, TableAction, StatusBadge } from '@shipnorth/ui';
import { formatDate } from '@shipnorth/utils';
import { Eye, Edit, MapPin, MoreVertical } from 'lucide-react';

interface LoadTableProps {
  loads: (Load & { 
    packageCount?: number;
    destinationInfo?: {
      withDates: number;
      total: number;
      cities: any[];
    };
    deliveryDateRange?: {
      earliest: string;
      latest: string;
    };
  })[];
  loading?: boolean;
  onViewLoad: (load: Load) => void;
  onEditLoad: (load: Load) => void;
  onViewRoute: (load: Load) => void;
}

export default function LoadTable({
  loads,
  loading = false,
  onViewLoad,
  onEditLoad,
  onViewRoute,
}: LoadTableProps) {
  const columns: Column<Load & { 
    packageCount?: number;
    destinationInfo?: any;
    deliveryDateRange?: any;
  }>[] = [
    {
      key: 'id',
      header: 'Load ID',
      accessor: (load) => (
        <span className="font-medium text-gray-900 dark:text-white">
          Load #{load.id.slice(-6)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'driver',
      header: 'Driver',
      accessor: (load) => (
        <span className="text-gray-500 dark:text-gray-400">
          {load.driverName || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (load) => (
        <StatusBadge status={load.status} type="load" />
      ),
      sortable: true,
    },
    {
      key: 'departureDate',
      header: 'Departure Date',
      accessor: (load) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatDate(load.departureDate)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'destinations',
      header: 'Destinations',
      accessor: (load) => (
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 dark:text-gray-400">
            {load.destinationInfo?.withDates || 0}/{load.destinationInfo?.total || 0} cities
          </span>
          {load.destinationInfo?.cities && load.destinationInfo.cities.length > 0 && (
            <div className="relative group">
              <button className="text-blue-500 hover:text-blue-700">
                <Eye className="h-3 w-3" />
              </button>
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap z-10">
                {load.destinationInfo.cities.map((city: any, idx: number) => (
                  <div key={idx}>
                    {city.city}, {city.province} {city.expectedDeliveryDate ? `(${formatDate(city.expectedDeliveryDate)})` : '(TBD)'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'deliveryDates',
      header: 'Delivery Dates',
      accessor: (load) => (
        <span className="text-gray-500 dark:text-gray-400">
          {load.deliveryDateRange?.earliest && load.deliveryDateRange?.latest ? (
            <span>
              {formatDate(load.deliveryDateRange.earliest)} - {formatDate(load.deliveryDateRange.latest)}
            </span>
          ) : (
            load.defaultDeliveryDate ? formatDate(load.defaultDeliveryDate) : '-'
          )}
        </span>
      ),
    },
    {
      key: 'currentLocation',
      header: 'Current Location',
      accessor: (load) => (
        <div className="text-gray-500 dark:text-gray-400">
          {load.currentLocation ? (
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-green-500" />
              <span className="text-xs">
                {load.currentLocation.address || `${load.currentLocation.lat.toFixed(3)}, ${load.currentLocation.lng.toFixed(3)}`}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">No location</span>
          )}
        </div>
      ),
    },
  ];

  const actions: TableAction<Load>[] = [
    {
      label: 'View Details',
      onClick: onViewLoad,
      icon: Eye,
      variant: 'secondary',
    },
    {
      label: 'Edit Load',
      onClick: onEditLoad,
      icon: Edit,
      variant: 'secondary',
    },
    {
      label: 'View Route',
      onClick: onViewRoute,
      icon: MapPin,
      variant: 'secondary',
    },
  ];

  return (
    <DataTable
      data={loads}
      columns={columns}
      actions={actions}
      loading={loading}
      emptyMessage="No loads found"
      getItemId={(load) => load.id}
    />
  );
}