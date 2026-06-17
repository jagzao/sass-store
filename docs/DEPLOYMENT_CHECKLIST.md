# 🚀 Deployment Checklist para Producción

## Pre-Deployment Checks

### 1. Code Quality

- [x] ESLint configurado con reglas de producción
- [x] No console.log en código de producción (usar logger)
- [ ] TypeScript sin errores
- [ ] Tests pasando (unit + integration + e2e)
- [ ] Code review completo

### 2. Environment Variables

Configurar en Cloudflare Pages/Workers:

```bash
# Database
DATABASE_URL=postgresql://user:pass@neon.tech/sassstore?sslmode=require

# Redis Cache
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Auth
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://sassstore.com

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=xxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxx
CLOUDFLARE_R2_BUCKET_NAME=sass-store-media
CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@sassstore.com

# Domain
NEXT_PUBLIC_DOMAIN=sassstore.com
NEXT_PUBLIC_TENANT_DOMAIN_PATTERN=*.sassstore.com

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=GA-xxx
```

### 3. Database Setup

```bash
# 1. Create Neon Database (free tier)
https://console.neon.tech

# 2. Copy DATABASE_URL from Neon dashboard

# 3. Run migrations
npm run db:push

# 4. Seed initial data (tenants, admin users)
npm run db:seed

# 5. Verify RLS policies
npm run rls:test
```

### 4. Security Audit

```bash
# Check for vulnerabilities
npm audit --audit-level=high

# Fix auto-fixable issues
npm audit fix

# Check dependencies
npm run security:check-deps

# Test RLS isolation
npm run test:security
```

### 5. Performance Optimization

```bash
# Build for production
CF_PAGES=1 npm run build

# Analyze bundle size
npm run analyze

# Run Lighthouse audit
npm run perf:analyze

# Test Core Web Vitals
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
```

### 6. Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Security tests
npm run test:security

# Coverage (target: >80%)
npm run test:coverage
```

## Deployment Steps

### Option 1: Cloudflare Pages (Recommended - $0/mes)

#### A. Frontend (Next.js Static Export)

```bash
# 1. Build
CF_PAGES=1 npm run build

# 2. Deploy
wrangler pages deploy apps/web/out --project-name=sass-store

# 3. Configure custom domain
# En Cloudflare Dashboard: Pages > sass-store > Custom domains
# Agregar: sassstore.com y *.sassstore.com
```

#### B. API (Cloudflare Workers)

```bash
# 1. Migrate API routes to Workers
# Crear workers/ directory con cada endpoint

# 2. Deploy workers
wrangler deploy workers/api/products.ts
wrangler deploy workers/api/orders.ts
# ... etc

# 3. Configure routes en wrangler.toml
```

### Option 2: Vercel (Más simple, $0/mes)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Configure environment variables
vercel env add DATABASE_URL production
# ... agregar todas las variables
```

## Post-Deployment

### 1. Smoke Tests

```bash
# Health check
curl https://sassstore.com/api/health

# Test tenant resolution
curl -H "X-Tenant: wondernails" https://sassstore.com/api/v1/products

# Test authentication
curl -X POST https://sassstore.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wondernails.com","password":"xxx"}'

# Test payments
# Stripe test mode primero, luego live mode
```

### 2. Monitoring Setup

#### A. Cloudflare Analytics (Gratis)

- Dashboard: analytics.cloudflare.com
- Métricas: requests/s, latency, errors
- Alertas para >90% de recursos

#### B. Neon Database (Gratis)

- Dashboard: console.neon.tech
- Monitorear compute hours (<192h/mes)
- Alertas en 80% de uso

#### C. Upstash Redis (Gratis)

- Dashboard: console.upstash.com
- Monitorear commands (<10K/día)
- Alertas en 80% de uso

#### D. Logs (Opcional - Gratis tiers)

- Sentry para error tracking
- LogRocket para session replay
- Posthog para analytics

### 3. DNS Configuration

```bash
# En Cloudflare DNS:
sassstore.com           CNAME   sass-store.pages.dev
*.sassstore.com         CNAME   sass-store.pages.dev

# Enable:
- HTTPS/SSL (Full)
- HSTS
- Auto minify (JS, CSS, HTML)
- Brotli compression
- HTTP/2
```

### 4. CDN & Caching

```http
# Cache headers (en next.config.js o Workers)
Cache-Control: public, max-age=3600, s-maxage=86400  # Static assets
Cache-Control: private, max-age=300                   # User data
Cache-Control: no-store                               # Sensitive data
```

### 5. Backup Strategy

```bash
# Database backups
# Neon: Point-in-time recovery automático (últimas 7 días)

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Automated backups (GitHub Actions)
# Ver .github/workflows/backup.yml
```

## Cost Monitoring

### Free Tier Limits

| Servicio               | Límite Mensual   | Monitorear      |
| ---------------------- | ---------------- | --------------- |
| **Cloudflare Pages**   | 500 builds       | Alertas en 400  |
| **Cloudflare Workers** | 100K req/día     | Alertas en 80K  |
| **Neon**               | 192h compute     | Alertas en 150h |
| **Upstash**            | 10K commands/día | Alertas en 8K   |
| **R2**                 | 10GB storage     | Alertas en 8GB  |
| **Resend**             | 100 emails/día   | Alertas en 80   |

### Alertas (Crear en Cloudflare Worker)

```typescript
// workers/cost-monitor.ts
// Ejecuta diariamente a las 00:00 UTC
export default {
  async scheduled(event, env) {
    const usage = await checkAllServices(env);

    if (usage.neon > 0.8) {
      await sendAlert("Neon at 80% - consider optimization");
    }

    if (usage.workers > 0.8) {
      await sendAlert("Workers at 80% - enable more caching");
    }

    // Enviar reporte diario
    await sendDailyReport(usage);
  },
};
```

## Rollback Plan

### Si algo sale mal:

```bash
# 1. Revertir a versión anterior
wrangler pages deployment list --project=sass-store
wrangler pages deployment rollback <deployment-id>

# 2. Restaurar database
psql $DATABASE_URL < backup-YYYYMMDD.sql

# 3. Verificar health
curl https://sassstore.com/api/health

# 4. Notificar usuarios
# Email a través de Resend
```

## Success Metrics

### Technical

- [ ] Uptime > 99.9%
- [ ] Response time < 200ms (p95)
- [ ] Error rate < 0.1%
- [ ] Lighthouse score > 90
- [ ] Test coverage > 80%

### Business

- [ ] Onboarding de 3-5 tenants iniciales
- [ ] 100+ usuarios activos/mes
- [ ] Costos < $5/mes
- [ ] NPS > 50

## Support & Troubleshooting

### Common Issues

**1. Database connection timeouts**

```bash
# Check Neon status
curl https://status.neon.tech

# Increase connection pool
DATABASE_POOL_MAX=10
```

**2. Build failures**

```bash
# Clear Next.js cache
rm -rf .next apps/web/.next

# Clear node_modules
rm -rf node_modules
npm install
```

**3. Rate limiting**

```bash
# Increase Upstash limits or implement request coalescing
# Aggregate multiple requests into batches
```

### Emergency Contacts

- **Cloudflare Status**: https://www.cloudflarestatus.com
- **Neon Status**: https://status.neon.tech
- **Upstash Status**: https://status.upstash.com

## Next Steps

1. Monitor metrics diariamente (primera semana)
2. Ajustar caching según patrones de uso
3. Optimizar queries lentas (usar Neon Query Stats)
4. Escalar horizontalmente si es necesario
5. Implementar CI/CD completo con GitHub Actions

---

**Última actualización**: 2025-11-18
**Versión**: 1.0
**Mantenedor**: Equipo Sass Store
