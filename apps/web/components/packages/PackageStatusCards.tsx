'use client';

import { PackageStats } from '@shipnorth/shared';
import { Package, CheckCircle, Truck } from 'lucide-react';

interface PackageStatusCardsProps {
  stats: PackageStats;
  onStatusClick: (status: string) => void;
  loading?: boolean;
}

export default function PackageStatusCards({ 
  stats, 
  onStatusClick, 
  loading = false 
}: PackageStatusCardsProps) {
  const cards = [
    {
      title: 'Unassigned Packages',
      count: stats.unassigned,
      icon: Package,
      color: 'orange',
      status: 'unassigned',
    },
    {
      title: 'Assigned Packages', 
      count: stats.assigned,
      icon: CheckCircle,
      color: 'blue',
      status: 'assigned',
    },
    {
      title: 'In Transit',
      count: stats.in_transit,
      icon: Truck,
      color: 'green',
      status: 'in_transit',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      orange: 'text-orange-500',
      blue: 'text-blue-500',
      green: 'text-green-500',
    };
    return colorMap[color as keyof typeof colorMap] || 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.status}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onStatusClick(card.status)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.count}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
            </div>
            <card.icon className={`h-8 w-8 ${getColorClasses(card.color)}`} />
          </div>
        </div>
      ))}
    </div>
  );
}