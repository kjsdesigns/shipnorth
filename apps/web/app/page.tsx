'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Package, Truck, MapPin, Shield, Clock, DollarSign,
  Search, ArrowRight, CheckCircle, Users, Zap
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber) {
      router.push(`/track/${trackingNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shipnorth</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Features</a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">How It Works</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Pricing</a>
              <ThemeToggle />
              <Link href="/login" className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Autonomous Shipping & Billing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Streamline your shipping operations with AI-powered load optimization, 
              real-time tracking, and automated billing. Ship smarter, not harder.
            </p>
            
            {/* Tracking Form */}
            <form onSubmit={handleTracking} className="max-w-2xl mx-auto mb-8">
              <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
                <input
                  type="text"
                  placeholder="Enter tracking number..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 px-4 py-3 text-lg focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Track Package
                </button>
              </div>
            </form>

            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 flex items-center text-lg font-medium"
              >
                Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <Link
                href="/login"
                className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-8 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-blue-600 dark:border-blue-400 text-lg font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Shipnorth?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to manage shipping operations efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">AI-Powered Optimization</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Smart load planning maximizes efficiency and reduces costs with advanced algorithms
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Real-Time Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                GPS tracking updates every 5 minutes for complete visibility of your shipments
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Automated Billing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Seamless payment processing with Stripe integration and instant invoicing
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Enterprise Security</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Bank-level encryption and SOC 2 compliance keep your data safe
              </p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Multi-Carrier Support</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Integrate with all major carriers through ShipStation for best rates
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Role-Based Access</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Separate portals for staff, customers, and drivers with custom permissions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Simple, efficient shipping in four easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white dark:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Create Package</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Staff enters package details and customer information
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white dark:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Get Quote</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                System calculates best shipping rates instantly
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white dark:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Purchase Label</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatic payment processing and label generation
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white dark:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">4</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Track & Deliver</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time updates until successful delivery
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">99.9%</p>
              <p className="text-blue-100 dark:text-blue-200">Uptime SLA</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">5 min</p>
              <p className="text-blue-100 dark:text-blue-200">Tracking Updates</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">24/7</p>
              <p className="text-blue-100 dark:text-blue-200">Customer Support</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">30%</p>
              <p className="text-blue-100 dark:text-blue-200">Cost Savings</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Transform Your Shipping?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of businesses shipping smarter with Shipnorth
          </p>
          <Link
            href="/register"
            className="bg-blue-600 dark:bg-blue-500 text-white px-8 py-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-lg font-medium inline-flex items-center"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No credit card required • 30-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Package className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-xl font-bold">Shipnorth</span>
              </div>
              <p className="text-gray-400 text-sm">
                Autonomous shipping and billing for modern businesses
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
                <li><a href="#" className="hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2024 Shipnorth. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}