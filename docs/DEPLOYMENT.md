# 🚀 Deployment Guide - Cloudflare Pages (Cost: $0/month)

## Stack de Servicios GRATUITOS

### ✅ Servicios Confirmados (Free Tier)

1. **Cloudflare Pages** (Frontend Hosting)
   - ✅ **Costo: $0/month**
   - 500 builds/month
   - Unlimited bandwidth
   - Unlimited requests
   - Custom domains
   - Built-in DDoS protection

2. **Neon PostgreSQL** (Database)
   - ✅ **Costo: $0/month**
   - 3 GB storage
   - 1 project
   - Compute: 191.9 hours/month (always-on equivalent)
   - Autoscaling & scale-to-zero
   - **Límite**: ~192 horas de compute/mes

3. **Upstash Redis** (Cache/Session)
   - ✅ **Costo: $0/month**
   - 10,000 commands/day
   - 256 MB storage
   - Global replication
   - **Límite**: 300K commands/mes (~10K/día)

4. **Cloudflare Workers** (Cost Monitor)
   - ✅ **Costo: $0/month**
   - 100,000 requests/day
   - 10ms CPU time per request
   - **Límite**: 3M requests/mes

### 📊 Cálculo de Costos Proyectados

```
Cloudflare Pages:    $0.00/mes  (unlimited en free tier)
Neon PostgreSQL:     $0.00/mes  (dentro de 192h compute)
Upstash Redis:       $0.00/mes  (< 300K commands/mes)
Cloudflare Workers:  $0.00/mes  (< 100K requests/día)
------------------------
TOTAL:               $0.00/mes  ✅
```

### ⚠️ Límites a Monitorear

1. **Neon Compute Hours**: 192h/mes
   - Con scale-to-zero, solo consume cuando hay queries
   - Un sitio pequeño usa ~20-50h/mes
   - **Acción**: Implementar autosuspend después de 5 min inactividad

2. **Upstash Commands**: 300K/mes
   - Cache hits/misses
   - Session storage
   - **Acción**: Usar TTL agresivo (5-15 min)

3. **Cloudflare Pages Builds**: 500/mes
   - ~16 builds/día
   - **Acción**: Usar branch previews solo en staging

## 🔧 Configuración de Deployment

### Paso 1: Preparar Neon Database

```bash
# 1. Crear cuenta en Neon.tech (gratis)
# 2. Crear proyecto "sass-store"
# 3. Obtener connection string

# 4. Configurar autosuspend
# En Neon Dashboard:
# Settings → Compute → Auto-suspend delay: 5 minutes

# 5. Push schema
DATABASE_URL="postgresql://..." npm run db:push
```

### Paso 2: Configurar Upstash Redis

```bash
# 1. Crear cuenta en Upstash.com (gratis)
# 2. Crear database Redis
# 3. Obtener UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN
```

### Paso 3: Deploy en Cloudflare Pages

```bash
# 1. Instalar Wrangler CLI
npm install -g wrangler

# 2. Login a Cloudflare
wrangler login

# 3. Crear proyecto Pages
wrangler pages project create sass-store

# 4. Configure variables de entorno en Cloudflare Dashboard:
# - DATABASE_URL
# - UPSTASH_REDIS_REST_URL
# - UPSTASH_REDIS_REST_TOKEN
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL

# 5. Deploy
npm run build
wrangler pages deploy apps/web/.next
```

### Configuración en Cloudflare Dashboard

```
Project Settings → Environment Variables:

Production:
- DATABASE_URL: postgresql://user:pass@...neon.tech/sass_store
- UPSTASH_REDIS_REST_URL: https://...upstash.io
- UPSTASH_REDIS_REST_TOKEN: AX...
- NEXTAUTH_SECRET: (generar con: openssl rand -base64 32)
- NEXTAUTH_URL: https://sass-store.pages.dev
- NODE_ENV: production
```

## 📝 Build Configuration

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Para Cloudflare Pages

  // ... resto de configuración
};
```

### package.json

```json
{
  "scripts": {
    "build": "next build",
    "deploy": "npm run build && wrangler pages deploy apps/web/.next",
    "deploy:production": "npm run build && wrangler pages deploy apps/web/.next --branch=main"
  }
}
```

## 🎯 Optimizaciones para Coste 0

### 1. Database: Reducir Compute Hours

```typescript
// packages/database/connection.ts
export const db = drizzle(
  postgres(DATABASE_URL, {
    max: 1, // Solo 1 conexión concurrente
    idle_timeout: 20, // Cerrar después de 20s
    connect_timeout: 10,
  }),
);
```

### 2. Redis: Reducir Commands

```typescript
// lib/cache/redis.ts
const DEFAULT_TTL = 300; // 5 minutos (antes era 3600)

// Agregar cache local en memoria para requests frecuentes
const memoryCache = new Map();
```

### 3. Edge Functions: Maximizar Cache

```typescript
// app/api/*/route.ts
export const runtime = "edge"; // Usar Edge Runtime cuando posible
export const revalidate = 3600; // Cache de 1 hora
```

## 📊 Monitoreo de Costos

### Cost Monitor Worker (Cloudflare)

```bash
# Deploy cost monitor
cd cloudflare
wrangler deploy

# Configurar secrets
wrangler secret put DATABASE_URL
wrangler secret put SLACK_WEBHOOK_URL
```

El worker se ejecuta diariamente y envía alertas cuando:

- ✅ Neon compute > 150 horas (78% del límite)
- ✅ Upstash commands > 250K (83% del límite)
- ✅ Cloudflare requests > 80K/día (80% del límite)

## 🚨 Plan de Contingencia

### Si Se Exceden Límites Gratuitos

**Opción 1: Neon Compute Agotado**

```bash
# Reducir autosuspend delay a 1 minuto
# Implementar aggressive connection pooling
# Migrar a Neon Postgres con mayor free tier (si disponible)
```

**Opción 2: Upstash Commands Excedidos**

```bash
# Reducir TTL a 2 minutos
# Implementar memory cache agresivo
# Cambiar a Cloudflare KV (también gratis, 100K reads/día)
```

**Opción 3: Cloudflare Pages Builds**

```bash
# Reducir deployments automáticos
# Solo deploy en main branch
# Usar previews manuales
```

## ✅ Checklist Pre-Deployment

- [ ] Neon database creada y schema pushed
- [ ] Upstash Redis configurado
- [ ] Variables de entorno configuradas en Cloudflare
- [ ] Build exitoso localmente (`npm run build`)
- [ ] Tests pasando (`npm test`)
- [ ] Cost monitor configurado
- [ ] Autosuspend configurado en Neon (5 min)
- [ ] Custom domain configurado (opcional)

## 🎉 Post-Deployment

### Verificar Deployment

```bash
# 1. Check health
curl https://sass-store.pages.dev/api/health

# 2. Monitor logs
wrangler pages deployment tail

# 3. Check database connection
# Navegar a: https://sass-store.pages.dev/t/zo-system

# 4. Verificar Redis
# Check en Upstash dashboard: Commands/day
```

### Configurar Custom Domain (Opcional)

```bash
# En Cloudflare Pages Dashboard:
# Custom Domains → Add domain → sass-store.com
# Cloudflare DNS se configura automáticamente
```

## 📈 Escalado Futuro

Si el proyecto crece y se necesita más recursos:

**Opción A: Mantenerse en Free Tier**

- Optimizar queries (indexes, caching)
- Implementar CDN agresivo
- Lazy loading de features

**Opción B: Escalar con Pago Mínimo ($5-10/mes)**

- Neon Pro: $19/mes → 750 horas compute
- Upstash Pro: $10/mes → 1M commands
- **Estimado**: ~$30/mes para 10K usuarios activos

## 🔒 Seguridad en Production

- ✅ HTTPS automático (Cloudflare)
- ✅ DDoS protection (Cloudflare)
- ✅ WAF rules (Cloudflare - free tier)
- ✅ RLS policies (PostgreSQL)
- ✅ Secrets management (Wrangler secrets)
- ✅ CSP headers (next.config.js)

---

**RESUMEN**: ✅ Deployment 100% GRATUITO confirmado con:

- Cloudflare Pages (frontend)
- Neon PostgreSQL (database)
- Upstash Redis (cache)
- Cloudflare Workers (monitoring)

**Costo total mensual**: $0.00 🎉
