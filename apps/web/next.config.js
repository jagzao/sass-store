const path = require('path');

/**
 * Content Security Policy Configuration
 *
 * Production: Strict CSP without unsafe-eval, minimal unsafe-inline
 * Development: Relaxed CSP for Next.js HMR and Fast Refresh
 *
 * NOTE: MercadoPago requires 'unsafe-inline' in script-src for embedded checkout
 * See: https://www.mercadopago.com/developers
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
      // MercadoPago SDK
      'https://sdk.mercadopago.com',
      'https://secure.mlstatic.com',
      // Cloudflare Turnstile - CAPTCHA alternative
      'https://challenges.cloudflare.com',
    ],
    'style-src': [
      "'self'",
      // Next.js requires inline styles for CSS-in-JS
      "'unsafe-inline'",
      // Allow Google Fonts stylesheets used by tenant themes
      'https://fonts.googleapis.com',
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
      // Allow Google Fonts files used by tenant themes
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      // Upstash Redis
      'https://upstash.io',
      'https://*.upstash.io',
      // MercadoPago API
      'https://api.mercadopago.com',
      'https://www.mercadopago.com',
    ],
    'frame-src': [
      "'self'",
      // MercadoPago checkout
      'https://www.mercadopago.com',
      'https://sdk.mercadopago.com',
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
    // STRY-021 SEC-010: MercadoPago SDK v1 requiere 'unsafe-inline'.
    // Se mitiga con 'strict-dynamic': en Chrome/FF/Safari modernos, strict-dynamic
    // hace que unsafe-inline sea ignorado para scripts dinámicos, reduciendo
    // la superficie XSS real sin romper el checkout de MP.
    // TODO STRY-022: Implementar nonce completo al migrar a MP SDK v2.
    directives['script-src'].push(
      "'unsafe-inline'",    // Requerido por MercadoPago SDK v1
      "'strict-dynamic'",   // Mitiga unsafe-inline en navegadores modernos
    );
    // Upgrade insecure requests solo en producción
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
        'payment=()', // Disable Payment Request API - we use MercadoPago directly
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

  // Use OS trust store for Turbopack network fetches (e.g. next/font/google)
  // This avoids TLS handshake failures in restricted Windows environments.
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },

  // TypeScript — build strict (no ignoreBuildErrors)
  typescript: {
    // ignoreBuildErrors eliminado en STRY-019 — build ahora es estricto
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
