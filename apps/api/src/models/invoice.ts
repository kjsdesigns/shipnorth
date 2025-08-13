import { DatabaseService, generateId } from '../services/database';

export interface Invoice {
  id: string;
  customerId: string;
  packageId: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  stripePaymentIntentId?: string;
  status: 'draft' | 'sent' | 'paid' | 'failed' | 'refunded' | 'void';
  invoiceUrl?: string;
  notes?: string;
  createdAt?: string;
  paidAt?: string;
  updatedAt?: string;
}

export class InvoiceModel {
  static async create(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const id = generateId();
    
    const newInvoice: Invoice = {
      id,
      ...invoice,
      status: invoice.status || 'draft',
      currency: invoice.currency || 'CAD',
    };

    await DatabaseService.put({
      PK: `INVOICE#${id}`,
      SK: 'METADATA',
      GSI1PK: `CUSTOMER#${invoice.customerId}`,
      GSI1SK: `INVOICE#${id}`,
      Type: 'Invoice',
      Data: newInvoice,
    });

    // Link invoice to package
    if (invoice.packageId) {
      await DatabaseService.update(`PACKAGE#${invoice.packageId}`, 'METADATA', {
        'Data.invoiceId': id,
      });
    }

    return newInvoice;
  }

  static async findById(id: string): Promise<Invoice | null> {
    const item = await DatabaseService.get(`INVOICE#${id}`, 'METADATA');
    return item ? item.Data : null;
  }

  static async findByCustomer(customerId: string): Promise<Invoice[]> {
    const items = await DatabaseService.queryByGSI('GSI1', `CUSTOMER#${customerId}`);
    return items
      .filter((item: any) => item.Type === 'Invoice')
      .map((item: any) => item.Data);
  }

  static async findByPackage(packageId: string): Promise<Invoice | null> {
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type AND #data.#packageId = :packageId',
      ExpressionAttributeNames: {
        '#type': 'Type',
        '#data': 'Data',
        '#packageId': 'packageId',
      },
      ExpressionAttributeValues: {
        ':type': 'Invoice',
        ':packageId': packageId,
      },
    });

    return items.length > 0 ? items[0].Data : null;
  }

  static async update(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updatedInvoice = { ...current, ...updates };
    
    // Track payment time
    if (updates.status === 'paid' && current.status !== 'paid') {
      updatedInvoice.paidAt = new Date().toISOString();
    }

    const result = await DatabaseService.update(`INVOICE#${id}`, 'METADATA', {
      Data: updatedInvoice,
    });
    
    return result ? result.Data : null;
  }

  static async list(limit = 100): Promise<Invoice[]> {
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': 'Invoice',
      },
      Limit: limit,
    });

    return items.map((item: any) => item.Data).filter(Boolean);
  }

  static async calculateTotal(packageId: string): Promise<{ amount: number; tax: number; total: number }> {
    const pkg = await DatabaseService.get(`PACKAGE#${packageId}`, 'METADATA');
    if (!pkg || !pkg.Data) {
      throw new Error('Package not found');
    }

    const baseAmount = pkg.Data.price || pkg.Data.quotedRate || 25.00;
    const taxRate = 0.13; // 13% HST for Ontario
    const tax = Math.round(baseAmount * taxRate * 100) / 100;
    const total = Math.round((baseAmount + tax) * 100) / 100;

    return {
      amount: baseAmount,
      tax,
      total,
    };
  }

  static async processPayment(id: string): Promise<boolean> {
    const invoice = await this.findById(id);
    if (!invoice) return false;

    // Mock payment processing
    const success = Math.random() > 0.1; // 90% success rate for demo

    if (success) {
      await this.update(id, {
        status: 'paid',
        stripePaymentIntentId: `pi_mock_${Date.now()}`,
      });

      // Update package payment status
      if (invoice.packageId) {
        await DatabaseService.update(`PACKAGE#${invoice.packageId}`, 'METADATA', {
          'Data.paymentStatus': 'paid',
        });
      }
    } else {
      await this.update(id, {
        status: 'failed',
      });

      // Update package payment status
      if (invoice.packageId) {
        await DatabaseService.update(`PACKAGE#${invoice.packageId}`, 'METADATA', {
          'Data.paymentStatus': 'failed',
        });
      }
    }

    return success;
  }

  static async refund(id: string): Promise<boolean> {
    const invoice = await this.findById(id);
    if (!invoice || invoice.status !== 'paid') return false;

    await this.update(id, {
      status: 'refunded',
    });

    // Update package payment status
    if (invoice.packageId) {
      await DatabaseService.update(`PACKAGE#${invoice.packageId}`, 'METADATA', {
        'Data.paymentStatus': 'refunded',
      });
    }

    return true;
  }

  static async delete(id: string): Promise<boolean> {
    const invoice = await this.findById(id);
    if (!invoice) return false;

    // Remove invoice reference from package
    if (invoice.packageId) {
      await DatabaseService.update(`PACKAGE#${invoice.packageId}`, 'METADATA', {
        'Data.invoiceId': null,
      });
    }

    await DatabaseService.delete(`INVOICE#${id}`, 'METADATA');
    
    return true;
  }

  static async generateInvoiceUrl(id: string): Promise<string> {
    const invoiceUrl = `https://mock-invoices.s3.amazonaws.com/invoice-${id}.pdf`;
    
    await this.update(id, { invoiceUrl });
    
    return invoiceUrl;
  }
}