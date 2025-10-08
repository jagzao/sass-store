const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15: serverComponentsExternalPackages moved to top level
  serverExternalPackages: ["@sass-store/database"],

  // Force dynamic rendering to prevent useContext build errors
  output: "standalone",
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // Increased cache time
    pagesBufferLength: 5, // More pages cached
  },
  // Performance optimizations (swcMinify removed in Next.js 15 - now default)
  compress: true,
  poweredByHeader: false,
  images: {
    domains: [
      "media.sassstore.com",
      "placeholder.zo.dev",
      "sassstore.com",
      "*.sassstore.com",
      "localhost",
      "images.unsplash.com",
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [150, 400, 1200], // thumb, card, hd
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com https://*.google.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
  // Support for custom domains
  async redirects() {
    return [
      // Redirect www to non-www for main domain
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.sassstore.com",
          },
        ],
        destination: "https://sassstore.com/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
