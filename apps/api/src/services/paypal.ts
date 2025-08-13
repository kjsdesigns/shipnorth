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

    this.baseURL = this.config.environment === 'live'
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
      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in seconds, convert to milliseconds and subtract 5 minutes for safety
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      
      return this.accessToken;
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
          purchase_units: [{
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
          }],
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
            'Authorization': `Bearer ${accessToken}`,
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
            'Authorization': `Bearer ${accessToken}`,
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
            'Authorization': `Bearer ${accessToken}`,
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
      const response = await axios.get(
        `${this.baseURL}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('PayPal get order error:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal order details');
    }
  }

  /**
   * Create a payment link for customer
   */
  async createPaymentLink(packageData: any, customer: any) {
    // Calculate shipping cost (mock calculation)
    const shippingCost = this.calculateShippingCost(packageData);
    
    const order = await this.createOrder(
      shippingCost,
      `Shipping for package ${packageData.barcode}`,
      packageData.id
    );

    return {
      paymentUrl: order.approveUrl,
      orderId: order.orderId,
      amount: shippingCost,
    };
  }

  /**
   * Calculate shipping cost (mock for now)
   */
  private calculateShippingCost(packageData: any): number {
    // Base rate
    let cost = 15.00;
    
    // Weight-based pricing (per kg)
    cost += packageData.weight * 2.50;
    
    // Size surcharge for large packages
    const volume = packageData.length * packageData.width * packageData.height;
    if (volume > 100000) { // cm³
      cost += 10.00;
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
            'Authorization': `Bearer ${accessToken}`,
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