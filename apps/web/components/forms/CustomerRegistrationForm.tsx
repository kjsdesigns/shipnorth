'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerRegistrationData } from '@shipnorth/shared';
import { FormField, useForm, commonValidators } from '@shipnorth/ui';
import { customerAPI } from '@/lib/api';
import { User, MapPin, Shield, CreditCard, CheckCircle } from 'lucide-react';

interface CustomerRegistrationFormProps {
  onSuccess?: () => void;
  onExistingCustomer?: (email: string) => void;
}

const PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'YT', label: 'Yukon' },
];

const COUNTRIES = [
  { value: 'CA', label: 'Canada' },
  { value: 'US', label: 'United States' },
];

export default function CustomerRegistrationForm({
  onSuccess,
  onExistingCustomer,
}: CustomerRegistrationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<CustomerRegistrationData>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'CA',
    },
    validationRules: {
      firstName: commonValidators.required,
      lastName: commonValidators.required,
      email: (value) => commonValidators.required(value) || commonValidators.email(value),
      phone: (value) => commonValidators.required(value) || commonValidators.phone(value),
      addressLine1: commonValidators.required,
      city: commonValidators.required,
      province: commonValidators.required,
      postalCode: (value) => commonValidators.required(value) || commonValidators.postalCode(value, form.values.country),
      country: commonValidators.required,
    },
    onSubmit: async (values) => {
      try {
        const response = await customerAPI.register(values);
        
        if (response.data.loginSuggested) {
          onExistingCustomer?.(values.email);
          return;
        }

        onSuccess?.();
      } catch (error: any) {
        throw error;
      }
    },
  });

  const nextStep = () => {
    if (currentStep === 1) {
      const step1Fields = ['firstName', 'lastName', 'email', 'phone'] as const;
      const hasErrors = step1Fields.some(field => {
        form.setFieldTouched(field);
        return !form.validateField(field);
      });
      
      if (!hasErrors) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const step2Fields = ['addressLine1', 'city', 'province', 'postalCode'] as const;
      const hasErrors = step2Fields.some(field => {
        form.setFieldTouched(field);
        return !form.validateField(field);
      });
      
      if (!hasErrors) {
        setCurrentStep(3);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-300 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Let's start with your basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="First Name"
          name="firstName"
          value={form.values.firstName}
          onChange={(e) => form.setValue('firstName', e.target.value)}
          error={form.touched.firstName ? form.errors.firstName : ''}
          required
        />
        <FormField
          label="Last Name"
          name="lastName"
          value={form.values.lastName}
          onChange={(e) => form.setValue('lastName', e.target.value)}
          error={form.touched.lastName ? form.errors.lastName : ''}
          required
        />
      </div>

      <FormField
        label="Email Address"
        name="email"
        type="email"
        value={form.values.email}
        onChange={(e) => form.setValue('email', e.target.value)}
        error={form.touched.email ? form.errors.email : ''}
        required
      />

      <FormField
        label="Phone Number"
        name="phone"
        type="tel"
        value={form.values.phone}
        onChange={(e) => form.setValue('phone', e.target.value)}
        placeholder="+1 (555) 123-4567"
        error={form.touched.phone ? form.errors.phone : ''}
        required
      />

      <button
        type="button"
        onClick={nextStep}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        Continue to Address
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <MapPin className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Shipping Address</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Where should we send your packages?</p>
      </div>

      <FormField
        label="Address Line 1"
        name="addressLine1"
        value={form.values.addressLine1}
        onChange={(e) => form.setValue('addressLine1', e.target.value)}
        placeholder="123 Main Street"
        error={form.touched.addressLine1 ? form.errors.addressLine1 : ''}
        required
      />

      <FormField
        label="Address Line 2"
        name="addressLine2"
        value={form.values.addressLine2}
        onChange={(e) => form.setValue('addressLine2', e.target.value)}
        placeholder="Apartment, suite, etc."
        error={form.touched.addressLine2 ? form.errors.addressLine2 : ''}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="City"
          name="city"
          value={form.values.city}
          onChange={(e) => form.setValue('city', e.target.value)}
          error={form.touched.city ? form.errors.city : ''}
          required
        />
        <FormField
          label="Province"
          name="province"
          type="select"
          value={form.values.province}
          onChange={(e) => form.setValue('province', e.target.value)}
          placeholder="Select Province"
          options={PROVINCES}
          error={form.touched.province ? form.errors.province : ''}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Postal Code"
          name="postalCode"
          value={form.values.postalCode}
          onChange={(e) => form.setValue('postalCode', e.target.value)}
          placeholder="A1A 1A1"
          error={form.touched.postalCode ? form.errors.postalCode : ''}
          required
        />
        <FormField
          label="Country"
          name="country"
          type="select"
          value={form.values.country}
          onChange={(e) => form.setValue('country', e.target.value)}
          options={COUNTRIES}
          error={form.touched.country ? form.errors.country : ''}
          required
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Shield className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Review & Create Account</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Confirm your information before proceeding</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {form.values.firstName} {form.values.lastName}<br />
            {form.values.email}<br />
            {form.values.phone}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Shipping Address</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {form.values.addressLine1}<br />
            {form.values.addressLine2 && `${form.values.addressLine2}\n`}
            {form.values.city}, {form.values.province} {form.values.postalCode}<br />
            {form.values.country === 'CA' ? 'Canada' : 'United States'}
          </p>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={prevStep}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => form.handleSubmit()}
          disabled={form.loading}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
        >
          {form.loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      {renderProgressBar()}
      
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  );
}