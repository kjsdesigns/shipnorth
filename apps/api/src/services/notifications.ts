import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SettingsModel } from '../models/settings';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

export interface NotificationData {
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  packageTrackingNumber: string;
  status: string;
  expectedDeliveryDate?: string;
  currentLocation?: string;
  deliveryConfirmation?: any;
}

export class NotificationService {
  static async sendPackageStatusNotification(data: NotificationData): Promise<void> {
    const settings = await SettingsModel.get();

    const promises = [];

    // Send email notification
    if (settings.notificationSettings.emailEnabled) {
      promises.push(this.sendEmailNotification(data));
    }

    // Send SMS notification
    if (settings.notificationSettings.smsEnabled && data.customerPhone) {
      promises.push(this.sendSMSNotification(data));
    }

    await Promise.allSettled(promises);
  }

  private static async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      const subject = this.getEmailSubject(data.status);
      const htmlBody = this.getEmailTemplate(data);
      const textBody = this.getEmailTextContent(data);

      const command = new SendEmailCommand({
        Source: process.env.NOTIFICATION_EMAIL || 'noreply@shipnorth.com',
        Destination: {
          ToAddresses: [data.customerEmail],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
        Tags: [
          {
            Name: 'NotificationType',
            Value: 'PackageUpdate',
          },
          {
            Name: 'PackageStatus',
            Value: data.status,
          },
        ],
      });

      await sesClient.send(command);
      console.log('Email notification sent:', data.customerEmail);
    } catch (error) {
      console.error('Email notification error:', error);
      throw error;
    }
  }

  private static async sendSMSNotification(data: NotificationData): Promise<void> {
    try {
      const message = this.getSMSMessage(data);

      const command = new PublishCommand({
        PhoneNumber: data.customerPhone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });

      await snsClient.send(command);
      console.log('SMS notification sent:', data.customerPhone);
    } catch (error) {
      console.error('SMS notification error:', error);
      throw error;
    }
  }

  private static getEmailSubject(status: string): string {
    switch (status) {
      case 'ready':
        return 'Package Ready for Pickup - Shipnorth';
      case 'in_transit':
        return 'Package in Transit - Shipnorth';
      case 'delivered':
        return 'Package Delivered - Shipnorth';
      case 'exception':
        return 'Delivery Exception - Shipnorth';
      default:
        return 'Package Update - Shipnorth';
    }
  }

  private static getSMSMessage(data: NotificationData): string {
    switch (data.status) {
      case 'ready':
        return `Shipnorth: Your package ${data.packageTrackingNumber} is ready for pickup.`;
      case 'in_transit':
        return `Shipnorth: Your package ${data.packageTrackingNumber} is in transit${
          data.expectedDeliveryDate
            ? ` and expected to deliver on ${new Date(data.expectedDeliveryDate).toLocaleDateString()}`
            : ''
        }.`;
      case 'delivered':
        return `Shipnorth: Your package ${data.packageTrackingNumber} has been delivered!`;
      case 'exception':
        return `Shipnorth: There was an issue delivering your package ${data.packageTrackingNumber}. Please contact us.`;
      default:
        return `Shipnorth: Update for package ${data.packageTrackingNumber} - Status: ${data.status}`;
    }
  }

  private static getEmailTemplate(data: NotificationData): string {
    const statusColor = this.getStatusColor(data.status);
    const statusMessage = this.getStatusMessage(data.status);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Package Update - Shipnorth</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Shipnorth</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Package Update</p>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: ${statusColor}; color: white; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold;">
                ${statusMessage}
            </div>
        </div>
        
        <p>Hello ${data.customerName},</p>
        
        <p>We have an update on your package:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666;">Tracking Number:</td>
                    <td style="padding: 8px 0;">${data.packageTrackingNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666;">Status:</td>
                    <td style="padding: 8px 0;">${statusMessage}</td>
                </tr>
                ${
                  data.expectedDeliveryDate
                    ? `
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666;">Expected Delivery:</td>
                    <td style="padding: 8px 0;">${new Date(data.expectedDeliveryDate).toLocaleDateString()}</td>
                </tr>
                `
                    : ''
                }
                ${
                  data.currentLocation
                    ? `
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666;">Current Location:</td>
                    <td style="padding: 8px 0;">${data.currentLocation}</td>
                </tr>
                `
                    : ''
                }
            </table>
        </div>
        
        ${
          data.deliveryConfirmation
            ? `
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin: 0 0 10px 0;">Delivery Confirmed</h3>
            <p style="margin: 0; color: #155724;">
                Delivered on ${new Date(data.deliveryConfirmation.deliveredAt).toLocaleDateString()}
                ${data.deliveryConfirmation.recipientName ? ` to ${data.deliveryConfirmation.recipientName}` : ''}
            </p>
        </div>
        `
            : ''
        }
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/customer" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View in Customer Portal
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Questions? Reply to this email or contact us at support@shipnorth.com
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>© 2024 Shipnorth. All rights reserved.</p>
    </div>
</body>
</html>`;
  }

  private static getEmailTextContent(data: NotificationData): string {
    return `
Package Update - Shipnorth

Hello ${data.customerName},

We have an update on your package:

Tracking Number: ${data.packageTrackingNumber}
Status: ${this.getStatusMessage(data.status)}
${data.expectedDeliveryDate ? `Expected Delivery: ${new Date(data.expectedDeliveryDate).toLocaleDateString()}` : ''}
${data.currentLocation ? `Current Location: ${data.currentLocation}` : ''}

${
  data.deliveryConfirmation
    ? `
Delivery Confirmed:
Delivered on ${new Date(data.deliveryConfirmation.deliveredAt).toLocaleDateString()}
${data.deliveryConfirmation.recipientName ? `Received by: ${data.deliveryConfirmation.recipientName}` : ''}
`
    : ''
}

View your package details at: ${process.env.FRONTEND_URL}/customer

Questions? Contact us at support@shipnorth.com

© 2024 Shipnorth. All rights reserved.
    `.trim();
  }

  private static getStatusMessage(status: string): string {
    switch (status) {
      case 'ready':
        return 'Ready for Pickup';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'exception':
        return 'Delivery Exception';
      case 'returned':
        return 'Returned to Sender';
      default:
        return 'Processing';
    }
  }

  private static getStatusColor(status: string): string {
    switch (status) {
      case 'delivered':
        return '#28a745';
      case 'in_transit':
        return '#007bff';
      case 'exception':
        return '#dc3545';
      case 'returned':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  }

  // Send notification when package status changes
  static async notifyPackageStatusChange(
    packageId: string,
    newStatus: string,
    customerData: any,
    additionalData?: any
  ): Promise<void> {
    try {
      await this.sendPackageStatusNotification({
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        customerName: `${customerData.firstName} ${customerData.lastName}`,
        packageTrackingNumber: additionalData?.trackingNumber || packageId,
        status: newStatus,
        expectedDeliveryDate: additionalData?.expectedDeliveryDate,
        currentLocation: additionalData?.currentLocation,
        deliveryConfirmation: additionalData?.deliveryConfirmation,
      });
    } catch (error) {
      console.error('Failed to send status notification:', error);
      // Don't throw - notification failures shouldn't break the main flow
    }
  }

  // Send bulk notifications
  static async sendBulkNotifications(notifications: NotificationData[]): Promise<void> {
    const batchSize = 10;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const promises = batch.map((notification) =>
        this.sendPackageStatusNotification(notification).catch((error) => {
          console.error('Batch notification error:', error);
          return null;
        })
      );

      await Promise.allSettled(promises);

      // Rate limiting - wait between batches
      if (i + batchSize < notifications.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Test notification endpoints
  static async sendTestNotification(
    email: string,
    phone?: string
  ): Promise<{ email: boolean; sms: boolean }> {
    const testData: NotificationData = {
      customerEmail: email,
      customerPhone: phone,
      customerName: 'Test Customer',
      packageTrackingNumber: 'TEST123',
      status: 'in_transit',
      expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
      currentLocation: 'Toronto, ON',
    };

    const results = { email: false, sms: false };

    try {
      await this.sendEmailNotification(testData);
      results.email = true;
    } catch (error) {
      console.error('Test email failed:', error);
    }

    if (phone) {
      try {
        await this.sendSMSNotification(testData);
        results.sms = true;
      } catch (error) {
        console.error('Test SMS failed:', error);
      }
    }

    return results;
  }
}
