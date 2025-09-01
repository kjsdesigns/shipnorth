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
    const result = await DatabaseService.query(
      'SELECT * FROM settings WHERE id = $1 LIMIT 1',
      ['system']
    );

    if (result.rows.length === 0) {
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

    return result.rows[0];
  }

  static async update(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.get();
    const updated = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    const keys = Object.keys(updated).filter(key => key !== 'id');
    const values = keys.map(key => updated[key as keyof SystemSettings]);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await DatabaseService.query(
      `INSERT INTO settings (id, ${keys.join(', ')})
       VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${setClause}
       RETURNING *`,
      ['system', ...values]
    );

    return result.rows[0];
  }

  static async getDefaultOriginAddress(): Promise<SystemSettings['defaultOriginAddress']> {
    const settings = await this.get();
    return settings.defaultOriginAddress;
  }

  static async updateDefaultOriginAddress(
    address: SystemSettings['defaultOriginAddress']
  ): Promise<void> {
    await this.update({ defaultOriginAddress: address });
  }

  static async getOriginCoordinates(): Promise<{ lat: number; lng: number } | null> {
    try {
      const settings = await this.get();
      // Try to get coordinates from a separate setting
      const coordsResult = await DatabaseService.query(
        'SELECT * FROM settings WHERE id = $1 LIMIT 1',
        ['origin_coordinates']
      );
      if (coordsResult.rows.length > 0) {
        return coordsResult.rows[0];
      }
      
      // Default coordinates for Owen Sound if not set
      return {
        lat: 44.5675,
        lng: -80.9436
      };
    } catch (error) {
      console.warn('Failed to get origin coordinates:', error);
      return null;
    }
  }
}
