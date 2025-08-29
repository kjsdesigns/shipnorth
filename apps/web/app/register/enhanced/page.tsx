'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { customerAPI, authAPI } from '@/lib/api';
import ModernLayout from '@/components/ModernLayout';
import PayPalCardForm from '@/components/PayPalCardForm';
import { 
  User, MapPin, CreditCard, Building2, CheckCircle, AlertCircle, 
  Phone, Mail, Home, Globe, Eye, ChevronDown
} from 'lucide-react';

// Google Places autocomplete interface
declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

interface RegistrationData {
  // Personal/Business Info
  accountType: 'personal' | 'business';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName?: string;
  primaryContactName?: string;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  
  // Address coordinates for map
  lat?: number;
  lng?: number;
  formattedAddress?: string;
}

export default function EnhancedRegistration() {
  const router = useRouter();
  const addressRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  
  const [formData, setFormData] = useState<RegistrationData>({
    accountType: 'personal',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    primaryContactName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'CA'
  });

  // Initialize Google Places API
  useEffect(() => {
    // Load Google Places API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = initializeGooglePlaces;
      document.head.appendChild(script);
    } else {
      initializeGooglePlaces();
    }
  }, []);

  const initializeGooglePlaces = () => {
    if (!window.google || !addressRef.current) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'ca' }
    });
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        handlePlaceSelect(place);
      }
    });
    
    setAutocompleteService(autocomplete);
  };

  const handlePlaceSelect = (place: any) => {
    const addressComponents = place.address_components || [];
    
    const getComponent = (type: string) => {
      const component = addressComponents.find((comp: any) => 
        comp.types.includes(type)
      );
      return component?.long_name || '';
    };
    
    const streetNumber = getComponent('street_number');
    const streetName = getComponent('route');
    const city = getComponent('locality') || getComponent('administrative_area_level_3');
    const province = getComponent('administrative_area_level_1');
    const postalCode = getComponent('postal_code');
    
    setFormData(prev => ({
      ...prev,
      addressLine1: `${streetNumber} ${streetName}`.trim(),
      city,
      province,
      postalCode,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      formattedAddress: place.formatted_address
    }));
    
    // Update map if available
    if (map && place.geometry) {
      map.setCenter(place.geometry.location);
      map.setZoom(15);
      
      // Add marker
      new window.google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: 'Your Address'
      });
    }
  };

  // Postal code lookup for auto-population
  const handlePostalCodeChange = async (postalCode: string) => {
    setFormData(prev => ({ ...prev, postalCode }));
    
    // Clean postal code (remove spaces, uppercase)
    const cleanPostalCode = postalCode.replace(/\s/g, '').toUpperCase();
    
    if (cleanPostalCode.length === 6) {
      try {
        const response = await authAPI.lookupPostalCode(cleanPostalCode);
        
        if (response.success) {
          setFormData(prev => ({
            ...prev,
            city: response.city,
            province: response.province,
            postalCode: cleanPostalCode
          }));
          
          console.log('📍 Postal code lookup successful:', response);
        }
      } catch (error) {
        console.log('📍 Postal code lookup failed:', error);
      }
    }
  };

  // Initialize map preview
  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;
    
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 43.6532, lng: -79.3832 }, // Toronto default
      disableDefaultUI: true,
      gestureHandling: 'none', // View only
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });
    
    setMap(mapInstance);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'postalCode') {
      handlePostalCodeChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateStep1 = () => {
    const required = ['firstName', 'lastName', 'email', 'phone'];
    if (formData.accountType === 'business') {
      required.push('businessName', 'primaryContactName');
    }
    return required.every((field) => formData[field as keyof RegistrationData]?.trim() !== '');
  };

  const validateStep2 = () => {
    const required = ['addressLine1', 'city', 'province', 'postalCode'];
    return required.every((field) => formData[field as keyof RegistrationData]?.trim() !== '');
  };

  // Step 1: Personal/Business Information + Address (Combined)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep1() || !validateStep2()) {
      setError('Please fill in all required fields');
      return;
    }
    
    setCurrentStep(2);
    setError('');
    
    // Initialize map for address preview
    setTimeout(initializeMap, 100);
  };

  // Step 2: Payment Setup (Verification Only)
  const handleStep2Submit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create customer account using enhanced registration
      const response = await authAPI.registerEnhanced({
        ...formData,
        accountType: formData.accountType
      });
      
      if (response.data?.error) {
        setError(response.data.error);
        return;
      }
      
      setCustomerId(response.data.customerId);
      setCurrentStep(3); // Go to completion
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Combined Personal + Address
  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-8">
      {/* Account Type Selection */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
            formData.accountType === 'personal' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}>
            <input
              type="radio"
              name="accountType"
              value="personal"
              checked={formData.accountType === 'personal'}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className="flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Personal Account</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">For individual shipping needs</div>
              </div>
            </div>
          </label>
          
          <label className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
            formData.accountType === 'business' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}>
            <input
              type="radio"
              name="accountType"
              value="business"
              checked={formData.accountType === 'business'}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Business Account</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">For business shipping</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formData.accountType === 'business' ? 'Business & Contact Information' : 'Personal Information'}
          </h3>
        </div>
        
        {formData.accountType === 'business' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Your Company Name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Contact Person *
              </label>
              <input
                type="text"
                name="primaryContactName"
                value={formData.primaryContactName}
                onChange={handleInputChange}
                placeholder="Contact person's full name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>
      </div>

      {/* Address Information with Google Places */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <MapPin className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Address Information</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Street Address * 
              <span className="text-xs text-blue-600 ml-2">Start typing for suggestions</span>
            </label>
            <input
              ref={addressRef}
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              placeholder="Start typing your address..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Apartment, Suite, etc. (Optional)
            </label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleInputChange}
              placeholder="Apt 123, Suite 456, etc."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Province *
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Province</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="NS">Nova Scotia</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
                <option value="YT">Yukon</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Postal Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="A1A 1A1"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium flex items-center"
        >
          Continue to Payment Setup
          <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
        </button>
      </div>
    </form>
  );

  // Step 2: Address Preview + Payment Verification  
  const renderStep2 = () => (
    <div className="space-y-8">
      {/* Address Preview with Map */}
      {formData.lat && formData.lng && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Eye className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Address Verification</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Confirmed Address:</h4>
                <div className="text-green-800 dark:text-green-200">
                  <div>{formData.formattedAddress || `${formData.addressLine1}${formData.addressLine2 ? ', ' + formData.addressLine2 : ''}`}</div>
                  <div>{formData.city}, {formData.province} {formData.postalCode}</div>
                  <div>Canada</div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" ref={mapRef}>
                {/* Google Map will be inserted here */}
                <div className="flex items-center justify-center h-full text-gray-500">
                  📍 Map Preview Loading...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Setup */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Method Setup</h3>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <div className="text-blue-800 dark:text-blue-200">
              <div className="font-medium">Verification Only</div>
              <div className="text-sm">We'll verify your payment method without charging. You'll only pay when shipping packages.</div>
            </div>
          </div>
        </div>

        <PayPalCardForm
          onSuccess={(details) => {
            console.log('Payment verification successful:', details);
            handleStep2Submit();
          }}
          onError={(error) => {
            setError(`Payment setup failed: ${error.message}`);
          }}
          amount={0} // Verification only
          mode="verification"
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg"
        >
          ← Back to Information
        </button>
        
        <button
          type="button"
          onClick={handleStep2Submit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium"
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );

  // Step 3: Completion
  const renderStep3 = () => (
    <div className="text-center space-y-8">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-8">
        <CheckCircle className="mx-auto h-20 w-20 text-green-600 mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Shipnorth!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Your {formData.accountType} account has been created successfully.
        </p>
        
        {formData.accountType === 'business' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Account Details:</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div><strong>Business:</strong> {formData.businessName}</div>
                <div><strong>Contact:</strong> {formData.primaryContactName}</div>
                <div><strong>Email:</strong> {formData.email}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What's Next?</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>✅ Create your first package</li>
            <li>✅ Get shipping quotes</li>
            <li>✅ Track your shipments</li>
            <li>✅ Manage your account</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Need Help?</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>📧 Email: support@shipnorth.com</li>
            <li>📞 Phone: 1-800-SHIPNORTH</li>
            <li>💬 Live Chat: Available 24/7</li>
            <li>📖 Help Center: /help</li>
          </ul>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => router.push('/portal')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium"
        >
          Go to Customer Portal
        </button>
        
        <Link
          href="/staff"
          className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-3 rounded-lg text-center"
        >
          Browse as Guest
        </Link>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Information & Address', icon: User },
    { number: 2, title: 'Payment Setup', icon: CreditCard },
    { number: 3, title: 'Complete', icon: CheckCircle }
  ];

  return (
    <ModernLayout role="guest">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-center">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-4 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
              </span>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>
          
          {/* Mobile Optimization - Collapsible sections on mobile */}
          <div className="md:hidden mt-8">
            <div className="text-center text-sm text-gray-500">
              Optimized for mobile • Swipe-friendly • One-handed use
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}

export default function EnhancedRegistrationPage() {
  return <EnhancedRegistration />;
}