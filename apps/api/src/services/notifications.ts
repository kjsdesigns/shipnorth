import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Initialize AWS clients
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ca-central-1',
});

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'ca-central-1',
});

// Email templates
const emailTemplates = {
  packageCreated: {
    subject: 'Your Shipnorth Package Has Been Created',
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
            .tracking-number { font-size: 24px; font-weight: bold; color: #2563eb; }
            .details { background-color: white; padding: 15px; border-radius: 8px; margin-top: 15px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Shipnorth</h1>
              <p>Your Package is Ready to Ship!</p>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>Great news! Your package has been created and is ready for shipping.</p>
              
              <div class="details">
                <p><strong>Tracking Number:</strong></p>
                <p class="tracking-number">${data.trackingNumber || 'Will be assigned soon'}</p>
                
                <p><strong>Package Details:</strong></p>
                <ul>
                  <li>Barcode: ${data.barcode}</li>
                  <li>Weight: ${data.weight} kg</li>
                  <li>Dimensions: ${data.dimensions}</li>
                  <li>Destination: ${data.destination}</li>
                </ul>
              </div>
              
              <a href="https://shipnorth.com/track/${data.trackingNumber || data.barcode}" class="button">
                Track Your Package
              </a>
            </div>
            <div class="footer">
              <p>© 2024 Shipnorth. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (data: any) => `
      Hi ${data.customerName},
      
      Your package has been created and is ready for shipping.
      
      Tracking Number: ${data.trackingNumber || 'Will be assigned soon'}
      Barcode: ${data.barcode}
      Weight: ${data.weight} kg
      Destination: ${data.destination}
      
      Track your package: https://shipnorth.com/track/${data.trackingNumber || data.barcode}
      
      © 2024 Shipnorth
    `
  },
  
  packageDelivered: {
    subject: 'Your Shipnorth Package Has Been Delivered! 🎉',
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
            .success-message { font-size: 20px; color: #10b981; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Package Delivered!</h1>
            </div>
            <div class="content">
              <p class="success-message">Your package has been successfully delivered!</p>
              <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
              <p><strong>Delivered at:</strong> ${data.deliveredAt}</p>
              <p><strong>Delivered to:</strong> ${data.deliveredTo}</p>
              
              <p>Thank you for choosing Shipnorth!</p>
            </div>
            <div class="footer">
              <p>© 2024 Shipnorth. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (data: any) => `
      Package Delivered!
      
      Your package ${data.trackingNumber} has been successfully delivered.
      Delivered at: ${data.deliveredAt}
      Delivered to: ${data.deliveredTo}
      
      Thank you for choosing Shipnorth!
    `
  },
  
  paymentFailed: {
    subject: 'Payment Failed - Action Required',
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
            .alert { background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; color: #991b1b; }
            .button { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
            </div>
            <div class="content">
              <div class="alert">
                <p><strong>We were unable to process your payment for package ${data.barcode}</strong></p>
                <p>Amount: $${data.amount}</p>
                <p>Please update your payment method to avoid delays.</p>
              </div>
              
              <a href="https://shipnorth.com/portal" class="button">
                Update Payment Method
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
    text: (data: any) => `
      Payment Failed - Action Required
      
      We were unable to process your payment for package ${data.barcode}.
      Amount: $${data.amount}
      
      Please update your payment method at: https://shipnorth.com/portal
    `
  }
};

// SMS templates
const smsTemplates = {
  packageCreated: (data: any) => 
    `Shipnorth: Package ${data.barcode} created. Track at: shipnorth.com/track/${data.trackingNumber || data.barcode}`,
  
  packageDelivered: (data: any) =>
    `Shipnorth: Package ${data.trackingNumber} delivered successfully! Thank you for shipping with us.`,
  
  outForDelivery: (data: any) =>
    `Shipnorth: Your package ${data.trackingNumber} is out for delivery today. Track: shipnorth.com/track/${data.trackingNumber}`,
  
  paymentFailed: (data: any) =>
    `Shipnorth: Payment failed for package ${data.barcode}. Update payment: shipnorth.com/portal`
};

export class NotificationService {
  static async sendEmail(to: string, template: keyof typeof emailTemplates, data: any) {
    try {
      const emailTemplate = emailTemplates[template];
      
      const command = new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL || 'noreply@shipnorth.com',
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: emailTemplate.subject,
          },
          Body: {
            Html: {
              Data: emailTemplate.html(data),
            },
            Text: {
              Data: emailTemplate.text(data),
            },
          },
        },
      });
      
      const response = await sesClient.send(command);
      console.log(`Email sent successfully: ${response.MessageId}`);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
  
  static async sendSMS(phoneNumber: string, template: keyof typeof smsTemplates, data: any) {
    try {
      // Ensure phone number is in E.164 format
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/\D/g, '')}`;
      
      const command = new PublishCommand({
        PhoneNumber: formattedPhone,
        Message: smsTemplates[template](data),
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'SHIPNORTH',
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional', // or 'Promotional'
          },
        },
      });
      
      const response = await snsClient.send(command);
      console.log(`SMS sent successfully: ${response.MessageId}`);
      return response;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
  
  // Batch email sending
  static async sendBulkEmail(recipients: string[], template: keyof typeof emailTemplates, data: any) {
    const promises = recipients.map(email => this.sendEmail(email, template, data));
    return Promise.allSettled(promises);
  }
  
  // Send both email and SMS
  static async sendNotification(
    email: string,
    phone: string | null,
    emailTemplate: keyof typeof emailTemplates,
    smsTemplate: keyof typeof smsTemplates,
    data: any
  ) {
    const notifications = [this.sendEmail(email, emailTemplate, data)];
    
    if (phone) {
      notifications.push(this.sendSMS(phone, smsTemplate, data));
    }
    
    return Promise.allSettled(notifications);
  }
  
  // Notification workflows
  static async notifyPackageCreated(customer: any, packageData: any) {
    const data = {
      customerName: `${customer.firstName} ${customer.lastName}`,
      barcode: packageData.barcode,
      trackingNumber: packageData.trackingNumber,
      weight: packageData.weight,
      dimensions: `${packageData.length}x${packageData.width}x${packageData.height}cm`,
      destination: `${packageData.shipTo.city}, ${packageData.shipTo.province}`,
    };
    
    return this.sendNotification(
      customer.email,
      customer.phone,
      'packageCreated',
      'packageCreated',
      data
    );
  }
  
  static async notifyPackageDelivered(customer: any, packageData: any) {
    const data = {
      trackingNumber: packageData.trackingNumber,
      deliveredAt: new Date().toLocaleString(),
      deliveredTo: packageData.shipTo.name,
    };
    
    return this.sendNotification(
      customer.email,
      customer.phone,
      'packageDelivered',
      'packageDelivered',
      data
    );
  }
  
  static async notifyPaymentFailed(customer: any, packageData: any, amount: number) {
    const data = {
      barcode: packageData.barcode,
      amount: (amount / 100).toFixed(2),
    };
    
    return this.sendNotification(
      customer.email,
      customer.phone,
      'paymentFailed',
      'paymentFailed',
      data
    );
  }
}

export default NotificationService;