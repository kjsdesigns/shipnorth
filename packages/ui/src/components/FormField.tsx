import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  className?: string;
  inputClassName?: string;
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  options = [],
  rows = 3,
  className = '',
  inputClassName = '',
}: FormFieldProps) {
  const baseInputClass = `
    w-full px-4 py-3 border rounded-lg 
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    ${error 
      ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-900/20' 
      : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700'
    }
    ${inputClassName}
  `.trim().replace(/\s+/g, ' ');

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={baseInputClass}
          />
        );
      
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={baseInputClass}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
}