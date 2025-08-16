import { DatabaseService } from '../services/database';

export interface SystemSettings {
  id: 'system';
  defaultOriginAddress: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    webhookUrl?: string;
  };
  googleMapsApiKey?: string;
  stripeSettings: {
    publishableKey: string;
    webhookSecret: string;
  };
  updatedAt?: string;
}

export class SettingsModel {
  static async get(): Promise<SystemSettings> {
    const item = await DatabaseService.get('SETTINGS', 'system');
    
    if (!item?.Data) {
      // Return default settings if none exist
      return {
        id: 'system',
        defaultOriginAddress: {
          address1: '',
          city: '',
          province: '',
          postalCode: '',
          country: 'CA',
        },
        notificationSettings: {
          emailEnabled: true,
          smsEnabled: false,
        },
        stripeSettings: {
          publishableKey: '',
          webhookSecret: '',
        },
      };
    }
    
    return item.Data;
  }

  static async update(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.get();
    const updated = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    await DatabaseService.put({
      PK: 'SETTINGS',
      SK: 'system',
      Type: 'Settings',
      Data: updated,
    });

    return updated;
  }

  static async getDefaultOriginAddress(): Promise<SystemSettings['defaultOriginAddress']> {
    const settings = await this.get();
    return settings.defaultOriginAddress;
  }

  static async updateDefaultOriginAddress(address: SystemSettings['defaultOriginAddress']): Promise<void> {
    await this.update({ defaultOriginAddress: address });
  }
}