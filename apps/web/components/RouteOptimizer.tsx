'use client';

import { useState, useEffect } from 'react';
import { loadAPI, settingsAPI } from '@/lib/api';
import { MapPin, Route, Truck, Clock, Save, X, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';

interface RouteOptimizerProps {
  loadId: string;
  onClose: () => void;
  onSave: () => void;
}

interface DeliveryCity {
  city: string;
  province: string;
  country: string;
  expectedDeliveryDate?: string;
  distance?: number;
  drivingDuration?: number;
}

export default function RouteOptimizer({ loadId, onClose, onSave }: RouteOptimizerProps) {
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [load, setLoad] = useState<any>(null);
  const [cities, setCities] = useState<DeliveryCity[]>([]);
  const [originAddress, setOriginAddress] = useState('');
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadId]);

  const loadData = async () => {
    try {
      const [loadRes, settingsRes] = await Promise.all([
        loadAPI.get(loadId),
        settingsAPI.getOriginAddress(),
      ]);

      const loadData = loadRes.data.load;
      setLoad(loadData);
      setCities(loadData.deliveryCities || []);
      
      const settings = settingsRes.data.address;
      setOriginAddress(
        `${settings.address1}, ${settings.city}, ${settings.province}, ${settings.country}`
      );
    } catch (error) {
      console.error('Error loading route data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCity = () => {
    setCities([
      ...cities,
      {
        city: '',
        province: '',
        country: 'CA',
      },
    ]);
    setUnsavedChanges(true);
  };

  const updateCity = (index: number, field: keyof DeliveryCity, value: string) => {
    const updatedCities = [...cities];
    updatedCities[index] = {
      ...updatedCities[index],
      [field]: value,
    };
    setCities(updatedCities);
    setUnsavedChanges(true);
  };

  const removeCity = (index: number) => {
    setCities(cities.filter((_, i) => i !== index));
    setUnsavedChanges(true);
  };

  const moveCityUp = (index: number) => {
    if (index === 0) return;
    const newCities = [...cities];
    [newCities[index - 1], newCities[index]] = [newCities[index], newCities[index - 1]];
    setCities(newCities);
    setUnsavedChanges(true);
  };

  const moveCityDown = (index: number) => {
    if (index === cities.length - 1) return;
    const newCities = [...cities];
    [newCities[index], newCities[index + 1]] = [newCities[index + 1], newCities[index]];
    setCities(newCities);
    setUnsavedChanges(true);
  };

  const optimizeRoute = async () => {
    setOptimizing(true);
    try {
      // Mock route optimization call
      const response = await loadAPI.optimizeRoute(loadId, {
        origin: originAddress,
        destinations: cities.filter(city => city.city && city.province),
      });
      
      setOptimizationResult(response.data);
      
      // Apply optimized order
      if (response.data.waypoints) {
        const optimizedCities = response.data.waypoints.map((wp: any) => ({
          city: wp.city,
          province: wp.province,
          country: wp.country,
          distance: wp.distance,
          drivingDuration: wp.duration,
          expectedDeliveryDate: cities.find(c => c.city === wp.city)?.expectedDeliveryDate,
        }));
        setCities(optimizedCities);
        setUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Route optimization error:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const saveRoute = async () => {
    try {
      await loadAPI.updateDeliveryCities(loadId, cities);
      setUnsavedChanges(false);
      onSave();
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  const updateOriginAddress = async () => {
    try {
      const [address1, ...rest] = originAddress.split(', ');
      const city = rest[rest.length - 3] || '';
      const province = rest[rest.length - 2] || '';
      const country = rest[rest.length - 1] || 'CA';
      
      await settingsAPI.updateOriginAddress({
        address1,
        city,
        province,
        postalCode: '', // Would need parsing
        country,
      });
    } catch (error) {
      console.error('Error updating origin address:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Route className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Route Optimizer - Load #{load?.id?.slice(-6)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Plan and optimize delivery routes with Google Maps
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Origin Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Origin Address (System Default)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={originAddress}
                onChange={(e) => setOriginAddress(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={updateOriginAddress}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
              >
                Update Default
              </button>
            </div>
          </div>

          {/* Delivery Cities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Delivery Cities
              </label>
              <button
                onClick={addCity}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add City
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cities.map((city, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={city.city}
                        onChange={(e) => updateCity(index, 'city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <select
                        value={city.province}
                        onChange={(e) => updateCity(index, 'province', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Province</option>
                        <option value="AB">AB</option>
                        <option value="BC">BC</option>
                        <option value="MB">MB</option>
                        <option value="NB">NB</option>
                        <option value="NL">NL</option>
                        <option value="NS">NS</option>
                        <option value="ON">ON</option>
                        <option value="PE">PE</option>
                        <option value="QC">QC</option>
                        <option value="SK">SK</option>
                        <option value="NT">NT</option>
                        <option value="NU">NU</option>
                        <option value="YT">YT</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="date"
                        value={city.expectedDeliveryDate?.split('T')[0] || ''}
                        onChange={(e) => updateCity(index, 'expectedDeliveryDate', e.target.value ? `${e.target.value}T17:00:00Z` : '')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {city.distance && `${city.distance}km`}
                      {city.drivingDuration && (
                        <div>{Math.floor(city.drivingDuration / 60)}h {city.drivingDuration % 60}m</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveCityUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveCityDown(index)}
                        disabled={index === cities.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeCity(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Results */}
          {optimizationResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Route Optimization Results
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-700 dark:text-green-300">Total Distance:</span>
                  <div className="font-medium text-green-800 dark:text-green-200">
                    {optimizationResult.totalDistance} km
                  </div>
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300">Total Duration:</span>
                  <div className="font-medium text-green-800 dark:text-green-200">
                    {Math.floor(optimizationResult.totalDuration / 60)}h {optimizationResult.totalDuration % 60}m
                  </div>
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300">Stops:</span>
                  <div className="font-medium text-green-800 dark:text-green-200">
                    {optimizationResult.waypoints?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mock Google Maps Integration */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Route Visualization</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Google Maps integration would show the optimized route here
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded p-3">
                <div className="flex items-center text-blue-600 mb-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Origin
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">
                  {originAddress}
                </div>
              </div>
              {cities.slice(0, 3).map((city, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded p-3">
                  <div className="flex items-center text-green-600 mb-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Stop {index + 1}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs">
                    {city.city}, {city.province}
                    {city.distance && <div>{city.distance}km away</div>}
                  </div>
                </div>
              ))}
              {cities.length > 3 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    + {cities.length - 3} more stops
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <button
                onClick={optimizeRoute}
                disabled={optimizing || cities.length === 0}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Route className="h-4 w-4 mr-2" />
                {optimizing ? 'Optimizing...' : 'Optimize Route'}
              </button>
              
              {optimizationResult && (
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Saves {optimizationResult.timeSaved || '30'} minutes
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRoute}
                disabled={!unsavedChanges}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Route
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}