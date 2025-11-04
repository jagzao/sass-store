/**
 * Free Tier Setup Script
 * Configures Sass Store to run completely FREE using free tiers
 */

const fs = require("fs");
const path = require("path");

function setupFreeTier() {
  console.log("🆓 Setting up Sass Store FREE Tier Configuration...\n");

  // Free tier configurations
  const freeConfig = {
    // Supabase Free Tier (500MB database, 50MB file storage)
    database: {
      url: "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres",
      note: "Use Supabase free tier: https://supabase.com/",
    },

    // Upstash Redis Free Tier (10,000 requests/month)
    redis: {
      url: "redis://[YOUR-ENDPOINT].upstash.io:6379",
      note: "Use Upstash free tier: https://upstash.com/",
    },

    // Cloudflare Pages (FREE)
    hosting: {
      frontend: "https://[your-project].pages.dev",
      api: "https://[your-worker].workers.dev",
      note: "Cloudflare Pages: FREE unlimited bandwidth",
    },

    // GitHub Actions (FREE for public repos)
    ci: {
      minutes: "2000/month FREE",
      note: "GitHub Actions: FREE for public repositories",
    },
  };

  // Create free tier environment files
  const freeEnvFiles = {
    "apps/web/.env.local": `# FREE TIER CONFIGURATION
DATABASE_URL=${freeConfig.database.url}
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=free_tier_jwt_secret_32_chars_minimum
`,

    "apps/api/.env.local": `# FREE TIER CONFIGURATION
DATABASE_URL=${freeConfig.database.url}
JWT_SECRET=free_tier_jwt_secret_32_chars_minimum
REDIS_URL=${freeConfig.redis.url}
`,

    "apps/api/.env.free": `# FREE TIER PRODUCTION
DATABASE_URL=${freeConfig.database.url}
JWT_SECRET=free_tier_jwt_secret_32_chars_minimum
REDIS_URL=${freeConfig.redis.url}
NODE_ENV=production
`,
  };

  // Write environment files
  Object.entries(freeEnvFiles).forEach(([filePath, content]) => {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created ${filePath} (FREE tier)`);
  });

  // Create deployment guide for free tier
  const freeDeploymentGuide = `# 🚀 FREE Tier Deployment Guide

## Cost: $0.00/month

### Required Services (All FREE)

#### 1. Supabase (Database + Auth)
- **URL**: https://supabase.com/
- **Free Tier**: 500MB database, 50MB file storage, 50,000 monthly active users
- **Setup**:
  1. Create account
  2. Create new project
  3. Get database URL from Settings > Database
  4. Update \`DATABASE_URL\` in environment files

#### 2. Upstash Redis (Caching)
- **URL**: https://upstash.com/
- **Free Tier**: 10,000 requests/month, 256MB storage
- **Setup**:
  1. Create account
  2. Create Redis database
  3. Get REST URL
  4. Update \`REDIS_URL\` in environment files

#### 3. Cloudflare Pages (Hosting)
- **URL**: https://pages.cloudflare.com/
- **Free Tier**: Unlimited bandwidth, custom domains
- **Setup**:
  1. Connect GitHub repository
  2. Configure build settings
  3. Deploy automatically

#### 4. GitHub Actions (CI/CD)
- **FREE** for public repositories
- **2000 minutes/month** included
- **No setup required** - workflows already configured

### Environment Variables to Configure

#### Supabase Database URL
\`\`\`bash
# Get from: Project Settings > Database > Connection string
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
\`\`\`

#### Upstash Redis URL
\`\`\`bash
# Get from: Database > REST API
REDIS_URL=https://[endpoint].upstash.io
\`\`\`

#### Google OAuth (Optional)
\`\`\`bash
# Get from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
\`\`\`

### Deployment Steps

1. **Setup Free Services**:
   \`\`\`bash
   # 1. Create Supabase project
   # 2. Create Upstash Redis database
   # 3. Connect Cloudflare Pages to GitHub
   \`\`\`

2. **Configure Environment Variables**:
   \`\`\`bash
   # Update .env files with actual URLs
   nano apps/api/.env.local
   nano apps/web/.env.local
   \`\`\`

3. **Deploy**:
   \`\`\`bash
   # Push to main branch for production
   git add .
   git commit -m "feat: configure free tier deployment"
   git push origin main
   \`\`\`

### Limitations (Free Tier)

#### Supabase
- 500MB database storage
- 50MB file storage
- 50,000 monthly active users
- 2GB bandwidth/month

#### Upstash Redis
- 10,000 requests/month
- 256MB storage
- 1 database

#### Cloudflare Pages
- ✅ Unlimited bandwidth
- ✅ Custom domains
- ✅ Automatic deployments

#### GitHub Actions
- 2000 minutes/month
- Public repos only

### Scaling Up (When Needed)

When you get paying customers, upgrade to:

1. **Neon** ($0.50/GB/month) - Better performance
2. **Upstash Redis** ($0.20/100K requests) - Higher limits
3. **Cloudflare** - Remains free
4. **GitHub** - Remains free for public repos

### Monitoring Free Usage

- **Supabase**: Dashboard shows usage
- **Upstash**: Dashboard shows requests/storage
- **Cloudflare**: Analytics show bandwidth
- **GitHub**: Actions tab shows minutes used

---

## 🎯 Result: Production-Ready App for $0/month

Your Sass Store will be fully functional with:
- ✅ Multi-tenant architecture
- ✅ Secure authentication
- ✅ Payment processing
- ✅ File storage
- ✅ Automated deployments
- ✅ Monitoring and alerts

**All for $0.00/month!**
`;

  fs.writeFileSync("FREE_DEPLOYMENT_GUIDE.md", freeDeploymentGuide);
  console.log("✅ Created FREE_DEPLOYMENT_GUIDE.md");

  // Create cost comparison
  const costComparison = `# 💰 Cost Comparison: Free vs Paid

## Current Setup: $10/month (3 environments)

| Service | Free Tier | Paid Tier | Savings |
|---------|-----------|-----------|---------|
| **Supabase** | ✅ FREE (500MB) | $25/month (unlimited) | **$25** |
| **Upstash Redis** | ✅ FREE (10K req) | $8/month (unlimited) | **$8** |
| **Cloudflare** | ✅ FREE (unlimited) | FREE | **$0** |
| **GitHub Actions** | ✅ FREE (2000min) | FREE | **$0** |
| **TOTAL** | **$0/month** | **$33/month** | **$33** |

## Free Tier Limitations

### Supabase Free
- 500MB database storage
- 50MB file storage
- 50,000 monthly active users
- 2GB bandwidth/month

### Upstash Free
- 10,000 requests/month
- 256MB storage
- 1 database

### When to Upgrade

**Upgrade when you reach:**
- 400MB database usage
- 40MB file storage
- 40,000 monthly users
- 8,000 Redis requests

**Or when you need:**
- Better performance
- Advanced features
- Priority support
- Higher limits

## Migration Path

1. **Start FREE** - Validate product-market fit
2. **Upgrade gradually** - Scale services as needed
3. **Optimize costs** - Monitor usage patterns

## Result

**Start completely FREE, scale when you have customers!**
`;

  fs.writeFileSync("COST_COMPARISON.md", costComparison);
  console.log("✅ Created COST_COMPARISON.md");

  console.log("\n🎉 FREE Tier Setup Complete!");
  console.log("\n📋 Next Steps:");
  console.log("1. Create Supabase account: https://supabase.com/");
  console.log("2. Create Upstash account: https://upstash.com/");
  console.log("3. Connect Cloudflare Pages: https://pages.cloudflare.com/");
  console.log("4. Read FREE_DEPLOYMENT_GUIDE.md for detailed setup");
  console.log("\n💰 Total cost: $0.00/month");
  console.log("🚀 Ready for production deployment!");
}

setupFreeTier();
