import { Customer, Package } from '@shipnorth/shared';
import { CustomerModel } from '../models/customer';
import { PackageModel } from '../models/package';
import { StripeService } from './stripe';
import { NotificationService } from './notifications';

export interface CustomerRegistrationData {
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
}

export interface RegistrationResult {
  customer: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'email'>;
  setupIntent: {
    client_secret: string;
    id: string;
  };
  message: string;
}

export class CustomerService {
  static async registerCustomer(data: CustomerRegistrationData): Promise<RegistrationResult> {
    // Check if customer already exists
    const existingCustomer = await CustomerModel.findByEmail(data.email);
    if (existingCustomer) {
      throw new Error('CUSTOMER_EXISTS');
    }

    // Create Stripe customer
    const stripeCustomer = await StripeService.createCustomer({
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
      address: {
        line1: data.addressLine1,
        line2: data.addressLine2,
        city: data.city,
        state: data.province,
        postal_code: data.postalCode,
        country: data.country,
      },
    });

    // Create setup intent for payment method
    const setupIntent = await StripeService.createSetupIntent(stripeCustomer.id);

    // Create customer record
    const customer = await CustomerModel.create({
      ...data,
      stripeCustomerId: stripeCustomer.id,
      status: 'active',
    });

    return {
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
      setupIntent: {
        client_secret: setupIntent.client_secret!,
        id: setupIntent.id,
      },
      message: 'Registration successful. Please add a payment method to complete setup.',
    };
  }

  static async completeRegistration(customerId: string, setupIntentId: string): Promise<Customer> {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Retrieve setup intent from Stripe
    const setupIntent = await StripeService.stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      throw new Error('Payment method setup not completed');
    }

    // Update customer with payment method
    const updatedCustomer = await CustomerModel.update(customerId, {
      stripePaymentMethodId: setupIntent.payment_method as string,
    });

    if (!updatedCustomer) {
      throw new Error('Failed to update customer');
    }

    // Set as default payment method
    if (customer.stripeCustomerId) {
      await StripeService.setDefaultPaymentMethod(
        customer.stripeCustomerId,
        setupIntent.payment_method as string
      );
    }

    return updatedCustomer;
  }

  static async importCustomers(customersData: CustomerRegistrationData[]): Promise<{
    created: number;
    updated: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    const results = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ email: string; error: string }>,
    };

    for (const customerData of customersData) {
      try {
        const existingCustomer = await CustomerModel.findByEmail(customerData.email);

        if (existingCustomer) {
          // Update existing customer
          await CustomerModel.update(existingCustomer.id, customerData);
          results.updated++;
        } else {
          // Create new customer with Stripe
          const stripeCustomer = await StripeService.createCustomer({
            email: customerData.email,
            name: `${customerData.firstName} ${customerData.lastName}`,
            phone: customerData.phone,
            address: {
              line1: customerData.addressLine1,
              line2: customerData.addressLine2,
              city: customerData.city,
              state: customerData.province,
              postal_code: customerData.postalCode,
              country: customerData.country || 'CA',
            },
          });

          await CustomerModel.create({
            ...customerData,
            stripeCustomerId: stripeCustomer.id,
            status: 'active',
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push({
          email: customerData.email,
          error: error.message,
        });
      }
    }

    return results;
  }

  static async getCustomerWithPackages(customerId: string): Promise<{
    customer: Customer;
    packages: (Package & { expectedDeliveryDate?: string; loadLocation?: any })[];
  } | null> {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) return null;

    const packages = await CustomerModel.getPackages(customerId);

    // Enhance packages with expected delivery dates and load locations
    const enhancedPackages = await Promise.all(
      packages.map(async (pkg: Package) => {
        const expectedDeliveryDate = await PackageModel.getExpectedDeliveryDate(pkg.id);

        let loadLocation = null;
        if (pkg.loadId) {
          try {
            const load = await LoadModel.findById(pkg.loadId);
            loadLocation = load?.currentLocation;
          } catch (error) {
            console.error('Failed to get load location:', error);
          }
        }

        return {
          ...pkg,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          loadLocation,
        };
      })
    );

    return {
      customer,
      packages: enhancedPackages,
    };
  }

  static async updateCustomerPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Customer> {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    if (!customer.stripeCustomerId) {
      throw new Error('Customer has no Stripe account');
    }

    // Attach payment method to Stripe customer
    await StripeService.attachPaymentMethodToCustomer(paymentMethodId, customer.stripeCustomerId);

    // Set as default
    await StripeService.setDefaultPaymentMethod(customer.stripeCustomerId, paymentMethodId);

    // Update customer record
    const updatedCustomer = await CustomerModel.update(customerId, {
      stripePaymentMethodId: paymentMethodId,
    });

    if (!updatedCustomer) {
      throw new Error('Failed to update customer');
    }

    return updatedCustomer;
  }

  static async getCustomerPaymentMethods(customerId: string): Promise<any[]> {
    const customer = await CustomerModel.findById(customerId);
    if (!customer?.stripeCustomerId) {
      return [];
    }

    return await StripeService.getCustomerPaymentMethods(customer.stripeCustomerId);
  }

  static async deleteCustomer(customerId: string): Promise<boolean> {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) return false;

    // Check if customer has active packages
    const packages = await CustomerModel.getPackages(customerId);
    const activePackages = packages.filter(
      (pkg: Package) => pkg.shipmentStatus !== 'delivered' && pkg.paymentStatus !== 'refunded'
    );

    if (activePackages.length > 0) {
      throw new Error('Cannot delete customer with active packages');
    }

    // Delete from Stripe if exists
    if (customer.stripeCustomerId) {
      try {
        await StripeService.stripe.customers.del(customer.stripeCustomerId);
      } catch (error) {
        console.error('Failed to delete Stripe customer:', error);
        // Continue with local deletion
      }
    }

    return await CustomerModel.delete(customerId);
  }

  static async searchCustomers(query: string, limit: number = 50): Promise<Customer[]> {
    // This is a simplified search - in production you'd use a proper search service
    const allCustomers = await CustomerModel.list(1000);

    const lowercaseQuery = query.toLowerCase();
    return allCustomers
      .filter(
        (customer) =>
          customer.firstName.toLowerCase().includes(lowercaseQuery) ||
          customer.lastName.toLowerCase().includes(lowercaseQuery) ||
          customer.email.toLowerCase().includes(lowercaseQuery) ||
          customer.phone.includes(query)
      )
      .slice(0, limit);
  }
}
