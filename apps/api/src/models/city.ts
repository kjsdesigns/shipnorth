import { DatabaseService, generateId } from '../services/database';

export interface City {
  id: string;
  name: string;
  province: string;
  alternativeNames?: string[]; // Non-standard names that correlate with this city
  packageCount?: number; // Calculated field for display
  businessRules?: {
    [key: string]: any; // Flexible structure for future business rules
  };
  createdAt: string;
  updatedAt: string;
}

export class CityModel {
  static async create(cityData: Omit<City, 'id' | 'createdAt' | 'updatedAt'>): Promise<City> {
    const id = generateId();
    const now = new Date().toISOString();

    const newCity: City = {
      id,
      ...cityData,
      alternativeNames: cityData.alternativeNames || [],
      createdAt: now,
      updatedAt: now,
    };

    await DatabaseService.put({
      PK: `CITY#${id}`,
      SK: 'METADATA',
      GSI1PK: `PROVINCE#${cityData.province.toUpperCase()}`,
      GSI1SK: `CITY#${cityData.name.toUpperCase()}`,
      GSI2PK: `CITYNAME#${cityData.name.toUpperCase()}`,
      GSI2SK: `CITY#${id}`,
      Type: 'City',
      Data: newCity,
    });

    return newCity;
  }

  static async findById(id: string): Promise<City | null> {
    const item = await DatabaseService.get(`CITY#${id}`, 'METADATA');
    return item ? item.Data : null;
  }

  static async findByName(name: string, province?: string): Promise<City[]> {
    const items = await DatabaseService.queryByGSI('GSI2', `CITYNAME#${name.toUpperCase()}`);
    let cities = items.filter((item: any) => item.Type === 'City').map((item: any) => item.Data);

    if (province) {
      cities = cities.filter(
        (city: City) => city.province.toLowerCase() === province.toLowerCase()
      );
    }

    return cities;
  }

  static async findByProvince(province: string): Promise<City[]> {
    const items = await DatabaseService.queryByGSI('GSI1', `PROVINCE#${province.toUpperCase()}`);
    return items
      .filter((item: any) => item.Type === 'City')
      .map((item: any) => item.Data)
      .sort((a: City, b: City) => a.name.localeCompare(b.name));
  }

  static async list(): Promise<City[]> {
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': 'City',
      },
    });

    return items
      .map((item: any) => item.Data)
      .filter(Boolean)
      .sort((a: City, b: City) => {
        const provinceCompare = a.province.localeCompare(b.province);
        if (provinceCompare !== 0) return provinceCompare;
        return a.name.localeCompare(b.name);
      });
  }

  static async update(id: string, updates: Partial<City>): Promise<City | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updatedCity = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updateData: any = {
      Data: updatedCity,
    };

    // Update GSI indexes if name or province changed
    if (updates.name && updates.name !== current.name) {
      updateData.GSI2PK = `CITYNAME#${updates.name.toUpperCase()}`;
    }

    if (updates.province && updates.province !== current.province) {
      updateData.GSI1PK = `PROVINCE#${updates.province.toUpperCase()}`;
      updateData.GSI1SK = `CITY#${(updates.name || current.name).toUpperCase()}`;
    }

    if (updates.name && updates.name !== current.name) {
      updateData.GSI1SK = `CITY#${updates.name.toUpperCase()}`;
    }

    const result = await DatabaseService.update(`CITY#${id}`, 'METADATA', updateData);
    return result ? result.Data : null;
  }

  static async delete(id: string): Promise<boolean> {
    await DatabaseService.delete(`CITY#${id}`, 'METADATA');
    return true;
  }

  // Method to correlate city names with package addresses
  static async findCityByAddress(city: string, province: string): Promise<City | null> {
    const normalizedCity = city.toUpperCase().trim();
    const normalizedProvince = province.toUpperCase().trim();

    // First try exact match
    const exactMatches = await this.findByName(normalizedCity, normalizedProvince);
    if (exactMatches.length > 0) {
      return exactMatches[0];
    }

    // Then try alternative names
    const allCitiesInProvince = await this.findByProvince(normalizedProvince);

    for (const cityRecord of allCitiesInProvince) {
      if (
        cityRecord.alternativeNames?.some(
          (altName) => altName.toUpperCase().trim() === normalizedCity
        )
      ) {
        return cityRecord;
      }
    }

    return null;
  }

  // Method to get package count for each city
  static async getCitiesWithPackageCounts(): Promise<City[]> {
    const cities = await this.list();

    // Import PackageModel here to avoid circular imports
    const { PackageModel } = await import('./package');
    const packages = await PackageModel.list(10000); // Get all packages for counting

    return cities.map((city) => {
      const packageCount = packages.filter((pkg) => {
        // TODO: Fix this to properly resolve address from addressId
        const pkgCity = 'UNKNOWN'; // pkg.shipTo.city.toUpperCase().trim();
        const pkgProvince = 'UNKNOWN'; // pkg.shipTo.province.toUpperCase().trim();

        // Check exact match
        if (pkgCity === city.name.toUpperCase() && pkgProvince === city.province.toUpperCase()) {
          return true;
        }

        // Check alternative names
        return (
          city.alternativeNames?.some(
            (altName) =>
              altName.toUpperCase().trim() === pkgCity &&
              pkgProvince === city.province.toUpperCase()
          ) || false
        );
      }).length;

      return {
        ...city,
        packageCount,
      };
    });
  }

  // Method to add alternative name to a city
  static async addAlternativeName(id: string, alternativeName: string): Promise<City | null> {
    const city = await this.findById(id);
    if (!city) return null;

    const currentAlternatives = city.alternativeNames || [];
    const normalizedName = alternativeName.trim();

    if (!currentAlternatives.includes(normalizedName)) {
      return await this.update(id, {
        alternativeNames: [...currentAlternatives, normalizedName],
      });
    }

    return city;
  }

  // Method to remove alternative name from a city
  static async removeAlternativeName(id: string, alternativeName: string): Promise<City | null> {
    const city = await this.findById(id);
    if (!city) return null;

    const currentAlternatives = city.alternativeNames || [];
    const updatedAlternatives = currentAlternatives.filter((name) => name !== alternativeName);

    return await this.update(id, {
      alternativeNames: updatedAlternatives,
    });
  }
}
