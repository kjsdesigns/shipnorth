import { DatabaseService, generateId } from '../services/database';
// import { LoadModel } from './load';

export interface Package {
  id: string;
  customerId: string;
  receivedDate: string;
  departureDate?: string;
  estimatedDeliveryDate?: string;
  deliveryDate?: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weight: number; // kg
  loadId?: string;
  quotedCarrier?: string;
  quotedService?: string;
  quotedRate?: number;
  labelStatus: 'unlabeled' | 'quoted' | 'purchased' | 'void_requested' | 'voided';
  carrier?: string;
  trackingNumber?: string;
  labelUrl?: string;
  barcode?: string;
  price?: number;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded' | 'writeoff';
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paymentUrl?: string;
  shippingCost?: number;
  paidAt?: string;
  shipmentStatus: 'ready' | 'in_transit' | 'delivered' | 'exception' | 'returned';
  deliveryConfirmation?: {
    deliveredAt: string;
    photoUrl?: string;
    signature?: string;
    recipientName?: string;
    relationship?: string;
    confirmedBy: string; // staff user ID
  };
  shipTo: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class PackageModel {
  static async create(pkg: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>): Promise<Package> {
    const id = generateId();
    const barcode = `PKG${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    
    const newPackage: Package = {
      id,
      barcode,
      ...pkg,
      labelStatus: pkg.labelStatus || 'unlabeled',
      paymentStatus: pkg.paymentStatus || 'unpaid',
      shipmentStatus: pkg.shipmentStatus || 'ready',
      receivedDate: pkg.receivedDate || new Date().toISOString(),
    };

    await DatabaseService.put({
      PK: `PACKAGE#${id}`,
      SK: 'METADATA',
      GSI1PK: `CUSTOMER#${pkg.customerId}`,
      GSI1SK: `PACKAGE#${id}`,
      GSI2PK: `DATE#${newPackage.receivedDate.split('T')[0]}`,
      GSI2SK: `PACKAGE#${id}`,
      GSI3PK: `STATUS#${newPackage.shipmentStatus}`,
      GSI3SK: `PACKAGE#${id}`,
      Type: 'Package',
      Data: newPackage,
    });

    return newPackage;
  }

  static async get(id: string): Promise<Package | null> {
    return this.findById(id);
  }

  static async findById(id: string): Promise<Package | null> {
    const item = await DatabaseService.get(`PACKAGE#${id}`, 'METADATA');
    return item ? item.Data : null;
  }

  static async findByCustomer(customerId: string): Promise<Package[]> {
    const items = await DatabaseService.queryByGSI('GSI1', `CUSTOMER#${customerId}`);
    return items
      .filter((item: any) => item.Type === 'Package')
      .map((item: any) => item.Data);
  }

  static async findByDate(date: string): Promise<Package[]> {
    const items = await DatabaseService.queryByGSI('GSI2', `DATE#${date}`);
    return items
      .filter((item: any) => item.Type === 'Package')
      .map((item: any) => item.Data);
  }

  static async findByStatus(status: string): Promise<Package[]> {
    const items = await DatabaseService.queryByGSI('GSI3', `STATUS#${status}`);
    return items
      .filter((item: any) => item.Type === 'Package')
      .map((item: any) => item.Data);
  }

  static async update(id: string, updates: Partial<Package>): Promise<Package | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updatedPackage = { ...current, ...updates };
    
    const updateData: any = {
      Data: updatedPackage,
    };

    // Update status index if shipment status changed
    if (updates.shipmentStatus && updates.shipmentStatus !== current.shipmentStatus) {
      updateData.GSI3PK = `STATUS#${updates.shipmentStatus}`;
    }

    // Update load assignment if changed
    if (updates.loadId !== undefined && updates.loadId !== current.loadId) {
      if (current.loadId) {
        // Remove from old load
        await DatabaseService.delete(`LOAD#${current.loadId}`, `PACKAGE#${id}`);
      }
      if (updates.loadId) {
        // Add to new load
        await DatabaseService.put({
          PK: `LOAD#${updates.loadId}`,
          SK: `PACKAGE#${id}`,
          Type: 'LoadPackageRelation',
          packageId: id,
        });
      }
    }

    const result = await DatabaseService.update(`PACKAGE#${id}`, 'METADATA', updateData);
    return result ? result.Data : null;
  }

  static async list(limit = 100): Promise<Package[]> {
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': 'Package',
      },
      Limit: limit,
    });

    return items.map((item: any) => item.Data).filter(Boolean);
  }

  static async delete(id: string): Promise<boolean> {
    const pkg = await this.findById(id);
    if (!pkg) return false;

    await DatabaseService.delete(`PACKAGE#${id}`, 'METADATA');
    
    // Remove from load if assigned
    if (pkg.loadId) {
      await DatabaseService.delete(`LOAD#${pkg.loadId}`, `PACKAGE#${id}`);
    }
    
    return true;
  }

  static async getQuote(id: string, carrier?: string): Promise<any> {
    // Mock quote generation
    const pkg = await this.findById(id);
    if (!pkg) return null;

    const baseRate = 15 + (pkg.weight * 2) + (Math.random() * 10);
    
    return {
      carrier: carrier || 'Canada Post',
      service: 'Standard',
      rate: Math.round(baseRate * 100) / 100,
      estimatedDays: 3 + Math.floor(Math.random() * 4),
      currency: 'CAD',
    };
  }

  static async purchaseLabel(id: string): Promise<any> {
    const pkg = await this.findById(id);
    if (!pkg) return null;

    const trackingNumber = `TRACK${Date.now()}${Math.random().toString(36).substr(2, 8)}`.toUpperCase();
    const labelUrl = `https://mock-labels.s3.amazonaws.com/${id}.pdf`;

    await this.update(id, {
      labelStatus: 'purchased',
      trackingNumber,
      labelUrl,
      carrier: pkg.quotedCarrier || 'Canada Post',
    });

    return {
      trackingNumber,
      labelUrl,
      carrier: pkg.quotedCarrier || 'Canada Post',
    };
  }

  static async markAsDelivered(id: string, deliveryData: {
    deliveredAt?: string;
    photoUrl?: string;
    signature?: string;
    recipientName?: string;
    relationship?: string;
    confirmedBy: string;
  }): Promise<Package | null> {
    const pkg = await this.findById(id);
    if (!pkg) return null;

    const deliveryConfirmation = {
      deliveredAt: deliveryData.deliveredAt || new Date().toISOString(),
      photoUrl: deliveryData.photoUrl,
      signature: deliveryData.signature,
      recipientName: deliveryData.recipientName,
      relationship: deliveryData.relationship,
      confirmedBy: deliveryData.confirmedBy,
    };

    return await this.update(id, {
      shipmentStatus: 'delivered',
      deliveryDate: deliveryConfirmation.deliveredAt,
      deliveryConfirmation,
    });
  }

  static async getExpectedDeliveryDate(id: string): Promise<string | null> {
    const pkg = await this.findById(id);
    if (!pkg?.loadId) return null;

    // return await LoadModel.getExpectedDeliveryDate(pkg.loadId, pkg.shipTo.city);
    return null; // Temporarily disabled
  }

  static async getPackagesByLoadStatus(status?: string): Promise<Package[]> {
    const packages = await this.list(1000); // Get more packages for filtering
    
    if (!status) return packages;

    return packages.filter(pkg => {
      if (status === 'unassigned') return !pkg.loadId;
      if (status === 'assigned') return pkg.loadId && pkg.shipmentStatus === 'ready';
      if (status === 'in_transit') return pkg.shipmentStatus === 'in_transit';
      return false;
    });
  }

  static async getPackageStats(): Promise<{
    unassigned: number;
    assigned: number;
    in_transit: number;
  }> {
    const packages = await this.list(1000);
    
    return {
      unassigned: packages.filter(pkg => !pkg.loadId).length,
      assigned: packages.filter(pkg => pkg.loadId && pkg.shipmentStatus === 'ready').length,
      in_transit: packages.filter(pkg => pkg.shipmentStatus === 'in_transit').length,
    };
  }
}