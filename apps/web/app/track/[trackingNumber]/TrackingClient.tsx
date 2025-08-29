'use client';

import { Package, MapPin, Clock, CheckCircle, Truck } from 'lucide-react';

interface TrackingClientProps {
  trackingNumber: string;
}

export default function TrackingClient({ trackingNumber }: TrackingClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Package className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Package Tracking</h1>
              <p className="text-gray-600 dark:text-gray-300">Tracking Number: {trackingNumber}</p>
            </div>
          </div>

          {/* Package Status */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Package Status</h3>
                <p className="text-blue-700 dark:text-blue-300">In Transit</p>
              </div>
            </div>
          </div>

          {/* Tracking History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tracking History
            </h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Package picked up
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your package has been picked up from the origin
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Today at 2:30 PM</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">In transit</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Package is on its way to destination
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Expected delivery: Tomorrow
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Delivery Information</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <p>
                <strong>Estimated Delivery:</strong> Tomorrow, 3:00 PM - 6:00 PM
              </p>
              <p>
                <strong>Delivery Address:</strong> 123 Main St, City, State 12345
              </p>
              <p>
                <strong>Carrier:</strong> ShipStation Express
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
