/**
 * Environment Setup Script
 * Generates all necessary secrets and configurations for Dev/QA/Prod environments
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

function generateJWT() {
  return crypto.randomBytes(32).toString("base64");
}

function setupEnvironments() {
  console.log("🚀 Setting up Sass Store Environments...\n");

  // Generate secrets
  const secrets = {
    // JWT Secrets
    DEV_JWT_SECRET: generateJWT(),
    QA_JWT_SECRET: generateJWT(),
    PRODUCTION_JWT_SECRET: generateJWT(),

    // Database URLs (placeholders - user needs to configure actual databases)
    DEV_DATABASE_URL:
      "postgresql://dev_user:dev_pass@dev-db.neon.tech:5432/sass_store_dev",
    QA_DATABASE_URL:
      "postgresql://qa_user:qa_pass@qa-db.neon.tech:5432/sass_store_qa",
    PRODUCTION_DATABASE_URL:
      "postgresql://prod_user:prod_pass@prod-db.neon.tech:5432/sass_store_prod",

    // Redis URLs (placeholders - user needs to configure actual Redis instances)
    DEV_REDIS_URL: "redis://dev-redis.upstash.io:6379",
    QA_REDIS_URL: "redis://qa-redis.upstash.io:6379",
    PRODUCTION_REDIS_URL: "redis://prod-redis.upstash.io:6379",

    // Test API Key
    PRODUCTION_TEST_API_KEY: generateSecret(16),

    // Cloudflare (placeholders - user needs to configure)
    CLOUDFLARE_API_TOKEN: "your_cloudflare_api_token_here",
    CLOUDFLARE_ACCOUNT_ID: "your_cloudflare_account_id_here",

    // GCP (placeholder - user needs to configure)
    GCP_PROJECT_ID: "your-gcp-project-id",
  };

  // Create .env files for each environment
  const envFiles = {
    "apps/web/.env.local": {
      DATABASE_URL: secrets.DEV_DATABASE_URL,
      GOOGLE_CLIENT_ID: "your_google_client_id",
      GOOGLE_CLIENT_SECRET: "your_google_client_secret",
      NEXTAUTH_URL: "http://localhost:3001",
      NEXTAUTH_SECRET: secrets.DEV_JWT_SECRET,
    },
    "apps/api/.env.dev": {
      DATABASE_URL: secrets.DEV_DATABASE_URL,
      JWT_SECRET: secrets.DEV_JWT_SECRET,
      REDIS_URL: secrets.DEV_REDIS_URL,
    },
    "apps/api/.env.qa": {
      DATABASE_URL: secrets.QA_DATABASE_URL,
      JWT_SECRET: secrets.QA_JWT_SECRET,
      REDIS_URL: secrets.QA_REDIS_URL,
    },
    "apps/api/.env.prod": {
      DATABASE_URL: secrets.PRODUCTION_DATABASE_URL,
      JWT_SECRET: secrets.PRODUCTION_JWT_SECRET,
      REDIS_URL: secrets.PRODUCTION_REDIS_URL,
    },
  };

  // Write environment files
  Object.entries(envFiles).forEach(([filePath, envVars]) => {
    const content =
      Object.entries(envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n") + "\n";

    fs.writeFileSync(filePath, content);
    console.log(`✅ Created ${filePath}`);
  });

  // Generate GitHub secrets setup script
  const githubSecrets = Object.entries(secrets)
    .map(([key, value]) => `gh secret set ${key} --body "${value}"`)
    .join("\n");

  const setupScript = `# GitHub Secrets Setup
# Run these commands to configure GitHub repository secrets:

${githubSecrets}

# Manual setup required:
# 1. Cloudflare API Token: https://dash.cloudflare.com/profile/api-tokens
# 2. Google OAuth: https://console.cloud.google.com/
# 3. Neon Databases: https://neon.tech/
# 4. Upstash Redis: https://upstash.com/
# 5. GCP Project: https://console.cloud.google.com/

echo "🎉 GitHub secrets configured!"
`;

  fs.writeFileSync("scripts/setup-github-secrets.sh", setupScript);
  console.log("✅ Created scripts/setup-github-secrets.sh");

  // Generate cost estimation
  const costBreakdown = `
# 💰 Cost Estimation - Sass Store Environments

## Monthly Cost Breakdown

### Development Environment ($2.00/month)
- Neon Database (Dev): $0.50/month
- Upstash Redis (Dev): $0.50/month
- Cloudflare Pages (Dev): $0.50/month
- Cloud Run (Dev): $0.50/month

### QA Environment ($3.00/month)
- Neon Database (QA): $1.00/month
- Upstash Redis (QA): $0.75/month
- Cloudflare Pages (QA): $0.75/month
- Cloud Run (QA): $0.50/month

### Production Environment ($5.00/month)
- Neon Database (Prod): $2.00/month
- Upstash Redis (Prod): $1.00/month
- Cloudflare Pages (Prod): $1.50/month
- Cloud Run (Prod): $0.50/month

## Total Monthly Cost: $10.00

## Free Tiers Utilized
- GitHub Actions: 2000 minutes/month FREE
- Cloudflare Pages: 100GB bandwidth FREE
- Security scans: Included in GitHub

## Scaling Considerations
- Costs scale with usage
- Database costs increase with data volume
- Redis costs increase with operations
- Cloudflare costs increase with bandwidth

## Cost Monitoring
- Automatic cost checks in CI/CD
- Alerts when approaching budget limits
- Monthly cost reports available
`;

  fs.writeFileSync("COST_ESTIMATION.md", costBreakdown);
  console.log("✅ Created COST_ESTIMATION.md");

  // Summary
  console.log("\n🎉 Environment Setup Complete!");
  console.log("\n📋 Next Steps:");
  console.log("1. Configure actual database instances in Neon");
  console.log("2. Set up Redis instances in Upstash");
  console.log("3. Create Cloudflare account and get API token");
  console.log("4. Set up Google OAuth credentials");
  console.log("5. Run: chmod +x scripts/setup-github-secrets.sh");
  console.log("6. Run: ./scripts/setup-github-secrets.sh");
  console.log("\n💰 Total estimated monthly cost: $10.00");

  console.log("\n🔐 Generated Secrets Summary:");
  Object.keys(secrets).forEach((key) => {
    console.log(`   ✅ ${key}`);
  });
}

setupEnvironments();
