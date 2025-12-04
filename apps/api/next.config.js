/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking during build - Vercel runs it separately
  typescript: {
    ignoreBuildErrors: true,
  },
  // Server-side packages that should not be bundled (moved from experimental)
  serverExternalPackages: [
    "@sass-store/database",
    "@apollo/server",
    "@as-integrations/next",
    "graphql",
    "graphql-tag",
  ],
};

module.exports = nextConfig;
