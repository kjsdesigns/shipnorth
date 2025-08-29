import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface ModernStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  href?: string;
}

export default function ModernStatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  color = 'blue',
  href,
}: ModernStatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  };

  const Card = href ? 'a' : 'div';
  const cardProps = href ? { href } : {};

  return (
    <Card
      {...cardProps}
      className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            {href && (
              <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>

          {change !== undefined && (
            <div className="mt-3 flex items-center text-sm">
              {change >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400">+{change}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600 dark:text-red-400">{change}%</span>
                </>
              )}
              {changeLabel && (
                <span className="ml-2 text-gray-500 dark:text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
