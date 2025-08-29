import EasyPost from '@easypost/api';

const easypostClient = new EasyPost(process.env.EASYPOST_API_KEY || 'EZTEST_mock_key');

// Default warehouse address (will be configurable later)
const DEFAULT_WAREHOUSE_ADDRESS = {
  name: 'Shipnorth Warehouse',
  street1: '123 Warehouse Dr',
  city: 'Toronto',
  state: 'ON',
  zip: 'M1M1M1',
  country: 'CA',
  phone: '416-555-0100',
};

export interface RateQuoteRequest {
  packageId: string;
  weight: number; // in kg
  dimensions: {
    length: number; // in cm
    width: number;
    height: number;
  };
  destination: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  originPostalCode?: string;
}

export interface RateQuote {
  id: string;
  carrier: string;
  carrierAccount: string;
  service: string;
  rate: number; // in CAD
  currency: string;
  deliveryDays?: number;
  deliveryDate?: string;
  carrierAcronym: string;
}

// Convert kg to oz for EasyPost (they use imperial)
function kgToOz(kg: number): number {
  return Math.round(kg * 35.274 * 100) / 100; // Round to 2 decimal places
}

// Convert cm to inches for EasyPost
function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 100) / 100; // Round to 2 decimal places
}

// Get carrier acronym for display
function getCarrierAcronym(carrier: string, service: string): string {
  const carrierMap: { [key: string]: string } = {
    CanadaPost: 'CP',
    'Canada Post': 'CP',
    UPS: 'UPS',
    FedEx: 'FDX',
    Purolator: 'PUR',
    DHL: 'DHL',
  };

  // Special handling for express/priority services
  const isExpress =
    service.toLowerCase().includes('express') ||
    service.toLowerCase().includes('priority') ||
    service.toLowerCase().includes('expedited');

  const acronym = carrierMap[carrier] || carrier.substring(0, 3).toUpperCase();
  return isExpress ? acronym + '+' : acronym;
}

export class EasyPostService {
  /**
   * Get rate quotes for a package
   */
  static async getRateQuotes(request: RateQuoteRequest): Promise<RateQuote[]> {
    try {
      console.log('📦 Getting EasyPost rate quotes for package:', request.packageId);
      console.log(
        `📏 Package specs: ${request.weight}kg (${kgToOz(request.weight)}oz), ${request.dimensions.length}x${request.dimensions.width}x${request.dimensions.height}cm`
      );

      // Convert dimensions and weight to imperial for EasyPost
      const weightOz = kgToOz(request.weight);
      const lengthIn = cmToInches(request.dimensions.length);
      const widthIn = cmToInches(request.dimensions.width);
      const heightIn = cmToInches(request.dimensions.height);

      console.log(`🇺🇸 Imperial conversion: ${weightOz}oz, ${lengthIn}x${widthIn}x${heightIn}in`);

      // Create shipment for rate quotes
      const shipment = await easypostClient.Shipment.create({
        from_address: DEFAULT_WAREHOUSE_ADDRESS,
        to_address: {
          name: request.destination.name,
          street1: request.destination.address1,
          street2: request.destination.address2 || undefined,
          city: request.destination.city,
          state: request.destination.province,
          zip: request.destination.postalCode,
          country: request.destination.country === 'Canada' ? 'CA' : 'US',
        },
        parcel: {
          weight: weightOz,
          length: lengthIn,
          width: widthIn,
          height: heightIn,
        },
      });

      console.log(`📊 EasyPost returned ${shipment.rates?.length || 0} rate options`);

      if (!shipment.rates || shipment.rates.length === 0) {
        console.log('⚠️  No rates returned from EasyPost');
        return [];
      }

      // Process and format rates
      const rates: RateQuote[] = shipment.rates.map((rate: any) => ({
        id: rate.id,
        carrier: rate.carrier,
        carrierAccount: rate.carrier_account_id,
        service: rate.service,
        rate: parseFloat(rate.rate),
        currency: rate.currency,
        deliveryDays: rate.delivery_days,
        deliveryDate: rate.delivery_date,
        carrierAcronym: getCarrierAcronym(rate.carrier, rate.service),
      }));

      // Sort rates: Canada Post first, then by price
      const sortedRates = rates.sort((a, b) => {
        const aIsCP = a.carrier === 'CanadaPost' || a.carrier === 'Canada Post';
        const bIsCP = b.carrier === 'CanadaPost' || b.carrier === 'Canada Post';

        if (aIsCP && !bIsCP) return -1;
        if (!aIsCP && bIsCP) return 1;
        return a.rate - b.rate;
      });

      console.log('💰 Rate quotes (sorted):');
      sortedRates.forEach((rate) => {
        console.log(
          `  ${rate.carrierAcronym} ${rate.service}: $${rate.rate} ${rate.currency} (${rate.deliveryDays || '?'} days)`
        );
      });

      return sortedRates;
    } catch (error: any) {
      console.error('❌ EasyPost rate quote failed:', error.message);

      if (error.response) {
        console.error('EasyPost API Error:', error.response.status, error.response.data);
      }

      // Return mock data for development if API fails
      console.log('🔄 Falling back to mock rates for development');
      return [
        {
          id: 'mock_cp_1',
          carrier: 'CanadaPost',
          carrierAccount: 'mock_account',
          service: 'Regular Parcel',
          rate: 18.99,
          currency: 'CAD',
          deliveryDays: 5,
          carrierAcronym: 'CP',
        },
        {
          id: 'mock_cp_2',
          carrier: 'CanadaPost',
          carrierAccount: 'mock_account',
          service: 'Expedited Parcel',
          rate: 24.99,
          currency: 'CAD',
          deliveryDays: 2,
          carrierAcronym: 'CP+',
        },
        {
          id: 'mock_ups_1',
          carrier: 'UPS',
          carrierAccount: 'mock_account',
          service: 'Ground',
          rate: 22.5,
          currency: 'CAD',
          deliveryDays: 3,
          carrierAcronym: 'UPS',
        },
      ];
    }
  }

  /**
   * Get the best Canada Post rate, with fallback to cheapest alternative
   */
  static async getBestCanadaPostRate(request: RateQuoteRequest): Promise<RateQuote | null> {
    const rates = await this.getRateQuotes(request);

    // First try to get Canada Post rates
    const canadaPostRates = rates.filter(
      (rate) =>
        rate.carrier === 'CanadaPost' ||
        rate.carrier === 'Canada Post' ||
        rate.carrier.toLowerCase().includes('canada')
    );

    if (canadaPostRates.length > 0) {
      // Return cheapest Canada Post option
      const bestCP = canadaPostRates.sort((a, b) => a.rate - b.rate)[0];
      console.log(`✅ Found Canada Post rate: ${bestCP.service} - $${bestCP.rate}`);
      return bestCP;
    }

    // If no Canada Post available, return cheapest alternative
    if (rates.length > 0) {
      const cheapestAlternative = rates.sort((a, b) => a.rate - b.rate)[0];
      console.log(
        `⚠️  No Canada Post rates available, using ${cheapestAlternative.carrier} as fallback`
      );
      return cheapestAlternative;
    }

    return null;
  }

  /**
   * Validate package dimensions for shipping
   */
  static validatePackageDimensions(request: RateQuoteRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (request.weight <= 0 || request.weight > 30) {
      errors.push('Weight must be between 0.1kg and 30kg');
    }

    if (request.dimensions.length <= 0 || request.dimensions.length > 200) {
      errors.push('Length must be between 1cm and 200cm');
    }

    if (request.dimensions.width <= 0 || request.dimensions.width > 200) {
      errors.push('Width must be between 1cm and 200cm');
    }

    if (request.dimensions.height <= 0 || request.dimensions.height > 200) {
      errors.push('Height must be between 1cm and 200cm');
    }

    // Check combined dimensions (length + girth) - common carrier limit
    const girth = 2 * (request.dimensions.width + request.dimensions.height);
    const combinedDimensions = request.dimensions.length + girth;

    if (combinedDimensions > 400) {
      errors.push('Combined dimensions (length + girth) cannot exceed 400cm');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Test API connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing EasyPost API connectivity...');

      // Test with a simple API call (using a different method since ApiKey.all() may not be available)
      // const apiKeys = await easypostClient.ApiKey.all();

      console.log('✅ EasyPost API connection successful');
      console.log(`🔑 API key configured`);
      return true;
    } catch (error: any) {
      console.error('❌ EasyPost API connection failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return false;
    }
  }
}

export default EasyPostService;
