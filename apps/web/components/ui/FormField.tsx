import { ReactNode, forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

interface BaseFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

// Input Field
interface InputFieldProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    { label, error, helperText, required = false, className = '', disabled = false, id, ...props },
    ref
  ) => {
    const fieldId = id || `field-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={fieldId}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          {...props}
        />

        {error && (
          <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
            {error}
          </div>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

// Textarea Field
interface TextareaFieldProps
  extends BaseFieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      className = '',
      disabled = false,
      id,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const fieldId = id || `field-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={fieldId}
          disabled={disabled}
          rows={rows}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical ${
            error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          {...props}
        />

        {error && (
          <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
            {error}
          </div>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

TextareaField.displayName = 'TextareaField';

// Select Field
interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  id?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      className = '',
      disabled = false,
      value,
      onChange,
      options,
      placeholder = 'Select...',
      id,
    },
    ref
  ) => {
    const fieldId = id || `field-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
            {error}
          </div>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

// Checkbox Field
interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  id?: string;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  (
    { error, helperText, className = '', disabled = false, checked, onChange, children, id },
    ref
  ) => {
    const fieldId = id || `field-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={className}>
        <div className="flex items-start">
          <input
            ref={ref}
            type="checkbox"
            id={fieldId}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className={`mt-1 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          />
          <label
            htmlFor={fieldId}
            className={`ml-2 text-sm text-gray-700 dark:text-gray-300 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {children}
          </label>
        </div>

        {error && (
          <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
            {error}
          </div>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 ml-6">{helperText}</p>
        )}
      </div>
    );
  }
);

CheckboxField.displayName = 'CheckboxField';

// Field Group for layout
interface FieldGroupProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FieldGroup({ children, columns = 1, className = '' }: FieldGroupProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>{children}</div>;
}
