'use client';

import { useState } from 'react';
import { CreditCard, Trash2, RotateCcw, Check, AlertCircle, ExternalLink } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'CARD' | 'PAYPAL' | 'UNKNOWN';
  last4: string | null;
  brand: string | null;
  expiryMonth: string | null;
  expiryYear: string | null;
  status: string;
  createdAt: string;
  isDefault?: boolean;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onReplace?: () => void;
  onDelete?: () => void;
  isStaff?: boolean;
  isLoading?: boolean;
}

export default function PaymentMethodCard({
  paymentMethod,
  onReplace,
  onDelete,
  isStaff = false,
  isLoading = false,
}: PaymentMethodCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const getCardIcon = () => {
    if (paymentMethod.type === 'PAYPAL') {
      return '💙'; // PayPal logo representation
    }

    switch (paymentMethod.brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
      case 'american_express':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const getBrandName = () => {
    if (paymentMethod.type === 'PAYPAL') {
      return 'PayPal';
    }

    if (!paymentMethod.brand) return 'Card';

    switch (paymentMethod.brand.toLowerCase()) {
      case 'amex':
      case 'american_express':
        return 'American Express';
      case 'mastercard':
        return 'Mastercard';
      case 'visa':
        return 'Visa';
      case 'discover':
        return 'Discover';
      default:
        return paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1);
    }
  };

  const formatExpiry = () => {
    if (!paymentMethod.expiryMonth || !paymentMethod.expiryYear) {
      return null;
    }
    return `${paymentMethod.expiryMonth}/${paymentMethod.expiryYear.slice(-2)}`;
  };

  const isExpired = () => {
    if (!paymentMethod.expiryMonth || !paymentMethod.expiryYear) {
      return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const expiryYear = parseInt(paymentMethod.expiryYear);
    const expiryMonth = parseInt(paymentMethod.expiryMonth);

    return expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth);
  };

  const getStatusColor = () => {
    if (isExpired()) return 'text-red-600 bg-red-50 border-red-200';
    if (paymentMethod.status === 'ACTIVE') return 'text-green-600 bg-green-50 border-green-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getStatusText = () => {
    if (isExpired()) return 'Expired';
    if (paymentMethod.status === 'ACTIVE') return 'Active';
    return paymentMethod.status;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{getCardIcon()}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white">{getBrandName()}</h3>
              {paymentMethod.isDefault && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  <Check className="w-3 h-3 mr-1" />
                  Default
                </span>
              )}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              {paymentMethod.last4 && <div>•••• {paymentMethod.last4}</div>}
              {formatExpiry() && <div>Expires {formatExpiry()}</div>}
              <div className="text-xs">
                Added {new Date(paymentMethod.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
          >
            {isExpired() && <AlertCircle className="w-3 h-3 mr-1" />}
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {(onReplace || onDelete) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-2">
            {onReplace && (
              <button
                onClick={onReplace}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Replace
              </button>
            )}

            {onDelete && !paymentMethod.isDefault && (
              <>
                {!showConfirmDelete ? (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onDelete();
                        setShowConfirmDelete(false);
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Confirm Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Warning for expired cards */}
      {isExpired() && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Payment method expired</p>
              <p className="text-xs mt-1">
                {isStaff
                  ? 'Customer will need to update their payment method before shipping packages.'
                  : 'Please update your payment method to continue using our services.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
