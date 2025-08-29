import { DatabaseService, generateId } from '../services/database';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  shipId: string; // Unique alphanumeric ID like A654337731A
  paypalCustomerId?: string;
  paypalPaymentTokenId?: string;
  paymentMethod?: {
    last4: string;
    brand: string; // visa, mastercard, etc
    expiryMonth: string;
    expiryYear: string;
    type: 'CARD' | 'PAYPAL';
    token: string; // PayPal vault token ID
  };
  status: 'active' | 'inactive' | 'onhold';
  lastLoginAt?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class CustomerModel {
  static async create(
    customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'shipId'>
  ): Promise<Customer> {
    const id = generateId();
    const shipId = await this.generateShipId();
    const newCustomer: Customer = {
      id,
      ...customer,
      shipId,
      status: customer.status || 'active',
    };

    await DatabaseService.put({
      PK: `CUSTOMER#${id}`,
      SK: 'METADATA',
      GSI1PK: `EMAIL#${customer.email.toLowerCase()}`,
      GSI1SK: `CUSTOMER#${id}`,
      Type: 'Customer',
      Data: newCustomer,
    });

    return newCustomer;
  }

  static async get(id: string): Promise<Customer | null> {
    return this.findById(id);
  }

  static async findById(id: string): Promise<Customer | null> {
    const item = await DatabaseService.get(`CUSTOMER#${id}`, 'METADATA');
    return item ? item.Data : null;
  }

  static async findByEmail(email: string): Promise<Customer | null> {
    const items = await DatabaseService.queryByGSI('GSI1', `EMAIL#${email.toLowerCase()}`);
    return items.length > 0 ? items[0].Data : null;
  }

  static async update(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updatedCustomer = { ...current, ...updates };

    const updateData: any = {
      Data: updatedCustomer,
    };

    // Update email index if email changed
    if (updates.email && updates.email !== current.email) {
      // Delete old email index
      await DatabaseService.delete(`EMAIL#${current.email.toLowerCase()}`, `CUSTOMER#${id}`);

      // Create new email index
      await DatabaseService.put({
        PK: `EMAIL#${updates.email.toLowerCase()}`,
        SK: `CUSTOMER#${id}`,
        Type: 'CustomerEmailIndex',
      });

      updateData.GSI1PK = `EMAIL#${updates.email.toLowerCase()}`;
    }

    const result = await DatabaseService.update(`CUSTOMER#${id}`, 'METADATA', updateData);
    return result ? result.Data : null;
  }

  static async list(limit = 100): Promise<Customer[]> {
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': 'Customer',
      },
      Limit: limit,
    });

    return items.map((item: any) => item.Data).filter(Boolean);
  }

  static async search(query: string, limit = 20): Promise<Customer[]> {
    // Get all customers and filter client-side for DynamoDB
    // In production, you might want to use Elasticsearch or similar
    const allCustomers = await this.list(500); // Get more records for search

    const searchTerm = query.toLowerCase().trim();

    return allCustomers
      .filter((customer) => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        return (
          customer.firstName.toLowerCase().includes(searchTerm) ||
          customer.lastName.toLowerCase().includes(searchTerm) ||
          fullName.includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm) ||
          (customer.phone && customer.phone.toLowerCase().includes(searchTerm))
        );
      })
      .slice(0, limit);
  }

  // Generate unique Ship ID like A654337731A
  static async generateShipId(): Promise<string> {
    let isUnique = false;
    let shipId = '';

    while (!isUnique) {
      // Generate format: A + 9 digits + A (like screenshot)
      const letter1 = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
      const digits = Math.floor(Math.random() * 1000000000)
        .toString()
        .padStart(9, '0');
      const letter2 = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
      shipId = letter1 + digits + letter2;

      // Check if this Ship ID already exists
      const existing = await this.findByShipId(shipId);
      isUnique = !existing;
    }

    return shipId;
  }

  static async findByShipId(shipId: string): Promise<Customer | null> {
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type AND #data.#shipId = :shipId',
      ExpressionAttributeNames: {
        '#type': 'Type',
        '#data': 'Data',
        '#shipId': 'shipId',
      },
      ExpressionAttributeValues: {
        ':type': 'Customer',
        ':shipId': shipId,
      },
      Limit: 1,
    });

    return items.length > 0 ? items[0].Data : null;
  }

  static async delete(id: string): Promise<boolean> {
    const customer = await this.findById(id);
    if (!customer) return false;

    await DatabaseService.delete(`CUSTOMER#${id}`, 'METADATA');
    await DatabaseService.delete(`EMAIL#${customer.email.toLowerCase()}`, `CUSTOMER#${id}`);

    return true;
  }

  static async getPackages(customerId: string): Promise<any[]> {
    const items = await DatabaseService.queryByGSI('GSI1', `CUSTOMER#${customerId}`);
    return items.filter((item: any) => item.Type === 'Package').map((item: any) => item.Data);
  }

  static async getInvoices(customerId: string): Promise<any[]> {
    const items = await DatabaseService.queryByGSI('GSI1', `CUSTOMER#${customerId}`);
    return items.filter((item: any) => item.Type === 'Invoice').map((item: any) => item.Data);
  }
}
