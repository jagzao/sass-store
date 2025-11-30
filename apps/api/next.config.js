/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Server-side packages that should not be bundled
    serverComponentsExternalPackages: [
      "@sass-store/database",
      "@apollo/server",
      "@as-integrations/next",
      "graphql",
      "graphql-tag",
    ],
  },
};

module.exports = nextConfig;
