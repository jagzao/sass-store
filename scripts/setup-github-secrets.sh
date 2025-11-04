# GitHub Secrets Setup
# Run these commands to configure GitHub repository secrets:

gh secret set DEV_JWT_SECRET --body "mX72yH/ZDHPo/Ox6oejphr+BcqvLg80HRqMc+Zm+fCE="
gh secret set QA_JWT_SECRET --body "UQFHQm2g6fdTikjWptY5QgD1p7F3XcOSR+2gggkXBqM="
gh secret set PRODUCTION_JWT_SECRET --body "IX+drN1eqxKjqeYeg/55SRRAPk2RSZ48/40H8i4nZlw="
gh secret set DEV_DATABASE_URL --body "postgresql://dev_user:dev_pass@dev-db.neon.tech:5432/sass_store_dev"
gh secret set QA_DATABASE_URL --body "postgresql://qa_user:qa_pass@qa-db.neon.tech:5432/sass_store_qa"
gh secret set PRODUCTION_DATABASE_URL --body "postgresql://prod_user:prod_pass@prod-db.neon.tech:5432/sass_store_prod"
gh secret set DEV_REDIS_URL --body "redis://dev-redis.upstash.io:6379"
gh secret set QA_REDIS_URL --body "redis://qa-redis.upstash.io:6379"
gh secret set PRODUCTION_REDIS_URL --body "redis://prod-redis.upstash.io:6379"
gh secret set PRODUCTION_TEST_API_KEY --body "80111a552fa4b2f09f97290f251b5985"
gh secret set CLOUDFLARE_API_TOKEN --body "your_cloudflare_api_token_here"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your_cloudflare_account_id_here"
gh secret set GCP_PROJECT_ID --body "your-gcp-project-id"

# Manual setup required:
# 1. Cloudflare API Token: https://dash.cloudflare.com/profile/api-tokens
# 2. Google OAuth: https://console.cloud.google.com/
# 3. Neon Databases: https://neon.tech/
# 4. Upstash Redis: https://upstash.com/
# 5. GCP Project: https://console.cloud.google.com/

echo "🎉 GitHub secrets configured!"
