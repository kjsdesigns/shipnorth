'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Clock, Globe, Save, TestTube } from 'lucide-react';

interface CommunicationPrefs {
  email: {
    enabled: boolean;
    address: string;
    events: string[];
  };
  sms: {
    enabled: boolean;
    phoneNumber: string;
    events: string[];
  };
  preferences: {
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
    timezone: string;
    language: string;
  };
}

interface Props {
  customerId: string;
  initialPrefs?: CommunicationPrefs;
  onSave?: (prefs: CommunicationPrefs) => void;
}

const AVAILABLE_EVENTS = [
  { key: 'package_delivered', name: 'Package Delivered', icon: '📦', recommended: true },
  { key: 'load_started', name: 'Load Started', icon: '🚚', recommended: false },
  { key: 'package_shipped', name: 'Package Shipped', icon: '📮', recommended: true },
  { key: 'delivery_exception', name: 'Delivery Issues', icon: '⚠️', recommended: true },
  { key: 'package_created', name: 'Package Created', icon: '📋', recommended: false }
];

export default function CommunicationPreferences({ customerId, initialPrefs, onSave }: Props) {
  const [prefs, setPrefs] = useState<CommunicationPrefs>({
    email: {
      enabled: true,
      address: '',
      events: ['package_delivered', 'package_shipped', 'delivery_exception']
    },
    sms: {
      enabled: false,
      phoneNumber: '',
      events: ['package_delivered', 'delivery_exception']
    },
    preferences: {
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00'
      },
      timezone: 'America/Toronto',
      language: 'en'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialPrefs) {
      setPrefs(initialPrefs);
    } else {
      loadPreferences();
    }
  }, [customerId, initialPrefs]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/communication-preferences/${customerId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrefs(data.data);
      }
    } catch (error) {
      console.error('Failed to load communication preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/communication-preferences/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(prefs)
      });
      
      if (response.ok) {
        setMessage('Preferences saved successfully!');
        onSave?.(prefs);
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      setMessage('Failed to save preferences');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async (type: 'email' | 'sms') => {
    try {
      await fetch(`/api/communication-preferences/${customerId}/test-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, event: 'package_delivered' })
      });
      
      setMessage(`Test ${type} sent!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Test ${type} failed`);
    }
  };

  const updateEmailEvents = (eventKey: string, enabled: boolean) => {
    setPrefs(prev => ({
      ...prev,
      email: {
        ...prev.email,
        events: enabled 
          ? [...prev.email.events, eventKey]
          : prev.email.events.filter(e => e !== eventKey)
      }
    }));
  };

  const updateSMSEvents = (eventKey: string, enabled: boolean) => {
    setPrefs(prev => ({
      ...prev,
      sms: {
        ...prev.sms,
        events: enabled 
          ? [...prev.sms.events, eventKey]
          : prev.sms.events.filter(e => e !== eventKey)
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Communication Preferences</h2>
        </div>

        {/* Email Preferences */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-medium">Email Notifications</h3>
            <label className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                checked={prefs.email.enabled}
                onChange={(e) => setPrefs(prev => ({
                  ...prev,
                  email: { ...prev.email, enabled: e.target.checked }
                }))}
                className="rounded"
              />
              <span className="text-sm">Enable email notifications</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={prefs.email.address}
                onChange={(e) => setPrefs(prev => ({
                  ...prev,
                  email: { ...prev.email, address: e.target.value }
                }))}
                disabled={!prefs.email.enabled}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                placeholder="your@email.com"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => sendTestNotification('email')}
                disabled={!prefs.email.enabled || !prefs.email.address}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <TestTube className="h-4 w-4" />
                Send Test Email
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Email Notifications For:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_EVENTS.map(event => (
                <label key={event.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={prefs.email.events.includes(event.key)}
                    onChange={(e) => updateEmailEvents(event.key, e.target.checked)}
                    disabled={!prefs.email.enabled}
                    className="rounded"
                  />
                  <span className="text-lg">{event.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{event.name}</div>
                    {event.recommended && (
                      <div className="text-xs text-blue-600">Recommended</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SMS Preferences */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium">SMS Notifications</h3>
            <label className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                checked={prefs.sms.enabled}
                onChange={(e) => setPrefs(prev => ({
                  ...prev,
                  sms: { ...prev.sms, enabled: e.target.checked }
                }))}
                className="rounded"
              />
              <span className="text-sm">Enable SMS notifications</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={prefs.sms.phoneNumber}
                onChange={(e) => setPrefs(prev => ({
                  ...prev,
                  sms: { ...prev.sms, phoneNumber: e.target.value }
                }))}
                disabled={!prefs.sms.enabled}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => sendTestNotification('sms')}
                disabled={!prefs.sms.enabled || !prefs.sms.phoneNumber}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <TestTube className="h-4 w-4" />
                Send Test SMS
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">SMS Notifications For:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_EVENTS.filter(e => e.recommended).map(event => (
                <label key={event.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={prefs.sms.events.includes(event.key)}
                    onChange={(e) => updateSMSEvents(event.key, e.target.checked)}
                    disabled={!prefs.sms.enabled}
                    className="rounded"
                  />
                  <span className="text-lg">{event.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{event.name}</div>
                    <div className="text-xs text-gray-500">Critical notifications only</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* General Preferences */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-medium">General Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={prefs.preferences.quietHours.enabled}
                  onChange={(e) => setPrefs(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      quietHours: {
                        ...prev.preferences.quietHours,
                        enabled: e.target.checked
                      }
                    }
                  }))}
                  className="rounded"
                />
                <span className="font-medium">Quiet Hours</span>
              </label>
              
              {prefs.preferences.quietHours.enabled && (
                <div className="space-y-2">
                  <input
                    type="time"
                    value={prefs.preferences.quietHours.startTime}
                    onChange={(e) => setPrefs(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        quietHours: {
                          ...prev.preferences.quietHours,
                          startTime: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="time"
                    value={prefs.preferences.quietHours.endTime}
                    onChange={(e) => setPrefs(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        quietHours: {
                          ...prev.preferences.quietHours,
                          endTime: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={prefs.preferences.timezone}
                onChange={(e) => setPrefs(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, timezone: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="America/Toronto">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Vancouver">Pacific Time (Canada)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={prefs.preferences.language}
                onChange={(e) => setPrefs(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, language: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-6 border-t">
          {message && (
            <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
          
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}