'use client';

import { useState } from 'react';
import { Package } from '@shipnorth/shared';
import { DataTable, Column, TableAction, StatusBadge } from '@shipnorth/ui';
import { formatWeight, formatDate } from '@shipnorth/utils';
import { Eye, Edit, CheckCircle, MoreVertical } from 'lucide-react';

interface PackageTableProps {
  packages: (Package & { expectedDeliveryDate?: string })[];
  loading?: boolean;
  selectedPackages: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onViewPackage: (pkg: Package) => void;
  onEditPackage: (pkg: Package) => void;
  onMarkDelivered: (pkg: Package) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
}

export default function PackageTable({
  packages,
  loading = false,
  selectedPackages,
  onSelectionChange,
  onViewPackage,
  onEditPackage,
  onMarkDelivered,
  pagination,
}: PackageTableProps) {
  const columns: Column<Package & { expectedDeliveryDate?: string }>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking #',
      accessor: (pkg) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {pkg.trackingNumber || `PKG-${pkg.id.slice(-6)}`}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'recipient',
      header: 'Recipient',
      accessor: (pkg) => (
        <span className="text-gray-500 dark:text-gray-400">
          {pkg.shipTo?.name || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (pkg) => (
        <StatusBadge status={pkg.shipmentStatus} type="shipment" />
      ),
      sortable: true,
    },
    {
      key: 'load',
      header: 'Load',
      accessor: (pkg) => (
        <span className="text-gray-500 dark:text-gray-400">
          {pkg.loadId ? `Load #${pkg.loadId.slice(-6)}` : 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'expectedDelivery',
      header: 'Expected Delivery',
      accessor: (pkg) => (
        <span className="text-gray-500 dark:text-gray-400">
          {pkg.expectedDeliveryDate ? formatDate(pkg.expectedDeliveryDate) : '-'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'weight',
      header: 'Weight',
      accessor: (pkg) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatWeight(pkg.weight || 0)}
        </span>
      ),
      sortable: true,
    },
  ];

  const actions: TableAction<Package>[] = [
    {
      label: 'View Details',
      onClick: onViewPackage,
      icon: Eye,
      variant: 'secondary',
    },
    {
      label: 'Edit Package',
      onClick: onEditPackage,
      icon: Edit,
      variant: 'secondary',
    },
    {
      label: 'Mark as Delivered',
      onClick: onMarkDelivered,
      icon: CheckCircle,
      variant: 'primary',
      show: (pkg) => pkg.shipmentStatus !== 'delivered',
    },
  ];

  return (
    <DataTable
      data={packages}
      columns={columns}
      actions={actions}
      loading={loading}
      selectable={true}
      selectedItems={selectedPackages}
      onSelectionChange={onSelectionChange}
      getItemId={(pkg) => pkg.id}
      emptyMessage="No packages found"
      pagination={pagination}
      className="mb-6"
    />
  );
}