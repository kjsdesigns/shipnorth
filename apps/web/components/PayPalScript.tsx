'use client';

import { useEffect } from 'react';

interface PayPalScriptProps {
  enabled?: boolean; // Only load when explicitly enabled
}

export default function PayPalScript({ enabled = false }: PayPalScriptProps) {
  useEffect(() => {
    // Only proceed if explicitly enabled
    if (!enabled) {
      return;
    }

    // Only load if not already loaded
    if (window.paypal || document.querySelector('script[src*="paypal.com/sdk"]')) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId || clientId === 'mock_paypal_client_id') {
      // In development with mock credentials, don't load PayPal SDK
      console.log('💳 PayPal SDK not loaded: Using mock PayPal credentials for development');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=card-fields&enable-funding=venmo,paylater&currency=CAD&intent=capture&vault=true`;
    script.setAttribute('data-sdk-integration-source', 'integrationbuilder_sc');
    script.async = true;

    script.onload = () => {
      console.log('✅ PayPal SDK loaded successfully');
    };

    script.onerror = () => {
      console.error('❌ Failed to load PayPal SDK');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [enabled]);

  return null;
}
