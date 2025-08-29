'use client';

import { useState } from 'react';
import { X, Truck, Clock, DollarSign, CheckCircle, Loader, AlertCircle } from 'lucide-react';

interface RateQuote {
  id: string;
  carrier: string;
  carrierAccount: string;
  service: string;
  rate: number;
  currency: string;
  deliveryDays?: number;
  deliveryDate?: string;
  carrierAcronym: string;
}

interface RateLookupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageData: {
    weight: number;
    dimensions: { length: number; width: number; height: number };
    shipTo: {
      name: string;
      address1: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
  };
  onRateSaved: (selectedRate: RateQuote) => void;
}

export default function RateLookupDialog({
  isOpen,
  onClose,
  packageId,
  packageData,
  onRateSaved,
}: RateLookupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<RateQuote[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const lookupRates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/packages/${packageId}/rates`, {
        headers: {
          Authorization: `Bearer ${document.cookie.split('accessToken=')[1]?.split(';')[0]}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get rate quotes');
      }

      const data = await response.json();
      setRates(data.rates || []);

      // Pre-select Canada Post or cheapest option
      const recommendedRate = data.recommendedRate || data.rates[0];
      if (recommendedRate) {
        setSelectedRateId(recommendedRate.id);
      }

      console.log(`📊 Loaded ${data.rates.length} rate options`);
    } catch (err: any) {
      console.error('Rate lookup failed:', err);
      setError(err.message || 'Failed to get shipping rates');
    } finally {
      setLoading(false);
    }
  };

  const saveSelectedRate = async () => {
    const selectedRate = rates.find((r) => r.id === selectedRateId);
    if (!selectedRate) {
      setError('Please select a shipping rate');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/packages/${packageId}/rates/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${document.cookie.split('accessToken=')[1]?.split(';')[0]}`,
        },
        body: JSON.stringify({
          rateId: selectedRate.id,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate: selectedRate.rate,
          currency: selectedRate.currency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save rate');
      }

      console.log(
        `✅ Rate saved: ${selectedRate.carrier} ${selectedRate.service} - $${selectedRate.rate}`
      );
      onRateSaved(selectedRate);
      onClose();
    } catch (err: any) {
      console.error('Save rate failed:', err);
      setError(err.message || 'Failed to save shipping rate');
    } finally {
      setSaving(false);
    }
  };

  const getDeliveryText = (rate: RateQuote) => {
    if (rate.deliveryDays) {
      return `${rate.deliveryDays} business day${rate.deliveryDays > 1 ? 's' : ''}`;
    }
    if (rate.deliveryDate) {
      return new Date(rate.deliveryDate).toLocaleDateString();
    }
    return 'Delivery time varies';
  };

  const getServiceBadgeColor = (carrier: string, service: string) => {
    if (carrier === 'CanadaPost') {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
    if (service.toLowerCase().includes('express') || service.toLowerCase().includes('priority')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">​</span>
        <div
          className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Shipping Rate Lookup
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Package Info */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Package Details</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>📦 Weight: {packageData.weight} kg</div>
                <div>
                  📏 Dimensions: {packageData.dimensions.length} × {packageData.dimensions.width} ×{' '}
                  {packageData.dimensions.height} cm
                </div>
                <div>
                  📍 Destination: {packageData.shipTo.city}, {packageData.shipTo.province}{' '}
                  {packageData.shipTo.postalCode}
                </div>
              </div>
            </div>

            {/* Lookup Button */}
            {rates.length === 0 && !loading && (
              <div className="mb-6">
                <button
                  onClick={lookupRates}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Get Shipping Rates
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mb-6 flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">
                  Getting rates from carriers...
                </span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mb-6 flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Rate Options */}
            {rates.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Available Shipping Options
                </h4>
                <div className="space-y-3">
                  {rates.map((rate) => (
                    <div
                      key={rate.id}
                      onClick={() => setSelectedRateId(rate.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRateId === rate.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getServiceBadgeColor(rate.carrier, rate.service)}`}
                            >
                              {rate.carrierAcronym}
                            </span>
                            {rate.carrier === 'CanadaPost' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {rate.carrier} - {rate.service}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {getDeliveryText(rate)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-lg font-bold text-gray-900 dark:text-white">
                            <DollarSign className="h-4 w-4" />
                            {rate.rate.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {rate.currency}
                          </div>
                        </div>
                      </div>

                      {selectedRateId === rate.id && (
                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selected shipping option
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rate Summary */}
                {selectedRateId && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm text-green-700 dark:text-green-400">
                      <strong>Selected Rate:</strong>{' '}
                      {rates.find((r) => r.id === selectedRateId)?.carrier} - $
                      {rates.find((r) => r.id === selectedRateId)?.rate.toFixed(2)} CAD
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>

              {rates.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={lookupRates}
                    disabled={loading || saving}
                    className="px-4 py-2 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Refresh Rates
                  </button>
                  <button
                    type="button"
                    onClick={saveSelectedRate}
                    disabled={!selectedRateId || saving}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Selected Rate
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
