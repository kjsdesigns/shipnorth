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

      expect(result.id).toBe('system');
      expect(result.defaultOriginAddress).toEqual({
        address1: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'CA',
      });
      expect(result.notificationSettings).toEqual({
        emailEnabled: true,
        smsEnabled: false,
      });
      expect(result.stripeSettings).toEqual({
        publishableKey: '',
        webhookSecret: '',
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

      const updatedSettings = { ...currentSettings, ...updates, updatedAt: expect.any(String) };

      (DatabaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [currentSettings] }) // First call for get()
        .mockResolvedValueOnce({ rows: [updatedSettings] }); // Second call for the insert/update

      const result = await SettingsModel.update(updates);

      expect(result).toEqual({
        ...currentSettings,
        ...updates,
        updatedAt: expect.any(String),
      });

      expect(DatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM settings WHERE id = $1 LIMIT 1',
        ['system']
      );
    });

    it('should set updatedAt timestamp', async () => {
      const beforeUpdate = Date.now();

      (DatabaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSettings] })
        .mockResolvedValueOnce({ rows: [{ ...mockSettings, googleMapsApiKey: 'new-key', updatedAt: new Date().toISOString() }] });

      const result = await SettingsModel.update({ googleMapsApiKey: 'new-key' });

      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt!).getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });
  });

  describe('getDefaultOriginAddress', () => {
    it('should return the default origin address', async () => {
      (DatabaseService.query as jest.Mock).mockResolvedValue({ rows: [mockSettings] });

      const result = await SettingsModel.getDefaultOriginAddress();

      expect(result).toEqual(mockSettings.defaultOriginAddress);
    });

    it('should return default address structure when no settings exist', async () => {
      (DatabaseService.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await SettingsModel.getDefaultOriginAddress();

      expect(result.country).toBe('CA');
      expect(result.address1).toBe('');
    });
  });

  describe('updateDefaultOriginAddress', () => {
    it('should update only the origin address', async () => {
      const newAddress = {
        address1: '789 Updated Address',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1J9',
        country: 'CA',
      };

      (DatabaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSettings] })
        .mockResolvedValueOnce({ rows: [{ ...mockSettings, defaultOriginAddress: newAddress }] });

      await SettingsModel.updateDefaultOriginAddress(newAddress);

      expect(DatabaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM settings WHERE id = $1 LIMIT 1',
        ['system']
      );
    });
  });
});