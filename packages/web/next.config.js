/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for App Router
  experimental: {
    typedRoutes: true,
  },
  
  // Image optimization for animal photos
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers for donor trust
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Environment variables for client
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  
  // Transpile packages from workspace
  transpilePackages: ['@legendary-test/ui'],
  
  // Output configuration
  output: 'standalone',
  
  // Webpack configuration for MDX and other optimizations
  webpack: (config, { dev, isServer }) => {
    // Add any custom webpack configurations here
    return config;
  },
};

module.exports = nextConfig;