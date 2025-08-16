import { useState, useCallback } from 'react';
import { ValidationError, VALIDATION_RULES } from '@shipnorth/shared';

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, (value: any) => string | null>>;
  onSubmit?: (values: T) => Promise<void> | void;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  loading: boolean;
  setValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  handleSubmit: (e?: React.FormEvent) => void;
  reset: () => void;
  isValid: boolean;
  isDirty: boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [loading, setLoading] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    setTouchedState(prev => ({ ...prev, [field]: true }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrorsState(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T, touchedValue = true) => {
    setTouchedState(prev => ({ ...prev, [field]: touchedValue }));
  }, []);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  const setErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrorsState(prev => ({ ...prev, ...newErrors }));
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    const validator = validationRules[field];
    if (!validator) return true;

    const error = validator(values[field]);
    if (error) {
      setFieldError(field, error);
      return false;
    }

    setFieldError(field, '');
    return true;
  }, [values, validationRules, setFieldError]);

  const validateForm = useCallback((): boolean => {
    let isFormValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    Object.keys(validationRules).forEach((fieldKey) => {
      const field = fieldKey as keyof T;
      const validator = validationRules[field];
      
      if (validator) {
        const error = validator(values[field]);
        if (error) {
          newErrors[field] = error;
          isFormValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [values, validationRules, setErrors]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm() || !onSubmit) return;

    try {
      setLoading(true);
      await onSubmit(values);
    } catch (error: any) {
      // Handle submission errors
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        const fieldErrors: Partial<Record<keyof T, string>> = {};
        
        apiErrors.forEach((err: ValidationError) => {
          fieldErrors[err.field as keyof T] = err.message;
        });
        
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  }, [validateForm, onSubmit, values, setErrors]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrorsState({} as Record<keyof T, string>);
    setTouchedState({} as Record<keyof T, boolean>);
    setLoading(false);
  }, [initialValues]);

  const isValid = Object.values(errors).every(error => !error);
  const isDirty = Object.values(touched).some(Boolean);

  return {
    values,
    errors,
    touched,
    loading,
    setValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    isValid,
    isDirty,
  };
}

// Common validation functions
export const commonValidators = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return null;
  },
  
  email: (value: string) => {
    if (!value) return null;
    if (!VALIDATION_RULES.EMAIL_REGEX.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  phone: (value: string) => {
    if (!value) return null;
    if (!VALIDATION_RULES.PHONE_REGEX.test(value)) {
      return 'Please enter a valid phone number';
    }
    return null;
  },
  
  postalCode: (value: string, country: string = 'CA') => {
    if (!value) return null;
    const regex = country === 'CA' 
      ? VALIDATION_RULES.POSTAL_CODE_CA_REGEX 
      : VALIDATION_RULES.POSTAL_CODE_US_REGEX;
    
    if (!regex.test(value)) {
      return `Please enter a valid ${country === 'CA' ? 'Canadian' : 'US'} postal code`;
    }
    return null;
  },
  
  minLength: (min: number) => (value: string) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },
  
  maxLength: (max: number) => (value: string) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },
  
  numeric: (value: any) => {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return 'Must be a valid number';
    }
    return null;
  },
  
  positive: (value: number) => {
    if (!value) return null;
    if (Number(value) <= 0) {
      return 'Must be a positive number';
    }
    return null;
  },
};