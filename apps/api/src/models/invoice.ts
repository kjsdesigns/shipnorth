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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const keys = Object.keys(newInvoice);
    const values = Object.values(newInvoice);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const result = await DatabaseService.query(
      `INSERT INTO invoices (${keys.join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING *`,
      values
    );

    // Link invoice to package
    if (invoice.packageId) {
      await DatabaseService.query(
        'UPDATE packages SET invoice_id = $1 WHERE id = $2',
        [id, invoice.packageId]
      );
    }

    return result.rows[0];
  }

  static async findById(id: string): Promise<Invoice | null> {
    const result = await DatabaseService.query(
      'SELECT * FROM invoices WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async findByCustomer(customerId: string): Promise<Invoice[]> {
    const result = await DatabaseService.query(
      `SELECT * FROM invoices WHERE customer_id = $1`,
      [customerId]
    );
    return result.rows;
  }

  static async findByPackage(packageId: string): Promise<Invoice | null> {
    const result = await DatabaseService.query(
      `SELECT * FROM invoices WHERE package_id = $1 LIMIT 1`,
      [packageId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async update(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updatedInvoice = { 
      ...current, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };

    // Track payment time
    if (updates.status === 'paid' && current.status !== 'paid') {
      updatedInvoice.paidAt = new Date().toISOString();
    }

    const keys = Object.keys(updatedInvoice).filter(key => key !== 'id');
    const values = keys.map(key => updatedInvoice[key as keyof Invoice]);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await DatabaseService.query(
      `UPDATE invoices SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async list(limit = 100): Promise<Invoice[]> {
    const result = await DatabaseService.query(
      'SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  static async calculateTotal(
    packageId: string
  ): Promise<{ amount: number; tax: number; total: number }> {
    const result = await DatabaseService.query(
      'SELECT price, quoted_rate FROM packages WHERE id = $1 LIMIT 1',
      [packageId]
    );
    if (result.rows.length === 0) {
      throw new Error('Package not found');
    }

    const pkg = result.rows[0];
    const baseAmount = pkg.price || pkg.quoted_rate || 25.0;
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
        await DatabaseService.query(
          'UPDATE packages SET payment_status = $1 WHERE id = $2',
          ['paid', invoice.packageId]
        );
      }
    } else {
      await this.update(id, {
        status: 'failed',
      });

      // Update package payment status
      if (invoice.packageId) {
        await DatabaseService.query(
          'UPDATE packages SET payment_status = $1 WHERE id = $2',
          ['failed', invoice.packageId]
        );
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
      await DatabaseService.query(
        'UPDATE packages SET payment_status = $1 WHERE id = $2',
        ['refunded', invoice.packageId]
      );
    }

    return true;
  }

  static async delete(id: string): Promise<boolean> {
    const invoice = await this.findById(id);
    if (!invoice) return false;

    // Remove invoice reference from package
    if (invoice.packageId) {
      await DatabaseService.query(
        'UPDATE packages SET invoice_id = NULL WHERE id = $1',
        [invoice.packageId]
      );
    }

    await DatabaseService.query(
      'DELETE FROM invoices WHERE id = $1',
      [id]
    );

    return true;
  }

  static async generateInvoiceUrl(id: string): Promise<string> {
    const invoiceUrl = `https://mock-invoices.s3.amazonaws.com/invoice-${id}.pdf`;

    await this.update(id, { invoiceUrl });

    return invoiceUrl;
  }
}
