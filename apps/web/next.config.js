/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 configuration
  experimental: {
    // Enable Partial Prerendering (PPR) for better performance
    ppr: true,
    // Enable Turbopack for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Basic configuration for development
  serverExternalPackages: ["@sass-store/database"],

  // Simple image configuration
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
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Basic headers for development
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;