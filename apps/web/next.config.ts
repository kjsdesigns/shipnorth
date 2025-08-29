import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove output export for development to allow better cache control
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typedRoutes: false,
  // SUPER AGGRESSIVE cache prevention for development with CSS protection
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
          {
            key: 'ETag',
            value: `"${Date.now()}"`, // Force new ETag on every request
          },
          {
            key: 'X-CSS-Protection',
            value: 'tailwind-active',
          },
        ],
      },
      // Special handling for CSS files to ensure they're never cached
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-CSS-Fresh',
            value: `"${Date.now()}"`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
