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
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>

          {change !== undefined && (
            <div className="mt-3 flex items-center text-sm">
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
              )}
              <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
                {Math.abs(change)}%
              </span>
              {changeLabel && <span className="ml-2 text-gray-400">{changeLabel}</span>}
            </div>
          )}
        </div>

        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );
}
