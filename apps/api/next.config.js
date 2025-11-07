/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side packages that should not be bundled by Turbopack
  serverExternalPackages: [
    "@sass-store/database",
    "@apollo/server",
    "@as-integrations/next",
    "@yaacovcr/transform",
    "graphql",
    "graphql-tag",
  ],

  // Empty turbopack config to silence warning and use default Turbopack behavior
  turbopack: {},
};

module.exports = nextConfig;
