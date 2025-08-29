import { VALIDATION_RULES } from '@shipnorth/shared';

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export class ValidationHelper {
  static validateEmail(email: string): string | null {
    if (!email) return 'Email is required';
    if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  static validatePhone(phone: string): string | null {
    if (!phone) return 'Phone number is required';
    if (!VALIDATION_RULES.PHONE_REGEX.test(phone)) {
      return 'Please enter a valid phone number';
    }
    return null;
  }

  static validatePostalCode(postalCode: string, country: string = 'CA'): string | null {
    if (!postalCode) return 'Postal code is required';

    const regex =
      country === 'CA'
        ? VALIDATION_RULES.POSTAL_CODE_CA_REGEX
        : VALIDATION_RULES.POSTAL_CODE_US_REGEX;

    if (!regex.test(postalCode)) {
      return `Please enter a valid ${country === 'CA' ? 'Canadian' : 'US'} postal code`;
    }
    return null;
  }

  static validateRequired(value: any, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  }

  static validateNumeric(value: any, fieldName: string): string | null {
    if (value === undefined || value === null || value === '') return null;
    if (isNaN(Number(value))) {
      return `${fieldName} must be a valid number`;
    }
    return null;
  }

  static validatePositive(value: number, fieldName: string): string | null {
    if (!value) return null;
    if (Number(value) <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  }

  static validateFileSize(
    file: any,
    maxSizeMB: number = VALIDATION_RULES.MAX_FILE_SIZE_MB
  ): string | null {
    if (!file) return null;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  }

  // Validate customer registration data
  static validateCustomerRegistration(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'addressLine1',
      'city',
      'province',
      'postalCode',
      'country',
    ];

    requiredFields.forEach((field) => {
      const error = this.validateRequired(data[field], field);
      if (error) errors.push({ field, message: error });
    });

    // Email validation
    if (data.email) {
      const emailError = this.validateEmail(data.email);
      if (emailError) errors.push({ field: 'email', message: emailError });
    }

    // Phone validation
    if (data.phone) {
      const phoneError = this.validatePhone(data.phone);
      if (phoneError) errors.push({ field: 'phone', message: phoneError });
    }

    // Postal code validation
    if (data.postalCode && data.country) {
      const postalError = this.validatePostalCode(data.postalCode, data.country);
      if (postalError) errors.push({ field: 'postalCode', message: postalError });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate package data
  static validatePackageData(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Required fields
    const requiredError = this.validateRequired(data.customerId, 'customerId');
    if (requiredError) errors.push({ field: 'customerId', message: requiredError });

    // Dimensions validation
    ['length', 'width', 'height', 'weight'].forEach((field) => {
      const numericError = this.validateNumeric(data[field], field);
      if (numericError) errors.push({ field, message: numericError });

      if (data[field] !== undefined) {
        const positiveError = this.validatePositive(data[field], field);
        if (positiveError) errors.push({ field, message: positiveError });
      }
    });

    // Weight limits
    if (data.weight && data.weight > 50) {
      errors.push({ field: 'weight', message: 'Weight cannot exceed 50kg' });
    }

    // Ship-to address validation
    if (data.shipTo) {
      const shipToErrors = this.validateAddress(data.shipTo);
      shipToErrors.forEach((error) => {
        errors.push({ field: `shipTo.${error.field}`, message: error.message });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate address data
  static validateAddress(address: any): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    const requiredFields = ['name', 'address1', 'city', 'province', 'postalCode', 'country'];
    requiredFields.forEach((field) => {
      const error = this.validateRequired(address[field], field);
      if (error) errors.push({ field, message: error });
    });

    if (address.postalCode && address.country) {
      const postalError = this.validatePostalCode(address.postalCode, address.country);
      if (postalError) errors.push({ field: 'postalCode', message: postalError });
    }

    return errors;
  }

  // Validate load data
  static validateLoadData(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    const requiredError = this.validateRequired(data.departureDate, 'departureDate');
    if (requiredError) errors.push({ field: 'departureDate', message: requiredError });

    // Validate departure date is in the future (optional business rule)
    if (data.departureDate) {
      const departureDate = new Date(data.departureDate);
      const now = new Date();
      if (departureDate < now) {
        errors.push({
          field: 'departureDate',
          message: 'Departure date must be in the future',
        });
      }
    }

    // Validate delivery cities
    if (data.deliveryCities && Array.isArray(data.deliveryCities)) {
      data.deliveryCities.forEach((city: any, index: number) => {
        if (!city.city) {
          errors.push({
            field: `deliveryCities[${index}].city`,
            message: 'City name is required',
          });
        }
        if (!city.province) {
          errors.push({
            field: `deliveryCities[${index}].province`,
            message: 'Province is required',
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // General purpose object validator
  static validateObject(
    obj: any,
    rules: Record<string, (value: any) => string | null>
  ): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    Object.entries(rules).forEach(([field, validator]) => {
      const error = validator(obj[field]);
      if (error) {
        errors.push({ field, message: error });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
