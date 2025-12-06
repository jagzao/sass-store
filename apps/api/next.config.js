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
  // CORS headers for cross-origin requests from web app
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // Allow all origins (you can restrict this to your web domain)
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
