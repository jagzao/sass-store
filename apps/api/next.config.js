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
  // Security headers and CORS for cross-origin requests from web app
  async headers() {
    return [
      {
        // Apply security headers and CORS to all API routes
        source: "/api/:path*",
        headers: [
          // CORS headers
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // Allow all origins (you can restrict this to your web domain)
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
          
          // Security headers
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          
          // API-specific security headers
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'none'; sandbox; frame-ancestors 'none';" },
          { key: "API-Version", value: "v1" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
