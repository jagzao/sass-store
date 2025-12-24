const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel compatibility - no special output configuration needed

  // Monorepo support - tell Next.js where the root is
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Skip linting and typecheck during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpile internal monorepo packages (excluding database - it's external)
  transpilePackages: [
    "@sass-store/core",
    "@sass-store/ui",
    "@sass-store/config",
    "@sass-store/validation"
  ],

  // Database has native dependencies, keep it external (don't bundle it)
  serverExternalPackages: ["@sass-store/database"],

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
    formats: ["image/avif", "image/webp"],
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
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com https://upstash.io https://*.upstash.io https://api.mercadopago.com",
              "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Rewrites removed - Web app uses internal /api endpoints (no proxy needed)
  // See ARCHITECTURE_HISTORY.md for details
};

module.exports = nextConfig;