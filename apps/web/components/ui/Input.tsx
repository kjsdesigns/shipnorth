import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  help,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseStyles = 'border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
  
  const errorStyles = error 
    ? 'border-red-500 focus:ring-red-500' 
    : '';
  
  const paddingStyles = Icon 
    ? iconPosition === 'left' ? 'pl-10 pr-3 py-2' : 'pl-3 pr-10 py-2'
    : 'px-3 py-2';

  const combinedClassName = `
    ${baseStyles}
    ${errorStyles}
    ${paddingStyles}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        <input
          id={inputId}
          className={combinedClassName}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
      
      {help && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}