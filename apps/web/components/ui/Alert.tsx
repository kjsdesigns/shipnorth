import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export default function Alert({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const variants = {
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-800 dark:text-green-200',
      textColor: 'text-green-700 dark:text-green-300',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-800 dark:text-red-200',
      textColor: 'text-red-700 dark:text-red-300',
    },
    warning: {
      container: 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800',
      icon: AlertTriangle,
      iconColor: 'text-orange-600 dark:text-orange-400',
      titleColor: 'text-orange-800 dark:text-orange-200',
      textColor: 'text-orange-700 dark:text-orange-300',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-800 dark:text-blue-200',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={`${config.container} rounded-lg p-4 ${className}`.trim()}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${config.textColor}`}>
            {children}
          </div>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 ${config.textColor} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current`}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}