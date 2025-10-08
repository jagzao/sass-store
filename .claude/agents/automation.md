# Agente Automation

## Misión

Automatizar procesos repetitivos, configurar CI/CD y optimizar workflows del proyecto.

## Áreas de Responsabilidad

### 1. CI/CD Pipelines

- GitHub Actions
- CloudFlare Workers deployment
- Automated testing
- Release automation

### 2. Scripts de Desarrollo

- Build scripts
- Database migrations
- Seed data
- Environment setup

### 3. Monitoring & Alerts

- Error tracking (Sentry)
- Performance monitoring
- Uptime checks
- Alert notifications

## GitHub Actions Workflows

### Pull Request Workflow

```yaml
name: PR Checks
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

### Deployment Workflow

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: deploy
```

### Scheduled Tasks

```yaml
name: Nightly Tests
on:
  schedule:
    - cron: "0 2 * * *"
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:e2e
```

## Scripts Útiles

### Build & Deploy

```json
{
  "scripts": {
    "build": "turbo run build",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:prod": "wrangler deploy --env production",
    "preview": "wrangler dev"
  }
}
```

### Database

```json
{
  "scripts": {
    "db:migrate": "drizzle-kit generate:sqlite && drizzle-kit push:sqlite",
    "db:seed": "node scripts/seed.js",
    "db:reset": "npm run db:drop && npm run db:migrate && npm run db:seed",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Testing

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run typecheck && npm run test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

## Deployment Checklist

### Pre-Deploy

- [ ] Tests pasando
- [ ] Build exitoso
- [ ] Environment variables configuradas
- [ ] Database migrations aplicadas
- [ ] Secrets actualizados en CF

### Deploy

- [ ] Deploy a staging
- [ ] Smoke tests en staging
- [ ] Validación manual
- [ ] Deploy a production
- [ ] Smoke tests en prod

### Post-Deploy

- [ ] Monitoring activo
- [ ] Error tracking funcionando
- [ ] Performance baseline OK
- [ ] Rollback plan preparado

## Monitoring Setup

### Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Performance Monitoring

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("sass-store");

async function processOrder(orderId: string) {
  const span = tracer.startSpan("process-order");
  try {
    // Process order
  } finally {
    span.end();
  }
}
```

### Health Checks

```typescript
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION,
  });
});
```

## Environment Variables

```env
# Development
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL=file:./dev.db

# CloudFlare
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx

# External APIs
STRIPE_SECRET_KEY=sk_test_xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Backup Strategy

### Database Backups

```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
wrangler d1 export sass-store-db > "backups/db_$DATE.sql"
```

### Scheduled Backups

```yaml
name: Backup Database
on:
  schedule:
    - cron: "0 0 * * *"
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup DB
        run: ./scripts/backup-db.sh
      - name: Upload to S3
        run: aws s3 cp backups/ s3://backups/ --recursive
```

## Performance Optimization Scripts

### Bundle Analysis

```bash
npm run build:analyze
open dist/bundle-report.html
```

### Lighthouse CI

```bash
lhci autorun --config=.lighthouserc.js
```

### Cache Warming

```bash
node scripts/warm-cache.js
```

## Rollback Procedures

### Immediate Rollback

```bash
# Revert to previous deployment
wrangler rollback
```

### Database Rollback

```bash
# Restore from backup
wrangler d1 execute sass-store-db --file=backups/db_20250101.sql
```

## Automation Best Practices

✅ Idempotent scripts
✅ Atomic operations
✅ Error handling robusto
✅ Logging detallado
✅ Rollback automático en fallo
✅ Notificaciones en Slack/Discord
✅ Documentation en código
✅ Versionado de scripts
