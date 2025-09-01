import { SettingsModel, SystemSettings } from '../models/settings';
import { DatabaseService } from '../services/database';

// Mock the DatabaseService
jest.mock('../services/database', () => ({
  DatabaseService: {
    query: jest.fn(),
  },
}));

describe('SettingsModel', () => {
  const mockSettings: SystemSettings = {
    id: 'system',
    defaultOriginAddress: {
      address1: '123 Warehouse Ave',
      address2: 'Suite 100',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 1A1',
      country: 'CA',
    },
    notificationSettings: {
      emailEnabled: true,
      smsEnabled: true,
      webhookUrl: 'https://api.example.com/webhooks',
    },
    googleMapsApiKey: 'mock-google-maps-key',
    stripeSettings: {
      publishableKey: 'pk_test_mock',
      webhookSecret: 'whsec_mock',
    },
    updatedAt: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return existing settings', async () => {
      (DatabaseService.query as jest.Mock).mockResolvedValue({ rows: [mockSettings] });

      const result = await SettingsModel.get();

      expect(result).toEqual(mockSettings);
      expect(DatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM settings WHERE id = $1 LIMIT 1',
        ['system']
      );
    });

    it('should return default settings when none exist', async () => {
      (DatabaseService.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await SettingsModel.get();

      expect(result).toEqual({
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
      });
    });

    it('should return default settings when no rows exist', async () => {
      (DatabaseService.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await SettingsModel.get();

      expect(result.id).toBe('system');
      expect(result.defaultOriginAddress.country).toBe('CA');
    });
  });

  describe('update', () => {
    it('should update settings with new values', async () => {
      const currentSettings = {
        id: 'system' as const,
        defaultOriginAddress: {
          address1: 'Old Address',
          city: 'Old City',
          province: 'ON',
          postalCode: 'M1M 1M1',
          country: 'CA',
        },
        notificationSettings: {
          emailEnabled: true,
          smsEnabled: false,
        },
        stripeSettings: {
          publishableKey: 'old_key',
          webhookSecret: 'old_secret',
        },
      };

      const updates = {
        defaultOriginAddress: {
          address1: '456 New Warehouse Blvd',
          city: 'Vancouver',
          province: 'BC',
          postalCode: 'V6B 1A1',
          country: 'CA',
        },
        notificationSettings: {
          emailEnabled: true,
          smsEnabled: true,
          webhookUrl: 'https://new-webhook.com',
        },
      };

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Item: currentSettings });
      (DatabaseService.put as jest.Mock).mockResolvedValue({ Item: { ...currentSettings, ...updates } });

      const result = await SettingsModel.update(updates);

      expect(result).toEqual({
        ...currentSettings,
        ...updates,
        updatedAt: expect.any(String),
      });

      expect(DatabaseService.put).toHaveBeenCalledWith('settings', {
        ...currentSettings,
        ...updates,
        updatedAt: expect.any(String),
      });
    });

    it('should merge nested objects correctly', async () => {
      const currentSettings = {
        id: 'system' as const,
        defaultOriginAddress: {
          address1: 'Current Address',
          city: 'Current City',
          province: 'ON',
          postalCode: 'M1M 1M1',
          country: 'CA',
        },
        notificationSettings: {
          emailEnabled: true,
          smsEnabled: false,
        },
        stripeSettings: {
          publishableKey: 'current_key',
          webhookSecret: 'current_secret',
        },
      };

      const updates = {
        notificationSettings: {
          emailEnabled: false,
          smsEnabled: true,
          webhookUrl: 'https://webhook.example.com',
        },
      };

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Item: currentSettings });
      (DatabaseService.put as jest.Mock).mockResolvedValue({ Item: { ...currentSettings, ...updates } });

      const result = await SettingsModel.update(updates);

      expect(result.notificationSettings).toEqual({
        emailEnabled: false,
        smsEnabled: true,
        webhookUrl: 'https://webhook.example.com',
      });
      // Other settings should remain unchanged
      expect(result.defaultOriginAddress).toEqual(currentSettings.defaultOriginAddress);
      expect(result.stripeSettings).toEqual(currentSettings.stripeSettings);
    });

    it('should set updatedAt timestamp', async () => {
      const beforeUpdate = Date.now();

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Item: mockSettings });
      (DatabaseService.put as jest.Mock).mockResolvedValue({ Item: { ...mockSettings, googleMapsApiKey: 'new-key' } });

      const result = await SettingsModel.update({ googleMapsApiKey: 'new-key' });

      const afterUpdate = Date.now();

      expect(new Date(result.updatedAt!).getTime()).toBeGreaterThanOrEqual(beforeUpdate);
      expect(new Date(result.updatedAt!).getTime()).toBeLessThanOrEqual(afterUpdate);
    });
  });

  describe('getDefaultOriginAddress', () => {
    it('should return the default origin address', async () => {
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Item: mockSettings });

      const result = await SettingsModel.getDefaultOriginAddress();

      expect(result).toEqual(mockSettings.defaultOriginAddress);
    });

    it('should return default address structure when no settings exist', async () => {
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Item: null });

      const result = await SettingsModel.getDefaultOriginAddress();

      expect(result).toEqual({
        address1: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'CA',
      });
    });
  });

  describe('updateDefaultOriginAddress', () => {
    it('should update only the origin address', async () => {
      const newAddress = {
        address1: '789 Distribution Center',
        address2: 'Loading Dock B',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1J9',
        country: 'CA',
      };

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Item: mockSettings });
      (DatabaseService.put as jest.Mock).mockResolvedValue({ Item: { ...mockSettings, defaultOriginAddress: newAddress } });

      await SettingsModel.updateDefaultOriginAddress(newAddress);

      expect(DatabaseService.put).toHaveBeenCalledWith('settings', expect.objectContaining({
        defaultOriginAddress: newAddress,
        // Other settings should remain unchanged
        notificationSettings: mockSettings.notificationSettings,
        stripeSettings: mockSettings.stripeSettings,
      }));
    });
  });

  describe('edge cases', () => {
    it('should handle partial address updates', async () => {
      const partialAddress = {
        address1: '999 Partial St',
        city: 'Partial City',
        province: 'BC',
        postalCode: 'V1V 1V1',
        country: 'CA',
      };

      (DatabaseService.get as jest.Mock).mockResolvedValue({ Item: mockSettings });
      (DatabaseService.put as jest.Mock).mockResolvedValue({ Item: { ...mockSettings, defaultOriginAddress: partialAddress } });

      await SettingsModel.updateDefaultOriginAddress(partialAddress);

      const putCall = (DatabaseService.put as jest.Mock).mock.calls[0][1];
      expect(putCall.defaultOriginAddress).toEqual(partialAddress);
    });

    it('should handle database errors gracefully', async () => {
      (DatabaseService.get as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(SettingsModel.get()).rejects.toThrow('Database error');
    });

    it('should handle empty update object', async () => {
      (DatabaseService.get as jest.Mock).mockResolvedValue({ Item: mockSettings });
      (DatabaseService.put as jest.Mock).mockResolvedValue({ Item: mockSettings });

      const result = await SettingsModel.update({});

      expect(result).toEqual({
        ...mockSettings,
        updatedAt: expect.any(String),
      });
    });
  });
});