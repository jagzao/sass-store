/** @type {import('next').NextConfig} */
const nextConfig = {
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
