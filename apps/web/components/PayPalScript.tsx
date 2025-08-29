'use client';

import { useEffect } from 'react';

export default function PayPalScript() {
  useEffect(() => {
    // Only load if not already loaded
    if (window.paypal || document.querySelector('script[src*="paypal.com/sdk"]')) {
      return;
    }

    const script = document.createElement('script');
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
      console.error('PayPal Client ID not found in environment variables');
      return;
    }

    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&components=card-fields&enable-funding=venmo,paylater&currency=CAD&intent=capture&vault=true`;
    script.setAttribute('data-sdk-integration-source', 'integrationbuilder_sc');
    script.async = true;

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}
