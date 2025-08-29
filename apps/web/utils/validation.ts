import { CustomerFormData, PackageFormData } from '@/types';

// Base validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  phone?: boolean;
  postalCode?: boolean;
  numeric?: boolean;
  positive?: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Common validation functions
export const validators = {
  required: (value: any): string | null => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  minLength:
    (min: number) =>
    (value: string): string | null => {
      if (typeof value !== 'string') return null;
      if (value.length < min) {
        return `Must be at least ${min} characters`;
      }
      return null;
    },

  maxLength:
    (max: number) =>
    (value: string): string | null => {
      if (typeof value !== 'string') return null;
      if (value.length > max) {
        return `Cannot exceed ${max} characters`;
      }
      return null;
    },

  email: (value: string): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value: string): string | null => {
    if (!value) return null;
    // Allow various phone formats
    const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  postalCode: (value: string): string | null => {
    if (!value) return null;
    // Canadian postal code format
    const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    // US ZIP code format
    const usZipRegex = /^\d{5}(-\d{4})?$/;

    if (!canadianPostalRegex.test(value) && !usZipRegex.test(value)) {
      return 'Please enter a valid postal/ZIP code';
    }
    return null;
  },

  numeric: (value: any): string | null => {
    if (value === '' || value === null || value === undefined) return null;
    if (isNaN(Number(value))) {
      return 'Must be a valid number';
    }
    return null;
  },

  positive: (value: any): string | null => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return 'Must be a positive number';
    }
    return null;
  },

  integer: (value: any): string | null => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      return 'Must be a whole number';
    }
    return null;
  },

  min:
    (minimum: number) =>
    (value: any): string | null => {
      if (value === '' || value === null || value === undefined) return null;
      const num = Number(value);
      if (isNaN(num) || num < minimum) {
        return `Must be at least ${minimum}`;
      }
      return null;
    },

  max:
    (maximum: number) =>
    (value: any): string | null => {
      if (value === '' || value === null || value === undefined) return null;
      const num = Number(value);
      if (isNaN(num) || num > maximum) {
        return `Must be no more than ${maximum}`;
      }
      return null;
    },

  pattern:
    (regex: RegExp, message: string) =>
    (value: string): string | null => {
      if (!value) return null;
      if (!regex.test(value)) {
        return message;
      }
      return null;
    },
};

// Generic validation function
export function validateField(value: any, rules: ValidationRule): string | null {
  // Required validation
  if (rules.required) {
    const error = validators.required(value);
    if (error) return error;
  }

  // Skip other validations if field is empty and not required
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength !== undefined) {
      const error = validators.minLength(rules.minLength)(value);
      if (error) return error;
    }

    if (rules.maxLength !== undefined) {
      const error = validators.maxLength(rules.maxLength)(value);
      if (error) return error;
    }

    if (rules.email) {
      const error = validators.email(value);
      if (error) return error;
    }

    if (rules.phone) {
      const error = validators.phone(value);
      if (error) return error;
    }

    if (rules.postalCode) {
      const error = validators.postalCode(value);
      if (error) return error;
    }

    if (rules.pattern) {
      const error = validators.pattern(rules.pattern, 'Invalid format')(value);
      if (error) return error;
    }
  }

  // Numeric validations
  if (rules.numeric) {
    const error = validators.numeric(value);
    if (error) return error;
  }

  if (rules.positive) {
    const error = validators.positive(value);
    if (error) return error;
  }

  if (rules.integer) {
    const error = validators.integer(value);
    if (error) return error;
  }

  if (rules.min !== undefined) {
    const error = validators.min(rules.min)(value);
    if (error) return error;
  }

  if (rules.max !== undefined) {
    const error = validators.max(rules.max)(value);
    if (error) return error;
  }

  // Custom validation
  if (rules.custom) {
    const error = rules.custom(value);
    if (error) return error;
  }

  return null;
}

// Validate entire object
export function validateObject<T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema<T>
): ValidationResult {
  const errors: Record<string, string> = {};

  Object.keys(schema).forEach((key) => {
    const fieldKey = key as keyof T;
    const rules = schema[fieldKey];
    if (rules) {
      const error = validateField(data[fieldKey], rules);
      if (error) {
        errors[key] = error;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Predefined validation schemas for common forms
export const customerValidationSchema: ValidationSchema<CustomerFormData> = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  email: {
    required: true,
    email: true,
    maxLength: 255,
  },
  phone: {
    phone: true,
  },
  addressLine1: {
    required: true,
    minLength: 5,
    maxLength: 100,
  },
  addressLine2: {
    maxLength: 100,
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  province: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  postalCode: {
    required: true,
    postalCode: true,
  },
  country: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
};

export const packageValidationSchema: ValidationSchema<PackageFormData> = {
  customerId: {
    required: true,
  },
  recipientName: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  weight: {
    required: true,
    numeric: true,
    positive: true,
    max: 1000, // 1000kg max
  },
  length: {
    required: true,
    numeric: true,
    positive: true,
    max: 500, // 500cm max
  },
  width: {
    required: true,
    numeric: true,
    positive: true,
    max: 500, // 500cm max
  },
  height: {
    required: true,
    numeric: true,
    positive: true,
    max: 500, // 500cm max
  },
  notes: {
    maxLength: 500,
  },
};

// Validation for nested package recipient address
export const packageRecipientAddressSchema: ValidationSchema<PackageFormData['recipientAddress']> =
  {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    address1: {
      required: true,
      minLength: 5,
      maxLength: 100,
    },
    address2: {
      maxLength: 100,
    },
    city: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    province: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    postalCode: {
      required: true,
      postalCode: true,
    },
    country: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
  };

// Utility functions for common validation scenarios
export function validateEmail(email: string): boolean {
  return !validators.email(email);
}

export function validatePhone(phone: string): boolean {
  return !validators.phone(phone);
}

export function validatePostalCode(postalCode: string): boolean {
  return !validators.postalCode(postalCode);
}

export function validateCustomer(data: CustomerFormData): ValidationResult {
  return validateObject(data, customerValidationSchema);
}

export function validatePackage(data: PackageFormData): ValidationResult {
  // Validate main package data
  const mainValidation = validateObject(data, packageValidationSchema);

  // Validate recipient address
  const addressValidation = validateObject(data.recipientAddress, packageRecipientAddressSchema);

  // Combine errors
  const errors = {
    ...mainValidation.errors,
    // Prefix address errors with 'recipientAddress.'
    ...Object.fromEntries(
      Object.entries(addressValidation.errors).map(([key, value]) => [
        `recipientAddress.${key}`,
        value,
      ])
    ),
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
