import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AbilityProvider } from '@/contexts/AbilityContext';
import PayPalScript from '@/components/PayPalScript';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shipnorth - Modern Logistics Platform',
  description: 'Autonomous shipping and billing system with real-time tracking',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shipnorth Driver',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Shipnorth Driver" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* SUPER AGGRESSIVE cache prevention for development */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="cache-control" content="no-cache" />
        <meta name="etag" content={`dev-${Date.now()}`} />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <PayPalScript enabled={false} />
        <AuthProvider>
          <AbilityProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AbilityProvider>
        </AuthProvider>
        {/* Development Cache Buster Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            // SUPER AGGRESSIVE development cache clearing AND infinite render detection
            if (window.location.hostname === 'localhost') {
              console.log('🔄 Development mode: Clearing all caches and monitoring for infinite renders');
              
              // Clear all storage
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch (e) {}
              
              // Clear service worker caches
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => {
                    caches.delete(name);
                    console.log('🗑️ Deleted cache:', name);
                  });
                });
              }
              
              // INFINITE RENDER DETECTION AND AUTO-RECOVERY
              let errorCount = 0;
              let lastErrorTime = 0;
              
              // Override console.error to detect infinite render patterns
              const originalError = console.error;
              console.error = function(...args) {
                const message = args.join(' ');
                originalError.apply(console, args);
                
                if (message.includes('Maximum update depth exceeded') || 
                    message.includes('Too many re-renders') ||
                    message.includes('SearchModal') ||
                    message.includes('dispatchSetState')) {
                  
                  errorCount++;
                  lastErrorTime = Date.now();
                  
                  console.log('🚨 INFINITE RENDER ERROR DETECTED:', message);
                  console.log('📊 Error count:', errorCount);
                  
                  // If we get multiple infinite render errors quickly, auto-recover
                  if (errorCount >= 3) {
                    console.log('🔄 AUTO-RECOVERY: Too many infinite render errors, forcing fresh reload...');
                    
                    // Clear everything and reload
                    try {
                      localStorage.clear();
                      sessionStorage.clear();
                    } catch (e) {}
                    
                    // Add cache busting parameter and reload
                    const separator = window.location.search ? '&' : '?';
                    window.location.href = window.location.pathname + window.location.search + separator + 'cache_bust=' + Date.now();
                  }
                }
              };
              
              // Reset error count if no errors for 30 seconds
              setInterval(() => {
                if (Date.now() - lastErrorTime > 30000) {
                  errorCount = 0;
                }
              }, 30000);
              
              // Force reload with cache bypass every 60 seconds in dev (reduced from 30)
              setTimeout(() => {
                if (window.location.hostname === 'localhost' && errorCount === 0) {
                  console.log('🔄 Scheduled cache refresh');
                  const separator = window.location.search ? '&' : '?';
                  window.location.href = window.location.pathname + window.location.search + separator + 'cache_bust=' + Date.now();
                }
              }, 60000);
              
              // Add global cache clearing function for manual use
              window.clearAllCache = function() {
                console.log('🧹 MANUAL CACHE CLEAR initiated...');
                
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                } catch (e) {}
                
                if ('caches' in window) {
                  caches.keys().then(names => {
                    return Promise.all(names.map(name => caches.delete(name)));
                  }).then(() => {
                    console.log('✅ All caches cleared manually');
                    const separator = window.location.search ? '&' : '?';
                    window.location.href = window.location.pathname + separator + 'manual_clear=' + Date.now();
                  });
                } else {
                  const separator = window.location.search ? '&' : '?';
                  window.location.href = window.location.pathname + separator + 'manual_clear=' + Date.now();
                }
              };
              
              console.log('💡 Run clearAllCache() in console to manually clear cache');
            }
            
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('✅ Service worker registered successfully');
                  })
                  .catch((registrationError) => {
                    // Don't spam console with service worker errors in development
                    if (window.location.hostname !== 'localhost') {
                      console.warn('Service worker registration failed:', registrationError.message);
                    }
                  });
              });
            }
          `,
          }}
        />
      </body>
    </html>
  );
}
