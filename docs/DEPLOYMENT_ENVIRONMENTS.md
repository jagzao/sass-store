# 🚀 Deployment Environments Guide

## Environment Strategy

### 🏗️ **3-Environment Architecture**

| Environment     | Branch    | Purpose                | Tests               | Access                 |
| --------------- | --------- | ---------------------- | ------------------- | ---------------------- |
| **Development** | `develop` | Feature development    | Unit + Integration  | Internal team          |
| **QA/Staging**  | `qa`      | Pre-production testing | Full E2E + Security | QA team + Stakeholders |
| **Production**  | `main`    | Live application       | Smoke tests only    | Public users           |

---

## 🌐 **Environment URLs**

### Development Environment

- **Frontend**: https://sass-store-dev.pages.dev
- **API**: https://sass-store-api-dev-abc123.run.app
- **Database**: Neon Dev instance
- **Redis**: Upstash Dev instance

### QA Environment

- **Frontend**: https://sass-store-qa.pages.dev
- **API**: https://sass-store-api-qa-abc123.run.app
- **Database**: Neon QA instance
- **Redis**: Upstash QA instance

### Production Environment

- **Frontend**: https://sassstore.com
- **API**: https://sass-store-api-prod-abc123.run.app
- **Database**: Neon Production instance
- **Redis**: Upstash Production instance

---

## 🔄 **Deployment Triggers**

### Automatic Deployments

- **Push to `develop`** → Deploy to Development
- **Push to `qa`** → Deploy to QA
- **Push to `main`** → Deploy to Production (manual confirmation required)

### Manual Deployments

- **Workflow Dispatch** → Manual deployment to any environment
- **Rollback** → Emergency rollback capability

---

## 🧪 **Testing Strategy per Environment**

### Development

```bash
✅ Unit tests
✅ Integration tests
✅ Basic health checks
```

### QA

```bash
✅ All Development tests
✅ E2E tests (full suite)
✅ Performance tests
✅ Security scans
✅ Cross-browser testing
```

### Production

```bash
✅ Smoke tests only
✅ Health checks
✅ Critical path validation
```

---

## 🔒 **Environment Secrets**

### Required Secrets (GitHub Repository)

```yaml
# Cloudflare
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID

# Google Cloud Platform
GCP_PROJECT_ID

# Database URLs
DEV_DATABASE_URL
QA_DATABASE_URL
PRODUCTION_DATABASE_URL

# JWT Secrets
DEV_JWT_SECRET
QA_JWT_SECRET
PRODUCTION_JWT_SECRET

# Redis URLs
DEV_REDIS_URL
QA_REDIS_URL
PRODUCTION_REDIS_URL

# Test Keys
PRODUCTION_TEST_API_KEY
```

---

## 📊 **Environment Monitoring**

### Health Endpoints

- **Dev**: https://sass-store-dev.pages.dev/api/health
- **QA**: https://sass-store-qa.pages.dev/api/health
- **Prod**: https://sassstore.com/api/health

### Metrics Endpoints

- **Dev**: https://sass-store-dev.pages.dev/api/metrics
- **QA**: https://sass-store-qa.pages.dev/api/metrics
- **Prod**: https://sassstore.com/api/metrics

---

## 🚨 **Rollback Strategy**

### Automatic Rollback Triggers

- Health check failures post-deployment
- Critical test failures
- Performance degradation

### Manual Rollback

1. Go to GitHub Actions → "Rollback Deployment"
2. Select environment and target commit
3. Confirm rollback execution

---

## 💰 **Cost Monitoring per Environment**

### Budget Limits

- **Development**: $2/month
- **QA**: $3/month
- **Production**: $5/month

### Cost Tracking

- Cloudflare Pages: Bandwidth + requests
- Cloud Run: CPU + memory usage
- Neon: Database usage
- Upstash Redis: Operations + storage

---

## 🔧 **Environment Setup Commands**

### Local Development

```bash
# Start development environment
npm run dev

# Run tests locally
npm run test:unit
npm run test:integration
```

### Environment-Specific Commands

```bash
# Deploy to specific environment
npm run deploy:dev
npm run deploy:qa
npm run deploy:prod

# Check environment health
npm run health:dev
npm run health:qa
npm run health:prod
```

---

## 📋 **Pre-Deployment Checklist**

### Development Deployment

- [ ] Code reviewed
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No critical security issues

### QA Deployment

- [ ] All Development checks pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security scan clean

### Production Deployment

- [ ] All QA checks pass
- [ ] Stakeholder approval obtained
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## 🚨 **Emergency Procedures**

### Critical Issues

1. **Immediate**: Trigger rollback workflow
2. **Investigation**: Check logs and metrics
3. **Communication**: Notify stakeholders
4. **Resolution**: Deploy hotfix or rollback

### Contact Information

- **DevOps**: devops@sassstore.com
- **Security**: security@sassstore.com
- **QA**: qa@sassstore.com

---

## 📊 **Success Metrics**

### Deployment Success Rate

- **Target**: >99% successful deployments
- **Current**: Track via GitHub Actions

### Time to Deploy

- **Development**: <5 minutes
- **QA**: <15 minutes
- **Production**: <30 minutes

### Rollback Time

- **Target**: <10 minutes
- **Current**: Track via rollback workflows
