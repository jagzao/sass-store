# Deployment Guide for SASS Store

## Overview

This guide provides instructions for deploying the SASS Store application with the latest security updates. The application has been updated to address critical Next.js security vulnerabilities (CVE-2025-55184 and CVE-2025-55183).

## Prerequisites

1. Node.js 18.0.0 or higher
2. npm or yarn package manager
3. Vercel account (for deployment)
4. Supabase account (for database)
5. Upstash Redis account (for rate limiting)
6. Cloudinary account (for media storage)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="your-supabase-connection-string"

# JWT Secret
JWT_SECRET="your-secure-jwt-secret"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secure-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# Stripe Configuration
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Redis (for rate limiting)
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"

# File Storage
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Domain Configuration
NEXT_PUBLIC_DOMAIN="your-domain.com"
NEXT_PUBLIC_TENANT_DOMAIN_PATTERN="*.your-domain.com"

# API URLs
API_URL="https://api.your-domain.com"
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
```

## Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build the application
npm run build
```

### 2. Deploy to Vercel

Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

Option B: Using Git

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### 3. Environment Variables in Vercel

Add all the environment variables from the Prerequisites section to your Vercel project settings.

### 4. Database Setup

1. Create a new project in Supabase
2. Get the connection string and add it to `DATABASE_URL`
3. Run database migrations:

```bash
npm run db:push
```

### 5. Redis Setup for Rate Limiting

1. Create a new Redis database in Upstash
2. Get the REST URL and token
3. Add them to your environment variables

### 6. Media Storage Setup

1. Create a new account in Cloudinary
2. Get your cloud name, API key, and API secret
3. Add them to your environment variables

## Post-Deployment Checks

After deployment, verify the following:

1. **Security Headers**: Check that all security headers are properly set
2. **Rate Limiting**: Verify that rate limiting is working
3. **Tenant Isolation**: Ensure that tenant data is properly isolated
4. **API Endpoints**: Check that all API endpoints are working correctly
5. **Authentication**: Verify that authentication is working
6. **Payment Processing**: Test payment processing with Stripe test keys

## Monitoring

1. Set up monitoring in Vercel
2. Configure error tracking (e.g., Sentry, LogRocket)
3. Set up alerts for high error rates or performance issues
4. Monitor database performance and usage

## Rollback Plan

If issues arise after deployment:

1. Use Vercel's rollback feature to revert to a previous deployment
2. Check error logs to identify the issue
3. Fix the issue locally and test
4. Redeploy the fixed version

## Security Considerations

1. Keep all dependencies updated
2. Regularly run security audits
3. Monitor for new vulnerabilities
4. Use strong secrets and rotate them regularly
5. Implement proper access controls

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check that all dependencies are installed
2. Verify that you're using the correct Node.js version
3. Check the build logs for specific error messages

### Runtime Errors

If you encounter runtime errors:

1. Check the server logs in Vercel
2. Verify that all environment variables are correctly set
3. Check that external services (database, Redis, etc.) are accessible

### Performance Issues

If you encounter performance issues:

1. Check Vercel analytics
2. Optimize images and assets
3. Implement caching strategies
4. Consider scaling up resources if needed
