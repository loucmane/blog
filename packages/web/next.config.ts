import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next.js 15 specific configurations
  experimental: {
    // Enable typed routes for better type safety
    typedRoutes: true,

    // Enable PPR (Partial Prerendering) for better performance
    // ppr: 'incremental', // Still experimental, uncomment when stable

    // Optimize package imports for better tree shaking
    optimizePackageImports: [
      '@minniewinnie/ui',
      '@minniewinnie/shared',
      'lucide-react',
      'date-fns',
      'lodash-es',
    ],

    // Enable new Next.js 15 features
    // useCache: true, // Enable 'use cache' directive (when needed)
    // authInterrupts: true, // Enable forbidden/unauthorized APIs (when needed)
    // taint: true, // Enable React taint APIs for security (when needed)
    // useLightningcss: true, // Use Lightning CSS for faster builds (optional)

    // Server Actions configuration (moved back to experimental in Next.js 15.3.3)
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      // Add your production domain here when available
      // bodySizeLimit: '2mb', // Default is 1mb, adjust if needed
    },
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization for animal photos and emergency appeals
  images: {
    // Modern formats for better performance
    formats: ['image/avif', 'image/webp'],

    // Responsive image sizes optimized for animal photos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Loader configuration for different use cases
    loader: 'default',

    // Allowed domains for external images (CDNs, etc.)
    domains: [
      'images.unsplash.com',
      'res.cloudinary.com',
      // Add your CDN domain here when available
    ],

    // Remote patterns for more flexible image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/animal-foundation/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/animal-foundation-bucket/**',
      },
    ],

    // Minimize layout shift for trauma-informed UX
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Enhanced security headers for donor trust and data protection
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
      },
      // Content Security Policy for enhanced security
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "media-src 'self' https:",
          "connect-src 'self' https://www.google-analytics.com https://api.stripe.com https://api.paypal.com",
          "frame-src 'self' https://js.stripe.com https://www.paypal.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://api.stripe.com https://www.paypal.com",
          "frame-ancestors 'none'",
          'upgrade-insecure-requests',
        ].join('; '),
      },
    ]

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Special headers for emergency appeals (faster loading)
      {
        source: '/appeals/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
      // Caching for static assets
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Redirects for better UX and SEO
  async redirects() {
    return [
      // Redirect old blog structure if migrating
      {
        source: '/blog/:slug',
        destination: '/stories/:slug',
        permanent: true,
      },
      // Emergency appeal shortcuts
      {
        source: '/emergency',
        destination: '/appeals',
        permanent: false,
      },
      {
        source: '/donate-now',
        destination: '/donate',
        permanent: false,
      },
    ]
  },

  // Rewrites for API routes and external services
  async rewrites() {
    return [
      // Proxy to external donation API to avoid CORS
      {
        source: '/api/donate/:path*',
        destination: 'https://api.stripe.com/:path*',
      },
      // Newsletter API proxy
      {
        source: '/api/newsletter/:path*',
        destination: 'https://api.convertkit.com/v3/:path*',
      },
    ]
  },

  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_EMERGENCY_ALERT_ENABLED: process.env.NEXT_PUBLIC_EMERGENCY_ALERT_ENABLED || 'false',
    NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  // Transpile packages from workspace
  transpilePackages: ['@legendary-test/ui', '@legendary-test/shared', '@minniewinnie/backend'],

  // Output configuration for deployment
  output: 'standalone',

  // Optimize bundle for better performance
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
    'lodash-es': {
      transform: 'lodash-es/{{member}}',
    },
  },

  // Webpack configuration for advanced optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize for production builds
    if (!dev) {
      // Minimize bundle size
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Separate vendor chunks for better caching
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Separate UI library chunk
        ui: {
          test: /[\\/]node_modules[\\/](@minniewinnie\/ui|@radix-ui|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 20,
        },
        // Analytics chunk for optional loading
        analytics: {
          test: /[\\/]node_modules[\\/](google-analytics|@vercel\/analytics)[\\/]/,
          name: 'analytics',
          chunks: 'all',
          priority: 15,
        },
      }
    }

    // Add support for importing SVGs as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Optimize for emergency alert system (smaller bundles)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },

  // TypeScript configuration
  typescript: {
    // Type checking is handled by separate process in CI/CD
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Lint during builds
    ignoreDuringBuilds: false,
    dirs: ['src', 'content'],
  },

  // Custom page extensions for MDX support
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // Logging configuration (Next.js 15 enhanced logging)
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Next.js 15 specific optimizations
  // Improved caching defaults - fetch() is no longer cached by default
  // Configure specific caching behavior in individual components/routes
}

export default nextConfig
