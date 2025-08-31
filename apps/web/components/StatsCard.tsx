import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = 'blue',
}: StatsCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      icon: 'text-green-600 dark:text-green-400'
    },
    purple: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      icon: 'text-purple-600 dark:text-purple-400'
    },
    orange: {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      icon: 'text-orange-600 dark:text-orange-400'
    },
    red: {
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      icon: 'text-red-600 dark:text-red-400'
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>

          {change !== undefined && (
            <div className="mt-3 flex items-center text-sm">
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
              )}
              <span className={change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {Math.abs(change)}%
              </span>
              {changeLabel && <span className="ml-2 text-gray-500 dark:text-gray-400">{changeLabel}</span>}
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl ${colorClasses[color].bg}`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].icon}`} />
        </div>
      </div>
    </div>
  );
}
