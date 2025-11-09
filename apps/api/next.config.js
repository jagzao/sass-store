/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side packages that should not be bundled
  serverExternalPackages: [
    "@sass-store/database",
    "@apollo/server",
    "@as-integrations/next",
    "@yaacovcr/transform",
    "graphql",
    "graphql-tag",
  ],
};

module.exports = nextConfig;
