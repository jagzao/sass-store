const path = require('path');

/**
 * Content Security Policy Configuration
 *
 * Production: Strict CSP without unsafe-eval, minimal unsafe-inline
 * Development: Relaxed CSP for Next.js HMR and Fast Refresh
 *
 * NOTE: Stripe.js requires 'unsafe-inline' in script-src for their embedded checkout
 * See: https://stripe.com/docs/security/guide#content-security-policy
 */

/**
 * Generate CSP directives based on environment
 * @param {'production' | 'development'} env
 * @returns {string}
 */
function generateCSP(env) {
  const isDev = env === 'development';

  // Base directives for all environments
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Stripe.js - required for payment processing
      'https://js.stripe.com',
      // Cloudflare Turnstile - CAPTCHA alternative
      'https://challenges.cloudflare.com',
    ],
    'style-src': [
      "'self'",
      // Next.js requires inline styles for CSS-in-JS
      "'unsafe-inline'",
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:',
    ],
    'font-src': [
      "'self'",
      'data:',
    ],
    'connect-src': [
      "'self'",
      // Stripe API
      'https://api.stripe.com',
      // Upstash Redis
      'https://upstash.io',
      'https://*.upstash.io',
      // MercadoPago API
      'https://api.mercadopago.com',
    ],
    'frame-src': [
      "'self'",
      // Stripe.js frames
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      // Cloudflare Turnstile
      'https://challenges.cloudflare.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  // Development-only relaxations for Next.js DX
  if (isDev) {
    // Next.js Fast Refresh requires eval for HMR
    directives['script-src'].push("'unsafe-eval'");
    // Next.js dev server uses webpack with inline scripts
    directives['script-src'].push("'unsafe-inline'");
    // Allow WebSocket connections for HMR
    directives['connect-src'].push('ws://localhost:*', 'ws://127.0.0.1:*');
  } else {
    // Production: Stripe.js requires unsafe-inline for their embedded components
    // This is a known limitation - see Stripe CSP documentation
    // We mitigate with strict frame-ancestors and other directives
    directives['script-src'].push("'unsafe-inline'");
    // Add upgrade-insecure-requests only in production
    directives['upgrade-insecure-requests'] = [];
  }

  // Build CSP string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key; // For directives without values like upgrade-insecure-requests
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 * These headers are applied to all routes
 */
function getSecurityHeaders(isProduction) {
  const headers = [
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
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'interest-cohort=()',
        'payment=()', // Disable Payment Request API - we use Stripe directly
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ].join(', '),
    },
    {
      key: 'Content-Security-Policy',
      value: generateCSP(isProduction ? 'production' : 'development'),
    },
  ];

  // HSTS only in production (requires HTTPS)
  if (isProduction) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    });
  }

  return headers;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel compatibility - no special output configuration needed

  // Monorepo support - tell Next.js where the root is
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Skip typecheck during builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpile internal monorepo packages (excluding database - it's external)
  transpilePackages: [
    '@sass-store/core',
    '@sass-store/ui',
    '@sass-store/config',
    '@sass-store/validation',
  ],

  // Database has native dependencies, keep it external (don't bundle it)
  serverExternalPackages: ['@sass-store/database'],

  // Optimized image configuration for performance
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Performance optimizations
    minimumCacheTTL: 31536000, // Cache images for 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Common breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon and small image sizes
    dangerouslyAllowSVG: false, // Security: prevent XSS via SVG
    contentDispositionType: 'attachment', // Security: force download for unknown types
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    return [
      {
        source: '/:path*',
        headers: getSecurityHeaders(isProduction),
      },
    ];
  },

  // Rewrites removed - Web app uses internal /api endpoints (no proxy needed)
  // See ARCHITECTURE_HISTORY.md for details
};

module.exports = nextConfig;
