import axios from 'axios';

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

class PayPalService {
  private config: PayPalConfig;
  private baseURL: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.config = {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox',
    };

    this.baseURL =
      this.config.environment === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Get OAuth 2.0 access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString(
        'base64'
      );

      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Accept: 'application/json',
            'Accept-Language': 'en_US',
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in seconds, convert to milliseconds and subtract 5 minutes for safety
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);

      return this.accessToken!;
    } catch (error: any) {
      console.error('PayPal OAuth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  /**
   * Create an order (payment)
   */
  async createOrder(amount: number, description: string, referenceId: string) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: referenceId,
              description: description,
              amount: {
                currency_code: 'CAD',
                value: amount.toFixed(2),
              },
              shipping: {
                type: 'SHIPPING',
                name: {
                  full_name: 'Shipnorth Package',
                },
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                brand_name: 'Shipnorth',
                locale: 'en-CA',
                landing_page: 'LOGIN',
                user_action: 'PAY_NOW',
                return_url: `${process.env.APP_URL}/payment/success`,
                cancel_url: `${process.env.APP_URL}/payment/cancel`,
              },
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'PayPal-Request-Id': `shipnorth-${referenceId}`,
          },
        }
      );

      return {
        orderId: response.data.id,
        status: response.data.status,
        links: response.data.links,
        approveUrl: response.data.links.find((link: any) => link.rel === 'approve')?.href,
      };
    } catch (error: any) {
      console.error('PayPal create order error:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal order');
    }
  }

  /**
   * Capture payment for an approved order
   */
  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const capture = response.data.purchase_units[0].payments.captures[0];

      return {
        transactionId: capture.id,
        status: capture.status,
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        payerEmail: response.data.payer?.email_address,
        payerName: `${response.data.payer?.name?.given_name} ${response.data.payer?.name?.surname}`,
      };
    } catch (error: any) {
      console.error('PayPal capture error:', error.response?.data || error.message);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  /**
   * Refund a captured payment
   */
  async refundPayment(captureId: string, amount?: number, reason?: string) {
    const accessToken = await this.getAccessToken();

    try {
      const body: any = {
        note_to_payer: reason || 'Refund processed by Shipnorth',
      };

      // If amount specified, do partial refund
      if (amount) {
        body.amount = {
          value: amount.toFixed(2),
          currency_code: 'CAD',
        };
      }

      const response = await axios.post(
        `${this.baseURL}/v2/payments/captures/${captureId}/refund`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        refundId: response.data.id,
        status: response.data.status,
        amount: parseFloat(response.data.amount.value),
      };
    } catch (error: any) {
      console.error('PayPal refund error:', error.response?.data || error.message);
      throw new Error('Failed to process PayPal refund');
    }
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderId: string) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.get(`${this.baseURL}/v2/checkout/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('PayPal get order error:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal order details');
    }
  }

  /**
   * Create Advanced Card Payment order for vault storage
   */
  async createVaultOrder(customerData: { email: string; name: string; phone?: string }) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          payment_source: {
            card: {
              attributes: {
                vault: {
                  store_in_vault: 'ON_SUCCESS',
                  usage_pattern: 'MERCHANT',
                  usage_type: 'MERCHANT',
                  customer_type: 'CONSUMER',
                },
              },
            },
          },
          purchase_units: [
            {
              amount: {
                currency_code: 'CAD',
                value: '0.00', // Zero dollar auth for card validation
              },
              description: 'Payment method validation for Shipnorth account',
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'PayPal-Request-Id': `vault-${Date.now()}`,
          },
        }
      );

      return {
        orderId: response.data.id,
        status: response.data.status,
        links: response.data.links,
      };
    } catch (error: any) {
      console.error('PayPal vault order creation error:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal vault order');
    }
  }

  /**
   * Capture vault order and get payment token
   */
  async captureVaultOrder(orderId: string) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Extract card details and vault information
      const paymentSource = response.data.payment_source?.card;
      const vaultId = paymentSource?.attributes?.vault?.id;

      return {
        orderId: response.data.id,
        status: response.data.status,
        paymentSource: {
          card: {
            last4: paymentSource?.last_digits,
            brand: paymentSource?.brand?.toLowerCase(),
            expiryMonth: paymentSource?.expiry?.substring(0, 2),
            expiryYear: paymentSource?.expiry?.substring(5, 9),
            type: 'CARD',
            token: vaultId,
          },
        },
        payer: {
          email: response.data.payer?.email_address,
          name: `${response.data.payer?.name?.given_name} ${response.data.payer?.name?.surname}`,
        },
      };
    } catch (error: any) {
      console.error('PayPal vault capture error:', error.response?.data || error.message);
      throw new Error('Failed to capture PayPal vault order');
    }
  }

  /**
   * Process payment using stored payment token
   */
  async processPaymentWithToken(
    paymentTokenId: string,
    amount: number,
    description: string,
    referenceId: string
  ) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: referenceId,
              description: description,
              amount: {
                currency_code: 'CAD',
                value: amount.toFixed(2),
              },
            },
          ],
          payment_source: {
            card: {
              vault_id: paymentTokenId,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'PayPal-Request-Id': `payment-${referenceId}`,
          },
        }
      );

      // Immediately capture the payment
      const captureResponse = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${response.data.id}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const capture = captureResponse.data.purchase_units[0].payments.captures[0];

      return {
        orderId: captureResponse.data.id,
        transactionId: capture.id,
        status: capture.status,
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        payerEmail: captureResponse.data.payer?.email_address,
        payerName: `${captureResponse.data.payer?.name?.given_name} ${captureResponse.data.payer?.name?.surname}`,
      };
    } catch (error: any) {
      console.error('PayPal token payment error:', error.response?.data || error.message);
      throw new Error('Failed to process payment with stored token');
    }
  }

  /**
   * Create setup token for customer registration (payment method collection)
   * @deprecated Use createVaultOrder instead for inline card collection
   */
  async createCustomerSetupToken(customerData: { email: string; name: string; phone?: string }) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v3/vault/setup-tokens`,
        {
          payment_source: {
            card: {
              experience_context: {
                return_url: `${process.env.FRONTEND_URL || process.env.APP_URL}/register/payment-complete`,
                cancel_url: `${process.env.FRONTEND_URL || process.env.APP_URL}/register/payment-cancelled`,
                brand_name: 'Shipnorth',
                locale: 'en-CA',
                user_action: 'CONTINUE',
              },
            },
          },
          usage: 'MERCHANT',
          customer: {
            email_address: customerData.email,
            name: {
              given_name: customerData.name.split(' ')[0] || customerData.name,
              surname: customerData.name.split(' ').slice(1).join(' ') || 'Customer',
            },
            phone: customerData.phone
              ? {
                  phone_number: {
                    national_number: customerData.phone,
                  },
                }
              : undefined,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'PayPal-Request-Id': `setup-${Date.now()}`,
          },
        }
      );

      return {
        setupTokenId: response.data.id,
        approveUrl: response.data.links?.find((link: any) => link.rel === 'approve')?.href,
        customerId: response.data.customer?.id,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('PayPal setup token creation error:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal setup token');
    }
  }

  /**
   * Create payment token after customer approval
   */
  async createPaymentToken(setupTokenId: string) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v3/vault/payment-tokens`,
        {
          payment_source: {
            token: {
              id: setupTokenId,
              type: 'SETUP_TOKEN',
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        paymentTokenId: response.data.id,
        customerId: response.data.customer?.id,
        paymentSource: {
          card: response.data.payment_source?.card || null,
        },
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('PayPal payment token creation error:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal payment token');
    }
  }

  /**
   * Get payment method details by token ID
   */
  async getPaymentMethodDetails(tokenId: string) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.get(`${this.baseURL}/v3/vault/payment-tokens/${tokenId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const token = response.data;
      const paymentSource = token.payment_source;

      // Format the payment method details
      return {
        id: token.id,
        type: paymentSource.card ? 'CARD' : 'PAYPAL',
        last4: paymentSource.card?.last_digits || null,
        brand: paymentSource.card?.brand || null,
        expiryMonth: paymentSource.card?.expiry?.substring(0, 2) || null,
        expiryYear: paymentSource.card?.expiry?.substring(5, 9) || null,
        status: token.status,
        createdAt: token.create_time,
        customerId: token.customer?.id,
      };
    } catch (error: any) {
      console.error(
        'PayPal get payment method details error:',
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Get customer payment tokens
   */
  async getCustomerPaymentTokens(customerId: string) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.baseURL}/v3/vault/payment-tokens?customer_id=${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const tokens = response.data.payment_tokens || [];

      // Get detailed information for each token
      const detailedTokens = await Promise.all(
        tokens.map(async (token: any) => {
          const details = await this.getPaymentMethodDetails(token.id);
          return (
            details || {
              id: token.id,
              type: 'UNKNOWN',
              last4: null,
              brand: null,
              expiryMonth: null,
              expiryYear: null,
              status: token.status,
              createdAt: token.create_time,
              customerId: token.customer?.id,
            }
          );
        })
      );

      return detailedTokens.filter(Boolean);
    } catch (error: any) {
      console.error('PayPal get payment tokens error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Delete payment token
   */
  async deletePaymentToken(tokenId: string) {
    const accessToken = await this.getAccessToken();

    try {
      await axios.delete(`${this.baseURL}/v3/vault/payment-tokens/${tokenId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return true;
    } catch (error: any) {
      console.error('PayPal delete payment token error:', error.response?.data || error.message);
      throw new Error('Failed to delete PayPal payment token');
    }
  }

  /**
   * Calculate shipping cost (mock for now)
   */
  private calculateShippingCost(packageData: any): number {
    // Base rate
    let cost = 15.0;

    // Weight-based pricing (per kg)
    cost += packageData.weight * 2.5;

    // Size surcharge for large packages
    const volume = packageData.length * packageData.width * packageData.height;
    if (volume > 100000) {
      // cm³
      cost += 10.0;
    }

    // Express delivery surcharge
    if (packageData.serviceType === 'express') {
      cost *= 1.5;
    }

    return Math.round(cost * 100) / 100;
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(headers: any, body: any): Promise<boolean> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseURL}/v1/notifications/verify-webhook-signature`,
        {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: body,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(eventType: string, resource: any) {
    console.log(`Processing PayPal webhook: ${eventType}`);

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment successful
        await this.handlePaymentCompleted(resource);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.FAILED':
        // Payment failed
        await this.handlePaymentFailed(resource);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        // Refund processed
        await this.handleRefundCompleted(resource);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }
  }

  private async handlePaymentCompleted(capture: any) {
    console.log(`Payment completed: ${capture.id}`);
    // Update package payment status in database
    // Send confirmation email
  }

  private async handlePaymentFailed(capture: any) {
    console.log(`Payment failed: ${capture.id}`);
    // Update package payment status
    // Send failure notification
  }

  private async handleRefundCompleted(refund: any) {
    console.log(`Refund completed: ${refund.id}`);
    // Update invoice status
    // Send refund confirmation
  }
}

export default new PayPalService();
