import React from 'react';
import { ShipmentStatus, LoadStatus, PaymentStatus } from '@shipnorth/shared';

interface StatusBadgeProps {
  status: ShipmentStatus | LoadStatus | PaymentStatus | string;
  type?: 'shipment' | 'load' | 'payment';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getStatusConfig = (status: string, type: string = 'shipment') => {
  const configs = {
    shipment: {
      ready: { color: 'gray', label: 'Ready for Pickup' },
      in_transit: { color: 'blue', label: 'In Transit' },
      delivered: { color: 'green', label: 'Delivered' },
      exception: { color: 'red', label: 'Delivery Exception' },
      returned: { color: 'yellow', label: 'Returned to Sender' },
    },
    load: {
      planned: { color: 'gray', label: 'Planned' },
      in_transit: { color: 'yellow', label: 'In Transit' },
      delivered: { color: 'blue', label: 'Delivered' },
      complete: { color: 'green', label: 'Complete' },
    },
    payment: {
      unpaid: { color: 'gray', label: 'Unpaid' },
      pending: { color: 'yellow', label: 'Pending' },
      paid: { color: 'green', label: 'Paid' },
      failed: { color: 'red', label: 'Failed' },
      refunded: { color: 'orange', label: 'Refunded' },
      writeoff: { color: 'purple', label: 'Write-off' },
    },
  };

  const config = configs[type as keyof typeof configs]?.[status] || {
    color: 'gray',
    label: status,
  };

  return config;
};

const getColorClasses = (color: string, size: string) => {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const sizeMap = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return `${colorMap[color as keyof typeof colorMap]} ${sizeMap[size as keyof typeof sizeMap]}`;
};

export default function StatusBadge({ 
  status, 
  type = 'shipment', 
  size = 'md', 
  className = '' 
}: StatusBadgeProps) {
  const config = getStatusConfig(status, type);
  const classes = getColorClasses(config.color, size);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${classes} ${className}`}
    >
      {config.label}
    </span>
  );
}