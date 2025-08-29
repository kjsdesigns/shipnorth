import { PackageModel } from '../models/package';
import { CustomerModel } from '../models/customer';
import { LoadModel } from '../models/load';
import { UserModel } from '../models/user';

export interface SearchResult {
  id: string;
  type: 'package' | 'customer' | 'load' | 'user' | 'documentation';
  title: string;
  subtitle?: string;
  description?: string;
  relevanceScore: number;
  matchedFields: string[];
  data: any;
}

export interface SearchOptions {
  query: string;
  categories?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  categories: {
    packages: number;
    customers: number;
    loads: number;
    users: number;
    documentation: number;
  };
}

export class SearchService {
  /**
   * Unified search across all entities
   */
  static async search(options: SearchOptions): Promise<SearchResponse> {
    const {
      query,
      categories = ['packages', 'customers', 'loads', 'users'],
      limit = 20,
      offset = 0,
    } = options;

    if (!query || query.trim().length === 0) {
      return {
        results: [],
        totalCount: 0,
        categories: { packages: 0, customers: 0, loads: 0, users: 0, documentation: 0 },
      };
    }

    const searchPromises: Promise<SearchResult[]>[] = [];

    // Search packages
    if (categories.includes('packages')) {
      searchPromises.push(this.searchPackages(query));
    }

    // Search customers
    if (categories.includes('customers')) {
      searchPromises.push(this.searchCustomers(query));
    }

    // Search loads
    if (categories.includes('loads')) {
      searchPromises.push(this.searchLoads(query));
    }

    // Search users (only for admin/staff)
    if (categories.includes('users')) {
      searchPromises.push(this.searchUsers(query));
    }

    // Execute all searches in parallel
    const searchResults = await Promise.all(searchPromises);

    // Flatten and sort by relevance score
    const allResults = searchResults.flat().sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Count by category
    const categoryCounts = {
      packages: allResults.filter((r) => r.type === 'package').length,
      customers: allResults.filter((r) => r.type === 'customer').length,
      loads: allResults.filter((r) => r.type === 'load').length,
      users: allResults.filter((r) => r.type === 'user').length,
      documentation: 0, // TODO: Implement doc search
    };

    // Apply pagination
    const paginatedResults = allResults.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      totalCount: allResults.length,
      categories: categoryCounts,
    };
  }

  /**
   * Search packages by tracking number, recipient, customer, status, address
   */
  static async searchPackages(query: string): Promise<SearchResult[]> {
    const packages = await PackageModel.list(500); // Get more for search
    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const pkg of packages) {
      const matchedFields: string[] = [];
      let relevanceScore = 0;

      // Tracking number (highest priority)
      if (pkg.trackingNumber && pkg.trackingNumber.toLowerCase().includes(searchTerm)) {
        matchedFields.push('trackingNumber');
        relevanceScore += 100;
      }

      // Barcode
      if (pkg.barcode && pkg.barcode.toLowerCase().includes(searchTerm)) {
        matchedFields.push('barcode');
        relevanceScore += 90;
      }

      // Package ID
      if (pkg.id.toLowerCase().includes(searchTerm)) {
        matchedFields.push('id');
        relevanceScore += 80;
      }

      // Recipient name
      if (pkg.shipTo.name.toLowerCase().includes(searchTerm)) {
        matchedFields.push('recipientName');
        relevanceScore += 70;
      }

      // Recipient address - handle new addressId structure
      // TODO: Resolve address through AddressModel for proper search
      // For now, skip address-based search to fix compilation
      // const address = await AddressModel.findById(pkg.shipTo.addressId);
      // if (address) {
      //   const fullAddress = `${address.address1} ${address.address2 || ''} ${address.city} ${address.province}`.toLowerCase();
      //   if (fullAddress.includes(searchTerm)) {
      //     matchedFields.push('address');
      //     relevanceScore += 60;
      //   }
      //
      //   // Postal code
      //   if (address.postalCode.toLowerCase().includes(searchTerm)) {
      //     matchedFields.push('postalCode');
      //     relevanceScore += 50;
      //   }
      // }

      // Status
      if (
        pkg.shipmentStatus.toLowerCase().includes(searchTerm) ||
        pkg.labelStatus.toLowerCase().includes(searchTerm) ||
        pkg.paymentStatus.toLowerCase().includes(searchTerm)
      ) {
        matchedFields.push('status');
        relevanceScore += 30;
      }

      // Carrier
      if (pkg.carrier && pkg.carrier.toLowerCase().includes(searchTerm)) {
        matchedFields.push('carrier');
        relevanceScore += 40;
      }

      // Notes
      if (pkg.notes && pkg.notes.toLowerCase().includes(searchTerm)) {
        matchedFields.push('notes');
        relevanceScore += 20;
      }

      if (matchedFields.length > 0) {
        results.push({
          id: pkg.id,
          type: 'package',
          title: `Package ${pkg.barcode}`,
          subtitle: `${pkg.shipTo.name} • Address ID: ${pkg.shipTo.addressId}`,
          description: `${pkg.shipmentStatus} • ${pkg.trackingNumber || 'No tracking'}`,
          relevanceScore,
          matchedFields,
          data: pkg,
        });
      }
    }

    return results;
  }

  /**
   * Search customers by name, email, phone, address
   */
  static async searchCustomers(query: string): Promise<SearchResult[]> {
    const customers = await CustomerModel.search(query, 100);
    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const customer of customers) {
      const matchedFields: string[] = [];
      let relevanceScore = 0;

      // Email (exact match gets highest score)
      if (customer.email.toLowerCase() === searchTerm) {
        matchedFields.push('email');
        relevanceScore += 100;
      } else if (customer.email.toLowerCase().includes(searchTerm)) {
        matchedFields.push('email');
        relevanceScore += 80;
      }

      // Full name exact match
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      if (fullName === searchTerm) {
        matchedFields.push('fullName');
        relevanceScore += 95;
      } else if (fullName.includes(searchTerm)) {
        matchedFields.push('fullName');
        relevanceScore += 70;
      }

      // First name
      if (customer.firstName.toLowerCase().includes(searchTerm)) {
        matchedFields.push('firstName');
        relevanceScore += 60;
      }

      // Last name
      if (customer.lastName.toLowerCase().includes(searchTerm)) {
        matchedFields.push('lastName');
        relevanceScore += 60;
      }

      // Phone
      if (customer.phone && customer.phone.includes(searchTerm)) {
        matchedFields.push('phone');
        relevanceScore += 50;
      }

      // Address
      const fullAddress =
        `${customer.addressLine1} ${customer.addressLine2 || ''} ${customer.city} ${customer.province}`.toLowerCase();
      if (fullAddress.includes(searchTerm)) {
        matchedFields.push('address');
        relevanceScore += 40;
      }

      // Customer ID
      if (customer.id.toLowerCase().includes(searchTerm)) {
        matchedFields.push('id');
        relevanceScore += 30;
      }

      if (matchedFields.length > 0 || relevanceScore > 0) {
        results.push({
          id: customer.id,
          type: 'customer',
          title: `${customer.firstName} ${customer.lastName}`,
          subtitle: customer.email,
          description: `${customer.city}, ${customer.province} • ${customer.status}`,
          relevanceScore,
          matchedFields,
          data: customer,
        });
      }
    }

    return results;
  }

  /**
   * Search loads by ID, driver, vehicle, routes, destinations
   */
  static async searchLoads(query: string): Promise<SearchResult[]> {
    const loads = await LoadModel.list(500);
    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const load of loads) {
      const matchedFields: string[] = [];
      let relevanceScore = 0;

      // Load ID
      if (load.id.toLowerCase().includes(searchTerm)) {
        matchedFields.push('id');
        relevanceScore += 90;
      }

      // Driver name
      if (load.driverName && load.driverName.toLowerCase().includes(searchTerm)) {
        matchedFields.push('driverName');
        relevanceScore += 80;
      }

      // Vehicle ID
      if (load.vehicleId && load.vehicleId.toLowerCase().includes(searchTerm)) {
        matchedFields.push('vehicleId');
        relevanceScore += 70;
      }

      // Carrier/Truck
      if (load.carrierOrTruck && load.carrierOrTruck.toLowerCase().includes(searchTerm)) {
        matchedFields.push('carrierOrTruck');
        relevanceScore += 70;
      }

      // Delivery cities
      for (const city of load.deliveryCities || []) {
        if (
          city.city.toLowerCase().includes(searchTerm) ||
          city.province.toLowerCase().includes(searchTerm)
        ) {
          matchedFields.push('deliveryCities');
          relevanceScore += 60;
          break;
        }
      }

      // Origin address
      if (load.originAddress && load.originAddress.toLowerCase().includes(searchTerm)) {
        matchedFields.push('originAddress');
        relevanceScore += 50;
      }

      // Transport mode
      if (load.transportMode.toLowerCase().includes(searchTerm)) {
        matchedFields.push('transportMode');
        relevanceScore += 40;
      }

      // Status
      if (load.status.toLowerCase().includes(searchTerm)) {
        matchedFields.push('status');
        relevanceScore += 30;
      }

      // Notes
      if (load.notes && load.notes.toLowerCase().includes(searchTerm)) {
        matchedFields.push('notes');
        relevanceScore += 20;
      }

      if (matchedFields.length > 0) {
        const citiesText =
          load.deliveryCities?.map((c) => `${c.city}, ${c.province}`).join('; ') ||
          'No destinations';

        results.push({
          id: load.id,
          type: 'load',
          title: `Load ${load.id}`,
          subtitle: load.driverName ? `Driver: ${load.driverName}` : 'No driver assigned',
          description: `${load.status} • ${citiesText}`,
          relevanceScore,
          matchedFields,
          data: load,
        });
      }
    }

    return results;
  }

  /**
   * Search users by name, email, role (admin/staff only)
   */
  static async searchUsers(query: string): Promise<SearchResult[]> {
    const users = await UserModel.list(undefined, 500);
    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const user of users) {
      const matchedFields: string[] = [];
      let relevanceScore = 0;

      // Email exact match
      if (user.email.toLowerCase() === searchTerm) {
        matchedFields.push('email');
        relevanceScore += 100;
      } else if (user.email.toLowerCase().includes(searchTerm)) {
        matchedFields.push('email');
        relevanceScore += 80;
      }

      // Full name
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      if (fullName.includes(searchTerm)) {
        matchedFields.push('fullName');
        relevanceScore += 70;
      }

      // First name
      if (user.firstName.toLowerCase().includes(searchTerm)) {
        matchedFields.push('firstName');
        relevanceScore += 60;
      }

      // Last name
      if (user.lastName.toLowerCase().includes(searchTerm)) {
        matchedFields.push('lastName');
        relevanceScore += 60;
      }

      // Role
      if (user.role.toLowerCase().includes(searchTerm)) {
        matchedFields.push('role');
        relevanceScore += 50;
      }

      // Phone
      if (user.phone && user.phone.includes(searchTerm)) {
        matchedFields.push('phone');
        relevanceScore += 40;
      }

      // User ID
      if (user.id.toLowerCase().includes(searchTerm)) {
        matchedFields.push('id');
        relevanceScore += 30;
      }

      if (matchedFields.length > 0) {
        results.push({
          id: user.id,
          type: 'user',
          title: `${user.firstName} ${user.lastName}`,
          subtitle: `${user.email} • ${user.role}`,
          description: `${user.status} • Last login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}`,
          relevanceScore,
          matchedFields,
          data: user,
        });
      }
    }

    return results;
  }

  /**
   * Get quick search suggestions (top 5 results)
   */
  static async getQuickSuggestions(query: string, userRole?: string): Promise<SearchResult[]> {
    const categories = this.getCategoriesForRole(userRole);
    const searchResponse = await this.search({
      query,
      categories,
      limit: 5,
    });

    return searchResponse.results;
  }

  /**
   * Get categories allowed for user role
   */
  private static getCategoriesForRole(role?: string): string[] {
    switch (role) {
      case 'admin':
        return ['packages', 'customers', 'loads', 'users'];
      case 'staff':
        return ['packages', 'customers', 'loads'];
      case 'driver':
        return ['loads', 'packages'];
      case 'customer':
        return ['packages']; // Only their own packages in practice
      default:
        return ['packages', 'customers', 'loads'];
    }
  }

  /**
   * Fuzzy search scoring with typo tolerance
   */
  static calculateFuzzyScore(searchTerm: string, text: string): number {
    const search = searchTerm.toLowerCase();
    const target = text.toLowerCase();

    // Exact match
    if (target === search) return 100;

    // Starts with
    if (target.startsWith(search)) return 90;

    // Contains
    if (target.includes(search)) return 70;

    // Fuzzy matching for typos
    const distance = this.levenshteinDistance(search, target);
    const maxLength = Math.max(search.length, target.length);
    const similarity = (maxLength - distance) / maxLength;

    if (similarity > 0.8) return Math.floor(similarity * 60);
    if (similarity > 0.6) return Math.floor(similarity * 40);

    return 0;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    // Create matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
