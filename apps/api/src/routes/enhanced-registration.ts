import { Router, Request, Response } from 'express';
import { CustomerModel } from '../models/customer';
import { UserModel } from '../models/user';
import { DatabaseService, generateId } from '../services/database';

const router = Router();

interface EnhancedRegistrationData {
  // Account type
  accountType: 'personal' | 'business';
  
  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Business information (optional)
  businessName?: string;
  primaryContactName?: string;
  
  // Address information
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  
  // Geocoding data from Google Places
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  placeId?: string;
}

// Enhanced registration endpoint
router.post('/register-enhanced', async (req: Request, res: Response) => {
  try {
    const registrationData: EnhancedRegistrationData = req.body;
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'province', 'postalCode'];
    
    if (registrationData.accountType === 'business') {
      requiredFields.push('businessName', 'primaryContactName');
    }
    
    for (const field of requiredFields) {
      if (!registrationData[field as keyof EnhancedRegistrationData]) {
        return res.status(400).json({
          error: `Missing required field: ${field}`,
          field
        });
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationData.email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        field: 'email'
      });
    }
    
    // Validate Canadian postal code format
    const postalCodeRegex = /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/;
    if (!postalCodeRegex.test(registrationData.postalCode.replace(/\s/g, '').toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid Canadian postal code format',
        field: 'postalCode'
      });
    }
    
    // Check if email already exists
    const existingUser = await UserModel.findByEmail(registrationData.email);
    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email already exists',
        field: 'email'
      });
    }
    
    // Create customer record
    const customerId = generateId();
    const customer = await CustomerModel.create({
      id: customerId,
      accountType: registrationData.accountType,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      email: registrationData.email,
      phone: registrationData.phone,
      businessName: registrationData.businessName,
      primaryContactName: registrationData.primaryContactName,
      address: {
        line1: registrationData.addressLine1,
        line2: registrationData.addressLine2,
        city: registrationData.city,
        province: registrationData.province,
        postalCode: registrationData.postalCode.replace(/\s/g, '').toUpperCase(),
        country: registrationData.country,
        coordinates: registrationData.lat && registrationData.lng ? {
          lat: registrationData.lat,
          lng: registrationData.lng
        } : undefined,
        formattedAddress: registrationData.formattedAddress,
        placeId: registrationData.placeId
      },
      status: 'pending_verification',
      createdAt: new Date().toISOString()
    });
    
    // Create user account for login
    const user = await UserModel.create({
      email: registrationData.email,
      password: generateId(), // Temporary password, user will set via email verification
      role: 'customer',
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      phone: registrationData.phone,
      status: 'active',
      customerId: customerId
    });
    
    // Log registration event
    console.log(`🎉 Enhanced registration completed:`, {
      customerId,
      accountType: registrationData.accountType,
      email: registrationData.email,
      business: registrationData.businessName || 'N/A'
    });
    
    res.json({
      success: true,
      customerId,
      accountType: registrationData.accountType,
      message: registrationData.accountType === 'business' 
        ? `Business account created for ${registrationData.businessName}`
        : 'Personal account created successfully',
      nextSteps: {
        emailVerification: true,
        paymentSetup: mode === 'verification',
        portalAccess: `/portal?customer=${customerId}`
      }
    });
    
  } catch (error) {
    console.error('Enhanced registration error:', error);
    res.status(500).json({
      error: 'Registration failed. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Postal code lookup endpoint
router.get('/postal-lookup/:postalCode', async (req: Request, res: Response) => {
  try {
    const { postalCode } = req.params;
    
    // Validate postal code format
    const cleanPostalCode = postalCode.replace(/\s/g, '').toUpperCase();
    const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
    
    if (!postalCodeRegex.test(cleanPostalCode)) {
      return res.status(400).json({
        error: 'Invalid postal code format'
      });
    }
    
    // Mock postal code lookup - in real implementation, integrate with Canada Post API
    const mockPostalData: Record<string, { city: string; province: string }> = {
      'M5V3A8': { city: 'Toronto', province: 'ON' },
      'V6B1A1': { city: 'Vancouver', province: 'BC' },
      'T2P1A1': { city: 'Calgary', province: 'AB' },
      'H3B1A1': { city: 'Montreal', province: 'QC' },
      'K1A0A6': { city: 'Ottawa', province: 'ON' }
    };
    
    const locationData = mockPostalData[cleanPostalCode];
    
    if (locationData) {
      res.json({
        success: true,
        postalCode: cleanPostalCode,
        city: locationData.city,
        province: locationData.province,
        source: 'canada_post_mock'
      });
    } else {
      res.json({
        success: false,
        error: 'Postal code not found',
        postalCode: cleanPostalCode
      });
    }
    
  } catch (error) {
    console.error('Postal code lookup error:', error);
    res.status(500).json({
      error: 'Postal code lookup failed'
    });
  }
});

// Address validation endpoint
router.post('/validate-address', async (req: Request, res: Response) => {
  try {
    const { address, city, province, postalCode } = req.body;
    
    // Mock address validation - in real implementation, use Canada Post Address Complete API
    const validationResult = {
      valid: true,
      standardized: {
        address: address.trim(),
        city: city.trim(),
        province: province.toUpperCase(),
        postalCode: postalCode.replace(/\s/g, '').toUpperCase()
      },
      suggestions: [],
      confidence: 'high',
      deliverable: true
    };
    
    res.json({
      success: true,
      validation: validationResult,
      message: validationResult.valid ? 'Address validated successfully' : 'Address validation failed'
    });
    
  } catch (error) {
    console.error('Address validation error:', error);
    res.status(500).json({
      error: 'Address validation failed'
    });
  }
});

export default router;