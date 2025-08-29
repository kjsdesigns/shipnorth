'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import PaymentMethodCard from './PaymentMethodCard';
import { customerAPI } from '@/lib/api';

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

interface PaymentMethodManagerProps {
  customerId: string;
  isStaff?: boolean;
  className?: string;
}

export default function PaymentMethodManager({
  customerId,
  isStaff = false,
  className = '',
}: PaymentMethodManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replacingMethod, setReplacingMethod] = useState(false);
  const [approveUrl, setApproveUrl] = useState('');
  const [setupTokenId, setSetupTokenId] = useState('');

  useEffect(() => {
    loadPaymentMethods();
  }, [customerId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setError('');

      const response = isStaff
        ? await customerAPI.getPaymentMethods(customerId)
        : await customerAPI.getMyPaymentMethods();

      setPaymentMethods(response.data.paymentMethods || []);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
      setError(error.response?.data?.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleReplacePaymentMethod = async () => {
    try {
      setReplacingMethod(true);
      setError('');

      const response = isStaff
        ? await customerAPI.replacePaymentMethod(customerId)
        : await customerAPI.replaceMyPaymentMethod();

      setApproveUrl(response.data.approveUrl);
      setSetupTokenId(response.data.setupTokenId);
    } catch (error: any) {
      console.error('Failed to initiate payment method replacement:', error);
      setError(error.response?.data?.message || 'Failed to initiate payment method replacement');
      setReplacingMethod(false);
    }
  };

  const handlePayPalReturn = () => {
    if (approveUrl && setupTokenId) {
      // Add customer ID and setup token to PayPal URL for return handling
      const redirectUrl = `${approveUrl}&customer_id=${customerId}&token=${setupTokenId}&return_path=payment-methods`;
      window.open(redirectUrl, '_blank', 'width=600,height=700');
    }
  };

  const completeReplacement = async (completedSetupTokenId: string) => {
    try {
      const response = isStaff
        ? await customerAPI.completePaymentReplacement(customerId, completedSetupTokenId)
        : await customerAPI.completeMyPaymentReplacement(completedSetupTokenId);

      // Reload payment methods
      await loadPaymentMethods();
      setReplacingMethod(false);
      setApproveUrl('');
      setSetupTokenId('');
    } catch (error: any) {
      console.error('Failed to complete payment method replacement:', error);
      setError(error.response?.data?.message || 'Failed to complete payment method replacement');
    }
  };

  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Methods
        </h3>

        {paymentMethods.length > 0 && !replacingMethod && (
          <button
            onClick={handleReplacePaymentMethod}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Replace Card
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Payment method replacement in progress */}
      {replacingMethod && approveUrl && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <ExternalLink className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Payment Method Replacement Ready
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Click below to open PayPal in a new window and complete the payment method setup.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handlePayPalReturn}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open PayPal
                </button>
                <button
                  onClick={() => {
                    setReplacingMethod(false);
                    setApproveUrl('');
                    setSetupTokenId('');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment methods list */}
      {paymentMethods.length > 0 ? (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              paymentMethod={method}
              onReplace={!replacingMethod ? handleReplacePaymentMethod : undefined}
              isStaff={isStaff}
              isLoading={replacingMethod}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Payment Methods
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isStaff
              ? 'This customer has not added any payment methods yet.'
              : 'You have not added any payment methods yet.'}
          </p>
          {!replacingMethod && (
            <button
              onClick={handleReplacePaymentMethod}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </button>
          )}
        </div>
      )}
    </div>
  );
}
