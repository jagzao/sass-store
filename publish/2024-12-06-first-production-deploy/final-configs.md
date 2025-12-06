# Final Working Configuration Files

## Root vercel.json

```json
{
  "version": 2
}
```

## apps/web/vercel.json

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"]
}
```

## apps/web/package.json (scripts only)

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "prebuild": "echo 'Copying public assets for Vercel...' && mkdir -p ../../public && cp -r public/* ../../public/ || true",
    "build": "next build",
    "build:cloudflare": "next build",
    "analyze": "ANALYZE=true next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "typecheck": "echo \"Skipping typecheck for web package\""
  }
}
```

## apps/web/next.config.js (key sections)

```javascript
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANT: Don't use 'standalone' for Vercel monorepo
  output: process.env.CF_PAGES ? "export" : undefined,

  // Help Next.js trace dependencies in monorepo
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Skip linting and typecheck during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverComponentsExternalPackages: ["@sass-store/database"],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Rewrites for API
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
```

## Vercel Dashboard Settings

### sass-store-web

- **Framework**: Next.js (auto-detected)
- **Root Directory**: (empty)
- **Build Command**: `cd apps/web && npm run build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x (auto)

### sass-store-api

- **Framework**: Other
- **Root Directory**: `apps/api`
- **Build Command**: `npm run build`
- **Output Directory**: (default)
- **Install Command**: `cd ../.. && npm install`
- **Node.js Version**: 18.x (auto)

## Environment Variables Needed

### Web (.env.local or Vercel)

```bash
NEXT_PUBLIC_API_URL=https://sass-store-api.vercel.app
DATABASE_URL=postgresql://...
# Add others as needed
```

### API (.env or Vercel)

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
# Add others as needed
```
