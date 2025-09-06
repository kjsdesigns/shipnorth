'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useServerSession from '@/hooks/useServerSession';
import ModernLayout from '@/components/ModernLayout';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Package,
  Clock,
  BarChart3,
  Download,
  Eye,
  CheckCircle,
} from 'lucide-react';

interface EarningsData {
  period: string;
  totalEarnings: number;
  deliveries: number;
  averagePerDelivery: number;
  bonuses: number;
  mileage: number;
  totalDistance: number;
}

interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  deliveries: number;
  status: 'paid' | 'pending' | 'processing';
  paymentMethod: string;
}

export default function DriverEarnings() {
  const router = useRouter();
  const { user, loading: authLoading, hasRole } = useServerSession();
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  // Server-side authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('❌ DRIVER EARNINGS: No authenticated user, redirecting');
        router.push('/login/');
        return;
      }
      
      if (!hasRole('driver')) {
        console.log('❌ DRIVER EARNINGS: User lacks driver role');
        router.push('/login/');
        return;
      }
      
      console.log('✅ DRIVER EARNINGS: User authenticated via server session');
      setLoading(false);
    }
  }, [user, authLoading, hasRole, router]);

  // Load data when user is authenticated
  useEffect(() => {
    if (user && hasRole('driver') && !loading) {
      loadEarningsData();
    }
  }, [user, hasRole, loading]);

  const loadEarningsData = async () => {
    try {
      // Mock earnings data - replace with actual API call
      const mockEarningsData: EarningsData[] = [
        {
          period: 'today',
          totalEarnings: 127.5,
          deliveries: 3,
          averagePerDelivery: 42.5,
          bonuses: 15.0,
          mileage: 112.5,
          totalDistance: 127.5,
        },
        {
          period: 'week',
          totalEarnings: 892.75,
          deliveries: 23,
          averagePerDelivery: 38.82,
          bonuses: 85.0,
          mileage: 807.75,
          totalDistance: 892.8,
        },
        {
          period: 'month',
          totalEarnings: 3247.8,
          deliveries: 89,
          averagePerDelivery: 36.49,
          bonuses: 340.0,
          mileage: 2907.8,
          totalDistance: 3218.6,
        },
        {
          period: 'year',
          totalEarnings: 42567.45,
          deliveries: 1156,
          averagePerDelivery: 36.82,
          bonuses: 4250.0,
          mileage: 38317.45,
          totalDistance: 42386.2,
        },
      ];

      const mockPayoutHistory: PayoutRecord[] = [
        {
          id: 'PAY-001',
          date: new Date().toISOString(),
          amount: 892.75,
          deliveries: 23,
          status: 'pending',
          paymentMethod: 'Direct Deposit',
        },
        {
          id: 'PAY-002',
          date: new Date(Date.now() - 604800000).toISOString(),
          amount: 756.25,
          deliveries: 19,
          status: 'paid',
          paymentMethod: 'Direct Deposit',
        },
        {
          id: 'PAY-003',
          date: new Date(Date.now() - 1209600000).toISOString(),
          amount: 1134.5,
          deliveries: 31,
          status: 'paid',
          paymentMethod: 'Direct Deposit',
        },
      ];

      setEarningsData(mockEarningsData);
      setPayoutHistory(mockPayoutHistory);
    } catch (error) {
      console.error('Failed to load earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPeriodData = () => {
    return earningsData.find((data) => data.period === selectedPeriod) || earningsData[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentData = getCurrentPeriodData();

  return (
    <ModernLayout role="driver">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Earnings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your delivery earnings and payment history
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Report
          </button>
        </div>

        {/* Period Selector */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'today', name: 'Today' },
              { id: 'week', name: 'This Week' },
              { id: 'month', name: 'This Month' },
              { id: 'year', name: 'This Year' },
            ].map(({ id, name }) => (
              <button
                key={id}
                onClick={() => setSelectedPeriod(id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedPeriod === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                {name}
              </button>
            ))}
          </nav>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${currentData.totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deliveries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData.deliveries}
                </p>
                <p className="text-xs text-gray-500">
                  ${currentData.averagePerDelivery.toFixed(2)} avg
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bonuses</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${currentData.bonuses.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mileage Pay</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  ${currentData.mileage.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{currentData.totalDistance.toFixed(1)} km</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment History</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {payoutHistory.map((payout) => (
                <div
                  key={payout.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-full mr-4 ${
                          payout.status === 'paid'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}
                      >
                        {payout.status === 'paid' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${payout.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {payout.deliveries} deliveries •{' '}
                          {new Date(payout.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payout.status)}`}
                      >
                        {payout.status.toUpperCase()}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Earnings Breakdown ({selectedPeriod})
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Base Delivery Pay</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                $
                {(currentData.totalEarnings - currentData.bonuses - currentData.mileage).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Mileage Reimbursement</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${currentData.mileage.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Performance Bonuses</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                +${currentData.bonuses.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 bg-gray-50 dark:bg-gray-700 rounded px-4">
              <span className="font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="font-bold text-xl text-green-600 dark:text-green-400">
                ${currentData.totalEarnings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On-Time Delivery</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">94%</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-2">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">97%</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-2">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customer Rating</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">4.8</p>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
