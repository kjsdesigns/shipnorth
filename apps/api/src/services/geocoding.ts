import axios from 'axios';
import { Coordinates, Address } from '../models/address';

export interface GeocodingProvider {
  geocode(address: Address): Promise<Coordinates | null>;
  reverseGeocode(lat: number, lng: number): Promise<Address | null>;
}

export class GoogleGeocodingProvider implements GeocodingProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocode(address: Address): Promise<Coordinates | null> {
    try {
      const addressString = this.formatAddressForGeocoding(address);

      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: addressString,
          key: this.apiKey,
          region: address.country === 'Canada' ? 'ca' : 'us',
          components: `country:${address.country === 'Canada' ? 'CA' : 'US'}|administrative_area:${address.province}`,
        },
        timeout: 10000,
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        // Determine accuracy based on result type
        let accuracy: Coordinates['accuracy'] = 'approximate';
        if (result.types.includes('street_address') || result.types.includes('premise')) {
          accuracy = 'exact';
        } else if (result.types.includes('postal_code')) {
          accuracy = 'postal_code';
        } else if (
          result.types.includes('locality') ||
          result.types.includes('administrative_area_level_3')
        ) {
          accuracy = 'city_center';
        }

        return {
          lat: location.lat,
          lng: location.lng,
          accuracy,
          geocodedAt: new Date().toISOString(),
          geocodingService: 'google',
        };
      } else {
        console.warn('Google Geocoding API returned no results for:', addressString);
        return null;
      }
    } catch (error) {
      console.error('Google Geocoding API error:', error);
      throw new Error(
        `Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<Address | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return this.parseGoogleResult(result);
      }

      return null;
    } catch (error) {
      console.error('Google Reverse Geocoding API error:', error);
      throw new Error(
        `Reverse geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private formatAddressForGeocoding(address: Address): string {
    const parts = [
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  private parseGoogleResult(result: any): Address {
    const components = result.address_components;
    let address1 = '';
    let city = '';
    let province = '';
    let postalCode = '';
    let country = '';

    for (const component of components) {
      const types = component.types;

      if (types.includes('street_number') || types.includes('premise')) {
        address1 = component.long_name + (address1 ? ` ${address1}` : '');
      } else if (types.includes('route')) {
        address1 = (address1 ? `${address1} ` : '') + component.long_name;
      } else if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        province = component.short_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      } else if (types.includes('country')) {
        country = component.long_name;
      }
    }

    return {
      id: '',
      address1: address1 || result.formatted_address.split(',')[0] || '',
      city,
      province,
      postalCode,
      country,
      createdAt: new Date().toISOString(),
      geocodingStatus: 'success',
    };
  }
}

export class MapBoxGeocodingProvider implements GeocodingProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async geocode(address: Address): Promise<Coordinates | null> {
    try {
      const addressString = this.formatAddressForGeocoding(address);

      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressString)}.json`,
        {
          params: {
            access_token: this.accessToken,
            country: address.country === 'Canada' ? 'ca' : 'us',
            limit: 1,
          },
          timeout: 10000,
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const [lng, lat] = feature.center;

        // Determine accuracy based on place type
        let accuracy: Coordinates['accuracy'] = 'approximate';
        const placeType = feature.place_type?.[0];

        if (placeType === 'address') {
          accuracy = 'exact';
        } else if (placeType === 'postcode') {
          accuracy = 'postal_code';
        } else if (placeType === 'place' || placeType === 'locality') {
          accuracy = 'city_center';
        }

        return {
          lat,
          lng,
          accuracy,
          geocodedAt: new Date().toISOString(),
          geocodingService: 'mapbox',
        };
      } else {
        console.warn('MapBox Geocoding API returned no results for:', addressString);
        return null;
      }
    } catch (error) {
      console.error('MapBox Geocoding API error:', error);
      throw new Error(
        `Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<Address | null> {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: this.accessToken,
            types: 'address',
          },
          timeout: 10000,
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        return this.parseMapBoxResult(response.data.features[0]);
      }

      return null;
    } catch (error) {
      console.error('MapBox Reverse Geocoding API error:', error);
      throw new Error(
        `Reverse geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private formatAddressForGeocoding(address: Address): string {
    const parts = [
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  private parseMapBoxResult(feature: any): Address {
    return {
      id: '',
      address1: feature.properties?.address || feature.place_name?.split(',')[0] || '',
      city: feature.context?.find((c: any) => c.id.startsWith('place.'))?.text || '',
      province:
        feature.context
          ?.find((c: any) => c.id.startsWith('region.'))
          ?.short_code?.replace('CA-', '')
          .replace('US-', '') || '',
      postalCode: feature.context?.find((c: any) => c.id.startsWith('postcode.'))?.text || '',
      country: feature.context?.find((c: any) => c.id.startsWith('country.'))?.text || '',
      createdAt: new Date().toISOString(),
      geocodingStatus: 'success',
    };
  }
}

export class GeocodingService {
  private provider: GeocodingProvider;

  constructor(provider: GeocodingProvider) {
    this.provider = provider;
  }

  static create(): GeocodingService {
    // Choose provider based on environment variables
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    if (googleApiKey) {
      return new GeocodingService(new GoogleGeocodingProvider(googleApiKey));
    } else if (mapboxToken) {
      return new GeocodingService(new MapBoxGeocodingProvider(mapboxToken));
    } else {
      // Fallback to mock provider for development
      return new GeocodingService(new MockGeocodingProvider());
    }
  }

  async geocode(address: Address): Promise<Coordinates | null> {
    return await this.provider.geocode(address);
  }

  async reverseGeocode(lat: number, lng: number): Promise<Address | null> {
    return await this.provider.reverseGeocode(lat, lng);
  }

  async batchGeocode(addresses: Address[]): Promise<(Coordinates | null)[]> {
    const results: (Coordinates | null)[] = [];

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      const batchPromises = batch.map((addr) => this.geocode(addr).catch(() => null));

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

// Mock provider for development/testing
class MockGeocodingProvider implements GeocodingProvider {
  async geocode(address: Address): Promise<Coordinates | null> {
    // Mock coordinates for common Northern Quebec/Ontario locations
    const mockCoordinates: Record<string, Coordinates> = {
      'OWEN SOUND#ON': {
        lat: 44.5675,
        lng: -80.9436,
        accuracy: 'city_center',
        geocodedAt: new Date().toISOString(),
        geocodingService: 'mock',
      },
      'CHIBOUGAMAU#QC': {
        lat: 49.9255,
        lng: -74.3647,
        accuracy: 'city_center',
        geocodedAt: new Date().toISOString(),
        geocodingService: 'mock',
      },
      "VAL-D'OR#QC": {
        lat: 48.0978,
        lng: -77.7825,
        accuracy: 'city_center',
        geocodedAt: new Date().toISOString(),
        geocodingService: 'mock',
      },
      'ROUYN-NORANDA#QC': {
        lat: 48.2359,
        lng: -79.0242,
        accuracy: 'city_center',
        geocodedAt: new Date().toISOString(),
        geocodingService: 'mock',
      },
      'TIMMINS#ON': {
        lat: 48.4758,
        lng: -81.3304,
        accuracy: 'city_center',
        geocodedAt: new Date().toISOString(),
        geocodingService: 'mock',
      },
    };

    const key = `${address.city.toUpperCase()}#${address.province.toUpperCase()}`;
    const coords = mockCoordinates[key];

    if (coords) {
      // Add some random variation for specific addresses
      return {
        ...coords,
        lat: coords.lat + (Math.random() - 0.5) * 0.01,
        lng: coords.lng + (Math.random() - 0.5) * 0.01,
        accuracy: address.address1 ? 'exact' : 'city_center',
      };
    }

    // Simulate failure for PO boxes or missing postal codes
    if (address.address1?.toLowerCase().includes('po box') || !address.postalCode) {
      return null;
    }

    return null;
  }

  async reverseGeocode(lat: number, lng: number): Promise<Address | null> {
    // Mock reverse geocoding
    return {
      id: '',
      address1: `${Math.floor(lat * 100)} Mock Street`,
      city: 'Mock City',
      province: 'ON',
      postalCode: 'K1A 0A6',
      country: 'Canada',
      createdAt: new Date().toISOString(),
      geocodingStatus: 'success',
    };
  }
}
