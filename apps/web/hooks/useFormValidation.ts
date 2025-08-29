import { useState, useCallback, useMemo } from 'react';
import { FormError } from '@/types';

type ValidationRule<T> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  email?: boolean;
  phone?: boolean;
  postalCode?: boolean;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

interface UseFormValidationReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  isValid: boolean;
  hasErrors: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  validate: (field?: keyof T) => boolean;
  validateAll: () => boolean;
  reset: () => void;
  getFieldError: (field: keyof T) => string | undefined;
  hasFieldError: (field: keyof T) => boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T> = {}
): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);

  const validateField = useCallback(
    (field: keyof T, value: T[typeof field]): string | null => {
      const rules = validationRules[field];
      if (!rules) return null;

      // Required validation
      if (rules.required && (value === null || value === undefined || value === '')) {
        return `${String(field)} is required`;
      }

      // Skip other validations if field is empty and not required
      if (!rules.required && (value === null || value === undefined || value === '')) {
        return null;
      }

      // String-specific validations
      if (typeof value === 'string') {
        // Min length validation
        if (rules.minLength && value.length < rules.minLength) {
          return `${String(field)} must be at least ${rules.minLength} characters`;
        }

        // Max length validation
        if (rules.maxLength && value.length > rules.maxLength) {
          return `${String(field)} cannot exceed ${rules.maxLength} characters`;
        }

        // Email validation
        if (rules.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
          }
        }

        // Phone validation
        if (rules.phone) {
          const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
          if (!phoneRegex.test(value)) {
            return 'Please enter a valid phone number';
          }
        }

        // Postal code validation (Canadian format)
        if (rules.postalCode) {
          const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
          if (!postalCodeRegex.test(value)) {
            return 'Please enter a valid postal code (e.g., A1A 1A1)';
          }
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
          return `${String(field)} format is invalid`;
        }
      }

      // Custom validation
      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) {
          return customError;
        }
      }

      return null;
    },
    [validationRules]
  );

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field value changes
    setErrorsState((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({
      ...prev,
      ...newValues,
    }));

    // Clear errors for updated fields
    setErrorsState((prev) => {
      const newErrors = { ...prev };
      Object.keys(newValues).forEach((key) => {
        delete newErrors[key as keyof T];
      });
      return newErrors;
    });
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrorsState((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrorsState((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrorsState({} as Record<keyof T, string>);
  }, []);

  const validate = useCallback(
    (field?: keyof T): boolean => {
      if (field) {
        const error = validateField(field, values[field]);
        if (error) {
          setError(field, error);
          return false;
        } else {
          clearError(field);
          return true;
        }
      }

      return validateAll();
    },
    [values, validateField, setError, clearError]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;
    let hasErrors = false;

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field as keyof T, values[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        hasErrors = true;
      }
    });

    setErrorsState(newErrors);
    return !hasErrors;
  }, [values, validationRules, validateField]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    clearErrors();
  }, [initialValues, clearErrors]);

  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return errors[field];
    },
    [errors]
  );

  const hasFieldError = useCallback(
    (field: keyof T): boolean => {
      return !!errors[field];
    },
    [errors]
  );

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    values,
    errors,
    isValid,
    hasErrors,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    validate,
    validateAll,
    reset,
    getFieldError,
    hasFieldError,
  };
}
